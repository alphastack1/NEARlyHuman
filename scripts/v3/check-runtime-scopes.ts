import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import original from '../../contracts/v2/deployments/robinhood-testnet.json';
import current from '../../contracts/v3/deployments/robinhood-testnet.json';
import { currentV2RuntimeScope, v2RuntimeScope, v2RuntimeScopes, v2RuntimeScopeForJob, withV2RuntimeScope, v2CanonicalLifePath } from '../../server/v2/runtime-scope';
import { v2ViewConnection, readV2PublicLife, v2NftMetadata } from '../../server/v2/views';
import { handleV2Api } from '../../server/v2/http';
import { quoteV2OwnerDay } from '../../server/v2/service';
import { discoveryDescriptor, type DiscoveryRead } from '../../server/discovery/reader';
import { parseDirectoryQuery, readPublicLifeDirectory } from '../../server/discovery/service';
import type { DurableStore, Stored } from '../../server/storage';
import type { Address } from 'viem';

// Fixture startup only. Requests themselves never mutate process-global configuration.
process.env.NEARLYHUMAN_V2_RUNTIME_JSON=JSON.stringify(current.runtime);
process.env.NEARLYHUMAN_V2_CAMPAIGN='nearlyhuman-v2-testnet-20261102';
process.env.NEARLYHUMAN_V2_GUEST_ID='1';process.env.NEARLYHUMAN_V2_GUEST_DAY='1';
process.env.NEARLYHUMAN_SESSION_SECRET='runtime-scope-controlled-session-fixture-only-20261104';
process.env.NEARLYHUMAN_DATA_DIR=path.resolve('TEMP/rh-v3/runtime-scopes-'+Date.now());
const tests:string[]=[],active=v2RuntimeScope(),archive=v2RuntimeScope(original.runtime.collection);
const player='0x131C15fD2d9151F361213d8e8BC2a188Dc0149c6' as Address;
const payload=Buffer.from(JSON.stringify({address:player,chainId:46630,expiresAt:Math.floor(Date.now()/1000)+300})).toString('base64url');
const auth=payload+'.'+createHmac('sha256',process.env.NEARLYHUMAN_SESSION_SECRET).update(payload).digest('base64url');
const url=(route:string,collection?:string,chainId='46630')=>'https://nearlyhuman.netlify.app/api/v2/'+route+(collection?'?chainId='+chainId+'&collection='+collection:'');
const post=(route:string,collection:string,body:unknown={},authenticated=false)=>new Request(url(route,collection),{method:'POST',headers:{'content-type':'application/json',...(authenticated?{authorization:'Bearer '+auth}:{})},body:JSON.stringify(body)});
const reject404=async(request:Request)=>{const response=await handleV2Api(request);assert.equal(response.status,404);assert.equal((await response.json()).error.code,'not_found');};

