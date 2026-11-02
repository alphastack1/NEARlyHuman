import {Op,MAX_NEED,MAX_STOCK,ITEMS,type State,type Context,type Step,type Trace,type Certificate,type Receipt,type DayResult,type Event,type Episode,type EpisodeKind,type Candidate} from './types';
import {PLANTS,RECIPES,FRUIT_EFFECTS,FLOWER_MORALE,MAIN_OPS,ACUTE_OPS,CERTIFICATE_OPS,shipmentPoints,topShipment} from './catalog';
import {clone,assertState,emptyPlot,emptyCondition,kitItems,seedHex,chance,draw} from './state';

const requireThat=(ok:unknown,message:string):void=>{if(!ok)throw Error(message);};
const ACTION_MESSAGES:Partial<Record<Op,string>>={
 [Op.Quiet]:'A quiet little moment.',[Op.Pickup]:'Collected the delivery.',[Op.Breakfast]:'Had a little breakfast.',[Op.Eat]:'Had something to eat.',[Op.Drink]:'Had a sensible little sip.',[Op.Treat]:'Took care of one thing.',[Op.Wash]:'Cleaned up.',[Op.Rest]:'Had a little rest.',[Op.Leisure]:'Sat like a human. Nearly.',[Op.Well]:'Watered the little garden.',[Op.Ship]:'Posted a little parcel.',[Op.Coffee]:'Tiny cup. Big feelings.',[Op.Tidy]:'A little less kitchen chaos.',[Op.Toast]:'Made some toast. Mostly toast.',[Op.CookSteak]:'Made a proper little meal.',[Op.Bowl]:'Made a comfort bowl.',[Op.Sandwich]:'Made a serious sandwich.',[Op.Repair]:'Fixed something in the house.',[Op.Harvest]:'Gathered what was ready.',[Op.RestoreSoil]:'The garden bed is clear again.',[Op.BuildChair]:'Built a little chair.',[Op.BuildShelter]:'Built some garden cover.',[Op.Patch]:'Made a temporary little fix.',[Op.BackupHeat]:'Lit the backup heat.',[Op.MoveChair]:'Found a new corner for the same chair.',[Op.Abandon]:'Cleared the planting.',[Op.CoverPlot]:'Covered one garden bed.',[Op.DeepClean]:'Scrubbed the kitchen.',[Op.QuietMain]:'An unhurried afternoon.',[Op.Douse]:'Doused the flare.',[Op.Shutdown]:'Turned off the stove.',[Op.BraceRain]:'Braced the storm window.',[Op.CoverRain]:'Kept out of the rain.',[Op.Shoo]:'Sent the visitor away.',[Op.Bait]:'Shared a little with the visitor.',[Op.RawSteak]:'Had some emergency food.',[Op.EnjoyFlower]:'Enjoyed a home-grown flower.'
};
const active=(s:State,id:number)=>s.conditions[id]!.severity>0&&!s.conditions[id]!.resolved;
const addEvent=(c:Context,kind:string,message:string,target=0,source?:string)=>c.events.push({kind,message,target,...(source?{source}:{})});
function change(s:State,id:number,n:number){s.needs[id]=Math.max(0,Math.min(MAX_NEED,s.needs[id]!+n));}
function clear(s:State,id:number){if(active(s,id))s.conditions[id]!.resolved=true;}
function restore(s:State,effects:readonly number[]){effects.forEach((n,i)=>{if(n)change(s,i,n);});if(s.needs[1]!>3000)clear(s,0);if(s.needs[2]!>3000)clear(s,1);}
function take(s:State,id:number,n=1){requireThat(id>=0&&id<34&&s.inventory[id]!>=n,'Not enough supplies.');s.inventory[id]!-=n;}
function give(s:State,id:number,n=1){requireThat(id>=0&&id<34&&s.inventory[id]!<=MAX_STOCK-n,'Stock is full.');s.inventory[id]!+=n;}
function condition(c:Context,id:number,severity=1,due=0):boolean{
 const old=c.state.conditions[id]!;if(old.severity){old.resolved=false;old.severity=Math.max(old.severity,severity);if(due)old.dueDay=old.dueDay?Math.min(old.dueDay,due):due;return false;}
 c.state.conditions[id]={severity,onsetDay:c.day,dueDay:due,resolved:false};addEvent(c,'condition',['Feeling very hungry.','Feeling very thirsty.','A wing needs care.','Feeling a little unwell.','The wound needs medicine.','A little jittery.','Feathers need washing.','The counter needs a wipe.'][id]||'Something needs care.',id);return true;
}
function die(c:Context,cause:number){if(!c.state.alive)return;c.state.alive=false;c.state.deathCause=cause;addEvent(c,'death',['','This life has ended.','Food ran out.','Water ran out.','The wound became fatal.','The illness became fatal.','The infection became fatal.','A freak structural accident.'][cause]||'This life has ended.',0);}
function damage(c:Context,amount:number,physical=false,cause=1){change(c.state,0,-(physical?Math.round(amount*(50-c.state.stats[0]!)/50):amount));if(!c.state.needs[0])die(c,cause);}
function moraleLoss(c:Context,n:number){change(c.state,4,-Math.round(n*(50-c.state.stats[2]!)/50));}
function infect(c:Context,id:3|4){if(condition(c,id,1,c.day+(id===3?2:1)))damage(c,1000,false,id===3?5:6);}
function wound(c:Context,severity:number){damage(c,severity===1?800:2000,true,4);if(c.state.alive)condition(c,2,severity,c.day+(severity===1?2:1));}
function heat(s:State){return s.house.fire!==1&&(!(s.house.damage&1)||s.house.stovePatch>0)&&(!s.house.powerOut||s.house.backupHeat);}
function chair(s:State){return s.house.chairLife>0&&(!(s.house.damage&4)||s.house.chairBrace);}
function energy(s:State,n:number,strict=false){requireThat(!strict||s.needs[3]!>=n,'Too tired for that project.');change(s,3,-n);}
function competence(c:Context,base:number,stove=false):number {const s=c.state,penalty=Math.min(10,(s.needs[3]===0?5:0)+(s.needs[4]===0?5:0)+(active(s,5)?5:0)+(s.house.mess===2?5:0)+(stove&&s.house.stovePatch?5:0));return Math.max(100,Math.min(9900,base+s.stats[1]!*200-penalty*100));}
export function actionChance(c:Context,a:Step):number {
 if(a.op===Op.Shoo)return Math.min(9900,7500+c.state.stats[1]!*200);
 if([Op.Toast,Op.Bowl].includes(a.op))return competence(c,9500,a.op===Op.Toast);
 if([Op.CookSteak,Op.Sandwich,Op.Repair,Op.BuildChair,Op.BuildShelter,Op.Patch,Op.BackupHeat].includes(a.op))return competence(c,9000,[Op.CookSteak,Op.Sandwich,Op.BackupHeat].includes(a.op)||[Op.Repair,Op.Patch].includes(a.op)&&a.arg===0);
 return 10000;
}
export function actionEnergy(a:Step):number {
 if([Op.Quiet,Op.Pickup,Op.Rest,Op.QuietMain].includes(a.op))return 0;
 if(a.op===Op.Breakfast)return 200;
 if([Op.Repair,Op.Plant,Op.Harvest,Op.Craft,Op.RestoreSoil,Op.BuildChair,Op.BuildShelter,Op.Patch,Op.BackupHeat,Op.MoveChair,Op.Abandon,Op.BraceRain].includes(a.op))return 300;
 return 100;
}
/** Nominal success gains, deliberately independent of the known future draw. */
export function actionRecovery(a:Step):number[]{
 const food=(id:number):number[]=>id===2?[0,4000,0,0,0]:id===1?[0,2500,3000,0,0]:FRUIT_EFFECTS[id]?[0,FRUIT_EFFECTS[id]![0],FRUIT_EFFECTS[id]![1],0,0]:[0,0,0,0,0];
 const drink=(id:number):number[]=>id===0?[0,0,5000,0,0]:id===1?[0,2500,3000,0,0]:[0,0,0,0,0];
 if(a.op===Op.Breakfast){const f=food(a.arg),d=drink(a.variant);return f.map((n,i)=>n+d[i]!);}
 if(a.op===Op.Eat)return food(a.arg);if(a.op===Op.Drink)return drink(a.arg);
 if(a.op===Op.Treat)return[1500,0,0,0,0];if(a.op===Op.Wash&&a.arg===6)return[0,0,0,0,500];
 if(a.op===Op.Rest)return[0,0,0,1200,0];if(a.op===Op.Leisure)return[0,0,0,0,a.variant===2?1500:1000];
 if(a.op===Op.Coffee)return a.variant===0?[0,0,0,2000,500]:a.variant===1?[0,0,0,1000,1500]:[0,0,1500,2000,1500];
 if(a.op===Op.Toast)return[0,3500,0,0,800];if(a.op===Op.CookSteak)return[0,6500,0,0,600];if(a.op===Op.Bowl)return[0,5000,2000,0,2000];if(a.op===Op.Sandwich)return[0,8000,0,0,2000];
 if(a.op===Op.RawSteak)return[0,4500,0,0,0];if(a.op===Op.EnjoyFlower)return[0,0,0,0,FLOWER_MORALE[a.arg-22]||0];return[0,0,0,0,0];
}
const episode=(kind:EpisodeKind,start:number,target=0,stock=255):Episode=>({kind,start,deadline:start+9,target,stock,resolved:kind==='quiet',responded:false,shooTried:false,covered:false,diverted:false});
function relevant(c:Context,kind:'fire'|'rain'):Episode|undefined{return[c.primary,c.taskFire].find(e=>e&&!e.resolved&&e.kind===kind&&c.slot<=e.deadline&&!e.responded);}
function goalProgress(c:Context,kind:'garden'|'wood'|'flower'|'craft',recipe=-1){const s=c.state;if(!s.goal)return;if(kind==='flower'&&s.goal===1||kind==='craft'&&s.goal===recipe+3){s.goal=0;s.goalReviewDay=0;}else if(kind==='garden'&&s.goal===2||kind==='wood'&&s.goal>=3)s.goalReviewDay=Math.min(MAX_STOCK,c.day+3);}

