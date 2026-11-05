import assert from 'node:assert/strict';
import { OPEN_APP_HREF, needsLifeScope, selectEntrySurface } from '../../src/site/routing';
import { parsePublicLifePath, publicLifePath } from '../../src/site/life-routes';
import { ACTIVE_ROBINHOOD, ORIGINAL_ROBINHOOD } from '../../src/chain/deployment-catalog';
import { checkDirectory, exploreControls, exploreQuery, hatchHref, lifeImage, publicLifeHref, publicLifeWorld, visitHref, worldById } from '../../src/site/public-lives';
import type { PublicLifeDirectory } from '../../src/chain/discovery-types';

const origin = 'https://nearlyhuman.netlify.app', classify = (value: string) => { const url = new URL(value, origin); return selectEntrySurface(url.pathname, url.searchParams, url.hash); };
const routes = [
  ['/', 'site'], ['/?utm_source=near', 'site'], ['/#garden', 'site'], ['/the-game', 'site'], ['/project', 'site'], ['/explore?world=near-testnet', 'site'],
  ['/life/near-testnet/1', 'site'], ['/docs/first-day?networkId=near-testnet', 'site'], ['/unknown?rooster=1', 'site'],
  [OPEN_APP_HREF, 'game'], ['/app', 'game'], ['/?v2=1', 'game'], ['/?rooster=8&chainId=46630&collection='+ORIGINAL_ROBINHOOD.runtime.collection, 'game'],
  ['/?account_id=player.testnet', 'game'], ['/#signature=unchanged', 'game'], ['/?pending=request', 'game'],
];
for (const [url, expected] of routes) assert.equal(classify(url), expected, url);
for (const value of ['rooster=1', 'id=1', 'rooster=1&rememberedWorld=near-testnet']) assert.equal(needsLifeScope(new URLSearchParams(value)), true);
for (const value of ['rooster=1&collection=game.testnet&networkId=near-testnet', 'rooster=1&account_id=player.testnet', 'rooster=1&pending=request', 'transactionHashes=original']) assert.equal(needsLifeScope(new URLSearchParams(value)), false);
assert.equal(needsLifeScope(new URLSearchParams(), '#id=1'), true);

const original = ORIGINAL_ROBINHOOD.runtime.collection.toLowerCase(), active = ACTIVE_ROBINHOOD.runtime.collection.toLowerCase();
assert.notEqual(active, original);
const oldWorld = publicLifeWorld('robinhood-testnet')!, newWorld = worldById('robinhood-testnet')!, nearWorld = worldById('near-testnet')!;
assert.equal(oldWorld.collection.toLowerCase(), original); assert.equal(newWorld.collection.toLowerCase(), active);
assert.equal(publicLifeHref(oldWorld, '8'), '/life/robinhood-testnet/8');
assert.equal(publicLifePath('robinhood-testnet', '1', active), `/life/robinhood-testnet/${active}/1`);
assert.deepEqual(parsePublicLifePath(`/life/robinhood-testnet/${active}/1`), { worldId:'robinhood-testnet', collection:active, id:'1' });
assert.deepEqual(parsePublicLifePath('/life/robinhood-testnet/8/'), { worldId:'robinhood-testnet', id:'8' });
for (const world of [oldWorld, newWorld, nearWorld]) {
  const home = new URL(visitHref(world,'1'),origin), film = new URL(visitHref(world,'1',2),origin), hatch = new URL(hatchHref(world),origin);
  for (const url of [home,film,hatch,new URL(lifeImage(world,'1'),origin)]) { assert.equal(url.searchParams.get('collection')?.toLowerCase(),world.collection.toLowerCase()); assert.equal(url.searchParams.has('v2'),false); }
  assert.equal(home.searchParams.get('view'),'home'); assert.equal(film.searchParams.get('view'),'watch'); assert.equal(film.searchParams.get('day'),'2'); assert.equal(hatch.searchParams.get('entry'),'hatch');
  assert.equal(lifeImage(world,'1').startsWith(world.id==='near-testnet'?'/api/near/':'/api/evm/'),true);
}
const board = exploreControls('?world=robinhood-testnet'), archived = exploreControls(`?world=robinhood-testnet&collection=${original}&q=MAPLE`);
assert.equal(board.collection,undefined); assert.equal(archived.collection?.toLowerCase(),original); assert.notEqual(exploreQuery(board),exploreQuery(archived));
const directory:PublicLifeDirectory={world:{id:'robinhood-testnet',label:'Robinhood Testnet',collection:original},snapshot:{id:'fixed',at:new Date(0).toISOString(),height:'1',hash:'hash',complete:true,stale:false},sort:'newest',status:'all',query:'MAPLE',total:0,collectionTotal:8,items:[]};
assert.equal(checkDirectory(directory,archived),directory); assert.throws(()=>checkDirectory(directory,board));
for(const invalid of['/life/near-mainnet/1','/life/near-testnet/0','/life/near-testnet/01','/life/near-testnet/1/extra',`/life/near-testnet/${active}/1`,'/life/robinhood-testnet/0x123/1'])assert.equal(parsePublicLifePath(invalid),undefined);
const callback=new URL('/?networkId=near-testnet&collection=game.testnet&rooster=1&transactionHashes=original#signature=unchanged',origin),before=callback.href;
selectEntrySurface(callback.pathname,callback.searchParams,callback.hash); needsLifeScope(callback.searchParams,callback.hash);assert.equal(callback.href,before);
console.log(JSON.stringify({pass:true,surfaceCases:routes.length,unqualifiedIdsGuarded:true,callbackUnchanged:true,exactCollectionIdentity:true,canonicalApis:true}));
