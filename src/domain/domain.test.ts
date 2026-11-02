import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTION_IDS, ITEM_IDS, OUTCOME, VARIANT_IDS, applyAction, bedtime, condition, createDayContext, createInitialState, decodeHistory, fireResponseBoundary, focusOptions, initialPackedState, introduceEpisode, isActive, isDeliveryCollection, legalCandidates, packState, phaseBoundary, prepareDay, randomAt, rescueFeasible, seedHex, shortlistCandidates, starterGifts, unpackState, type ChoiceProvider, type DayCheckpoint } from './index';

const idle:ChoiceProvider=async c=>(c.candidates.find(x=>x.action==='T01')||c.candidates[0]!).key;
const care:ChoiceProvider=async c=>(c.candidates.find(x=>x.action==='H02')||c.candidates.find(x=>x.urgent)||c.candidates.find(x=>x.action==='H01')||c.candidates[0]!).key;
function bare(){const s=createInitialState('0x1234',{body:0,wits:0,spirit:5});for(const id of ITEM_IDS)s.inventory[id]=0;s.needs={health:10000,nutrition:10000,hydration:10000,energy:10000,morale:10000};return s;}
test('birth pack, distinct gifts and192-byte cold restoration agree',()=>{
  const s=createInitialState('0x030201',{body:2,wits:2,spirit:1},' bok ');assert.equal(s.name,'BOK');assert.equal(s.inventory.water,3);assert.equal(s.inventory.bread,3);assert.equal(new Set(starterGifts(s.seed)).size,3);
  const p=packState(s);assert.equal((p.length-2)/2,192);assert.equal(initialPackedState(s.seed,s.stats,s.name),p);const restored=unpackState(p,{seed:s.seed,stats:s.stats,name:s.name});assert.deepEqual(restored.needs,s.needs);assert.deepEqual(restored.inventory,s.inventory);assert.equal(packState(restored),p);
});
test('a provider failure cannot credit a delivery or change the canonical base',async()=>{
  const s=createInitialState(8);s.day=1;s.level=1;const before=JSON.stringify(s);await assert.rejects(prepareDay(s,['medicine'],async()=>{throw Error('provider down');}));assert.equal(JSON.stringify(s),before);
});
test('quiet sixty-slot days retain boundaries while uneventful time stays local',async()=>{
  const s=bare();const r=await prepareDay(s,[],idle,{incidentRate:0,blackSwanRate:0});assert.equal(r.receipts.length,60);assert.equal(r.finalState.day,1);assert.equal(r.finalState.level,1);assert.equal(r.finalState.needs.nutrition,7000);assert.equal(r.finalState.needs.hydration,6000);assert.equal(r.finalState.needs.morale,8380);assert.equal((r.history.length-2)/2,240);assert.equal(decodeHistory(r.history).length,60);assert.deepEqual(r.finalState.inventory,s.inventory);assert.ok(r.decisions<=8);assert.ok(r.receipts.some((x,i)=>i>0&&x.target===r.receipts[i-1]!.target));assert.ok(r.receipts.filter(x=>x.role==='interlude').every(x=>!x.choice));assert.ok(r.receipts.some(x=>x.action==='T01'&&x.choice),'Jev still chooses mundane moments');
});
test('current-day milk rescue is protected from outage stock loss and does not need >30 at final bedtime',()=>{
  const s=bare();s.day=1;s.level=1;s.needs.nutrition=2000;s.inventory.milk=1;s.conditions=[{kind:'foodDeficit',severity:1,onsetDay:1,dueDay:2}];const ctx=createDayContext(s);ctx.slot=1;ctx.primarySlot=1;
  for(let i=1;i<10000;i++){const seed=seedHex(i);if(Math.floor(randomAt(seed,2,1,'primary-family')*10)===2){ctx.seed=seed;break;}}
  assert.ok(rescueFeasible(ctx.state,2,1,2));introduceEpisode(ctx,1);assert.equal(ctx.state.house.powerOut,true);assert.equal(ctx.state.inventory.milk,1);
  const milk=legalCandidates(ctx).find(c=>c.action==='H01'&&c.variant==='milk')!;applyAction(ctx,milk);assert.equal(ctx.state.needs.nutrition,4500);assert.equal(isActive(ctx.state,'foodDeficit'),false);
  for(let i=10;i<=60;i+=10){ctx.slot=i;phaseBoundary(ctx);}assert.equal(ctx.state.needs.nutrition,1500);bedtime(ctx);assert.equal(ctx.state.alive,true);
});
test('medicine and bandage have separate targets and atomic canonical costs',()=>{
  const s=createInitialState(9);const ctx=createDayContext(s);ctx.slot=1;ctx.state.inventory.medicine=1;ctx.state.inventory.bandage=1;ctx.state.conditions=[{kind:'wound',severity:2,onsetDay:1,dueDay:2},{kind:'infection',severity:1,onsetDay:1,dueDay:2}];
  const c=legalCandidates(ctx).find(x=>x.action==='H02'&&x.variant==='infection')!;applyAction(ctx,{...c,inputs:{}});assert.equal(ctx.state.inventory.medicine,0);assert.equal(isActive(ctx.state,'infection'),false);assert.equal(isActive(ctx.state,'wound'),true);
  ctx.slot=2;applyAction(ctx,legalCandidates(ctx).find(x=>x.action==='H02'&&x.variant==='wound')!);assert.equal(ctx.state.inventory.bandage,0);assert.equal(isActive(ctx.state,'wound'),false);
});
test('garden growth/moisture and output age advance only at living bedtime',()=>{
  const s=bare();let ctx=createDayContext(s);ctx.slot=60;ctx.state.plots[0]={plant:'rose',growth:0,moisture:2,dryDays:0,soilBlocked:false,pendingBonus:false};ctx.state.house.chairLife=5;bedtime(ctx);assert.equal(ctx.state.plots[0].growth,1);assert.equal(ctx.state.plots[0].moisture,1);assert.equal(ctx.state.house.chairLife,4);
  ctx=createDayContext(ctx.state);ctx.slot=60;bedtime(ctx);assert.equal(ctx.state.plots[0].growth,2);assert.equal(ctx.state.plots[0].moisture,0);assert.equal(ctx.state.house.chairLife,3);
  ctx=createDayContext(ctx.state);ctx.slot=1;ctx.state.needs.morale=8000;assert.ok(legalCandidates(ctx).some(c=>c.action==='G05'&&c.target==='plot1'));
  ctx.state.plots[0]={plant:'apple',growth:1,moisture:0,dryDays:1,soilBlocked:true,pendingBonus:true};ctx.state.plots[1]={plant:'apple',growth:3,moisture:0,dryDays:0,soilBlocked:false,pendingBonus:false};ctx.slot=60;bedtime(ctx);assert.equal(ctx.state.plots[0].plant,null);assert.equal(ctx.state.plots[0].soilBlocked,true);assert.equal(ctx.state.plots[1].plant,'apple');
});
test('late ignition cannot invent a fire with no response window',()=>{
  const s=createInitialState(20);const ctx=createDayContext(s);ctx.slot=59;ctx.state.house.powerOut=true;ctx.state.inventory.wood=1;ctx.state.inventory.matches=1;const c=legalCandidates(ctx).find(x=>x.action==='H15')!;
  for(let i=1;i<10000;i++){const seed=seedHex(i);if(randomAt(seed,1,59,'competence:'+c.key)>=c.successChance){ctx.seed=seed;break;}}
  assert.equal(fireResponseBoundary(59),undefined);assert.ok(!c.possibleFailures.some(x=>x.includes('flare')));const r=applyAction(ctx,c);assert.equal(r.success,false);assert.equal(ctx.state.house.fire,'none');assert.equal(ctx.state.inventory.wood,0);assert.equal(ctx.state.inventory.matches,0);assert.equal(ctx.state.house.mess,1);
});
test('terminal deadline prevents later sleep/growth/output aging/level gain',async()=>{
  const s=bare();s.day=1;s.level=1;s.needs.health=9000;s.conditions=[{kind:'infection',severity:1,onsetDay:1,dueDay:2}];s.house.chairLife=3;s.plots[0]={plant:'rose',growth:0,moisture:2,dryDays:0,soilBlocked:false,pendingBonus:false};const r=await prepareDay(s,[],idle,{incidentRate:0,blackSwanRate:0});
  assert.equal(r.finalState.alive,false);assert.equal(r.finalState.deathCause,'infection');assert.equal(r.finalState.level,1);assert.equal(r.finalState.day,2);assert.ok(r.finalState.needs.health>0);assert.equal(r.finalState.house.chairLife,3);assert.equal(r.finalState.plots[0].growth,0);assert.ok(r.receipts.at(-1)!.outcome&OUTCOME.terminal);
});
test('a durable checkpoint resumes the identical ordered result',async()=>{
  const s=createInitialState('0x333');const full=await prepareDay(s,[],care,{incidentRate:0,blackSwanRate:0});let checkpoint:DayCheckpoint|undefined;
  await assert.rejects(prepareDay(s,[],care,{incidentRate:0,blackSwanRate:0,onCheckpoint:c=>{if(c.context.slot===17){checkpoint=c;throw Error('handoff');}}}));assert.ok(checkpoint);
  const resumed=await prepareDay(s,[],care,{resume:checkpoint,incidentRate:0,blackSwanRate:0});assert.equal(resumed.history,full.history);assert.equal(packState(resumed.finalState),packState(full.finalState));assert.equal(resumed.decisions,full.decisions);
});
test('all offered variants fit the stable history vocabulary; all35families have finite definitions',()=>{
  const s=createInitialState(42);const ctx=createDayContext(s);ctx.slot=15;for(const id of ITEM_IDS)ctx.state.inventory[id]=5;ctx.state.needs={health:5000,nutrition:1000,hydration:1000,energy:5000,morale:1000};ctx.state.house.damage={stove:true,window:true,chair:true};ctx.state.house.chairLife=4;ctx.state.house.mess=2;ctx.state.conditions=[{kind:'wound',severity:2,onsetDay:1,dueDay:2},{kind:'illness',severity:1,onsetDay:1,dueDay:3},{kind:'infection',severity:1,onsetDay:1,dueDay:2},{kind:'contaminatedBody',severity:1,onsetDay:1,dueDay:0},{kind:'contaminatedSurface',severity:1,onsetDay:1,dueDay:0}];ctx.primary={kind:'visitor',startSlot:11,boundary:20,target:'store',stock:'bread',resolved:false};
  const cs=legalCandidates(ctx);assert.equal(new Set(cs.map(c=>c.key)).size,cs.length);for(const c of cs)assert.ok((VARIANT_IDS as readonly string[]).includes(c.variant),c.key);assert.equal(ACTION_IDS.length,35);assert.ok(cs.some(c=>c.action==='H18'&&c.variant==='steak'));
});
test('an admitted and immediately doused fire retains the actual decision state',async()=>{
  const s=bare();s.day=1;s.level=1;s.inventory.water=1;s.recent=[{action:'K01',target:'stove',variant:'toast',success:true}];let seed='';
  for(let i=5;i<5000;i+=5){const candidate=seedHex(i);if(Math.floor(randomAt(candidate,2,1,'primary-family')*10)===1){seed=candidate;break;}}assert.ok(seed);
  let observedFire='';const result=await prepareDay(s,[],async c=>{const response=c.candidates.find(a=>a.action==='H16');if(response){observedFire=c.state.house.fire;assert.equal(c.situation.episodes[0]?.boundary,10);}return(response||c.candidates.find(a=>a.action==='T01')||c.candidates[0]!).key;},{incidentRate:1,blackSwanRate:0,daySeed:seed});
  const receipt=result.receipts[0]!;assert.equal(observedFire,'flame');assert.equal(receipt.action,'H16');assert.equal(receipt.before.house.fire,'none');assert.equal(receipt.decisionSnapshot?.house.fire,'flame');assert.equal(receipt.snapshot.house.fire,'none');assert.equal(receipt.decisionSnapshot?.inventory.water,1);assert.equal(receipt.snapshot.inventory.water,0);
  const low=createDayContext({...s,needs:{...s.needs,health:100},inventory:{...s.inventory,water:0}});low.slot=1;low.primarySlot=1;low.seed=seed;introduceEpisode(low,1);assert.equal(low.state.house.fire,'none');assert.equal(low.primary?.kind,'quiet');
});
test('active storm responses survive shortlist alongside treatment and fixed model bounds',()=>{
  const s=bare();s.day=1;s.level=1;s.needs={health:100,nutrition:1000,hydration:1000,energy:5000,morale:1000};for(const id of ITEM_IDS)s.inventory[id]=1;s.house.damage.window=true;s.house.mess=2;
  s.conditions=[{kind:'wound',severity:2,onsetDay:1,dueDay:2},{kind:'illness',severity:1,onsetDay:1,dueDay:3},{kind:'infection',severity:1,onsetDay:1,dueDay:2},{kind:'contaminatedBody',severity:1,onsetDay:1,dueDay:0},{kind:'contaminatedSurface',severity:1,onsetDay:1,dueDay:0}];
  const ctx=createDayContext(s);ctx.slot=9;ctx.seed=seedHex(1);ctx.primary={kind:'rain',startSlot:1,boundary:10,target:'window',stock:'water',resolved:false};const offered=shortlistCandidates(ctx);assert.ok(offered.length<=24);for(const action of ['H08','H10','H12','H13','H14'])assert.ok(offered.some(c=>c.action===action&&(action==='H14'||c.target==='window')),action);assert.ok(offered.find(c=>c.action==='H14')?.dueSlot===10);for(const variant of ['wound','illness','infection'])assert.ok(offered.some(c=>c.action==='H02'&&c.variant===variant));
});

