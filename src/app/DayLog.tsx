import { type DayResult, type Receipt } from '../domain';
import { itemImageUrl } from '../game';
import { beforeActionBeat, afterActionBeat } from '../game/recorded-events';
import { Icon } from './Icons';
import { receiptMark } from './receiptFeedback';
import { dayLogGroups } from './focusedDayModel';
import './focusedDay.css';

export function DayLog({packet,index,atImpact,openGroups,onGroupChange,onInspect}:{packet:DayResult;index:number;atImpact:boolean;openGroups:Readonly<Record<string,boolean>>;onGroupChange:(key:string,open:boolean)=>void;onInspect:(receipt:Receipt,index:number)=>void}) {
 const rows=dayLogGroups(packet.receipts);
 const row=(r:Receipt,i:number,quiet=false)=>{
  const mark=receiptMark(r),event=beforeActionBeat(r)?.event||afterActionBeat(r)?.event||r.events.find(e=>e.source==='focus'||e.kind==='delivery');
  const notYet=r.role==='focus'&&(i>index||i===index&&!atImpact),headline=notYet?packet.dailyFocus?.goal.label||r.label:event?.message||r.lines[0];
  return <button className={(i===index?'selected ':'')+(quiet?'quiet':r.role==='focus'?'moment focus-moment':r.role==='delivery'?'moment delivery-moment':'moment')} onClick={()=>onInspect(r,i)} key={i}>
   <small>{i+1}</small><span className="history-mark" aria-hidden="true">{mark.item?<img src={itemImageUrl(mark.item)} alt=""/>:mark.icon?<Icon name={mark.icon}/>:<i/>}</span><span className="history-copy"><span>{headline}</span>{r.role==='focus'&&<small>Main activity</small>}{!notYet&&event&&headline!==r.lines[0]&&<small>{r.lines[0]}</small>}</span>
  </button>;
 };
 return <div className="history-list focused-day-log">{rows.map(group=>{
  const r=packet.receipts[group.start]!,phase=group.start===0||packet.receipts[group.start-1]?.phase!==r.phase;
  const key=packet.finalState.seed+':'+packet.day+':'+group.start;
  return <div className="history-entry" key={group.start}>{phase&&<h2 className="history-phase">{r.phase}</h2>}{group.quiet&&group.end>group.start?<details className={'history-interlude '+(index>=group.start&&index<=group.end?'selected':'')} open={!!openGroups[key]} onToggle={event=>{const next=event.currentTarget.open;if(next!==!!openGroups[key])onGroupChange(key,next);}}>
   <summary aria-label={'Taking it easy. Show '+(group.end-group.start+1)+' recorded moments'}><span className="interlude-pips" aria-hidden="true"><i/><i/><i/></span><span>Taking it easy</span><small aria-hidden="true"/></summary>
   <div className="interlude-records">{packet.receipts.slice(group.start,group.end+1).map((receipt,offset)=>row(receipt,group.start+offset,true))}</div>
  </details>:row(r,group.start,group.quiet)}</div>;
 })}</div>;
}
