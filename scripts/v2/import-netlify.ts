import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {getStore} from '@netlify/blobs';
import {inspectV2Campaign,inspectV2Pool,V2_STORE_CUTOVER_KEY} from '../../server/v2/budget';
import {storage,type DurableStore,type Stored} from '../../server/storage';
import {createPublicClient,http,parseAbi} from 'viem';
import {robinhoodTestnet} from '../../src/chain/config';
import {deployments} from '../../src/chain/deployments';
import {isHosted} from '../../server/config';
import {v2HttpTransport} from '../../src/chain/v2-transport';

// Deliberately no dotenv/local-secret loader, environment mutation or deployment.
if(isHosted())throw Error('Run this cutover from the private local workstation store, without a hosted runtime environment.');
const SITE='15eabb4e-7828-4019-a628-2da95c19d2bd',STORE='nearlyhuman-v1';
const apply=process.argv.includes('--apply'),quiescent=process.argv.includes('--quiescent');
const expectedHash=process.argv.find(a=>a.startsWith('--manifest-hash='))?.slice('--manifest-hash='.length);
const sourceDir=path.resolve(process.env.NEARLYHUMAN_DATA_DIR||path.join(os.homedir(),'.codex/data/nearlyhuman'));
const outboxKey='control/relay-46630-0x3c63fd61b244b3b3290c74993f603816c6144c26';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
type RecordValue={key:string;value:unknown;etag?:string};
type Row={key:string;sha256:string;bytes:number;value:unknown};
async function snapshot(){
 const rows:Row[]=[],all=new Map<string,unknown>();let total=0;
 for(const entry of await fs.readdir(sourceDir,{withFileTypes:true})){
  if(!entry.isFile()||!entry.name.endsWith('.json'))continue;
  const saved=JSON.parse(await fs.readFile(path.join(sourceDir,entry.name),'utf8')) as RecordValue;
  if(typeof saved.key!=='string')continue;
  if(all.has(saved.key))throw Error('Duplicate durable key in the local store.');all.set(saved.key,saved.value);
  if(!saved.key.startsWith('v2/'))continue;
  if(saved.key.length>500||saved.key.includes('..')||saved.value===undefined)throw Error('Invalid V2 durable record.');
  const json=JSON.stringify(saved.value),bytes=Buffer.byteLength(json);total+=bytes;
  if(bytes>10_000_000||rows.length>=1000||total>50_000_000)throw Error('The bounded V2 import needs inspection.');
  rows.push({key:saved.key,sha256:hash(json),bytes,value:saved.value});
 }
 rows.sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);
 return {rows,all,total,manifestHash:hash(JSON.stringify(rows.map(({key,sha256,bytes})=>({key,sha256,bytes}))))};
}
class SnapshotStore implements DurableStore{
 constructor(private values:Map<string,unknown>){}
 async get<T>(key:string):Promise<Stored<T>|null>{return this.values.has(key)?{value:structuredClone(this.values.get(key)) as T,etag:'snapshot'}:null;}
 async list(prefix:string){return [...this.values.keys()].filter(k=>k.startsWith(prefix));}
 async put<T>(_key:string,_value:T,_condition?:{etag?:string;isNew?:boolean}):Promise<boolean>{throw Error('Read-only snapshot.');}
 async delete(_key:string):Promise<void>{throw Error('Read-only snapshot.');}
}
function assertIdleRelay(value:unknown,label:string){const v=value as {pending?:unknown;lease?:{until?:number}}|null;if(v?.pending||v?.lease&&typeof v.lease.until==='number'&&v.lease.until>Date.now())throw Error(label+' relay is not quiescent.');}
function assertIdleV1(value:unknown){const v=value as {holds?:Record<string,{status?:string}>}|null;if(Object.values(v?.holds||{}).some(h=>h.status==='held'||h.status==='accepted'))throw Error('Cloud V1 admissions must finish before cutover.');}
async function validateSource(s:Awaited<ReturnType<typeof snapshot>>){
 const store=new SnapshotStore(s.all),campaigns=[];
 if(!s.rows.length||!s.all.has('v2/control/ai-pool'))throw Error('The complete existing V2 pool is required; never bootstrap an empty replacement.');
 for(const row of s.rows){
  const value=row.value as Record<string,any>;
  if(row.key.startsWith('v2/jobs/')&&(!['ready','failed','expired'].includes(value.phase)||value.lease&&value.lease.until>Date.now()))throw Error('Finish every local V2 job before importing.');
  if(row.key.startsWith('v2/quotes/')&&value.status!=='retired')throw Error('Retire every accepted or unused quote before importing.');
  if(row.key.startsWith('v2/control/relay-gas/')&&Object.keys(value.holds||{}).length)throw Error('Release verified terminal V2 gas holds before importing.');
  if(row.key.startsWith('v2/ai-campaigns/')){
   if(Object.values(value.jobs||{}).some((j:any)=>j.active))throw Error('A local funded job allowance is still active.');
   if(Object.values(value.entries||{}).some((e:any)=>e.status==='sent'))throw Error('A paid response is still in flight. Finish or conservatively reconcile it before sealing the source.');
   const report=await inspectV2Campaign(row.key.slice('v2/ai-campaigns/'.length),store);if(!report)throw Error('Missing campaign audit.');campaigns.push(report);
  }
 }
 assertIdleRelay(s.all.get(outboxKey),'Local');
 const pool=await inspectV2Pool(store);if(!pool)throw Error('Missing validated V2 pool.');
 return {campaigns,pool};
}
async function token(){
 if(process.env.NETLIFY_AUTH_TOKEN)return process.env.NETLIFY_AUTH_TOKEN;
 const file=path.join(process.env.APPDATA||path.join(os.homedir(),'AppData/Roaming'),'netlify/Config/config.json');
 const cfg=JSON.parse(await fs.readFile(file,'utf8'));const value=cfg.users?.[cfg.userId]?.auth?.token;
 if(typeof value!=='string'||!value)throw Error('Use the already signed-in Netlify CLI account.');return value;
}
const access=await token(),siteResponse=await fetch('https://api.netlify.com/api/v1/sites/'+SITE,{headers:{Authorization:'Bearer '+access},signal:AbortSignal.timeout(20000)});
if(!siteResponse.ok)throw Error('Netlify site metadata is unavailable.');
const site=await siteResponse.json() as {id:string;name:string;ssl_url:string};
if(site.id!==SITE||site.name!=='nearlyhuman'||site.ssl_url!=='https://nearlyhuman.netlify.app')throw Error('The target is not the authorized production site.');
const target=getStore({name:STORE,siteID:SITE,token:access,consistency:'strong'}),source=await snapshot(),{campaigns,pool}=await validateSource(source);
if(await target.get(V2_STORE_CUTOVER_KEY,{type:'json',consistency:'strong'}))throw Error('The hosted target has a spending fence. Inspect that record without deleting or overwriting it.');
const chain=createPublicClient({chain:robinhoodTestnet,transport:v2HttpTransport(robinhoodTestnet.rpcUrls.default.http[0],{timeout:20000,retryCount:2}),cacheTime:0});
if(await chain.getChainId()!==46630)throw Error('The admission-pause check is not on Robinhood testnet.');
const block=await chain.getBlock(),v1Paused=await chain.readContract({address:deployments[46630]!.address,abi:parseAbi(['function admissionPaused() view returns(bool)']),functionName:'admissionPaused',blockNumber:block.number!});
if((await chain.getBlock({blockNumber:block.number!})).hash!==block.hash)throw Error('The V1 admission-pause check changed.');
const [cloudV1,cloudRelay]=await Promise.all([target.get('control/admission-v1',{type:'json',consistency:'strong'}),target.get(outboxKey,{type:'json',consistency:'strong'})]);
assertIdleV1(cloudV1);assertIdleRelay(cloudRelay,'Cloud');
const legacyKeys:string[]=[];for await(const page of target.list({prefix:'jobs/',paginate:true})){legacyKeys.push(...page.blobs.map(b=>b.key));if(legacyKeys.length>1000)throw Error('The cloud V1 job audit exceeds its inspection bound.');}
const legacyJobs:any[]=[];for(let at=0;at<legacyKeys.length;at+=8)legacyJobs.push(...await Promise.all(legacyKeys.slice(at,at+8).map(key=>target.get(key,{type:'json',consistency:'strong'}))));
if(legacyJobs.some(job=>!job||!['ready','failed','expired','unaccepted'].includes(job.phase)||job.lease&&job.lease.until>Date.now()))throw Error('Cloud V1 workers must finish before cutover.');
const existingKeys:string[]=[];for await(const page of target.list({prefix:'v2/',paginate:true}))existingKeys.push(...page.blobs.map(b=>b.key));
if(existingKeys.length>1000)throw Error('The cloud V2 namespace exceeds the bounded inspection limit.');
const sourceKeys=new Set(source.rows.map(r=>r.key));if(existingKeys.some(k=>!sourceKeys.has(k)))throw Error('Cloud V2 contains records outside this source snapshot. Inspect them before importing.');
let same=0;const missing:Row[]=[];
for(const row of source.rows){const found=await target.getWithMetadata(row.key,{type:'json',consistency:'strong'});if(found){if(hash(JSON.stringify(found.data))!==row.sha256)throw Error('A cloud V2 record differs: '+row.key);same++;}else missing.push(row);}
const report={mode:apply?'apply':'dry-run',siteId:SITE,store:STORE,sourceRecords:source.rows.length,sourceBytes:source.total,manifestHash:source.manifestHash,identicalCloudRecords:same,missingCloudRecords:missing.length,campaigns,pool,v1Paused,v1PauseObservedBlock:block.number!.toString(),drainedCloudV1Jobs:legacyJobs.length,readyForApply:v1Paused,blockers:v1Paused?[]:['Pause V1 admissions and repeat the cloud drain audit before any V2 public relayer send or import.'],cloudV1Preserved:true,cloudOutboxPreserved:true,environmentWrites:0,deployments:0};
console.log(JSON.stringify(report));
const ops=path.join(sourceDir,'ops');await fs.mkdir(ops,{recursive:true});
const manifestFile=path.join(ops,'v2-netlify-import-manifest.json');
await fs.writeFile(manifestFile,JSON.stringify({...report,at:new Date().toISOString(),records:source.rows.map(({key,sha256,bytes})=>({key,sha256,bytes}))},null,2)+'\n');
if(!apply)process.exit(0);
if(!v1Paused)throw Error('V1 admissions must be paused onchain before importing any V2 records.');
if(!quiescent||expectedHash!==source.manifestHash)throw Error('Apply requires --quiescent and the exact reviewed --manifest-hash. Stop local V2 workers first.');
if((await snapshot()).manifestHash!==source.manifestHash)throw Error('The local source changed before import.');
// Persist a one-way local spending fence before the cloud gains an allocation.
// It is not copied: the target becomes the sole worker, while the original source
// retains every charge and refuses a later accidental restart of that allowance.
const local=storage(),oldSeal=await local.get<{version:number;siteId:string;store:string;manifestHash:string;phase:string}>(V2_STORE_CUTOVER_KEY);
if(oldSeal&&(oldSeal.value.version!==2||oldSeal.value.siteId!==SITE||oldSeal.value.store!==STORE||oldSeal.value.manifestHash!==source.manifestHash))throw Error('The source store was sealed for another cutover. Inspect it without resetting it.');
if(!oldSeal&&!await local.put(V2_STORE_CUTOVER_KEY,{version:2,siteId:SITE,store:STORE,manifestHash:source.manifestHash,phase:'sealed',at:new Date().toISOString()},{isNew:true}))throw Error('Another cutover owns the local spending fence.');
if((await snapshot()).manifestHash!==source.manifestHash)throw Error('Local work changed at the spending fence; preserve the seal and inspect before importing.');
// Import dependencies first. The financial pool is last; no partial run advertises
// a usable new allocation. No rollback ever deletes a financial record.
missing.sort((a,b)=>Number(a.key==='v2/control/ai-pool')-Number(b.key==='v2/control/ai-pool')||(a.key<b.key?-1:1));
let created=0;
for(const row of missing){
 const fresh=await snapshot();if(fresh.manifestHash!==source.manifestHash)throw Error('The local source changed during import. Preserve the partial import and inspect.');assertIdleRelay(fresh.all.get(outboxKey),'Local');
 const result=await target.setJSON(row.key,row.value,{onlyIfNew:true});
 const checked=await target.getWithMetadata(row.key,{type:'json',consistency:'strong'});
 if(!checked||hash(JSON.stringify(checked.data))!==row.sha256)throw Error('A concurrent or incomplete import needs inspection: '+row.key);
 if(result.modified)created++;
}
if((await snapshot()).manifestHash!==source.manifestHash)throw Error('The local source changed at import completion.');
for(const row of source.rows){const checked=await target.getWithMetadata(row.key,{type:'json',consistency:'strong'});if(!checked||hash(JSON.stringify(checked.data))!==row.sha256)throw Error('The final V2 namespace needs inspection.');}
const finalKeys:string[]=[];for await(const page of target.list({prefix:'v2/',paginate:true}))finalKeys.push(...page.blobs.map(b=>b.key));
if(finalKeys.length!==source.rows.length||finalKeys.some(key=>!sourceKeys.has(key)))throw Error('The cloud V2 namespace changed during import.');
const finished={...report,created,checkedAt:new Date().toISOString(),complete:true};
const seal=await local.get<Record<string,unknown>>(V2_STORE_CUTOVER_KEY);
if(!seal||seal.value.manifestHash!==source.manifestHash||!await local.put(V2_STORE_CUTOVER_KEY,{...seal.value,phase:'complete',completedAt:finished.checkedAt},{etag:seal.etag}))throw Error('The cloud import completed but its source fence needs inspection. Do not restart local spending.');
await fs.writeFile(path.join(ops,'v2-netlify-import-result.json'),JSON.stringify(finished,null,2)+'\n');console.log(JSON.stringify(finished));
