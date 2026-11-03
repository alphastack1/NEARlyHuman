import { randomUUID, createHash } from 'node:crypto';
import { encodeFunctionData, keccak256, parseAbi, parseTransaction, recoverTransactionAddress, toHex, type Hex, type PublicClient, type PrivateKeyAccount } from 'viem';
import { storage, type DurableStore } from '../storage';
import { prepareV2, v2DecisionConfig, type V2ChoiceProvider, type V2PreparationOptions } from './preparation';
import { validateV2FrozenInput, v2WorkerInputHash, verifyV2Runtime, V2ContextError, type V2FrozenInput, type V2RuntimeIdentity } from './context';
import { paidV2Call, requireV2JobBudget, finishV2JobBudget, updateV2Record, V2BudgetError } from './budget';
import { normalizeV2Memory, buildV2Request, buildV2PlanRequest, decodeV2Choice, decodeV2Plan, offerV2MindCandidates, type V2MindMemory } from './choices';
import { sendV2 } from './jev';
import { readV2AcceptedTransaction } from './chain';
import { expandV2History, encodeTrace, Op } from '../../src/v2';
import { reconcileV2QuoteFunding } from './quotes';
import { classifyV2PreparationFailure, V2PreSendCheckError, v2FailureMessage, type V2FailureStage } from './failures';
import {appendV2Progress,publicV2Progress} from './progress';
import type {V2ChoiceProgress} from '../../src/v2/public';

export interface V2Job {
  version: 2; id: string; campaignId: string; input: V2FrozenInput; inputHash: Hex;
  phase: 'queued' | 'preparing' | 'prepared' | 'saving' | 'ready' | 'failure_due' | 'expiry_due' | 'failed' | 'expired' | 'quarantined';
  generation: number; lease?: { id: string; generation: number; until: number };
  answers: Record<string, { inputHash: string; valueHash: string; costMicroUSD: number }>;
  inputs: Record<string, string>;
  memory: V2MindMemory; memoryHash: Hex;
  packetKey?: string; commitment?: Hex; stateHash?: Hex; transactionHash?: Hex;
  ownerTx?: Hex;
  journal?: V2RelayJournal;
  journals?: V2RelayJournal[];
  failureCode?: string; failureStage?: V2FailureStage; failureClass?: string; createdAt: number; updatedAt: number;
  progress?:V2ChoiceProgress[];
}
export interface V2JobLease { id: string; generation: number }
const keyOf = (input: V2FrozenInput) => `v2/jobs/${input.runtime.chainId}/${input.runtime.collection.toLowerCase()}/${input.requestId.toLowerCase()}`;
const digest = (v: unknown) => keccak256(toHex(JSON.stringify(v)));
const sha = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const leaseMs = 90_000;
export class V2LeaseLost extends Error { constructor() { super('Another worker is preparing this day.'); } }
function fence(job: V2Job, lease: V2JobLease) {
  if (job.lease?.id !== lease.id || job.lease.generation !== lease.generation || job.lease.until <= Date.now()) throw new V2LeaseLost();
}

/** The input must first come from readV2AcceptedTransaction, not a browser save. */
export async function createV2Job(raw: V2FrozenInput, campaignId: string, options: { allowLocal?: boolean; store?: DurableStore; memory?: V2MindMemory; ownerTx?: Hex } = {}) {
  const store = options.store || storage(), input = validateV2FrozenInput(raw, options.allowLocal), id = keyOf(input), inputHash = v2WorkerInputHash(input);
  const memory = normalizeV2Memory({ ...options.memory, pressureMicro: input.pressure }, input.day), memoryHash = digest(memory);
  if (input.runtime.decisionConfig !== v2DecisionConfig(input.runtime.rulesHash)) throw new V2ContextError('context', 'The accepted policy has changed.');
  await requireV2JobBudget(campaignId, id, store);
  return updateV2Record<V2Job>(store, id, () => ({ version: 2, id, campaignId, input, inputHash, phase: 'queued', generation: 0, answers: {}, inputs: {}, memory, memoryHash, ...(options.ownerTx ? { ownerTx: options.ownerTx } : {}), createdAt: Date.now(), updatedAt: Date.now() }), job => {
    if (job.version !== 2 || job.inputHash !== inputHash || job.campaignId !== campaignId || (options.memory !== undefined && job.memoryHash !== memoryHash)
      || digest(job.memory) !== job.memoryHash || (options.ownerTx !== undefined && job.ownerTx !== options.ownerTx)) {
      job.phase = 'quarantined'; job.failureCode = 'canonical_input_changed'; delete job.lease;
    }
    return job;
  });
}
export const v2JobId = keyOf;