export function openDay(base:State,kit:bigint,seed:string,shipping=true,goal=255):Context {
 assertState(base);requireThat(base.alive&&base.day<MAX_STOCK,'This life cannot start another day.');const supplied=kitItems(kit);for(const id of supplied)requireThat(base.inventory[id]!<MAX_STOCK,'That supply is full.');
 const state=clone(base);state.day++;state.deathCause=0;
 requireThat(goal===255||Number.isInteger(goal)&&goal>=0&&goal<=6,'Invalid intention.');
 if(goal!==255&&goal!==state.goal){state.goal=goal;state.goalCreatedDay=state.day;state.goalReviewDay=goal?Math.min(MAX_STOCK,state.day+3):0;}
 return{state,day:state.day,slot:0,open:false,seed:seedHex(seed),kit,shipping,pickup:kit===0n,ordinaryMask:0,ordinaryUses:0,mainUsed:false,acuteUses:0,restUses:0,leisureUses:0,lastRest:-100,lastLeisure:-100,minorUsed:false,chairMoved:false,shipped:false,points:0,primaryIntroduced:false,events:[],witness:false};
}

function propose(c:Context):{ctx:Context;kind:EpisodeKind;harmful:boolean}{
 const next=clone(c),s=next.state,h=s.house;next.primaryIntroduced=true;next.primary=episode('quiet',next.slot);
 if(!chance(c.seed,c.day,c.slot,'primary-admission',4500))return{ctx:next,kind:'quiet',harmful:false};
 const families:EpisodeKind[]=['rain','fire','outage','seedEater','visitor','fixtureBreak','mishap','sickness','mood','washout'];
 const kind=families[Math.floor(draw(c.seed,c.day,c.slot,'primary-family')*10/4294967296)]!;
 const pick=(list:number[],label:string)=>list.length?list[Math.floor(draw(c.seed,c.day,c.slot,label)*list.length/4294967296)]!:undefined;
 const ep=episode(kind,next.slot);next.primary=ep;
 let harmful=true,valid=true;
 switch(kind){
  case'rain':for(const p of s.plots)if(p.kind)p.moisture=2;ep.target=1;if(!(h.damage&2)||h.windowPatch||h.windowBrace){ep.resolved=true;harmful=false;}else if(s.needs[0]!<=Math.round(1200*(50-s.stats[0]!)/50)&&!s.inventory[8]&&!(s.needs[3]!>=300&&(s.inventory[7]||s.inventory[6]))){ep.resolved=true;harmful=false;}else if(s.inventory[0])ep.stock=0;break;
  case'fire':if(h.fire||!heat(s)||![Op.Toast,Op.CookSteak,Op.Sandwich,Op.BackupHeat].includes(s.recent.at(-1)!))valid=false;else{h.fire=1;ep.target=0;}break;
  case'outage':h.powerOut=true;if(s.inventory[1])s.inventory[1]!--;break;
  case'seedEater':{const at=pick(s.plots.flatMap((p,i)=>p.kind&&p.ticks>0&&p.ticks<(p.left===PLANTS[p.kind]!.yields?PLANTS[p.kind]!.ticks:2)?[i]:[]),'pest-plot');if(at===undefined)valid=false;else ep.target=at;break;}
  case'visitor':{const id=pick([2,1,3].filter(i=>s.inventory[i]!>0),'visitor-stock');if(id===undefined)valid=false;else ep.stock=id;break;}
  case'fixtureBreak':{const id=pick([0,1,2].filter(i=>!(h.damage&(1<<i))&&(i!==2||h.chairLife>0)&&!(i===0&&active(s,0)&&!s.inventory[2]&&!s.inventory[1])),'broken-fixture');if(id===undefined)valid=false;else{h.damage|=1<<id;ep.target=id;}break;}
  case'mishap':if(s.needs[0]!<=Math.round(800*(50-s.stats[0]!)/50))valid=false;else wound(next,1);break;
  case'sickness':if(s.needs[0]!<=1000)valid=false;else infect(next,3);break;
  case'mood':moraleLoss(next,2000);break;
  case'washout':{const at=pick(s.plots.flatMap((p,i)=>p.kind&&!p.soilBlocked&&!h.shelterLife&&!h.umbrellaLife[i]?[i]:[]),'soil-target');if(at===undefined)valid=false;else{s.plots[at]!.soilBlocked=true;ep.target=at;}break;}
 }
 if(!valid){next.state=clone(c.state);next.primary=episode('quiet',c.slot);return{ctx:next,kind:'quiet',harmful:false};}
 const messages:Record<EpisodeKind,string>={quiet:'An ordinary little day.',rain:'Rain reached the little garden.',fire:'A little flare-up.',outage:'The power went out.',seedEater:'A seed-eater dropped by.',visitor:'A hungry visitor arrived.',fixtureBreak:'Something in the house needs a fix.',mishap:'A little domestic mishap.',sickness:'Feeling a little unwell.',mood:'A disappointing little moment.',washout:'Rain muddied one garden bed.'};
 addEvent(next,kind==='rain'?'weather':'incident',messages[kind],ep.target,kind);return{ctx:next,kind,harmful};
}

