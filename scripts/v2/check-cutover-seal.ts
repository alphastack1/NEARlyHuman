import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {V2_STORE_CUTOVER_KEY,createV2Campaign,reserveV2JobBudget,finishV2JobBudget,paidV2Call,inspectV2Campaign,inspectV2Pool,closeV2Campaign} from '../../server/v2/budget';
import type {DurableStore,Stored} from '../../server/storage';
class MemoryStore implements DurableStore{
 data=new Map<string,Stored<any>>();n=0;
 async get<T>(key:string){return structuredClone(this.data.get(key)||null) as Stored<T>|null;}
 async put<T>(key:string,value:T,c:{etag?:string;isNew?:boolean}={}){const old=this.data.get(key);if(c.isNew&&old||c.etag&&old?.etag!==c.etag)return false;this.data.set(key,{value:structuredClone(value),etag:String(++this.n)});return true;}
 async list(prefix:string){return [...this.data.keys()].filter(k=>k.startsWith(prefix));}
 async delete(key:string){this.data.delete(key);}
}
const input={choice:'scripted only'},hash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
const seal=(s:MemoryStore,phase='sealed')=>s.put(V2_STORE_CUTOVER_KEY,{version:2,siteId:'local-fixture',store:'nearlyhuman-v1',manifestHash:'fixture',phase},{isNew:true});
const results:string[]=[];
{
 const s=new MemoryStore();await createV2Campaign('public',50000,s);let sends=0;
 const provider=async(before:any)=>{await before(hash,input);sends++;return{value:{choice:'one'},costMicroUSD:123};};
 await paidV2Call('public','cached',hash,provider,s);await seal(s,'complete');
 const before=JSON.stringify([...s.data.entries()].filter(([k])=>k.startsWith('v2/')));
 await assert.rejects(createV2Campaign('new-campaign',5000,s));await assert.rejects(reserveV2JobBudget('public','new-job',s));await assert.rejects(paidV2Call('public','new-send',hash,provider,s));await assert.rejects(closeV2Campaign('public','not permitted after handoff',s));
 assert.deepEqual(await paidV2Call('public','cached',hash,provider,s),{choice:'one'});assert.equal(sends,1);
 assert.equal(JSON.stringify([...s.data.entries()].filter(([k])=>k.startsWith('v2/'))),before);
 assert.equal((await inspectV2Campaign('public',s))!.chargedMicroUSD,123);assert.equal((await inspectV2Pool(s))!.committedMicroUSD,50000);
 results.push('complete source seal blocks new allocations/holds/sends/closure while cached answer remains free and ledger bytes unchanged');
}
{
 const s=new MemoryStore();await createV2Campaign('public',50000,s);let entered!:()=>void,resume!:()=>void,sends=0;
 const ready=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>resume=r);
 const pending=paidV2Call('public','not-yet-sent',hash,async before=>{entered();await gate;await before(hash,input);sends++;return{value:{},costMicroUSD:1};},s);
 await ready;await seal(s);resume();await assert.rejects(pending);assert.equal(sends,0);assert.equal((await inspectV2Campaign('public',s))!.chargedMicroUSD,0);
 results.push('seal stops an already-entered provider before its mandatory paid-send fence');
}
{
 const s=new MemoryStore();await createV2Campaign('public',50000,s);await reserveV2JobBudget('public','existing-job',s);let entered!:()=>void,resume!:()=>void;
 const ready=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>resume=r);
 const pending=paidV2Call('public','already-sent',hash,async before=>{await before(hash,input);entered();await gate;return{value:{choice:'old'},costMicroUSD:37};},s,'existing-job');
 await ready;assert.equal((await inspectV2Campaign('public',s))!.chargedMicroUSD,5000);await seal(s);resume();await pending;await finishV2JobBudget('public','existing-job',s);
 assert.equal((await inspectV2Campaign('public',s))!.chargedMicroUSD,37);assert.equal(s.data.get('v2/ai-campaigns/public')!.value.jobs['existing-job'].active,false);
 results.push('previously reserved send reconciles actual cost and retires existing allowance after seal; this active fixture would fail import quiescence preflight');
}
{
 const s=new MemoryStore();await createV2Campaign('public',50000,s);await s.put(V2_STORE_CUTOVER_KEY,{});await assert.rejects(reserveV2JobBudget('public','new-job',s));
 results.push('malformed source seal remains closed rather than reopening spending');
}
const report={scope:'Controlled in-memory source seal checks; no Netlify writes, real inference, production ledger or chain transactions.',passed:results.length,results};
mkdirSync(new URL('../../TEMP/v2-checks/',import.meta.url),{recursive:true});writeFileSync(new URL('../../TEMP/v2-checks/cutover-seal.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