export async function acquireV2Job(id: string, store: DurableStore = storage()) {
  const leaseId = randomUUID();
  const job = await updateV2Record<V2Job>(store, id, () => { throw Error('Missing accepted day'); }, j => {
    if (['ready', 'prepared', 'saving', 'failure_due', 'expiry_due', 'failed', 'expired', 'quarantined'].includes(j.phase)) return j;
    if (j.lease && j.lease.until > Date.now()) throw new V2LeaseLost();
    if (BigInt(j.input.deadline) < BigInt(Math.floor(Date.now() / 1000))) { j.phase = 'expiry_due'; j.failureCode = 'expired'; j.failureStage = 'chain_check'; delete j.failureClass; delete j.lease; j.updatedAt = Date.now(); return j; }
    j.generation++; j.lease = { id: leaseId, generation: j.generation, until: Date.now() + leaseMs }; j.phase = 'preparing'; j.updatedAt = Date.now(); return j;
  });
  return { job, lease: job.lease?.id === leaseId ? { id: leaseId, generation: job.generation } : undefined };
}

/** Cache identity is the FINAL request body SHA, including memory and Dawn questions. */
export async function v2JobAnswer<T>(
  jobId: string, lease: V2JobLease, kind: string, inputHash: string,
  run: (beforeSend: (hash: string, input: unknown) => Promise<void>) => Promise<{ value: T; costMicroUSD: number }>,
  store: DurableStore = storage(),
) {
  const control = (await store.get<V2Job>(jobId))?.value; if (!control) throw Error('Missing accepted day'); fence(control, lease);
  if (control.phase !== 'preparing') throw new V2LeaseLost();
  if (!kind || kind.length > 100) throw new V2ContextError('context', 'Invalid model opportunity.');
  await updateV2Record<V2Job>(store, jobId, () => { throw Error('Missing accepted day'); }, j => {
    fence(j, lease); if (j.inputs[kind] && j.inputs[kind] !== inputHash) throw new V2ContextError('context', 'The frozen model input changed.');
    j.inputs[kind] = inputHash; return j;
  });
  const callId = `${control.input.requestId}:${kind}`;
  const value = await paidV2Call(control.campaignId, callId, inputHash, async beforeSend => run(async (hash, input) => {
    await updateV2Record<V2Job>(store, jobId, () => { throw Error('Missing accepted day'); }, j => { fence(j, lease); if (j.inputHash !== control.inputHash || j.phase !== 'preparing') throw new V2LeaseLost(); j.lease!.until = Date.now() + leaseMs; j.updatedAt = Date.now(); return j; });
    await beforeSend(hash, input);
  }), store, jobId);
  await updateV2Record<V2Job>(store, jobId, () => { throw Error('Missing accepted day'); }, j => {
    fence(j, lease); if (j.inputHash !== control.inputHash) throw new V2LeaseLost();
    const hash = sha(value), previous = j.answers[inputHash];
    if (previous && previous.valueHash !== hash) throw new V2ContextError('context', 'The saved answer changed.');
    const cost = (value as { exchange?: { costMicroUSD?: number } })?.exchange?.costMicroUSD || 0;
    j.answers[inputHash] = { inputHash, valueHash: hash, costMicroUSD: cost }; j.updatedAt = Date.now(); return j;
  });
  return value;
}

