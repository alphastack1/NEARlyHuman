import { MAX_NEED, type ActionId, type Candidate, type DayContext, type GameState, type Inventory, type ItemId, type TargetId } from './types';
import { condition, isActive, randomAt } from './state';
import { addCondition, addMess, beginTaskFire, chairUsable, clearCondition, competence, event, fireResponseBoundary, heatAvailable, infect, jitters, maxGrowth, restore, wound } from './mechanics';
import { OUTCOME } from './codec';

function stock(s:GameState,inputs:Partial<Inventory>):boolean {return Object.entries(inputs).every(([id,n])=>s.inventory[id as ItemId]>=(n||0));}
function risk(ctx:DayContext,action:ActionId):string[] {
  const failures=['Started inputs spent; no success benefit','Bounded house mess'];if(ctx.minorUsed)return failures;
  if(action==='K03')failures.push('Preparation surface contamination');else if(action==='H15'){if(fireResponseBoundary(ctx.slot)&&ctx.state.house.fire==='none')failures.push('Small stove flare with response time');}else failures.push('Minor wound');return failures;
}
export function legalCandidates(ctx:DayContext):Candidate[] {
  const s=ctx.state,h=s.house,n=s.needs;if(!s.alive)return[];const out:Candidate[]=[];
  const add=(action:ActionId,target:TargetId,variant:string,label:string,description:string,inputs:Partial<Inventory>={},energy=100,chance=1)=>{if(!stock(s,inputs)||energy===300&&(n.energy<300||n.energy===0))return;out.push({key:`${action}_${target}_${variant}`,action,target,variant,label,description,inputs,energy,successChance:chance,possibleFailures:chance<1?risk(ctx,action):[]});};
  const clean=!isActive(s,'contaminatedSurface'),heat=heatAvailable(s);
  if(clean&&heat&&(n.nutrition<MAX_NEED||n.morale<MAX_NEED)){
    add('K01','stove','toast','Make toast','Spend one bread. Restore35 nutrition and8 morale on success.',{bread:1},100,competence(s,.95,true,true));
    add('K02','stove','cookSteak','Cook steak','Spend one steak. Restore65 nutrition and6 morale on success.',{steak:1},100,competence(s,.9,true,true));
    add('K04','stove','sandwich','Make a steak sandwich','Spend steak and bread. Restore80 nutrition and20 morale on success.',{steak:1,bread:1},100,competence(s,.9,true,true));
  }
  if(clean&&(n.nutrition<MAX_NEED||n.hydration<MAX_NEED||n.morale<MAX_NEED))add('K03','prep','bowl','Make a comfort bowl','Milk and bread; no heat needed. Restore50 food,20 water,20 morale on success.',{milk:1,bread:1},100,competence(s,.95));
  if(!isActive(s,'contaminatedSurface')&&(n.energy<MAX_NEED||n.morale<MAX_NEED)){
    add('K05','prep','ritual','Make a coffee ritual','Spend coffee. Restore10 energy and15 morale; Jitters until bedtime.',{coffee:1});
    add('K06','prep','milkCoffee','Make milk coffee','Spend coffee and milk. Restore20 energy,15 water,15 morale; Jitters.',{coffee:1,milk:1});
  }
  if(n.hydration<MAX_NEED)add('H01','store','water','Drink water','Spend one water. Restore50 hydration.',{water:1});
  if(n.nutrition<MAX_NEED||n.hydration<MAX_NEED)add('H01','store','milk','Drink milk','Spend one milk. Restore25 nutrition and30 hydration.',{milk:1});
  if(n.nutrition<MAX_NEED)add('H01','store','bread','Eat bread','Spend one bread. Restore40 nutrition without a roll.',{bread:1});
  if(n.energy<MAX_NEED||n.morale<MAX_NEED)add('H01','store','quickCoffee','Drink a quick coffee','Spend coffee. Restore20 energy and5 morale; Jitters.',{coffee:1});
  if(ctx.day>1&&n.nutrition<=3000&&!s.plots.some(p=>p.plant==='apple'&&p.growth>=3)&&!out.some(c=>['H01','K01','K02','K03','K04'].includes(c.action)&&c.variant!=='quickCoffee'&&c.variant!=='water'&&(c.inputs.bread||c.inputs.milk))){
    add('K07','store','rawSteak','Eat emergency raw steak','Spend steak; restore45 nutrition.25% mild-Illness exposure only if minor allowance remains.',{steak:1});const raw=out.at(-1);if(raw?.action==='K07')raw.possibleFailures=ctx.minorUsed?[]:['25% biological Illness exposure'];
  }
  for(const kind of ['illness','infection'] as const)if(isActive(s,kind))add('H02','body',kind,kind==='infection'?'Treat infection':'Treat illness','Spend one medicine. Clear this condition and restore15 health.',{medicine:1});
  if(isActive(s,'wound'))add('H02','body','wound','Bandage the wound','Spend one bandage. Clear Wound and restore15 health; Infection is separate.',{bandage:1});
  if(n.energy<MAX_NEED&&ctx.restUses<2&&ctx.slot-ctx.lastRest>=10)add('H03','bed','bed','Rest in bed','Restore12 energy. Shared two-rest allowance and10-slot cooldown.',{},0);
  if(n.morale<MAX_NEED&&ctx.leisureUses<2&&ctx.slot-ctx.lastLeisure>=10){
    const garden=s.plots.some(p=>p.plant)&&randomAt(ctx.seed,ctx.day,ctx.slot,'leisure-target')<.5;
    add('H04',garden?'gardenView':'baseSeat',garden?'garden':'base',garden?'Enjoy the garden':'Relax in the living room','Restore10 morale. Shared two-leisure allowance and10-slot cooldown.');
    if(chairUsable(s))add('H04','chair','chair','Enjoy the crafted chair','Restore15 morale using the same leisure allowance.');
  }
  if(h.mess===1)add('H05','prep','tidy','Tidy the kitchen','Clear actual minor Mess1 to0; no supply.');
  if(h.mess===2)add('H06','prep','deepClean','Deep-clean the mess','Spend one soap. Reduce Mess2 to1, not contamination.',{soap:1});
  if(isActive(s,'contaminatedSurface'))add('H07','surface','surface','Wipe the preparation surface','Spend one soap. Clear this surface exposure, not established disease.',{soap:1});
  if(isActive(s,'contaminatedBody'))add('H07','body','body','Wash up','Spend one soap. Clear body exposure and restore5 morale, not established disease.',{soap:1});
  for(const fixture of ['stove','window','chair'] as const)if(h.damage[fixture]&&(fixture!=='chair'||h.chairLife>0))add('H08',fixture,fixture,`Repair the ${fixture}`,'Spend one toolkit. Permanently clear this damage on success; age unchanged.',{toolkit:1},300,competence(s,.9,true,fixture==='stove'));
  if(!h.chairLife)add('H09','chairA','chair','Build a chair','Spend wood and toolkit. Optional chair lasts5 living bedtimes including today.',{wood:1,toolkit:1},300,competence(s,.9));
  if(!h.shelterLife)add('H09','gardenShelter','shelter','Build a garden shelter','Spend wood and toolkit. Cover both plots for4 living bedtimes; no water/growth.',{wood:1,toolkit:1},300,competence(s,.9));
  for(const fixture of ['stove','window'] as const)if(h.damage[fixture]&&(fixture==='stove'?!h.stovePatch:!h.windowPatch))add('H10',fixture,fixture,`Patch the ${fixture} with wood`,'Spend one wood. Temporary2-living-bedtime mitigation; damage remains.',{wood:1},300,competence(s,.9,true,fixture==='stove'));
  if(h.chairLife&&h.damage.chair&&!h.chairBrace&&n.morale<MAX_NEED&&ctx.leisureUses<2&&ctx.slot<60)add('H11','chair','bandage','Brace the chair with a bandage','Spend bandage for usable chair until this bedtime; no healing/renewal.',{bandage:1});
  const rain=ctx.primary?.kind==='rain'&&!ctx.primary.resolved&&h.damage.window&&!h.windowPatch&&!h.windowBrace;
  if(rain){
    add('H12','window','window','Brace the storm window','Spend toolkit. Prevent this episode exposure and stock loss; damage remains.',{toolkit:1},300);
    if(!h.dripDiverted&&!ctx.primary?.lossDiverted&&ctx.primary?.stock&&s.inventory.water>0){add('H13','window','umbrella','Divert the drip with an umbrella','Spend umbrella. Prevent this episode stock loss only; physical exposure remains.',{umbrella:1});add('H13','window','bandage','Divert the drip with a bandage','Spend bandage. Prevent stock loss only, not wound treatment.',{bandage:1});}
    if(!ctx.primary?.exposureCovered)add('H14','body','umbrella','Cover against the weather','Spend umbrella. Cancel this response physical exposure only, not stock loss.',{umbrella:1});
  }
  if(h.powerOut&&!h.damage.stove&&!h.backupHeat&&h.fire==='none')add('H15','stove','stove','Light backup heat','Spend wood and matches at intact existing stove. Heat until bedtime; no electricity.',{wood:1,matches:1},300,competence(s,.9,true,true));
  if(h.fire!=='none')add('H16','stove',h.fire==='flame'?'stove':'surface','Douse the small fire or smoke','Spend one water. Resolve eligible flame and residual smoke.',{water:1});
  if(h.fire==='flame')add('H17','cutoff','stove','Shut the stove down safely','No supply. End flame; one5-physical residual-smoke boundary effect remains.');
  const pest=ctx.primary&&!ctx.primary.resolved&&['seedEater','visitor'].includes(ctx.primary.kind)?ctx.primary:undefined;
  if(pest){for(const bait of (pest.kind==='seedEater'?['bread','rose_seeds','apple_seeds']:['milk','steak']) as ItemId[])add('H18','pest',bait==='rose_seeds'?'rose':bait==='apple_seeds'?'apple':bait,`Divert the visitor with ${bait.replace('_',' ')}`,'Spend bait to end this episode; no rooster consumption or planting reward.',{[bait]:1});if(!pest.shooTried){add('H19','pest',pest.kind==='seedEater'?'seedEater':'visitor','Shoo the visitor','One attempt per episode. Failure leaves its fixed loss scheduled.',{},100,competence(s,.75,false));const c=out.at(-1);if(c?.action==='H19')c.possibleFailures=ctx.minorUsed?['Existing pest loss remains']:['Existing pest loss remains','Possible body contamination'];}}
  for(let i=0;i<2;i++){const p=s.plots[i]!,target=i?'plot2':'plot1';
    if(!p.plant&&!p.soilBlocked){add('G01',target,'rose',`Plant rose seeds in plot ${i+1}`,'Spend one rose packet. Growth0, retain actual moisture.',{rose_seeds:1});add('G01',target,'apple',`Plant apple seeds in plot ${i+1}`,'Spend one apple packet. Growth0, retain actual moisture.',{apple_seeds:1});}
    if(p.plant&&p.moisture<2)add('G02',target,'water',`Water plot ${i+1}`,'Spend one water. Set only this plot moisture to2; no instant growth.',{water:1});
    if(p.plant&&p.growth<maxGrowth(p)&&!p.soilBlocked&&!p.pendingBonus)add('G03',target,'fertilize',`Fertilize plot ${i+1}`,'Spend compost. Queue one bonus at an eligible wet boundary.',{compost:1});
    if(p.soilBlocked)add('G04',target,'restore',`Restore plot ${i+1} soil`,'Spend compost. Clear the soil block only; no growth bonus or water.',{compost:1});
    if(p.plant&&p.growth>=maxGrowth(p)&&(p.plant==='rose'?n.morale<MAX_NEED:n.nutrition<MAX_NEED))add('G05',target,p.plant,`Harvest the ${p.plant}`,'Consume planting for immediate rose morale or apple nutrition; no stored new item.');
    if(!h.shelterLife&&!h.umbrellaLife[i]&&(p.plant||s.inventory.rose_seeds||s.inventory.apple_seeds))add('G06',target,'umbrella',`Cover plot ${i+1}`,'Spend umbrella. Cover one plot for3 living bedtimes; no water/growth.',{umbrella:1});
    if(p.plant&&(p.soilBlocked||p.dryDays>0||(p.plant==='rose'?s.inventory.apple_seeds:s.inventory.rose_seeds)>0))add('G07',target,'abandon',`Abandon plot ${i+1}`,'Remove planting and pending bonus with no reward; soil block remains.');
  }
  if(h.chairLife&&!ctx.chairMoved&&ctx.primary&&ctx.primary.kind!=='quiet')add('H20',h.chairAnchor?'chairA':'chairB',h.chairAnchor?'chairA':'chairB','Move the chair to the other corner','Move the same optional chair once today; age and damage unchanged.',{},300);
  if(ctx.pendingDelivery?.length){
    add('T01','mailbox','default','Collect the morning delivery','Walk outside and collect the accepted supplies. They are not usable until this action.',{},0);
    const pickup=out.at(-1)!;
    if(n.nutrition<=3000||n.hydration<=3000||s.conditions.some(c=>!c.resolved&&['wound','illness','infection'].includes(c.kind)))pickup.urgent=true;
  }
  // New-policy interludes remain where the last actual activity happened. Real
  // Jev routine decisions can still choose an ordinary stroll/look/sit.
  const ambientTargets:TargetId[]=['window','store','cupboard','gardenView','hall'];
  const idleLabels:Partial<Record<TargetId,string>>={window:'Watch the window',store:'Check the supplies',cupboard:'Look through the cupboard',gardenView:'Visit the garden',hall:'Wander the house',baseSeat:'Sit for a while',bed:'Rest the eyes',mailbox:'Stay by the gate'};
  if(ctx.dailyFocus){
    const targets=[...ambientTargets,'baseSeat' as TargetId,...(ctx.routineAnchor?[ctx.routineAnchor]:[])];
    for(const target of new Set(targets))add('T01',target,'idle',idleLabels[target]||'Stay here a moment','Ordinary quiet time. No supply use, benefit, energy cost or new roll.',{},0);
    return out;
  }
  const recentIdle=s.recent.filter(a=>a.action==='T01').slice(-2).map(a=>a.target);
  const ambient=ambientTargets.filter(t=>!recentIdle.includes(t));
  const idleTarget=ambient[Math.floor(randomAt(ctx.seed,ctx.day,ctx.slot,'ambient-v1')*ambient.length)]!;
  add('T01',idleTarget,'idle',idleLabels[idleTarget]!,'Quiet domestic routine. Advance this slot without supply, energy, benefit, cooldown use or new roll.',{},0);
  return out;
}

