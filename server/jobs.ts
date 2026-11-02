import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { encodeAbiParameters, keccak256, toHex, type Address, type Hex } from 'viem';
import { nearlyHumanAbi } from '../src/chain/abi';
import { deployments } from '../src/chain/deployments';
import { decodeDelivery } from '../src/chain/permit';
import { ITEM_IDS, cloneState, isDeliveryCollection, MAX_MODEL_DECISIONS, packState, PICKUP_BY_SLOT, prepareDay, unpackState, type DayCheckpoint, type DayContext, type DayResult, type GameState, type ModelChoice, type Receipt } from '../src/domain';
import type { JobView } from '../src/app/api';
import { acceptReservation, DECISION_CONFIG, DECISION_PARAMETERS, finishReservation, reconcileAdmission } from './admission';
import { blockUnavailable, canonicalRequest, chainOutcome, checkedAddress, checkedRequest, checkedToken, connection, expiryIntent, failureIntent, finalizeIntent, pinnedRead, readAcceptedTransaction, readRawRooster, RelayBusy, terminalTransaction, ServiceError, verifyConnection, type RelayJournal } from './chain';
import { isHosted, serverConfig } from './config';
import { buildDecision, infer, InferenceError, type Exchange } from './jev';
import { storage, StoreConflict, update } from './storage';
import { mayReplaceRetiredAcceptance, recoverMissingAcceptance } from './acceptance';

interface Answer { inputHash:string; choice:ModelChoice; exchange:string }
interface SlotAllowance { count:number; answer?:Answer; inputs:string[]; outputs:string[] }
export interface JobControl {
  version:1; chainId:number; collection:Address; requestId:Hex; tokenId:string; player:Address; permitId:Hex; inputDigest:Hex;
  seed:Hex; decisionConfig:Hex; rulesVersion?:number; deadline:number; baseRevision:number; day:number; delivery:number;
  ownerTx:Hex; acceptedBlock:string; acceptedHash:Hex; base:GameState;
  phase:JobView['phase']; generation:number; lease?:{id:string;generation:number;until:number};
  checkpoint?:string; receiptKeys:string[]; slot:number; decisions:number;
  sent:number; allowances:Record<string,SlotAllowance>; spentMicroUSD:number;
  packet?:string; commitment?:Hex; finalTx?:Hex; journal?:RelayJournal; journals?:RelayJournal[];
  latestChoice?:Receipt['choice']; failure?:string; exceptionKey?:string; updatedAt:number; createdAt:number; terminalAt?:number; compactedAt?:number;
  canonicalResultHash?:Hex; priorTerminalPhase?:'ready'|'failed'|'expired';
  operation?:'mint'|'day';permitExpiresAt?:number;ownerNonce?:number;retrySafe?:boolean;orphanedAcceptance?:boolean;acceptanceConflict?:boolean;
  unacceptedProof?:{blockNumber:string;blockHash:Hex;timestamp:number;confirmedNonce?:number};
}
interface CheckpointBlob { context:DayContext; receipt?:Receipt }
interface ReplayPacket { version:1; requestId:Hex; inputDigest:Hex; seed:Hex; decisionConfig:Hex; result:DayResult; diagnostics:string[] }
interface ReplayIndex { day:number; requestId:Hex; packet:string; commitment:Hex; supersededAt?:number }
interface TokenPackets { latest?:number; days:Record<string,ReplayIndex> }
const jobKey=(id:string)=>'jobs/'+id.toLowerCase();
function networkNamespace(){const {chain,address}=connection();return `${chain.id}-${address.toLowerCase()}`;}
const replayKey=(token:string)=>`replays/${networkNamespace()}/${token}`;
const sameNetwork=(c:JobControl)=>{const {chain,address}=connection();return c.chainId===chain.id&&equal(c.collection,address);};
const leaseMs=90_000, sendReserve=588, maxSends=72;
const isTerminal=(phase:JobView['phase'])=>['ready','failed','expired','unaccepted'].includes(phase);
const equal=(a:string,b:string)=>a.toLowerCase()===b.toLowerCase();
class HandOff extends Error {}
class LeaseLost extends Error {}
class CanonicalChanged extends Error {}
const digest=(value:unknown)=>keccak256(toHex(JSON.stringify(value)));
type CanonicalRequest=Awaited<ReturnType<typeof canonicalRequest>>;
function sameRequestContext(c:JobControl,{request:r}:CanonicalRequest) {
  return r.status!==0&&r.tokenId===BigInt(c.tokenId)&&equal(r.player,c.player)&&r.permitId===c.permitId&&r.inputDigest===c.inputDigest
    &&toHex(r.seed,{size:32})===c.seed&&r.baseRevision===c.baseRevision&&r.day===c.day&&r.delivery===c.delivery
    &&Number(r.deadline)===c.deadline&&r.rulesVersion===(c.rulesVersion??1)&&r.decisionConfig===c.decisionConfig;
}
function pristineAcceptance(c:JobControl) {
  return c.sent===0&&c.spentMicroUSD===0&&c.slot===0&&c.decisions===0&&!c.checkpoint&&c.receiptKeys.length===0&&Object.keys(c.allowances).length===0
    &&!c.packet&&!c.commitment&&!c.failure&&!c.journal&&!c.journals?.length&&!c.finalTx&&!c.priorTerminalPhase&&!c.latestChoice
    &&!isTerminal(c.phase)&&c.phase!=='recording_failure';
}
function internalException(error:unknown) {
  const cfg=serverConfig();const redact=(value:string)=>[cfg.nearKey,cfg.relayKey,cfg.signingSecret,process.env.NEARLYHUMAN_QA_OWNER_KEY].filter((v):v is string=>!!v).reduce((text,key)=>text.replaceAll(key,'[redacted]'),value);
  const e=error as Error&{code?:string};
  return {name:typeof e?.name==='string'?e.name:'UnknownError',code:typeof e?.code==='string'?e.code:undefined,message:redact(typeof e?.message==='string'?e.message:String(error)).slice(0,2500),stack:redact(typeof e?.stack==='string'?e.stack:'').slice(0,6000)};
}
function infrastructureInterrupted(error:unknown) {
  const e=error as Error&{code?:string};return blockUnavailable(error)||error instanceof StoreConflict||['EPERM','EACCES','EBUSY','ETIMEDOUT','ECONNRESET'].includes(e?.code||'')||/^(HttpRequestError|TimeoutError|RpcRequestError)$/.test(e?.name||'')||/(fetch failed|socket hang up|request timed out)/i.test(e?.message||'');
}
async function immutable(prefix:string,value:unknown) {
  const key=`${prefix}/${digest(value)}`;await storage().put(key,value,{isNew:true});return key;
}
function fenced(control:JobControl,id:string,generation:number) {
  if(control.lease?.id!==id||control.lease.generation!==generation||control.lease.until<=Date.now())throw new LeaseLost();
}
export function reserveSend(control:JobControl,slot:number,inputKey:string) {
  const allowance=control.allowances[slot]||={count:0,inputs:[],outputs:[]};
  if(control.sent>=maxSends||allowance.count>=3||control.spentMicroUSD+sendReserve>60_000)throw new InferenceError('attempt_limit');
  allowance.count++;allowance.inputs.push(inputKey);control.sent++;control.spentMicroUSD+=sendReserve;
}

