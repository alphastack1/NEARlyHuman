import { createHash } from 'node:crypto';
import type { Candidate, ChoiceContext, ModelChoice } from '../src/domain/types';
import { deriveIndividuality, dayInclination, INDIVIDUALITY_VERSION } from '../src/domain/individuality';
import { candidateRecovery } from '../src/domain/actions';
import { candidateActivityFamily, candidateInterest, DAY_PLAN_VERSION, MAX_MODEL_DECISIONS } from '../src/domain/day-plan';
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
export const DECISION_POLICY_VERSION='one-focus-six-beats-useful-variety-prior-memory-v2';
function recoveryFacts(c:Candidate,s:ChoiceContext['state']) {
 const nominal={food:candidateRecovery(c,'nutrition'),water:candidateRecovery(c,'hydration'),energy:candidateRecovery(c,'energy'),morale:candidateRecovery(c,'morale')};
 const gains={food:Math.min(10000-s.needs.nutrition,nominal.food)/100,water:Math.min(10000-s.needs.hydration,nominal.water)/100,energy:Math.min(10000-Math.max(0,s.needs.energy-c.energy),nominal.energy)/100,morale:Math.min(10000-s.needs.morale,nominal.morale)/100};
 return{gains,hasRecovery:Object.values(nominal).some(n=>n>0),tiny:Math.max(...Object.values(gains))<10};
}
export function buildDecision(context: ChoiceContext) {
  if (context.candidates.length < 2 || context.candidates.length > 24) throw new InferenceError('candidate_count');
  const s = context.state,planning=context.mode==='day-plan',available={...s.inventory};
  const profile=deriveIndividuality(s.seed),today=dayInclination(s.seed,context.day);
  const matches=(a:{action:string;target:string;variant:string},b:{action:string;target:string;variant:string})=>a.action===b.action&&a.target===b.target&&a.variant===b.variant;
  const prior=context.previousDays||[],earlier=context.earlierToday||[];
  const focus=context.dailyFocus;
  const plannedAction=focus?.status==='planned'&&focus.action?{key:focus.key,action:focus.action,target:focus.target||'hall',variant:focus.variant||'',label:focus.label,description:'',inputs:focus.inputs||{},energy:0,successChance:1,possibleFailures:[]} as Candidate:undefined;
  const plannedGain=plannedAction?{food:candidateRecovery(plannedAction,'nutrition')/100,water:candidateRecovery(plannedAction,'hydration')/100,energy:candidateRecovery(plannedAction,'energy')/100,morale:candidateRecovery(plannedAction,'morale')/100}:undefined;
  const failureScenarios:Record<string,string[]>={};
  const failureScenario=(failures:string[])=>{const known=Object.entries(failureScenarios).find(([,values])=>values.length===failures.length&&values.every((value,index)=>value===failures[index]));if(known)return known[0];const key='risk'+(Object.keys(failureScenarios).length+1);failureScenarios[key]=failures;return key;};
  if(planning)for(const item of context.pendingDelivery||[])available[item]++;
  const nextAction={type:'choice',
      instructions:planning?'Choose one meaningful, feasible main undertaking for this day. Each project has real materials and a real target. At similarly useful choices, prefer today’s interest and this individual’s lasting tastes, with a fresh use of the home rather than automatically repeating a successful recent project. A needed repair, harvest or meal may sensibly repeat. Prior days contain bounded executed records, not a complete biography. An unhurried option means no substantial project is feasible; do not invent work. This is one plan, not an immediate action. Urgent needs can interrupt it. Delivery stays outside until collected. Never invent ripe fruit, materials, benefits or a second project.'
        :'Choose one small moment in a continuous day. Urgent survival, treatment and incident deadlines come first. Otherwise compare useful care with an ordinary look, sit or short stroll. Let lasting tastes, meal style, today’s interest and actual recent actions distinguish similarly useful choices. Consider a different kind of moment after the morning habit; a different recipe is not automatically a different habit. Needed food, water, rest and treatment may always repeat. Consider an upcoming planned meal before an optional top-up, without treating its success as guaranteed or delaying urgent care. Try a useful new home affordance when offered. Do not top every need up to100 reflexively: energy does not decay each phase and surviving bedtime restores35 energy. A healthy rooster can do something ordinary. Preserve scarce stock for useful care. Never chase a second project or invent effects. Choose only an offered action.',
      criteria:Object.fromEntries(context.candidates.map(c=>{
        const {gains,hasRecovery,tiny}=recoveryFacts(c,s);
        const repeatedToday=earlier.filter(a=>matches(a,c)).length,priorSuccesses=prior.flatMap(day=>day.actions).filter(a=>a.success&&matches(a,c)).length;
        const family=candidateActivityFamily(c),familyToday=earlier.filter(a=>candidateActivityFamily(a)===family).length;
        return[c.key,{
        action:c.label,target:c.target,variant:c.variant,use:c.inputs,energy:c.energy/100,success_chance:c.successChance,...(c.urgent?{urgent:true}:{}),due_game_day:c.dueDay,due_slot:c.dueSlot,effect:c.description,...(c.possibleFailures.length?{failure_scenario:failureScenario(c.possibleFailures)}:{}),
        ...(!c.urgent?{activity_family:family,interest:candidateInterest(c),...(repeatedToday||priorSuccesses||familyToday?{familiarity:{today:repeatedToday,family_today:familyToday,prior_successes:priorSuccesses}}:{})}:{}),
        ...(c.plan?{project_kind:c.plan.kind,planned_slot:c.plan.scheduledSlot,materials_after_collection:true}:{}),
        ...(hasRecovery?{clipped_gain_on_success:{...gains,before_phase_boundary:true}}:{}),
        ...(!c.urgent&&Object.keys(c.inputs).length&&hasRecovery&&tiny?{resource_caution:'Only small recovery fits. A whole item is spent; compare useful care or a free ordinary moment.'}:{}),
      }];}))};
  return {
    model: serverConfig().model,
    state: {
      role: 'A nearly-human rooster living one continuous domestic day. Stay alive, pursue one meaningful undertaking, and have a few small ordinary moments around it. Preferences are soft, never new rules.',
      decision_kind:planning?'day_plan':'small_routine',day_plan_version:DAY_PLAN_VERSION,
      day: context.day, slot: context.slot, phase: context.phase,
      individuality:{version:INDIVIDUALITY_VERSION,...profile,today},
      traits: s.stats, needs: Object.fromEntries(Object.entries(s.needs).map(([k, v]) => [k, v / 100])),
      stock: s.inventory, delivery_waiting_outside:context.pendingDelivery||[],...(planning?{project_stock_after_collection:available}:{}), conditions: s.conditions.filter(c => !c.resolved), plots: s.plots, house: s.house,
      recent: context.recent.slice(-6), earlier_today:earlier.slice(-8),
      previous_days:{source:'Bounded executed non-idle records from completed days; not all choices or quiet time.',days:prior},
      task_failure_scenarios:failureScenarios,
      preference_guide:{primary:profile.interest,secondary:profile.secondaryInterest,today:today.interest,meal:profile.mealStyle==='ritual'?'When useful, enjoy preparation over the quickest consumption.':'When useful, prefer a simple meal or drink.',resources:profile.resourceStyle==='save-specials'?'Keep special stock when a modest or free option suffices.':'A useful new recipe or home affordance is welcome; never sacrifice necessary care.'},
      situation: context.situation,
      ...(focus?{main_undertaking:{...focus,...(plannedGain&&Object.values(plannedGain).some(n=>n>0)?{slots_until_plan:Math.max(0,focus.scheduledSlot-context.slot),nominal_gain_if_success:plannedGain,success_is_not_guaranteed:true}:{})}}:{}),
      pacing:{remaining_phase_boundaries:6-Math.floor((Math.max(1,context.slot)-1)/10),scheduled_loss_per_boundary:{food:5,water_by_phase:[7,6,7,7,6,7],energy:0,morale:Math.round(300*(1-.02*s.stats.spirit))/100},bedtime_if_alive:{energy_gain:35,cap:100,healing:'Conditional, never a guaranteed rescue.'},rest_allowance:2,leisure_allowance:2,ordinary_decision_beats:6,maximum_successful_model_calls:MAX_MODEL_DECISIONS},
      rule: 'No offline aging. Supplied items are single-use; use lists whole items spent. A due deadline is serious. Choose one offered action; supplies do not force it. Task success chance is not choice probability. failure_scenario refers to task_failure_scenarios. Nonurgent familiarity counts exact actions today, same-family actions today, and exact prior successes; absent means zero. Urgent care omits this optional metadata.',
    },
    questions: {next_action:nextAction,...(planning&&(context.morningOptions?.length||0)>1?{morning_order:{type:'choice',instructions:'Choose a feasible morning habit matching this individual. Compare real clipped effects and whole-item costs; useful ritual, simple breakfast or a quiet look may fit different tastes. Before-pickup food/coffee uses existing pantry stock, never the parcel. Collection follows during Dawn; urgent care can change the order. All options preserve project materials.',criteria:Object.fromEntries(context.morningOptions!.map(option=>{const action=option.beforeAction?{...option.beforeAction,key:option.beforeActionKey||'',label:option.label,possibleFailures:[]}:undefined;return[option.key,{action:option.label,before_pickup_action:option.beforeActionKey||null,...(action?{use:action.inputs,energy:action.energy/100,success_chance:action.successChance,effect:action.description,clipped_gain_on_success:recoveryFacts(action,s).gains}:{})}];}))}}:{})},
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
