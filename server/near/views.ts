import {keccak256,toHex,formatUnits,type Hex} from 'viem';
import {decodeState,encodeState,encodeTrace,expandV2History} from '../../src/v2';
import {roosterTraits} from '../../src/art/rooster';
import type {NearPublicConfig,NearPublicLife,NearPublicDay,NearPublicRequest,NearOwnerQuote,GameDaysPage} from '../../src/chain/game-types';
import {storage,type DurableStore} from '../storage';
import {nearRuntime,verifyNearRuntime,nearView,checkNearAccount} from './rpc';
import {NearError,type NearRuntime,type NearBlock,type NearLife,type NearRequest,type NearDayRecord} from './types';

export const nearTokenId=(value:unknown):string=>{if(typeof value!=='string'||!/^[1-9]\d{0,19}$/.test(value)||BigInt(value)>=1n<<64n)throw new NearError('not_found','No rooster has that number.',404);return value;};
export const nearRequestId=(value:unknown):Hex=>{if(typeof value!=='string'||!/^0x[0-9a-f]{64}$/.test(value)||/^0x0{64}$/.test(value))throw new NearError('not_found','That day could not be found.',404);return value as Hex;};
export const nearPacketKey=(runtime:NearRuntime,commitment:Hex)=>`near/v2/packets/${runtime.networkId}/${runtime.collection}/${commitment}`;
export function nearMaxProcessingFee():bigint{const value=process.env.NEARLYHUMAN_NEAR_MAX_PROCESSING_FEE||'200000000000000000000000';if(!/^[1-9]\d{0,24}$/.test(value)||BigInt(value)>10n**24n)throw new NearError('connection','The NEAR preparation fee needs another check.',503);return BigInt(value);}
export async function readNearPublicConfig():Promise<NearPublicConfig>{
  const {runtime:r,config:c}=await verifyNearRuntime();
  const guestId=process.env.NEARLYHUMAN_NEAR_GUEST_ID,guestDay=process.env.NEARLYHUMAN_NEAR_GUEST_DAY;
  return {version:2,networkId:'near-testnet',network:'testnet',testnet:true,collection:r.collection,rpcUrl:r.rpcUrl,codeHash:r.codeHash,rulesHash:r.rulesHash,decisionConfig:r.decisionConfig,relayer:r.relayer,quoteSigner:r.quoteSigner,token:r.collection,tokenDecimals:6,nativeMintPrice:c.native_mint_price,storageDeposit:c.storage_deposit,maxProcessingFee:nearMaxProcessingFee().toString(),tokenMintPriceMicro:c.token_mint_price_micro,multiplier:c.multiplier,availableNetworks:['near-testnet'],...(guestId?{guest:{id:nearTokenId(guestId),...(guestDay?{day:Number(guestDay)}:{})}}:{})};
}
export function mapNearLife(raw:NearLife,block:NearBlock,runtime:NearRuntime):NearPublicLife{
  const state=decodeState(raw.state);if(raw.appearance_seed!==state.seed||!Number.isInteger(raw.revision)||raw.revision<0)throw new NearError('context','The saved NEAR life needs another check.');
  checkNearAccount(raw.owner_id);nearTokenId(raw.token_id);if(!/^(0|[1-9]\d*)$/.test(raw.purse_micro)||!/^(0|[1-9]\d*)$/.test(raw.purse_nonce))throw new NearError('context','The saved purse needs another check.');
  return {version:2,networkId:'near-testnet',collection:runtime.collection,id:raw.token_id,owner:raw.owner_id,name:raw.name,revision:raw.revision,state,purseMicro:raw.purse_micro,purseNonce:raw.purse_nonce,...(raw.pending_request&&!/^0x0{64}$/.test(raw.pending_request)?{pendingRequest:nearRequestId(raw.pending_request)}:{}),observedBlock:block.height,observedBlockHash:block.hash};
}
export async function readNearPublicLife(idValue:string,runtime=nearRuntime(),at?:NearBlock):Promise<NearPublicLife>{
  const id=nearTokenId(idValue),{block}=at?{block:at}:await verifyNearRuntime(runtime),raw=await nearView<NearLife|null>(runtime,'life',{token_id:id},block);
  if(!raw)throw new NearError('not_found','No rooster has that number.',404);return mapNearLife(raw,block,runtime);
}
export async function readNearPublicLives(ownerValue:string,cursor='0',runtime=nearRuntime()){
  const owner=checkNearAccount(ownerValue);if(!/^(0|[1-9]\d{0,19})$/.test(cursor))throw new NearError('format','Open your roosters again.',400);
  const {block}=await verifyNearRuntime(runtime),list=await nearView<{token_ids:string[];next_cursor:string|null}>(runtime,'owned_tokens',{owner_id:owner,cursor,limit:8},block);
  if(!Array.isArray(list.token_ids)||list.token_ids.length>8)throw new NearError('context','The NEAR collection needs another check.');
  const lives=await Promise.all(list.token_ids.map(id=>readNearPublicLife(id,runtime,block)));if(lives.some(l=>l.owner!==owner))throw new NearError('context','The NEAR ownership changed.');
  return {lives,...(list.token_ids.length===8&&list.next_cursor&&list.next_cursor!==cursor?{nextCursor:list.next_cursor}:{})};
}
export async function readNearPublicRequest(value:unknown,runtime=nearRuntime()):Promise<NearPublicRequest>{
  const id=nearRequestId(value),{block}=await verifyNearRuntime(runtime),q=await nearView<NearRequest|null>(runtime,'request',{request_id:id},block);
  if(!q||!q.status)throw new NearError('not_found','That day could not be found.',404);
  return {requestId:id,tokenId:q.token_id,player:q.player,day:q.day,deadline:q.deadline,acceptedAt:q.accepted_at,status:q.status,chainTimestamp:block.timestamp};
}
export async function readNearPublicDays(idValue:string,before?:number,runtime=nearRuntime()):Promise<GameDaysPage>{
  const life=await readNearPublicLife(idValue,runtime);if(before!==undefined&&(!Number.isInteger(before)||before<1||before>0xffffffff))throw new NearError('not_found','That day could not be found.',404);
  const start=Math.min(life.state.day,before?before-1:life.state.day),days=[];
  for(let day=start;day>Math.max(0,start-12);day--){const record=await nearView<NearDayRecord|null>(runtime,'day_record',{token_id:life.id,day},{height:life.observedBlock,hash:life.observedBlockHash!,timestamp:'0'});if(!record)throw new NearError('context','A saved NEAR day is missing.');days.push({day,rewardMicro:record.reward,requestId:record.request_id,commitment:record.replay_commitment});}
  return {days,...(start>12?{nextBefore:start-11}:{})};
}
export async function readNearPublicDay(idValue:string,dayValue:number|undefined,runtime=nearRuntime()):Promise<NearPublicDay>{
  const life=await readNearPublicLife(idValue,runtime),day=dayValue??life.state.day;if(!Number.isInteger(day)||day<1||day>life.state.day)throw new NearError('not_found','That day could not be found.',404);
  const record=await nearView<NearDayRecord|null>(runtime,'day_record',{token_id:life.id,day},{height:life.observedBlock,hash:life.observedBlockHash!,timestamp:'0'});
  if(!record)throw new NearError('not_found','That day could not be found.',404);const trace=expandV2History(record.history);
  if(keccak256(encodeTrace(trace))!==record.trace_hash)throw new NearError('context','The saved action history changed.');
  return {life,day,requestId:record.request_id,seed:record.seed,stateHash:record.state_hash,traceHash:record.trace_hash,certificateHash:record.certificate_hash,commitment:record.replay_commitment,rewardMicro:record.reward,trace};
}
export async function readNearPublicReplay(id:string,day?:number,runtime=nearRuntime(),store:DurableStore=storage()){
  const saved=await readNearPublicDay(id,day,runtime);
  const packet=(await store.get<any>(nearPacketKey(runtime,saved.commitment)))?.value;
  if(!packet)throw new NearError('replay_unavailable','This saved day is still being checked.',404);
  // Current code/policy still authenticates the connection. A saved film belongs
  // to its immutable settled request's policy, which can predate that runtime.
  // Use the same finalized block as the life and day record, including after a
  // transfer: the request's former player need not equal the NFT's current owner.
  const accepted=await nearView<NearRequest|null>(runtime,'request',{request_id:nearRequestId(saved.requestId)},{height:saved.life.observedBlock,hash:saved.life.observedBlockHash!,timestamp:'0'});
  if(!accepted||accepted.status!==2||accepted.request_id!==saved.requestId||accepted.token_id!==saved.life.id||accepted.day!==saved.day||accepted.day_seed!==saved.seed
    ||keccak256(toHex(JSON.stringify(packet)))!==saved.commitment||packet.requestId!==saved.requestId||packet.decisionConfig!==accepted.decision_config||packet.stateHash!==saved.stateHash||keccak256(packet.state)!==saved.stateHash||keccak256(packet.trace)!==saved.traceHash||keccak256(packet.certificate)!==saved.certificateHash||packet.result.state.day!==saved.day||encodeState(packet.result.state)!==packet.state||encodeTrace(packet.result.trace)!==packet.trace||packet.rewardMicro!==saved.rewardMicro)throw new NearError('context','The saved NEAR film needs another check.');
  return {life:saved.life,packet,commitment:saved.commitment};
}
export async function readNearPublicGuest(){const config=await readNearPublicConfig();if(!config.guest)throw new NearError('not_found','No saved example is here yet.',404);return readNearPublicReplay(config.guest.id,config.guest.day);}
export function nearNftMetadata(life:NearPublicLife,origin:string){
  const world=new URLSearchParams({networkId:'near-testnet',collection:life.collection}).toString(),traits=roosterTraits(life.state.seed);
  return {name:`${life.name} #${life.id}`,description:'An AI-led rooster NFT with a saved home, inventory and token purse. Its portrait reflects its recorded life.',image:`${origin}/api/near/v2/nft/${life.id}/image.svg?${world}`,external_url:`${origin}/life/near-testnet/${life.id}`,attributes:[{trait_type:'Life',value:life.state.alive?'Alive':'Remembered'},{trait_type:'Level',value:life.state.level},{trait_type:'Game day',value:life.state.day},{trait_type:'Purse',value:formatUnits(BigInt(life.purseMicro),6)},...['Body','Wits','Spirit'].map((name,i)=>({trait_type:name,value:life.state.stats[i]})),{trait_type:'Ready beds',value:life.state.plots.filter(p=>p.kind&&p.ticks===0).length},{trait_type:'Headgear',value:traits.headgear}]};
}