export function beginSlot(c:Context,slot:number,certificate?:Certificate):void {
 requireThat(c.state.alive&&!c.open&&slot===c.slot+1&&slot<=60,'Invalid clock advance.');c.beforeSlot=clone(c.state);c.slot=slot;c.open=true;c.events=[];
 if(!c.witness&&!c.primaryIntroduced&&slot===1+Number(BigInt(c.seed)&0xffff_ffffn)%5*10){
  const proposed=propose(c);let accepted=!proposed.harmful;
  if(proposed.harmful&&certificate)accepted=validateCertificate(proposed.ctx,certificate);
  if(accepted)Object.assign(c,proposed.ctx);else{c.primaryIntroduced=true;c.primary=episode('quiet',slot);addEvent(c,'quiet','An ordinary little moment.',0,'episode-softened');}
  c.proposal={kind:proposed.kind,accepted,certificate:!!certificate};
 }
 if(!c.witness&&c.day>1&&slot===31&&BigInt(draw(c.seed,c.day,slot,'structural-exception'))*4000n<4294967296n)die(c,7);
}

/** Worker preview only. The canonical replay independently derives this proposal. */
export function previewPrimary(c:Context,slot=c.slot+1):{context:Context;kind:EpisodeKind;harmful:boolean}|undefined {
 requireThat(!c.open&&slot===c.slot+1&&slot<=60,'Invalid proposal preview.');
 if(c.witness||c.primaryIntroduced||slot!==1+Number(BigInt(c.seed)&0xffff_ffffn)%5*10)return;
 const context=clone(c);context.slot=slot;context.open=true;context.events=[];
 const proposal=propose(context);return{context:proposal.ctx,kind:proposal.kind,harmful:proposal.harmful};
}

