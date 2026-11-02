import { parseAbi, formatUnits, keccak256, toHex, type Address, type Hex } from 'viem';
import { decodeState, encodeState, encodeTrace, expandV2History, v2HistoryTraceHash } from '../../src/v2';
import type { V2PublicLife } from '../../src/v2/public';
export type { V2PublicLife } from '../../src/v2/public';
import { roosterTraits } from '../../src/art/rooster';
import { isHosted } from '../config';
import { storage } from '../storage';
import type { prepareV2 } from './preparation';
import { validateV2Identity, verifyV2Runtime, v2PublicClient, V2ContextError, type V2RuntimeIdentity } from './context';

const publicAbi = parseAbi([
  'error ERC721NonexistentToken(uint256 tokenId)',
  'function life(uint256 id) view returns (bytes)',
  'function lifeInfo(uint256 id) view returns (uint32 day,uint32 level,bool alive,uint32 revision,string name,bytes32 seed)',
  'function ownerOf(uint256 id) view returns (address)',
  'function purse(uint256 id) view returns (uint256)',
  'function purseNonce(uint256 id) view returns (uint256)',
  'function pending(uint256 id) view returns (bytes32)',
  'function token() view returns (address)',
  'function nativeMintPrice() view returns (uint256)',
  'function gasMultiplier() view returns (uint16)',
  'function dayRecord(uint256 id,uint32 day) view returns ((bytes32 requestId,bytes32 seed,bytes32 stateHash,bytes32 traceHash,bytes32 certificateHash,bytes32 replayCommitment,uint256 reward,bytes history))',
]);
const zeroHash = `0x${'0'.repeat(64)}`;
export class V2PublicError extends Error { constructor(public code: string, message: string, public status = 404) { super(message); } }

/** Public identity only; no keys, paid provider, admission ledger or transaction signer. */
export function v2ViewConnection() {
  const encoded = process.env.NEARLYHUMAN_V2_RUNTIME_JSON;
  if (!encoded) throw new V2PublicError('connection', 'This home is resting. Try again shortly.', 503);
  let runtime: V2RuntimeIdentity;
  try { runtime = JSON.parse(encoded); } catch { throw new V2PublicError('connection', 'This home is resting. Try again shortly.', 503); }
  const allowLocal = !isHosted() && process.env.NEARLYHUMAN_V2_LOCAL === '1';
  validateV2Identity(runtime, allowLocal);
  const rpcUrl = process.env.NEARLYHUMAN_V2_RPC_URL || 'https://rpc.testnet.chain.robinhood.com';
  return { runtime, allowLocal, rpcUrl, client: v2PublicClient(rpcUrl, runtime, allowLocal) };
}

export function v2TokenId(value: string): bigint {
  if (!/^[1-9]\d{0,77}$/.test(value) || BigInt(value) >= 1n << 256n) throw new V2PublicError('not_found', 'No rooster has that number.');
  return BigInt(value);
}
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
export async function readV2PublicLife(value: string, expectedWorld?: { chainId: number; collection: string }): Promise<V2PublicLife> {
  const { runtime, client, allowLocal } = v2ViewConnection();
  if (expectedWorld && (expectedWorld.chainId !== runtime.chainId || !same(expectedWorld.collection, runtime.collection))) throw new V2PublicError('not_found', 'This life belongs to another world.');
  const id = v2TokenId(value), block = await verifyV2Runtime(client, runtime, allowLocal);
  const at = { address: runtime.collection, abi: publicAbi, blockNumber: block.number! };
  const [raw, info, owner, balance, nonce, pending] = await Promise.all([
    client.readContract({ ...at, functionName: 'life', args: [id] }), client.readContract({ ...at, functionName: 'lifeInfo', args: [id] }),
    client.readContract({ ...at, functionName: 'ownerOf', args: [id] }), client.readContract({ ...at, functionName: 'purse', args: [id] }),
    client.readContract({ ...at, functionName: 'purseNonce', args: [id] }), client.readContract({ ...at, functionName: 'pending', args: [id] }),
  ]);
  const confirmed = await client.getBlock({ blockNumber: block.number! }), state = decodeState(raw);
  if (confirmed.hash !== block.hash || state.day !== info[0] || state.level !== info[1] || state.alive !== info[2] || state.seed !== info[5]) throw new V2ContextError('context', 'Checking the latest saved day. Try again.');
  return { version: 2, chainId: runtime.chainId, collection: runtime.collection, id: value, owner, name: info[4], revision: info[3], state,
    purseMicro: balance.toString(), purseNonce: nonce.toString(), ...(pending !== zeroHash ? { pendingRequest: pending } : {}), observedBlock: block.number!.toString() };
}

