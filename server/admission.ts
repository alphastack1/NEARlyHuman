import { randomBytes } from 'node:crypto';
import { encodeFunctionData, keccak256, toHex, zeroHash, type Address, type Hex } from 'viem';
import { nearlyHumanAbi } from '../src/chain/abi';
import { encodeDelivery, mintParametersHash, permitToJSON, permitTypedData, permitValue, type AdmissionPermit } from '../src/chain/permit';
import { ITEM_IDS, normalizeName, validateDelivery, validateStats, type Stats } from '../src/domain';
import type { QuoteView } from '../src/app/api';
import { checkedAddress, checkedToken, connection, pinnedRead, readRawRooster, roosterView, serviceAccount, ServiceError, verifyConnection } from './chain';
import { serverConfig } from './config';
import { storage, update } from './storage';
import { estimateError } from './estimate-error';
import { recoverMissingAcceptance } from './acceptance';
import type { JobControl } from './jobs';
import { INDIVIDUALITY_VERSION } from '../src/domain/individuality';
import { DECISION_POLICY_VERSION } from './jev';
import { DAY_PLAN_VERSION, MAX_MODEL_DECISIONS } from '../src/domain/day-plan';

export const DECISION_PARAMETERS={incidentRate:.45,blackSwanRate:.00025} as const;
export const DECISION_CONFIG = keccak256(toHex(`NEARlyHuman:rules1:typesafe/jev-1.13:${DAY_PLAN_VERSION}:focus4:cadence6:localQuiet:mailboxDefault:decisions${MAX_MODEL_DECISIONS}:24maxUrgent:${INDIVIDUALITY_VERSION}:${DECISION_POLICY_VERSION}:14000bytes:72sends:3perstep:incident.45:blackSwan.00025`));
export interface QuoteInput { operation:'mint'|'day'; name?:string; stats?:Stats; tokenId?:string; delivery?:string[] }
export interface Reservation {
  id:Hex; player:Address; scope:string; expiresAt:number; createdAt:number; chainId?:number; collection?:Address;
  status:'held'|'accepted'|'done'|'released'; reserveMicroUSD:number; gasReserve:string;
  draft?:string; quote?:QuoteView; requestId?:Hex; spentMicroUSD?:number;
}
export interface AdmissionLedger { holds:Record<string,Reservation>; spentMicroUSD:number }
const ledgerKey='control/admission-v1';
export const initialLedger=():AdmissionLedger=>({holds:{},spentMicroUSD:0});
const active=(h:Reservation)=>h.status==='held'||h.status==='accepted';
const equal=(a:string,b:string)=>a.toLowerCase()===b.toLowerCase();

/** One ledger CAS reserves AI budget, service gas and a bounded worker slot together. */
export function reserveInLedger(ledger:AdmissionLedger, candidate:Reservation, budget:{funded:number;wallet:number;global:number;concurrency:number;gas:bigint}) {
  const holds=Object.values(ledger.holds), existing=holds.find(h=>h.scope===candidate.scope&&active(h));
  if(existing)return existing;
  const live=holds.filter(active), counted=holds.filter(h=>h.status!=='released');
  if(live.length>=budget.concurrency||counted.length>=budget.global||counted.filter(h=>equal(h.player,candidate.player)).length>=budget.wallet)
    throw new ServiceError('The nest is busy. Try again a little later.','capacity',503);
  if(ledger.spentMicroUSD+live.reduce((n,h)=>n+h.reserveMicroUSD,0)+candidate.reserveMicroUSD>budget.funded||live.reduce((n,h)=>n+BigInt(h.gasReserve),0n)+BigInt(candidate.gasReserve)>budget.gas)
    throw new ServiceError('Preparation is resting. Try again a little later.','capacity',503);
  ledger.holds[candidate.id]=candidate;return candidate;
}

