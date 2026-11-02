import { candidateRecovery, legalCandidates, shortlistCandidates } from './actions';
import { dayInclination, deriveIndividuality } from './individuality';
import { cloneState, randomAt } from './state';
import { PHASES, type Candidate, type DayContext, type DailyFocus, type MorningOption, type TargetId } from './types';

/** Existing codec tuple reserved for actual collection by this decision-policy version. */
export function isDeliveryCollection(value:{action:string;target:string;variant:string}):boolean {
 return value.action==='T01'&&value.target==='mailbox'&&value.variant==='default';
}
export const DAY_PLAN_VERSION='focus1-cadence1-physical-delivery1';
export const MAX_MODEL_DECISIONS=61;
export const PICKUP_BY_SLOT=6;
const projectActions=new Set(['K01','K02','K03','K04','H06','H08','H09','G01','G03','G04','G05','G06']);
const minorActions=new Set(['K01','K05','K06','K07','H01','H02','H03','H04','H05','H07','G02','H15']);
const interestFor=(c:Candidate)=>c.action.startsWith('G')?'gardening':c.action==='H09'?'making':c.action.startsWith('K')?'cooking':c.action==='H08'?'making':'comfort';

export function futureProjectContext(ctx:DayContext):DayContext {
 const future=cloneState(ctx);for(const item of future.pendingDelivery||[])future.state.inventory[item]++;
 future.pendingDelivery=[];return future;
}
export function focusOptions(ctx:DayContext):Candidate[] {
 const future=futureProjectContext(ctx),profile=deriveIndividuality(ctx.state.seed),inclination=dayInclination(ctx.state.seed,ctx.day);
 const all=legalCandidates(future).filter(c=>projectActions.has(c.action)
  &&!(c.action==='H09'&&c.target==='gardenShelter'&&!future.state.plots.some(plot=>plot.plant))
  &&!(c.action==='G06'&&!future.state.plots[c.target==='plot2'?1:0].plant));
 all.sort((a,b)=>{
  const rank=(c:Candidate)=>Number(interestFor(c)===inclination.interest)*4+Number(interestFor(c)===profile.interest)*2+Number(c.action==='G05')*2;
  return rank(b)-rank(a)||randomAt(ctx.seed,ctx.day,0,'focus:'+a.key)-randomAt(ctx.seed,ctx.day,0,'focus:'+b.key);
 });
 // Two identical plots/recipes should not crowd every other kind of useful project out.
 const seen=new Set<string>(),projects=all.filter(c=>{const group=c.action+'_'+c.variant;if(seen.has(group))return false;seen.add(group);return true;}).slice(0,4);
 const phaseIndex=Math.max(1,Math.min(4,PHASES.indexOf(inclination.phase))),preferred=phaseIndex*10+6;
 const option=(c:Candidate,scheduledSlot:number):Candidate=>({...c,key:c.key+'__at'+scheduledSlot,label:c.label+' · '+PHASES[Math.floor((scheduledSlot-1)/10)],plan:{kind:'project',actionKey:c.key,scheduledSlot}});
 if(projects.length===1)return[option(projects[0]!,16),option(projects[0]!,36)];
 if(projects.length)return projects.map(c=>option(c,preferred));
 return(['window','gardenView'] as TargetId[]).map((target,index)=>({key:'unhurried_'+target,action:'T01',target,variant:'idle',label:index?'An unhurried afternoon in the garden':'A quiet morning by the window',description:'No feasible substantial project today. An ordinary unhurried day; no invented work or reward.',inputs:{},energy:0,successChance:1,possibleFailures:[],plan:{kind:'unhurried',actionKey:`T01_${target}_idle`,scheduledSlot:index?36:16}}));
}