test('one planned undertaking follows a chosen existing-stock coffee and physical pickup',async()=>{
  const s=bare();s.day=1;s.level=1;s.needs={health:10000,nutrition:7500,hydration:6700,energy:8500,morale:8000};s.inventory.coffee=1;s.inventory.bread=2;s.inventory.water=1;const original=JSON.stringify(s),calls:number[]=[];
  const result=await prepareDay(s,['wood','toolkit','apple_seeds'],async context=>{
    calls.push(context.slot);
    if(context.mode==='day-plan'){
      assert.equal(context.state.inventory.wood,0);assert.equal(context.state.inventory.toolkit,0);assert.deepEqual(context.pendingDelivery,['wood','toolkit','apple_seeds']);
      assert.ok(context.morningOptions?.some(option=>option.key==='coffee-first'));
      return{key:context.candidates.find(c=>c.action==='H09'&&c.target==='chairA')!.key,morningKey:'coffee-first',provider:'fixture'};
    }
    return{key:(context.candidates.find(c=>c.urgent)||context.candidates.find(c=>c.action==='T01')||context.candidates[0]!).key,provider:'fixture'};
  },{incidentRate:0,blackSwanRate:0});
  assert.equal(result.receipts[0]!.action,'K05');assert.equal(result.receipts[0]!.before.inventory.coffee,1);assert.equal(result.receipts[0]!.snapshot.inventory.wood,0);
  const pickup=result.receipts.filter(isDeliveryCollection);assert.equal(pickup.length,1);assert.equal(pickup[0]!.slot,2);assert.equal(pickup[0]!.before.inventory.wood,0);assert.equal(pickup[0]!.snapshot.inventory.wood,1);assert.equal(result.deliveryCollectedSlot,2);assert.equal(result.deliverySettled,'collected');
  assert.equal(result.receipts[2]!.target,'store');assert.equal(result.receipts[2]!.role,'interlude');assert.equal(result.receipts[2]!.choice,undefined);
  const focus=result.receipts.filter(receipt=>receipt.role==='focus');assert.equal(focus.length,1);assert.equal(focus[0]!.action,'H09');assert.equal(focus[0]!.target,'chairA');assert.equal(result.dailyFocus?.attemptedSlot,focus[0]!.slot);assert.equal(result.dailyFocus?.status,focus[0]!.success?'completed':'failed');
  assert.equal(result.finalState.inventory.wood,0);assert.equal(result.finalState.inventory.toolkit,0);assert.equal(result.finalState.inventory.apple_seeds,1);assert.equal(result.startTarget,'bed');assert.equal(calls.length,result.decisions);assert.ok(calls.length<=8);assert.equal(calls.filter(slot=>slot===0).length,1);assert.equal(JSON.stringify(s),original);
});

