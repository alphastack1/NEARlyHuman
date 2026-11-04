import { createHash, randomUUID } from 'node:crypto';
import type { DiscoverySort, DiscoveryStatus, DiscoveryWorldId, PublicLifeDirectory, PublicLifeSummary } from '../../src/chain/discovery-types';
import { storage, type DurableStore } from '../storage';
import { DiscoveryError, discoveryDescriptor, readDiscoveryWorld, MAX_DISCOVERY_LIVES, type DiscoveryDescriptor, type DiscoveryRead } from './reader';

const FRESH_MS = 3 * 60_000, CURSOR_MS = 60 * 60_000, LAST_GOOD_MS = 24 * 60 * 60_000, LEASE_MS = 45_000;
const ROOT = 'public/discovery/v1/';
const sha = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const numericOrder = (a: string, b: string) => BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0;
interface Snapshot extends DiscoveryRead { version: 1; fingerprint: string; id: string; at: number }
interface Head { id: string; retained: { id: string; at: number }[] }
interface Lease { token: string; until: number }
interface Cursor { v: 1; snapshot: string; offset: number; query: string }
export interface DirectoryQuery { world: DiscoveryWorldId; sort: DiscoverySort; status: DiscoveryStatus; query: string; limit: number; cursor?: string }
export interface DirectoryDependencies {
  store?: DurableStore;
  now?: () => number;
  descriptor?: (world: DiscoveryWorldId) => DiscoveryDescriptor;
  read?: (descriptor: DiscoveryDescriptor) => Promise<DiscoveryRead>;
}
const warmSnapshots = new Map<string, Snapshot>();
const refreshing = new Map<string, Promise<Snapshot>>();
const snapshotKey = (base: string, id: string) => `${base}snapshots/${id}`;
function remember(key: string, snapshot: Snapshot) {
  warmSnapshots.delete(key); warmSnapshots.set(key, snapshot);
  while (warmSnapshots.size > 32) warmSnapshots.delete(warmSnapshots.keys().next().value!);
}
function snapshotBody(snapshot: Omit<Snapshot, 'id'>) {
  return { version: snapshot.version, fingerprint: snapshot.fingerprint, world: snapshot.world, height: snapshot.height, hash: snapshot.hash, items: snapshot.items, at: snapshot.at };
}
function validSummary(item: PublicLifeSummary) {
  return item && /^[1-9]\d{0,77}$/.test(item.id) && typeof item.owner === 'string' && item.owner.length >= 2 && item.owner.length <= 64
    && (/^0x[\da-f]{40}$/i.test(item.owner) || /^[a-z\d]+(?:[-_.][a-z\d]+)*$/.test(item.owner))
    && typeof item.name === 'string' && /^[A-Z0-9 ]{1,8}$/.test(item.name) && typeof item.alive === 'boolean' && typeof item.pending === 'boolean'
    && [item.day, item.level, item.rank, item.plantedBeds, item.readyBeds].every(n => Number.isSafeInteger(n) && n >= 0)
    && item.day <= 0xffffffff && item.level <= 0xffffffff && item.plantedBeds <= 4 && item.readyBeds <= item.plantedBeds
    && /^(0|[1-9]\d{0,77})$/.test(item.purseMicro);
}
function validSnapshot(snapshot: Snapshot | undefined, descriptor: DiscoveryDescriptor): snapshot is Snapshot {
  return !!snapshot && snapshot.version === 1 && snapshot.fingerprint === descriptor.fingerprint && sha(snapshot.world) === sha(descriptor.world)
    && /^[a-f0-9]{64}$/.test(snapshot.id) && Number.isSafeInteger(snapshot.at) && snapshot.at > 0 && /^\d{1,30}$/.test(snapshot.height)
    && typeof snapshot.hash === 'string' && snapshot.hash.length >= 32 && snapshot.hash.length <= 66
    && Array.isArray(snapshot.items) && snapshot.items.length <= MAX_DISCOVERY_LIVES && snapshot.items.every(validSummary)
    && new Set(snapshot.items.map(item => item.id)).size === snapshot.items.length && snapshot.id === sha(snapshotBody(snapshot));
}
function makeSnapshot(read: DiscoveryRead, descriptor: DiscoveryDescriptor, now: number): Snapshot {
  if (sha(read.world) !== sha(descriptor.world) || read.items.length > MAX_DISCOVERY_LIVES || read.items.some(item => !validSummary(item))) throw new DiscoveryError('connection', 'Checking these lives again.');
  const longest = [...read.items].sort((a, b) => b.level - a.level || numericOrder(a.id, b.id));
  let rank = 0, previous: number | undefined;
  const ranks = new Map(longest.map((item, index) => { if (item.level !== previous) rank = index + 1; previous = item.level; return [item.id, rank]; }));
  const items = read.items.map(item => ({ ...item, rank: ranks.get(item.id)! })).sort((a, b) => numericOrder(a.id, b.id));
  const body = snapshotBody({ version: 1, fingerprint: descriptor.fingerprint, world: descriptor.world, height: read.height, hash: read.hash, items, at: now });
  const snapshot: Snapshot = { ...body, version: 1, id: sha(body) };
  if (!validSnapshot(snapshot, descriptor)) throw new DiscoveryError('connection', 'Checking these lives again.');
  return snapshot;
}
async function loadSnapshot(store: DurableStore, base: string, id: string, descriptor: DiscoveryDescriptor): Promise<Snapshot | undefined> {
  if (!/^[a-f0-9]{64}$/.test(id)) return;
  const key = snapshotKey(base, id), warm = warmSnapshots.get(key);
  if (validSnapshot(warm, descriptor)) return warm;
  const saved = (await store.get<Snapshot>(key))?.value;
  if (!validSnapshot(saved, descriptor)) return;
  remember(key, saved); return saved;
}
async function publish(store: DurableStore, base: string, snapshot: Snapshot, descriptor: DiscoveryDescriptor): Promise<Snapshot> {
  const key = snapshotKey(base, snapshot.id);
  if (!await store.put(key, snapshot, { isNew: true })) {
    const existing = await loadSnapshot(store, base, snapshot.id, descriptor);
    if (!existing) throw new DiscoveryError('connection', 'Could not refresh these lives. Try again.');
  }
  for (let attempt = 0; attempt < 4; attempt++) {
    const old = await store.get<Head>(base + 'head'), prior = old?.value?.id ? await loadSnapshot(store, base, old.value.id, descriptor) : undefined;
    // An earlier refresh finishing late must not replace a newer chain snapshot.
    if (prior && (BigInt(prior.height) > BigInt(snapshot.height) || prior.height === snapshot.height && prior.at > snapshot.at)) return prior;
    const retained = [{ id: snapshot.id, at: snapshot.at }, ...(Array.isArray(old?.value.retained) ? old.value.retained : [])]
      .filter((item, index, all) => /^[a-f0-9]{64}$/.test(item.id) && item.at >= snapshot.at - CURSOR_MS && all.findIndex(other => other.id === item.id) === index).slice(0, 24);
    if (await store.put<Head>(base + 'head', { id: snapshot.id, retained }, old ? { etag: old.etag } : { isNew: true })) {
      remember(key, snapshot);
      // Only exact keys listed in our public-cache head can be pruned. Never
      // enumerate or delete any financial, authentication or service namespace.
      for (const item of old?.value.retained || []) if (/^[a-f0-9]{64}$/.test(item.id) && !retained.some(keep => keep.id === item.id)) {
        await store.delete(snapshotKey(base, item.id)).catch(() => {}); warmSnapshots.delete(snapshotKey(base, item.id));
      }
      return snapshot;
    }
  }
  throw new DiscoveryError('connection', 'Could not refresh these lives. Try again.');
}
async function currentSnapshot(query: DirectoryQuery, descriptor: DiscoveryDescriptor, store: DurableStore, now: () => number, read: (d: DiscoveryDescriptor) => Promise<DiscoveryRead>) {
  const base = `${ROOT}${query.world}/${descriptor.fingerprint}/`, head = await store.get<Head>(base + 'head');
  const old = head?.value?.id ? await loadSnapshot(store, base, head.value.id, descriptor) : undefined;
  if (old && now() - old.at < FRESH_MS) return old;
  const running = refreshing.get(base); if (running) return running;
  const operation = (async () => {
    const existingLease = await store.get<Lease>(base + 'lease'), stamp = now(), token = randomUUID();
    if (existingLease && existingLease.value.until > stamp) {
      if (old && stamp - old.at <= LAST_GOOD_MS) return old;
      throw new DiscoveryError('refreshing', 'These homes are opening. Try again in a moment.');
    }
    if (!await store.put<Lease>(base + 'lease', { token, until: stamp + LEASE_MS }, existingLease ? { etag: existingLease.etag } : { isNew: true })) {
      if (old && stamp - old.at <= LAST_GOOD_MS) return old;
      throw new DiscoveryError('refreshing', 'These homes are opening. Try again in a moment.');
    }
    let failed = false;
    try { return await publish(store, base, makeSnapshot(await read(descriptor), descriptor, now()), descriptor); }
    catch (error) {
      failed = true;
      if (!(error instanceof DiscoveryError && error.code === 'collection_capacity') && old && now() - old.at <= LAST_GOOD_MS) return old;
      throw error;
    } finally {
      const held = await store.get<Lease>(base + 'lease').catch(() => null);
      if (held?.value.token === token) await store.put<Lease>(base + 'lease', { token, until: failed ? now() + 15_000 : 0 }, { etag: held.etag }).catch(() => {});
    }
  })();
  refreshing.set(base, operation);
  try { return await operation; } finally { if (refreshing.get(base) === operation) refreshing.delete(base); }
}

