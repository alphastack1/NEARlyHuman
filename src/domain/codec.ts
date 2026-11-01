import { ACTION_IDS, CONDITION_IDS, ITEM_IDS, TARGET_IDS, type ActionId, type DeathCause, type GameState, type Identity, type Receipt, type RecentAction } from './types';
import { assertState, createInitialState, seedHex } from './state';

export const STATE_BYTES=192;
export const DEATH_CAUSES:ReadonlyArray<DeathCause|undefined>=[undefined,'health','starvation','dehydration','wound','illness','infection','structural'];
export const VARIANT_IDS=['default','toast','cookSteak','bowl','sandwich','ritual','milkCoffee','rawSteak','water','milk','bread','quickCoffee','illness','infection','wound','bed','base','garden','chair','tidy','deepClean','surface','body','stove','window','chairA','chairB','shelter','umbrella','bandage','rose','apple','fertilize','restore','harvest','abandon','seedEater','visitor','idle','steak'] as const;
export const OUTCOME={success:1,mess:2,wound:4,surfaceContamination:8,fire:16,illness:32,bodyContamination:64,terminal:128} as const;
export function bytesToHex(bytes:Uint8Array):`0x${string}` {return('0x'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')) as `0x${string}`;}
export function hexToBytes(hex:string):Uint8Array {if(!/^0x(?:[0-9a-f]{2})*$/i.test(hex))throw Error('Invalid byte encoding.');return Uint8Array.from(hex.slice(2).match(/../g)||[],b=>parseInt(b,16));}
function actionBytes(record:RecentAction,outcome=record.success?1:0):number[] {const a=ACTION_IDS.indexOf(record.action);const t=TARGET_IDS.indexOf(record.target);const v=(VARIANT_IDS as readonly string[]).indexOf(record.variant);if(a<0||t<0||v<0)throw Error('Unsupported history record.');return[a+1,t,v,outcome];}
export function encodeHistory(receipts:Receipt[]):`0x${string}` {if(receipts.length>60)throw Error('History exceeds a day.');return bytesToHex(Uint8Array.from(receipts.flatMap(r=>actionBytes(r,r.outcome))));}
export function decodeHistory(hex:string):Array<RecentAction&{outcome:number}> {const b=hexToBytes(hex);if(b.length%4||b.length>240)throw Error('Invalid day history.');const out:Array<RecentAction&{outcome:number}>=[];for(let i=0;i<b.length;i+=4){const action=ACTION_IDS[b[i]!-1],target=TARGET_IDS[b[i+1]!],variant=VARIANT_IDS[b[i+2]!];if(!action||!target||!variant)throw Error('Unknown history code.');out.push({action,target,variant,success:!!(b[i+3]!&1),outcome:b[i+3]!});}return out;}
export function packState(state:GameState):`0x${string}` {
  assertState(state);const b=new Uint8Array(STATE_BYTES);const d=new DataView(b.buffer);b[0]=1;b[1]=state.alive?1:0;b[2]=DEATH_CAUSES.indexOf(state.deathCause);b[3]=(state.deathContributors||[]).reduce((mask,c)=>mask|(1<<(DEATH_CAUSES.indexOf(c)-1)),0);
  d.setUint32(4,state.day,true);d.setUint32(8,state.level,true);(['health','nutrition','hydration','energy','morale'] as const).forEach((k,i)=>d.setUint16(12+i*2,state.needs[k],true));ITEM_IDS.forEach((k,i)=>d.setUint16(22+i*2,state.inventory[k],true));
  CONDITION_IDS.forEach((kind,i)=>{const c=state.conditions.find(c=>c.kind===kind);if(c){const o=52+i*10;b[o]=c.severity;b[o+1]=c.resolved?1:0;d.setUint32(o+2,c.onsetDay,true);d.setUint32(o+6,c.dueDay,true);}});
  state.plots.forEach((p,i)=>{const o=132+i*6;b[o]=p.plant==='rose'?1:p.plant==='apple'?2:0;b[o+1]=p.growth;b[o+2]=p.moisture;b[o+3]=p.dryDays;b[o+4]=p.soilBlocked?1:0;b[o+5]=p.pendingBonus?1:0;});
  const h=state.house;b[144]=h.mess;b[145]=(h.damage.stove?1:0)|(h.damage.window?2:0)|(h.damage.chair?4:0);b.set([h.chairLife,h.chairAnchor,h.shelterLife,...h.umbrellaLife,h.stovePatch,h.windowPatch,+h.chairBrace,+h.windowBrace,+h.dripDiverted,+h.backupHeat,+h.powerOut,h.fire==='flame'?1:h.fire==='smoke'?2:0],146);
  state.recent.slice(-6).forEach((r,i)=>b.set(actionBytes(r),160+i*4));return bytesToHex(b);
}
export function unpackState(input:string|Uint8Array,identity:Identity={seed:'0x0'}):GameState {
  const b=typeof input==='string'?hexToBytes(input):input;if(b.length!==STATE_BYTES||b[0]!==1)throw Error('Unsupported save encoding.');const d=new DataView(b.buffer,b.byteOffset,b.byteLength);const s=createInitialState(identity.seed,identity.stats,identity.name);s.seed=seedHex(identity.seed);s.day=d.getUint32(4,true);s.level=d.getUint32(8,true);s.alive=b[1]===1;s.deathCause=DEATH_CAUSES[b[2]!];s.deathContributors=DEATH_CAUSES.slice(1).filter((_,i)=>!!(b[3]!&(1<<i))) as DeathCause[];
  (['health','nutrition','hydration','energy','morale'] as const).forEach((k,i)=>s.needs[k]=d.getUint16(12+i*2,true));ITEM_IDS.forEach((k,i)=>s.inventory[k]=d.getUint16(22+i*2,true));s.conditions=[];
  CONDITION_IDS.forEach((kind,i)=>{const o=52+i*10;if(b[o])s.conditions.push({kind,severity:b[o]===2?2:1,resolved:!!(b[o+1]!&1),onsetDay:d.getUint32(o+2,true),dueDay:d.getUint32(o+6,true)});});
  s.plots=s.plots.map((_,i)=>{const o=132+i*6;return{plant:b[o]===1?'rose':b[o]===2?'apple':null,growth:b[o+1]!,moisture:b[o+2]!,dryDays:b[o+3]!,soilBlocked:!!b[o+4],pendingBonus:!!b[o+5]};}) as GameState['plots'];
  const h=s.house;h.mess=Math.min(2,b[144]!) as 0|1|2;h.damage={stove:!!(b[145]!&1),window:!!(b[145]!&2),chair:!!(b[145]!&4)};h.chairLife=b[146]!;h.chairAnchor=b[147]===1?1:0;h.shelterLife=b[148]!;h.umbrellaLife=[b[149]!,b[150]!];h.stovePatch=b[151]!;h.windowPatch=b[152]!;h.chairBrace=!!b[153];h.windowBrace=!!b[154];h.dripDiverted=!!b[155];h.backupHeat=!!b[156];h.powerOut=!!b[157];h.fire=b[158]===1?'flame':b[158]===2?'smoke':'none';s.recent=[];
  for(let i=0;i<6;i++){const o=160+i*4;if(!b[o])continue;const action=ACTION_IDS[b[o]!-1],target=TARGET_IDS[b[o+1]!],variant=VARIANT_IDS[b[o+2]!];if(action&&target&&variant)s.recent.push({action,target,variant,success:!!(b[o+3]!&1)});}assertState(s);return s;
}
export function initialPackedState(seed:string|number|bigint,stats={body:2,wits:2,spirit:1},name='BOK'):`0x${string}` {return packState(createInitialState(seed,stats,name));}
export const actionCode=(id:ActionId)=>ACTION_IDS.indexOf(id)+1;
