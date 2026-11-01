import { PHASES, type Candidate, type ChoiceProvider, type DayCheckpoint, type DayContext, type DayResult, type GameState, type ItemId, type ModelChoice, type PrepareOptions, type Receipt, type StateChange } from './types';
import { assertState, cloneState, deriveDaySeed, validateDelivery } from './state';
import { applyAction, legalCandidates, shortlistCandidates } from './actions';
import { bedtime, kill, phaseBoundary } from './mechanics';
import { checkBlackSwan, DEFAULT_EVENT_PARAMETERS, introduceEpisode } from './director';
import { encodeHistory, OUTCOME } from './codec';

export class InvalidChoiceError extends Error { constructor(message='Jev selected an unavailable action.'){super(message);this.name='InvalidChoiceError';} }
export function createDayContext(base:GameState,delivery:readonly ItemId[]=[],options:PrepareOptions={}):DayContext {
  assertState(base);validateDelivery(base,delivery);if(base.level!==base.day)throw Error('The living save counters do not match.');
  const state=cloneState(base);state.day=base.day+1;delete state.deathCause;delete state.deathContributors;for(const id of delivery)state.inventory[id]++;
  const seed=options.daySeed||deriveDaySeed(base.seed,state.day);
  const primarySlot=1+(parseInt(seed.slice(-8)||'0',16)%5)*10;
  return{state,day:state.day,slot:0,seed,restUses:0,leisureUses:0,lastRest:-100,lastLeisure:-100,chairMoved:false,minorUsed:false,primaryIntroduced:false,primarySlot,events:[],modelChoices:0};
}
function changes(before:GameState,after:GameState):StateChange[] {const out:StateChange[]=[];const scan=(a:unknown,b:unknown,p='')=>{if(a!==null&&b!==null&&typeof a==='object'&&typeof b==='object'){const x=a as Record<string,unknown>,y=b as Record<string,unknown>;for(const k of new Set([...Object.keys(x),...Object.keys(y)]))scan(x[k],y[k],p?p+'.'+k:k);}else if(a!==b&&p!=='recent'&&!p.startsWith('recent.'))out.push({field:p,before:(a??null) as StateChange['before'],after:(b??null) as StateChange['after']});};scan(before,after);return out;}
function finalSummary(result:GameState,receipts:Receipt[]):string[] {if(!result.alive)return[receipts.at(-1)?.events.find(e=>e.kind==='death')?.message||'This life has ended.'];const lines:string[]=[];for(const r of receipts){for(const e of r.events)if(['incident','growth','recovery','loss'].includes(e.kind)&&!lines.includes(e.message))lines.push(e.message);}if(!lines.length)for(const r of receipts)if(r.action!=='T01'&&!lines.includes(r.lines[0]))lines.push(r.lines[0]);return lines.slice(0,3);}
function validTelemetry(result:ModelChoice,candidates:Candidate[]):Record<string,number>|undefined {if(!result.probabilities)return;const legal=new Set(candidates.map(c=>c.key));const pairs=Object.entries(result.probabilities).filter(([k,n])=>legal.has(k)&&Number.isFinite(n)&&n>=0&&n<=1);return pairs.length?Object.fromEntries(pairs):undefined;}
export async function prepareDay(base:GameState,delivery:readonly ItemId[],provider:ChoiceProvider,options:PrepareOptions={}):Promise<DayResult> {
  let ctx:DayContext;let receipts:Receipt[];
  if(options.resume){const checkpoint=cloneState(options.resume);ctx=checkpoint.context;receipts=checkpoint.receipts;if(ctx.day!==base.day+1||ctx.state.seed!==base.seed||receipts.length!==ctx.slot)throw Error('The checkpoint belongs to another day.');validateDelivery(base,delivery);}
  else{ctx=createDayContext(base,delivery,options);receipts=[];}
  for(let slot=ctx.slot+1;slot<=60&&ctx.state.alive;slot++){
    ctx.slot=slot;ctx.events=[];const before=cloneState(ctx.state);if(!ctx.state.needs.health)kill(ctx,'health');
    if(ctx.state.alive)introduceEpisode(ctx,options.incidentRate??DEFAULT_EVENT_PARAMETERS.incidentRate);
    if(ctx.state.alive)checkBlackSwan(ctx,options.blackSwanRate??DEFAULT_EVENT_PARAMETERS.blackSwanRate);
    const decisionSnapshot=ctx.state.alive?cloneState(ctx.state):undefined;
    const situation={episodes:cloneState([ctx.primary,ctx.taskFire].filter(e=>e&&!e.resolved)) as import('./types').Episode[],restUses:ctx.restUses,leisureUses:ctx.leisureUses,lastRest:ctx.lastRest,lastLeisure:ctx.lastLeisure,chairMoved:ctx.chairMoved,minorUsed:ctx.minorUsed};
    let chosen:Candidate|undefined;let recorded:Receipt['choice'];let success=false;let outcome=OUTCOME.terminal as number;let message='This life has ended.';let lines:[string,string]=['This life has ended.',''];
    if(ctx.state.alive){
      const candidates=shortlistCandidates(ctx,legalCandidates(ctx));if(!candidates.length)throw Error('No legal safe-idle candidate.');
      if(candidates.length===1)chosen=candidates[0]!;
      else{
        const earlierToday=receipts.filter(receipt=>receipt.action!=='T01').slice(-8).map(({action,target,variant,success})=>({action,target,variant,success}));
        const raw=await provider({state:cloneState(ctx.state),day:ctx.day,slot,phase:PHASES[Math.floor((slot-1)/10)]!,candidates:cloneState(candidates),recent:cloneState(ctx.state.recent),situation:cloneState(situation),earlierToday});
        const reply:ModelChoice=typeof raw==='string'?{key:raw}:raw;
        if(!reply||typeof reply.key!=='string')throw new InvalidChoiceError();chosen=candidates.find(c=>c.key===reply.key);if(!chosen)throw new InvalidChoiceError();
        ctx.modelChoices++;recorded={selected:chosen.key,candidates:cloneState(candidates),probabilities:validTelemetry(reply,candidates),provider:reply.provider,model:reply.model,requestId:reply.requestId,situation:cloneState(situation)};
      }
      const applied=applyAction(ctx,chosen);({success,outcome,message,lines}=applied);
      if(ctx.state.alive&&slot%10===0)phaseBoundary(ctx);
      if(ctx.state.alive&&slot===60)bedtime(ctx);
      ctx.state.recent.push({action:chosen.action,target:chosen.target,variant:chosen.variant,success});ctx.state.recent=ctx.state.recent.slice(-6);
    }
    if(!ctx.state.alive){outcome|=OUTCOME.terminal;const death=ctx.events.find(e=>e.kind==='death');if(death){message=death.message;lines=[death.message,''];}}
    const receipt:Receipt={index:slot-1,day:ctx.day,slot,phase:PHASES[Math.floor((slot-1)/10)]!,action:chosen?.action||'T01',actionId:chosen?.action||'T01',target:chosen?.target||'hall',variant:chosen?.variant||'idle',label:chosen?.label||'A terminal incident',inputs:chosen?.inputs||{},success,outcome,message,lines,events:cloneState(ctx.events),changes:changes(before,ctx.state),before,...(decisionSnapshot?{decisionSnapshot}:{}),snapshot:cloneState(ctx.state),...(recorded?{choice:recorded}:{})};
    receipts.push(receipt);
    if(options.onCheckpoint)await options.onCheckpoint(cloneState({context:ctx,receipts} satisfies DayCheckpoint));
  }
  if(ctx.state.alive&&receipts.length!==60)throw Error('An unfinished day cannot finalize.');
  const finalState=cloneState(ctx.state);assertState(finalState);
  return{version:1,day:ctx.day,baseDay:base.day,survived:finalState.alive,finalState,state:finalState,receipts,decisions:ctx.modelChoices,history:encodeHistory(receipts),delivery:[...delivery],summary:finalSummary(finalState,receipts)};
}
