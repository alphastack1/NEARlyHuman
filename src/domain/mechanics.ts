import { type ConditionId, type DayContext, type DeathCause, type GameState, type Needs, type Plot, type RecordedEvent } from './types';
import { changeNeed, condition, isActive, randomAt, resolved } from './state';

export function event(ctx:DayContext,kind:string,message:string,target?:RecordedEvent['target'],source?:string):void {ctx.events.push({kind,message,...(target?{target}:{}),...(source?{source}:{})});}
export function kill(ctx:DayContext,cause:DeathCause,contributors:DeathCause[]=[cause]):void {if(!ctx.state.alive)return;ctx.state.alive=false;ctx.state.deathCause=cause;ctx.state.deathContributors=contributors;event(ctx,'death',deathMessage(cause),undefined,cause);}
export function deathMessage(cause:DeathCause):string {return{health:'This life has ended.',starvation:'Food ran out.',dehydration:'Water ran out.',wound:'The wound became fatal.',illness:'The illness became fatal.',infection:'The infection became fatal.',structural:'A freak structural accident.'}[cause];}
export function damage(ctx:DayContext,amount:number,tag:'physical'|'biological'|'metabolic',cause:DeathCause='health'):void {if(!ctx.state.alive)return;const n=tag==='physical'?Math.round(amount*(1-.02*ctx.state.stats.body)):amount;changeNeed(ctx.state,'health',-n);if(!ctx.state.needs.health)kill(ctx,cause);}
export function moraleLoss(ctx:DayContext,amount:number):void {changeNeed(ctx.state,'morale',-Math.round(amount*(1-.02*ctx.state.stats.spirit)));}
/** Keeps a same-day tombstone so clear/reacquire cannot reset an earlier deadline. */
export function addCondition(ctx:DayContext,kind:ConditionId,severity:1|2=1,dueDay=0):boolean {
  const prior=ctx.state.conditions.find(c=>c.kind===kind);
  if(prior){prior.resolved=false;prior.severity=Math.max(prior.severity,severity) as 1|2;if(dueDay)prior.dueDay=prior.dueDay?Math.min(prior.dueDay,dueDay):dueDay;return false;}
  ctx.state.conditions.push({kind,severity,onsetDay:ctx.day,dueDay});event(ctx,'condition',conditionLabel(kind,severity)+' began.',kind==='contaminatedSurface'?'surface':'body',kind);return true;
}
export function clearCondition(ctx:DayContext,kind:ConditionId):void {const prior=condition(ctx.state,kind);if(prior){const label=conditionLabel(kind,prior.severity);resolved(ctx.state,kind);event(ctx,'recovery',label+' cleared.',kind==='contaminatedSurface'?'surface':'body',kind);}}
export function conditionLabel(kind:ConditionId,severity=1):string {return{foodDeficit:'Food deficit',waterDeficit:'Water deficit',wound:severity===2?'Serious wound':'Minor wound',illness:severity===2?'Serious illness':'Illness',infection:'Infection',jitters:'Jitters',contaminatedBody:'Body contamination',contaminatedSurface:'Surface contamination'}[kind];}
export function clearNeedDeficits(ctx:DayContext):void {if(ctx.state.needs.nutrition>3000)clearCondition(ctx,'foodDeficit');if(ctx.state.needs.hydration>3000)clearCondition(ctx,'waterDeficit');}
export function restore(ctx:DayContext,values:Partial<Needs>):void {for(const [k,v]of Object.entries(values))changeNeed(ctx.state,k as keyof Needs,v!);clearNeedDeficits(ctx);}
export function infect(ctx:DayContext,kind:'illness'|'infection'):void {if(addCondition(ctx,kind,1,ctx.day+(kind==='illness'?2:1)))damage(ctx,1000,'biological',kind);}
export function wound(ctx:DayContext,severity:1|2):void {damage(ctx,severity===1?800:2000,'physical','wound');if(ctx.state.alive)addCondition(ctx,'wound',severity,ctx.day+(severity===1?2:1));}
export function jitters(ctx:DayContext):void {addCondition(ctx,'jitters',1,0);}
export function maxGrowth(p:Plot):number {return p.plant==='rose'?2:p.plant==='apple'?3:0;}
export function chairUsable(s:GameState):boolean {return s.house.chairLife>0&&(!s.house.damage.chair||s.house.chairBrace);}
export function heatAvailable(s:GameState):boolean {return s.house.fire!=='flame'&&(!s.house.damage.stove||s.house.stovePatch>0)&&(!s.house.powerOut||s.house.backupHeat);}
export function precisionPenalty(s:GameState,stoveTask=false):number {return Math.min(10,(s.needs.energy===0?5:0)+(s.needs.morale===0?5:0)+(isActive(s,'jitters')?5:0)+(s.house.mess===2?5:0)+(stoveTask&&s.house.stovePatch>0?5:0));}
export function competence(s:GameState,base:number,precision=true,stoveTask=false):number {return Math.max(.01,Math.min(.99,base+s.stats.wits*.02-(precision?precisionPenalty(s,stoveTask)/100:0)));}
export function addMess(ctx:DayContext):void {ctx.state.house.mess=Math.min(2,ctx.state.house.mess+1) as 0|1|2;event(ctx,'mess','A little more mess.','prep');}
export function fireResponseBoundary(slot:number):number|undefined {let boundary=Math.ceil(slot/10)*10;if(boundary-slot<2)boundary+=10;return boundary<=60&&boundary-slot>=2?boundary:undefined;}
export function beginTaskFire(ctx:DayContext):boolean {const boundary=fireResponseBoundary(ctx.slot);if(!boundary||ctx.state.house.fire!=='none')return false;ctx.state.house.fire='flame';ctx.taskFire={kind:'fire',startSlot:ctx.slot,boundary,target:'stove',resolved:false};event(ctx,'incident','A little flare-up.','stove','ignition');return true;}
export function resolveEpisodeBoundary(ctx:DayContext):void {
  const episodes=[ctx.primary,ctx.taskFire].filter(e=>e&&!e.resolved&&e.boundary===ctx.slot);
  for(const e of episodes){if(!e||!ctx.state.alive)break;const h=ctx.state.house;
    if(e.kind==='fire'){
      if(h.fire==='flame'){wound(ctx,2);if(ctx.state.alive)addMess(ctx);event(ctx,'incident','The flare caused a wound.','stove','fire');}
      else if(h.fire==='smoke'){damage(ctx,500,'physical');event(ctx,'incident','The smoke stung.','stove','smoke');}
      h.fire='none';
    } else if(e.kind==='rain'&&h.damage.window&&!h.windowPatch&&!h.windowBrace){
      if(!e.exposureCovered)damage(ctx,1200,'physical');if(!ctx.state.alive)break;
      if(!h.dripDiverted&&!e.lossDiverted&&e.stock&&ctx.state.inventory[e.stock]>0){ctx.state.inventory[e.stock]--;event(ctx,'loss','A drip spoiled one water.','window','rain');}
    } else if(e.kind==='seedEater'){
      const i=e.target==='plot2'?1:0;const p=ctx.state.plots[i];if(p.plant&&p.growth<maxGrowth(p)){p.growth=Math.max(0,p.growth-1);event(ctx,'loss','A pest nibbled the planting.',e.target,'pest');}
    } else if(e.kind==='visitor'&&e.stock&&ctx.state.inventory[e.stock]>0){ctx.state.inventory[e.stock]--;event(ctx,'loss','A visitor took one supply.','store','pest');}
    e.resolved=true;
  }
}
export function phaseBoundary(ctx:DayContext):void {
  const p=Math.floor((ctx.slot-1)/10);changeNeed(ctx.state,'nutrition',-500);changeNeed(ctx.state,'hydration',-[700,600,700,700,600,700][p]!);moraleLoss(ctx,300);
  if(!ctx.state.needs.nutrition&&addCondition(ctx,'foodDeficit',1,ctx.day+1))damage(ctx,1500,'metabolic','starvation');
  if(!ctx.state.alive)return;if(!ctx.state.needs.hydration&&addCondition(ctx,'waterDeficit',1,ctx.day+1))damage(ctx,1500,'metabolic','dehydration');
  if(ctx.state.alive)resolveEpisodeBoundary(ctx);
}
export function maintainGarden(ctx:DayContext):void {
  for(let i=0;i<2;i++){const p=ctx.state.plots[i]!;const wet=p.moisture>0;const mature=p.plant&&p.growth>=maxGrowth(p);
    if(p.plant&&!mature){if(wet&&!p.soilBlocked){p.growth=Math.min(maxGrowth(p),p.growth+1+(p.pendingBonus?1:0));p.pendingBonus=false;event(ctx,'growth','The planting grew.',i?'plot2':'plot1');}
      if(!wet){p.dryDays=Math.min(2,p.dryDays+1);if(p.dryDays>=2){p.plant=null;p.growth=0;p.pendingBonus=false;p.dryDays=0;event(ctx,'garden','A dry planting wilted.',i?'plot2':'plot1');}}else p.dryDays=0;
    }
    p.moisture=Math.max(0,p.moisture-1);
  }
}
export function bedtime(ctx:DayContext):void {
  const s=ctx.state;if(!s.alive)return;
  const exposure=s.conditions.some(c=>!c.resolved&&(c.kind==='contaminatedBody'||c.kind==='contaminatedSurface')&&c.onsetDay<ctx.day);
  if(exposure&&randomAt(ctx.seed,ctx.day,60,'contamination-exposure')<.25)infect(ctx,isActive(s,'wound')?'infection':'illness');
  if(!s.alive)return;
  const ill=condition(s,'illness');if(ill){if(ctx.day>=ill.onsetDay+1)ill.severity=2;changeNeed(s,'energy',ill.severity===2?-1000:-500);}
  if(isActive(s,'infection'))changeNeed(s,'energy',-1000);
  const w=condition(s,'wound');if(w?.severity===1&&ctx.day>=w.onsetDay+1){if(!isActive(s,'infection')&&s.needs.nutrition>3000&&s.needs.hydration>3000&&s.needs.energy>=2000)clearCondition(ctx,'wound');else{w.severity=2;w.dueDay=w.dueDay||ctx.day+1;event(ctx,'condition','The wound needs a bandage.','body','wound');}}
  clearCondition(ctx,'jitters');
  const due:DeathCause[]=[];
  if(condition(s,'foodDeficit')?.dueDay&&condition(s,'foodDeficit')!.dueDay<=ctx.day)due.push('starvation');
  if(condition(s,'waterDeficit')?.dueDay&&condition(s,'waterDeficit')!.dueDay<=ctx.day)due.push('dehydration');
  for(const [kind,cause]of [['wound','wound'],['illness','illness'],['infection','infection']] as const){const c=condition(s,kind);if(c?.dueDay&&c.dueDay<=ctx.day&&(kind==='infection'||c.severity===2))due.push(cause);}
  if(due.length){kill(ctx,due[0]!,due);return;}
  const recover=s.needs.nutrition>3000&&s.needs.hydration>3000&&s.needs.energy>=2000&&!s.conditions.some(c=>!c.resolved&&(c.kind==='infection'||c.kind==='foodDeficit'||c.kind==='waterDeficit'||((c.kind==='wound'||c.kind==='illness')&&c.severity===2)));
  changeNeed(s,'energy',3500);if(recover)changeNeed(s,'health',500);maintainGarden(ctx);
  const h=s.house;for(const k of ['chairLife','shelterLife','stovePatch','windowPatch'] as const)h[k]=Math.max(0,h[k]-1);h.umbrellaLife=h.umbrellaLife.map(n=>Math.max(0,n-1)) as [number,number];if(!h.chairLife){h.damage.chair=false;h.chairAnchor=0;}
  h.chairBrace=false;h.windowBrace=false;h.dripDiverted=false;h.backupHeat=false;h.powerOut=false;h.fire='none';s.conditions=s.conditions.filter(c=>!c.resolved);s.level++;event(ctx,'bedtime','Settled in for the night.','bed');
}
