import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { createInitialState, cloneState, condition, isActive, changeNeed, deriveDaySeed, randomAt } from '../../../src/domain/state.ts';
import { createDayContext } from '../../../src/domain/prepare.ts';
import { applyAction, legalCandidates } from '../../../src/domain/actions.ts';
import { bedtime, phaseBoundary, restore, infect, wound, addCondition } from '../../../src/domain/mechanics.ts';
import { introduceEpisode, checkBlackSwan, rescueFeasible } from '../../../src/domain/director.ts';
import type { Candidate, DayContext, GameState, ItemId, Stats } from '../../../src/domain/types.ts';

// Research adapter. Actual V1 metabolism/conditions/treatments/health/director
// functions execute unchanged. V1 garden fields stay empty: the four-slot V2
// production below is deliberately separate, so its provenance is visible.
const out = new URL('../../../TEMP/economy-v2-feasibility/biology/', import.meta.url);
mkdirSync(out,{recursive:true});
type Species='tree'|'strawberry'|'lavender'|'apple';
type Plot={species:Species;ticks:number;span:number;left:number;wet:number;dry:number};
const spec={tree:[6,10,2],strawberry:[3,1,0],lavender:[6,1,0],apple:[8,6,2]} as const;
const recipes=[['spoon',3,116],['boat',6,212],['birdhouse',8,276],['chest',10,340]] as const;
const weights:Record<string,number>={strawberry:65,lavender:95,apple:40,spoon:116,boat:212,birdhouse:276,chest:340};
const needNames=['health','nutrition','hydration','energy','morale'] as const;
const layout:Species[]=['tree','strawberry','lavender','apple'];
type Config={seed:number;stats:Stats;days?:number;emergencies?:boolean;domestic?:boolean;blackSwan?:number;neglect?:boolean;selfUse?:boolean;soilRestoration?:boolean;forced?:(ctx:DayContext,aux:Aux)=>void;start?:(s:GameState)=>void};
type Aux={plots:(Plot|null)[];soilBlocked:boolean[];seeds:Record<string,number>;goods:Record<string,number>;wood:number;crafts:number;dp:number;wilts:number;producedWood:number;spentWood:number;produced:Record<string,number>;shipped:Record<string,number>;used:Record<string,number>;pest?:{i:number;boundary:number};gardenCounts:Record<string,number>};
const add=(r:Record<string,number>,k:string,n=1)=>{r[k]=(r[k]||0)+n};

function supplies(s:GameState,a:Aux,soilRestoration=true):{care:ItemId[],seed?:Species}{
 const care:ItemId[]=[];
 const put=(id:ItemId,needed:boolean)=>{if(needed&&!care.includes(id)&&care.length<3)care.push(id)};
 put('medicine',(isActive(s,'illness')||isActive(s,'infection'))&&s.inventory.medicine<1);
 put('bandage',!!condition(s,'wound')&&s.inventory.bandage<1);
 put('soap',(isActive(s,'contaminatedBody')||isActive(s,'contaminatedSurface'))&&s.inventory.soap<1);
 put('water',s.inventory.water<3);
 put('bread',s.inventory.bread<3);
 put('compost',soilRestoration&&a.soilBlocked.some(Boolean)&&s.inventory.compost<1);
 put('toolkit',(s.house.damage.window||s.house.damage.stove)&&s.inventory.toolkit<1);
 const i=a.plots.findIndex((p,i)=>!p&&!a.soilBlocked[i]&&!(a.seeds[layout[i]]>0));
 if(care.length<3&&i>=0)return{care,seed:layout[i]};
 return{care};
}

