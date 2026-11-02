import { ITEMS, Op, type DayResult, type Receipt, type State } from './types';
import { PLANTS, RECIPES } from './catalog';

/** The film is a view of the canonical result. It never chooses or settles a day. */
export interface V2FilmPacket {
  version: 2;
  result: DayResult;
  dailyPlan?: { mainLabel?: string; mainKey?: string; status?: string; [key: string]: unknown };
  rewardMicro?: string;
  requestId?: string;
  [key: string]: unknown;
}

export function filmPacket(value: unknown): V2FilmPacket | undefined {
  if (!value || typeof value !== 'object') return;
  const v = value as Record<string, unknown>;
  if (v.prepared && typeof v.prepared === 'object') return filmPacket((v.prepared as Record<string, unknown>).packet);
  if (v.packet) return filmPacket(v.packet);
  const r = v.result as DayResult | undefined;
  if (v.version !== 2 || !r || !Array.isArray(r.receipts) || !r.state || r.state.version !== 2) return;
  return v as unknown as V2FilmPacket;
}

export const itemName = (index: number): string => (ITEMS[index] || 'item').replaceAll('_', ' ').replace(/^./, s => s.toUpperCase());
const plantName = (kind: number): string => PLANTS[kind]?.name || 'Garden';
const recipeName = (arg: number): string => RECIPES[arg]?.name || 'Something new';

export function receiptTitle(r: Receipt): string {
  switch (r.op) {
    case Op.Quiet: return r.slot >= 60 ? 'Lights out.' : 'A little time to wander.';
    case Op.Pickup: return 'The morning post.';
    case Op.Breakfast: return 'Breakfast first.';
    case Op.Eat: return 'A bite to eat.';
    case Op.Drink: return 'A cool drink.';
    case Op.Treat: return 'Taking care.';
    case Op.Wash: return r.arg === 7 ? 'A clean counter.' : 'A little wash.';
    case Op.Rest: return r.slot >= 60 ? 'Goodnight.' : 'Just five more minutes.';
    case Op.Leisure: return r.variant === 1 ? 'A moment in the garden.' : r.variant === 2 ? 'The good chair.' : 'Feet up.';
    case Op.Well: return 'A drink for the garden.';
    case Op.Ship: return 'Off to a new home.';
    case Op.Coffee: return 'A proper little coffee.';
    case Op.Tidy: return 'A little less mess.';
    case Op.Toast: return 'Toast, carefully considered.';
    case Op.CookSteak: return 'Something sizzling.';
    case Op.Bowl: return 'A bowl of good things.';
    case Op.Sandwich: return 'A very fine sandwich.';
    case Op.Repair: return ['Fixing the stove.', 'Mending the window.', 'A sturdier chair.'][r.arg] || 'A useful repair.';
    case Op.Plant: return `Room for ${plantName(r.snapshot.plots[r.arg]?.kind || r.variant).toLowerCase()}.`;
    case Op.Harvest: return 'Gathering the garden.';
    case Op.Craft: return `Making a ${recipeName(r.arg).toLowerCase()}.`;
    case Op.RestoreSoil: return 'A fresh start for this soil.';
    case Op.BuildChair: return 'A chair to call my own.';
    case Op.BuildShelter: return 'A little shelter from the rain.';
    case Op.Patch: return 'That should hold.';
    case Op.BackupHeat: return 'A little warmth.';
    case Op.MoveChair: return 'Better over here.';
    case Op.Abandon: return 'Making room for something new.';
    case Op.CoverPlot: return 'Tucking the garden in.';
    case Op.DeepClean: return 'A proper spring clean.';
    case Op.QuietMain: return 'Today, taking it slowly.';
    case Op.Douse: return 'Putting that fire out!';
    case Op.Shutdown: return 'Stove off. Much better.';
    case Op.BraceRain: return 'Keeping the weather outside.';
    case Op.CoverRain: return 'Shelter for the garden.';
    case Op.Shoo: return 'Shoo, little visitor!';
    case Op.Bait: return 'A snack for the visitor.';
    case Op.RawSteak: return 'An adventurous lunch.';
    case Op.EnjoyFlower: return 'Just for the joy of it.';
  }
}

