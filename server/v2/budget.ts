import { createHash } from 'node:crypto';
import { storage, StoreConflict, type DurableStore } from '../storage';
import { serverConfig } from '../config';

const poolKey = 'v2/control/ai-pool';
const campaignKey = (id: string) => `v2/ai-campaigns/${id}`;
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
export const V2_SEND_RESERVE_MICRO_USD = 5_000;
export class V2BudgetError extends Error {
  constructor(public code: 'capacity' | 'uncertain' | 'changed' | 'overrun', message: string) { super(message); }
}
interface Pool {
  version: 2;
  providerInitialCeilingMicroUSD: number;
  preservedV1AllocationMicroUSD: number;
  v2PoolCeilingMicroUSD: number;
  allocations: Record<string, number>;
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
}
const money = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
function validCampaign(c: Campaign): void {
  if (c.version !== 2 || !/^[a-z0-9][a-z0-9-]{1,79}$/.test(c.id) || !money(c.limitMicroUSD) || c.limitMicroUSD > 100_000 || !money(c.chargedMicroUSD) || typeof c.halted !== 'boolean'
    || !c.entries || typeof c.entries !== 'object' || Array.isArray(c.entries)) throw new V2BudgetError('changed', 'The AI accounting needs another check.');
  const entries = Object.values(c.entries);
  if (entries.some(e => !money(e.chargedMicroUSD) || !['sent', 'complete', 'uncertain'].includes(e.status))
    || entries.reduce((sum, e) => sum + e.chargedMicroUSD, 0) !== c.chargedMicroUSD) throw new V2BudgetError('changed', 'The AI accounting needs another check.');
  if (c.jobs !== undefined && (!c.jobs || typeof c.jobs !== 'object' || Array.isArray(c.jobs))) throw new V2BudgetError('changed', 'The job allocation needs another check.');
  for (const [id, job] of Object.entries(c.jobs || {})) if (!money(job.limitMicroUSD) || !money(job.chargedMicroUSD) || typeof job.active !== 'boolean'
    || entries.filter(e => e.jobId === id).reduce((sum, e) => sum + e.chargedMicroUSD, 0) !== job.chargedMicroUSD) throw new V2BudgetError('changed', 'The job allocation needs another check.');
}
const committed = (c: Campaign) => c.chargedMicroUSD + Object.values(c.jobs || {}).filter(j => j.active).reduce((sum, j) => sum + Math.max(0, j.limitMicroUSD - j.chargedMicroUSD), 0);
async function allocated(id: string, store: DurableStore, campaign: Campaign): Promise<void> {
  const p = (await store.get<Pool>(poolKey))?.value;
  if (!p || p.version !== 2 || p.preservedV1AllocationMicroUSD !== 900_000 || p.v2PoolCeilingMicroUSD !== 100_000 || p.providerInitialCeilingMicroUSD !== 1_000_000
    || !p.allocations || typeof p.allocations !== 'object' || Array.isArray(p.allocations) || Object.values(p.allocations).some(n => !money(n))
    || Object.values(p.allocations).reduce((a, b) => a + b, 0) > 100_000 || campaign.id !== id || p.allocations[id] !== campaign.limitMicroUSD) throw new V2BudgetError('changed', 'The funded campaign allocation changed.');
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
  if (serverConfig().fundedMicroUSD > 900_000) throw new V2BudgetError('changed', 'The V1 allocation must be reconciled before funding V2.');
  if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(id) || !Number.isSafeInteger(limitMicroUSD) || limitMicroUSD < V2_SEND_RESERVE_MICRO_USD || limitMicroUSD > 100_000) throw new V2BudgetError('capacity', 'Choose a bounded AI allocation.');
  const previousPool = (await store.get<Pool>(poolKey))?.value;
  if (!previousPool && (await store.list('v2/ai-campaigns/')).length) throw new V2BudgetError('changed', 'The existing AI pool ledger must be recovered, not reset.');
  if (previousPool?.allocations?.[id] !== undefined && !await store.get<Campaign>(campaignKey(id))) throw new V2BudgetError('changed', 'The existing campaign ledger must be recovered, not reset.');
  await updateV2Record<Pool>(store, poolKey, () => ({ version: 2, providerInitialCeilingMicroUSD: 1_000_000, preservedV1AllocationMicroUSD: 900_000, v2PoolCeilingMicroUSD: 100_000, allocations: {} }), pool => {
    if (pool.version !== 2 || pool.providerInitialCeilingMicroUSD !== 1_000_000 || pool.preservedV1AllocationMicroUSD !== 900_000 || pool.v2PoolCeilingMicroUSD !== 100_000
      || !pool.allocations || typeof pool.allocations !== 'object' || Array.isArray(pool.allocations) || Object.values(pool.allocations).some(n => !money(n)) || Object.values(pool.allocations).reduce((a, b) => a + b, 0) > 100_000) throw new V2BudgetError('changed', 'The AI allocation needs another check.');
    if (pool.allocations[id] !== undefined && pool.allocations[id] !== limitMicroUSD) throw new V2BudgetError('changed', 'This allocation already has a fixed limit.');
    if (pool.allocations[id] === undefined) {
      if (Object.values(pool.allocations).reduce((a, b) => a + b, 0) + limitMicroUSD > pool.v2PoolCeilingMicroUSD) throw new V2BudgetError('capacity', 'The reserved AI allocation is full.');
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
  let sent = false;
  const beforeSend = async (hash: string, input: unknown) => {
    if (sent || hash !== inputHash || sha(JSON.stringify(input)) !== inputHash) throw new V2BudgetError('changed', 'The model input changed.');
    await updateV2Record<Campaign>(store, key, () => { throw new V2BudgetError('capacity', 'No AI allocation was reserved.'); }, campaign => {
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
    uncertain: Object.values(c.entries).filter(e => e.status !== 'complete').length, provenance: c.provenance };
}

/** Full worst-send allowance is reserved before issuing a paid public day quote. */
export async function reserveV2JobBudget(campaignId: string, jobId: string, store: DurableStore = storage(), limitMicroUSD = 8 * V2_SEND_RESERVE_MICRO_USD) {
  if (!jobId || jobId.length > 200 || !money(limitMicroUSD) || limitMicroUSD < V2_SEND_RESERVE_MICRO_USD) throw new V2BudgetError('changed', 'Invalid job allowance.');
  const existing = (await store.get<Campaign>(campaignKey(campaignId)))?.value; if (!existing) throw new V2BudgetError('capacity', 'No AI allocation was reserved.'); validCampaign(existing); await allocated(campaignId, store, existing);
  await updateV2Record<Campaign>(store, campaignKey(campaignId), () => { throw new V2BudgetError('capacity', 'No AI allocation was reserved.'); }, c => {
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