export async function prepareV2Job(
  id: string, provider: (job: V2Job, lease: V2JobLease) => V2ChoiceProvider,
  options: V2PreparationOptions & { store?: DurableStore; configure?: (job: V2Job, lease: V2JobLease) => Promise<V2PreparationOptions> } = {},
) {
  const store = options.store || storage(), { job, lease } = await acquireV2Job(id, store);
  if (!lease) return job;
  try {
    if (digest(job.memory) !== job.memoryHash || (options.memory && digest(normalizeV2Memory({ ...options.memory, pressureMicro: job.input.pressure }, job.input.day)) !== job.memoryHash)) throw new V2ContextError('context', 'The frozen memory changed.');
    const configured = await options.configure?.(job, lease) || {};
    if (configured.memory && digest(configured.memory) !== job.memoryHash) throw new V2ContextError('context', 'The frozen memory changed.');
    const prepared = await prepareV2(job.input, provider(job, lease), { ...options, ...configured, memory: structuredClone(job.memory), onDecision: async d => {
      await options.onDecision?.(d);
      await updateV2Record<V2Job>(store, id, () => { throw Error('Missing accepted day'); }, j => { fence(j, lease); j.lease!.until = Date.now() + leaseMs; j.updatedAt = Date.now(); return j; });
    } });
    const packetKey = `v2/packets/${prepared.commitment}`;
    const existing = await store.get<unknown>(packetKey);
    if (existing && digest(existing.value) !== prepared.commitment) throw new V2ContextError('context', 'The prepared packet changed.');
    if (!existing && !await store.put(packetKey, prepared.packet, { isNew: true })) {
      const raced = await store.get<unknown>(packetKey); if (!raced || digest(raced.value) !== prepared.commitment) throw new V2ContextError('context', 'The prepared packet changed.');
    }
    return updateV2Record<V2Job>(store, id, () => { throw Error('Missing accepted day'); }, j => {
      fence(j, lease); if (j.inputHash !== job.inputHash) throw new V2LeaseLost();
      j.phase = 'prepared'; j.packetKey = packetKey; j.commitment = prepared.commitment; j.stateHash = prepared.packet.stateHash; delete j.lease; delete j.failureCode; delete j.failureStage; delete j.failureClass; j.updatedAt = Date.now(); return j;
    });
  } catch (error) {
    if (error instanceof V2LeaseLost) throw error;
    await updateV2Record<V2Job>(store, id, () => { throw Error('Missing accepted day'); }, j => {
      const failure = classifyV2PreparationFailure(error);
      fence(j, lease); j.phase = failure.retryable ? 'queued' : error instanceof V2ContextError && error.code === 'expired' ? 'expiry_due'
        : error instanceof V2ContextError || error instanceof V2BudgetError && error.code === 'changed' ? 'quarantined' : 'failure_due';
      j.failureCode = failure.code; j.failureStage = failure.stage;
      // Class names aid private diagnosis without persisting RPC URLs, bodies,
      // signatures, stack traces, or arbitrary exception messages.
      const classes: string[] = []; let cause = error as { name?: unknown; constructor?: { name?: string }; cause?: unknown } | undefined;
      for (let depth = 0; cause && depth < 8; depth++, cause = cause.cause as typeof cause) {
        const name = cause.name === 'Error' ? cause.constructor?.name : cause.name;
        if (typeof name === 'string' && /^[A-Za-z][A-Za-z0-9]{0,79}$/.test(name)) classes.push(name);
      }
      j.failureClass = classes.join('>') || 'UnknownError'; delete j.lease; j.updatedAt = Date.now(); return j;
    });
    throw error;
  }
}

