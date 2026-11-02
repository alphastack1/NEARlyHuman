import { createPublicClient, http, isAddress, keccak256, parseAbi, toHex, type Address, type Hex, type PublicClient } from 'viem';
import { decodeState, kitItems } from '../../src/v2';

export interface V2RuntimeIdentity {
  chainId: 46630 | 31337;
  collection: Address;
  verifier: Address;
  actionModule: Address;
  controllerCodeHash: Hex;
  verifierCodeHash: Hex;
  actionModuleCodeHash: Hex;
  rulesHash: Hex;
  decisionConfig: Hex;
  relayer: Address;
  quoteSigner: Address;
}

export interface V2AcceptedRequest {
  requestId: Hex;
  tokenId: bigint;
  player: Address;
  baseRevision: number;
  day: number;
  kitMask: bigint;
  shipping: boolean;
  acceptedAt: bigint;
  deadline: bigint;
  daySeed: Hex;
  decisionConfig: Hex;
  baseHash: Hex;
  pressure: bigint;
  reservedReward: bigint;
  status: number;
}

/** JSON-safe frozen worker input. A purse balance is intentionally absent. */
export interface V2FrozenInput {
  version: 2;
  runtime: V2RuntimeIdentity;
  requestId: Hex;
  tokenId: string;
  player: Address;
  baseRevision: number;
  day: number;
  kitMask: string;
  shipping: boolean;
  acceptedAt: string;
  deadline: string;
  daySeed: Hex;
  base: Hex;
  baseHash: Hex;
  pressure: string;
  reservedReward: string;
  acceptedBlock: string;
  acceptedBlockHash: Hex;
}

const identityAbi = parseAbi([
  'function verifier() view returns (address)',
  'function rulesHash() view returns (bytes32)',
  'function relayer() view returns (address)',
  'function quoteSigner() view returns (address)',
]);
const verifierAbi = parseAbi(['function actionModule() view returns (address)']);
const hash = (value: unknown): value is Hex => typeof value === 'string' && /^0x[0-9a-f]{64}$/i.test(value);
const equal = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
export class V2ContextError extends Error {
  constructor(public code: 'connection' | 'context' | 'expired', message: string) { super(message); }
}

export function validateV2Identity(identity: V2RuntimeIdentity, allowLocal = false): void {
  if (identity.chainId !== 46630 && !(allowLocal && identity.chainId === 31337)) throw new V2ContextError('connection', 'Choose Robinhood Testnet.');
  if (![identity.collection, identity.verifier, identity.actionModule, identity.relayer, identity.quoteSigner].every(a => isAddress(a))
    || ![identity.controllerCodeHash, identity.verifierCodeHash, identity.actionModuleCodeHash, identity.rulesHash, identity.decisionConfig].every(hash)) throw new V2ContextError('connection', 'The home connection needs another check.');
}

/** All reads share one canonical block; no signing or inference happens here. */
export async function verifyV2Runtime(client: PublicClient, identity: V2RuntimeIdentity, allowLocal = false) {
  validateV2Identity(identity, allowLocal);
  const [chainId, block] = await Promise.all([client.getChainId(), client.getBlock()]);
  if (chainId !== identity.chainId || block.number === null || !block.hash) throw new V2ContextError('connection', 'The home connection needs another check.');
  const at = { address: identity.collection, abi: identityAbi, blockNumber: block.number };
  const [controllerCode, verifierCode, moduleCode, moduleAddress, verifier, rulesHash, relayer, quoteSigner] = await Promise.all([
    client.getCode({ address: identity.collection, blockNumber: block.number }),
    client.getCode({ address: identity.verifier, blockNumber: block.number }),
    client.getCode({ address: identity.actionModule, blockNumber: block.number }),
    client.readContract({ address: identity.verifier, abi: verifierAbi, functionName: 'actionModule', blockNumber: block.number }),
    client.readContract({ ...at, functionName: 'verifier' }),
    client.readContract({ ...at, functionName: 'rulesHash' }),
    client.readContract({ ...at, functionName: 'relayer' }),
    client.readContract({ ...at, functionName: 'quoteSigner' }),
  ]);
  const confirmed = await client.getBlock({ blockNumber: block.number });
  if (!controllerCode || controllerCode === '0x' || !verifierCode || verifierCode === '0x' || !moduleCode || moduleCode === '0x'
    || !equal(keccak256(controllerCode), identity.controllerCodeHash)
    || !equal(keccak256(verifierCode), identity.verifierCodeHash)
    || !equal(moduleAddress, identity.actionModule) || !equal(keccak256(moduleCode), identity.actionModuleCodeHash)
    || !equal(verifier, identity.verifier) || !equal(rulesHash, identity.rulesHash)
    || !equal(relayer, identity.relayer) || !equal(quoteSigner, identity.quoteSigner)
    || confirmed.hash !== block.hash) throw new V2ContextError('connection', 'The home connection needs another check.');
  return block;
}

