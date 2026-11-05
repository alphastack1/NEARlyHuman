import { isAddress, type Address, type Hex } from 'viem';

/** Paid day preparation is admitted separately from NFT creation. */
export interface EvmAdmission {
  id: Hex;
  player: Address;
  tokenId: bigint;
  baseRevision: number;
  kitMask: bigint;
  shipping: boolean;
  processingFee: bigint;
  multiplier: number;
  expiresAt: bigint;
  decisionConfig: Hex;
}

export const evmAdmissionTypes = {
  Admission: [
    { name: 'id', type: 'bytes32' },
    { name: 'player', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'baseRevision', type: 'uint32' },
    { name: 'kitMask', type: 'uint64' },
    { name: 'shipping', type: 'bool' },
    { name: 'processingFee', type: 'uint256' },
    { name: 'multiplier', type: 'uint16' },
    { name: 'expiresAt', type: 'uint64' },
    { name: 'decisionConfig', type: 'bytes32' },
  ],
} as const;

export function evmAdmissionTypedData(chainId: number, collection: Address, message: EvmAdmission) {
  if (chainId !== 46630 && chainId !== 31337) throw new Error('Choose Robinhood Testnet.');
  if (!isAddress(collection) || !isAddress(message.player)) throw new Error('Check this wallet connection.');
  if (!/^0x[0-9a-f]{64}$/i.test(message.id) || !/^0x[0-9a-f]{64}$/i.test(message.decisionConfig)) throw new Error('Refresh this day’s estimate.');
  if (!Number.isInteger(message.baseRevision) || message.baseRevision < 0 || message.baseRevision > 0xffffffff
    || !Number.isInteger(message.multiplier) || message.multiplier < 1 || message.multiplier > 0xffff
    || message.tokenId <= 0n || message.kitMask < 0n || message.kitMask >= 1n << 34n
    || message.expiresAt <= 0n || message.expiresAt > 0xffffffffffffffffn || message.processingFee < 0n) throw new Error('Refresh this day’s estimate.');
  return {
    domain: { name: 'NEARlyHuman V2', version: '2', chainId, verifyingContract: collection },
    types: evmAdmissionTypes,
    primaryType: 'Admission' as const,
    message,
  };
}
