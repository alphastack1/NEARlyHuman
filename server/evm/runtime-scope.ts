import { AsyncLocalStorage } from 'node:async_hooks';
import type { Address } from 'viem';
import original from '../../contracts/deployments/robinhood-testnet-original.json';
import { evmConfig, isHosted } from '../config';
import { validateEvmIdentity, EvmContextError, type EvmRuntimeIdentity } from './context';
import { decisionConfig } from './preparation';

export interface EvmRuntimeScope {
  runtime: EvmRuntimeIdentity;
  rpcUrl: string;
  allowLocal: boolean;
  admissionsEnabled: boolean;
  guest?: { id: string; day?: number };
}
const originalCollection = original.runtime.collection.toLowerCase();
const context = new AsyncLocalStorage<EvmRuntimeScope>();
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const unavailable = () => new EvmContextError('connection', 'This home is resting. Try again shortly.');
const guest = () => {
  const id = evmConfig().guestId, day = evmConfig().guestDay;
  if (!id || !/^[1-9]\d{0,77}$/.test(id)) return;
  if (day !== undefined && (!/^[1-9]\d{0,9}$/.test(day) || Number(day) > 0xffffffff)) throw unavailable();
  return { id, ...(day ? { day: Number(day) } : {}) };
};

/** Only the operator's active identity and the pinned original collection are served. */
export function evmRuntimeScopes(): EvmRuntimeScope[] {
  const encoded = evmConfig().runtimeJson;
  if (!encoded) throw unavailable();
  let runtime: EvmRuntimeIdentity;
  try { runtime = JSON.parse(encoded); } catch { throw unavailable(); }
  const allowLocal = !isHosted() && evmConfig().local === '1';
  validateEvmIdentity(runtime, allowLocal);
  const rpcUrl = evmConfig().rpcUrl || 'https://rpc.testnet.chain.robinhood.com';
  const active: EvmRuntimeScope = { runtime, allowLocal, rpcUrl, admissionsEnabled: !same(runtime.collection, originalCollection), guest: guest() };
  const archive: EvmRuntimeScope = { runtime: { ...original.runtime, decisionConfig: decisionConfig(original.runtime.rulesHash as `0x${string}`) } as EvmRuntimeIdentity,
    rpcUrl: 'https://rpc.testnet.chain.robinhood.com', allowLocal: false, admissionsEnabled: false, guest: { id: '1', day: 28 } };
  if (same(runtime.collection, originalCollection)) {
    // An env pointing at the original collection must not replace its immutable pins.
    for (const key of ['chainId', 'collection', 'verifier', 'actionModule', 'controllerCodeHash', 'verifierCodeHash', 'actionModuleCodeHash', 'rulesHash', 'relayer', 'quoteSigner'] as const) {
      if (String(runtime[key]).toLowerCase() !== String(archive.runtime[key]).toLowerCase()) throw unavailable();
    }
    return [archive];
  }
  return [active, archive];
}

export function evmRuntimeScope(collection?: string): EvmRuntimeScope {
  const scopes = evmRuntimeScopes();
  if (collection === undefined) return scopes[0]!;
  const scope = scopes.find(s => same(s.runtime.collection, collection));
  if (!scope) throw new EvmContextError('context', 'Choose the exact life to visit.');
  return scope;
}
export function currentEvmRuntimeScope(): EvmRuntimeScope { return context.getStore() || evmRuntimeScope(); }
export function withEvmRuntimeScope<T>(scope: EvmRuntimeScope, run: () => T): T {
  // Resolve against the whitelist again; a caller cannot smuggle a browser runtime.
  const allowed = evmRuntimeScope(scope.runtime.collection);
  if (JSON.stringify(allowed) !== JSON.stringify(scope)) throw new EvmContextError('context', 'Choose the exact life to visit.');
  return context.run(allowed, run);
}
export function evmRuntimeScopeForJob(id: string): EvmRuntimeScope {
  const match = /^v2\/jobs\/(46630|31337)\/(0x[0-9a-f]{40})\/0x[0-9a-f]{64}$/.exec(id);
  if (!match) throw new EvmContextError('context', 'Invalid queued day.');
  const scope = evmRuntimeScope(match[2]);
  if (scope.runtime.chainId !== Number(match[1])) throw new EvmContextError('context', 'Invalid queued day.');
  return scope;
}
export function evmCanonicalLifePath(chainId: number, collection: string, id: string): string {
  return chainId === 46630 ? `/life/robinhood-testnet/${same(collection, originalCollection) ? '' : `${collection.toLowerCase()}/`}${id}`
    : `/?rooster=${id}&chainId=${chainId}&collection=${collection}`;
}
export const ORIGINAL_COLLECTION = original.runtime.collection as Address;
