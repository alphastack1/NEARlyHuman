import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { getStore } from '@netlify/blobs';
import type { DurableStore } from '../../server/storage';
import { inspectV2Campaign, inspectV2Pool } from '../../server/v2/budget';
import { nearView, verifyNearRuntime } from '../../server/near/rpc';
import type { NearRuntime, NearLife } from '../../server/near/types';

export const CUTOVER_CAMPAIGN='nearlyhuman-v2-testnet-20261102';
export const CUTOVER_SITE='15eabb4e-7828-4019-a628-2da95c19d2bd';
const transientNetworkCodes=new Set(['UND_ERR_SOCKET','ECONNRESET','ETIMEDOUT','EAI_AGAIN','UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT']);
const retryableReadStatuses=new Set([429,502,503,504]);
const retryDelay=(attempt:number)=>new Promise(resolve=>setTimeout(resolve,Math.min(500,100*(attempt+1))));
function transientNetwork(error:unknown){
  let current=error;
  for(let depth=0;current&&typeof current==='object'&&depth<4;depth++){
    const item=current as {name?:string;code?:string;cause?:unknown};
    if(item.name==='TimeoutError'||item.name==='AbortError'||item.code&&transientNetworkCodes.has(item.code))return true;
    current=item.cause;
  }
  return false;
}
/** Error projection deliberately emits schema field names only, never the
 * returned value/message, request data or an encrypted/private response. */
async function validationFields(response:Response){
  if(![400,422].includes(response.status))return '';
  let text:string;try{text=JSON.stringify(await response.json()).slice(0,20_000);}catch{return '';}
  const fields=['context','context_parameter','key','values','scopes','value','is_secret'].filter(field=>new RegExp('\\b'+field+'\\b','i').test(text));
  return fields.length?' Validation fields: '+fields.join(', ')+'.':'';
}
/** GET may safely retry a stale socket. A write is sent once; its caller resumes
 * only after a new target-value read, never by blindly repeating a PATCH. */
