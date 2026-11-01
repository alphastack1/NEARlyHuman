import type { Address, Hex } from 'viem';

/** Confirmed public collection deployments. */
export const deployments: Record<number, { address: Address; blockNumber: number; transactionHash: Hex }> = {
  "46630": {
    "address": "0x998551395f8a0c4ebd1f883b8c18a41d2cecabfb",
    "blockNumber": 146395229,
    "transactionHash": "0x74784f5bfd71f08c5065bdde988c2c27e4327b97d06f24b4ce3dc1c0a7ca359d"
  }
};
