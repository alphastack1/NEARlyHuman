import { createHash } from 'node:crypto';
import { storage, StoreConflict, type DurableStore } from '../storage';
import { serverConfig } from '../config';

const poolKey = 'v2/control/ai-pool';
// This source-store fence is intentionally outside the imported v2/ namespace.
export const V2_STORE_CUTOVER_KEY = 'control/v2-store-cutover';
const campaignKey = (id: string) => `v2/ai-campaigns/${id}`;
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
export const V2_SEND_RESERVE_MICRO_USD = 5_000;
export class V2BudgetError extends Error {
  constructor(public code: 'capacity' | 'uncertain' | 'changed' | 'overrun', message: string) { super(message); }
}
export async function assertV2StoreOpen(store: DurableStore) {
  if (await store.get(V2_STORE_CUTOVER_KEY)) throw new V2BudgetError('capacity', 'This preparation ledger has moved to its hosted worker.');
}
interface Pool {
  version: 2;
  providerInitialCeilingMicroUSD: number;
  preservedV1AllocationMicroUSD: number;
  v2PoolCeilingMicroUSD: number;
  allocations: Record<string, number>;
  releases?: Record<string, CampaignClosure & { unusedMicroUSD: number }>;
}
interface CampaignClosure {
  at: number; chargedMicroUSD: number; entryCount: number; snapshotHash: string; reason: string;
}
interface Entry {
  callId: string; inputHash: string; status: 'sent' | 'complete' | 'uncertain';
  chargedMicroUSD: number; sentAt: number; finishedAt?: number; value?: unknown; valueHash?: string;
  jobId?: string;
}
interface Campaign {
  version: 2; id: string; limitMicroUSD: number; chargedMicroUSD: number;
  createdAt: number; halted: boolean; provenance: string; entries: Record<string, Entry>;
  jobs?: Record<string, { limitMicroUSD: number; chargedMicroUSD: number; active: boolean }>;
  closed?: CampaignClosure;
}
const money = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)])) : value;
const closureHash = (c: Campaign) => sha(JSON.stringify(canonical({ version: c.version, id: c.id, limitMicroUSD: c.limitMicroUSD,
  chargedMicroUSD: c.chargedMicroUSD, entries: c.entries, jobs: c.jobs || {} })));
