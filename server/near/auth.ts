import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {storage,type DurableStore} from '../storage';
import {serverConfig} from '../config';
import {updateV2Record} from '../v2/budget';
import {checkNearAccount,nearFinalBlock,nearRpc,nearRuntime} from './rpc';
import {base64Bytes,ed25519PublicBytes,verifyNearMessage} from './encoding';
import {NearError,type NearRuntime} from './types';

interface Challenge {version:2;id:string;accountId:string;networkId:'near-testnet';collection:string;origin:string;message:string;nonce:string;recipient:string;callbackUrl?:string;expiresAt:number;used:boolean}
export interface NearSession {address:string;networkId:'near-testnet';collection:string;expiresAt:number}
const now=()=>Math.floor(Date.now()/1000);
function secret(){const key=serverConfig().signingSecret;if(key.length<32)throw new NearError('connection','Wallet connection is resting. Try again shortly.',503);return key;}
const mac=(payload:string)=>createHmac('sha256',secret()).update('nearlyhuman-native-near-session-v2\n'+payload).digest();
const prefix='near/v2/auth/';
export async function nearChallenge(input:{accountId:unknown;callbackUrl?:unknown},origin:string,client:string,options:{store?:DurableStore;runtime?:NearRuntime}={}){
  const runtime=options.runtime||nearRuntime(),store=options.store||storage(),accountId=checkNearAccount(input.accountId);secret();
  if(!serverConfig().allowedOrigins.includes(origin))throw new NearError('origin','Open NEARlyHuman to connect.',403);
  let callbackUrl:string|undefined;
  if(input.callbackUrl!==undefined){try{const url=new URL(String(input.callbackUrl));if(url.origin!==origin||url.username||url.password||url.hash||url.href.length>512)throw Error();callbackUrl=url.href;}catch{throw new NearError('format','Open NEARlyHuman to connect.',400);}}
  const bucket=Math.floor(now()/600),rateKey=prefix+'rate/'+createHmac('sha256',secret()).update(client+':'+bucket).digest('hex');
  await updateV2Record(store,rateKey,()=>({count:0,expiresAt:(bucket+2)*600}),value=>{if(value.count>=20)throw new NearError('rate','Give your wallet a moment, then try again.',429);value.count++;return value;});
  const id=randomBytes(24).toString('hex'),nonce=randomBytes(32).toString('base64'),expiresAt=now()+300,recipient=new URL(origin).host;
  const message=`Care for your NEARlyHuman rooster. This sign-in does not spend funds.\n\nAccount: ${accountId}\nNetwork: NEAR Testnet\nContract: ${runtime.collection}\nURI: ${origin}\nNonce: ${id}\nExpires: ${new Date(expiresAt*1000).toISOString()}`;
  const challenge:Challenge={version:2,id,accountId,networkId:'near-testnet',collection:runtime.collection,origin,message,nonce,recipient,...(callbackUrl?{callbackUrl}:{}),expiresAt,used:false};
  if(!await store.put(prefix+'challenge/'+id,challenge,{isNew:true}))throw new NearError('busy','Try connecting again.',409);
  return {id,message,nonce,recipient,...(callbackUrl?{callbackUrl}:{})};
}
export async function nearAuthenticate(input:{id:unknown;accountId:unknown;publicKey:unknown;signature:unknown},options:{store?:DurableStore;runtime?:NearRuntime;fullAccessKey?:(account:string,publicKey:string)=>Promise<boolean>}={}){
  const runtime=options.runtime||nearRuntime(),store=options.store||storage(),accountId=checkNearAccount(input.accountId);
  if(typeof input.id!=='string'||!/^[a-f0-9]{48}$/.test(input.id)||typeof input.publicKey!=='string'||typeof input.signature!=='string')throw new NearError('signature','Please sign in again.',401);
  const key=prefix+'challenge/'+input.id,saved=await store.get<Challenge>(key),c=saved?.value;
  if(!saved||!c||c.version!==2||c.used||c.expiresAt<=now()||c.accountId!==accountId||c.networkId!==runtime.networkId||c.collection!==runtime.collection)throw new NearError('signature','Please sign in again.',401);
  let valid=false;
  try{ed25519PublicBytes(input.publicKey);base64Bytes(input.signature,64);valid=verifyNearMessage(c,input.publicKey,input.signature);}catch{/* Bad signatures never consume the nonce. */}
  if(!valid)throw new NearError('signature','The signature did not match this wallet.',401);
  const isFullAccess=options.fullAccessKey||(async(account:string,publicKey:string)=>{
    const block=await nearFinalBlock(runtime);
    try{const access=await nearRpc<{permission:unknown;block_hash:string;block_height:number}>(runtime,'query',{request_type:'view_access_key',account_id:account,public_key:publicKey,block_id:block.hash});return access.permission==='FullAccess'&&access.block_hash===block.hash&&String(access.block_height)===block.height;}catch(error){if(error instanceof NearError&&['UNKNOWN_ACCESS_KEY','UNKNOWN_ACCOUNT'].includes(error.code))return false;throw error;}
  });
  if(!await isFullAccess(accountId,input.publicKey))throw new NearError('signature','Use this account’s current full-access wallet key.',401);
  if(!await store.put(key,{...c,used:true},{etag:saved.etag}))throw new NearError('signature','Please sign in again.',401);
  const expiresAt=now()+12*60*60,payload=Buffer.from(JSON.stringify({address:accountId,networkId:runtime.networkId,collection:runtime.collection,expiresAt} satisfies NearSession)).toString('base64url');
  return {token:payload+'.'+mac(payload).toString('base64url'),expiresAt};
}
export function nearSession(request:Request,runtime:NearRuntime=nearRuntime()):NearSession{
  try{
    const token=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';if(token.length>1500)throw Error();
    const [payload,sig,extra]=token.split('.');if(!payload||!sig||extra)throw Error();const actual=Buffer.from(sig,'base64url'),expected=mac(payload);
    if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw Error();
    const session=JSON.parse(Buffer.from(payload,'base64url').toString()) as NearSession;
    if(session.networkId!==runtime.networkId||session.collection!==runtime.collection||!Number.isSafeInteger(session.expiresAt)||session.expiresAt<=now())throw Error();
    return {...session,address:checkNearAccount(session.address)};
  }catch{throw new NearError('session','Connect your NEAR wallet to continue.',401);}
}
export async function cleanNearAuth(store:DurableStore=storage()){
  for(const sub of ['challenge/','rate/'])for(const key of await store.list(prefix+sub)){const r=await store.get<{expiresAt:number}>(key);if(r&&r.value.expiresAt+3600<now())await store.delete(key);}
}
