import { PHASES, isDeliveryCollection, type DailyFocus, type DayResult, type Receipt } from '../domain';
import type { IconName } from './Icons';

export type VisibleFocusStatus='planned'|'working'|'completed'|'failed'|'unavailable';
export function visibleFocusStatus(packet:DayResult,index:number,atImpact:boolean):VisibleFocusStatus {
 const focus=packet.dailyFocus;if(!focus)return'planned';
 const work=focus.attemptedSlot===undefined?undefined:packet.receipts.find(r=>r.slot===focus.attemptedSlot);
 if(work){
  if(index>work.index||index===work.index&&atImpact)return work.success?'completed':'failed';
  if(index===work.index)return'working';
 }
 const last=packet.receipts.at(-1);
 if(last&&(index>last.index||index===last.index&&atImpact)&&focus.status==='unavailable')return'unavailable';
 return'planned';
}
export const focusPhase=(focus:DailyFocus)=>PHASES[Math.max(0,Math.min(5,Math.floor((focus.scheduledSlot-1)/10)))]!;
export function focusIcon(focus:DailyFocus):IconName {
 return focus.kind==='unhurried'?'leaf':focus.goal.action.startsWith('G')?'leaf':focus.goal.action.startsWith('K')?'food':'house';
}
export function morningLabel(key:string,fallback:string):string {
 return({'collect-first':'Mailbox first','coffee-first':'Coffee ritual → mailbox','quick-coffee-first':'Quick coffee → mailbox','breakfast-first':'Breakfast → mailbox','look-first':'Window → mailbox',pantry:'Begin at home'} as Record<string,string>)[key]||fallback;
}
/** Only explicit new-policy, uneventful local time may share a collapsed log row. */
export function isLogInterlude(r:Receipt):boolean {
 return r.role==='interlude'&&!r.choice&&!r.plan&&!isDeliveryCollection(r)&&r.action==='T01'&&r.before.alive&&r.snapshot.alive
  &&r.snapshot.house.fire==='none'&&!r.snapshot.house.powerOut
  &&r.events.every(e=>e.kind==='action'||e.kind==='quiet')
  &&r.changes.every(c=>['needs.nutrition','needs.hydration','needs.morale','needs.energy'].includes(c.field));
}
export interface DayLogGroup {start:number;end:number;quiet:boolean}
export function dayLogGroups(receipts:readonly Receipt[]):DayLogGroup[] {
 const groups:DayLogGroup[]=[];
 for(let i=0;i<receipts.length;){
  const first=receipts[i]!;let end=i;
  if(isLogInterlude(first))while(end+1<receipts.length){const next=receipts[end+1]!;if(next.phase!==first.phase||next.target!==first.target||next.variant!==first.variant||!isLogInterlude(next))break;end++;}
  groups.push({start:i,end,quiet:isLogInterlude(first)});i=end+1;
 }
 return groups;
}
