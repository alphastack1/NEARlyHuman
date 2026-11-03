import type {Hex} from 'viem';
import {storage,type DurableStore} from '../storage';
import {isHosted} from '../config';
import {dispatchBackground} from '../jobs';
import {updateV2Record} from '../v2/budget';
import {nearRuntime,nearConfigured,verifyNearRuntime,nearView,checkNearAccount} from './rpc';
import {nearRequestId} from './views';
import {issueNearQuote,nearJobId,nearJobPrefix,reconcileNearQuotes} from './quotes';
import {acceptNearJob,nearJobView,prepareNearJob,recordNearTerminal,settleNearJob,type NearJob} from './jobs';
import {NearError,type NearRequest,type NearDayRecord} from './types';

const terminal=(phase:string)=>['ready','failed','expired'].includes(phase);
function connection(){const runtime=nearRuntime(),campaignId=process.env.NEARLYHUMAN_NEAR_CAMPAIGN;if(!campaignId||!/^[a-z0-9][a-z0-9-]{1,79}$/.test(campaignId))throw new NearError('capacity','Preparation is resting. Try again shortly.',503);return {runtime,campaignId};}
export async function quoteNearOwnerDay(player:string,input:{tokenId:string;kitMask:string;shipping?:boolean}){const c=connection();return issueNearQuote(c.runtime,c.campaignId,player,input);}
async function ownerJob(id:Hex,player:string,store:DurableStore=storage()){
  const {runtime,campaignId}=connection(),job=(await store.get<NearJob>(nearJobId(runtime,id)))?.value;
  if(!job||job.campaignId!==campaignId||job.input.player!==player)throw new NearError('not_found','That day could not be found.',404);return job;
}
/** The authenticated owner view may resume an already admitted queued request.
 * A durable throttle prevents rapid polling from creating a dispatch loop. */
