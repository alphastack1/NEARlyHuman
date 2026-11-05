import {serverConfig} from '../config';
import {StoreConflict} from '../storage';
import {BudgetError} from '../evm/budget';
import {evmLifePortrait} from '../evm/portrait';
import {nearChallenge,nearAuthenticate,nearSession} from './auth';
import {nearRuntime} from './rpc';
import {readNearPublicConfig,readNearPublicLife,readNearPublicLives,readNearPublicDays,readNearPublicDay,readNearPublicReplay,readNearPublicRequest,readNearPublicGuest,nearNftMetadata} from './views';
import {quoteNearOwnerDay,acceptNearOwnerDay,getNearOwnerJob,wakeNearOwnerDay} from './service';
import {NearError} from './types';

const json=(value:unknown,status=200,cache='no-store')=>new Response(JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':cache}});
export async function handleNearApi(request:Request):Promise<Response>{
  try{
    const url=new URL(request.url),path=url.pathname,runtime=nearRuntime();
    if(path.length>512)throw new NearError('not_found','This page has wandered off.',404);
    const network=url.searchParams.get('networkId'),collection=url.searchParams.get('collection');
    if(network!==null&&network!==runtime.networkId||collection!==null&&collection!==runtime.collection||url.searchParams.has('chainId'))throw new NearError('not_found','Choose the exact NEAR life to visit.',404);
    if(request.method==='POST'){
      const origin=request.headers.get('origin')||url.origin;
      if(!serverConfig().allowedOrigins.includes(origin))throw new NearError('origin','Open NEARlyHuman to continue.',403);
      if(!request.headers.get('content-type')?.includes('application/json'))throw new NearError('format','Please try again.',415);
      if(Number(request.headers.get('content-length'))>64000)throw new NearError('size','Choose fewer supplies and try again.',413);
      const text=await request.text();if(Buffer.byteLength(text)>64000)throw new NearError('size','Choose fewer supplies and try again.',413);
      let body:Record<string,unknown>;try{body=JSON.parse(text);if(!body||Array.isArray(body)||typeof body!=='object')throw Error();}catch{throw new NearError('format','Please try again.',400);}
      if(path==='/api/near/auth/challenge')return json(await nearChallenge({accountId:body.accountId,callbackUrl:body.callbackUrl},origin,request.headers.get('x-nf-client-connection-ip')||request.headers.get('x-forwarded-for')||'local'));
      if(path==='/api/near/auth/verify')return json(await nearAuthenticate(body as {id:unknown;accountId:unknown;publicKey:unknown;signature:unknown}));
      const player=nearSession(request,runtime).address;
      if(path==='/api/near/quote')return json(await quoteNearOwnerDay(player,body as {tokenId:string;kitMask:string;shipping?:boolean}));
      if(path==='/api/near/accept')return json(await acceptNearOwnerDay(player,body));
      if(path==='/api/near/wake')return json(await wakeNearOwnerDay(body.requestId,player));
      throw new NearError('not_found','This page has wandered off.',404);
    }
    if(request.method!=='GET')return json({error:{code:'method',message:'Open this page again.'}},405);
    if(path==='/api/near/session')return json(nearSession(request,runtime));
    if(path==='/api/near/config')return json(await readNearPublicConfig());
    if(path==='/api/near/guest')return json(await readNearPublicGuest());
    if(path==='/api/near/lives')return json(await readNearPublicLives(url.searchParams.get('owner')||'',url.searchParams.get('cursor')||'0'));
    let match=path.match(/^\/api\/near\/request\/(0x[0-9a-f]{64})$/);if(match)return json(await readNearPublicRequest(match[1]));
    match=path.match(/^\/api\/near\/job\/(0x[0-9a-f]{64})$/);if(match)return json(await getNearOwnerJob(match[1],nearSession(request,runtime).address));
    match=path.match(/^\/api\/near\/rooster\/([1-9]\d{0,19})$/);if(match)return json({life:await readNearPublicLife(match[1])});
    match=path.match(/^\/api\/near\/days\/([1-9]\d{0,19})$/);if(match){const before=url.searchParams.get('before');if(before!==null&&!/^[1-9]\d{0,9}$/.test(before))throw new NearError('not_found','That day could not be found.',404);return json(await readNearPublicDays(match[1],before?Number(before):undefined));}
    match=path.match(/^\/api\/near\/day\/([1-9]\d{0,19})\/([1-9]\d{0,9})$/);if(match)return json(await readNearPublicDay(match[1],Number(match[2])));
    match=path.match(/^\/api\/near\/replay\/([1-9]\d{0,19})$/);if(match){const day=url.searchParams.get('day');if(day!==null&&!/^[1-9]\d{0,9}$/.test(day))throw new NearError('not_found','That day could not be found.',404);return json(await readNearPublicReplay(match[1],day?Number(day):undefined));}
    match=path.match(/^\/api\/near\/nft\/([1-9]\d{0,19})(\/image\.svg)?$/);if(match){if(network===null||collection===null)throw new NearError('not_found','Choose the exact NEAR life to visit.',404);const life=await readNearPublicLife(match[1]);return match[2]?new Response(evmLifePortrait(life),{headers:{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'public,max-age=30'}}):json(nearNftMetadata(life,'https://nearlyhuman.netlify.app'),200,'public,max-age=30');}
    throw new NearError('not_found','This page has wandered off.',404);
  }catch(error){
    if(error instanceof NearError)return json({error:{code:error.code,message:error.message}},error.status);
    if(error instanceof StoreConflict)return json({error:{code:'busy',message:'This day is being checked. Try again shortly.'}},409);
    if(error instanceof BudgetError)return json({error:{code:error.code,message:error.code==='capacity'?'Preparation is resting. Try again shortly.':'This preparation needs another check.'}},503);
    return json({error:{code:'connection',message:'Checking this NEAR home. Try again shortly.'}},503);
  }
}
