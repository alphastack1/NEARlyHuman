//! Deterministic V2 interpreter, ported from the pinned Solidity verifier.
//! The relay chooses bounded actions; this module derives every resulting fact.
use near_sdk::near;
pub type R<T> = Result<T, &'static str>;
fn check(ok: bool, why: &'static str) -> R<()> { if ok { Ok(()) } else { Err(why) } }
#[near(serializers=[borsh])]
#[derive(Clone, Copy, Debug, Default)]
pub struct Condition { pub severity:u32, pub onset:u32, pub due:u32, pub resolved:bool }
#[near(serializers=[borsh])]
#[derive(Clone, Copy, Debug, Default)]
pub struct Plot {pub kind:u32,pub ticks:u32,pub left:u32,pub moisture:u32,pub dry:u32,pub blocked:bool}
#[near(serializers=[borsh])]
#[derive(Clone, Debug, Default)]
pub struct House {pub mess:u32,pub damage:u32,pub chair:u32,pub anchor:u32,pub shelter:u32,pub umbrella:[u32;4],pub stove:u32,pub window:u32,pub chair_brace:bool,pub window_brace:bool,pub diverted:bool,pub backup:bool,pub power_out:bool,pub fire:u32}
#[near(serializers=[borsh])]
#[derive(Clone, Debug)]
pub struct State {pub version:u32,pub seed:[u8;32],pub day:u32,pub level:u32,pub alive:bool,pub death:u32,pub stats:[u32;3],pub needs:[u32;5],pub stock:[u32;34],pub conditions:[Condition;8],pub plots:[Plot;4],pub house:House,pub goal:u32,pub goal_created:u32,pub goal_review:u32,pub recent:[u32;6]}
#[derive(Clone, Debug, Default)]
pub struct Step {pub slot:u32,pub op:u32,pub arg:u32,pub variant:u32,pub goods:[u32;4]}
#[derive(Clone, Debug)]
pub struct Trace {pub goal:u32,pub steps:Vec<Step>}
#[derive(Clone, Debug)]
pub struct Certificate {pub horizon:u32,pub kits:[u64;2],pub steps:Vec<Step>}
#[derive(Clone, Copy, Debug, Default)]
struct Episode {kind:u32,start:u32,deadline:u32,target:usize,stock:usize,resolved:bool,responded:bool,shoo:bool,covered:bool,diverted:bool}
#[derive(Clone)]
struct Context {s:State,day:u32,slot:u32,seed:[u8;32],kit:u64,shipping:bool,pickup:bool,ordinary_mask:u32,ordinary:u32,main:bool,acute:u32,rests:u32,leisures:u32,last_rest:i32,last_leisure:i32,minor:bool,chair_moved:bool,shipped:bool,points:u32,primary:Episode,task_fire:Episode,witness:bool}
pub fn initialize(seed:[u8;32],stats:[u32;3])->R<State>{check(stats.iter().all(|v|*v<=5)&&stats.iter().sum::<u32>()==5,"five strengths")?;let mut s=State{version:2,seed,day:0,level:0,alive:true,death:0,stats,needs:[10000,8000,8000,8000,8000],stock:[0;34],conditions:[Condition::default();8],plots:[Plot::default();4],house:House::default(),goal:0,goal_created:0,goal_review:0,recent:[0;6]};s.stock[0]=3;s.stock[2]=3;Ok(s)}
fn first(k:u32)->u32{if matches!(k,1|2|5){3}else if matches!(k,3|6|9){6}else{8}}
fn yields(k:u32)->u32{if k==9{10}else if matches!(k,7|8){6}else{1}}
fn output(k:u32)->usize{if k==9{6}else{(k+21)as usize}}
fn cost(r:usize)->R<u32>{[3,6,8,10].get(r).copied().ok_or("recipe")}
fn weight(id:usize)->R<u32>{check((22..34).contains(&id),"good")?;Ok([65,65,95,115,65,95,40,40,116,212,276,340][id-22])}
pub fn assert_state(s:&State,provisional:bool)->R<()>{
 check(s.version==2&&s.level<=s.day&&(provisional||!s.alive||s.level==s.day),"day counters")?;
 check(s.stats.iter().all(|v|*v<=5)&&s.stats.iter().sum::<u32>()==5,"strengths")?;
 check(s.death<=7&&if s.alive{s.death==0&&s.needs[0]>0}else{s.death>0},"life status")?;
 check(s.needs.iter().all(|v|*v<=10000),"needs")?;
 for(i,c)in s.conditions.iter().enumerate(){check(c.severity<=2&&c.onset<=s.day,"condition")?;if c.severity==0{check(c.onset==0&&c.due==0&&!c.resolved,"empty condition")?}else if i<5{check(c.due>0,"condition deadline")?}}
 for p in &s.plots{check(p.kind<=9&&p.moisture<=2&&p.dry<=1,"plot")?;if p.kind==0{check(p.ticks==0&&p.left==0&&p.moisture==0&&p.dry==0,"empty plot")?}else{check(p.left>0&&p.left<=yields(p.kind)&&p.ticks<=if p.left==yields(p.kind){first(p.kind)}else{2}&&(p.ticks>0||p.dry==0),"plant timer")?}}
 let h=&s.house;check(h.mess<=2&&h.damage<=7&&h.fire<=2&&h.anchor<=1&&s.goal<=6&&s.goal_created<=s.day,"house memory")?;check([h.chair,h.shelter,h.stove,h.window].iter().chain(h.umbrella.iter()).all(|v|*v<=255)&&s.recent.iter().all(|v|*v<=38),"bounded house")?;Ok(())
}
pub fn validate_kit(s:&State,mask:u64)->R<()>{check(mask>>34==0,"kit bits")?;let(mut count,mut seeds)=(0,0);for i in 0..34{if mask&(1u64<<i)!=0{check((i<13&&i!=6)||(13..=21).contains(&i),"gift product")?;check(s.stock[i]<u32::MAX,"gift overflow")?;count+=1;if i>=13{seeds+=1}}}check(count<=3&&seeds<=1,"kit limit")}
pub fn max_points(s:&State)->R<u32>{fn top(mut a:[u32;34])->R<u32>{let mut points=0;for _ in 0..4{let mut best=0;let mut at=0;for i in 22..34{if a[i]>0&&weight(i)?>best{best=weight(i)?;at=i}}if best==0{break}a[at]-=1;points+=best}Ok(points)}let mut best=top(s.stock)?;let mut a=s.stock;let mut valid=true;for p in &s.plots{if p.kind>0&&p.ticks==0{let at=output(p.kind);if a[at]==u32::MAX{valid=false;break}a[at]+=1}}if valid{best=best.max(top(a)?)}for r in 0..4{if s.stock[6]>=cost(r)?&&s.stock[30+r]<u32::MAX{a=s.stock;a[30+r]+=1;best=best.max(top(a)?);}}Ok(best)}
fn active(s:&State,id:usize)->bool{s.conditions[id].severity>0&&!s.conditions[id].resolved}
fn add(c:&mut Context,id:usize,severity:u32,due:u32)->bool{let p=&mut c.s.conditions[id];let fresh=p.severity==0;if fresh{*p=Condition{severity,onset:c.day,due,resolved:false}}else{p.resolved=false;p.severity=p.severity.max(severity);if due>0&&(p.due==0||due<p.due){p.due=due}}fresh}
fn clear(s:&mut State,id:usize){if active(s,id){s.conditions[id].resolved=true}}
fn need(s:&mut State,id:usize,n:i64){s.needs[id]=(i64::from(s.needs[id])+n).clamp(0,10000)as u32}
fn restore(s:&mut State,id:usize,n:u32){need(s,id,i64::from(n));if s.needs[1]>3000{clear(s,0)}if s.needs[2]>3000{clear(s,1)}}
fn kill(c:&mut Context,cause:u32){if c.s.alive{c.s.alive=false;c.s.death=cause}}
fn damage(c:&mut Context,n:u32,physical:bool,cause:u32){let loss=if physical{n*(50-c.s.stats[0])/50}else{n};need(&mut c.s,0,-i64::from(loss));if c.s.needs[0]==0{kill(c,cause)}}
fn morale(c:&mut Context,n:u32){let loss=n*(50-c.s.stats[2])/50;need(&mut c.s,4,-i64::from(loss))}
fn infect(c:&mut Context,id:usize)->R<()>{let due=c.day.checked_add(if id==3{2}else{1}).ok_or("day overflow")?;if add(c,id,1,due){damage(c,1000,false,if id==3{5}else{6})}Ok(())}
fn wound(c:&mut Context,severity:u32)->R<()>{damage(c,if severity==1{800}else{2000},true,4);if c.s.alive{let due=c.day.checked_add(if severity==1{2}else{1}).ok_or("day overflow")?;add(c,2,severity,due);}Ok(())}
fn take(s:&mut State,id:usize,n:u32)->R<()>{check(id<34&&s.stock[id]>=n,"missing input")?;s.stock[id]-=n;Ok(())}
fn give(s:&mut State,id:usize,n:u32)->R<()>{check(id<34,"item")?;s.stock[id]=s.stock[id].checked_add(n).ok_or("stock overflow")?;Ok(())}
fn recent(s:&mut State,op:u32){s.recent.rotate_left(1);s.recent[5]=op;}
fn heat(s:&State)->bool{s.house.fire!=1&&(s.house.damage&1==0||s.house.stove>0)&&(!s.house.power_out||s.house.backup)}
pub fn draw(seed:&[u8;32],day:u32,slot:u32,label:&str)->u32{let data=format!("0x{}:{day}:{slot}:{label}",hex::encode(seed));let mut h=2166136261u32;for b in data.bytes(){h^=u32::from(b);h=h.wrapping_mul(16777619)}h^=h>>16;h=h.wrapping_mul(0x7feb352d);h^=h>>15;h=h.wrapping_mul(0x846ca68b);h^(h>>16)}
fn chance(c:&Context,label:&str,bps:u32)->bool{u64::from(draw(&c.seed,c.day,c.slot,label))*10000<u64::from(bps)*4294967296}
fn competence(c:&Context,base:u32,precision:bool,stove:bool)->u32{let mut p=0;if precision{if c.s.needs[3]==0{p+=5}if c.s.needs[4]==0{p+=5}if active(&c.s,5){p+=5}if c.s.house.mess==2{p+=5}if stove&&c.s.house.stove>0{p+=5}p=p.min(10)}(i64::from(base)+i64::from(c.s.stats[1])*200-i64::from(p)*100).clamp(100,9900)as u32}
fn main_op(op:u32)->bool{(13..=24).contains(&op)||(26..=30).contains(&op)}
fn shape(a:&Step)->R<()>{check(a.op<=38,"op")?;if a.op!=10{check(a.goods==[0;4],"unused goods")?}check(matches!(a.op,2|3|4|5|6|17|18|20|21|24|27|28|36|38)||a.arg==0,"unused argument")?;check(matches!(a.op,2|8|11|18)||a.variant==0,"unused variant")}
fn role(c:&mut Context,a:&Step)->R<()>{if a.op==1{return check(!c.pickup&&c.kit!=0&&c.slot<=6,"pickup")}if main_op(a.op){check(!c.main&&(36..=40).contains(&c.slot),"main budget")?;c.main=true;return Ok(())}if(31..=34).contains(&a.op){check(c.acute<2,"acute budget")?;c.acute+=1;return Ok(())}let mut phase=(c.slot-1)/10;if phase==0{check(c.slot<=5,"morning")?;phase=1}let bit=1<<phase;check(c.ordinary<5&&c.ordinary_mask&bit==0,"ordinary budget")?;c.ordinary+=1;c.ordinary_mask|=bit;Ok(())}
fn food(c:&mut Context,id:usize)->R<()>{check(id==2||id==1||(26..=29).contains(&id),"food")?;take(&mut c.s,id,1)?;if id==2{restore(&mut c.s,1,4000)}else if id==1{restore(&mut c.s,1,2500);restore(&mut c.s,2,3000)}else{restore(&mut c.s,1,[3000,4000,3500,6000][id-26]);restore(&mut c.s,2,[1500,1000,2500,1000][id-26])}Ok(())}
fn drink(c:&mut Context,id:usize)->R<()>{check(id<=1,"drink")?;take(&mut c.s,id,1)?;if id==0{restore(&mut c.s,2,5000)}else{restore(&mut c.s,1,2500);restore(&mut c.s,2,3000)}Ok(())}
fn goal(c:&mut Context,kind:u32,recipe:u32){let s=&mut c.s;if s.goal==0{return}if(kind==2&&s.goal==1)||(kind==3&&s.goal==recipe+3){s.goal=0;s.goal_review=0}else if(kind==0&&s.goal==2)||(kind==1&&s.goal>=3){s.goal_review=c.day.saturating_add(3)}}
fn clear_bed(p:&mut Plot){let blocked=p.blocked;*p=Plot{blocked,..Plot::default()}}
fn respond(c:&mut Context,kind:u32)->R<()>{if c.primary.kind==kind&&!c.primary.resolved&&!c.primary.responded&&c.slot<=c.primary.deadline{c.primary.responded=true;return Ok(())}check(c.task_fire.kind==kind&&!c.task_fire.resolved&&!c.task_fire.responded&&c.slot<=c.task_fire.deadline,"acute episode")?;c.task_fire.responded=true;Ok(())}
fn start_fire(c:&mut Context)->bool{let mut boundary=(c.slot+9)/10*10;if boundary-c.slot<2{boundary+=10}if boundary>60||c.s.house.fire!=0{return false}c.s.house.fire=1;c.task_fire=Episode{kind:2,start:c.slot,deadline:boundary,..Episode::default()};true}
fn apply(c:&mut Context,a:&Step)->R<()>{
 shape(a)?;role(c,a)?;let op=a.op;let arg=a.arg as usize;let v=a.variant;let clean=!active(&c.s,7);let heated=heat(&c.s);
 let mut energy=if matches!(op,0|1|7|30){0}else if op==2{200}else if matches!(op,17|18|19|20|21|22|23|24|25|26|27){300}else{100};
 if energy==300{check(c.s.needs[3]>=300,"main energy")?}
 let bps=if matches!(op,13|14|15|16|17|22|23|24|25){competence(c,if matches!(op,13|15){9500}else{9000},true,matches!(op,13|14|16|25)||op==17&&arg==0||op==24&&arg==0)}else if op==35{competence(c,7500,false,false)}else{10000};
 match op{
  0|30=>{},
  1=>{for i in 0..34{if c.kit&(1u64<<i)!=0{give(&mut c.s,i,1)?}}c.pickup=true},
  2=>{check(c.s.needs[1]<10000||c.s.needs[2]<10000,"breakfast needed")?;check(v<=1,"breakfast drink")?;food(c,arg)?;drink(c,v as usize)?},
  3=>{check(c.s.needs[1]<10000||c.s.needs[2]<10000,"food needed")?;food(c,arg)?},
  4=>{check(c.s.needs[2]<10000,"drink needed")?;drink(c,arg)?},
  5=>{check((2..=4).contains(&arg)&&active(&c.s,arg),"treatment")?;take(&mut c.s,if arg==2{11}else{4},1)?;clear(&mut c.s,arg);restore(&mut c.s,0,1500)},
  6=>{check((arg==6||arg==7)&&active(&c.s,arg),"wash")?;take(&mut c.s,10,1)?;clear(&mut c.s,arg);if arg==6{restore(&mut c.s,4,500)}},
  7=>{check(c.s.needs[3]<10000&&c.rests<2&&c.slot as i32-c.last_rest>=10,"rest")?;c.rests+=1;c.last_rest=c.slot as i32;restore(&mut c.s,3,1200)},
  8=>{check(v<=2&&c.s.needs[4]<10000&&c.leisures<2&&c.slot as i32-c.last_leisure>=10,"leisure")?;if v==2{check(c.s.house.chair>0&&(c.s.house.damage&4==0||c.s.house.chair_brace),"chair")?}if v==1{check(c.s.plots.iter().any(|p|p.kind>0),"garden")?}c.leisures+=1;c.last_leisure=c.slot as i32;restore(&mut c.s,4,if v==2{1500}else{1000})},
  9=>{let mut any=false;for p in &mut c.s.plots{if p.kind>0&&p.moisture<2{any=true;p.moisture=2}}check(any,"well needed")?;goal(c,0,0)},
  10=>{check(c.shipping&&!c.shipped,"shipping")?;let(mut points,mut end)=(0,false);for id in a.goods{if id==0{end=true;continue}check(!end&&(23..=34).contains(&id),"shipment")?;take(&mut c.s,(id-1)as usize,1)?;points+=weight((id-1)as usize)?}check(points>0,"empty shipment")?;c.points+=points;c.shipped=true},
  11=>{check(v<=2&&(c.s.needs[3]<10000||c.s.needs[4]<10000||v==2&&c.s.needs[2]<10000),"coffee")?;if v>0{check(clean,"surface")?}take(&mut c.s,5,1)?;if v==2{take(&mut c.s,1,1)?}need(&mut c.s,3,-100);energy=0;restore(&mut c.s,3,if v==1{1000}else{2000});restore(&mut c.s,4,if v==0{500}else{1500});if v==2{restore(&mut c.s,2,1500)}add(c,5,1,0);},
  12=>{check(c.s.house.mess==1,"tidy")?;c.s.house.mess=0},
  13..=16=>{check(clean&&(op==15||heated),"kitchen")?;take(&mut c.s,if op==14{3}else{2},1)?;if op==15{take(&mut c.s,1,1)?}if op==16{take(&mut c.s,3,1)?}},
  17=>{check(arg<3&&c.s.house.damage&(1<<arg)!=0&&(arg!=2||c.s.house.chair>0),"repair")?;take(&mut c.s,7,1)?},
  18=>{check(arg<4&&(1..=9).contains(&v)&&c.s.plots[arg].kind==0&&!c.s.plots[arg].blocked,"plant")?;take(&mut c.s,(12+v)as usize,1)?;c.s.plots[arg]=Plot{kind:v,ticks:first(v),left:yields(v),moisture:2,dry:0,blocked:false};goal(c,0,0)},
  19=>{let mut any=false;for i in 0..4{let mut p=c.s.plots[i];if p.kind>0&&p.ticks==0{any=true;give(&mut c.s,output(p.kind),1)?;if p.kind==9{goal(c,1,0)}p.left-=1;if p.left==0{clear_bed(&mut p)}else{p.ticks=2;p.dry=0}c.s.plots[i]=p}}check(any,"harvest")?},
  20=>{check(arg<4,"recipe")?;take(&mut c.s,6,cost(arg)?)?;give(&mut c.s,30+arg,1)?;goal(c,3,arg as u32)},
  21=>{check(arg<4&&c.s.plots[arg].blocked,"soil")?;take(&mut c.s,12,1)?;c.s.plots[arg].blocked=false},
  22|23=>{check(if op==22{c.s.house.chair==0}else{c.s.house.shelter==0},"existing build")?;take(&mut c.s,6,1)?;take(&mut c.s,7,1)?},
  24=>{check(arg<2&&c.s.house.damage&(1<<arg)!=0&&if arg==0{c.s.house.stove==0}else{c.s.house.window==0},"patch")?;take(&mut c.s,6,1)?},
  25=>{check(c.s.house.power_out&&c.s.house.damage&1==0&&!c.s.house.backup&&c.s.house.fire==0,"backup heat")?;take(&mut c.s,6,1)?;take(&mut c.s,9,1)?},
  26=>{check(c.s.house.chair>0&&!c.chair_moved&&c.primary.kind!=0,"move chair")?;c.s.house.anchor=1-c.s.house.anchor;c.chair_moved=true},
  27=>{check(arg<4&&c.s.plots[arg].kind>0,"abandon")?;clear_bed(&mut c.s.plots[arg])},
  28=>{check(arg<4&&c.s.plots[arg].kind>0&&c.s.house.shelter==0&&c.s.house.umbrella[arg]==0,"cover plot")?;take(&mut c.s,8,1)?;c.s.house.umbrella[arg]=3},
  29=>{check(c.s.house.mess==2,"deep clean")?;take(&mut c.s,10,1)?;c.s.house.mess=1},
  31|32=>{respond(c,2)?;check(c.s.house.fire>0&&(op==31||c.s.house.fire==1),"fire")?;if op==31{take(&mut c.s,0,1)?;c.s.house.fire=0;if c.primary.kind==2{c.primary.resolved=true}if c.task_fire.kind==2{c.task_fire.resolved=true}}else{c.s.house.fire=2}},
  33|34=>{respond(c,1)?;check(c.primary.kind==1&&!c.primary.resolved&&c.s.house.damage&2!=0&&c.s.house.window==0&&!c.s.house.window_brace,"rain response")?;if op==33{check(c.s.needs[3]>=300,"brace energy")?;energy=300;take(&mut c.s,7,1)?;c.s.house.window_brace=true}else{take(&mut c.s,8,1)?;c.primary.covered=true}},
  35|36=>{check(matches!(c.primary.kind,4|5)&&!c.primary.resolved&&c.slot<=c.primary.deadline,"pest")?;if op==35{check(!c.primary.shoo,"one shoo")?;c.primary.shoo=true}else{check(if c.primary.kind==4{arg==2||(13..=21).contains(&arg)}else{arg==1||arg==3},"bait")?;take(&mut c.s,arg,1)?;c.primary.resolved=true}},
  37=>{check(c.day>1&&c.s.needs[1]<=3000&&[1,2,26,27,28,29].iter().all(|i|c.s.stock[*i]==0),"raw emergency")?;take(&mut c.s,3,1)?;restore(&mut c.s,1,4500);if !c.minor&&chance(c,"raw-exposure",2500){c.minor=true;infect(c,3)?}},
  38=>{check((22..=25).contains(&arg)&&c.s.needs[4]<10000,"flower")?;take(&mut c.s,arg,1)?;restore(&mut c.s,4,[1500,1500,2500,3500][arg-22]);goal(c,2,0)},
  _=>return Err("op")
 }
 need(&mut c.s,3,-i64::from(energy));
 if bps<10000{let ok=chance(c,&format!("competence:{op}:{}:{v}",a.arg),bps);if !ok{let minor=!c.minor&&chance(c,"task-complication",2500);if op==35{if minor{c.minor=true;add(c,6,1,0);}}else if minor&&op==15{c.minor=true;add(c,7,1,0);}else if minor&&op==25&&start_fire(c){c.minor=true;}else if minor&&op!=25{c.minor=true;wound(c,1)?}else if c.s.house.mess<2{c.s.house.mess+=1}}
  else{match op{13=>{restore(&mut c.s,1,3500);restore(&mut c.s,4,800)},14=>{restore(&mut c.s,1,6500);restore(&mut c.s,4,600)},15=>{restore(&mut c.s,1,5000);restore(&mut c.s,2,2000);restore(&mut c.s,4,2000)},16=>{restore(&mut c.s,1,8000);restore(&mut c.s,4,2000)},17=>c.s.house.damage&=!(1<<arg),22=>{c.s.house.chair=5;c.s.house.anchor=0;c.s.house.damage&=!4},23=>c.s.house.shelter=4,24=>{if arg==0{c.s.house.stove=2}else{c.s.house.window=2}},25=>c.s.house.backup=true,35=>c.primary.resolved=true,_=>{}}}
 }Ok(())
}
fn episode_boundary(c:&mut Context,task:bool)->R<()>{let e=if task{c.task_fire}else{c.primary};if e.kind==0||e.resolved||e.deadline!=c.slot{return Ok(())}match e.kind{2=>{if c.s.house.fire==1{wound(c,2)?;if c.s.alive&&c.s.house.mess<2{c.s.house.mess+=1}}else if c.s.house.fire==2{damage(c,500,true,1)}c.s.house.fire=0},1=>{if c.s.house.damage&2!=0&&c.s.house.window==0&&!c.s.house.window_brace{if !e.covered{damage(c,1200,true,1)}if c.s.alive&&!c.s.house.diverted&&!e.diverted&&e.stock==0&&c.s.stock[0]>0{c.s.stock[0]-=1}}},4=>{let p=&mut c.s.plots[e.target];if p.kind>0&&p.ticks>0{let span=if p.left==yields(p.kind){first(p.kind)}else{2};if p.ticks<span{p.ticks+=1}}},5=>{if c.s.stock[e.stock]>0{c.s.stock[e.stock]-=1}},_=>{}}if task{c.task_fire.resolved=true}else{c.primary.resolved=true}Ok(())}
fn boundary(c:&mut Context)->R<()>{need(&mut c.s,1,-500);need(&mut c.s,2,-[700,600,700,700,600,700][((c.slot-1)/10)as usize]);morale(c,300);if c.s.needs[1]==0{let due=c.day.checked_add(1).ok_or("day overflow")?;if add(c,0,1,due){damage(c,1500,false,2)}}if !c.s.alive{return Ok(())}if c.s.needs[2]==0{let due=c.day.checked_add(1).ok_or("day overflow")?;if add(c,1,1,due){damage(c,1500,false,3)}}if c.s.alive{episode_boundary(c,false)?}if c.s.alive{episode_boundary(c,true)?}Ok(())}
fn bedtime(c:&mut Context)->R<()>{let exposed=(active(&c.s,6)&&c.s.conditions[6].onset<c.day)||(active(&c.s,7)&&c.s.conditions[7].onset<c.day);if exposed&&(c.witness||chance(c,"contamination-exposure",2500)){infect(c,if active(&c.s,2){4}else{3})?}if !c.s.alive{return Ok(())}
 if active(&c.s,3){if c.day>=c.s.conditions[3].onset.saturating_add(1){c.s.conditions[3].severity=2}let n=if c.s.conditions[3].severity==2{-1000}else{-500};need(&mut c.s,3,n)}if active(&c.s,4){need(&mut c.s,3,-1000)}
 if active(&c.s,2)&&c.s.conditions[2].severity==1&&c.day>=c.s.conditions[2].onset.saturating_add(1){if !active(&c.s,4)&&c.s.needs[1]>3000&&c.s.needs[2]>3000&&c.s.needs[3]>=2000{clear(&mut c.s,2)}else{c.s.conditions[2].severity=2}}
 clear(&mut c.s,5);for i in 0..5{let p=c.s.conditions[i];if active(&c.s,i)&&p.due>0&&p.due<=c.day&&(i<2||i==4||p.severity==2){kill(c,[2,3,4,5,6][i]);return Ok(())}}
 let recover=c.s.needs[1]>3000&&c.s.needs[2]>3000&&c.s.needs[3]>=2000&&!active(&c.s,4)&&!active(&c.s,0)&&!active(&c.s,1)&&!(active(&c.s,2)&&c.s.conditions[2].severity==2)&&!(active(&c.s,3)&&c.s.conditions[3].severity==2);
 need(&mut c.s,3,3500);if recover{need(&mut c.s,0,500)}for i in 0..4{let p=&mut c.s.plots[i];if p.kind>0{if p.ticks>0{if p.moisture>0{if !p.blocked{p.ticks-=1}p.dry=0}else{p.dry+=1;if p.dry>=2{clear_bed(p)}}}if p.kind>0&&p.moisture>0{p.moisture-=1}}c.s.house.umbrella[i]=c.s.house.umbrella[i].saturating_sub(1)}
 let h=&mut c.s.house;h.chair=h.chair.saturating_sub(1);h.shelter=h.shelter.saturating_sub(1);h.stove=h.stove.saturating_sub(1);h.window=h.window.saturating_sub(1);if h.chair==0{h.damage&=!4;h.anchor=0}h.chair_brace=false;h.window_brace=false;h.diverted=false;h.backup=false;h.power_out=false;h.fire=0;for p in &mut c.s.conditions{if p.resolved{*p=Condition::default()}}c.s.level=c.s.level.checked_add(1).ok_or("level overflow")?;Ok(())
}
fn proposal(c:&mut Context)->R<bool>{let kind=(u64::from(draw(&c.seed,c.day,c.slot,"primary-family"))*10/4294967296)as u32+1;c.primary=Episode{kind,start:c.slot,deadline:c.slot+9,stock:255,..Episode::default()};if !chance(c,"primary-admission",4500){c.primary.kind=0;c.primary.resolved=true;return Ok(false)}
 match kind{
  1=>{for p in &mut c.s.plots{if p.kind>0{p.moisture=2}}if c.s.house.damage&2==0||c.s.house.window>0||c.s.house.window_brace{c.primary.resolved=true;return Ok(false)}if c.s.needs[0]<=1200*(50-c.s.stats[0])/50&&c.s.stock[8]==0&&!(c.s.needs[3]>=300&&(c.s.stock[7]>0||c.s.stock[6]>0)){c.primary.resolved=true;return Ok(false)}c.primary.target=1;c.primary.stock=if c.s.stock[0]>0{0}else{255}},
  2=>{let last=c.s.recent[5];if c.s.house.fire!=0||!heat(&c.s)||!matches!(last,13|14|16|25){c.primary.kind=0;c.primary.resolved=true;return Ok(false)}c.s.house.fire=1},
  3=>{c.s.house.power_out=true;if c.s.stock[1]>0{c.s.stock[1]-=1}},
  4|10=>{let mut choices=Vec::new();for(i,p)in c.s.plots.iter().enumerate(){let span=if p.kind>0{if p.left==yields(p.kind){first(p.kind)}else{2}}else{0};if if kind==4{p.kind>0&&p.ticks>0&&p.ticks<span}else{p.kind>0&&!p.blocked&&c.s.house.shelter==0&&c.s.house.umbrella[i]==0}{choices.push(i)}}if choices.is_empty(){c.primary.kind=0;c.primary.resolved=true;return Ok(false)}let at=choices[(u64::from(draw(&c.seed,c.day,c.slot,if kind==4{"pest-plot"}else{"soil-target"}))*choices.len()as u64/4294967296)as usize];c.primary.target=at;if kind==10{c.s.plots[at].blocked=true}},
  5=>{let choices:Vec<usize>=[2,1,3].into_iter().filter(|i|c.s.stock[*i]>0).collect();if choices.is_empty(){c.primary.kind=0;c.primary.resolved=true;return Ok(false)}c.primary.stock=choices[(u64::from(draw(&c.seed,c.day,c.slot,"visitor-stock"))*choices.len()as u64/4294967296)as usize]},
  6=>{let mut choices=Vec::new();for i in 0..3{if c.s.house.damage&(1<<i)==0&&(i!=2||c.s.house.chair>0)&&!(i==0&&active(&c.s,0)&&c.s.stock[2]==0&&c.s.stock[1]==0){choices.push(i)}}if choices.is_empty(){c.primary.kind=0;c.primary.resolved=true;return Ok(false)}let at=choices[(u64::from(draw(&c.seed,c.day,c.slot,"broken-fixture"))*choices.len()as u64/4294967296)as usize];c.primary.target=at;c.s.house.damage|=1<<at},
  7=>{if c.s.needs[0]<=800*(50-c.s.stats[0])/50{c.primary.kind=0;c.primary.resolved=true;return Ok(false)}wound(c,1)?},
  8=>{if c.s.needs[0]<=1000{c.primary.kind=0;c.primary.resolved=true;return Ok(false)}infect(c,3)?},
  9=>morale(c,2000),_=>return Err("episode")
 }Ok(true)
}
fn context(mut s:State,seed:[u8;32],kit:u64,shipping:bool)->R<Context>{let day=s.day.checked_add(1).ok_or("day overflow")?;s.day=day;Ok(Context{s,day,slot:0,seed,kit,shipping,pickup:kit==0,ordinary_mask:0,ordinary:0,main:false,acute:0,rests:0,leisures:0,last_rest:-100,last_leisure:-100,minor:false,chair_moved:false,shipped:false,points:0,primary:Episode::default(),task_fire:Episode::default(),witness:false})}
fn certificate_valid(input:&Context,cert:&Certificate)->R<()>{check(cert.horizon==2&&cert.steps.len()<=24,"certificate size")?;let mut c=input.clone();c.witness=true;let mut start=c.slot;let mut at=0;for d in 0..=2{if d>0{c=context(c.s,c.seed,cert.kits[d-1],false)?;c.witness=true;validate_kit(&c.s,c.kit)?;start=1}for slot in start..=60{if !c.s.alive{break}c.slot=slot;let mut op=0;let global=d as u32*60+slot;if at<cert.steps.len()&&cert.steps[at].slot==global{let mut a=cert.steps[at].clone();at+=1;a.slot=slot;check(a.op<=8||a.op==11||(31..=34).contains(&a.op)||a.op==38,"certificate action")?;apply(&mut c,&a)?;op=a.op}else if at<cert.steps.len(){check(cert.steps[at].slot>global,"certificate chronology")?}if c.s.alive&&slot%10==0{boundary(&mut c)?}if c.s.alive&&slot==60{bedtime(&mut c)?}recent(&mut c.s,op)}check(c.s.alive&&c.pickup,"certificate survival")?}check(at==cert.steps.len()&&c.s.alive&&c.s.needs[1]>3000&&c.s.needs[2]>3000&&c.s.needs[3]>=2000,"certificate rescue")?;for i in 0..8{if i!=5{check(!active(&c.s,i),"certificate condition")?}}Ok(())}
pub fn transition(base:State,trace:&Trace,cert:Option<&Certificate>,seed:[u8;32],kit:u64,shipping:bool)->R<(State,u32)>{assert_state(&base,false)?;check(base.alive,"life ended")?;validate_kit(&base,kit)?;check(trace.steps.len()<=16,"trace size")?;let mut c=context(base,seed,kit,shipping)?;if trace.goal!=255{check(trace.goal<=6,"goal")?;if trace.goal!=c.s.goal{c.s.goal_created=c.day}c.s.goal=trace.goal;c.s.goal_review=if trace.goal==0{0}else{c.day.saturating_add(3)}}let primary=1+(u32::from_be_bytes(seed[28..32].try_into().unwrap())%5)*10;let mut at=0;
 for slot in 1..=60{if !c.s.alive{break}c.slot=slot;if slot==primary{let before=c.clone();if proposal(&mut c)?&&cert.is_none_or(|cert|certificate_valid(&c,cert).is_err()){c=before;c.primary=Episode{start:slot,deadline:slot+9,stock:255,resolved:true,..Episode::default()}}}if c.day>1&&slot==31&&u64::from(draw(&c.seed,c.day,31,"structural-exception"))*4000<4294967296{kill(&mut c,7)}if c.s.alive{let mut op=0;if at<trace.steps.len()&&trace.steps[at].slot==slot{let a=&trace.steps[at];at+=1;apply(&mut c,a)?;op=a.op}else if at<trace.steps.len(){check(trace.steps[at].slot>slot,"trace chronology")?}if c.s.alive&&slot%10==0{boundary(&mut c)?}if c.s.alive&&slot==60{bedtime(&mut c)?}recent(&mut c.s,op)}}check(at==trace.steps.len(),"action after death")?;if c.s.alive{check(c.pickup,"unopened delivery")?}else if !c.pickup{for i in 0..34{if c.kit&(1u64<<i)!=0{give(&mut c.s,i,1)?}}}assert_state(&c.s,false)?;Ok((c.s,c.points))}

// Canonical Ethereum ABI codecs deliberately retained across native and EVM worlds.
fn put(out:&mut Vec<u8>,v:u64){out.extend([0u8;24]);out.extend(v.to_be_bytes());}
fn word(raw:&[u8],at:usize,bits:usize)->R<u64>{let p=raw.get(at*32..at*32+32).ok_or("short ABI")?;check(p[..24].iter().all(|b|*b==0),"wide ABI value")?;let n=u64::from_be_bytes(p[24..32].try_into().unwrap());check(bits==64||n<(1u64<<bits),"ABI integer")?;Ok(n)}
fn boolean(raw:&[u8],at:usize)->R<bool>{Ok(word(raw,at,1)?==1)}
pub fn encode_state(s:&State)->Vec<u8>{let mut o=Vec::with_capacity(4160);put(&mut o,u64::from(s.version));o.extend(s.seed);for v in [s.day,s.level,s.alive as u32,s.death]{put(&mut o,u64::from(v))}for v in s.stats.iter().chain(s.needs.iter()).chain(s.stock.iter()){put(&mut o,u64::from(*v))}for c in &s.conditions{for v in [c.severity,c.onset,c.due,c.resolved as u32]{put(&mut o,u64::from(v))}}for p in &s.plots{for v in [p.kind,p.ticks,p.left,p.moisture,p.dry,p.blocked as u32]{put(&mut o,u64::from(v))}}let h=&s.house;for v in [h.mess,h.damage,h.chair,h.anchor,h.shelter].into_iter().chain(h.umbrella).chain([h.stove,h.window,h.chair_brace as u32,h.window_brace as u32,h.diverted as u32,h.backup as u32,h.power_out as u32,h.fire,s.goal,s.goal_created,s.goal_review]).chain(s.recent){put(&mut o,u64::from(v))}o}
pub fn decode_state(raw:&[u8])->R<State>{check(raw.len()==4160,"state size")?;let seed=raw[32..64].try_into().unwrap();let mut s=initialize(seed,[2,2,1])?;s.version=word(raw,0,8)?as u32;s.day=word(raw,2,32)?as u32;s.level=word(raw,3,32)?as u32;s.alive=boolean(raw,4)?;s.death=word(raw,5,8)?as u32;let mut at=6;for v in &mut s.stats{*v=word(raw,at,8)?as u32;at+=1}for v in &mut s.needs{*v=word(raw,at,16)?as u32;at+=1}for v in &mut s.stock{*v=word(raw,at,32)?as u32;at+=1}for c in &mut s.conditions{*c=Condition{severity:word(raw,at,8)?as u32,onset:word(raw,at+1,32)?as u32,due:word(raw,at+2,32)?as u32,resolved:boolean(raw,at+3)?};at+=4}for p in &mut s.plots{*p=Plot{kind:word(raw,at,8)?as u32,ticks:word(raw,at+1,8)?as u32,left:word(raw,at+2,8)?as u32,moisture:word(raw,at+3,8)?as u32,dry:word(raw,at+4,8)?as u32,blocked:boolean(raw,at+5)?};at+=6}let h=&mut s.house;h.mess=word(raw,at,8)?as u32;h.damage=word(raw,at+1,8)?as u32;h.chair=word(raw,at+2,8)?as u32;h.anchor=word(raw,at+3,8)?as u32;h.shelter=word(raw,at+4,8)?as u32;at+=5;for v in &mut h.umbrella{*v=word(raw,at,8)?as u32;at+=1}h.stove=word(raw,at,8)?as u32;h.window=word(raw,at+1,8)?as u32;h.chair_brace=boolean(raw,at+2)?;h.window_brace=boolean(raw,at+3)?;h.diverted=boolean(raw,at+4)?;h.backup=boolean(raw,at+5)?;h.power_out=boolean(raw,at+6)?;h.fire=word(raw,at+7,8)?as u32;at+=8;s.goal=word(raw,at,8)?as u32;s.goal_created=word(raw,at+1,32)?as u32;s.goal_review=word(raw,at+2,32)?as u32;at+=3;for v in &mut s.recent{*v=word(raw,at,8)?as u32;at+=1}assert_state(&s,false)?;check(encode_state(&s)==raw,"noncanonical state")?;Ok(s)}
fn encode_step(o:&mut Vec<u8>,a:&Step){for v in [a.slot,a.op,a.arg,a.variant].into_iter().chain(a.goods){put(o,u64::from(v))}}
fn decode_step(raw:&[u8],at:usize)->R<Step>{Ok(Step{slot:word(raw,at,8)?as u32,op:word(raw,at+1,8)?as u32,arg:word(raw,at+2,8)?as u32,variant:word(raw,at+3,8)?as u32,goods:[word(raw,at+4,8)?as u32,word(raw,at+5,8)?as u32,word(raw,at+6,8)?as u32,word(raw,at+7,8)?as u32]})}
pub fn decode_trace(raw:&[u8])->R<Trace>{check(raw.len()>=128&&raw.len()<=4608&&word(raw,0,64)?==32&&word(raw,2,64)?==64,"trace ABI")?;let count64=word(raw,3,64)?;check(count64<=16,"trace count")?;let count=count64 as usize;check(raw.len()==128+count*256,"trace size")?;let goal=word(raw,1,8)?as u32;check(goal<=6||goal==255,"trace goal")?;let mut steps=Vec::new();for i in 0..count{steps.push(decode_step(raw,4+i*8)?)}Ok(Trace{goal,steps})}
pub fn decode_certificate(raw:&[u8])->R<Option<Certificate>>{if raw.is_empty(){return Ok(None)}check(raw.len()>=192&&raw.len()<=8192&&word(raw,0,64)?==32&&word(raw,4,64)?==128,"certificate ABI")?;let count64=word(raw,5,64)?;check(count64<=24,"certificate count")?;let count=count64 as usize;check(raw.len()==192+count*256,"certificate size")?;let horizon=word(raw,1,8)?as u32;let kits=[word(raw,2,64)?,word(raw,3,64)?];let dummy=initialize([0;32],[2,2,1])?;validate_kit(&dummy,kits[0])?;validate_kit(&dummy,kits[1])?;let mut steps=Vec::new();for i in 0..count{steps.push(decode_step(raw,6+i*8)?)}Ok(Some(Certificate{horizon,kits,steps}))}
pub fn history(t:&Trace)->Vec<u8>{let mut out=vec![t.goal as u8];for a in &t.steps{out.extend([a.slot as u8,a.op as u8,a.arg as u8,a.variant as u8]);out.extend(a.goods.map(|v|v as u8))}out}
pub fn encode_trace(t:&Trace)->Vec<u8>{let mut out=Vec::new();for n in [32,t.goal as u64,64,t.steps.len()as u64]{put(&mut out,n)}for s in &t.steps{encode_step(&mut out,s)}out}
