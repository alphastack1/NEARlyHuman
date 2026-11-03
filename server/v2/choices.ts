import { createHash } from 'node:crypto';
import {
  Op, ITEMS, NEEDS, CONDITIONS, PLANTS, RECIPES, WEIGHTS, MAIN_OPS, ACUTE_OPS, openDay, legalActions, kitItems,
  type State, type Step, type Candidate, type Context,
} from '../../src/v2';
import { v2Personality, v2DayInclination, V2_PERSONALITY_VERSION, type V2Interest } from '../../src/v2/personality';
import type { V2Decision, V2Selection, V2ObservedEpisode } from './preparation';

export const V2_MIND_POLICY = 'v2-mind-observed-episodes-8';
export interface V2PastAction extends Step { success?: boolean }
export interface V2PreviousDay { day: number; actions: V2PastAction[] }
export interface V2MindMemory { name?: string; previousDays?: V2PreviousDay[]; pressureMicro?: string }
export interface V2MorningOption { key: string; label: string; beforePickup?: Step; candidate?: Candidate }
export interface V2GoalOption { key: string; id: number; label: string; wood?: number }
export interface V2PlanContext {
  requestId: string; base: State; kit: bigint; seed: string; shipping: boolean; memory?: V2MindMemory;
}
export interface V2PlanChoices extends V2PlanContext { main: Candidate[]; morning: V2MorningOption[]; goals: V2GoalOption[] }
export interface V2DailyPlan {
  goal: number; focus: Step; morningBeforePickup?: Step;
  mainKey: string; mainLabel: string; morningKey: string; goalKey?: string;
  model?: string; responseId?: string;
}
export interface V2ModelRequest {
  input: { model: string; state: Record<string, unknown>; questions: Record<string, unknown> };
  inputHash: string;
  expected: Record<string, string[]>;
  kind: 'routine' | 'focus' | 'acute' | 'plan';
}
export interface V2Answer { choice: string; probabilities?: Record<string, number> }
export interface V2ModelReply {
  answers: Record<string, V2Answer>;
  exchange: {
    inputHash: string; requestedModel: string; model: string; responseId?: string;
    latencyMs: number; inputTokens: number; outputTokens: number; costMicroUSD: number;
    usageEstimated?: boolean; choices: Record<string, string>;
  };
}
export interface V2OpportunityBudget {
  ordinary_uses_left: number; ordinary_opportunities_left: number; routine_phases_left: number[];
  main_uses_left: number; acute_response_uses_left: number;
}
/** Remaining allowances come from the real clock/counters, not need-based guesses. */
export function v2OpportunityBudget(c: Pick<Context, 'slot' | 'ordinaryUses' | 'ordinaryMask' | 'mainUsed' | 'acuteUses'>): V2OpportunityBudget {
  const phase = Math.max(1, Math.floor((Math.max(1, c.slot) - 1) / 10));
  const phases = [1,2,3,4,5].filter(p => p >= phase && !(c.ordinaryMask & (1 << p)));
  const ordinary = Math.max(0, 5 - c.ordinaryUses);
  return { ordinary_uses_left: ordinary, ordinary_opportunities_left: Math.min(ordinary, phases.length), routine_phases_left: phases,
    main_uses_left: !c.mainUsed && c.slot <= 40 ? 1 : 0, acute_response_uses_left: Math.max(0, 2 - c.acuteUses) };
}
/** Exact ordinary boundary arithmetic only: no future action/event or survival promise. */
export function v2NominalCareForecast(s: State, slot: number) {
  const phase = Math.max(0, Math.floor((Math.max(1, slot) - 1) / 10)), remaining = Math.max(0, 6 - phase);
  const water = [700,600,700,700,600,700].slice(phase).reduce((a,b) => a+b, 0);
  const moodPerPhase = Math.round(300 * (50 - s.stats[2]!) / 50);
  return { phase_boundaries_left: remaining,
    food_after_remaining_phase_losses: Math.max(0, s.needs[1]! - remaining * 500) / 100,
    water_after_remaining_phase_losses: Math.max(0, s.needs[2]! - water) / 100,
    morale_after_remaining_phase_losses: Math.max(0, s.needs[4]! - remaining * moodPerPhase) / 100,
    energy_after_remaining_phase_losses: s.needs[3]! / 100,
    note: 'Nominal phase losses only, if the life continues: no future actions, project recovery or new events. Existing condition damage and death are excluded. Living bedtime energy gain is separate.' };
}