test('a slot-zero plan checkpoint resumes without buying or changing that plan',async()=>{
  const s=bare();s.day=1;s.level=1;s.needs.morale=7500;s.inventory.coffee=1;
  const provider:ChoiceProvider=async context=>({key:context.candidates[0]!.key,...(context.mode==='day-plan'?{morningKey:'look-first'}:{})});
  const full=await prepareDay(s,['wood','toolkit'],provider,{incidentRate:0,blackSwanRate:0});let checkpoint:DayCheckpoint|undefined,plans=0;
  await assert.rejects(prepareDay(s,['wood','toolkit'],async context=>{if(context.mode==='day-plan')plans++;return provider(context);},{incidentRate:0,blackSwanRate:0,onCheckpoint:value=>{if(value.context.slot===0){checkpoint=value;throw Error('stop after durable plan');}}}));
  assert.ok(checkpoint);assert.equal(plans,1);assert.equal(checkpoint.receipts.length,0);assert.equal(checkpoint.context.state.inventory.wood,0);
  const resumed=await prepareDay(s,['wood','toolkit'],async context=>{assert.notEqual(context.mode,'day-plan');return provider(context);},{incidentRate:0,blackSwanRate:0,resume:checkpoint});
  assert.equal(resumed.history,full.history);assert.equal(packState(resumed.finalState),packState(full.finalState));assert.deepEqual(resumed.dailyFocus,full.dailyFocus);assert.equal(resumed.decisions,full.decisions);
});