export async function readV2PublicConfig() {
  const { runtime, client, rpcUrl, allowLocal } = v2ViewConnection(), block = await verifyV2Runtime(client, runtime, allowLocal);
  const at = { address: runtime.collection, abi: publicAbi, blockNumber: block.number! };
  const [token, mintPrice, multiplier] = await Promise.all([
    client.readContract({ ...at, functionName: 'token' }), client.readContract({ ...at, functionName: 'nativeMintPrice' }), client.readContract({ ...at, functionName: 'gasMultiplier' }),
  ]);
  return { version: 2, chainId: runtime.chainId, collection: runtime.collection, rpcUrl, testnet: true, token, tokenDecimals: 6,
    nativeMintPrice: mintPrice.toString(), tokenMintPriceMicro: '250000000', multiplier, rulesHash: runtime.rulesHash, decisionConfig: runtime.decisionConfig };
}

export async function readV2PublicDay(value: string, day: number, expectedWorld?: { chainId: number; collection: string }) {
  if (!Number.isInteger(day) || day < 1 || day > 0xffffffff) throw new V2PublicError('not_found', 'That day could not be found.');
  const life = await readV2PublicLife(value, expectedWorld), { runtime, client } = v2ViewConnection();
  if (day > life.state.day) throw new V2PublicError('not_found', 'That day has not happened yet.');
  const record = await client.readContract({ address: runtime.collection, abi: publicAbi, functionName: 'dayRecord', args: [v2TokenId(value), day], blockNumber: BigInt(life.observedBlock) });
  if (record.requestId === zeroHash || record.history === '0x' || v2HistoryTraceHash(record.history) !== record.traceHash) throw new V2PublicError('not_found', 'That saved day could not be found.');
  return { life, day, requestId: record.requestId, seed: record.seed, stateHash: record.stateHash, traceHash: record.traceHash,
    certificateHash: record.certificateHash, commitment: record.replayCommitment, rewardMicro: record.reward.toString(), trace: expandV2History(record.history) };
}

/** Only a packet bound to the actual saved NFT day is returned as a film. */
export async function readV2PublicReplay(value: string, day?: number, expectedWorld?: { chainId: number; collection: string }) {
  const latest = day === undefined ? await readV2PublicLife(value, expectedWorld) : undefined;
  const saved = await readV2PublicDay(value, day ?? latest!.state.day, expectedWorld);
  type Packet = Awaited<ReturnType<typeof prepareV2>>['packet'];
  const found = await storage().get<Packet>(`v2/packets/${saved.commitment}`);
  if (!found) throw new V2PublicError('replay_unavailable', 'The film is resting. The saved day is still here.');
  const packet = found.value;
  if (keccak256(toHex(JSON.stringify(packet))) !== saved.commitment || packet.requestId !== saved.requestId
    || packet.stateHash !== saved.stateHash || keccak256(packet.state) !== saved.stateHash
    || keccak256(packet.trace) !== saved.traceHash || keccak256(packet.certificate) !== saved.certificateHash
    || packet.result.state.day !== saved.day || encodeState(packet.result.state) !== packet.state
    || encodeTrace(packet.result.trace) !== packet.trace) throw new V2ContextError('context', 'The saved film needs another check.');
  return { life: saved.life, packet, commitment: saved.commitment };
}

export function v2NftMetadata(life: V2PublicLife, origin: string) {
  const world = `chainId=${life.chainId}&collection=${life.collection}`, traits = roosterTraits(life.state.seed);
  return { name: `${life.name} #${life.id}`, description: 'A little life with a mind of its own, a home, belongings and an onchain purse.',
    image: `${origin}/api/v2/nft/${life.id}/image.svg?${world}`, external_url: `${origin}/?rooster=${life.id}&${world}`,
    attributes: [{ trait_type: 'Life', value: life.state.alive ? 'Alive' : 'Remembered' }, { trait_type: 'Level', value: life.state.level },
      { trait_type: 'Game day', value: life.state.day }, { trait_type: 'Purse', value: formatUnits(BigInt(life.purseMicro), 6) },
      ...['Body', 'Wits', 'Spirit'].map((name, i) => ({ trait_type: name, value: life.state.stats[i] })),
      { trait_type: 'Ready beds', value: life.state.plots.filter(p => p.kind && p.ticks === 0).length }, { trait_type: 'Headgear', value: traits.headgear }] };
}
