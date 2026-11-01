import { CONDITION_IDS, ITEM_IDS, MAX_NEED, RULES_VERSION, type Condition, type ConditionId, type GameState, type Identity, type Inventory, type Needs, type Plot, type Stats } from './types';

export function cloneState<T>(value:T):T { return JSON.parse(JSON.stringify(value)) as T; }
export function seedHex(seed:string|number|bigint):string {
  try { return '0x'+BigInt(seed).toString(16).padStart(64,'0').slice(-64); }
  catch { return '0x'+hash32(String(seed)).toString(16).padStart(64,'0'); }
}
export function hash32(value:string):number { let h=2166136261; for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);return(h^(h>>>16))>>>0; }
/** Labeled draws are independent of renderer frames, candidate telemetry and retries. */
export function randomAt(seed:string,day:number,slot:number,label:string):number { return hash32(`${seed}:${day}:${slot}:${label}`)/4294967296; }
export function deriveDaySeed(seed:string,day:number):string { return seedHex(hash32(`${seedHex(seed)}:day:${day}:rules:${RULES_VERSION}`)); }
export function normalizeName(value:string):string { const name=value.trim().toUpperCase();if(!/^[A-Z0-9 ]{1,8}$/.test(name))throw Error('Use 1–8 letters, numbers or spaces.');return name; }
export function validateStats(stats:Stats):void { if(![stats.body,stats.wits,stats.spirit].every(n=>Number.isInteger(n)&&n>=0&&n<=5)||stats.body+stats.wits+stats.spirit!==5)throw Error('Allocate exactly five points.'); }
export function emptyPlot():Plot { return{plant:null,growth:0,moisture:0,dryDays:0,soilBlocked:false,pendingBonus:false}; }
export function starterGifts(seed:string|number|bigint):Array<'toolkit'|'umbrella'|'soap'|'bandage'|'compost'> {
  const remaining:Array<'toolkit'|'umbrella'|'soap'|'bandage'|'compost'>=['toolkit','umbrella','soap','bandage','compost'];const selected:typeof remaining=[];const n=BigInt(seedHex(seed));
  for(let i=0;i<3;i++){const index=Number((n>>BigInt(i*8))&255n)%remaining.length;selected.push(remaining.splice(index,1)[0]!);}return selected;
}
export function createInitialState(seed:string|number|bigint,stats:Stats={body:2,wits:2,spirit:1},name='BOK'):GameState {
  validateStats(stats);const inventory=Object.fromEntries(ITEM_IDS.map(id=>[id,0])) as Inventory;inventory.bread=3;inventory.water=3;for(const id of starterGifts(seed))inventory[id]++;
  return{version:RULES_VERSION,seed:seedHex(seed),name:normalizeName(name),stats:{...stats},day:0,level:0,alive:true,needs:{health:10000,nutrition:8000,hydration:8000,energy:8000,morale:8000},inventory,conditions:[],plots:[emptyPlot(),emptyPlot()],house:{mess:0,damage:{stove:false,window:false,chair:false},chairLife:0,chairAnchor:0,shelterLife:0,umbrellaLife:[0,0],stovePatch:0,windowPatch:0,chairBrace:false,windowBrace:false,dripDiverted:false,backupHeat:false,powerOut:false,fire:'none'},recent:[]};
}
export function condition(state:GameState,kind:ConditionId):Condition|undefined { return state.conditions.find(c=>c.kind===kind&&!c.resolved); }
export function isActive(state:GameState,kind:ConditionId):boolean { return!!condition(state,kind); }
export function derivedConditions(state:GameState):Array<'exhausted'|'despondent'> { return[...(state.needs.energy===0?['exhausted' as const]:[]),...(state.needs.morale===0?['despondent' as const]:[])]; }
export function clampNeed(value:number):number { return Math.max(0,Math.min(MAX_NEED,Math.round(value))); }
export function changeNeed(state:GameState,need:keyof Needs,delta:number):void { state.needs[need]=clampNeed(state.needs[need]+delta); }
export function resolved(state:GameState,kind:ConditionId):void { const c=state.conditions.find(c=>c.kind===kind);if(c)c.resolved=true; }
export function assertState(state:GameState):void {
  if(state.version!==RULES_VERSION)throw Error('Unsupported rules version.');validateStats(state.stats);
  for(const v of Object.values(state.needs))if(!Number.isInteger(v)||v<0||v>MAX_NEED)throw Error('Invalid need value.');
  for(const id of ITEM_IDS)if(!Number.isInteger(state.inventory[id])||state.inventory[id]<0||state.inventory[id]>65535)throw Error('Invalid stored quantity.');
  if(state.conditions.length>CONDITION_IDS.length||new Set(state.conditions.map(c=>c.kind)).size!==state.conditions.length)throw Error('Invalid condition records.');
  if(!Number.isInteger(state.day)||state.day<0||state.day>0xffffffff||!Number.isInteger(state.level)||state.level<0||state.level>state.day)throw Error('Invalid day counters.');
  if(state.plots.length!==2)throw Error('A home has two garden plots.');
}
export function validateDelivery(state:GameState,delivery:readonly string[]):asserts delivery is readonly (typeof ITEM_IDS[number])[] {
  if(!state.alive)throw Error('This life has ended.');if(delivery.length>3||new Set(delivery).size!==delivery.length)throw Error('Choose up to three different supplies.');
  for(const id of delivery){if(!(ITEM_IDS as readonly string[]).includes(id))throw Error('Unknown supply.');if(state.inventory[id as keyof Inventory]>=65535)throw Error('That supply is already full.');}
  if(state.day===0&&delivery.length)throw Error('Day one uses the original starter supplies.');
}
export const ITEM_CATALOG = [
  {id:'water',name:'Water',icon:'💧',uses:'Drink · water a plot · douse a small fire',direct:'Hydration +50'},
  {id:'milk',name:'Milk',icon:'🥛',uses:'Drink · comfort bowl · milk coffee · diversion',direct:'Food +25 · water +30'},
  {id:'bread',name:'Bread',icon:'🥖',uses:'Eat · toast · bowl · sandwich · diversion',direct:'Nutrition +40'},
  {id:'steak',name:'Steak',icon:'🥩',uses:'Cook · sandwich · emergency raw · diversion',direct:'Cook for nutrition'},
  {id:'medicine',name:'Medicine',icon:'✚',uses:'Treat one Illness or Infection',direct:'Health +15 with treatment'},
  {id:'coffee',name:'Coffee',icon:'☕',uses:'Quick drink · ritual · add milk',direct:'Energy +20 · Jitters'},
  {id:'wood',name:'Wood',icon:'🪵',uses:'Build · temporary patch · backup heat',direct:'Single-use material'},
  {id:'toolkit',name:'Hammer & Nails',icon:'🔨',uses:'Repair · build with wood · brace a window',direct:'Consumed when used'},
  {id:'umbrella',name:'Umbrella',icon:'☂',uses:'Weather cover · divert a drip · cover one plot',direct:'One protection use'},
  {id:'rose_seeds',name:'Rose Seeds',icon:'🌹',uses:'Plant a rose · divert a seed-eater',direct:'Harvest later for morale'},
  {id:'apple_seeds',name:'Apple Seeds',icon:'🌱',uses:'Plant an apple · divert a seed-eater',direct:'Harvest later for food'},
  {id:'matches',name:'Matches',icon:'🔥',uses:'Backup heat with wood at an unpowered stove',direct:'Single-use ignition'},
  {id:'soap',name:'Soap',icon:'🧼',uses:'Deep-clean mess · wash one contamination',direct:'Does not cure disease'},
  {id:'bandage',name:'Bandage',icon:'🩹',uses:'Treat wound · brace chair · divert drip',direct:'Health +15 with treatment'},
  {id:'compost',name:'Compost',icon:'🌿',uses:'Fertilize a plant OR restore blocked soil',direct:'One use, one effect'}
] as const;
export function withIdentity(state:GameState,identity:Identity):GameState {return{...state,seed:seedHex(identity.seed),name:normalizeName(identity.name||'BOK'),stats:identity.stats||{body:2,wits:2,spirit:1}};}
