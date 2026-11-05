import { keccak256, parseAbi, parseAbiItem, type Address, type Hex, type PublicClient } from 'viem';
import { evmConfig, serverConfig, isHosted } from '../config';
import { ServiceError, serviceAccount } from '../support';
import { dispatchBackground } from '../worker';
import { storage } from '../storage';
import { evmViewConnection } from './views';
import { verifyEvmRuntime, EvmContextError, type EvmRuntimeIdentity } from './context';
import { issueEvmDayQuote, reconcileEvmQuoteFunding } from './quotes';
import { acceptEvmJob, prepareEvmJevJob, settleEvmJobFailure, submitPreparedEvmJob, terminalEvmTransaction, evmJobView, type EvmJob, type EvmRelayJournal } from './jobs';
import { encodeFunctionData } from 'viem';
import { finishJobBudget, updateStoredRecord } from './budget';
import { evmRuntimeScopeForJob, evmRuntimeScopes, withEvmRuntimeScope } from './runtime-scope';

const abi = parseAbi([
  'function request(bytes32 id) view returns((uint256 tokenId,address player,uint32 baseRevision,uint32 day,uint64 kitMask,bool shipping,uint64 acceptedAt,uint64 deadline,bytes32 daySeed,bytes32 decisionConfig,bytes32 baseHash,uint256 pressure,uint256 reservedReward,uint8 status))',
  'function expire(bytes32 id)',
  'function dayRecord(uint256 id,uint32 day) view returns((bytes32 requestId,bytes32 seed,bytes32 stateHash,bytes32 traceHash,bytes32 certificateHash,bytes32 replayCommitment,uint256 reward,bytes history))',
]);
const acceptedEvent = parseAbiItem('event DayAccepted(bytes32 indexed id,uint256 indexed tokenId,address indexed player,uint256 reservedReward,bool shipping,bytes32 daySeed)');
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const prefix = (r: EvmRuntimeIdentity) => `v2/jobs/${r.chainId}/${r.collection.toLowerCase()}/`;
const terminal = (j: EvmJob) => ['ready', 'failed', 'expired'].includes(j.phase);
function connection() {
  const c = evmViewConnection(), campaignId = evmConfig().campaign;
  if (!campaignId || !/^[a-z0-9][a-z0-9-]{1,79}$/.test(campaignId)) throw new ServiceError('Preparation is resting. Try again shortly.', 'capacity', 503);
  if (c.runtime.chainId !== serverConfig().chainId && !c.allowLocal) throw new EvmContextError('context', 'The wallet connection needs another check.');
  return { ...c, campaignId };
}
function account(r: EvmRuntimeIdentity) {
  const signer = serviceAccount();
  if (!same(signer.address, r.relayer) || !same(signer.address, r.quoteSigner)) throw new EvmContextError('context', 'The preparation signer needs another check.');
  return signer;
}
export async function quoteEvmOwnerDay(player: Address, input: { tokenId: string; kitMask: string; shipping?: boolean }) {
  const c = connection();
  if (!c.admissionsEnabled) throw new ServiceError('This collection is resting. Open a new home to start another day.', 'archived', 409);
  if (!/^[1-9]\d{0,77}$/.test(input.tokenId) || BigInt(input.tokenId) >= 1n << 256n || !/^(0|[1-9]\d{0,19})$/.test(input.kitMask) || BigInt(input.kitMask) >= 1n << 64n || input.shipping !== undefined && typeof input.shipping !== 'boolean') throw new ServiceError('Choose the supplies again.', 'format');
  const nativeAllowance = (value: string | undefined) => { const raw = value || '0'; if (!/^(0|[1-9]\d{0,16})$/.test(raw) || BigInt(raw) > 10n ** 16n) throw new ServiceError('Preparation is resting. Try again shortly.', 'capacity', 503); return BigInt(raw); };
  return issueEvmDayQuote(c.client, c.runtime, account(c.runtime), { player, tokenId: BigInt(input.tokenId), kitMask: BigInt(input.kitMask), shipping: input.shipping }, { campaignId: c.campaignId, allowLocal: c.allowLocal,
    inferenceReserveWei: nativeAllowance(evmConfig().inferenceReserveWei), hostingReserveWei: nativeAllowance(evmConfig().hostingReserveWei) });
}
async function ownerJob(id: Hex, player: Address) {
  const c = connection(), job = (await storage().get<EvmJob>(prefix(c.runtime) + id.toLowerCase()))?.value;
  if (!job || !same(job.input.player, player)) throw new ServiceError('That day could not be found.', 'not_found', 404);
  return job;
}
export async function getEvmOwnerJob(id: Hex, player: Address) {
  try{return evmJobView(await ownerJob(id,player));}catch(error){if(!(error instanceof ServiceError)||error.code!=='not_found')throw error;}
  const c=connection(),head=await verifyEvmRuntime(c.client,c.runtime,c.allowLocal),q=await c.client.readContract({address:c.runtime.collection,abi,functionName:'request',args:[id],blockNumber:head.number!});
  if(q.status===0||!same(q.player,player))throw new ServiceError('That day could not be found.','not_found',404);
  const saved=q.status===2?await c.client.readContract({address:c.runtime.collection,abi,functionName:'dayRecord',args:[q.tokenId,q.day],blockNumber:head.number!}):undefined;
  if(saved&&saved.requestId!==id)throw new EvmContextError('context','Checking this saved day again.');
  if((await c.client.getBlock({blockNumber:head.number!})).hash!==head.hash)throw new EvmContextError('connection','Checking this day again.');
  // A paid receipt can precede its durable acknowledgement. This view does not
  // invent a job, buy inference or release a financial hold.
  return {requestId:id,tokenId:q.tokenId.toString(),phase:q.status===2?'ready' as const:q.status===3?'failed' as const:q.status===4?'expired' as const:'queued' as const,decisions:0,updatedAt:Date.now(),...(saved?{commitment:saved.replayCommitment}:{}),retrySafe:q.status===3||q.status===4};
}
export async function acceptEvmOwnerDay(tx: Hex, player: Address, requestId?: Hex) {
  const c = connection();
  if (requestId) {
    const existing = (await storage().get<EvmJob>(prefix(c.runtime) + requestId.toLowerCase()))?.value;
    if (existing && same(existing.input.player, player) && existing.ownerTx && same(existing.ownerTx, tx)) {
      if (!terminal(existing)) { try { await dispatchEvmJob(existing.id); } catch { /* the accepted job is already durable */ } }
      return evmJobView(existing);
    }
  }
  const job = await acceptEvmJob(c.client, c.runtime, tx, player, c.campaignId, { allowLocal: c.allowLocal, requestId });
  // Acceptance is durable before dispatch. A lost background acknowledgement is recoverable.
  try { await dispatchEvmJob(job.id); } catch { /* scheduled reconciler owns the durable queue */ }
  return evmJobView(job);
}
export async function wakeEvmOwnerDay(id: Hex, player: Address) {
  let job:EvmJob;
  try{job=await ownerJob(id,player);}catch(error){
    if(!(error instanceof ServiceError)||error.code!=='not_found')throw error;
    const c=connection(),head=await verifyEvmRuntime(c.client,c.runtime,c.allowLocal),q=await c.client.readContract({address:c.runtime.collection,abi,functionName:'request',args:[id],blockNumber:head.number!});
    if(q.status===0||!same(q.player,player))throw new ServiceError('That day could not be found.','not_found',404);
    if(q.status===1&&head.timestamp<=q.deadline){const tx=await findEvmAcceptance(c.client,c.runtime,id,q.acceptedAt,head.number!);return acceptEvmOwnerDay(tx,player,id);}
    if(q.status===1){const data=encodeFunctionData({abi,functionName:'expire',args:[id]}),jobId=prefix(c.runtime)+id.toLowerCase(),key=`v2/recovery/${c.runtime.chainId}/${c.runtime.collection.toLowerCase()}/${id}`,previous=(await storage().get<EvmRelayJournal>(key))?.value;await terminalEvmTransaction(c.client,c.runtime,account(c.runtime),{jobId,kind:'expire',data,resultDigest:keccak256(data)},async journal=>{await storage().put(key,journal);},{allowLocal:c.allowLocal,recoverJournal:previous});}
    await reconcileEvmQuoteFunding(c.client,c.runtime,c.campaignId,storage(),c.allowLocal);return getEvmOwnerJob(id,player);
  }
  if (!terminal(job)) await dispatchEvmJob(job.id);
  return evmJobView(job);
}
const localRunning = new Set<string>();
export async function dispatchEvmJob(id: string) {
  return withEvmRuntimeScope(evmRuntimeScopeForJob(id),()=>dispatchEvmScopedJob(id));
}
async function dispatchEvmScopedJob(id: string) {
  const c = connection();
  if (!id.startsWith(prefix(c.runtime)) || !/^0x[0-9a-f]{64}$/.test(id.slice(prefix(c.runtime).length))) throw new ServiceError('That day could not be found.', 'not_found', 404);
  if (isHosted()) return dispatchBackground({ version: 2, jobId: id });
  if (localRunning.has(id)) return;
  localRunning.add(id);
  setTimeout(() => { void runEvmQueueJob(id).catch(() => {}).finally(() => localRunning.delete(id)); }, 0);
}
/** One durable preparation then one canonical save. Re-entry never buys a duplicate answer. */
export async function runEvmQueueJob(id: string) {
  return withEvmRuntimeScope(evmRuntimeScopeForJob(id),()=>runEvmScopedQueueJob(id));
}
async function runEvmScopedQueueJob(id: string) {
  const c = connection(), store = storage();
  if (!id.startsWith(prefix(c.runtime)) || !/^0x[0-9a-f]{64}$/.test(id.slice(prefix(c.runtime).length))) throw new EvmContextError('context', 'Invalid queued day.');
  let job = (await store.get<EvmJob>(id))?.value;
  if (!job || job.campaignId !== c.campaignId || !same(job.input.runtime.collection, c.runtime.collection)) throw new EvmContextError('context', 'The queued day belongs to another world.');
  const signer = account(c.runtime), options = { allowLocal: c.allowLocal };
  if (job.phase === 'quarantined') {
    let head = await verifyEvmRuntime(c.client, c.runtime, c.allowLocal);
    let request = await c.client.readContract({ address: c.runtime.collection, abi, functionName: 'request', args: [job.input.requestId], blockNumber: head.number! });
    if (request.tokenId !== BigInt(job.input.tokenId) || !same(request.player, job.input.player)) throw new EvmContextError('context', 'The quarantined day needs another check.');
    const data = encodeFunctionData({ abi, functionName: 'expire', args: [job.input.requestId] });
    const journalKey = `v2/recovery/${c.runtime.chainId}/${c.runtime.collection.toLowerCase()}/${job.input.requestId}`;
    const previous = (await store.get<EvmRelayJournal>(journalKey))?.value;
    if (previous || request.status === 1 && head.timestamp > request.deadline) {
      await terminalEvmTransaction(c.client, c.runtime, signer, { jobId: id, kind: 'expire', data, resultDigest: keccak256(data) }, async journal => { await store.put(journalKey, journal); }, { ...options, recoverJournal: previous });
      head = await verifyEvmRuntime(c.client, c.runtime, c.allowLocal);
      request = await c.client.readContract({ address: c.runtime.collection, abi, functionName: 'request', args: [job.input.requestId], blockNumber: head.number! });
    }
    if (request.status === 3 || request.status === 4) {
      if ((await c.client.getBlock({ blockNumber: head.number! })).hash !== head.hash) throw new EvmContextError('connection', 'Checking the released day again.');
      await updateStoredRecord<EvmJob>(store, id, () => { throw Error('Missing quarantined day'); }, j => { j.phase = request.status === 4 ? 'expired' : 'failed'; j.updatedAt = Date.now(); return j; });
      await finishJobBudget(job.campaignId, id, store);
      await reconcileEvmQuoteFunding(c.client, c.runtime, c.campaignId, store, c.allowLocal);
    }
    return evmJobView((await store.get<EvmJob>(id))!.value);
  }
  if (['queued', 'preparing'].includes(job.phase)) {
    if (job.lease && job.lease.until > Date.now()) return evmJobView(job);
    try { await prepareEvmJevJob(id, c.client, options); } catch { /* inspect durable failure/retry phase below */ }
  }
  job = (await store.get<EvmJob>(id))!.value;
  if (['prepared', 'saving'].includes(job.phase)) {
    try { await submitPreparedEvmJob(id, c.client, signer, options); } catch { /* uncertainty stays journaled */ }
  }
  job = (await store.get<EvmJob>(id))!.value;
  if (['failure_due', 'expiry_due'].includes(job.phase)) await settleEvmJobFailure(id, c.client, signer, options);
  return evmJobView((await store.get<EvmJob>(id))!.value);
}

