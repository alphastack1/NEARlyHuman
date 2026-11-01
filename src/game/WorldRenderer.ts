import Phaser from 'phaser';
import type { DayResult, GameState, ItemId, Receipt, TargetId } from '../domain/types';
import { ITEM_IDS } from '../domain/types';
import { canvasArt, drawItem } from '../art/pixels';
import { fixtureCanvas, fixtureTextureKey, houseArtOptions, FIXTURE_SIZES, type FixtureArt, type ArtOptions } from '../art/fixtures';
import { houseCanvas, homeArtSeed } from '../art/house';
import { roosterCanvas, ROOSTER_FRAME, type RoosterPose } from '../art/rooster';
import { ACTION_PROPS, actionPropCanvas, actionResultProp } from '../art/action-props';
import { PROP_URLS } from '../art/asset-urls';
import { findRoute, targetPoint, TARGET_LABELS, WORLD_HEIGHT, WORLD_WIDTH, type WorldPoint } from './layout';
import { purposefulTravelMs, receiptTiming } from './presentation';
import { quietSpanAt } from './quiet-spans';

export interface WorldCallbacks {
 onReceipt?:(receipt:Receipt,index:number)=>void;
 onSnapshot?:(state:GameState,index:number)=>void;
 onMessage?:(lines:[string,string])=>void;
 onProgress?:(index:number,total:number)=>void;
 onComplete?:()=>void;
 onInspect?:(target:TargetId)=>void;
}
export interface SavePresentation { sleep?:boolean; dim?:boolean; focus?:TargetId }
export interface PlaybackOptions { startIndex?:number; durationMs?:number }
export interface WorldController {
 ready:Promise<void>;
 showSave:(state?:GameState,options?:SavePresentation)=>void;
 playDay:(day:DayResult,options?:PlaybackOptions)=>void;
 pause:()=>void;resume:()=>void;skip:()=>void;seek:(index:number)=>void;
 setMuted:(muted:boolean)=>void;setZoom:(zoom:number)=>void;
 setInputEnabled:(enabled:boolean)=>void;
 getCurrentIndex:()=>number;isPaused:()=>boolean;
 dispose:()=>void;
}

interface Prop {kind:FixtureArt;id?:TargetId;x:number;y:number;image:Phaser.GameObjects.Image;shadow?:Phaser.GameObjects.Ellipse;opts:ArtOptions}
interface Particle {sprite:Phaser.GameObjects.Rectangle;x:number;y:number;vx:number;vy:number;life:number;total:number}
interface Playback {day:DayResult;index:number;elapsed:number;normalSlot:number;perSlot:number;route:WorldPoint[];routeLength:number;travel:number;effect:boolean;stage:'prelude'|'receipts'|'ending';paused:boolean;preludeTarget:'mailbox'|'store';montage?:boolean;originCamera?:WorldPoint;quietSpanEnd?:number}

const demoState:GameState={version:1,seed:'demo',name:'BOK',stats:{body:2,wits:2,spirit:1},day:0,level:0,alive:true,needs:{health:10000,nutrition:8000,hydration:8000,energy:8000,morale:8000},inventory:Object.fromEntries(ITEM_IDS.map(i=>[i,0])) as GameState['inventory'],conditions:[],plots:[{plant:null,growth:0,moisture:0,dryDays:0,soilBlocked:false,pendingBonus:false},{plant:null,growth:0,moisture:0,dryDays:0,soilBlocked:false,pendingBonus:false}],house:{mess:0,damage:{stove:false,window:false,chair:false},chairLife:0,chairAnchor:0,shelterLife:0,umbrellaLife:[0,0],stovePatch:0,windowPatch:0,chairBrace:false,windowBrace:false,dripDiverted:false,backupHeat:false,powerOut:false,fire:'none'},recent:[]};

class HomeScene extends Phaser.Scene {
 private cb:WorldCallbacks;
 private props:Prop[]=[];
 private actor!:Phaser.GameObjects.Image;
 private shadow!:Phaser.GameObjects.Ellipse;
 private held!:Phaser.GameObjects.Image;
 private secondHeld!:Phaser.GameObjects.Image;
 private blanket!:Phaser.GameObjects.Image;
 private night!:Phaser.GameObjects.Rectangle;
 private zeds:Phaser.GameObjects.Text[]=[];
 private state:GameState=demoState;
 private playback:Playback|null=null;
 private particles:Particle[]=[];
 private clock=0;private frame='';private seed='demo';private facing=1;private modeSleep=true;
 private fireFx!:Phaser.GameObjects.Graphics;private messFx!:Phaser.GameObjects.Graphics;private taskFx!:Phaser.GameObjects.Graphics;
 private worldPoint:WorldPoint={x:312,y:88};private cameraPoint:WorldPoint={x:368,y:120};
 private readyResolve:()=>void;
 private muted=false;private audio:AudioContext|null=null;private lastStep=0;
 private lastMessage='';
 private ambientFx!:Phaser.GameObjects.Graphics;
 private homeSeed='';
 private floorImage!:Phaser.GameObjects.Image;private lightLevel=.23;private lightTint=-1;
 private transition!:Phaser.GameObjects.Rectangle;
 private inspectFx!:Phaser.GameObjects.Graphics;private inspectMark?:{x:number;y:number;w:number;h:number;remaining:number};
 private queued:(()=>void)[]=[];private initialized=false;
 private inputEnabled=true;

