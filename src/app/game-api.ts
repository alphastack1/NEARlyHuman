import type { Hex } from 'viem';
import { api } from './api';
import { v2Api, V2ApiError, cacheV2Session, restoreV2Session, setV2Session } from './v2-api';
import type { V2World } from '../v2/public';
import { isNearWorld, type GameWorld, type GamePublicConfig, type GamePublicLife, type GamePublicDay,
  type GamePublicRequest, type GameOwnerQuote, type GameOwnerJob, type GameLifePage, type GameDaysPage,
  type GameWorldDirectory, type GameSession, type NearSignChallenge, type NearSignedMessage } from '../chain/game-types';
import { sameAccount, worldKey, worldParams } from '../chain/game-world';

interface CachedSession extends GameSession { account: string; key: string }
const nativeSessions = new Map<string, CachedSession>();
const epochs = new Map<string, number>();
const tokenKeys = new Map<string, string>();
const storageKey = (account: string, world: GameWorld) => `nh:v2:session:${worldKey(world)}:${account}`;
const epoch = (key: string) => epochs.get(key) || 0;

export function setGameSession(token: string, world: GameWorld) {
  if (!isNearWorld(world)) { setV2Session(token); return; }
  const key = worldKey(world); epochs.set(key, epoch(key) + 1);
  if (!token) tokenKeys.delete(key); else tokenKeys.set(key, token);
}
export function cacheGameSession(account: string, world: GameWorld, session: GameSession) {
  if (!isNearWorld(world)) { cacheV2Session(account, world, session); return; }
  const key = storageKey(account, world), value = { ...session, account, key: worldKey(world) };
  nativeSessions.set(key, value);
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Exact-world visit cache remains usable. */ }
  setGameSession(session.token, world);
}
export async function restoreGameSession(account: string, world: GameWorld): Promise<boolean> {
  if (!isNearWorld(world)) return restoreV2Session(account, world);
  const key = storageKey(account, world), scope = worldKey(world), initialEpoch = epoch(scope);
  const discard = () => { nativeSessions.delete(key); try { sessionStorage.removeItem(key); } catch { /* No service data is touched. */ } };
  let cached: CachedSession | undefined;
  try {
    let raw: string | null = null; try { raw = sessionStorage.getItem(key); } catch { /* Fall back to this visit only. */ }
    if (raw) { if (raw.length > 2000) { discard(); return false; } cached = JSON.parse(raw); } else cached = nativeSessions.get(key);
    if (!cached) return false;
    if (cached.account !== account || cached.key !== scope || typeof cached.token !== 'string' || cached.token.length > 1024
      || !Number.isSafeInteger(cached.expiresAt) || cached.expiresAt <= Math.floor(Date.now() / 1000) + 30) { discard(); return false; }
  } catch { discard(); return false; }
  let response: Response;
  try { response = await fetch('/api/near/v2/session?' + worldParams(world), { headers: { Authorization: 'Bearer ' + cached.token }, signal: AbortSignal.timeout(10000) }); }
  catch { throw new V2ApiError('Checking your wallet connection. Try again.', 'connection', 503); }
  if (response.status === 401) { discard(); return false; }
  if (!response.ok) throw new V2ApiError('Checking your wallet connection. Try again.', 'connection', response.status);
  const verified = await response.json() as { address: string; networkId: string; collection: string; expiresAt: number };
  if (!sameAccount(verified.address, account) || verified.networkId !== 'near-testnet' || verified.collection !== world.collection
    || verified.expiresAt !== cached.expiresAt || verified.expiresAt <= Math.floor(Date.now() / 1000) + 30) { discard(); return false; }
  // A simultaneous check for this same account may already have adopted this
  // exact verified token. A reset or another account's token still fences it.
  if (epoch(scope) !== initialEpoch) return tokenKeys.get(scope) === cached.token;
  setGameSession(cached.token, world); return true;
}

async function nativeRead<T>(world: GameWorld, path: string, body?: unknown): Promise<T> {
  const url = new URL('/api/near/v2' + path, location.origin);
  for (const [key, value] of worldParams(world)) url.searchParams.set(key, value);
  const token = tokenKeys.get(worldKey(world));
  const response = await fetch(url, { method: body === undefined ? 'GET' : 'POST', headers: {
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: 'Bearer ' + token } : {}),
  }, body: body === undefined ? undefined : JSON.stringify(body) });
  let result: unknown;
  try { result = await response.json(); } catch { throw new V2ApiError('Checking this home. Try again.', 'connection', response.status); }
  if (!response.ok) { const error = result as { error?: { code?: string; message?: string } }; throw new V2ApiError(error.error?.message || 'Checking this home. Try again.', error.error?.code || 'connection', response.status); }
  return result as T;
}

