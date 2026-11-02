import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDecision } from './jev';
import { createDayContext, createInitialState, legalCandidates, type ChoiceContext, type RecentAction } from '../src/domain';

test('model receives clipped recovery and truthful bounded familiarity without forcing novelty',()=>{
 const state=createInitialState('0xc0ffee',{body:2,wits:2,spirit:1},'COCO');state.day=1;state.level=1;
 state.needs={health:10000,nutrition:9500,hydration:9500,energy:9500,morale:9500};state.inventory.bread=1;state.inventory.coffee=1;
 const ctx=createDayContext(state);ctx.slot=11;
 const toast:RecentAction={action:'K01',target:'stove',variant:'toast',success:true};
 const context:ChoiceContext={state:ctx.state,day:2,slot:11,phase:'Morning',candidates:legalCandidates(ctx).filter(c=>['K01','H03','H04'].includes(c.action)||c.variant==='quickCoffee'),recent:[],situation:{episodes:[],restUses:0,leisureUses:0,lastRest:-100,lastLeisure:-100,chairMoved:false,minorUsed:false},earlierToday:[toast],previousDays:[{day:1,actions:[toast]}],mode:'routine'};
 const before=JSON.stringify(context),decision=buildDecision(context),criteria=decision.questions.next_action.criteria;
 assert.deepEqual(criteria.K01_stove_toast.clipped_gain_on_success,{food:5,water:0,energy:0,morale:5,before_phase_boundary:true});
 assert.deepEqual(criteria.K01_stove_toast.familiarity,{today:1,family_today:1,prior_successes:1});assert.ok(criteria.K01_stove_toast.resource_caution);
 assert.equal(criteria.H03_bed_bed.clipped_gain_on_success?.energy,5);assert.equal(decision.state.previous_days.days[0]?.day,1);
 assert.equal(criteria.H01_store_quickCoffee.clipped_gain_on_success?.energy,6,'energy cost happens before clipped restoration');
 const withMeal=buildDecision({...context,dailyFocus:{key:'K03_prep_bowl',label:'Make a comfort bowl',status:'planned',scheduledSlot:46,action:'K03',target:'prep',variant:'bowl',inputs:{milk:1,bread:1}},slot:41});
 assert.deepEqual(withMeal.state.main_undertaking?.nominal_gain_if_success,{food:50,water:20,energy:0,morale:20});assert.equal(withMeal.state.main_undertaking?.slots_until_plan,5);assert.equal(withMeal.state.main_undertaking?.success_is_not_guaranteed,true);
 assert.match(decision.questions.next_action.instructions,/Needed food, water, rest and treatment may always repeat/);
 assert.equal(JSON.stringify(context),before);
});

test('a full legal candidate map plus bounded memory stays inside the paid request budget',()=>{
 const state=createInitialState('0x1234',{body:2,wits:2,spirit:1},'PIP');state.day=2;state.level=2;for(const id of Object.keys(state.inventory) as (keyof typeof state.inventory)[])state.inventory[id]=3;
 state.needs={health:4000,nutrition:2000,hydration:2000,energy:5000,morale:1000};state.house.mess=2;state.house.chairLife=3;state.house.damage={stove:true,window:true,chair:true};state.house.powerOut=true;state.house.fire='flame';
 state.conditions=[{kind:'wound',severity:2,onsetDay:1,dueDay:3},{kind:'illness',severity:1,onsetDay:1,dueDay:3},{kind:'infection',severity:1,onsetDay:1,dueDay:3},{kind:'contaminatedBody',severity:1,onsetDay:1,dueDay:0},{kind:'contaminatedSurface',severity:1,onsetDay:1,dueDay:0}];
 state.plots[0]={plant:'apple',growth:2,moisture:0,dryDays:1,soilBlocked:true,pendingBonus:false};state.plots[1]={plant:'rose',growth:1,moisture:0,dryDays:1,soilBlocked:false,pendingBonus:false};
 const ctx=createDayContext(state);ctx.slot=9;ctx.primary={kind:'rain',startSlot:1,boundary:10,target:'window',stock:'water',resolved:false};
 const offered=legalCandidates(ctx).slice(0,24),records=offered.map(({action,target,variant})=>({action,target,variant,success:true}));
 const context:ChoiceContext={state:ctx.state,day:3,slot:9,phase:'Dawn',candidates:offered.map(c=>({...c,urgent:true,dueDay:3,dueSlot:10})),recent:records.slice(0,6),situation:{episodes:[ctx.primary],restUses:0,leisureUses:0,lastRest:-100,lastLeisure:-100,chairMoved:false,minorUsed:false},earlierToday:records.slice(12,20),previousDays:[{day:1,actions:records.slice(0,6)},{day:2,actions:records.slice(6,12)}],mode:'routine'};
 const bytes=Buffer.byteLength(JSON.stringify(buildDecision(context)));assert.ok(bytes<=14000,`Actual bounded input is ${bytes} bytes`);
});
