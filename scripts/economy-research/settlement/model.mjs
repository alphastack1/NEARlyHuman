import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

// Research economy-only reference model. It is NOT the full biology engine,
// a contract implementation, a proof of Solidity/Rust, or a launch parameter set.
// Names and point weights below are finite witness fixtures, not final catalog.
const plants = {
  flower3a: {grow:3, interval:0, yields:1, output:'flower3a'},
  flower3b: {grow:3, interval:0, yields:1, output:'flower3b'},
  flower6: {grow:6, interval:0, yields:1, output:'flower6'},
  flower8: {grow:8, interval:0, yields:1, output:'flower8'},
  strawberry: {grow:3, interval:0, yields:1, output:'strawberry'},
  blueberry: {grow:6, interval:0, yields:1, output:'blueberry'},
  grape: {grow:8, interval:2, yields:6, output:'grape'},
  apple: {grow:8, interval:2, yields:6, output:'apple'},
  tree: {grow:6, interval:2, yields:10, output:'wood'},
};
const craftWood = {spoon:3, boat:6, birdhouse:8, chest:10};
const weights = {flower3a:65, flower3b:65, flower6:95, flower8:115,
  strawberry:65, blueberry:95, grape:40, apple:40,
  spoon:116, boat:212, birdhouse:276, chest:340};
