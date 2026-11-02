import type { Address, Hex } from 'viem';
import type { State, Trace } from './types';

export interface V2World { chainId: number; collection: Address }
export interface V2PublicLife extends V2World {
  version: 2; id: string; owner: Address; name: string; revision: number; state: State;
  purseMicro: string; purseNonce: string; pendingRequest?: Hex; observedBlock: string;
}
export interface V2PublicConfig extends V2World {
  version: 2; rpcUrl: string; testnet: boolean; token: Address; tokenDecimals: number;
  nativeMintPrice: string; tokenMintPriceMicro: string; multiplier: number; rulesHash: Hex; decisionConfig: Hex;
}
export interface V2PublicDay {
  life: V2PublicLife; day: number; requestId: Hex; seed: Hex; stateHash: Hex; traceHash: Hex;
  certificateHash: Hex; commitment: Hex; rewardMicro: string; trace: Trace;
}
export interface V2OwnerJob {
  requestId: Hex; tokenId: string;
  phase: 'queued' | 'preparing' | 'prepared' | 'saving' | 'ready' | 'failure_due' | 'expiry_due' | 'failed' | 'expired' | 'quarantined';
  decisions: number; updatedAt: number; ownerTx?: Hex; finalTx?: Hex; commitment?: Hex; retrySafe: boolean;
}
/** Integer amounts cross HTTP as decimal strings; reconstruct only at wallet submission. */
export interface V2OwnerQuote {
  admission: { id: Hex; player: Address; tokenId: string; baseRevision: number; kitMask: string; shipping: boolean; processingFee: string; multiplier: number; expiresAt: string; decisionConfig: Hex };
  signature: Hex; value: string; networkEstimate: string; totalEstimate: string; expiresAt: string;
  marketBusy: boolean; pressure: string; maximumReward: string;
}
