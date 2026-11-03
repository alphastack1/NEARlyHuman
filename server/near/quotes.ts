import {keccak256,toHex,type Hex} from 'viem';
import {decodeState,kitItems} from '../../src/v2';
import type {NearOwnerQuote} from '../../src/chain/game-types';
import {nearAdmissionMessage as sharedNearAdmissionMessage} from '../../src/chain/near-admission';
import {storage,type DurableStore} from '../storage';
import {reserveV2JobBudget,finishV2JobBudget,updateV2Record} from '../v2/budget';
import {nearView,nearRpc,verifyNearRuntime,checkNearAccount} from './rpc';
import {nearMaxProcessingFee,nearTokenId} from './views';
import {nativeRelaySigner} from './relay';
import {NearError,type NearRuntime,type NearAdmission,type NearLife,type NearRequest} from './types';

export interface NearQuoteRecord {scope:string;campaignId:string;generation:number;id:Hex;expiresAt:string;status:'held'|'retiring'|'retired';player:string;tokenId:string;baseRevision:number}
interface GasLedger {unit:'yoctoNEAR';holds:Record<string,string>}
export const nearJobPrefix=(r:NearRuntime)=>`near/v2/jobs/${r.networkId}/${r.collection}/`;
export const nearJobId=(r:NearRuntime,id:Hex)=>nearJobPrefix(r)+id;
const quotePrefix=(r:NearRuntime)=>`near/v2/quotes/${r.networkId}/${r.collection}/`;
const quoteIndex=(r:NearRuntime,id:Hex)=>`near/v2/admissions/${r.networkId}/${r.collection}/${id}`;
const gasKey=(r:NearRuntime)=>`near/v2/control/relay-gas/${r.networkId}/${r.relayer}`;
const uint=(value:unknown)=>typeof value==='string'&&/^(0|[1-9]\d*)$/.test(value);
export function nearAdmissionMessage(runtime:NearRuntime,a:NearAdmission):Buffer{
  checkNearAccount(a.player);nearTokenId(a.tokenId);if(!/^0x[0-9a-f]{64}$/.test(a.id)||!/^0x[0-9a-f]{64}$/.test(a.decisionConfig)||!uint(a.kitMask)||!uint(a.processingFee)||!uint(a.expiresAt)||!Number.isInteger(a.baseRevision)||a.baseRevision<0||!Number.isInteger(a.multiplier)||a.multiplier<1||a.multiplier>20)throw new NearError('context','The NEAR admission needs another check.');
  return Buffer.from(sharedNearAdmissionMessage(runtime.collection,a),'utf8');
}
function gasBasis(name:string,fallback:bigint,max:bigint){const raw=process.env[name]||fallback.toString();if(!/^[1-9]\d{0,15}$/.test(raw)||BigInt(raw)>max||BigInt(raw)<1000000000000n)throw new NearError('connection','The NEAR gas estimate needs another check.',503);return BigInt(raw);}
export function calculateNearFee(gasPrice:bigint,multiplier:number,storageFloor:bigint){
  if(gasPrice<=0n||gasPrice>10n**13n||!Number.isInteger(multiplier)||multiplier<1||multiplier>20||storageFloor<0n)throw new NearError('context','The NEAR fee inputs changed.');
  // Actual measured execution basis is distinct from the signed transaction's
  // 300 Tgas ceiling. The separate relay ledger still funds that full ceiling.
  const requestGas=gasBasis('NEARLYHUMAN_NEAR_REQUEST_GAS_BASIS',8000000000000n,80000000000000n),relayGas=gasBasis('NEARLYHUMAN_NEAR_SETTLE_GAS_BASIS',10000000000000n,300000000000000n),networkEstimate=requestGas*gasPrice,relayReserve=300000000000000n*gasPrice*2n;
  const processingFee=(relayGas*gasPrice*125n*BigInt(multiplier)+99n)/100n+storageFloor;
  return {networkEstimate,relayReserve,processingFee,totalEstimate:networkEstimate+processingFee};
}
export async function issueNearQuote(runtime:NearRuntime,campaignId:string,playerValue:string,input:{tokenId:string;kitMask:string;shipping?:boolean},store:DurableStore=storage()):Promise<NearOwnerQuote>{
  const player=checkNearAccount(playerValue),tokenId=nearTokenId(input.tokenId);if(!uint(input.kitMask)||BigInt(input.kitMask)>=1n<<64n||input.shipping!==undefined&&typeof input.shipping!=='boolean')throw new NearError('format','Choose the supplies again.',400);
  let gifts:number[];try{gifts=kitItems(BigInt(input.kitMask));}catch{throw new NearError('format','Choose up to three supplies and one starter.',400);}
  const {block,config}=await verifyNearRuntime(runtime),signer=nativeRelaySigner(runtime);
  const [life,market,gasPrice,relay,owner,protocol,relayAccess]=await Promise.all([
    nearView<NearLife|null>(runtime,'life',{token_id:tokenId},block),nearView<{maximum:string;pressure:string;capacity:string}>(runtime,'quote_day',{token_id:tokenId},block),
    nearRpc<{gas_price:string}>(runtime,'gas_price',[block.hash]),nearRpc<{amount:string;locked:string;storage_usage:number}>(runtime,'query',{request_type:'view_account',account_id:runtime.relayer,block_id:block.hash}),
    nearRpc<{amount:string;locked:string;storage_usage:number}>(runtime,'query',{request_type:'view_account',account_id:player,block_id:block.hash}),
    nearRpc<{runtime_config:{storage_amount_per_byte:string}}>(runtime,'EXPERIMENTAL_protocol_config',{block_id:block.hash}),
    nearRpc<{permission:'FullAccess'|{FunctionCall:{receiver_id:string;method_names:string[];allowance:string|null}}}>(runtime,'query',{request_type:'view_access_key',account_id:runtime.relayer,public_key:signer.getPublicKey().toString(),block_id:block.hash}),
  ]);
  if(!life||life.owner_id!==player||life.pending_request||config.admissions_paused)throw new NearError('context','This life cannot accept another day yet.');
  const state=decodeState(life.state);if(!state.alive||gifts.some(i=>state.inventory[i]!>=0xffffffff))throw new NearError('context','Review this life before starting another day.');
  const storageFloor=BigInt(config.min_processing_fee||'20000000000000000000000'),fees=calculateNearFee(BigInt(gasPrice.gas_price),config.multiplier,storageFloor);
  if(fees.processingFee>nearMaxProcessingFee())throw new NearError('connection','The NEAR fee needs another check.',503);
  const permission=relayAccess.permission,limited=typeof permission==='object'?permission.FunctionCall:undefined;
  if(permission!=='FullAccess'&&(!limited||limited.receiver_id!==runtime.collection||!Array.isArray(limited.method_names)||limited.method_names.length>0&&!['finalize','fail','expire'].every(name=>limited.method_names.includes(name))||limited.allowance!==null&&!uint(limited.allowance)))throw new NearError('connection','The NEAR preparation key needs another check.',503);
  if(!uint(protocol.runtime_config?.storage_amount_per_byte))throw new NearError('connection','The NEAR storage price needs another check.',503);
  const availableBalance=(account:typeof owner)=>BigInt(account.amount)-BigInt(account.storage_usage)*BigInt(protocol.runtime_config.storage_amount_per_byte);
  if(availableBalance(owner)<fees.processingFee+fees.networkEstimate*2n)throw new NearError('funds','This wallet needs test NEAR.',400);
  const scope=`${runtime.networkId}:${runtime.collection}:${player}:${tokenId}:${life.revision}`,key=quotePrefix(runtime)+keccak256(toHex(scope));
  const prior=(await store.get<NearQuoteRecord>(key))?.value;
  if(prior&&prior.status!=='retired'){
    const q=await nearView<NearRequest|null>(runtime,'request',{request_id:prior.id},block);
    if(q&&q.status>=2||!q&&BigInt(block.timestamp)>BigInt(prior.expiresAt))await retireNearQuote(runtime,key,campaignId,store);
    else if(q)throw new NearError('context','This life already has a day being prepared.');
  }
  const record=await updateV2Record<NearQuoteRecord>(store,key,()=>({scope,campaignId,generation:0,id:keccak256(toHex('NEARLYHUMAN_QUOTE_V2\n'+scope+'\n0')),expiresAt:'0',status:'held',player,tokenId,baseRevision:life.revision}),q=>{
    if(q.scope!==scope||q.player!==player||q.tokenId!==tokenId||q.baseRevision!==life.revision||q.status==='retiring'||q.status!=='retired'&&q.campaignId!==campaignId)throw new NearError('context','Checking the earlier NEAR quote.');
    if(q.status==='retired'){q.generation++;q.id=keccak256(toHex('NEARLYHUMAN_QUOTE_V2\n'+scope+'\n'+q.generation));q.status='held';q.campaignId=campaignId;}
    const next=BigInt(block.timestamp)+120n;if(next>BigInt(q.expiresAt))q.expiresAt=next.toString();return q;
  });
  const id=nearJobId(runtime,record.id);await reserveV2JobBudget(campaignId,id,store);
  await updateV2Record<GasLedger>(store,gasKey(runtime),()=>({unit:'yoctoNEAR',holds:{}}),ledger=>{
    if(ledger.unit!=='yoctoNEAR'||Object.values(ledger.holds).some(v=>!uint(v)))throw new NearError('context','The NEAR relay accounting changed.');
    const amount=BigInt(ledger.holds[id]||'0')>fees.relayReserve?BigInt(ledger.holds[id]!):fees.relayReserve;
    const capacity=limited?.allowance!==null&&limited?.allowance!==undefined&&BigInt(limited.allowance)<availableBalance(relay)?BigInt(limited.allowance):availableBalance(relay);
    if(Object.entries(ledger.holds).filter(([k])=>k!==id).reduce((n,[,v])=>n+BigInt(v),0n)+amount>capacity)throw new NearError('connection','Preparation needs more NEAR relay capacity.',503);
    ledger.holds[id]=amount.toString();return ledger;
  });
  const admission:NearAdmission={id:record.id,player,tokenId,baseRevision:life.revision,kitMask:input.kitMask,shipping:input.shipping!==false&&BigInt(market.maximum)<=BigInt(market.capacity),processingFee:fees.processingFee.toString(),multiplier:config.multiplier,expiresAt:record.expiresAt,decisionConfig:runtime.decisionConfig};
  const index={quoteKey:key,campaignId,scope};const existing=await store.get<typeof index>(quoteIndex(runtime,record.id));
  if(existing&&JSON.stringify(existing.value)!==JSON.stringify(index)||!existing&&!await store.put(quoteIndex(runtime,record.id),index,{isNew:true})&&JSON.stringify((await store.get<typeof index>(quoteIndex(runtime,record.id)))?.value)!==JSON.stringify(index))throw new NearError('context','The NEAR quote index changed.');
  const signature=Buffer.from(signer.sign(nearAdmissionMessage(runtime,admission)).signature).toString('base64');
  return {networkId:'near-testnet',collection:runtime.collection,admission,signature,value:admission.processingFee,networkEstimate:fees.networkEstimate.toString(),totalEstimate:fees.totalEstimate.toString(),expiresAt:admission.expiresAt,marketBusy:BigInt(market.maximum)>BigInt(market.capacity),pressure:market.pressure,maximumReward:market.maximum};
}
export async function nearQuoteForRequest(runtime:NearRuntime,id:Hex,store:DurableStore=storage()){
  const index=(await store.get<{quoteKey:string;campaignId:string;scope:string}>(quoteIndex(runtime,id)))?.value;
  if(!index||!index.quoteKey.startsWith(quotePrefix(runtime)))throw new NearError('context','This NEAR admission has no reserved preparation.');
  const record=(await store.get<NearQuoteRecord>(index.quoteKey))?.value;
  if(!record||record.id!==id||record.scope!==index.scope||record.campaignId!==index.campaignId||record.status!=='held')throw new NearError('context','The NEAR admission allowance changed.');return {...index,record};
}
export async function retireNearQuote(runtime:NearRuntime,key:string,campaignId:string,store:DurableStore=storage()){
  if(!key.startsWith(quotePrefix(runtime)))throw new NearError('context','The quote belongs to another world.');
  const record=(await store.get<NearQuoteRecord>(key))?.value;if(!record||record.status==='retired')return;
  if(record.campaignId!==campaignId)throw new NearError('context','The NEAR quote allocation changed.');
  const {block}=await verifyNearRuntime(runtime),q=await nearView<NearRequest|null>(runtime,'request',{request_id:record.id},block);
  if(q&&q.status<2||!q&&BigInt(block.timestamp)<=BigInt(record.expiresAt))throw new NearError('pending','This NEAR admission is still being checked.');
  await updateV2Record<NearQuoteRecord>(store,key,()=>{throw new NearError('context','The NEAR quote is missing.');},q=>{if(q.id!==record.id||q.expiresAt!==record.expiresAt)throw new NearError('context','The NEAR quote changed.');q.status='retiring';return q;});
  const id=nearJobId(runtime,record.id);await finishV2JobBudget(campaignId,id,store,true);
  await updateV2Record<GasLedger>(store,gasKey(runtime),()=>({unit:'yoctoNEAR',holds:{}}),ledger=>{if(ledger.unit!=='yoctoNEAR')throw new NearError('context','The NEAR relay accounting changed.');delete ledger.holds[id];return ledger;});
  await updateV2Record<NearQuoteRecord>(store,key,()=>{throw new NearError('context','The NEAR quote is missing.');},q=>{if(q.id!==record.id||q.status!=='retiring')throw new NearError('context','The NEAR quote changed.');q.status='retired';return q;});
}
export async function reconcileNearQuotes(runtime:NearRuntime,campaignId:string,store:DurableStore=storage()){
  let checked=0,retired=0,waiting=0;
  for(const key of await store.list(quotePrefix(runtime))){const q=(await store.get<NearQuoteRecord>(key))?.value;if(!q||q.status==='retired'||q.campaignId!==campaignId)continue;if(++checked>8)break;try{await retireNearQuote(runtime,key,campaignId,store);retired++;}catch(error){if(error instanceof NearError&&['pending','connection'].includes(error.code)){waiting++;continue;}throw error;}}
  return {checked:Math.min(8,checked),retired,waiting};
}
