import test from 'node:test';
import assert from 'node:assert/strict';
import { createDayContext } from './prepare';
import { createInitialState } from './state';
import { legalCandidates } from './actions';
import { candidateActivityFamily, candidateInterest, focusOptions, morningOptions, routineCandidates } from './day-plan';
import { ITEM_IDS, type Candidate, type DailyFocus, type DayContext } from './types';

const seed='0x77ae7453b80f6f6f0b2bed65a6bc351f7ee274bdfd3c32b84255eba45ab68157';
function context():DayContext {
 const state=createInitialState(seed,{body:2,wits:2,spirit:1},'POLICY');
 for(const id of ITEM_IDS)state.inventory[id]=0;
 return createDayContext(state,[]);
}
function chairFocus(status:DailyFocus['status']='completed'):DailyFocus {
 return {version:1,kind:'project',goal:{key:'H09_chairA_chair',action:'H09',target:'chairA',variant:'chair',label:'Build a chair',inputs:{wood:1,toolkit:1}},scheduledSlot:36,status,morning:{key:'pantry',label:'Begin at home'}};
}

test('a completed chair remains an offered usable affordance amid food variants',()=>{
 const ctx=context();ctx.slot=41;ctx.routineAnchor='chairA';ctx.dailyFocus=chairFocus();ctx.state.house.chairLife=5;
 ctx.state.needs={health:10000,nutrition:9500,hydration:9300,energy:9400,morale:9412};ctx.state.inventory.bread=2;ctx.state.inventory.water=2;
 const original=structuredClone(ctx),all=legalCandidates(ctx),menu=routineCandidates(ctx,all);
 assert(all.some(c=>c.key==='H04_chair_chair'));assert(menu.some(c=>c.key==='H04_chair_chair'));
 assert(menu.some(c=>candidateActivityFamily(c)==='food'));assert(menu.some(c=>candidateActivityFamily(c)==='drink'));
 assert(menu.length<=6);assert.deepEqual(ctx,original);
});

test('feasible cooking variants do not hide garden and building projects',()=>{
 const ctx=context();Object.assign(ctx.state.inventory,{bread:2,milk:1,steak:1,rose_seeds:1,wood:1,toolkit:1});
 ctx.state.needs.nutrition=6000;ctx.state.needs.morale=6000;
 const options=focusOptions(ctx);
 assert(options.length<=4);assert(options.some(c=>c.action.startsWith('K')));
 assert(options.some(c=>c.action==='G01'));assert(options.some(c=>c.action==='H09'&&c.variant==='chair'));
 assert(options.every(c=>c.plan?.kind==='project'));
});

test('morning offers feasible coffee styles and breakfast while preserving project stock',()=>{
 const ctx=context();ctx.pendingDelivery=['water'];Object.assign(ctx.state.inventory,{coffee:1,bread:2});ctx.state.needs.energy=6000;ctx.state.needs.morale=7000;
 const project:Candidate={key:'K01_stove_toast',action:'K01',target:'stove',variant:'toast',label:'Toast',description:'',inputs:{bread:1},energy:100,successChance:1,possibleFailures:[]};
 const offered=morningOptions(ctx,[project]);
 assert.deepEqual(offered.map(c=>c.key),['collect-first','coffee-first','quick-coffee-first','breakfast-first','look-first']);
 for(const option of offered.filter(c=>c.beforeAction)){
  const actual=legalCandidates(ctx).find(c=>c.key===option.beforeActionKey)!;
  const {action,target,variant,inputs,energy,successChance,description}=actual;
  assert.deepEqual(option.beforeAction,{action,target,variant,inputs,energy,successChance,description});
 }
 assert(offered.some(c=>c.key==='look-first'));
 ctx.state.inventory.bread=1;assert(!morningOptions(ctx,[project]).some(c=>c.key==='breakfast-first'));
 ctx.state.inventory.coffee=0;ctx.state.inventory.bread=0;ctx.pendingDelivery=['coffee','bread','water'];
 const pendingOnly=morningOptions(ctx,[project]);assert(pendingOnly.every(c=>!c.beforeActionKey||c.beforeActionKey==='T01_window_idle'));
});