export async function cutoverControlRequest(token:string,endpoint:string,method='GET',body?:unknown,fetcher:typeof fetch=fetch):Promise<any>{
  const read=method==='GET';
  for(let attempt=0;attempt<3;attempt++){
    try{
      const response=await fetcher('https://api.netlify.com/api/v1'+endpoint,{method,headers:{Authorization:'Bearer '+token,Connection:'close',...(body===undefined?{}:{'content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20_000)});
      if(read&&retryableReadStatuses.has(response.status)&&attempt<2){await response.body?.cancel().catch(()=>{});await retryDelay(attempt);continue;}
      if(!response.ok)throw Error(`Netlify control request failed (HTTP ${response.status}).${await validationFields(response)} Private responses are withheld.`);
      return response.status===204?undefined:await response.json();
    }catch(error){
      if(read&&attempt<2&&transientNetwork(error)){await retryDelay(attempt);continue;}
      if(error instanceof Error&&error.message.startsWith('Netlify control request failed (HTTP '))throw error;
      throw Error(read?'Netlify public settings read is unavailable after its bounded retry.':'Netlify settings write response is uncertain. Inspect the exact target value before resuming; do not resend blindly.');
    }
  }
  throw Error('Netlify public settings read is unavailable.');
}
export async function openCutoverCloud(){
  let token=process.env.NETLIFY_AUTH_TOKEN;
  if(!token){const filename=path.join(process.env.APPDATA||path.join(os.homedir(),'AppData/Roaming'),'netlify/Config/config.json'),config=JSON.parse(await fs.readFile(filename,'utf8'));token=config.users?.[config.userId]?.auth?.token;}
  if(!token)throw Error('Use the existing signed-in Netlify CLI account.');
  const request=(endpoint:string,method='GET',body?:unknown)=>cutoverControlRequest(token!,endpoint,method,body);
  const site=await request('/sites/'+CUTOVER_SITE) as {id:string;name:string;ssl_url:string;account_slug:string};
  if(site.id!==CUTOVER_SITE||site.name!=='nearlyhuman'||site.ssl_url!=='https://nearlyhuman.netlify.app'||site.account_slug!=='metamellow-apps')throw Error('Unexpected Netlify site/account.');
  const cloud=getStore({name:'nearlyhuman-v1',siteID:CUTOVER_SITE,token,consistency:'strong'});
  const store:DurableStore={async get<T>(key:string){const found=await cloud.getWithMetadata(key,{type:'json',consistency:'strong'});return found?{value:found.data as T,etag:found.etag||'read-only'}:null;},async list(prefix:string){const keys:string[]=[];for await(const page of cloud.list({prefix,paginate:true})){keys.push(...page.blobs.map(item=>item.key));if(keys.length>1500)throw Error('Cloud inspection exceeds its bounded record count.');}return keys;},async put(){throw Error('Cloud financial/service store is read-only.');},async delete(){throw Error('Cloud financial/service store is read-only.');}};
  return {store,request,envEndpoint:`/accounts/${site.account_slug}/env?site_id=${CUTOVER_SITE}`};
}

export async function inspectNativeCutover(runtime:NearRuntime,expectedOwner:string,store:DurableStore){
  const {block,config}=await verifyNearRuntime(runtime);
  if(config.owner_id!==expectedOwner)throw Error('Native owner changed.');
  const supply=BigInt(await nearView<string>(runtime,'nft_total_supply',{},block));if(supply>128n)throw Error('Native collection exceeds inspection bound.');
  const tokens:{token_id:string}[]=[];for(let offset=0;offset<Number(supply);offset+=24){const page=await nearView<{token_id:string}[]>(runtime,'nft_tokens',{from_index:String(offset),limit:Math.min(24,Number(supply)-offset)},block);if(page.length!==Math.min(24,Number(supply)-offset))throw Error('Incomplete native token enumeration.');tokens.push(...page);}if(new Set(tokens.map(token=>token.token_id)).size!==Number(supply))throw Error('Duplicate native token enumeration.');
  let pending=0;for(const token of tokens){const life=await nearView<NearLife|null>(runtime,'life',{token_id:token.token_id},block);if(!life)throw Error('Native life disappeared.');if(life.pending_request)pending++;}
  const jobPrefix=`near/v2/jobs/${runtime.networkId}/${runtime.collection}/`,quotePrefix=`near/v2/quotes/${runtime.networkId}/${runtime.collection}/`;
  let held=0,retiring=0,expired=0,foreignCampaigns=0;for(const key of await store.list(quotePrefix)){const quote=(await store.get<{status:string;expiresAt:string;campaignId:string}>(key))?.value;if(!quote||quote.status==='retired')continue;if(quote.status==='held')held++;else if(quote.status==='retiring')retiring++;else throw Error('Unknown native quote state.');if(BigInt(quote.expiresAt)<BigInt(block.timestamp))expired++;if(quote.campaignId!==CUTOVER_CAMPAIGN)foreignCampaigns++;}
  const phases:Record<string,number>={};let nonterminal=0,leases=0;for(const key of await store.list(jobPrefix)){const job=(await store.get<{phase:string;lease?:{until:number}}>(key))?.value;if(!job)throw Error('Native job disappeared.');phases[job.phase]=(phases[job.phase]||0)+1;if(!['ready','failed','expired'].includes(job.phase))nonterminal++;if(job.lease&&job.lease.until>Date.now())leases++;}
  const gas=(await store.get<{holds:Record<string,string>}>(`near/v2/control/relay-gas/${runtime.networkId}/${runtime.relayer}`))?.value,gasHolds=Object.entries(gas?.holds||{}).filter(([id])=>id.startsWith(jobPrefix));
  const relay=(await store.get<{pending?:unknown;lease?:{until:number}}>(`near/v2/control/relay/${runtime.networkId}/${runtime.relayer}`))?.value;
  const campaign=(await store.get<{jobs?:Record<string,{active:boolean;limitMicroUSD:number;chargedMicroUSD:number}>;entries:Record<string,{jobId?:string;status:string}>}>(`v2/ai-campaigns/${CUTOVER_CAMPAIGN}`))?.value;
  const activeJobs=Object.entries(campaign?.jobs||{}).filter(([id,job])=>id.startsWith(jobPrefix)&&job.active),uncertain=Object.values(campaign?.entries||{}).filter(entry=>entry.jobId?.startsWith(jobPrefix)&&entry.status!=='complete').length;
  const [validated,pool]=await Promise.all([inspectV2Campaign(CUTOVER_CAMPAIGN,store),inspectV2Pool(store)]);if(!validated||!pool)throw Error('Existing shared funded campaign is missing.');
  const nativeReserved=(config as unknown as {native_storage_reserved:string}).native_storage_reserved;if(!/^(0|[1-9]\d*)$/.test(nativeReserved))throw Error('Native day reserve needs checking.');
  return {networkId:runtime.networkId,collection:runtime.collection,codeHash:runtime.codeHash,observedBlock:block.height,observedBlockHash:block.hash,
    chain:{admissionsPaused:config.admissions_paused,nftSupply:supply.toString(),pending,nativeStorageReserved:nativeReserved,rewardReserved:config.reserved},quotes:{held,retiring,expired,foreignCampaigns},jobs:{phases,nonterminal,activeLeases:leases},
    gas:{holds:gasHolds.length,reservedYoctoNEAR:gasHolds.reduce((sum,[,amount])=>sum+BigInt(amount),0n).toString()},relay:{pending:!!relay?.pending,activeLease:!!relay?.lease&&relay.lease.until>Date.now()},
    budget:{campaignId:CUTOVER_CAMPAIGN,limitMicroUSD:validated.limitMicroUSD,chargedMicroUSD:validated.chargedMicroUSD,activeNativeJobAllowances:activeJobs.length,uncertainNativeCalls:uncertain,poolCommittedMicroUSD:pool.committedMicroUSD,poolUnallocatedMicroUSD:pool.unallocatedMicroUSD},
    quiescent:config.admissions_paused&&pending===0&&nativeReserved==='0'&&config.reserved==='0'&&held+retiring===0&&foreignCampaigns===0&&nonterminal===0&&leases===0&&gasHolds.length===0&&!relay?.pending&&!(relay?.lease&&relay.lease.until>Date.now())&&activeJobs.length===0&&uncertain===0};
}