function perform(ctx:DayContext,c:Candidate,log:any[],role:string){
 const r=applyAction(ctx,c);ctx.state.recent.push({action:c.action,target:c.target,variant:c.variant,success:r.success});ctx.state.recent=ctx.state.recent.slice(-6);
 log.push({slot:ctx.slot,role,key:c.key,success:r.success});
}
function custom(ctx:DayContext,log:any[],role:string,key:string){log.push({slot:ctx.slot,role,key,success:true});ctx.state.recent.push({action:'T01',target:'hall',variant:'idle',success:true});ctx.state.recent=ctx.state.recent.slice(-6);}
function routine(ctx:DayContext,a:Aux,log:any[],shipped:boolean,selfUse=false):boolean{
 const s=ctx.state,all=legalCandidates(ctx);
 const treatment=all.filter(c=>c.action==='H02').sort((x,y)=>{
  const a=condition(s,x.variant as any),b=condition(s,y.variant as any);return (a?.dueDay||9999)-(b?.dueDay||9999)||Number(y.variant==='infection')-Number(x.variant==='infection');
 });
 const due=treatment.find(c=>(condition(s,c.variant as any)?.dueDay||0)<=ctx.day||c.variant==='infection');
 if(due){perform(ctx,due,log,'routine');return shipped;}
 const ownFruit=selfUse?(a.goods.apple?'apple':a.goods.strawberry?'strawberry':undefined):undefined;
 if((s.needs.nutrition<=7000||s.needs.hydration<=6500)&&ownFruit&&s.inventory.water){
  a.goods[ownFruit]--;add(a.used,ownFruit);s.inventory.water--;changeNeed(s,'energy',-200);restore(ctx,ownFruit==='apple'?{nutrition:6000,hydration:6000}:{nutrition:3000,hydration:6500});custom(ctx,log,'routine','breakfast-own-'+ownFruit);return shipped;
 }
 if((s.needs.nutrition<=7000||s.needs.hydration<=6500)&&s.inventory.bread&&s.inventory.water){
  s.inventory.bread--;s.inventory.water--;changeNeed(s,'energy',-200);restore(ctx,{nutrition:4000,hydration:5000});custom(ctx,log,'routine','breakfast');return shipped;
 }
 const shortage=all.find(c=>c.action==='H01'&&((c.variant==='water'&&s.needs.hydration<=4500)||(c.variant==='bread'&&s.needs.nutrition<=4500)));
 if(shortage){perform(ctx,shortage,log,'routine');return shipped;}
 if(a.plots.some(p=>p&&p.wet===0)){
  for(const p of a.plots)if(p)p.wet=2;changeNeed(s,'energy',-100);custom(ctx,log,'routine','water-all');return shipped;
 }
 if(treatment.length){perform(ctx,treatment[0],log,'routine');return shipped;}
 const soap=all.find(c=>c.action==='H07');if(soap){perform(ctx,soap,log,'routine');return shipped;}
 if(selfUse&&s.needs.morale<=7000&&a.goods.lavender){a.goods.lavender--;add(a.used,'lavender');changeNeed(s,'energy',-100);restore(ctx,{morale:2500});custom(ctx,log,'routine','enjoy-lavender');return shipped;}
 if(s.needs.morale<=8500){const c=all.find(c=>c.action==='H04');if(c){perform(ctx,c,log,'routine');return shipped;}}
 if(!shipped&&Object.keys(a.goods).some(k=>a.goods[k]>0)){
  let left=4;const items:string[]=[];for(const k of Object.keys(a.goods).sort((x,y)=>weights[y]-weights[x]))while(a.goods[k]&&left){a.goods[k]--;left--;items.push(k);a.dp+=weights[k];add(a.shipped,k)}
  changeNeed(s,'energy',-100);custom(ctx,log,'routine','ship:'+items.join(','));return true;
 }
 const tidy=all.find(c=>c.action==='H05');if(tidy){perform(ctx,tidy,log,'routine');return shipped;}
 custom(ctx,log,'routine','quiet');return shipped;
}
function main(ctx:DayContext,a:Aux,log:any[],domestic:boolean){
 const s=ctx.state;
 const repair=legalCandidates(ctx).find(c=>c.action==='H08'&&c.target!=='chair');if(repair){perform(ctx,repair,log,'main');return;}
 const blocked=a.soilBlocked.findIndex(Boolean);if(blocked>=0&&s.inventory.compost&&s.needs.energy>=300){s.inventory.compost--;a.soilBlocked[blocked]=false;changeNeed(s,'energy',-300);add(a.gardenCounts,'soil-restored');custom(ctx,log,'main','restore-soil:'+blocked);return;}
 const toast=legalCandidates(ctx).find(c=>c.action==='K01');
 if(domestic&&ctx.day%5===0&&toast){perform(ctx,toast,log,'main');return;}
 const empty=a.plots.findIndex((p,i)=>!p&&!a.soilBlocked[i]&&a.seeds[layout[i]]>0);
 if(empty>=0&&s.needs.energy>=300){const species=layout[empty];a.seeds[species]--;const [ticks,left]=spec[species];a.plots[empty]={species,ticks,span:ticks,left,wet:2,dry:0};changeNeed(s,'energy',-300);custom(ctx,log,'main','plant:'+species);return;}
 const ready=a.plots.filter(p=>p&&p.ticks===0).length;
 if(ready&&s.needs.energy>=300){for(let i=0;i<4;i++){const p=a.plots[i];if(!p||p.ticks)continue;if(p.species==='tree'){a.wood++;a.producedWood++;}else{add(a.goods,p.species);add(a.produced,p.species)}p.left--;if(!p.left)a.plots[i]=null;else p.ticks=p.span=spec[p.species][2]}
  changeNeed(s,'energy',-300);custom(ctx,log,'main','harvest-all');return;
 }
 const [item,cost]=recipes[a.crafts%4];if(a.wood>=cost&&s.needs.energy>=300){a.wood-=cost;a.spentWood+=cost;a.crafts++;add(a.goods,item);add(a.produced,item);changeNeed(s,'energy',-300);custom(ctx,log,'main','craft:'+item);return;}
 custom(ctx,log,'main','quiet');
}
function grow(a:Aux){for(let i=0;i<4;i++){const p=a.plots[i];if(!p)continue;if(p.ticks>0){if(p.wet){if(!a.soilBlocked[i])p.ticks--;p.dry=0;}else if(++p.dry>=2){a.plots[i]=null;a.wilts++;continue}}p.wet=Math.max(0,p.wet-1)}}

