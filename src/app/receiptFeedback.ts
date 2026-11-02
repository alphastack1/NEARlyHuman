import { CONDITION_IDS, ITEM_CATALOG, ITEM_IDS, conditionLabel, isDeliveryCollection, type DayResult, type GameState, type ItemId, type Receipt } from '../domain';
import type { IconName } from './Icons';

export type Need = keyof GameState['needs'];
export const NEED_LABELS: Record<Need,string> = {health:'Health',nutrition:'Food',hydration:'Water',energy:'Energy',morale:'Morale'};
export const NEED_ICONS: Record<Need,IconName> = {health:'heart',nutrition:'food',hydration:'water',energy:'energy',morale:'morale'};
export const NEED_KEYS = Object.keys(NEED_LABELS) as Need[];
export interface RecordedChange {key:string;label:string;text:string;icon?:IconName;item?:ItemId;tone:'up'|'down'|'neutral'}
const number = new Intl.NumberFormat('en',{maximumFractionDigits:2});
export const signedNeed = (value:number) => (value>0?'+':'−')+number.format(Math.abs(value)/100);

/** Literal net receipt changes, including its recorded incident/phase boundary. */
export function recordedChanges(receipt:Receipt):RecordedChange[] {
 const before=receipt.before,after=receipt.snapshot,changes:RecordedChange[]=[];
 for(const need of NEED_KEYS){const delta=after.needs[need]-before.needs[need];if(delta)changes.push({key:'need-'+need,label:NEED_LABELS[need]+' '+signedNeed(delta),text:signedNeed(delta),icon:NEED_ICONS[need],tone:delta>0?'up':'down'});}
 for(const item of ITEM_IDS){const delta=after.inventory[item]-before.inventory[item];if(delta){const text=(delta>0?'+':'−')+Math.abs(delta);changes.push({key:'stock-'+item,label:ITEM_CATALOG.find(entry=>entry.id===item)!.name+' '+text,text,item,tone:'neutral'});}}
 for(const kind of CONDITION_IDS){const previous=before.conditions.find(c=>c.kind===kind&&!c.resolved),current=after.conditions.find(c=>c.kind===kind&&!c.resolved);if(!previous&&current)changes.push({key:'condition-'+kind,label:conditionLabel(kind,current.severity),text:conditionLabel(kind,current.severity),icon:'heart',tone:'down'});else if(previous&&!current)changes.push({key:'condition-'+kind,label:conditionLabel(kind,previous.severity)+' cleared',text:conditionLabel(kind,previous.severity)+' cleared',icon:'check',tone:'up'});else if(previous&&current&&previous.severity!==current.severity)changes.push({key:'condition-'+kind,label:conditionLabel(kind,current.severity),text:conditionLabel(kind,current.severity),icon:'heart',tone:current.severity>previous.severity?'down':'up'});}
 const add=(key:string,text:string,tone:RecordedChange['tone']='neutral',icon:IconName='check')=>changes.push({key,label:text,text,icon,tone});
 const a=before.house,b=after.house;
 for(const fixture of ['stove','window','chair'] as const)if(a.damage[fixture]!==b.damage[fixture])add('damage-'+fixture,fixture[0].toUpperCase()+fixture.slice(1)+(b.damage[fixture]?' damaged':' repaired'),b.damage[fixture]?'down':'up');
 if(!a.chairLife&&b.chairLife)add('chair','Chair built','up');else if(a.chairLife&&!b.chairLife)add('chair','Chair wore out','down');
 if(a.chairAnchor!==b.chairAnchor&&b.chairLife)add('chair-moved','Chair moved');
 if(!a.shelterLife&&b.shelterLife)add('shelter','Shelter built','up','leaf');else if(a.shelterLife&&!b.shelterLife)add('shelter','Shelter wore out','down','leaf');
 if(a.mess!==b.mess)add('mess',b.mess<a.mess?'Home cleaner':'More mess',b.mess<a.mess?'up':'down');
 if(a.fire!==b.fire)add('fire',b.fire==='flame'?'Small fire':b.fire==='smoke'?'Smoke':a.fire==='flame'?'Fire out':'Smoke cleared',b.fire==='none'?'up':'down','energy');
 if(a.powerOut!==b.powerOut)add('power',b.powerOut?'Power lost':'Power restored',b.powerOut?'down':'up','energy');
 if(!a.backupHeat&&b.backupHeat)add('heat','Backup heat','up','energy');
 for(let i=0;i<2;i++){const p=before.plots[i]!,q=after.plots[i]!;if(p.plant!==q.plant)add('plot-'+i,q.plant?(q.plant==='rose'?'Rose planted':'Apple planted'):'Plot '+(i+1)+' cleared','neutral','leaf');else if(q.plant&&p.growth!==q.growth)add('growth-'+i,(q.plant==='rose'?'Rose':'Apple')+' '+q.growth+'/'+(q.plant==='rose'?2:3),'up','leaf');if(p.moisture!==q.moisture)add('water-'+i,'Plot '+(i+1)+' water '+q.moisture+'/2',q.moisture>p.moisture?'up':'neutral','water');if(p.soilBlocked!==q.soilBlocked)add('soil-'+i,q.soilBlocked?'Soil blocked':'Soil restored',q.soilBlocked?'down':'up','leaf');if(!a.umbrellaLife[i]&&b.umbrellaLife[i])add('umbrella-'+i,'Plot '+(i+1)+' covered','up','leaf');}
 if(before.alive&&!after.alive)add('life','Life ended','down','heart');
 return changes;
}