/** Standard real-provider composition; each new paid send rechecks the accepted onchain identity. */
export async function prepareV2JevJob(id: string, client: PublicClient, options: { store?: DurableStore; allowLocal?: boolean } = {}) {
  const store = options.store || storage();
  const progress=async(lease:V2JobLease,value:V2ChoiceProgress)=>updateV2Record<V2Job>(store,id,()=>{throw Error('Missing accepted day');},j=>{fence(j,lease);if(j.phase!=='preparing')throw new V2LeaseLost();j.progress=appendV2Progress(j.progress,value);j.updatedAt=Date.now();return j;});
  const recheck = async (job: V2Job) => {
    if (!job.ownerTx) throw new V2ContextError('context', 'The accepted transaction is missing.');
    let canonical: Awaited<ReturnType<typeof readV2AcceptedTransaction>>;
    try { canonical = await readV2AcceptedTransaction(client, job.input.runtime, job.ownerTx, job.input.player, { allowLocal: options.allowLocal, requestId: job.input.requestId }); }
    catch (error) { if (error instanceof V2ContextError) throw error; throw new V2PreSendCheckError(error); }
    if (v2WorkerInputHash(canonical.input) !== job.inputHash) throw new V2ContextError('context', 'The canonical accepted day changed.');
  };
  return prepareV2Job(id, (job, lease) => async decision => {
    const request = buildV2Request(decision, job.memory);
    const reply = await v2JobAnswer(id, lease, `${decision.mode}:${decision.slot}`, request.inputHash, async beforeSend => {
      const value = await sendV2(request, async (hash, input) => { await recheck(job); await beforeSend(hash, input); });
      return { value, costMicroUSD: value.exchange.costMicroUSD };
    }, store);
    const selected=decodeV2Choice(reply),candidate=decision.candidates.find(a=>a.key===selected.key);
    if(!candidate)throw new V2ContextError('context','The selected model action changed.');
    await progress(lease,{id:request.inputHash,stage:decision.mode,label:candidate.label,slot:decision.slot});
    return selected;
  }, { ...options, configure: async (job, lease) => {
    await recheck(job);
    return { offer: offerV2MindCandidates, plan: async choices => {
      const request = buildV2PlanRequest(choices);
      const reply = await v2JobAnswer(id, lease, 'dawn', request.inputHash, async beforeSend => {
        const value = await sendV2(request, async (hash, input) => { await recheck(job); await beforeSend(hash, input); });
        return { value, costMicroUSD: value.exchange.costMicroUSD };
      }, store);
      const plan=decodeV2Plan(reply,choices);await progress(lease,{id:request.inputHash,stage:'plan',label:plan.mainLabel});return plan;
    } };
  } });
}

/** Ready follows a canonical receipt check by the caller, never a broadcast acknowledgement. */
export async function recordV2Saved(id: string, transactionHash: Hex, expectedCommitment: Hex, store: DurableStore = storage()) {
  return updateV2Record<V2Job>(store, id, () => { throw Error('Missing accepted day'); }, j => {
    if (!j.packetKey || j.commitment !== expectedCommitment || !['prepared', 'saving', 'ready'].includes(j.phase)) throw new V2ContextError('context', 'The saved result needs another check.');
    if (j.transactionHash && j.transactionHash !== transactionHash) throw new V2ContextError('context', 'The saved transaction changed.');
    j.phase = 'ready'; j.transactionHash = transactionHash; j.updatedAt = Date.now(); return j;
  });
}

export interface V2RelayIntent { jobId: string; kind: 'finalize' | 'failure' | 'expire'; data: Hex; resultDigest: string }
export interface V2RelayJournal extends V2RelayIntent { hash: Hex; raw: Hex; nonce: number; createdAt: number }
interface RelayControl { lease?: { id: string; until: number }; pending?: V2RelayJournal }
export class V2RelayBusy extends Error { constructor() { super('An earlier saved result is still being confirmed.'); } }

