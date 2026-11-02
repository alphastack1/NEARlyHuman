import { PHASES, type Candidate, type ChoiceProvider, type DayCheckpoint, type DayContext, type DayResult, type GameState, type ItemId, type ModelChoice, type PrepareOptions, type Receipt, type RecentAction, type StateChange } from './types';
import { assertState, cloneState, deriveDaySeed, validateDelivery } from './state';
import { applyAction, legalCandidates, shortlistCandidates } from './actions';
import { bedtime, kill, phaseBoundary } from './mechanics';
import { checkBlackSwan, DEFAULT_EVENT_PARAMETERS, introduceEpisode } from './director';
import { encodeHistory, OUTCOME } from './codec';
import { focusCandidate, focusOptions, focusView, hasUrgentChoice, isDeliveryCollection, localInterlude, MAX_MODEL_DECISIONS, morningOptions, PICKUP_BY_SLOT, routineCandidates } from './day-plan';
import { normalizePreviousDays } from './behavior-memory';

export class InvalidChoiceError extends Error { constructor(message='Jev selected an unavailable action.'){super(message);this.name='InvalidChoiceError';} }
export function createDayContext(base:GameState,delivery:readonly ItemId[]=[],options:PrepareOptions={}):DayContext {
  assertState(base);validateDelivery(base,delivery);if(base.level!==base.day)throw Error('The living save counters do not match.');
  const state=cloneState(base);state.day=base.day+1;delete state.deathCause;delete state.deathContributors;
  const seed=options.daySeed||deriveDaySeed(base.seed,state.day);
  const primarySlot=1+(parseInt(seed.slice(-8)||'0',16)%5)*10;
  return{state,day:state.day,slot:0,seed,restUses:0,leisureUses:0,lastRest:-100,lastLeisure:-100,chairMoved:false,minorUsed:false,primaryIntroduced:false,primarySlot,events:[],modelChoices:0,pendingDelivery:[...delivery],routineAnchor:'bed',previousDays:normalizePreviousDays(options.previousDays,state.day),meaningfulToday:[]};
}
const actionRecord=({action,target,variant,success}:RecentAction):RecentAction=>({action,target,variant,success});
const meaningfulFrom=(receipts:readonly Receipt[]):RecentAction[]=>receipts.filter(receipt=>receipt.role!=='interlude').slice(-8).map(actionRecord);
function changes(before:GameState,after:GameState):StateChange[] {const out:StateChange[]=[];const scan=(a:unknown,b:unknown,p='')=>{if(a!==null&&b!==null&&typeof a==='object'&&typeof b==='object'){const x=a as Record<string,unknown>,y=b as Record<string,unknown>;for(const k of new Set([...Object.keys(x),...Object.keys(y)]))scan(x[k],y[k],p?p+'.'+k:k);}else if(a!==b&&p!=='recent'&&!p.startsWith('recent.'))out.push({field:p,before:(a??null) as StateChange['before'],after:(b??null) as StateChange['after']});};scan(before,after);return out;}
function finalSummary(result:GameState,receipts:Receipt[]):string[] {if(!result.alive)return[receipts.at(-1)?.events.find(e=>e.kind==='death')?.message||'This life has ended.'];const lines:string[]=[];for(const r of receipts){for(const e of r.events)if(['incident','growth','recovery','loss'].includes(e.kind)&&!lines.includes(e.message))lines.push(e.message);}if(!lines.length)for(const r of receipts)if(r.action!=='T01'&&!lines.includes(r.lines[0]))lines.push(r.lines[0]);return lines.slice(0,3);}
function validTelemetry(result:ModelChoice,candidates:Candidate[]):Record<string,number>|undefined {if(!result.probabilities)return;const legal=new Set(candidates.map(c=>c.key));const pairs=Object.entries(result.probabilities).filter(([k,n])=>legal.has(k)&&Number.isFinite(n)&&n>=0&&n<=1);return pairs.length?Object.fromEntries(pairs):undefined;}
function situationOf(ctx:DayContext){return{episodes:cloneState([ctx.primary,ctx.taskFire].filter(e=>e&&!e.resolved)) as import('./types').Episode[],restUses:ctx.restUses,leisureUses:ctx.leisureUses,lastRest:ctx.lastRest,lastLeisure:ctx.lastLeisure,chairMoved:ctx.chairMoved,minorUsed:ctx.minorUsed};}
function choiceRecord(reply:ModelChoice,candidates:Candidate[],situation?:import('./types').DecisionSituation):NonNullable<Receipt['choice']>{return{selected:reply.key,candidates:cloneState(candidates),probabilities:validTelemetry(reply,candidates),provider:reply.provider,model:reply.model,requestId:reply.requestId,...(situation?{situation:cloneState(situation)}:{})};}
async function dayPlan(ctx:DayContext,provider:ChoiceProvider):Promise<void>{
 const candidates=focusOptions(ctx),morning=morningOptions(ctx,candidates),situation=situationOf(ctx);
 const raw=await provider({state:cloneState(ctx.state),day:ctx.day,slot:0,phase:'Dawn',candidates:cloneState(candidates),recent:cloneState(ctx.state.recent),situation,mode:'day-plan',morningOptions:cloneState(morning),pendingDelivery:[...(ctx.pendingDelivery||[])],previousDays:cloneState(ctx.previousDays||[]),earlierToday:cloneState(ctx.meaningfulToday)});
 const reply:ModelChoice=typeof raw==='string'?{key:raw}:raw,selected=candidates.find(c=>c.key===reply?.key);if(!selected?.plan)throw new InvalidChoiceError('Jev selected an unavailable day focus.');
 const order=morning.find(option=>option.key===reply.morningKey)||(reply.morningKey===undefined?morning[0]:undefined);if(!order)throw new InvalidChoiceError('Jev selected an unavailable morning order.');
 ctx.modelChoices++;
 ctx.dailyFocus={version:1,kind:selected.plan.kind,goal:{key:selected.plan.actionKey,action:selected.action,target:selected.target,variant:selected.variant,label:selected.label.split(' · ')[0]!,inputs:cloneState(selected.inputs)},scheduledSlot:selected.plan.scheduledSlot,status:'planned',morning:cloneState(order),choice:choiceRecord(reply,candidates,situation),...(reply.morningKey?{morningChoice:{selected:reply.morningKey,candidates:cloneState(morning),probabilities:reply.morningProbabilities,provider:reply.provider,model:reply.model,requestId:reply.requestId}}:{})};
 ctx.morningActionDone=!order.beforeActionKey;
}
function settleUnopenedDelivery(ctx:DayContext):void {
 const pending=ctx.pendingDelivery||[];if(!pending.length)return;
 if(ctx.state.alive)throw Error('A living day cannot finish with an uncollected delivery.');
 for(const id of pending){if(ctx.state.inventory[id]>=65535)throw Error('Unopened delivery exceeds inventory capacity.');ctx.state.inventory[id]++;}
 ctx.pendingDelivery=[];ctx.deliverySettled='estate';ctx.events.push({kind:'delivery',target:'mailbox',message:'The unopened delivery remained outside with the home.',source:'estate'});
}
export async function prepareDay(base:GameState,delivery:readonly ItemId[],provider:ChoiceProvider,options:PrepareOptions={}):Promise<DayResult> {
  let ctx:DayContext;let receipts:Receipt[];
  if(options.resume){const checkpoint=cloneState(options.resume);ctx=checkpoint.context;receipts=checkpoint.receipts;if(ctx.day!==base.day+1||ctx.state.seed!==base.seed||receipts.length!==ctx.slot)throw Error('The checkpoint belongs to another day.');validateDelivery(base,delivery);}
  else{ctx=createDayContext(base,delivery,options);receipts=[];}
  ctx.previousDays=normalizePreviousDays(ctx.previousDays,ctx.day);
  if(options.previousDays!==undefined&&JSON.stringify(normalizePreviousDays(options.previousDays,ctx.day))!==JSON.stringify(ctx.previousDays))throw Error('The checkpoint previous-day memory changed.');
  const actualToday=meaningfulFrom(receipts);
  if(ctx.meaningfulToday!==undefined&&JSON.stringify(ctx.meaningfulToday)!==JSON.stringify(actualToday))throw Error('The checkpoint executed-action memory changed.');
  ctx.meaningfulToday=actualToday;
  const pending=ctx.pendingDelivery;
  if(!Array.isArray(pending)||pending.some(id=>!delivery.includes(id))||new Set(pending).size!==pending.length||ctx.state.alive&&ctx.slot>=PICKUP_BY_SLOT&&pending.length)throw Error('The delivery checkpoint is inconsistent.');
  if(ctx.deliverySettled==='collected'){
    if(pending.length||!delivery.length||!ctx.deliveryCollectedSlot||ctx.deliveryCollectedSlot>Math.min(ctx.slot,PICKUP_BY_SLOT))throw Error('The collected-delivery checkpoint is inconsistent.');
  }else if(ctx.deliverySettled==='estate'){
    if(ctx.state.alive||pending.length||!delivery.length||ctx.deliveryCollectedSlot)throw Error('The estate-delivery checkpoint is inconsistent.');
  }else if(pending.length!==delivery.length||delivery.some(id=>!pending.includes(id)))throw Error('The waiting-delivery checkpoint is incomplete.');
  if(!ctx.dailyFocus){if(ctx.slot!==0)throw Error('The day-plan checkpoint is missing.');await dayPlan(ctx,provider);if(options.onCheckpoint)await options.onCheckpoint(cloneState({context:ctx,receipts}));}
  if(ctx.dailyFocus?.version!==1||ctx.modelChoices>MAX_MODEL_DECISIONS)throw Error('The day-plan checkpoint is invalid.');
  for(let slot=ctx.slot+1;slot<=60&&ctx.state.alive;slot++){
    ctx.slot=slot;ctx.events=[];const before=cloneState(ctx.state);if(!ctx.state.needs.health)kill(ctx,'health');
    if(ctx.state.alive)introduceEpisode(ctx,options.incidentRate??DEFAULT_EVENT_PARAMETERS.incidentRate);
    if(ctx.state.alive)checkBlackSwan(ctx,options.blackSwanRate??DEFAULT_EVENT_PARAMETERS.blackSwanRate);
    const decisionSnapshot=ctx.state.alive?cloneState(ctx.state):undefined;
    const situation=situationOf(ctx);
    let chosen:Candidate|undefined;let recorded:Receipt['choice'];let role:Receipt['role']='interlude',plan:Receipt['plan'];let success=false;let outcome=OUTCOME.terminal as number;let message='This life has ended.';let lines:[string,string]=['This life has ended.',''];
    if(ctx.state.alive){
      const all=legalCandidates(ctx),urgent=hasUrgentChoice(ctx,all),focus=ctx.dailyFocus!,pickup=all.find(isDeliveryCollection);
      const beforePickup=!ctx.morningActionDone&&focus.morning.beforeActionKey?all.find(c=>c.key===focus.morning.beforeActionKey):undefined;
      if(pickup&&(slot>=PICKUP_BY_SLOT||!urgent&&(ctx.morningActionDone||!beforePickup))){chosen=pickup;role='delivery';plan='delivery';if(!ctx.morningActionDone){focus.morning.skipped=true;ctx.morningActionDone=true;}}
      else if(beforePickup&&!urgent){chosen=beforePickup;role='routine';plan='morning';ctx.morningActionDone=true;focus.morning.attemptedSlot=slot;}
      else if(!pickup&&focus.status==='planned'&&slot>=focus.scheduledSlot&&!urgent){
        chosen=focusCandidate(ctx,all);if(chosen){role=focus.kind==='project'?'focus':'routine';plan='focus';focus.attemptedSlot=slot;}
        else if(slot>=50){focus.status='unavailable';ctx.events.push({kind:'routine',target:focus.goal.target,message:'Did not get to '+focus.goal.label.toLowerCase()+'.',source:'focus'});}
      }
      if(!chosen&&(slot%10===1||urgent)){
        const candidates=routineCandidates(ctx,all);if(!candidates.length)throw Error('No legal routine candidate.');
        role='routine';
        if(candidates.length===1)chosen=candidates[0]!;
        else{
        const earlierToday=cloneState(ctx.meaningfulToday);
        if(ctx.modelChoices>=MAX_MODEL_DECISIONS)throw new InvalidChoiceError('The day reached its model decision bound.');
        const raw=await provider({state:cloneState(ctx.state),day:ctx.day,slot,phase:PHASES[Math.floor((slot-1)/10)]!,candidates:cloneState(candidates),recent:cloneState(ctx.state.recent),situation:cloneState(situation),earlierToday,mode:'routine',dailyFocus:focusView(focus),pendingDelivery:[...(ctx.pendingDelivery||[])],previousDays:cloneState(ctx.previousDays||[])});
        const reply:ModelChoice=typeof raw==='string'?{key:raw}:raw;
        if(!reply||typeof reply.key!=='string')throw new InvalidChoiceError();chosen=candidates.find(c=>c.key===reply.key);if(!chosen)throw new InvalidChoiceError();
        ctx.modelChoices++;recorded=choiceRecord(reply,candidates,situation);
        }
      }
      chosen||=localInterlude(ctx,all);
      if(isDeliveryCollection(chosen)){role='delivery';plan='delivery';if(!ctx.morningActionDone){focus.morning.skipped=true;ctx.morningActionDone=true;}}
      if(focus.kind==='project'&&focus.status==='planned'&&chosen.key===focus.goal.key){role='focus';plan='focus';focus.attemptedSlot=slot;}
      const applied=applyAction(ctx,chosen);({success,outcome,message,lines}=applied);
      ctx.routineAnchor=isDeliveryCollection(chosen)?'store':chosen.target;
      if(plan==='focus'){focus.status=success?'completed':'failed';if(success)focus.completedSlot=slot;}
      if(ctx.state.alive&&slot%10===0)phaseBoundary(ctx);
      if(ctx.state.alive&&slot===60)bedtime(ctx);
      ctx.state.recent.push({action:chosen.action,target:chosen.target,variant:chosen.variant,success});ctx.state.recent=ctx.state.recent.slice(-6);
    }
    if(!ctx.state.alive){settleUnopenedDelivery(ctx);outcome|=OUTCOME.terminal;const death=ctx.events.find(e=>e.kind==='death');if(death){message=death.message;lines=[death.message,''];}}
    const receipt:Receipt={index:slot-1,day:ctx.day,slot,phase:PHASES[Math.floor((slot-1)/10)]!,action:chosen?.action||'T01',actionId:chosen?.action||'T01',target:chosen?.target||'hall',variant:chosen?.variant||'idle',label:chosen?.label||'A terminal incident',inputs:chosen?.inputs||{},success,outcome,message,lines,events:cloneState(ctx.events),changes:changes(before,ctx.state),before,...(decisionSnapshot?{decisionSnapshot}:{}),snapshot:cloneState(ctx.state),...(recorded?{choice:recorded}:{}),role,...(plan?{plan}:{})};
    receipts.push(receipt);
    if(chosen&&role!=='interlude'){ctx.meaningfulToday.push(actionRecord(receipt));ctx.meaningfulToday=ctx.meaningfulToday.slice(-8);}
    if(options.onCheckpoint)await options.onCheckpoint(cloneState({context:ctx,receipts} satisfies DayCheckpoint));
  }
  if(ctx.state.alive&&receipts.length!==60)throw Error('An unfinished day cannot finalize.');
  const finalState=cloneState(ctx.state);assertState(finalState);
  if(ctx.pendingDelivery?.length)throw Error('Unsettled delivery cannot finalize.');
  if(ctx.dailyFocus?.status==='planned')ctx.dailyFocus.status='unavailable';
  return{version:1,day:ctx.day,baseDay:base.day,survived:finalState.alive,finalState,state:finalState,receipts,decisions:ctx.modelChoices,history:encodeHistory(receipts),delivery:[...delivery],summary:finalSummary(finalState,receipts),dailyFocus:cloneState(ctx.dailyFocus),startTarget:'bed',...(ctx.deliveryCollectedSlot?{deliveryCollectedSlot:ctx.deliveryCollectedSlot}:{}),...(ctx.deliverySettled?{deliverySettled:ctx.deliverySettled}:{})};
}
