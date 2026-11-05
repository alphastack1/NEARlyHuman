import { Op, type Receipt, type State } from './types';
import { PLANTS, RECIPES } from './catalog';
import { endingNote, itemName, type FilmPacket } from './presentation';

export interface DayMemory { headline: string; hint: string }

/** A short memory of saved facts, never a new goal, choice or reward. */
export function dayMemory(packet: FilmPacket): DayMemory {
  const state = packet.result.state;
  if (!state.alive) return { headline: 'A little life, remembered.', hint: endingNote(state) };
  const main = packet.result.receipts.find(r => r.role === 'main');
  return { headline: main ? mainResult(main) : 'A little day at home.', hint: nextDetail(state) };
}

function mainResult(r: Receipt): string {
  if (!r.success) return 'Not quite as planned.';
  switch (r.op) {
    case Op.Plant: return `${PLANTS[r.snapshot.plots[r.arg]?.kind || r.variant]?.name || 'A little seed'} planted.`;
    case Op.Harvest: {
      const gains = r.snapshot.inventory.flatMap((n, i) => n > r.before.inventory[i]! ? [`${itemName(i)} +${n - r.before.inventory[i]!}`] : []);
      return gains.slice(0, 2).join(' · ') || 'The garden, gathered.';
    }
    case Op.Craft: return `${RECIPES[r.arg]?.name || 'Something new'} made.`;
    case Op.Toast: return 'Toast, made with care.';
    case Op.CookSteak: return 'A warm meal.';
    case Op.Bowl: return 'A comfort bowl.';
    case Op.Sandwich: return 'A very fine sandwich.';
    case Op.Repair: return ['The stove is fixed.', 'The window is mended.', 'A sturdier chair.'][r.arg] || 'A useful repair.';
    case Op.RestoreSoil: return 'Fresh soil for another day.';
    case Op.BuildChair: return 'A new chair at home.';
    case Op.BuildShelter: return 'A little shelter built.';
    case Op.Patch: return 'A little patch in place.';
    case Op.MoveChair: return 'A chair, moved.';
    case Op.Abandon: return 'Room for something new.';
    case Op.CoverPlot: return 'The garden is tucked in.';
    case Op.DeepClean: return 'A fresher little home.';
    case Op.QuietMain: return 'A quiet little day.';
    default: return 'A little day, well lived.';
  }
}

function nextDetail(state: State): string {
  if (state.house.fire) return 'The stove still needs attention.';
  const order = [4, 3, 2, 1, 0];
  const active = order.flatMap((id, priority) => {
    const c = state.conditions[id];
    return c?.severity && !c.resolved ? [{ id, priority, ...c }] : [];
  }).sort((a, b) => (a.dueDay || Infinity) - (b.dueDay || Infinity) || b.severity - a.severity || a.priority - b.priority);
  if (active[0]) return ['Still a little hungry.', 'Still a little thirsty.', 'A wound still needs care.', 'Still feeling unwell.', 'An infection needs care.'][active[0].id]!;
  const ready = state.plots.filter(p => p.kind && p.ticks === 0);
  if (ready.length === 1) {
    const names = ['', 'Daisy', 'Marigold', 'Lavender', 'Rose', 'Strawberries', 'Blueberries', 'Grapes', 'Apples', 'Wood'];
    return `${names[ready[0]!.kind] || 'Garden'} ready to gather.`;
  }
  if (ready.length) return 'Garden ready to gather.';
  const growing = state.plots.filter(p => p.kind && p.ticks > 0).sort((a, b) => a.ticks - b.ticks);
  if (growing[0]) return `${PLANTS[growing[0].kind]?.name || 'Garden'} · ${growing[0].ticks} growing ${growing[0].ticks === 1 ? 'day' : 'days'} to go`;
  if (state.inventory[6]) return `${state.inventory[6]} wood tucked away.`;
  if (state.plots.some(p => p.soilBlocked)) return 'A garden bed needs compost.';
  if (state.house.damage) return 'A little repair for another day.';
  return '';
}