/** Same global wallet outbox and recovery contract as V1, with an explicit verified destination. */
export async function terminalV2Transaction(client: PublicClient, runtime: V2RuntimeIdentity, account: PrivateKeyAccount,
  intent: V2RelayIntent, onJournal: (journal: V2RelayJournal) => Promise<void>, options: { store?: DurableStore; allowLocal?: boolean; recoverJournal?: V2RelayJournal } = {}) {
  await verifyV2Runtime(client, runtime, options.allowLocal);
  if (account.address.toLowerCase() !== runtime.relayer.toLowerCase()) throw new V2ContextError('connection', 'The relay account changed.');
  const store = options.store || storage(), key = `control/relay-${runtime.chainId}-${account.address.toLowerCase()}`, leaseId = randomUUID();
  const acquired = await updateV2Record<RelayControl>(store, key, () => ({}), c => { if (c.lease && c.lease.until > Date.now()) throw new V2RelayBusy(); c.lease = { id: leaseId, until: Date.now() + 120_000 }; return c; });
  let pending = acquired.pending;
  try {
    if (!pending && options.recoverJournal) {
      const recovered = options.recoverJournal;
      const transaction = parseTransaction(recovered.raw), sender = await recoverTransactionAddress({ serializedTransaction: recovered.raw as Parameters<typeof recoverTransactionAddress>[0]['serializedTransaction'] });
      if (recovered.jobId !== intent.jobId || recovered.resultDigest !== intent.resultDigest || recovered.data !== intent.data || keccak256(recovered.raw) !== recovered.hash
        || transaction.chainId !== runtime.chainId || transaction.to?.toLowerCase() !== runtime.collection.toLowerCase() || transaction.data !== intent.data || transaction.nonce !== recovered.nonce || sender.toLowerCase() !== account.address.toLowerCase()) throw new V2ContextError('context', 'The saved relay journal changed.');
      await updateV2Record<RelayControl>(store, key, () => ({}), c => { if (c.lease?.id !== leaseId || c.pending) throw new V2RelayBusy(); c.pending = recovered; return c; });
      pending = recovered;
    }
    if (!pending) {
      const [nonce, gasPrice, estimate] = await Promise.all([client.getTransactionCount({ address: account.address, blockTag: 'pending' }), client.getGasPrice(), client.estimateGas({ account: account.address, to: runtime.collection, data: intent.data })]);
      const raw = await account.signTransaction({ chainId: runtime.chainId, nonce, to: runtime.collection, data: intent.data, value: 0n, gas: estimate * 125n / 100n + 20_000n, gasPrice: gasPrice * 2n, type: 'legacy' });
      pending = { ...intent, hash: keccak256(raw), raw, nonce, createdAt: Date.now() }; const prepared = pending;
      await updateV2Record<RelayControl>(store, key, () => ({}), c => { if (c.lease?.id !== leaseId || c.pending) throw new V2RelayBusy(); c.pending = prepared; return c; });
    }
    const same = pending.jobId === intent.jobId && pending.resultDigest === intent.resultDigest;
    if (same) await onJournal(pending); // Never attribute an older wallet intent to this job.
    let receipt;
    try { receipt = await client.getTransactionReceipt({ hash: pending.hash }); } catch { /* recover exact signed bytes */ }
    if (!receipt) {
      try { await client.sendRawTransaction({ serializedTransaction: pending.raw }); }
      catch (error) { let known = false; try { await client.getTransaction({ hash: pending.hash }); known = true; } catch { /* keep uncertain journal */ } if (!known) throw error; }
      receipt = await client.waitForTransactionReceipt({ hash: pending.hash, confirmations: 1, timeout: 70_000 });
    }
    const canonical = await client.getBlock({ blockNumber: receipt.blockNumber });
    if (canonical.hash !== receipt.blockHash) throw new V2ContextError('context', 'Checking the saved transaction again.');
    await updateV2Record<RelayControl>(store, key, () => ({}), c => { if (c.lease?.id !== leaseId || c.pending?.hash !== pending!.hash) throw new V2RelayBusy(); delete c.pending; delete c.lease; return c; });
    if (!same) throw new V2RelayBusy();
    return { hash: pending.hash, status: receipt.status, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed };
  } finally {
    await updateV2Record<RelayControl>(store, key, () => ({}), c => { if (c.lease?.id === leaseId) delete c.lease; return c; }).catch(() => {});
  }
}

