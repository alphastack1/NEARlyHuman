import {Op,MAX_STOCK,type Context,type Certificate,type Candidate,type Step} from './types';
import {CERTIFICATE_OPS} from './catalog';
import {clone,kitMask} from './state';
import {beginSlot,endSlot,legalActions,validateCertificate} from './kernel';

const active=(c:Context,id:number)=>c.state.conditions[id]!.severity>0&&!c.state.conditions[id]!.resolved;
function futureKit(c:Context):bigint {
 const inv=c.state.inventory,ids:number[]=[];
 const add=(id:number,needed:boolean)=>{if(needed&&ids.length<3&&!ids.includes(id)&&inv[id]!<MAX_STOCK)ids.push(id);};
 add(4,(active(c,3)||active(c,4))&&inv[4]!<Number(active(c,3))+Number(active(c,4)));
 add(11,active(c,2)&&inv[11]===0);
 add(10,(active(c,6)||active(c,7))&&inv[10]!<Number(active(c,6))+Number(active(c,7)));
 const food=inv[2]!<2,water=inv[0]!<2;
 if(ids.length===2&&food&&water)add(1,true);
 else{add(0,water);add(2,food);}
 return kitMask(ids);
}
function resetFuture(c:Context,kit:bigint):void {
 c.state.day++;c.day=c.state.day;c.slot=0;c.open=false;c.kit=kit;c.pickup=kit===0n;
 c.ordinaryMask=0;c.ordinaryUses=0;c.mainUsed=false;c.acuteUses=0;c.restUses=0;c.leisureUses=0;c.lastRest=-100;c.lastLeisure=-100;c.minorUsed=false;c.chairMoved=false;c.shipped=false;c.primaryIntroduced=true;c.primary=undefined;c.taskFire=undefined;c.events=[];
}
function chooseCare(c:Context):Step|undefined {
 const phase=Math.max(1,Math.floor((c.slot-1)/10));
 const canRoutine=c.ordinaryUses<5&&!(c.ordinaryMask&(1<<phase))&&(c.slot<=5||c.slot>=11);
 const canRespond=c.acuteUses<2&&[c.primary,c.taskFire].some(e=>e&&!e.resolved&&!e.responded&&c.slot<=e.deadline&&(e.kind==='fire'||e.kind==='rain'));
 if(c.pickup&&!canRoutine&&!canRespond)return;
 const options=legalActions(c,true).filter(a=>CERTIFICATE_OPS.has(a.op));
 const pickup=options.find(a=>a.op===Op.Pickup);if(pickup)return pickup;
 const acute=options.filter(a=>a.role==='acute');
 const douse=acute.find(a=>a.op===Op.Douse),shutdown=acute.find(a=>a.op===Op.Shutdown);
 if(douse&&(c.state.inventory[0]!>1||!shutdown||c.state.needs[0]!<=500))return douse;
 if(shutdown)return shutdown;
 const brace=acute.find(a=>a.op===Op.BraceRain)||acute.find(a=>a.op===Op.CoverRain);if(brace)return brace;
 const n=c.state.needs;
 const score=(a:Candidate):number=>{
  if(a.role!=='routine')return-1;
  if(a.op===Op.Treat){const condition=c.state.conditions[a.arg]!;return condition.dueDay<=c.day||a.arg===4?1000-condition.dueDay+c.day:650;}
  if(a.op===Op.Breakfast)return n[1]!<=7000||n[2]!<=6500?900+(a.arg===2?1:0):-1;
  if(a.op===Op.Drink)return n[2]!<=5000?850+(a.arg===0?2:0):-1;
  if(a.op===Op.Eat)return n[1]!<=5000?850+(a.arg===2?2:0):-1;
  if(a.op===Op.Wash)return c.state.conditions[a.arg]!.onsetDay<c.day?820:620;
  if(a.op===Op.Rest)return n[3]!<3000?810:n[3]!<6000?200:-1;
  if(a.op===Op.Leisure)return n[4]!<7500?180:-1;
  if(a.op===Op.EnjoyFlower)return n[4]!<6500?190:-1;
  if(a.op===Op.Coffee)return n[3]!<2000?700:-1;
  return-1;
 };
 const care=options.map(a=>({a,score:score(a)})).filter(a=>a.score>0).sort((a,b)=>b.score-a.score);
 return care[0]?.a;
}

/**
 * Produces one conservative witness, not a search/optimality claim. Every returned
 * path is revalidated by the same pure verifier. Failure simply softens the onset.
 */
export function buildCareCertificate(proposedPostOnset:Context):Certificate|undefined {
 try{
  if(!proposedPostOnset.state.alive||!proposedPostOnset.open||proposedPostOnset.day>MAX_STOCK-2)return;
  const c=clone(proposedPostOnset);c.witness=true;const start=c.slot;
  const certificate:Certificate={horizon:2,kits:[0n,0n],steps:[]};
  for(let offset=0;offset<=2;offset++){
   if(offset){const kit=futureKit(c);certificate.kits[offset-1]=kit;resetFuture(c,kit);}
   for(let slot=offset===0?start:1;slot<=60&&c.state.alive;slot++){
    if(!(offset===0&&slot===start))beginSlot(c,slot);
    const selected=chooseCare(c);
    if(selected){certificate.steps.push({slot:offset*60+slot,op:selected.op,arg:selected.arg,variant:selected.variant,goods:[...selected.goods]});if(certificate.steps.length>24)return;}
    endSlot(c,selected);
   }
   if(!c.state.alive||!c.pickup)return;
  }
  return validateCertificate(proposedPostOnset,certificate)?certificate:undefined;
 }catch{return;}
}
