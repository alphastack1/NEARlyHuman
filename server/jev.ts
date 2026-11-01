import { createHash } from 'node:crypto';
import type { ChoiceContext, ModelChoice } from '../src/domain/types';
import { serverConfig } from './config';

export class InferenceError extends Error {
  constructor(public code: string, public uncertain = false) { super(code); }
}
export interface Exchange {
  inputHash: string; model: string; requestedModel: string; responseId?: string;
  latencyMs: number; inputTokens: number; outputTokens: number; costMicroUSD: number;
  choice: string; probabilities?: Record<string, number>; confidence?: number;
}
export function buildDecision(context: ChoiceContext) {
  if (context.candidates.length < 2 || context.candidates.length > 24) throw new InferenceError('candidate_count');
  const s = context.state;
  return {
    model: serverConfig().model,
    state: {
      role: 'A nearly-human rooster living its own domestic life. Stay alive and comfortable, use useful opportunities, and choose a varied believable routine.',
      day: context.day, slot: context.slot, phase: context.phase,
      traits: s.stats, needs: Object.fromEntries(Object.entries(s.needs).map(([k, v]) => [k, v / 100])),
      stock: s.inventory, conditions: s.conditions.filter(c => !c.resolved), plots: s.plots, house: s.house,
      recent: context.recent.slice(-6), situation: context.situation,
      rule: 'No offline aging. Supplied items are single-use. A due game-day deadline is serious. Choose one offered action; supplies do not force a choice. Task success chance is not choice probability.',
    },
    questions: { next_action: { type: 'choice',
      instructions: 'Choose the most useful legal next activity. Address urgent food, water or treatment deadlines using the exact offered targets. Balance needs, recovery and domestic work. Avoid pointless repetition. You may make a different valid choice; never invent an action or item.',
      criteria: Object.fromEntries(context.candidates.map(c => [c.key, {
        action: c.label, target: c.target, variant: c.variant, use: c.inputs,
        energy: c.energy / 100, success_chance: c.successChance,
        urgent: !!c.urgent, due_game_day: c.dueDay, due_slot: c.dueSlot, effect: c.description, possible_failure: c.possibleFailures,
      }])),
    } },
  };
}
export async function infer(context: ChoiceContext, beforeSend: (hash: string, input: unknown) => Promise<void>): Promise<{ choice: ModelChoice; exchange: Exchange }> {
  const cfg = serverConfig(); if (!cfg.nearKey) throw new InferenceError('not_configured');
  const input = buildDecision(context), body = JSON.stringify(input);
  if (Buffer.byteLength(body) > 14_000) throw new InferenceError('context_budget');
  const inputHash = createHash('sha256').update(body).digest('hex');
  await beforeSend(inputHash, input); // durable allowance precedes the paid HTTP send
  const started = performance.now();
  try {
    const response = await fetch(cfg.endpoint, { method: 'POST', headers: { Authorization: `Bearer ${cfg.nearKey}`, 'Content-Type': 'application/json' }, body, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new InferenceError(response.status === 429 ? 'rate_limited' : 'provider_unavailable');
    const text = await response.text(); if (text.length > 96_000) throw new InferenceError('invalid_response');
    const result = JSON.parse(text); const answer = result.answers?.next_action;
    const ids = context.candidates.map(c => c.key);
    if (answer?.type !== 'choice' || !ids.includes(answer.choice)) throw new InferenceError('invalid_choice');
    let probabilities: Record<string, number> | undefined;
    if (answer.probabilities) {
      const values = ids.map(id => answer.probabilities[id]);
      if (values.some(v => !Number.isFinite(v) || v < 0 || v > 1) || Math.abs(values.reduce((a, b) => a + b, 0) - 1) > .02) throw new InferenceError('invalid_probability');
      probabilities = Object.fromEntries(ids.map((id, i) => [id, values[i]]));
    }
    const tokens = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100_000 ? v : 0;
    if (typeof result.model !== 'string' || !/^typesafe\/jev-1\.13(?:-[0-9]{8})?$/.test(result.model)) throw new InferenceError('model_changed');
    const serving = result.model;
    const inputTokens = tokens(result.usage?.input_tokens), outputTokens = tokens(result.usage?.output_tokens);
    const cost = typeof result.usage?.cost === 'number' && result.usage.cost >= 0 ? result.usage.cost : inputTokens * .042 / 1_000_000;
    const exchange: Exchange = { inputHash, requestedModel: cfg.model, model: serving, responseId: typeof result.id === 'string' ? result.id : undefined,
      latencyMs: Math.round(performance.now() - started), inputTokens, outputTokens, costMicroUSD: Math.ceil(cost * 1_000_000), choice: answer.choice, probabilities,
      confidence: typeof answer.confidence === 'number' && answer.confidence >= 0 && answer.confidence <= 1 ? answer.confidence : undefined };
    return { choice: { key: answer.choice, probabilities, provider: 'NEAR AI', model: serving, requestId: exchange.responseId, usage: { inputTokens, outputTokens, costMicroUSD: exchange.costMicroUSD } }, exchange };
  } catch (error) {
    if (error instanceof InferenceError) throw error;
    throw new InferenceError('transport_uncertain', true);
  }
}
