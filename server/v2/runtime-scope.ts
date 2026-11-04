import { AsyncLocalStorage } from 'node:async_hooks';
import type { Address } from 'viem';
import original from '../../contracts/v2/deployments/robinhood-testnet.json';
import { isHosted } from '../config';
import { validateV2Identity, V2ContextError, type V2RuntimeIdentity } from './context';
import { v2DecisionConfig } from './preparation';

export interface V2RuntimeScope {
  runtime: V2RuntimeIdentity;
  rpcUrl: string;
  allowLocal: boolean;
  admissionsEnabled: boolean;
  guest?: { id: string; day?: number };
}
const originalCollection = original.runtime.collection.toLowerCase();
const context = new AsyncLocalStorage<V2RuntimeScope>();
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const unavailable = () => new V2ContextError('connection', 'This home is resting. Try again shortly.');
const guest = () => {
  const id = process.env.NEARLYHUMAN_V2_GUEST_ID, day = process.env.NEARLYHUMAN_V2_GUEST_DAY;
  if (!id || !/^[1-9]\d{0,77}$/.test(id)) return;
  if (day !== undefined && (!/^[1-9]\d{0,9}$/.test(day) || Number(day) > 0xffffffff)) throw unavailable();
  return { id, ...(day ? { day: Number(day) } : {}) };
};

/** Only the operator's active identity and the pinned original collection are served. */
export function v2RuntimeScopes(): V2RuntimeScope[] {
  const encoded = process.env.NEARLYHUMAN_V2_RUNTIME_JSON;
  if (!encoded) throw unavailable();
  let runtime: V2RuntimeIdentity;
  try { runtime = JSON.parse(encoded); } catch { throw unavailable(); }
  const allowLocal = !isHosted() && process.env.NEARLYHUMAN_V2_LOCAL === '1';
  validateV2Identity(runtime, allowLocal);
  const rpcUrl = process.env.NEARLYHUMAN_V2_RPC_URL || 'https://rpc.testnet.chain.robinhood.com';
  const active: V2RuntimeScope = { runtime, allowLocal, rpcUrl, admissionsEnabled: !same(runtime.collection, originalCollection), guest: guest() };
  const archive: V2RuntimeScope = { runtime: { ...original.runtime, decisionConfig: v2DecisionConfig(original.runtime.rulesHash as `0x${string}`) } as V2RuntimeIdentity,
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

export function v2RuntimeScope(collection?: string): V2RuntimeScope {
  const scopes = v2RuntimeScopes();
  if (collection === undefined) return scopes[0]!;
  const scope = scopes.find(s => same(s.runtime.collection, collection));
  if (!scope) throw new V2ContextError('context', 'Choose the exact life to visit.');
  return scope;
}
export function currentV2RuntimeScope(): V2RuntimeScope { return context.getStore() || v2RuntimeScope(); }
export function withV2RuntimeScope<T>(scope: V2RuntimeScope, run: () => T): T {
  // Resolve against the whitelist again; a caller cannot smuggle a browser runtime.
  const allowed = v2RuntimeScope(scope.runtime.collection);
  if (JSON.stringify(allowed) !== JSON.stringify(scope)) throw new V2ContextError('context', 'Choose the exact life to visit.');
  return context.run(allowed, run);
}
export function v2RuntimeScopeForJob(id: string): V2RuntimeScope {
  const match = /^v2\/jobs\/(46630|31337)\/(0x[0-9a-f]{40})\/0x[0-9a-f]{64}$/.exec(id);
  if (!match) throw new V2ContextError('context', 'Invalid queued day.');
  const scope = v2RuntimeScope(match[2]);
  if (scope.runtime.chainId !== Number(match[1])) throw new V2ContextError('context', 'Invalid queued day.');
  return scope;
}
export function v2CanonicalLifePath(chainId: number, collection: string, id: string): string {
  return chainId === 46630 ? `/life/robinhood-testnet/${same(collection, originalCollection) ? '' : `${collection.toLowerCase()}/`}${id}`
    : `/?rooster=${id}&chainId=${chainId}&collection=${collection}`;
}
export const ORIGINAL_V2_COLLECTION = original.runtime.collection as Address;
