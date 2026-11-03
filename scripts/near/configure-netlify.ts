import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { unlockNearWallet } from './local-wallet';

const siteId='15eabb4e-7828-4019-a628-2da95c19d2bd';
const deployment=JSON.parse(await fs.readFile('contracts/near/deployments/testnet.json','utf8'));
const guest=process.argv.find(value=>value.startsWith('--guest-id='))?.slice(11);
const guestDay=process.argv.find(value=>value.startsWith('--guest-day='))?.slice(12)||'1';
if(guest&&(!/^[1-9]\d{0,19}$/.test(guest)||!/^[1-9]\d{0,9}$/.test(guestDay)))throw Error('Choose an actual saved native guest day.');
const publicValues:Record<string,string>={
 NEARLYHUMAN_NEAR_RUNTIME_JSON:JSON.stringify(deployment.runtime),
 NEARLYHUMAN_NEAR_CAMPAIGN:'nearlyhuman-v2-testnet-20261102',
 NEARLYHUMAN_NEAR_ENABLED:'1',
 ...(guest?{NEARLYHUMAN_NEAR_GUEST_ID:guest,NEARLYHUMAN_NEAR_GUEST_DAY:guestDay}:{}),
};
if(!process.argv.includes('--apply'))console.log(JSON.stringify({mode:'dry-run',siteId,publicKeys:Object.keys(publicValues),privateKeys:['NEARLYHUMAN_NEAR_RELAY_KEY'],nodeVersion:'24',deploymentCodeHash:deployment.runtime.codeHash,deployTriggered:false}));
else{
 if(!process.argv.includes('--gate=native-testnet-integration'))throw Error('Exact native testnet service configuration gate required.');
 process.env.NEARLYHUMAN_NEAR_QA_WALLET='1';const relay=unlockNearWallet('relay');
 if(Buffer.from(relay.getPublicKey().data).toString('base64')!==deployment.runtime.quoteSigner)throw Error('The private native relay does not match the deployment.');
 const config=JSON.parse(await fs.readFile(path.join(process.env.APPDATA||path.join(os.homedir(),'AppData/Roaming'),'netlify/Config/config.json'),'utf8'));
 const headers={Authorization:'Bearer '+config.users[config.userId].auth.token,'content-type':'application/json'};
 const siteResponse=await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`,{headers});if(!siteResponse.ok)throw Error('Could not verify the target site.');
 const site=await siteResponse.json() as {id:string;name:string;account_slug:string};if(site.id!==siteId||site.name!=='nearlyhuman')throw Error('Unexpected deployment target.');
 const endpoint=`https://api.netlify.com/api/v1/accounts/${encodeURIComponent(site.account_slug)}/env`,query='?site_id='+siteId;
 const existingResponse=await fetch(endpoint+query,{headers});if(!existingResponse.ok)throw Error('Could not inspect existing service configuration.');
 const existing=await existingResponse.json() as Array<{key:string;scopes:string[];is_secret:boolean;values:Array<{context:string;context_parameter?:string;value?:string}>}>;
 const values={...publicValues,NEARLYHUMAN_NEAR_RELAY_KEY:relay.toString()};
 const report=[];
 for(const [key,value]of Object.entries(values)){
  // Netlify requires explicit contexts for protected values. The native signer
  // belongs only to production Functions, never to browser/build environments.
  const secret=key.endsWith('_KEY'),context=secret?'production':'all';
  const old=existing.find(entry=>entry.key===key);if(old?.values.some(entry=>entry.context!==context))throw Error('A native setting already has a custom context; preserve it for explicit review.');
  const body={key,scopes:['functions'],is_secret:secret,values:[{context,value}]};
  const response=await fetch(endpoint+(old?'/'+encodeURIComponent(key):'')+query,{method:old?'PUT':'POST',headers,body:JSON.stringify(old?body:[body])});
  if(!response.ok)throw Error('Native service configuration failed for '+key+' (HTTP '+response.status+'). No secret response is printed.');
  report.push({key,configured:true,secret:body.is_secret});
 }
 // The official SDK requires modern Node. Keep all other environment variables,
 // scopes and credentials unchanged; apply the runtime only on the final build.
 const node=existing.find(entry=>entry.key==='NODE_VERSION');
 if(node?.is_secret||node?.values.some(entry=>entry.context!=='all'))throw Error('The Node runtime has custom settings; preserve them for explicit review.');
 const nodeBody={key:'NODE_VERSION',scopes:node?.scopes||['builds','functions'],is_secret:false,values:[{context:'all',value:'24'}]};
 const nodeResponse=await fetch(endpoint+(node?'/NODE_VERSION':'')+query,{method:node?'PUT':'POST',headers,body:JSON.stringify(node?nodeBody:[nodeBody])});
 if(!nodeResponse.ok){const result=await nodeResponse.json().catch(()=>({}));throw Error('Could not configure the supported Node runtime (HTTP '+nodeResponse.status+'): '+String(result.message||'No public validation message').slice(0,300));}
 console.log(JSON.stringify({siteId,configured:report,nodeVersion:'24',deployTriggered:false}));
}