function gardenEpisode(ctx:DayContext,a:Aux){
 if(ctx.slot!==ctx.primarySlot||randomAt(ctx.seed,ctx.day,ctx.slot,'primary-admission')>=.45)return;
 const families=['rain','fire','outage','seedEater','visitor','fixtureBreak','mishap','sickness','mood','washout'];
 const family=families[Math.floor(randomAt(ctx.seed,ctx.day,ctx.slot,'primary-family')*families.length)];
 if(family==='seedEater'){
  const eligible=a.plots.map((p,i)=>({p,i})).filter(({p})=>p&&p.ticks>0&&p.ticks<p.span);
  if(eligible.length){const picked=eligible[Math.floor(randomAt(ctx.seed,ctx.day,ctx.slot,'pest-plot')*eligible.length)];a.pest={i:picked.i,boundary:ctx.slot+9};add(a.gardenCounts,'seed-eater');}
 }else if(family==='washout'){
  const eligible=a.plots.map((p,i)=>({p,i})).filter(({p,i})=>p&&!a.soilBlocked[i]);
  if(eligible.length){const picked=eligible[Math.floor(randomAt(ctx.seed,ctx.day,ctx.slot,'soil-target')*eligible.length)];a.soilBlocked[picked.i]=true;add(a.gardenCounts,'washout');}
 }
}