function validCampaign(c: Campaign): void {
  if (c.version !== 2 || !/^[a-z0-9][a-z0-9-]{1,79}$/.test(c.id) || !money(c.limitMicroUSD) || c.limitMicroUSD > 100_000 || !money(c.chargedMicroUSD) || typeof c.halted !== 'boolean'
    || !c.entries || typeof c.entries !== 'object' || Array.isArray(c.entries)) throw new V2BudgetError('changed', 'The AI accounting needs another check.');
  const entries = Object.values(c.entries);
  if (entries.some(e => !money(e.chargedMicroUSD) || !['sent', 'complete', 'uncertain'].includes(e.status))
    || entries.reduce((sum, e) => sum + e.chargedMicroUSD, 0) !== c.chargedMicroUSD) throw new V2BudgetError('changed', 'The AI accounting needs another check.');
  if (c.jobs !== undefined && (!c.jobs || typeof c.jobs !== 'object' || Array.isArray(c.jobs))) throw new V2BudgetError('changed', 'The job allocation needs another check.');
  for (const [id, job] of Object.entries(c.jobs || {})) if (!money(job.limitMicroUSD) || !money(job.chargedMicroUSD) || typeof job.active !== 'boolean'
    || entries.filter(e => e.jobId === id).reduce((sum, e) => sum + e.chargedMicroUSD, 0) !== job.chargedMicroUSD) throw new V2BudgetError('changed', 'The job allocation needs another check.');
  if (c.closed && (!money(c.closed.at) || !c.halted || c.closed.chargedMicroUSD !== c.chargedMicroUSD || c.closed.entryCount !== entries.length
    || typeof c.closed.reason !== 'string' || !c.closed.reason.trim() || c.closed.reason.length > 300 || c.closed.snapshotHash !== closureHash(c) || entries.some(e => e.status !== 'complete')
    || Object.values(c.jobs || {}).some(j => j.active))) throw new V2BudgetError('changed', 'The closed campaign audit changed.');
}
const committed = (c: Campaign) => c.chargedMicroUSD + Object.values(c.jobs || {}).filter(j => j.active).reduce((sum, j) => sum + Math.max(0, j.limitMicroUSD - j.chargedMicroUSD), 0);
async function poolCommitment(p: Pool, store: DurableStore): Promise<number> {
  if (!p || p.version !== 2 || p.preservedV1AllocationMicroUSD !== 900_000 || p.v2PoolCeilingMicroUSD !== 100_000 || p.providerInitialCeilingMicroUSD !== 1_000_000
    || !p.allocations || typeof p.allocations !== 'object' || Array.isArray(p.allocations) || Object.values(p.allocations).some(n => !money(n))
    || p.releases !== undefined && (!p.releases || typeof p.releases !== 'object' || Array.isArray(p.releases))) throw new V2BudgetError('changed', 'The funded campaign allocation changed.');
  let released = 0;
  for (const [id, release] of Object.entries(p.releases || {})) {
    const c = (await store.get<Campaign>(campaignKey(id)))?.value;
    if (!c) throw new V2BudgetError('changed', 'The closed campaign audit is missing.');
    validCampaign(c);
    if (!c.closed || p.allocations[id] !== c.limitMicroUSD || !money(release.unusedMicroUSD) || release.unusedMicroUSD !== c.limitMicroUSD - c.chargedMicroUSD
      || JSON.stringify(canonical({ ...c.closed, unusedMicroUSD: release.unusedMicroUSD })) !== JSON.stringify(canonical(release))) throw new V2BudgetError('changed', 'The released allocation audit changed.');
    released += release.unusedMicroUSD;
  }
  const amount = Object.values(p.allocations).reduce((a, b) => a + b, 0) - released;
  if (amount < 0 || amount > p.v2PoolCeilingMicroUSD) throw new V2BudgetError('changed', 'The funded campaign allocation changed.');
  return amount;
}
async function allocated(id: string, store: DurableStore, campaign: Campaign): Promise<void> {
  const p = (await store.get<Pool>(poolKey))?.value;
  if (!p || campaign.id !== id || p.allocations?.[id] !== campaign.limitMicroUSD) throw new V2BudgetError('changed', 'The funded campaign allocation changed.');
  await poolCommitment(p, store);
}
export async function updateV2Record<T>(store: DurableStore, key: string, initial: () => T, apply: (value: T) => T | Promise<T>): Promise<T> {
  for (let i = 0; i < 12; i++) {
    const current = await store.get<T>(key), next = await apply(structuredClone(current?.value ?? initial()));
    if (await store.put(key, next, current ? { etag: current.etag } : { isNew: true })) return next;
  }
  throw new StoreConflict();
}

/** Deliberate new allocation outside the preserved $0.90 V1 envelope, not a ledger reset. */
export async function createV2Campaign(id: string, limitMicroUSD: number, store: DurableStore = storage()) {
  await assertV2StoreOpen(store);
  if (serverConfig().fundedMicroUSD > 900_000) throw new V2BudgetError('changed', 'The V1 allocation must be reconciled before funding V2.');
  if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(id) || !Number.isSafeInteger(limitMicroUSD) || limitMicroUSD < V2_SEND_RESERVE_MICRO_USD || limitMicroUSD > 100_000) throw new V2BudgetError('capacity', 'Choose a bounded AI allocation.');
  const previousPool = (await store.get<Pool>(poolKey))?.value;
  if (!previousPool && (await store.list('v2/ai-campaigns/')).length) throw new V2BudgetError('changed', 'The existing AI pool ledger must be recovered, not reset.');
  if (previousPool?.allocations?.[id] !== undefined && !await store.get<Campaign>(campaignKey(id))) throw new V2BudgetError('changed', 'The existing campaign ledger must be recovered, not reset.');
  await updateV2Record<Pool>(store, poolKey, () => ({ version: 2, providerInitialCeilingMicroUSD: 1_000_000, preservedV1AllocationMicroUSD: 900_000, v2PoolCeilingMicroUSD: 100_000, allocations: {} }), async pool => {
    await assertV2StoreOpen(store);
    const held = await poolCommitment(pool, store);
    if (pool.allocations[id] !== undefined && pool.allocations[id] !== limitMicroUSD) throw new V2BudgetError('changed', 'This allocation already has a fixed limit.');
    if (pool.allocations[id] === undefined) {
      if (held + limitMicroUSD > pool.v2PoolCeilingMicroUSD) throw new V2BudgetError('capacity', 'The reserved AI allocation is full.');
      pool.allocations[id] = limitMicroUSD;
    }
    return pool;
  });
  await updateV2Record<Campaign>(store, campaignKey(id), () => ({ version: 2, id, limitMicroUSD, chargedMicroUSD: 0, createdAt: Date.now(), halted: false,
    provenance: 'Explicit allocation from the $0.10 outside the existing $0.90 V1 envelope. Neither live provider balance nor V1 spending is reset or inferred.', entries: {} }), campaign => {
    validCampaign(campaign);
    if (campaign.id !== id || campaign.limitMicroUSD !== limitMicroUSD) throw new V2BudgetError('changed', 'This allocation already has a fixed limit.');
    return campaign;
  });
  return inspectV2Campaign(id, store);
}

