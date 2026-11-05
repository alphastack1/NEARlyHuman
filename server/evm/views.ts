import { parseAbi, formatUnits, keccak256, toHex, isAddress, type Address, type Hex } from 'viem';
import { decodeState, encodeState, encodeTrace, expandHistory, historyTraceHash } from '../../src/domain';
import type { EvmPublicLife } from '../../src/chain/evm-types';
export type { EvmPublicLife } from '../../src/chain/evm-types';
import { roosterTraits } from '../../src/art/rooster';
import { storage } from '../storage';
import type { prepareDay } from './preparation';
import { verifyEvmRuntime, evmPublicClient, EvmContextError } from './context';
import { networkForEvmChain } from '../../src/chain/networks';
import { currentEvmRuntimeScope, evmCanonicalLifePath } from './runtime-scope';

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
  'function admissionsPaused() view returns(bool)',
  'function nhcTransferBurn() view returns(bool enabled,uint16 bps,uint256 burned)',
  'function balanceOf(address holder) view returns(uint256)',
  'function ownedTokens(address holder,uint256 cursor,uint256 limit) view returns(uint256[] ids,uint256 next)',
  'function request(bytes32 id) view returns((uint256 tokenId,address player,uint32 baseRevision,uint32 day,uint64 kitMask,bool shipping,uint64 acceptedAt,uint64 deadline,bytes32 daySeed,bytes32 decisionConfig,bytes32 baseHash,uint256 pressure,uint256 reservedReward,uint8 status))',
  'function dayRecord(uint256 id,uint32 day) view returns ((bytes32 requestId,bytes32 seed,bytes32 stateHash,bytes32 traceHash,bytes32 certificateHash,bytes32 replayCommitment,uint256 reward,bytes history))',
]);
const zeroHash = `0x${'0'.repeat(64)}`;
export class EvmPublicError extends Error { constructor(public code: string, message: string, public status = 404) { super(message); } }

/** Public identity only; no keys, paid provider, admission ledger or transaction signer. */
export function evmViewConnection() {
  const scope = currentEvmRuntimeScope();
  return { ...scope, client: evmPublicClient(scope.rpcUrl, scope.runtime, scope.allowLocal) };
}

export function evmTokenId(value: string): bigint {
  if (!/^[1-9]\d{0,77}$/.test(value) || BigInt(value) >= 1n << 256n) throw new EvmPublicError('not_found', 'No rooster has that number.');
  return BigInt(value);
}
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
export async function readEvmPublicLife(value: string, expectedWorld?: { chainId: number; collection: string }): Promise<EvmPublicLife> {
  const { runtime, client, allowLocal } = evmViewConnection();
  if (expectedWorld && (expectedWorld.chainId !== runtime.chainId || !same(expectedWorld.collection, runtime.collection))) throw new EvmPublicError('not_found', 'This life belongs to another world.');
  const id = evmTokenId(value), block = await verifyEvmRuntime(client, runtime, allowLocal);
  const at = { address: runtime.collection, abi: publicAbi, blockNumber: block.number! };
  const [raw, info, owner, balance, nonce, pending] = await Promise.all([
    client.readContract({ ...at, functionName: 'life', args: [id] }), client.readContract({ ...at, functionName: 'lifeInfo', args: [id] }),
    client.readContract({ ...at, functionName: 'ownerOf', args: [id] }), client.readContract({ ...at, functionName: 'purse', args: [id] }),
    client.readContract({ ...at, functionName: 'purseNonce', args: [id] }), client.readContract({ ...at, functionName: 'pending', args: [id] }),
  ]);
  const confirmed = await client.getBlock({ blockNumber: block.number! }), state = decodeState(raw);
  if (confirmed.hash !== block.hash || state.day !== info[0] || state.level !== info[1] || state.alive !== info[2] || state.seed !== info[5]) throw new EvmContextError('context', 'Checking the latest saved day. Try again.');
  return { version: 2, chainId: runtime.chainId, collection: runtime.collection, id: value, owner, name: info[4], revision: info[3], state,
    purseMicro: balance.toString(), purseNonce: nonce.toString(), ...(pending !== zeroHash ? { pendingRequest: pending } : {}), observedBlock: block.number!.toString(),observedBlockHash:block.hash! };
}

