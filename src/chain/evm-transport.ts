import { http } from 'viem';

interface RpcArguments { method: string; params?: unknown }
const delays = [150, 350, 700, 1200] as const;

/** A fresh RH header can briefly precede its state on another RPC backend. */
export class StateLagError extends Error {
  readonly code = 'V2_STATE_LAG';
  constructor(cause: unknown) { super('Checking the latest saved home. Try again shortly.', { cause }); this.name = 'V2StateLagError'; }
}
export function isStateLagError(error: unknown): boolean {
  let current = error as { code?: unknown; cause?: unknown } | undefined;
  for (let i = 0; current && i < 8; i++, current = current.cause as typeof current) if (current instanceof StateLagError || current.code === 'V2_STATE_LAG') return true;
  return false;
}

/** Viem wraps transport failures inside contract-call errors. Inspect the cause
 * chain, but never turn a decoded contract revert into a transport retry. */
export function isTransientReadError(error: unknown): boolean {
  if (isStateLagError(error)) return true;
  let current = error as { name?: string; code?: unknown; status?: unknown; cause?: unknown } | undefined;
  let transient = false;
  for (let i = 0; current && i < 12; i++, current = current.cause as typeof current) {
    if (['ContractFunctionRevertedError', 'ExecutionRevertedError'].includes(current.name || '')) return false;
    if (current.name === 'HttpRequestError') {
      const status = current.status;
      if (typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 429) return false;
      transient = true;
    }
    if (['TimeoutError', 'SocketClosedError', 'SocketRequestError'].includes(current.name || '')
      || ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET'].includes(String(current.code || ''))) transient = true;
  }
  return transient;
}
function pinnedBlock(request: RpcArguments): bigint | undefined {
  if (!Array.isArray(request.params)) return;
  const index = ['eth_call', 'eth_getCode', 'eth_getBalance', 'eth_getTransactionCount'].includes(request.method) ? 1
    : request.method === 'eth_getStorageAt' || request.method === 'eth_getProof' ? 2 : -1;
  const block = request.params[index];
  if (typeof block === 'string' && /^0x[0-9a-f]+$/i.test(block)) return BigInt(block);
}
export function isUnsupportedPinnedBlock(error: unknown, request: RpcArguments): boolean {
  const wanted = pinnedBlock(request); if (wanted === undefined) return false;
  let current = error as { code?: unknown; message?: unknown; details?: unknown; cause?: unknown } | undefined;
  for (let i = 0; current && i < 8; i++, current = current.cause as typeof current) {
    if (current.code !== -32000) continue;
    for (const value of [current.details, current.message]) {
      if (typeof value !== 'string') continue;
      const match = /^unsupported block number\s+(0x[0-9a-f]+|[0-9]+)\.?$/i.exec(value.trim());
      if (match && BigInt(match[1]!) === wanted) return true;
    }
  }
  return false;
}

/** Retry only this observed state-lag error, with exactly the same pinned arguments.
 * No latest fallback, block substitution, logical-revert retry or extra write retry.
 */
export function evmHttpTransport(url: string, config: Parameters<typeof http>[1] = {}): ReturnType<typeof http> {
  const transport = http(url, config);
  return options => {
    const inner = transport(options);
    const request = async (raw: RpcArguments, requestOptions?: unknown) => {
      const frozen = structuredClone(raw), deadline = Date.now() + 3000;
      for (let attempt = 0;; attempt++) {
        try { return await (inner.request as (args: RpcArguments, options?: unknown) => Promise<unknown>)(structuredClone(frozen), requestOptions); }
        catch (error) {
          if (!isUnsupportedPinnedBlock(error, frozen)) throw error;
          const delay = delays[attempt];
          if (delay === undefined || Date.now() + delay > deadline) throw new StateLagError(error);
          if ((requestOptions as { signal?: AbortSignal } | undefined)?.signal?.aborted) throw error;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };
    return { ...inner, request: request as typeof inner.request };
  };
}