/** Locate an acceptance by its exact block timestamp, without assuming RH block cadence. */
export async function findEvmAcceptance(client: PublicClient, runtime: EvmRuntimeIdentity, id: Hex, acceptedAt: bigint, head: bigint) {
  const lowerBound = async (timestamp: bigint) => {
    let lo = 0n, hi = head + 1n;
    while (lo < hi) {
      const mid = (lo + hi) / 2n;
      const block = await client.getBlock({ blockNumber: mid });
      if (block.timestamp < timestamp) lo = mid + 1n; else hi = mid;
    }
    return lo;
  };
  const fromBlock = await lowerBound(acceptedAt), until = await lowerBound(acceptedAt + 1n);
  if (fromBlock > head || until <= fromBlock) throw new EvmContextError('context', 'The accepted day needs another check.');
  const logs = await client.getLogs({ address: runtime.collection, event: acceptedEvent, args: { id }, fromBlock, toBlock: until - 1n, strict: true });
  if (logs.length !== 1 || !logs[0]!.transactionHash) throw new EvmContextError('context', 'The accepted day needs another check.');
  return logs[0]!.transactionHash;
}
/** Recovers a closed tab after payment, including an attempt never acknowledged by the browser. */
export async function reconcileEvmService() {
  if (!evmConfig().runtimeJson || !evmConfig().campaign) return;
  const errors: unknown[]=[];
  for(const scope of evmRuntimeScopes()) {
    try { await withEvmRuntimeScope(scope,()=>reconcileEvmScopedService()); }
    catch(error){ errors.push(error); }
  }
  // One scope having a connection problem must not starve the other's accepted work.
  if(errors.length)throw new AggregateError(errors,'Some saved days still need checking.');
}
async function reconcileEvmScopedService() {
  const c = connection(), store = storage(), head = await verifyEvmRuntime(c.client, c.runtime, c.allowLocal);
  let recovered = 0;
  for (const key of await store.list('v2/quotes/')) {
    const q = (await store.get<{ id: Hex; scope: string; campaignId: string; status: string }>(key))?.value;
    if (!q || q.status === 'retired' || q.campaignId !== c.campaignId || !q.scope.startsWith(`${c.runtime.chainId}:${c.runtime.collection.toLowerCase()}:`)) continue;
    const id = prefix(c.runtime) + q.id.toLowerCase();
    if (await store.get<EvmJob>(id)) continue;
    const journalKey = `v2/recovery/${c.runtime.chainId}/${c.runtime.collection.toLowerCase()}/${q.id}`;
    const previous = (await store.get<EvmRelayJournal>(journalKey))?.value;
    // A mined expiry may still have an uncertain shared wallet nonce. Recover it even
    // when the onchain request has already become terminal.
    if (previous) {
      if (++recovered > 8) break;
      await terminalEvmTransaction(c.client, c.runtime, account(c.runtime), { jobId: id, kind: 'expire', data: previous.data, resultDigest: previous.resultDigest }, async () => {}, { allowLocal: c.allowLocal, recoverJournal: previous });
      continue;
    }
    const request = await c.client.readContract({ address: c.runtime.collection, abi, functionName: 'request', args: [q.id], blockNumber: head.number! });
    if (request.status !== 1) continue;
    if (++recovered > 8) break;
    if (head.timestamp > request.deadline) {
      const data = encodeFunctionData({ abi, functionName: 'expire', args: [q.id] });
      await terminalEvmTransaction(c.client, c.runtime, account(c.runtime), { jobId: id, kind: 'expire', data, resultDigest: keccak256(data) }, async journal => { await store.put(journalKey, journal); }, { allowLocal: c.allowLocal });
    } else {
      const tx = await findEvmAcceptance(c.client, c.runtime, q.id, request.acceptedAt, head.number!);
      await acceptEvmJob(c.client, c.runtime, tx, request.player, c.campaignId, { requestId: q.id, allowLocal: c.allowLocal });
    }
  }
  await reconcileEvmQuoteFunding(c.client, c.runtime, c.campaignId, store, c.allowLocal);
  let dispatched = 0;
  for (const key of await store.list(prefix(c.runtime))) {
    const job = (await store.get<EvmJob>(key))?.value;
    if (!job || terminal(job) || job.lease && job.lease.until > Date.now() || job.phase === 'quarantined' && BigInt(job.input.deadline) >= head.timestamp) continue;
    if (++dispatched > 3) break;
    await dispatchEvmJob(key);
  }
}