export function v2PublicClient(rpcUrl: string, identity: V2RuntimeIdentity, allowLocal = false) {
  validateV2Identity(identity, allowLocal);
  const url = new URL(rpcUrl);
  if (identity.chainId === 31337 && !['127.0.0.1', '[::1]'].includes(url.hostname)) throw new V2ContextError('connection', 'Local verification needs a local connection.');
  return createPublicClient({ transport: http(rpcUrl, { retryCount: 2, timeout: 10_000 }), cacheTime: 0 });
}

export function freezeV2Input(runtime: V2RuntimeIdentity, request: V2AcceptedRequest, base: Hex, acceptedBlock: bigint, acceptedBlockHash: Hex, allowLocal = false): V2FrozenInput {
  validateV2Identity(runtime, allowLocal);
  if (request.status !== 1 || !hash(request.requestId) || !hash(request.daySeed) || !hash(request.baseHash)
    || !hash(acceptedBlockHash) || !isAddress(request.player) || request.tokenId <= 0n
    || !Number.isInteger(request.baseRevision) || request.baseRevision < 0 || request.baseRevision > 0xffffffff
    || !Number.isInteger(request.day) || request.day < 1 || request.day > 0xffffffff
    || request.kitMask < 0n || request.kitMask >= 1n << 34n || typeof request.shipping !== 'boolean'
    || request.pressure < 0n || request.reservedReward < 0n || request.acceptedAt < 0n
    || request.deadline <= request.acceptedAt || request.deadline - request.acceptedAt !== 900n
    || acceptedBlock < 0n || !/^0x(?:[0-9a-f]{2})+$/i.test(base)
    || !equal(request.decisionConfig, runtime.decisionConfig) || !equal(keccak256(base), request.baseHash)
    || !request.shipping && request.reservedReward !== 0n) throw new V2ContextError('context', 'This accepted day needs another check.');
  return validateV2FrozenInput({
    version: 2, runtime: structuredClone(runtime), requestId: request.requestId, tokenId: request.tokenId.toString(),
    player: request.player, baseRevision: request.baseRevision, day: request.day, kitMask: request.kitMask.toString(),
    shipping: request.shipping, acceptedAt: request.acceptedAt.toString(), deadline: request.deadline.toString(),
    daySeed: request.daySeed, base, baseHash: request.baseHash, pressure: request.pressure.toString(),
    reservedReward: request.reservedReward.toString(), acceptedBlock: acceptedBlock.toString(), acceptedBlockHash,
  }, allowLocal);
}

/** Recheck persisted input before any provider call; JSON types are not a trust boundary. */
export function validateV2FrozenInput(raw: V2FrozenInput, allowLocal = false): V2FrozenInput {
  try {
    const input = structuredClone(raw);
    validateV2Identity(input.runtime, allowLocal);
    const uint = (v: unknown, bits: number): bigint => {
      if (typeof v !== 'string' || !/^(?:0|[1-9]\d*)$/.test(v) || v.length > 78) throw Error();
      const n = BigInt(v); if (n >= 1n << BigInt(bits)) throw Error(); return n;
    };
    const token = uint(input.tokenId, 256), kit = uint(input.kitMask, 64);
    const accepted = uint(input.acceptedAt, 64), deadline = uint(input.deadline, 64);
    const reserve = uint(input.reservedReward, 256); uint(input.pressure, 256); uint(input.acceptedBlock, 256);
    if (input.version !== 2 || token === 0n || !hash(input.requestId) || /^0x0{64}$/i.test(input.requestId)
      || !hash(input.daySeed) || !hash(input.baseHash) || !hash(input.acceptedBlockHash) || !isAddress(input.player)
      || !Number.isInteger(input.baseRevision) || input.baseRevision < 0 || input.baseRevision > 0xffffffff
      || !Number.isInteger(input.day) || input.day < 1 || input.day > 0xffffffff
      || typeof input.shipping !== 'boolean' || deadline !== accepted + 900n
      || reserve > 136n * 1_000_000n || (input.shipping ? reserve === 0n : reserve !== 0n)
      || typeof input.base !== 'string' || !/^0x(?:[0-9a-f]{2})+$/i.test(input.base)
      || !equal(keccak256(input.base), input.baseHash)) throw Error();
    kitItems(kit);
    const state = decodeState(input.base);
    if (!state.alive || state.day + 1 !== input.day || state.level !== state.day) throw Error();
    return input;
  } catch { throw new V2ContextError('context', 'This accepted day needs another check.'); }
}

/** Internal fence, not a replacement for the contract's signature/domain checks. */
export const v2WorkerInputHash = (input: V2FrozenInput): Hex => keccak256(toHex(JSON.stringify(input)));
