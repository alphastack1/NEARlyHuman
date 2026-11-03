import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync,mkdirSync} from 'node:fs';
import {keccak256,toHex} from 'viem';
import {createState,encodeState,Op,step} from '../../src/v2';
import {freezeV2Input,type V2RuntimeIdentity} from '../../server/v2/context.ts';
import {v2DecisionConfig} from '../../server/v2/preparation.ts';
import {createV2Campaign,reserveV2JobBudget,inspectV2Campaign} from '../../server/v2/budget.ts';
import {createV2Job,acquireV2Job,v2JobAnswer,v2JobId,prepareV2Job,type V2Job} from '../../server/v2/jobs.ts';
import {V2PreSendCheckError,classifyV2PreparationFailure} from '../../server/v2/failures.ts';
import {V2InferenceError} from '../../server/v2/jev.ts';
import type {DurableStore,Stored} from '../../server/storage.ts';
class MemoryStore implements DurableStore{
 data=new Map<string,Stored<any>>();n=0;
 async get<T>(k:string){return structuredClone(this.data.get(k)||null) as Stored<T>|null;}
 async put<T>(k:string,v:T,c:{etag?:string;isNew?:boolean}={}){const o=this.data.get(k);if(c.isNew&&o||c.etag&&o?.etag!==c.etag)return false;this.data.set(k,{value:structuredClone(v),etag:String(++this.n)});return true;}
 async list(p:string){return [...this.data.keys()].filter(k=>k.startsWith(p));}async delete(k:string){this.data.delete(k)}
}
const hash=(s:string)=>keccak256(toHex(s)),sha=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const address=`0x${'12'.repeat(20)}` as const;
function input(){
 const s=createState({seed:21});s.day=1;s.level=1;const base=encodeState(s),at=BigInt(Math.floor(Date.now()/1000));
 const runtime:V2RuntimeIdentity={chainId:31337,collection:address,verifier:address,actionModule:address,controllerCodeHash:hash('c'),verifierCodeHash:hash('v'),actionModuleCodeHash:hash('a'),rulesHash:hash('rules'),decisionConfig:hash('placeholder'),relayer:address,quoteSigner:address};runtime.decisionConfig=v2DecisionConfig(runtime.rulesHash);
 return freezeV2Input(runtime,{requestId:hash('accepted'),tokenId:1n,player:address,baseRevision:1,day:2,kitMask:0n,shipping:false,acceptedAt:at,deadline:at+900n,daySeed:hash('seed'),decisionConfig:runtime.decisionConfig,baseHash:keccak256(base),pressure:0n,reservedReward:0n,status:1},base,1n,hash('block'),true);
}
const memory={name:'MISO',previousDays:[{day:1,actions:[step(36,Op.Plant,0,1)]}]};
mkdirSync(new URL('../../TEMP/v2-checks/',import.meta.url),{recursive:true});
const report:any[]=[];
const test=async(name:string,f:()=>Promise<void>)=>{try{await f();report.push({name,result:'pass'});}catch(e){report.push({name,result:'fail',error:String(e)});}};
async function accepted(s:MemoryStore,withMemory=true){const i=input(),id=v2JobId(i);await createV2Campaign('worker-test',100000,s);await reserveV2JobBudget('worker-test',id,s);const j=await createV2Job(i,'worker-test',{allowLocal:true,store:s,...(withMemory?{memory}:{})});return{i,id,j};}
await test('changed body for same logical slot rejects before a second send',async()=>{
 const s=new MemoryStore(),{id}=await accepted(s);const lease=(await acquireV2Job(id,s)).lease!;let sends=0;
 const run=(body:unknown)=>async(before:any)=>{await before(sha(body),body);sends++;return{value:{exchange:{costMicroUSD:123},key:'choice'},costMicroUSD:123}};
 const a={slot:11,context:'original'},b={slot:11,context:'changed'};
 await v2JobAnswer(id,lease,'slot11',sha(a),run(a),s);
 await assert.rejects(v2JobAnswer(id,lease,'slot11',sha(b),run(b),s));assert.equal(sends,1);assert.equal((await inspectV2Campaign('worker-test',s))!.chargedMicroUSD,123);
});
await test('stale lease cannot spend; successor reuses exact cached answer',async()=>{
 const s=new MemoryStore(),{id}=await accepted(s);const lease=(await acquireV2Job(id,s)).lease!;let sends=0;const body={slot:11};
 const run=async(before:any)=>{await before(sha(body),body);sends++;return{value:{exchange:{costMicroUSD:50},key:'choice'},costMicroUSD:50}};
 await v2JobAnswer(id,lease,'slot11',sha(body),run,s);
 s.data.get(id)!.value.lease.until=Date.now()-1;
 await assert.rejects(v2JobAnswer(id,lease,'slot21',sha({slot:21}),run,s));
 const successor=(await acquireV2Job(id,s)).lease!;assert(successor.generation>lease.generation);
 await v2JobAnswer(id,successor,'slot11',sha(body),run,s);assert.equal(sends,1);assert.equal((await inspectV2Campaign('worker-test',s))!.chargedMicroUSD,50);
});
await test('reaccept without rereading memory retains frozen prior context',async()=>{
 const s=new MemoryStore(),{id,i,j}=await accepted(s);
 const again=await createV2Job(i,'worker-test',{allowLocal:true,store:s});
 assert.equal(again.phase,'queued');assert.equal(again.memoryHash,j.memoryHash);assert.deepEqual(again.memory,j.memory);
});
await test('explicit changed canonical memory quarantines the job',async()=>{
 const s=new MemoryStore(),{i}=await accepted(s);
 const again=await createV2Job(i,'worker-test',{allowLocal:true,store:s,memory:{name:'OTHER'}});
 assert.equal(again.phase,'quarantined');
});
await test('wrapped pre-send RPC interruption queues same admission and reuses completed answer',async()=>{
 const s=new MemoryStore(),{id}=await accepted(s);const lease=(await acquireV2Job(id,s)).lease!;let sends=0;const body={slot:11};
 const run=async(before:any)=>{await before(sha(body),body);sends++;return{value:{exchange:{costMicroUSD:50},key:'choice'},costMicroUSD:50}};
 await v2JobAnswer(id,lease,'slot11',sha(body),run,s);s.data.get(id)!.value.lease.until=Date.now()-1;
 const timeout=Object.assign(new Error('private request detail'),{name:'TimeoutError'});
 const wrapped=Object.assign(new Error('contract execution wrapper',{cause:timeout}),{name:'ContractFunctionExecutionError'});
 await assert.rejects(prepareV2Job(id,()=>async()=>{throw Error('not reached')},{store:s,allowLocal:true,configure:async()=>{throw new V2PreSendCheckError(wrapped)}}));
 const queued=(await s.get<V2Job>(id))!.value;assert.equal(queued.phase,'queued');assert.equal(queued.failureCode,'chain_temporarily_unavailable');assert.equal(queued.failureStage,'chain_check');assert.equal(queued.failureClass,'V2PreSendCheckError>ContractFunctionExecutionError>TimeoutError');assert.equal(queued.lease,undefined);
 assert.equal(Object.keys(queued.answers).length,1);assert.equal((await inspectV2Campaign('worker-test',s))!.chargedMicroUSD,50);
 const successor=(await acquireV2Job(id,s)).lease!;await v2JobAnswer(id,successor,'slot11',sha(body),run,s);assert.equal(sends,1);
});
await test('uncertain provider sends and logical RPC reverts are never transient read retries',async()=>{
 assert.equal(classifyV2PreparationFailure(new V2InferenceError('transport_uncertain',true)).retryable,false);
 const timeout=Object.assign(new Error('timeout'),{name:'TimeoutError'}),revert=Object.assign(new Error('revert',{cause:timeout}),{name:'ContractFunctionRevertedError'});
 assert.equal(classifyV2PreparationFailure(new V2PreSendCheckError(revert)).retryable,false);
 assert.equal(classifyV2PreparationFailure(Object.assign(new Error('invalid RPC'),{name:'RpcRequestError'})).retryable,false);
 const badHttp=Object.assign(new Error('bad request'),{name:'HttpRequestError',status:400});assert.equal(classifyV2PreparationFailure(badHttp).retryable,false);
 assert.equal(classifyV2PreparationFailure(Object.assign(new Error('limited'),{name:'HttpRequestError',status:429})).retryable,true);
});
writeFileSync(new URL('../../TEMP/v2-checks/worker-check.json',import.meta.url),JSON.stringify({scope:'Independent actual worker helpers with explicit synthetic accepted-input fixture and controlled CAS store. No RPC, HTTP, credentials or credits.',report},null,2)+'\n');
console.log(JSON.stringify({tests:report.length,failures:report.filter(x=>x.result==='fail')}));
if(report.some(x=>x.result==='fail'))throw Error('Worker checks failed');
