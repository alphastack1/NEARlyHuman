import { keccak256, toHex, type Hex } from 'viem';
import {
  Op, openDay, beginSlot, endSlot, finishDay, previewPrimary, legalActions, actionKey,
  decodeState, encodeState, encodeTrace, encodeCertificate, replayDay, shipmentPoints,
  buildCareCertificate,
  CERTIFICATE_OPS,
  type State, type Step, type Candidate, type Certificate, type Context, type Trace, type Receipt,
} from '../../src/v2';
import { type V2FrozenInput, v2WorkerInputHash, validateV2FrozenInput, V2ContextError } from './context';
import { v2PlanChoices, offerV2MindCandidates, v2OpportunityBudget, V2_MIND_POLICY, type V2DailyPlan, type V2PlanChoices, type V2MindMemory, type V2OpportunityBudget } from './choices';

export const V2_PREPARATION_POLICY = 'v2-canonical-dawn-plan-memory-3';
export const v2DecisionConfig = (rulesHash: Hex): Hex => keccak256(toHex(JSON.stringify({
  policy: V2_PREPARATION_POLICY, mind: V2_MIND_POLICY, rulesHash: rulesHash.toLowerCase(), model: 'typesafe/jev-1.13', maxChoices: 8,
})));
export interface V2Selection {
  key: string;
  model?: string;
  responseId?: string;
  probabilities?: Record<string, number>;
}
export interface V2Decision {
  inputHash: Hex;
  requestId: Hex;
  day: number;
  slot: number;
  mode: 'focus' | 'routine' | 'acute';
  state: State;
  earlierToday: Step[];
  candidates: Candidate[];
  opportunities?: V2OpportunityBudget;
  dailyFocus?: { key: string; label: string; status: 'planned' | 'completed' | 'failed' | 'unavailable'; inputs: Record<string, number>; recovery: number[]; chanceBps: number };
}
export interface V2RecordedDecision {
  inputHash: Hex;
  slot: number;
  mode: V2Decision['mode'];
  candidates: string[];
  selected: string;
  source: 'provider' | 'single' | 'plan';
  model?: string;
  responseId?: string;
  probabilities?: Record<string, number>;
}
export interface V2PreparationOptions {
  allowLocal?: boolean;
  memory?: V2MindMemory;
  /** One cached/funded Dawn call chooses the afternoon intention, morning and goal. */
  plan?: (choices: V2PlanChoices) => Promise<V2DailyPlan>;
  onPlan?: (plan: V2DailyPlan) => Promise<void>;
  /** Optional already recorded Dawn intention. It never grants an extra turn. */
  goal?: number;
  focus?: Step;
  morningBeforePickup?: Step;
  nowSeconds?: () => number;
  certificate?: (proposal: { context: Context; kind: string; harmful: boolean }) => Promise<Certificate | undefined>;
  offer?: (context: Context, candidates: Candidate[]) => Candidate[];
  /** The caller durably caches/reserves provider work, as with the existing worker. */
  onDecision?: (decision: V2RecordedDecision) => Promise<void>;
}
export type V2ChoiceProvider = (decision: V2Decision) => Promise<V2Selection>;

const digest = (value: unknown): Hex => keccak256(toHex(JSON.stringify(value)));
const K = 50_000n * 1_000_000n;
const reward = (points: number, pressure: bigint) => BigInt(points) * 1_000_000n * K / (10n * (K + pressure));
const current = (s: State, id: number) => s.conditions[id]!.severity > 0 && !s.conditions[id]!.resolved;
const rank = (c: Context, a: Candidate) => {
  if (a.op === Op.Treat) return 10_000 - Math.min(999, c.state.conditions[a.arg]!.dueDay - c.day);
  if (a.op === Op.Wash) return 8_000;
  if ([Op.Breakfast, Op.Eat, Op.Drink].includes(a.op)) return 2_000 + (10_000 - Math.min(c.state.needs[1]!, c.state.needs[2]!)) / 10 - Object.values(a.inputs).reduce((s, n) => s + n, 0) * 10;
  if (a.op === Op.Rest && c.state.needs[3]! <= 2000) return 7_000;
  if ([Op.Leisure, Op.EnjoyFlower].includes(a.op)) return c.state.needs[4]! <= 2000 ? 6_000 : 100;
  if (a.op === Op.Harvest) return 300;
  if (a.op === Op.Craft && c.state.goal === a.arg + 3) return 400;
  if ([Op.Repair, Op.RestoreSoil].includes(a.op)) return 250;
  if (a.op === Op.Plant) return 200;
  return a.op === Op.Quiet || a.op === Op.QuietMain ? -100 : 0;
};
const family = (a: Candidate) => a.op === Op.Ship ? `${a.op}:${a.goods.join(',')}` : a.op === Op.Plant ? `${a.op}:${a.variant}` : a.op === Op.Craft || a.op === Op.Treat || a.op === Op.Wash || a.op === Op.Repair ? `${a.op}:${a.arg}` : String(a.op);

