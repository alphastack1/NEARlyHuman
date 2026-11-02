import type { V2PublicLife, V2PublicDay, V2PublicConfig, V2World } from '../v2/public';

export class V2ApiError extends Error { constructor(message: string, public code: string, public status: number) { super(message); } }
const query = (world?: V2World) => world ? '?' + new URLSearchParams({ chainId: String(world.chainId), collection: world.collection }) : '';
async function read<T>(path: string): Promise<T> {
  const response = await fetch('/api/v2' + path);
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
  life: (id: string, world?: V2World) => read<{ life: V2PublicLife }>('/rooster/' + encodeURIComponent(id) + query(world)),
  day: (id: string, day: number, world?: V2World) => read<V2PublicDay>('/day/' + encodeURIComponent(id) + '/' + day + query(world)),
  replay: (id: string, day?: number, world?: V2World) => {
    const params = new URLSearchParams(world ? { chainId: String(world.chainId), collection: world.collection } : {});
    if (day !== undefined) params.set('day', String(day));
    return read<{ life: V2PublicLife; packet: unknown; commitment: string }>('/replay/' + encodeURIComponent(id) + (params.size ? '?' + params : ''));
  },
};