function applyStep(c:Context,a:Step):{role:Receipt['role'];success:boolean}{
 const s=c.state,h=s.house;requireThat(s.alive&&a.slot===c.slot&&Number.isInteger(a.op)&&a.op>=0&&a.op<=38,'Unavailable action.');
 requireThat(Number.isInteger(a.arg)&&a.arg>=0&&a.arg<=255&&Number.isInteger(a.variant)&&a.variant>=0&&a.variant<=255&&a.goods.length===4&&Array.from(a.goods).every(n=>Number.isInteger(n)&&n>=0&&n<=34),'Invalid action parameters.');
 if(a.op!==Op.Ship)requireThat(a.goods.every(n=>n===0),'Unexpected shipment.');
 const ordinary=!MAIN_OPS.has(a.op)&&!ACUTE_OPS.has(a.op)&&a.op!==Op.Pickup;
 let role:Receipt['role']=ordinary?'routine':a.op===Op.Pickup?'delivery':MAIN_OPS.has(a.op)?'main':'acute';
 if(role==='routine'){
  const phase=Math.max(1,Math.floor((c.slot-1)/10));requireThat(c.slot>=11||c.slot<=5,'Not a routine opportunity.');requireThat(c.ordinaryUses<5&&!(c.ordinaryMask&(1<<phase)),'Routine already used.');c.ordinaryMask|=1<<phase;c.ordinaryUses++;
 }else if(role==='main'){requireThat(!c.mainUsed&&c.slot>=36&&c.slot<=40,'Main already used or unavailable.');c.mainUsed=true;}
 else if(role==='acute')requireThat(c.acuteUses<2,'Response allowance used.');
 const plain=(arg=0,variant=0)=>requireThat(a.arg===arg&&a.variant===variant,'Unexpected action parameters.');
 const consumeFood=(id:number)=>{if(id===2){take(s,id);restore(s,[0,4000,0,0,0]);}else if(id===1){take(s,id);restore(s,[0,2500,3000,0,0]);}else{const ef=FRUIT_EFFECTS[id];requireThat(ef,'That is not food.');take(s,id);restore(s,[0,ef![0],ef![1],0,0]);}};
 const consumeDrink=(id:number)=>{requireThat(id===0||id===1,'That is not a drink.');take(s,id);restore(s,id===0?[0,0,5000,0,0]:[0,2500,3000,0,0]);};
 const declaredChance=actionChance(c,a);
 const failTask=(_base:number,_stove=false)=>{
  const ok=chance(c.seed,c.day,c.slot,`competence:${a.op}:${a.arg}:${a.variant}`,declaredChance);
  if(!ok){const minor=!c.minorUsed&&chance(c.seed,c.day,c.slot,'task-complication',2500);if(minor){c.minorUsed=true;if(a.op===Op.Bowl)condition(c,7);else if(a.op===Op.BackupHeat){let boundary=Math.ceil(c.slot/10)*10;if(boundary-c.slot<2)boundary+=10;if(boundary<=60){h.fire=1;c.taskFire=episode('fire',c.slot);c.taskFire.deadline=boundary;}else h.mess=Math.min(2,h.mess+1);}else wound(c,1);}else h.mess=Math.min(2,h.mess+1);}
  return ok;
 };
 let success=true;
 switch(a.op){
  case Op.Quiet:plain();break;
  case Op.QuietMain:plain();break;
  case Op.Pickup:plain();requireThat(!c.pickup&&c.slot<=6,'No parcel to collect.');for(const id of kitItems(c.kit))give(s,id);c.pickup=true;addEvent(c,'delivery','Collected the delivery.',0);break;
  case Op.Breakfast:requireThat(s.needs[1]!<10000||s.needs[2]!<10000,'Not hungry or thirsty.');consumeFood(a.arg);consumeDrink(a.variant);energy(s,200);break;
  case Op.Eat:requireThat(a.variant===0&&(s.needs[1]!<10000||s.needs[2]!<10000),'Food unavailable.');consumeFood(a.arg);energy(s,100);break;
  case Op.Drink:requireThat(a.variant===0&&s.needs[2]!<10000,'Not thirsty.');consumeDrink(a.arg);energy(s,100);break;
  case Op.Treat:requireThat(a.variant===0&&[2,3,4].includes(a.arg)&&active(s,a.arg),'No matching condition.');take(s,a.arg===2?11:4);clear(s,a.arg);restore(s,[1500,0,0,0,0]);energy(s,100);break;
  case Op.Wash:requireThat(a.variant===0&&(a.arg===6||a.arg===7)&&active(s,a.arg),'No matching exposure.');take(s,10);clear(s,a.arg);if(a.arg===6)restore(s,[0,0,0,0,500]);energy(s,100);break;
  case Op.Rest:plain();requireThat(c.restUses<2&&c.slot-c.lastRest>=10&&s.needs[3]!<10000,'Rest unavailable.');c.restUses++;c.lastRest=c.slot;restore(s,[0,0,0,1200,0]);break;
  case Op.Leisure:requireThat(a.arg===0&&a.variant<=2&&c.leisureUses<2&&c.slot-c.lastLeisure>=10&&s.needs[4]!<10000,'Leisure unavailable.');if(a.variant===2)requireThat(chair(s),'No usable chair.');if(a.variant===1)requireThat(s.plots.some(p=>p.kind),'No garden to enjoy.');c.leisureUses++;c.lastLeisure=c.slot;restore(s,[0,0,0,0,a.variant===2?1500:1000]);energy(s,100);break;
  case Op.Well:plain();requireThat(s.plots.some(p=>p.kind&&p.moisture<2),'No garden water needed.');for(const p of s.plots)if(p.kind)p.moisture=2;energy(s,100);goalProgress(c,'garden');break;
  case Op.Ship:plain();requireThat(c.shipping&&!c.shipped&&a.goods.some(n=>n>0),'No shipment available.');{let padding=false;for(const id of a.goods){if(!id){padding=true;continue;}requireThat(!padding&&id>=23&&id<=34,'Invalid finished-good sequence.');take(s,id-1);}}c.shipped=true;c.points+=shipmentPoints(a.goods);energy(s,100);break;
  case Op.Coffee:requireThat(a.arg===0&&a.variant<=2&&(s.needs[3]!<10000||s.needs[4]!<10000||a.variant===2&&s.needs[2]!<10000),'Coffee is not needed.');if(a.variant>0)requireThat(!active(s,7),'Clean the surface first.');take(s,5);if(a.variant===2)take(s,1);energy(s,100);restore(s,a.variant===0?[0,0,0,2000,500]:a.variant===1?[0,0,0,1000,1500]:[0,0,1500,2000,1500]);condition(c,5);break;
  case Op.Tidy:plain();requireThat(h.mess===1,'Nothing to tidy.');h.mess=0;energy(s,100);break;
  case Op.DeepClean:plain();requireThat(h.mess===2,'No deep mess.');take(s,10);h.mess=1;energy(s,100);break;
  case Op.Toast:case Op.CookSteak:case Op.Bowl:case Op.Sandwich:{plain();requireThat(!active(s,7)&&(a.op===Op.Bowl||heat(s)),'Kitchen unavailable.');if(a.op!==Op.CookSteak)take(s,2);if(a.op===Op.CookSteak||a.op===Op.Sandwich)take(s,3);if(a.op===Op.Bowl)take(s,1);energy(s,100);success=failTask(a.op===Op.Toast||a.op===Op.Bowl?9500:9000,a.op!==Op.Bowl);if(success)restore(s,a.op===Op.Toast?[0,3500,0,0,800]:a.op===Op.CookSteak?[0,6500,0,0,600]:a.op===Op.Bowl?[0,5000,2000,0,2000]:[0,8000,0,0,2000]);break;}
  case Op.Repair:requireThat(a.variant===0&&a.arg<3&&(h.damage&(1<<a.arg))&&(a.arg!==2||h.chairLife>0),'Nothing to repair.');energy(s,300,true);take(s,7);success=failTask(9000,a.arg===0);if(success)h.damage&=~(1<<a.arg);break;
  case Op.Plant:{requireThat(a.arg<4&&a.variant>=1&&a.variant<=9,'Invalid planting.');const p=s.plots[a.arg]!;requireThat(!p.kind&&!p.soilBlocked,'Bed unavailable.');energy(s,300,true);take(s,12+a.variant);const spec=PLANTS[a.variant]!;s.plots[a.arg]={kind:a.variant,ticks:spec.ticks,left:spec.yields,moisture:2,dry:0,soilBlocked:false};goalProgress(c,'garden');break;}
  case Op.Harvest:{plain();requireThat(s.plots.some(p=>p.kind&&p.ticks===0),'Nothing ready.');energy(s,300,true);for(let i=0;i<4;i++){const p=s.plots[i]!;if(!p.kind||p.ticks)continue;give(s,PLANTS[p.kind]!.output);if(p.kind===9)goalProgress(c,'wood');p.left--;if(!p.left)s.plots[i]=emptyPlot(p.soilBlocked);else{p.ticks=2;p.dry=0;}}break;}
  case Op.Craft:{requireThat(a.variant===0&&a.arg<4,'Invalid recipe.');const r=RECIPES[a.arg]!;energy(s,300,true);take(s,6,r.wood);give(s,r.output);goalProgress(c,'craft',a.arg);break;}
  case Op.RestoreSoil:requireThat(a.variant===0&&a.arg<4&&s.plots[a.arg]!.soilBlocked,'Soil is clear.');energy(s,300,true);take(s,12);s.plots[a.arg]!.soilBlocked=false;break;
  case Op.BuildChair:case Op.BuildShelter:plain();requireThat(a.op===Op.BuildChair?!h.chairLife:!h.shelterLife,'Already built.');energy(s,300,true);take(s,6);take(s,7);success=failTask(9000);if(success){if(a.op===Op.BuildChair){h.chairLife=5;h.chairAnchor=0;h.damage&=~4;}else h.shelterLife=4;}break;
  case Op.Patch:requireThat(a.variant===0&&a.arg<2&&(h.damage&(1<<a.arg))&&(a.arg===0?!h.stovePatch:!h.windowPatch),'No patch needed.');energy(s,300,true);take(s,6);success=failTask(9000,a.arg===0);if(success){if(a.arg===0)h.stovePatch=2;else h.windowPatch=2;}break;
  case Op.BackupHeat:plain();requireThat(h.powerOut&&!(h.damage&1)&&!h.backupHeat&&!h.fire,'Heat unavailable.');energy(s,300,true);take(s,6);take(s,9);success=failTask(9000,true);if(success)h.backupHeat=true;break;
  case Op.MoveChair:plain();requireThat(h.chairLife&&!c.chairMoved&&c.primary&&c.primary.kind!=='quiet','Chair move unavailable.');energy(s,300,true);h.chairAnchor=h.chairAnchor?0:1;c.chairMoved=true;break;
  case Op.Abandon:requireThat(a.variant===0&&a.arg<4&&s.plots[a.arg]!.kind,'No planting.');energy(s,300,true);s.plots[a.arg]=emptyPlot(s.plots[a.arg]!.soilBlocked);break;
  case Op.CoverPlot:requireThat(a.variant===0&&a.arg<4&&s.plots[a.arg]!.kind&&!h.shelterLife&&!h.umbrellaLife[a.arg],'Cover unavailable.');take(s,8);h.umbrellaLife[a.arg]=3;energy(s,100);break;
  case Op.Douse:case Op.Shutdown:{plain();const ep=relevant(c,'fire');requireThat(ep&&h.fire,'No eligible fire.');if(a.op===Op.Douse){take(s,0);h.fire=0;for(const e of[c.primary,c.taskFire])if(e?.kind==='fire')e.resolved=true;}else{requireThat(h.fire===1,'Already shut down.');h.fire=2;}ep!.responded=true;c.acuteUses++;energy(s,100);break;}
  case Op.BraceRain:case Op.CoverRain:{plain();const ep=relevant(c,'rain');requireThat(ep&&(h.damage&2)&&!h.windowPatch&&!h.windowBrace,'No eligible storm.');if(a.op===Op.BraceRain){energy(s,300,true);take(s,7);h.windowBrace=true;}else{take(s,8);ep!.covered=true;energy(s,100);}ep!.responded=true;c.acuteUses++;break;}
  case Op.Shoo:case Op.Bait:{const ep=c.primary;requireThat(ep&&!ep.resolved&&['seedEater','visitor'].includes(ep.kind)&&c.slot<=ep.deadline,'No visitor.');if(a.op===Op.Bait){requireThat(a.variant===0&&(ep!.kind==='seedEater'?[2,13,14,15,16,17,18,19,20,21]:[1,3]).includes(a.arg),'Invalid bait.');take(s,a.arg);ep!.resolved=true;}else{plain();requireThat(!ep!.shooTried,'Already tried.');ep!.shooTried=true;success=chance(c.seed,c.day,c.slot,`competence:${a.op}:${a.arg}:${a.variant}`,Math.min(9900,7500+s.stats[1]!*200));if(success)ep!.resolved=true;else if(!c.minorUsed&&chance(c.seed,c.day,c.slot,'task-complication',2500)){c.minorUsed=true;condition(c,6);}}energy(s,100);break;}
  case Op.RawSteak:plain();requireThat(c.day>1&&s.needs[1]!<=3000&&!s.inventory[2]&&!s.inventory[1]&&!Object.keys(FRUIT_EFFECTS).some(id=>s.inventory[Number(id)]),'Safe food is available.');take(s,3);energy(s,100);restore(s,[0,4500,0,0,0]);if(!c.minorUsed&&chance(c.seed,c.day,c.slot,'raw-exposure',2500)){c.minorUsed=true;infect(c,3);}break;
  case Op.EnjoyFlower:requireThat(a.variant===0&&a.arg>=22&&a.arg<=25&&s.needs[4]!<10000,'No flower needed.');take(s,a.arg);restore(s,[0,0,0,0,FLOWER_MORALE[a.arg-22]!]);energy(s,100);goalProgress(c,'flower');break;
 }
 const message=!success?'That did not go to plan.':a.op===Op.Plant?`Planted ${PLANTS[a.variant]!.name.toLowerCase()}.`:a.op===Op.Craft?`Finished a ${RECIPES[a.arg]!.name.toLowerCase()}.`:ACTION_MESSAGES[a.op]||'A quiet little moment.';
 addEvent(c,'action',message,a.arg,Op[a.op]);return{role,success};
}