function valueFor(c:Candidate,need:'nutrition'|'hydration'|'energy'|'morale'):number {
  const effects:Record<string,Partial<Record<typeof need,number>>>={K01:{nutrition:3500,morale:800},K02:{nutrition:6500,morale:600},K03:{nutrition:5000,hydration:2000,morale:2000},K04:{nutrition:8000,morale:2000},K05:{energy:1000,morale:1500},K06:{energy:2000,hydration:1500,morale:1500},K07:{nutrition:4500},water:{hydration:5000},milk:{nutrition:2500,hydration:3000},bread:{nutrition:4000},quickCoffee:{energy:2000,morale:500},H03:{energy:1200},H04:{morale:c.variant==='chair'?1500:1000},rose:{morale:3500},apple:{nutrition:8000}};
  return(effects[c.action==='H01'||c.action==='G05'?c.variant:c.action]?.[need]||0);
}
/** Nominal successful recovery, shared by the existing shortlist and AI facts. */
export { valueFor as candidateRecovery };
export function shortlistCandidates(ctx:DayContext,all=legalCandidates(ctx)):Candidate[] {
  if(all.length<=1)return all;const mandatory:Candidate[]=[];const add=(c:Candidate|undefined,dueDay?:number,dueSlot?:number)=>{if(c&&!mandatory.some(x=>x.key===c.key))mandatory.push({...c,urgent:true,...(dueDay?{dueDay}:{}),...(dueSlot?{dueSlot}:{})});};
  const responseBoundary=Math.min(...[ctx.primary,ctx.taskFire].filter(e=>e&&!e.resolved&&e.kind==='fire').map(e=>e!.boundary));
  if(ctx.state.house.fire!=='none')for(const c of all.filter(a=>a.action==='H16'||a.action==='H17'))add(c,ctx.day,Number.isFinite(responseBoundary)?responseBoundary:undefined);
  if(ctx.primary&&!ctx.primary.resolved){
    const ep=ctx.primary;
    if(ep.kind==='rain'&&ctx.state.house.damage.window&&!ctx.state.house.windowPatch&&!ctx.state.house.windowBrace){for(const c of all.filter(a=>['H12','H13','H14'].includes(a.action)||(a.target==='window'&&['H08','H10'].includes(a.action))))add(c,ctx.day,ep.boundary);}
    if(ep.kind==='seedEater'||ep.kind==='visitor')for(const c of all.filter(a=>a.action==='H18'||a.action==='H19'))add(c,ctx.day,ep.boundary);
  }
  const ordered=ctx.state.conditions.filter(c=>!c.resolved).sort((a,b)=>(a.dueDay||0xffffffff)-(b.dueDay||0xffffffff)||['foodDeficit','waterDeficit','wound','illness','infection','contaminatedBody','contaminatedSurface','jitters'].indexOf(a.kind)-['foodDeficit','waterDeficit','wound','illness','infection','contaminatedBody','contaminatedSurface','jitters'].indexOf(b.kind));
  for(const c of ordered){if(c.kind==='wound')add(all.find(a=>a.action==='H02'&&a.variant==='wound'),c.dueDay);else if(c.kind==='illness'||c.kind==='infection')add(all.find(a=>a.action==='H02'&&a.variant===c.kind),c.dueDay);else if(c.kind==='contaminatedBody'||c.kind==='contaminatedSurface')add(all.find(a=>a.action==='H07'&&a.variant===(c.kind==='contaminatedBody'?'body':'surface')),c.onsetDay+1);}
  for(const [need,threshold]of [['nutrition',3000],['hydration',3000],['energy',2000],['morale',2000]] as const){if(ctx.state.needs[need]<=threshold){const choices=all.filter(c=>valueFor(c,need)>0).sort((a,b)=>{const av=valueFor(a,need),bv=valueFor(b,need);const aClear=ctx.state.needs[need]+av>3000?1:0,bClear=ctx.state.needs[need]+bv>3000?1:0;return bClear-aClear||(b.successChance-a.successChance)||bv-av;});add(choices[0],need==='nutrition'?condition(ctx.state,'foodDeficit')?.dueDay:need==='hydration'?condition(ctx.state,'waterDeficit')?.dueDay:undefined);}}
  const rest=all.filter(c=>!mandatory.some(m=>m.key===c.key));rest.sort((a,b)=>randomAt(ctx.seed,ctx.day,ctx.slot,'candidate:'+a.key)-randomAt(ctx.seed,ctx.day,ctx.slot,'candidate:'+b.key));
  mandatory.sort((a,b)=>(a.dueDay||0xffffffff)-(b.dueDay||0xffffffff)||(a.dueSlot||61)-(b.dueSlot||61)||a.key.localeCompare(b.key));
  if(mandatory.length>24)throw Error('Required care exceeds the model choice bound.');
  const count=Math.max(mandatory.length,Math.min(16,Math.max(8,mandatory.length)));return[...mandatory,...rest.slice(0,count-mandatory.length)];
}