class CachedRace<T> extends Error { constructor(public value: T) { super('cached'); } }
function cached<T>(entry: Entry): T {
  const body = JSON.stringify(entry.value);
  if (!body || sha(body) !== entry.valueHash) throw new V2BudgetError('changed', 'The saved model answer needs another check.');
  return structuredClone(entry.value) as T;
}

/** A successful cached answer is free; an uncertain send remains charged and cannot silently resend. */
export async function paidV2Call<T>(
  campaignId: string, callId: string, inputHash: string,
  run: (beforeSend: (hash: string, input: unknown) => Promise<void>) => Promise<{ value: T; costMicroUSD: number }>,
  store: DurableStore = storage(),
  jobId?: string,
): Promise<T> {
  if (!/^[0-9a-f]{64}$/i.test(inputHash) || !callId || callId.length > 300) throw new V2BudgetError('changed', 'The model request needs another check.');
  const key = campaignKey(campaignId), entryKey = sha(callId);
  const current = await store.get<Campaign>(key);
  if (!current) throw new V2BudgetError('capacity', 'No AI allocation was reserved.');
  validCampaign(current.value);
  await allocated(campaignId, store, current.value);
  const prior = current.value.entries[entryKey];
  if (prior) {
    if (prior.inputHash !== inputHash || prior.callId !== callId) throw new V2BudgetError('changed', 'The model input changed.');
    if (prior.status === 'complete') return cached<T>(prior);
    throw new V2BudgetError('uncertain', 'The earlier model send needs checking before retry.');
  }
  await assertV2StoreOpen(store);
  let sent = false;
  const beforeSend = async (hash: string, input: unknown) => {
    if (sent || hash !== inputHash || sha(JSON.stringify(input)) !== inputHash) throw new V2BudgetError('changed', 'The model input changed.');
    await updateV2Record<Campaign>(store, key, () => { throw new V2BudgetError('capacity', 'No AI allocation was reserved.'); }, async campaign => {
      await assertV2StoreOpen(store);
      validCampaign(campaign);
      const existing = campaign.entries[entryKey];
      if (existing) {
        if (existing.inputHash !== inputHash || existing.callId !== callId) throw new V2BudgetError('changed', 'The model input changed.');
        if (existing.status === 'complete') throw new CachedRace<T>(cached<T>(existing));
        throw new V2BudgetError('uncertain', 'The earlier model send needs checking before retry.');
      }
      const job = jobId ? campaign.jobs?.[jobId] : undefined;
      if (jobId && (!job?.active || job.chargedMicroUSD + V2_SEND_RESERVE_MICRO_USD > job.limitMicroUSD)) throw new V2BudgetError('capacity', 'The job allocation is full.');
      if (campaign.halted || (!job && committed(campaign) + V2_SEND_RESERVE_MICRO_USD > campaign.limitMicroUSD)) throw new V2BudgetError('capacity', 'The reserved AI allocation is full.');
      campaign.chargedMicroUSD += V2_SEND_RESERVE_MICRO_USD;
      if (job) job.chargedMicroUSD += V2_SEND_RESERVE_MICRO_USD;
      campaign.entries[entryKey] = { callId, inputHash, status: 'sent', chargedMicroUSD: V2_SEND_RESERVE_MICRO_USD, sentAt: Date.now(), ...(jobId ? { jobId } : {}) };
      return campaign;
    });
    sent = true;
  };
  try {
    const result = await run(beforeSend);
    if (!sent) throw new V2BudgetError('changed', 'The provider skipped its durable send allowance.');
    if (!Number.isSafeInteger(result.costMicroUSD) || result.costMicroUSD < 0) throw new V2BudgetError('changed', 'The model cost needs another check.');
    const body = JSON.stringify(result.value); if (!body || body.length > 120_000) throw new V2BudgetError('changed', 'The model answer needs another check.');
    await updateV2Record<Campaign>(store, key, () => { throw Error('Missing campaign'); }, campaign => {
      validCampaign(campaign);
      const entry = campaign.entries[entryKey];
      if (!entry || entry.status !== 'sent' || entry.inputHash !== inputHash) throw new V2BudgetError('changed', 'The saved model send changed.');
      campaign.chargedMicroUSD += result.costMicroUSD - entry.chargedMicroUSD;
      if (entry.jobId) campaign.jobs![entry.jobId]!.chargedMicroUSD += result.costMicroUSD - entry.chargedMicroUSD;
      entry.chargedMicroUSD = result.costMicroUSD; entry.status = 'complete'; entry.finishedAt = Date.now(); entry.value = result.value; entry.valueHash = sha(body);
      if (result.costMicroUSD > V2_SEND_RESERVE_MICRO_USD || campaign.chargedMicroUSD > campaign.limitMicroUSD) campaign.halted = true;
      return campaign;
    });
    return structuredClone(result.value);
  } catch (error) {
    if (error instanceof CachedRace) return error.value;
    if (sent) await updateV2Record<Campaign>(store, key, () => { throw Error('Missing campaign'); }, campaign => {
      validCampaign(campaign);
      const entry = campaign.entries[entryKey];
      if (entry?.status === 'sent') { entry.status = 'uncertain'; entry.finishedAt = Date.now(); }
      return campaign;
    });
    throw error;
  }
}

