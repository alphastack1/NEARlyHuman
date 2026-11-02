import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync,mkdirSync} from 'node:fs';
import {createV2Campaign,paidV2Call,inspectV2Campaign,reserveV2JobBudget,finishV2JobBudget,requireV2JobBudget} from '../../server/v2/budget.ts';
import type {DurableStore,Stored} from '../../server/storage.ts';

class MemoryStore implements DurableStore {
 data=new Map<string,Stored<any>>();serial=0;
 async get<T>(key:string){return structuredClone(this.data.get(key)||null) as Stored<T>|null;}
 async put<T>(key:string,value:T,condition:{etag?:string;isNew?:boolean}={}){
  const old=this.data.get(key);if(condition.isNew&&old||condition.etag&&old?.etag!==condition.etag)return false;
  this.data.set(key,{value:structuredClone(value),etag:String(++this.serial)});return true;
 }
 async list(prefix:string){return [...this.data.keys()].filter(k=>k.startsWith(prefix));}
 async delete(key:string){this.data.delete(key);}
}
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const body={model:'scripted-no-http',questions:{next_action:'one'}};const inputHash=sha(JSON.stringify(body));
mkdirSync(new URL('../../TEMP/v2-checks/',import.meta.url),{recursive:true});
const report:any[]=[];
const test=async(name:string,f:()=>Promise<void>)=>{try{await f();report.push({name,result:'pass'});}catch(e){report.push({name,result:'fail',error:String(e)});}};

await test('campaign and complete-answer cache are idempotent',async()=>{
 const s=new MemoryStore();await createV2Campaign('cache-test',10000,s);await createV2Campaign('cache-test',10000,s);let sends=0;
 const run=async(before:any)=>{await before(inputHash,body);sends++;return{value:{key:'choice'},costMicroUSD:123}};
 assert.deepEqual(await paidV2Call('cache-test','one',inputHash,run,s),{key:'choice'});
 assert.deepEqual(await paidV2Call('cache-test','one',inputHash,run,s),{key:'choice'});
 assert.equal(sends,1);assert.equal((await inspectV2Campaign('cache-test',s))!.chargedMicroUSD,123);
 await assert.rejects(createV2Campaign('cache-test',11000,s));
});
await test('two concurrent callers cannot buy the same request twice',async()=>{
 const s=new MemoryStore();await createV2Campaign('concurrent-test',15000,s);let sends=0;
 const run=async(before:any)=>{await before(inputHash,body);sends++;await new Promise(r=>setTimeout(r,20));return{value:{key:'choice'},costMicroUSD:37}};
 const outcomes=await Promise.allSettled([paidV2Call('concurrent-test','one',inputHash,run,s),paidV2Call('concurrent-test','one',inputHash,run,s)]);
 assert.equal(sends,1);assert(outcomes.some(x=>x.status==='fulfilled'));assert.equal((await inspectV2Campaign('concurrent-test',s))!.chargedMicroUSD,37);
});
await test('uncertain request stays charged and is not silently resent',async()=>{
 const s=new MemoryStore();await createV2Campaign('uncertain-test',15000,s);let sends=0;
 const run=async(before:any)=>{await before(inputHash,body);sends++;throw Error('simulated lost response')};
 await assert.rejects(paidV2Call('uncertain-test','one',inputHash,run,s));
 await assert.rejects(paidV2Call('uncertain-test','one',inputHash,run,s));
 assert.equal(sends,1);const c=(await inspectV2Campaign('uncertain-test',s))!;assert.equal(c.chargedMicroUSD,5000);assert.equal(c.uncertain,1);
});
await test('above-reserve cost records actual and halts later sends',async()=>{
 const s=new MemoryStore();await createV2Campaign('overrun-test',15000,s);let sends=0;
 const run=async(before:any)=>{await before(inputHash,body);sends++;return{value:{key:'one'},costMicroUSD:6000}};
 await paidV2Call('overrun-test','one',inputHash,run,s);const c=(await inspectV2Campaign('overrun-test',s))!;assert(c.halted);assert.equal(c.chargedMicroUSD,6000);
 await assert.rejects(paidV2Call('overrun-test','two',inputHash,run,s));assert.equal(sends,1);
});
await test('mismatched body is rejected before reservation/send',async()=>{
 const s=new MemoryStore();await createV2Campaign('mismatch-test',10000,s);let sends=0;
 await assert.rejects(paidV2Call('mismatch-test','one',inputHash,async before=>{await before(inputHash,{different:true});sends++;return{value:{},costMicroUSD:0}},s));
 assert.equal(sends,0);assert.equal((await inspectV2Campaign('mismatch-test',s))!.chargedMicroUSD,0);
});
await test('missing normalized cost retains the conservative send reserve',async()=>{
 const s=new MemoryStore();await createV2Campaign('missing-cost-test',10000,s);
 await assert.rejects(paidV2Call('missing-cost-test','one',inputHash,async before=>{await before(inputHash,body);return{value:{},costMicroUSD:NaN}},s));
 const c=(await inspectV2Campaign('missing-cost-test',s))!;assert.equal(c.chargedMicroUSD,5000);assert.equal(c.uncertain,1);
});

