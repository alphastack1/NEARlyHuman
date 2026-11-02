import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { cloneState } from '../../../src/domain/state.ts';
import { legalCandidates, applyAction } from '../../../src/domain/actions.ts';
import { phaseBoundary, bedtime } from '../../../src/domain/mechanics.ts';
import type { DayContext } from '../../../src/domain/types.ts';

const fixture=JSON.parse(readFileSync(new URL('./admission-fixture.json',import.meta.url),'utf8'));
const allowed=new Set(['H01','H02','H03','H04','H05','H07','T01']);
function search(context:DayContext){
 const paths:string[][]=[];
 const walk=(ctx:DayContext,turn:number,path:string[])=>{
  if(!ctx.state.alive)return;
  if(turn===2){if(ctx.state.alive)paths.push(path);return;}
  ctx.slot=turn===0?41:51;
  for(const c of legalCandidates(ctx).filter(c=>allowed.has(c.action))){
   const next=cloneState(ctx);
   applyAction(next,c);
   // Fill the same canonical quiet time; it grants no recovery/use reset.
   for(let slot=ctx.slot+1;slot<=(turn===0?50:60)&&next.state.alive;slot++){
    next.slot=slot;
    next.state.recent.push({action:'T01',target:'hall',variant:'idle',success:true});
    next.state.recent=next.state.recent.slice(-6);
    if(slot%10===0)phaseBoundary(next);
    if(slot===60&&next.state.alive)bedtime(next);
   }
   walk(next,turn+1,[...path,c.key]);
  }
 };
 walk(cloneState(context),0,[]);
 return {survivingPaths:paths.length,paths};
}
const before=search(fixture.beforeAdmission),after=search(fixture.afterAdmission),guarded=search(fixture.guardedAdmission);
assert.equal(before.survivingPaths,2);
assert.equal(after.survivingPaths,0);
assert.equal(guarded.survivingPaths,2);
const report={scope:'Independent PM replay using saved contexts and actual imported action/phase/bedtime helpers; no biology probe code imported, no future kit or extra care opportunity.',before,after,guarded};
mkdirSync(new URL('../../../TEMP/economy-v2-feasibility/biology/',import.meta.url),{recursive:true});
writeFileSync(new URL('../../../TEMP/economy-v2-feasibility/biology/independent-admission.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