export async function readEvmPublicConfig() {
  const { runtime, client, rpcUrl, allowLocal, admissionsEnabled, guest } = evmViewConnection(), block = await verifyEvmRuntime(client, runtime, allowLocal);
  const at = { address: runtime.collection, abi: publicAbi, blockNumber: block.number! };
  const [token, mintPrice, multiplier, paused, burn] = await Promise.all([
    client.readContract({ ...at, functionName: 'token' }), client.readContract({ ...at, functionName: 'nativeMintPrice' }), client.readContract({ ...at, functionName: 'gasMultiplier' }),
    client.readContract({ ...at, functionName: 'admissionsPaused' }),
    admissionsEnabled ? client.readContract({ ...at, functionName: 'nhcTransferBurn' }) : Promise.resolve(undefined),
  ]);
  if((await client.getBlock({blockNumber:block.number!})).hash!==block.hash)throw new EvmContextError('connection','Checking the home connection again.');
  const network = networkForEvmChain(runtime.chainId);
  return { version: 2, chainId: runtime.chainId, collection: runtime.collection, rpcUrl, testnet: true, token, tokenDecimals: 6,
    ...(network ? { networkId: network.id, availableNetworks: [network.id] } : {}),
    nativeMintPrice: mintPrice.toString(), tokenMintPriceMicro: '250000000', multiplier, rulesHash: runtime.rulesHash, decisionConfig: runtime.decisionConfig,
    admissionsEnabled: admissionsEnabled && !paused, ...(burn ? { transferBurn: { enabled: burn[0], bps: burn[1], totalBurned: burn[2].toString() } } : {}),
    verifier:runtime.verifier,actionModule:runtime.actionModule,controllerCodeHash:runtime.controllerCodeHash,verifierCodeHash:runtime.verifierCodeHash,actionModuleCodeHash:runtime.actionModuleCodeHash,relayer:runtime.relayer,quoteSigner:runtime.quoteSigner,
    ...(guest ? { guest } : {}) };
}

export async function readEvmPublicLives(owner:string,cursor='0') {
  if(!isAddress(owner)||!/^(0|[1-9]\d{0,77})$/.test(cursor)||BigInt(cursor)>=1n<<256n)throw new EvmPublicError('not_found','Choose a wallet to visit.');
  const {runtime,client,allowLocal}=evmViewConnection(),block=await verifyEvmRuntime(client,runtime,allowLocal),at={address:runtime.collection,abi:publicAbi,blockNumber:block.number!};
  const [[ids,next],balance]=await Promise.all([client.readContract({...at,functionName:'ownedTokens',args:[owner as Address,BigInt(cursor),8n]}),client.readContract({...at,functionName:'balanceOf',args:[owner as Address]})]);
  const lives=await Promise.all(ids.map(async id=>{
    const [raw,info,holder,purse,nonce,pending]=await Promise.all([client.readContract({...at,functionName:'life',args:[id]}),client.readContract({...at,functionName:'lifeInfo',args:[id]}),client.readContract({...at,functionName:'ownerOf',args:[id]}),client.readContract({...at,functionName:'purse',args:[id]}),client.readContract({...at,functionName:'purseNonce',args:[id]}),client.readContract({...at,functionName:'pending',args:[id]})]);
    const state=decodeState(raw);if(!same(holder,owner)||state.day!==info[0]||state.level!==info[1]||state.alive!==info[2]||state.seed!==info[5])throw new EvmContextError('context','Checking these homes again.');
    return {version:2 as const,chainId:runtime.chainId,collection:runtime.collection,id:id.toString(),owner:holder,name:info[4],revision:info[3],state,purseMicro:purse.toString(),purseNonce:nonce.toString(),...(pending!==zeroHash?{pendingRequest:pending}:{}),observedBlock:block.number!.toString(),observedBlockHash:block.hash!};
  }));
  if((await client.getBlock({blockNumber:block.number!})).hash!==block.hash)throw new EvmContextError('connection','Checking these homes again.');
  return {lives,...(next<balance?{nextCursor:next.toString()}:{})};
}

export async function readEvmPublicRequest(id:Hex) {
  const {runtime,client,allowLocal}=evmViewConnection(),block=await verifyEvmRuntime(client,runtime,allowLocal);
  const q=await client.readContract({address:runtime.collection,abi:publicAbi,functionName:'request',args:[id],blockNumber:block.number!});
  if(q.status===0)throw new EvmPublicError('not_found','That day has not been accepted.');
  if((await client.getBlock({blockNumber:block.number!})).hash!==block.hash)throw new EvmContextError('connection','Checking this day again.');
  return {requestId:id,tokenId:q.tokenId.toString(),player:q.player,day:q.day,deadline:q.deadline.toString(),acceptedAt:q.acceptedAt.toString(),status:q.status,chainTimestamp:block.timestamp.toString()};
}

