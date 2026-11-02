import { encodeAbiParameters, keccak256, parseAbi, toHex, type Address, type Hex, type PrivateKeyAccount, type PublicClient } from 'viem';
import { decodeState, kitItems } from '../../src/v2';
import { v2AdmissionTypedData, type V2Admission } from '../../src/chain/v2-admission';
import { storage, type DurableStore } from '../storage';
import { reserveV2JobBudget, finishV2JobBudget, updateV2Record } from './budget';
import { verifyV2Runtime, type V2RuntimeIdentity, V2ContextError } from './context';
import { v2DecisionConfig } from './preparation';

const abi = parseAbi([
  'function ownerOf(uint256 id) view returns(address)', 'function life(uint256 id) view returns(bytes)',
  'function revisions(uint256 id) view returns(uint32)', 'function attempts(uint256 id) view returns(uint32)',
  'function pending(uint256 id) view returns(bytes32)', 'function gasMultiplier() view returns(uint16)',
  'function admissionsPaused() view returns(bool)', 'function usedAdmissions(bytes32 id) view returns(bool)',
  'function quoteDay(uint256 id) view returns(uint256 maximum,uint256 pressure,uint256 capacity)',
  'function request(bytes32 id) view returns((uint256 tokenId,address player,uint32 baseRevision,uint32 day,uint64 kitMask,bool shipping,uint64 acceptedAt,uint64 deadline,bytes32 daySeed,bytes32 decisionConfig,bytes32 baseHash,uint256 pressure,uint256 reservedReward,uint8 status))',
]);
const zero = `0x${'0'.repeat(64)}`;
const equal = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const gasKey = (r: V2RuntimeIdentity) => `v2/control/relay-gas/${r.chainId}/${r.relayer.toLowerCase()}`;
const jobId = (r: V2RuntimeIdentity, id: Hex) => `v2/jobs/${r.chainId}/${r.collection.toLowerCase()}/${id.toLowerCase()}`;
interface QuoteRecord { scope: string; campaignId: string; generation: number; id: Hex; expiresAt: string; status: 'held' | 'retiring' | 'retired' }
interface GasLedger { holds: Record<string, string> }

/** Request network gas and developer relay expense are separate accounting paths. */
export function calculateV2ProcessingFee(input: { requestGas: bigint; relayGas: bigint; gasPrice: bigint; multiplier: number; inferenceReserveWei: bigint; hostingReserveWei?: bigint }) {
  const { requestGas, relayGas, gasPrice, multiplier, inferenceReserveWei } = input;
  if (requestGas <= 0n || relayGas <= 0n || gasPrice < 0n || inferenceReserveWei < 0n || (input.hostingReserveWei ?? 0n) < 0n || !Number.isInteger(multiplier) || multiplier < 1 || multiplier > 20) throw Error('Invalid native fee inputs.');
  const networkEstimate = requestGas * gasPrice, relayGasReserve = relayGas * 125n / 100n + 20_000n;
  const relayReserve = relayGasReserve * gasPrice * 2n; // Same price headroom as the shared relay outbox.
  const floor = relayReserve + inferenceReserveWei + (input.hostingReserveWei ?? 0n), markup = networkEstimate * BigInt(multiplier - 1);
  const processingFee = floor > markup ? floor : markup;
  return { networkEstimate, relayGasReserve, relayReserve, processingFee, totalEstimate: networkEstimate + processingFee };
}

