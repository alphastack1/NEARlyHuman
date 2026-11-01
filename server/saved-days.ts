import { zeroHash, type Hex } from 'viem';
import { nearlyHumanAbi } from '../src/chain/abi';
import { decodeHistory, DEATH_CAUSES } from '../src/domain/codec';
import type { SavedDay, SavedDaysPage, SavedOutcome } from '../src/app/api';
import { checkedToken, connection, pinnedRead, readRawRooster, roosterView, ServiceError } from './chain';
import { storage } from './storage';

interface ReplayEntry { commitment:Hex; supersededAt?:number }
interface ReplayIndex { days:Record<string,ReplayEntry> }
interface JobEvidence { chainId:number; collection:string; requestId:Hex; commitment?:Hex; ownerTx?:Hex; finalTx?:Hex }
async function context(value:string) {
  const token=checkedToken(value), snapshot=await readRawRooster(token), connected=connection();
  const {client,address}=connected;
  const pending=snapshot.raw.pendingRequest===zeroHash?undefined:await pinnedRead(()=>client.readContract({address,abi:nearlyHumanAbi,functionName:'getRequest',args:[snapshot.raw.pendingRequest],blockNumber:snapshot.block.number}));
  const rooster=roosterView(token,snapshot.raw,snapshot.owner,pending);
  return {...connected,...snapshot,token,rooster};
}
type Context=Awaited<ReturnType<typeof context>>;
async function dayRecord(c:Context,day:number) {
  const [summary,history]=await pinnedRead(()=>c.client.readContract({address:c.address,abi:nearlyHumanAbi,functionName:'getDay',args:[c.token,day],blockNumber:c.block.number}));
  if(summary.day!==day||summary.requestId===zeroHash)throw new ServiceError('This day has not been saved.','not_found',404);
  return {summary,history};
}
async function verifyBlock(c:Context) {
  const block=await c.client.getBlock({blockNumber:c.block.number});
  if(block.hash!==c.block.hash)throw new ServiceError('Checking the saved days. Please try again.','checking',409);
}
async function replayIndex(c:Context) {
  // A storage interruption must not hide the compact history already onchain.
  try { return (await storage().get<ReplayIndex>(`replays/${c.chain.id}-${c.address.toLowerCase()}/${c.token}`))?.value??null; }
  catch { return undefined; }
}
async function metadata(c:Context,record:Awaited<ReturnType<typeof dayRecord>>,index:ReplayIndex|null|undefined):Promise<SavedDay> {
  const s=record.summary,entry=index?.days[s.day];
  let job:JobEvidence|undefined;
  try { job=(await storage().get<JobEvidence>('jobs/'+s.requestId.toLowerCase()))?.value; } catch { /* Explorer links remain available from the NFT itself. */ }
  const verified=job?.chainId===c.chain.id&&job.collection.toLowerCase()===c.address.toLowerCase()&&job.requestId===s.requestId&&job.commitment===s.replayCommitment;
  return {day:s.day,level:s.level,alive:s.alive,deathCause:DEATH_CAUSES[s.deathCause],savedAt:Number(s.savedAt),requestId:s.requestId,replayCommitment:s.replayCommitment,
    requestTx:verified?job?.ownerTx:undefined,saveTx:verified?job?.finalTx:undefined,
    replayAvailable:index===undefined?undefined:!!entry&&entry.commitment===s.replayCommitment,protected:s.day===c.raw.day,
    retentionEnd:s.day!==c.raw.day&&entry?.supersededAt?entry.supersededAt+30*86400_000:undefined};
}

/** At most ten rows: no full replay packets or provider calls are loaded for browsing. */
export async function readSavedDays(value:string,before?:number):Promise<SavedDaysPage> {
  const c=await context(value);
  if(before!==undefined&&(!Number.isInteger(before)||before<1||before>0x1_0000_0000))throw new ServiceError('Choose a saved day.','day');
  const first=Math.min(c.raw.day,(before??c.raw.day+1)-1),numbers=Array.from({length:Math.min(10,first)},(_,i)=>first-i);
  const index=await replayIndex(c),days:SavedDay[]=[];
  for(let i=0;i<numbers.length;i+=5){const batch=await Promise.all(numbers.slice(i,i+5).map(async day=>metadata(c,await dayRecord(c,day),index)));days.push(...batch);}
  await verifyBlock(c);
  const last=days.at(-1)?.day;
  return {rooster:c.rooster,days,nextBefore:last&&last>1?last:undefined};
}

export async function readSavedOutcome(value:string,dayValue?:number):Promise<SavedOutcome> {
  const c=await context(value),day=dayValue??c.raw.day;
  if(day===0&&dayValue===undefined)return {rooster:c.rooster,summary:['A new life is ready to begin.'],history:[]};
  if(!Number.isInteger(day)||day<1||day>c.raw.day)throw new ServiceError('This day has not been saved.','not_found',404);
  const record=await dayRecord(c,day),savedDay=await metadata(c,record,await replayIndex(c));await verifyBlock(c);
  return {rooster:c.rooster,savedDay,summary:savedDay.alive?[`Day ${day} survived.`,`Level ${savedDay.level}.`]:[`This life ended on game day ${day}.`,`Final level ${savedDay.level}.`],history:decodeHistory(record.history)};
}
