import { encodeAbiParameters, keccak256, zeroHash, type Address, type Hex } from 'viem';

export type AdmissionPermit = {
  id: Hex;
  player: Address;
  operation: number;
  tokenId: bigint;
  baseRevision: number;
  delivery: number;
  parametersHash: Hex;
  networkFee: bigint;
  processingFee: bigint;
  mintFee: bigint;
  multiplier: number;
  expiresAt: bigint;
  window: number;
  rulesVersion: number;
  decisionConfig: Hex;
};

export const permitTypes = {
  Permit: [
    { name: 'id', type: 'bytes32' },
    { name: 'player', type: 'address' },
    { name: 'operation', type: 'uint8' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'baseRevision', type: 'uint32' },
    { name: 'delivery', type: 'uint16' },
    { name: 'parametersHash', type: 'bytes32' },
    { name: 'networkFee', type: 'uint256' },
    { name: 'processingFee', type: 'uint256' },
    { name: 'mintFee', type: 'uint256' },
    { name: 'multiplier', type: 'uint16' },
    { name: 'expiresAt', type: 'uint64' },
    { name: 'window', type: 'uint32' },
    { name: 'rulesVersion', type: 'uint32' },
    { name: 'decisionConfig', type: 'bytes32' },
  ],
} as const;

export function permitTypedData(chainId: number, collection: Address, message: AdmissionPermit) {
  return {
    domain: { name: 'NEARlyHuman', version: '1', chainId, verifyingContract: collection },
    primaryType: 'Permit' as const,
    types: permitTypes,
    message,
  };
}

export function mintParametersHash(name: string, stats: { body: number; wits: number; spirit: number }): Hex {
  return keccak256(encodeAbiParameters(
    [{ type: 'string' }, { type: 'uint8' }, { type: 'uint8' }, { type: 'uint8' }],
    [name, stats.body, stats.wits, stats.spirit],
  ));
}

export function encodeDelivery(indices: readonly number[]): number {
  if (indices.length > 3 || new Set(indices).size !== indices.length || indices.some(i => !Number.isInteger(i) || i < 0 || i > 14)) throw new Error('Choose up to three different supplies.');
  return indices.reduce((mask, i) => mask | (1 << i), 0);
}

export function decodeDelivery(mask: number): number[] {
  return Array.from({ length: 15 }, (_, i) => i).filter(i => (mask & (1 << i)) !== 0);
}

export function permitValue(permit: AdmissionPermit): bigint { return permit.processingFee + permit.mintFee; }

/** JSON boundaries keep all ETH/nonce-width values lossless. */
export function permitToJSON(permit: AdmissionPermit) {
  return { ...permit, tokenId: permit.tokenId.toString(), networkFee: permit.networkFee.toString(), processingFee: permit.processingFee.toString(), mintFee: permit.mintFee.toString(), expiresAt: permit.expiresAt.toString() };
}

export function permitFromJSON(value: Record<string, unknown>): AdmissionPermit {
  const hex = (v: unknown): Hex => { if (typeof v !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(v)) throw new Error('Invalid request quote.'); return v as Hex; };
  const address = (v: unknown): Address => { if (typeof v !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(v)) throw new Error('Invalid request owner.'); return v as Address; };
  const number = (v: unknown): number => { const n = Number(v); if (!Number.isSafeInteger(n) || n < 0) throw new Error('Invalid request quote.'); return n; };
  return { id: hex(value.id), player: address(value.player), operation: number(value.operation), tokenId: BigInt(String(value.tokenId)), baseRevision: number(value.baseRevision), delivery: number(value.delivery), parametersHash: hex(value.parametersHash ?? zeroHash), networkFee: BigInt(String(value.networkFee)), processingFee: BigInt(String(value.processingFee)), mintFee: BigInt(String(value.mintFee)), multiplier: number(value.multiplier), expiresAt: BigInt(String(value.expiresAt)), window: number(value.window), rulesVersion: number(value.rulesVersion), decisionConfig: hex(value.decisionConfig) };
}
