import type { EvmPublicLife, EvmPublicDay, EvmPublicConfig, EvmWorld, EvmOwnerJob, EvmOwnerQuote, EvmLifePage, EvmDaysPage, EvmPublicRequest } from '../chain/evm-types';
import type { Hex } from 'viem';

export class GameApiError extends Error { constructor(message: string, public code: string, public status: number) { super(message); } }
const query = (world?: EvmWorld) => world ? '?' + new URLSearchParams({ chainId: String(world.chainId), collection: world.collection }) : '';
let sessionToken = '';
let sessionEpoch = 0;
export function setEvmSession(value: string) { sessionToken = value; sessionEpoch++; }
interface CachedEvmSession { token: string; expiresAt: number; account: string; chainId: number; collection: string }
const visitSessions = new Map<string, CachedEvmSession>();
const sessionKey = (account: string, world: EvmWorld) => `nh:v2:session:${world.chainId}:${world.collection.toLowerCase()}:${account.toLowerCase()}`;
export function cacheEvmSession(account: string, world: EvmWorld, value: { token: string; expiresAt: number }) {
  const key = sessionKey(account, world), cached = { ...value, account: account.toLowerCase(), chainId: world.chainId, collection: world.collection.toLowerCase() } satisfies CachedEvmSession;
  visitSessions.set(key, cached);
  try { sessionStorage.setItem(key, JSON.stringify(cached)); } catch { /* This visit remains signed in when storage is unavailable. */ }
}
/** A cached token is reusable only after the server verifies its MAC and the
 * exact account, chain, collection and expiry match the connected wallet. */
export async function restoreEvmSession(account: string, world: EvmWorld): Promise<boolean> {
  const epoch = sessionEpoch, key = sessionKey(account, world); let cached: CachedEvmSession | undefined;
  const discard = () => { visitSessions.delete(key); try { sessionStorage.removeItem(key); } catch { /* No persistent service data is changed. */ } };
  try {
    let raw: string | null = null;
    try { raw = sessionStorage.getItem(key); } catch { /* Use this visit's exact-world cache, still verified below. */ }
    if (raw) {
      if (raw.length > 2000) { discard(); return false; }
      cached = JSON.parse(raw);
    } else cached = visitSessions.get(key);
    if (!cached) return false;
    if (!cached || cached.account !== account.toLowerCase() || cached.chainId !== world.chainId || cached.collection !== world.collection.toLowerCase()
      || typeof cached.token !== 'string' || cached.token.length > 1024 || !Number.isSafeInteger(cached.expiresAt) || cached.expiresAt <= Math.floor(Date.now() / 1000) + 30) { discard(); return false; }
  } catch { discard(); return false; }
  try {
    const response = await fetch('/api/evm/session', { headers: { Authorization: 'Bearer ' + cached.token }, signal: AbortSignal.timeout(10000) });
    if (response.status === 401) { discard(); return false; }
    if (!response.ok) throw new GameApiError('Checking your wallet connection. Try again.', 'connection', response.status);
    const verified = await response.json() as { address: string; chainId: number; collection: string; expiresAt: number };
    if (verified.address?.toLowerCase() !== account.toLowerCase() || verified.chainId !== world.chainId || verified.collection?.toLowerCase() !== world.collection.toLowerCase()
      || verified.expiresAt !== cached.expiresAt || verified.expiresAt <= Math.floor(Date.now() / 1000) + 30) { discard(); return false; }
    if (sessionEpoch !== epoch) return false;
    setEvmSession(cached.token); return true;
  } catch (error) {
    if (error instanceof GameApiError) throw error;
    throw new GameApiError('Checking your wallet connection. Try again.', 'connection', 503);
  }
}
async function read<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch('/api/evm' + path, { method: body === undefined ? 'GET' : 'POST', headers: {
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(sessionToken ? { Authorization: 'Bearer ' + sessionToken } : {}),
  }, body: body === undefined ? undefined : JSON.stringify(body) });
  let data: unknown;
  try { data = await response.json(); } catch { throw new GameApiError('Checking this home. Try again.', 'connection', response.status); }
  if (!response.ok) {
    const e = data as { error?: { message?: string; code?: string } };
    throw new GameApiError(e.error?.message || 'Checking this home. Try again.', e.error?.code || 'connection', response.status);
  }
  return data as T;
}
export const evmApi = {
  config: (world?:EvmWorld) => read<EvmPublicConfig>('/config'+query(world)),
  guest: (world?:EvmWorld) => read<{life:EvmPublicLife;packet:unknown;commitment:string}>('/guest'+query(world)),
  lives: (owner:string,cursor?:string,world?:EvmWorld) => read<EvmLifePage>('/lives?'+new URLSearchParams({owner,...(cursor?{cursor}:{}),...(world?{chainId:String(world.chainId),collection:world.collection}:{})})),
  owned: (owner:string,cursor?:string,world?:EvmWorld) => read<EvmLifePage>('/lives?'+new URLSearchParams({owner,...(cursor?{cursor}:{}),...(world?{chainId:String(world.chainId),collection:world.collection}:{})})),
  days: (id:string,before?:number,world?:EvmWorld) => {const params=new URLSearchParams(world?{chainId:String(world.chainId),collection:world.collection}:{});if(before!==undefined)params.set('before',String(before));return read<EvmDaysPage>('/days/'+encodeURIComponent(id)+(params.size?'?'+params:''));},
  request: (requestId:Hex,world?:EvmWorld) => read<EvmPublicRequest>('/request/'+encodeURIComponent(requestId)+query(world)),
  quote: (tokenId: string, kitMask: string, shipping = true,world?:EvmWorld) => read<EvmOwnerQuote>('/quote'+query(world), { tokenId, kitMask, shipping }),
  accept: (transactionHash: Hex, requestId: Hex,world?:EvmWorld) => read<EvmOwnerJob>('/accept'+query(world), { transactionHash, requestId }),
  job: (requestId: Hex,world?:EvmWorld) => read<EvmOwnerJob>('/job/' + encodeURIComponent(requestId)+query(world)),
  wake: (requestId: Hex,world?:EvmWorld) => read<EvmOwnerJob>('/wake'+query(world), { requestId }),
  life: (id: string, world?: EvmWorld) => read<{ life: EvmPublicLife }>('/rooster/' + encodeURIComponent(id) + query(world)),
  day: (id: string, day: number, world?: EvmWorld) => read<EvmPublicDay>('/day/' + encodeURIComponent(id) + '/' + day + query(world)),
  replay: (id: string, day?: number, world?: EvmWorld) => {
    const params = new URLSearchParams(world ? { chainId: String(world.chainId), collection: world.collection } : {});
    if (day !== undefined) params.set('day', String(day));
    return read<{ life: EvmPublicLife; packet: unknown; commitment: string }>('/replay/' + encodeURIComponent(id) + (params.size ? '?' + params : ''));
  },
};