await test('malformed persisted numeric accounting rejects before provider work',async()=>{
 const s=new MemoryStore();await createV2Campaign('corruption-test',10000,s);let sends=0;
 s.data.get('v2/ai-campaigns/corruption-test')!.value.chargedMicroUSD='0';
 await assert.rejects(paidV2Call('corruption-test','one',inputHash,async before=>{await before(inputHash,body);sends++;return{value:{},costMicroUSD:1}},s));assert.equal(sends,0);
});
await test('V1 envelope raised to a dollar prevents overlapping V2 allocation',async()=>{
 const before=process.env.NEARLYHUMAN_AI_BUDGET_USD;process.env.NEARLYHUMAN_AI_BUDGET_USD='1';
 try{await assert.rejects(createV2Campaign('overlap-test',10000,new MemoryStore()));}
 finally{if(before===undefined)delete process.env.NEARLYHUMAN_AI_BUDGET_USD;else process.env.NEARLYHUMAN_AI_BUDGET_USD=before;}
});
await test('whole-job holds block an unfunded third job and preserve spend when released',async()=>{
 const s=new MemoryStore();await createV2Campaign('job-hold-test',100000,s);
 await reserveV2JobBudget('job-hold-test','job1',s);await reserveV2JobBudget('job-hold-test','job2',s);
 await assert.rejects(reserveV2JobBudget('job-hold-test','job3',s));
 await paidV2Call('job-hold-test','job1:slot11',inputHash,async before=>{await before(inputHash,body);return{value:{key:'choice'},costMicroUSD:123}},s,'job1');
 assert.equal((await inspectV2Campaign('job-hold-test',s))!.chargedMicroUSD,123);
 await finishV2JobBudget('job-hold-test','job1',s);await reserveV2JobBudget('job-hold-test','job3',s);
 assert.equal((await inspectV2Campaign('job-hold-test',s))!.chargedMicroUSD,123);
 await assert.rejects(requireV2JobBudget('job-hold-test','job1',s));await assert.rejects(reserveV2JobBudget('job-hold-test','job1',s));
});
await test('non-job research calls cannot consume capacity reserved for active jobs',async()=>{
 const s=new MemoryStore();await createV2Campaign('job-capacity-test',80000,s);await reserveV2JobBudget('job-capacity-test','job1',s);await reserveV2JobBudget('job-capacity-test','job2',s);let sends=0;
 await assert.rejects(paidV2Call('job-capacity-test','unfunded',inputHash,async before=>{await before(inputHash,body);sends++;return{value:{},costMicroUSD:1}},s));assert.equal(sends,0);
});
await test('finished job cannot send or reset its spent allowance',async()=>{
 const s=new MemoryStore();await createV2Campaign('job-final-test',50000,s);await reserveV2JobBudget('job-final-test','job1',s);await finishV2JobBudget('job-final-test','job1',s);let sends=0;
 await assert.rejects(paidV2Call('job-final-test','job1:new',inputHash,async before=>{await before(inputHash,body);sends++;return{value:{},costMicroUSD:1}},s,'job1'));assert.equal(sends,0);
});
await test('missing campaign with an existing allocation cannot restart at zero',async()=>{
 const s=new MemoryStore();await createV2Campaign('missing-campaign-test',10000,s);await s.delete('v2/ai-campaigns/missing-campaign-test');
 await assert.rejects(createV2Campaign('missing-campaign-test',10000,s));assert.equal(s.data.get('v2/control/ai-pool')!.value.allocations['missing-campaign-test'],10000);
});
await test('missing pool with campaign history refuses bootstrap and paid work',async()=>{
 const s=new MemoryStore();await createV2Campaign('missing-pool-test',10000,s);await s.delete('v2/control/ai-pool');let sends=0;
 await assert.rejects(createV2Campaign('new-pool-test',10000,s));
 await assert.rejects(paidV2Call('missing-pool-test','one',inputHash,async before=>{await before(inputHash,body);sends++;return{value:{},costMicroUSD:1}},s));assert.equal(sends,0);
});
await test('campaign limit must still match its fixed pool allocation',async()=>{
 const s=new MemoryStore();await createV2Campaign('allocation-test',10000,s);s.data.get('v2/ai-campaigns/allocation-test')!.value.limitMicroUSD=20000;let sends=0;
 await assert.rejects(paidV2Call('allocation-test','one',inputHash,async before=>{await before(inputHash,body);sends++;return{value:{},costMicroUSD:1}},s));assert.equal(sends,0);
});
writeFileSync(new URL('../../TEMP/v2-checks/budget-check.json',import.meta.url),JSON.stringify({scope:'Independent controlled DurableStore/scripted-provider races; zero HTTP, credentials or credits.',report},null,2)+'\n');
console.log(JSON.stringify({tests:report.length,failures:report.filter(x=>x.result==='fail')}));
if(report.some(x=>x.result==='fail'))throw Error('Budget critical checks failed');
