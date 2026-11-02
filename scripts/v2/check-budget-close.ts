import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { closeV2Campaign, createV2Campaign, finishV2JobBudget, inspectV2Campaign, paidV2Call, reserveV2JobBudget } from '../../server/v2/budget';
import type { DurableStore, Stored } from '../../server/storage';

class MemoryStore implements DurableStore {
  records = new Map<string, Stored<any>>(); serial = 0; failRelease = false;
  async get<T>(key: string) { return structuredClone(this.records.get(key) || null) as Stored<T> | null; }
  async put<T>(key: string, value: T, condition: { etag?: string; isNew?: boolean } = {}) {
    if (this.failRelease && key === 'v2/control/ai-pool' && (value as any).releases) { this.failRelease = false; throw Error('controlled crash before pool release'); }
    const old = this.records.get(key);
    if (condition.isNew && old || condition.etag && old?.etag !== condition.etag) return false;
    this.records.set(key, { value: structuredClone(value), etag: String(++this.serial) }); return true;
  }
  async list(prefix: string) { return [...this.records.keys()].filter(k => k.startsWith(prefix)); }
  async delete(key: string) { this.records.delete(key); }
}
const body = { questions: 'scripted only, no HTTP' }, hash = createHash('sha256').update(JSON.stringify(body)).digest('hex');
const run = (cost: number) => async (before: (hash: string, value: unknown) => Promise<void>) => { await before(hash, body); return { value: { choice: 'one' }, costMicroUSD: cost }; };
const report: { name: string; result: string }[] = [];
async function test(name: string, fn: () => Promise<void>) { await fn(); report.push({ name, result: 'pass' }); }
await test('closed research preserves original limits and spend, and releases only unused funds', async () => {
  const s = new MemoryStore(); await createV2Campaign('research', 30000, s);
  await paidV2Call('research', 'one', hash, run(5413), s);
  const result = await closeV2Campaign('research', 'research finished', s);
  assert.equal(result.releasedMicroUSD, 24587); assert.equal(result.campaign!.limitMicroUSD, 30000); assert.equal(result.campaign!.chargedMicroUSD, 5413);
  await createV2Campaign('public', 94587, s); await assert.rejects(createV2Campaign('overflow', 5000, s));
  const pool = s.records.get('v2/control/ai-pool')!.value;
  assert.equal(pool.allocations.research, 30000); assert.equal(pool.preservedV1AllocationMicroUSD, 900000);
  assert.equal(pool.releases.research.snapshotHash, result.campaign!.closed!.snapshotHash);
});
await test('cached answers remain free after closure while new sends and jobs stay closed', async () => {
  const s = new MemoryStore(); await createV2Campaign('research', 50000, s); await paidV2Call('research', 'one', hash, run(100), s);
  await closeV2Campaign('research', 'finished', s); let calls = 0;
  const provider = async (before: any) => { await before(hash, body); calls++; return { value: {}, costMicroUSD: 1 }; };
  assert.deepEqual(await paidV2Call('research', 'one', hash, provider, s), { choice: 'one' });
  await assert.rejects(paidV2Call('research', 'two', hash, provider, s)); await assert.rejects(reserveV2JobBudget('research', 'job', s)); assert.equal(calls, 0);
  await assert.rejects(closeV2Campaign('research', 'different reason', s));
});
await test('sent or uncertain entries and active whole-job holds cannot be released', async () => {
  const s = new MemoryStore(); await createV2Campaign('research', 50000, s);
  await reserveV2JobBudget('research', 'job', s); await assert.rejects(closeV2Campaign('research', 'finished', s)); await finishV2JobBudget('research', 'job', s);
  let sent!: () => void, finish!: () => void;
  const entered = new Promise<void>(r => { sent = r; }), gate = new Promise<void>(r => { finish = r; });
  const pending = paidV2Call('research', 'one', hash, async before => { await before(hash, body); sent(); await gate; throw Error('lost response'); }, s);
  await entered; await assert.rejects(closeV2Campaign('research', 'finished', s)); finish(); await assert.rejects(pending);
  await assert.rejects(closeV2Campaign('research', 'finished', s)); assert.equal((await inspectV2Campaign('research', s))!.chargedMicroUSD, 5000);
});
await test('closure wins against a provider paused before its mandatory send fence', async () => {
  const s = new MemoryStore(); await createV2Campaign('research', 30000, s); let entered!: () => void, finish!: () => void, sends = 0;
  const ready = new Promise<void>(r => { entered = r; }), gate = new Promise<void>(r => { finish = r; });
  const pending = paidV2Call('research', 'one', hash, async before => { entered(); await gate; await before(hash, body); sends++; return { value: {}, costMicroUSD: 1 }; }, s);
  await ready; await closeV2Campaign('research', 'finished', s); finish(); await assert.rejects(pending);
  assert.equal(sends, 0); assert.equal((await inspectV2Campaign('research', s))!.chargedMicroUSD, 0);
});
await test('crash after campaign fence resumes pool release without reopening or resetting', async () => {
  const s = new MemoryStore(); await createV2Campaign('research', 30000, s); s.failRelease = true;
  await assert.rejects(closeV2Campaign('research', 'finished', s)); assert((await inspectV2Campaign('research', s))!.closed);
  await assert.rejects(createV2Campaign('too-early', 100000, s));
  const a = await closeV2Campaign('research', 'finished', s), b = await closeV2Campaign('research', 'finished', s);
  assert.deepEqual(a, b); await createV2Campaign('public', 100000, s);
});
await test('a modified release or closed ledger blocks funding instead of granting capacity', async () => {
  const s = new MemoryStore(); await createV2Campaign('research', 30000, s); await closeV2Campaign('research', 'finished', s);
  s.records.get('v2/control/ai-pool')!.value.releases.research.unusedMicroUSD++;
  await assert.rejects(createV2Campaign('public', 5000, s));
  s.records.get('v2/control/ai-pool')!.value.releases.research.unusedMicroUSD--;
  s.records.get('v2/ai-campaigns/research')!.value.entries.invented = { chargedMicroUSD: 1, status: 'complete' };
  await assert.rejects(createV2Campaign('public', 5000, s));
});
mkdirSync(new URL('../../TEMP/v2-checks/', import.meta.url), { recursive: true });
writeFileSync(new URL('../../TEMP/v2-checks/budget-close-check.json', import.meta.url), JSON.stringify({ scope: 'Controlled durable-store races and crashes; zero inference, credentials, ledger changes or chain transactions.', report }, null, 2));
console.log(JSON.stringify({ tests: report.length, failures: [] }));