export async function reconcileAdmission(player?:Address,requestedScope?:string) {
  const current=await storage().get<AdmissionLedger>(ledgerKey);if(!current)return;
  const {client,address,chain}=connection();const block=await client.getBlock();
  const expired=Object.values(current.value.holds).filter(h=>h.status==='held'&&h.expiresAt<Number(block.timestamp)&&(!h.chainId||h.chainId===chain.id)&&(!h.collection||equal(h.collection,address)));
  const unused:string[]=[];
  for(const h of expired){const used=await pinnedRead(()=>client.readContract({address,abi:nearlyHumanAbi,functionName:'usedPermits',args:[h.id],blockNumber:block.number}));if(!used)unused.push(h.id);}
  if(unused.length)await update(ledgerKey,initialLedger,ledger=>{for(const id of unused){const h=ledger.holds[id];if(h?.status==='held'&&h.expiresAt<Number(block.timestamp))h.status='released';}return ledger;});
  for(const h of Object.values(current.value.holds)){
    if(!h.requestId||h.status==='released'||h.status==='held'||player&&!equal(h.player,player)||h.chainId&&h.chainId!==chain.id||h.collection&&!equal(h.collection,address))continue;
    const job=await storage().get<JobControl>('jobs/'+h.requestId);if(!job)continue;
    const recovered=await recoverMissingAcceptance(job.value,h,block);
    if(recovered.permitId===h.id&&recovered.phase==='unaccepted'&&recovered.retrySafe)await finishReservation(h.id,recovered.spentMicroUSD);
    else if(requestedScope===h.scope&&recovered.orphanedAcceptance)throw new ServiceError('Checking an earlier wallet request. No new payment is needed.','checking',409);
  }
}

