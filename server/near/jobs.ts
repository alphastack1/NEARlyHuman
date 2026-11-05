import {createHash,randomUUID} from 'node:crypto';
import {keccak256,toHex,type Hex} from 'viem';
import {Op,expandHistory,encodeTrace} from '../../src/domain';
import type {NearOwnerJob} from '../../src/chain/game-types';
import {storage,type DurableStore} from '../storage';
import {updateStoredRecord,paidInferenceCall,requireJobBudget,finishJobBudget,BudgetError} from '../evm/budget';
import {prepareDayCore,type RecordedDecision} from '../evm/preparation';
import {buildChoiceRequest,buildPlanRequest,decodeChoice,decodePlan,normalizeMemory,offerMindCandidates,type MindMemory,type ChoiceModelRequest} from '../evm/choices';
import {sendChoiceRequest,InferenceError,type BeforeInferenceSend} from '../evm/jev';
import {classifyPreparationFailure} from '../evm/failures';
import {EvmContextError} from '../evm/context';
import {appendChoiceProgress,publicChoiceProgress} from '../evm/progress';
import type {ChoiceProgress} from '../../src/chain/evm-types';
import {verifyNearRuntime,nearView,nearRuntime} from './rpc';
import {freezeNearInput,nearInputHash,sameNearRequest,recheckNearInput} from './context';
import {nearJobId,nearJobPrefix,nearQuoteForRequest,retireNearQuote} from './quotes';
import {nativeTxStatus,nativeTxComplete,nearRelayTransaction,retireNearRelayIntent,type NearRelayJournal} from './relay';
import {nearPacketKey,nearRequestId} from './views';
import {base58Decode} from './encoding';
import {NearError,type NearRuntime,type NearFrozenInput,type NearRequest,type NearLife,type NearDayRecord} from './types';

export interface NearJob {
  version:2;id:string;campaignId:string;input:NearFrozenInput;inputHash:Hex;memory:MindMemory;memoryHash:Hex;
  phase:NearOwnerJob['phase'];generation:number;lease?:{id:string;generation:number;until:number};
  inputs:Record<string,string>;answers:Record<string,string>;decisions:RecordedDecision[];createdAt:number;updatedAt:number;
  quoteKey:string;ownerTx?:string;packetKey?:string;commitment?:Hex;stateHash?:Hex;finalTx?:string;journal?:NearRelayJournal;
  failureCode?:string;failureStage?:string;
  nextWakeAt?:number;
  progress?:ChoiceProgress[];
}
interface Lease {id:string;generation:number}
const digest=(value:unknown):Hex=>keccak256(toHex(JSON.stringify(value)));
const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const terminal=(phase:string)=>['ready','failed','expired'].includes(phase);
class LeaseLost extends Error{}
const fence=(job:NearJob,lease:Lease)=>{if(job.lease?.id!==lease.id||job.lease.generation!==lease.generation||job.lease.until<=Date.now())throw new LeaseLost();};
export function nearJobView(job:NearJob):NearOwnerJob {
  const progress=publicChoiceProgress(job.progress);
  const message=job.failureCode==='chain_retry'?'Checking the chain again. No extra payment needed.':job.phase==='failed'?'This day could not be prepared. Your saved home is unchanged.':job.phase==='expired'?'This attempt expired. Your saved home is unchanged.':undefined;
  return {networkId:'near-testnet',requestId:job.input.requestId,tokenId:job.input.tokenId,phase:job.phase,decisions:Object.keys(job.answers).length,updatedAt:job.updatedAt,...(job.ownerTx?{ownerTx:job.ownerTx}:{}),...(job.finalTx?{finalTx:job.finalTx}:{}),...(job.commitment?{commitment:job.commitment}:{}),retrySafe:['failed','expired'].includes(job.phase),...(job.failureCode?{failureCode:job.failureCode}:{}),...(message?{failureMessage:message}:{}),...(progress?{progress}:{})};
}
async function canonicalMemory(runtime:NearRuntime,input:NearFrozenInput,name:string):Promise<MindMemory>{
  const previousDays:NonNullable<MindMemory['previousDays']>=[];
  for(let day=Math.max(1,input.day-2);day<input.day;day++){
    const record=await nearView<NearDayRecord|null>(runtime,'day_record',{token_id:input.tokenId,day},{height:input.acceptedBlock,hash:input.acceptedBlockHash,timestamp:input.acceptedAt});
    if(!record||day===input.day-1&&record.state_hash!==input.baseHash)throw new NearError('context','A prior saved NEAR day changed.');
    const trace=expandHistory(record.history);if(keccak256(encodeTrace(trace))!==record.trace_hash)throw new NearError('context','The prior NEAR action history changed.');
    previousDays.push({day,actions:trace.steps.filter(a=>![Op.QuietMain,Op.Pickup].includes(a.op)).slice(-6)});
  }
  return normalizeMemory({name,previousDays,pressureMicro:input.pressure},input.day);
}
/** A known hash is checked against the actual native sender, receiver and action.
 * Hashless wallet callbacks recover from the canonical funded request instead. */
