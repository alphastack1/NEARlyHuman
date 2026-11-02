export const RULES_VERSION = 1 as const;
export const MAX_NEED = 10_000;
export const ITEM_IDS = ['water','milk','bread','steak','medicine','coffee','wood','toolkit','umbrella','rose_seeds','apple_seeds','matches','soap','bandage','compost'] as const;
export type ItemId = typeof ITEM_IDS[number];
export type Inventory = Record<ItemId, number>;
export interface Stats { body:number; wits:number; spirit:number }
export interface Needs { health:number; nutrition:number; hydration:number; energy:number; morale:number }
export const CONDITION_IDS = ['foodDeficit','waterDeficit','wound','illness','infection','jitters','contaminatedBody','contaminatedSurface'] as const;
export type ConditionId = typeof CONDITION_IDS[number];
export interface Condition { kind:ConditionId; severity:1|2; onsetDay:number; dueDay:number; resolved?:boolean }
export interface Plot { plant:'rose'|'apple'|null; growth:number; moisture:number; dryDays:number; soilBlocked:boolean; pendingBonus:boolean }
export type FixtureId = 'stove'|'window'|'chair';
export interface HouseState {
  mess:0|1|2;
  damage:Record<FixtureId,boolean>;
  chairLife:number; chairAnchor:0|1; shelterLife:number;
  umbrellaLife:[number,number]; stovePatch:number; windowPatch:number;
  chairBrace:boolean; windowBrace:boolean; dripDiverted:boolean;
  backupHeat:boolean; powerOut:boolean; fire:'none'|'flame'|'smoke';
}
export type DeathCause = 'health'|'starvation'|'dehydration'|'wound'|'illness'|'infection'|'structural';
export interface RecentAction { action:ActionId; target:TargetId; variant:string; success:boolean }
export interface GameState {
  version:typeof RULES_VERSION;
  seed:string; name:string; stats:Stats;
  /** Completed day in canonical saves, current day in provisional receipt snapshots. */
  day:number; level:number; alive:boolean; deathCause?:DeathCause; deathContributors?:DeathCause[];
  needs:Needs; inventory:Inventory; conditions:Condition[];
  plots:[Plot,Plot]; house:HouseState; recent:RecentAction[];
}
export const ACTION_IDS = ['K01','K02','K03','K04','K05','K06','K07','H01','H02','H03','H04','H05','H06','H07','H08','H09','H10','H11','H12','H13','H14','H15','H16','H17','H18','H19','G01','G02','G03','G04','G05','G06','G07','H20','T01'] as const;
export type ActionId = typeof ACTION_IDS[number];
export const TARGET_IDS = ['store','prep','stove','window','bed','baseSeat','chair','chairA','chairB','cupboard','body','surface','plot1','plot2','gardenShelter','gardenView','pest','cutoff','mailbox','hall'] as const;
export type TargetId = typeof TARGET_IDS[number];
export const PHASES = ['Dawn','Morning','Midday','Afternoon','Evening','Bedtime'] as const;
export type Phase = typeof PHASES[number];
export interface Candidate {
  key:string; action:ActionId; target:TargetId; variant:string; label:string; description:string;
  inputs:Partial<Inventory>; energy:number; successChance:number; urgent?:boolean; dueDay?:number; dueSlot?:number;
  /** Mechanical risk, separate from model choice probability. */
  possibleFailures:string[];
  /** Query-only day-plan option. Its action key remains a normal legal action. */
  plan?:{kind:'project'|'unhurried';actionKey:string;scheduledSlot:number};
}
export interface DecisionSituation { episodes:Episode[]; restUses:number; leisureUses:number; lastRest:number; lastLeisure:number; chairMoved:boolean; minorUsed:boolean }
export interface ChoiceContext { state:GameState; day:number; slot:number; phase:Phase; candidates:Candidate[]; recent:RecentAction[]; situation:DecisionSituation;
  /** Exact completed nonquiet receipts earlier this day; presentation is not memory. */
  earlierToday?:RecentAction[];
  mode?:'day-plan'|'routine'; morningOptions?:MorningOption[];
  dailyFocus?:{label:string;key:string;status:DailyFocus['status'];scheduledSlot:number};
  pendingDelivery?:ItemId[];
}
export interface ModelChoice { key:string; probabilities?:Record<string,number>; provider?:string; model?:string; requestId?:string; usage?:unknown; morningKey?:string;morningProbabilities?:Record<string,number> }
export type ChoiceProvider = (context:ChoiceContext) => Promise<ModelChoice|string>;
export interface MorningOption {key:string;label:string;beforeActionKey?:string}
export interface RecordedChoice {selected:string;candidates:Candidate[];probabilities?:Record<string,number>;provider?:string;model?:string;requestId?:string;situation?:DecisionSituation}
export interface DailyFocus {
  version:1;kind:'project'|'unhurried';
  goal:{key:string;action:ActionId;target:TargetId;variant:string;label:string;inputs:Partial<Inventory>};
  scheduledSlot:number;status:'planned'|'completed'|'failed'|'unavailable';attemptedSlot?:number;completedSlot?:number;
  morning:MorningOption&{attemptedSlot?:number;skipped?:boolean};choice?:RecordedChoice;
  morningChoice?:{selected:string;candidates:MorningOption[];probabilities?:Record<string,number>;provider?:string;model?:string;requestId?:string};
}
export interface StateChange { field:string; before:number|string|boolean|null; after:number|string|boolean|null }
export interface RecordedEvent { kind:string; target?:TargetId; message:string; source?:string }
export interface Receipt {
  index:number; day:number; slot:number; phase:Phase;
  action:ActionId; actionId:ActionId; target:TargetId; variant:string; label:string;
  inputs:Partial<Inventory>; success:boolean; outcome:number;
  message:string; lines:[string,string]; events:RecordedEvent[]; changes:StateChange[];
  before:GameState; decisionSnapshot?:GameState; snapshot:GameState;
  choice?:RecordedChoice;
  role?:'focus'|'delivery'|'routine'|'interlude';plan?:'morning'|'focus'|'delivery';
}
export type EpisodeKind = 'quiet'|'rain'|'fire'|'outage'|'seedEater'|'visitor'|'fixtureBreak'|'mishap'|'sickness'|'mood'|'washout';
export interface Episode { kind:EpisodeKind; startSlot:number; boundary:number; target:TargetId; resolved:boolean; stock?:ItemId; shooTried?:boolean; exposureCovered?:boolean; lossDiverted?:boolean }
export interface DayContext {
  state:GameState; day:number; slot:number; seed:string;
  restUses:number; leisureUses:number; lastRest:number; lastLeisure:number; chairMoved:boolean;
  minorUsed:boolean; primary?:Episode; primaryIntroduced:boolean; primarySlot:number;
  taskFire?:Episode; events:RecordedEvent[]; modelChoices:number;
  dailyFocus?:DailyFocus;pendingDelivery?:ItemId[];deliveryCollectedSlot?:number;deliverySettled?:'collected'|'estate';
  morningActionDone?:boolean;routineAnchor?:TargetId;
}
export interface DayCheckpoint { context:DayContext; receipts:Receipt[] }
export interface PrepareOptions {
  onCheckpoint?:(checkpoint:DayCheckpoint)=>Promise<void>|void;
  resume?:DayCheckpoint;
  /** Explicit operator/rules parameters, never mint-age death schedules. */
  incidentRate?:number; blackSwanRate?:number;
  /** Canonical accepted request seed when provided by the chain adapter. */
  daySeed?:string;
}
export interface DayResult { version:1; day:number; baseDay:number; survived:boolean; finalState:GameState; state:GameState; receipts:Receipt[]; decisions:number; history:string; delivery:ItemId[]; summary:string[];dailyFocus?:DailyFocus;startTarget?:TargetId;deliveryCollectedSlot?:number;deliverySettled?:'collected'|'estate' }
export interface Identity { seed:string|bigint|number; name?:string; stats?:Stats }
