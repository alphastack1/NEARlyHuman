import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifyNearRuntime } from '../../server/near/rpc';
import type { NearRuntime } from '../../server/near/types';
import { actions, executeNearOperation, nativeOperationInfo } from '../near/operator';
import { nearWalletMetadata } from '../near/local-wallet';
import { CUTOVER_CAMPAIGN, openCutoverCloud, inspectNativeCutover } from './cloud-control';

const broadcast=process.argv.includes('--broadcast'),gate='resume-native-transfer-burn-v3';
if(process.argv.some(arg=>/mainnet|reset|upgrade|envwrite/.test(arg)))throw Error('This operator only resumes the reviewed native testnet admissions.');
if(broadcast&&!process.argv.includes('--gate='+gate))throw Error('Explicit native testnet resume gate required.');
let record:any;
try{record=JSON.parse(await fs.readFile(new URL('../../contracts/near-v3/deployments/testnet.json',import.meta.url),'utf8'));}
catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT'||broadcast)throw error;console.log(JSON.stringify({mode:'read-only',readyForResume:false,reason:'Awaiting the verified native upgrade record.',signatures:0,environmentWrites:0}));process.exit(0);}
const ACCOUNT='game.nearlyhuman-dev-20261102-26c8bd.testnet',OWNER='nearlyhuman-dev-20261102-26c8bd.testnet',CODE='EpAuccLZgjZys3NdpqpHi87kaANgsMZyt17DHHix69GK',SHA='cd3d6e1b58739ea6a697c7a70c343b7e4d9e9f077a3eb7f55479ccddddd70070';
if(record.version!==3||record.runtime.collection!==ACCOUNT||record.owner!==OWNER||record.runtime.codeHash!==CODE||record.artifact.sha256!==SHA||record.upgradeStateProof?.preserved!==true||record.previousDeployment!=='contracts/near/deployments/testnet.json'||nearWalletMetadata('owner').accountId!==OWNER)throw Error('Verified upgraded native identity changed.');
const wasm=await fs.readFile(new URL('../../contracts/near-v3/artifacts/nearlyhuman_near_v3.wasm',import.meta.url));if(createHash('sha256').update(wasm).digest('hex')!==SHA)throw Error('Native artifact changed.');
const runtime=record.runtime as NearRuntime,{config,block}=await verifyNearRuntime(runtime);if(config.owner_id!==OWNER||config.transfer_burn_bps!==50||config.transfer_burn_enabled!==true)throw Error('Native owner or transfer policy changed.');
const control=await openCutoverCloud(),environment=await control.request(control.envEndpoint) as Array<{key:string;values:Array<{context:string;value?:string}>}>;
for(const key of ['NEARLYHUMAN_V2_CAMPAIGN','NEARLYHUMAN_NEAR_CAMPAIGN']){const entry=environment.find(value=>value.key===key);if(!entry||entry.values.length!==1||entry.values[0]!.value!==CUTOVER_CAMPAIGN)throw Error('The shared funded campaign setting changed.');}
const pin=environment.find(value=>value.key==='NEARLYHUMAN_NEAR_RUNTIME_JSON');if(!pin||pin.values.length!==1||!pin.values[0]?.value)throw Error('Public native service pin is unavailable.');
const configured=JSON.parse(pin.values[0]!.value!);for(const key of ['version','networkId','network','collection','rpcUrl','codeHash','rulesHash','decisionConfig','relayer','quoteSigner'] as const)if(configured[key]!==runtime[key])throw Error('Configure the new native service pin before resuming admissions.');
const hostedUrl='https://nearlyhuman.netlify.app/api/near/v2/config?'+new URLSearchParams({networkId:'near-testnet',collection:ACCOUNT,releaseCheck:String(Date.now())});
const response=await fetch(hostedUrl,{headers:{'cache-control':'no-cache'},cache:'no-store',signal:AbortSignal.timeout(30_000)});if(!response.ok)throw Error('Publish and verify the new native backend before resuming admissions.');
const hosted=await response.json() as any;for(const key of ['collection','codeHash','rulesHash','decisionConfig','relayer','quoteSigner'] as const)if(hosted[key]!==runtime[key])throw Error('The published native backend still has another runtime pin.');
if(hosted.networkId!=='near-testnet'||hosted.transferBurn?.enabled!==true||hosted.transferBurn?.bps!==50)throw Error('The published backend has not verified the new transfer policy.');
const obligations=await inspectNativeCutover(runtime,OWNER,control.store);
const operation='resume-native-transfer-burn-v3-20261104',previous=await nativeOperationInfo(operation);
let transaction:unknown;
if(broadcast&&(config.admissions_paused||previous?.status==='prepared')){
  if(config.admissions_paused&&!obligations.quiescent)throw Error('Finish the existing native obligations before resuming. Never reset their reservations.');
  // This enables only the existing private in-process operator helper.
  process.env.NEARLYHUMAN_NEAR_QA_WALLET='1';
  const result=await executeNearOperation({id:operation,role:'owner',receiver:ACCOUNT,actions:[actions.functionCall('set_admissions_paused',{paused:false},30000000000000n,0n)]});
  const after=await verifyNearRuntime(runtime);if(after.config.owner_id!==OWNER||after.config.admissions_paused)throw Error('Native resume state needs checking; preserve its original journal.');transaction={hash:result.hash,paused:false,observedBlock:after.block.height};
}
const report={checkedAt:new Date().toISOString(),mode:broadcast?'resume':'read-only',networkId:'near-testnet',collection:ACCOUNT,codeHash:CODE,observedBlock:block.height,hostedRuntimeVerified:true,configuredRuntimeVerified:true,sharedCampaign:CUTOVER_CAMPAIGN,readyForResume:config.admissions_paused&&obligations.quiescent,alreadyOpen:!config.admissions_paused,...(transaction?{transaction}:{}),obligations,financialStoreMutations:0,environmentWrites:0,inferenceCalls:0};
await fs.mkdir(new URL('../../TEMP/rh-v3/',import.meta.url),{recursive:true});await fs.writeFile(new URL('../../TEMP/rh-v3/native-resume-plan.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