export function receiptNote(r: Receipt): string {
  if (!r.snapshot.alive) return 'A little life, remembered.';
  if (r.role === 'interlude' && r.op === Op.Quiet || r.events.some(e => e.kind === 'bedtime')) return '';
  if (!r.success) return 'Not quite as planned.';
  if (r.op === Op.Harvest) {
    const gains = r.snapshot.inventory.flatMap((n, i) => n > r.before.inventory[i]! ? [`${itemName(i)} +${n - r.before.inventory[i]!}`] : []);
    return gains.slice(0, 2).join(' · ');
  }
  if (r.op === Op.Pickup) {
    const count = r.snapshot.inventory.reduce((sum, n, i) => sum + Math.max(0, n - r.before.inventory[i]!), 0);
    return count ? `${count} supplies collected` : 'A peek in the mailbox';
  }
  if (r.op === Op.Craft) return `${RECIPES[r.arg]?.wood || 0} wood → ${recipeName(r.arg).toLowerCase()}`;
  if (r.op === Op.Ship) return 'Made here. Sent with care.';
  if (r.op === Op.Well) return 'Water for every growing bed';
  if (r.op === Op.Plant) {
    const p = r.snapshot.plots[r.arg];
    return p?.kind ? `${PLANTS[p.kind]?.ticks} growing days` : '';
  }
  return '';
}

export function quietInterlude(r: Receipt): boolean { return r.role === 'interlude' && r.op === Op.Quiet && !r.events.length && r.slot < 60; }

export interface FilmBeat { start: number; end: number; receipt: Receipt; duration: number }
/** Only empty interludes are condensed. Original indices and all 60 facts remain intact. */
export function filmBeats(receipts: Receipt[]): FilmBeat[] {
  const beats: FilmBeat[] = [];
  for (let i = 0; i < receipts.length; i++) {
    const first = receipts[i]!;
    const quiet = (r: Receipt) => quietInterlude(r) && r.snapshot.alive;
    let end = i;
    if (quiet(first)) while (end + 1 < receipts.length && quiet(receipts[end + 1]!)) end++;
    const r = receipts[end]!;
    const duration = quiet(first) ? 850 : r.role === 'main' ? 4000 : r.op === Op.Rest && r.slot === 60 ? 1900 : r.role === 'acute' ? 2100 : 1600;
    beats.push({ start: i, end, receipt: r, duration }); i = end;
  }
  return beats;
}

export interface Inspection { kind: 'bed' | 'well' | 'workshop' | 'mailbox' | 'fixture'; index?: number; label?: string }
export interface InspectDetail { title: string; note: string; stock?: { name: string; count: number }[]; progress?: number }
export function inspectDetail(target: Inspection, s: State): InspectDetail {
  if (target.kind === 'bed') {
    const p = s.plots[target.index || 0]!;
    if (!p?.kind) return { title: 'An open garden bed', note: p?.soilBlocked ? 'This soil needs compost.' : 'A little room to grow.' };
    const spec = PLANTS[p.kind];
    const period = spec && p.left < spec.yields ? spec.repeat : spec?.ticks;
    return { title: plantName(p.kind), note: p.ticks === 0 ? 'Ready to gather' : `${p.ticks} growing ${p.ticks === 1 ? 'day' : 'days'} to go${p.moisture === 0 ? ' · thirsty soil' : ''}`, progress: p.ticks === 0 ? 1 : 1 - p.ticks / (period || 1) };
  }
  if (target.kind === 'well') return { title: 'The garden well', note: 'One visit waters every growing bed.' };
  if (target.kind === 'workshop') return { title: 'The workshop', note: `${s.inventory[6] || 0} wood tucked away`, stock: RECIPES.map(r => ({ name: r.name, count: s.inventory[r.output] || 0 })) };
  if (target.kind === 'mailbox') return { title: 'The morning post', note: 'Supplies arrive here. Handmade things leave here.', stock: s.inventory.flatMap((n, i) => n > 0 ? [{ name: itemName(i), count: n }] : []) };
  const label = target.label || 'Home';
  const note = /stove/i.test(label) ? (s.house.damage & 1 ? 'Could use a repair.' : s.house.powerOut ? 'The power is out.' : 'Ready for something warm.') : /chair/i.test(label) ? (s.house.damage & 4 ? 'A little wobbly.' : 'A good place to sit.') : /window/i.test(label) ? (s.house.damage & 2 ? 'A draft slips through.' : 'A view of the garden.') : /bed/i.test(label) ? 'A quiet place to recharge.' : 'A little corner of home.';
  return { title: label, note };
}
