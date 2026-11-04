import type { Hex } from 'viem';

export interface NearRuntime {
  version: 2; networkId: 'near-testnet'; network: 'testnet'; collection: string; rpcUrl: string;
  codeHash: string; rulesHash: Hex; decisionConfig: Hex; relayer: string; quoteSigner: string;
}
export type NearRuntimeIdentity=Omit<NearRuntime,'rpcUrl'>;
export interface NearBlock { height: string; hash: string; timestamp: string }
export interface NearContractConfig {
  network_id: string; contract_id: string; owner_id: string; relayer_id: string; quote_public_key: string;
  rules_hash: Hex; decision_config: Hex; native_mint_price: string; token_mint_price_micro: string;
  storage_deposit: string; multiplier: number; admissions_paused: boolean; issued: string; nft_mint_burns: string;
  total_allocated: string; available: string; reserved: string; min_processing_fee?: string;
  transfer_burn_enabled?: boolean; transfer_burn_bps?: number; total_transfer_burned?: string;
}
export interface NearLife {
  token_id: string; owner_id: string; name: string; state: Hex; revision: number; purse_micro: string;
  purse_nonce: string; pending_request?: Hex | null; appearance_seed: Hex;
}
export interface NearAdmission {
  id: Hex; player: string; tokenId: string; baseRevision: number; kitMask: string; shipping: boolean;
  processingFee: string; multiplier: number; expiresAt: string; decisionConfig: Hex;
}
export interface NearRequest {
  request_id: Hex; token_id: string; player: string; base_revision: number; day: number; kit_mask: string;
  shipping: boolean; accepted_at: string; deadline: string; day_seed: Hex; decision_config: Hex;
  base_hash: Hex; pressure: string; reserved_reward: string; status: number;
  processing_fee?: string; multiplier?: number;
}
export interface NearDayRecord {
  request_id: Hex; seed: Hex; state_hash: Hex; trace_hash: Hex; certificate_hash: Hex;
  replay_commitment: Hex; reward: string; history: Hex;
}
export interface NearFrozenInput {
  version: 2; runtime: NearRuntimeIdentity; requestId: Hex; tokenId: string; player: string; baseRevision: number;
  day: number; kitMask: string; shipping: boolean; acceptedAt: string; deadline: string; daySeed: Hex;
  base: Hex; baseHash: Hex; pressure: string; reservedReward: string; acceptedBlock: string; acceptedBlockHash: string;
}
export class NearError extends Error {
  constructor(public code: string, message: string, public status = 409, public retryable = false) { super(message); this.name = 'NearError'; }
}
