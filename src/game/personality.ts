import type { GameState, TargetId } from '../domain/types';
import type { RoosterPose } from '../art/rooster';
import { deriveIndividuality, dayInclination } from '../domain/individuality';

export type PersonalityMode = 'quiet' | 'seated' | 'awake' | 'sleep';
export type Facing = 1 | -1;
export interface PersonalityFrame { pose:RoosterPose; facing:Facing }
export interface PersonalityContext {
 seed:string;
 clockMs:number;
 mode:PersonalityMode;
 state:GameState;
 facing:number;
 target?:TargetId;
 /** A recorded day/slot or another presentation identity, never a random draw. */
 activityKey?:string|number;
 /** Time at this recorded contact. It does not advance the simulation. */
 activityMs?:number;
}
export interface AttentionContext {
 elapsedMs:number;
 state:GameState;
 sleeping:boolean;
 facing:number;
 toward?:number;
}

export const NPC_ATTENTION_MS=900;
export const NPC_ATTENTION_COOLDOWN_MS=1100;
const face=(value:number):Facing=>value<0?-1:1;
const positiveMod=(value:number,modulo:number)=>((value%modulo)+modulo)%modulo;
function cosmeticHash(text:string):number {
 let value=2166136261;
 for(let i=0;i<text.length;i++)value=Math.imul(value^text.charCodeAt(i),16777619);
 return value>>>0;
}

/** Physical cadence only: distance, routes and action impact times stay fixed. */
export function physicalCadence(seed:string):{stepMs:number;workMs:number} {
 const tempo=deriveIndividuality(seed).tempo;
 return tempo==='unhurried'?{stepMs:134,workMs:292}:tempo==='brisk'?{stepMs:88,workMs:176}:{stepMs:110,workMs:230};
}

export function settlePose(state:GameState):RoosterPose {
 if(!state.alive)return'dead';
 if(state.needs.energy<3000||state.needs.health<3000)return'doze';
 return deriveIndividuality(state.seed).signature;
}

/** Read-only physical mannerisms. The caller's frozen world clock freezes them. */
export function samplePersonality(context:PersonalityContext):PersonalityFrame {
 const {state,mode}=context,baseFacing=face(context.facing);
 if(!state.alive)return {pose:'dead',facing:baseFacing};
 if(mode==='sleep')return {pose:'sleep',facing:baseFacing};
 const profile=deriveIndividuality(context.seed),daily=dayInclination(context.seed,state.day),identity=cosmeticHash(context.seed),moment=cosmeticHash(`${context.seed}:${context.activityKey??''}:${context.target??''}`);
 const contact=context.activityMs;
 const cycle=(profile.tempo==='unhurried'?8600:profile.tempo==='brisk'?5800:7200)+identity%1100,at=positiveMod(Math.max(0,contact??context.clockMs)+moment%cycle,cycle);
 const tired=state.needs.energy<3000||state.needs.health<3000;
 let pose:RoosterPose='idle',facing=baseFacing;
 // A signature is a stable physical habit; the recorded day's soft inclination
 // spaces its occasional contact beat without inventing another activity.
 if(contact!==undefined&&(mode==='quiet'||mode==='seated')&&contact<1650){
  const start=340+moment%150,duration=profile.tempo==='unhurried'?540:profile.tempo==='brisk'?350:440;
  const gestures=[profile.signature,'preen','stretch'] as const;
  if(contact>=start&&contact<start+duration)pose=tired?'doze':gestures[moment%gestures.length];
  else if(contact>=start+duration&&contact<start+duration+100)pose='blink';
  return{pose,facing:baseFacing};
 }
 if(at<100||at>cycle-80)pose='blink';
 else if(at>620&&at<(profile.tempo==='unhurried'?1200:980))pose=tired?'doze':'breathe';
 else if(at>1810&&at<(profile.tempo==='unhurried'?2460:2220)){
  pose=tired?'doze':profile.signature;
  if(!tired&&profile.curiosity==='inquisitive')facing=identity%2?-1:1;
 }else if(at>3500&&at<3610)pose='blink';
 else if(at>4620&&at<5030)pose=tired?'doze':mode==='seated'?'breathe':daily.interest==='comfort'?'breathe':profile.signature==='preen'?'stretch':'preen';
 else if(at>5360&&at<5500&&profile.curiosity==='inquisitive')pose='blink';
 return {pose,facing};
}

/** A glance at a care-screen tap, not a command, wake-up or model decision. */
export function sampleAttention(context:AttentionContext):PersonalityFrame|undefined {
 const {elapsedMs,state}=context;
 if(!state.alive||elapsedMs<0||elapsedMs>=NPC_ATTENTION_MS)return;
 const baseFacing=face(context.facing);
 const profile=deriveIndividuality(state.seed);
 if(context.sleeping){const peeking=profile.curiosity==='inquisitive'?(elapsedMs>=80&&elapsedMs<340||elapsedMs>=430&&elapsedMs<740):elapsedMs>=120&&elapsedMs<580;return {pose:peeking?'peek':'sleep',facing:baseFacing};}
 const facing=context.toward===undefined?baseFacing:face(context.toward);
 const quiet=state.needs.energy<3000||state.needs.health<3000;
 return {pose:elapsedMs<160?quiet?'doze':'perk':elapsedMs<250?'blink':elapsedMs<620?quiet?'doze':profile.signature:elapsedMs<800?'breathe':'idle',facing};
}
