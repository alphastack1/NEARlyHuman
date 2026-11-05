import {MAX_NEED,MAX_STOCK,VERSION,ITEMS,type State,type Identity,type Plot,type Condition} from './types';
import {PLANTS} from './catalog';
export const clone=<T>(v:T):T=>structuredClone(v);
export function seedHex(value:string|number|bigint):`0x${string}` {const n=BigInt(value);if(n<0n||n>=1n<<256n)throw Error('Seed outside bytes32.');return `0x${n.toString(16).padStart(64,'0')}`;}
export function hash32(value:string):number {let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);return(h^(h>>>16))>>>0;}
export const draw=(seed:string,day:number,slot:number,label:string):number=>hash32(`${seed}:${day}:${slot}:${label}`);
export const chance=(seed:string,day:number,slot:number,label:string,bps:number):boolean=>BigInt(draw(seed,day,slot,label))*10000n<BigInt(bps)*4294967296n;
export const emptyCondition=():Condition=>({severity:0,onsetDay:0,dueDay:0,resolved:false});
export const emptyPlot=(soilBlocked=false):Plot=>({kind:0,ticks:0,left:0,moisture:0,dry:0,soilBlocked});
export function createState(identity:Identity):State {
 const stats=[...(identity.stats||[2,2,1])];if(stats.length!==3||stats.some(n=>!Number.isInteger(n)||n<0||n>5)||stats.reduce((a,b)=>a+b,0)!==5)throw Error('Allocate exactly five points.');
 const s:State={version:VERSION,seed:seedHex(identity.seed),day:0,level:0,alive:true,deathCause:0,stats,needs:[10000,8000,8000,8000,8000],inventory:Array(34).fill(0),conditions:Array.from({length:8},emptyCondition),plots:Array.from({length:4},()=>emptyPlot()),house:{mess:0,damage:0,chairLife:0,chairAnchor:0,shelterLife:0,umbrellaLife:[0,0,0,0],stovePatch:0,windowPatch:0,chairBrace:false,windowBrace:false,dripDiverted:false,backupHeat:false,powerOut:false,fire:0},goal:0,goalCreatedDay:0,goalReviewDay:0,recent:Array(6).fill(0)};
 s.inventory[0]=3;s.inventory[2]=3;return s;
}
const uint=(n:number,max:number)=>Number.isInteger(n)&&n>=0&&n<=max;
export function assertState(s:State,provisional=false):void {
 if(s.version!==2||!/^0x[0-9a-f]{64}$/.test(s.seed))throw Error('Unsupported V2 state.');
 if(!uint(s.day,MAX_STOCK)||!uint(s.level,s.day)||!provisional&&s.alive&&s.level!==s.day)throw Error('Invalid day counters.');
 if(s.stats.length!==3||Array.from(s.stats).some(n=>!uint(n,5))||s.stats.reduce((a,b)=>a+b,0)!==5)throw Error('Invalid stats.');
 if(s.needs.length!==5||Array.from(s.needs).some(n=>!uint(n,MAX_NEED))||s.alive&&s.needs[0]===0)throw Error('Invalid needs.');
 if(s.inventory.length!==34||Array.from(s.inventory).some(n=>!uint(n,MAX_STOCK)))throw Error('Invalid stock.');
 if(typeof s.alive!=='boolean'||!uint(s.deathCause,7)||s.alive&&s.deathCause!==0||!s.alive&&s.deathCause===0)throw Error('Invalid life status.');
 if(s.conditions.length!==8)throw Error('Invalid conditions.');
 Array.from(s.conditions).forEach((c,i)=>{if(!c||!uint(c.severity,2)||!uint(c.onsetDay,s.day)||!uint(c.dueDay,MAX_STOCK)||typeof c.resolved!=='boolean'||!c.severity&&(c.onsetDay!==0||c.dueDay!==0||c.resolved)||c.severity&&i<5&&c.dueDay===0)throw Error('Invalid condition.');});
 if(s.plots.length!==4)throw Error('Four beds required.');
 for(const p of s.plots){if(!p)throw Error('Invalid bed.');const spec=PLANTS[p.kind];if(!uint(p.kind,9)||!uint(p.ticks,8)||!uint(p.left,10)||!spec||!uint(p.moisture,2)||!uint(p.dry,1)||typeof p.soilBlocked!=='boolean')throw Error('Invalid bed.');if(!p.kind){if(p.ticks||p.left||p.moisture||p.dry)throw Error('Invalid empty bed.');}else if(!uint(p.left,spec.yields)||!p.left||!uint(p.ticks,p.left===spec.yields?spec.ticks:spec.repeat)||!p.ticks&&p.dry)throw Error('Invalid plant timer.');}
 const h=s.house;if(!uint(h.mess,2)||!uint(h.damage,7)||!uint(h.fire,2)||!uint(h.chairAnchor,1)||h.umbrellaLife.length!==4||Array.from(h.umbrellaLife).some(n=>!uint(n,255))||[h.chairLife,h.shelterLife,h.stovePatch,h.windowPatch].some(n=>!uint(n,255))||[h.chairBrace,h.windowBrace,h.dripDiverted,h.backupHeat,h.powerOut].some(n=>typeof n!=='boolean'))throw Error('Invalid house.');
 if(!uint(s.goal,6)||!uint(s.goalCreatedDay,s.day)||!uint(s.goalReviewDay,MAX_STOCK)||s.recent.length!==6||Array.from(s.recent).some(n=>!uint(n,38)))throw Error('Invalid memory.');
}
export function kitMask(items:readonly (number|string)[]):bigint {if(items.length>3)throw Error('Choose up to three supplies.');let mask=0n,seeds=0;for(const input of items){const id=typeof input==='number'?input:(ITEMS as readonly string[]).indexOf(input);if(!Number.isInteger(id)||id<0||id>21||id===6)throw Error('That item is not a supply.');const bit=1n<<BigInt(id);if(mask&bit)throw Error('Choose different supplies.');mask|=bit;if(id>=13)seeds++;}if(seeds>1)throw Error('Choose one seed or sapling.');return mask;}
export function kitItems(mask:bigint):number[]{if(mask<0n||mask>=1n<<34n)throw Error('Invalid kit mask.');const ids=ITEMS.flatMap((_,i)=>mask&(1n<<BigInt(i))?[i]:[]);if(kitMask(ids)!==mask)throw Error('Invalid kit.');return ids;}
