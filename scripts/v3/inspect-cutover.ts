import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getStore } from '@netlify/blobs';
import { parseAbi, type Hex } from 'viem';
import original from '../../contracts/v2/deployments/robinhood-testnet.json';
import { v2PublicClient, verifyV2Runtime, type V2RuntimeIdentity } from '../../server/v2/context';
import { v2DecisionConfig } from '../../server/v2/preparation';
import { inspectV2Pool, inspectV2Campaign } from '../../server/v2/budget';
import type { DurableStore } from '../../server/storage';

// This operator has no mutation mode, transaction signer, inference or env writer.
if(process.argv.some(arg=>/^--(?:apply|broadcast|pause|reconcile|reset)/.test(arg)))throw Error('This inspector is read-only.');
const SITE='15eabb4e-7828-4019-a628-2da95c19d2bd', STORE='nearlyhuman-v1';
const campaignId=process.argv.find(arg=>arg.startsWith('--campaign='))?.slice(11)||'nearlyhuman-v2-testnet-20261102';
if(!/^[a-z0-9][a-z0-9-]{1,79}$/.test(campaignId))throw Error('Choose the existing funded campaign.');
let token=process.env.NETLIFY_AUTH_TOKEN;
if(!token){const file=path.join(process.env.APPDATA||path.join(os.homedir(),'AppData/Roaming'),'netlify/Config/config.json'),config=JSON.parse(await fs.readFile(file,'utf8'));token=config.users?.[config.userId]?.auth?.token;}
if(!token)throw Error('Use the already signed-in Netlify CLI account.');
const response=await fetch('https://api.netlify.com/api/v1/sites/'+SITE,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20_000)});
if(!response.ok)throw Error('Netlify site identity could not be checked.');
const site=await response.json() as {id:string;name:string;ssl_url:string};
if(site.id!==SITE||site.name!=='nearlyhuman'||site.ssl_url!=='https://nearlyhuman.netlify.app')throw Error('Unexpected Netlify site.');
const cloud=getStore({name:STORE,siteID:SITE,token,consistency:'strong'});
const store:DurableStore={
  async get<T>(key:string){const found=await cloud.getWithMetadata(key,{type:'json',consistency:'strong'});return found?{value:found.data as T,etag:found.etag||'read-only'}:null;},
  async list(prefix:string){const keys:string[]=[];for await(const page of cloud.list({prefix,paginate:true})){keys.push(...page.blobs.map(item=>item.key));if(keys.length>1500)throw Error('Inspection exceeds its bounded record count.');}return keys;},
  async put(){throw Error('Read-only inspection.');},async delete(){throw Error('Read-only inspection.');},
};
const runtime={...original.runtime,decisionConfig:v2DecisionConfig(original.runtime.rulesHash as Hex)} as V2RuntimeIdentity;
const client=v2PublicClient('https://rpc.testnet.chain.robinhood.com',runtime),block=await verifyV2Runtime(client,runtime);
const abi=parseAbi(['function nextTokenId() view returns(uint256)','function admissionsPaused() view returns(bool)','function pending(uint256 id) view returns(bytes32)','function request(bytes32 id) view returns((uint256 tokenId,address player,uint32 baseRevision,uint32 day,uint64 kitMask,bool shipping,uint64 acceptedAt,uint64 deadline,bytes32 daySeed,bytes32 decisionConfig,bytes32 baseHash,uint256 pressure,uint256 reservedReward,uint8 status))']);
const at={address:runtime.collection,abi,blockNumber:block.number!},[minted,paused]=await Promise.all([client.readContract({...at,functionName:'nextTokenId'}),client.readContract({...at,functionName:'admissionsPaused'})]);
if(minted>128n)throw Error('Inspect this larger collection with an explicitly bounded operator.');
const pendingIds:Hex[]=[];for(let id=1n;id<=minted;id++){const pending=await client.readContract({...at,functionName:'pending',args:[id]});if(!/^0x0{64}$/.test(pending))pendingIds.push(pending);}
let pendingExpired=0;for(const id of pendingIds){const request=await client.readContract({...at,functionName:'request',args:[id]});if(request.status!==1)throw Error('Unexpected pending/request status.');if(request.deadline<block.timestamp)pendingExpired++;}
const scope=`${runtime.chainId}:${runtime.collection.toLowerCase()}:`,jobsPrefix=`v2/jobs/${runtime.chainId}/${runtime.collection.toLowerCase()}/`;
const quotes:{held:number;retiring:number;expired:number;notExpired:number;campaigns:Set<string>}={held:0,retiring:0,expired:0,notExpired:0,campaigns:new Set()};
for(const key of await store.list('v2/quotes/')){const quote=(await store.get<{scope:string;status:string;expiresAt:string;campaignId:string}>(key))?.value;if(!quote?.scope.startsWith(scope)||quote.status==='retired')continue;if(!['held','retiring'].includes(quote.status))throw Error('Unknown quote status.');quotes[quote.status as 'held'|'retiring']++;quotes.campaigns.add(quote.campaignId);if(BigInt(quote.expiresAt)<block.timestamp)quotes.expired++;else quotes.notExpired++;}
const phases:Record<string,number>={};let nonterminalJobs=0,jobLeases=0;
for(const key of await store.list(jobsPrefix)){const job=(await store.get<{phase:string;lease?:{until:number}}>(key))?.value;if(!job)throw Error('Job disappeared during inspection.');phases[job.phase]=(phases[job.phase]||0)+1;if(!['ready','failed','expired'].includes(job.phase))nonterminalJobs++;if(job.lease&&job.lease.until>Date.now())jobLeases++;}
const recovery={records:0,confirmed:0,reverted:0,unconfirmed:0};
for(const key of await store.list(`v2/recovery/${runtime.chainId}/${runtime.collection.toLowerCase()}/`)){const journal=(await store.get<{hash:Hex}>(key))?.value;if(!journal)throw Error('Recovery record disappeared.');recovery.records++;try{const receipt=await client.getTransactionReceipt({hash:journal.hash});if(receipt.status==='success')recovery.confirmed++;else recovery.reverted++;}catch{recovery.unconfirmed++;}}
const gas=(await store.get<{holds:Record<string,string>}>(`v2/control/relay-gas/${runtime.chainId}/${runtime.relayer.toLowerCase()}`))?.value;
const oldGas=Object.entries(gas?.holds||{}).filter(([id])=>id.startsWith(jobsPrefix));
const campaign=(await store.get<{jobs?:Record<string,{active:boolean;limitMicroUSD:number;chargedMicroUSD:number}>;entries:Record<string,{jobId?:string;status:string}>}>(`v2/ai-campaigns/${campaignId}`))?.value;
const campaignJobs=Object.entries(campaign?.jobs||{}).filter(([id])=>id.startsWith(jobsPrefix)),activeCampaignJobs=campaignJobs.filter(([,job])=>job.active);
const uncertainOldCalls=Object.values(campaign?.entries||{}).filter(entry=>entry.jobId?.startsWith(jobsPrefix)&&entry.status!=='complete').length;
const relay=(await store.get<{pending?:{jobId?:string};lease?:{until:number}}>(`control/relay-${runtime.chainId}-${runtime.relayer.toLowerCase()}`))?.value;
const [pool,validatedCampaign]=await Promise.all([inspectV2Pool(store),inspectV2Campaign(campaignId,store)]);
if(!pool||!validatedCampaign)throw Error('The original funded campaign or pool is missing; preserve it and inspect.');
if((await client.getBlock({blockNumber:block.number!})).hash!==block.hash)throw Error('The chain observation changed.');
const report={checkedAt:new Date().toISOString(),mode:'read-only',siteId:SITE,store:STORE,chainId:runtime.chainId,collection:runtime.collection,observedBlock:block.number!.toString(),observedBlockHash:block.hash,
  chain:{admissionsPaused:paused,minted:minted.toString(),pending:pendingIds.length,pendingExpired},quotes:{held:quotes.held,retiring:quotes.retiring,expired:quotes.expired,notExpired:quotes.notExpired,campaignCount:quotes.campaigns.size,allUseExpectedCampaign:[...quotes.campaigns].every(id=>id===campaignId)},
  jobs:{phases,nonterminal:nonterminalJobs,activeLeases:jobLeases},recovery,
  gas:{oldHolds:oldGas.length,oldReservedWei:oldGas.reduce((sum,[,amount])=>sum+BigInt(amount),0n).toString(),allCollectionHolds:Object.keys(gas?.holds||{}).length},
  budget:{campaignId,limitMicroUSD:validatedCampaign.limitMicroUSD,chargedMicroUSD:validatedCampaign.chargedMicroUSD,halted:validatedCampaign.halted,oldJobAllowances:campaignJobs.length,oldActiveJobAllowances:activeCampaignJobs.length,oldUnspentActiveAllowanceMicroUSD:activeCampaignJobs.reduce((sum,[,job])=>sum+Math.max(0,job.limitMicroUSD-job.chargedMicroUSD),0),oldUncertainCalls:uncertainOldCalls,poolCommittedMicroUSD:pool.committedMicroUSD,poolUnallocatedMicroUSD:pool.unallocatedMicroUSD},
  relay:{pending:!!relay?.pending,pendingForOriginalCollection:!!relay?.pending?.jobId?.startsWith(jobsPrefix),activeLease:!!relay?.lease&&relay.lease.until>Date.now()},
  quiescent:paused&&pendingIds.length===0&&quotes.held+quotes.retiring===0&&nonterminalJobs===0&&jobLeases===0&&recovery.unconfirmed===0&&recovery.reverted===0&&oldGas.length===0&&activeCampaignJobs.length===0&&uncertainOldCalls===0&&!relay?.pending&&!(relay?.lease&&relay.lease.until>Date.now()),
  mutations:0,inferenceCalls:0,transactionSignatures:0,environmentWrites:0};
const destination=new URL('../../TEMP/rh-v3/cutover-inspection.json',import.meta.url);await fs.mkdir(new URL('../../TEMP/rh-v3/',import.meta.url),{recursive:true});await fs.writeFile(destination,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
