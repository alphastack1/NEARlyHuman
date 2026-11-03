import type { NearWalletBase } from '@hot-labs/near-connect';
import { keccak256, toHex } from 'viem';
import type { NearOwnerQuote, NearPublicConfig, NearSignChallenge } from './game-types';
import { assertNearSigner, connectNearProvider, explicitlyRejectedNear, signNearLogin } from './near-connector';
import { nearAdmissionMessage } from './near-admission';
import { assertNearRpcConfig, nearAccount, nearAccountId, nearHash, nearHex32, nearRead, nearUnbase64, nearView, waitNearTransaction, NearWalletError, type NearExecution } from './near-rpc';

export type NearMethod = 'mint_nft' | 'accept_day' | 'withdraw' | 'birth_from_purse' | 'birth_from_wallet' | 'expire';
const methods = new Set<NearMethod>(['mint_nft', 'accept_day', 'withdraw', 'birth_from_purse', 'birth_from_wallet', 'expire']);
const births = new Set<NearMethod>(['mint_nft', 'birth_from_purse', 'birth_from_wallet']);
const uint = (value: unknown): value is string => typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value) && value.length <= 78;
const token = (value: unknown): value is string => uint(value) && BigInt(value) > 0n;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface NearSubmissionIntent {
  kind: 'near'; networkId: 'near-testnet'; collection: string; account: string;
  operationId: `0x${string}`; method: NearMethod; args: Record<string, unknown>;
  deposit: string; gas: string; createdAt: number;
}
export interface NearOwnerReceipt {
  kind: 'near'; transactionHash?: string; tokenId?: string; requestId?: `0x${string}`;
  operationId: `0x${string}`; method: NearMethod; outcome?: NearExecution;
}
interface NearOperation { method: string; token_id: string; request_id?: string | null; status: string; amount?: string; fingerprint: string }
interface NearRequest { request_id: string; token_id: string; player: string; status: number; base_revision: number; kit_mask: string; shipping: boolean; decision_config: string; processing_fee: string; multiplier: number; reserved_reward: string }

export function isNearIntent(value: unknown): value is NearSubmissionIntent { return !!value && typeof value === 'object' && (value as { kind?: unknown }).kind === 'near'; }

export function assertNearWalletConfig(config: NearPublicConfig): void {
  assertNearRpcConfig(config);
  if (!nearHash(config.codeHash) || !nearHex32(config.rulesHash) || !nearHex32(config.decisionConfig) || !nearAccountId(config.relayer)
    || !uint(config.nativeMintPrice) || !uint(config.storageDeposit) || !uint(config.maxProcessingFee) || BigInt(config.maxProcessingFee) > 10n ** 24n
    || !Number.isInteger(config.multiplier) || config.multiplier < 1 || config.multiplier > 20 || config.token !== config.collection || config.tokenDecimals !== 6)
    throw new NearWalletError('network', 'The NEAR home connection needs another check.');
  nearUnbase64(config.quoteSigner, 32);
}

export async function verifyNearWorld(config: NearPublicConfig) {
  assertNearWalletConfig(config);
  const [network, account] = await Promise.all([nearRead<{ chain_id: string }>(config, 'status', {}), nearAccount(config, config.collection)]);
  if (network.chain_id !== 'testnet' || account.code_hash !== config.codeHash || !nearHash(account.block_hash)) throw new NearWalletError('connection', 'The NEAR home connection needs another check.');
  const deployed = await nearView<Record<string, unknown>>(config, 'config', {}, account.block_hash);
  const value = deployed.value;
  if (value.network_id !== 'near-testnet' || value.contract_id !== config.collection || value.rules_hash !== config.rulesHash || value.decision_config !== config.decisionConfig
    || value.relayer_id !== config.relayer || value.quote_public_key !== config.quoteSigner || value.token_mint_price_micro !== config.tokenMintPriceMicro)
    throw new NearWalletError('connection', 'The NEAR home connection needs another check.');
  if (value.native_mint_price !== config.nativeMintPrice || value.storage_deposit !== config.storageDeposit || value.multiplier !== config.multiplier)
    throw new NearWalletError('price', 'The price changed. Check it again.');
  return { blockHash: account.block_hash, blockHeight: String(account.block_height) };
}