test('unopened accepted supplies remain with a terminal estate without a collection claim',async()=>{
  const s=bare();s.day=1;s.level=1;s.needs.health=0;
  const result=await prepareDay(s,['medicine','wood'],async context=>({key:context.candidates[0]!.key,morningKey:'look-first'}),{incidentRate:0,blackSwanRate:0});
  assert.equal(result.finalState.alive,false);assert.equal(result.finalState.level,1);assert.equal(result.deliverySettled,'estate');assert.equal(result.deliveryCollectedSlot,undefined);assert.equal(result.receipts.filter(isDeliveryCollection).length,0);assert.equal(result.finalState.inventory.medicine,1);assert.equal(result.finalState.inventory.wood,1);assert.ok(result.receipts[0]!.events.some(event=>event.kind==='delivery'&&event.source==='estate'&&event.message.includes('unopened')));
});

test('main undertakings use real ripe plants and do not shelter an empty garden',()=>{
  const s=bare();s.inventory.wood=1;s.inventory.toolkit=1;s.inventory.umbrella=1;s.inventory.apple_seeds=1;s.needs.nutrition=5000;
  let ctx=createDayContext(s),options=focusOptions(ctx);assert.ok(options.some(c=>c.action==='H09'&&c.target==='chairA'));assert.ok(!options.some(c=>c.action==='H09'&&c.target==='gardenShelter'));assert.ok(!options.some(c=>c.action==='G06'));assert.ok(!options.some(c=>c.action==='G05'));
  ctx.state.plots[0]={plant:'apple',growth:3,moisture:0,dryDays:0,soilBlocked:false,pendingBonus:false};options=focusOptions(ctx);assert.ok(options.some(c=>c.action==='G05'&&c.variant==='apple'));
  ctx.state.plots[0].growth=2;assert.ok(!focusOptions(ctx).some(c=>c.action==='G05'&&c.target==='plot1'));
});

test('an unexpected urgent fire can interrupt the morning pickup plan',async()=>{
  const s=bare();s.day=1;s.level=1;s.inventory.water=1;s.recent=[{action:'K01',target:'stove',variant:'toast',success:true}];let seed='';
  for(let value=5;value<5000;value+=5){const candidate=seedHex(value);if(Math.floor(randomAt(candidate,2,1,'primary-family')*10)===1){seed=candidate;break;}}assert.ok(seed);
  const result=await prepareDay(s,['wood','toolkit'],async context=>({key:(context.mode==='day-plan'?context.candidates[0]:context.candidates.find(c=>c.action==='H16')||context.candidates.find(c=>c.urgent)||context.candidates.find(c=>c.action==='T01')||context.candidates[0])!.key,morningKey:'collect-first'}),{incidentRate:1,blackSwanRate:0,daySeed:seed});
  assert.equal(result.receipts[0]!.action,'H16');assert.equal(result.receipts[0]!.decisionSnapshot?.house.fire,'flame');assert.equal(result.receipts[0]!.snapshot.house.fire,'none');assert.equal(result.deliveryCollectedSlot,2);assert.equal(result.receipts[1]!.role,'delivery');
});