export async function acceptTransaction(hashValue:Hex,playerValue:string) {
  const player=checkedAddress(playerValue),accepted=await readAcceptedTransaction(checkedRequest(hashValue),player);
  const existing=await storage().get<JobControl>(jobKey(accepted.requestId));
  let retired:JobControl|undefined;
  if(existing){
    if(existing.value.permitId===accepted.request.permitId){
      if(!equal(existing.value.player,player))throw new ServiceError('This request belongs to another wallet.','ownership',403);
      const canon=await canonicalRequest(accepted.requestId),r=canon.request;
      if(r.inputDigest!==accepted.inputDigest||r.permitId!==accepted.request.permitId)throw new ServiceError('Checking the accepted wallet request.','checking',409);
      if(!sameRequestContext(existing.value,canon)||existing.value.acceptedHash!==accepted.blockHash){
        const reservation=await acceptReservation(r.permitId,accepted.requestId,r.player);
        await update<JobControl>(jobKey(accepted.requestId),()=>existing.value,c=>{
          if(c.permitId!==r.permitId)throw new ServiceError('Checking the accepted wallet request.','checking',409);
          if(sameRequestContext(c,canon)&&c.acceptedHash===accepted.blockHash)return c;
          // The same owner transaction can be mined on a different fork with a new
          // birth seed/deadline. Only untouched work can adopt that new context.
          c.generation++;delete c.lease;
          if(r.status===1&&canon.raw&&canon.owner&&equal(canon.owner,player)&&reservation.status==='accepted'&&pristineAcceptance(c)){
            Object.assign(c,{inputDigest:r.inputDigest,seed:toHex(r.seed,{size:32}),decisionConfig:r.decisionConfig,rulesVersion:r.rulesVersion,deadline:Number(r.deadline),baseRevision:r.baseRevision,day:r.day,delivery:r.delivery,
              ownerTx:accepted.ownerTx,ownerNonce:accepted.ownerNonce,acceptedBlock:accepted.blockNumber.toString(),acceptedHash:accepted.blockHash,
              base:unpackState(canon.raw.state,{seed:canon.raw.seed,name:canon.raw.name,stats:{body:canon.raw.body,wits:canon.raw.wits,spirit:canon.raw.spirit}}),
              phase:r.decisionConfig===DECISION_CONFIG&&r.rulesVersion===1?'queued':'checking',orphanedAcceptance:false,acceptanceConflict:false,retrySafe:false});
            delete c.unacceptedProof;
          }else {c.phase='checking';c.acceptanceConflict=true;}
          c.updatedAt=Date.now();return c;
        });
      }
      const current=await refreshTerminal((await storage().get<JobControl>(jobKey(accepted.requestId)))!.value);
      if(!isTerminal(current.phase)&&!current.acceptanceConflict&&!current.orphanedAcceptance)await dispatchJob(accepted.requestId);return {requestId:accepted.requestId,tokenId:accepted.tokenId.toString()};
    }
    if(!await mayReplaceRetiredAcceptance(existing.value,accepted.request.permitId))throw new ServiceError('Checking the earlier wallet request.','checking',409);
    retired=existing.value;await finishReservation(retired.permitId,retired.spentMicroUSD);await immutable(`orphaned-jobs/${retired.requestId}/${retired.permitId}`,retired);
  }
  const canon=await canonicalRequest(accepted.requestId),r=canon.request;
  if(!canon.raw||!canon.owner||r.status===0)throw new ServiceError('Checking this request.','checking',409);
  const reservation=await acceptReservation(r.permitId,accepted.requestId,r.player);
  const base=unpackState(canon.raw.state,{seed:canon.raw.seed,name:canon.raw.name,stats:{body:canon.raw.body,wits:canon.raw.wits,spirit:canon.raw.spirit}});
  const {chain,address}=connection();
  const control:JobControl={version:1,chainId:chain.id,collection:address,requestId:accepted.requestId,tokenId:accepted.tokenId.toString(),player:r.player,permitId:r.permitId,inputDigest:r.inputDigest,
    seed:toHex(r.seed,{size:32}),decisionConfig:r.decisionConfig,rulesVersion:r.rulesVersion,deadline:Number(r.deadline),baseRevision:r.baseRevision,day:r.day,delivery:r.delivery,
    operation:reservation.quote?.permit.operation===0?'mint':reservation.quote?.permit.operation===1?'day':undefined,permitExpiresAt:reservation.expiresAt,ownerNonce:accepted.ownerNonce,
    ownerTx:accepted.ownerTx,acceptedBlock:accepted.blockNumber.toString(),acceptedHash:accepted.blockHash,base,
    phase:r.status===1&&r.decisionConfig===DECISION_CONFIG&&r.rulesVersion===1?'queued':'checking',generation:0,receiptKeys:[],slot:0,decisions:0,sent:0,allowances:{},spentMicroUSD:0,updatedAt:Date.now(),createdAt:Date.now()};
  if(retired){
    const old=retired;
    await update<JobControl>(jobKey(accepted.requestId),()=>old,current=>{
      if(current.permitId===control.permitId)return current;
      if(current.permitId!==old.permitId||current.inputDigest!==old.inputDigest||current.unacceptedProof?.blockHash!==old.unacceptedProof?.blockHash)throw new ServiceError('Checking the accepted wallet request.','checking',409);
      control.generation=current.generation+1;return control;
    });
  }else await storage().put(jobKey(accepted.requestId),control,{isNew:true});
  await dispatchJob(accepted.requestId);return {requestId:accepted.requestId,tokenId:accepted.tokenId.toString()};
}
function view(c:JobControl):JobView {return {requestId:c.requestId,tokenId:c.tokenId,phase:c.phase,decisions:c.decisions,slot:c.slot,updatedAt:c.updatedAt,latestChoice:c.latestChoice,ownerTx:c.ownerTx,finalTx:c.finalTx,retrySafe:c.retrySafe,operation:c.operation};}
export async function getJob(value:string,playerValue?:string):Promise<JobView> {
  const id=checkedRequest(value),entry=await storage().get<JobControl>(jobKey(id));
  if(!entry)throw new ServiceError('Checking this request. Please try again shortly.','checking',404);
  if(playerValue&&!equal(entry.value.player,checkedAddress(playerValue)))throw new ServiceError('This request belongs to another wallet.','ownership',403);
  // A status read deliberately never purchases inference or acquires a worker lease.
  return view(await refreshTerminal(entry.value));
}
async function refreshTerminal(c:JobControl):Promise<JobControl> {
  if(sameNetwork(c)){
    const ledger=await storage().get<{holds:Record<string,import('./admission').Reservation>}>('control/admission-v1'),hold=ledger?.value.holds[c.permitId];
    if(hold){c=await recoverMissingAcceptance(c,hold);if(c.phase==='unaccepted'&&c.retrySafe){await finishReservation(c.permitId,c.spentMicroUSD);return c;}}
  }
  if(c.orphanedAcceptance||c.acceptanceConflict)return c;
  if(!isTerminal(c.phase)||!sameNetwork(c))return c;
  const canon=await canonicalRequest(c.requestId),r=canon.request;
  let matches=r.inputDigest===c.inputDigest&&r.status===({ready:2,failed:3,expired:4}[c.phase as 'ready'|'failed'|'expired']);
  if(matches&&c.phase==='ready'){
    const {client,address}=connection();const [summary]=await pinnedRead(()=>client.readContract({address,abi:nearlyHumanAbi,functionName:'getDay',args:[BigInt(c.tokenId),c.day],blockNumber:canon.block.number}));
    matches=summary.requestId===c.requestId&&summary.replayCommitment===c.commitment&&(!c.canonicalResultHash||c.canonicalResultHash===r.resultHash);
  }
  if(matches)return c;
  return update<JobControl>(jobKey(c.requestId),()=>c,current=>{
    if(isTerminal(current.phase)&&current.generation===c.generation){
      current.priorTerminalPhase=current.phase as 'ready'|'failed'|'expired';
      current.phase=current.phase==='failed'?'recording_failure':'checking';current.updatedAt=Date.now();
    }
    return current;
  });
}
export async function wakeJob(value:string,playerValue:string) {
  const id=checkedRequest(value),player=checkedAddress(playerValue);
  if(!await storage().get<JobControl>(jobKey(id))){
    // A second device may know the canonical pending ID without the first browser's hash.
    // Recover its indexed event immediately rather than waiting for the scheduled scan.
    const canon=await canonicalRequest(id);
    if(!canon.request.status||!equal(canon.request.player,player))throw new ServiceError('This request belongs to another wallet.','ownership',403);
    const {client,address,chain}=connection(),knownDeployment=deployments[chain.id];
    const minimum=knownDeployment&&equal(knownDeployment.address,address)?BigInt(knownDeployment.blockNumber):0n;
    let from=canon.block.number>19_999n?canon.block.number-19_999n:0n;if(from<minimum)from=minimum;
    const logs=await pinnedRead(()=>client.getContractEvents({address,abi:nearlyHumanAbi,eventName:'DayRequested',args:{requestId:id,player},fromBlock:from,toBlock:canon.block.number,strict:true}));
    const event=logs.find(log=>log.args.requestId===id&&log.transactionHash);
    if(!event)throw new ServiceError('Checking the accepted request. Try again shortly.','checking',409);
    await acceptTransaction(event.transactionHash,player);
  }
  const current=await getJob(id,player);if(current.phase!=='unaccepted')await dispatchJob(id);return getJob(id,player);
}
const localRunning=new Set<string>();
export async function dispatchJob(id:Hex) {
  if(!isHosted()){
    if(!localRunning.has(id)){localRunning.add(id);setTimeout(()=>{void runJob(id).catch(()=>{}).finally(()=>localRunning.delete(id));},0);}return;
  }
  await dispatchBackground({requestId:id});
}
async function dispatchBackground(body:unknown) {
  const secret=serverConfig().signingSecret,base=process.env.URL;
  if(!secret||!base)throw new ServiceError('Preparation is queued. Check again shortly.','queued',503);
  const response=await fetch(new URL('/.netlify/functions/prepare-background',base),{method:'POST',headers:{'Content-Type':'application/json','x-nearlyhuman-worker':secret},body:JSON.stringify(body),signal:AbortSignal.timeout(8_000)});
  if(!response.ok)throw new ServiceError('Preparation is queued. Check again shortly.','queued',503);
}
export async function dispatchReconciliation(){if(!isHosted())return reconcile();await dispatchBackground({task:'reconcile'});}
export function validWorkerSecret(value:string|null) {
  const secret=serverConfig().signingSecret;if(!secret||!value)return false;
  const a=Buffer.from(secret),b=Buffer.from(value);return a.length===b.length&&timingSafeEqual(a,b);
}