const active = (s: State, id: number) => s.conditions[id]!.severity > 0 && !s.conditions[id]!.resolved;
const action = (a: Step): Step => ({ slot: a.slot, op: a.op, arg: a.arg, variant: a.variant, goods: [...a.goods] });
const same = (a: Step, b: Step) => a.op === b.op && a.arg === b.arg && a.variant === b.variant && a.goods.join(',') === b.goods.join(',');
export function v2ActivityFamily(a: Step): string {
  if ([Op.Quiet, Op.QuietMain].includes(a.op)) return 'mundane';
  if ([Op.Breakfast, Op.Eat, Op.Toast, Op.CookSteak, Op.Bowl, Op.Sandwich, Op.RawSteak].includes(a.op)) return 'food';
  if (a.op === Op.Drink) return 'drink'; if (a.op === Op.Coffee) return 'coffee';
  if ([Op.Treat, Op.Wash].includes(a.op)) return 'treatment'; if (a.op === Op.Rest) return 'rest';
  if ([Op.Leisure, Op.EnjoyFlower].includes(a.op)) return 'comfort';
  if (a.op === Op.Plant) return 'planting'; if (a.op === Op.Harvest) return 'harvest';
  if ([Op.Well, Op.RestoreSoil, Op.Abandon, Op.CoverPlot].includes(a.op)) return 'garden-care';
  if ([Op.Craft, Op.BuildChair, Op.BuildShelter].includes(a.op)) return 'making';
  if ([Op.Repair, Op.Patch, Op.BackupHeat].includes(a.op)) return 'repair';
  if (a.op === Op.Ship) return 'shipping'; return 'household';
}
export function v2ActionInterest(a: Step): V2Interest {
  const family = v2ActivityFamily(a);
  return ['planting', 'harvest', 'garden-care'].includes(family) ? 'gardening'
    : ['making', 'repair', 'shipping'].includes(family) ? 'making'
      : ['food', 'drink', 'coffee'].includes(family) ? 'cooking' : family === 'mundane' ? 'exploring' : 'comfort';
}
export function normalizeV2Memory(memory: V2MindMemory | undefined, day: number): V2MindMemory {
  const previous = (memory?.previousDays || []).filter(d => Number.isInteger(d.day) && d.day > 0 && d.day < day)
    .sort((a, b) => a.day - b.day).slice(-2).map(d => ({ day: d.day, actions: d.actions.filter(a => ![Op.QuietMain, Op.Pickup].includes(a.op)).slice(-6).map(a => ({ ...action(a), ...(typeof a.success === 'boolean' ? { success: a.success } : {}) })) }));
  return { ...(memory?.name ? { name: memory.name.slice(0, 8) } : {}), previousDays: previous,
    ...(memory?.pressureMicro && /^(0|[1-9]\d*)$/.test(memory.pressureMicro) ? { pressureMicro: memory.pressureMicro } : {}) };
}
export function v2ClippedRecovery(a: Candidate, s: State) {
  return Object.fromEntries(NEEDS.map((need, i) => [need, Math.min(10000 - Math.max(0, s.needs[i]! - (i === 3 ? a.energy : 0)), a.recovery[i] || 0) / 100]));
}
/** Short, varied menus preserve clinical options and avoid recipes crowding the mind. */
export function offerV2MindCandidates(context: Pick<Context, 'state' | 'day'>, candidates: Candidate[]): Candidate[] {
  // A free cutoff and a water douse have different safety outcomes; never prune a certified rescue.
  if (candidates.length && candidates.every(a => a.role === 'acute')) return [...candidates];
  const profile = v2Personality(context.state.seed), today = v2DayInclination(context.state.seed, context.day);
  const urgentFood = context.state.needs[1]! <= 3000 || context.state.needs[2]! <= 3000 || active(context.state,0) || active(context.state,1);
  const useful = candidates.filter(a => {
    if (urgentFood || ![Op.Breakfast,Op.Eat,Op.Drink].includes(a.op)) return true;
    const gains = Object.values(v2ClippedRecovery(a,context.state));
    if (Math.max(...gains) < 15) return false;
    if (a.op === Op.Breakfast) {
      const simpler = candidates.find(b=>b.op===Op.Eat&&b.arg===a.arg);
      if (simpler) {
        const before = Object.values(v2ClippedRecovery(simpler,context.state));
        if (Math.max(...gains.map((n,i)=>n-before[i]!)) < 10) return false;
      }
    }
    return true;
  });
  const score = (a: Candidate) => {
    const gain = v2ClippedRecovery(a, context.state), interest = v2ActionInterest(a);
    const important = a.op === Op.Treat ? 1000 - Math.min(99, context.state.conditions[a.arg]!.dueDay - context.day)
      : a.op === Op.Wash ? 800 : a.op === Op.Rest && context.state.needs[3]! <= 2000 ? 700 : 0;
    return important + Object.values(gain).reduce((n, v) => n + v, 0) - Object.values(a.inputs).reduce((n, v) => n + v, 0) * 3
      + Number(interest === profile.interest) * .3 + Number(interest === today.interest) * .2 + Number(a.op === Op.Harvest) * 2;
  };
  const ordered = [...useful].sort((a,b) => score(b)-score(a) || a.key.localeCompare(b.key));
  const selected: Candidate[] = [], seen = new Set<string>();
  const category = (a: Candidate) => a.op === Op.Treat || a.op === Op.Wash ? `${a.op}:${a.arg}` : a.op === Op.Craft ? `${a.op}:${a.arg}` : a.op === Op.Plant ? `${a.op}:${a.variant}` : [Op.Shoo,Op.Bait].includes(a.op) ? `response:${a.op}` : v2ActivityFamily(a);
  const limit = candidates.some(a=>a.role==='acute') ? 14 : 10;
  for (const a of ordered.filter(a=>a.role==='acute')) { selected.push(a); seen.add(`acute:${a.op}`); }
  for (const a of ordered) if (selected.length < limit && a.role!=='acute' && !seen.has(category(a))) { selected.push(a); seen.add(category(a)); }
  const quiet = ordered.find(a => a.op === Op.Quiet || a.op === Op.QuietMain);
  if (quiet && !selected.some(a => a.key === quiet.key)) selected.length < limit ? selected.push(quiet) : selected.splice(-1, 1, quiet);
  // Choose care coverage first. Only expand the already selected shipping family;
  // at most two extra baskets are appended, never replacing a clinical option.
  if(selected.some(a=>a.op===Op.Ship))for(const a of ordered.filter(a=>a.op===Op.Ship))if(selected.length<Math.min(14,limit+2)&&!selected.some(b=>b.key===a.key))selected.push(a);
  return selected;
}
function facts(a: Candidate, s: State, memory: V2MindMemory, today: Step[]) {
  const recovery = v2ClippedRecovery(a, s), prior = memory.previousDays?.flatMap(d => d.actions) || [];
  const clinical = a.op === Op.Treat ? s.conditions[a.arg] : undefined;
  const points = a.op === Op.Ship ? a.goods.reduce((n, id) => n + (id ? WEIGHTS[id - 23]! : 0), 0) : 0;
  const U = 1_000_000n, K = 50_000n * U;
  const price = points && memory.pressureMicro !== undefined ? BigInt(points) * U * K / (10n * (K + BigInt(memory.pressureMicro))) : undefined;
  const craft = a.op === Op.Craft ? RECIPES[a.arg] : undefined;
  const craftPrice = craft && memory.pressureMicro !== undefined ? BigInt(WEIGHTS[craft.output - 22]!) * U * K / (10n * (K + BigInt(memory.pressureMicro))) : undefined;
  return {
    action: a.label, role: a.role, family: v2ActivityFamily(a), interest: v2ActionInterest(a), use: a.inputs,
    ordinary_opportunity_cost: a.role === 'routine' ? 1 : 0,
    energy_cost: a.energy / 100, success_chance: a.chanceBps / 10000, effect: a.description,
    ...(a.recovery.some(Boolean) ? { clipped_gain_on_success: recovery } : {}),
    ...(a.possibleFailures.length ? { separate_risks: a.possibleFailures } : {}),
    ...(clinical ? { condition: CONDITIONS[a.arg], due_game_day: clinical.dueDay } : {}),
    ...(a.op === Op.Wash ? { exposure: CONDITIONS[a.arg] } : {}),
    ...(a.op === Op.Plant ? { bed: a.arg + 1, grows: PLANTS[a.variant]!.name, wet_bedtimes_until_ready: PLANTS[a.variant]!.ticks } : {}),
    ...(craft ? { object: craft.name, wood_required: craft.wood, produces: { item: ITEMS[craft.output], units: 1 },
      ...(craftPrice !== undefined ? { potential_single_unit_shipping_reward: { currency: 'NHC', micro_units: craftPrice.toString(), at_current_accepted_pressure: true,
        condition: 'No automatic credit. An actual eligible shipment must consume this finished unit; it costs an ordinary opportunity. Future-day quotes can differ.' } } : {}) } : {}),
    ...(s.goal >= 3 ? { saved_goal_material: { wood_now:s.inventory[6],wood_after_this_action:s.inventory[6]!-(a.inputs.wood||0)+(a.op===Op.Harvest?s.plots.filter(p=>p.kind===9&&p.ticks===0).length:0),wood_target:GOALS[s.goal]!.wood,
      note:'The intention is advisory. Waiting preserves material; necessary care or a worthwhile different project can still take priority.' } } : {}),
    ...nonRecoveryFacts(a, s),
    ...(points ? { shipping_base_points: points / 10, currency: 'NHC', credit_target: 'this NFT onchain purse',
      ...(price !== undefined ? { accepted_token_quote: (Number(price) / 1e6).toFixed(6), accepted_reward_micro: price.toString() } : {}) } : {}),
    familiarity: { exact_today: today.filter(x => same(x, a)).length, family_today: today.filter(x => v2ActivityFamily(x) === v2ActivityFamily(a)).length,
      prior_attempts: prior.filter(x => same(x, a)).length, prior_known_successes: prior.filter(x => x.success === true && same(x, a)).length },
    ...(a.recovery.some(Boolean) && Object.keys(a.inputs).length && Math.max(...Object.values(recovery)) < 15 ? { resource_caution:'Only a small recovery fits; a whole item is spent. Compare free comfort or an ordinary moment.' } : {}),
  };
}
function nonRecoveryFacts(a: Candidate, s: State): Record<string, unknown> {
  const fixture = ['stove','window','chair'][a.arg];
  switch(a.op) {
    case Op.Repair:return {target:fixture,does:'Clear this actual fixture damage on success; age is unchanged'};
    case Op.Patch:return {target:fixture,does:'Temporary patch for 2 living bedtimes including today; damage remains'};
    case Op.RestoreSoil:return {bed:a.arg+1,does:'Clear blocked soil only; no water or growth'};
    case Op.Douse:return {target:'stove',does:'Spend water to resolve flame/smoke without residual fire damage'};
    case Op.Shutdown:return {target:'stove',does:'Stop flame without water; smoke still causes one physical hit at its boundary',residual_health_loss:Math.round(500*(50-s.stats[0]!)/50)/100};
    case Op.BraceRain:return {target:'window',does:'Spend toolkit to prevent this storm exposure and stock loss; underlying damage remains'};
    case Op.CoverRain:return {target:'body',does:'Spend umbrella to prevent this storm physical exposure only; stock loss may remain'};
    case Op.Well:return {target:'all occupied beds',does:'Set moisture to 2 without drinking bottles; no instant growth'};
    case Op.Harvest:return {collects:s.plots.flatMap((p,i)=>p.kind&&p.ticks===0?[{bed:i+1,item:ITEMS[Number(PLANTS[p.kind]!.output)],units:1}]:[]),does:'One round collects all ready outputs; first pickup counts toward finite total'};
    case Op.Craft:return {does:'Spend real wood to create one actual finished inventory object. It can be kept or included in an eligible shipment; it does not restore needs or grant a household buff.'};
    case Op.Ship:return {does:'Consume the indicated real finished goods and credit their accepted NHC reward to this NFT purse. No needs recovery. Goods that are not shipped stay in inventory.'};
    case Op.BuildChair:return {does:'One optional chair lasting 5 living bedtimes including today; chair leisure gives 15 morale instead of 10'};
    case Op.BuildShelter:return {does:'Garden weather cover for 4 living bedtimes including today; no water/growth'};
    case Op.CoverPlot:return {bed:a.arg+1,does:'Weather cover for this bed for 3 living bedtimes; no water/growth'};
    case Op.Abandon:return {bed:a.arg+1,does:'Remove the plant with no salvage/reward; blocked soil remains'};
    case Op.MoveChair:return {does:'Move the same chair once today; no new object or renewed age'};
    case Op.Coffee:return {side_effect:'Jitters until bedtime; a 5-percentage-point precision penalty on tagged tasks'};
    case Op.DeepClean:return {does:'Spend soap to reduce Mess2 to Mess1, not clear exposure'};
    case Op.Tidy:return {does:'Clear actual Mess1 to zero'};
    case Op.Wash:return {does:'Clear the named exposure only, not established illness/infection'};
    case Op.Treat:return {does:'Clear this named condition only and restore 15 health; other conditions remain'};
    case Op.Shoo:return {does:'One attempt to end the current visitor; failure leaves scheduled loss and may cause contact exposure'};
    case Op.Bait:return {does:'Spend bait to end the current visitor; no rooster consumption/planting benefit'};
    case Op.Quiet:case Op.QuietMain:return {does:'Ordinary quiet time with no recovery, resources or new reward'};
    default:return {};
  }
}
function observedEventFacts(e: V2ObservedEpisode, s: State) {
  const physical = (n: number) => Math.round(n * (50 - s.stats[0]!) / 50) / 100;
  const target = e.kind === 'fire' ? { fixture: 'stove' }
    : e.kind === 'rain' ? { fixture: 'window' }
      : ['seedEater', 'washout'].includes(e.kind) ? { bed: e.target + 1 }
        : e.kind === 'visitor' && e.stock < ITEMS.length ? { stock: ITEMS[e.stock] }
          : e.kind === 'fixtureBreak' ? { fixture: ['stove', 'window', 'chair'][e.target] }
            : e.kind === 'mishap' ? { body: true } : {};
  let atBoundary: Record<string, unknown> = { additional_effect: 'None; the observed onset effects are already in current state.' };
  if (e.kind === 'fire') atBoundary = s.house.fire === 1
    ? { if_flame_remains: { health_loss: physical(2000), wound_severity: 2, wound_due_game_day: s.day + 1, kitchen_mess_increase_up_to: 1 } }
    : s.house.fire === 2 ? { if_smoke_remains: { health_loss: physical(500), new_wound: false } } : { additional_effect: 'None; the fire is out.' };
  if (e.kind === 'rain') atBoundary = s.house.damage & 2 && !s.house.windowPatch && !s.house.windowBrace
    ? { health_loss_unless_covered: e.covered ? 0 : physical(1200),
      ...(e.stock < ITEMS.length && !e.diverted && !s.house.dripDiverted ? { stock_loss_if_still_present: { item: ITEMS[e.stock], units: 1 } } : {}) }
    : { additional_effect: 'None while the window remains sound, patched or braced.' };
  if (e.kind === 'seedEater') atBoundary = { if_target_is_still_growing: { growth_delay_up_to_wet_bedtimes: 1, capped_at_current_growth_cycle: true }, stops_if_resolved: true };
  if (e.kind === 'visitor') atBoundary = { stock_loss_if_still_present_and_unresolved: { item: ITEMS[e.stock], units: 1 } };
  return { source: e.source, kind: e.kind, observed_from_slot: e.startSlot, boundary_slot: e.deadlineSlot,
    target, response_already_used: e.responded, shoo_already_tried: e.shooTried,
    ...(e.kind === 'rain' ? { body_covered: e.covered } : {}), at_boundary: atBoundary };
}
function stateFacts(s: State, day: number, slot: number, memory: V2MindMemory) {
  const personality = v2Personality(s.seed), inclination = v2DayInclination(s.seed, day);
  return {
    role: 'A nearly-human rooster with one continuous domestic day, one useful project and a few small ordinary moments. Tastes are soft preferences, never new rules or benefits.',
    ...(memory.name ? { name: memory.name } : {}), day, slot, phase: ['Dawn','Morning','Midday','Afternoon','Evening','Bedtime'][Math.max(0, Math.floor((Math.max(1, slot) - 1) / 10))],
    individuality: { version: V2_PERSONALITY_VERSION, ...personality, today: inclination },
    needs: Object.fromEntries(NEEDS.map((k, i) => [k, s.needs[i]! / 100])), traits: { body: s.stats[0], wits: s.stats[1], spirit: s.stats[2] },
    stock: Object.fromEntries(ITEMS.flatMap((id, i) => s.inventory[i] ? [[id, s.inventory[i]]] : [])),
    conditions: s.conditions.flatMap((c, i) => c.severity && !c.resolved ? [{ kind: CONDITIONS[i], severity: c.severity, onset_day: c.onsetDay, due_day: c.dueDay||null,
      ...(i>=6?{exposure_risk_from_day:c.onsetDay+1}:{}) }] : []),
    garden: s.plots.map((p, i) => ({ bed: i + 1, plant: PLANTS[p.kind]!.name || null, ready: !!p.kind && p.ticks === 0, wet_bedtimes_remaining: p.ticks, remaining_pickups: p.left, moisture: p.moisture, blocked_soil: p.soilBlocked })),
    house: s.house, intention: { id: s.goal, label: GOALS[s.goal]!.label, wood_saved: s.inventory[6], wood_target: GOALS[s.goal]!.wood,
      review_on_day: s.goalReviewDay, review_is_not_a_completion_deadline: true },
    previous_days: { source: 'Canonical bounded executed attempts from completed days. Success is unknown unless explicitly included; not a full biography.', days: memory.previousDays || [] },
    economy: { currency: 'NHC', earns_by: 'An actual shipment of finished home-grown or handmade goods credits this NFT purse; crafting alone does not mint tokens.',
      owner_controls: 'The current NFT owner can explicitly withdraw NHC or burn 250 NHC to hatch another NFT life. Purse funds survive death.',
      token_hatch_price_micro: '250000000', ai_may_withdraw_or_spend: false, cash_redemption_promised: false,
      choice: 'Keeping, enjoying, eating or shipping actual goods are different valid choices when offered. The purse reward is a real option, not a requirement to maximize profit.' },
    rhythm: { remaining_phase_losses: 6 - Math.floor((Math.max(1, slot) - 1) / 10), food_loss_per_phase: 5, water_loss_by_phase: [7,6,7,7,6,7], morale_loss_per_phase: Math.round(300 * (50 - s.stats[2]!) / 50) / 100,
      energy_loss_per_phase: 0, living_bedtime_energy: 35, rest_uses_per_day: 2, leisure_uses_per_day: 2 },
    care_timing: v2NominalCareForecast(s, slot),
    rule: 'One main undertaking and five ordinary opportunities. Supplies wait outside until pickup. No offline aging. Safe care may repeat. No automatic wealth spending; shipping consumes actual finished items. Use only an offered choice and never invent growth, materials or a benefit.',
  };
}
function request(kind: V2ModelRequest['kind'], state: Record<string, unknown>, questions: Record<string, unknown>, expected: Record<string, string[]>): V2ModelRequest {
  for (const keys of Object.values(expected)) if (!keys.length || keys.length > 24 || new Set(keys).size !== keys.length) throw Error('Invalid Jev choice vocabulary.');
  const input = { model: 'typesafe/jev-1.13', state: { policy: V2_MIND_POLICY, ...state }, questions };
  const body = JSON.stringify(input); if (Buffer.byteLength(body) > 14_000) throw Error('Jev context is too large.');
  return { input, inputHash: createHash('sha256').update(body).digest('hex'), expected, kind };
}
export function buildV2Request(decision: V2Decision, rawMemory?: V2MindMemory): V2ModelRequest {
  const memory = normalizeV2Memory(rawMemory, decision.day), today = decision.earlierToday.filter(a => ![Op.QuietMain,Op.Pickup].includes(a.op)).slice(-8);
  const executed = decision.earlierToday;
  const opportunities = decision.opportunities || v2OpportunityBudget({ slot: decision.slot,
    ordinaryUses: executed.filter(a=>!MAIN_OPS.has(a.op)&&!ACUTE_OPS.has(a.op)&&a.op!==Op.Pickup).length,
    ordinaryMask: executed.filter(a=>!MAIN_OPS.has(a.op)&&!ACUTE_OPS.has(a.op)&&a.op!==Op.Pickup).reduce((mask,a)=>mask|(1<<Math.max(1,Math.floor((a.slot-1)/10))),0),
    mainUsed: executed.some(a=>MAIN_OPS.has(a.op)), acuteUses: executed.filter(a=>ACUTE_OPS.has(a.op)).length });
  // This is the canonical menu already recorded by preparation, not a second filter.
  const offered = decision.candidates;
  return request(decision.mode, { ...stateFacts(decision.state, decision.day, decision.slot, memory), decision_kind: decision.mode, earlier_today: today,
    observed_events: (decision.observedEpisodes || []).map(e => observedEventFacts(e, decision.state)),
    opportunities, opportunity_note: 'Explicit quiet moments spend an ordinary opportunity too. Breakfast or milk may combine care within one opportunity; this is an available tradeoff, not an instruction to choose it. Acute uses need an actual eligible episode.',
    ...(decision.dailyFocus ? { main_undertaking: { ...decision.dailyFocus, nominal_recovery: Object.fromEntries(NEEDS.map((k,i)=>[k,(decision.dailyFocus!.recovery[i]||0)/100])),
      clipped_recovery_if_done_now:Object.fromEntries(NEEDS.map((k,i)=>[k,Math.min(10000-decision.state.needs[i]!,decision.dailyFocus!.recovery[i]||0)/100])), intended_slot:36, success_not_guaranteed:decision.dailyFocus.chanceBps<10000 } } : {}) }, {
    next_action: { type: 'choice', instructions: decision.mode === 'acute' ? 'Deal with the actual immediate danger before its boundary. Legal ordinary care may need to happen before a response to survive residual harm. Compare whole-item costs, exact health, active conditions and stated residual damage; do not blindly use a free cutoff if its smoke would kill you.'
      : decision.mode === 'focus' ? 'Choose one substantial, feasible undertaking. Let the current intention, real materials, useful repairs/harvests and this individual\'s tastes guide it. A sensible needed task may repeat. Do not invent a second project.'
        : 'Choose one small moment around the day\'s project. Due treatment and serious needs come first. Current observed events describe real targets and boundary consequences; compare an available response with care before that boundary. Otherwise compare useful care with a quiet ordinary moment. Do not top every need to100 reflexively; whole items are spent and energy does not decay each phase. Familiar care can repeat; optional habits may vary. Keep real long-term materials when a modest or free option suffices.',
      criteria: Object.fromEntries(offered.map(a => [a.key, facts(a, decision.state, memory, today)])) },
  }, { next_action: offered.map(a => a.key) });
}