export function applyAction(ctx:DayContext,c:Candidate):{success:boolean;outcome:number;message:string;lines:[string,string]} {
  const canonical=legalCandidates(ctx).find(x=>x.key===c.key);if(!canonical)throw Error('The selected action is no longer legal.');c=canonical;const s=ctx.state,h=s.house;for(const [id,n]of Object.entries(c.inputs))s.inventory[id as ItemId]-=n!;s.needs.energy=Math.max(0,s.needs.energy-c.energy);
  const success=c.successChance===1||randomAt(ctx.seed,ctx.day,ctx.slot,'competence:'+c.key)<c.successChance;let outcome=success?OUTCOME.success:0;
  let text=c.label+'.',detail='';
  if(!success){
    const minor=!ctx.minorUsed&&randomAt(ctx.seed,ctx.day,ctx.slot,'task-complication')<.25;
    if(c.action==='H19'){if(ctx.primary)ctx.primary.shooTried=true;if(minor){ctx.minorUsed=true;addCondition(ctx,'contaminatedBody');outcome|=OUTCOME.bodyContamination;}text='The visitor stayed.';detail='One shoo was enough.';}
    else if(minor&&c.action==='K03'){ctx.minorUsed=true;addCondition(ctx,'contaminatedSurface');outcome|=OUTCOME.surfaceContamination;text='The bowl went wrong.';detail='The surface needs soap.';}
    else if(minor&&c.action==='H15'&&beginTaskFire(ctx)){ctx.minorUsed=true;outcome|=OUTCOME.fire;text='A little flare-up.';detail='Time to deal with that.';}
    else if(minor&&c.action!=='H15'){ctx.minorUsed=true;wound(ctx,1);outcome|=OUTCOME.wound;text='Ouch. The wing.';detail='The task did not work.';}
    else{addMess(ctx);outcome|=OUTCOME.mess;text='That did not go to plan.';detail='A little more mess.';}
  }else{
    switch(c.action){
      case'K01':restore(ctx,{nutrition:3500,morale:800});text='Made some toast.';detail='Mostly toast.';break;
      case'K02':restore(ctx,{nutrition:6500,morale:600});text='Cooked the steak.';detail='A proper little meal.';break;
      case'K03':restore(ctx,{nutrition:5000,hydration:2000,morale:2000});text='Made a comfort bowl.';detail='Milk + bread.';break;
      case'K04':restore(ctx,{nutrition:8000,morale:2000});text='Made a sandwich.';detail='A serious sandwich.';break;
      case'K05':restore(ctx,{energy:1000,morale:1500});jitters(ctx);text='A coffee ritual.';detail='Tiny cup. Big feelings.';break;
      case'K06':restore(ctx,{energy:2000,hydration:1500,morale:1500});jitters(ctx);text='Made milk coffee.';detail='A very busy beak.';break;
      case'K07':restore(ctx,{nutrition:4500});if(!ctx.minorUsed&&randomAt(ctx.seed,ctx.day,ctx.slot,'raw-exposure')<.25){ctx.minorUsed=true;infect(ctx,'illness');outcome|=OUTCOME.illness;}text='Emergency raw steak.';detail='A risk, not a recipe.';break;
      case'H01':if(c.variant==='water'){restore(ctx,{hydration:5000});text='Drank some water.';detail='A sensible little sip.';}else if(c.variant==='milk'){restore(ctx,{nutrition:2500,hydration:3000});text='Drank some milk.';detail='The carton won.';}else if(c.variant==='bread'){restore(ctx,{nutrition:4000});text='Ate some bread.';detail='Bread understood.';}else{restore(ctx,{energy:2000,morale:500});jitters(ctx);text='A quick coffee.';detail='Perhaps too quick.';}break;
      case'H02':clearCondition(ctx,c.variant as 'wound'|'illness'|'infection');restore(ctx,{health:1500});text=c.variant==='wound'?'Bandaged the wound.':c.variant==='infection'?'Treated the infection.':'Treated the illness.';detail='One thing at a time.';break;
      case'H03':ctx.restUses++;ctx.lastRest=ctx.slot;restore(ctx,{energy:1200});text='Had a little rest.';detail='Rest is important.';break;
      case'H04':ctx.leisureUses++;ctx.lastLeisure=ctx.slot;restore(ctx,{morale:c.variant==='chair'?1500:1000});text=c.variant==='garden'?'Enjoyed the garden.':'Sat like a human.';detail='Nearly.';break;
      case'H05':h.mess=0;text='Tidied the kitchen.';detail='A little less chaos.';break;
      case'H06':h.mess=1;text='Deep-cleaned the mess.';detail='Still a little mess.';break;
      case'H07':clearCondition(ctx,c.variant==='body'?'contaminatedBody':'contaminatedSurface');if(c.variant==='body')restore(ctx,{morale:500});text='Cleaned up.';detail='Soap used: 1.';break;
      case'H08':h.damage[c.target as 'stove'|'window'|'chair']=false;text=`Repaired the ${c.target}.`;detail='Toolkit used: 1.';break;
      case'H09':if(c.variant==='chair'){h.chairLife=5;h.chairAnchor=0;h.damage.chair=false;text='Built a chair.';}else{h.shelterLife=4;text='Built a garden shelter.';}detail='Wood + toolkit used.';break;
      case'H10':if(c.target==='stove')h.stovePatch=2;else h.windowPatch=2;text=`Patched the ${c.target}.`;detail='A temporary little fix.';break;
      case'H11':h.chairBrace=true;text='Braced the chair.';detail='Not a wound treatment.';break;
      case'H12':h.windowBrace=true;text='Braced the window.';detail='For this storm.';break;
      case'H13':h.dripDiverted=true;if(ctx.primary)ctx.primary.lossDiverted=true;text='Diverted the drip.';detail='Stock stayed dry.';break;
      case'H14':if(ctx.primary)ctx.primary.exposureCovered=true;text='Covered against rain.';detail='Only this response.';break;
      case'H15':h.backupHeat=true;text='Backup heat lit.';detail='Only the stove warms.';break;
      case'H16':h.fire='none';for(const ep of [ctx.primary,ctx.taskFire])if(ep?.kind==='fire')ep.resolved=true;text='Doused the flare.';detail='Water used: 1.';break;
      case'H17':h.fire='smoke';text='Heat is off.';detail='Smoke remains.';break;
      case'H18':if(ctx.primary)ctx.primary.resolved=true;text='Diverted the visitor.';detail='A useful little bribe.';break;
      case'H19':if(ctx.primary){ctx.primary.shooTried=true;ctx.primary.resolved=true;}text='Sent the pest away.';detail='No supplies used.';break;
      case'G01':{const p=s.plots[c.target==='plot2'?1:0];p.plant=c.variant as 'rose'|'apple';p.growth=0;p.dryDays=0;p.pendingBonus=false;text=`Planted ${c.variant} seeds.`;detail='Something to look after.';break;}
      case'G02':s.plots[c.target==='plot2'?1:0].moisture=2;text=`Watered ${c.target==='plot2'?'plot 2':'plot 1'}.`;detail='One bottle. One plot.';break;
      case'G03':s.plots[c.target==='plot2'?1:0].pendingBonus=true;text='Fertilized the plot.';detail='Bonus growth is queued.';break;
      case'G04':s.plots[c.target==='plot2'?1:0].soilBlocked=false;text='Restored the soil.';detail='No growth bonus added.';break;
      case'G05':{const p=s.plots[c.target==='plot2'?1:0];if(p.plant==='rose')restore(ctx,{morale:3500});else restore(ctx,{nutrition:8000});p.plant=null;p.growth=0;p.dryDays=0;p.pendingBonus=false;text=`Harvested an ${c.variant==='apple'?'apple':'enjoyable rose'}.`;detail='The plot is empty.';break;}
      case'G06':h.umbrellaLife[c.target==='plot2'?1:0]=3;text='Covered one plot.';detail='The other stays open.';break;
      case'G07':{const p=s.plots[c.target==='plot2'?1:0];p.plant=null;p.growth=0;p.dryDays=0;p.pendingBonus=false;text='Cleared the planting.';detail='No reward or salvage.';break;}
      case'H20':h.chairAnchor=h.chairAnchor?0:1;ctx.chairMoved=true;text='Moved the same chair.';detail='Age unchanged.';break;
      case'T01':{
        if(c.target==='mailbox'&&c.variant==='default'){
          const delivery=ctx.pendingDelivery||[];if(!delivery.length)throw Error('The delivery has already been collected.');
          if(delivery.some(id=>s.inventory[id]>=65535))throw Error('Delivery exceeds inventory capacity.');
          for(const id of delivery)s.inventory[id]++;
          ctx.pendingDelivery=[];ctx.deliveryCollectedSlot=ctx.slot;ctx.deliverySettled='collected';
          text='Collected the delivery.';detail='All accounted for.';event(ctx,'delivery',text,'mailbox','delivery');break;
        }
        const quiet:Partial<Record<TargetId,[string,string]>>={window:['Watched the clouds.','No hurry.'],store:['Checked the supplies.','Still in their little places.'],cupboard:['Had a look in the cupboard.','A very ordinary cupboard.'],gardenView:['Visited the garden.','Some things take their time.'],hall:['Wandered through the house.','The usual little creaks.'],baseSeat:['Sat for a little while.','Comfortably ordinary.'],bed:['Rested the eyes.','Just a moment.'],mailbox:['Stayed by the gate.','A little fresh air.']};
        [text,detail]=quiet[c.target]||['A quiet little moment.','Nothing needed doing.'];break;
      }
    }
  }
  event(ctx,'action',text,c.target,c.action);return{success,outcome,message:text+' '+detail,lines:[text,detail]};
}
