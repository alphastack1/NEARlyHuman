import assert from 'node:assert/strict';
import { deployments } from '../../src/chain/deployments';
import { OPEN_APP_HREF, selectEntrySurface, selectV2Entry } from '../../src/site/routing';
import { parsePublicLifePath, publicLifePath } from '../../src/site/life-routes';

const origin = 'https://nearlyhuman.netlify.app';
const surface = (path: string) => {
  const url = new URL(path, origin);
  return selectEntrySurface(url.pathname, url.searchParams, url.hash);
};

const expected: [string, 'site' | 'game'][] = [
  ['/', 'site'],
  ['/?utm_source=near&utm_campaign=hackathon', 'site'],
  ['/#garden', 'site'],
  ['/the-game', 'site'],
  ['/project', 'site'],
  ['/explore?world=near-testnet&sort=longest', 'site'],
  ['/life/near-testnet/1', 'site'],
  ['/life/robinhood-testnet/8?from=%2Fexplore', 'site'],
  ['/docs/', 'site'],
  ['/docs/first-day?utm_source=app', 'site'],
  ['/docs/worlds-and-wallets?networkId=near-testnet', 'site'],
  ['/unknown?rooster=7', 'site'],
  ['/app', 'game'],
  ['/app/', 'game'],
  [OPEN_APP_HREF, 'game'],
  ['/app?utm_source=guide', 'game'],
  ['/app?v2=1&rooster=8&view=watch&day=1', 'game'],
  ['/?v2=1', 'game'],
  ['/?v2=0', 'game'],
  ['/?legacy=1', 'game'],
  ['/?rooster=1', 'game'],
  ['/?id=1', 'game'],
  ['/?day=2', 'game'],
  ['/?rooster=1&chainId=46630&collection=0x30cb5213fa94020a95893ddb6b07470dbf7a9efc&day=2', 'game'],
  ['/?rooster=1&networkId=near-testnet&collection=game.nearlyhuman-dev-20261102-26c8bd.testnet', 'game'],
  ['/?networkId=bad-world&chainId=46630&collection=bad&rooster=1', 'game'],
  ['/?collection=', 'game'],
  ['/?pending=1&requestId=original', 'game'],
  ['/?recovery=1', 'game'],
  ['/?transactionHashes=original', 'game'],
  ['/?errorCode=UserRejected&errorMessage=Cancelled', 'game'],
  ['/?account_id=owner.testnet&public_key=ed25519%3Akey&all_keys=key', 'game'],
  ['/#accountId=owner.testnet&publicKey=key&signature=original', 'game'],
  ['/#/?transactionHashes=original', 'game'],
];
for (const [url, entry] of expected) assert.equal(surface(url), entry, url);

const oldCollection = deployments[46630]!.address;
const choose = (query: string, defaultV2: boolean) => selectV2Entry(new URLSearchParams(query), defaultV2);
assert.equal(choose(`rooster=1&chainId=46630&collection=${oldCollection}`, true), false);
assert.equal(choose(`rooster=1&chainId=46630&collection=${oldCollection.toUpperCase()}`, true), false);
assert.equal(choose(`v2=1&rooster=1&chainId=46630&collection=${oldCollection}`, true), true);
assert.equal(choose('rooster=1', true), false);
assert.equal(choose('id=1', true), true);
assert.equal(choose('networkId=near-testnet&collection=bad', false), true);
assert.equal(choose('collection=0x30cb5213fa94020a95893ddb6b07470dbf7a9efc', false), true);
assert.equal(choose('', false), false);
assert.equal(choose('', true), true);
assert.equal(choose('v2=0', true), true); // Existing selector semantics, not a new legacy switch.
assert.equal(choose(new URL(OPEN_APP_HREF, origin).search, false), true);

// Classification must never consume callback data or normalize the business URL.
const returnUrl = new URL('/?networkId=near-testnet&collection=game.testnet&rooster=1&transactionHashes=original#signature=unchanged', origin);
const originalUrl = returnUrl.href;
assert.equal(publicLifePath('near-testnet', '1'), '/life/near-testnet/1');
assert.deepEqual(parsePublicLifePath('/life/robinhood-testnet/8/'), { worldId: 'robinhood-testnet', id: '8' });
for (const path of ['/life/near-mainnet/1', '/life/near-testnet/0', '/life/near-testnet/01', '/life/near-testnet/1/extra']) assert.equal(parsePublicLifePath(path), undefined);
selectEntrySurface(returnUrl.pathname, returnUrl.searchParams, returnUrl.hash);
selectV2Entry(returnUrl.searchParams, true);
assert.equal(returnUrl.href, originalUrl);

console.log(JSON.stringify({ surfaceCases: expected.length, versionCases: 11, callbackUrlUnchanged: true, pass: true }));
