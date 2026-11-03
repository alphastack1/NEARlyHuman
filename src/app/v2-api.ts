import type { V2PublicLife, V2PublicDay, V2PublicConfig, V2World, V2OwnerJob, V2OwnerQuote, V2LifePage, V2DaysPage, V2PublicRequest } from '../v2/public';
import type { Hex } from 'viem';

export class V2ApiError extends Error { constructor(message: string, public code: string, public status: number) { super(message); } }
const query = (world?: V2World) => world ? '?' + new URLSearchParams({ chainId: String(world.chainId), collection: world.collection }) : '';
let sessionToken = '';
let sessionEpoch = 0;
export function setV2Session(value: string) { sessionToken = value; sessionEpoch++; }
interface CachedV2Session { token: string; expiresAt: number; account: string; chainId: number; collection: string }
const visitSessions = new Map<string, CachedV2Session>();
const sessionKey = (account: string, world: V2World) => `nh:v2:session:${world.chainId}:${world.collection.toLowerCase()}:${account.toLowerCase()}`;
export function cacheV2Session(account: string, world: V2World, value: { token: string; expiresAt: number }) {
  const key = sessionKey(account, world), cached = { ...value, account: account.toLowerCase(), chainId: world.chainId, collection: world.collection.toLowerCase() } satisfies CachedV2Session;
  visitSessions.set(key, cached);
  try { sessionStorage.setItem(key, JSON.stringify(cached)); } catch { /* This visit remains signed in when storage is unavailable. */ }
}
/** A cached token is reusable only after the server verifies its MAC and the
 * exact account, chain, collection and expiry match the connected wallet. */
export async function restoreV2Session(account: string, world: V2World): Promise<boolean> {
  const epoch = sessionEpoch, key = sessionKey(account, world); let cached: CachedV2Session | undefined;
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
    const response = await fetch('/api/v2/session', { headers: { Authorization: 'Bearer ' + cached.token }, signal: AbortSignal.timeout(10000) });
    if (response.status === 401) { discard(); return false; }
    if (!response.ok) throw new V2ApiError('Checking your wallet connection. Try again.', 'connection', response.status);
    const verified = await response.json() as { address: string; chainId: number; collection: string; expiresAt: number };
    if (verified.address?.toLowerCase() !== account.toLowerCase() || verified.chainId !== world.chainId || verified.collection?.toLowerCase() !== world.collection.toLowerCase()
      || verified.expiresAt !== cached.expiresAt || verified.expiresAt <= Math.floor(Date.now() / 1000) + 30) { discard(); return false; }
    if (sessionEpoch !== epoch) return false;
    setV2Session(cached.token); return true;
  } catch (error) {
    if (error instanceof V2ApiError) throw error;
    throw new V2ApiError('Checking your wallet connection. Try again.', 'connection', 503);
  }
}
async function read<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch('/api/v2' + path, { method: body === undefined ? 'GET' : 'POST', headers: {
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(sessionToken ? { Authorization: 'Bearer ' + sessionToken } : {}),
  }, body: body === undefined ? undefined : JSON.stringify(body) });
  let data: unknown;
  try { data = await response.json(); } catch { throw new V2ApiError('Checking this home. Try again.', 'connection', response.status); }
  if (!response.ok) {
    const e = data as { error?: { message?: string; code?: string } };
    throw new V2ApiError(e.error?.message || 'Checking this home. Try again.', e.error?.code || 'connection', response.status);
  }
  return data as T;
}
export const v2Api = {
  config: () => read<V2PublicConfig>('/config'),
  guest: () => read<{life:V2PublicLife;packet:unknown;commitment:string}>('/guest'),
  lives: (owner:string,cursor?:string) => read<V2LifePage>('/lives?'+new URLSearchParams({owner,...(cursor?{cursor}:{})})),
  owned: (owner:string,cursor?:string) => read<V2LifePage>('/lives?'+new URLSearchParams({owner,...(cursor?{cursor}:{})})),
  days: (id:string,before?:number,world?:V2World) => {const params=new URLSearchParams(world?{chainId:String(world.chainId),collection:world.collection}:{});if(before!==undefined)params.set('before',String(before));return read<V2DaysPage>('/days/'+encodeURIComponent(id)+(params.size?'?'+params:''));},
  request: (requestId:Hex) => read<V2PublicRequest>('/request/'+encodeURIComponent(requestId)),
  quote: (tokenId: string, kitMask: string, shipping = true) => read<V2OwnerQuote>('/quote', { tokenId, kitMask, shipping }),
  accept: (transactionHash: Hex, requestId: Hex) => read<V2OwnerJob>('/accept', { transactionHash, requestId }),
  job: (requestId: Hex) => read<V2OwnerJob>('/job/' + encodeURIComponent(requestId)),
  wake: (requestId: Hex) => read<V2OwnerJob>('/wake', { requestId }),
  life: (id: string, world?: V2World) => read<{ life: V2PublicLife }>('/rooster/' + encodeURIComponent(id) + query(world)),
  day: (id: string, day: number, world?: V2World) => read<V2PublicDay>('/day/' + encodeURIComponent(id) + '/' + day + query(world)),
  replay: (id: string, day?: number, world?: V2World) => {
    const params = new URLSearchParams(world ? { chainId: String(world.chainId), collection: world.collection } : {});
    if (day !== undefined) params.set('day', String(day));
    return read<{ life: V2PublicLife; packet: unknown; commitment: string }>('/replay/' + encodeURIComponent(id) + (params.size ? '?' + params : ''));
  },
};