test('urgent care survives coverage, while nonurgent care preserves planned inputs',()=>{
 const ctx=context();ctx.slot=21;ctx.state.inventory.bread=1;ctx.state.inventory.water=1;ctx.state.needs.nutrition=7000;
 ctx.dailyFocus={...chairFocus('planned'),goal:{key:'K01_stove_toast',action:'K01',target:'stove',variant:'toast',label:'Make toast',inputs:{bread:1}}};
 assert(!routineCandidates(ctx).some(c=>c.inputs.bread));
 ctx.state.needs.nutrition=2000;ctx.state.needs.hydration=2000;ctx.state.needs.energy=1500;
 const all=legalCandidates(ctx),menu=routineCandidates(ctx,all);
 for(const key of['H01_store_water','H03_bed_bed'])assert(menu.some(c=>c.key===key&&c.urgent));
 assert(menu.some(c=>c.urgent&&(c.inputs.bread||0)>0));
});

test('history changes soft ranking without banning valid repeated care or altering recent action truth',()=>{
 const ctx=context();ctx.slot=31;ctx.state.needs.morale=8000;ctx.state.needs.energy=9000;ctx.leisureUses=1;ctx.lastLeisure=21;ctx.routineAnchor='baseSeat';
 ctx.meaningfulToday=[{action:'H04',target:'baseSeat',variant:'base',success:true}];ctx.state.recent=[{action:'K01',target:'stove',variant:'toast',success:true}];
 const recent=structuredClone(ctx.state.recent),menu=routineCandidates(ctx);
 assert(menu.some(c=>c.key==='H04_baseSeat_base'));assert.deepEqual(ctx.state.recent,recent);
 assert.equal(candidateActivityFamily({action:'T01',target:'window',variant:'idle'}),'mundane');
 assert.equal(candidateInterest({action:'T01',target:'window',variant:'idle'}),'exploring');
});

test('a planted project offers its genuine watering follow-up without spending the model choice',()=>{
 const ctx=context();ctx.slot=41;ctx.dailyFocus={...chairFocus(),goal:{key:'G01_plot1_rose',action:'G01',target:'plot1',variant:'rose',label:'Plant roses',inputs:{rose_seeds:1}}};
 ctx.state.plots[0].plant='rose';ctx.state.inventory.water=1;ctx.state.inventory.bread=2;ctx.state.inventory.coffee=1;ctx.state.needs.morale=8000;ctx.state.needs.energy=8000;
 assert(routineCandidates(ctx).some(c=>c.key==='G02_plot1_water'));
 assert.equal(ctx.modelChoices,0);assert.equal(ctx.state.inventory.water,1);
});

test('a failed previous project does not change the next feasible focus menu',()=>{
 for(let value=1;value<=16;value++){
  const state=createInitialState('0x'+value.toString(16),{body:2,wits:2,spirit:1},'RETRY');state.day=1;state.level=1;
  for(const id of ITEM_IDS)state.inventory[id]=0;
  Object.assign(state.inventory,{bread:2,milk:1,steak:1,rose_seeds:1,apple_seeds:1,wood:1,toolkit:1});state.needs.nutrition=6000;state.needs.morale=6000;
  const ctx=createDayContext(state,[]),withoutMemory=focusOptions(ctx),attempt=withoutMemory[0]!;
  ctx.previousDays=[{day:1,actions:[{action:attempt.action,target:attempt.target,variant:attempt.variant,success:false}]}];
  assert.deepEqual(focusOptions(ctx),withoutMemory);
  assert.equal(ctx.previousDays[0]!.actions[0]!.success,false);
 }
});
