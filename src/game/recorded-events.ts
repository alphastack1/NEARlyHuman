import type { Receipt, RecordedEvent, TargetId } from '../domain/types';

export interface RecordedBeat { event:RecordedEvent; target?:TargetId; lines:[string,string] }
const beforeSources=new Set(['mood','mishap','sickness','fixture','outage','pest','washout']);

export function eventIsBeforeAction(receipt:Receipt,event:RecordedEvent):boolean {
 const decision=receipt.decisionSnapshot;if(!decision)return false;
 if(event.kind==='weather')return true;
 if(event.kind==='incident')return beforeSources.has(event.source||'')||event.source==='fire'&&receipt.before.house.fire!==decision.house.fire;
 if(event.kind==='condition')return JSON.stringify(receipt.before.conditions.find(condition=>condition.kind===event.source))!==JSON.stringify(decision.conditions.find(condition=>condition.kind===event.source));
 if(event.kind==='loss'&&event.source==='outage')return Object.keys(receipt.before.inventory).some(item=>decision.inventory[item as keyof typeof decision.inventory]<receipt.before.inventory[item as keyof typeof decision.inventory]);
 return false;
}

/** An event's stage comes from its saved decision snapshot, never its action label. */
export function beforeActionBeat(receipt:Receipt):RecordedBeat|undefined {
 if(!receipt.snapshot.alive||!receipt.decisionSnapshot)return;
 const candidates=receipt.events.filter(event=>eventIsBeforeAction(receipt,event));
 const event=candidates.find(event=>event.kind==='weather')||candidates.find(event=>event.kind==='incident')||candidates[0];
 if(!event)return;
 const companion=candidates.find(other=>other!==event&&(other.kind==='condition'||other.kind==='loss'));
 const lines:[string,string]=companion&&event.message.length<=25&&companion.message.length<=25?[event.message,companion.message]:eventLines(event.message);
 return {event,target:event.target,lines};
}

/** Bedtime/incident consequences that otherwise disappear behind ordinary activity. */
export function afterActionBeat(receipt:Receipt):RecordedBeat|undefined {
 if(!receipt.snapshot.alive)return;
 const priority=(event:RecordedEvent)=>event.kind==='incident'?0:event.kind==='loss'?1:event.kind==='garden'?2:event.kind==='growth'?3:event.kind==='condition'&&event.source!=='jitters'?4:5;
 const event=receipt.events.filter(event=>!eventIsBeforeAction(receipt,event)&&(
  ['incident','loss','garden','growth'].includes(event.kind)||event.kind==='condition'&&event.source!=='jitters'
 )).sort((a,b)=>priority(a)-priority(b))[0];
 return event?{event,target:event.target,lines:eventLines(event.message)}:undefined;
}

/** Both lines together retain the original event text. */
export function eventLines(message:string):[string,string] {
 if(message.length<=25)return[message,''];
 const words=message.split(' ');let first='';
 for(const word of words){if(first&&(first+' '+word).length>Math.ceil(message.length/2))break;first+=(first?' ':'')+word;}
 return[first,message.slice(first.length).trimStart()];
}

export const hasRecordedRain=(receipt:Receipt):boolean=>receipt.events.some(event=>event.kind==='weather'&&event.source==='rain');
