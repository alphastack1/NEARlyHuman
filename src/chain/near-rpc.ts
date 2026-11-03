/** Native NEAR reads stay separate from the EVM transport. No private key or
 * signed transaction is accepted by this browser RPC helper. */
export class NearWalletError extends Error {
  constructor(public code: string, message: string, options?: ErrorOptions) { super(message, options); this.name = 'NearWalletError'; }
}

export const nearAccountId = (value: unknown): value is string => typeof value === 'string' && value.length >= 2 && value.length <= 64
  && /^[a-z0-9]+(?:[-_][a-z0-9]+)*(?:\.[a-z0-9]+(?:[-_][a-z0-9]+)*)*$/.test(value);
export const nearHash = (value: unknown): value is string => typeof value === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
export const nearHex32 = (value: unknown): value is `0x${string}` => typeof value === 'string' && /^0x[0-9a-f]{64}$/.test(value);

export function nearBase64(bytes: Uint8Array): string { let text = ''; for (const b of bytes) text += String.fromCharCode(b); return btoa(text); }
export function nearUnbase64(value: string, length?: number): Uint8Array {
  if (typeof value !== 'string' || value.length > 300_000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw new NearWalletError('connection', 'Checking the wallet response.');
  let bytes: Uint8Array; try { bytes = Uint8Array.from(atob(value), c => c.charCodeAt(0)); } catch { throw new NearWalletError('connection', 'Checking the wallet response.'); }
  if (length !== undefined && bytes.length !== length || nearBase64(bytes) !== value) throw new NearWalletError('connection', 'Checking the wallet response.');
  return bytes;
}

export interface NearRpcConfig { networkId: 'near-testnet'; network: 'testnet'; collection: string; rpcUrl: string }
export interface NearViewResult<T> { value: T; blockHeight: string; blockHash: string }
export function assertNearRpcConfig(config: NearRpcConfig): void {
  let url: URL; try { url = new URL(config.rpcUrl); } catch { throw new NearWalletError('network', 'Choose NEAR Testnet.'); }
  if (config.networkId !== 'near-testnet' || config.network !== 'testnet' || !nearAccountId(config.collection) || url.protocol !== 'https:' || url.username || url.password)
    throw new NearWalletError('network', 'Choose NEAR Testnet.');
}

export async function nearRead<T>(config: NearRpcConfig, method: 'query' | 'status' | 'tx' | 'block' | 'gas_price' | 'EXPERIMENTAL_protocol_config', params: unknown): Promise<T> {
  assertNearRpcConfig(config);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(config.rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: crypto.randomUUID(), method, params }), signal: AbortSignal.timeout(15_000) });
      if (!response.ok) {
        if (attempt === 0 && (response.status === 429 || response.status >= 500)) continue;
        throw new NearWalletError('connection', 'Checking the NEAR connection. Try again.');
      }
      const result = await response.json() as { result?: T; error?: { cause?: { name?: string }; data?: { name?: string }; name?: string } };
      if (result.error) {
        const code = result.error.cause?.name || result.error.data?.name || result.error.name;
        if (code === 'UNKNOWN_TRANSACTION' || code === 'TIMEOUT_ERROR' || code === 'REQUEST_ROUTED') throw new NearWalletError('uncertain', 'Still checking your original transaction.');
        if (code === 'UNKNOWN_ACCOUNT' || code === 'UNKNOWN_ACCESS_KEY') throw new NearWalletError('wallet', 'Choose a funded NEAR Testnet account.');
        throw new NearWalletError('connection', 'Checking this NEAR home. Try again.');
      }
      if (result.result === undefined) throw new NearWalletError('connection', 'Checking the NEAR response. Try again.');
      return result.result;
    } catch (error) {
      if (error instanceof NearWalletError) throw error;
      if (attempt === 1) throw new NearWalletError('connection', 'Checking the NEAR connection. Try again.', { cause: error });
    }
  }
  throw new NearWalletError('connection', 'Checking the NEAR connection. Try again.');
}

export async function nearView<T>(config: NearRpcConfig, method: string, args: Record<string, unknown>, blockHash?: string): Promise<NearViewResult<T>> {
  const result = await nearRead<{ result: number[]; block_height: number; block_hash: string }>(config, 'query', {
    request_type: 'call_function', account_id: config.collection, method_name: method, args_base64: nearBase64(new TextEncoder().encode(JSON.stringify(args))),
    ...(blockHash ? { block_id: blockHash } : { finality: 'final' }),
  });
  if (!Array.isArray(result.result) || result.result.length > 200_000 || result.result.some(v => !Number.isInteger(v) || v < 0 || v > 255)
    || !Number.isSafeInteger(result.block_height) || !nearHash(result.block_hash) || blockHash !== undefined && result.block_hash !== blockHash) throw new NearWalletError('connection', 'Checking this NEAR home.');
  let value: T; try { value = JSON.parse(new TextDecoder().decode(new Uint8Array(result.result))) as T; } catch { throw new NearWalletError('connection', 'Checking this NEAR home.'); }
  return { value, blockHeight: String(result.block_height), blockHash: result.block_hash };
}

export async function nearAccount(config: NearRpcConfig, accountId: string, blockHash?: string) {
  if (!nearAccountId(accountId)) throw new NearWalletError('wallet', 'Choose your NEAR wallet.');
  return nearRead<{ amount: string; locked: string; storage_usage: number; code_hash: string; block_hash: string; block_height: number }>(config, 'query', {
    request_type: 'view_account', account_id: accountId, ...(blockHash ? { block_id: blockHash } : { finality: 'final' }),
  });
}

export interface NearExecution {
  final_execution_status?: string;
  status: { SuccessValue?: string; Failure?: unknown } | string;
  transaction: { hash: string; signer_id: string; receiver_id: string; actions: Array<{ FunctionCall?: { method_name: string; args: string; gas: string | number; deposit: string } }> };
  transaction_outcome?: { block_hash?: string; outcome?: { status?: { Failure?: unknown } } };
  receipts_outcome?: Array<{ outcome?: { executor_id?: string; status?: { Failure?: unknown } } }>;
}

export async function waitNearTransaction(config: NearRpcConfig, hash: string, accountId: string): Promise<NearExecution> {
  if (!nearHash(hash) || !nearAccountId(accountId)) throw new NearWalletError('uncertain', 'Check the original NEAR transaction.');
  const end = Date.now() + 120_000;
  while (Date.now() < end) {
    try {
      const result = await nearRead<NearExecution>(config, 'tx', { tx_hash: hash, sender_account_id: accountId, wait_until: 'FINAL' });
      if (result.transaction?.hash !== hash || result.transaction.signer_id !== accountId || result.final_execution_status !== 'FINAL') throw new NearWalletError('uncertain', 'Still checking your original transaction.');
      // Return both successful and failed final executions. The owner adapter
      // first matches the exact call, then checks the game's immutable outcome;
      // an unrelated failure must never clear another pending payment.
      if (typeof result.status !== 'object' || result.status.SuccessValue === undefined && result.status.Failure === undefined) throw new NearWalletError('uncertain', 'Still checking your original transaction.');
      return result;
    } catch (error) {
      if (!(error instanceof NearWalletError) || !['uncertain', 'connection'].includes(error.code)) throw error;
      if (Date.now() >= end) break;
      await new Promise(resolve => setTimeout(resolve, 1800));
    }
  }
  throw new NearWalletError('uncertain', 'Your transaction is still being checked. Check it again shortly.');
}
