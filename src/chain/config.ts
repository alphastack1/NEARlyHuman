import { defineChain, type Address } from 'viem';

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Test Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.chain.robinhood.com'] } },
  blockExplorers: { default: { name: 'Robinhood Chain Explorer', url: 'https://explorer.testnet.chain.robinhood.com' } },
  testnet: true,
});

export const robinhoodMainnet = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.chain.robinhood.com'] } },
  blockExplorers: { default: { name: 'Robinhood Chain Explorer', url: 'https://robinhoodchain.blockscout.com' } },
});

export type SupportedChainId = 46630 | 4663;
export type CollectionConfig = { chainId: SupportedChainId; address: Address; rpcUrl?: string };
export function chainFor(chainId: number) {
  if (chainId === 46630) return robinhoodTestnet;
  if (chainId === 4663) return robinhoodMainnet;
  throw new Error('Choose Robinhood Chain.');
}
export function explorerTransaction(chainId: number, hash: string): string { return chainFor(chainId).blockExplorers.default.url + '/tx/' + hash; }
export function explorerToken(chainId: number, collection: Address, tokenId: bigint | string): string { return chainFor(chainId).blockExplorers.default.url + '/token/' + collection + '/instance/' + tokenId; }