async function nearAvailableBalance(config: NearPublicConfig, accountId: string): Promise<bigint> {
  const [account, protocol] = await Promise.all([nearAccount(config, accountId), nearRead<{ runtime_config: { storage_amount_per_byte: string } }>(config, 'EXPERIMENTAL_protocol_config', { finality: 'final' })]);
  if (!uint(account.amount) || !Number.isSafeInteger(account.storage_usage) || account.storage_usage < 0 || !uint(protocol.runtime_config?.storage_amount_per_byte)) throw new NearWalletError('connection', 'Checking your NEAR balance.');
  const balance = BigInt(account.amount) - BigInt(account.storage_usage) * BigInt(protocol.runtime_config.storage_amount_per_byte);
  return balance > 0n ? balance : 0n;
}

function assertIntent(config: NearPublicConfig, intent: NearSubmissionIntent): void {
  if (!isNearIntent(intent) || intent.networkId !== 'near-testnet' || intent.collection !== config.collection || !nearAccountId(intent.account) || !nearHex32(intent.operationId)
    || !methods.has(intent.method) || !uint(intent.deposit) || !uint(intent.gas) || BigInt(intent.gas) > 300_000_000_000_000n || !Number.isSafeInteger(intent.createdAt)
    || !intent.args || Array.isArray(intent.args) || typeof intent.args !== 'object' || JSON.stringify(intent.args).length > 16_000)
    throw new NearWalletError('context', 'Choose the original NEAR transaction.');
  if (intent.method !== 'accept_day' && intent.method !== 'expire' && (intent.args.expected_owner !== intent.account || intent.args.operation_id !== intent.operationId))
    throw new NearWalletError('context', 'Choose the original NEAR account and transaction.');
}

/** Mirrors the contract's small immutable operation identity, not the reducer. */
export function nearOperationFingerprint(intent: NearSubmissionIntent): `0x${string}` {
  const a = intent.args;
  const fields = intent.method === 'withdraw' ? [a.expected_owner, a.token_id, a.amount]
    : intent.method === 'birth_from_purse' ? [a.expected_owner, a.source_token_id, a.expected_nonce, a.name, a.stats]
      : [a.expected_owner, a.name, a.stats];
  return keccak256(toHex(`${intent.method}\n${JSON.stringify(fields)}`));
}

async function operationOutcome(config: NearPublicConfig, intent: NearSubmissionIntent, blockHash?: string): Promise<NearOwnerReceipt | undefined> {
  assertIntent(config, intent);
  if (intent.method === 'accept_day' || intent.method === 'expire') {
    const requestId = intent.method === 'accept_day' ? (intent.args.admission as { id?: unknown })?.id : intent.args.request_id;
    if (!nearHex32(requestId)) throw new NearWalletError('context', 'Choose the original day.');
    const { value: request } = await nearView<NearRequest | null>(config, 'request', { request_id: requestId }, blockHash);
    if (!request) return;
    if (request.request_id !== requestId || !token(request.token_id) || request.status < 1 || request.status > 4) throw new NearWalletError('context', 'Choose the original day.');
    if (intent.method === 'accept_day') {
      const a = intent.args.admission as Record<string, unknown>;
      const matches = request.player === intent.account && request.token_id === a.tokenId && request.base_revision === a.baseRevision && request.kit_mask === a.kitMask
        && request.decision_config === a.decisionConfig && request.processing_fee === a.processingFee && request.multiplier === a.multiplier
        && uint(request.reserved_reward) && request.shipping === (a.shipping === true && BigInt(request.reserved_reward) > 0n);
      if (!matches) {
        const replaced = new NearWalletError('replaced', 'This request was already used. Your home has been refreshed.');
        if (request.player === intent.account) Object.assign(replaced, { replacementTokenId: request.token_id });
        throw replaced;
      }
    } else if (request.player !== intent.account) throw new NearWalletError('context', 'Choose the original day.');
    if (intent.method === 'expire' && request.status !== 4 || intent.method === 'accept_day' && (request.status < 1 || request.status > 4)) return;
    return { kind: 'near', requestId, tokenId: request.token_id, operationId: intent.operationId, method: intent.method };
  }
  const { value: result } = await nearView<NearOperation | null>(config, 'get_operation', { account_id: intent.account, operation_id: intent.operationId }, blockHash);
  if (!result) return;
  if (result.method !== intent.method || result.status !== 'complete' || !token(result.token_id) || result.fingerprint !== nearOperationFingerprint(intent)) throw new NearWalletError('context', 'The original NEAR transaction needs another check.');
  if (intent.method === 'withdraw' && (result.token_id !== intent.args.token_id || result.amount !== intent.args.amount)) throw new NearWalletError('context', 'The original withdrawal needs another check.');
  return { kind: 'near', tokenId: result.token_id, operationId: intent.operationId, method: intent.method };
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical((value as Record<string, unknown>)[key])).join(',') + '}';
  return JSON.stringify(value);
}

