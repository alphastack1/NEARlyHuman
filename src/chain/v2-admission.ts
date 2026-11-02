import { isAddress, type Address, type Hex } from 'viem';

/** V2 paid preparation is admitted separately from NFT creation. */
export interface V2Admission {
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

export const v2AdmissionTypes = {
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

export function v2AdmissionTypedData(chainId: number, collection: Address, message: V2Admission) {
  if (chainId !== 46630 && chainId !== 31337) throw new Error('Choose Robinhood Testnet.');
  if (!isAddress(collection) || !isAddress(message.player)) throw new Error('Check this wallet connection.');
  if (!/^0x[0-9a-f]{64}$/i.test(message.id) || !/^0x[0-9a-f]{64}$/i.test(message.decisionConfig)) throw new Error('Refresh this day’s estimate.');
  if (!Number.isInteger(message.baseRevision) || message.baseRevision < 0 || message.baseRevision > 0xffffffff
    || !Number.isInteger(message.multiplier) || message.multiplier < 1 || message.multiplier > 0xffff
    || message.tokenId <= 0n || message.kitMask < 0n || message.kitMask >= 1n << 34n
    || message.expiresAt <= 0n || message.expiresAt > 0xffffffffffffffffn || message.processingFee < 0n) throw new Error('Refresh this day’s estimate.');
  return {
    domain: { name: 'NEARlyHuman V2', version: '2', chainId, verifyingContract: collection },
    types: v2AdmissionTypes,
    primaryType: 'Admission' as const,
    message,
  };
}
