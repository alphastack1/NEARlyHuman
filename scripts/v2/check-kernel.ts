import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createState,clone,seedHex,draw,chance,kitMask,assertState} from '../../src/v2/state.ts';
import {replayDay,openDay,beginSlot,endSlot,previewPrimary} from '../../src/v2/kernel.ts';
import {buildCareCertificate} from '../../src/v2/rescue.ts';
import {Op,step,ITEMS,CONDITIONS,type State,type Step,type Certificate} from '../../src/v2/types.ts';
mkdirSync(new URL('../../TEMP/v2-checks/',import.meta.url),{recursive:true});
const cases:any[]=[];const report:any[]=[];
function test(name:string,f:()=>void){try{f();report.push({name,result:'pass'});}catch(e){report.push({name,result:'fail',error:String(e)});}}
function quietSeed(day:number){for(let n=1;n<10000;n++){const h=seedHex(n),at=1+(n%5)*10;if(BigInt(draw(h,day,at,'primary-admission'))*10000n>=4500n*4294967296n&&BigInt(draw(h,day,31,'structural-exception'))*4000n>=4294967296n)return h;}throw Error('No quiet fixture seed');}
const blankGoods=()=>[0,0,0,0];
function healthySteps(s:State,kit:bigint,main?:Step,shipment?:number[]):Step[]{
 const a:Step[]=[];if(kit)a.push(step(1,Op.Pickup));a.push(step(11,Op.Breakfast,2,0));if(s.plots.some(p=>p.kind&&p.moisture<2))a.push(step(21,Op.Well));a.push(step(31,Op.Leisure));if(main)a.push(main);a.push(step(41,Op.Leisure));if(shipment?.length)a.push(step(51,Op.Ship,0,0,shipment));return a;
}
function run(s:State,kit:bigint,actions:Step[],name:string,seed=quietSeed(s.day+1),certificate?:Certificate){const before=clone(s),trace={goal:255,steps:actions};const result=replayDay(s,kit,trace,seed,true,certificate);assert.deepEqual(s,before);assertState(result.state);cases.push({name,base:s,kit:kit.toString(),trace,seed,certificate,expected:result.state,points:result.points});return result;}