export function morningOptions(ctx:DayContext,projects:Candidate[]):MorningOption[] {
 if(!ctx.pendingDelivery?.length)return[{key:'pantry',label:'Begin at home; no delivery is waiting'}];
 const options:MorningOption[]=[{key:'collect-first',label:'Collect the waiting delivery first'}];
 const all=legalCandidates(ctx),hasUrgent=shortlistCandidates(ctx,all).some(c=>c.urgent)||all.some(c=>c.urgent);
 if(hasUrgent)return options;
 const future=futureProjectContext(ctx).state.inventory;
 const reserve=(item:keyof typeof future)=>Math.max(0,...projects.map(c=>c.inputs[item]||0));
 const safe=(c:Candidate)=>Object.entries(c.inputs).every(([item,count])=>future[item as keyof typeof future]-(count||0)>=reserve(item as keyof typeof future));
 const coffee=all.find(c=>c.action==='K05'&&safe(c))||all.find(c=>c.action==='H01'&&c.variant==='quickCoffee'&&safe(c));
 if(coffee)options.push({key:'coffee-first',label:'Have an existing pantry coffee, then collect the delivery',beforeActionKey:coffee.key});
 else{
  const breakfast=all.find(c=>c.action==='H01'&&c.variant==='bread'&&safe(c));
  if(breakfast)options.push({key:'breakfast-first',label:'Eat existing pantry bread, then collect the delivery',beforeActionKey:breakfast.key});
 }
 options.push({key:'look-first',label:'Look out of the window, then collect the delivery',beforeActionKey:'T01_window_idle'});
 return options.slice(0,3);
}

export function focusCandidate(ctx:DayContext,all=legalCandidates(ctx)):Candidate|undefined {
 const focus=ctx.dailyFocus;if(!focus||focus.status!=='planned')return;
 return all.find(c=>c.key===focus.goal.key);
}
export function hasUrgentChoice(ctx:DayContext,all=legalCandidates(ctx)):boolean {
 return shortlistCandidates(ctx,all).some(c=>c.urgent)||all.some(c=>c.urgent);
}
function preservesFocus(ctx:DayContext,c:Candidate):boolean {
 const focus=ctx.dailyFocus;if(!focus||focus.status!=='planned'||focus.kind!=='project')return true;
 return Object.entries(c.inputs).every(([item,count])=>ctx.state.inventory[item as keyof typeof ctx.state.inventory]-(count||0)>=(focus.goal.inputs[item as keyof typeof focus.goal.inputs]||0));
}
export function routineCandidates(ctx:DayContext,all=legalCandidates(ctx)):Candidate[] {
 const mandatory=shortlistCandidates(ctx,all).filter(c=>c.urgent),add=(c:Candidate)=>{if(!mandatory.some(a=>a.key===c.key))mandatory.push(c);};
 for(const c of all)if(c.urgent)add(c);
 if(mandatory.length>=6)return mandatory;
 const minor=all.filter(c=>minorActions.has(c.action)&&c.key!==ctx.dailyFocus?.goal.key&&!mandatory.some(a=>a.key===c.key)&&preservesFocus(ctx,c));
 const benefit=(c:Candidate)=>(['nutrition','hydration','energy','morale'] as const).reduce((score,need)=>score+Math.min(10000-ctx.state.needs[need],candidateRecovery(c,need))/1000,0);
 minor.sort((a,b)=>benefit(b)-benefit(a)||randomAt(ctx.seed,ctx.day,ctx.slot,'routine:'+a.key)-randomAt(ctx.seed,ctx.day,ctx.slot,'routine:'+b.key));
 const anchor=all.find(c=>c.action==='T01'&&c.variant==='idle'&&c.target===ctx.routineAnchor);
 const quiet=all.filter(c=>c.action==='T01'&&c.variant==='idle'&&c.target!==ctx.routineAnchor);
 quiet.sort((a,b)=>randomAt(ctx.seed,ctx.day,ctx.slot,'mundane:'+a.key)-randomAt(ctx.seed,ctx.day,ctx.slot,'mundane:'+b.key));
 const mundane=[...(anchor?[anchor]:[]),...quiet.slice(0,anchor?1:2)];
 const capacity=6-mandatory.length,careCount=Math.min(minor.length,Math.max(0,capacity-Math.min(2,mundane.length)));
 return[...mandatory,...minor.slice(0,careCount),...mundane.slice(0,capacity-careCount)];
}
export function localInterlude(ctx:DayContext,all=legalCandidates(ctx)):Candidate {
 const candidate=all.find(c=>c.action==='T01'&&c.variant==='idle'&&c.target===ctx.routineAnchor)||all.find(c=>c.action==='T01'&&c.variant==='idle');
 if(!candidate)throw Error('No legal local interlude.');return candidate;
}
export function focusView(focus:DailyFocus|undefined){return focus?{label:focus.goal.label,key:focus.goal.key,status:focus.status,scheduledSlot:focus.scheduledSlot}:undefined;}
