import { PROJECT } from './project';
import type { DiscoverySort, DiscoveryStatus, DiscoveryWorldId, PublicLifeDirectory } from '../chain/discovery-types';
import type { GameDaysPage, GamePublicLife } from '../chain/game-types';

export type PublicWorld = typeof PROJECT.worlds[number];
export interface ExploreControls { world: DiscoveryWorldId; sort: DiscoverySort; status: DiscoveryStatus; query: string }
export interface ExploreMemory { controls: ExploreControls; directory: PublicLifeDirectory; scroll: number; savedAt: number; checkedAt: number }
const MEMORY_KEY = 'nh:site:explore';
export const worldById = (id: string): PublicWorld | undefined => PROJECT.worlds.find(world => world.id === id);
export const validLifeId = (id: string) => /^[1-9]\d{0,77}$/.test(id);
export function exploreControls(search = location.search): ExploreControls {
  const params = new URLSearchParams(search);
  return { world: worldById(params.get('world') || '')?.id || 'near-testnet', sort: params.get('sort') === 'longest' ? 'longest' : 'newest',
    status: params.get('status') === 'alive' ? 'alive' : params.get('status') === 'remembered' ? 'remembered' : 'all', query: (params.get('q') || '').slice(0, 40) };
}
export function exploreQuery(controls: ExploreControls): string {
  const query = new URLSearchParams({ world: controls.world, sort: controls.sort });
  if (controls.status !== 'all') query.set('status', controls.status);
  if (controls.query.trim()) query.set('q', controls.query.trim());
  return query.toString();
}
export const exploreHref = (controls: ExploreControls) => '/explore?' + exploreQuery(controls);
export function returnToExplore(world: PublicWorld): string {
  try { const from = new URLSearchParams(location.search).get('from'); if (from) { const url = new URL(from, location.origin); if (url.origin === location.origin && url.pathname === '/explore') return exploreHref(exploreControls(url.search)); } } catch { /* Use the exact life’s world below. */ }
  return exploreHref({ world: world.id, sort: 'newest', status: 'all', query: '' });
}
export function publicLifeHref(world: PublicWorld, id: string, from?: string): string {
  return `/life/${world.id}/${id}` + (from ? '?' + new URLSearchParams({ from }) : '');
}
export function worldQuery(world: PublicWorld): URLSearchParams {
  const params = new URLSearchParams(new URL(world.appHref, 'https://nearlyhuman.netlify.app').search);
  params.delete('v2'); return params;
}
export function visitHref(world: PublicWorld, id: string, day?: number): string {
  const url = new URL(world.appHref, 'https://nearlyhuman.netlify.app');
  url.searchParams.set('rooster', id); url.searchParams.set('view', day === undefined ? 'home' : 'watch');
  if (day !== undefined) url.searchParams.set('day', String(day));
  return url.pathname + url.search;
}
export const lifeImage = (world: PublicWorld, id: string) => `${world.id === 'near-testnet' ? '/api/near/v2' : '/api/v2'}/nft/${id}/image.svg?${worldQuery(world)}`;
export const lifeExplorer = (world: PublicWorld, id: string) => world.id === 'near-testnet'
  ? `https://testnet.nearblocks.io/nft-tokens/${encodeURIComponent(world.collection)}/tokens/${id}`
  : `https://explorer.testnet.chain.robinhood.com/token/${world.collection}/instance/${id}`;
export const ownerExplorer = (world: PublicWorld, owner: string) => `${world.id === 'near-testnet' ? 'https://testnet.nearblocks.io' : 'https://explorer.testnet.chain.robinhood.com'}/address/${encodeURIComponent(owner)}`;
export const shortOwner = (owner: string) => owner.length > 26 ? `${owner.slice(0, 10)}…${owner.slice(-8)}` : owner;
export function nhcAmount(value: string): string {
  try { const amount = BigInt(value), whole = amount / 1_000_000n, fraction = (amount % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, ''); return whole.toLocaleString() + (fraction ? '.' + fraction : ''); }
  catch { return '—'; }
}
export class PublicReadError extends Error {
  constructor(message: string, readonly status = 503, readonly code = '') { super(message); this.name = 'PublicReadError'; }
}
async function read<T>(url: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 25000);
  const abort = () => controller.abort(); if (signal?.aborted) controller.abort(); else signal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetch(url, { signal: controller.signal });
    let body: unknown; try { body = await response.json(); } catch { throw new PublicReadError('These lives could not be loaded. Try again.'); }
    if (!response.ok) { const error = (body as { error?: { message?: unknown; code?: unknown } })?.error; throw new PublicReadError(typeof error?.message === 'string' && error.message.length < 180 ? error.message : 'These lives could not be loaded. Try again.', response.status, typeof error?.code === 'string' ? error.code : ''); }
    return body as T;
  } catch (error) { if (signal?.aborted) throw error; if (error instanceof PublicReadError) throw error; throw new PublicReadError('Could not reach these lives. Try again.'); }
  finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