const TOKEN_UNIT = 1000n;
const copy = v => structuredClone(v);
const add = (obj, key, n=1) => { obj[key] = (obj[key] ?? 0) + n; };
function take(obj, key, n=1) {
  assert(Number.isInteger(n) && n>0, 'positive integer quantity');
  assert((obj[key] ?? 0)>=n, `missing ${key}`);
  obj[key]-=n;
}
function freshLife(owner='alice') {
  return {owner, revision:0, day:0, alive:true, seeds:{}, wood:0, goods:{},
    plots:[null,null,null,null], purse:0n, purseNonce:0, transferCallPending:false,
    goal:0, pending:null};
}
function freshWorld() {
  return {lives:{one:freshLife(), two:freshLife('bob')}, requests:{}, serial:0,
    supply:0n, issued:0n, nftMintBurns:0n, vault:0n,
    wallets:{alice:0n,bob:0n}, bucket:{capacity:1000000n, available:1000000n,
      reserved:0n, rate:100n, at:0}, priceVersion:1, K:1000000n, paused:false};
}
function check(w) {
  const b=w.bucket;
  assert(b.available>=0n && b.reserved>=0n && b.available+b.reserved<=b.capacity);
  assert.equal(b.reserved, Object.values(w.requests)
    .filter(q=>q.status==='pending').reduce((n,q)=>n+q.reserve,0n));
  const allocations=Object.values(w.lives).reduce((n,l)=>n+l.purse,0n);
  assert.equal(allocations,w.vault,'every vault unit allocated, no hidden claim');
  assert.equal(w.supply,w.vault+Object.values(w.wallets).reduce((a,b)=>a+b,0n));
  assert.equal(w.issued,w.supply+w.nftMintBurns,'baseline pressure lifetime issuance');
  for (const l of Object.values(w.lives)) {
    assert(l.purse>=0n && l.wood>=0 && l.plots.length===4);
    for (const collection of [l.seeds,l.goods])
      for (const v of Object.values(collection)) assert(Number.isInteger(v)&&v>=0);
    if(l.pending) assert.equal(w.requests[l.pending].status,'pending');
  }
}
function refill(w, now) {
  const b=w.bucket; assert(Number.isInteger(now)&&now>=b.at);
  const headroom=b.capacity-b.reserved-b.available;
  const increment=BigInt(now-b.at)*b.rate;
  b.available+=increment<headroom?increment:headroom; b.at=now;
}
function quote(points,q) {
  // Weights are tenths of a point; all arithmetic integer, floor once per batch.
  return BigInt(points)*TOKEN_UNIT*q.K/(10n*(q.K+q.pressure));
}
function topFourPoints(goods) {
  const entries=Object.entries(goods).filter(([k,n])=>weights[k]&&n>0)
    .sort((a,b)=>weights[b[0]]-weights[a[0]]);
  let slots=4, points=0;
  for (const [key,count] of entries) {
    const n=Math.min(slots,count); points+=n*weights[key]; slots-=n;
    if(!slots) break;
  }
  return points;
}
function maxShipmentPoints(l) {
  const options=[copy(l.goods)];
  const harvest=copy(l.goods);
  for(const p of l.plots) if(p && p.remaining===0 && plants[p.kind].output!=='wood')
    add(harvest,plants[p.kind].output);
  options.push(harvest);
  for (const [kind,cost] of Object.entries(craftWood)) if(l.wood>=cost) {
    const gs=copy(l.goods); add(gs,kind); options.push(gs);
  }
  return Math.max(...options.map(topFourPoints));
}
function openAtomic(w,id,owner,now=0,{allowNoShipping=false,seed=null}={}) {
  assert(!w.paused,'admission paused');
  const l=w.lives[id]; assert.equal(l.owner,owner,'current owner only');
  assert(l.alive,'dead cannot produce'); assert.equal(l.pending,null,'one pending');
  refill(w,now);
  const requestId=`${id}:${++w.serial}`;
  const q={id:requestId, life:id, player:owner, baseRevision:l.revision,
    day:l.day+1, status:'pending', priceVersion:w.priceVersion,
    pressure:w.issued, K:w.K, deadline:now+60, reserve:0n, deliverySeed:seed,
    shippingAllowed:true};
  assert(seed===null || plants[seed],'typed kit seed');
  q.reserve=quote(maxShipmentPoints(l),q);
  if(w.bucket.available<q.reserve) {
    assert(allowNoShipping,'capacity unavailable before fee/AI');
    q.reserve=0n; q.shippingAllowed=false;
  }
  if(q.reserve===0n) q.shippingAllowed=false;
  w.bucket.available-=q.reserve; w.bucket.reserved+=q.reserve;
  w.requests[requestId]=q; l.pending=requestId; check(w); return requestId;
}
function open(w,id,owner,now=0,options={}) {
  const next=copy(w), requestId=openAtomic(next,id,owner,now,options);
  Object.assign(w,next); return requestId;
}
function releaseReservation(w,q,actual) {
  assert(actual>=0n && actual<=q.reserve,'quote cannot exceed reservation');
  w.bucket.reserved-=q.reserve; w.bucket.available+=q.reserve-actual;
}
function expire(w,requestId,now) {
  const q=w.requests[requestId]; assert.equal(q.status,'pending');
  assert(now>q.deadline,'strict deadline'); refill(w,now);
  releaseReservation(w,q,0n); q.status='expired'; w.lives[q.life].pending=null; check(w);
}
function failure(w,requestId,now=0) {
  const q=w.requests[requestId]; assert.equal(q.status,'pending'); refill(w,now);
  releaseReservation(w,q,0n); q.status='failed'; w.lives[q.life].pending=null; check(w);
}
function setGoal(w,id,owner,goal) {
  const l=w.lives[id]; assert.equal(l.owner,owner); assert(!l.pending);
  assert(Number.isInteger(goal)&&goal>=0&&goal<=4,'bounded advisory enum');
  l.goal=goal; ++l.revision;
}
function transfer(w,id,from,to) {
  const l=w.lives[id]; assert.equal(l.owner,from); assert(!l.pending,'transfer locked');
  l.owner=to; ++l.revision; ++l.purseNonce; w.wallets[to]??=0n; check(w);
}
function withdraw(w,id,owner,amount) {
  const l=w.lives[id]; assert.equal(l.owner,owner); assert(amount>0n&&l.purse>=amount);
  assert(!l.transferCallPending,'tentative ownership cannot spend purse');
  // Disjoint ledger: accepted day cannot overwrite a concurrent withdrawal.
  l.purse-=amount; w.vault-=amount; w.wallets[owner]+=amount; check(w);
}
function mintFromPurse(w,id,actor,{amount,expectedNonce,newId}) {
  const next=copy(w),l=next.lives[id];
  assert.equal(l.owner,actor,'only current owner, not an approved NFT operator');
  assert(!l.transferCallPending,'tentative ownership cannot spend purse');
  assert.equal(l.purseNonce,expectedNonce,'purse intent nonce');
  assert(amount>0n&&l.purse>=amount&&!next.lives[newId]);
  // Fixture amount stands for a version-bound fixed seasonal mint price.
  l.purse-=amount;next.vault-=amount;next.supply-=amount;next.nftMintBurns+=amount;
  ++l.purseNonce;next.lives[newId]=freshLife(actor);check(next);Object.assign(w,next);
}
function burnForBirth(w,owner,amount,newId) {
  assert(amount>0n&&w.wallets[owner]>=amount&&!w.lives[newId]);
  w.wallets[owner]-=amount; w.supply-=amount; w.nftMintBurns+=amount;
  w.lives[newId]=freshLife(owner); check(w);
}
function plant(l,slot,kind) {
  assert(Number.isInteger(slot)&&slot>=0&&slot<4);
  assert.equal(l.plots[slot],null,'occupied slot'); assert(plants[kind]);
  take(l.seeds,kind);
  l.plots[slot]={kind,remaining:plants[kind].grow,left:plants[kind].yields,moisture:2};
}
function harvest(l) {
  let any=false;
  l.plots=l.plots.map(p=>{
    if(!p||p.remaining!==0)return p;
    any=true;
    const spec=plants[p.kind];
    if(spec.output==='wood') ++l.wood; else add(l.goods,spec.output);
    --p.left;
    if(p.left===0)return null;
    p.remaining=spec.interval; return p;
  });
  assert(any,'nothing ready');
}
function growth(l) {
  for(const p of l.plots) if(p) {
    if(p.moisture>0 && p.remaining>0) --p.remaining;
    p.moisture=Math.max(0,p.moisture-1);
  }
}
function replay(l,trace) {
  // Macros are bounded; detailed biology/death must be the shared canonical
  // reducer, not a relayer-provided boolean. This witness only validates that
  // a trusted terminal witness stops subsequent economic steps and growth.
  let mainUsed=false, shipmentUsed=false, lastPhase=0, points=0, dead=false;
  const routinePhases=new Set();
  assert(trace.length<=7,'bounded macro trace');
  for(const action of trace) {
    assert(!dead,'no action after death');
    assert(action.phase>=lastPhase && action.phase>=1&&action.phase<=5,'chronological phases');
    lastPhase=action.phase;
    if(action.type==='terminal') {
      assert.equal(action.validCanonicalWitness,true,'no arbitrary death bit');
      l.alive=false; dead=true; continue;
    }
    if(['plant','harvest','craft'].includes(action.type)) {
      assert(!mainUsed && action.phase===3,'one afternoon main'); mainUsed=true;
      if(action.type==='plant')plant(l,action.slot,action.kind);
      if(action.type==='harvest')harvest(l);
      if(action.type==='craft') {
        const cost=craftWood[action.kind]; assert(cost && l.wood>=cost,'craft wood');
        l.wood-=cost; add(l.goods,action.kind);
      }
    } else {
      assert(!routinePhases.has(action.phase),'one routine per phase'); routinePhases.add(action.phase);
      if(action.type==='well'){for(const p of l.plots)if(p)p.moisture=2;}
      else if(action.type==='ship') {
        assert(!shipmentUsed,'one shipment round per day'); shipmentUsed=true;
        let count=0;
        for(const [key,n] of Object.entries(action.goods)) {
          assert(weights[key],'only produced export catalog');
          take(l.goods,key,n); count+=n; points+=weights[key]*n;
        }
        assert(count>0&&count<=4,'ship one to four actual units');
      } else assert.equal(action.type,'idle','only bounded typed routines');
    }
  }
  if(l.alive)growth(l);
  else {l.goods={};l.seeds={};l.wood=0;l.plots=[null,null,null,null];}
  ++l.day; ++l.revision; return points;
}
function settle(w,requestId,trace,now=0) {
  // EVM revert / NEAR single-receipt panic must roll back the WHOLE transaction.
  const next=copy(w), q=next.requests[requestId];
  assert.equal(q.status,'pending'); assert(now<=q.deadline,'too late');
  const l=next.lives[q.life];
  assert.equal(l.owner,q.player); assert.equal(l.revision,q.baseRevision);
  refill(next,now);
  if(!q.shippingAllowed)assert(!trace.some(a=>a.type==='ship'),'shipping unavailable, retain goods');
  if(q.deliverySeed!==null)add(l.seeds,q.deliverySeed);
  const points=replay(l,trace), reward=quote(points,q);
  releaseReservation(next,q,reward);
  next.supply+=reward; next.issued+=reward; next.vault+=reward; l.purse+=reward;
  q.status='settled'; q.reward=reward; l.pending=null; check(next);
  Object.assign(w,next); return reward;
}

