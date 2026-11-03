import { formatUnits } from 'viem';

export type GameNetworkId = 'robinhood-testnet' | 'robinhood-mainnet' | 'near-testnet' | 'near-mainnet';
export interface GameNetwork {
  id: GameNetworkId;
  label: string;
  ecosystem: 'robinhood' | 'near';
  environment: 'testnet' | 'mainnet';
  walletKind: 'evm' | 'near';
  nativeSymbol: 'ETH' | 'NEAR';
  nativeDecimals: 18 | 24;
  evmChainId?: number;
  explorerUrl: string;
}

/** Network identity is separate from deployment availability. A catalog entry does
 * not enable a wallet or imply that a game contract exists on that network. */
export const GAME_NETWORKS: readonly GameNetwork[] = [
  { id: 'robinhood-testnet', label: 'Robinhood Testnet', ecosystem: 'robinhood', environment: 'testnet', walletKind: 'evm', nativeSymbol: 'ETH', nativeDecimals: 18, evmChainId: 46630, explorerUrl: 'https://explorer.testnet.chain.robinhood.com' },
  { id: 'robinhood-mainnet', label: 'Robinhood Mainnet', ecosystem: 'robinhood', environment: 'mainnet', walletKind: 'evm', nativeSymbol: 'ETH', nativeDecimals: 18, evmChainId: 4663, explorerUrl: 'https://robinhoodchain.blockscout.com' },
  { id: 'near-testnet', label: 'NEAR Testnet', ecosystem: 'near', environment: 'testnet', walletKind: 'near', nativeSymbol: 'NEAR', nativeDecimals: 24, explorerUrl: 'https://testnet.nearblocks.io' },
  { id: 'near-mainnet', label: 'NEAR Mainnet', ecosystem: 'near', environment: 'mainnet', walletKind: 'near', nativeSymbol: 'NEAR', nativeDecimals: 24, explorerUrl: 'https://nearblocks.io' },
] as const;

export function networkForEvmChain(chainId: number): GameNetwork | undefined {
  return GAME_NETWORKS.find(network => network.walletKind === 'evm' && network.evmChainId === chainId);
}

/** Resolve only the server-selected world; never infer a deployment from a label. */
export function networkForConfig(config: { chainId: number; testnet?: boolean }): GameNetwork | undefined {
  const network = networkForEvmChain(config.chainId);
  if (network && (config.testnet === undefined || config.testnet === (network.environment === 'testnet'))) return network;
  return undefined;
}

/** Only the currently served, wallet-supported game can be selected. A catalog
 * name or extra advertised ID never creates another deployment or wallet path. */
export function playableNetworks(config: { chainId: number; testnet?: boolean; networkId?: GameNetworkId; availableNetworks?: readonly GameNetworkId[] }): readonly GameNetwork[] {
  if (config.chainId !== 46630 || config.testnet !== true) return [];
  const network = networkForConfig(config);
  if (!network || config.networkId !== undefined && config.networkId !== network.id) return [];
  if (config.availableNetworks !== undefined && (!Array.isArray(config.availableNetworks) || !config.availableNetworks.includes(network.id))) return [];
  return [network];
}

/** Compact downward-rounded display. A nonzero dust balance stays visible. */
export function formatNativeBalance(amount: bigint, network: GameNetwork = GAME_NETWORKS[0]!): string {
  if (amount < 0n) throw new RangeError('A wallet balance cannot be negative.');
  const units = formatUnits(amount, network.nativeDecimals), [whole, fraction = ''] = units.split('.');
  if (amount > 0n && BigInt(whole!) === 0n && /^0{5}/.test(fraction)) return `<0.00001 ${network.nativeSymbol}`;
  const decimals = fraction.slice(0, 5).replace(/0+$/, '');
  return `${whole}${decimals ? `.${decimals}` : ''} ${network.nativeSymbol}`;
}