async function loadCheckpoint(c:JobControl):Promise<DayCheckpoint|undefined> {
  if(!c.checkpoint)return;
  const cp=await storage().get<CheckpointBlob>(c.checkpoint);if(!cp)throw new CanonicalChanged('Missing checkpoint.');
  const receipts:Receipt[]=[];
  for(let i=0;i<c.receiptKeys.length;i+=10){const part=await Promise.all(c.receiptKeys.slice(i,i+10).map(k=>storage().get<CheckpointBlob>(k)));for(const p of part){if(!p?.value.receipt)throw new CanonicalChanged('Missing receipt.');receipts.push(p.value.receipt);}}
  if(receipts.length!==c.slot||cp.value.context.slot!==c.slot||cp.value.context.seed!==c.seed)throw new CanonicalChanged('Checkpoint mismatch.');
  return {context:cp.value.context,receipts};
}
async function assertPending(c:JobControl,minimumSeconds=0) {
  return assertPendingAt(c,await canonicalRequest(c.requestId),minimumSeconds);
}
async function assertPendingAt(c:JobControl,current:CanonicalRequest,minimumSeconds?:number) {
  const r=current.request;
  if(r.status!==1)throw new CanonicalChanged('Canonical terminal.');
  if(!sameRequestContext(c,current)||!current.raw||!current.owner||current.raw.pendingRequest!==c.requestId||current.raw.revision!==c.baseRevision||!equal(current.owner,c.player)||digest(unpackState(current.raw.state,{seed:current.raw.seed,name:current.raw.name,stats:{body:current.raw.body,wits:current.raw.wits,spirit:current.raw.spirit}}))!==digest(c.base))throw new CanonicalChanged('Canonical inputs changed.');
  const {client}=connection(),accepted=await pinnedRead(()=>client.getBlock({blockNumber:BigInt(c.acceptedBlock)}));
  if(accepted.hash!==c.acceptedHash)throw new CanonicalChanged('Canonical acceptance changed.');
  if(minimumSeconds!==undefined&&Number(current.block.timestamp)+minimumSeconds>c.deadline)throw new InferenceError('deadline');
  return current;
}

