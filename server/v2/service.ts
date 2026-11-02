import { keccak256, parseAbi, parseAbiItem, type Address, type Hex, type PublicClient } from 'viem';
import { serverConfig, isHosted } from '../config';
import { ServiceError, serviceAccount } from '../chain';
import { dispatchBackground } from '../jobs';
import { storage } from '../storage';
import { v2ViewConnection } from './views';
import { verifyV2Runtime, V2ContextError, type V2RuntimeIdentity } from './context';
import { issueV2DayQuote, reconcileV2QuoteFunding } from './quotes';
import { acceptV2Job, prepareV2JevJob, settleV2JobFailure, submitPreparedV2Job, terminalV2Transaction, v2JobView, type V2Job, type V2RelayJournal } from './jobs';
import { encodeFunctionData } from 'viem';
import { finishV2JobBudget, updateV2Record } from './budget';

const abi = parseAbi([
  'function request(bytes32 id) view returns((uint256 tokenId,address player,uint32 baseRevision,uint32 day,uint64 kitMask,bool shipping,uint64 acceptedAt,uint64 deadline,bytes32 daySeed,bytes32 decisionConfig,bytes32 baseHash,uint256 pressure,uint256 reservedReward,uint8 status))',
  'function expire(bytes32 id)',
  'function dayRecord(uint256 id,uint32 day) view returns((bytes32 requestId,bytes32 seed,bytes32 stateHash,bytes32 traceHash,bytes32 certificateHash,bytes32 replayCommitment,uint256 reward,bytes history))',
]);
const acceptedEvent = parseAbiItem('event DayAccepted(bytes32 indexed id,uint256 indexed tokenId,address indexed player,uint256 reservedReward,bool shipping,bytes32 daySeed)');
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const prefix = (r: V2RuntimeIdentity) => `v2/jobs/${r.chainId}/${r.collection.toLowerCase()}/`;
const terminal = (j: V2Job) => ['ready', 'failed', 'expired'].includes(j.phase);
function connection() {
  const c = v2ViewConnection(), campaignId = process.env.NEARLYHUMAN_V2_CAMPAIGN;
  if (!campaignId || !/^[a-z0-9][a-z0-9-]{1,79}$/.test(campaignId)) throw new ServiceError('Preparation is resting. Try again shortly.', 'capacity', 503);
  if (c.runtime.chainId !== serverConfig().chainId && !c.allowLocal) throw new V2ContextError('context', 'The wallet connection needs another check.');
  return { ...c, campaignId };
}
function account(r: V2RuntimeIdentity) {
  const signer = serviceAccount();
  if (!same(signer.address, r.relayer) || !same(signer.address, r.quoteSigner)) throw new V2ContextError('context', 'The preparation signer needs another check.');
  return signer;
}
export async function quoteV2OwnerDay(player: Address, input: { tokenId: string; kitMask: string; shipping?: boolean }) {
  const c = connection();
  if (!/^[1-9]\d{0,77}$/.test(input.tokenId) || BigInt(input.tokenId) >= 1n << 256n || !/^(0|[1-9]\d{0,19})$/.test(input.kitMask) || BigInt(input.kitMask) >= 1n << 64n || input.shipping !== undefined && typeof input.shipping !== 'boolean') throw new ServiceError('Choose the supplies again.', 'format');
  const nativeAllowance = (name: string) => { const raw = process.env[name] || '0'; if (!/^(0|[1-9]\d{0,16})$/.test(raw) || BigInt(raw) > 10n ** 16n) throw new ServiceError('Preparation is resting. Try again shortly.', 'capacity', 503); return BigInt(raw); };
  return issueV2DayQuote(c.client, c.runtime, account(c.runtime), { player, tokenId: BigInt(input.tokenId), kitMask: BigInt(input.kitMask), shipping: input.shipping }, { campaignId: c.campaignId, allowLocal: c.allowLocal,
    inferenceReserveWei: nativeAllowance('NEARLYHUMAN_V2_INFERENCE_RESERVE_WEI'), hostingReserveWei: nativeAllowance('NEARLYHUMAN_V2_HOSTING_RESERVE_WEI') });
}
async function ownerJob(id: Hex, player: Address) {
  const c = connection(), job = (await storage().get<V2Job>(prefix(c.runtime) + id.toLowerCase()))?.value;
  if (!job || !same(job.input.player, player)) throw new ServiceError('That day could not be found.', 'not_found', 404);
  return job;
}
export async function getV2OwnerJob(id: Hex, player: Address) {
  try{return v2JobView(await ownerJob(id,player));}catch(error){if(!(error instanceof ServiceError)||error.code!=='not_found')throw error;}
  const c=connection(),head=await verifyV2Runtime(c.client,c.runtime,c.allowLocal),q=await c.client.readContract({address:c.runtime.collection,abi,functionName:'request',args:[id],blockNumber:head.number!});
  if(q.status===0||!same(q.player,player))throw new ServiceError('That day could not be found.','not_found',404);
  const saved=q.status===2?await c.client.readContract({address:c.runtime.collection,abi,functionName:'dayRecord',args:[q.tokenId,q.day],blockNumber:head.number!}):undefined;
  if(saved&&saved.requestId!==id)throw new V2ContextError('context','Checking this saved day again.');
  if((await c.client.getBlock({blockNumber:head.number!})).hash!==head.hash)throw new V2ContextError('connection','Checking this day again.');
  // A paid receipt can precede its durable acknowledgement. This view does not
  // invent a job, buy inference or release a financial hold.
  return {requestId:id,tokenId:q.tokenId.toString(),phase:q.status===2?'ready' as const:q.status===3?'failed' as const:q.status===4?'expired' as const:'queued' as const,decisions:0,updatedAt:Date.now(),...(saved?{commitment:saved.replayCommitment}:{}),retrySafe:q.status===3||q.status===4};
}
export async function acceptV2OwnerDay(tx: Hex, player: Address, requestId?: Hex) {
  const c = connection();
  if (requestId) {
    const existing = (await storage().get<V2Job>(prefix(c.runtime) + requestId.toLowerCase()))?.value;
    if (existing && same(existing.input.player, player) && existing.ownerTx && same(existing.ownerTx, tx)) {
      if (!terminal(existing)) { try { await dispatchV2Job(existing.id); } catch { /* the accepted job is already durable */ } }
      return v2JobView(existing);
    }
  }
  const job = await acceptV2Job(c.client, c.runtime, tx, player, c.campaignId, { allowLocal: c.allowLocal, requestId });
  // Acceptance is durable before dispatch. A lost background acknowledgement is recoverable.
  try { await dispatchV2Job(job.id); } catch { /* scheduled reconciler owns the durable queue */ }
  return v2JobView(job);
}
export async function wakeV2OwnerDay(id: Hex, player: Address) {
  let job:V2Job;
  try{job=await ownerJob(id,player);}catch(error){
    if(!(error instanceof ServiceError)||error.code!=='not_found')throw error;
    const c=connection(),head=await verifyV2Runtime(c.client,c.runtime,c.allowLocal),q=await c.client.readContract({address:c.runtime.collection,abi,functionName:'request',args:[id],blockNumber:head.number!});
    if(q.status===0||!same(q.player,player))throw new ServiceError('That day could not be found.','not_found',404);
    if(q.status===1&&head.timestamp<=q.deadline){const tx=await findV2Acceptance(c.client,c.runtime,id,q.acceptedAt,head.number!);return acceptV2OwnerDay(tx,player,id);}
    if(q.status===1){const data=encodeFunctionData({abi,functionName:'expire',args:[id]}),jobId=prefix(c.runtime)+id.toLowerCase(),key=`v2/recovery/${c.runtime.chainId}/${c.runtime.collection.toLowerCase()}/${id}`,previous=(await storage().get<V2RelayJournal>(key))?.value;await terminalV2Transaction(c.client,c.runtime,account(c.runtime),{jobId,kind:'expire',data,resultDigest:keccak256(data)},async journal=>{await storage().put(key,journal);},{allowLocal:c.allowLocal,recoverJournal:previous});}
    await reconcileV2QuoteFunding(c.client,c.runtime,c.campaignId,storage(),c.allowLocal);return getV2OwnerJob(id,player);
  }
  if (!terminal(job)) await dispatchV2Job(job.id);
  return v2JobView(job);
}
const localRunning = new Set<string>();
export async function dispatchV2Job(id: string) {
  const c = connection();
  if (!id.startsWith(prefix(c.runtime)) || !/^0x[0-9a-f]{64}$/.test(id.slice(prefix(c.runtime).length))) throw new ServiceError('That day could not be found.', 'not_found', 404);
  if (isHosted()) return dispatchBackground({ version: 2, jobId: id });
  if (localRunning.has(id)) return;
  localRunning.add(id);
  setTimeout(() => { void runV2QueueJob(id).catch(() => {}).finally(() => localRunning.delete(id)); }, 0);
}
/** One durable preparation then one canonical save. Re-entry never buys a duplicate answer. */
export async function runV2QueueJob(id: string) {
  const c = connection(), store = storage();
  if (!id.startsWith(prefix(c.runtime)) || !/^0x[0-9a-f]{64}$/.test(id.slice(prefix(c.runtime).length))) throw new V2ContextError('context', 'Invalid queued day.');
  let job = (await store.get<V2Job>(id))?.value;
  if (!job || job.campaignId !== c.campaignId || !same(job.input.runtime.collection, c.runtime.collection)) throw new V2ContextError('context', 'The queued day belongs to another world.');
  const signer = account(c.runtime), options = { allowLocal: c.allowLocal };
  if (job.phase === 'quarantined') {
    let head = await verifyV2Runtime(c.client, c.runtime, c.allowLocal);
    let request = await c.client.readContract({ address: c.runtime.collection, abi, functionName: 'request', args: [job.input.requestId], blockNumber: head.number! });
    if (request.tokenId !== BigInt(job.input.tokenId) || !same(request.player, job.input.player)) throw new V2ContextError('context', 'The quarantined day needs another check.');
    const data = encodeFunctionData({ abi, functionName: 'expire', args: [job.input.requestId] });
    const journalKey = `v2/recovery/${c.runtime.chainId}/${c.runtime.collection.toLowerCase()}/${job.input.requestId}`;
    const previous = (await store.get<V2RelayJournal>(journalKey))?.value;
    if (previous || request.status === 1 && head.timestamp > request.deadline) {
      await terminalV2Transaction(c.client, c.runtime, signer, { jobId: id, kind: 'expire', data, resultDigest: keccak256(data) }, async journal => { await store.put(journalKey, journal); }, { ...options, recoverJournal: previous });
      head = await verifyV2Runtime(c.client, c.runtime, c.allowLocal);
      request = await c.client.readContract({ address: c.runtime.collection, abi, functionName: 'request', args: [job.input.requestId], blockNumber: head.number! });
    }
    if (request.status === 3 || request.status === 4) {
      if ((await c.client.getBlock({ blockNumber: head.number! })).hash !== head.hash) throw new V2ContextError('connection', 'Checking the released day again.');
      await updateV2Record<V2Job>(store, id, () => { throw Error('Missing quarantined day'); }, j => { j.phase = request.status === 4 ? 'expired' : 'failed'; j.updatedAt = Date.now(); return j; });
      await finishV2JobBudget(job.campaignId, id, store);
      await reconcileV2QuoteFunding(c.client, c.runtime, c.campaignId, store, c.allowLocal);
    }
    return v2JobView((await store.get<V2Job>(id))!.value);
  }
  if (['queued', 'preparing'].includes(job.phase)) {
    if (job.lease && job.lease.until > Date.now()) return v2JobView(job);
    try { await prepareV2JevJob(id, c.client, options); } catch { /* inspect durable failure/retry phase below */ }
  }
  job = (await store.get<V2Job>(id))!.value;
  if (['prepared', 'saving'].includes(job.phase)) {
    try { await submitPreparedV2Job(id, c.client, signer, options); } catch { /* uncertainty stays journaled */ }
  }
  job = (await store.get<V2Job>(id))!.value;
  if (['failure_due', 'expiry_due'].includes(job.phase)) await settleV2JobFailure(id, c.client, signer, options);
  return v2JobView((await store.get<V2Job>(id))!.value);
}

