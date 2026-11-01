import { hash32, seedHex } from './state';
import type { Phase } from './types';

export const INDIVIDUALITY_VERSION = 'individuality-v1';
export const INTERESTS = ['cooking', 'gardening', 'making', 'comfort', 'exploring'] as const;
export type Interest = typeof INTERESTS[number];
export interface IndividualityProfile {
 interest:Interest; secondaryInterest:Interest;
 mealStyle:'simple'|'ritual'; rhythm:'early'|'late'|'unhurried';
 signature:'preen'|'perk'|'stretch'|'breathe';
 tempo:'unhurried'|'measured'|'brisk'; curiosity:'reserved'|'inquisitive';
 resourceStyle:'save-specials'|'experiment';
}
export interface DayInclination { interest:Interest; phase:Phase }
const draw=(seed:string,label:string)=>hash32(`${INDIVIDUALITY_VERSION}:${seedHex(seed)}:${label}`);
const choose=<T>(values:readonly T[],value:number):T=>values[value%values.length]!;

/** Stable birth-seed preferences, independent of owner, name, viewing and saves. */
export function deriveIndividuality(seed:string):IndividualityProfile {
 const interest=choose(INTERESTS,draw(seed,'interest'));
 return {
  interest,secondaryInterest:choose(INTERESTS.filter(value=>value!==interest),draw(seed,'secondary')),
  mealStyle:choose(['simple','ritual'] as const,draw(seed,'meal')),
  rhythm:choose(['early','late','unhurried'] as const,draw(seed,'rhythm')),
  signature:choose(['preen','perk','stretch','breathe'] as const,draw(seed,'signature')),
  tempo:choose(['unhurried','measured','brisk'] as const,draw(seed,'tempo')),
  curiosity:choose(['reserved','inquisitive'] as const,draw(seed,'curiosity')),
  resourceStyle:choose(['save-specials','experiment'] as const,draw(seed,'resources')),
 };
}

/** A rotating soft inclination, not a new objective, offered action or reward. */
export function dayInclination(seed:string,day:number):DayInclination {
 const profile=deriveIndividuality(seed);
 const remaining=INTERESTS.filter(interest=>interest!==profile.interest&&interest!==profile.secondaryInterest)
  .sort((a,b)=>draw(seed,'daily-order:'+a)-draw(seed,'daily-order:'+b)||(a<b?-1:1));
 const order=[profile.interest,profile.secondaryInterest,...remaining];
 const index=Math.max(1,Math.floor(Number.isFinite(day)?day:1))-1;
 const phases:readonly Phase[]=profile.rhythm==='early'?['Dawn','Morning','Midday']:profile.rhythm==='late'?['Afternoon','Evening']:['Morning','Midday','Afternoon','Evening'];
 return {interest:order[index%order.length]!,phase:choose(phases,draw(seed,'daily-phase:'+index))};
}