export async function waitNearOwnerReceipt(config: NearPublicConfig, hash: string, intent: NearSubmissionIntent): Promise<NearOwnerReceipt> {
  assertIntent(config, intent);
  const outcome = await waitNearTransaction(config, hash, intent.account), tx = outcome.transaction;
  const call = tx.actions?.length === 1 ? tx.actions[0]?.FunctionCall : undefined;
  const gas = typeof call?.gas === 'number' && Number.isSafeInteger(call.gas) ? String(call.gas) : call?.gas;
  let args: unknown;
  try { args = call && JSON.parse(new TextDecoder().decode(nearUnbase64(call.args))); } catch { throw new NearWalletError('uncertain', 'Checking the original NEAR transaction.'); }
  if (tx.receiver_id !== config.collection || !call || call.method_name !== intent.method || call.deposit !== intent.deposit || !uint(gas) || BigInt(gas) !== BigInt(intent.gas)
    || canonical(args) !== canonical(intent.args)) throw new NearWalletError('uncertain', 'The wallet transaction does not match this request.');
  // Final transaction success is followed by a canonical game-operation read.
  // A detached refund failure must not erase a successful mint/admission.
  let receipt: NearOwnerReceipt | undefined;
  for (let n = 0; n < 4 && !receipt; n++) { receipt = await operationOutcome(config, intent); if (!receipt) await sleep(500); }
  if (!receipt) {
    const failed = typeof outcome.status === 'object' && outcome.status.Failure !== undefined;
    const gameFailed = outcome.transaction_outcome?.outcome?.status?.Failure !== undefined || outcome.receipts_outcome?.some(r => r.outcome?.executor_id === config.collection && r.outcome.status?.Failure !== undefined);
    if (failed && gameFailed) throw new NearWalletError('reverted', 'That NEAR transaction did not complete.');
    throw new NearWalletError('uncertain', 'Still checking the original NEAR transaction.');
  }
  // A failed duplicate transaction may still point at the identical successful
  // earlier operation. Recover that operation without claiming the failed hash
  // was its payment; the backend can then verify its canonical request directly.
  const failed = typeof outcome.status === 'object' && outcome.status.Failure !== undefined;
  return { ...receipt, ...(failed ? {} : { transactionHash: hash }), outcome };
}

export async function resolveNearSubmission(config: NearPublicConfig, intent: NearSubmissionIntent): Promise<{ matched: boolean; receipt?: NearOwnerReceipt; expired?: boolean }> {
  const checked = await verifyNearWorld(config);
  const receipt = await operationOutcome(config, intent, checked.blockHash);
  if (!receipt && intent.method === 'accept_day') {
    const expiry = (intent.args.admission as { expiresAt?: unknown })?.expiresAt;
    if (!uint(expiry)) throw new NearWalletError('context', 'Choose the original day.');
    const block = await nearRead<{ header: { hash: string; timestamp_nanosec: string } }>(config, 'block', { block_id: checked.blockHash });
    if (block.header?.hash !== checked.blockHash || !uint(block.header?.timestamp_nanosec)) throw new NearWalletError('connection', 'Checking the original day.');
    // The native contract uses whole seconds and accepts equality. A final
    // block strictly later proves this old admission can no longer execute.
    if (BigInt(block.header.timestamp_nanosec) / 1_000_000_000n > BigInt(expiry)) return { matched: false, expired: true };
  }
  return { matched: true, receipt };
}

export function createNearChainReader(config: NearPublicConfig) {
  return {
    config,
    balance: (account: string) => nearAvailableBalance(config, account),
    tokenBalance: async (account: string) => { const { value } = await nearView<string>(config, 'ft_balance_of', { account_id: account }); if (!uint(value)) throw new NearWalletError('connection', 'Checking the purse balance.'); return BigInt(value); },
    tokenAllowance: async () => 0n,
    wait: (hash: string, intent: NearSubmissionIntent) => waitNearOwnerReceipt(config, hash, intent),
  };
}

