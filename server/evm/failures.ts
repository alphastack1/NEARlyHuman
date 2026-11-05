import { StoreConflict } from '../storage';
import { BudgetError } from './budget';
import { EvmContextError } from './context';
import { InferenceError } from './jev';
import { isTransientReadError } from '../../src/chain/evm-transport';

/** This wrapper is used only around the canonical read before a model send.
 * It is never applied to the HTTP inference boundary after a paid send. */
export class PreSendCheckError extends Error {
  constructor(cause: unknown) { super('Checking the accepted day again.', { cause }); this.name = 'V2PreSendCheckError'; }
}
export type PreparationFailureStage = 'chain_check' | 'model' | 'storage' | 'preparation';
const modelCodes = new Set(['not_configured', 'missing_budget_fence', 'context_budget', 'input_changed', 'question_count', 'candidate_count', 'rate_limited', 'provider_unavailable', 'invalid_response', 'model_changed', 'invalid_choice', 'invalid_probability', 'transport_uncertain']);

/** Persist stable, safe diagnostics rather than raw RPC bodies or provider text. */
export function classifyPreparationFailure(error: unknown): { retryable: boolean; code: string; stage: PreparationFailureStage } {
  if (error instanceof InferenceError) return { retryable: false, code: modelCodes.has(error.code) ? `model_${error.code}` : 'model_failed', stage: 'model' };
  if (error instanceof EvmContextError) return { retryable: false, code: error.code, stage: 'chain_check' };
  if (error instanceof BudgetError) return { retryable: false, code: error.code === 'uncertain' ? 'model_send_uncertain' : 'budget_unavailable', stage: 'preparation' };
  if (error instanceof StoreConflict || ['EPERM', 'EBUSY', 'EACCES'].includes(String((error as { code?: unknown })?.code || ''))) return { retryable: true, code: 'storage_busy', stage: 'storage' };
  if (isTransientReadError(error)) return { retryable: true, code: 'chain_temporarily_unavailable', stage: 'chain_check' };
  if (error instanceof PreSendCheckError) return { retryable: false, code: 'chain_check_failed', stage: 'chain_check' };
  return { retryable: false, code: 'preparation_interrupted', stage: 'preparation' };
}

export function preparationFailureMessage(code?: string): string | undefined {
  if (!code) return undefined;
  if (code === 'chain_temporarily_unavailable') return 'Checking the chain again. No extra payment needed.';
  if (code === 'storage_busy') return 'Checking this day again. No extra payment needed.';
  if (code === 'expired') return 'This attempt expired. Your saved home is unchanged.';
  if (code === 'model_rate_limited' || code === 'model_provider_unavailable') return 'The AI could not finish this day. Your saved home is unchanged.';
  if (code.startsWith('model_')) return 'The AI could not finish this day. Your saved home is unchanged.';
  return 'This day could not be prepared. Your saved home is unchanged.';
}
