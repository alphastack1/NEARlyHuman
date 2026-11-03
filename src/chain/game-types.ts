import type { Hex } from 'viem';
import type {
  V2PublicConfig, V2PublicLife, V2World, V2OwnerQuote, V2OwnerJob,
  V2PublicRequest, V2PublicDay, V2DaySummary,
} from '../v2/public';
import type { GameNetworkId } from './networks';
import type { State } from '../v2';

/** Native NEAR account IDs and transaction hashes are never encoded as EVM
 * addresses, numeric chain IDs or Ethereum transaction hashes. Legacy RH URLs
 * and public DTOs retain their existing shape. */
export interface NearWorld {
  networkId: 'near-testnet';
  collection: string;
  chainId?: never;
}
export type GameWorld = V2World | NearWorld;

export interface NearPublicConfig extends NearWorld {
  version: 2;
  network: 'testnet';
  testnet: true;
  rpcUrl: string;
  codeHash: string;
  rulesHash: Hex;
  decisionConfig: Hex;
  relayer: string;
  quoteSigner: string;
  token: string;
  tokenDecimals: 6;
  nativeMintPrice: string;
  storageDeposit: string;
  maxProcessingFee: string;
  tokenMintPriceMicro: string;
  multiplier: number;
  availableNetworks?: GameNetworkId[];
  guest?: { id: string; day?: number };
}
export interface NearPublicLife extends NearWorld {
  version: 2;
  id: string;
  owner: string;
  name: string;
  revision: number;
  state: State;
  purseMicro: string;
  purseNonce: string;
  pendingRequest?: Hex;
  observedBlock: string;
  observedBlockHash?: string;
}
export interface NearOwnerQuote extends Omit<V2OwnerQuote, 'admission' | 'signature'>, NearWorld {
  admission: Omit<V2OwnerQuote['admission'], 'player'> & { player: string };
  signature: string;
}
export interface NearOwnerJob extends Omit<V2OwnerJob, 'ownerTx' | 'finalTx'> {
  networkId: 'near-testnet';
  ownerTx?: string;
  finalTx?: string;
}
export interface NearPublicRequest extends Omit<V2PublicRequest, 'player'> {
  player: string;
}
export interface NearPublicDay extends Omit<V2PublicDay, 'life'> { life: NearPublicLife }

export type GamePublicConfig = V2PublicConfig | NearPublicConfig;
export type GamePublicLife = V2PublicLife | NearPublicLife;
export type GameOwnerQuote = V2OwnerQuote | NearOwnerQuote;
export type GameOwnerJob = V2OwnerJob | NearOwnerJob;
export type GamePublicRequest = V2PublicRequest | NearPublicRequest;
export type GamePublicDay = V2PublicDay | NearPublicDay;
export interface GameLifePage { lives: GamePublicLife[]; nextCursor?: string }
export interface GameDaysPage { days: V2DaySummary[]; nextBefore?: number }

export interface NearSignChallenge {
  id: string;
  message: string;
  /** Base64 encoding of exactly 32 nonce bytes. */
  nonce: string;
  recipient: string;
  callbackUrl?: string;
}
export interface NearSignedMessage { accountId: string; publicKey: string; signature: string }
export interface GameSession { token: string; expiresAt: number }
export interface GameWorldDirectory { version: 2; worlds: GamePublicConfig[]; defaultNetworkId: GameNetworkId }

export function isNearWorld(value: unknown): value is NearWorld {
  if (!value || typeof value !== 'object') return false;
  const world = value as Record<string, unknown>;
  return world.networkId === 'near-testnet' && world.chainId === undefined && typeof world.collection === 'string';
}
