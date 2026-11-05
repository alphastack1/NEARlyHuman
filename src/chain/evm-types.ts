import type { Address, Hex } from 'viem';
import type { State, Trace } from '../domain/types';
import type { GameNetworkId } from './networks';

export interface EvmWorld { chainId: number; collection: Address }
export interface TransferBurnInfo { enabled: boolean; bps: number; totalBurned: string }
export interface EvmPublicLife extends EvmWorld {
  version: 2; id: string; owner: Address; name: string; revision: number; state: State;
  purseMicro: string; purseNonce: string; pendingRequest?: Hex; observedBlock: string; observedBlockHash?: Hex;
}
export interface EvmPublicConfig extends EvmWorld {
  version: 2; rpcUrl: string; testnet: boolean; token: Address; tokenDecimals: number;
  networkId?: GameNetworkId; availableNetworks?: GameNetworkId[];
  nativeMintPrice: string; tokenMintPriceMicro: string; multiplier: number; rulesHash: Hex; decisionConfig: Hex;
  verifier?: Address; actionModule?: Address; controllerCodeHash?: Hex; verifierCodeHash?: Hex; actionModuleCodeHash?: Hex; relayer?: Address; quoteSigner?: Address;
  guest?: { id: string; day?: number };
  admissionsEnabled?: boolean;
  transferBurn?: TransferBurnInfo;
}
export interface EvmPublicRequest { requestId: Hex; tokenId: string; player: Address; day: number; deadline: string; acceptedAt: string; status: number; chainTimestamp: string }
export interface EvmLifePage { lives: EvmPublicLife[]; nextCursor?: string }
export interface EvmDaySummary { day: number; rewardMicro: string; requestId: Hex; commitment: Hex }
export interface EvmDaysPage { days: EvmDaySummary[]; nextBefore?: number }
export interface EvmPublicDay {
  life: EvmPublicLife; day: number; requestId: Hex; seed: Hex; stateHash: Hex; traceHash: Hex;
  certificateHash: Hex; commitment: Hex; rewardMicro: string; trace: Trace;
}
export interface EvmOwnerJob {
  requestId: Hex; tokenId: string;
  phase: 'queued' | 'preparing' | 'prepared' | 'saving' | 'ready' | 'failure_due' | 'expiry_due' | 'failed' | 'expired' | 'quarantined';
  decisions: number; updatedAt: number; ownerTx?: Hex; finalTx?: Hex; commitment?: Hex; retrySafe: boolean;
  failureCode?: string; failureMessage?: string;
  progress?: ChoiceProgress[];
}
/** A completed, validated model reply. Labels describe choices, not a claim
 * that the cinematic action or onchain save has already completed. */
export interface ChoiceProgress {id:string;stage:'plan'|'routine'|'acute'|'focus';label:string;slot?:number}
/** Integer amounts cross HTTP as decimal strings; reconstruct only at wallet submission. */
export interface EvmOwnerQuote {
  admission: { id: Hex; player: Address; tokenId: string; baseRevision: number; kitMask: string; shipping: boolean; processingFee: string; multiplier: number; expiresAt: string; decisionConfig: Hex };
  signature: Hex; value: string; networkEstimate: string; totalEstimate: string; expiresAt: string;
  marketBusy: boolean; pressure: string; maximumReward: string;
}