/** Caller passes the authenticated session player, never a browser-claimed owner. */
export async function issueV2DayQuote(client: PublicClient, runtime: V2RuntimeIdentity, signer: PrivateKeyAccount,
  input: { player: Address; tokenId: bigint; kitMask: bigint; shipping?: boolean },
  options: { campaignId: string; store?: DurableStore; allowLocal?: boolean; requestGas?: bigint; relayGas?: bigint; inferenceReserveWei?: bigint; hostingReserveWei?: bigint }) {
  const store = options.store || storage(), block = await verifyV2Runtime(client, runtime, options.allowLocal);
  if (!equal(signer.address, runtime.quoteSigner) || runtime.decisionConfig !== v2DecisionConfig(runtime.rulesHash)) throw new V2ContextError('context', 'The preparation policy needs another check.');
  const at = { address: runtime.collection, abi, blockNumber: block.number! };
  const [owner, base, revision, attempts, pending, multiplier, paused, market, gasPrice, balance] = await Promise.all([
    client.readContract({ ...at, functionName: 'ownerOf', args: [input.tokenId] }),
    client.readContract({ ...at, functionName: 'life', args: [input.tokenId] }),
    client.readContract({ ...at, functionName: 'revisions', args: [input.tokenId] }),
    client.readContract({ ...at, functionName: 'attempts', args: [input.tokenId] }),
    client.readContract({ ...at, functionName: 'pending', args: [input.tokenId] }),
    client.readContract({ ...at, functionName: 'gasMultiplier' }), client.readContract({ ...at, functionName: 'admissionsPaused' }),
    client.readContract({ ...at, functionName: 'quoteDay', args: [input.tokenId] }), client.getGasPrice(), client.getBalance({ address: runtime.relayer, blockNumber: block.number! }),
  ]);
  const state = decodeState(base); const supplied = kitItems(input.kitMask);
  if ((await client.getBlock({ blockNumber: block.number! })).hash !== block.hash) throw new V2ContextError('connection', 'Checking this quote again.');
  if (!equal(owner, input.player) || !state.alive || pending !== zero || paused || supplied.some(i => state.inventory[i]! >= 0xffffffff)) throw new V2ContextError('context', 'This life cannot accept another day yet.');
  // V1 and V2 use the same signer nonce. Public migration must drain old obligations.
  const legacy = (await store.get<{ holds: Record<string, { status: string }> }>('control/admission-v1'))?.value;
  const oldRelay = (await store.get<{ pending?: unknown }>(`control/relay-${runtime.chainId}-${runtime.relayer.toLowerCase()}`))?.value;
  if (oldRelay?.pending || Object.values(legacy?.holds || {}).some(h => h.status === 'held' || h.status === 'accepted')) throw new V2ContextError('connection', 'An earlier preparation is still finishing.');
  await reconcileV2QuoteFunding(client, runtime, options.campaignId, store, options.allowLocal);
  const fees = calculateV2ProcessingFee({ requestGas: options.requestGas ?? 1_200_000n, relayGas: options.relayGas ?? 6_000_000n, gasPrice, multiplier,
    inferenceReserveWei: options.inferenceReserveWei ?? 0n, hostingReserveWei: options.hostingReserveWei });
  const scope = `${runtime.chainId}:${runtime.collection.toLowerCase()}:${input.player.toLowerCase()}:${input.tokenId}:${revision}:${attempts}`;
  const key = `v2/quotes/${keccak256(toHex(scope))}`;
  const record = await updateV2Record<QuoteRecord>(store, key, () => ({ scope, campaignId: options.campaignId, generation: 0, id: keccak256(encodeAbiParameters([{ type: 'string' }, { type: 'uint32' }], [scope, 0])), expiresAt: '0', status: 'held' }), q => {
    if (q.scope !== scope || (q.status !== 'retired' && q.campaignId !== options.campaignId) || q.status === 'retiring') throw new V2ContextError('context', 'Checking this quote again.');
    if (q.status === 'retired') { q.generation++; q.id = keccak256(encodeAbiParameters([{ type: 'string' }, { type: 'uint32' }], [scope, q.generation])); q.campaignId = options.campaignId; q.status = 'held'; }
    const next = block.timestamp + 120n; if (next > BigInt(q.expiresAt)) q.expiresAt = next.toString(); return q;
  });
  const fundingId = jobId(runtime, record.id);
  await reserveV2JobBudget(options.campaignId, fundingId, store);
  await updateV2Record<GasLedger>(store, gasKey(runtime), () => ({ holds: {} }), ledger => {
    if (Object.values(ledger.holds).some(v => typeof v !== 'string' || !/^(0|[1-9]\d*)$/.test(v))) throw new V2ContextError('context', 'The relay accounting needs another check.');
    const old = ledger.holds[fundingId] ? BigInt(ledger.holds[fundingId]!) : 0n, amount = old > fees.relayReserve ? old : fees.relayReserve;
    if (Object.entries(ledger.holds).filter(([k]) => k !== fundingId).reduce((sum, [, v]) => sum + BigInt(v), 0n) + amount > balance) throw new V2ContextError('connection', 'Preparation needs more relay capacity.');
    ledger.holds[fundingId] = amount.toString(); return ledger;
  });
  const [maximum, pressure, capacity] = market, marketBusy = maximum > capacity;
  const admission: V2Admission = { id: record.id, player: input.player, tokenId: input.tokenId, baseRevision: revision, kitMask: input.kitMask,
    shipping: input.shipping !== false && !marketBusy, processingFee: fees.processingFee, multiplier, expiresAt: BigInt(record.expiresAt), decisionConfig: runtime.decisionConfig };
  const signature = await signer.signTypedData(v2AdmissionTypedData(runtime.chainId, runtime.collection, admission));
  return { admission, signature, value: fees.processingFee.toString(), networkEstimate: fees.networkEstimate.toString(), totalEstimate: fees.totalEstimate.toString(),
    expiresAt: record.expiresAt, marketBusy, pressure: pressure.toString(), maximumReward: maximum.toString(), fundingId, quoteKey: key, relayReserve: fees.relayReserve.toString() };
}