 constructor(cb:WorldCallbacks,readyResolve:()=>void){super('home');this.cb=cb;this.readyResolve=readyResolve;}
 preload():void {
  for(const[key,url]of Object.entries(PROP_URLS))this.load.image('asset-'+key,url);
 }
 create():void {
  this.cameras.main.setViewport(0,38,256,182).setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT).setZoom(1.1).setRoundPixels(true);
  this.textures.addCanvas('home-floor',houseCanvas());this.floorImage=this.add.image(0,0,'home-floor').setOrigin(0).setDepth(0);
  for(const id of ITEM_IDS)this.textures.addCanvas('item-'+id,canvasArt(16,16,p=>drawItem(p,id)));
  for(const id of ACTION_PROPS)this.textures.addCanvas('result-'+id,actionPropCanvas(id));
  this.props=[];
  const add=(kind:FixtureArt,x:number,y:number,id?:TargetId,opts:ArtOptions={})=>this.addProp(kind,x,y,id,opts);
  add('window',136,48,'window');add('fridge',72,80,'store');add('pantry',120,80,'store');add('stove',176,80,'stove');add('prep',208,80,'prep');
  // A continuous functional counter run; narrow infill does not add an activity.
  const counter=this.add.graphics().setDepth(48);counter.fillStyle(0x523c2a);counter.fillRect(82,53,143,28);counter.fillStyle(0xbf8c52);counter.fillRect(82,53,143,5);counter.fillStyle(0xdda96b);counter.fillRect(83,53,141,1);counter.fillStyle(0x9c7042);counter.fillRect(83,60,141,18);for(const[x,w]of [[86,17],[138,21]]){counter.fillStyle(0x6e4e32);counter.fillRect(x,60,w,18);counter.fillStyle(0xa77947);counter.fillRect(x+1,61,w-2,15);counter.fillStyle(0xc09258);counter.fillRect(x+1,61,w-2,1);counter.fillStyle(0xdfbd78);counter.fillRect(x+w-4,66,1,3);}counter.fillStyle(0x66472e);counter.fillRect(83,79,141,2);
  add('plant',47,87);add('shelf',207,37);add('table',124,160);add('plant',56,183);
  add('bed',312,112,'bed');add('bedside',354,101);add('cupboard',432,80,'cupboard');add('plant',395,79);add('painting',284,48);add('painting',449,153);add('shelf',345,177);
  add('baseSeat',80,336,'baseSeat');add('plant',115,323);add('painting',69,292);add('painting',172,292);add('plant',193,379);
  add('chair',168,336,'chair');
  add('sink',336,320,'body');add('plant',301,327);add('painting',335,280);
  add('plot',408,338,'plot1',{plot:this.state.plots[0]});add('plot',456,338,'plot2',{plot:this.state.plots[1]});
  add('shelter',432,354,'gardenShelter');add('umbrella',408,341);add('umbrella',456,341);
  add('plant',390,405);add('plant',474,399);add('mailbox',344,400,'mailbox');add('plant',304,402);
  this.shadow=this.add.ellipse(this.worldPoint.x,this.worldPoint.y,16,5,0x302f28,.22).setDepth(200);
  this.actor=this.add.image(this.worldPoint.x,this.worldPoint.y,'__DEFAULT').setOrigin(ROOSTER_FRAME.footX/32,ROOSTER_FRAME.footY/40).setScale(1.45).setDepth(201);
  this.held=this.add.image(0,0,'item-water').setOrigin(.5).setVisible(false).setDepth(202);
  this.secondHeld=this.add.image(0,0,'item-water').setOrigin(.5).setVisible(false).setDepth(202);
  this.blanket=this.add.image(312,112,this.texture('bedCover')).setOrigin(.5,1).setScale(1.2).setDepth(500).setVisible(false);
  for(let i=0;i<3;i++)this.zeds.push(this.add.text(314+i*5,61-i*7,'z',{fontFamily:'monospace',fontSize:i===0?'8px':'6px',fontStyle:'bold',color:'#eee8ce'}).setDepth(502));
  this.fireFx=this.add.graphics().setDepth(470);this.messFx=this.add.graphics().setDepth(4);this.taskFx=this.add.graphics().setDepth(480);
  this.ambientFx=this.add.graphics().setDepth(13);
  this.night=this.add.rectangle(0,0,640,500,0x192945,1).setOrigin(0).setScrollFactor(0).setDepth(900).setAlpha(.22);
  this.transition=this.add.rectangle(0,0,640,500,0x182d3d,1).setOrigin(0).setScrollFactor(0).setDepth(950).setAlpha(0);
  this.inspectFx=this.add.graphics().setDepth(960);
  this.input.enabled=this.inputEnabled;this.applyState(this.state);this.setSave(this.state);this.initialized=true;this.readyResolve();for(const q of this.queued)q();this.queued=[];
 }
 private texture(kind:FixtureArt,opts:ArtOptions={}):string {
  const key=fixtureTextureKey(kind,opts);if(this.textures.exists(key))return key;
  const asset=kind==='pantry'?'prep':kind==='bedCover'?'bed':kind;
  if(this.textures.exists('asset-'+asset)){
   const source=this.textures.get('asset-'+asset).getSourceImage() as HTMLImageElement;const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;ctx.drawImage(source,0,0);
   const p=(c:string,x:number,y:number,w:number,h:number)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
   const variant=opts.variant||0;
   if(kind==='plant'&&variant){
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
    for(let i=0;i<pixels.data.length;i+=4){const d=pixels.data;if(!d[i+3])continue;
     if(d[i+1]>d[i]*1.25&&d[i+1]>d[i+2]*1.12){d[i]=Math.min(255,d[i]+(variant===1?9:variant===2?-5:3));d[i+1]=Math.max(0,Math.min(255,d[i+1]+(variant===1?5:variant===2?-6:1)));}
    }ctx.putImageData(pixels,0,0);
   }
   if((kind==='bed'||kind==='bedCover')&&variant){
    if(variant%2)for(const x of [13,29]){p('#487fb5',x,34,1,18);p('#74a2ca',x+1,34,1,18);}
    else for(const[x,y]of [[13,37],[26,37],[20,47],[32,47]]){p('#70a0cd',x,y,3,1);p('#70a0cd',x+1,y-1,1,3);}
   }
   if(kind==='bedCover')ctx.clearRect(0,0,canvas.width,25);
   if(kind==='stove'&&opts.damaged)for(const[x,y]of [[26,14],[25,17],[26,19],[25,22],[27,25],[28,28]])p('#242b2b',x,y,1,3);
   if(kind==='stove'&&opts.patched){p('#553c28',24,22,7,11);p('#b9854b',25,23,5,9);p('#d3a66b',25,23,5,1);p('#71796f',26,25,2,2);p('#71796f',26,29,2,2);}
   if(kind==='chair'&&opts.damaged){p('#352a22',3,20,2,4);p('#352a22',5,22,1,2);}
   if(kind==='chair'&&opts.braced){p('#e8e2c9',2,21,5,3);p('#fff5db',2,21,5,1);p('#b9bea9',2,23,5,1);}
   if(kind==='fridge'&&opts.open){p('#475956',5,21,19,20);p('#a8b8aa',6,25,17,1);p('#a8b8aa',6,33,17,1);p('#b9c5b2',6,39,17,1);p('#d4dcce',0,21,6,20);p('#81988e',0,21,1,20);p('#4eabe0',10,28,3,4);p('#f1e6cc',17,35,3,4);}
   if(kind==='cupboard'&&opts.open){p('#4f3928',6,12,16,25);p('#a27b49',6,24,16,2);p('#a27b49',6,35,16,2);p('#ddd5b5',8,18,4,5);p('#c44544',9,19,2,3);p('#45806c',16,28,3,6);p('#ad7d45',2,10,4,29);p('#ca9855',2,10,1,28);}
   this.textures.addCanvas(key,canvas);
  }else this.textures.addCanvas(key,fixtureCanvas(kind,opts));return key;
 }
 private addProp(kind:FixtureArt,x:number,y:number,id?:TargetId,opts:ArtOptions={}):Prop {
  const [width]=FIXTURE_SIZES[kind];
  const shadow=!['bedCover','window','painting','shelf','umbrella','shelter'].includes(kind)?this.add.ellipse(x+1,y+1,width*.9,Math.max(3,width*.13),0x4b3926,.25).setDepth(y-.8):undefined;
  const image=this.add.image(x,y,this.texture(kind,opts)).setOrigin(.5,1).setDepth(y);
  if(kind==='window')image.setDepth(12);
  if(kind==='bed')image.setScale(1.2);
  const p:Prop={kind,id,x,y,image,shadow,opts};this.props.push(p);
  if(id){const px=Math.max(0,(32-image.width)/2),py=Math.max(0,(32-image.height)/2);image.setInteractive(new Phaser.Geom.Rectangle(-px,-py,image.width+px*2,image.height+py*2),Phaser.Geom.Rectangle.Contains);image.input!.cursor='pointer';image.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{
   if(!this.inputEnabled||pointer.event?.target!==this.game.canvas||!image.visible)return;let selected=p;
   if(p.kind==='shelter'){const plot=this.props.find(q=>q.kind==='plot'&&Math.abs(pointer.worldX-q.x)<=20&&pointer.worldY>=q.y-32&&pointer.worldY<=q.y+8);if(plot)selected=plot;}
   this.pausePlayback();this.openAudio();const bounds=selected.image.getBounds();this.inspectMark={x:bounds.x-2,y:bounds.y-2,w:bounds.width+4,h:bounds.height+4,remaining:650};this.drawInspect(0);this.cb.onInspect?.(selected.id!);this.tone('tap');
  });}
  return p;
 }
 private setProp(prop:Prop,opts:ArtOptions):void {prop.opts=opts;prop.image.setTexture(this.texture(prop.kind,opts));}
 private pose(pose:RoosterPose):void {
  const key='rooster-'+this.seed+'-'+pose;if(!this.textures.exists(key))this.textures.addCanvas(key,roosterCanvas(this.seed,pose));
  if(this.frame!==key){this.actor.setTexture(key);this.frame=key;}
  // The source foot is not centered. Mirror its pivot along with its pixels so
  // turning left never slides BOK away from the route or the contact shadow.
  this.actor.setFlipX(this.facing<0).setOrigin((this.facing<0?32-ROOSTER_FRAME.footX:ROOSTER_FRAME.footX)/32,ROOSTER_FRAME.footY/40);
 }
 private applyState(state:GameState):void {
  const previousSeed=this.seed;this.state=state;this.seed=state.seed||'demo';
  if(this.homeSeed!==this.seed){
   this.homeSeed=this.seed;const seed=homeArtSeed(this.seed),texture=this.textures.get('home-floor') as Phaser.Textures.CanvasTexture;
   texture.context.clearRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);texture.context.drawImage(houseCanvas(seed),0,0);texture.refresh();
   const bedding=homeArtSeed(this.seed+':blanket')%3;
   for(let i=0;i<this.props.length;i++){const p=this.props[i];
    if(['plant','painting','shelf','bed','bedside'].includes(p.kind)){
     const variant=p.kind==='bed'?bedding:homeArtSeed(this.seed+':'+p.kind+':'+i)%4;
     this.setProp(p,{...p.opts,variant});if(p.kind==='plant')p.image.setScale(variant===2?.92:1);
    }
   }
   this.blanket.setTexture(this.texture('bedCover',{variant:bedding}));
   this.pose(this.modeSleep?'sleep':'idle');
   if(previousSeed!==this.seed)for(const key of this.textures.getTextureKeys())if(key.startsWith('rooster-'+previousSeed+'-'))this.textures.remove(key);
  }
  for(const p of this.props){
   if(p.kind==='stove'||p.kind==='window')this.setProp(p,houseArtOptions(state,p.kind));
   if(p.id==='chair'){p.image.setVisible(state.house.chairLife>0);p.x=168;p.y=state.house.chairAnchor?384:336;p.image.setPosition(p.x,p.y).setDepth(p.y);this.setProp(p,houseArtOptions(state,'chair'));}
   if(p.kind==='plot')this.setProp(p,{plot:state.plots[p.id==='plot1'?0:1]});
   if(p.kind==='shelter')p.image.setVisible(state.house.shelterLife>0).setAlpha(.9);
   if(p.kind==='umbrella')p.image.setVisible(state.house.umbrellaLife[p.x<430?0:1]>0&&state.house.shelterLife===0);
   p.shadow?.setPosition(p.x+1,p.y+1).setDepth(p.y-.8).setVisible(p.image.visible);
  }
  this.drawMess();
 }
 private drawMess():void {
  this.messFx.clear();const count=this.state.house.mess*8;
  for(let i=0;i<count;i++){const x=156+(i*23%55),y=100+(i*13%36);this.messFx.fillStyle(i%3===0?0x9b774a:0xb9955e,.9);this.messFx.fillRect(x,y,i%2+1,1);}
  if(this.state.conditions.some(c=>c.kind==='contaminatedSurface'&&!c.resolved)){this.messFx.fillStyle(0x76835b,.7);this.messFx.fillRect(201,57,3,2);this.messFx.fillRect(211,59,2,1);}
 }
 public setSave(state:GameState=demoState,options:SavePresentation={}):void {this.enqueue(()=>{
  this.playback=null;this.inspectMark=undefined;this.inspectFx.clear();this.transition.setAlpha(0);this.taskFx.clear();this.closeStorage();this.applyState(state);this.modeSleep=options.sleep!==false&&state.alive;this.held.setVisible(false);this.secondHeld.setVisible(false);this.actor.setVisible(state.alive);this.actor.setRotation(0);
  this.shadow.setVisible(state.alive&&!this.modeSleep);this.blanket.setVisible(this.modeSleep);this.setLight(options.dim===false?0:state.day===0?.05:.23);
  if(this.modeSleep){this.worldPoint={x:312,y:74};this.cameraPoint={x:368,y:112};this.facing=1;this.pose('sleep');}
  else{this.worldPoint=targetPoint(options.focus||'bed',state.house.chairAnchor);this.cameraPoint={x:this.worldPoint.x,y:this.worldPoint.y+18};this.pose('idle');}
  if(options.focus&&!this.modeSleep)this.cameraPoint=targetPoint(options.focus,state.house.chairAnchor);
  this.actor.setPosition(this.worldPoint.x,this.worldPoint.y);this.shadow.setPosition(this.worldPoint.x,this.worldPoint.y);this.centerCamera(true);
 });}
 public start(day:DayResult,options:PlaybackOptions={}):void {this.enqueue(()=>{
  this.openAudio();this.clearParticles();this.transition.setAlpha(0);this.modeSleep=false;this.blanket.setVisible(false);this.setLight(0);for(const z of this.zeds)z.setVisible(false);
  const index=Math.min(Math.max(0,options.startIndex||0),Math.max(0,day.receipts.length-1));const first=day.receipts[index];if(!first){this.applyState(day.finalState);this.cb.onComplete?.();return;}
  const approach=first.decisionSnapshot||first.before;
  this.actor.setVisible(true);this.shadow.setVisible(true);this.applyState(approach);this.worldPoint=index===0&&day.baseDay>0?targetPoint('mailbox'):this.receiptPoint(first,approach);this.actor.setPosition(this.worldPoint.x,this.worldPoint.y);this.cameraPoint={x:this.worldPoint.x,y:this.worldPoint.y+18};this.centerCamera(true);
  const normalSlot=Math.max(1900,((options.durationMs||180000)-6000)/60);this.lastMessage='';
  this.playback={day,index,elapsed:0,normalSlot,perSlot:normalSlot,route:[],routeLength:0,travel:0,effect:false,stage:index===0&&day.baseDay>0?'prelude':'receipts',paused:false,preludeTarget:'mailbox'};
  this.cb.onSnapshot?.(approach,index);
  if(this.playback.stage==='prelude'){
   const mailbox=this.props.find(p=>p.kind==='mailbox')!;this.setProp(mailbox,{open:true,parcel:day.delivery.length>0});this.held.setVisible(false);this.pose('use');
   this.cb.onMessage?.(day.delivery.length?['The delivery is here.','Into the cupboards.']:['Nothing new today.','Using stored supplies.']);
  }else{
   const lines:[string,string]=index>0?day.receipts[index-1].lines:['',''];
   this.lastMessage=lines.join('\n');this.cb.onMessage?.(lines);this.beginReceipt(false);
  }
 });}
 private beginReceipt(notifySnapshot=true,allowQuietSpan=true):void {
  const pb=this.playback;if(!pb)return;const receipt=pb.day.receipts[pb.index];if(!receipt){this.beginEnding();return;}
  delete pb.quietSpanEnd;
  const approach=receipt.decisionSnapshot||receipt.before;
  this.closeStorage();this.blanket.setVisible(false);this.applyState(approach);this.actor.setVisible(approach.alive);this.held.setVisible(false);
  this.setLight(({Dawn:.05,Morning:0,Midday:0,Afternoon:0,Evening:.08,Bedtime:.17} as Record<string,number>)[receipt.phase]||0);
  const instantTerminal=!receipt.decisionSnapshot&&!receipt.snapshot.alive&&receipt.action==='T01'&&!receipt.choice;
  const dest=instantTerminal?this.worldPoint:this.receiptPoint(receipt,approach);pb.route=[{...this.worldPoint},...findRoute(this.worldPoint,dest)];
  pb.routeLength=0;for(let i=1;i<pb.route.length;i++)pb.routeLength+=Phaser.Math.Distance.BetweenPoints(pb.route[i-1],pb.route[i]);
  const quietNeighbors=pb.day.receipts[pb.index-1]?.action==='T01'||pb.day.receipts[pb.index+1]?.action==='T01';
  const timing=receiptTiming(receipt,pb.routeLength,pb.normalSlot,quietNeighbors);pb.travel=timing.travel;pb.perSlot=timing.duration;pb.montage=timing.montage;pb.originCamera={...this.cameraPoint};pb.elapsed=0;pb.effect=false;this.transition.setAlpha(0);
  const quietSpan=allowQuietSpan?quietSpanAt(pb.day.receipts,pb.index):undefined;
  if(quietSpan){pb.quietSpanEnd=quietSpan.end;pb.perSlot=Math.max(pb.perSlot,1850);}
  this.cb.onReceipt?.(receipt,pb.index);if(notifySnapshot)this.cb.onSnapshot?.(approach,pb.index);this.cb.onProgress?.(pb.index,pb.day.receipts.length);
 }
 private receiptPoint(receipt:Receipt,state:GameState):WorldPoint {
  if(receipt.target==='pest'){
   const episode=receipt.choice?.situation?.episodes.find(e=>!e.resolved&&(e.kind==='visitor'||e.kind==='seedEater'));
   if(episode?.kind==='visitor')return{x:88,y:121};
   if(episode?.kind==='seedEater')return targetPoint(episode.target==='plot2'?'plot2':'plot1');
  }
  if(receipt.action==='H14')return{...targetPoint('window'),y:105};
  const point=targetPoint(receipt.target,state.house.chairAnchor);
  if(receipt.action.startsWith('G')&&(receipt.target==='plot1'||receipt.target==='plot2'))point.x+=receipt.target==='plot1'?-16:16;
  return point;
 }
 private beginEnding():void {
  const pb=this.playback;if(!pb)return;this.closeStorage();this.held.setVisible(false);this.secondHeld.setVisible(false);this.taskFx.clear();this.transition.setAlpha(0);pb.montage=false;pb.stage='ending';pb.elapsed=0;pb.effect=false;
  if(pb.day.finalState.alive){
   const dest=targetPoint('bed');pb.route=[{...this.worldPoint},...findRoute(this.worldPoint,dest)];pb.routeLength=0;
   for(let i=1;i<pb.route.length;i++)pb.routeLength+=Phaser.Math.Distance.BetweenPoints(pb.route[i-1],pb.route[i]);
   pb.travel=purposefulTravelMs(pb.routeLength);
  }else pb.travel=0;
 }
 private closeStorage():void {for(const p of this.props)if(p.kind==='fridge'||p.kind==='cupboard')this.setProp(p,{});}
 private moveOnRoute(pb:Playback,t:number):void {
  let distance=pb.routeLength*Math.min(1,t);let point=pb.route.at(-1)||this.worldPoint;let prev=pb.route[0]||point;
  for(let i=1;i<pb.route.length;i++){const p=pb.route[i],d=Phaser.Math.Distance.BetweenPoints(prev,p);if(distance<=d){const k=d?distance/d:1;point={x:Phaser.Math.Linear(prev.x,p.x,k),y:Phaser.Math.Linear(prev.y,p.y,k)};if(p.x!==prev.x)this.facing=p.x>prev.x?1:-1;break;}distance-=d;prev=p;}
  this.worldPoint={x:Math.round(point.x),y:Math.round(point.y)};
 }
 private beginEffect(receipt:Receipt):void {
  this.applyState(receipt.snapshot);this.cb.onSnapshot?.(receipt.snapshot,receipt.index);
  const message=receipt.lines.join('\n');if(message!==this.lastMessage){this.cb.onMessage?.(receipt.lines);this.lastMessage=message;}
  const colors=receipt.success?['#f6e3a7','#b6d391']:['#c7a16a','#d48561'];
  if(receipt.action!=='T01')this.emitPixels(this.actor.x+this.facing*8,this.actor.y-12,colors[0],6);
  if(receipt.action==='H16'||receipt.action==='G02')this.emitPixels(this.worldPoint.x+8,this.worldPoint.y-13,'#78bfe2',10,'water');
  if(['H05','H06','H07'].includes(receipt.action))this.emitPixels(this.worldPoint.x+7,this.worldPoint.y-8,'#f1f1d9',7);
  if(receipt.action==='H02')this.emitPixels(this.worldPoint.x,this.worldPoint.y-15,'#a6c88a',7);
  if(receipt.action!=='T01')this.tone(receipt.success?receipt.action.startsWith('G')?'garden':receipt.action.startsWith('K')?'cook':'use':'hurt');
  if(!receipt.snapshot.alive){this.held.setVisible(false);this.pose('dead');this.actor.setRotation(-Math.PI/2);this.tone('death');}
 }
 update(_time:number,delta:number):void {
  if(!this.initialized)return;
  const paused=!!this.playback?.paused;const dt=paused?0:Math.min(delta,70);this.clock+=dt;
  if(!paused)this.updatePlayback(dt);
  this.updateActor(paused);this.drawInspect(Math.min(delta,70));if(!paused){this.updateParticles(dt);this.drawHazards();this.drawTask();this.drawAmbient();this.centerCamera(false,dt);}
 }
 private updatePlayback(dt:number):void {
  const pb=this.playback;if(!pb)return;pb.elapsed+=dt;
  if(pb.stage==='prelude'){
   if(pb.elapsed>900&&pb.preludeTarget==='mailbox'){pb.preludeTarget='store';const m=this.props.find(p=>p.kind==='mailbox')!;this.setProp(m,{open:false,parcel:false});const dest=targetPoint('store');pb.route=[{...this.worldPoint},...findRoute(this.worldPoint,dest)];pb.routeLength=0;for(let i=1;i<pb.route.length;i++)pb.routeLength+=Phaser.Math.Distance.BetweenPoints(pb.route[i-1],pb.route[i]);pb.travel=purposefulTravelMs(pb.routeLength);this.tone('tap');}
   if(pb.preludeTarget==='store')this.moveOnRoute(pb,Math.min(1,(pb.elapsed-900)/pb.travel));
   if(pb.preludeTarget==='store'&&pb.elapsed>900+pb.travel+500){pb.stage='receipts';this.beginReceipt();}return;
  }
  if(pb.stage==='ending'){
   this.held.setVisible(false);
   if(pb.day.finalState.alive){
    if(pb.elapsed<pb.travel)this.moveOnRoute(pb,pb.elapsed/pb.travel);
    else{const t=Math.min(1,(pb.elapsed-pb.travel)/350),bed=targetPoint('bed');this.modeSleep=true;this.worldPoint={x:Math.round(Phaser.Math.Linear(bed.x,312,t)),y:Math.round(Phaser.Math.Linear(bed.y,74,t))};this.setLight(Phaser.Math.Linear(.17,.23,t));if(!pb.effect){pb.effect=true;this.cb.onMessage?.(['Another little day.','Nearly human.']);}}
   }
   if(pb.elapsed>pb.travel+1600){this.playback=null;if(pb.day.finalState.alive)this.actor.setRotation(0);this.cb.onSnapshot?.(pb.day.finalState,pb.day.receipts.length);this.cb.onProgress?.(pb.day.receipts.length,pb.day.receipts.length);this.cb.onComplete?.();}return;
  }
  const receipt=pb.day.receipts[pb.index];if(!receipt){this.beginEnding();return;}
  if(pb.montage){const e=pb.elapsed;this.transition.setAlpha(e<220?0:e<300?(e-220)/80:e<380?1:e<500?1-(e-380)/120:0);}
  if(pb.elapsed<pb.travel){
   let progress=pb.elapsed/pb.travel;
   if(pb.montage){const exit=24,entry=40,e=pb.elapsed;const distance=e<300?exit*e/300:e<380?exit+(pb.routeLength-exit-entry)*(e-300)/80:pb.routeLength-entry+entry*(e-380)/500;progress=distance/pb.routeLength;}
   this.moveOnRoute(pb,progress);if(this.transition.alpha<.4&&this.clock-this.lastStep>170){this.lastStep=this.clock;this.tone('step');}
  }
  else if(!pb.effect&&pb.elapsed>pb.travel+(pb.perSlot-pb.travel)*.48){pb.effect=true;this.beginEffect(receipt);}
  if(pb.elapsed>=pb.perSlot){this.held.setVisible(false);if(!receipt.snapshot.alive||pb.index>=pb.day.receipts.length-1)this.beginEnding();else{pb.index=pb.quietSpanEnd??pb.index+1;this.beginReceipt();}}
 }
 private updateActor(paused:boolean):void {
  if(paused)return;this.actor.setRotation(this.state.alive?0:-Math.PI/2);this.secondHeld.setVisible(false);
  const pb=this.playback;let pose:RoosterPose='idle';let sleeping=this.modeSleep,seated=false;let point={...this.worldPoint};
  if(this.modeSleep)pose='sleep';else if(!this.state.alive)pose='dead';else if(pb?.stage==='ending'&&pb.elapsed<pb.travel||pb?.stage==='prelude'&&pb.preludeTarget==='store'&&pb.elapsed<900+pb.travel)pose=Math.floor(this.clock/110)%2?'walk-a':'walk-b';
  else if(pb?.stage==='receipts'){
   const receipt=pb.day.receipts[pb.index];if(pb.elapsed<pb.travel)pose=Math.floor(this.clock/110)%2?'walk-a':'walk-b';else if(receipt){
    const workElapsed=Math.max(0,pb.elapsed-pb.travel),workDuration=Math.max(1,pb.perSlot-pb.travel),workProgress=Math.min(1,workElapsed/workDuration);
    // A purposeful gesture starts with this action, not an unrelated world clock.
    const beat=Math.floor(workElapsed/230)%2;
    const stroke=Math.sin(Math.min(1,workProgress/.48)*Math.PI);
    if(receipt.action.startsWith('G')&&(receipt.target==='plot1'||receipt.target==='plot2'))this.facing=receipt.target==='plot1'?1:-1;
    else if(receipt.action!=='T01'&&!['H03','H04'].includes(receipt.action))this.facing=1;
    const eating=receipt.action==='H01'||receipt.action==='K07'||receipt.action.startsWith('K')&&pb.effect||receipt.action==='G05'&&receipt.variant==='apple';
    const repair=['H08','H09','H10','H11','H12','H15','H20'].includes(receipt.action);
    sleeping=receipt.action==='H03';seated=receipt.action==='H04'&&receipt.variant!=='garden';
    pose=sleeping?'sleep':pb.effect&&!receipt.success?'hurt':eating?'eat':receipt.action==='H02'?'treat':receipt.action.startsWith('G')?'garden':repair?'repair':'use';
    if(!sleeping&&workProgress<.13)pose='idle';
    else if(!sleeping&&workProgress>.82&&receipt.success)pose=eating?'eat':'blink';
    else if(beat&&!sleeping)pose='idle';
    if(sleeping){point={x:312,y:74};this.facing=1;}
    if(seated){point=receipt.target==='baseSeat'?{x:80,y:331}:{x:168,y:this.state.house.chairAnchor?379:331};pose=beat?'blink':'idle';}
    const inputs=Object.keys(receipt.inputs) as ItemId[],input=repair&&inputs.includes('toolkit')?'toolkit':inputs[0],result=pb.effect?actionResultProp(receipt):undefined,display=result?'result-'+result:input?'item-'+input:undefined;
    const consumed=pb.effect&&(receipt.action.startsWith('G')&&receipt.action!=='G05'||pb.elapsed-pb.travel>(pb.perSlot-pb.travel)*.82);
    if(display&&this.textures.exists(display)&&this.state.alive&&!consumed){
     const lift=eating?-18:receipt.target==='window'?-29:receipt.action.startsWith('G')?-10:-12;
     const toolArc=repair?(pb.effect ? .18 : .2-stroke*.9):receipt.action==='G02'?-.25-stroke*.35:0;
     const reach=repair?Math.round(stroke*3):0;
     this.held.setTexture(display).setVisible(true).setScale(1).setFlipX(this.facing<0).setRotation(toolArc*this.facing).setPosition(point.x+this.facing*((eating?11:13)+reach),point.y+lift+(repair?-Math.round(stroke*3):beat)).setDepth(point.y+2);
    }else this.held.setVisible(false);
    const second=inputs.find(i=>i!==input);
    if(second&&!pb.effect)this.secondHeld.setTexture('item-'+second).setOrigin(.5).setScale(.9).setVisible(true).setPosition(point.x-this.facing*8,point.y-5).setDepth(point.y+2);
    if(receipt.action==='H14'&&!consumed){this.held.setVisible(false);this.secondHeld.setTexture(this.texture('umbrella')).setOrigin(.5,1).setScale(.65).setVisible(true).setPosition(point.x,point.y+2).setDepth(point.y+.5);}
    if(receipt.target==='store'){const fridge=this.props.find(p=>p.kind==='fridge')!;if(!fridge.opts.open)this.setProp(fridge,{open:true});}
    if(receipt.target==='cupboard'){const cupboard=this.props.find(p=>p.kind==='cupboard')!;if(!cupboard.opts.open)this.setProp(cupboard,{open:true});}
    if(receipt.action==='T01'){
     const rest=pb.elapsed-pb.travel,phase=(Math.floor(this.clock/220)+receipt.slot)%18;
     pose=phase===0?'blink':phase<5?'breathe':phase===8?'preen':phase===12?'stretch':'idle';
     this.held.setVisible(false);
     // A small head turn, never an invented walk/action or mechanical benefit.
     if(rest>350&&rest<520)this.facing=receipt.slot%2?1:-1;
     if(receipt.target==='gardenView'&&rest>450)this.facing=1;
    }
   }
  }else if(Math.floor(this.clock/230)%23===0)pose='blink';else if(Math.floor(this.clock/700)%3===0)pose='breathe';
  const tremble=!sleeping&&this.state.alive&&this.state.conditions.some(c=>c.kind==='jitters'&&!c.resolved)?Math.floor(this.clock/85)%2:0;
  this.pose(pose);this.blanket.setVisible(sleeping&&this.state.alive);this.actor.setPosition(point.x+tremble,point.y).setDepth(sleeping?113:seated?point.y+7:point.y+1);this.shadow.setPosition(point.x,point.y+1).setDepth(point.y-.5).setVisible(this.actor.visible&&!sleeping&&!seated);
  const underShelter=this.worldPoint.x>382&&this.worldPoint.y>295&&this.worldPoint.y<370;
  for(const p of this.props)if(p.kind==='shelter'&&p.image.visible)p.image.setAlpha(underShelter?.42:.9);
  for(let i=0;i<this.zeds.length;i++){this.zeds[i].setVisible(sleeping&&this.state.alive).setY(55-i*7-Math.floor(this.clock/500+i)%3).setAlpha(.55+.35*Math.sin(this.clock/750+i));}
 }
 private drawInspect(delta:number):void {
  const g=this.inspectFx;g.clear();const mark=this.inspectMark;if(!mark)return;mark.remaining-=delta;if(mark.remaining<=0){this.inspectMark=undefined;return;}
  g.lineStyle(1,0xffdb59,Math.min(1,mark.remaining/180));const{x,y,w,h}=mark,size=5;
  for(const[px,py,dx,dy]of[[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){g.beginPath();g.moveTo(px+dx*size,py);g.lineTo(px,py);g.lineTo(px,py+dy*size);g.strokePath();}
 }
 private drawAmbient():void {
  const g=this.ambientFx;g.clear();if(!this.state.alive)return;
  const night=this.lightLevel>.12,drift=Math.floor(this.clock/1600)%9;
  // Cloud fragments stay inside the glass; all ambience is cosmetic.
  g.fillStyle(0xd4e4d7,night?.14:.6);g.fillRect(124+drift%4,24,4,1);g.fillRect(126+drift%3,23,2,1);g.fillRect(140+drift%3,35,5,1);
  if(!night){
   for(let i=0;i<6;i++){const t=(this.clock/340+i*7)%31;g.fillStyle(0xffedbb,.17+Math.sin(t/31*Math.PI)*.22);g.fillRect(Math.round(123+i*11+Math.sin(t*.3)),Math.round(78+t),1,1);}
  }
  if(night&&!this.state.house.powerOut){g.fillStyle(0xf4df9e,.035);g.fillEllipse(354,92,43,28);g.fillStyle(0xf4df9e,.04);g.fillEllipse(354,91,29,19);}
 }
 private setLight(level:number):void {
  this.lightLevel=level;this.night.setAlpha(level*.52);const weight=Math.min(1,Math.max(0,level/.23));
  const r=Math.round(255+(117-255)*weight),g=Math.round(255+(160-255)*weight),tint=(r<<16)|(g<<8)|255;
  if(tint===this.lightTint)return;this.lightTint=tint;this.floorImage.setTint(tint);this.blanket.setTint(tint);
  for(const prop of this.props)prop.image.setTint(prop.kind==='bedside'?0xffffff:tint);
 }
 private drawTask():void {
  const g=this.taskFx;g.clear();const pb=this.playback;if(!pb||pb.stage!=='receipts'||pb.elapsed<pb.travel||!this.state.alive)return;
  const r=pb.day.receipts[pb.index];if(!r)return;const tick=Math.floor(this.clock/150)%3;
  const p=(c:number,x:number,y:number,w:number,h:number)=>{g.fillStyle(c);g.fillRect(Math.round(x),Math.round(y),w,h);};
  if(['K01','K02','K04'].includes(r.action)){
   // The pan and steam are on the stove, while the ingredient is in BOK's wing.
   p(0x273d40,168,51,15,5);p(0x56676a,170,50,11,4);p(0xa1aca2,171,50,9,1);p(0x293b3a,182,52,7,2);
   p(r.action==='K01'?0xdba04e:0x9b4940,173,51,6,3);p(r.action==='K01'?0xf1c778:0xc77a57,174,51,4,1);
   if(!pb.effect||r.success)for(let i=0;i<3;i++)p(0xe4e1c8,172+i*4+Math.sin(tick+i),45-i%2*3-tick,1,3);
  }
  if(['K03','K05','K06'].includes(r.action)){
   if(r.action==='K03'){p(0x587d88,202,56,13,5);p(0xd5e4d3,202,55,13,2);p(0xe8e2b9,204,56,9,1);p(0x97b4af,204,60,9,1);}
   else{p(0xe7e8d4,205,54,7,7);p(0x7d5735,206,54,5,2);p(0xbcc9bd,212,55,3,4);p(0xe9ead8,212,56,2,2);p(0xe4e1c8,207+tick%2,48-tick,1,4);}
  }
  if(r.action==='G02'){
   const x=r.target==='plot1'?408:456;for(let i=0;i<5;i++){const t=(this.clock/90+i*2)%8;p(i%2?0x76c5df:0xb7e0e0,x-4+i*2,326+t,1,2);}
  }
  if(r.action==='H16'){for(let i=0;i<6;i++){const t=(this.clock/90+i)%6;p(0x89cee2,181-t,67-t*2,1,2);}}
  if(['G01','G04'].includes(r.action)&&pb.effect){const x=r.target==='plot1'?408:456;for(let i=0;i<3;i++){p(r.action==='G01'?0xe7cc88:0x99bb74,x-5+i*5,324-tick-i%2*2,1,1);}}
  if(r.action==='H02'&&pb.effect){const x=this.worldPoint.x+11,y=this.worldPoint.y-27-tick;p(0xb5d382,x-1,y-3,3,8);p(0xcde7a1,x-4,y,9,2);}
  if(['H05','H06','H07'].includes(r.action)){const x=r.target==='body'?336:207,y=r.target==='body'?299:56;for(let i=0;i<3;i++){p(0xe7efda,x-5+i*5,y-tick+i%2*3,2,2);p(0x9dbfbc,x-5+i*5,y-tick+i%2*3+2,2,1);}}
  if(['H08','H09','H10','H11','H12'].includes(r.action)&&!pb.effect){const x=this.worldPoint.x+this.facing*14,y=this.worldPoint.y-(r.target==='window'?34:16);for(let i=0;i<3;i++)if((tick+i)%2)p(0xf6dd8e,x+this.facing*(4+i*2),y-5+i*5,1,2);}
 }
 private drawHazards():void {
  this.fireFx.clear();const h=this.state.house;if(h.fire==='flame'){const flicker=Math.floor(this.clock/160)%3;this.fireFx.fillStyle(0xe88832,1);this.fireFx.fillRect(177,53-flicker,7,9+flicker);this.fireFx.fillStyle(0xffcc55,1);this.fireFx.fillRect(179,52-flicker,3,8+flicker);this.fireFx.fillStyle(0xffec91,1);this.fireFx.fillRect(180,57,2,4);}
  if(h.fire==='flame'||h.fire==='smoke'){for(let i=0;i<4;i++){const step=(this.clock/110+i*5)%25;this.fireFx.fillStyle(0x71756b,.5*(1-step/32));this.fireFx.fillRect(177+Math.sin(i+step)*3,49-step,5+i%2,3);}}
  if(h.backupHeat&&h.fire==='none'){this.fireFx.fillStyle(0xffb44e,.7);this.fireFx.fillRect(176,68,7,3);this.fireFx.fillRect(179,54,2,2);}
  if(this.actor.visible&&this.state.alive){
   const ax=this.actor.x,ay=this.actor.y;
   for(const c of this.state.conditions.filter(c=>!c.resolved)){
    if(c.kind==='infection'){this.fireFx.fillStyle(0xb574b7,.8);this.fireFx.fillRect(ax-7,ay-19,2,2);}
    if(c.kind==='wound'){this.fireFx.fillStyle(0xb83d43,.9);this.fireFx.fillRect(ax-2,ay-11,3,1);this.fireFx.fillRect(ax-1,ay-12,1,3);}
    if(c.kind==='illness'){this.fireFx.fillStyle(0xb7c68d,.8);this.fireFx.fillRect(ax+8,ay-25-Math.floor(this.clock/500)%3,1,2);}
    if(c.kind==='contaminatedBody'){this.fireFx.fillStyle(0x907443,.8);this.fireFx.fillRect(ax-3,ay-8,2,1);this.fireFx.fillRect(ax+2,ay-14,1,1);}
   }
  }
  const pb=this.playback,r=pb?.stage==='receipts'?pb.day.receipts[pb.index]:undefined;
  const episodes=r?.choice?.situation?.episodes||[];
  const rain=episodes.some(e=>e.kind==='rain'&&!e.resolved&&r&&r.slot<=e.boundary);
  if(rain){
   // Weather is presentation of the recorded episode, never another roll.
   this.fireFx.fillStyle(0xa1d0df,.6);
   for(let i=0;i<26;i++){const x=385+(i*29%91),y=273+(i*19+Math.floor(this.clock/65)*3)%139;this.fireFx.fillRect(x,y,1,3);}
   for(let i=0;i<5;i++)this.fireFx.fillRect(125+i*5,25+(i*5+Math.floor(this.clock/90))%14,1,3);
   if(h.damage.window&&!h.windowPatch&&!h.windowBrace){
    const fall=Math.floor(this.clock/85)%22;this.fireFx.fillStyle(0x80bdcf,.8);this.fireFx.fillRect(139,47+fall,1,2);this.fireFx.fillStyle(0x719d9c,.4);this.fireFx.fillRect(h.dripDiverted?145:135,80,h.dripDiverted?4:10,1);
   }
  }
  const pest=episodes.find(e=>!e.resolved&&(e.kind==='seedEater'||e.kind==='visitor')&&r&&r.slot<=e.boundary);
  if(pest&&!(pb?.effect&&r?.success&&['H18','H19'].includes(r.action))){
   const x=pest.kind==='seedEater'?(pest.target==='plot2'?463:415):93,y=pest.kind==='seedEater'?326:101;const hop=Math.floor(this.clock/220)%4===0?-1:0;
   const p=(c:number,dx:number,dy:number,w:number,z:number)=>{this.fireFx.fillStyle(c);this.fireFx.fillRect(x+dx,y+dy+hop,w,z);};
   if(pest.kind==='seedEater'){p(0x42382d,-5,-7,10,7);p(0x967147,-4,-6,8,5);p(0xc39a60,-4,-6,5,2);p(0x332e28,2,-8,5,5);p(0xd5bc83,3,-7,3,2);p(0x171e1e,5,-7,1,1);p(0xdc9b46,7,-5,3,1);p(0xd3a35b,-3,0,1,2);p(0xd3a35b,1,0,1,2);}
   else{p(0x3d342a,-8,-8,14,8);p(0x8c7250,-7,-7,12,6);p(0xc7ad7b,-4,-7,6,2);p(0x4b3c2d,3,-11,7,7);p(0xa38b60,4,-10,5,5);p(0x4b3c2d,3,-13,2,3);p(0x4b3c2d,8,-13,2,3);p(0x25312c,5,-8,1,1);p(0x25312c,8,-8,1,1);p(0xc6a07b,6,-6,2,1);p(0x4b3c2d,-11,-10,3,7);p(0xa38b60,-11,-10,2,5);}
  }
 }
 private emitPixels(x:number,y:number,color:string,count:number,kind='spark'):void {
  for(let i=0;i<count;i++){const angle=(i/count)*Math.PI*2;const sprite=this.add.rectangle(Math.round(x),Math.round(y),kind==='water'?2:1,kind==='water'?2:1,Phaser.Display.Color.HexStringToColor(color).color).setDepth(700);this.particles.push({sprite,x,y,vx:Math.cos(angle)*(.015+i%3*.005),vy:-.025-Math.sin(angle)*.012,life:450+i%4*70,total:650});}
 }
 private updateParticles(dt:number):void {this.particles=this.particles.filter(p=>{p.life-=dt;if(p.life<=0){p.sprite.destroy();return false;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.sprite.setPosition(Math.round(p.x),Math.round(p.y));p.vy+=.00005*dt;p.sprite.setAlpha(Math.min(1,p.life/200));return true;});}
 private clearParticles():void {for(const p of this.particles)p.sprite.destroy();this.particles=[];}
 private centerCamera(immediate:boolean,delta=16):void {
  const pb=this.playback;const resting=pb?.stage==='receipts'&&pb.elapsed>=pb.travel&&pb.day.receipts[pb.index]?.action==='H03';
  const receipt=pb?.stage==='receipts'?pb.day.receipts[pb.index]:undefined;
  const frame=(point:WorldPoint)=>receipt&&(receipt.target==='window'||receipt.action==='H14')?{x:point.x+12,y:84}:{x:point.x,y:point.y+17};
  if(pb?.stage==='receipts'&&pb.montage){const dest=pb.route.at(-1)!;this.cameraPoint=pb.elapsed<340?{...pb.originCamera!}:frame(dest);this.cameras.main.centerOn(Math.round(this.cameraPoint.x),Math.round(this.cameraPoint.y));return;}
  const cam=this.cameras.main;const target=this.modeSleep||resting?{x:368,y:112}:frame(this.worldPoint);
  const blend=1-Math.exp(-Math.max(0,delta)/140);
  if(immediate)this.cameraPoint={...target};else{this.cameraPoint.x=Phaser.Math.Linear(this.cameraPoint.x,target.x,blend);this.cameraPoint.y=Phaser.Math.Linear(this.cameraPoint.y,target.y,blend);}
  cam.centerOn(Math.round(this.cameraPoint.x),Math.round(this.cameraPoint.y));
 }
 public pausePlayback():void {if(this.playback)this.playback.paused=true;}
 public resumePlayback():void {if(this.playback){this.playback.paused=false;this.openAudio();}}
 public skipPlayback():void {const pb=this.playback;if(!pb)return;this.playback=null;this.held.setVisible(false);this.actor.setRotation(0);this.setSave(pb.day.finalState);this.cb.onSnapshot?.(pb.day.finalState,pb.day.receipts.length);this.cb.onProgress?.(pb.day.receipts.length,pb.day.receipts.length);this.cb.onComplete?.();}
 public seekReceipt(index:number):void {const pb=this.playback;if(!pb)return;pb.stage='receipts';this.modeSleep=false;this.blanket.setVisible(false);pb.index=Phaser.Math.Clamp(index,0,pb.day.receipts.length-1);this.beginReceipt(true,false);const r=pb.day.receipts[pb.index];this.worldPoint=this.receiptPoint(r,r.snapshot);pb.elapsed=pb.perSlot*.8;pb.effect=true;this.applyState(r.snapshot);this.updateActor(false);this.drawTask();this.drawHazards();pb.paused=true;this.centerCamera(true);this.lastMessage=r.lines.join('\n');this.cb.onSnapshot?.(r.snapshot,pb.index);this.cb.onMessage?.(r.lines);}
 public currentIndex():number{return this.playback?.index??0;}
 public paused():boolean{return !!this.playback?.paused;}
 public enableInput(enabled:boolean):void {this.inputEnabled=enabled;if(this.initialized)this.input.enabled=enabled;}
 public mute(value:boolean):void {this.muted=value;}
 public zoom(value:number):void {this.enqueue(()=>{this.cameras.main.setZoom(Phaser.Math.Clamp(value,.9,1.3));this.centerCamera(true);});}
 private enqueue(f:()=>void):void{if(this.initialized)f();else this.queued.push(f);}
 private openAudio():void {if(this.muted)return;try{this.audio??=new AudioContext();if(this.audio.state==='suspended')void this.audio.resume();}catch{/* Silent platform; visual feedback remains complete. */}}
 private tone(kind:string):void {
  if(this.muted||!this.audio||this.audio.state!=='running')return;
  const audio=this.audio;const osc=audio.createOscillator(),gain=audio.createGain();const t=audio.currentTime;const f=({tap:440,step:150,use:520,garden:660,cook:740,hurt:190,death:130} as Record<string,number>)[kind]||440;
  osc.type=kind==='step'?'triangle':'sine';osc.frequency.setValueAtTime(f,t);osc.frequency.exponentialRampToValueAtTime(f*(kind==='hurt'||kind==='death'?.65:1.25),t+.08);gain.gain.setValueAtTime(kind==='step'?.008:.025,t);gain.gain.exponentialRampToValueAtTime(.001,t+.12);osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+.14);
 }
 public shutdownWorld():void {this.clearParticles();if(this.audio)void this.audio.close();this.audio=null;}
}

export function createWorldRenderer(container:HTMLElement,callbacks:WorldCallbacks={}):WorldController {
 let resolve=()=>{};const ready=new Promise<void>(r=>{resolve=r;});const scene=new HomeScene(callbacks,resolve);
 const game=new Phaser.Game({type:Phaser.AUTO,parent:container,width:256,height:256,backgroundColor:'#192c34',pixelArt:true,roundPixels:true,antialias:false,transparent:false,render:{antialias:false,pixelArt:true,roundPixels:true},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:256,height:256},scene:[scene],audio:{noAudio:true},fps:{target:60,forceSetTimeOut:false}});
 return{ready,showSave:(s,o)=>scene.setSave(s,o),playDay:(d,o)=>scene.start(d,o),pause:()=>scene.pausePlayback(),resume:()=>scene.resumePlayback(),skip:()=>scene.skipPlayback(),seek:i=>scene.seekReceipt(i),setMuted:m=>scene.mute(m),setZoom:z=>scene.zoom(z),setInputEnabled:enabled=>scene.enableInput(enabled),getCurrentIndex:()=>scene.currentIndex(),isPaused:()=>scene.paused(),dispose:()=>{scene.shutdownWorld();game.destroy(true);}};
}

export {TARGET_LABELS};
