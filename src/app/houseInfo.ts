import { ITEM_IDS, type GameState, type ItemId, type TargetId } from '../domain';
import { TARGET_LABELS } from '../game/layout';

export interface HouseInfo { title: string; detail: string; items: ItemId[] }
export const PANTRY_ITEMS: ItemId[] = ['water', 'milk', 'bread', 'steak', 'coffee'];
export const UTILITY_ITEMS: ItemId[] = ITEM_IDS.filter(item => !PANTRY_ITEMS.includes(item));
const count = (state: GameState, items: readonly ItemId[]) => items.reduce((total, item) => total + state.inventory[item], 0);
const stockedFirst = (state: GameState, items: readonly ItemId[]) => [...items].sort((a, b) => Number(state.inventory[b] > 0) - Number(state.inventory[a] > 0));
const active = (state: GameState, kind: string) => state.conditions.some(condition => condition.kind === kind && !condition.resolved);

/** Snapshot facts and relevant supplies only; opening a place performs no action. */
export function houseInfo(state: GameState, target: TargetId): HouseInfo {
 const house = state.house, title = TARGET_LABELS[target] || 'Your home';
 const info = (detail: string, items: readonly ItemId[] = []): HouseInfo => ({ title, detail, items: stockedFirst(state, items) });
 if (target === 'store') return info(count(state, PANTRY_ITEMS) ? `${count(state, PANTRY_ITEMS).toLocaleString('en-US')} stored` : 'Pantry empty', PANTRY_ITEMS);
 if (target === 'cupboard') return info(count(state, UTILITY_ITEMS) ? `${count(state, UTILITY_ITEMS).toLocaleString('en-US')} stored` : 'Cupboard empty', UTILITY_ITEMS);
 if (target === 'plot1' || target === 'plot2') {
  const plot = state.plots[target === 'plot1' ? 0 : 1], maximum = plot.plant === 'apple' ? 3 : 2;
  const plant = plot.plant === 'rose' ? 'Rose' : plot.plant === 'apple' ? 'Apple' : 'Empty plot';
  const detail = plot.soilBlocked ? 'Soil blocked' : plot.plant ? `${plant}${plot.growth >= maximum ? ' · Ready' : ` · ${plot.growth}/${maximum}`} · Water ${plot.moisture}/2` : `Empty · Water ${plot.moisture}/2`;
  return info(detail, plot.soilBlocked ? ['compost'] : plot.plant ? ['water', 'compost', 'umbrella'] : ['rose_seeds', 'apple_seeds', 'water', 'compost']);
 }
 if (target === 'stove' || target === 'cutoff') {
  const detail = house.fire === 'flame' ? 'Small fire' : house.fire === 'smoke' ? 'Smoke remains' : house.powerOut ? house.backupHeat ? 'Backup heat active' : 'Power out' : house.damage.stove ? house.stovePatch ? `Wood patch · ${house.stovePatch} bedtimes` : 'Needs repair' : 'Ready to cook';
  return info(detail, house.fire === 'flame' ? ['water'] : house.damage.stove ? ['toolkit', 'wood'] : house.powerOut ? ['wood', 'matches'] : ['bread', 'steak', 'wood', 'matches']);
 }
 if (target === 'window') return info(house.windowPatch ? `Patched · ${house.windowPatch} bedtimes` : house.windowBrace ? 'Braced for the storm' : house.damage.window ? 'Needs repair' : 'Window intact', ['toolkit', 'wood', 'umbrella', 'bandage']);
 if (target === 'chair' || target === 'chairA' || target === 'chairB') return info(!house.chairLife ? 'No crafted chair' : house.damage.chair ? house.chairBrace ? 'Damaged · Braced' : 'Needs repair' : `${house.chairLife} bedtimes left`, ['wood', 'toolkit', 'bandage']);
 if (target === 'baseSeat') return info(`Morale ${formatHouseNeed(state.needs.morale)}`);
 if (target === 'bed') return info(`Energy ${formatHouseNeed(state.needs.energy)}`);
 if (target === 'prep' || target === 'surface') return info(active(state, 'contaminatedSurface') ? 'Surface contaminated' : house.mess === 2 ? 'Needs a deep clean' : house.mess === 1 ? 'A little mess' : 'Counter clean', ['soap', 'bread', 'milk', 'steak', 'coffee']);
 if (target === 'body') return info(active(state, 'contaminatedBody') ? 'Needs washing' : `Health ${formatHouseNeed(state.needs.health)}`, ['soap', 'medicine', 'bandage']);
 if (target === 'gardenShelter' || target === 'gardenView') return info(house.shelterLife ? `Shelter · ${house.shelterLife} bedtimes left` : `${state.plots.filter(plot => plot.plant).length}/2 plots planted`, ['wood', 'toolkit', 'umbrella', 'water', 'rose_seeds', 'apple_seeds']);
 if (target === 'mailbox') return info('Next-day delivery', ITEM_IDS);
 if (target === 'pest') return info('Diversion supplies', ['bread', 'milk', 'steak', 'rose_seeds', 'apple_seeds']);
 return info(`Saved day ${state.day} · Level ${state.level}`);
}

export function formatHouseNeed(value: number): string {
 return (value / 100).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}