const witnesses=[];
const counterexamples=[];
function witness(name,fn){fn();witnesses.push({name,result:'pass'});}
function rejectedWithoutMutation(w,fn,pattern) {
  const before=copy(w); assert.throws(fn,pattern); assert.deepEqual(w,before);
}
function ready(kind,left=plants[kind].yields) {
  return {kind,remaining:0,left,moisture:2};
}
function seedGoods(w,id,kind,n) {w.lives[id].goods[kind]=n;}
const harvestAction={type:'harvest',phase:3};
const wellAction={type:'well',phase:2};
const ship=(goods,phase=4)=>({type:'ship',phase,goods});

witness('premature harvest has no resource or purse side effect',()=>{
  const w=freshWorld(); w.lives.one.plots[0]={...ready('apple'),remaining:1};
  const q=open(w,'one','alice'); rejectedWithoutMutation(w,()=>settle(w,q,[harvestAction]),/nothing ready/);
});
witness('one harvest round collects all four ready plants exactly once',()=>{
  const w=freshWorld(); w.lives.one.plots=['apple','grape','tree','flower3a'].map(x=>ready(x));
  const q=open(w,'one','alice'); settle(w,q,[wellAction,harvestAction]);
  assert.equal(w.lives.one.goods.apple,1);assert.equal(w.lives.one.goods.grape,1);
  assert.equal(w.lives.one.goods.flower3a,1);assert.equal(w.lives.one.wood,1);
  assert.equal(w.lives.one.plots[3],null);assert.equal(w.lives.one.plots[0].remaining,1);
});
witness('a repeated harvest or main craft in the same day is rejected atomically',()=>{
  const w=freshWorld();w.lives.one.plots[0]=ready('apple');w.lives.one.wood=10;
  const q=open(w,'one','alice');
  rejectedWithoutMutation(w,()=>settle(w,q,[harvestAction,harvestAction]),/one afternoon main/);
  rejectedWithoutMutation(w,()=>settle(w,q,[harvestAction,{type:'craft',phase:3,kind:'chest'}]),/one afternoon main/);
});
witness('new plant consumes one seed and gains its first tick that day',()=>{
  const w=freshWorld();w.lives.one.seeds.apple=1;const q=open(w,'one','alice');
  settle(w,q,[{type:'plant',phase:3,kind:'apple',slot:0}]);
  assert.equal(w.lives.one.seeds.apple,0);assert.equal(w.lives.one.plots[0].remaining,7);
});
witness('four slots are hard bounded including tree',()=>{
  const w=freshWorld();w.lives.one.seeds.tree=1;const q=open(w,'one','alice');
  rejectedWithoutMutation(w,()=>settle(w,q,[{type:'plant',phase:3,kind:'tree',slot:4}]),/assertion/i);
});
witness('ready perennial has only one held output and no invisible regrowth',()=>{
  const w=freshWorld();w.lives.one.plots[0]=ready('grape');
  for(let day=0;day<5;day++){const q=open(w,'one','alice');settle(w,q,[wellAction]);}
  assert.equal(w.lives.one.plots[0].remaining,0);assert.equal(w.lives.one.plots[0].left,6);
  assert.equal(w.lives.one.goods.grape,undefined);
});
witness('tree stops at ten outputs, fruit stops at six, first yield included',()=>{
  for(const kind of ['tree','apple','grape']){
    const w=freshWorld(); w.lives.one.plots[0]=ready(kind);
    const expected=plants[kind].yields;
    for(let i=0;i<expected;i++){
      let q=open(w,'one','alice');settle(w,q,[wellAction,harvestAction]);
      if(i+1<expected){q=open(w,'one','alice');settle(w,q,[wellAction]);}
    }
    assert.equal(w.lives.one.plots[0],null);
    assert.equal(kind==='tree'?w.lives.one.wood:w.lives.one.goods[kind],expected);
  }
});
witness('one craft consumes precisely 3/6/8/10 wood with no raw-wood export',()=>{
  for(const [kind,cost] of Object.entries(craftWood)){
    const w=freshWorld();w.lives.one.wood=cost;const q=open(w,'one','alice');
    settle(w,q,[{type:'craft',phase:3,kind}]);
    assert.equal(w.lives.one.wood,0);assert.equal(w.lives.one.goods[kind],1);
  }
  const w=freshWorld();w.lives.one.wood=10;const q=open(w,'one','alice');
  rejectedWithoutMutation(w,()=>settle(w,q,[ship({wood:1})]),/only produced export catalog/);
});
witness('seeds, saplings and food/water gifts cannot be shipped',()=>{
  for(const kind of ['appleSeed','treeSapling','foodGift','waterGift']){
    const w=freshWorld();seedGoods(w,'one','apple',1);const q=open(w,'one','alice');
    rejectedWithoutMutation(w,()=>settle(w,q,[ship({[kind]:1})]),/only produced export catalog/);
  }
});
witness('mailbox shipment consumes goods and repeated finalization cannot duplicate reward',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',1);const q=open(w,'one','alice');
  const reward=settle(w,q,[ship({chest:1})]); assert(reward>0n);assert.equal(w.lives.one.goods.chest,0);
  rejectedWithoutMutation(w,()=>settle(w,q,[ship({chest:1})]),/pending/);
});
witness('four-unit shipping limit rejects entire overlarge request, leaving stored stock',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',5);const q=open(w,'one','alice');
  rejectedWithoutMutation(w,()=>settle(w,q,[ship({chest:5})]),/one to four/);
  settle(w,q,[ship({chest:4})]);assert.equal(w.lives.one.goods.chest,1);
});
witness('each phase has one ordinary routine; a second shipment is not free',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',2);const q=open(w,'one','alice');
  rejectedWithoutMutation(w,()=>settle(w,q,[ship({chest:1}),ship({chest:1})]),/one routine per phase/);
});
witness('one daily shipment across distinct phases matches top-four quote reservation',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',5);const q=open(w,'one','alice');
  rejectedWithoutMutation(w,()=>settle(w,q,[ship({chest:1},2),ship({chest:4},4)]),/one shipment round per day/);
});
witness('failed AI attempt consumes no biology, crops, goods, purse or issuance',()=>{
  const w=freshWorld();w.lives.one.plots[0]=ready('apple');seedGoods(w,'one','chest',1);
  const old=copy(w.lives.one),q=open(w,'one','alice');failure(w,q);
  assert.deepEqual(w.lives.one,old);assert.equal(w.supply,0n);assert.equal(w.bucket.reserved,0n);
});
witness('permissionless expiry releases capacity and rejects late result',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',1);const q=open(w,'one','alice');
  assert.throws(()=>expire(w,q,60),/strict deadline/);expire(w,q,61);
  rejectedWithoutMutation(w,()=>settle(w,q,[ship({chest:1})],61),/pending/);
  assert.equal(w.lives.one.goods.chest,1);assert.equal(w.lives.one.day,0);
});
witness('retry has a fresh attempt id but the exact same unspent production base',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',1);seedGoods(w,'one','apple',1);const q1=open(w,'one','alice');failure(w,q1);
  const q2=open(w,'one','alice');assert.notEqual(q1,q2);settle(w,q2,[ship({chest:1})]);
  const q3=open(w,'one','alice');rejectedWithoutMutation(w,()=>settle(w,q3,[ship({chest:1})]),/missing chest/);
});
witness('transfer is locked while pending; after release old owner loses all purse authority',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',1);const q=open(w,'one','alice');
  assert.throws(()=>transfer(w,'one','alice','bob'),/transfer locked/);settle(w,q,[ship({chest:1})]);
  transfer(w,'one','alice','bob');assert.throws(()=>withdraw(w,'one','alice',1n));
  withdraw(w,'one','bob',w.lives.one.purse);assert(w.wallets.bob>0n);
});
witness('withdrawal during AI pending cannot be overwritten by later reward credit',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',2);let q=open(w,'one','alice');settle(w,q,[ship({chest:1})]);
  const oldPurse=w.lives.one.purse;q=open(w,'one','alice');withdraw(w,'one','alice',oldPurse);
  const reward=settle(w,q,[ship({chest:1})]);assert.equal(w.lives.one.purse,reward);assert.equal(w.wallets.alice,oldPurse);
});
witness('dead life cannot produce but purse withdrawal remains direct and available when paused',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',1);const q=open(w,'one','alice');settle(w,q,[ship({chest:1})]);
  w.lives.one.alive=false;w.paused=true;withdraw(w,'one','alice',w.lives.one.purse);
  assert(w.wallets.alice>0n);w.paused=false;assert.throws(()=>open(w,'one','alice'),/dead cannot produce/);
});
witness('valid shipment before death is credited; death discards only unshipped production',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',2);const q=open(w,'one','alice');
  const reward=settle(w,q,[ship({chest:1},2),{type:'terminal',phase:5,validCanonicalWitness:true}]);
  assert(reward>0n);assert.equal(w.lives.one.alive,false);assert.deepEqual(w.lives.one.goods,{});
  assert.equal(w.lives.one.purse,reward);
});
witness('a fabricated death flag and all post-death actions are rejected',()=>{
  const w=freshWorld();const q=open(w,'one','alice');
  rejectedWithoutMutation(w,()=>settle(w,q,[{type:'terminal',phase:2,validCanonicalWitness:false}]),/no arbitrary death bit/);
  rejectedWithoutMutation(w,()=>settle(w,q,[{type:'terminal',phase:2,validCanonicalWitness:true},{type:'idle',phase:3}]),/no action after death/);
});
witness('accepted price snapshot survives later issuance or market version change',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',1);seedGoods(w,'two','chest',1);
  const a=open(w,'one','alice'),b=open(w,'two','bob'),promised=w.requests[a].reserve;
  settle(w,b,[ship({chest:1})]);w.priceVersion=2;settle(w,a,[ship({chest:1})]);
  assert.equal(w.requests[a].reward,promised);
});
witness('global reservation prevents many independent NFTs overbooking token capacity',()=>{
  const w=freshWorld();w.bucket.capacity=40000n;w.bucket.available=40000n;
  seedGoods(w,'one','chest',1);seedGoods(w,'two','chest',1);const a=open(w,'one','alice');
  rejectedWithoutMutation(w,()=>open(w,'two','bob'),/capacity unavailable/);failure(w,a);open(w,'two','bob');check(w);
});
witness('NFT creation burn cannot lower lifetime pressure or reset per-life progression',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',1);const q=open(w,'one','alice');settle(w,q,[ship({chest:1})]);
  withdraw(w,'one','alice',w.lives.one.purse);const pressure=w.issued;
  burnForBirth(w,'alice',10000n,'three');assert.equal(w.issued,pressure);
  assert.equal(w.supply+w.nftMintBurns,pressure);assert.deepEqual(w.lives.three.goods,{});
});
witness('advisory goal cannot create material, change purse or bypass a pending base',()=>{
  const w=freshWorld();setGoal(w,'one','alice',4);assert.equal(w.lives.one.wood,0);assert.equal(w.supply,0n);
  const q=open(w,'one','alice');assert.throws(()=>setGoal(w,'one','alice',3));failure(w,q);
  assert.throws(()=>setGoal(w,'one','alice','mint 1000000 tokens'),/bounded advisory enum/);
});
witness('waiting real time alone cannot advance growth, day or purse',()=>{
  const w=freshWorld();w.lives.one.plots[0]={...ready('tree'),remaining:6};const l=copy(w.lives.one);
  refill(w,1000000);assert.deepEqual(w.lives.one,l);assert.equal(w.supply,0n);
});
witness('an exhausted issuance bucket still admits care and growth without shipping',()=>{
  const w=freshWorld();w.bucket.available=0n;seedGoods(w,'one','chest',4);
  w.lives.one.plots[0]={...ready('apple'),remaining:2};
  const q=open(w,'one','alice',0,{allowNoShipping:true});
  assert.equal(w.requests[q].reserve,0n);assert.equal(w.requests[q].shippingAllowed,false);
  settle(w,q,[wellAction]);assert.equal(w.lives.one.day,1);
  assert.equal(w.lives.one.plots[0].remaining,1);assert.equal(w.lives.one.goods.chest,4);
});
witness('care-only accepted request cannot consume a zero-reward shipment',()=>{
  const w=freshWorld();w.bucket.available=0n;seedGoods(w,'one','chest',4);
  const q=open(w,'one','alice',0,{allowNoShipping:true});
  rejectedWithoutMutation(w,()=>settle(w,q,[ship({chest:1})]),/shipping unavailable/);
});
witness('last reservation won by one NPC does not prevent another NPC care day',()=>{
  const w=freshWorld();w.bucket.capacity=34000n;w.bucket.available=34000n;
  seedGoods(w,'one','chest',1);seedGoods(w,'two','chest',1);
  const a=open(w,'one','alice',0,{allowNoShipping:true});
  const b=open(w,'two','bob',0,{allowNoShipping:true});
  assert.equal(w.requests[a].shippingAllowed,true);assert.equal(w.requests[b].shippingAllowed,false);
  settle(w,b,[]);settle(w,a,[ship({chest:1})]);check(w);
});
witness('first seed comes from Day1 kit; failed kit is not granted and retry may change kit',()=>{
  const w=freshWorld();assert.deepEqual(w.lives.one.seeds,{});
  let q=open(w,'one','alice',0,{seed:'apple'});failure(w,q);
  assert.deepEqual(w.lives.one.seeds,{});
  q=open(w,'one','alice',0,{seed:'tree'});
  settle(w,q,[{type:'plant',phase:3,kind:'tree',slot:0}]);
  assert.equal(w.lives.one.seeds.apple,undefined);assert.equal(w.lives.one.seeds.tree,0);
  assert.equal(w.lives.one.day,1);assert.equal(w.lives.one.plots[0].remaining,5);
});
witness('owner can atomically mint new NFT from a dead-life purse with conserved burn',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',1);const q=open(w,'one','alice');settle(w,q,[ship({chest:1})]);
  const before={purse:w.lives.one.purse,vault:w.vault,supply:w.supply,pressure:w.issued};
  w.lives.one.alive=false;mintFromPurse(w,'one','alice',{amount:10000n,expectedNonce:0,newId:'three'});
  assert.equal(w.lives.one.purse,before.purse-10000n);assert.equal(w.vault,before.vault-10000n);
  assert.equal(w.supply,before.supply-10000n);assert.equal(w.issued,before.pressure);
  assert.equal(w.lives.three.owner,'alice');assert.deepEqual(w.lives.three.seeds,{});
});
witness('purse NFT-mint intent nonce cannot replay and approved operators have no purse rights',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',1);const q=open(w,'one','alice');settle(w,q,[ship({chest:1})]);
  rejectedWithoutMutation(w,()=>mintFromPurse(w,'one','approved-marketplace',{amount:10000n,expectedNonce:0,newId:'three'}),/only current owner/);
  mintFromPurse(w,'one','alice',{amount:10000n,expectedNonce:0,newId:'three'});
  rejectedWithoutMutation(w,()=>mintFromPurse(w,'one','alice',{amount:10000n,expectedNonce:0,newId:'four'}),/purse intent nonce/);
});
witness('ownership round trip invalidates an old unused purse mint intent',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',1);const q=open(w,'one','alice');settle(w,q,[ship({chest:1})]);
  transfer(w,'one','alice','bob');transfer(w,'one','bob','alice');
  rejectedWithoutMutation(w,()=>mintFromPurse(w,'one','alice',{amount:10000n,expectedNonce:0,newId:'three'}),/purse intent nonce/);
});
witness('purse mint while AI pending preserves later incremental reward credit',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',2);let q=open(w,'one','alice');settle(w,q,[ship({chest:1})]);
  const before=w.lives.one.purse;q=open(w,'one','alice');
  mintFromPurse(w,'one','alice',{amount:10000n,expectedNonce:0,newId:'three'});
  const reward=settle(w,q,[ship({chest:1})]);assert.equal(w.lives.one.purse,before-10000n+reward);
});
witness('tentative NEAR transfer-call owner cannot mint from purse or withdraw it',()=>{
  const w=freshWorld();seedGoods(w,'one','chest',1);const q=open(w,'one','alice');settle(w,q,[ship({chest:1})]);
  w.lives.one.transferCallPending=true;
  rejectedWithoutMutation(w,()=>mintFromPurse(w,'one','alice',{amount:10000n,expectedNonce:0,newId:'three'}),/tentative ownership/);
  rejectedWithoutMutation(w,()=>withdraw(w,'one','alice',1n),/tentative ownership/);
});

