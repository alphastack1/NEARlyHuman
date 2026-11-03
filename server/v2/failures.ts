import { StoreConflict } from '../storage';
import { V2BudgetError } from './budget';
import { V2ContextError } from './context';
import { V2InferenceError } from './jev';
import { isV2TransientReadError } from '../../src/chain/v2-transport';

/** This wrapper is used only around the canonical read before a model send.
 * It is never applied to the HTTP inference boundary after a paid send. */
export class V2PreSendCheckError extends Error {
  constructor(cause: unknown) { super('Checking the accepted day again.', { cause }); this.name = 'V2PreSendCheckError'; }
}
export type V2FailureStage = 'chain_check' | 'model' | 'storage' | 'preparation';
const modelCodes = new Set(['not_configured', 'missing_budget_fence', 'context_budget', 'input_changed', 'question_count', 'candidate_count', 'rate_limited', 'provider_unavailable', 'invalid_response', 'model_changed', 'invalid_choice', 'invalid_probability', 'transport_uncertain']);

/** Persist stable, safe diagnostics rather than raw RPC bodies or provider text. */
export function classifyV2PreparationFailure(error: unknown): { retryable: boolean; code: string; stage: V2FailureStage } {
  if (error instanceof V2InferenceError) return { retryable: false, code: modelCodes.has(error.code) ? `model_${error.code}` : 'model_failed', stage: 'model' };
  if (error instanceof V2ContextError) return { retryable: false, code: error.code, stage: 'chain_check' };
  if (error instanceof V2BudgetError) return { retryable: false, code: error.code === 'uncertain' ? 'model_send_uncertain' : 'budget_unavailable', stage: 'preparation' };
  if (error instanceof StoreConflict || ['EPERM', 'EBUSY', 'EACCES'].includes(String((error as { code?: unknown })?.code || ''))) return { retryable: true, code: 'storage_busy', stage: 'storage' };
  if (isV2TransientReadError(error)) return { retryable: true, code: 'chain_temporarily_unavailable', stage: 'chain_check' };
  if (error instanceof V2PreSendCheckError) return { retryable: false, code: 'chain_check_failed', stage: 'chain_check' };
  return { retryable: false, code: 'preparation_interrupted', stage: 'preparation' };
}

export function v2FailureMessage(code?: string): string | undefined {
  if (!code) return undefined;
  if (code === 'chain_temporarily_unavailable') return 'Checking the chain again. No extra payment needed.';
  if (code === 'storage_busy') return 'Checking this day again. No extra payment needed.';
  if (code === 'expired') return 'This attempt expired. Your saved home is unchanged.';
  if (code === 'model_rate_limited' || code === 'model_provider_unavailable') return 'The AI could not finish this day. Your saved home is unchanged.';
  if (code.startsWith('model_')) return 'The AI could not finish this day. Your saved home is unchanged.';
  return 'This day could not be prepared. Your saved home is unchanged.';
}
