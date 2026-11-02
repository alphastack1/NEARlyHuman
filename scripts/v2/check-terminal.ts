import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { keccak256, toHex, type Hex, type PublicClient, type PrivateKeyAccount } from 'viem';
import { createState, encodeState } from '../../src/v2';
import { freezeV2Input, type V2RuntimeIdentity } from '../../server/v2/context.ts';
import { v2DecisionConfig } from '../../server/v2/preparation.ts';
import { createV2Campaign, reserveV2JobBudget, requireV2JobBudget } from '../../server/v2/budget.ts';
import { createV2Job, v2JobId, submitPreparedV2Job, v2JobView } from '../../server/v2/jobs.ts';
import type { DurableStore, Stored } from '../../server/storage.ts';
class MemoryStore implements DurableStore {
  data = new Map<string, Stored<any>>(); n = 0;
  async get<T>(k: string) { return structuredClone(this.data.get(k) || null) as Stored<T> | null; }
  async put<T>(k: string, v: T, c: { etag?: string; isNew?: boolean } = {}) { const o = this.data.get(k); if (c.isNew && o || c.etag && o?.etag !== c.etag) return false; this.data.set(k, { value: structuredClone(v), etag: String(++this.n) }); return true; }
  async list(p: string) { return [...this.data.keys()].filter(k => k.startsWith(p)); }
  async delete(k: string) { this.data.delete(k); }
}
const hash = (s: string) => keccak256(toHex(s)), address = `0x${'12'.repeat(20)}` as const, code = '0x6001' as Hex;
mkdirSync(new URL('../../TEMP/v2-checks/',import.meta.url),{recursive:true});
const report: { name: string; result: string; error?: string }[] = [];
for (const status of [3, 4]) {
  const name = `prepared packet adopts canonical ${status === 3 ? 'failure' : 'owner expiry'} without fresh relay`;
  try {
    const store = new MemoryStore(), state = createState({ seed: 21 }); state.day = 1; state.level = 1;
    const base = encodeState(state), at = BigInt(Math.floor(Date.now() / 1000));
    const runtime: V2RuntimeIdentity = { chainId: 31337, collection: address, verifier: address, actionModule: address, controllerCodeHash: keccak256(code), verifierCodeHash: keccak256(code), actionModuleCodeHash: keccak256(code), rulesHash: hash('rules'), decisionConfig: hash('placeholder'), relayer: address, quoteSigner: address };
    runtime.decisionConfig = v2DecisionConfig(runtime.rulesHash);
    const request = { requestId: hash(`accepted-${status}`), tokenId: 1n, player: address, baseRevision: 1, day: 2, kitMask: 0n, shipping: false, acceptedAt: at, deadline: at + 900n, daySeed: hash('seed'), decisionConfig: runtime.decisionConfig, baseHash: keccak256(base), pressure: 0n, reservedReward: 0n, status: 1 };
    const input = freezeV2Input(runtime, request, base, 1n, hash('block'), true), id = v2JobId(input);
    await createV2Campaign('terminal-test', 100000, store); await reserveV2JobBudget('terminal-test', id, store);
    await createV2Job(input, 'terminal-test', { store, allowLocal: true });
    Object.assign(store.data.get(id)!.value, { phase: 'prepared', packetKey: 'packet-deliberately-not-loaded', commitment: hash('packet'), stateHash: hash('state') });
    let estimates = 0, sends = 0;
    const client = {
      getChainId: async () => 31337,
      getBlock: async () => ({ number: 1n, hash: hash('block'), timestamp: at }),
      getCode: async () => code,
      readContract: async ({ functionName }: { functionName: string }) => {
        if (['actionModule', 'verifier', 'relayer', 'quoteSigner'].includes(functionName)) return address;
        if (functionName === 'rulesHash') return runtime.rulesHash;
        if (functionName === 'request') return { ...request, status };
        throw Error(`Unexpected read ${functionName}`);
      },
      estimateGas: async () => { estimates++; throw Error('Fresh finalize forbidden'); },
      sendRawTransaction: async () => { sends++; throw Error('Fresh relay forbidden'); },
    } as unknown as PublicClient;
    const result = await submitPreparedV2Job(id, client, { address } as PrivateKeyAccount, { store, allowLocal: true });
    assert.equal(result.phase, status === 3 ? 'failed' : 'expired'); assert.equal(v2JobView(result).retrySafe, true);
    assert.equal(estimates, 0); assert.equal(sends, 0); await assert.rejects(requireV2JobBudget('terminal-test', id, store));
    report.push({ name, result: 'pass' });
  } catch (e) { report.push({ name, result: 'fail', error: String(e) }); }
}
writeFileSync(new URL('../../TEMP/v2-checks/terminal-check.json',import.meta.url), JSON.stringify({ scope: 'Independent mocked canonical RPC with actual runtime pins, frozen job and funded budget helpers. No actual transaction, network, provider, key or credits.', report }, null, 2) + '\n');
console.log(JSON.stringify({ tests: report.length, failures: report.filter(x => x.result === 'fail') }));
if (report.some(x => x.result === 'fail')) throw Error('Terminal checks failed');
