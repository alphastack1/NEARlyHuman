import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { baseEncode } from 'near-api-js';
import { keccak256, parseAbi, toHex, type Hex } from 'viem';
import oldRh from '../../contracts/v2/deployments/robinhood-testnet.json';
import newRh from '../../contracts/v3/deployments/robinhood-testnet.json';
import oldNear from '../../contracts/near/deployments/testnet.json';
import { v2PublicClient, verifyV2Runtime, type V2RuntimeIdentity } from '../../server/v2/context';
import { verifyNearRuntime } from '../../server/near/rpc';
import type { NearRuntime } from '../../server/near/types';
import { CUTOVER_CAMPAIGN, CUTOVER_SITE, openCutoverCloud, inspectNativeCutover } from './cloud-control';
import { publicEnvUpdateRequest } from './env-update-request';

const apply=process.argv.includes('--apply'),gate='testnet-transfer-burn-runtime';
if(process.argv.some(arg=>/mainnet|reset|broadcast/.test(arg)))throw Error('This operator only updates reviewed public testnet runtime settings.');
if(apply&&!process.argv.includes('--gate='+gate))throw Error('Explicit testnet runtime configuration gate required.');
const root=path.resolve(import.meta.dirname,'../..'),sha=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
const canonical=(value:unknown):unknown=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,item])=>[key,canonical(item)])):value;
const equal=(a:unknown,b:unknown)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const guest=process.argv.find(arg=>arg.startsWith('--rh-guest='))?.slice(11)||'none',day=process.argv.find(arg=>arg.startsWith('--rh-day='))?.slice(9);
if(guest!=='none'&&(!/^[1-9]\d{0,77}$/.test(guest)||!day||!/^[1-9]\d{0,9}$/.test(day)||Number(day)>0xffffffff)||guest==='none'&&day)throw Error('Specify an exact --rh-guest=ID --rh-day=DAY, or --rh-guest=none.');
const build=JSON.parse(await fs.readFile(path.join(root,'contracts/near-v3/artifacts/build.json'),'utf8')),wasm=await fs.readFile(path.join(root,'contracts/near-v3/artifacts/nearlyhuman_near_v3.wasm'));
if(sha(wasm)!==build.sha256||!WebAssembly.validate(wasm))throw Error('Native candidate artifact changed.');
for(const [source,hash]of Object.entries(build.sources)){if(sha(await fs.readFile(path.join(root,'contracts/near-v3',source)))!==hash)throw Error('Native candidate source changed.');}
const candidateCodeHash=baseEncode(createHash('sha256').update(wasm).digest());
let nearRecord:any;try{nearRecord=JSON.parse(await fs.readFile(path.join(root,'contracts/near-v3/deployments/testnet.json'),'utf8'));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
const nearRuntime={...oldNear.runtime,codeHash:candidateCodeHash} as NearRuntime;
if(nearRecord&&(!equal(nearRecord.runtime,nearRuntime)||nearRecord.artifact.sha256!==build.sha256||nearRecord.upgradeStateProof?.preserved!==true||nearRecord.previousDeployment!=='contracts/near/deployments/testnet.json'))throw Error('Upgraded native deployment record changed.');
const rhRuntime=newRh.runtime as V2RuntimeIdentity,rhClient=v2PublicClient('https://rpc.testnet.chain.robinhood.com',rhRuntime);await verifyV2Runtime(rhClient,rhRuntime);
if(nearRecord)await verifyNearRuntime(nearRuntime);
const control=await openCutoverCloud(),existing=await control.request(control.envEndpoint) as Array<{key:string;scopes:string[];is_secret:boolean;values:Array<{context:string;context_parameter?:string;value?:string}>}>;
type Change={key:string;target:string;allowed:string[];json?:boolean};
const changes:Change[]=[
  {key:'NEARLYHUMAN_V2_RUNTIME_JSON',target:JSON.stringify(rhRuntime),allowed:[JSON.stringify(oldRh.runtime),JSON.stringify(rhRuntime)],json:true},
  {key:'NEARLYHUMAN_V2_RPC_URL',target:'https://rpc.testnet.chain.robinhood.com',allowed:['https://rpc.testnet.chain.robinhood.com']},
  {key:'NEARLYHUMAN_V2_GUEST_ID',target:guest==='none'?'':guest,allowed:['1','',guest==='none'?'':guest]},
  {key:'NEARLYHUMAN_V2_GUEST_DAY',target:guest==='none'?'':day!,allowed:['28','',guest==='none'?'':day!]},
  {key:'NEARLYHUMAN_NEAR_RUNTIME_JSON',target:JSON.stringify(nearRuntime),allowed:[JSON.stringify(oldNear.runtime),JSON.stringify(nearRuntime)],json:true},
];
for(const key of ['NEARLYHUMAN_V2_CAMPAIGN','NEARLYHUMAN_NEAR_CAMPAIGN']){const entry=existing.find(value=>value.key===key);if(!entry||entry.values.length!==1||!['all','production'].includes(entry.values[0]!.context)||entry.values[0]!.value!==CUTOVER_CAMPAIGN)throw Error('The existing shared funded campaign setting changed. No new allocation will be created.');}
const enabled=existing.find(entry=>entry.key==='NEARLYHUMAN_NEAR_ENABLED');if(!enabled||enabled.values.length!==1||enabled.values[0]!.value!=='1')throw Error('Native service enable setting changed.');
function checked(entry:typeof existing[number]|undefined,change:Change){
  if(!entry||entry.is_secret||entry.scopes.length!==1||entry.scopes[0]!=='functions'||entry.values.length!==1||!['all','production'].includes(entry.values[0]!.context)||entry.values[0]!.context_parameter)throw Error('Inspect the existing scope/context of '+change.key+' before replacing it.');
  const value=entry.values[0]!.value;if(typeof value!=='string')throw Error('Public setting unavailable: '+change.key);
  const matches=(candidate:string)=>{if(!change.json)return candidate===value;try{return equal(JSON.parse(candidate),JSON.parse(value));}catch{return false;}};
  if(!change.allowed.some(matches))throw Error('Existing value is outside the reviewed old/new allowlist: '+change.key);
  return {key:change.key,context:entry.values[0]!.context,scopes:entry.scopes,changed:!matches(change.target)};
}
const selected=new Set(changes.map(change=>change.key)),unchangedHash=(entries:typeof existing)=>sha(JSON.stringify(canonical(entries.filter(entry=>!selected.has(entry.key)).map(entry=>({key:entry.key,scopes:entry.scopes,is_secret:entry.is_secret,values:entry.values.map(value=>({context:value.context,...(value.context_parameter?{context_parameter:value.context_parameter}:{}),value:value.value}))})).sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0))));
const plan=changes.map(change=>({...checked(existing.find(entry=>entry.key===change.key),change),updateMethod:publicEnvUpdateRequest(existing.find(entry=>entry.key===change.key)!,change.target).method,target:change.target})),preservedHash=unchangedHash(existing);
const planHash=sha(JSON.stringify(canonical({siteId:CUTOVER_SITE,campaignId:CUTOVER_CAMPAIGN,targets:plan.map(({key,context,scopes,target})=>({key,context,scopes,target})),preservedHash})));
let guestVerified=false;
if(guest!=='none'){
  const abi=parseAbi(['function dayRecord(uint256 id,uint32 day) view returns((bytes32 requestId,bytes32 seed,bytes32 stateHash,bytes32 traceHash,bytes32 certificateHash,bytes32 replayCommitment,uint256 reward,bytes history))']);
  const head=await verifyV2Runtime(rhClient,rhRuntime),record=await rhClient.readContract({address:rhRuntime.collection,abi,functionName:'dayRecord',args:[BigInt(guest),Number(day)],blockNumber:head.number!});
  const packet=(await control.store.get<any>('v2/packets/'+record.replayCommitment))?.value;
  if(/^0x0{64}$/.test(record.requestId)||!packet||keccak256(toHex(JSON.stringify(packet)))!==record.replayCommitment||packet.requestId!==record.requestId||packet.result?.state?.day!==Number(day)||(await rhClient.getBlock({blockNumber:head.number!})).hash!==head.hash)throw Error('The exact active RH guest is not an actual cloud-backed saved day.');guestVerified=true;
}
const report={checkedAt:new Date().toISOString(),mode:apply?'apply':'dry-run',siteId:CUTOVER_SITE,planHash,readyForApply:!!nearRecord,nativeRecord:nearRecord?'contracts/near-v3/deployments/testnet.json':'awaiting verified upgrade record',rhCollection:rhRuntime.collection,nativeCollection:nearRuntime.collection,nativeCodeHash:nearRuntime.codeHash,campaignId:CUTOVER_CAMPAIGN,rhGuest:guest==='none'?null:{id:guest,day:Number(day),verified:guestVerified},keys:plan.map(({target,...value})=>value),privateAndOtherSettingsHash:preservedHash,environmentWrites:0,deployments:0,financialStoreMutations:0};
await fs.mkdir(new URL('../../TEMP/rh-v3/',import.meta.url),{recursive:true});await fs.writeFile(new URL('../../TEMP/rh-v3/runtime-env-plan.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
if(apply){
  if(!nearRecord)throw Error('Finish and verify the code-only native upgrade before configuring its pin.');
  if(process.argv.find(arg=>arg.startsWith('--expected-plan='))?.slice(16)!==planHash)throw Error('Apply requires the exact reviewed --expected-plan hash.');
  const native=await inspectNativeCutover(nearRuntime,oldNear.owner,control.store);
  const rhCheck=spawnSync(process.execPath,['--import','tsx',path.resolve(import.meta.dirname,'inspect-cutover.ts')],{encoding:'utf8',windowsHide:true,timeout:180000});if(rhCheck.status!==0)throw Error('Fresh original RH inspection failed.');const rh=JSON.parse(rhCheck.stdout.trim().split(/\r?\n/).at(-1)!);
  if(!native.quiescent||!rh.quiescent||rh.budget.campaignId!==native.budget.campaignId)throw Error('Pause and drain both original admission scopes without resetting their campaign.');
  const [base,query]=control.envEndpoint.split('?');
  for(const change of changes){const fresh=await control.request(control.envEndpoint) as typeof existing;if(unchangedHash(fresh)!==preservedHash)throw Error('An unrelated setting changed; preserve it and review a fresh plan.');const variable=fresh.find(value=>value.key===change.key),entry=checked(variable,change);if(!entry.changed)continue;const update=publicEnvUpdateRequest(variable!,change.target);await control.request(`${base}/${encodeURIComponent(change.key)}?${query}`,update.method,update.body);report.environmentWrites++;}
  const after=await control.request(control.envEndpoint) as typeof existing;if(unchangedHash(after)!==preservedHash||changes.some(change=>checked(after.find(entry=>entry.key===change.key),change).changed))throw Error('Public runtime readback needs review; no rollback or private overwrite was attempted.');
  await fs.writeFile(new URL('../../TEMP/rh-v3/runtime-env-applied.json',import.meta.url),JSON.stringify({...report,verified:true,drain:{rh,native}},null,2)+'\n');
}
console.log(JSON.stringify(report));