const terminalAbi = parseAbi([
  'function finalize(bytes32 id,bytes trace,bytes certificate,bytes32 replayCommitment)',
  'function fail(bytes32 id)', 'function expire(bytes32 id)',
  'function request(bytes32 id) view returns((uint256 tokenId,address player,uint32 baseRevision,uint32 day,uint64 kitMask,bool shipping,uint64 acceptedAt,uint64 deadline,bytes32 daySeed,bytes32 decisionConfig,bytes32 baseHash,uint256 pressure,uint256 reservedReward,uint8 status))',
  'function dayRecord(uint256 id,uint32 day) view returns((bytes32 requestId,bytes32 seed,bytes32 stateHash,bytes32 traceHash,bytes32 certificateHash,bytes32 replayCommitment,uint256 reward,bytes history))',
  'function names(uint256 id) view returns(string)',
]);

/** Compact history proves executed attempts, not a success bit. Freeze it before the first model send. */
export async function readV2CanonicalMemory(client: PublicClient, input: V2FrozenInput): Promise<V2MindMemory> {
  const at = { address: input.runtime.collection, abi: terminalAbi, blockNumber: BigInt(input.acceptedBlock) };
  const name = await client.readContract({ ...at, functionName: 'names', args: [BigInt(input.tokenId)] });
  const previousDays: NonNullable<V2MindMemory['previousDays']> = [];
  for (let day = Math.max(1, input.day - 2); day < input.day; day++) {
    const record = await client.readContract({ ...at, functionName: 'dayRecord', args: [BigInt(input.tokenId), day] });
    if (record.requestId === `0x${'0'.repeat(64)}`) throw new V2ContextError('context', 'A prior saved day is missing.');
    if (day === input.day - 1 && record.stateHash !== input.baseHash) throw new V2ContextError('context', 'The prior saved state changed.');
    const trace = expandV2History(record.history);
    if (keccak256(encodeTrace(trace)) !== record.traceHash) throw new V2ContextError('context', 'The prior action history changed.');
    previousDays.push({ day, actions: trace.steps.filter(a => ![Op.QuietMain, Op.Pickup].includes(a.op)).slice(-6) });
  }
  if ((await client.getBlock({ blockNumber: BigInt(input.acceptedBlock) })).hash !== input.acceptedBlockHash) throw new V2ContextError('context', 'The accepted block changed.');
  return normalizeV2Memory({ name, previousDays, pressureMicro: input.pressure }, input.day);
}

