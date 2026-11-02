import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {createState,assertState,clone,kitMask,kitItems} from '../../src/v2/state.ts';
import {maxShipmentPoints} from '../../src/v2/catalog.ts';
mkdirSync(new URL('../../TEMP/v2-checks/',import.meta.url),{recursive:true});
const checks:any[]=[];
const pass=(name:string,f:()=>void)=>{try{f();checks.push({name,result:'pass'});}catch(error){checks.push({name,result:'fail',error:String(error)});}};
let allocations=0;
for(let b=0;b<=5;b++)for(let w=0;w<=5-b;w++){assertState(createState({seed:42,stats:[b,w,5-b-w]}));allocations++;}
pass('all21 legal birth allocations',()=>assert.equal(allocations,21));
for(const [name,mutate] of [
 ['negative stock',(s:any)=>s.inventory[0]=-1],
 ['overflow stock',(s:any)=>s.inventory[0]=4294967296],
 ['NaN stock',(s:any)=>s.inventory[0]=NaN],
 ['wrong stock length',(s:any)=>s.inventory.pop()],
 ['empty plot NaN ticks',(s:any)=>s.plots[0].ticks=NaN],
 ['empty plot NaN yields',(s:any)=>s.plots[0].left=NaN],
 ['dry counter two',(s:any)=>s.plots[0].dry=2],
 ['alive zero health',(s:any)=>s.needs[0]=0],
 ['alive nonzero death cause',(s:any)=>s.deathCause=1],
 ['unknown house flag',(s:any)=>s.house.damage=8],
 ['unknown goal',(s:any)=>s.goal=7],
] as const){pass('reject '+name,()=>{const s=createState({seed:42});mutate(s);assert.throws(()=>assertState(s));});}
pass('full stock shipping quote remains valid',()=>{const s=createState({seed:42});s.inventory[33]=4294967295;const before=clone(s);assert.equal(maxShipmentPoints(s),1360);assert.deepEqual(s,before);});
pass('aggregate harvest overflow rejects whole hypothetical harvest',()=>{const s=createState({seed:42});s.inventory[28]=4294967294;s.plots[0]={kind:7,ticks:0,left:6,moisture:0,dry:0,soilBlocked:false};s.plots[1]={...s.plots[0]};s.plots[2]={kind:4,ticks:0,left:1,moisture:0,dry:0,soilBlocked:false};assert.equal(maxShipmentPoints(s),160);});
pass('one seed and two care types roundtrip',()=>{const m=kitMask(['water','bread','sapling']);assert.deepEqual(kitItems(m),[0,2,21]);});
for(const kit of [['wood'],['apple'],['sapling','rose_seed'],['water','water']])pass('reject kit '+kit.join('+'),()=>assert.throws(()=>kitMask(kit)));
writeFileSync(new URL('../../TEMP/v2-checks/state-boundaries.json',import.meta.url),JSON.stringify(checks,null,2)+'\n');
console.log(JSON.stringify({checks:checks.length,failed:checks.filter(x=>x.result==='fail')},null,2));

if(checks.some(x=>x.result==='fail'))throw Error('V2 focused checks failed');