/** Finite coverage keeps all clinical choices and avoids four identical beds filling a menu. */
export function offerV2Candidates(context: Context, candidates: Candidate[]): Candidate[] {
  const ordered = [...candidates].sort((a, b) => rank(context, b) - rank(context, a) || a.key.localeCompare(b.key));
  const chosen: Candidate[] = [], seen = new Set<string>();
  for (const a of ordered) if ((a.op === Op.Treat && current(context.state, a.arg) || a.op === Op.Wash && current(context.state, a.arg)) && !chosen.some(x => x.key === a.key)) {
    chosen.push(a); seen.add(family(a));
  }
  for (const a of ordered) if (chosen.length < 24 && !seen.has(family(a))) { chosen.push(a); seen.add(family(a)); }
  return chosen;
}

/**
 * Builds only a canonical legal trace. It does not settle, sign or spend itself.
 * A real network provider must keep the existing durable budget-before-send rule.
 */
export async function prepareV2(rawInput: V2FrozenInput, provider: V2ChoiceProvider, options: V2PreparationOptions = {}) {
  const input = validateV2FrozenInput(rawInput, options.allowLocal);
  const base = decodeState(input.base);
  if (input.version !== 2 || base.day + 1 !== input.day || base.level !== base.day || !base.alive
    || keccak256(input.base).toLowerCase() !== input.baseHash.toLowerCase()
    || input.runtime.decisionConfig.toLowerCase() !== v2DecisionConfig(input.runtime.rulesHash)) throw new V2ContextError('context', 'This accepted day needs another check.');
  const now = options.nowSeconds || (() => Math.floor(Date.now() / 1000));
  const checkDeadline = () => { if (now() > Number(input.deadline)) throw new V2ContextError('expired', 'This attempt has expired. The saved day is unchanged.'); };
  const frozenHash = v2WorkerInputHash(input);
  let dailyPlan: V2DailyPlan | undefined, plannedCandidate: Candidate | undefined, paidChoices = 0;
  if (options.plan) {
    checkDeadline();
    const choices = v2PlanChoices({ requestId: input.requestId, base, kit: BigInt(input.kitMask), seed: input.daySeed, shipping: input.shipping, memory: options.memory });
    const selected = await options.plan(structuredClone(choices)); checkDeadline(); paidChoices++;
    plannedCandidate = choices.main.find(a => a.key === selected.mainKey);
    const morning = choices.morning.find(a => a.key === selected.morningKey);
    const goal = choices.goals.length ? choices.goals.find(a => a.key === selected.goalKey) : undefined;
    if (!plannedCandidate || !morning || choices.goals.length && (!goal || selected.goal !== goal.id) || !choices.goals.length && selected.goal !== 255) throw new Error('The day plan is unavailable.');
    dailyPlan = { goal: goal?.id ?? 255, focus: { slot: 36, op: plannedCandidate.op, arg: plannedCandidate.arg, variant: plannedCandidate.variant, goods: [...plannedCandidate.goods] },
      ...(morning.beforePickup ? { morningBeforePickup: structuredClone(morning.beforePickup) } : {}), mainKey: plannedCandidate.key, mainLabel: plannedCandidate.label,
      morningKey: morning.key, ...(goal ? { goalKey: goal.key } : {}), ...(selected.model ? { model: selected.model.slice(0, 100) } : {}), ...(selected.responseId ? { responseId: selected.responseId.slice(0, 200) } : {}) };
    await options.onPlan?.(structuredClone(dailyPlan));
  }
  const trace: Trace = { goal: dailyPlan?.goal ?? options.goal ?? 255, steps: [] };
  const ctx = openDay(base, BigInt(input.kitMask), input.daySeed, input.shipping, trace.goal);
  const receipts: Receipt[] = [], decisions: V2RecordedDecision[] = [];
  const intendedFocus = dailyPlan?.focus || options.focus, morningAction = dailyPlan?.morningBeforePickup || options.morningBeforePickup;
  let focusStatus: 'planned' | 'completed' | 'failed' | 'unavailable' = 'planned';
  let certificate: Certificate | undefined, morningDone = false;
  for (let slot = 1; slot <= 60 && ctx.state.alive; slot++) {
    checkDeadline();
    const proposal = previewPrimary(ctx, slot);
    if (proposal?.harmful) certificate = options.certificate ? await options.certificate(proposal) : buildCareCertificate(proposal.context);
    beginSlot(ctx, slot, certificate);
    if (!ctx.state.alive) { receipts.push(endSlot(ctx)); break; }
    let all: Candidate[] | undefined;
    const available = () => all ||= legalActions(ctx).filter(a => a.op !== Op.Ship || reward(shipmentPoints(a.goods), BigInt(input.pressure)) > 0n);
    let chosen: Candidate | undefined, mode: V2Decision['mode'] | undefined, source: V2RecordedDecision['source'] | undefined;
    const immediate = available().filter(a => a.role === 'acute');
    const clinical = ctx.state.conditions.some((c,i)=>c.severity&&!c.resolved&&i<5);
    const scheduledDawnHarm = [ctx.primary,ctx.taskFire].some(e=>e&&!e.resolved&&e.deadline<=10&&(e.kind==='fire'||e.kind==='rain'));
    const dawnDanger = slot <= 5 && (ctx.state.needs[1]!<=3000 || ctx.state.needs[2]!<=3000 || clinical || immediate.length>0 || scheduledDawnHarm);
    // The parcel can contain the actual rescue. Pickup is free of ordinary/acute uses,
    // and every eligible Dawn episode leaves time to act before its first boundary.
    if (!ctx.pickup && dawnDanger) chosen = available().find(a=>a.op===Op.Pickup);
    else if (!ctx.pickup) {
      if (!morningDone && morningAction && slot <= 5 && !ctx.state.conditions.some((c, i) => c.severity && !c.resolved && i < 5)
        && ctx.state.needs[1]! > 3000 && ctx.state.needs[2]! > 3000) {
        const key = actionKey(morningAction);
        chosen = available().find(a => a.key === key && a.role === 'routine');
        if (chosen) { mode = 'routine'; source = 'plan'; }
        morningDone = true;
      }
      if (!chosen) chosen = available().find(a => a.op === Op.Pickup);
    } else {
      if (immediate.length) {
        const care = dawnDanger ? available().filter(a=>a.role==='routine'&&CERTIFICATE_OPS.has(a.op)) : [];
        all = [...immediate,...care]; mode='acute';
      }
      else if ((slot >= 11 || dawnDanger) && available().some(a => a.role === 'routine')) { all = available().filter(a => a.role === 'routine'); mode = 'routine'; }
      else if (slot >= 36 && slot <= 40 && !ctx.mainUsed) {
        all = available().filter(a => a.role === 'main'); mode = 'focus';
        if (intendedFocus) {
          chosen = all.find(a => a.key === actionKey(intendedFocus));
          if (!chosen && dailyPlan) { chosen = all.find(a => a.op === Op.QuietMain); focusStatus = 'unavailable'; }
          if (chosen) source = 'plan';
        }
      }
    }
    if (mode) {
      const legal = chosen ? [chosen] : all || [];
      const suggested = chosen ? legal : (options.offer || offerV2MindCandidates)(structuredClone(ctx), structuredClone(legal));
      if (!suggested.length || suggested.length > 24 || new Set(suggested.map(a => a.key)).size !== suggested.length || suggested.some(a => !legal.some(l => l.key === a.key))) throw new Error('Invalid V2 choice menu.');
      const offered = suggested.map(a => legal.find(l => l.key === a.key)!);
      const opportunities = v2OpportunityBudget(ctx);
      const decisionHash = digest({ policy: V2_PREPARATION_POLICY, frozenHash, slot, mode, state: ctx.state, candidates: offered, opportunities });
      let reply: V2Selection | undefined;
      if (!chosen) {
        if (offered.length === 1) { chosen = offered[0]!; source = 'single'; }
        else {
          if (++paidChoices > 8) throw new Error('The day exceeded its decision budget.');
          checkDeadline();
          reply = await provider({ inputHash: decisionHash, requestId: input.requestId, day: ctx.day, slot, mode, state: structuredClone(ctx.state), earlierToday: structuredClone(trace.steps), candidates: structuredClone(offered), opportunities,
            ...(plannedCandidate && dailyPlan ? { dailyFocus: { key: dailyPlan.mainKey, label: dailyPlan.mainLabel, status: focusStatus, inputs: structuredClone(plannedCandidate.inputs), recovery: [...plannedCandidate.recovery], chanceBps: plannedCandidate.chanceBps } } : {}) });
          checkDeadline();
          chosen = offered.find(a => a.key === reply?.key); source = 'provider';
          if (!chosen) throw new Error('The selected V2 action is unavailable.');
        }
      }
      const probabilities = reply?.probabilities;
      if (probabilities && (offered.some(a => !Number.isFinite(probabilities[a.key]) || probabilities[a.key]! < 0 || probabilities[a.key]! > 1)
        || Math.abs(offered.reduce((s, a) => s + probabilities[a.key]!, 0) - 1) > .02)) throw new Error('Invalid V2 choice probabilities.');
      const record: V2RecordedDecision = { inputHash: decisionHash, slot, mode, candidates: offered.map(a => a.key), selected: chosen!.key, source: source!,
        ...(typeof reply?.model === 'string' ? { model: reply.model.slice(0, 100) } : {}),
        ...(typeof reply?.responseId === 'string' ? { responseId: reply.responseId.slice(0, 200) } : {}),
        ...(probabilities ? { probabilities: Object.fromEntries(offered.map(a => [a.key, probabilities[a.key]!])) } : {}) };
      await options.onDecision?.(record); decisions.push(record);
    }
    if (chosen) trace.steps.push({ slot, op: chosen.op, arg: chosen.arg, variant: chosen.variant, goods: [...chosen.goods] });
    const receipt = endSlot(ctx, chosen); receipts.push(receipt);
    if (chosen?.role === 'main' && focusStatus !== 'unavailable') focusStatus = receipt.success ? 'completed' : 'failed';
  }
  const result = finishDay(ctx, receipts, trace);
  if (dailyPlan && focusStatus === 'planned') focusStatus = 'unavailable';
  checkDeadline();
  const checked = replayDay(base, BigInt(input.kitMask), trace, input.daySeed, input.shipping, certificate);
  const state = encodeState(result.state), encodedTrace = encodeTrace(trace), encodedCertificate = encodeCertificate(certificate);
  if (encodeState(checked.state) !== state || checked.points !== result.points) throw new Error('The V2 prepared trace did not reproduce.');
  const tokenReward = reward(result.points, BigInt(input.pressure));
  if (tokenReward > BigInt(input.reservedReward) || result.points > 0 && tokenReward === 0n) throw new Error('The V2 shipment exceeds its accepted quote.');
  const packet = { version: 2 as const, policy: V2_PREPARATION_POLICY, inputHash: frozenHash, requestId: input.requestId,
    decisionConfig: input.runtime.decisionConfig, result, decisions, ...(dailyPlan ? { dailyPlan: { ...dailyPlan, status: focusStatus } } : {}), trace: encodedTrace, certificate: encodedCertificate, state,
    stateHash: keccak256(state), rewardMicro: tokenReward.toString() };
  return { packet, commitment: digest(packet) };
}
