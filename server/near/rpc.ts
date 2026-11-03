import { NearError, type NearBlock, type NearRuntime, type NearContractConfig } from './types';
import { base58Decode } from './encoding';
import { v2DecisionConfig } from '../v2/preparation';

export const isNearAccount=(value:unknown):value is string=>typeof value==='string'&&value.length>=2&&value.length<=64&&/^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/.test(value);
export function checkNearAccount(value:unknown):string {if(!isNearAccount(value))throw new NearError('format','Choose your NEAR account.',400);return value;}
export function nearRuntime():NearRuntime {
  try {
    const r=JSON.parse(process.env.NEARLYHUMAN_NEAR_RUNTIME_JSON||'') as NearRuntime;
    const local=process.env.NEARLYHUMAN_NEAR_LOCAL==='1',url=new URL(r.rpcUrl);
    if(r.version!==2||r.networkId!=='near-testnet'||r.network!=='testnet'||!isNearAccount(r.collection)||!isNearAccount(r.relayer)
      ||!local&&(!r.collection.endsWith('.testnet')||!r.relayer.endsWith('.testnet'))
      ||url.protocol!=='https:'&&!(local&&url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname))
      ||url.username||url.password||!/^0x[0-9a-f]{64}$/.test(r.rulesHash)||!/^0x[0-9a-f]{64}$/.test(r.decisionConfig)
      ||r.decisionConfig!==v2DecisionConfig(r.rulesHash))throw Error();
    base58Decode(r.codeHash,32);if(Buffer.from(r.quoteSigner,'base64').length!==32||Buffer.from(r.quoteSigner,'base64').toString('base64')!==r.quoteSigner)throw Error();
    return {version:2,networkId:'near-testnet',network:'testnet',collection:r.collection,rpcUrl:r.rpcUrl,codeHash:r.codeHash,rulesHash:r.rulesHash,decisionConfig:r.decisionConfig,relayer:r.relayer,quoteSigner:r.quoteSigner};
  }catch{throw new NearError('connection','This NEAR home is resting. Try again shortly.',503);}
}
export const nearConfigured=()=>!!process.env.NEARLYHUMAN_NEAR_RUNTIME_JSON;
const retryableReadMethods=new Set(['query','status','block','gas_price','EXPERIMENTAL_protocol_config','tx']);
export async function nearRpc<T>(runtime:NearRuntime,method:string,params:unknown,timeout=15000):Promise<T>{
  let response:Response|undefined;
  const body=JSON.stringify({jsonrpc:'2.0',id:'nearlyhuman',method,params});
  for(let attempt=0;attempt<2;attempt++){
    try{response=await fetch(runtime.rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},body,signal:AbortSignal.timeout(timeout)});}catch{throw new NearError('connection','Checking this NEAR home again.',503,true);}
    if(response.status===429&&attempt===0&&retryableReadMethods.has(method)){
      const retryAfter=response.headers.get('retry-after'),seconds=retryAfter===null?NaN:Number(retryAfter),date=retryAfter===null?NaN:Date.parse(retryAfter);
      const requested=Number.isFinite(seconds)?seconds*1000:Number.isFinite(date)?date-Date.now():250,delay=Math.min(1000,Math.max(250,requested));
      await response.body?.cancel().catch(()=>{});await new Promise(resolve=>setTimeout(resolve,delay));continue;
    }
    break;
  }
  if(!response)throw new NearError('connection','Checking this NEAR home again.',503,true);
  if(!response.ok)throw new NearError('connection','Checking this NEAR home again.',503,true);
  let value:{result?:T;error?:{cause?:{name?:string};name?:string;data?:unknown}};
  try{value=await response.json();}catch{throw new NearError('connection','Checking this NEAR home again.',503,true);}
  if(value.error){const code=value.error.cause?.name||value.error.name||'RPC_ERROR';throw new NearError(code,['UNKNOWN_TRANSACTION','TIMEOUT_ERROR'].includes(code)?'Checking the original NEAR transaction.':'Checking this NEAR home again.',503,!['INVALID_TRANSACTION','INVALID_ACCOUNT','UNKNOWN_ACCOUNT','UNKNOWN_ACCESS_KEY'].includes(code));}
  if(value.result===undefined)throw new NearError('connection','Checking this NEAR home again.',503,true);return value.result;
}
export async function nearFinalBlock(runtime:NearRuntime):Promise<NearBlock>{
  const b=await nearRpc<{header:{height:number;hash:string;timestamp_nanosec?:string;timestamp?:number|string}}>(runtime,'block',{finality:'final'});
  if(!Number.isSafeInteger(b.header.height)||b.header.height<0)throw new NearError('connection','Checking the NEAR block again.',503,true);
  base58Decode(b.header.hash,32);return {height:String(b.header.height),hash:b.header.hash,timestamp:(BigInt(b.header.timestamp_nanosec||b.header.timestamp||0)/1000000000n).toString()};
}
export async function nearView<T>(runtime:NearRuntime,method:string,args:unknown={},block?:NearBlock):Promise<T>{
  const q=await nearRpc<{result:number[];block_hash:string;block_height:number}>(runtime,'query',{request_type:'call_function',account_id:runtime.collection,method_name:method,args_base64:Buffer.from(JSON.stringify(args)).toString('base64'),...(block?{block_id:block.hash}:{finality:'final'})});
  if(block&&(q.block_hash!==block.hash||String(q.block_height)!==block.height))throw new NearError('context','The NEAR read changed. Try again.');
  try{return JSON.parse(Buffer.from(q.result).toString('utf8')) as T;}catch{throw new NearError('context','The NEAR save needs another check.');}
}
export async function verifyNearRuntime(runtime:NearRuntime=nearRuntime()){
  const block=await nearFinalBlock(runtime),[status,account,config]=await Promise.all([
    nearRpc<{chain_id:string}>(runtime,'status',[]),
    nearRpc<{code_hash:string}>(runtime,'query',{request_type:'view_account',account_id:runtime.collection,block_id:block.hash}),
    nearView<NearContractConfig>(runtime,'config',{},block),
  ]);
  const local=process.env.NEARLYHUMAN_NEAR_LOCAL==='1'&&['127.0.0.1','localhost'].includes(new URL(runtime.rpcUrl).hostname);
  if(status.chain_id!=='testnet'&&!(local&&(status.chain_id==='localnet'||status.chain_id==='sandbox'||status.chain_id.startsWith('test-chain')))
    ||account.code_hash!==runtime.codeHash||config.network_id!==runtime.networkId||config.contract_id!==runtime.collection||config.relayer_id!==runtime.relayer
    ||config.quote_public_key!==runtime.quoteSigner||config.rules_hash!==runtime.rulesHash||config.decision_config!==runtime.decisionConfig)throw new NearError('context','The NEAR game connection needs another check.');
  return {runtime,block,config};
}
