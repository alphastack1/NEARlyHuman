import { createHash } from 'node:crypto';
import { serverConfig } from '../config';
import { type ChoiceModelRequest, type ChoiceModelReply, type ChoiceAnswer } from './choices';

export class InferenceError extends Error {
  constructor(public code: string, public uncertain = false) { super(code); }
}
export type BeforeInferenceSend = (hash: string, input: unknown) => Promise<void>;

/** The only model HTTP inference boundary. Its budget-before-send fence is mandatory. */
export async function sendChoiceRequest(request: ChoiceModelRequest, beforeSend: BeforeInferenceSend): Promise<ChoiceModelReply> {
  const cfg = serverConfig();
  if (!cfg.nearKey) throw new InferenceError('not_configured');
  if (typeof beforeSend !== 'function') throw new InferenceError('missing_budget_fence');
  const input = structuredClone(request.input), body = JSON.stringify(input);
  if (input.model !== 'typesafe/jev-1.13' || input.model !== cfg.model || Buffer.byteLength(body) > 14_000) throw new InferenceError('context_budget');
  const inputHash = createHash('sha256').update(body).digest('hex');
  if (inputHash !== request.inputHash) throw new InferenceError('input_changed');
  const expected = structuredClone(request.expected);
  if (!Object.keys(expected).length || Object.keys(expected).length > 3 || Object.keys(input.questions).length !== Object.keys(expected).length) throw new InferenceError('question_count');
  for (const [name, keys] of Object.entries(expected)) {
    const question = input.questions[name] as { type?: unknown; criteria?: Record<string, unknown> } | undefined;
    if (!keys.length || keys.length > 24 || new Set(keys).size !== keys.length || question?.type !== 'choice'
      || !question.criteria || Object.keys(question.criteria).length !== keys.length || keys.some(key => !Object.hasOwn(question.criteria!, key))) throw new InferenceError('candidate_count');
  }
  await beforeSend(inputHash, input);
  const started = performance.now();
  try {
    const response = await fetch(cfg.endpoint, { method: 'POST', headers: { Authorization: `Bearer ${cfg.nearKey}`, 'Content-Type': 'application/json' }, body, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new InferenceError(response.status === 429 ? 'rate_limited' : 'provider_unavailable', true);
    const text = await response.text(); if (text.length > 96_000) throw new InferenceError('invalid_response', true);
    const result = JSON.parse(text);
    if (typeof result.model !== 'string' || !/^typesafe\/jev-1\.13(?:-[0-9]{8})?$/.test(result.model)) throw new InferenceError('model_changed', true);
    const answers: Record<string, ChoiceAnswer> = {};
    for (const [name, keys] of Object.entries(expected)) {
      const answer = result.answers?.[name];
      if (answer?.type !== 'choice' || !keys.includes(answer.choice)) throw new InferenceError('invalid_choice', true);
      let probabilities: Record<string, number> | undefined;
      if (answer.probabilities !== undefined) {
        if (!answer.probabilities || typeof answer.probabilities !== 'object' || Array.isArray(answer.probabilities)) throw new InferenceError('invalid_probability', true);
        const values = keys.map(key => answer.probabilities[key]);
        if (values.some(v => typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1) || Math.abs(values.reduce((a, b) => a + b, 0) - 1) > .02) throw new InferenceError('invalid_probability', true);
        probabilities = Object.fromEntries(keys.map((key, i) => [key, values[i]]));
      }
      answers[name] = { choice: answer.choice, ...(probabilities ? { probabilities } : {}) };
    }
    const tokens = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100_000 ? v : 0;
    const inputTokens = tokens(result.usage?.input_tokens), outputTokens = tokens(result.usage?.output_tokens);
    const usableCost = typeof result.usage?.cost === 'number' && Number.isFinite(result.usage.cost) && result.usage.cost >= 0;
    const costMicroUSD = usableCost ? Math.max(1, Math.ceil(result.usage.cost * 1_000_000)) : 5000;
    return { answers, exchange: { inputHash, requestedModel: cfg.model, model: result.model,
      ...(typeof result.id === 'string' ? { responseId: result.id.slice(0, 200) } : {}),
      latencyMs: Math.round(performance.now() - started), inputTokens, outputTokens, costMicroUSD,
      ...(!usableCost ? { usageEstimated: true } : {}), choices: Object.fromEntries(Object.entries(answers).map(([name, a]) => [name, a.choice])) } };
  } catch (error) {
    if (error instanceof InferenceError) throw error;
    throw new InferenceError('transport_uncertain', true);
  }
}
