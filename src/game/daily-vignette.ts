import type { DayResult, Episode } from '../domain/types';
import { hash32 } from '../domain/state';
import { deriveIndividuality, dayInclination } from '../domain/individuality';
import { isUnchangedQuietReceipt, quietSpanAt } from './quiet-spans';

export type VignetteKind='window-bird'|'window-cloud'|'window-moth'|'garden-butterfly'|'garden-breeze'|'garden-firefly';
export interface DailyVignette { index:number; kind:VignetteKind }

/** One harmless visual cameo at an actual visible quiet target, not another action. */
export function planDailyVignette(day:DayResult):DailyVignette|undefined {
 if(day.receipts.some(receipt=>receipt.events.some(event=>event.kind==='weather')))return;
 const profile=deriveIndividuality(day.finalState.seed),daily=dayInclination(day.finalState.seed,day.day);
 const candidates:number[]=[];let episodes:readonly Episode[]=[];
 for(let index=0;index<day.receipts.length;){
  const receipt=day.receipts[index];
  if(receipt.choice?.situation)episodes=receipt.choice.situation.episodes;
  const calm=!receipt.snapshot.conditions.some(condition=>!condition.resolved&&condition.kind!=='jitters')&&receipt.snapshot.needs.health>3000&&receipt.snapshot.needs.energy>2000&&receipt.snapshot.needs.morale>2000;
  if(calm&&isUnchangedQuietReceipt(receipt,episodes)&&(receipt.target==='window'||receipt.target==='gardenView'))candidates.push(index);
  const span=quietSpanAt(day.receipts,index);index=span?span.end:index+1;
 }
 if(!candidates.length)return;
 const score=(index:number)=>{const receipt=day.receipts[index];return hash32(`vignette-v1:${day.finalState.seed}:${day.day}:${receipt.slot}`)/4294967296+(receipt.phase===daily.phase?-.55:0)+(daily.interest==='gardening'&&receipt.target==='gardenView'?-.5:0)+(daily.interest==='exploring'&&receipt.target==='window'?-.55:0)+(profile.curiosity==='inquisitive'&&receipt.target==='window'?-.15:0);};
 const index=candidates.sort((a,b)=>score(a)-score(b))[0],receipt=day.receipts[index];
 const night=receipt.phase==='Evening'||receipt.phase==='Bedtime';
 const accent=(hash32('daily-cameo:'+day.finalState.seed)+day.day)%2;
 return {index,kind:receipt.target==='window'?(night?'window-moth':accent===(profile.curiosity==='inquisitive'?1:0)?'window-bird':'window-cloud'):night?'garden-firefly':accent?'garden-butterfly':'garden-breeze'};
}
