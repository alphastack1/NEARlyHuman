import type { GamePublicConfig, GameWorld } from './game-types';
import { isNearWorld } from './game-types';
import { GAME_NETWORKS, networkForConfig, type GameNetwork } from './networks';
import { explorerToken, explorerTransaction } from './config';

export const isNearAccount = (value: unknown): value is string => typeof value === 'string'
  && value.length >= 2 && value.length <= 64 && /^[a-z\d]+(?:[-_.][a-z\d]+)*$/.test(value);

export function worldKey(world: GameWorld): string {
  return isNearWorld(world) ? `near-testnet:${world.collection}` : `${world.chainId}:${world.collection.toLowerCase()}`;
}
export function sameWorld(a?: GameWorld, b?: GameWorld): boolean { return !!a && !!b && worldKey(a) === worldKey(b); }
export function sameAccount(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return /^0x[\da-f]{40}$/i.test(a) && /^0x[\da-f]{40}$/i.test(b) ? a.toLowerCase() === b.toLowerCase() : a === b;
}
export function worldParams(world: GameWorld): URLSearchParams {
  return isNearWorld(world)
    ? new URLSearchParams({ networkId: 'near-testnet', collection: world.collection })
    : new URLSearchParams({ chainId: String(world.chainId), collection: world.collection });
}
export function parseGameWorld(query: URLSearchParams): GameWorld | undefined {
  const collection = query.get('collection'), network = query.get('networkId');
  if (network === 'near-testnet') return !query.has('chainId') && isNearAccount(collection) && collection.endsWith('.testnet') ? { networkId: 'near-testnet', collection } : undefined;
  if (network && network !== 'robinhood-testnet') return;
  const chain = query.get('chainId');
  if (chain && /^[1-9]\d{0,5}$/.test(chain) && collection && /^0x[\da-f]{40}$/i.test(collection)) return { chainId: Number(chain), collection: collection as `0x${string}` };
}
export function gameNetwork(world: GameWorld | GamePublicConfig): GameNetwork | undefined {
  return isNearWorld(world) ? GAME_NETWORKS.find(network => network.id === 'near-testnet') : networkForConfig(world);
}
export function gameExplorerToken(world: GameWorld, id: string): string {
  return isNearWorld(world) ? `https://testnet.nearblocks.io/nft-tokens/${encodeURIComponent(world.collection)}/tokens/${encodeURIComponent(id)}` : explorerToken(world.chainId, world.collection, id);
}
export function gameExplorerTransaction(world: GameWorld, hash: string): string {
  return isNearWorld(world) ? `https://testnet.nearblocks.io/txns/${encodeURIComponent(hash)}` : explorerTransaction(world.chainId, hash);
}
export function gameLifeUrl(world: GameWorld, id: string, origin = location.origin): string {
  const url = new URL('/app', origin), params = worldParams(world); params.set('entry', 'app'); params.set('rooster', id); url.search = params.toString(); return url.href;
}
export function gameImageUrl(world: GameWorld, id: string): string {
  return `${isNearWorld(world) ? '/api/near' : '/api/evm'}/nft/${encodeURIComponent(id)}/image.svg?${worldParams(world)}`;
}
