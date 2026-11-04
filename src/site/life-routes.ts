import type { DiscoveryWorldId } from '../chain/discovery-types';
import { ORIGINAL_ROBINHOOD } from '../chain/deployment-catalog';

export const validLifeId = (value: string): boolean => /^[1-9]\d{0,77}$/.test(value);
export const validLifeWorld = (value: string): value is DiscoveryWorldId => value === 'near-testnet' || value === 'robinhood-testnet';

/** Public identity includes its world; token #1 is not a cross-chain identity. */
export function publicLifePath(world: DiscoveryWorldId, id: string, collection?: string): string {
  if (!validLifeWorld(world) || !validLifeId(id)) throw new Error('Invalid public life identity');
  if (world === 'robinhood-testnet' && collection && collection.toLowerCase() !== ORIGINAL_ROBINHOOD.runtime.collection.toLowerCase()) {
    if (!/^0x[\da-f]{40}$/i.test(collection)) throw new Error('Invalid public collection');
    return `/life/${world}/${collection.toLowerCase()}/${id}`;
  }
  return `/life/${world}/${id}`;
}

export function parsePublicLifePath(path: string): { worldId: DiscoveryWorldId; id: string; collection?: string } | undefined {
  const qualified = path.match(/^\/life\/(robinhood-testnet)\/(0x[\da-f]{40})\/([1-9]\d{0,77})\/?$/i);
  if (qualified) return { worldId: 'robinhood-testnet', collection: qualified[2]!.toLowerCase(), id: qualified[3]! };
  const match = path.match(/^\/life\/([^/]+)\/([1-9]\d{0,77})\/?$/);
  return match && validLifeWorld(match[1]!) ? { worldId: match[1], id: match[2]! } : undefined;
}
