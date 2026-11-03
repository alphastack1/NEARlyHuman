import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {KeyPair,KeyPairSigner,decodeSignedTransaction,encodeTransaction} from 'near-api-js';
import {keccak256,toHex} from 'viem';
import {createState,encodeState,decodeState,decodeTrace,decodeCertificate,replayDay,encodeTrace,compactV2History,kitMask} from '../../src/v2';
import {nearChallenge,nearAuthenticate,nearSession} from '../../server/near/auth';
import {base58Encode,sha256,verifyNearMessage} from '../../server/near/encoding';
import {nearRuntime,nearRpc} from '../../server/near/rpc';
import {v2DecisionConfig} from '../../server/v2/preparation';
import {createV2Campaign,reserveV2JobBudget,inspectV2Campaign} from '../../server/v2/budget';
import {issueNearQuote,nearAdmissionMessage,nearJobId} from '../../server/near/quotes';
import {acceptNearJob,prepareNearJob,settleNearJob,nearJobView} from '../../server/near/jobs';
import {NearError,type NearRequest,type NearDayRecord} from '../../server/near/types';
import {nearRelayTransaction,retireNearRelayIntent} from '../../server/near/relay';
import {mapNearLife,readNearPublicReplay} from '../../server/near/views';
import {maybeRedispatchNearQueued} from '../../server/near/service';
import {readAdvertisedNearWorld} from '../../server/game-worlds';
import {handleV2Api} from '../../server/v2/http';
import {freezeNearInput,nearInputHash} from '../../server/near/context';
import {v2PlanChoices,buildV2PlanRequest} from '../../server/v2/choices';
import {v2JobView,type V2Job} from '../../server/v2/jobs';
import {appendV2Progress,publicV2Progress} from '../../server/v2/progress';
import type {DurableStore,Stored} from '../../server/storage';

