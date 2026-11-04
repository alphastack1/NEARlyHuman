import type { DiscoveryWorldId } from '../chain/discovery-types';

export const validLifeId = (value: string): boolean => /^[1-9]\d{0,77}$/.test(value);
export const validLifeWorld = (value: string): value is DiscoveryWorldId => value === 'near-testnet' || value === 'robinhood-testnet';

/** Public identity includes its world; token #1 is not a cross-chain identity. */
export function publicLifePath(world: DiscoveryWorldId, id: string): string {
  if (!validLifeWorld(world) || !validLifeId(id)) throw new Error('Invalid public life identity');
  return `/life/${world}/${id}`;
}

export function parsePublicLifePath(path: string): { worldId: DiscoveryWorldId; id: string } | undefined {
  const match = path.match(/^\/life\/([^/]+)\/([1-9]\d{0,77})\/?$/);
  return match && validLifeWorld(match[1]!) ? { worldId: match[1], id: match[2]! } : undefined;
}
