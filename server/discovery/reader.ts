import { createHash } from 'node:crypto';
import { parseAbi, type Address } from 'viem';
import { decodeState } from '../../src/v2';
import type { GamePublicLife } from '../../src/chain/game-types';
import type { DiscoveryWorld, DiscoveryWorldId, PublicLifeSummary } from '../../src/chain/discovery-types';
import { v2ViewConnection } from '../v2/views';
import { verifyV2Runtime } from '../v2/context';
import { nearRuntime, nearView, verifyNearRuntime } from '../near/rpc';
import { readNearPublicLife } from '../near/views';

/** A hard bound keeps one public refresh from becoming an unbounded RPC job. */
export const MAX_DISCOVERY_LIVES = 128;
const ABI = parseAbi([
  'function nextTokenId() view returns(uint256)',
  'function life(uint256 id) view returns(bytes)',
  'function lifeInfo(uint256 id) view returns(uint32 day,uint32 level,bool alive,uint32 revision,string name,bytes32 seed)',
  'function ownerOf(uint256 id) view returns(address)',
  'function purse(uint256 id) view returns(uint256)',
  'function pending(uint256 id) view returns(bytes32)',
]);
const zeroHash = `0x${'0'.repeat(64)}`;
export class DiscoveryError extends Error {
  constructor(public code: string, message: string, public status = 503) { super(message); this.name = 'DiscoveryError'; }
}
export interface DiscoveryDescriptor { world: DiscoveryWorld; fingerprint: string }
export interface DiscoveryRead { world: DiscoveryWorld; height: string; hash: string; items: PublicLifeSummary[] }
const fingerprint = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Configuration and public identity only. This never loads signer credentials. */
export function discoveryDescriptor(id: DiscoveryWorldId): DiscoveryDescriptor {
  if (id === 'robinhood-testnet') {
    const { runtime } = v2ViewConnection();
    if (runtime.chainId !== 46630) throw new DiscoveryError('not_found', 'Choose a collection to visit.', 404);
    return { world: { id, label: 'Robinhood Testnet', collection: runtime.collection, chainId: 46630 }, fingerprint: fingerprint(runtime) };
  }
  if (id === 'near-testnet' && process.env.NEARLYHUMAN_NEAR_ENABLED === '1') {
    const runtime = nearRuntime();
    return { world: { id, label: 'NEAR Testnet', collection: runtime.collection }, fingerprint: fingerprint(runtime) };
  }
  throw new DiscoveryError('not_found', 'Choose a collection to visit.', 404);
}

function boundedCount(value: bigint): number {
  if (value < 0n || value > BigInt(MAX_DISCOVERY_LIVES)) throw new DiscoveryError('collection_capacity', 'Could not refresh these lives. Try again shortly.');
  return Number(value);
}
function summary(life: Pick<GamePublicLife, 'id' | 'owner' | 'name' | 'state' | 'purseMicro' | 'pendingRequest'>): PublicLifeSummary {
  return { id: life.id, owner: life.owner, name: life.name, day: life.state.day, level: life.state.level, alive: life.state.alive,
    pending: !!life.pendingRequest, purseMicro: life.purseMicro, rank: 0,
    plantedBeds: life.state.plots.filter(plot => plot.kind > 0).length,
    readyBeds: life.state.plots.filter(plot => plot.kind > 0 && plot.ticks === 0).length };
}
async function limitedMap<T, R>(values: T[], read: (value: T) => Promise<R>): Promise<R[]> {
  const result = new Array<R>(values.length); let next = 0, stopped = false;
  await Promise.all(Array.from({ length: Math.min(4, values.length) }, async () => {
    while (!stopped && next < values.length) {
      const index = next++;
      try { result[index] = await read(values[index]!); } catch (error) { stopped = true; throw error; }
    }
  }));
  return result;
}

export async function readDiscoveryWorld(descriptor: DiscoveryDescriptor): Promise<DiscoveryRead> {
  if (descriptor.world.id === 'robinhood-testnet') {
    const { runtime, client, allowLocal } = v2ViewConnection();
    if (runtime.collection.toLowerCase() !== descriptor.world.collection.toLowerCase()) throw new DiscoveryError('connection', 'Checking these lives again.');
    const block = await verifyV2Runtime(client, runtime, allowLocal), at = { address: runtime.collection, abi: ABI, blockNumber: block.number! };
    const count = boundedCount(await client.readContract({ ...at, functionName: 'nextTokenId' }));
    // This deployed collection never burns remembered lives: minted IDs remain
    // contiguous. A missing ID fails the complete snapshot, never gets skipped.
    const items = await limitedMap(Array.from({ length: count }, (_, index) => BigInt(index + 1)), async id => {
      const [raw, info, owner, purse, pending] = await Promise.all([
        client.readContract({ ...at, functionName: 'life', args: [id] }),
        client.readContract({ ...at, functionName: 'lifeInfo', args: [id] }),
        client.readContract({ ...at, functionName: 'ownerOf', args: [id] }),
        client.readContract({ ...at, functionName: 'purse', args: [id] }),
        client.readContract({ ...at, functionName: 'pending', args: [id] }),
      ]);
      const state = decodeState(raw);
      if (state.day !== info[0] || state.level !== info[1] || state.alive !== info[2] || state.seed !== info[5] || /^0x0{40}$/i.test(owner)) throw new DiscoveryError('connection', 'Checking these lives again.');
      return summary({ id: id.toString(), owner: owner as Address, name: info[4], state, purseMicro: purse.toString(), ...(pending !== zeroHash ? { pendingRequest: pending } : {}) });
    });
    if ((await client.getBlock({ blockNumber: block.number! })).hash !== block.hash) throw new DiscoveryError('connection', 'Checking these lives again.');
    return { world: descriptor.world, height: block.number!.toString(), hash: block.hash!, items };
  }
  const runtime = nearRuntime();
  if (runtime.collection !== descriptor.world.collection) throw new DiscoveryError('connection', 'Checking these lives again.');
  const { block } = await verifyNearRuntime(runtime), count = boundedCount(BigInt(await nearView<string>(runtime, 'nft_total_supply', {}, block)));
  const tokens: { token_id: string; owner_id: string }[] = [];
  for (let offset = 0; offset < count; offset += 24) {
    const page = await nearView<{ token_id: string; owner_id: string }[]>(runtime, 'nft_tokens', { from_index: String(offset), limit: Math.min(24, count - offset) }, block);
    if (!Array.isArray(page) || page.length !== Math.min(24, count - offset) || page.some(token => !token || typeof token.token_id !== 'string' || typeof token.owner_id !== 'string')) throw new DiscoveryError('connection', 'Checking these lives again.');
    tokens.push(...page);
  }
  if (new Set(tokens.map(token => token.token_id)).size !== count) throw new DiscoveryError('connection', 'Checking these lives again.');
  const items = await limitedMap(tokens, async token => {
    const life = await readNearPublicLife(token.token_id, runtime, block);
    if (life.owner !== token.owner_id) throw new DiscoveryError('connection', 'Checking these lives again.');
    return summary(life);
  });
  return { world: descriptor.world, height: block.height, hash: block.hash, items };
}