export function receiptMark(receipt:Receipt):{item?:ItemId;icon?:IconName} {
 if(isDeliveryCollection(receipt))return {icon:'mail'};
 const item=ITEM_IDS.find(id=>receipt.inputs[id]);if(item)return {item};
 if(receipt.action==='T01')return {};
 if(receipt.action.startsWith('G'))return {icon:'leaf'};
 if(receipt.action.startsWith('K'))return {icon:'food'};
 if(receipt.action==='H03')return {icon:'energy'};
 if(receipt.action==='H04')return {icon:'morale'};
 if(receipt.action==='H02')return {icon:'heart'};
 if(['H08','H09','H20'].includes(receipt.action))return {item:'toolkit'};
 return {icon:'check'};
}

/** Surface a real accomplishment beside the packet's authored recap. */
export function dayHighlights(result?:DayResult):string[] {
 if(!result?.survived)return [];
 const highlights:string[]=[],add=(line:string|undefined)=>{if(line&&!highlights.includes(line)&&highlights.length<3)highlights.push(line);};
 const focus=result.dailyFocus;
 const main=focus?.kind==='project'&&focus.attemptedSlot!==undefined?result.receipts.find(receipt=>receipt.slot===focus.attemptedSlot):undefined;
 if(main)add(main.lines[0]);
 else if(focus?.status==='unavailable')add(result.receipts.flatMap(receipt=>receipt.events).find(event=>event.source==='focus')?.message);
 const successful=result.receipts.filter(receipt=>receipt.success&&receipt.snapshot.alive);
 const accomplishment=successful.find(receipt=>{
   const before=receipt.before.house,after=receipt.snapshot.house;
   return (!before.chairLife&&after.chairLife>0)||(!before.shelterLife&&after.shelterLife>0)
     ||(['stove','window','chair'] as const).some(fixture=>before.damage[fixture]&&!after.damage[fixture])||receipt.action==='G05';
 })
   ||successful.find(receipt=>['G01','G02','G03','G04','G06'].includes(receipt.action))
   ||successful.find(receipt=>receipt.action.startsWith('K')||receipt.action==='H01');
 add(accomplishment?.lines[0]);
 for(const line of result.summary)add(line);
 for(const receipt of successful.filter(receipt=>(receipt.action.startsWith('K')||receipt.action==='H01')&&receipt!==accomplishment))add(receipt.lines[0]);
 return highlights;
}
