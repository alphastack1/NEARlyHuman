export const VERSION=2 as const;
export const MAX_NEED=10_000, MAX_STOCK=0xffff_ffff;
export const ITEMS=['water','milk','bread','steak','medicine','coffee','wood','toolkit','umbrella','matches','soap','bandage','compost','daisy_seed','marigold_seed','lavender_seed','rose_seed','strawberry_seed','blueberry_seed','grape_seed','apple_seed','sapling','daisy','marigold','lavender','rose','strawberry','blueberry','grape','apple','spoon','toy_boat','birdhouse','large_chest'] as const;
export type ItemId=typeof ITEMS[number];
export const NEEDS=['health','nutrition','hydration','energy','morale'] as const;
export const CONDITIONS=['foodDeficit','waterDeficit','wound','illness','infection','jitters','contaminatedBody','contaminatedSurface'] as const;
export const DEATH_CAUSES=['','health','starvation','dehydration','wound','illness','infection','structural'] as const;
export enum Op { Quiet,Pickup,Breakfast,Eat,Drink,Treat,Wash,Rest,Leisure,Well,Ship,Coffee,Tidy,Toast,CookSteak,Bowl,Sandwich,Repair,Plant,Harvest,Craft,RestoreSoil,BuildChair,BuildShelter,Patch,BackupHeat,MoveChair,Abandon,CoverPlot,DeepClean,QuietMain,Douse,Shutdown,BraceRain,CoverRain,Shoo,Bait,RawSteak,EnjoyFlower }
export interface Condition {severity:number;onsetDay:number;dueDay:number;resolved:boolean}
export interface Plot {kind:number;ticks:number;left:number;moisture:number;dry:number;soilBlocked:boolean}
export interface House {mess:number;damage:number;chairLife:number;chairAnchor:number;shelterLife:number;umbrellaLife:number[];stovePatch:number;windowPatch:number;chairBrace:boolean;windowBrace:boolean;dripDiverted:boolean;backupHeat:boolean;powerOut:boolean;fire:number}
export interface State {version:number;seed:`0x${string}`;day:number;level:number;alive:boolean;deathCause:number;stats:number[];needs:number[];inventory:number[];conditions:Condition[];plots:Plot[];house:House;goal:number;goalCreatedDay:number;goalReviewDay:number;recent:number[]}
export interface Step {slot:number;op:Op;arg:number;variant:number;goods:number[]}
export interface Trace {goal:number;steps:Step[]}
export interface Certificate {horizon:number;kits:bigint[];steps:Step[]}
export type EpisodeKind='quiet'|'rain'|'fire'|'outage'|'seedEater'|'visitor'|'fixtureBreak'|'mishap'|'sickness'|'mood'|'washout';
export interface Episode {kind:EpisodeKind;start:number;deadline:number;target:number;stock:number;resolved:boolean;responded:boolean;shooTried:boolean;covered:boolean;diverted:boolean}
export interface Event {kind:string;target:number;message:string;source?:string}
export interface Context {state:State;day:number;slot:number;open:boolean;beforeSlot?:State;seed:`0x${string}`;kit:bigint;shipping:boolean;pickup:boolean;ordinaryMask:number;ordinaryUses:number;mainUsed:boolean;acuteUses:number;restUses:number;leisureUses:number;lastRest:number;lastLeisure:number;minorUsed:boolean;chairMoved:boolean;shipped:boolean;points:number;primaryIntroduced:boolean;primary?:Episode;taskFire?:Episode;events:Event[];proposal?:{kind:EpisodeKind;accepted:boolean;certificate:boolean};witness:boolean}
export interface Receipt {slot:number;op:Op;arg:number;variant:number;role:'delivery'|'routine'|'main'|'acute'|'interlude';success:boolean;events:Event[];before:State;snapshot:State;points:number}
export interface DayResult {state:State;receipts:Receipt[];points:number;trace:Trace;delivery:number[];proposal?:Context['proposal']}
export interface Candidate extends Step {key:string;label:string;description:string;role:Receipt['role'];inputs:Record<string,number>;energy:number;recovery:number[];chanceBps:number;possibleFailures:string[]}
export interface Identity {seed:string|number|bigint;stats?:readonly number[];name?:string}
export const step=(slot:number,op:Op,arg=0,variant=0,goods:number[]=[]):Step=>({slot,op,arg,variant,goods:[...goods,...Array(Math.max(0,4-goods.length)).fill(0)]});