function run(c:Config){
 let s=createInitialState(c.seed,c.stats,'BOK');for(const id of Object.keys(s.inventory))s.inventory[id as ItemId]=0;s.inventory.bread=3;s.inventory.water=3;c.start?.(s);
 const a:Aux={plots:[null,null,null,null],soilBlocked:[false,false,false,false],seeds:{},goods:{},wood:0,crafts:0,dp:0,wilts:0,producedWood:0,spentWood:0,produced:{},shipped:{},used:{},gardenCounts:{}};
 const minima={...s.needs};const count:Record<string,number>={},episodes:Record<string,number>={};const trace:any[]=[];let survived=0;
 for(let day=1;day<=(c.days||90)&&s.alive;day++){
  const startDp=a.dp,kit=supplies(s,a,c.soilRestoration!==false);const ctx=createDayContext(s,[]);ctx.pendingDelivery=kit.care;let ship=false,emergencyCount=0,mainDone=false;const routineDone=new Set<number>(),responded=new Set<string>();const actions:any[]=[],eventHistory:any[]=[],boundaries:any[]=[];
  for(let slot=1;slot<=60&&ctx.state.alive;slot++){
   ctx.slot=slot;ctx.events=[];
   introduceEpisode(ctx,.45);gardenEpisode(ctx,a);checkBlackSwan(ctx,c.blackSwan??0);
   if(c.forced)c.forced(ctx,a);
   for(const e of ctx.events)if(e.kind==='incident'||e.kind==='condition'||e.kind==='weather')add(episodes,e.source||e.kind);
   if(ctx.primary?.kind==='rain'&&ctx.primary.startSlot===slot)for(const p of a.plots)if(p)p.wet=2;
   for(const k of needNames)minima[k]=Math.min(minima[k],ctx.state.needs[k]);
   if(!ctx.state.alive){if(ctx.events.length)eventHistory.push({slot,events:cloneState(ctx.events)});break;}
   const logCount=actions.length;
   if(slot===1){for(const id of kit.care)ctx.state.inventory[id]++;ctx.pendingDelivery=[];if(kit.seed)add(a.seeds,kit.seed);custom(ctx,actions,'delivery',kit.care.concat(kit.seed?'seed_'+kit.seed:[]).join(','));}
   const all=legalCandidates(ctx);
   const ep=[ctx.primary,ctx.taskFire].find(e=>e&&!e.resolved&&e.boundary>=slot&&!responded.has(e.kind+':'+e.startSlot));
   const emergency=ep?all.find(x=>x.action==='H16')||all.find(x=>x.action==='H17')||all.find(x=>x.action==='H12')||all.find(x=>x.action==='H14'):undefined;
   if(c.emergencies&&emergency&&emergencyCount<2&&slot!==1){perform(ctx,emergency,actions,'emergency');responded.add(ep!.kind+':'+ep!.startSlot);emergencyCount++;}
   else if(slot>10&&!routineDone.has(Math.floor((slot-1)/10))&&!c.neglect){ship=routine(ctx,a,actions,ship,!!c.selfUse);routineDone.add(Math.floor((slot-1)/10));}
   else if(slot>=36&&slot<=40&&!mainDone){main(ctx,a,actions,!!c.domestic);mainDone=true;}
   if(actions.length===logCount){ctx.state.recent.push({action:'T01',target:'hall',variant:'idle',success:true});ctx.state.recent=ctx.state.recent.slice(-6);}
   if(slot%10===0){phaseBoundary(ctx);if(ctx.state.alive&&a.pest?.boundary===slot){const p=a.plots[a.pest.i];if(p&&p.ticks>0){p.ticks=Math.min(p.span,p.ticks+1);add(a.gardenCounts,'pest-growth-loss');}a.pest=undefined;}if(slot===60&&ctx.state.alive){bedtime(ctx);if(ctx.state.alive){grow(a);survived++}}}
   if(slot%10===0)boundaries.push({slot,needs:{...ctx.state.needs},conditions:cloneState(ctx.state.conditions),alive:ctx.state.alive});
   if(ctx.events.length)eventHistory.push({slot,events:cloneState(ctx.events)});
   for(const k of needNames)minima[k]=Math.min(minima[k],ctx.state.needs[k]);
  }
  s=ctx.state;
  assert.equal(a.wood,a.producedWood-a.spentWood);assert(a.plots.length===4);
  for(const k of Object.keys(a.goods)){assert(a.goods[k]>=0);assert.equal(a.produced[k],(a.shipped[k]||0)+a.goods[k]+(a.used[k]||0))}
  const routineActions=actions.filter(x=>x.role==='routine');assert(routineActions.length<=5);assert(actions.filter(x=>x.role==='main').length<=1);assert(actions.filter(x=>x.key.startsWith('ship:')).length<=1);
  for(const x of actions)add(count,x.role+':'+x.key.split(':')[0]);
  trace.push({day,kit,actions,shipmentDecipoints:a.dp-startDp,needs:{...s.needs},conditions:cloneState(s.conditions),alive:s.alive,death:s.deathCause,plots:cloneState(a.plots),soilBlocked:[...a.soilBlocked],stock:{...s.inventory},seedStock:{...a.seeds},wood:a.wood,goods:{...a.goods},events:eventHistory,boundaries});
 }
 let issued=0n,first250:any;const U=1_000_000n,K=50_000n*U;
 for(const d of trace){const before=issued;issued+=BigInt(d.shipmentDecipoints)*U*K/(10n*(K+issued));if(!first250&&issued>=250n*U)first250={day:d.day,previousMicro:before.toString(),crossingMicro:issued.toString()};}
 return{config:{...c,forced:c.forced?'injected adversarial fixture':undefined,start:c.start?'explicit initial fixture':undefined},daysAttempted:trace.length,survived,alive:s.alive,death:s.deathCause,minima,finalNeeds:s.needs,finalConditions:s.conditions,counts:count,episodes,gardenEpisodes:a.gardenCounts,crafts:a.crafts,points:a.dp/10,wilts:a.wilts,personalUse:a.used,first250:first250||{censoredAfterGameDays:trace.length},savedTokensMicro:issued.toString(),trace};
}