/** A lease, checkpoint head and lifecycle are advanced by the same CAS record. */
export async function runJob(value:string) {
  await verifyConnection();
  const id=checkedRequest(value),leaseId=randomUUID(),started=Date.now();let generation=0;
  const previous=await storage().get<JobControl>(jobKey(id));if(previous){const refreshed=await refreshTerminal(previous.value);if(refreshed.orphanedAcceptance||refreshed.acceptanceConflict)return;}
  let control:JobControl;
  try{
    control=await update<JobControl>(jobKey(id),()=>{throw new ServiceError('Unknown request.','request',404);},c=>{
      if(!sameNetwork(c)||isTerminal(c.phase))throw new HandOff();if(c.lease&&c.lease.until>Date.now())throw new HandOff();
      c.generation++;generation=c.generation;c.lease={id:leaseId,generation,until:Date.now()+leaseMs};c.updatedAt=Date.now();return c;
    });
  }catch(e){if(e instanceof HandOff)return;throw e;}
  const edit=async(apply:(c:JobControl)=>void)=>{
    control=await update<JobControl>(jobKey(id),()=>{throw new LeaseLost();},c=>{fenced(c,leaseId,generation);apply(c);c.updatedAt=Date.now();c.lease!.until=Date.now()+leaseMs;return c;});return control;
  };
  try{
    if(await syncTerminal(control,edit))return;
    if(control.orphanedAcceptance||control.acceptanceConflict){await edit(c=>{c.phase='checking';});return;}
    if(control.phase==='recording_failure'){await settleFailure(control,edit);return;}
    if(control.priorTerminalPhase==='expired'&&!control.packet){await edit(c=>{c.phase='checking';});return;}
    // A later release must not silently prepare an earlier accepted configuration with new rules.
    // Fully prepared immutable packets and saved historical replays need no new inference.
    if(!control.packet&&(control.decisionConfig!==DECISION_CONFIG||(control.rulesVersion??1)!==1)){await edit(c=>{c.phase='checking';});return;}
    await assertPending(control,control.packet?25:110);
    if(!control.packet){
      await edit(c=>{c.phase='preparing';});
      const resume=await loadCheckpoint(control);
      const result=await prepareDay(control.base,decodeDelivery(control.delivery).map(i=>ITEM_IDS[i]!),async context=>{
        if(Date.now()-started>530_000)throw new HandOff();
        const input=buildDecision(context),inputHash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
        const cached=control.allowances[context.slot]?.answer;
        if(control.spentMicroUSD>60_000)throw new InferenceError('provider_price_changed');
        if(cached){if(cached.inputHash!==inputHash)throw new CanonicalChanged('Decision inputs changed.');return cached.choice;}
        for(let attempt=0;attempt<3;attempt++){
          await assertPending(control,110);let sent=false;
          try{
            const reply=await infer(context,async(hash,body)=>{
              const inputKey=await immutable(`diagnostics/${id}/inputs`,{at:Date.now(),slot:context.slot,hash,body,candidates:context.candidates.map(c=>c.key)});
              await edit(c=>{reserveSend(c,context.slot,inputKey);});sent=true;
            });
            const exchangeKey=await immutable(`diagnostics/${id}/outputs`,{at:Date.now(),slot:context.slot,...reply.exchange});
            await edit(c=>{const a=c.allowances[context.slot]!;a.outputs.push(exchangeKey);a.answer={inputHash,choice:reply.choice,exchange:exchangeKey};
              const cost=reply.exchange.inputTokens>0?Math.max(0,reply.exchange.costMicroUSD):Math.max(sendReserve,reply.exchange.costMicroUSD);
              c.spentMicroUSD+=cost-sendReserve;});
            if(control.spentMicroUSD>60_000)throw new InferenceError('provider_price_changed');
            return reply.choice;
          }catch(error){
            if(error instanceof LeaseLost||error instanceof CanonicalChanged||error instanceof HandOff)throw error;
            if(!sent||!(error instanceof InferenceError)||['attempt_limit','deadline','not_configured','context_budget','provider_price_changed'].includes(error.code)||attempt===2)throw error;
            const outputKey=await immutable(`diagnostics/${id}/outputs`,{at:Date.now(),slot:context.slot,error:error.code,uncertain:error.uncertain});
            await edit(c=>{c.allowances[context.slot]!.outputs.push(outputKey);});
          }
        }
        throw new InferenceError('attempt_limit');
      },{...DECISION_PARAMETERS,daySeed:control.seed,resume,onCheckpoint:async checkpoint=>{
        const receipt=checkpoint.receipts.at(-1);
        const key=await immutable(`checkpoints/${id}`,{context:checkpoint.context,...(receipt?{receipt}:{})});
        await edit(c=>{
          if(checkpoint.context.slot===0){if(c.slot!==0||c.receiptKeys.length||checkpoint.receipts.length||!checkpoint.context.dailyFocus)throw new CanonicalChanged('Plan checkpoint order changed.');c.checkpoint=key;c.decisions=checkpoint.context.modelChoices;c.latestChoice=checkpoint.context.dailyFocus.choice;return;}
          if(checkpoint.context.slot!==c.slot+1||!receipt)throw new CanonicalChanged('Checkpoint order changed.');c.checkpoint=key;c.receiptKeys.push(key);c.slot=checkpoint.context.slot;c.decisions=checkpoint.context.modelChoices;c.latestChoice=receipt.choice;
        });
        if(Date.now()-started>530_000&&checkpoint.context.state.alive&&checkpoint.context.slot<60)throw new HandOff();
      }});
      validateResult(control,result);
      const diagnostics=Object.values(control.allowances).flatMap(a=>[...a.inputs,...a.outputs]);
      const packet:ReplayPacket={version:1,requestId:id,inputDigest:control.inputDigest,seed:control.seed,decisionConfig:control.decisionConfig,result,diagnostics};
      const key=await immutable(`packets/${control.tokenId}/${control.day}`,packet),commitment=digest(packet);
      await edit(c=>{c.packet=key;c.commitment=commitment;c.phase='saving';});
    }
    if(control.phase!=='saving')await edit(c=>{c.phase='saving';});
    await settleSuccess(control,edit);
  }catch(error){
    if(error instanceof LeaseLost||error instanceof HandOff||error instanceof RelayBusy)return;
    if(!(error instanceof InferenceError)&&!(error instanceof CanonicalChanged)){
      const detail=internalException(error);const exceptionKey=await immutable(`diagnostics/${id}/exceptions`,{at:Date.now(),slot:control.slot,...detail}).catch(()=>undefined);
      console.error('Preparation interrupted',id,detail.name,detail.code||'');
      if(exceptionKey)await edit(c=>{c.exceptionKey=exceptionKey;});
    }
    if(error instanceof CanonicalChanged||(error instanceof ServiceError&&error.code==='checking'&&error.status===409)){try{if(error instanceof CanonicalChanged&&await syncTerminal(control,edit))return;}catch{/* Quarantine inconsistent chain/checkpoint data. */}await edit(c=>{c.phase='checking';});return;}
    if(control.packet||control.journal){await edit(c=>{c.phase=control.packet?'saving':'recording_failure';});return;}
    if(infrastructureInterrupted(error)){await edit(c=>{c.phase='queued';});return;}
    // Operational failure is distinct from biological death; the base save is untouched.
    await edit(c=>{c.phase='recording_failure';c.failure=error instanceof InferenceError?error.code:'preparation_interrupted';});
    try{await settleFailure(control,edit);}catch{/* Durable recording_failure is reconciled later. */}
  }finally{
    await update<JobControl>(jobKey(id),()=>control,c=>{if(c.lease?.id===leaseId&&c.lease.generation===generation){delete c.lease;if(c.phase==='preparing')c.phase='queued';c.updatedAt=Date.now();}return c;}).catch(()=>{});
  }
}