export function createNearOwnerWallet(provider: NearWalletBase, config: NearPublicConfig, account: string, onIntent?: (intent: NearSubmissionIntent) => void) {
  assertNearRpcConfig(config);
  if (!nearAccountId(account)) throw new NearWalletError('wallet', 'Choose your NEAR wallet.');
  const reader = createNearChainReader(config);
  async function guard() { await assertNearSigner(provider, account); return verifyNearWorld(config); }
  async function send(method: NearMethod, args: Record<string, unknown>, deposit: string, operationId?: `0x${string}`, original?: NearSubmissionIntent, beforeOpen?: () => Promise<void>): Promise<string> {
    const checked = await guard();
    const gas = original?.gas || (method === 'mint_nft' || births.has(method) ? '150000000000000' : '100000000000000');
    const [balance, price] = await Promise.all([reader.balance(account), nearRead<{ gas_price: string }>(config, 'gas_price', { block_id: checked.blockHash })]);
    if (!uint(deposit) || !uint(price.gas_price) || balance < BigInt(deposit) + BigInt(gas) * BigInt(price.gas_price) * 2n) throw new NearWalletError('funds', 'This wallet needs test NEAR.');
    const random = crypto.getRandomValues(new Uint8Array(32)), id = operationId || ('0x' + Array.from(random, n => n.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
    const frozen = original ? structuredClone(original.args) : structuredClone({ ...args, ...(method !== 'accept_day' && method !== 'expire' ? { operation_id: id, expected_owner: account } : {}) });
    const intent: NearSubmissionIntent = original ? structuredClone(original) : { kind: 'near', networkId: 'near-testnet', collection: config.collection, account, operationId: id, method, args: frozen, deposit, gas, createdAt: Date.now() };
    assertIntent(config, intent); onIntent?.(intent);
    // All RPC, balance and quote checks have finished. The UI can hand off on a
    // fresh click, rather than losing the browser's popup gesture to preflight.
    await beforeOpen?.();
    try {
      const result = await provider.signAndSendTransaction({ network: 'testnet', signerId: account, receiverId: config.collection,
        actions: [{ type: 'FunctionCall', params: { methodName: method, args: frozen, gas, deposit } }] });
      const hash = result?.transaction?.hash;
      if (!nearHash(hash)) throw new NearWalletError('uncertain', 'Check the original transaction before trying again.');
      return hash;
    } catch (error) {
      if (explicitlyRejectedNear(error)) throw new NearWalletError('ACTION_REJECTED', 'No problem. Nothing was sent.');
      const uncertain = error instanceof NearWalletError ? error : new NearWalletError('uncertain', 'Check the original transaction before trying again.', { cause: error });
      Object.assign(uncertain, { intent }); throw uncertain;
    }
  }
  const identity = (name: string, stats: readonly number[]) => {
    const clean = name.trim().toUpperCase();
    if (!/^[A-Z0-9](?:[A-Z0-9 ]{0,6}[A-Z0-9])?$/.test(clean) || stats.length !== 3 || stats.some(n => !Number.isInteger(n) || n < 0 || n > 5) || stats.reduce((a, b) => a + b, 0) !== 5)
      throw new NearWalletError('context', 'Give this little life a name and five points.');
    return { name: clean, stats: [...stats] };
  };
  async function verifyQuote(quote: NearOwnerQuote): Promise<void> {
    const a = quote.admission;
    if (quote.networkId !== 'near-testnet' || quote.collection !== config.collection || !nearHex32(a.id) || a.player !== account || a.decisionConfig !== config.decisionConfig
      || !uint(a.processingFee) || quote.value !== a.processingFee || BigInt(quote.value) > BigInt(config.maxProcessingFee) || a.multiplier !== config.multiplier
      || !uint(a.expiresAt) || BigInt(a.expiresAt) <= BigInt(Math.floor(Date.now() / 1000)) || BigInt(a.expiresAt) > BigInt(Math.floor(Date.now() / 1000) + 900))
      throw new NearWalletError('context', 'Your home changed. Review the day again.');
    const signature = nearUnbase64(quote.signature, 64), publicKey = nearUnbase64(config.quoteSigner, 32);
    let verified = false;
    try { const key = await crypto.subtle.importKey('raw', new Uint8Array(publicKey).buffer, { name: 'Ed25519' }, false, ['verify']);
      verified = await crypto.subtle.verify('Ed25519', key, new Uint8Array(signature).buffer, new TextEncoder().encode(nearAdmissionMessage(config.collection, a)).buffer); }
    catch { throw new NearWalletError('context', 'The day quote could not be verified. Review it again.'); }
    if (!verified) throw new NearWalletError('context', 'The day quote changed. Review it again.');
  }
  return {
    kind: 'near' as const, account, provider, config, requiresBirthApproval: false, walletName: provider.manifest?.name || 'NEAR wallet',
    signLogin: (challenge: NearSignChallenge, beforeOpen?: () => Promise<void>) => signNearLogin(provider, account, challenge, beforeOpen),
    mint: (name: string, stats: readonly number[], beforeOpen?: () => Promise<void>) => send('mint_nft', identity(name, stats), config.nativeMintPrice, undefined, undefined, beforeOpen),
    accept: async (quote: NearOwnerQuote, beforeOpen?: () => Promise<void>) => {
      const a = quote.admission;
      await verifyQuote(quote);
      return send('accept_day', { admission: structuredClone(a), signature: quote.signature }, quote.value, a.id, undefined, beforeOpen);
    },
    retryOriginal: async (intent: NearSubmissionIntent, beforeOpen?: () => Promise<void>): Promise<{ hash?: string; receipt?: NearOwnerReceipt; expired?: boolean }> => {
      assertIntent(config, intent);
      if (intent.account !== account || BigInt(intent.gas) < 10_000_000_000_000n) throw new NearWalletError('context', 'Reconnect the original wallet.');
      const resolved = await resolveNearSubmission(config, intent);
      if (resolved.receipt || resolved.expired) return resolved;
      if (intent.method === 'accept_day') {
        const a = intent.args.admission as NearOwnerQuote['admission'];
        await verifyQuote({ networkId: 'near-testnet', collection: config.collection, admission: a, signature: String(intent.args.signature), value: intent.deposit,
          networkEstimate: '0', totalEstimate: intent.deposit, expiresAt: a.expiresAt, marketBusy: false, pressure: '0', maximumReward: '0' });
      } else {
        const expected = intent.method === 'mint_nft' ? config.nativeMintPrice : intent.method === 'expire' ? '0' : config.storageDeposit;
        if (intent.deposit !== expected) throw new NearWalletError('price', 'The price changed. Check the original transaction again.');
      }
      return { hash: await send(intent.method, intent.args, intent.deposit, intent.operationId, intent, beforeOpen) };
    },
    withdraw: (id: string, amount: string, beforeOpen?: () => Promise<void>) => { if (!token(id) || !uint(amount) || BigInt(amount) <= 0n) throw new NearWalletError('context', 'Choose a purse amount to take home.'); return send('withdraw', { token_id: id, amount }, config.storageDeposit, undefined, undefined, beforeOpen); },
    birthFromPurse: (source: string, nonce: string, name: string, stats: readonly number[], beforeOpen?: () => Promise<void>) => { if (!token(source) || !uint(nonce)) throw new NearWalletError('context', 'Choose your original purse.'); return send('birth_from_purse', { source_token_id: source, expected_nonce: nonce, ...identity(name, stats) }, config.storageDeposit, undefined, undefined, beforeOpen); },
    birthFromWallet: (name: string, stats: readonly number[], beforeOpen?: () => Promise<void>) => send('birth_from_wallet', identity(name, stats), config.storageDeposit, undefined, undefined, beforeOpen),
    approveBirthTokens: async (): Promise<string> => { throw new NearWalletError('context', 'NHC hatching needs no token approval on NEAR.'); },
    expire: (requestId: string, beforeOpen?: () => Promise<void>) => { if (!nearHex32(requestId)) throw new NearWalletError('context', 'Choose your original day.'); return send('expire', { request_id: requestId }, '0', requestId, undefined, beforeOpen); },
    balance: () => reader.balance(account), tokenBalance: () => reader.tokenBalance(account), tokenAllowance: () => reader.tokenAllowance(),
    wait: (hash: string, intent: NearSubmissionIntent) => reader.wait(hash, intent),
  };
}

export async function connectNearWallet(walletId: string, config: NearPublicConfig, onIntent?: (intent: NearSubmissionIntent) => void) {
  // Connection is free. Reject static wrong-world shapes first, then preserve
  // the actual wallet-choice gesture; verify the chain before adopting it.
  assertNearWalletConfig(config);
  const { provider, account } = await connectNearProvider(walletId);
  const wallet = createNearOwnerWallet(provider, config, account, onIntent);
  await assertNearSigner(provider, account); await verifyNearWorld(config);
  return wallet;
}