/** Release only a proven terminal request or a strictly expired, finalized-unused permit. */
export async function retireV2Quote(client: PublicClient, runtime: V2RuntimeIdentity, quoteKey: string, campaignId: string, store: DurableStore = storage(), allowLocal = false) {
  const head = await verifyV2Runtime(client, runtime, allowLocal);
  const record = (await store.get<QuoteRecord>(quoteKey))?.value; if (!record || record.status === 'retired') return;
  if (record.campaignId !== campaignId || !record.scope.startsWith(`${runtime.chainId}:${runtime.collection.toLowerCase()}:`)) throw new V2ContextError('context', 'The quote belongs to another allocation.');
  const current = await client.readContract({ address: runtime.collection, abi, functionName: 'request', args: [record.id], blockNumber: head.number! });
  if (current.status < 2) {
    const finalized = await client.getBlock({ blockTag: 'finalized' });
    if (finalized.number === null || finalized.timestamp <= BigInt(record.expiresAt)) throw new V2ContextError('context', 'This quote is still being checked.');
    const at = { address: runtime.collection, abi, blockNumber: finalized.number };
    const [used, request] = await Promise.all([client.readContract({ ...at, functionName: 'usedAdmissions', args: [record.id] }), client.readContract({ ...at, functionName: 'request', args: [record.id] })]);
    if (used || request.status !== 0) throw new V2ContextError('context', 'This accepted day is still preparing.');
  } else if ((await client.getBlock({ blockNumber: head.number! })).hash !== head.hash) throw new V2ContextError('connection', 'Checking the saved day again.');
  await updateV2Record<QuoteRecord>(store, quoteKey, () => { throw Error('Missing quote'); }, q => {
    if (q.id !== record.id || q.expiresAt !== record.expiresAt || !['held','retiring'].includes(q.status)) throw new V2ContextError('context', 'This quote changed.'); q.status = 'retiring'; return q;
  });
  const id = jobId(runtime, record.id); await finishV2JobBudget(campaignId, id, store, true);
  await updateV2Record<GasLedger>(store, gasKey(runtime), () => ({ holds: {} }), ledger => { delete ledger.holds[id]; return ledger; });
  await updateV2Record<QuoteRecord>(store, quoteKey, () => { throw Error('Missing quote'); }, q => { if (q.id !== record.id || q.status !== 'retiring') throw new V2ContextError('context', 'This quote changed.'); q.status = 'retired'; return q; });
}

/** Server dispatcher and quote creation recover abandoned funding even when no quote reached the browser. */
export async function reconcileV2QuoteFunding(client: PublicClient, runtime: V2RuntimeIdentity, campaignId: string, store: DurableStore = storage(), allowLocal = false) {
  let checked = 0, retired = 0, waiting = 0;
  for (const key of await store.list('v2/quotes/')) {
    const record = (await store.get<QuoteRecord>(key))?.value;
    if (!record || record.status === 'retired' || record.campaignId !== campaignId || !record.scope.startsWith(`${runtime.chainId}:${runtime.collection.toLowerCase()}:`)) continue;
    if (++checked > 8) break;
    try { await retireV2Quote(client, runtime, key, campaignId, store, allowLocal); retired++; }
    catch (error) { if (error instanceof V2ContextError) waiting++; else throw error; }
  }
  return { checked: Math.min(checked, 8), retired, waiting };
}
