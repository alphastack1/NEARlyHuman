import { type DayContext, type Episode, type EpisodeKind, type GameState, type ItemId } from './types';
import { cloneState, condition, isActive, randomAt } from './state';
import { addCondition, damage, event, heatAvailable, infect, kill, maxGrowth, moraleLoss, wound } from './mechanics';

/** Named v1 tuning defaults; no mint-age expiry or hidden increasing death rate. */
export const DEFAULT_EVENT_PARAMETERS={incidentRate:.45,blackSwanRate:.00025} as const;
const FAMILIES:EpisodeKind[]=['rain','fire','outage','seedEater','visitor','fixtureBreak','mishap','sickness','mood','washout'];
const usefulKit:ItemId[]=['water','milk','bread','steak','medicine','bandage','soap'];
function terminalDue(s:GameState,kind:'foodDeficit'|'waterDeficit'|'wound'|'illness'|'infection',horizon:number):boolean {const c=condition(s,kind);return!!c&&c.dueDay>0&&c.dueDay<=horizon;}

/** Conservative supply/slot witness. It protects existing offered rescues without choosing for Jev. */
export function rescueFeasible(state:GameState,day:number,slot:number,horizon=day+1):boolean {
  const future=horizon>day;
  const kits:ItemId[][]=[[]];if(future){for(let bits=1;bits<(1<<usefulKit.length);bits++){const kit=usefulKit.filter((_,i)=>!!(bits&(1<<i)));if(kit.length<=3)kits.push(kit);}}
  const phaseLeft=6-Math.floor((Math.max(1,slot)-1)/10);const extraPhases=Math.max(0,horizon-day)*6;
  const foodLoss=(phaseLeft+extraPhases)*500;const waterLoss=(phaseLeft+extraPhases)*700;
  const nRequired=Math.max(0,foodLoss+1-state.needs.nutrition,terminalDue(state,'foodDeficit',horizon)?3001-state.needs.nutrition:0);
  const hRequired=Math.max(0,waterLoss+1-state.needs.hydration,terminalDue(state,'waterDeficit',horizon)?3001-state.needs.hydration:0);
  const medicines=Number(terminalDue(state,'illness',horizon))+Number(terminalDue(state,'infection',horizon));
  const bandages=Number(terminalDue(state,'wound',horizon));
  const soaps=(medicines||bandages)?state.conditions.filter(c=>!c.resolved&&(c.kind==='contaminatedBody'||c.kind==='contaminatedSurface')&&c.onsetDay<horizon).length:0;
  const slots=Math.max(0,61-slot)+Math.max(0,horizon-day)*60;
  for(const kit of kits){const inv={...state.inventory};for(const id of kit)if(inv[id]<65535)inv[id]++;
    if(inv.medicine<medicines||inv.bandage<bandages||inv.soap<soaps)continue;
    const overhead=medicines+bandages+soaps;
    const milkMax=Math.min(inv.milk,Math.ceil(Math.max(nRequired/2500,hRequired/3000))+1);
    const steakValue=heatAvailable(state)&&!isActive(state,'contaminatedSurface')?6500:day>1?4500:0;
    for(let milk=0;milk<=milkMax;milk++){
      const water=Math.ceil(Math.max(0,hRequired-milk*3000)/5000);if(water>inv.water)continue;
      const food=Math.max(0,nRequired-milk*2500);const steakMax=steakValue?Math.min(inv.steak,Math.ceil(food/steakValue)):0;
      for(let steak=0;steak<=steakMax;steak++){const bread=Math.ceil(Math.max(0,food-steak*steakValue)/4000);if(bread<=inv.bread&&overhead+milk+water+steak+bread<=slots)return true;}
    }
  }
  return false;
}
function preservesRescue(ctx:DayContext,after:GameState,horizon=ctx.day+1):boolean {return!rescueFeasible(ctx.state,ctx.day,ctx.slot,horizon)||rescueFeasible(after,ctx.day,ctx.slot,horizon);}
function canIntroduceCondition(ctx:DayContext,kind:'wound'|'illness',severity:1|2):boolean {
  const s=cloneState(ctx.state);const prior=s.conditions.find(c=>c.kind===kind);if(!prior)s.conditions.push({kind,severity,onsetDay:ctx.day,dueDay:ctx.day+(kind==='illness'||severity===1?2:1)});else{prior.severity=Math.max(prior.severity,severity) as 1|2;prior.resolved=false;}
  return preservesRescue(ctx,s,Math.max(ctx.day+1,ctx.day+(kind==='illness'||severity===1?2:1)));
}
export function introduceEpisode(ctx:DayContext,incidentRate:number=DEFAULT_EVENT_PARAMETERS.incidentRate):void {
  if(ctx.primaryIntroduced||ctx.slot!==ctx.primarySlot)return;ctx.primaryIntroduced=true;
  const s=ctx.state,h=s.house;const boundary=ctx.slot+9;
  const e:Episode={kind:'quiet',startSlot:ctx.slot,boundary,target:'hall',resolved:true};ctx.primary=e;
  if(randomAt(ctx.seed,ctx.day,ctx.slot,'primary-admission')>=incidentRate){event(ctx,'quiet','An ordinary little day.');return;}
  const kind=FAMILIES[Math.floor(randomAt(ctx.seed,ctx.day,ctx.slot,'primary-family')*FAMILIES.length)]!;
  const pick=<T>(a:T[],label:string):T|undefined=>a.length?a[Math.floor(randomAt(ctx.seed,ctx.day,ctx.slot,label)*a.length)]:undefined;
  const physical=(n:number)=>Math.round(n*(1-.02*s.stats.body));
  switch(kind){
    case'rain':{
      e.kind='rain';e.target='window';e.resolved=false;for(const p of s.plots)p.moisture=2;event(ctx,'weather','Rain reached the little garden.','window','rain');
      if(!h.damage.window||h.windowPatch||h.windowBrace){e.resolved=true;return;}
      const responseAvailable=s.inventory.umbrella>0||(s.needs.energy>=300&&(s.inventory.toolkit>0||s.inventory.wood>0));
      if(s.needs.health<=physical(1200)&&!responseAvailable){e.resolved=true;event(ctx,'weather','Useful rain, nothing worse.','window','rain');return;}
      if(s.inventory.water>0){const after=cloneState(s);after.inventory.water--;if(preservesRescue(ctx,after,condition(s,'waterDeficit')?.dueDay===ctx.day?ctx.day:ctx.day+1))e.stock='water';else e.lossDiverted=true;}
      return;
    }
    case'fire':{
      const last=s.recent.at(-1);if(h.fire!=='none'||!heatAvailable(s)||!last||!['K01','K02','K04','H15'].includes(last.action))break;
      // Shutdown always leaves smoke. At very low health a real, affordable douse
      // must remain without consuming the sole existing deadline rescue.
      if(s.needs.health<=physical(500)){
        if(!s.inventory.water)break;
        const after=cloneState(s);after.inventory.water--;
        const horizon=condition(s,'waterDeficit')?.dueDay===ctx.day||condition(s,'foodDeficit')?.dueDay===ctx.day?ctx.day:ctx.day+1;
        if(!preservesRescue(ctx,after,horizon))break;
      }
      e.kind='fire';e.target='stove';e.resolved=false;h.fire='flame';event(ctx,'incident','A little flare-up.','stove','fire');return;
    }
    case'outage':{
      const after=cloneState(s);after.house.powerOut=true;const mayLose=s.inventory.milk>0;if(mayLose)after.inventory.milk--;
      h.powerOut=true;e.kind='outage';e.target='stove';
      if(mayLose&&preservesRescue(ctx,after,condition(s,'foodDeficit')?.dueDay===ctx.day||condition(s,'waterDeficit')?.dueDay===ctx.day?ctx.day:ctx.day+1)){s.inventory.milk--;event(ctx,'loss','One milk was lost.','store','outage');}
      event(ctx,'incident','The power went out.','stove','outage');return;
    }
    case'seedEater':{
      const targets=s.plots.map((p,i)=>({p,i})).filter(({p})=>p.plant&&p.growth>0&&p.growth<maxGrowth(p));const t=pick(targets,'pest-plot');if(!t)break;
      e.kind='seedEater';e.target=t.i?'plot2':'plot1';e.resolved=false;event(ctx,'incident','A seed-eater dropped by.',e.target,'pest');return;
    }
    case'visitor':{
      const foods=(['bread','milk','steak'] as ItemId[]).filter(id=>{if(!s.inventory[id])return false;const after=cloneState(s);after.inventory[id]--;return preservesRescue(ctx,after,condition(s,'foodDeficit')?.dueDay===ctx.day?ctx.day:ctx.day+1);});
      const food=pick(foods,'visitor-stock');if(!food)break;e.kind='visitor';e.target='store';e.stock=food;e.resolved=false;event(ctx,'incident','A hungry visitor arrived.','store','pest');return;
    }
    case'fixtureBreak':{
      const eligible=(['stove','window','chair'] as const).filter(id=>!h.damage[id]&&(id!=='chair'||h.chairLife>0)&&!(id==='stove'&&isActive(s,'foodDeficit')&&!s.inventory.bread&&!s.inventory.milk));const target=pick([...eligible],'broken-fixture');if(!target)break;
      h.damage[target]=true;e.kind='fixtureBreak';e.target=target;event(ctx,'incident',`The ${target} needs a fix.`,target,'fixture');return;
    }
    case'mishap':{
      if(s.needs.health<=physical(800)||!canIntroduceCondition(ctx,'wound',1))break;e.kind='mishap';e.target='body';wound(ctx,1);event(ctx,'incident','A little domestic mishap.','body','mishap');return;
    }
    case'sickness':{
      if(s.needs.health<=1000||!canIntroduceCondition(ctx,'illness',1))break;e.kind='sickness';e.target='body';infect(ctx,'illness');event(ctx,'incident','Feeling a little unwell.','body','sickness');return;
    }
    case'mood':e.kind='mood';e.target='body';moraleLoss(ctx,2000);event(ctx,'incident','A disappointing little moment.','body','mood');return;
    case'washout':{
      const targets=s.plots.map((p,i)=>({p,i})).filter(({p,i})=>p.plant&&!p.soilBlocked&&!h.shelterLife&&!h.umbrellaLife[i]);const t=pick(targets,'soil-target');if(!t)break;t.p.soilBlocked=true;e.kind='washout';e.target=t.i?'plot2':'plot1';event(ctx,'incident','Rain blocked the plot soil.',e.target,'washout');return;
    }
  }
  event(ctx,'quiet','A quiet little moment.');
}
export function checkBlackSwan(ctx:DayContext,rate:number=DEFAULT_EVENT_PARAMETERS.blackSwanRate):void {if(ctx.day>1&&ctx.slot===31&&ctx.state.alive&&randomAt(ctx.seed,ctx.day,31,'structural-exception')<rate)kill(ctx,'structural');}
