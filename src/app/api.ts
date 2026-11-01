import type { DayResult, GameState, ItemId, Stats, Receipt, RecentAction } from '../domain';
import type { Hex } from 'viem';

export interface PublicConfig { chainId:number; chainName:string; rpcUrl:string; explorerUrl:string; collection:Hex; testnet:boolean; model:string; multiplier:number }
export interface Rooster { id:string; owner:string; revision:number; state:GameState; pending?:{ id:string; deadline:number; status:string }; latestDay:number }
export interface JobView { requestId:string; tokenId:string; phase:'queued'|'preparing'|'saving'|'ready'|'failed'|'recording_failure'|'expired'|'checking'|'unaccepted'; decisions:number; slot:number; updatedAt:number; latestChoice?:Receipt['choice']; ownerTx?:Hex; finalTx?:Hex; message?:string; retrySafe?:boolean; operation?:'mint'|'day' }
export interface QuoteView { permit:Record<string,unknown>; signature:Hex; value:string; networkEstimate:string; totalEstimate:string; expiresAt:number }
export type CompactHistoryEntry = RecentAction & { outcome:number };
export interface SavedDay { day:number; level:number; alive:boolean; deathCause?:GameState['deathCause']; savedAt:number; requestId:Hex; replayCommitment:Hex; requestTx?:Hex; saveTx?:Hex; replayAvailable?:boolean; protected:boolean; retentionEnd?:number }
export interface SavedDaysPage { rooster:Rooster; days:SavedDay[]; nextBefore?:number }
export interface SavedOutcome { rooster:Rooster; summary:string[]; history:CompactHistoryEntry[]; savedDay?:SavedDay }
export class ApiError extends Error { constructor(message:string,public code:string,public status:number) { super(message); } }
let session='';
export function setSession(value:string) { session=value; }
async function request<T>(path:string,body?:unknown):Promise<T> {
  const response=await fetch('/api'+path,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(session?{Authorization:'Bearer '+session}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  let result:any;try{result=await response.json();}catch{throw new ApiError('Connection interrupted. Please try again.','connection',response.status);}
  if(!response.ok)throw new ApiError(result.error?.message||'Please try again.',result.error?.code||'unavailable',response.status);
  return result as T;
}
export const api={
  config:()=>request<PublicConfig>('/config'),
  challenge:(address:string)=>request<{id:string;message:string}>('/auth/challenge',{address}),
  authenticate:(address:string,id:string,signature:string)=>request<{token:string;expiresAt:number}>('/auth/verify',{address,id,signature}),
  roosters:(address:string)=>request<{roosters:Rooster[]}>('/roosters?owner='+encodeURIComponent(address)),
  rooster:(id:string)=>request<{rooster:Rooster}>('/rooster/'+encodeURIComponent(id)),
  quote:(input:{operation:'mint'|'day';name?:string;stats?:Stats;tokenId?:string;delivery?:ItemId[]})=>request<QuoteView>('/quote',input),
  accept:(transactionHash:Hex)=>request<{requestId:string;tokenId:string}>('/accept',{transactionHash}),
  job:(id:string)=>request<JobView>('/job/'+encodeURIComponent(id)),
  wake:(id:string)=>request<JobView>('/wake',{requestId:id}),
  replay:(tokenId:string,day?:number)=>request<{result:DayResult;commitment:Hex}>('/replay/'+encodeURIComponent(tokenId)+(day?'?day='+day:'')),
  days:(tokenId:string,before?:number)=>request<SavedDaysPage>('/days/'+encodeURIComponent(tokenId)+(before?'?before='+before:'')),
  outcome:(tokenId:string,day?:number)=>request<SavedOutcome>('/outcome/'+encodeURIComponent(tokenId)+(day?'?day='+day:'')),
};