async function checkOwnerTransaction(runtime:NearRuntime,hash:string,player:string,q:NearRequest){
  base58Decode(hash,32);const outcome=await nativeTxStatus(runtime,hash,player),tx=outcome.transaction;
  if(!nativeTxComplete(outcome))throw new NearError('connection','The original NEAR payment is still confirming.',503,true);
  if(!(typeof outcome.status==='object'&&outcome.status!==null&&'SuccessValue'in outcome.status)&&outcome.status!=='SuccessValue')throw new NearError('payment_failed','That transaction did not complete. Open the original accepted day.',409);
  const call=tx?.actions[0]?.FunctionCall;
  if(!tx||tx.hash!==hash||tx.signer_id!==player||tx.receiver_id!==runtime.collection||tx.actions.length!==1||!call||call.method_name!=='accept_day')throw new NearError('context','Choose the original NEAR day payment.');
  let args:{admission?:Record<string,unknown>;signature?:string};try{args=JSON.parse(Buffer.from(call.args,'base64').toString('utf8'));}catch{throw new NearError('context','The NEAR payment details changed.');}
  const a=args.admission;
  if(!a||a.id!==q.request_id||a.player!==player||a.tokenId!==q.token_id||a.baseRevision!==q.base_revision||a.kitMask!==q.kit_mask||a.decisionConfig!==q.decision_config||call.deposit!==a.processingFee||q.processing_fee!==undefined&&q.processing_fee!==call.deposit||typeof a.shipping!=='boolean'||q.shipping!==(a.shipping&&BigInt(q.reserved_reward)>0n))throw new NearError('context','The NEAR day payment does not match this request.');
}
export async function acceptNearJob(runtime:NearRuntime,campaignId:string,player:string,idValue:unknown,ownerTx?:string,store:DurableStore=storage()):Promise<NearJob>{
  const id=nearRequestId(idValue),{block}=await verifyNearRuntime(runtime),q=await nearView<NearRequest|null>(runtime,'request',{request_id:id},block);
  if(!q||q.player!==player||q.status===0)throw new NearError('not_found','That day could not be found.',404);
  const key=nearJobId(runtime,id),existing=(await store.get<NearJob>(key))?.value;
  if(ownerTx)await checkOwnerTransaction(runtime,ownerTx,player,q);
  if(existing){if(existing.campaignId!==campaignId||!sameNearRequest(existing.input,q)||existing.input.player!==player)throw new NearError('context','The saved NEAR admission changed.');return existing;}
  if(q.status!==1)throw new NearError('terminal','This NEAR attempt is already recorded.');
  const quote=await nearQuoteForRequest(runtime,id,store);
  if(quote.campaignId!==campaignId||quote.record.player!==player||quote.record.tokenId!==q.token_id||quote.record.baseRevision!==q.base_revision)throw new NearError('context','The NEAR quote belongs to another life.');
  await requireJobBudget(campaignId,key,store);
  const life=await nearView<NearLife|null>(runtime,'life',{token_id:q.token_id},block);if(!life)throw new NearError('context','The accepted NEAR life is missing.');
  const input=freezeNearInput(runtime,q,life,block),memory=await canonicalMemory(runtime,input,life.name),at=Date.now();
  const job:NearJob={version:2,id:key,campaignId,input,inputHash:nearInputHash(input),memory,memoryHash:digest(memory),phase:'queued',generation:0,inputs:{},answers:{},decisions:[],createdAt:at,updatedAt:at,nextWakeAt:at+5000,quoteKey:quote.quoteKey,...(ownerTx?{ownerTx}:{})};
  if(!await store.put(key,job,{isNew:true})){const raced=(await store.get<NearJob>(key))?.value;if(!raced||raced.campaignId!==campaignId||!sameNearRequest(raced.input,q))throw new NearError('context','The accepted NEAR input changed.');return raced;}return job;
}
async function acquire(id:string,store:DurableStore){
  let lease:Lease|undefined;
  const job=await updateStoredRecord<NearJob>(store,id,()=>{throw new NearError('not_found','That day could not be found.',404);},j=>{
    if(!['queued','preparing'].includes(j.phase)||j.lease&&j.lease.until>Date.now())return j;
    const nonce=randomUUID();j.generation++;j.lease={id:nonce,generation:j.generation,until:Date.now()+90000};j.phase='preparing';delete j.nextWakeAt;j.updatedAt=Date.now();lease={id:nonce,generation:j.generation};return j;
  });return {job,lease};
}
export async function prepareNearJob(id:string,store:DurableStore=storage()){
  const {job,lease}=await acquire(id,store);if(!lease)return job;
  const progress=async(value:ChoiceProgress)=>updateStoredRecord<NearJob>(store,id,()=>{throw Error('Missing NEAR day');},j=>{fence(j,lease);if(j.phase!=='preparing')throw new LeaseLost();j.progress=appendChoiceProgress(j.progress,value);j.updatedAt=Date.now();return j;});
  const answer=async(request:ChoiceModelRequest,kind:string)=>{
    await updateStoredRecord<NearJob>(store,id,()=>{throw Error('Missing NEAR day');},j=>{fence(j,lease);if(j.inputs[kind]&&j.inputs[kind]!==request.inputHash)throw new NearError('context','The frozen NEAR choice changed.');j.inputs[kind]=request.inputHash;j.lease!.until=Date.now()+90000;return j;});
    const value=await paidInferenceCall(job.campaignId,id+':'+kind,request.inputHash,async beforeSend=>{
      const result=await sendChoiceRequest(request,async(hash,input)=>{
        await recheckNearInput(job.input);
        await updateStoredRecord<NearJob>(store,id,()=>{throw Error('Missing NEAR day');},j=>{fence(j,lease);if(j.inputHash!==job.inputHash||j.phase!=='preparing')throw new LeaseLost();j.lease!.until=Date.now()+90000;j.updatedAt=Date.now();return j;});
        await beforeSend(hash,input);
      });return {value:result,costMicroUSD:result.exchange.costMicroUSD};
    },store,id);
    await updateStoredRecord<NearJob>(store,id,()=>{throw Error('Missing NEAR day');},j=>{fence(j,lease);const valueHash=sha(value);if(j.answers[request.inputHash]&&j.answers[request.inputHash]!==valueHash)throw new NearError('context','The recorded NEAR answer changed.');j.answers[request.inputHash]=valueHash;j.updatedAt=Date.now();return j;});return value;
  };
  try{
    if(nearInputHash(job.input)!==job.inputHash||digest(job.memory)!==job.memoryHash)throw new NearError('context','The frozen NEAR input changed.');
    await requireJobBudget(job.campaignId,id,store);await recheckNearInput(job.input);
    const prepared=await prepareDayCore(job.input,job.inputHash,async d=>{
      const request=buildChoiceRequest(d,job.memory),selected=decodeChoice(await answer(request,`${d.mode}:${d.slot}`)),candidate=d.candidates.find(a=>a.key===selected.key);
      if(!candidate)throw new NearError('context','The selected model action changed.');await progress({id:request.inputHash,stage:d.mode,label:candidate.label,slot:d.slot});return selected;
    },{
      memory:job.memory,offer:offerMindCandidates,plan:async choices=>{const request=buildPlanRequest(choices),plan=decodePlan(await answer(request,'dawn'),choices);await progress({id:request.inputHash,stage:'plan',label:plan.mainLabel});return plan;},
      onDecision:async decision=>{await updateStoredRecord<NearJob>(store,id,()=>{throw Error('Missing NEAR day');},j=>{fence(j,lease);const prior=j.decisions.find(d=>d.inputHash===decision.inputHash);if(prior&&digest(prior)!==digest(decision))throw new NearError('context','The recorded NEAR decision changed.');if(!prior)j.decisions.push(decision);j.lease!.until=Date.now()+90000;j.updatedAt=Date.now();return j;});},
    });
    const runtime=nearRuntime(),packetKey=nearPacketKey(runtime,prepared.commitment),prior=await store.get<unknown>(packetKey);
    if(prior&&digest(prior.value)!==prepared.commitment||!prior&&!await store.put(packetKey,prepared.packet,{isNew:true})&&digest((await store.get<unknown>(packetKey))?.value)!==prepared.commitment)throw new NearError('context','The prepared NEAR film changed.');
    return updateStoredRecord<NearJob>(store,id,()=>{throw Error('Missing NEAR day');},j=>{fence(j,lease);if(j.inputHash!==job.inputHash)throw new LeaseLost();j.phase='prepared';j.packetKey=packetKey;j.commitment=prepared.commitment;j.stateHash=prepared.packet.stateHash;delete j.lease;delete j.failureCode;delete j.failureStage;j.updatedAt=Date.now();return j;});
  }catch(error){
    if(error instanceof LeaseLost)throw error;
    return updateStoredRecord<NearJob>(store,id,()=>{throw Error('Missing NEAR day');},j=>{
      fence(j,lease);const common=classifyPreparationFailure(error),retry=error instanceof NearError?error.retryable:common.retryable,contextual=error instanceof NearError||error instanceof EvmContextError;
      j.phase=retry?'queued':contextual&&error.code==='expired'?'expiry_due':contextual&&['context','terminal'].includes(error.code)||error instanceof BudgetError&&error.code==='changed'?'quarantined':'failure_due';
      j.failureCode=retry?'chain_retry':error instanceof InferenceError?'model_'+error.code:error instanceof NearError?error.code:error instanceof BudgetError?'budget_'+error.code:common.code;j.failureStage=error instanceof InferenceError?'model':'preparation';delete j.lease;if(retry)j.nextWakeAt=Date.now()+5000;j.updatedAt=Date.now();return j;
    });
  }
}
export async function recordNearTerminal(runtime:NearRuntime,job:NearJob,store:DurableStore=storage()){
  const {block}=await verifyNearRuntime(runtime),q=await nearView<NearRequest|null>(runtime,'request',{request_id:job.input.requestId},block);
  if(!q||!sameNearRequest(job.input,q))throw new NearError('context','The saved NEAR request changed.');
  if(q.status===1)return false;
  if(![2,3,4].includes(q.status))throw new NearError('context','The NEAR outcome needs another check.');
  if(q.status===2){const record=await nearView<NearDayRecord|null>(runtime,'day_record',{token_id:job.input.tokenId,day:job.input.day},block);if(!record||record.request_id!==job.input.requestId||record.replay_commitment!==job.commitment||record.state_hash!==job.stateHash)throw new NearError('context','The saved NEAR commitment changed.');}
  await retireNearRelayIntent(runtime,job.id,{terminal:true},store);
  await updateStoredRecord<NearJob>(store,job.id,()=>{throw Error('Missing NEAR day');},j=>{j.phase=q.status===2?'ready':q.status===3?'failed':'expired';delete j.lease;j.updatedAt=Date.now();return j;});
  await retireNearQuote(runtime,job.quoteKey,job.campaignId,store);return true;
}
export async function settleNearJob(runtime:NearRuntime,id:string,store:DurableStore=storage()){
  let job=(await store.get<NearJob>(id))?.value;if(!job)throw new NearError('not_found','That day could not be found.',404);
  if(await recordNearTerminal(runtime,job,store))return (await store.get<NearJob>(id))!.value;
  let method:'finalize'|'fail'|'expire',args:Record<string,unknown>;
  if(['prepared','saving'].includes(job.phase)){
    if(!job.packetKey||!job.commitment)throw new NearError('context','The prepared NEAR packet is missing.');
    const packet=(await store.get<any>(job.packetKey))?.value;if(!packet||digest(packet)!==job.commitment||packet.stateHash!==job.stateHash)throw new NearError('context','The prepared NEAR packet changed.');
    method='finalize';args={request_id:job.input.requestId,trace:packet.trace,certificate:packet.certificate,replay_commitment:job.commitment};
    await updateStoredRecord<NearJob>(store,id,()=>{throw Error('Missing NEAR day');},j=>{j.phase='saving';j.updatedAt=Date.now();return j;});
  }else if(job.phase==='expiry_due'){method='expire';args={request_id:job.input.requestId};}
  else if(job.phase==='failure_due'){method='fail';args={request_id:job.input.requestId};}
  else return job;
  if(method==='expire')await retireNearRelayIntent(runtime,id,{requestId:job.input.requestId,deadline:job.input.deadline},store);
  const result=await nearRelayTransaction(runtime,{jobId:id,method,args,resultDigest:digest(args)},async journal=>{await updateStoredRecord<NearJob>(store,id,()=>{throw Error('Missing NEAR day');},j=>{j.journal=journal;j.updatedAt=Date.now();return j;});},{store,recoverJournal:job.journal?.method===method?job.journal:undefined});
  job=await updateStoredRecord<NearJob>(store,id,()=>{throw Error('Missing NEAR day');},j=>{j.finalTx=result.hash;j.updatedAt=Date.now();return j;});
  if(!await recordNearTerminal(runtime,job,store)){
    const failed=typeof result.outcome.status==='object'&&result.outcome.status&&'Failure'in result.outcome.status;
    if(failed)await updateStoredRecord<NearJob>(store,id,()=>{throw Error('Missing NEAR day');},j=>{j.phase='quarantined';j.failureCode='relay_reverted';j.updatedAt=Date.now();return j;});
    throw new NearError('uncertain','Checking this saved NEAR day again.',503,true);
  }
  return (await store.get<NearJob>(id))!.value;
}
