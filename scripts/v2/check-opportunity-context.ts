import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {keccak256,toHex} from 'viem';
import {createState,openDay,beginSlot,endSlot,Op,step,kitMask,encodeState,seedHex,legalActions} from '../../src/v2';
import {v2NominalCareForecast,v2OpportunityBudget,v2PlanChoices,buildV2PlanRequest,buildV2Request,normalizeV2Memory} from '../../server/v2/choices';
import {prepareV2,v2DecisionConfig} from '../../server/v2/preparation';
import {freezeV2Input,type V2RuntimeIdentity} from '../../server/v2/context';
const hash=(s:string)=>keccak256(toHex(s)),address=`0x${'12'.repeat(20)}` as const,checks:string[]=[];
for(const slot of [1,11,21,36,51]){
 const base=createState({seed:42,stats:[1,3,1]});base.needs=[10000,9000,8000,6200,1888];
 const forecast=v2NominalCareForecast(base,slot),c=openDay(base,0n,seedHex(42),false);c.witness=true;c.primaryIntroduced=true;c.slot=slot-1;let beforeBedtimeEnergy=-1;
 for(let at=slot;at<=60;at++){beginSlot(c,at);endSlot(c);if(at===59)beforeBedtimeEnergy=c.state.needs[3]!;}
 assert.equal(forecast.food_after_remaining_phase_losses,c.state.needs[1]!/100);assert.equal(forecast.water_after_remaining_phase_losses,c.state.needs[2]!/100);assert.equal(forecast.morale_after_remaining_phase_losses,c.state.needs[4]!/100);assert.equal(forecast.energy_after_remaining_phase_losses,beforeBedtimeEnergy/100);assert.equal(c.state.needs[3],9700);
 checks.push(`slot${slot} nominal food/water/morale exactly matches no-action kernel boundaries; energy remains62 until separate bedtime gain`);
}
assert.deepEqual(v2OpportunityBudget({slot:31,ordinaryUses:2,ordinaryMask:(1<<1)|(1<<2),mainUsed:false,acuteUses:1}),{ordinary_uses_left:3,ordinary_opportunities_left:3,routine_phases_left:[3,4,5],main_uses_left:1,acute_response_uses_left:1});
assert.equal(v2OpportunityBudget({slot:41,ordinaryUses:3,ordinaryMask:14,mainUsed:false,acuteUses:2}).main_uses_left,0);checks.push('real masks/counters and elapsed main window bound the remaining opportunities');
const memory=normalizeV2Memory({previousDays:[1,2,3].map(day=>({day,actions:[step(1,Op.Quiet),step(2,Op.Pickup),step(36,Op.Plant,0,1)]}))},4);assert.deepEqual(memory.previousDays!.map(d=>d.day),[2,3]);assert(memory.previousDays!.every(d=>d.actions.length===2&&d.actions[0]!.op===Op.Quiet&&!Object.hasOwn(d.actions[0]!,'success')));checks.push('two-day canonical memory retains explicit spent Quiet without inventing success');
const base=createState({seed:42}),choices=v2PlanChoices({requestId:hash('plan'),base,kit:kitMask(['water','bread','daisy_seed']),seed:seedHex(42),shipping:false,memory});
const plan=buildV2PlanRequest(choices),criteria=(plan.input.questions.morning_order as any).criteria;
assert.equal(criteria['look-first'].ordinary_opportunity_cost,1);assert.equal(criteria['look-first'].ordinary_opportunities_left_after_this_morning,4);assert.equal(criteria['collect-first'].ordinary_opportunity_cost,0);assert.equal(criteria['collect-first'].ordinary_opportunities_left_after_this_morning,5);checks.push('Dawn declares quiet cost1/Morning phase sharing and collect-first cost0 without extra turns');
const runtime:V2RuntimeIdentity={chainId:31337,collection:address,verifier:address,actionModule:address,controllerCodeHash:hash('c'),verifierCodeHash:hash('v'),actionModuleCodeHash:hash('a'),rulesHash:hash('rules'),decisionConfig:hash('temp'),relayer:address,quoteSigner:address};runtime.decisionConfig=v2DecisionConfig(runtime.rulesHash);
const raw=encodeState(base),now=BigInt(Math.floor(Date.now()/1000)),input=freezeV2Input(runtime,{requestId:hash('accepted'),tokenId:1n,player:address,baseRevision:0,day:1,kitMask:kitMask(['water','bread','daisy_seed']),shipping:false,acceptedAt:now,deadline:now+900n,daySeed:seedHex(42),decisionConfig:runtime.decisionConfig,baseHash:keccak256(raw),pressure:0n,reservedReward:0n,status:1},raw,1n,hash('block'),true);
const offered:any[]=[];
const prepared=await prepareV2(input,async d=>{offered.push(structuredClone(d));return{key:(d.candidates.find(a=>a.op===Op.Quiet)||d.candidates[0]!).key};},{allowLocal:true,plan:async c=>({goal:0,mainKey:c.main.find(a=>a.op===Op.QuietMain)!.key,morningKey:'look-first',goalKey:'0',focus:step(36,Op.QuietMain)})});
const first=offered.find(d=>d.slot===21)!;assert(first);assert.equal(first.opportunities.ordinary_opportunities_left,4);assert.equal(first.opportunities.ordinary_uses_left,4);assert(first.earlierToday.some((a:any)=>a.slot===1&&a.op===Op.Quiet));
const req=buildV2Request(first,memory);assert.equal((req.input.state.opportunities as any).ordinary_opportunities_left,4);assert((req.input.state.earlier_today as any[]).some(a=>a.op===Op.Quiet));assert(prepared.packet.result.receipts.filter(r=>r.role==='routine').length<=5);checks.push('actual preparation/provider path reports four uses after a Dawn quiet; all original five-routine limits remain');
assert(Buffer.byteLength(JSON.stringify(plan.input))<14000);assert(Buffer.byteLength(JSON.stringify(req.input))<14000);checks.push('new truthful facts remain within existing14000-byte provider envelope');
mkdirSync(new URL('../../TEMP/v2-checks/',import.meta.url),{recursive:true});const result={scope:'Pure canonical context/phase/forecast experiments; explicit states and scripted provider, zero inference/chain/ledger changes.',passed:checks.length,checks,decisionConfig:runtime.decisionConfig};writeFileSync(new URL('../../TEMP/v2-checks/opportunity-context.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
