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