export interface GameApi {
  config(): Promise<GamePublicConfig>;
  guest(): Promise<{ life: GamePublicLife; packet: unknown; commitment: string }>;
  lives(owner: string, cursor?: string): Promise<GameLifePage>;
  owned(owner: string, cursor?: string): Promise<GameLifePage>;
  days(id: string, before?: number, world?: GameWorld): Promise<GameDaysPage>;
  request(id: Hex): Promise<GamePublicRequest>;
  quote(id: string, kitMask: string, shipping?: boolean): Promise<GameOwnerQuote>;
  accept(transactionHash: string | undefined, requestId: Hex): Promise<GameOwnerJob>;
  job(requestId: Hex): Promise<GameOwnerJob>;
  wake(requestId: Hex): Promise<GameOwnerJob>;
  life(id: string, world?: GameWorld): Promise<{ life: GamePublicLife }>;
  day(id: string, day: number, world?: GameWorld): Promise<GamePublicDay>;
  replay(id: string, day?: number, world?: GameWorld): Promise<{ life: GamePublicLife; packet: unknown; commitment: string }>;
  challenge(account: string): Promise<{ id: string; message: string } | NearSignChallenge>;
  authenticate(account: string, id: string, signature: string | NearSignedMessage): Promise<GameSession>;
}
/** Bind each operation to a real world. No mutable global 'selected chain' can
 * redirect an in-flight signature, request, session or payment to another API. */
export function apiFor(world?: GameWorld): GameApi {
  if (!isNearWorld(world)) return {
    ...v2Api,
    config: () => v2Api.config(world), guest: () => v2Api.guest(world),
    lives: (owner,cursor) => v2Api.lives(owner,cursor,world), owned: (owner,cursor) => v2Api.owned(owner,cursor,world),
    days: (id, before, target=world) => target && isNearWorld(target) ? apiFor(target).days(id, before) : v2Api.days(id, before, target as V2World | undefined),
    life: (id, target=world) => target && isNearWorld(target) ? apiFor(target).life(id) : v2Api.life(id, target as V2World | undefined),
    day: (id, day, target=world) => target && isNearWorld(target) ? apiFor(target).day(id, day) : v2Api.day(id, day, target as V2World | undefined),
    replay: (id, day, target=world) => target && isNearWorld(target) ? apiFor(target).replay(id, day) : v2Api.replay(id, day, target as V2World | undefined),
    quote: (id,kit,shipping=true) => v2Api.quote(id,kit,shipping,world),
    request: id => v2Api.request(id,world), job:id=>v2Api.job(id,world), wake:id=>v2Api.wake(id,world),
    accept: (hash, id) => { if (!hash || !/^0x[\da-f]{64}$/i.test(hash)) throw new V2ApiError('Check the original payment first.', 'context', 409); return v2Api.accept(hash as Hex, id,world); },
    challenge: api.challenge,
    authenticate: (account, id, signature) => { if (typeof signature !== 'string') throw new V2ApiError('Connect this world’s wallet.', 'session', 401); return api.authenticate(account, id, signature); },
  };
  const read = <T>(path: string, body?: unknown) => nativeRead<T>(world, path, body);
  const life = (id: string, target?: GameWorld) => target && worldKey(target) !== worldKey(world) ? apiFor(target).life(id) : read<{ life: GamePublicLife }>('/rooster/' + encodeURIComponent(id));
  const lives = (owner: string, cursor?: string) => read<GameLifePage>('/lives?' + new URLSearchParams({ owner, ...(cursor ? { cursor } : {}) }));
  return {
    config: () => read<GamePublicConfig>('/config'),
    guest: () => read('/guest'), lives, owned: lives, life,
    days: (id, before, target) => target && worldKey(target) !== worldKey(world) ? apiFor(target).days(id, before) : read('/days/' + encodeURIComponent(id) + (before === undefined ? '' : '?before=' + before)),
    request: id => read('/request/' + encodeURIComponent(id)),
    quote: (tokenId, kitMask, shipping = true) => read('/quote', { tokenId, kitMask, shipping }),
    accept: (transactionHash, requestId) => read('/accept', { ...(transactionHash ? { transactionHash } : {}), requestId }),
    job: requestId => read('/job/' + encodeURIComponent(requestId)),
    wake: requestId => read('/wake', { requestId }),
    day: (id, day, target) => target && worldKey(target) !== worldKey(world) ? apiFor(target).day(id, day) : read('/day/' + encodeURIComponent(id) + '/' + day),
    replay: (id, day, target) => target && worldKey(target) !== worldKey(world) ? apiFor(target).replay(id, day) : read('/replay/' + encodeURIComponent(id) + (day === undefined ? '' : '?day=' + day)),
    challenge: accountId => read<NearSignChallenge>('/auth/challenge', { accountId }),
    authenticate: (accountId, id, signed) => { if (typeof signed === 'string' || signed.accountId !== accountId) throw new V2ApiError('Verify this NEAR account.', 'session', 401); return read('/auth/verify', { id, accountId, publicKey: signed.publicKey, signature: signed.signature }); },
  };
}
export async function gameWorlds(): Promise<GameWorldDirectory> {
  const response = await fetch('/api/game/worlds');
  if (!response.ok) throw new V2ApiError('Opening the game networks. Try again.', 'connection', response.status);
  return response.json() as Promise<GameWorldDirectory>;
}
