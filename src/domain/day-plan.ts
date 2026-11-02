import { candidateRecovery, legalCandidates, shortlistCandidates } from './actions';
import { dayInclination, deriveIndividuality } from './individuality';
import { cloneState, randomAt } from './state';
import { PHASES, type Candidate, type DayContext, type DailyFocus, type MorningOption, type RecentAction, type TargetId } from './types';

/** Existing codec tuple reserved for actual collection by this decision-policy version. */
export function isDeliveryCollection(value:{action:string;target:string;variant:string}):boolean {
 return value.action==='T01'&&value.target==='mailbox'&&value.variant==='default';
}
export const DAY_PLAN_VERSION='focus2-variety1-memory1-physical-delivery1';
export const MAX_MODEL_DECISIONS=61;
export const PICKUP_BY_SLOT=6;
const projectActions=new Set(['K01','K02','K03','K04','H06','H08','H09','G01','G03','G04','G05','G06']);
const minorActions=new Set(['K01','K05','K06','K07','H01','H02','H03','H04','H05','H07','G02','H15']);
const interestFor=(c:Candidate)=>c.action.startsWith('G')?'gardening':c.action==='H09'?'making':c.action.startsWith('K')?'cooking':c.action==='H08'?'making':'comfort';
const sameAction=(a:RecentAction,c:Candidate)=>a.action===c.action&&a.target===c.target&&a.variant===c.variant;
const previousActions=(ctx:DayContext)=>ctx.previousDays?.flatMap(day=>day.actions).filter(action=>action.success)||[];
const todayActions=(ctx:DayContext)=>ctx.meaningfulToday||[];
function projectFamily(c:Candidate):string {
 return c.action.startsWith('K')?'cooking':c.action.startsWith('G')?'gardening':c.action==='H09'?'building':c.action==='H08'?'repair':'housecare';
}
export function candidateActivityFamily(c:Pick<Candidate,'action'|'target'|'variant'>):string {
 if(c.action==='T01')return'mundane';
 if(['K05','K06'].includes(c.action)||c.action==='H01'&&c.variant==='quickCoffee')return'coffee';
 if(c.action==='H01'&&c.variant==='water')return'drink';
 if(c.action.startsWith('K')||c.action==='H01')return'food';
 if(c.action==='H03')return'rest';if(c.action==='H04')return'leisure';
 if(c.action==='G01')return'planting';if(c.action==='G05')return'harvest';
 if(c.action.startsWith('G'))return'garden-care';if(c.action==='H15')return'heat';
 if(c.action==='H09')return'building';if(c.action==='H08')return'repair';return'cleaning';
}
export function candidateInterest(c:Pick<Candidate,'action'|'target'|'variant'>):string {
 if(c.action==='T01')return c.target==='gardenView'||c.target==='plot1'||c.target==='plot2'?'gardening':c.target==='window'||c.target==='hall'?'exploring':c.target==='cupboard'?'making':c.target==='store'||c.target==='prep'?'cooking':'comfort';
 const family=candidateActivityFamily(c);return family==='food'||family==='coffee'?'cooking':c.action.startsWith('G')||c.action==='H04'&&c.variant==='garden'?'gardening':['heat','building','repair'].includes(family)?'making':'comfort';
}
/** A menu can offer related alternatives without allowing one family to crowd out all others. */
function familyCoverage(candidates:Candidate[],count:number,family:(c:Candidate)=>string,initial:Candidate[]=[]):Candidate[] {
 const selected=initial.slice(0,count),seen=new Set(selected.map(family));
 for(const c of candidates)if(selected.length<count&&!seen.has(family(c))){selected.push(c);seen.add(family(c));}
 for(const c of candidates)if(selected.length<count&&!selected.some(other=>other.key===c.key))selected.push(c);
 return selected;
}

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
  const rank=(c:Candidate)=>Number(interestFor(c)===inclination.interest)*4+Number(interestFor(c)===profile.interest)*2+Number(c.action==='G05')*2-Math.min(1,previousActions(ctx).filter(a=>sameAction(a,c)).length*.35);
  return rank(b)-rank(a)||randomAt(ctx.seed,ctx.day,0,'focus:'+a.key)-randomAt(ctx.seed,ctx.day,0,'focus:'+b.key);
 });
 // Two identical plots/recipes should not crowd every other kind of useful project out.
 const seen=new Set<string>(),unique=all.filter(c=>{const group=c.action+'_'+c.variant;if(seen.has(group))return false;seen.add(group);return true;});
 const projects=familyCoverage(unique,4,projectFamily);
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
 const beforeAction=(c:Candidate):NonNullable<MorningOption['beforeAction']>=>({action:c.action,target:c.target,variant:c.variant,inputs:cloneState(c.inputs),energy:c.energy,successChance:c.successChance,description:c.description});
 const ritual=all.find(c=>c.action==='K05'&&safe(c)),quick=all.find(c=>c.action==='H01'&&c.variant==='quickCoffee'&&safe(c));
 if(ritual)options.push({key:'coffee-first',label:'Make an existing pantry coffee ritual, then collect the delivery',beforeActionKey:ritual.key,beforeAction:beforeAction(ritual)});
 if(quick)options.push({key:'quick-coffee-first',label:'Have a quick existing pantry coffee, then collect the delivery',beforeActionKey:quick.key,beforeAction:beforeAction(quick)});
 const breakfast=all.find(c=>c.action==='H01'&&c.variant==='bread'&&safe(c));
 if(breakfast)options.push({key:'breakfast-first',label:'Eat existing pantry bread, then collect the delivery',beforeActionKey:breakfast.key,beforeAction:beforeAction(breakfast)});
 options.push({key:'look-first',label:'Look out of the window, then collect the delivery',beforeActionKey:'T01_window_idle'});
 return options.slice(0,5);
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
 const profile=deriveIndividuality(ctx.state.seed),daily=dayInclination(ctx.state.seed,ctx.day),today=todayActions(ctx),previous=previousActions(ctx);
 const followUp=(c:Candidate)=>{
  const focus=ctx.dailyFocus;if(focus?.status!=='completed'||today.some(a=>sameAction(a,c)))return false;
  return focus.goal.action==='H09'&&focus.goal.variant==='chair'&&c.action==='H04'&&c.target==='chair'
   ||focus.goal.action==='G01'&&c.action==='G02'&&c.target===focus.goal.target;
 };
 const score=(c:Candidate)=>{
  const benefit=(['nutrition','hydration','energy','morale'] as const).reduce((sum,need)=>sum+Math.min(10000-ctx.state.needs[need],candidateRecovery(c,need))/1000,0),interest=candidateInterest(c);
  const preference=Number(interest===daily.interest)*.3+Number(interest===profile.interest)*.15+Number(interest===profile.secondaryInterest)*.08;
  const repetition=Math.min(.6,today.filter(a=>sameAction(a,c)).length*.25+previous.filter(a=>sameAction(a,c)).length*.08);
  return benefit+preference+Number(followUp(c))*.35-repetition;
 };
 minor.sort((a,b)=>score(b)-score(a)||randomAt(ctx.seed,ctx.day,ctx.slot,'routine:'+a.key)-randomAt(ctx.seed,ctx.day,ctx.slot,'routine:'+b.key));
 const anchor=all.find(c=>c.action==='T01'&&c.variant==='idle'&&c.target===ctx.routineAnchor);
 const quiet=all.filter(c=>c.action==='T01'&&c.variant==='idle'&&c.target!==ctx.routineAnchor);
 const quietScore=(c:Candidate)=>Number(candidateInterest(c)===daily.interest)*.4+Number(candidateInterest(c)===profile.interest)*.2+Number(candidateInterest(c)===profile.secondaryInterest)*.1-Math.min(.8,today.filter(a=>sameAction(a,c)).length*.3+previous.filter(a=>sameAction(a,c)).length*.1);
 quiet.sort((a,b)=>quietScore(b)-quietScore(a)||randomAt(ctx.seed,ctx.day,ctx.slot,'mundane:'+a.key)-randomAt(ctx.seed,ctx.day,ctx.slot,'mundane:'+b.key));
 const mundane=[...(anchor?[anchor]:[]),...quiet.slice(0,anchor?1:2)];
 const capacity=6-mandatory.length,careCount=Math.min(minor.length,Math.max(0,capacity-Math.min(2,mundane.length)));
 const fresh=minor.find(followUp),care=familyCoverage(minor,careCount,candidateActivityFamily,fresh?[fresh]:[]);
 // Coverage decides inclusion; utility order remains visible rather than always leading with a new toy.
 care.sort((a,b)=>score(b)-score(a)||minor.indexOf(a)-minor.indexOf(b));
 return[...mandatory,...care,...mundane.slice(0,capacity-careCount)];
}
export function localInterlude(ctx:DayContext,all=legalCandidates(ctx)):Candidate {
 const candidate=all.find(c=>c.action==='T01'&&c.variant==='idle'&&c.target===ctx.routineAnchor)||all.find(c=>c.action==='T01'&&c.variant==='idle');
 if(!candidate)throw Error('No legal local interlude.');return candidate;
}
export function focusView(focus:DailyFocus|undefined){return focus?{label:focus.goal.label,key:focus.goal.key,status:focus.status,scheduledSlot:focus.scheduledSlot,action:focus.goal.action,target:focus.goal.target,variant:focus.goal.variant,inputs:cloneState(focus.goal.inputs)}:undefined;}