/** Public acceptance composition: only a verified paid receipt can construct the job and its memory. */
export async function acceptV2Job(client: PublicClient, runtime: V2RuntimeIdentity, transactionHash: Hex, player: V2FrozenInput['player'], campaignId: string,
  options: { store?: DurableStore; allowLocal?: boolean; requestId?: Hex } = {}) {
  const store = options.store || storage(), accepted = await readV2AcceptedTransaction(client, runtime, transactionHash, player, options);
  const existing = await store.get<V2Job>(keyOf(accepted.input));
  if (existing) return createV2Job(accepted.input, campaignId, { ...options, store, ownerTx: accepted.ownerTx });
  const memory = await readV2CanonicalMemory(client, accepted.input);
  return createV2Job(accepted.input, campaignId, { ...options, store, memory, ownerTx: accepted.ownerTx });
}
export async function submitPreparedV2Job(id: string, client: PublicClient, account: PrivateKeyAccount, options: { store?: DurableStore; allowLocal?: boolean } = {}) {
  const store = options.store || storage(), job = (await store.get<V2Job>(id))?.value;
  if (!job || !job.packetKey || !job.commitment || !job.stateHash || !['prepared', 'saving', 'ready'].includes(job.phase)) throw new V2ContextError('context', 'This day is not ready to save.');
  if (job.phase === 'ready') { await finishV2JobBudget(job.campaignId, id, store); await reconcileV2QuoteFunding(client, job.input.runtime, job.campaignId, store, options.allowLocal); return job; }
  const head = await verifyV2Runtime(client, job.input.runtime, options.allowLocal);
  const current = await client.readContract({ address: job.input.runtime.collection, abi: terminalAbi, functionName: 'request', args: [job.input.requestId], blockNumber: head.number! });
  if (current.baseHash !== job.input.baseHash || current.daySeed !== job.input.daySeed || current.tokenId !== BigInt(job.input.tokenId)) throw new V2ContextError('context', 'The accepted request changed.');
  if (current.status === 3 || current.status === 4) {
    if ((await client.getBlock({ blockNumber: head.number! })).hash !== head.hash) throw new V2ContextError('connection', 'Checking the released request again.');
    await recoverV2JobJournal(job, client, account, options);
    const terminal = await updateV2Record<V2Job>(store, id, () => { throw Error('Missing prepared day'); }, j => { j.phase = current.status === 4 ? 'expired' : 'failed'; j.updatedAt = Date.now(); return j; });
    await finishV2JobBudget(job.campaignId, id, store); await reconcileV2QuoteFunding(client, job.input.runtime, job.campaignId, store, options.allowLocal);
    return terminal;
  }
  if (current.status === 1 && head.timestamp > current.deadline) {
    await updateV2Record<V2Job>(store, id, () => { throw Error('Missing prepared day'); }, j => { j.phase = 'expiry_due'; j.updatedAt = Date.now(); return j; });
    throw new V2ContextError('expired', 'This attempt needs its expired request released.');
  }
  const packet = (await store.get<{ trace: Hex; certificate: Hex; rewardMicro: string }>(job.packetKey))?.value;
  if (!packet || digest(packet) !== job.commitment) throw new V2ContextError('context', 'The prepared packet changed.');
  const data = encodeFunctionData({ abi: terminalAbi, functionName: 'finalize', args: [job.input.requestId, packet.trace, packet.certificate, job.commitment] });
  const receipt = await terminalV2Transaction(client, job.input.runtime, account, { jobId: id, kind: 'finalize', data, resultDigest: keccak256(data) }, async journal => {
    await updateV2Record<V2Job>(store, id, () => { throw Error('Missing prepared day'); }, j => { if (j.commitment !== job.commitment || !['prepared', 'saving'].includes(j.phase)) throw new V2ContextError('context', 'The prepared result changed.'); j.phase = 'saving'; j.journal = journal; j.journals ||= []; if (!j.journals.some(x => x.hash === journal.hash)) j.journals.push(journal); j.updatedAt = Date.now(); return j; });
  }, { ...options, recoverJournal: job.journal });
  if (receipt.status !== 'success') {
    await updateV2Record<V2Job>(store, id, () => { throw Error('Missing prepared day'); }, j => { j.phase = 'failure_due'; j.failureCode = 'relay_reverted'; return j; });
    throw new V2ContextError('context', 'The save transaction did not complete.');
  }
  const block = await client.getBlock(), record = await client.readContract({ address: job.input.runtime.collection, abi: terminalAbi, functionName: 'dayRecord', args: [BigInt(job.input.tokenId), job.input.day], blockNumber: block.number! });
  if (record.requestId !== job.input.requestId || record.seed !== job.input.daySeed || record.replayCommitment !== job.commitment || record.stateHash !== job.stateHash
    || record.traceHash !== keccak256(packet.trace) || record.certificateHash !== keccak256(packet.certificate) || record.reward !== BigInt(packet.rewardMicro)
    || (await client.getBlock({ blockNumber: block.number! })).hash !== block.hash) throw new V2ContextError('context', 'Checking this saved day again.');
  const ready = await recordV2Saved(id, receipt.hash, job.commitment, store);
  await finishV2JobBudget(job.campaignId, id, store);
  await reconcileV2QuoteFunding(client, job.input.runtime, job.campaignId, store, options.allowLocal);
  return ready;
}