function boundary(c:Context){const s=c.state;const phase=Math.floor((c.slot-1)/10);change(s,1,-500);change(s,2,-[700,600,700,700,600,700][phase]!);moraleLoss(c,300);
 if(!s.needs[1]&&condition(c,0,1,c.day+1))damage(c,1500,false,2);if(!s.alive)return;if(!s.needs[2]&&condition(c,1,1,c.day+1))damage(c,1500,false,3);if(!s.alive)return;
 for(const e of[c.primary,c.taskFire]){if(!e||e.resolved||e.deadline!==c.slot||!s.alive)continue;
  if(e.kind==='fire'){if(s.house.fire===1){wound(c,2);if(s.alive)s.house.mess=Math.min(2,s.house.mess+1);}else if(s.house.fire===2)damage(c,500,true);s.house.fire=0;}
  else if(e.kind==='rain'&&(s.house.damage&2)&&!s.house.windowPatch&&!s.house.windowBrace){if(!e.covered)damage(c,1200,true);if(s.alive&&!e.diverted&&!s.house.dripDiverted&&e.stock<34&&s.inventory[e.stock])s.inventory[e.stock]!--;}
  else if(e.kind==='seedEater'){const p=s.plots[e.target];if(p?.kind&&p.ticks>0){const span=p.left===PLANTS[p.kind]!.yields?PLANTS[p.kind]!.ticks:2;p.ticks=Math.min(span,p.ticks+1);}}
  else if(e.kind==='visitor'&&e.stock<34&&s.inventory[e.stock])s.inventory[e.stock]!--;
  e.resolved=true;
 }
}
function bedtime(c:Context){const s=c.state;if(!s.alive)return;
 const exposed=[6,7].some(id=>active(s,id)&&s.conditions[id]!.onsetDay<c.day);
 if(exposed&&(c.witness||chance(c.seed,c.day,60,'contamination-exposure',2500)))infect(c,active(s,2)?4:3);if(!s.alive)return;
 if(active(s,3)){const ill=s.conditions[3]!;if(c.day>=ill.onsetDay+1)ill.severity=2;change(s,3,ill.severity===2?-1000:-500);}if(active(s,4))change(s,3,-1000);
 if(active(s,2)){const w=s.conditions[2]!;if(w.severity===1&&c.day>=w.onsetDay+1){if(!active(s,4)&&s.needs[1]!>3000&&s.needs[2]!>3000&&s.needs[3]!>=2000)clear(s,2);else{w.severity=2;if(!w.dueDay)w.dueDay=c.day+1;}}}
 clear(s,5);
 for(const [id,cause]of[[0,2],[1,3],[2,4],[3,5],[4,6]] as const){const d=s.conditions[id]!;if(active(s,id)&&d.dueDay&&d.dueDay<=c.day&&(id===0||id===1||id===4||d.severity===2)){die(c,cause);return;}}
 const recover=s.needs[1]!>3000&&s.needs[2]!>3000&&s.needs[3]!>=2000&&![0,1,4].some(id=>active(s,id))&&![2,3].some(id=>active(s,id)&&s.conditions[id]!.severity===2);
 change(s,3,3500);if(recover)change(s,0,500);
 for(let i=0;i<4;i++){const p=s.plots[i]!;if(!p.kind)continue;if(p.ticks>0){if(p.moisture){if(!p.soilBlocked)p.ticks--;p.dry=0;}else if(++p.dry>=2){s.plots[i]=emptyPlot(p.soilBlocked);addEvent(c,'garden','A dry planting wilted.',i);continue;}}if(p.moisture)p.moisture--;}
 const h=s.house;h.chairLife=Math.max(0,h.chairLife-1);h.shelterLife=Math.max(0,h.shelterLife-1);h.stovePatch=Math.max(0,h.stovePatch-1);h.windowPatch=Math.max(0,h.windowPatch-1);h.umbrellaLife=h.umbrellaLife.map(n=>Math.max(0,n-1));if(!h.chairLife){h.damage&=~4;h.chairAnchor=0;}h.chairBrace=false;h.windowBrace=false;h.dripDiverted=false;h.backupHeat=false;h.powerOut=false;h.fire=0;
 s.conditions=s.conditions.map(d=>d.resolved?emptyCondition():d);s.level++;addEvent(c,'bedtime','Settled in for the night.');
}