/** Locate an acceptance by its exact block timestamp, without assuming RH block cadence. */
export async function findV2Acceptance(client: PublicClient, runtime: V2RuntimeIdentity, id: Hex, acceptedAt: bigint, head: bigint) {
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
  if (fromBlock > head || until <= fromBlock) throw new V2ContextError('context', 'The accepted day needs another check.');
  const logs = await client.getLogs({ address: runtime.collection, event: acceptedEvent, args: { id }, fromBlock, toBlock: until - 1n, strict: true });
  if (logs.length !== 1 || !logs[0]!.transactionHash) throw new V2ContextError('context', 'The accepted day needs another check.');
  return logs[0]!.transactionHash;
}
/** Recovers a closed tab after payment, including an attempt never acknowledged by the browser. */
export async function reconcileV2Service() {
  if (!process.env.NEARLYHUMAN_V2_RUNTIME_JSON || !process.env.NEARLYHUMAN_V2_CAMPAIGN) return;
  const c = connection(), store = storage(), head = await verifyV2Runtime(c.client, c.runtime, c.allowLocal);
  let recovered = 0;
  for (const key of await store.list('v2/quotes/')) {
    const q = (await store.get<{ id: Hex; scope: string; campaignId: string; status: string }>(key))?.value;
    if (!q || q.status === 'retired' || q.campaignId !== c.campaignId || !q.scope.startsWith(`${c.runtime.chainId}:${c.runtime.collection.toLowerCase()}:`)) continue;
    const id = prefix(c.runtime) + q.id.toLowerCase();
    if (await store.get<V2Job>(id)) continue;
    const journalKey = `v2/recovery/${c.runtime.chainId}/${c.runtime.collection.toLowerCase()}/${q.id}`;
    const previous = (await store.get<V2RelayJournal>(journalKey))?.value;
    // A mined expiry may still have an uncertain shared wallet nonce. Recover it even
    // when the onchain request has already become terminal.
    if (previous) {
      if (++recovered > 8) break;
      await terminalV2Transaction(c.client, c.runtime, account(c.runtime), { jobId: id, kind: 'expire', data: previous.data, resultDigest: previous.resultDigest }, async () => {}, { allowLocal: c.allowLocal, recoverJournal: previous });
      continue;
    }
    const request = await c.client.readContract({ address: c.runtime.collection, abi, functionName: 'request', args: [q.id], blockNumber: head.number! });
    if (request.status !== 1) continue;
    if (++recovered > 8) break;
    if (head.timestamp > request.deadline) {
      const data = encodeFunctionData({ abi, functionName: 'expire', args: [q.id] });
      await terminalV2Transaction(c.client, c.runtime, account(c.runtime), { jobId: id, kind: 'expire', data, resultDigest: keccak256(data) }, async journal => { await store.put(journalKey, journal); }, { allowLocal: c.allowLocal });
    } else {
      const tx = await findV2Acceptance(c.client, c.runtime, q.id, request.acceptedAt, head.number!);
      await acceptV2Job(c.client, c.runtime, tx, request.player, c.campaignId, { requestId: q.id, allowLocal: c.allowLocal });
    }
  }
  await reconcileV2QuoteFunding(c.client, c.runtime, c.campaignId, store, c.allowLocal);
  let dispatched = 0;
  for (const key of await store.list(prefix(c.runtime))) {
    const job = (await store.get<V2Job>(key))?.value;
    if (!job || terminal(job) || job.lease && job.lease.until > Date.now() || job.phase === 'quarantined' && BigInt(job.input.deadline) >= head.timestamp) continue;
    if (++dispatched > 3) break;
    await dispatchV2Job(key);
  }
}