export function checkDirectory(value: PublicLifeDirectory, controls: ExploreControls): PublicLifeDirectory {
  const world = worldById(controls.world);
  if (!world || value?.world?.id !== world.id || typeof value.world.collection !== 'string' || value.world.collection.toLowerCase() !== world.collection.toLowerCase() || value.snapshot?.complete !== true || !Array.isArray(value.items)
    || !Number.isSafeInteger(value.total) || value.total < 0 || !Number.isSafeInteger(value.collectionTotal) || value.collectionTotal < value.total
    || value.items.some(life => !validLifeId(life.id) || !life.name || typeof life.owner !== 'string' || !Number.isSafeInteger(life.level) || life.level < 0 || !Number.isSafeInteger(life.day) || life.day < 0 || typeof life.alive !== 'boolean')) throw new PublicReadError('These lives need another check. Try again.');
  return value;
}
export async function readDirectory(controls: ExploreControls, cursor?: string, signal?: AbortSignal): Promise<PublicLifeDirectory> {
  const params = new URLSearchParams(exploreQuery(controls)); params.set('limit', '12'); if (cursor) params.set('cursor', cursor);
  return checkDirectory(await read<PublicLifeDirectory>('/api/explore/lives?' + params, signal), controls);
}
export async function readLife(world: PublicWorld, id: string, signal?: AbortSignal): Promise<GamePublicLife> {
  const result = await read<{ life: GamePublicLife }>(`${world.id === 'near-testnet' ? '/api/near/v2' : '/api/v2'}/rooster/${id}?${worldQuery(world)}`, signal), life = result?.life;
  if (!life || life.id !== id || life.collection.toLowerCase() !== world.collection.toLowerCase() || (world.id === 'near-testnet' ? !('networkId' in life) || life.networkId !== 'near-testnet' : !('chainId' in life) || life.chainId !== 46630)
    || !Array.isArray(life.state?.plots) || life.state.plots.length !== 4 || !Array.isArray(life.state.inventory) || life.state.inventory.length !== 34 || !Array.isArray(life.state.stats) || life.state.stats.length !== 3 || !/^\d+$/.test(life.purseMicro)) throw new PublicReadError('This life needs another check. Try again.');
  return life;
}
export async function readDays(world: PublicWorld, id: string, before?: number, signal?: AbortSignal): Promise<GameDaysPage> {
  const params = worldQuery(world); if (before !== undefined) params.set('before', String(before));
  const value = await read<GameDaysPage>(`${world.id === 'near-testnet' ? '/api/near/v2' : '/api/v2'}/days/${id}?${params}`, signal);
  if (!Array.isArray(value.days) || value.days.some(day => !Number.isSafeInteger(day.day) || day.day < 1)) throw new PublicReadError('These saved days need another check. Try again.');
  return value;
}
export function loadExploreMemory(controls: ExploreControls): ExploreMemory | undefined {
  try { const raw = sessionStorage.getItem(MEMORY_KEY); if (!raw || raw.length > 200000) return; const saved = JSON.parse(raw) as ExploreMemory;
    if (exploreQuery(saved.controls) !== exploreQuery(controls) || Date.now() - saved.savedAt > 5 * 60_000 || !Number.isFinite(saved.scroll) || !Number.isFinite(saved.checkedAt) || saved.checkedAt > Date.now()) return;
    checkDirectory(saved.directory, controls); return saved;
  } catch { return; }
}
export const exploreMemoryFresh = (memory: ExploreMemory, now = Date.now()) => now >= memory.checkedAt && now - memory.checkedAt < 15000;
export function refreshedDirectory(head: PublicLifeDirectory, remembered?: PublicLifeDirectory): PublicLifeDirectory {
  return remembered?.snapshot.id === head.snapshot.id && remembered.items.length > head.items.length
    ? { ...head, items: remembered.items, nextCursor: remembered.nextCursor } : head;
}
export function saveExploreMemory(controls: ExploreControls, directory: PublicLifeDirectory, checkedAt: number, scroll = window.scrollY) {
  try { const raw = JSON.stringify({ controls, directory, scroll, savedAt: Date.now(), checkedAt } satisfies ExploreMemory); if (raw.length < 200000) sessionStorage.setItem(MEMORY_KEY, raw); } catch { /* Public browsing also works without storage. */ }
}