export function endSlot(c:Context,action?:Step):Receipt {
 requireThat(c.open,'No open logical slot.');
 requireThat(c.state.alive||!action,'No action follows this life’s end.');
 const next=clone(c),before=clone(c.beforeSlot||c.state);let role:Receipt['role']='interlude',success=false;
 if(next.state.alive){if(action)({role,success}=applyStep(next,action));next.state.recent.push(action?.op||0);next.state.recent=next.state.recent.slice(-6);if(next.slot%10===0)boundary(next);if(next.slot===60&&next.state.alive)bedtime(next);}
 next.open=false;delete next.beforeSlot;Object.assign(c,next);delete c.beforeSlot;return{slot:c.slot,op:action?.op||0,arg:action?.arg||0,variant:action?.variant||0,role,success,events:clone(c.events),before,snapshot:clone(c.state),points:c.points};
}

export function validateCertificate(postProposal:Context,certificate:Certificate):boolean {
 try{
  requireThat(certificate.horizon===2&&certificate.kits.length===2&&certificate.steps.length<=24,'Invalid care certificate.');certificate.kits.forEach(kitItems);
  const ctx=clone(postProposal);ctx.witness=true;const firstDay=ctx.day,startSlot=ctx.slot;let at=0,last=0;
  for(const a of certificate.steps){requireThat(a.slot>=startSlot&&a.slot<=180&&a.slot>last&&CERTIFICATE_OPS.has(a.op),'Invalid care step.');last=a.slot;}
  for(let offset=0;offset<=2;offset++){
   if(offset){requireThat(ctx.state.alive&&ctx.state.day<MAX_STOCK,'Certificate did not survive.');ctx.state.day++;ctx.day=ctx.state.day;ctx.slot=0;ctx.kit=certificate.kits[offset-1]!;for(const id of kitItems(ctx.kit))requireThat(ctx.state.inventory[id]!<MAX_STOCK,'Future kit overflow.');ctx.pickup=ctx.kit===0n;ctx.ordinaryMask=0;ctx.ordinaryUses=0;ctx.mainUsed=false;ctx.acuteUses=0;ctx.restUses=0;ctx.leisureUses=0;ctx.lastRest=-100;ctx.lastLeisure=-100;ctx.minorUsed=false;ctx.chairMoved=false;ctx.shipped=false;ctx.primaryIntroduced=true;ctx.primary=undefined;ctx.taskFire=undefined;}
   const begin=offset===0?startSlot:1;
   for(let slot=begin;slot<=60&&ctx.state.alive;slot++){
    if(offset===0&&slot===startSlot)ctx.events=[];else beginSlot(ctx,slot);
    const global=offset*60+slot;let a:Step|undefined;if(certificate.steps[at]?.slot===global){a={...certificate.steps[at]!,slot};at++;}
    endSlot(ctx,a);
   }
   requireThat(ctx.state.alive&&ctx.pickup&&ctx.slot===60&&ctx.day===firstDay+offset,'Certificate missed a deadline or delivery.');
  }
  requireThat(at===certificate.steps.length&&ctx.state.needs[1]!>3000&&ctx.state.needs[2]!>3000&&ctx.state.needs[3]!>=2000,'Incomplete rescue.');
  requireThat(![0,1,2,3,4,6,7].some(id=>active(ctx.state,id)),'Unresolved rescue condition.');return true;
 }catch{return false;}
}

