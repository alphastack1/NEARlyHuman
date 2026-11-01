import type { GameState, TargetId } from '../domain/types';
import type { RoosterPose } from '../art/rooster';

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

/** Read-only physical mannerisms. The caller's frozen world clock freezes them. */
export function samplePersonality(context:PersonalityContext):PersonalityFrame {
 const {state,mode}=context,baseFacing=face(context.facing);
 if(!state.alive)return {pose:'dead',facing:baseFacing};
 if(mode==='sleep')return {pose:'sleep',facing:baseFacing};
 const identity=cosmeticHash(context.seed),moment=cosmeticHash(`${context.seed}:${context.activityKey??''}:${context.target??''}`);
 const cycle=6200+identity%2300,at=positiveMod(Math.max(0,context.clockMs)+moment%cycle,cycle);
 const tired=state.needs.energy<3000;
 let pose:RoosterPose='idle',facing=baseFacing;
 // Several still beats separate movements; a new target/slot does not restart
 // the same globally synchronized four-frame performance for every rooster.
 if(at<100||at>cycle-80)pose='blink';
 else if(at>620&&at<1020)pose=tired?'doze':'breathe';
 else if(at>1810&&at<2180){
  pose=tired?'doze':identity%3===0?'preen':identity%3===1?'perk':'breathe';
  // An absolute look direction also stays stable if the renderer feeds its
  // previous frame's facing back into this pure sampler.
  if(!tired&&identity%3===1)facing=identity%2?-1:1;
 }else if(at>3500&&at<3610)pose='blink';
 else if(at>4620&&at<5000)pose=tired?'doze':mode==='seated'?'breathe':identity%2?'stretch':'preen';
 else if(at>5360&&at<5500&&identity%2===0)pose='blink';
 return {pose,facing};
}

/** A glance at a care-screen tap, not a command, wake-up or model decision. */
export function sampleAttention(context:AttentionContext):PersonalityFrame|undefined {
 const {elapsedMs,state}=context;
 if(!state.alive||elapsedMs<0||elapsedMs>=NPC_ATTENTION_MS)return;
 const baseFacing=face(context.facing);
 if(context.sleeping)return {pose:elapsedMs>=80&&elapsedMs<600?'peek':'sleep',facing:baseFacing};
 const facing=context.toward===undefined?baseFacing:face(context.toward);
 return {pose:elapsedMs<160?'perk':elapsedMs<250?'blink':elapsedMs>650&&elapsedMs<800?'breathe':'idle',facing};
}