function validateResult(c:JobControl,result:DayResult) {
  if(result.baseDay!==c.base.day||result.day!==c.day||result.finalState.day!==c.day||result.finalState.seed!==c.base.seed||result.finalState.name!==c.base.name||digest(result.finalState.stats)!==digest(c.base.stats)||result.finalState.level!==c.base.level+(result.finalState.alive?1:0)||result.receipts.length<1||result.receipts.length>60||result.finalState.alive&&result.receipts.length!==60||result.history.length!==2+result.receipts.length*8)throw new CanonicalChanged('Prepared result mismatch.');
  const pickups=result.receipts.filter(isDeliveryCollection),focus=result.dailyFocus,undertakings=result.receipts.filter(receipt=>receipt.role==='focus');
  if(!focus||focus.version!==1||result.decisions>MAX_MODEL_DECISIONS||undertakings.length>1||undertakings.some(receipt=>receipt.action!==focus.goal.action||receipt.target!==focus.goal.target||receipt.variant!==focus.goal.variant))throw new CanonicalChanged('Prepared day-plan mismatch.');
  if(result.delivery.length){
    if(result.deliverySettled==='collected'){if(pickups.length!==1||result.deliveryCollectedSlot!==pickups[0]!.slot||result.deliveryCollectedSlot>PICKUP_BY_SLOT)throw new CanonicalChanged('Prepared pickup mismatch.');}
    else if(result.deliverySettled!=='estate'||result.finalState.alive||pickups.length)throw new CanonicalChanged('Prepared delivery settlement mismatch.');
  }else if(pickups.length||result.deliverySettled)throw new CanonicalChanged('Unexpected prepared delivery.');
  packState(result.finalState);
}
type Edit=(apply:(c:JobControl)=>void)=>Promise<JobControl>;
async function journal(control:JobControl,edit:Edit,value:RelayJournal){await edit(c=>{c.journals||=[];if(!c.journals.some(j=>j.hash===value.hash))c.journals.push(value);c.journal=value;c.finalTx=value.hash;});}
async function settleSuccess(c:JobControl,edit:Edit) {
  if(!c.packet||!c.commitment)throw new CanonicalChanged('Missing prepared packet.');
  const packet=await storage().get<ReplayPacket>(c.packet);if(!packet||digest(packet.value)!==c.commitment)throw new CanonicalChanged('Packet commitment mismatch.');
  await assertPending(c,5);
  await terminalTransaction(finalizeIntent(c.requestId,packState(packet.value.result.finalState) as Hex,packet.value.result.history as Hex,c.commitment),j=>journal(c,edit,j));
  if(!await syncTerminal(c,edit))throw new RelayBusy();
}
async function settleFailure(c:JobControl,edit:Edit) {
  const canon=await canonicalRequest(c.requestId);if(canon.request.status!==1){await syncTerminal(c,edit);return;}
  await assertPendingAt(c,canon);
  const intent=Number(canon.block.timestamp)>c.deadline?expiryIntent(c.requestId):failureIntent(c.requestId,c.failure||'preparation_interrupted');
  await terminalTransaction(intent,j=>journal(c,edit,j));await syncTerminal(c,edit);
}
async function syncTerminal(c:JobControl,edit:Edit) {
  const canon=await canonicalRequest(c.requestId),r=canon.request;
  if(!sameRequestContext(c,canon))throw new CanonicalChanged('Accepted request changed.');
  if(r.status===1){if(Number(canon.block.timestamp)>c.deadline){
    // Expiry is also a terminal relay intent, so it must bind the accepted fork.
    await assertPendingAt(c,canon);
    await terminalTransaction(expiryIntent(c.requestId),j=>journal(c,edit,j));return syncTerminal(c,edit);
  }return false;}
  if(r.status===2){
    if(!c.packet||!c.commitment)throw new CanonicalChanged('Saved commitment mismatch.');
    const packet=await storage().get<ReplayPacket>(c.packet);if(!packet||digest(packet.value)!==c.commitment)throw new CanonicalChanged('Saved packet missing.');
    const expected=keccak256(encodeAbiParameters([{type:'bytes32'},{type:'bytes32'},{type:'bytes32'}],[keccak256(packState(packet.value.result.finalState) as Hex),keccak256(packet.value.result.history as Hex),c.commitment]));
    if(r.resultHash!==expected)throw new CanonicalChanged('Saved result mismatch.');
    const {client,address}=connection();const [summary]=await pinnedRead(()=>client.readContract({address,abi:nearlyHumanAbi,functionName:'getDay',args:[BigInt(c.tokenId),c.day],blockNumber:canon.block.number}));
    if(summary.replayCommitment!==c.commitment||summary.stateHash!==keccak256(packState(packet.value.result.finalState) as Hex))throw new CanonicalChanged('Canonical save mismatch.');
    if(!canon.raw)throw new CanonicalChanged('Canonical life is missing.');
    const canonicalDay=canon.raw.day;
    await update<TokenPackets>(replayKey(c.tokenId),()=>({days:{}}),index=>{
      index.latest=canonicalDay;index.days[c.day]={...index.days[c.day],day:c.day,requestId:c.requestId,packet:c.packet!,commitment:c.commitment!};
      for(const entry of Object.values(index.days)){
        if(entry.day===canonicalDay)delete entry.supersededAt;
        else if(!entry.supersededAt)entry.supersededAt=Date.now();
      }
      return index;
    });
    await edit(j=>{j.phase='ready';j.canonicalResultHash=r.resultHash;delete j.priorTerminalPhase;j.terminalAt||=Date.now();});
  }else await edit(j=>{j.phase=r.status===3?'failed':'expired';j.terminalAt||=Date.now();});
  await finishReservation(c.permitId,c.spentMicroUSD);return true;
}