/** A failed/expired preparation becomes retryable only after its onchain request is terminal. */
export async function settleV2JobFailure(id: string, client: PublicClient, account: PrivateKeyAccount, options: { store?: DurableStore; allowLocal?: boolean } = {}) {
  const store = options.store || storage(), job = (await store.get<V2Job>(id))?.value;
  if (!job || !['failure_due', 'expiry_due', 'failed', 'expired'].includes(job.phase)) throw new V2ContextError('context', 'This day is still being checked.');
  const block = await verifyV2Runtime(client, job.input.runtime, options.allowLocal);
  let request = await client.readContract({ address: job.input.runtime.collection, abi: terminalAbi, functionName: 'request', args: [job.input.requestId], blockNumber: block.number! }), completedHere = false;
  if (request.tokenId !== BigInt(job.input.tokenId) || request.baseHash !== job.input.baseHash || request.daySeed !== job.input.daySeed || request.decisionConfig !== job.input.runtime.decisionConfig
    || request.baseRevision !== job.input.baseRevision || request.day !== job.input.day || request.kitMask !== BigInt(job.input.kitMask) || request.deadline !== BigInt(job.input.deadline)) throw new V2ContextError('context', 'The canonical request changed.');
  if (request.status === 1) {
    const kind = block.timestamp > request.deadline ? 'expire' as const : 'failure' as const;
    const data = kind === 'expire' ? encodeFunctionData({ abi: terminalAbi, functionName: 'expire', args: [job.input.requestId] }) : encodeFunctionData({ abi: terminalAbi, functionName: 'fail', args: [job.input.requestId] });
    const intent: V2RelayIntent = { jobId: id, kind, data, resultDigest: keccak256(data) };
    const result = await terminalV2Transaction(client, job.input.runtime, account, intent, async journal => {
      await updateV2Record<V2Job>(store, id, () => { throw Error('Missing failed day'); }, j => { j.journal = journal; j.journals ||= []; if (!j.journals.some(x => x.hash === journal.hash)) j.journals.push(journal); j.updatedAt = Date.now(); return j; });
    }, { ...options, recoverJournal: job.journal?.resultDigest === intent.resultDigest ? job.journal : undefined });
    if (result.status !== 'success') throw new V2ContextError('context', 'Checking the terminal transaction again.');
    completedHere = true;
    request = await client.readContract({ address: job.input.runtime.collection, abi: terminalAbi, functionName: 'request', args: [job.input.requestId] });
  }
  if (request.status !== 3 && request.status !== 4) throw new V2ContextError('context', 'This request has a different canonical result.');
  if (!completedHere) await recoverV2JobJournal(job, client, account, options);
  const terminal = await updateV2Record<V2Job>(store, id, () => { throw Error('Missing failed day'); }, j => { j.phase = request.status === 4 ? 'expired' : 'failed'; delete j.lease; j.updatedAt = Date.now(); return j; });
  await finishV2JobBudget(job.campaignId, id, store);
  await reconcileV2QuoteFunding(client, job.input.runtime, job.campaignId, store, options.allowLocal);
  return terminal;
}

/** A direct owner expiry must not strand an earlier uncertain signed wallet nonce. */
async function recoverV2JobJournal(job: V2Job, client: PublicClient, account: PrivateKeyAccount, options: { store?: DurableStore; allowLocal?: boolean }) {
  if (!job.journal) return;
  await terminalV2Transaction(client, job.input.runtime, account, { jobId: job.journal.jobId, kind: job.journal.kind, data: job.journal.data, resultDigest: job.journal.resultDigest }, async () => {}, { ...options, recoverJournal: job.journal });
}

/** Safe API projection; private raw transaction journals and provider caches stay private. */
export function v2JobView(job: V2Job) {
  const progress=publicV2Progress(job.progress);
  return { requestId: job.input.requestId, tokenId: job.input.tokenId, phase: job.phase, decisions: Object.keys(job.answers).length,
    updatedAt: job.updatedAt, ownerTx: job.ownerTx, finalTx: job.transactionHash, commitment: job.phase === 'ready' ? job.commitment : undefined,
    retrySafe: job.phase === 'failed' || job.phase === 'expired',
    ...(job.failureCode && job.phase !== 'ready' ? { failureCode: job.failureCode, failureMessage: v2FailureMessage(job.failureCode) } : {}),...(progress?{progress}:{}) };
}
