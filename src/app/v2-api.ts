import type { V2PublicLife, V2PublicDay, V2PublicConfig, V2World, V2OwnerJob, V2OwnerQuote, V2LifePage, V2DaysPage, V2PublicRequest } from '../v2/public';
import type { Hex } from 'viem';

export class V2ApiError extends Error { constructor(message: string, public code: string, public status: number) { super(message); } }
const query = (world?: V2World) => world ? '?' + new URLSearchParams({ chainId: String(world.chainId), collection: world.collection }) : '';
let sessionToken = '';
export function setV2Session(value: string) { sessionToken = value; }
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