export async function getReplay(value:string,dayValue?:number,playerValue?:string) {
  const token=checkedToken(value),{raw,owner}=await readRawRooster(token);
  if(playerValue&&!equal(owner,checkedAddress(playerValue)))throw new ServiceError('This rooster belongs to another wallet.','ownership',403);
  const day=dayValue===undefined?raw.day:dayValue;
  if(!Number.isInteger(day)||day<1||day>raw.day)throw new ServiceError('This day has not been saved.','replay',404);
  const index=await storage().get<TokenPackets>(replayKey(token.toString())),entry=index?.value.days[day];
  if(!entry)throw new ServiceError('The full replay is unavailable. Its saved outcome is still here.','replay_unavailable',404);
  const packet=await storage().get<ReplayPacket>(entry.packet);if(!packet||digest(packet.value)!==entry.commitment)throw new ServiceError('Checking the saved replay.','checking',409);
  const {client,address}=connection();const [summary]=await client.readContract({address,abi:nearlyHumanAbi,functionName:'getDay',args:[token,day]});
  if(summary.replayCommitment!==entry.commitment||summary.stateHash!==keccak256(packState(packet.value.result.finalState) as Hex))throw new ServiceError('Checking the saved replay.','checking',409);
  return {result:packet.value.result,commitment:entry.commitment};
}
export const getOutcome=chainOutcome;