export async function issueQuote(input:QuoteInput, playerValue:string):Promise<QuoteView> {
  await verifyConnection();
  const player=checkedAddress(playerValue), {cfg,client,address,chain}=connection(), account=serviceAccount();
  if(!cfg.nearKey)throw new ServiceError('Preparation is resting. Try again shortly.','capacity',503);
  if(!input||!['mint','day'].includes(input.operation))throw new ServiceError('Choose a new life or prepare a day.','quote');
  let name='',stats:Stats={body:2,wits:2,spirit:1},tokenId=0n,baseRevision=0,delivery=0;
  if(input.operation==='mint'){
    try{name=normalizeName(typeof input.name==='string'?input.name:'');stats=input.stats!;validateStats(stats);}catch{throw new ServiceError('Use a name of up to 8 letters and allocate 5 points.','identity');}
  } else {
    tokenId=checkedToken(input.tokenId);const {raw,owner}=await readRawRooster(tokenId);
    if(!equal(owner,player))throw new ServiceError('This rooster belongs to another wallet.','ownership',403);
    if(raw.pendingRequest!==zeroHash)throw new ServiceError('This day is already preparing.','pending',409);
    if(!raw.alive)throw new ServiceError('This life has ended.','memorial',409);
    if(chain.id===46630&&raw.day>=3)throw new ServiceError('This testnet life has finished its three days.','trial',409);
    if(!Array.isArray(input.delivery||[]))throw new ServiceError('Choose up to three different supplies.','delivery');
    try{validateDelivery(roosterView(tokenId,raw,owner).state,input.delivery||[]);delivery=encodeDelivery((input.delivery||[]).map(id=>ITEM_IDS.indexOf(id as typeof ITEM_IDS[number])));}catch(e){throw new ServiceError((e as Error).message,'delivery');}
    baseRevision=raw.revision;
  }
  const scope=`${chain.id}:${address.toLowerCase()}:${player.toLowerCase()}:${input.operation}:${tokenId}:${baseRevision}`;
  await reconcileAdmission(player,scope);
  const [block,multiplier,window,mintPrice,gasPrice,balance,signer,relay]=await Promise.all([
    client.getBlock(),client.readContract({address,abi:nearlyHumanAbi,functionName:'gasMultiplier'}),client.readContract({address,abi:nearlyHumanAbi,functionName:'requestWindow'}),
    input.operation==='mint'?client.readContract({address,abi:nearlyHumanAbi,functionName:'mintPrice'}):Promise.resolve(0n),client.getGasPrice(),client.getBalance({address:account.address}),
    client.readContract({address,abi:nearlyHumanAbi,functionName:'quoteSigner'}),client.readContract({address,abi:nearlyHumanAbi,functionName:'relayer'}),
  ]);
  if(!equal(signer,account.address)||!equal(relay,account.address))throw new ServiceError('Preparation is resting. Try again shortly.','capacity',503);
  const draft=keccak256(toHex(JSON.stringify({name,stats,delivery})));const id=toHex(randomBytes(32));
  const candidate:Reservation={id,player,scope,chainId:chain.id,collection:address,expiresAt:Number(block.timestamp)+120,createdAt:Date.now(),status:'held',reserveMicroUSD:Math.max(60_000,cfg.attemptReserveMicroUSD),gasReserve:(gasPrice*2n*1_000_000n).toString()};
  const ledger=await update(ledgerKey,initialLedger,l=>{reserveInLedger(l,candidate,{funded:cfg.fundedMicroUSD,wallet:cfg.maxWalletAttempts,global:cfg.maxGlobalAttempts,concurrency:cfg.maxConcurrentJobs,gas:balance});return l;});
  const hold=Object.values(ledger.holds).find(h=>h.scope===scope&&active(h))!;
  if(hold.status==='accepted')throw new ServiceError('This day is already preparing.','pending',409);
  if(hold.quote&&hold.quote.permit.decisionConfig!==DECISION_CONFIG)throw new ServiceError('Refreshing this day’s estimate. Try again shortly.','quote_expiring',409);
  if(hold.expiresAt<=Number(block.timestamp)+15)throw new ServiceError('Refreshing this quote. Try again in a moment.','quote_expiring',409);
  if(hold.draft===draft&&hold.quote)return hold.quote;
  const permit:AdmissionPermit={id:hold.id,player,operation:input.operation==='mint'?0:1,tokenId,baseRevision,delivery,parametersHash:input.operation==='mint'?mintParametersHash(name,stats):zeroHash,
    networkFee:0n,processingFee:0n,mintFee:mintPrice,multiplier,expiresAt:BigInt(hold.expiresAt),window,rulesVersion:1,decisionConfig:DECISION_CONFIG};
  let signature=await account.signTypedData(permitTypedData(chain.id,address,permit));
  const transactionData=()=>input.operation==='mint'?encodeFunctionData({abi:nearlyHumanAbi,functionName:'mint',args:[name,stats.body,stats.wits,stats.spirit,permit,signature]}):encodeFunctionData({abi:nearlyHumanAbi,functionName:'requestDay',args:[tokenId,permit,signature]});
  let estimate:bigint;
  try{estimate=await client.estimateGas({account:player,to:address,data:transactionData(),value:permitValue(permit)});}catch(error){throw estimateError(error);}
  permit.networkFee=(estimate*125n/100n+20_000n)*gasPrice;
  permit.processingFee=permit.networkFee*BigInt(multiplier-1);
  signature=await account.signTypedData(permitTypedData(chain.id,address,permit));
  const value=permitValue(permit),quote:QuoteView={permit:permitToJSON(permit),signature,value:value.toString(),networkEstimate:permit.networkFee.toString(),totalEstimate:(value+permit.networkFee).toString(),expiresAt:hold.expiresAt};
  await update(ledgerKey,initialLedger,l=>{const h=l.holds[hold.id];if(!h||h.status!=='held')throw new ServiceError('This day is already preparing.','pending',409);h.quote=quote;h.draft=draft;return l;});
  return quote;
}

export async function acceptReservation(permitId:Hex,requestId:Hex,player:Address) {
  const ledger=await update(ledgerKey,initialLedger,l=>{const h=l.holds[permitId];
    if(!h||h.status==='released'||!equal(h.player,player))throw new ServiceError('Checking this request’s preparation allowance.','allowance',409);
    if(h.requestId&&h.requestId!==requestId)throw new ServiceError('Checking this request.','checking',409);
    h.status=h.status==='done'?'done':'accepted';h.requestId=requestId;return l;});
  return ledger.holds[permitId]!;
}
export async function finishReservation(permitId:Hex,spentMicroUSD:number) {
  await update(ledgerKey,initialLedger,l=>{const h=l.holds[permitId];if(!h||h.status==='done')return l;
    const spend=Math.max(0,Math.ceil(spentMicroUSD));h.status='done';h.spentMicroUSD=spend;l.spentMicroUSD+=spend;return l;});
}