export function parseDirectoryQuery(params: URLSearchParams): DirectoryQuery {
  const world = params.get('world') || 'near-testnet', sort = params.get('sort') || 'newest', status = params.get('status') || 'all';
  const query = (params.get('q') || '').trim().toUpperCase(), limitText = params.get('limit') || '12', cursor = params.get('cursor') || undefined;
  if (!['near-testnet', 'robinhood-testnet'].includes(world) || !['newest', 'longest'].includes(sort) || !['all', 'alive', 'remembered'].includes(status)
    || query.length > 40 || !/^[A-Z0-9 #]*$/.test(query) || !/^\d{1,2}$/.test(limitText) || +limitText < 1 || +limitText > 24 || cursor && (cursor.length > 420 || !/^[A-Za-z0-9_-]+$/.test(cursor))) throw new DiscoveryError('format', 'Choose a collection or search by name and number.', 400);
  return { world: world as DiscoveryWorldId, sort: sort as DiscoverySort, status: status as DiscoveryStatus, query, limit: +limitText, ...(cursor ? { cursor } : {}) };
}
/** Complete immutable snapshots are durable so cursors work across function instances. */
export async function readPublicLifeDirectory(query: DirectoryQuery, dependencies: DirectoryDependencies = {}): Promise<PublicLifeDirectory> {
  const store = dependencies.store || storage(), now = dependencies.now || Date.now, descriptor = (dependencies.descriptor || discoveryDescriptor)(query.world);
  const base = `${ROOT}${query.world}/${descriptor.fingerprint}/`, queryHash = sha([query.world, query.sort, query.status, query.query]);
  let snapshot: Snapshot, offset = 0;
  if (query.cursor) {
    let cursor: Cursor;
    try { cursor = JSON.parse(Buffer.from(query.cursor, 'base64url').toString('utf8')); } catch { throw new DiscoveryError('cursor_expired', 'Open this collection again.', 409); }
    if (cursor.v !== 1 || cursor.query !== queryHash || !Number.isSafeInteger(cursor.offset) || cursor.offset < 1 || cursor.offset > MAX_DISCOVERY_LIVES || !/^[a-f0-9]{64}$/.test(cursor.snapshot)) throw new DiscoveryError('cursor_expired', 'Open this collection again.', 409);
    const saved = await loadSnapshot(store, base, cursor.snapshot, descriptor);
    if (!saved || now() - saved.at > CURSOR_MS || saved.at > now() + 60_000) throw new DiscoveryError('cursor_expired', 'Open this collection again.', 409);
    snapshot = saved; offset = cursor.offset;
  } else snapshot = await currentSnapshot(query, descriptor, store, now, dependencies.read || readDiscoveryWorld);
  const terms = query.query.replace(/#/g, ' ').trim().split(/\s+/).filter(Boolean);
  const items = snapshot.items.filter(item => (query.status === 'all' || (query.status === 'alive') === item.alive) && terms.every(term => item.name.includes(term) || item.id === term))
    .sort(query.sort === 'longest' ? (a, b) => b.level - a.level || numericOrder(a.id, b.id) : (a, b) => numericOrder(b.id, a.id));
  if (offset > items.length) throw new DiscoveryError('cursor_expired', 'Open this collection again.', 409);
  const nextOffset = offset + query.limit;
  return { world: snapshot.world, snapshot: { id: snapshot.id, at: new Date(snapshot.at).toISOString(), height: snapshot.height, hash: snapshot.hash, complete: true, stale: now() - snapshot.at >= FRESH_MS },
    sort: query.sort, status: query.status, query: query.query, total: items.length, collectionTotal: snapshot.items.length, items: items.slice(offset, nextOffset),
    ...(nextOffset < items.length ? { nextCursor: Buffer.from(JSON.stringify({ v: 1, snapshot: snapshot.id, offset: nextOffset, query: queryHash } satisfies Cursor)).toString('base64url') } : {}) };
}
