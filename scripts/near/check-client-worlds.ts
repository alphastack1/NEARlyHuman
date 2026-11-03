import assert from 'node:assert/strict';
import { apiFor, cacheGameSession, restoreGameSession, setGameSession } from '../../src/app/game-api';
import { worldKey, worldParams, parseGameWorld, sameWorld, sameAccount, gameExplorerToken } from '../../src/chain/game-world';
import type { GameWorld } from '../../src/chain/game-types';

const near = { networkId: 'near-testnet', collection: 'game.developer.testnet' } as const;
const rh = { chainId: 46630, collection: '0x131C15fD2d9151F361213d8e8BC2a188Dc0149c6' } as const;
const account = 'developer.testnet', expiresAt = Math.floor(Date.now() / 1000) + 3600;
const originalFetch = globalThis.fetch, originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location'), originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
const memory = new Map<string, string>(), calls: Array<{ url: string; authorization: string | null }> = [];
const tested: string[] = [];
let verification: 'valid' | 'wrong-world' | 'unavailable' = 'valid', release: (() => void) | undefined, delay = false;
Object.defineProperty(globalThis, 'location', { configurable: true, value: { origin: 'https://nearlyhuman.netlify.app' } });
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value), removeItem: (key: string) => memory.delete(key) } });
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input), 'https://nearlyhuman.netlify.app'); calls.push({ url: url.pathname + url.search, authorization: new Headers(init?.headers).get('authorization') });
  if (url.pathname === '/api/near/v2/session') {
    if (delay) await new Promise<void>(resolve => { release = resolve; });
    if (verification === 'unavailable') return Response.json({}, { status: 503 });
    return Response.json({ address: account, networkId: 'near-testnet', collection: verification === 'wrong-world' ? 'other.developer.testnet' : near.collection, expiresAt });
  }
  return Response.json({ life: {} });
};
try {
  assert.deepEqual(parseGameWorld(worldParams(near)), near); assert.deepEqual(parseGameWorld(worldParams(rh)), rh);
  assert.equal(worldParams(near).has('chainId'), false); assert.equal(sameWorld(near, rh), false);
  assert.equal(parseGameWorld(new URLSearchParams({ networkId: 'near-testnet', collection: near.collection, chainId: '46630' })), undefined);
  assert.equal(parseGameWorld(new URLSearchParams({ networkId: 'near-mainnet', collection: 'someone.near' })), undefined);
  assert.equal(parseGameWorld(new URLSearchParams({ networkId: 'near-testnet', collection: 'Someone.testnet' })), undefined);
  assert.ok(gameExplorerToken(near, '1').endsWith('/nft-tokens/game.developer.testnet/tokens/1'));
  assert.equal(sameAccount(rh.collection, rh.collection.toLowerCase()), true); assert.equal(sameAccount(account, account.toUpperCase()), false);
  tested.push('Native and legacy RH links retain exact world identity; mixed/unknown worlds reject; account semantics and exact explorer route remain distinct.');

  setGameSession('fixture-near-token', near); setGameSession('fixture-rh-token', rh);
  await apiFor(near).life('1'); await apiFor(rh).life('1'); await apiFor(near).life('1', rh);
  assert.equal(calls[0]!.authorization, 'Bearer fixture-near-token'); assert.equal(calls[1]!.authorization, 'Bearer fixture-rh-token'); assert.equal(calls[2]!.authorization, 'Bearer fixture-rh-token');
  assert.ok(calls[0]!.url.startsWith('/api/near/v2/')); assert.ok(calls[2]!.url.startsWith('/api/v2/'));
  assert.ok(calls[1]!.url.includes('collection='+rh.collection),'An EVM factory retains its captured collection without an override.');
  const requestId=('0x'+'1'.repeat(64)) as `0x${string}`;
  await apiFor(rh).quote('1','0');await apiFor(rh).request(requestId);
  assert.ok(calls.at(-2)!.url.includes('collection='+rh.collection),'Protected EVM quote keeps its captured world.');
  assert.ok(calls.at(-1)!.url.includes('chainId=46630'),'EVM request lookup keeps its captured chain.');
  tested.push('Immutable API factories route explicit override worlds correctly and never forward a native session to RH or vice versa.');

  cacheGameSession(account, near, { token: 'fixture-near-token', expiresAt });
  assert.deepEqual(await Promise.all([restoreGameSession(account, near), restoreGameSession(account, near)]), [true, true]);
  tested.push('Concurrent server-checked reuse of the same native session succeeds without requiring another signature.');

  delay = true; const restoring = restoreGameSession(account, near); await new Promise(resolve => setTimeout(resolve, 0));
  setGameSession('', near); release!(); assert.equal(await restoring, false); delay = false;
  tested.push('A reset fences an in-flight native session response.');

  cacheGameSession(account, near, { token: 'fixture-near-token', expiresAt }); verification = 'wrong-world';
  assert.equal(await restoreGameSession(account, near), false); verification = 'valid';
  tested.push('A server response for another native contract cannot adopt the cached token.');

  cacheGameSession(account, near, { token: 'fixture-near-token', expiresAt }); verification = 'unavailable';
  await assert.rejects(restoreGameSession(account, near)); verification = 'valid'; assert.equal(await restoreGameSession(account, near), true);
  tested.push('Transient session verification failure preserves the cache and does not silently request a new signature.');

  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new Error('Storage unavailable'); } });
  cacheGameSession(account, near, { token: 'fixture-near-token', expiresAt }); assert.equal(await restoreGameSession(account, near), true);
  tested.push('A storage-blocked visit can still reuse its exact-world native session after server verification.');
  assert.notEqual(worldKey(near), worldKey(rh));
  console.log(JSON.stringify({ passed: tested.length, tests: tested, scope: 'Keyless client boundary checks. Fetch/session verification is controlled; no RPC, service ledger, wallet, inference or network write.' }));
} finally {
  globalThis.fetch = originalFetch;
  if (originalLocation) Object.defineProperty(globalThis, 'location', originalLocation); else delete (globalThis as { location?: unknown }).location;
  if (originalStorage) Object.defineProperty(globalThis, 'sessionStorage', originalStorage); else delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
}