export async function inspectV2Campaign(id: string, store: DurableStore = storage()) {
  const c = (await store.get<Campaign>(campaignKey(id)))?.value;
  if (!c) return null;
  validCampaign(c);
  return { id: c.id, limitMicroUSD: c.limitMicroUSD, chargedMicroUSD: c.chargedMicroUSD, halted: c.halted,
    complete: Object.values(c.entries).filter(e => e.status === 'complete').length,
    uncertain: Object.values(c.entries).filter(e => e.status !== 'complete').length, provenance: c.provenance, ...(c.closed ? { closed: c.closed } : {}) };
}

/** Safe operator projection; validates every persisted allocation without exposing answers. */
export async function inspectV2Pool(store: DurableStore = storage()) {
  const p = (await store.get<Pool>(poolKey))?.value;
  if (!p) return null;
  const held = await poolCommitment(p, store), campaigns = [];
  for (const [id, limit] of Object.entries(p.allocations)) {
    const c = (await store.get<Campaign>(campaignKey(id)))?.value;
    if (!c) throw new V2BudgetError('changed', 'A funded campaign ledger is missing.');
    validCampaign(c);
    if (c.id !== id || c.limitMicroUSD !== limit) throw new V2BudgetError('changed', 'The funded campaign limit changed.');
    campaigns.push({ id, limitMicroUSD: limit, chargedMicroUSD: c.chargedMicroUSD, closed: !!c.closed,
      activeJobs: Object.values(c.jobs || {}).filter(j => j.active).length, uncertain: Object.values(c.entries).filter(e => e.status !== 'complete').length,
      releasedMicroUSD: p.releases?.[id]?.unusedMicroUSD || 0 });
  }
  return { providerInitialCeilingMicroUSD: p.providerInitialCeilingMicroUSD, preservedV1AllocationMicroUSD: p.preservedV1AllocationMicroUSD,
    v2PoolCeilingMicroUSD: p.v2PoolCeilingMicroUSD, committedMicroUSD: held, unallocatedMicroUSD: p.v2PoolCeilingMicroUSD - held, campaigns };
}

