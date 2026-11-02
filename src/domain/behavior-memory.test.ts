import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePreviousDays, previousDayMemory } from './behavior-memory';
import { createInitialState, cloneState } from './state';
import { prepareDay } from './prepare';
import { packState } from './codec';
import { ITEM_IDS, type ChoiceContext, type ChoiceProvider, type DayCheckpoint, type PreviousDayMemory, type RecentAction } from './types';

test('prior compact-history context retains bounded truthful executed actions',()=>{
 const quiet:RecentAction={action:'T01',target:'bed',variant:'idle',success:true};
 const history:RecentAction[]=[...Array.from({length:8},(_,i)=>({action:'H01' as const,target:'store' as const,variant:i%2?'bread':'water',success:i!==3})),...Array.from({length:20},()=>({...quiet}))];
 const memory=previousDayMemory(2,history),basis=JSON.stringify(history);
 assert.equal(memory.actions.length,6);assert.deepEqual(memory.actions,history.slice(2,8));assert.equal(memory.actions[1]!.success,false);
 const prior:PreviousDayMemory[]=[memory,{day:1,actions:[]}],copy=normalizePreviousDays(prior,3);
 assert.deepEqual(copy.map(day=>day.day),[1,2]);copy[1]!.actions[0]!.variant='milk';assert.equal(JSON.stringify(history),basis);assert.equal(memory.actions[0]!.variant,'water');
 assert.throws(()=>normalizePreviousDays([{day:3,actions:[]}],3),/invalid/);
 assert.throws(()=>normalizePreviousDays([{day:1,actions:[]},{day:1,actions:[]}],3),/invalid/);
 assert.throws(()=>normalizePreviousDays([{day:1,actions:[quiet]}],3),/quiet/);
 assert.throws(()=>normalizePreviousDays([{day:1,actions:history.slice(0,7)}],3),/invalid/);
 assert.throws(()=>normalizePreviousDays([{day:1,actions:[]},{day:2,actions:[]},{day:3,actions:[]}],4),/bound/);
});

test('planned and executed behavior memory is frozen through exact checkpoint recovery',async()=>{
 const base=createInitialState('0x9a',{body:2,wits:2,spirit:1},'MEM');base.day=1;base.level=1;
 for(const item of ITEM_IDS)base.inventory[item]=0;
 Object.assign(base.inventory,{water:2,bread:2,coffee:1,wood:1,toolkit:1,rose_seeds:1});
 Object.assign(base.needs,{nutrition:6500,hydration:6500,energy:7500,morale:6500});
 const prior:PreviousDayMemory[]=[{day:1,actions:[{action:'G01',target:'plot1',variant:'apple',success:false}]}],basis=JSON.stringify({base,prior}),contexts:ChoiceContext[]=[];
 const provider:ChoiceProvider=async context=>{
  contexts.push(cloneState(context));
  const candidate=context.mode==='day-plan'?context.candidates.find(c=>c.action==='G01')||context.candidates[0]:context.candidates.find(c=>c.action==='H04')||context.candidates.find(c=>c.action==='T01')||context.candidates[0];
  context.previousDays![0]!.actions[0]!.variant='rose';context.earlierToday?.splice(0);
  return{key:candidate!.key,...(context.mode==='day-plan'?{morningKey:'collect-first'}:{})};
 };
 const options={incidentRate:0,blackSwanRate:0,previousDays:prior};
 const full=await prepareDay(base,['milk'],provider,options);
 assert.ok(contexts.length>2);assert.ok(contexts.every(c=>JSON.stringify(c.previousDays)===JSON.stringify(prior)));
 for(const context of contexts){const earlier=full.receipts.filter(r=>r.slot<context.slot&&r.role!=='interlude').slice(-8).map(({action,target,variant,success})=>({action,target,variant,success}));assert.deepEqual(context.earlierToday,earlier);}
 const logicalTail=full.receipts.slice(-6).map(({action,target,variant,success})=>({action,target,variant,success}));assert.deepEqual(full.finalState.recent,logicalTail);
 assert.equal(JSON.stringify({base,prior}),basis);
 let checkpoint:DayCheckpoint|undefined;
 await assert.rejects(prepareDay(base,['milk'],provider,{...options,onCheckpoint:point=>{if(point.context.slot===21){checkpoint=point;throw Error('checkpoint interruption');}}}),/interruption/);
 assert.ok(checkpoint);assert.deepEqual(checkpoint.context.previousDays,prior);assert.ok(checkpoint.context.meaningfulToday.length<=8);
 const resumed=await prepareDay(base,['milk'],provider,{...options,resume:checkpoint});assert.equal(resumed.history,full.history);assert.equal(packState(resumed.finalState),packState(full.finalState));assert.deepEqual(resumed.dailyFocus,full.dailyFocus);
 let unexpectedCalls=0;const forbidden:ChoiceProvider=async()=>{unexpectedCalls++;throw Error('Unexpected provider call');};
 await assert.rejects(prepareDay(base,['milk'],forbidden,{...options,resume:checkpoint,previousDays:[{day:1,actions:[]}]}),/previous-day memory changed/);
 const corrupt=cloneState(checkpoint);corrupt.context.meaningfulToday=[];
 await assert.rejects(prepareDay(base,['milk'],forbidden,{...options,resume:corrupt}),/executed-action memory changed/);
 assert.equal(unexpectedCalls,0);
});