export async function maybeRedispatchNearQueued(id:string,dispatch:(id:string)=>Promise<unknown>,store:DurableStore=storage(),at=Date.now()){
  const initial=(await store.get<NearJob>(id))?.value;
  if(!initial||initial.phase!=='queued'||initial.lease&&initial.lease.until>at||at<(initial.nextWakeAt??initial.createdAt+5000))return false;
  let claimed=false;
  await updateV2Record<NearJob>(store,id,()=>{throw new NearError('not_found','That day could not be found.',404);},job=>{
    claimed=false;if(job.phase!=='queued'||job.lease&&job.lease.until>at||at<(job.nextWakeAt??job.createdAt+5000))return job;
    job.nextWakeAt=at+15000;claimed=true;return job;
  });
  if(claimed)try{await dispatch(id);}catch{/* The next durable wake retains the existing request. */}
  return claimed;
}
export async function getNearOwnerJob(idValue:unknown,playerValue:string){
  const id=nearRequestId(idValue),player=checkNearAccount(playerValue);
  try{const job=await ownerJob(id,player);if(job.phase==='queued')await maybeRedispatchNearQueued(job.id,dispatchNearJob);return nearJobView(job);}catch(error){if(!(error instanceof NearError)||error.code!=='not_found')throw error;}
  const {runtime}=connection(),{block}=await verifyNearRuntime(runtime),q=await nearView<NearRequest|null>(runtime,'request',{request_id:id},block);
  if(!q||q.player!==player||!q.status)throw new NearError('not_found','That day could not be found.',404);
  const saved=q.status===2?await nearView<NearDayRecord|null>(runtime,'day_record',{token_id:q.token_id,day:q.day},block):null;
  if(saved&&saved.request_id!==id)throw new NearError('context','The saved NEAR day changed.');
  return {networkId:'near-testnet' as const,requestId:id,tokenId:q.token_id,phase:q.status===2?'ready' as const:q.status===3?'failed' as const:q.status===4?'expired' as const:'queued' as const,decisions:0,updatedAt:Date.now(),...(saved?{commitment:saved.replay_commitment}:{}),retrySafe:q.status===3||q.status===4};
}
export async function acceptNearOwnerDay(playerValue:string,input:{transactionHash?:unknown;requestId?:unknown}){
  const player=checkNearAccount(playerValue),id=nearRequestId(input.requestId),c=connection();
  if(input.transactionHash!==undefined&&(typeof input.transactionHash!=='string'||input.transactionHash.length>64))throw new NearError('format','Choose the original NEAR payment.',400);
  const job=await acceptNearJob(c.runtime,c.campaignId,player,id,input.transactionHash as string|undefined);
  if(!terminal(job.phase))try{await dispatchNearJob(job.id);}catch{/* A durable admitted job is recoverable. */}
  return nearJobView(job);
}
export async function wakeNearOwnerDay(idValue:unknown,playerValue:string){
  const id=nearRequestId(idValue),player=checkNearAccount(playerValue);let job:NearJob;
  try{job=await ownerJob(id,player);}catch(error){
    if(!(error instanceof NearError)||error.code!=='not_found')throw error;
    const c=connection(),{block}=await verifyNearRuntime(c.runtime),q=await nearView<NearRequest|null>(c.runtime,'request',{request_id:id},block);
    if(!q||q.player!==player)throw new NearError('not_found','That day could not be found.',404);
    if(q.status===1){job=await acceptNearJob(c.runtime,c.campaignId,player,id);}
    else {await reconcileNearQuotes(c.runtime,c.campaignId);return getNearOwnerJob(id,player);}
  }
  if(!terminal(job.phase))await dispatchNearJob(job.id);return nearJobView(job);
}
const localRunning=new Set<string>();
export async function dispatchNearJob(id:string){
  const c=connection();if(!id.startsWith(nearJobPrefix(c.runtime))||!/^0x[0-9a-f]{64}$/.test(id.slice(nearJobPrefix(c.runtime).length)))throw new NearError('context','The queued NEAR world changed.');
  if(isHosted())return dispatchBackground({version:2,jobId:id});
  if(localRunning.has(id))return;localRunning.add(id);setTimeout(()=>{void runNearQueueJob(id).catch(()=>{}).finally(()=>localRunning.delete(id));},0);
}
export async function runNearQueueJob(id:string){
  const {runtime,campaignId}=connection(),store=storage();
  if(!id.startsWith(nearJobPrefix(runtime))||!/^0x[0-9a-f]{64}$/.test(id.slice(nearJobPrefix(runtime).length)))throw new NearError('context','The queued NEAR world changed.');
  let job=(await store.get<NearJob>(id))?.value;
  if(!job||job.campaignId!==campaignId||job.input.runtime.collection!==runtime.collection)throw new NearError('context','The queued NEAR day belongs to another world.');
  if(await recordNearTerminal(runtime,job,store))return nearJobView((await store.get<NearJob>(id))!.value);
  const {block}=await verifyNearRuntime(runtime);
  if(BigInt(block.timestamp)>BigInt(job.input.deadline)&&!terminal(job.phase))job=await updateV2Record<NearJob>(store,id,()=>{throw Error('Missing NEAR day');},j=>{if(j.lease&&j.lease.until>Date.now())return j;j.phase='expiry_due';delete j.lease;j.updatedAt=Date.now();return j;});
  if(['queued','preparing'].includes(job.phase)){
    if(job.lease&&job.lease.until>Date.now())return nearJobView(job);
    try{await prepareNearJob(id,store);}catch{/* Inspect the durable phase below. */}
  }
  job=(await store.get<NearJob>(id))!.value;
  if(['prepared','saving','failure_due','expiry_due'].includes(job.phase))try{await settleNearJob(runtime,id,store);}catch{/* Original signed outbox and reservations remain durable. */}
  return nearJobView((await store.get<NearJob>(id))!.value);
}
export async function reconcileNearService(){
  if(!nearConfigured()||!process.env.NEARLYHUMAN_NEAR_CAMPAIGN)return;
  const {runtime,campaignId}=connection(),store=storage();
  const quotes=await reconcileNearQuotes(runtime,campaignId,store);let dispatched=0;
  for(const id of await store.list(nearJobPrefix(runtime))){const job=(await store.get<NearJob>(id))?.value;if(!job||terminal(job.phase)||job.lease&&job.lease.until>Date.now())continue;if(++dispatched>8)break;try{await dispatchNearJob(id);}catch{/* Next bounded reconciliation retains this request. */}}
  return {quotes,dispatched:Math.min(dispatched,8)};
}
