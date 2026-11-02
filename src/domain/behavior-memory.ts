import { VARIANT_IDS } from './codec';
import { ACTION_IDS, TARGET_IDS, type PreviousDayMemory, type RecentAction } from './types';

export const PREVIOUS_DAY_LIMIT=2;
export const PREVIOUS_ACTION_LIMIT=6;

function copyAction(value:RecentAction):RecentAction {
 if(!value||typeof value!=='object'||!(ACTION_IDS as readonly string[]).includes(value.action)
  ||!(TARGET_IDS as readonly string[]).includes(value.target)||!(VARIANT_IDS as readonly string[]).includes(value.variant)
  ||typeof value.success!=='boolean')throw Error('Previous-day action is invalid.');
 return{action:value.action,target:value.target,variant:value.variant,success:value.success};
}

/** Compact history proves execution, not which records bought fresh inference.
 * T01 is omitted because its compact form cannot distinguish ordinary interludes.
 */
export function previousDayMemory(day:number,records:readonly RecentAction[]):PreviousDayMemory {
 if(!Number.isInteger(day)||day<1||!Array.isArray(records))throw Error('Previous-day history is invalid.');
 const actions=records.map(copyAction).filter(record=>record.action!=='T01').slice(-PREVIOUS_ACTION_LIMIT);
 return{day,actions};
}

/** Clone/freeze facts into the day checkpoint; do not synthesize missing memories. */
export function normalizePreviousDays(value:readonly PreviousDayMemory[]|undefined,currentDay:number):PreviousDayMemory[] {
 if(!Number.isInteger(currentDay)||currentDay<1||value!==undefined&&!Array.isArray(value))throw Error('Previous-day memory is invalid.');
 if(!value)return[];
 if(value.length>PREVIOUS_DAY_LIMIT)throw Error('Previous-day memory exceeds its day bound.');
 const seen=new Set<number>();
 const days=value.map(entry=>{
  if(!entry||!Number.isInteger(entry.day)||entry.day<1||entry.day>=currentDay||seen.has(entry.day)
   ||!Array.isArray(entry.actions)||entry.actions.length>PREVIOUS_ACTION_LIMIT)throw Error('Previous-day memory is invalid.');
  seen.add(entry.day);
  const actions:RecentAction[]=entry.actions.map(copyAction);
  if(actions.some(record=>record.action==='T01'))throw Error('Previous-day memory contains an ambiguous quiet record.');
  return{day:entry.day,actions};
 });
 return days.sort((a,b)=>a.day-b.day);
}