assert.equal(active.runtime.collection,current.runtime.collection);assert.equal(active.admissionsEnabled,true);assert.equal(archive.admissionsEnabled,false);assert.equal(v2RuntimeScopes().length,2);assert.equal(archive.runtime.controllerCodeHash,original.runtime.controllerCodeHash);
tests.push('New active identity and fixed original archive pins remain separate');
assert.throws(()=>v2RuntimeScope('0x'+'a'.repeat(40)));assert.throws(()=>withV2RuntimeScope({...archive,rpcUrl:'https://example.invalid'},()=>null));
tests.push('Unlisted collection and caller-forged runtime scope are rejected');
await Promise.all([withV2RuntimeScope(archive,async()=>{await new Promise(resolve=>setTimeout(resolve,10));assert.equal(v2ViewConnection().runtime.collection,archive.runtime.collection);}),withV2RuntimeScope(active,async()=>{await new Promise(resolve=>setTimeout(resolve,3));assert.equal(v2ViewConnection().runtime.collection,active.runtime.collection);})]);
tests.push('Concurrent asynchronous reads retain their own collection without env mutation');
await withV2RuntimeScope(archive,async()=>{assert.equal(currentV2RuntimeScope().runtime.collection,archive.runtime.collection);await withV2RuntimeScope(active,async()=>assert.equal(currentV2RuntimeScope().runtime.collection,active.runtime.collection));assert.equal(currentV2RuntimeScope().runtime.collection,archive.runtime.collection);});assert.equal(currentV2RuntimeScope().runtime.collection,active.runtime.collection);
tests.push('Nested reads and request completion restore the previous/default scope');
for(const scope of [active,archive])assert.equal(v2RuntimeScopeForJob(`v2/jobs/46630/${scope.runtime.collection}/0x${'1'.repeat(64)}`).runtime.collection,scope.runtime.collection);
assert.throws(()=>v2RuntimeScopeForJob(`v2/jobs/31337/${archive.runtime.collection}/0x${'1'.repeat(64)}`));assert.throws(()=>v2RuntimeScopeForJob(`v2/jobs/46630/0x${'a'.repeat(40)}/0x${'1'.repeat(64)}`));
tests.push('Background job identities resolve active/archive and reject foreign chain/collection');
assert.equal(v2CanonicalLifePath(46630,archive.runtime.collection,'1'),'/life/robinhood-testnet/1');assert.equal(v2CanonicalLifePath(46630,active.runtime.collection,'1'),`/life/robinhood-testnet/${active.runtime.collection}/1`);
tests.push('Original NFT aliases and collection-qualified new NFT links cannot collide');
const archivedQuote=await handleV2Api(post('quote',archive.runtime.collection));assert.equal(archivedQuote.status,409);assert.equal((await archivedQuote.json()).error.code,'archived');
tests.push('Archived HTTP quotes fail before authentication, inference, reservation or signer');
await assert.rejects(withV2RuntimeScope(archive,()=>quoteV2OwnerDay(player,{tokenId:'1',kitMask:'0'})),error=>(error as {code:string}).code==='archived');
tests.push('Direct owner quote service independently fences archived admissions');
for(const request of [new Request(url('config','0x'+'a'.repeat(40))),post('quote','0x'+'a'.repeat(40)),new Request(url('config',archive.runtime.collection,'1')),new Request(url('config',active.runtime.collection)+'&networkId=near-testnet')])await reject404(request);
tests.push('Explicit foreign collection, chain and network scopes reject instead of falling back');
const activePost=await handleV2Api(post('quote',active.runtime.collection));assert.equal(activePost.status,401);assert.equal((await activePost.json()).error.code,'session');
tests.push('Current collection quote route reaches normal wallet authentication');
for(const route of ['accept','wake']){const response=await handleV2Api(post(route,archive.runtime.collection,{},true));assert.equal(response.status,400);assert.equal((await response.json()).error.code,'request');}
tests.push('Archive accept/wake recovery routes remain available and validate their exact request');
assert.deepEqual(archive.guest,{id:'1',day:28});assert.deepEqual(active.guest,{id:'1',day:1});
tests.push('Old saved guest day stays fixed while the new guest is configured independently');
const oldDescriptor=discoveryDescriptor('robinhood-testnet',archive.runtime.collection),newDescriptor=discoveryDescriptor('robinhood-testnet');assert.notEqual(oldDescriptor.fingerprint,newDescriptor.fingerprint);assert.equal(newDescriptor.world.collection,active.runtime.collection);assert.throws(()=>discoveryDescriptor('robinhood-testnet','0x'+'a'.repeat(40)));
for(const collection of ['../ledger','0x123','https://example.invalid'])assert.throws(()=>parseDirectoryQuery(new URLSearchParams({world:'robinhood-testnet',collection})));
tests.push('Discovery whitelist and cache identity distinguish both RH collections');
class MemoryStore implements DurableStore{data=new Map<string,Stored<unknown>>();n=0;async get<T>(key:string){assert(key.startsWith('public/discovery/'));return structuredClone(this.data.get(key)||null) as Stored<T>|null;}async put<T>(key:string,value:T,condition:{etag?:string;isNew?:boolean}={}){assert(key.startsWith('public/discovery/'));const old=this.data.get(key);if(condition.isNew&&old||condition.etag&&old?.etag!==condition.etag)return false;this.data.set(key,{value:structuredClone(value),etag:String(++this.n)});return true;}async list():Promise<string[]>{throw Error('Do not enumerate ledgers.');}async delete(key:string){assert(key.startsWith('public/discovery/'));this.data.delete(key);}}
const store=new MemoryStore(),query=(collection:string,cursor?:string)=>parseDirectoryQuery(new URLSearchParams({world:'robinhood-testnet',collection,limit:'1',...(cursor?{cursor}:{})}));
const dependencies={store,read:async(descriptor:typeof oldDescriptor):Promise<DiscoveryRead>=>({world:descriptor.world,height:'100',hash:'0x'+'b'.repeat(64),items:[1,2].map(id=>({id:String(id),owner:player,name:descriptor.world.collection===archive.runtime.collection?'OLD':'NEW',day:1,level:1,alive:true,pending:false,purseMicro:'0',rank:0,plantedBeds:0,readyBeds:0}))})};
const oldPage=await readPublicLifeDirectory(query(archive.runtime.collection),dependencies),newPage=await readPublicLifeDirectory(query(active.runtime.collection),dependencies);assert.notEqual(oldPage.snapshot.id,newPage.snapshot.id);assert.equal(oldPage.items[0]!.name,'OLD');assert.equal(newPage.items[0]!.name,'NEW');assert(oldPage.nextCursor);await assert.rejects(readPublicLifeDirectory(query(active.runtime.collection,oldPage.nextCursor),dependencies),error=>(error as {code:string}).code==='cursor_expired');assert.equal((await readPublicLifeDirectory(query(archive.runtime.collection,oldPage.nextCursor),dependencies)).items[0]!.id,'1');
tests.push('Durable snapshots preserve identical token IDs separately and reject cross-collection cursors');
if(process.argv.includes('--public-read')){
  const [oldResponse,newResponse]=await Promise.all([handleV2Api(new Request(url('config',archive.runtime.collection))),handleV2Api(new Request(url('config',active.runtime.collection)))]);assert.equal(oldResponse.status,200);assert.equal(newResponse.status,200);const [oldConfig,newConfig]=await Promise.all([oldResponse.json(),newResponse.json()]);assert.equal(oldConfig.admissionsEnabled,false);assert.equal(oldConfig.transferBurn,undefined);assert.equal(oldConfig.guest.day,28);assert.equal(newConfig.admissionsEnabled,true);assert.deepEqual(newConfig.transferBurn,{enabled:true,bps:50,totalBurned:'0'});
  tests.push('Actual pinned public RPC config reads expose archive admission fence and live V3 burn');
  const oldLife=await withV2RuntimeScope(archive,()=>readV2PublicLife('1',{chainId:46630,collection:archive.runtime.collection}));assert(oldLife.state.day>=28);const oldMetadata=v2NftMetadata(oldLife,'https://nearlyhuman.netlify.app'),newMetadata=v2NftMetadata({...oldLife,collection:active.runtime.collection},'https://nearlyhuman.netlify.app');assert.equal(oldMetadata.external_url,'https://nearlyhuman.netlify.app/life/robinhood-testnet/1');assert(newMetadata.external_url.includes('/'+active.runtime.collection+'/1'));assert(oldMetadata.image.includes('collection='+archive.runtime.collection));
  tests.push('Original saved NFT remains readable and metadata keeps exact old/new collection links');
}
const report={pass:true,checkedAt:new Date().toISOString(),cases:tests.length,publicRead:process.argv.includes('--public-read'),scope:'Controlled request/session fixtures and public chain reads only; scratch public cache, no financial store writes, keys, paid model calls or transactions.',sourceHash:createHash('sha256').update(await fs.readFile(new URL(import.meta.url))).digest('hex'),tests};
await fs.mkdir(new URL('../../TEMP/rh-v3/',import.meta.url),{recursive:true});await fs.writeFile(new URL('../../TEMP/rh-v3/runtime-scope-verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