test('first quick crop is collectable onDay4, neverDay3',()=>{
 let s=createState({seed:42});
 for(let d=1;d<=3;d++){const kit=kitMask(['bread','water',...(d===1?['strawberry_seed']:[])]);const main=d===1?step(36,Op.Plant,0,5):step(36,Op.QuietMain);if(d===3)assert.throws(()=>replayDay(s,kit,{goal:255,steps:healthySteps(s,kit,step(36,Op.Harvest))},quietSeed(d)));s=run(s,kit,healthySteps(s,kit,main),'quick-day'+d).state;}
 const kit=kitMask(['bread','water']);const r=run(s,kit,healthySteps(s,kit,step(36,Op.Harvest),[27]),'quick-day4');assert.equal(r.points,65);assert.equal(r.state.plots[0].kind,0);
});
test('tree yields exactly10wood then clears and cannot harvest11th',()=>{
 let s=createState({seed:43});let picks=0;
 for(let d=1;d<=25;d++){const kit=kitMask(['bread','water',...(d===1?['sapling']:[])]);const ready=s.plots.some(p=>p.kind&&p.ticks===0);const main=d===1?step(36,Op.Plant,0,9):ready?step(36,Op.Harvest):step(36,Op.QuietMain);if(ready)picks++;s=run(s,kit,healthySteps(s,kit,main),'tree-day'+d).state;}
 assert.equal(picks,10);assert.equal(s.inventory[6],10);assert.equal(s.plots[0].kind,0);
 assert.throws(()=>replayDay(s,0n,{goal:255,steps:[step(36,Op.Harvest)]},quietSeed(26)));
 const kit=kitMask(['bread','water']);const made=run(s,kit,healthySteps(s,kit,step(36,Op.Craft,0),[31]),'earned-spoon');assert.equal(made.state.inventory[6],7);assert.equal(made.points,116);
});
test('apple holds one output and six total pickups including first',()=>{
 let s=createState({seed:44});let picks=0;
 for(let d=1;d<=19;d++){const kit=kitMask(['bread','water',...(d===1?['apple_seed']:[])]);const ready=s.plots.some(p=>p.kind&&p.ticks===0);const main=d===1?step(36,Op.Plant,0,8):ready?step(36,Op.Harvest):step(36,Op.QuietMain);if(ready)picks++;s=run(s,kit,healthySteps(s,kit,main),'apple-day'+d).state;}
 assert.equal(picks,6);assert.equal(s.inventory[29],6);assert.equal(s.plots[0].kind,0);
});
test('delayed ripe fruit never accumulates hidden outputs',()=>{
 let s=createState({seed:45});for(let d=1;d<=15;d++){const kit=kitMask(['bread','water',...(d===1?['grape_seed']:[])]);const m=d===1?step(36,Op.Plant,0,7):d===15?step(36,Op.Harvest):step(36,Op.QuietMain);s=run(s,kit,healthySteps(s,kit,m),'held-grape-day'+d).state;}
 assert.equal(s.inventory[28],1);assert.equal(s.plots[0].left,5);assert.equal(s.plots[0].ticks,1);
});
test('soil damage persists after harvest and blocks replanting',()=>{
 const s=createState({seed:46});s.plots[0]={kind:1,ticks:0,left:1,moisture:0,dry:0,soilBlocked:true};const kit=kitMask(['bread','water']);const r=run(s,kit,healthySteps(s,kit,step(36,Op.Harvest)),'blocked-final-harvest');assert.equal(r.state.plots[0].soilBlocked,true);assert.equal(r.state.plots[0].kind,0);
 assert.throws(()=>replayDay(r.state,kitMask(['daisy_seed']),{goal:255,steps:[step(1,Op.Pickup),step(36,Op.Plant,0,1)]},quietSeed(2)));
 const k=kitMask(['compost']);const repaired=run(r.state,k,[step(1,Op.Pickup),step(36,Op.RestoreSoil,0)],'real-compost-main');assert.equal(repaired.state.plots[0].soilBlocked,false);assert.equal(repaired.state.inventory[12],0);
});
test('exhausted main cannot consume seed or create plant; actualrest enables main',()=>{
 const s=createState({seed:47});s.needs[3]=299;const kit=kitMask(['sapling']);const before=clone(s);assert.throws(()=>replayDay(s,kit,{goal:255,steps:[step(1,Op.Pickup),step(36,Op.Plant,0,9)]},quietSeed(1)));assert.deepEqual(s,before);
 const r=run(s,kit,[step(1,Op.Pickup),step(11,Op.Rest),step(36,Op.Plant,0,9)],'rest-then-main');assert.equal(r.receipts.find(x=>x.slot===36)!.snapshot.needs[3],1199);assert.equal(r.state.inventory[21],0);
});
test('a pre-pickup recovering action shares the morning routine budget',()=>{
 const s=createState({seed:48});assert.throws(()=>replayDay(s,kitMask(['coffee']),{goal:255,steps:[step(1,Op.Eat,2),step(2,Op.Pickup),step(11,Op.Breakfast,2,0)]},quietSeed(1)));
});
test('living day cannot omit pickup and obtain an estate kit',()=>{const s=createState({seed:49});assert.throws(()=>replayDay(s,kitMask(['sapling']),{goal:255,steps:[]},quietSeed(1)));});
test('duplicate shipping beyond ownedstock reverts without mutating input',()=>{const s=createState({seed:50});s.inventory[30]=1;const before=clone(s);assert.throws(()=>replayDay(s,0n,{goal:255,steps:[step(11,Op.Ship,0,0,[31,31])]},quietSeed(1)));assert.deepEqual(s,before);});
test('second main and noncanonical extra arguments are rejected',()=>{const s=createState({seed:51});s.inventory[6]=10;assert.throws(()=>replayDay(s,0n,{goal:255,steps:[step(36,Op.Craft,0),step(37,Op.Craft,0)]},quietSeed(1)));assert.throws(()=>replayDay(s,0n,{goal:255,steps:[step(11,Op.Quiet,1)]},quietSeed(1)));});
test('neglect causes real clinical death and no living growth onterminalday',()=>{let s=createState({seed:52});s.plots[0]={kind:9,ticks:6,left:10,moisture:2,dry:0,soilBlocked:false};for(let d=1;d<=3;d++){const r=run(s,0n,[],'neglect-day'+d);s=r.state;}assert.equal(s.alive,false);assert.equal(s.deathCause,3);assert.equal(s.day,3);assert.equal(s.level,2);assert.equal(s.plots[0].ticks,4);});
test('shipment preceding structural death is retained; actionafterdeath is rejected',()=>{
 const s=createState({seed:53});s.day=1;s.level=1;s.inventory[29]=1;let seed='';for(let n=1;n<100000;n++){const h=seedHex(n);if(BigInt(draw(h,2,31,'structural-exception'))*4000n<4294967296n){seed=h;break;}}assert(seed);
 const r=run(s,0n,[step(11,Op.Ship,0,0,[30])],'ship-before-death',seed);assert.equal(r.state.alive,false);assert.equal(r.state.deathCause,7);assert.equal(r.state.level,1);assert.equal(r.points,40);
 assert.throws(()=>replayDay(s,0n,{goal:255,steps:[step(11,Op.Ship,0,0,[30]),step(36,Op.QuietMain)]},seed));
});
test('reactivated deadline proposal falls back without leaking illness or certificate effects',()=>{
 const f=JSON.parse(readFileSync(new URL('../../experiments/economy-v2/biology/admission-fixture.json',import.meta.url),'utf8'));const b=f.acceptedBaseFixture;const s=createState({seed:b.seed,stats:[b.stats.body,b.stats.wits,b.stats.spirit]});s.day=b.day;s.level=b.level;s.needs=[b.needs.health,b.needs.nutrition,b.needs.hydration,b.needs.energy,b.needs.morale];s.inventory.fill(0);for(const [name,n]of Object.entries(b.inventory)){const id=(ITEMS as readonly string[]).indexOf(name);if(id>=0)s.inventory[id]=Number(n);}for(const c of b.conditions){const id=(CONDITIONS as readonly string[]).indexOf(c.kind);s.conditions[id]={severity:c.severity,onsetDay:c.onsetDay,dueDay:c.dueDay,resolved:!!c.resolved};}
 const trace=[step(11,Op.Treat,3),step(21,Op.Eat,2),step(31,Op.Leisure),step(36,Op.QuietMain),step(41,Op.Drink,0),step(51,Op.Treat,2)];const seed=f.beforeAdmission.seed;const no=run(s,0n,trace,'deadline-softened',seed);assert(no.state.alive);assert.equal(no.proposal?.kind,'sickness');assert.equal(no.proposal?.accepted,false);
 const bad={horizon:0,kits:[],steps:[]} as Certificate;const withBad=run(s,0n,trace,'invalid-certificate-softened',seed,bad);assert.deepEqual(withBad.state,no.state);assert.equal(withBad.points,no.points);
});
test('valid bounded care certificate admits real mood but leaks no hypothetical kits or day',()=>{
 const s=createState({seed:54});let seed='';for(let n=5;n<100000;n+=5){const h=seedHex(n);if(chance(h,1,1,'primary-admission',4500)&&Math.floor(draw(h,1,1,'primary-family')*10/4294967296)===8){seed=h;break;}}assert(seed);
 const cert:Certificate={horizon:2,kits:[kitMask(['water','bread','medicine']),kitMask(['water','bread','medicine'])],steps:[step(11,Op.Breakfast,2,0),step(61,Op.Pickup),step(71,Op.Breakfast,2,0),step(121,Op.Pickup),step(131,Op.Breakfast,2,0)]};
 const actions=healthySteps(s,0n,step(36,Op.QuietMain));const quiet=run(s,0n,actions,'mood-softened-without-cert',seed);const admitted=run(s,0n,actions,'mood-with-valid-care-cert',seed,cert);
 assert.equal(admitted.proposal?.kind,'mood');assert.equal(admitted.proposal?.accepted,true);assert.equal(admitted.state.day,1);assert.equal(admitted.state.level,1);assert.equal(admitted.state.inventory[4],0);assert.deepEqual(admitted.state.inventory,quiet.state.inventory);assert.equal(admitted.state.needs[4],quiet.state.needs[4]-1960);
});
test('earned wood is the same inventory consumed by a real comfort chair',()=>{
 const s=clone(cases.find(c=>c.name==='earned-spoon')!.base) as State;assert.equal(s.inventory[6],10);const day=s.day+1;let seed='';for(let n=1;n<100000;n++){const h=seedHex(n),at=1+(n%5)*10;if(!chance(h,day,at,'primary-admission',4500)&&BigInt(draw(h,day,31,'structural-exception'))*4000n>=4294967296n&&chance(h,day,36,`competence:${Op.BuildChair}:0:0`,9400)){seed=h;break;}}assert(seed);
 const kit=kitMask(['water','bread','toolkit']);const r=run(s,kit,healthySteps(s,kit,step(36,Op.BuildChair)),'earned-wood-comfort-chair',seed);assert.equal(r.state.inventory[6],9);assert.equal(r.state.inventory[7],0);assert.equal(r.state.house.chairLife,4);
});
test('competence is fixed from pre-cost energy at100 and300 thresholds',()=>{
 for(const [op,energy,low,high]of[[Op.Toast,100,9400,9900],[Op.BuildChair,300,8900,9400]] as const){
  const s=createState({seed:56});s.needs[3]=energy;if(op===Op.BuildChair){s.inventory[6]=1;s.inventory[7]=1;}
  let seed='';for(let n=1;n<100000;n++){const h=seedHex(n),at=1+(n%5)*10;const d=BigInt(draw(h,1,36,`competence:${op}:0:0`))*10000n;if(!chance(h,1,at,'primary-admission',4500)&&d>=BigInt(low)*4294967296n&&d<BigInt(high)*4294967296n){seed=h;break;}}assert(seed);
  const r=run(s,0n,[step(36,op)],'pre-cost-energy-'+energy,seed);assert.equal(r.receipts.find(x=>x.slot===36)!.success,true);if(op===Op.BuildChair)assert.equal(r.state.house.chairLife,4);
 }
});
test('derived terminal before pickup retains unopened estate supplies once',()=>{
 const s=createState({seed:57});s.day=1;s.level=1;s.needs[0]=500;s.needs[1]=2000;s.inventory[0]=0;s.inventory[2]=0;s.inventory[3]=1;let seed='';for(let n=1;n<100000;n++){const h=seedHex(n),at=1+(n%5)*10;if(!chance(h,2,at,'primary-admission',4500)&&chance(h,2,1,'raw-exposure',2500)){seed=h;break;}}assert(seed);
 const r=run(s,kitMask(['water']),[step(1,Op.RawSteak)],'terminal-unopened-estate',seed);assert.equal(r.state.alive,false);assert.equal(r.state.deathCause,5);assert.equal(r.state.day,2);assert.equal(r.state.level,1);assert.equal(r.state.inventory[0],1);assert.equal(r.state.inventory[3],0);
});
test('shipment holes and a chair move before any episode are unavailable',()=>{
 const s=createState({seed:58});s.inventory[26]=2;assert.throws(()=>replayDay(s,0n,{goal:255,steps:[step(11,Op.Ship,0,0,[27,0,27])]},quietSeed(1)));
 s.house.chairLife=5;assert.throws(()=>replayDay(s,0n,{goal:255,steps:[step(36,Op.MoveChair)]},seedHex(4)));
});
test('last ordinary backup-heat failure has one separately budgeted real fire response',()=>{
 const s=createState({seed:59});s.day=1;s.level=1;s.inventory[6]=1;s.inventory[9]=1;let seed='';
 for(let n=4;n<500000;n+=5){const h=seedHex(n);if(chance(h,2,41,'primary-admission',4500)&&Math.floor(draw(h,2,41,'primary-family')*10/4294967296)===2&&!chance(h,2,51,`competence:${Op.BackupHeat}:0:0`,9400)&&chance(h,2,51,'task-complication',2500)&&BigInt(draw(h,2,31,'structural-exception'))*4000n>=4294967296n){seed=h;break;}}assert(seed);
 const prefix=[step(11,Op.Breakfast,2,0),step(21,Op.Leisure),step(31,Op.Leisure),step(36,Op.QuietMain)];const ctx=openDay(s,0n,seed);for(let slot=1;slot<=40;slot++){beginSlot(ctx,slot);endSlot(ctx,prefix.find(a=>a.slot===slot));}
 const proposal=previewPrimary(ctx,41);assert.equal(proposal?.kind,'outage');assert(proposal?.harmful);const cert=buildCareCertificate(proposal!.context);assert(cert);
 const actual=[...prefix,step(41,Op.Quiet),step(51,Op.BackupHeat)];const no=run(s,0n,actual,'last-routine-fire-unanswered',seed,cert);const yes=run(s,0n,[...actual,step(52,Op.Douse)],'last-routine-fire-doused',seed,cert);
 assert.equal(no.state.conditions[2].severity,2);assert.equal(yes.state.conditions[2].severity,0);assert.equal(no.state.needs[0],8080);assert.equal(yes.state.needs[0],10000);assert.equal(no.state.inventory[6],0);assert.equal(yes.state.inventory[6],0);assert.equal(yes.state.inventory[0],no.state.inventory[0]-1);assert.equal(yes.receipts.find(x=>x.slot===52)!.role,'acute');
});
test('coffee spends energy before capped recovery, observable on a terminal prefix',()=>{
 const s=createState({seed:60});s.day=1;s.level=1;s.needs[3]=9900;s.inventory[5]=1;let seed='';for(let n=1;n<1000000;n++){const h=seedHex(n),at=1+(n%5)*10;if(!chance(h,2,at,'primary-admission',4500)&&BigInt(draw(h,2,31,'structural-exception'))*4000n<4294967296n){seed=h;break;}}assert(seed);
 const r=run(s,0n,[step(11,Op.Coffee)],'coffee-pre-cost-capped-recovery',seed);assert.equal(r.state.alive,false);assert.equal(r.state.deathCause,7);assert.equal(r.state.needs[3],10000);assert.equal(r.state.inventory[5],0);assert.equal(r.receipts.find(x=>x.slot===11)!.snapshot.needs[3],10000);
});
writeFileSync(new URL('../../TEMP/v2-checks/kernel-cases.json',import.meta.url),JSON.stringify({scope:'Independent pureTypeScript core cases. Explicit injected state cases are boundary fixtures; closedtree/apple sequences use only earned production.',report,cases},(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
console.log(JSON.stringify({tests:report.length,fixtures:cases.length,failed:report.filter(x=>x.result==='fail')},null,2));

if(report.some(x=>x.result==='fail'))throw Error('V2 focused checks failed');
