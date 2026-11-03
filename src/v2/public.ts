import type { Address, Hex } from 'viem';
import type { State, Trace } from './types';
import type { GameNetworkId } from '../chain/networks';

export interface V2World { chainId: number; collection: Address }
export interface V2PublicLife extends V2World {
  version: 2; id: string; owner: Address; name: string; revision: number; state: State;
  purseMicro: string; purseNonce: string; pendingRequest?: Hex; observedBlock: string; observedBlockHash?: Hex;
}
export interface V2PublicConfig extends V2World {
  version: 2; rpcUrl: string; testnet: boolean; token: Address; tokenDecimals: number;
  networkId?: GameNetworkId; availableNetworks?: GameNetworkId[];
  nativeMintPrice: string; tokenMintPriceMicro: string; multiplier: number; rulesHash: Hex; decisionConfig: Hex;
  verifier?: Address; actionModule?: Address; controllerCodeHash?: Hex; verifierCodeHash?: Hex; actionModuleCodeHash?: Hex; relayer?: Address; quoteSigner?: Address;
  guest?: { id: string; day?: number };
}
export interface V2PublicRequest { requestId: Hex; tokenId: string; player: Address; day: number; deadline: string; acceptedAt: string; status: number; chainTimestamp: string }
export interface V2LifePage { lives: V2PublicLife[]; nextCursor?: string }
export interface V2DaySummary { day: number; rewardMicro: string; requestId: Hex; commitment: Hex }
export interface V2DaysPage { days: V2DaySummary[]; nextBefore?: number }
export interface V2PublicDay {
  life: V2PublicLife; day: number; requestId: Hex; seed: Hex; stateHash: Hex; traceHash: Hex;
  certificateHash: Hex; commitment: Hex; rewardMicro: string; trace: Trace;
}
export interface V2OwnerJob {
  requestId: Hex; tokenId: string;
  phase: 'queued' | 'preparing' | 'prepared' | 'saving' | 'ready' | 'failure_due' | 'expiry_due' | 'failed' | 'expired' | 'quarantined';
  decisions: number; updatedAt: number; ownerTx?: Hex; finalTx?: Hex; commitment?: Hex; retrySafe: boolean;
  failureCode?: string; failureMessage?: string;
  progress?: V2ChoiceProgress[];
}
/** A completed, validated model reply. Labels describe choices, not a claim
 * that the cinematic action or onchain save has already completed. */
export interface V2ChoiceProgress {id:string;stage:'plan'|'routine'|'acute'|'focus';label:string;slot?:number}
/** Integer amounts cross HTTP as decimal strings; reconstruct only at wallet submission. */
export interface V2OwnerQuote {
  admission: { id: Hex; player: Address; tokenId: string; baseRevision: number; kitMask: string; shipping: boolean; processingFee: string; multiplier: number; expiresAt: string; decisionConfig: Hex };
  signature: Hex; value: string; networkEstimate: string; totalEstimate: string; expiresAt: string;
  marketBusy: boolean; pressure: string; maximumReward: string;
}