class MemoryStore implements DurableStore {
  rows=new Map<string,{value:unknown;etag:string}>();counter=0;
  async get<T>(key:string):Promise<Stored<T>|null>{const r=this.rows.get(key);return r?{value:structuredClone(r.value)as T,etag:r.etag}:null;}
  async put<T>(key:string,value:T,c:{etag?:string;isNew?:boolean}={}){const old=this.rows.get(key);if(c.isNew&&old||c.etag&&old?.etag!==c.etag)return false;this.rows.set(key,{value:structuredClone(value),etag:String(++this.counter)});return true;}
  async list(prefix:string){return [...this.rows.keys()].filter(k=>k.startsWith(prefix));}async delete(key:string){this.rows.delete(key);}
}
const store=new MemoryStore(),ownerKey=KeyPair.fromRandom('ed25519'),relayKey=KeyPair.fromRandom('ed25519');
const now=String(Math.floor(Date.now()/1000)),blockHash=base58Encode(Buffer.alloc(32,7)),rulesHash=keccak256(toHex('nearlyhuman-v2-kernel-2'));
process.env.NEARLYHUMAN_SESSION_SECRET='backend-check-ephemeral-fixture-secret-value';process.env.NEAR_AI_API_KEY='fixture-not-a-real-provider-key';
process.env.NEARLYHUMAN_NEAR_RELAY_KEY=relayKey.toString();
process.env.NEARLYHUMAN_NEAR_RUNTIME_JSON=JSON.stringify({version:2,networkId:'near-testnet',network:'testnet',collection:'game.testnet',rpcUrl:'https://rpc.fixture.invalid',codeHash:base58Encode(Buffer.alloc(32,1)),rulesHash,decisionConfig:v2DecisionConfig(rulesHash),relayer:'relay.testnet',quoteSigner:Buffer.from(relayKey.getPublicKey().data).toString('base64')});
const runtime=nearRuntime(),cases:string[]=[],requestId=base58Encode(Buffer.alloc(32,3));
const config={network_id:'near-testnet',contract_id:runtime.collection,owner_id:'owner.testnet',relayer_id:runtime.relayer,quote_public_key:runtime.quoteSigner,rules_hash:runtime.rulesHash,decision_config:runtime.decisionConfig,native_mint_price:'100000000000000000000000',token_mint_price_micro:'250000000',storage_deposit:'100000000000000000000000',min_processing_fee:'20000000000000000000000',multiplier:2,admissions_paused:false,issued:'0',nft_mint_burns:'0',total_allocated:'0',available:'30000000000',reserved:'0'};
const initial=createState({seed:42}),life={token_id:'1',owner_id:'player.testnet',name:'PEEP',state:encodeState(initial),revision:0,purse_micro:'0',purse_nonce:'0',pending_request:null as string|null,appearance_seed:initial.seed};
let q:NearRequest|undefined,record:NearDayRecord|undefined,admission:any,ownerTxWrong=false,ownerTxFailed=false,modelSends=0,throwPreSend=false,thrown=false,txSent=false,relayHash='',refundFailure=false,fullAccess=true,uncertainProvider=false,lifeReads=0;const signedNonces:string[]=[];
const originalFetch=globalThis.fetch;
const fixtureFailures:string[]=[];
let blockFetch=false,blockedFetchCount=0;
let rateLimitReads=0,trackReadRate=false,readRateCalls=0,rateLimitWrite=false,writeRateCalls=0;
globalThis.fetch=async(input,options)=>{
 try{
 if(blockFetch){blockedFetchCount++;throw Error('Scope check must stop before RPC');}
 const url=String(input),body=JSON.parse(String(options?.body));
 if(url==='https://cloud-api.near.ai/v1/systemone'){
   modelSends++;if(uncertainProvider)throw new TypeError('fixture uncertain provider send after dispatch');const answers=Object.fromEntries(Object.entries(body.questions).map(([name,question]:any)=>[name,{type:'choice',choice:Object.keys(question.criteria)[0]}]));
   return new Response(JSON.stringify({model:'typesafe/jev-1.13-20260917',answers,usage:{input_tokens:200,output_tokens:30,cost:.0001}}),{status:200});
 }
 assert.equal(url,runtime.rpcUrl);const method=body.method,p=body.params;
 if(trackReadRate&&method==='status'){readRateCalls++;if(rateLimitReads-->0)return new Response('',{status:429,headers:{'retry-after':'0'}});}
 if(rateLimitWrite&&method==='send_tx'){writeRateCalls++;return new Response('',{status:429});}
 const result=(value:unknown)=>new Response(JSON.stringify({jsonrpc:'2.0',id:body.id,result:value}),{status:200});
 if(method==='status'){if(throwPreSend&&modelSends===2&&!thrown){thrown=true;throw new TypeError('fixture transport interruption before provider send');}return result({chain_id:'testnet'});}
 if(method==='block')return result({header:{height:42,hash:blockHash,timestamp_nanosec:(BigInt(now)*1000000000n).toString()}});
 if(method==='gas_price')return result({gas_price:'100000000'});
 if(method==='EXPERIMENTAL_protocol_config')return result({runtime_config:{storage_amount_per_byte:'10000000000000000000'}});
 if(method==='query'){
   if(p.request_type==='view_account')return result({amount:'10000000000000000000000000',locked:'0',storage_usage:1000,code_hash:runtime.codeHash,block_hash:blockHash,block_height:42});
   if(p.request_type==='view_access_key')return result({nonce:41,permission:fullAccess?'FullAccess':{FunctionCall:{receiver_id:'other.testnet',method_names:['call']}},block_hash:blockHash,block_height:42});
   assert.equal(p.request_type,'call_function');const args=JSON.parse(Buffer.from(p.args_base64,'base64').toString('utf8'));let value:unknown;
   if(p.method_name==='config')value=config;else if(p.method_name==='life'){lifeReads++;value=args.token_id==='1'?life:{...life,token_id:args.token_id};}
   else if(p.method_name==='quote_day')value={maximum:'0',pressure:'0',capacity:'30000000000'};
   else if(p.method_name==='request')value=q&&q.request_id===args.request_id?q:null;
   else if(p.method_name==='day_record')value=record;
   else throw Error('Unexpected fixture view '+p.method_name);
   return result({result:[...Buffer.from(JSON.stringify(value))],block_hash:blockHash,block_height:42});
 }
 if(method==='tx'){
   if(p.tx_hash===requestId)return result({final_execution_status:'FINAL',status:ownerTxFailed?{Failure:'duplicate fixture transaction'}:{SuccessValue:''},transaction:{hash:requestId,signer_id:ownerTxWrong?'intruder.testnet':'player.testnet',receiver_id:runtime.collection,nonce:40,actions:[{FunctionCall:{method_name:'accept_day',args:Buffer.from(JSON.stringify({admission,signature:'public-fixture'})).toString('base64'),gas:80000000000000,deposit:admission.processingFee}}]}});
   if(!txSent)return new Response(JSON.stringify({jsonrpc:'2.0',id:1,error:{cause:{name:'UNKNOWN_TRANSACTION'}}}),{status:200});
   assert.equal(p.tx_hash,relayHash);return result({final_execution_status:'FINAL',status:refundFailure?{Failure:{ActionError:'fixture detached refund error'}}:{SuccessValue:''},transaction:{hash:relayHash,signer_id:runtime.relayer,receiver_id:runtime.collection,nonce:42,actions:[]}});
 }
 if(method==='send_tx'){
   const signed=decodeSignedTransaction(Buffer.from(p.signed_tx_base64,'base64')),tx=signed.transaction,hash=sha256(encodeTransaction(tx));
   assert.equal(tx.signerId,runtime.relayer);assert.equal(tx.receiverId,runtime.collection);assert(relayKey.verify(hash,Uint8Array.from(signed.signature.ed25519Signature!.data)));assert.equal(tx.actions.length,1);
   signedNonces.push(tx.nonce.toString());relayHash=base58Encode(hash);txSent=true;
   const call=tx.actions[0].functionCall!;assert.equal(call.methodName,'finalize');assert.equal(call.deposit,0n);const args=JSON.parse(Buffer.from(call.args).toString('utf8'));
   const checked=replayDay(initial,BigInt(q!.kit_mask),decodeTrace(args.trace),q!.day_seed,q!.shipping,decodeCertificate(args.certificate));
   life.state=encodeState(checked.state);life.revision=1;life.pending_request=null;q!.status=2;
   record={request_id:q!.request_id,seed:q!.day_seed,state_hash:keccak256(life.state),trace_hash:keccak256(args.trace),certificate_hash:keccak256(args.certificate),replay_commitment:args.replay_commitment,reward:'0',history:compactV2History(checked.trace)};
   return result({final_execution_status:'NONE'});
 }
 throw Error('Unexpected fixture RPC '+method);
 }catch(error){fixtureFailures.push((error instanceof Error?error.message:String(error)).slice(0,300));throw error;}
};
try{
 trackReadRate=true;rateLimitReads=1;assert.equal((await nearRpc<{chain_id:string}>(runtime,'status',[])).chain_id,'testnet');trackReadRate=false;assert.equal(readRateCalls,2);
 rateLimitWrite=true;await assert.rejects(()=>nearRpc(runtime,'send_tx',{signed_tx_base64:'fixture-not-a-transaction'}),e=>e instanceof NearError&&e.code==='connection');rateLimitWrite=false;assert.equal(writeRateCalls,1);
 cases.push('HTTP429 on an explicit read receives one bounded backoff/retry; send_tx429 is returned after one attempt without generic write retry.');
 const rhDeployment=JSON.parse(await fs.readFile(new URL('../../contracts/v2/deployments/robinhood-testnet.json',import.meta.url),'utf8'));
 process.env.NEARLYHUMAN_V2_RUNTIME_JSON=JSON.stringify(rhDeployment.runtime);blockFetch=true;
 const rhScope=new URLSearchParams({chainId:'46630',collection:rhDeployment.runtime.collection}).toString();
 const foreignScope=new URLSearchParams({chainId:'46630',collection:'0x1111111111111111111111111111111111111111'}).toString();
 const scopeCases=[{method:'POST',path:'/quote?'+foreignScope,status:404},{method:'POST',path:'/quote?'+rhScope+'&networkId=near-testnet',status:404},{method:'POST',path:'/quote?'+rhScope,status:401},{method:'POST',path:'/quote',status:401},{method:'GET',path:'/config?'+foreignScope,status:404}];
 for(const row of scopeCases){const response=await handleV2Api(new Request('https://nearlyhuman.netlify.app/api/v2'+row.path,{method:row.method,headers:{'Content-Type':'application/json',authorization:'Bearer fixture-invalid-session',origin:'https://nearlyhuman.netlify.app'},...(row.method==='POST'?{body:JSON.stringify({tokenId:'1',kitMask:'0'})}:{})}));assert.equal(response.status,row.status,row.method+' '+row.path);}
 assert.equal(blockedFetchCount,0);blockFetch=false;
 cases.push('Five actual EVM HTTP guards reject foreign/mixed scopes before auth and return401 for scoped or legacy fake sessions; no RPC, quote or financial-store access occurs.');
 const c=await nearChallenge({accountId:'player.testnet'},'https://nearlyhuman.netlify.app','fixture',{runtime,store});
 const signed=await new KeyPairSigner(ownerKey).signNep413Message('player.testnet',{message:c.message,recipient:c.recipient,nonce:Buffer.from(c.nonce,'base64')});
 assert(verifyNearMessage(c,signed.publicKey.toString(),Buffer.from(signed.signature).toString('base64')));
 const payload={id:c.id,accountId:'player.testnet',publicKey:signed.publicKey.toString(),signature:Buffer.from(signed.signature).toString('base64')};
 fullAccess=false;await assert.rejects(()=>nearAuthenticate(payload,{runtime,store}),e=>e instanceof NearError&&e.code==='signature');fullAccess=true;
 const auth=await nearAuthenticate(payload,{runtime,store});const request=new Request('https://nearlyhuman.netlify.app',{headers:{authorization:'Bearer '+auth.token}});
 assert.equal(nearSession(request,runtime).address,'player.testnet');assert.throws(()=>nearSession(request,{...runtime,collection:'other.testnet'}));
 await assert.rejects(()=>nearAuthenticate(payload,{runtime,store,fullAccessKey:async()=>true}));
 assert(!verifyNearMessage({...c,recipient:'evil.example'},signed.publicKey.toString(),payload.signature));
 cases.push('Official SDK NEP-413 signature matches independent server verifier; inactive/function key, replay, recipient and cross-world session rejected.');
 process.env.NEARLYHUMAN_NEAR_ENABLED='1';process.env.NEARLYHUMAN_NEAR_CAMPAIGN='backend-near-fixture';
 const configuredKey=process.env.NEARLYHUMAN_NEAR_RELAY_KEY;delete process.env.NEARLYHUMAN_NEAR_RELAY_KEY;assert.equal(await readAdvertisedNearWorld(),undefined);process.env.NEARLYHUMAN_NEAR_RELAY_KEY=ownerKey.toString();assert.equal(await readAdvertisedNearWorld(),undefined);process.env.NEARLYHUMAN_NEAR_RELAY_KEY=configuredKey;
 const sessionKey=process.env.NEARLYHUMAN_SESSION_SECRET;process.env.NEARLYHUMAN_SESSION_SECRET='short';assert.equal(await readAdvertisedNearWorld(),undefined);process.env.NEARLYHUMAN_SESSION_SECRET=sessionKey;
 delete process.env.NEARLYHUMAN_NEAR_CAMPAIGN;assert.equal(await readAdvertisedNearWorld(),undefined);process.env.NEARLYHUMAN_NEAR_CAMPAIGN='backend-near-fixture';
 const beforeDirectory=store.counter;assert.equal((await readAdvertisedNearWorld())?.networkId,'near-testnet');assert.equal(store.counter,beforeDirectory);
 cases.push('Native discovery requires enabled runtime, campaign, session secret and matching loaded relay key, but does not inspect or spend the transient credit reserve.');
 const transferred=mapNearLife({...life,owner_id:'newowner.testnet',revision:4},{height:'42',hash:blockHash,timestamp:now},runtime);assert.equal(transferred.revision,4);assert.equal(transferred.state.day,0);assert.equal(transferred.owner,'newowner.testnet');
 cases.push('The public adapter accepts transfer-invalidated save revisions above the unchanged biological day without reseeding or advancing the rooster.');
 await createV2Campaign('backend-near-fixture',90000,store);await reserveV2JobBudget('backend-near-fixture','rh-fixture-held',store);
 const input={tokenId:'1',kitMask:kitMask([0,2,13]).toString(),shipping:true};
 const beforePermission=store.counter;fullAccess=false;await assert.rejects(()=>issueNearQuote(runtime,'backend-near-fixture','player.testnet',input,store),e=>e instanceof NearError&&e.code==='connection');fullAccess=true;assert.equal(store.counter,beforePermission);
 cases.push('An unusable relay access key is rejected before any quote, allowance or gas hold is created.');
 const [quote,repeat]=await Promise.all([issueNearQuote(runtime,'backend-near-fixture','player.testnet',input,store),issueNearQuote(runtime,'backend-near-fixture','player.testnet',input,store)]);
 assert.equal(quote.admission.id,repeat.admission.id);admission=quote.admission;assert(relayKey.verify(nearAdmissionMessage(runtime,admission),Buffer.from(quote.signature,'base64')));
 await assert.rejects(()=>issueNearQuote(runtime,'backend-near-fixture','player.testnet',{...input,tokenId:'2'},store));
 cases.push('Concurrent native quotes share one job allowance; signed fee domain verifies; shared RH40k+NEAR40k prevent a third allocation without changing the pool.');
 q={request_id:admission.id,token_id:'1',player:'player.testnet',base_revision:0,day:1,kit_mask:input.kitMask,shipping:false,accepted_at:now,deadline:(BigInt(now)+900n).toString(),day_seed:keccak256(toHex('native-day-fixture')),decision_config:runtime.decisionConfig,base_hash:keccak256(life.state),pressure:'0',reserved_reward:'0',status:1,processing_fee:admission.processingFee,multiplier:2};life.pending_request=q.request_id;
 const sameBlock={height:'42',hash:blockHash,timestamp:now},oldTransport=freezeNearInput({...runtime,rpcUrl:'https://rpc.testnet.near.org'},q,life,sameBlock),newTransport=freezeNearInput({...runtime,rpcUrl:'https://test.rpc.fastnear.com'},q,life,sameBlock);
 assert.deepEqual(oldTransport,newTransport);assert.equal(nearInputHash(oldTransport),nearInputHash(newTransport));assert.equal(nearAdmissionMessage(runtime,admission).toString(),nearAdmissionMessage({...runtime,rpcUrl:'https://test.rpc.fastnear.com'},admission).toString());
 const prompt=(v:typeof oldTransport)=>buildV2PlanRequest(v2PlanChoices({requestId:v.requestId,base:decodeState(v.base),kit:BigInt(v.kitMask),seed:v.daySeed,shipping:v.shipping}));assert.deepEqual(prompt(oldTransport),prompt(newTransport));
 cases.push('Changing only the verified RPC transport preserves exact frozen input/hash, signed admission bytes and Jev Dawn body/hash; network/account/contract identity stays unchanged.');
 ownerTxWrong=true;await assert.rejects(()=>acceptNearJob(runtime,'backend-near-fixture','player.testnet',q!.request_id,requestId,store));ownerTxWrong=false;
 ownerTxFailed=true;await assert.rejects(()=>acceptNearJob(runtime,'backend-near-fixture','player.testnet',q!.request_id,requestId,store),e=>e instanceof NearError&&e.code==='payment_failed');ownerTxFailed=false;
 const job=await acceptNearJob(runtime,'backend-near-fixture','player.testnet',q.request_id,requestId,store);assert.equal(job.id,nearJobId(runtime,q.request_id));
 const same=await acceptNearJob(runtime,'backend-near-fixture','player.testnet',q.request_id,undefined,store);assert.equal(same.inputHash,job.inputHash);
 cases.push('Known owner payment verifies actual native signer/action/deposit; wrong signer rejected; hashless recovery reuses the canonical held request.');
 throwPreSend=true;const interrupted=await prepareNearJob(job.id,store);assert.equal(interrupted.phase,'queued');assert.equal(modelSends,2);
 assert.equal(interrupted.progress?.length,2);assert.equal(nearJobView(interrupted).progress?.length,2);assert.equal(nearJobView(interrupted).decisions,2);const initialProgress=JSON.stringify(interrupted.progress);
 const costBefore=(await inspectV2Campaign('backend-near-fixture',store))!.chargedMicroUSD;assert.equal(costBefore,200);
 let dispatches=0;const dispatch=async()=>{dispatches++;};assert.equal(await maybeRedispatchNearQueued(job.id,dispatch,store),false);
 const wakeTime=Date.now()+6000,wakes=await Promise.all([maybeRedispatchNearQueued(job.id,dispatch,store,wakeTime),maybeRedispatchNearQueued(job.id,dispatch,store,wakeTime)]);assert.equal(wakes.filter(Boolean).length,1);assert.equal(dispatches,1);
 assert.equal(await maybeRedispatchNearQueued(job.id,dispatch,store,wakeTime+14999),false);assert.equal(await maybeRedispatchNearQueued(job.id,dispatch,store,wakeTime+15001),true);assert.equal(dispatches,2);assert.equal((await inspectV2Campaign('backend-near-fixture',store))!.chargedMicroUSD,200);
 cases.push('Owner polling resumes only an admitted queued job after backoff; concurrent polls share one durable15s dispatch claim and do not buy inference or reset its budget.');
 const prepared=await prepareNearJob(job.id,store);assert.equal(prepared.phase,'prepared');assert(modelSends<=8);assert.equal(new Set(prepared.decisions.map(d=>d.inputHash)).size,prepared.decisions.length);
 assert.equal(prepared.progress?.length,modelSends);assert.equal(JSON.stringify(prepared.progress!.slice(0,2)),initialProgress);assert.equal(new Set(prepared.progress!.map(p=>p.id)).size,modelSends);
 const nativeView=nearJobView(prepared),rhView=v2JobView({input:{requestId:prepared.input.requestId,tokenId:'7'},phase:'preparing',updatedAt:Date.now(),answers:prepared.answers,progress:prepared.progress!.map(p=>({...p,prompt:'fixture-private-prompt',lease:'fixture-private-lease',usage:{cost:1}}))}as unknown as V2Job);
 assert.deepEqual(rhView.progress,nativeView.progress);assert.equal(rhView.decisions,nativeView.decisions);assert.equal(nativeView.decisions,modelSends);
 const safe=publicV2Progress(rhView.progress)!;assert(!JSON.stringify(safe).includes('fixture-private'));assert.equal(safe[0].stage,'plan');assert.deepEqual(appendV2Progress(safe,safe[0]),safe);assert.throws(()=>appendV2Progress(safe,{...safe[0],label:'changed reply'}));
 cases.push('Both job DTOs show only completed real reply labels including Dawn; cached retry preserves ordered unique IDs, uncompleted reply is absent, and public whitelist removes prompt/lease/usage fields.');
 const campaign=(await inspectV2Campaign('backend-near-fixture',store))!;assert.equal(campaign.complete,modelSends);assert.equal(campaign.chargedMicroUSD,modelSends*100);assert.equal(campaign.uncertain,0);
 cases.push('Pre-send transport interruption resumes native preparation using cached paid answers; no duplicate charge, no uncertain send or duplicate progress record.');
 refundFailure=true;const ready=await settleNearJob(runtime,job.id,store);assert.equal(ready.phase,'ready');assert.equal(signedNonces.length,1);
 const campaignRow:any=(await store.get('v2/ai-campaigns/backend-near-fixture'))!.value;assert.equal(campaignRow.jobs[job.id].active,false);assert.equal(campaignRow.jobs['rh-fixture-held'].active,true);
 assert.equal((await store.get<any>(`near/v2/control/relay-gas/near-testnet/${runtime.relayer}`))!.value.holds[job.id],undefined);
 assert.equal((await store.get<any>(`near/v2/control/relay/near-testnet/${runtime.relayer}`))!.value.pending,undefined);
 cases.push('Official SDK relay outbox signs once and settles only matching canonical commitment; successful main state survives a fixture detached-refund failure; native holds retire while RH allowance stays active.');
 const beforeReplay=lifeReads,replay=await readNearPublicReplay('1',undefined,runtime,store);assert.equal(lifeReads-beforeReplay,1);assert.equal(replay.life.state.day,1);assert.equal(replay.commitment,ready.commitment);assert.equal(replay.life.observedBlockHash,blockHash);
 cases.push('Public replay resolves its life and day record from one coherent finalized snapshot without a second owner/day read.');
 const controlKey=`near/v2/control/relay/near-testnet/${runtime.relayer}`,oldControl=(await store.get<any>(controlKey))!.value;
 await store.put(controlKey,{...oldControl,pending:{...ready.journal,hash:base58Encode(Buffer.alloc(32,2))}});
 await assert.rejects(()=>nearRelayTransaction(runtime,{jobId:job.id,method:'finalize',args:JSON.parse(ready.journal!.args),resultDigest:ready.journal!.resultDigest},async()=>{},{store}),e=>e instanceof NearError&&e.code==='context');assert.equal(signedNonces.length,1);
 await store.put(controlKey,oldControl);
 cases.push('A tampered already-persisted control.pending journal is rejected before status lookup or broadcast, not merely checked when restored from a job fallback.');
 const recovered=await nearRelayTransaction(runtime,{jobId:job.id,method:'finalize',args:JSON.parse(ready.journal!.args),resultDigest:ready.journal!.resultDigest},async()=>{}, {store,recoverJournal:ready.journal});assert.equal(recovered.hash,ready.finalTx);assert.equal(signedNonces.length,1);
 cases.push('Actual SDK-decoded nested Ed25519 signature verifies recovered exact journal; known receipt returns without signing or broadcasting new bytes.');
 const nextQuote=await issueNearQuote(runtime,'backend-near-fixture','player.testnet',input,store);admission=nextQuote.admission;
 q={...q,request_id:admission.id,base_revision:1,day:2,base_hash:keccak256(life.state),status:1};life.pending_request=q.request_id;
 const second=await acceptNearJob(runtime,'backend-near-fixture','player.testnet',q.request_id,undefined,store);const beforeUncertain=modelSends;uncertainProvider=true;
 const failed=await prepareNearJob(second.id,store);assert.equal(failed.phase,'failure_due');assert.equal(modelSends,beforeUncertain+1);
 assert.equal(await maybeRedispatchNearQueued(second.id,dispatch,store,Date.now()+60000),false);
 await prepareNearJob(second.id,store);assert.equal(modelSends,beforeUncertain+1);const uncertainty=(await inspectV2Campaign('backend-near-fixture',store))!;assert.equal(uncertainty.uncertain,1);
 cases.push('A provider transport loss after the durable send fence remains uncertain and terminal-for-preparation; re-entry never automatically buys the answer again.');
 const relayKeyPath=`near/v2/control/relay/near-testnet/${runtime.relayer}`,savedRelay=(await store.get<any>(relayKeyPath))!.value;
 await store.put(relayKeyPath,{...savedRelay,pending:{...ready.journal,jobId:second.id,nonce:'55',args:JSON.stringify({request_id:q.request_id})}});
 await assert.rejects(()=>retireNearRelayIntent(runtime,second.id,{requestId:q!.request_id,deadline:q!.deadline},store));assert((await store.get<any>(relayKeyPath))!.value.pending);
 q.deadline=(BigInt(now)-1n).toString();await retireNearRelayIntent(runtime,second.id,{requestId:q.request_id,deadline:q.deadline},store);
 const retired=(await store.get<any>(relayKeyPath))!.value;assert.equal(retired.pending,undefined);assert.equal(retired.nonceFloor,'55');
 cases.push('A live signed finalize cannot be discarded; a final block past its exact deadline permits scoped retirement with a nonce floor, preventing different new bytes from reusing its nonce.');
 console.log(JSON.stringify({passed:true,cases,simulatedHttpSends:modelSends,completed:uncertainty.complete,uncertain:uncertainty.uncertain,chargedFixtureMicroUSD:uncertainty.chargedMicroUSD,scope:'Entirely in-memory controlled RPC/provider, official SDK Ed25519 and transaction codecs. No public RPC, funded financial store, real keys, signing authority, inference or transaction broadcast.'}));
}catch(error){console.log(JSON.stringify({fixtureFailures}));throw error;}finally{globalThis.fetch=originalFetch;delete process.env.NEARLYHUMAN_NEAR_RELAY_KEY;delete process.env.NEAR_AI_API_KEY;}
