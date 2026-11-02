import { type DayResult } from '../domain';
import { Icon } from './Icons';
import { focusIcon, focusPhase, morningLabel, visibleFocusStatus } from './focusedDayModel';
import './focusedDay.css';

export function DayFocusBadge({packet,index,atImpact,onOpen}:{packet:DayResult;index:number;atImpact:boolean;onOpen:()=>void}) {
 const focus=packet.dailyFocus;if(!focus)return null;const status=visibleFocusStatus(packet,index,atImpact);
 return <button className={'day-focus-badge focus-'+status} aria-label={'Day focus: '+focus.goal.label+'. '+status+'. View morning plan'} onClick={onOpen}>
  <Icon name={focusIcon(focus)} size={14}/><span>{focus.goal.label}</span><small>{status==='completed'?<Icon name="check" size={12}/>:status==='failed'||status==='unavailable'?<Icon name="close" size={11}/>:status==='working'?<i className="focus-progress-pips" aria-label="In progress"/>:(packet.receipts[index]?.slot||0)>focus.scheduledSlot?'Later':focusPhase(focus)}</small>
 </button>;
}
const probability=(n:number|undefined)=>n===undefined?'—':Math.round(n*100)+'%';
export function DayPlanDetails({packet,index,atImpact}:{packet:DayResult;index:number;atImpact:boolean}) {
 const focus=packet.dailyFocus;if(!focus)return null;
 const status=visibleFocusStatus(packet,index,atImpact),work=focus.attemptedSlot===undefined?undefined:packet.receipts.find(r=>r.slot===focus.attemptedSlot);
 const revealed=status==='completed'||status==='failed';
 const pickup=packet.deliveryCollectedSlot===undefined?undefined:packet.receipts.find(r=>r.slot===packet.deliveryCollectedSlot);
 const afterPickup=!!pickup&&(index>pickup.index||index===pickup.index&&atImpact);
 const last=packet.receipts.at(-1),estateVisible=packet.deliverySettled==='estate'&&!!last&&(index>last.index||index===last.index&&atImpact);
 return <div className="day-plan-details">
  <div className={'plan-goal focus-'+status}><Icon name={focusIcon(focus)} size={21}/><strong>{focus.goal.label}</strong><span>{focusPhase(focus)}</span></div>
  <p className="plan-origin">Chosen at dawn</p>
  {revealed&&work&&<p className={'plan-outcome '+(work.success?'success':'failed')}>{work.lines[0]}</p>}
  {status==='unavailable'&&<p className="plan-outcome">It will have to wait.</p>}
  {focus.choice&&<><h2 className="plan-section-title">Main activity</h2><div className="choice-list">{focus.choice.candidates.map(candidate=><div className={'choice-row '+(focus.choice!.selected===candidate.key?'picked':'')} key={candidate.key}><Icon name={focus.choice!.selected===candidate.key?'check':'play'} size={12}/><span>{candidate.label}</span><b>{probability(focus.choice!.probabilities?.[candidate.key])}</b></div>)}</div></>}
  <h2 className="plan-section-title">Morning</h2>
  {focus.morningChoice?<div className="choice-list">{focus.morningChoice.candidates.map(candidate=><div className={'choice-row '+(focus.morningChoice!.selected===candidate.key?'picked':'')} key={candidate.key}><Icon name={focus.morningChoice!.selected===candidate.key?'check':'play'} size={12}/><span>{morningLabel(candidate.key,candidate.label)}</span><b>{probability(focus.morningChoice!.probabilities?.[candidate.key])}</b></div>)}</div>:<p className="plan-morning">{morningLabel(focus.morning.key,focus.morning.label)}</p>}
  {focus.morning.skipped&&afterPickup&&<p className="plan-origin">Morning order changed.</p>}
  {estateVisible&&<p className="plan-origin">The delivery remained unopened.</p>}
  <small className="plan-probability-key">Model choice probability</small>
 </div>;
}
