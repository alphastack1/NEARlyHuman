import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {parseAbi,keccak256,toHex,type Hex} from 'viem';
import {createState,clone,openDay,legalActions,shipmentBaskets,topShipment,shipmentPoints,maxShipmentPoints,step,Op,ITEMS,encodeState,decodeState,encodeTrace,replayDay,type State,type Candidate} from '../../src/v2';
import {offerV2MindCandidates,buildV2Request,V2_MIND_POLICY} from '../../server/v2/choices';
import {offerV2Candidates,v2DecisionConfig} from '../../server/v2/preparation';
import {v2PublicClient,verifyV2Runtime} from '../../server/v2/context';

const checks:string[]=[],hash=(s:string)=>keccak256(toHex(s));
const context=(s:State,shipping=true)=>{const c=openDay(s,0n,hash('shipment-menu-check'),shipping);c.slot=21;c.open=true;return c;};
const mixed=createState({seed:42});mixed.inventory[26]=1;mixed.inventory[29]=2;mixed.inventory[31]=1;
const before=JSON.stringify(mixed.inventory),baskets=shipmentBaskets(mixed.inventory);
assert.deepEqual(baskets,[{kind:'combined',goods:[32,27,30,30]},{kind:'produce',goods:[27,30,30]},{kind:'surplus',goods:[30]}]);
assert.equal(JSON.stringify(mixed.inventory),before);checks.push('mixed inventory yields combined35.7 / produce14.5 / surplus4.0 baskets and does not mutate stock');
for(const inventory of [Array(34).fill(0),mixed.inventory,Array(34).fill(1000),Array.from({length:34},(_,i)=>i===31?2:0)]){
 const choices=shipmentBaskets(inventory);assert(choices.length<=3);assert.equal(new Set(choices.map(b=>b.goods.join(','))).size,choices.length);
 for(const b of choices){assert(b.goods.length>0&&b.goods.length<=4);const remaining=[...inventory];for(const id of b.goods){assert(id>=23&&id<=34);assert(remaining[id-1]!>0);remaining[id-1]!--;}assert(shipmentPoints(b.goods)<=shipmentPoints(topShipment(inventory)));}
}
const one=createState({seed:1});one.inventory[29]=1;assert.equal(shipmentBaskets(one.inventory).length,1);checks.push('empty/equal baskets deduplicate; every option uses at most4 real finished units below original maximum');
const c=context(mixed),all=legalActions(c),ship=all.filter(a=>a.op===Op.Ship),offered=offerV2MindCandidates(c,all),generic=offerV2Candidates(c,all);
assert.equal(ship.length,3);assert.equal(offered.filter(a=>a.op===Op.Ship).length,3);assert.equal(generic.filter(a=>a.op===Op.Ship).length,3);
assert(offered.length<=12&&generic.length<=24);assert(legalActions(context(mixed,false)).every(a=>a.op!==Op.Ship));assert(legalActions(c,true).every(a=>a.op!==Op.Ship));
checks.push('all three existing-valid baskets survive normal provider and generic menus; care-only/shipping-disabled modes expose none');
const pressured=clone(mixed);pressured.needs=[10000,2000,2000,1500,1500];pressured.inventory[4]=2;pressured.inventory[10]=2;pressured.inventory[11]=1;
pressured.conditions[0]={severity:1,onsetDay:0,dueDay:1,resolved:false};pressured.conditions[2]={severity:2,onsetDay:0,dueDay:1,resolved:false};pressured.conditions[6]={severity:1,onsetDay:0,dueDay:0,resolved:false};pressured.conditions[7]={severity:1,onsetDay:0,dueDay:0,resolved:false};
const pc=context(pressured),pa=legalActions(pc),oldBasket=ship[0]!.goods.join(','),baseline=offerV2MindCandidates(pc,pa.filter(a=>a.op!==Op.Ship||a.goods.join(',')===oldBasket)),expanded=offerV2MindCandidates(pc,pa);
for(const a of baseline.filter(a=>a.op===Op.Treat||a.op===Op.Wash||a.op===Op.Rest&&pressured.needs[3]!<=2000))assert(expanded.some(b=>b.key===a.key));
assert(expanded.length<=14);checks.push('expansion appends after original care coverage and retains every baseline clinical/urgent-rest option');
const request=(s:State,menu:Candidate[])=>buildV2Request({inputHash:hash('input'),requestId:hash('request'),day:s.day+1,slot:21,mode:'routine',state:s,earlierToday:[step(1,Op.Quiet),step(2,Op.Pickup)],candidates:menu},{name:'MISO',pressureMicro:'50000000000',previousDays:[1,2].map(day=>({day,actions:[step(1,Op.Quiet),step(21,Op.Breakfast,2,0),step(36,Op.Harvest),step(41,Op.Leisure),step(51,Op.Well)]}))});
const sizes=[Buffer.byteLength(JSON.stringify(request(mixed,offered).input)),Buffer.byteLength(JSON.stringify(request(pressured,expanded).input))];
assert(sizes.every(n=>n<=14000));checks.push('expanded mixed and clinical requests retain the existing14000-byte provider cap');
let publicParity:unknown;
if(process.argv.includes('--public-parity')){
 const deployment=JSON.parse(readFileSync(new URL('../../contracts/v2/deployments/robinhood-testnet.json',import.meta.url),'utf8')),runtime=deployment.runtime,client=v2PublicClient('https://rpc.testnet.chain.robinhood.com',runtime),latest=await verifyV2Runtime(client,runtime);
 const blockText=process.argv.find(v=>v.startsWith('--block='))?.slice(8);if(blockText&&!/^[1-9]\d*$/.test(blockText))throw Error('Choose the exact recorded public block.');
 const head=blockText?await client.getBlock({blockNumber:BigInt(blockText)}):latest;
 const abi=parseAbi(['function life(uint256 id) view returns(bytes)','function transition(bytes saved,bytes trace,bytes certificate,bytes32 daySeed,uint64 kitMask,bool shipping) view returns(bytes result,uint16 shipmentDecipoints)']);
 const raw=await client.readContract({address:runtime.collection,abi,functionName:'life',args:[1n],blockNumber:head.number!}),saved=decodeState(raw),actualChoices=shipmentBaskets(saved.inventory),results=[];
 assert.equal(saved.day,26,'The actual case advanced; use --block=<recorded proof block> to replay MISO26.');assert.equal(saved.inventory[31],1);assert.equal(actualChoices.length,3);
 for(const basket of actualChoices){
  const trace={goal:255,steps:[step(21,Op.Ship,0,0,basket.goods)]},seed=hash('actual-miso26-shipment-parity');
  const expected=replayDay(saved,0n,trace,seed,true),actual=await client.readContract({address:runtime.verifier,abi,functionName:'transition',args:[raw,encodeTrace(trace),'0x',seed,0n,true],blockNumber:head.number!});
  assert.equal(actual[0],encodeState(expected.state));assert.equal(actual[1],expected.points);assert(expected.points<=maxShipmentPoints(saved));
  if(basket.kind!=='combined')assert.equal(expected.state.inventory[31],1);
  if(basket.kind==='surplus'){assert.equal(expected.state.inventory[26],saved.inventory[26]);assert.equal(expected.state.inventory[29],saved.inventory[29]!-1);}
  results.push({kind:basket.kind,goods:basket.goods,basePoints:expected.points/10,keepsToyBoat:expected.state.inventory[31]===1,resultStateHash:keccak256(actual[0])});
 }
 assert.equal((await client.getBlock({blockNumber:head.number!})).hash,head.hash);
 publicParity={scope:'Read-only calls to the actual deployed verifier using exact actual MISO Day26 saved bytes and explicit test day seed/trace. No accepted day, inference, token issuance or transaction is claimed.',block:head.number!.toString(),blockHash:head.hash,collection:runtime.collection,verifier:runtime.verifier,tokenId:'1',savedDay:saved.day,savedStateHash:keccak256(raw),results};
 checks.push('all three real MISO26 basket traces match actual deployed verifier state/points; smaller baskets preserve Toy boat');
}
const deploymentRecord=JSON.parse(readFileSync(new URL('../../contracts/v2/deployments/robinhood-testnet.json',import.meta.url),'utf8'));
const result={scope:'Bounded existing-valid shipment menu checks; pure fixtures explicitly synthetic. Optional actual verifier calls are read-only.',checks,sizes,mindPolicy:V2_MIND_POLICY,nextDecisionConfig:v2DecisionConfig(deploymentRecord.runtime.rulesHash),...(publicParity?{publicParity}:{})};
mkdirSync(new URL('../../TEMP/v2-checks/',import.meta.url),{recursive:true});writeFileSync(new URL('../../TEMP/v2-checks/shipment-options.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify({passed:checks.length,sizes,nextDecisionConfig:result.nextDecisionConfig,publicParity:!!publicParity}));
