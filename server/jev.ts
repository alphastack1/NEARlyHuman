import { createHash } from 'node:crypto';
import type { ChoiceContext, ModelChoice } from '../src/domain/types';
import { deriveIndividuality, dayInclination, INDIVIDUALITY_VERSION } from '../src/domain/individuality';
import { candidateRecovery } from '../src/domain/actions';
import { DAY_PLAN_VERSION, MAX_MODEL_DECISIONS } from '../src/domain/day-plan';
import { serverConfig } from './config';

export class InferenceError extends Error {
  constructor(public code: string, public uncertain = false) { super(code); }
}
export interface Exchange {
  inputHash: string; model: string; requestedModel: string; responseId?: string;
  latencyMs: number; inputTokens: number; outputTokens: number; costMicroUSD: number;
  choice: string; probabilities?: Record<string, number>; confidence?: number;
  morningChoice?:string;morningProbabilities?:Record<string,number>;
}
export const DECISION_POLICY_VERSION='one-focus-six-beats-local-quiet-physical-pickup-v1';
export function buildDecision(context: ChoiceContext) {
  if (context.candidates.length < 2 || context.candidates.length > 24) throw new InferenceError('candidate_count');
  const s = context.state,planning=context.mode==='day-plan',available={...s.inventory};
  if(planning)for(const item of context.pendingDelivery||[])available[item]++;
  const nextAction={type:'choice',
      instructions:planning?'Choose one meaningful, feasible main undertaking for this day. Each offered project has real materials and a real target; scheduled alternatives are genuine timing choices. Prefer a useful project matching this individual and today’s inclination. An unhurried option means no genuine substantial project is available: choose an ordinary place/time, not imaginary work. This is a plan, not an immediate action. Urgent needs may interrupt or postpone it. The delivery is outside until collected. Do not invent ripe fruit, furniture, materials, benefits or a second project.'
        :'Choose one small moment in an otherwise continuous day. Urgent food, water, treatment and incident deadlines come first. Otherwise choose a useful modest refreshment, nap, short leisure or a genuinely ordinary look/sit/stroll; not every decision needs productive work. The planned main undertaking is handled separately, once. Do not chase a different project. Read clipped gains and costs: avoid wasting scarce supplies for tiny top-ups, but a useful ordinary refreshment need not wait for an emergency. Let this individual’s preferences and earlier_today influence the small routine. Choose only an offered action; never invent benefits or supplies.',
      criteria:Object.fromEntries(context.candidates.map(c=>{const food=candidateRecovery(c,'nutrition'),water=candidateRecovery(c,'hydration'),foodGain=Math.min(10000-s.needs.nutrition,food)/100,waterGain=Math.min(10000-s.needs.hydration,water)/100;return[c.key,{
        action:c.label,target:c.target,variant:c.variant,use:c.inputs,energy:c.energy/100,success_chance:c.successChance,urgent:!!c.urgent,due_game_day:c.dueDay,due_slot:c.dueSlot,effect:c.description,possible_failure:c.possibleFailures,
        ...(c.plan?{project_kind:c.plan.kind,planned_slot:c.plan.scheduledSlot,materials_after_collection:true}:{}),
        ...(food||water?{clipped_gain_on_success:{food:foodGain,water:waterGain,before_phase_boundary:true}}:{}),
        ...(Object.keys(c.inputs).length?{stock_after_use:Object.fromEntries(Object.entries(c.inputs).map(([item,count])=>[item,available[item as keyof typeof available]-(count||0)]))}:{}),
        ...(!c.urgent&&food>0&&foodGain===0?{resource_caution:'Food is full; no food gain fits now.'}:!c.urgent&&c.action==='H01'&&c.variant==='water'&&waterGain<10?{resource_caution:`Only ${waterGain} water fits; one whole bottle is spent.`}:{}),
      }];}))};
  return {
    model: serverConfig().model,
    state: {
      role: 'A nearly-human rooster living one continuous domestic day. Stay alive, pursue one meaningful undertaking, and have a few small ordinary moments around it. Preferences are soft, never new rules.',
      decision_kind:planning?'day_plan':'small_routine',day_plan_version:DAY_PLAN_VERSION,
      day: context.day, slot: context.slot, phase: context.phase,
      individuality:{version:INDIVIDUALITY_VERSION,...deriveIndividuality(s.seed),today:dayInclination(s.seed,context.day)},
      traits: s.stats, needs: Object.fromEntries(Object.entries(s.needs).map(([k, v]) => [k, v / 100])),
      stock: s.inventory, delivery_waiting_outside:context.pendingDelivery||[],...(planning?{project_stock_after_collection:available}:{}), conditions: s.conditions.filter(c => !c.resolved), plots: s.plots, house: s.house,
      recent: context.recent.slice(-6), earlier_today:context.earlierToday?.slice(-8)||[], situation: context.situation,
      ...(context.dailyFocus?{main_undertaking:context.dailyFocus}:{}),
      pacing:{remaining_phase_boundaries:6-Math.floor((Math.max(1,context.slot)-1)/10),scheduled_loss_per_boundary:{food:5,water:7},rest_allowance:2,leisure_allowance:2,ordinary_decision_beats:6,maximum_successful_model_calls:MAX_MODEL_DECISIONS},
      rule: 'No offline aging. Supplied items are single-use. A due game-day deadline is serious. Choose one offered action; supplies do not force a choice. Task success chance is not choice probability.',
    },
    questions: {next_action:nextAction,...(planning&&(context.morningOptions?.length||0)>1?{morning_order:{type:'choice',instructions:'Choose the preferred morning order from these feasible options. Before-pickup food/coffee uses existing pantry stock, never the uncollected parcel. Collection follows the chosen small step during Dawn. Urgent care can change that order. These choices already preserve the materials required by every offered project.',criteria:Object.fromEntries(context.morningOptions!.map(option=>[option.key,{action:option.label,before_pickup_action:option.beforeActionKey||null}]))}}:{})},
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
    let morningChoice:string|undefined,morningProbabilities:Record<string,number>|undefined;
    if(context.mode==='day-plan'&&(context.morningOptions?.length||0)>1){
      const morning=result.answers?.morning_order,keys=context.morningOptions!.map(option=>option.key);
      if(morning?.type!=='choice'||!keys.includes(morning.choice))throw new InferenceError('invalid_morning_choice');
      morningChoice=morning.choice;
      if(morning.probabilities){const values=keys.map(key=>morning.probabilities[key]);if(values.some(v=>!Number.isFinite(v)||v<0||v>1)||Math.abs(values.reduce((a,b)=>a+b,0)-1)>.02)throw new InferenceError('invalid_probability');morningProbabilities=Object.fromEntries(keys.map((key,i)=>[key,values[i]]));}
    }
    const tokens = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100_000 ? v : 0;
    if (typeof result.model !== 'string' || !/^typesafe\/jev-1\.13(?:-[0-9]{8})?$/.test(result.model)) throw new InferenceError('model_changed');
    const serving = result.model;
    const inputTokens = tokens(result.usage?.input_tokens), outputTokens = tokens(result.usage?.output_tokens);
    const cost = typeof result.usage?.cost === 'number' && Number.isFinite(result.usage.cost) && result.usage.cost >= 0 ? result.usage.cost : inputTokens * .042 / 1_000_000;
    const exchange: Exchange = { inputHash, requestedModel: cfg.model, model: serving, responseId: typeof result.id === 'string' ? result.id : undefined,
      latencyMs: Math.round(performance.now() - started), inputTokens, outputTokens, costMicroUSD: Math.ceil(cost * 1_000_000), choice: answer.choice, probabilities,
      confidence: typeof answer.confidence === 'number' && answer.confidence >= 0 && answer.confidence <= 1 ? answer.confidence : undefined,...(morningChoice?{morningChoice,morningProbabilities}:{}) };
    return { choice: { key: answer.choice, probabilities, provider: 'NEAR AI', model: serving, requestId: exchange.responseId, usage: { inputTokens, outputTokens, costMicroUSD: exchange.costMicroUSD },...(morningChoice?{morningKey:morningChoice,morningProbabilities}:{}) }, exchange };
  } catch (error) {
    if (error instanceof InferenceError) throw error;
    throw new InferenceError('transport_uncertain', true);
  }
}