/** Scan accepted chain facts even when the browser never reached /accept. */
export async function reconcile() {
  const {client,address,chain}=connection(),leaseKey=`control/reconcile-${networkNamespace()}`,leaseId=randomUUID(),started=Date.now();
  let obtained=false;
  await update<{id?:string;until?:number}>(leaseKey,()=>({}),v=>{if(v.until&&v.until>Date.now())return v;v.id=leaseId;v.until=Date.now()+240_000;obtained=true;return v;});
  // CAS retries may have observed another owner's lease; verify the committed owner.
  if(!obtained||(await storage().get<{id:string}>(leaseKey))?.value.id!==leaseId)return;
  try{
  const head=await client.getBlockNumber(),scanKey=`control/scan-${chain.id}-${address}`;
  const cursor=await storage().get<{block:string}>(scanKey),knownDeployment=deployments[chain.id];
  const deployment=knownDeployment&&equal(knownDeployment.address,address)?knownDeployment:undefined;
  let from=cursor?BigInt(cursor.value.block):BigInt(deployment?.blockNumber||0);
  if(from>32n)from-=32n;
  // A bounded range keeps scheduled work short; repeated runs advance the cursor.
  const end=head<from+20_000n?head:from+20_000n;
  const logs=await client.getContractEvents({address,abi:nearlyHumanAbi,eventName:'DayRequested',fromBlock:from,toBlock:end,strict:true});
  let scanned=end;
  for(const event of logs){if(!event.transactionHash)continue;
    if(Date.now()-started>150_000){scanned=event.blockNumber>0n?event.blockNumber-1n:0n;break;}
    try{await acceptTransaction(event.transactionHash,event.args.player);}catch(e){if(!(e instanceof ServiceError))throw e;}
  }
  await storage().put(scanKey,{block:scanned.toString()});
  await reconcileAdmission();
  const keys=await storage().list('jobs/');
  for(const key of keys){const entry=await storage().get<JobControl>(key);if(!entry)continue;let c=entry.value;
    if(Date.now()-started>175_000)break;
    if(!sameNetwork(c))continue;
    if(isTerminal(c.phase))c=await refreshTerminal(c);
    if(!isTerminal(c.phase)&&(!c.lease||c.lease.until<Date.now()))await dispatchJob(c.requestId);
    else if(isTerminal(c.phase))await finishReservation(c.permitId,c.spentMicroUSD);
  }
  if(Date.now()-started<175_000)await pruneReplays();
  }finally{await update<{id?:string;until?:number}>(leaseKey,()=>({}),v=>{if(v.id===leaseId){delete v.id;delete v.until;}return v;}).catch(()=>{});}
}
async function pruneReplays() {
  const keys=await storage().list(`replays/${networkNamespace()}/`),cutoff=Date.now()-30*86400_000;
  let deleted=0;
  for(const key of keys){const existing=await storage().get<TokenPackets>(key);if(!existing)continue;
    const expired=Object.values(existing.value.days).filter(p=>p.day!==existing.value.latest&&p.supersededAt&&p.supersededAt<cutoff);
    for(const old of expired){
      // Unlink by CAS before deleting; the latest packet is always protected.
      const index=await update<TokenPackets>(key,()=>({days:{}}),i=>{if(i.latest!==old.day&&i.days[old.day]?.packet===old.packet)delete i.days[old.day];return i;});
      if(!index.days[old.day]){await storage().delete(old.packet);if(++deleted>=20)return;}
    }
  }
  // Diagnostics and checkpoints are not needed to watch a protected complete replay.
  const jobs=await storage().list('jobs/');
  for(const key of jobs){
    const stored=await storage().get<JobControl>(key);if(!stored||!sameNetwork(stored.value))continue;
    const c=stored.value,terminal=c.terminalAt||c.updatedAt;
    if(!isTerminal(c.phase)||c.compactedAt||terminal>cutoff)continue;
    const scratch=[...await storage().list(`diagnostics/${c.requestId}/`),...await storage().list(`checkpoints/${c.requestId}/`)];
    for(const item of scratch){await storage().delete(item);if(++deleted>=20)return;}
    await update<JobControl>(key,()=>c,v=>{if(isTerminal(v.phase)){v.allowances={};v.receiptKeys=[];delete v.checkpoint;v.compactedAt=Date.now();}return v;});
  }
}