export function finishDay(c:Context,receipts:Receipt[],trace:Trace):DayResult {
 requireThat(!c.open&&(!c.state.alive||c.slot===60&&c.state.level===c.state.day&&c.pickup),'An unfinished day or delivery cannot commit.');
 if(!c.pickup){for(const id of kitItems(c.kit))give(c.state,id);c.pickup=true;addEvent(c,'delivery','The unopened parcel remained with the home.');if(receipts.length){receipts.at(-1)!.events=clone(c.events);receipts.at(-1)!.snapshot=clone(c.state);}}
 assertState(c.state);return{state:clone(c.state),receipts,points:c.points,trace:clone(trace),delivery:kitItems(c.kit),proposal:c.proposal?clone(c.proposal):undefined};
}
export function replayDay(base:State,kit:bigint,trace:Trace,seed:string,shipping=true,certificate?:Certificate):DayResult {
 requireThat(trace.steps.length<=16,'Day trace is too long.');let previous=0;for(const a of trace.steps){requireThat(Number.isInteger(a.slot)&&a.slot>previous&&a.slot<=60,'Actions must be chronological.');previous=a.slot;}
 const ctx=openDay(base,kit,seed,shipping,trace.goal);const receipts:Receipt[]=[];let at=0;
 for(let slot=1;slot<=60&&ctx.state.alive;slot++){beginSlot(ctx,slot,certificate);let a:Step|undefined;if(ctx.state.alive&&trace.steps[at]?.slot===slot){a=trace.steps[at];at++;}receipts.push(endSlot(ctx,a));}
 requireThat(at===trace.steps.length,'Action follows this lifeÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢s end.');return finishDay(ctx,receipts,trace);
}