const GOALS: V2GoalOption[] = [
  { key: '0', id: 0, label: 'No long project for now' }, { key: '1', id: 1, label: 'Enjoy a home-grown flower' },
  { key: '2', id: 2, label: 'Tend the garden' }, { key: '3', id: 3, label: 'Save for a spoon', wood: 3 },
  { key: '4', id: 4, label: 'Save for a toy boat', wood: 6 }, { key: '5', id: 5, label: 'Save for a birdhouse', wood: 8 },
  { key: '6', id: 6, label: 'Save for a large chest', wood: 10 },
];
export function v2PlanChoices(context: V2PlanContext): V2PlanChoices {
  const memory = normalizeV2Memory(context.memory, context.base.day + 1), profile = v2Personality(context.base.seed), today = v2DayInclination(context.base.seed, context.base.day + 1);
  const preview = openDay(context.base, context.kit, context.seed, context.shipping); preview.slot = 36; preview.open = true; preview.pickup = true;
  for (const id of kitItems(context.kit)) preview.state.inventory[id]!++;
  const available = legalActions(preview),quiet = available.find(a=>a.op===Op.QuietMain)!;
  let main = available.filter(a => a.role === 'main' && a.op !== Op.QuietMain);
  const productive = main.some(a => [Op.Plant,Op.Harvest,Op.Craft,Op.RestoreSoil,Op.Repair].includes(a.op));
  if (productive) main = main.filter(a => ![Op.Toast,Op.CookSteak,Op.Bowl,Op.Sandwich].includes(a.op) || Math.max(...Object.values(v2ClippedRecovery(a, context.base))) >= 10);
  const score = (a: Candidate) => Number(v2ActionInterest(a) === profile.interest) * 3 + Number(v2ActionInterest(a) === today.interest) * 2 + Number(v2ActionInterest(a) === profile.secondaryInterest)
    + Number(a.op === Op.Harvest) * 2 + Number(a.op === Op.Craft && context.base.goal === a.arg + 3) * 3;
  main.sort((a, b) => score(b) - score(a) || a.key.localeCompare(b.key));
  const seen = new Set<string>(); main = main.filter(a => { const k = a.op === Op.Plant ? `${a.op}:${a.variant}` : `${a.op}:${a.arg}`; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 7);
  main.push(quiet);
  const morning: V2MorningOption[] = [{ key: 'collect-first', label: context.kit ? 'Collect the parcel first' : 'Begin at home; no parcel is waiting' }];
  const urgent = context.base.needs[1]! <= 3000 || context.base.needs[2]! <= 3000 || context.base.conditions.some((c, i) => c.severity && !c.resolved && i < 5);
  if (context.kit && !urgent) {
    const before = openDay(context.base, context.kit, context.seed, context.shipping); before.slot = 1; before.open = true;
    const candidates = legalActions(before).filter(a => a.role === 'routine');
    const reserve = (id: string) => Math.max(0, ...main.map(a => a.inputs[id] || 0));
    const safe = (a: Candidate) => Object.entries(a.inputs).every(([id, n]) => context.base.inventory[ITEMS.indexOf(id as typeof ITEMS[number])]! - n >= reserve(id));
    const coffee = candidates.filter(a => a.op === Op.Coffee && safe(a) && Math.max(...Object.values(v2ClippedRecovery(a, context.base))) >= 5);
    for (const a of coffee) morning.push({ key: `coffee-${a.variant}`, label: `${a.label} with existing pantry stock, then collect`, beforePickup: action(a), candidate: a });
    const breakfast = candidates.find(a => a.op === Op.Breakfast && a.arg === 2 && a.variant === 0 && safe(a));
    if (breakfast && (context.base.needs[1]! <= 7000 || context.base.needs[2]! <= 6500)) morning.push({ key: 'breakfast-first', label: 'Have existing pantry breakfast, then collect', beforePickup: action(breakfast), candidate: breakfast });
    const quiet = candidates.find(a => a.op === Op.Quiet); if (quiet) morning.push({ key: 'look-first', label: 'Take a quiet look, then collect', beforePickup: action(quiet), candidate: quiet });
  }
  const goals = context.base.goal === 0 || context.base.goalReviewDay <= context.base.day + 1 ? GOALS.map(g => ({ ...g })) : [];
  return { ...context, memory, main, morning, goals };
}
export function buildV2PlanRequest(context: V2PlanChoices): V2ModelRequest {
  const memory = context.memory || {}, future = structuredClone(context.base);
  for (const id of kitItems(context.kit)) future.inventory[id]!++;
  const questions: Record<string, unknown> = {
    main_undertaking: { type: 'choice', instructions: 'Choose ONE afternoon undertaking from feasible materials after parcel collection. Prefer meaningful progress and this individual\'s tastes over automatically repeating yesterday. A useful harvest, repair or meal may repeat. This is an intention, not immediate work; urgent care can prevent it. Do not invent ripe plants, growth or another project.', criteria: Object.fromEntries(context.main.map(a => [a.key, facts(a, future, memory, [])])) },
    morning_order: { type: 'choice', instructions: 'Choose a natural morning. Before-pickup activities use EXISTING pantry stock and consume one ordinary opportunity, including a quiet look. They share the Morning phase rather than adding a sixth opportunity. Compare useful ritual, simple care and a quiet look against the remaining day. Collection follows, and urgent care can change this order.', criteria: Object.fromEntries(context.morning.map(m => [m.key, { ...(m.candidate ? facts(m.candidate, context.base, memory, []) : { no_before_pickup_action: true }), action: m.label, ordinary_opportunity_cost: m.beforePickup ? 1 : 0, ordinary_opportunities_left_after_this_morning: m.beforePickup ? 4 : 5 }])) },
  };
  const expected: Record<string, string[]> = { main_undertaking: context.main.map(a => a.key), morning_order: context.morning.map(a => a.key) };
  if (context.goals.length) { questions.long_intention = { type: 'choice', instructions: 'Choose or review one modest long-term intention. Keeping it is valid. Progress uses actual wood/plants/stock; reviewing after three days is not a completion deadline. Care still comes first, and this intention never authorizes spending or creates anything.', criteria: Object.fromEntries(context.goals.map(g => [g.key, { intention: g.label, ...(g.wood ? { wood_target: g.wood, actual_wood: context.base.inventory[6] } : {}) }])) }; expected.long_intention = context.goals.map(a => a.key); }
  return request('plan', { ...stateFacts(context.base, context.base.day + 1, 0, memory), decision_kind: 'dawn_plan', opportunities: v2OpportunityBudget({slot:0,ordinaryUses:0,ordinaryMask:0,mainUsed:false,acuteUses:0}),
    delivery_waiting_outside: kitItems(context.kit).map(i => ITEMS[i]), project_stock_after_collection: Object.fromEntries(ITEMS.flatMap((id, i) => future.inventory[i] ? [[id, future.inventory[i]]] : [])) }, questions, expected);
}
export function decodeV2Choice(reply: V2ModelReply): V2Selection {
  const answer = reply.answers.next_action; if (!answer) throw Error('Missing action choice.');
  return { key: answer.choice, probabilities: answer.probabilities, model: reply.exchange.model, responseId: reply.exchange.responseId };
}
export function decodeV2Plan(reply: V2ModelReply, choices: V2PlanChoices): V2DailyPlan {
  const main = choices.main.find(a => a.key === reply.answers.main_undertaking?.choice), morning = choices.morning.find(a => a.key === reply.answers.morning_order?.choice);
  const goal = choices.goals.length ? choices.goals.find(g => g.key === reply.answers.long_intention?.choice) : undefined;
  if (!main || !morning || choices.goals.length && !goal) throw Error('Missing day-plan choice.');
  return { goal: goal?.id ?? 255, focus: action(main), ...(morning.beforePickup ? { morningBeforePickup: action(morning.beforePickup) } : {}), mainKey: main.key, mainLabel: main.label, morningKey: morning.key, ...(goal ? { goalKey: goal.key } : {}), model: reply.exchange.model, responseId: reply.exchange.responseId };
}