const allocations:Stats[]=[];for(let body=0;body<=5;body++)for(let wits=0;wits<=5-body;wits++)allocations.push({body,wits,spirit:5-body-wits});
const cases:any[]=[];
for(const stats of allocations)for(const seed of [21,808])for(const emergency of [false,true]){
 const result=run({stats,seed,emergencies:emergency,domestic:true,days:90,blackSwan:0});cases.push({...result,trace:undefined});
 if(!result.alive)writeFileSync(new URL('death-'+stats.body+stats.wits+stats.spirit+'-'+seed+'-'+emergency+'.json',out),JSON.stringify(result,null,2));
}
const forcedCases:any[]=[];
for(const emergency of [false,true]){
 forcedCases.push(run({stats:{body:2,wits:2,spirit:1},seed:9,days:2,emergencies:emergency,forced:(ctx)=>{if(ctx.day===1&&ctx.slot===1){ctx.primary={kind:'fire',startSlot:1,boundary:10,target:'stove',resolved:false};ctx.state.house.fire='flame';}}}));
 forcedCases.push(run({stats:{body:0,wits:0,spirit:5},seed:10,days:3,emergencies:emergency,forced:(ctx)=>{if(ctx.day===1&&ctx.slot===41)infect(ctx,'illness');if(ctx.day===2&&ctx.slot===41)wound(ctx,2)}}));
 forcedCases.push(run({stats:{body:0,wits:5,spirit:0},seed:11,days:3,emergencies:emergency,start:(s)=>{s.needs.nutrition=0;s.needs.hydration=0;s.conditions=[{kind:'foodDeficit',severity:1,onsetDay:0,dueDay:1},{kind:'waterDeficit',severity:1,onsetDay:0,dueDay:1}]}}));
 forcedCases.push(run({stats:{body:0,wits:5,spirit:0},seed:12,days:2,emergencies:emergency,start:(s)=>{s.inventory.medicine=0;s.inventory.bandage=0;s.conditions=[{kind:'infection',severity:1,onsetDay:0,dueDay:1},{kind:'illness',severity:2,onsetDay:0,dueDay:1},{kind:'wound',severity:2,onsetDay:0,dueDay:1}]}}));
}
const representative=run({stats:{body:2,wits:2,spirit:1},seed:21,days:90,emergencies:true,domestic:true,blackSwan:.00025});
const neglect=run({stats:{body:2,wits:2,spirit:1},seed:21,days:10,emergencies:true,neglect:true});
assert(!neglect.alive&&['starvation','dehydration'].includes(neglect.death!));
let swan:{seed:number,day:number}|undefined;
for(let seed=1;seed<=300&&!swan;seed++)for(let day=2;day<=90;day++)if(randomAt(deriveDaySeed(createInitialState(seed).seed,day),day,31,'structural-exception')<.00025){swan={seed,day};break;}
assert(swan);const blackSwan=run({stats:{body:2,wits:2,spirit:1},seed:swan.seed,days:90,emergencies:true,blackSwan:.00025});assert(!blackSwan.alive&&blackSwan.death==='structural'&&blackSwan.daysAttempted===swan.day);
const washoutCases=[true,false].map(soilRestoration=>run({stats:{body:2,wits:2,spirit:1},seed:21,days:30,emergencies:true,soilRestoration,forced:(ctx,a)=>{if(ctx.day===5&&ctx.slot===41){for(let i=0;i<4;i++)if(a.plots[i])a.soilBlocked[i]=true;add(a.gardenCounts,'forced-four-bed-washout');}}}));
const cozyCases=[{body:5,wits:0,spirit:0},{body:0,wits:5,spirit:0},{body:0,wits:0,spirit:5},{body:2,wits:2,spirit:1}].flatMap(stats=>[21,808].flatMap(seed=>[false,true].map(selfUse=>run({stats,seed,selfUse,days:90,emergencies:true,domestic:true}))));
function lastRoutineTaskFlare(response:boolean){
 let chosen:DayContext|undefined;
 for(let seed=1;seed<10000&&!chosen;seed++){
  const base=createInitialState(seed,{body:0,wits:0,spirit:5});base.day=1;base.level=1;
  base.inventory.wood=1;base.inventory.matches=1;base.inventory.water=1;base.house.powerOut=true;
  const ctx=createDayContext(base,[]);ctx.slot=51;
  const c=legalCandidates(ctx).find(x=>x.action==='H15')!;
  if(randomAt(ctx.seed,ctx.day,51,'competence:'+c.key)>=c.successChance&&randomAt(ctx.seed,ctx.day,51,'task-complication')<.25)chosen=ctx;
 }
 assert(chosen);const ctx=chosen,action=legalCandidates(ctx).find(x=>x.action==='H15')!;
 const result=applyAction(ctx,action);assert(!result.success&&ctx.taskFire&&ctx.state.house.fire==='flame');
 if(response){ctx.slot=52;applyAction(ctx,legalCandidates(ctx).find(x=>x.action==='H16')!);}
 ctx.slot=60;phaseBoundary(ctx);
 assert(response?!isActive(ctx.state,'wound'):condition(ctx.state,'wound')?.severity===2);
 return{scope:'Actual source H15 fifth-routine task failure with wood/matches already in a saved-life fixture, not a starter grant. Source task-complication draw creates the flare; optional bounded response uses actual H16.',response,seed:ctx.state.seed,day:ctx.day,slotOfTask:51,responseSlot:response?52:null,fireBoundary:60,health:ctx.state.needs.health,conditions:ctx.state.conditions,remainingWood:ctx.state.inventory.wood,remainingMatches:ctx.state.inventory.matches,remainingWater:ctx.state.inventory.water,events:ctx.events};
}
const actualTaskFire=[lastRoutineTaskFlare(false),lastRoutineTaskFlare(true)];
function twoRoutineRescue(start:DayContext){
 let frontier=[{ctx:cloneState(start),path:[] as string[]}];let branches=0;
 for(const slot of [41,51]){
  const next:typeof frontier=[];
  for(const f of frontier){f.ctx.slot=slot;const choices=legalCandidates(f.ctx).filter(c=>['H01','H02','H03','H04','H07','T01'].includes(c.action));
   for(const c of choices){const ctx=cloneState(f.ctx);applyAction(ctx,c);ctx.slot=slot+9;phaseBoundary(ctx);if(slot===51&&ctx.state.alive)bedtime(ctx);branches++;if(ctx.state.alive)next.push({ctx,path:[...f.path,c.key]});}
  }
  frontier=next;
 }
 return{survivingPaths:frontier.length,example:frontier[0]?.path,branches};
}
function admissionBudgetWitness(){
 let before:DayContext|undefined,baseFixture:GameState|undefined;const prefixActions:any[]=[];
 for(let seed=1;seed<10000&&!before;seed++){
  const base=createInitialState(seed,{body:2,wits:2,spirit:1});base.day=2;base.level=2;
  for(const k of Object.keys(base.inventory))base.inventory[k as ItemId]=0;
  base.inventory.water=1;base.inventory.bandage=1;base.inventory.medicine=2;base.inventory.bread=1;
  base.needs={health:6000,nutrition:8000,hydration:0,energy:8000,morale:8000};
  base.conditions=[{kind:'waterDeficit',severity:1,onsetDay:2,dueDay:3},{kind:'wound',severity:2,onsetDay:2,dueDay:3},{kind:'illness',severity:2,onsetDay:1,dueDay:3}];
  const ctx=createDayContext(base,[]);
  if(ctx.primarySlot===41&&randomAt(ctx.seed,ctx.day,41,'primary-admission')<.45&&Math.floor(randomAt(ctx.seed,ctx.day,41,'primary-family')*10)===7&&randomAt(ctx.seed,ctx.day,31,'structural-exception')>=.00025){
   baseFixture=cloneState(base);
   for(let slot=1;slot<=40;slot++){
    ctx.slot=slot;
    if(slot===11)perform(ctx,legalCandidates(ctx).find(c=>c.action==='H02'&&c.variant==='illness')!,prefixActions,'routine');
    else if(slot===21)perform(ctx,legalCandidates(ctx).find(c=>c.action==='H01'&&c.variant==='bread')!,prefixActions,'routine');
    else if(slot===31)perform(ctx,legalCandidates(ctx).find(c=>c.action==='H04')!,prefixActions,'routine');
    else{ctx.state.recent.push({action:'T01',target:'hall',variant:'idle',success:true});ctx.state.recent=ctx.state.recent.slice(-6);}
    if(slot%10===0)phaseBoundary(ctx);
   }
   ctx.slot=41;before=ctx;
  }
 }
 assert(before);const after=cloneState(before);introduceEpisode(after,.45);
 assert(after.primary?.kind==='sickness'&&isActive(after.state,'illness'));
 const b=twoRoutineRescue(before),a=twoRoutineRescue(after);
 assert(b.survivingPaths>0&&a.survivingPaths===0);
 assert(rescueFeasible(before.state,before.day,41,before.day)&&rescueFeasible(after.state,after.day,41,after.day));
 const guarded=cloneState(before);guarded.primaryIntroduced=true;guarded.primary={kind:'quiet',startSlot:41,boundary:50,target:'hall',resolved:true};
 const corrected=twoRoutineRescue(guarded);assert(corrected.survivingPaths>0);
 const result={scope:'Constructed accepted Day2 fixture, then actual source Day3 prefix treats illness at11, eats bread21, leisure31, phase boundaries10/20/30/40. The NEW sickness is genuinely admitted by unchanged introduceEpisode at41. Two remaining ordinary opportunities, main36 already used as quiet, and no new kit before tonight. Source reactivation retains the treated illness deadline3. Local guard replaces only this destructive new episode with quiet; it does not grant supplies or extra actions.',seed:before.state.seed,day:before.day,slot:41,beforeLegacyLogicalWitness:true,afterLegacyLogicalWitness:true,beforeActualTwoRoutines:b,afterActualTwoRoutines:a,reactivatedIllness:condition(after.state,'illness'),guardWouldRejectNewIncident:b.survivingPaths>0&&a.survivingPaths===0,guardedTwoRoutines:corrected};
 writeFileSync(new URL('admission-budget-trace.json',out),JSON.stringify({result,acceptedBaseFixture:baseFixture,prefixActions,mainAlreadyUsedAt36:true,ordinaryUsed:3,ordinarySlotsRemaining:[41,51],beforeAdmission:before,afterAdmission:after,guardedAdmission:guarded},null,2));
 return result;
}
function exhaustedMainWitness(){
 const make=()=>{
  const base=createInitialState(21,{body:2,wits:2,spirit:1});base.needs.energy=299;
  for(const id of Object.keys(base.inventory))base.inventory[id as ItemId]=0;
  base.inventory.bread=3;base.inventory.water=3;
  const ctx=createDayContext(base,[]);ctx.slot=36;
  const aux:Aux={plots:[null,null,null,null],soilBlocked:[false,false,false,false],seeds:{tree:1},goods:{},wood:0,crafts:0,dp:0,wilts:0,producedWood:0,spentWood:0,produced:{},shipped:{},used:{},gardenCounts:{}};
  return{ctx,aux};
 };
 const before=make(),beforeActions:any[]=[];main(before.ctx,before.aux,beforeActions,false);
 assert.equal(before.aux.seeds.tree,1);assert.equal(before.aux.plots[0],null);assert.equal(before.ctx.state.needs.energy,299);
 const rested=make(),restActions:any[]=[];rested.ctx.slot=11;
 const rest=legalCandidates(rested.ctx).find(c=>c.action==='H03')!;assert(rest);
 perform(rested.ctx,rest,restActions,'routine');rested.ctx.slot=36;main(rested.ctx,rested.aux,restActions,false);
 assert.equal(rested.aux.seeds.tree,0);assert(rested.aux.plots[0]);assert.equal(rested.ctx.state.needs.energy,1199);
 return{scope:'Two independent same-start fixtures: a productive main needs at least300energy; actualH03rest in one ordinary opportunity enables a later main. No second main is granted to the first fixture.',before:{energy:299,actions:beforeActions,seedRetained:before.aux.seeds.tree},afterRest:{energy:rested.ctx.state.needs.energy,actions:restActions,seedRemaining:rested.aux.seeds.tree}};
}
const exhaustedMain=exhaustedMainWitness();
const admission=admissionBudgetWitness();
const longHorizon=[{seed:21,stats:{body:0,wits:3,spirit:2}},{seed:21,stats:{body:0,wits:5,spirit:0}}].flatMap(c=>[false,true].map(selfUse=>run({...c,selfUse,days:360,emergencies:true,domestic:true})));
writeFileSync(new URL('long-horizon-traces.json',out),JSON.stringify(longHorizon,null,2));
writeFileSync(new URL('representative.json',out),JSON.stringify(representative,null,2));
writeFileSync(new URL('forced.json',out),JSON.stringify(forcedCases,null,2));
const report={exhaustedMain,scope:'Actual imported V1 health/metabolism/conditions/director/actions, explicit new V2 breakfast/four-plot production/scheduling adapter. Deterministic competent policy, no Jev, no chain validation. Four-slot seed-eater/washout/rain are explicit local ports; pests are left unanswered, persistent bed soil flags require compost and a main even after plant removal. Emergency actions can add at most2 nonproductive responses/day and are separately counted; an interrupted ordinary routine moves to the next free slot of its phase, not an extra sixth routine. All21 legal stat allocations x2 matched seeds x2 emergency modes=84 ninety-day scenarios; black swan disabled in paired comparison.',cases,forced:forcedCases.map(({trace,...x})=>x),representative:{...representative,trace:undefined},neglect:{...neglect,trace:undefined},blackSwan:{...blackSwan,trace:undefined},washout: washoutCases.map(({trace,...x})=>x),personalUse:cozyCases.map(({trace,...x})=>x),actualTaskFire,admissionBudgetWitness:admission,longHorizon:longHorizon.map(({trace,...x})=>x)};
writeFileSync(new URL('additional-traces.json',out),JSON.stringify({neglect,blackSwan,washoutCases},null,2));
writeFileSync(new URL('results.json',out),JSON.stringify(report,null,2));
console.log(JSON.stringify({cases:cases.length,deaths:cases.filter(x=>!x.alive).map(x=>({stats:x.config.stats,seed:x.config.seed,emergencies:x.config.emergencies,day:x.daysAttempted,cause:x.death})),forced:report.forced.map(x=>({seed:x.config.seed,emergencies:x.config.emergencies,alive:x.alive,cause:x.death,days:x.daysAttempted})),representative:report.representative},null,2));