const LABELS:Partial<Record<Op,string>>={[Op.Quiet]:'Take a quiet moment',[Op.Pickup]:'Collect the parcel',[Op.Breakfast]:'Have breakfast',[Op.Eat]:'Eat',[Op.Drink]:'Have a drink',[Op.Treat]:'Treat the condition',[Op.Wash]:'Wash up',[Op.Rest]:'Take a nap',[Op.Leisure]:'Enjoy a little quiet',[Op.Well]:'Water the garden',[Op.Ship]:'Post a parcel',[Op.Coffee]:'Make a coffee',[Op.Tidy]:'Tidy the kitchen',[Op.Toast]:'Make toast',[Op.CookSteak]:'Cook a meal',[Op.Bowl]:'Make a comfort bowl',[Op.Sandwich]:'Make a sandwich',[Op.Repair]:'Repair the house',[Op.Plant]:'Plant',[Op.Harvest]:'Gather the ready garden',[Op.Craft]:'Make',[Op.RestoreSoil]:'Restore the soil',[Op.BuildChair]:'Build a chair',[Op.BuildShelter]:'Build garden cover',[Op.Patch]:'Patch the house',[Op.BackupHeat]:'Light backup heat',[Op.MoveChair]:'Move the chair',[Op.Abandon]:'Clear a planting',[Op.CoverPlot]:'Cover a bed',[Op.DeepClean]:'Deep-clean the kitchen',[Op.QuietMain]:'Have an unhurried afternoon',[Op.Douse]:'Douse the flare',[Op.Shutdown]:'Turn off the stove',[Op.BraceRain]:'Brace the window',[Op.CoverRain]:'Cover against the rain',[Op.Shoo]:'Shoo the visitor',[Op.Bait]:'Share with the visitor',[Op.RawSteak]:'Eat emergency food',[Op.EnjoyFlower]:'Enjoy a flower'};
export const actionKey=(a:Step)=>`${a.op}:${a.arg}:${a.variant}:${a.goods.join(',')}`;
export function legalActions(c:Context,careOnly=false):Candidate[]{
 if(!c.state.alive)return[];const variants:Step[]=[];const add=(op:Op,arg=0,variant=0,goods:number[]=[])=>(variants.push({slot:c.slot,op,arg,variant,goods:[...goods,...Array(Math.max(0,4-goods.length)).fill(0)]}));
 for(let op=0;op<=38;op++){
  if([Op.Breakfast,Op.Eat,Op.Drink,Op.Treat,Op.Wash,Op.Leisure,Op.Ship,Op.Coffee,Op.Repair,Op.Plant,Op.Craft,Op.RestoreSoil,Op.Patch,Op.Abandon,Op.CoverPlot,Op.Bait,Op.EnjoyFlower].includes(op))continue;add(op);
 }
 for(const food of[2,1,26,27,28,29]){add(Op.Eat,food);for(const drink of[0,1])add(Op.Breakfast,food,drink);}for(const drink of[0,1])add(Op.Drink,drink);
 for(const id of[2,3,4])add(Op.Treat,id);for(const id of[6,7])add(Op.Wash,id);for(let v=0;v<3;v++){add(Op.Leisure,0,v);add(Op.Coffee,0,v);add(Op.Repair,v);}
 add(Op.Ship,0,0,topShipment(c.state.inventory));for(let bed=0;bed<4;bed++){for(let plant=1;plant<=9;plant++)add(Op.Plant,bed,plant);add(Op.RestoreSoil,bed);add(Op.Abandon,bed);add(Op.CoverPlot,bed);add(Op.Craft,bed);}for(let fixture=0;fixture<2;fixture++)add(Op.Patch,fixture);for(const id of[1,2,3,13,14,15,16,17,18,19,20,21])add(Op.Bait,id);for(let id=22;id<=25;id++)add(Op.EnjoyFlower,id);
 const out:Candidate[]=[];for(const a of variants){if(careOnly&&!CERTIFICATE_OPS.has(a.op))continue;try{const copy=clone(c),before=copy.state.inventory.slice();const result=applyStep(copy,a);const inputs:Record<string,number>={};before.forEach((n,i)=>{if(copy.state.inventory[i]!<n)inputs[ITEMS[i]!]=n-copy.state.inventory[i]!;});const suffix=a.op===Op.Plant?` ${PLANTS[a.variant]!.name}`:a.op===Op.Craft?` ${RECIPES[a.arg]!.name}`:a.op===Op.Eat||a.op===Op.Drink||a.op===Op.EnjoyFlower?` ${ITEMS[a.arg]!.replaceAll('_',' ')}`:'';out.push({...a,key:actionKey(a),label:(LABELS[a.op]||Op[a.op])+suffix,description:`${Object.entries(inputs).map(([k,n])=>`${n} ${k.replaceAll('_',' ')}`).join(' + ')||'No supplies'}${a.op===Op.Ship?`; ${shipmentPoints(a.goods)/10} base points`:''}`,role:result.role,inputs,energy:actionEnergy(a),recovery:actionRecovery(a),chanceBps:actionChance(c,a),possibleFailures:a.op===Op.RawSteak&&!c.minorUsed?['25% illness exposure; separate from action success.']:a.op===Op.Shoo?['Visitor may stay; failed contact may contaminate the body.']:actionChance(c,a)<10000?['Started materials are spent on failure.',a.op===Op.Bowl?'Preparation surface may be contaminated.':a.op===Op.BackupHeat?'A flare may need an immediate response.':'A minor wound or mess may result.']:[]});}catch{/* Unavailable typed parameter combination. */}}
 return out;
}