// A counterexample to copying a synchronous EVM ownership check into an
// asynchronous NEAR nft_transfer_call implementation. No real chain calls.
{
  const state={owner:'alice',purse:100,receiverTokens:0};
  state.owner='receiver-contract'; // NFT contract's first receipt.
  const provisional=copy(state);
  state.receiverTokens+=state.purse; state.purse=0; // Separate withdrawal receipt.
  state.owner='alice'; // Receiver rejects; a later resolver returns NFT.
  assert.equal(state.owner,'alice');assert.equal(state.purse,0);assert.equal(state.receiverTokens,100);
  counterexamples.push({name:'naive asynchronous NFT transfer-call drains returning NFT',
    result:'vulnerability reproduced in unguarded abstract design',
    provisional,returned:state,
    requiredChange:'pending-transfer authority lock plus callback recovery, or omit this path until designed'});
}

let splitRoundingCases=0;
for(let a=0;a<=500;a++)for(let b=0;b<=500;b++){
  const q={K:12345n,pressure:6789n};
  assert(quote(a,q)+quote(b,q)<=quote(a+b,q),'splitting cannot improve payout');++splitRoundingCases;
}

// Exhaust the bucket arithmetic over a deliberately small reachable state
// space, including reserve/release/mint and discarded refill while reserved.
let bucketStates=0,bucketTransitions=0;
const queue=[{a:5,r:0,t:0,m:0}],seen=new Set();
while(queue.length){
  const s=queue.pop(),key=JSON.stringify(s);if(seen.has(key))continue;seen.add(key);++bucketStates;
  assert(s.a>=0&&s.r>=0&&s.a+s.r<=5);assert(s.m<=5+s.t);
  const next=[];
  if(s.t<5)next.push({...s,t:s.t+1,a:Math.min(5-s.r,s.a+1)});
  for(let q=1;q<=s.a;q++)next.push({...s,a:s.a-q,r:s.r+q});
  for(let q=1;q<=s.r;q++)for(let actual=0;actual<=q;actual++)
    next.push({...s,a:s.a+q-actual,r:s.r-q,m:s.m+actual});
  for(const n of next){++bucketTransitions;queue.push(n);}
}
const result={scope:'hypothetical economy-only reference model; not production contract proof',
  witnesses, counterexamples, finiteSweeps:{splitRoundingCases,bucketStates,bucketTransitions},
  assumptions:['one main, five phase routines','one shipment round/day, maximum four output units',
    'instant one-main craft','all productive crops need one garden-well round',
    'one-receipt atomic finalize','terminal witness represents separate canonical biology reducer',
    'all token burning in fixture is seasonal NFT minting'],
  unresolved:['full biology transition parity/gas','chain implementation correctness',
    'NEAR combined NFT/FT contract compatibility and storage registration',
    'economic catalog/denomination/bucket parameters are provisional']};
const out = new URL('../../../TEMP/economy-research/settlement/', import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL('evidence.json', out),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({witnesses:witnesses.length,splitRoundingCases,bucketStates,bucketTransitions}));
