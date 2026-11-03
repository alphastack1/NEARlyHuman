import { Op, type Receipt } from '../../v2/types';

export type VisitorKind = 'seedEater' | 'visitor';
export interface RecordedAmbience {
  rainUntil: number;
  visitor?: { kind: VisitorKind; bed: number; untilSlot: number };
}
export type EventAccentKind = 'rain' | 'fire' | 'outage' | 'fixtureBreak' | 'mishap' | 'sickness' | 'mood' | 'washout';
export interface EventAccent { kind: EventAccentKind; target: number }

/** The actual affected fixture, only while its committed problem still exists. */
export function recordedFixtureFocus(receipt: Receipt): { x: number; y: number } | undefined {
  if (!receipt.snapshot.alive || receipt.events.some(e => e.kind === 'death' || e.kind === 'condition')) return;
  const incident = receipt.events.find(e => e.kind === 'incident' && ['fixtureBreak', 'outage', 'fire'].includes(e.source || ''));
  if (incident?.source === 'fixtureBreak' && (receipt.snapshot.house.damage & 1 << incident.target)) {
    return [{ x: 176, y: 64 }, { x: 136, y: 32 }, { x: 168, y: receipt.snapshot.house.chairAnchor ? 372 : 324 }][incident.target];
  }
  if (incident?.source === 'outage' && receipt.snapshot.house.powerOut) return { x: 72, y: 58 };
  if (receipt.snapshot.house.fire && (!receipt.before.house.fire || incident?.source === 'fire')) return { x: 176, y: 48 };
}

/** Apply only a completed receipt. A packet's future events are never scenery. */
export function advanceRecordedAmbience(current: RecordedAmbience, receipt: Receipt): RecordedAmbience {
  const next: RecordedAmbience = {
    rainUntil: current.rainUntil > receipt.slot ? current.rainUntil : 0,
    ...(current.visitor && current.visitor.untilSlot > receipt.slot ? { visitor: { ...current.visitor } } : {}),
  };
  for (const event of receipt.events) {
    if (event.kind !== 'weather' && event.kind !== 'incident') continue;
    // Primary episodes begin at 1/11/21/31/41 and resolve at that phase's
    // boundary. Washout is a recorded shower, never a claim of extra watering.
    if (event.source === 'rain' || event.source === 'washout') next.rainUntil = receipt.slot + 9;
    if (event.source === 'seedEater' || event.source === 'visitor') {
      next.visitor = { kind: event.source, bed: Math.max(0, Math.min(3, event.target)), untilSlot: receipt.slot + 9 };
    }
  }
  if (receipt.success && (receipt.op === Op.Shoo || receipt.op === Op.Bait)) delete next.visitor;
  if (receipt.slot >= 60 || !receipt.snapshot.alive) { next.rainUntil = 0; delete next.visitor; }
  return next;
}

/** A visitor's stock choice is not present in the public event. Show an item
 * only when the boundary's actual loss, less this action's own inputs, proves
 * exactly one extra pantry unit. Ambiguous changes never acquire a fake cause. */
export function departingVisitorItem(current: RecordedAmbience, receipt: Receipt, inputs: readonly { item: number; quantity: number }[]): number | undefined {
  if (current.visitor?.kind !== 'visitor' || receipt.slot !== current.visitor.untilSlot
    || receipt.success && (receipt.op === Op.Shoo || receipt.op === Op.Bait)) return;
  const losses = [1, 2, 3].flatMap(item => {
    const extra = receipt.before.inventory[item]! - receipt.snapshot.inventory[item]! - inputs.filter(stack => stack.item === item).reduce((sum, stack) => sum + stack.quantity, 0);
    return extra > 0 ? [{ item, extra }] : [];
  });
  return losses.length === 1 && losses[0]!.extra === 1 ? losses[0]!.item : undefined;
}

/** Small located reactions to facts already visible in the committed snapshot. */
export function receiptEventAccents(receipt: Receipt): EventAccent[] {
  const out: EventAccent[] = [];
  const kinds = new Set<EventAccentKind>(['rain', 'fire', 'outage', 'fixtureBreak', 'mishap', 'sickness', 'mood', 'washout']);
  for (const event of receipt.events) {
    if ((event.kind === 'weather' || event.kind === 'incident') && kinds.has(event.source as EventAccentKind)) out.push({ kind: event.source as EventAccentKind, target: event.target });
  }
  // A cooking complication can light the stove without a separate incident
  // message; the actual before/after state is still sufficient evidence.
  if (!receipt.before.house.fire && receipt.snapshot.house.fire && !out.some(e => e.kind === 'fire')) out.push({ kind: 'fire', target: 0 });
  return out;
}
