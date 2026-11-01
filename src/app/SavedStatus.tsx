import { conditionLabel, ITEM_CATALOG, ITEM_IDS, type GameState, type ItemId, type TargetId } from '../domain';
import { itemImageUrl } from '../game';
import { Icon, type IconName } from './Icons';

const needRows: Array<[keyof GameState['needs'], string, IconName]> = [
  ['health', 'Health', 'heart'], ['nutrition', 'Food', 'food'], ['hydration', 'Water', 'water'], ['energy', 'Energy', 'energy'], ['morale', 'Morale', 'morale'],
];
const amount = (n: number) => (n / 100).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');

export function SavedStatus({ state: s, onItem, onObject }: { state: GameState; onItem: (item: ItemId) => void; onObject: (target: TargetId) => void }) {
  const conditions = s.conditions.filter(c => !c.resolved).sort((a, b) => (a.dueDay || Infinity) - (b.dueDay || Infinity));
  const stocked = ITEM_IDS.filter(id => s.inventory[id] > 0);
  const h = s.house;
  const house: Array<{ target: TargetId; label: string; detail: string }> = [];
  if (h.chairLife) house.push({ target: 'chair', label: 'Chair', detail: `${h.chairLife} bedtimes left${h.damage.chair ? h.chairBrace ? ' · braced' : ' · damaged' : ''}` });
  if (h.shelterLife) house.push({ target: 'gardenShelter', label: 'Garden shelter', detail: `${h.shelterLife} bedtimes left` });
  if (h.damage.stove || h.stovePatch || h.powerOut || h.fire !== 'none') house.push({ target: 'stove', label: 'Stove', detail: h.fire !== 'none' ? h.fire === 'flame' ? 'Small fire' : 'Smoke remains' : h.powerOut ? h.backupHeat ? 'Backup heat' : 'Power out' : h.stovePatch ? `Patched · ${h.stovePatch} bedtimes left` : 'Needs repair' });
  if (h.damage.window || h.windowPatch || h.windowBrace) house.push({ target: 'window', label: 'Window', detail: h.windowPatch ? `Patched · ${h.windowPatch} bedtimes left` : h.windowBrace ? 'Braced for this storm' : 'Needs repair' });
  if (h.mess) house.push({ target: 'surface', label: 'Kitchen', detail: h.mess === 2 ? 'Needs a deep clean' : 'A little mess' });
  return <>
    <div className="status-needs">{needRows.map(([key, label, icon]) => <div key={key}><Icon name={icon}/><span>{label}</span><strong>{amount(s.needs[key])}</strong></div>)}</div>
    {conditions.map(c => <div className="condition-row" key={c.kind}><strong>{conditionLabel(c.kind, c.severity)}</strong>{c.dueDay > 0 && <span>By day {c.dueDay} bedtime</span>}</div>)}
    {stocked.length > 0 ? <div className="stock-grid">{stocked.map(id => <button key={id} aria-label={`${ITEM_CATALOG.find(x => x.id === id)!.name}: ${s.inventory[id]} stored. Details`} onClick={() => onItem(id)}><img src={itemImageUrl(id)} alt=""/><span>{s.inventory[id].toLocaleString('en-US')}</span></button>)}</div> : <p className="status-empty">No stored supplies</p>}
    <div className="status-place-list">{s.plots.map((plot, i) => <button className="status-place" key={i} onClick={() => onObject(i ? 'plot2' : 'plot1')}><span className="place-title">Plot {i + 1}<strong>{plot.plant === 'apple' ? 'Apple' : plot.plant === 'rose' ? 'Rose' : 'Empty'}</strong></span><span className="place-detail">{plot.plant ? `Growth ${plot.growth}/${plot.plant === 'apple' ? 3 : 2} · Water ${plot.moisture}/2` : `Water ${plot.moisture}/2`}{plot.soilBlocked ? ' · Soil blocked' : ''}{plot.pendingBonus ? ' · Bonus queued' : ''}{h.umbrellaLife[i] ? ` · Cover ${h.umbrellaLife[i]} bedtimes` : ''}</span><span className="place-chevron" aria-hidden="true">›</span></button>)}</div>
    {house.length > 0 && <div className="status-place-list">{house.map(row => <button className="status-place" key={row.target} onClick={() => onObject(row.target)}><span className="place-title">{row.label}</span><span className="place-detail">{row.detail}</span><span className="place-chevron" aria-hidden="true">›</span></button>)}</div>}
  </>;
}
