import { ITEM_CATALOG, ITEM_IDS, type GameState, type ItemId, type TargetId } from '../domain';
import { itemImageUrl } from '../art/pixels';
import { Icon, type IconName } from './Icons';
import type { ReactNode } from 'react';
import { formatHouseNeed, houseInfo, PANTRY_ITEMS } from './houseInfo';
import './houseDetails.css';

interface HouseDetailsProps { state: GameState; target: TargetId; onItem: (item: ItemId) => void }
const itemName = (id: ItemId) => ITEM_CATALOG.find(item => item.id === id)!.name;
const bedtimes = (value: number) => `${value} bedtime${value === 1 ? '' : 's'} left`;

function Fact({ children, icon = 'check', warning = false }: { children: ReactNode; icon?: IconName; warning?: boolean }) {
 return <div className={'house-fact' + (warning ? ' house-fact-warning' : '')}><Icon name={icon}/><span>{children}</span></div>;
}
function Pips({ value, maximum, label, icon }: { value: number; maximum: number; label: string; icon: IconName }) {
 return <div className="house-gauge" aria-label={`${label}: ${value} of ${maximum}`}><Icon name={icon}/><span>{label}</span><div className="house-pips" aria-hidden="true">{Array.from({ length: maximum }, (_, index) => <i key={index} className={index < value ? 'filled' : ''}/>)}</div><strong>{value}/{maximum}</strong></div>;
}
function Need({ value, label, icon }: { value: number; label: string; icon: IconName }) {
 return <div className="house-gauge house-need" aria-label={`${label}: ${formatHouseNeed(value)}`}><Icon name={icon}/><span>{label}</span><div className="house-pips" aria-hidden="true">{[1, 2, 3, 4, 5].map(index => <i key={index} className={value >= index * 2000 ? 'filled' : ''}/>)}</div><strong>{formatHouseNeed(value)}</strong></div>;
}
function Stock({ state, items, onItem }: { state: GameState; items: readonly ItemId[]; onItem: (item: ItemId) => void }) {
 return <div className="house-stock" aria-label="Stored supplies">{items.map(id => <button className={state.inventory[id] ? 'stocked' : 'empty'} key={id} onClick={() => onItem(id)} aria-label={`${itemName(id)}: ${state.inventory[id]} stored. Details`}><img src={itemImageUrl(id)} alt=""/><span className="house-stock-name">{itemName(id)}</span><strong>{state.inventory[id].toLocaleString('en-US')}</strong></button>)}</div>;
}

export function HouseDetails({ state: s, target, onItem }: HouseDetailsProps) {
 const info = houseInfo(s, target), h = s.house, plotIndex = target === 'plot1' ? 0 : target === 'plot2' ? 1 : undefined;
 const plot = plotIndex !== undefined ? s.plots[plotIndex] : undefined;
 const contaminatedSurface = s.conditions.some(condition => condition.kind === 'contaminatedSurface' && !condition.resolved);
 const contaminatedBody = s.conditions.some(condition => condition.kind === 'contaminatedBody' && !condition.resolved);
 const stockItems = target === 'cupboard' ? ITEM_IDS : target === 'store' ? PANTRY_ITEMS : info.items;
 return <div className="house-details">
  {plot ? <>
   <div className="house-plant"><Icon name="leaf"/><strong>{plot.plant === 'rose' ? 'Rose' : plot.plant === 'apple' ? 'Apple' : 'Empty plot'}</strong>{plot.plant && plot.growth >= (plot.plant === 'apple' ? 3 : 2) && <span className="house-ready">Ready</span>}</div>
   {plot.plant && <Pips value={plot.growth} maximum={plot.plant === 'apple' ? 3 : 2} label="Growth" icon="leaf"/>}
   <Pips value={plot.moisture} maximum={2} label="Water" icon="water"/>
   {plot.soilBlocked && <Fact warning icon="leaf">Soil blocked</Fact>}
   {plot.pendingBonus && <Fact icon="leaf">Bonus growth queued</Fact>}
   {!!h.umbrellaLife[plotIndex!] && <Fact>Covered · {bedtimes(h.umbrellaLife[plotIndex!])}</Fact>}
  </> : target === 'bed' ? <Need value={s.needs.energy} label="Energy" icon="energy"/>
   : target === 'baseSeat' ? <Need value={s.needs.morale} label="Morale" icon="morale"/>
   : target === 'store' || target === 'cupboard' ? <p className="house-stored-label">Stored supplies</p>
   : target === 'stove' || target === 'cutoff' ? <>
    <Fact warning={h.fire === 'flame' || h.damage.stove && !h.stovePatch || h.powerOut && !h.backupHeat} icon="energy">{info.detail}</Fact>
    {h.damage.stove && (h.fire !== 'none' || h.powerOut) && <Fact warning>Stove damaged</Fact>}
    {!!h.stovePatch && !info.detail.startsWith('Wood patch') && <Fact>Wood patch · {bedtimes(h.stovePatch)}</Fact>}
    {h.backupHeat && !info.detail.includes('Backup') && <Fact icon="energy">Backup heat active</Fact>}
   </> : target === 'window' ? <>
    <Fact warning={h.damage.window && !h.windowPatch && !h.windowBrace}>{info.detail}</Fact>
    {h.dripDiverted && <Fact icon="water">Drip diverted from stock</Fact>}
   </> : target === 'chair' || target === 'chairA' || target === 'chairB' ? <>
    <Fact warning={h.damage.chair && !h.chairBrace}>{info.detail}</Fact>
    {!!h.chairLife && h.damage.chair && <Fact icon="morale">{bedtimes(h.chairLife)}</Fact>}
    {h.chairBrace && !info.detail.includes('Braced') && <Fact>Chair braced</Fact>}
   </> : target === 'prep' || target === 'surface' ? <>
    <Fact warning={contaminatedSurface || h.mess === 2}>{info.detail}</Fact>
    <Pips value={h.mess} maximum={2} label="Mess" icon="food"/>
   </> : target === 'body' ? <>
    <Need value={s.needs.health} label="Health" icon="heart"/>
    {contaminatedBody && <Fact warning>Body contaminated</Fact>}
   </> : target === 'gardenShelter' || target === 'gardenView' ? <>
    <Fact icon="leaf">{h.shelterLife ? `Shelter · ${bedtimes(h.shelterLife)}` : 'No garden shelter'}</Fact>
    {s.plots.map((p, index) => <div className="house-plot-row" key={index}><span>Plot {index + 1}</span><strong>{p.plant === 'rose' ? 'Rose' : p.plant === 'apple' ? 'Apple' : 'Empty'}</strong><span>{h.umbrellaLife[index] ? `Cover ${h.umbrellaLife[index]}` : 'Uncovered'}</span></div>)}
   </> : target === 'mailbox' ? <Fact icon="wallet">Up to 3 different supplies</Fact>
   : <Fact icon={target === 'pest' ? 'leaf' : 'book'}>{info.detail}</Fact>}
  {stockItems.length > 0 && <Stock state={s} items={stockItems} onItem={onItem}/>}
 </div>;
}