/** Operator-only, resumable release. Original limit, entries and charges remain immutable. */
export async function closeV2Campaign(id: string, reason: string, store: DurableStore = storage()) {
  await assertV2StoreOpen(store);
  if (!reason.trim() || reason.length > 300) throw new V2BudgetError('changed', 'Record why the campaign is being closed.');
  const found = (await store.get<Campaign>(campaignKey(id)))?.value;
  if (!found) throw new V2BudgetError('changed', 'The campaign ledger is missing.');
  validCampaign(found); await allocated(id, store, found);
  // Closing the campaign is the fence. If a send/reservation wins the race first,
  // this CAS retries and rejects its sent entry or active full-job allowance.
  const closed = await updateV2Record<Campaign>(store, campaignKey(id), () => { throw new V2BudgetError('changed', 'The campaign ledger is missing.'); }, async c => {
    await assertV2StoreOpen(store);
    validCampaign(c);
    if (c.closed) { if (c.closed.reason !== reason) throw new V2BudgetError('changed', 'This closure already has an audit reason.'); return c; }
    if (Object.values(c.entries).some(e => e.status !== 'complete') || Object.values(c.jobs || {}).some(j => j.active) || c.chargedMicroUSD > c.limitMicroUSD) throw new V2BudgetError('uncertain', 'Finish and reconcile all sends and job allowances before closing.');
    c.halted = true;
    c.closed = { at: Date.now(), chargedMicroUSD: c.chargedMicroUSD, entryCount: Object.keys(c.entries).length, snapshotHash: closureHash(c), reason };
    return c;
  });
  // A crash here leaves a closed, fully reserved campaign. Re-entering with the
  // same audit reason finishes this release without reopening or losing spend.
  const release = { ...closed.closed!, unusedMicroUSD: closed.limitMicroUSD - closed.chargedMicroUSD };
  await updateV2Record<Pool>(store, poolKey, () => { throw new V2BudgetError('changed', 'The allocation pool is missing.'); }, async p => {
    await poolCommitment(p, store); p.releases ||= {};
    const existing = p.releases[id];
    if (existing && JSON.stringify(canonical(existing)) !== JSON.stringify(canonical(release))) throw new V2BudgetError('changed', 'The closure release changed.');
    p.releases[id] = release; return p;
  });
  return { campaign: await inspectV2Campaign(id, store), releasedMicroUSD: release.unusedMicroUSD };
}

/** Full worst-send allowance is reserved before issuing a paid public day quote. */
export async function reserveV2JobBudget(campaignId: string, jobId: string, store: DurableStore = storage(), limitMicroUSD = 8 * V2_SEND_RESERVE_MICRO_USD) {
  await assertV2StoreOpen(store);
  if (!jobId || jobId.length > 200 || !money(limitMicroUSD) || limitMicroUSD < V2_SEND_RESERVE_MICRO_USD) throw new V2BudgetError('changed', 'Invalid job allowance.');
  const existing = (await store.get<Campaign>(campaignKey(campaignId)))?.value; if (!existing) throw new V2BudgetError('capacity', 'No AI allocation was reserved.'); validCampaign(existing); await allocated(campaignId, store, existing);
  await updateV2Record<Campaign>(store, campaignKey(campaignId), () => { throw new V2BudgetError('capacity', 'No AI allocation was reserved.'); }, async c => {
    await assertV2StoreOpen(store);
    validCampaign(c); c.jobs ||= {};
    const previous = c.jobs[jobId];
    if (previous) { if (previous.limitMicroUSD !== limitMicroUSD || !previous.active) throw new V2BudgetError('changed', 'This job allowance is already final.'); return c; }
    if (c.halted || committed(c) + limitMicroUSD > c.limitMicroUSD) throw new V2BudgetError('capacity', 'The reserved AI allocation is full.');
    c.jobs[jobId] = { limitMicroUSD, chargedMicroUSD: 0, active: true }; return c;
  });
}
export async function finishV2JobBudget(campaignId: string, jobId: string, store: DurableStore = storage(), allowMissing = false) {
  if (allowMissing && !await store.get<Campaign>(campaignKey(campaignId))) return;
  await updateV2Record<Campaign>(store, campaignKey(campaignId), () => { throw Error('Missing campaign'); }, c => { validCampaign(c); const job = c.jobs?.[jobId]; if (!job) { if (allowMissing) return c; throw new V2BudgetError('changed', 'Missing job allowance.'); } job.active = false; return c; });
}
export async function requireV2JobBudget(campaignId: string, jobId: string, store: DurableStore = storage()) {
  const c = (await store.get<Campaign>(campaignKey(campaignId)))?.value;
  if (!c) throw new V2BudgetError('capacity', 'No AI allocation was reserved.'); validCampaign(c);
  await allocated(campaignId, store, c);
  const job = c.jobs?.[jobId];
  if (!job?.active || job.limitMicroUSD < 8 * V2_SEND_RESERVE_MICRO_USD) throw new V2BudgetError('capacity', 'This day has no full preparation allowance.');
  return structuredClone(job);
}