export async function readEvmPublicDays(value:string,before?:number,expectedWorld?:{chainId:number;collection:string}) {
  const life=await readEvmPublicLife(value,expectedWorld),{runtime,client}=evmViewConnection();
  if(before!==undefined&&(!Number.isInteger(before)||before<1||before>0xffffffff))throw new EvmPublicError('not_found','That day could not be found.');
  const last=Math.min(life.state.day,before===undefined?life.state.day:before-1),first=Math.max(1,last-11);
  const days=await Promise.all(Array.from({length:Math.max(0,last-first+1)},(_,i)=>last-i).map(async day=>{
    const r=await client.readContract({address:runtime.collection,abi:publicAbi,functionName:'dayRecord',args:[evmTokenId(value),day],blockNumber:BigInt(life.observedBlock)});
    if(r.requestId===zeroHash||historyTraceHash(r.history)!==r.traceHash)throw new EvmContextError('context','Checking the saved days again.');
    return {day,rewardMicro:r.reward.toString(),requestId:r.requestId,commitment:r.replayCommitment};
  }));
  if((await client.getBlock({blockNumber:BigInt(life.observedBlock)})).hash!==life.observedBlockHash)throw new EvmContextError('connection','Checking the saved days again.');
  return {days,...(first>1?{nextBefore:first}:{})};
}
export async function readEvmPublicGuest() {
  const guest = evmViewConnection().guest;
  if(!guest)throw new EvmPublicError('not_found','Choose a life to visit.');
  return readEvmPublicReplay(guest.id,guest.day);
}

export async function readEvmPublicDay(value: string, day: number, expectedWorld?: { chainId: number; collection: string }) {
  if (!Number.isInteger(day) || day < 1 || day > 0xffffffff) throw new EvmPublicError('not_found', 'That day could not be found.');
  const life = await readEvmPublicLife(value, expectedWorld), { runtime, client } = evmViewConnection();
  if (day > life.state.day) throw new EvmPublicError('not_found', 'That day has not happened yet.');
  const record = await client.readContract({ address: runtime.collection, abi: publicAbi, functionName: 'dayRecord', args: [evmTokenId(value), day], blockNumber: BigInt(life.observedBlock) });
  if((await client.getBlock({blockNumber:BigInt(life.observedBlock)})).hash!==life.observedBlockHash)throw new EvmContextError('connection','Checking this saved day again.');
  if (record.requestId === zeroHash || record.history === '0x' || historyTraceHash(record.history) !== record.traceHash) throw new EvmPublicError('not_found', 'That saved day could not be found.');
  return { life, day, requestId: record.requestId, seed: record.seed, stateHash: record.stateHash, traceHash: record.traceHash,
    certificateHash: record.certificateHash, commitment: record.replayCommitment, rewardMicro: record.reward.toString(), trace: expandHistory(record.history) };
}

/** Only a packet bound to the actual saved NFT day is returned as a film. */
export async function readEvmPublicReplay(value: string, day?: number, expectedWorld?: { chainId: number; collection: string }) {
  const latest = day === undefined ? await readEvmPublicLife(value, expectedWorld) : undefined;
  const saved = await readEvmPublicDay(value, day ?? latest!.state.day, expectedWorld);
  type Packet = Awaited<ReturnType<typeof prepareDay>>['packet'];
  const found = await storage().get<Packet>(`v2/packets/${saved.commitment}`);
  if (!found) throw new EvmPublicError('replay_unavailable', 'The film is resting. The saved day is still here.');
  const packet = found.value;
  if (keccak256(toHex(JSON.stringify(packet))) !== saved.commitment || packet.requestId !== saved.requestId
    || packet.stateHash !== saved.stateHash || keccak256(packet.state) !== saved.stateHash
    || keccak256(packet.trace) !== saved.traceHash || keccak256(packet.certificate) !== saved.certificateHash
    || packet.result.state.day !== saved.day || encodeState(packet.result.state) !== packet.state
    || encodeTrace(packet.result.trace) !== packet.trace || packet.rewardMicro !== saved.rewardMicro) throw new EvmContextError('context', 'The saved film needs another check.');
  return { life: saved.life, packet, commitment: saved.commitment };
}

export function evmNftMetadata(life: EvmPublicLife, origin: string) {
  const world = `chainId=${life.chainId}&collection=${life.collection}`, traits = roosterTraits(life.state.seed);
  return { name: `${life.name} #${life.id}`, description: 'An AI-led rooster NFT with a saved home, inventory and token purse. Its portrait reflects its recorded life.',
    image: `${origin}/api/evm/nft/${life.id}/image.svg?${world}`, external_url: `${origin}${evmCanonicalLifePath(life.chainId, life.collection, life.id)}`,
    attributes: [{ trait_type: 'Life', value: life.state.alive ? 'Alive' : 'Remembered' }, { trait_type: 'Level', value: life.state.level },
      { trait_type: 'Game day', value: life.state.day }, { trait_type: 'Purse', value: formatUnits(BigInt(life.purseMicro), 6) },
      ...['Body', 'Wits', 'Spirit'].map((name, i) => ({ trait_type: name, value: life.state.stats[i] })),
      { trait_type: 'Ready beds', value: life.state.plots.filter(p => p.kind && p.ticks === 0).length }, { trait_type: 'Headgear', value: traits.headgear }] };
}
