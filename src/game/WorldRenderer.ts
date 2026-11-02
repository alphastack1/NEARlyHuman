import Phaser from 'phaser';
import type { DayResult, GameState, ItemId, Receipt, TargetId } from '../domain/types';
import { ITEM_IDS } from '../domain/types';
import { isDeliveryCollection } from '../domain/day-plan';
import { canvasArt, drawItem } from '../art/pixels';
import { fixtureCanvas, fixtureTextureKey, houseArtOptions, FIXTURE_SIZES, type FixtureArt, type ArtOptions } from '../art/fixtures';
import { houseCanvas, homeArtSeed } from '../art/house';
import { roosterCanvas, ROOSTER_FRAME, type RoosterPose } from '../art/rooster';
import { ACTION_PROPS, actionPropCanvas, actionResultProp } from '../art/action-props';
import { PROP_URLS } from '../art/asset-urls';
import { findRoute, targetPoint, TARGET_LABELS, WORLD_HEIGHT, WORLD_WIDTH, type WorldPoint } from './layout';
import { purposefulTravelMs, receiptTiming, receiptImpactFraction } from './presentation';
import { quietSpanAt } from './quiet-spans';
import { BEDROOM_VIEW, HOUSE_ROOMS, constrainHouseView, roomAtView, type HouseRoom, type HouseView } from './house-view';
import { samplePersonality, sampleAttention, physicalCadence, settlePose, NPC_ATTENTION_MS, NPC_ATTENTION_COOLDOWN_MS } from './personality';
import { beforeActionBeat, afterActionBeat, hasRecordedRain, type RecordedBeat } from './recorded-events';
import { planDailyVignette, type DailyVignette } from './daily-vignette';
import { OPENING_ASSEMBLY_MS, OPENING_EXIT_MS, openingEase, openingTileTime, openingPropTime } from './opening';

export type OpeningPhase='title'|'finished';

export interface WorldCallbacks {
 onReceipt?:(receipt:Receipt,index:number)=>void;
 onSnapshot?:(state:GameState,index:number)=>void;
 onMessage?:(lines:[string,string])=>void;
 onProgress?:(index:number,total:number)=>void;
 onComplete?:()=>void;
 onInspect?:(target:TargetId)=>void;
 onViewChange?:(view:HouseView)=>void;
 onMotion?:(motion:{traveling:boolean})=>void;
 onOpeningPhase?:(phase:OpeningPhase)=>void;
}
export interface SavePresentation { sleep?:boolean; dim?:boolean; focus?:TargetId }
export interface PlaybackOptions { startIndex?:number; durationMs?:number; skipDelivery?:boolean }
export interface WorldController {
 ready:Promise<void>;
 beginOpening:(source?:GameState|(()=>GameState),startTarget?:TargetId|(()=>TargetId))=>void;finishOpening:()=>void;
 setViewportInsets:(top:number,bottom:number,left?:number,right?:number)=>void;
 showSave:(state?:GameState,options?:SavePresentation)=>void;
 playDay:(day:DayResult,options?:PlaybackOptions)=>void;
 pause:()=>void;resume:()=>void;skip:()=>void;seek:(index:number)=>void;
 setMuted:(muted:boolean)=>void;setZoom:(zoom:number)=>void;
 setInputEnabled:(enabled:boolean)=>void;
 setExploreEnabled:(enabled:boolean)=>void;focusRoom:(room:HouseRoom)=>void;followActor:()=>void;
 getCurrentIndex:()=>number;isPaused:()=>boolean;
 dispose:()=>void;
}

interface Prop {kind:FixtureArt;id?:TargetId;x:number;y:number;image:Phaser.GameObjects.Image;shadow?:Phaser.GameObjects.Ellipse;opts:ArtOptions}
interface Particle {sprite:Phaser.GameObjects.Rectangle;x:number;y:number;vx:number;vy:number;life:number;total:number}
interface DeliveryReturn {route:WorldPoint[];routeLength:number;travel:number;start:number;arrived?:boolean;stored?:boolean;announced?:boolean}
interface Playback {day:DayResult;index:number;elapsed:number;normalSlot:number;perSlot:number;route:WorldPoint[];routeLength:number;travel:number;effect:boolean;stage:'prelude'|'receipts'|'ending';paused:boolean;preludeTarget:'mailbox'|'store';arrived:boolean;intentMessage?:boolean;routineHold?:boolean;deliveryReturn?:DeliveryReturn;endingFrom?:WorldPoint;quietSpanEnd?:number;beforeBeat?:RecordedBeat;afterBeat?:RecordedBeat;introUntil:number;tailMs:number;tailMessage?:boolean;eventFocused?:boolean;vignette?:DailyVignette}
interface HouseGesture {pointer:number;x:number;y:number;view:WorldPoint;prop?:Prop;actor?:boolean;dragging:boolean}
interface HouseResponse {prop:Prop;elapsed:number;duration:number;scaleX:number;scaleY:number;leaf?:Phaser.GameObjects.Image}
interface HouseAction {kind:'move'|'reveal';prop:Prop;elapsed:number;duration:number;fromY:number;toY:number;actorFrom?:WorldPoint;actorTo?:WorldPoint}
interface OpeningProp {prop:Prop;scaleX:number;scaleY:number;alpha:number;visible:boolean}
interface Opening {elapsed:number;stage:'assembling'|'title'|'leaving';leaving:number;props:OpeningProp[]}
interface SpritePixels {left:number;top:number;right:number;bottom:number}

const ACTIVITY_VERBS:Record<string,string>={Collect:'Collecting',Make:'Making',Cook:'Cooking',Drink:'Drinking',Eat:'Eating',Treat:'Treating',Bandage:'Bandaging',Rest:'Resting',Enjoy:'Enjoying',Relax:'Relaxing',Tidy:'Tidying','Deep-clean':'Deep-cleaning',Wipe:'Wiping',Wash:'Washing',Repair:'Repairing',Build:'Building',Patch:'Patching',Brace:'Bracing',Divert:'Diverting',Cover:'Covering',Light:'Lighting',Douse:'Dousing',Shut:'Shutting',Shoo:'Shooing',Plant:'Planting',Water:'Watering',Fertilize:'Fertilizing',Restore:'Restoring',Harvest:'Harvesting',Abandon:'Abandoning',Move:'Moving',Watch:'Watching',Check:'Checking',Look:'Looking',Visit:'Visiting',Wander:'Wandering'};
function activityCaption(label:string):string {return label.replace(/^\S+/,verb=>ACTIVITY_VERBS[verb]||verb);}
function isSeatedReceipt(receipt:Receipt):boolean {return receipt.action==='H04'&&receipt.variant!=='garden'||receipt.action==='T01'&&receipt.target==='baseSeat'&&receipt.variant==='idle';}

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
 private worldPoint:WorldPoint={x:312,y:88};private cameraPoint:WorldPoint={...BEDROOM_VIEW};
 private furnitureExit?:WorldPoint;private furnitureRest?:'bed'|'seat';private openingTarget:TargetId='store';
 private readyResolve:()=>void;
 private muted=false;private audio:AudioContext|null=null;private audioReady:Promise<void>|null=null;private lastStep=0;
 private lastMessage='';
 private ambientFx!:Phaser.GameObjects.Graphics;
 private homeSeed='';
 private floorImage!:Phaser.GameObjects.Image;private lightLevel=.23;private lightTint=-1;
 private transition!:Phaser.GameObjects.Rectangle;
 private inspectFx!:Phaser.GameObjects.Graphics;private inspectMark?:{x:number;y:number;w:number;h:number;remaining:number};
 private queued:(()=>void)[]=[];private initialized=false;
 private inputEnabled=true;
 private exploreEnabled=false;private exploring=false;private explorePoint?:WorldPoint;private viewNotice='';
 private gesture?:HouseGesture;private response?:HouseResponse;private houseAction?:HouseAction;
 private houseFx!:Phaser.GameObjects.Graphics;private lampOn=true;
 private attentionAt?:number;private lastAttention=-Infinity;private attentionFacing=1;
 private motion=false;
 private vignetteFx!:Phaser.GameObjects.Graphics;
 private opening?:Opening;private openingCovers!:Phaser.GameObjects.Graphics;private openingFx!:Phaser.GameObjects.Graphics;
 private kitchenCounter!:Phaser.GameObjects.Graphics;
 private openingHandoff=false;private handoffCamera?:{index:number;x:number};private desiredZoom=1.1;
 private viewportTop=38;private viewportBottom=36;private viewportLeft=0;private viewportRight=0;private insetTopCSS=38;private insetBottomCSS=36;private insetLeftCSS=0;private insetRightCSS=0;private cssScale=1;private logicalWidth=256;private logicalHeight=256;
 private spritePixelBounds=new WeakMap<Phaser.Textures.Frame,SpritePixels>();

 constructor(cb:WorldCallbacks,readyResolve:()=>void){super('home');this.cb=cb;this.readyResolve=readyResolve;}
 preload():void {
  for(const[key,url]of Object.entries(PROP_URLS))this.load.image('asset-'+key,url);
 }
 create():void {
  this.cameras.main.setViewport(0,0,this.logicalWidth,this.logicalHeight).setZoom(1.1).setRoundPixels(true);
  // UI may cover part of the camera. Continue the actual outer wall tile beneath those covered edges,
  // while our safe-area clamp keeps the unobstructed view inside the canonical map.
  this.textures.addCanvas('home-margin',canvasArt(16,16,p=>{p('#705236',0,0,16,16);p('#82603c',1,1,14,14);p('#967049',1,1,14,1);}));
  this.add.tileSprite(-WORLD_WIDTH,-WORLD_HEIGHT,WORLD_WIDTH*3,WORLD_HEIGHT*3,'home-margin').setOrigin(0).setDepth(-2);
  this.textures.addCanvas('home-floor',houseCanvas());this.floorImage=this.add.image(0,0,'home-floor').setOrigin(0).setDepth(0);
  for(const id of ITEM_IDS)this.textures.addCanvas('item-'+id,canvasArt(16,16,p=>drawItem(p,id)));
  for(const id of ACTION_PROPS)this.textures.addCanvas('result-'+id,actionPropCanvas(id));
  this.props=[];
  const add=(kind:FixtureArt,x:number,y:number,id?:TargetId,opts:ArtOptions={})=>this.addProp(kind,x,y,id,opts);
  add('window',136,48,'window');add('fridge',72,80,'store');add('pantry',120,80,'store');add('stove',176,80,'stove');add('prep',208,80,'prep');
  // A continuous functional counter run; narrow infill does not add an activity.
  const counter=this.kitchenCounter=this.add.graphics().setDepth(48);counter.fillStyle(0x523c2a);counter.fillRect(82,53,143,28);counter.fillStyle(0xbf8c52);counter.fillRect(82,53,143,5);counter.fillStyle(0xdda96b);counter.fillRect(83,53,141,1);counter.fillStyle(0x9c7042);counter.fillRect(83,60,141,18);for(const[x,w]of [[86,17],[138,21]]){counter.fillStyle(0x6e4e32);counter.fillRect(x,60,w,18);counter.fillStyle(0xa77947);counter.fillRect(x+1,61,w-2,15);counter.fillStyle(0xc09258);counter.fillRect(x+1,61,w-2,1);counter.fillStyle(0xdfbd78);counter.fillRect(x+w-4,66,1,3);}counter.fillStyle(0x66472e);counter.fillRect(83,79,141,2);
  add('plant',47,87);add('shelf',207,37);add('table',124,160);add('plant',56,183);
  add('bed',312,112,'bed');add('bedside',354,101);add('cupboard',432,80,'cupboard');add('plant',395,79);add('painting',284,48);add('painting',449,153);add('shelf',345,177);
  add('baseSeat',80,336,'baseSeat');add('plant',115,323);add('painting',69,292);add('painting',172,292);add('plant',193,379);
  add('chair',168,336,'chair');
  add('sink',336,320,'body');add('plant',301,327);add('painting',335,280);
  add('plot',408,338,'plot1',{plot:this.state.plots[0]});add('plot',456,338,'plot2',{plot:this.state.plots[1]});
  add('shelter',432,354,'gardenShelter');add('umbrella',408,341);add('umbrella',456,341);
  add('plant',390,405);add('plant',474,399);add('mailbox',424,530,'mailbox');add('plant',304,402);
  this.shadow=this.add.ellipse(this.worldPoint.x,this.worldPoint.y,16,5,0x302f28,.22).setDepth(200);
  this.actor=this.add.image(this.worldPoint.x,this.worldPoint.y,'__DEFAULT').setOrigin(ROOSTER_FRAME.footX/32,ROOSTER_FRAME.footY/40).setScale(1.45).setDepth(201);
  this.held=this.add.image(0,0,'item-water').setOrigin(.5).setVisible(false).setDepth(202);
  this.secondHeld=this.add.image(0,0,'item-water').setOrigin(.5).setVisible(false).setDepth(202);
  this.blanket=this.add.image(312,112,this.texture('bedCover')).setOrigin(.5,1).setScale(1.2).setDepth(500).setVisible(false);
  for(let i=0;i<3;i++)this.zeds.push(this.add.text(314+i*5,61-i*7,'z',{fontFamily:'monospace',fontSize:i===0?'8px':'6px',fontStyle:'bold',color:'#eee8ce'}).setDepth(502));
  this.fireFx=this.add.graphics().setDepth(470);this.messFx=this.add.graphics().setDepth(4);this.taskFx=this.add.graphics().setDepth(480);
  this.ambientFx=this.add.graphics().setDepth(13);
  this.vignetteFx=this.add.graphics().setDepth(15);
  this.houseFx=this.add.graphics().setDepth(478);
  this.night=this.add.rectangle(0,0,WORLD_WIDTH,WORLD_HEIGHT,0x192945,1).setOrigin(0).setDepth(900).setAlpha(.22);
  this.transition=this.add.rectangle(0,0,WORLD_WIDTH,WORLD_HEIGHT,0x182d3d,1).setOrigin(0).setDepth(950).setAlpha(0);
  this.openingCovers=this.add.graphics().setDepth(1);this.openingFx=this.add.graphics().setDepth(720);
  this.inspectFx=this.add.graphics().setDepth(960);
  this.actor.setInteractive(new Phaser.Geom.Rectangle(8,12,20,25),Phaser.Geom.Rectangle.Contains);this.actor.input!.cursor='pointer';this.actor.input!.enabled=false;
  this.input.on('gameobjectdown',(pointer:Phaser.Input.Pointer,object:Phaser.GameObjects.GameObject)=>{
   if(!this.acceptsPointer(pointer))return;
   const prop=this.props.find(p=>p.image===object);
   if(object===this.actor&&!this.exploreEnabled)return;
   if(prop&&!prop.id&&!this.exploreEnabled)return;
   this.beginGesture(pointer,prop,object===this.actor);
  });
  this.input.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{if(this.acceptsPointer(pointer)&&!this.gesture)this.beginGesture(pointer);});
  this.input.on('pointermove',(pointer:Phaser.Input.Pointer)=>this.moveGesture(pointer));
  this.input.on('pointerup',(pointer:Phaser.Input.Pointer)=>this.endGesture(pointer));
  this.input.on('pointerupoutside',()=>{this.gesture=undefined;});
  this.input.enabled=this.inputEnabled;this.applyState(this.state);this.prepareAudio();this.initialized=true;this.setSave(this.state);this.resizeWorld(this.logicalWidth,this.logicalHeight,this.cssScale);this.readyResolve();for(const q of this.queued)q();this.queued=[];
 }
 public resizeWorld(width:number,height:number,cssScale:number):void {
  this.logicalWidth=width;this.logicalHeight=height;this.cssScale=Math.max(.1,cssScale);
  this.viewportTop=this.insetTopCSS/this.cssScale;this.viewportBottom=this.insetBottomCSS/this.cssScale;
  this.viewportLeft=this.insetLeftCSS/this.cssScale;this.viewportRight=this.insetRightCSS/this.cssScale;
  if(!this.initialized)return;
  this.cameras.main.setViewport(0,0,width,height).setZoom(Math.max(this.desiredZoom,width/WORLD_WIDTH,height/WORLD_HEIGHT));
  if(this.explorePoint)this.explorePoint=this.constrainPoint(this.explorePoint);this.centerCamera(true);
 }
 public viewportInsets(top:number,bottom:number,left=0,right=0):void {
  this.insetTopCSS=Math.max(0,top);this.insetBottomCSS=Math.max(0,bottom);
  this.insetLeftCSS=Math.max(0,left);this.insetRightCSS=Math.max(0,right);
  this.viewportTop=this.insetTopCSS/this.cssScale;this.viewportBottom=this.insetBottomCSS/this.cssScale;
  this.viewportLeft=this.insetLeftCSS/this.cssScale;this.viewportRight=this.insetRightCSS/this.cssScale;
  // A paused film has no follow tick to apply the fresh DOM geometry after a resize.
  if(this.initialized&&(this.playback?.paused||this.exploreEnabled&&!this.inputEnabled))this.centerCamera(true);
 }
 private constrainPoint(point:WorldPoint):WorldPoint {const c=this.cameras.main;return constrainHouseView(point,c.zoom,c.width,c.height,this.viewportTop,this.viewportBottom,this.viewportLeft,this.viewportRight);}
 /** Place the subject in the usable part of a full-bleed world, without clipping the world behind UI. */
 private framePoint(point:WorldPoint):WorldPoint {const z=this.cameras.main.zoom;return this.constrainPoint({x:point.x-(this.viewportLeft-this.viewportRight)/(2*z),y:point.y-(this.viewportTop-this.viewportBottom)/(2*z)});}
 /** Following protects the entire sprite, including headgear, when the usable area is short. */
 private frameActor(point:WorldPoint):WorldPoint {
  if(!this.actor.visible)return point;const c=this.cameras.main,full=this.actor.getBounds(),halfW=c.width/(2*c.zoom),halfH=c.height/(2*c.zoom),margin=3/c.zoom;
  let b:SpritePixels=full;
  // Transparent texture padding can exceed a short display even when the visible rooster fits.
  // Keep the conservative full-texture rule normally; read each procedural frame's alpha once only.
  if(full.width>(c.width-this.viewportLeft-this.viewportRight)/c.zoom-margin*2||full.height>(c.height-this.viewportTop-this.viewportBottom)/c.zoom-margin*2)b=this.visibleActorBounds()||full;
  const minX=b.right-halfW+this.viewportRight/c.zoom+margin,maxX=b.left+halfW-this.viewportLeft/c.zoom-margin;
  const minY=b.bottom-halfH+this.viewportBottom/c.zoom+margin,maxY=b.top+halfH-this.viewportTop/c.zoom-margin;
  return this.constrainPoint({x:minX<=maxX?Phaser.Math.Clamp(point.x,minX,maxX):point.x,y:minY<=maxY?Phaser.Math.Clamp(point.y,minY,maxY):point.y});
 }
 private visibleActorBounds():SpritePixels|undefined {
  const actor=this.actor,frame=actor.frame;let pixels=this.spritePixelBounds.get(frame);
  if(!pixels){
   const source=frame.source.image as HTMLCanvasElement;if(typeof source?.getContext!=='function')return;
   const context=source.getContext('2d');if(!context)return;const width=source.width,height=source.height,data=context.getImageData(0,0,width,height).data;
   let left=width,top=height,right=0,bottom=0;
   for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
   if(!right||!bottom)return;pixels={left,top,right,bottom};this.spritePixelBounds.set(frame,pixels);
  }
  const matrix=actor.getWorldTransformMatrix();let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  for(const[x,y]of [[pixels.left,pixels.top],[pixels.right,pixels.top],[pixels.right,pixels.bottom],[pixels.left,pixels.bottom]]){
   const p=matrix.transformPoint((actor.flipX?actor.width-x:x)-actor.displayOriginX,(actor.flipY?actor.height-y:y)-actor.displayOriginY);
   left=Math.min(left,p.x);top=Math.min(top,p.y);right=Math.max(right,p.x);bottom=Math.max(bottom,p.y);
  }
  return{left,top,right,bottom};
 }
 public beginOpening(source:GameState|(()=>GameState)=demoState,startTarget:TargetId|(()=>TargetId)='store'):void {this.enqueue(()=>{
  const state=typeof source==='function'?source():source;
  this.clearOpening();this.resetPresence();this.playback=null;this.clearParticles();this.closeStorage();this.applyState(state);
  this.modeSleep=false;this.blanket.setVisible(false);this.held.setVisible(false);this.secondHeld.setVisible(false);this.transition.setAlpha(0);this.setLight(0);this.inspectFx.clear();this.taskFx.clear();this.houseFx.clear();this.vignetteFx.clear();
  this.actor.setVisible(state.alive).setRotation(0).setAlpha(1);this.shadow.setVisible(state.alive).setAlpha(1);for(const z of this.zeds)z.setVisible(false);
  this.openingTarget=typeof startTarget==='function'?startTarget():startTarget;
  this.worldPoint=this.openingTarget==='bed'?{x:312,y:74}:targetPoint(this.openingTarget);this.actor.setPosition(this.worldPoint.x,this.worldPoint.y);this.shadow.setPosition(this.worldPoint.x,this.worldPoint.y+1);this.facing=1;this.pose('perk');
  this.opening={elapsed:0,stage:'assembling',leaving:0,props:this.props.map(prop=>({prop,scaleX:prop.image.scaleX,scaleY:prop.image.scaleY,alpha:prop.image.alpha,visible:prop.image.visible}))};
  this.cameraPoint=this.framePoint(this.openingTarget==='bed'?BEDROOM_VIEW:{x:136,y:120});this.cameras.main.centerOn(Math.round(this.cameraPoint.x),Math.round(this.cameraPoint.y));this.drawOpening(0);
 });}
 public finishOpening():void {this.enqueue(()=>{
  if(!this.opening)return;
  if(this.opening.stage==='leaving')return;
  this.opening.stage='leaving';this.opening.leaving=0;
  // Complete assembly before leaving, including a skip in its first frame.
  this.opening.elapsed=OPENING_ASSEMBLY_MS;this.drawOpening(0);this.openAudio(()=>this.tone('use'));
 });}
 private clearOpening():void {
  const opening=this.opening;if(!opening)return;
  for(const {prop,scaleX,scaleY,alpha,visible}of opening.props){prop.image.setPosition(prop.x,prop.y).setScale(scaleX,scaleY).setAlpha(alpha).setVisible(visible);prop.shadow?.setAlpha(1).setPosition(prop.x+1,prop.y+1).setVisible(visible);}
  this.openingCovers.clear();this.openingFx.clear();this.kitchenCounter.setAlpha(1);this.actor.setAlpha(1);this.shadow.setAlpha(1);this.opening=undefined;
 }
 private drawOpening(dt:number):void {
  const opening=this.opening;if(!opening)return;
  if(opening.stage==='assembling')opening.elapsed=Math.min(OPENING_ASSEMBLY_MS,opening.elapsed+dt);
  if(opening.stage==='leaving')opening.leaving+=dt;
  const elapsed=opening.elapsed,cover=this.openingCovers,fx=this.openingFx;cover.clear();fx.clear();
  if(opening.stage==='assembling'||opening.stage==='leaving'&&opening.leaving===0){
  // Reveal the existing floor in a short, staggered tile wave. No duplicate map or texture downloads.
  for(let y=0;y<WORLD_HEIGHT;y+=16)for(let x=0;x<WORLD_WIDTH;x+=16){
   const t=Math.max(0,Math.min(1,(elapsed-openingTileTime(x,y))/310));
   if(t<1){cover.fillStyle(0x172c3b,1-openingEase(t));cover.fillRect(x,y,16,16);}
   if(t>.08&&t<.85){const lift=Math.round((1-t)*8);fx.fillStyle((x+y)%48?0xf3ddb0:0x8dcce3,Math.sin(t*Math.PI)*.7);fx.fillRect(x+4,y+3-lift,2,2);}
  }
  this.kitchenCounter.setAlpha(openingEase((elapsed-240)/250));
  for(const entry of opening.props){
   const {prop}=entry,t=Math.max(0,Math.min(1,(elapsed-openingPropTime(prop.x,prop.y))/350));
   const rise=1-openingEase(t),bounce=t<1?Math.sin(t*Math.PI*2)*(1-t)*.08:0;
   prop.image.setAlpha(entry.alpha*Math.min(1,t*3)).setY(prop.y-Math.round(rise*12)).setScale(entry.scaleX*(1+bounce),entry.scaleY*(1-bounce));
   prop.shadow?.setAlpha(Math.min(1,t*2)).setPosition(prop.x+1,prop.y+1);
   if(entry.visible&&t>.2&&t<.85){const s=Math.sin(t*Math.PI);fx.fillStyle(0xffecc5,s*.85);fx.fillRect(prop.x-6,prop.y-4-Math.round(t*12),2,2);fx.fillStyle(0x94cde4,s*.7);fx.fillRect(prop.x+7,prop.y-8-Math.round(t*9),1,3);}
  }
  }
  this.actor.setAlpha(Math.min(1,elapsed/210));this.shadow.setAlpha(Math.min(1,elapsed/210));
  this.pose(opening.stage==='title'?(Math.floor(this.clock/1200)%4===0?'peek':'idle'):'perk');this.actor.setPosition(this.worldPoint.x,this.worldPoint.y).setDepth(this.openingTarget==='bed'?113:this.worldPoint.y+1);
  this.drawAmbient();this.centerCamera(true);
  if(opening.stage==='assembling'&&elapsed>=OPENING_ASSEMBLY_MS){opening.stage='title';cover.clear();fx.clear();this.cb.onOpeningPhase?.('title');}
  if(opening.stage==='title'){
   const t=this.clock/550;for(let i=0;i<4;i++){const x=101+i*23,y=102+Math.round(Math.sin(t+i)*7),a=.25+Math.sin(t+i)*.15;fx.fillStyle(i%2?0xf1d79c:0xa6d8e1,a);fx.fillRect(x,y,1,1);}
  }
  if(opening.stage==='leaving'&&opening.leaving>=OPENING_EXIT_MS){this.clearOpening();this.openingHandoff=true;this.cb.onOpeningPhase?.('finished');}
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
  const px=Math.max(0,(32-image.width)/2),py=Math.max(0,(32-image.height)/2);image.setInteractive(new Phaser.Geom.Rectangle(-px,-py,image.width+px*2,image.height+py*2),Phaser.Geom.Rectangle.Contains);image.input!.cursor='pointer';image.input!.enabled=!!id||this.exploreEnabled;
  return p;
 }
 private setProp(prop:Prop,opts:ArtOptions):void {prop.opts=opts;prop.image.setTexture(this.texture(prop.kind,opts));}
 private acceptsPointer(pointer:Phaser.Input.Pointer):boolean {return !this.opening&&this.inputEnabled&&pointer.event?.target===this.game.canvas&&pointer.y>=this.viewportTop&&pointer.y<=this.logicalHeight-this.viewportBottom&&pointer.x>=this.viewportLeft&&pointer.x<=this.logicalWidth-this.viewportRight;}
 private beginGesture(pointer:Phaser.Input.Pointer,prop?:Prop,actor=false):void {
  if(!this.acceptsPointer(pointer))return;
  this.gesture={pointer:pointer.id,x:pointer.x,y:pointer.y,view:{...this.cameraPoint},prop,actor,dragging:false};
 }
 private moveGesture(pointer:Phaser.Input.Pointer):void {
  const gesture=this.gesture;if(!gesture||gesture.pointer!==pointer.id||!this.inputEnabled)return;
  const dx=pointer.x-gesture.x,dy=pointer.y-gesture.y;
  if(!gesture.dragging&&Math.hypot(dx,dy)<6)return;
  gesture.dragging=true;if(!this.exploreEnabled)return;this.exploring=true;this.explorePoint=this.constrainPoint({x:gesture.view.x-dx/this.cameras.main.zoom,y:gesture.view.y-dy/this.cameras.main.zoom});
  this.cameraPoint={...this.explorePoint};this.cameras.main.centerOn(Math.round(this.cameraPoint.x),Math.round(this.cameraPoint.y));this.notifyView();
 }
 private endGesture(pointer:Phaser.Input.Pointer):void {
  const gesture=this.gesture;this.gesture=undefined;
  if(!gesture||gesture.pointer!==pointer.id||gesture.dragging||!this.acceptsPointer(pointer))return;
  if(gesture.actor){if(this.exploreEnabled&&this.state.alive&&this.clock-this.lastAttention>=NPC_ATTENTION_COOLDOWN_MS){this.attentionAt=this.clock;this.lastAttention=this.clock;this.attentionFacing=pointer.worldX<this.actor.x?-1:1;this.openAudio();this.tone('tap');}return;}
  let prop=gesture.prop;if(!prop||!prop.image.visible)return;
  if(prop.kind==='shelter'){const plot=this.props.find(p=>p.kind==='plot'&&Math.abs(pointer.worldX-p.x)<=20&&pointer.worldY>=p.y-32&&pointer.worldY<=p.y+8);if(plot)prop=plot;}
  this.openAudio();const bounds=prop.image.getBounds();this.inspectMark={x:bounds.x-2,y:bounds.y-2,w:bounds.width+4,h:bounds.height+4,remaining:650};this.drawInspect(0);
  if(this.exploreEnabled)this.respondToProp(prop);else if(prop.id)this.pausePlayback();
  this.tone('tap');if(prop.id)this.cb.onInspect?.(prop.id);
 }
 private notifyView():void {
  const view:HouseView={exploring:this.exploring,...(this.exploring?{room:roomAtView(this.explorePoint||this.cameraPoint)}:{})};
  const key=JSON.stringify(view);if(key!==this.viewNotice){this.viewNotice=key;this.cb.onViewChange?.(view);}
 }
 public explore(enabled:boolean):void {
  if(this.exploreEnabled===enabled)return;this.exploreEnabled=enabled;this.gesture=undefined;
  if(!enabled){this.exploring=false;this.explorePoint=undefined;this.clearResponse();this.lampOn=true;this.attentionAt=undefined;this.notifyView();}
  if(this.initialized){for(const prop of this.props)if(prop.image.input)prop.image.input.enabled=!!prop.id||enabled;this.actor.input!.enabled=enabled&&this.state.alive;}
 }
 public focus(room:HouseRoom):void {this.enqueue(()=>{if(!this.exploreEnabled||!this.inputEnabled)return;const target=HOUSE_ROOMS.find(r=>r.id===room);if(!target)return;this.gesture=undefined;this.exploring=true;this.explorePoint=this.framePoint(target);this.notifyView();});}
 public follow():void {this.exploring=false;this.explorePoint=undefined;this.gesture=undefined;this.notifyView();}
 private resetPresence():void {this.follow();this.clearResponse();this.clearHouseAction();this.furnitureExit=undefined;this.furnitureRest=undefined;this.vignetteFx?.clear();this.lampOn=true;this.attentionAt=undefined;this.lastAttention=-Infinity;this.setMotion(false);}
 private clearResponse():void {
  const response=this.response;if(!response)return;
  response.prop.image.setCrop().setScale(response.scaleX,response.scaleY).setRotation(0).setOrigin(.5,1).setPosition(response.prop.x,response.prop.y);
  response.leaf?.destroy();this.response=undefined;
  if(response.prop.kind==='fridge'||response.prop.kind==='cupboard')this.setProp(response.prop,{});
  if(response.prop.kind==='mailbox')this.setProp(response.prop,{...response.prop.opts,open:false});
 }
 private respondToProp(prop:Prop):void {
  this.clearResponse();if(prop.kind==='pantry')prop=this.props.find(p=>p.kind==='fridge')||prop;
  const response:HouseResponse={prop,elapsed:0,duration:900,scaleX:prop.image.scaleX,scaleY:prop.image.scaleY};this.response=response;
  if(prop.kind==='fridge'||prop.kind==='cupboard')this.setProp(prop,{...prop.opts,open:true});
  if(prop.kind==='mailbox')this.setProp(prop,{...prop.opts,open:true});
  if(prop.kind==='bedside'&&!this.state.house.powerOut)this.lampOn=!this.lampOn;
  if(prop.kind==='plant'){
   const cut=Math.floor(prop.image.height*.68);prop.image.setCrop(0,cut,prop.image.width,prop.image.height-cut);
   response.leaf=this.add.image(prop.x,prop.y,prop.image.texture.key).setOrigin(.5,1).setScale(response.scaleX,response.scaleY).setCrop(0,0,prop.image.width,cut).setTint(prop.image.tintTopLeft).setDepth(prop.image.depth+.05);
  }
 }
 private updateResponse(dt:number):void {
  const response=this.response;if(!response)return;response.elapsed+=dt;
  if(response.elapsed>=response.duration){this.clearResponse();return;}
  const progress=response.elapsed/response.duration,wave=Math.sin(progress*Math.PI*4)*(1-progress),prop=response.prop;
  if(prop.kind==='plant')response.leaf?.setRotation(wave*.035).setX(prop.x+Math.round(wave));
  if(prop.kind==='painting')prop.image.setOrigin(.5,0).setPosition(prop.x,prop.y-prop.image.height*response.scaleY).setRotation(wave*.035);
 }
 private clearHouseAction(finish=false):void {
  const action=this.houseAction;if(!action)return;
  action.prop.image.setPosition(action.prop.x,action.prop.y).setScale(1).setAlpha(action.prop.kind==='shelter'?.9:1);
  action.prop.shadow?.setPosition(action.prop.x+1,action.prop.y+1).setDepth(action.prop.y-.8);
  if(finish&&action.actorTo)this.worldPoint={...action.actorTo};this.houseAction=undefined;
 }
 private beginHouseAction(before:GameState,after:GameState,receipt:Receipt):void {
  this.clearHouseAction();if(!after.alive||!receipt.success)return;
  const chair=this.props.find(p=>p.id==='chair')!,shelter=this.props.find(p=>p.kind==='shelter')!;
  if(receipt.action==='H20'&&before.house.chairAnchor!==after.house.chairAnchor){
   const from=targetPoint('chair',before.house.chairAnchor),to=targetPoint('chair',after.house.chairAnchor);
   this.houseAction={kind:'move',prop:chair,elapsed:0,duration:650,fromY:before.house.chairAnchor?384:336,toY:chair.y,actorFrom:from,actorTo:to};
  }else if(!before.house.chairLife&&after.house.chairLife)this.houseAction={kind:'reveal',prop:chair,elapsed:0,duration:450,fromY:chair.y,toY:chair.y};
  else if(!before.house.shelterLife&&after.house.shelterLife)this.houseAction={kind:'reveal',prop:shelter,elapsed:0,duration:500,fromY:shelter.y,toY:shelter.y};
 }
 private updateHouseAction(dt:number):void {
  const action=this.houseAction;if(!action)return;action.elapsed+=dt;
  if(action.elapsed>=action.duration){this.clearHouseAction(true);return;}
  if(action.kind==='move'&&action.actorFrom&&action.actorTo){const t=action.elapsed/action.duration;this.worldPoint={x:Phaser.Math.Linear(action.actorFrom.x,action.actorTo.x,t),y:Phaser.Math.Linear(action.actorFrom.y,action.actorTo.y,t)};}
 }
 private drawHouseResponse():void {
  const g=this.houseFx;g.clear();const lamp=this.props.find(p=>p.kind==='bedside');
  if(lamp&&(!this.lampOn||this.state.house.powerOut)){g.fillStyle(0x596f79);g.fillRect(lamp.x-7,lamp.y-32,15,8);g.fillRect(lamp.x-6,lamp.y-33,13,1);g.fillStyle(0x7e908f);g.fillRect(lamp.x-6,lamp.y-32,13,6);g.fillStyle(0x9ca9a2);g.fillRect(lamp.x-5,lamp.y-32,11,1);g.fillStyle(0x687e84);g.fillRect(lamp.x-7,lamp.y-25,15,1);}
  const response=this.response;if(response?.prop.kind==='shelf'){
   const prop=response.prop,rise=Math.round(Math.sin(response.elapsed/response.duration*Math.PI)*3);g.fillStyle(0xe6dfc2);g.fillRect(prop.x-8,prop.y-18-rise,3,1);g.fillStyle(0x9aaa9b);g.fillRect(prop.x-8,prop.y-16-rise,3,1);
  }
  const action=this.houseAction;if(!action)return;const t=action.elapsed/action.duration;
  if(action.kind==='move'){const y=Phaser.Math.Linear(action.fromY,action.toY,t);action.prop.image.setPosition(action.prop.x,Math.round(y)).setDepth(y);action.prop.shadow?.setPosition(action.prop.x+1,y+1).setDepth(y-.8);}
  else{const lift=Math.sin(t*Math.PI)*3;action.prop.image.setScale(1,Math.min(1,.84+t*.3)).setY(action.toY-lift).setAlpha(action.prop.kind==='shelter'?Math.min(.9,.45+t):1);}
 }
 private setMotion(traveling:boolean):void {if(this.motion===traveling)return;this.motion=traveling;this.cb.onMotion?.({traveling});}
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
  if(this.actor.input)this.actor.input.enabled=this.exploreEnabled&&state.alive;
  this.drawMess();
 }
 private drawMess():void {
  this.messFx.clear();const count=this.state.house.mess*8;
  for(let i=0;i<count;i++){const x=156+(i*23%55),y=100+(i*13%36);this.messFx.fillStyle(i%3===0?0x9b774a:0xb9955e,.9);this.messFx.fillRect(x,y,i%2+1,1);}
  if(this.state.conditions.some(c=>c.kind==='contaminatedSurface'&&!c.resolved)){this.messFx.fillStyle(0x76835b,.7);this.messFx.fillRect(201,57,3,2);this.messFx.fillRect(211,59,2,1);}
 }
 public setSave(state:GameState=demoState,options:SavePresentation={}):void {this.enqueue(()=>{
  this.clearOpening();this.openingHandoff=false;this.handoffCamera=undefined;
  const keepView=this.exploreEnabled&&this.exploring&&this.state.seed===state.seed&&this.state.day===state.day;if(!keepView)this.resetPresence();
  this.playback=null;this.inspectMark=undefined;this.inspectFx.clear();this.transition.setAlpha(0);this.taskFx.clear();this.closeStorage();this.applyState(state);this.modeSleep=options.sleep!==false&&state.alive;this.held.setVisible(false);this.secondHeld.setVisible(false);this.actor.setVisible(state.alive);this.actor.setRotation(0);
  const box=this.props.find(p=>p.kind==='mailbox');if(box)this.setProp(box,{open:false,parcel:false});
  this.shadow.setVisible(state.alive&&!this.modeSleep);this.blanket.setVisible(this.modeSleep);this.setLight(options.dim===false?0:state.day===0?.05:.23);
  if(this.modeSleep){this.worldPoint={x:312,y:74};this.cameraPoint={...BEDROOM_VIEW};this.facing=1;this.pose('sleep');}
  else{this.worldPoint=targetPoint(options.focus||'bed',state.house.chairAnchor);this.cameraPoint={x:this.worldPoint.x,y:this.worldPoint.y+18};this.pose('idle');}
  if(options.focus&&!this.modeSleep)this.cameraPoint=targetPoint(options.focus,state.house.chairAnchor);
  this.actor.setPosition(this.worldPoint.x,this.worldPoint.y);this.shadow.setPosition(this.worldPoint.x,this.worldPoint.y);this.centerCamera(true);
 });}
 public start(day:DayResult,options:PlaybackOptions={}):void {this.enqueue(()=>{
  const handoff=this.openingHandoff&&this.seed===(day.receipts[options.startIndex||0]?.decisionSnapshot||day.receipts[options.startIndex||0]?.before)?.seed;
  this.clearOpening();this.openingHandoff=false;
  this.handoffCamera=handoff?{index:options.startIndex||0,x:this.cameraPoint.x}:undefined;
  this.resetPresence();
  this.openAudio();this.clearParticles();this.transition.setAlpha(0);this.modeSleep=false;this.blanket.setVisible(false);this.setLight(0);for(const z of this.zeds)z.setVisible(false);
  const index=Math.min(Math.max(0,options.startIndex||0),Math.max(0,day.receipts.length-1));const first=day.receipts[index];if(!first){this.applyState(day.finalState);this.cb.onComplete?.();return;}
  const approach=first.decisionSnapshot||first.before;
  const newMorning=index===0&&day.startTarget==='bed';
  this.actor.setVisible(true);this.shadow.setVisible(true);this.applyState(approach);this.worldPoint=newMorning?{x:312,y:74}:index===0&&day.baseDay>0&&!options.skipDelivery?targetPoint('mailbox'):this.receiptPoint(first,approach);if(newMorning)this.furnitureExit=targetPoint('bed');this.actor.setPosition(this.worldPoint.x,this.worldPoint.y);if(!handoff){this.cameraPoint={x:this.worldPoint.x,y:this.worldPoint.y+18};this.centerCamera(true);}
  const normalSlot=Math.max(1900,((options.durationMs||180000)-6000)/60);this.lastMessage='';
  this.playback={day,index,elapsed:0,normalSlot,perSlot:normalSlot,route:[],routeLength:0,travel:0,effect:false,arrived:false,stage:!day.startTarget&&index===0&&day.baseDay>0&&!options.skipDelivery?'prelude':'receipts',paused:false,preludeTarget:'mailbox',introUntil:0,tailMs:0,vignette:planDailyVignette(day)};
  this.cb.onSnapshot?.(approach,index);
  if(this.playback.stage==='prelude'){
   const mailbox=this.props.find(p=>p.kind==='mailbox')!;this.setProp(mailbox,{open:true,parcel:day.delivery.length>0});this.held.setVisible(false);this.pose('use');
   this.cb.onMessage?.(day.delivery.length?['The delivery is here.','Into the cupboards.']:['Nothing new today.','Using stored supplies.']);
  }else{
    const lines:[string,string]=index>0?day.receipts[index-1].lines:[activityCaption(first.label),''];
   this.lastMessage=lines.join('\n');this.cb.onMessage?.(lines);this.beginReceipt(false);
  }
 });}
 private beginReceipt(notifySnapshot=true,allowQuietSpan=true):void {
  this.clearHouseAction(true);
  const pb=this.playback;if(!pb)return;const receipt=pb.day.receipts[pb.index];if(!receipt){this.beginEnding();return;}
  delete pb.quietSpanEnd;delete pb.deliveryReturn;
  const approach=receipt.decisionSnapshot||receipt.before;
  pb.routineHold=receipt.role==='interlude'&&receipt.action==='T01'&&!receipt.choice&&!isDeliveryCollection(receipt)&&approach.alive&&receipt.snapshot.alive;
  this.closeStorage();if(!pb.routineHold)this.blanket.setVisible(false);this.applyState(approach);this.actor.setVisible(approach.alive);this.held.setVisible(false);
  this.setLight(({Dawn:.05,Morning:0,Midday:0,Afternoon:0,Evening:.08,Bedtime:.17} as Record<string,number>)[receipt.phase]||0);
  const instantTerminal=!receipt.decisionSnapshot&&!receipt.snapshot.alive&&receipt.action==='T01'&&!receipt.choice;
  const approachPoint=this.receiptPoint(receipt,approach),sameSeatContact=isSeatedReceipt(receipt)&&this.furnitureRest==='seat'&&this.furnitureExit&&Phaser.Math.Distance.BetweenPoints(this.furnitureExit,approachPoint)<.5;
  const dest=instantTerminal||pb.routineHold||sameSeatContact?this.worldPoint:approachPoint;pb.route=this.routeTo(dest,!pb.routineHold&&!instantTerminal&&!sameSeatContact);
  pb.routeLength=0;for(let i=1;i<pb.route.length;i++)pb.routeLength+=Phaser.Math.Distance.BetweenPoints(pb.route[i-1],pb.route[i]);
  if(pb.routeLength>32)this.handoffCamera=undefined;
  const timing=receiptTiming(receipt,pb.routeLength,pb.normalSlot);pb.travel=timing.travel;pb.perSlot=timing.duration;pb.elapsed=0;pb.effect=false;pb.arrived=false;this.transition.setAlpha(0);
  const quietSpan=allowQuietSpan?quietSpanAt(pb.day.receipts,pb.index):undefined;
  if(quietSpan){pb.quietSpanEnd=quietSpan.end;pb.perSlot=Math.max(pb.perSlot,1850);}
  this.syncMailbox();
  pb.beforeBeat=beforeActionBeat(receipt);pb.afterBeat=afterActionBeat(receipt);pb.introUntil=pb.beforeBeat?Math.min(1200,Math.max(0,pb.travel+(pb.perSlot-pb.travel)*receiptImpactFraction(receipt)-120)):0;pb.tailMs=pb.afterBeat?1100:0;pb.tailMessage=false;pb.eventFocused=false;pb.intentMessage=false;
  if(pb.beforeBeat){const lines=pb.beforeBeat.lines;this.lastMessage=lines.join('\n');this.cb.onMessage?.(lines);}
  else this.showActivity(receipt);
  this.cb.onReceipt?.(receipt,pb.index);if(notifySnapshot)this.cb.onSnapshot?.(approach,pb.index);this.cb.onProgress?.(pb.index,pb.day.receipts.length);
 }
 private showActivity(receipt:Receipt):void {
  const pb=this.playback;if(!pb)return;const lines:[string,string]=pb.routineHold?this.furnitureRest==='bed'?['A quiet stretch.','Resting at home.']:['A quiet stretch.','The house carries on.']:[activityCaption(receipt.label),''];
  this.lastMessage=lines.join('\n');this.cb.onMessage?.(lines);pb.intentMessage=true;
 }
 private routeTo(dest:WorldPoint,leaveFurniture=true):WorldPoint[] {
  const from={...this.worldPoint},exit=leaveFurniture?this.furnitureExit:undefined;
  if(leaveFurniture){this.furnitureExit=undefined;this.furnitureRest=undefined;}
  const route=[from];if(exit&&Phaser.Math.Distance.BetweenPoints(from,exit)>1)route.push({...exit});
  const origin=route.at(-1)!;route.push(...findRoute(origin,dest));return route;
 }
 private receiptPoint(receipt:Receipt,state:GameState):WorldPoint {
  if(receipt.action==='H20')return targetPoint('chair',state.house.chairAnchor);
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
  this.clearHouseAction(true);
  const pb=this.playback;if(!pb)return;this.closeStorage();this.held.setVisible(false);this.secondHeld.setVisible(false);this.taskFx.clear();this.transition.setAlpha(0);pb.stage='ending';pb.elapsed=0;pb.effect=false;pb.arrived=false;pb.eventFocused=false;pb.beforeBeat=undefined;pb.afterBeat=undefined;
  if(pb.day.finalState.alive){
   const alreadyAsleep=this.furnitureRest==='bed';const dest=alreadyAsleep?this.worldPoint:targetPoint('bed');pb.route=this.routeTo(dest,!alreadyAsleep);pb.routeLength=0;pb.endingFrom={...dest};
   for(let i=1;i<pb.route.length;i++)pb.routeLength+=Phaser.Math.Distance.BetweenPoints(pb.route[i-1],pb.route[i]);
   pb.travel=purposefulTravelMs(pb.routeLength);
  }else pb.travel=0;
 }
 private closeStorage():void {for(const p of this.props)if(p.kind==='fridge'||p.kind==='cupboard')this.setProp(p,{});}
 private syncMailbox(open=false):void {
  const pb=this.playback,box=this.props.find(p=>p.kind==='mailbox');if(!pb||!box||!pb.day.startTarget)return;
  const collection=pb.day.receipts.findIndex(isDeliveryCollection),pending=pb.day.delivery.length>0&&(collection<0||pb.index<collection||pb.index===collection&&(!pb.effect||!pb.day.receipts[collection]?.success));
  const next={open,parcel:pending};if(box.opts.open!==next.open||box.opts.parcel!==next.parcel)this.setProp(box,next);
 }
 private planDeliveryReturn(pb:Playback):void {
  const route=[{...this.worldPoint},...findRoute(this.worldPoint,targetPoint('store'))];let routeLength=0;for(let i=1;i<route.length;i++)routeLength+=Phaser.Math.Distance.BetweenPoints(route[i-1],route[i]);
  pb.deliveryReturn={route,routeLength,travel:purposefulTravelMs(routeLength),start:pb.elapsed+450};pb.perSlot=pb.deliveryReturn.start+pb.deliveryReturn.travel+1100;
 }
 private moveOnRoute(pb:Pick<Playback,'route'|'routeLength'>,t:number):void {
  let distance=pb.routeLength*Math.min(1,t);let point=pb.route.at(-1)||this.worldPoint;let prev=pb.route[0]||point;
  for(let i=1;i<pb.route.length;i++){const p=pb.route[i],d=Phaser.Math.Distance.BetweenPoints(prev,p);if(distance<=d){const k=d?distance/d:1;point={x:Phaser.Math.Linear(prev.x,p.x,k),y:Phaser.Math.Linear(prev.y,p.y,k)};if(p.x!==prev.x)this.facing=p.x>prev.x?1:-1;break;}distance-=d;prev=p;}
  this.worldPoint={x:Math.round(point.x),y:Math.round(point.y)};
 }
 private beginEffect(receipt:Receipt):void {
  const before=this.state;this.applyState(receipt.snapshot);this.beginHouseAction(before,receipt.snapshot,receipt);this.cb.onSnapshot?.(receipt.snapshot,receipt.index);
  const lines=this.playback?.routineHold?this.furnitureRest==='bed'?['A quiet stretch.','Resting at home.'] as [string,string]:['A quiet stretch.','The house carries on.'] as [string,string]:receipt.lines;
  const message=lines.join('\n');if(message!==this.lastMessage){this.cb.onMessage?.(lines);this.lastMessage=message;}
  const colors=receipt.success?['#f6e3a7','#b6d391']:['#c7a16a','#d48561'];
  if(receipt.action!=='T01')this.emitPixels(this.actor.x+this.facing*8,this.actor.y-12,colors[0],6);
  if(isDeliveryCollection(receipt)&&receipt.success){
   this.syncMailbox(true);this.emitPixels(this.actor.x+8,this.actor.y-12,'#f1d59b',5);this.tone('use');
   this.planDeliveryReturn(this.playback!);
  }
  if(receipt.action==='H16'||receipt.action==='G02')this.emitPixels(this.worldPoint.x+8,this.worldPoint.y-13,'#78bfe2',10,'water');
  if(['H05','H06','H07'].includes(receipt.action))this.emitPixels(this.worldPoint.x+7,this.worldPoint.y-8,'#f1f1d9',7);
  if(receipt.action==='H02')this.emitPixels(this.worldPoint.x,this.worldPoint.y-15,'#a6c88a',7);
  if(receipt.action!=='T01')this.tone(receipt.success?receipt.action.startsWith('G')?'garden':receipt.action.startsWith('K')?'cook':'use':'hurt');
  if(!receipt.snapshot.alive){this.held.setVisible(false);this.pose('dead');this.actor.setRotation(-Math.PI/2);this.tone('death');}
 }
 update(_time:number,delta:number):void {
  if(!this.initialized)return;
  if(this.opening){const dt=Math.min(delta,70);this.clock+=dt;this.drawOpening(dt);this.setMotion(false);return;}
  const paused=!!this.playback?.paused||this.exploreEnabled&&!this.inputEnabled;const dt=paused?0:Math.min(delta,70);this.clock+=dt;
  if(!paused)this.updatePlayback(dt);
  if(!paused){this.updateHouseAction(dt);this.updateResponse(dt);}this.updateActor(paused);this.drawInspect(dt);this.drawHouseResponse();this.drawVignette();if(!paused){this.updateParticles(dt);this.drawHazards();this.drawTask();this.drawAmbient();this.centerCamera(false,dt);}
  const pb=this.playback,returning=pb?.deliveryReturn;this.setMotion(!paused&&!!pb&&(pb.stage==='receipts'&&(pb.elapsed<pb.travel&&pb.routeLength>=3||!!returning&&pb.elapsed>=returning.start&&pb.elapsed<returning.start+returning.travel&&returning.routeLength>=3)||pb.stage==='prelude'&&pb.preludeTarget==='store'&&pb.elapsed<900+pb.travel||pb.stage==='ending'&&pb.elapsed<pb.travel));
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
    else{const t=Math.min(1,(pb.elapsed-pb.travel)/350),bed=pb.endingFrom||targetPoint('bed');this.modeSleep=true;this.worldPoint={x:Math.round(Phaser.Math.Linear(bed.x,312,t)),y:Math.round(Phaser.Math.Linear(bed.y,74,t))};this.setLight(Phaser.Math.Linear(.17,.23,t));if(!pb.effect){pb.effect=true;this.cb.onMessage?.(['Another little day.','Nearly human.']);}}
   }
   if(pb.elapsed>pb.travel+1600){this.playback=null;if(pb.day.finalState.alive)this.actor.setRotation(0);this.cb.onSnapshot?.(pb.day.finalState,pb.day.receipts.length);this.cb.onProgress?.(pb.day.receipts.length,pb.day.receipts.length);this.cb.onComplete?.();}return;
  }
  const receipt=pb.day.receipts[pb.index];if(!receipt){this.beginEnding();return;}
  if(!pb.intentMessage&&pb.elapsed>=pb.introUntil)this.showActivity(receipt);
  if(pb.elapsed<pb.travel){
   this.moveOnRoute(pb,pb.elapsed/pb.travel);if(this.clock-this.lastStep>170){this.lastStep=this.clock;this.tone('step');}
  }
  else {if(!pb.arrived){this.moveOnRoute(pb,1);pb.arrived=true;}if(!pb.effect&&pb.elapsed>pb.travel+(pb.perSlot-pb.travel)*receiptImpactFraction(receipt)){pb.effect=true;this.beginEffect(receipt);}}
  const home=pb.deliveryReturn;
  if(home&&pb.elapsed>=home.start){
   if(!home.announced){home.announced=true;this.syncMailbox(false);const lines:[string,string]=['Bringing the delivery home.','Back to the pantry.'];this.lastMessage=lines.join('\n');this.cb.onMessage?.(lines);}
   if(pb.elapsed<home.start+home.travel)this.moveOnRoute(home,(pb.elapsed-home.start)/home.travel);
   else if(!home.arrived){home.arrived=true;this.moveOnRoute(home,1);const fridge=this.props.find(p=>p.kind==='fridge')!;this.setProp(fridge,{open:true});const lines:[string,string]=['Putting the supplies away.',''];this.lastMessage=lines.join('\n');this.cb.onMessage?.(lines);}
   if(home.arrived&&!home.stored&&pb.elapsed>=home.start+home.travel+420){home.stored=true;const lines:[string,string]=['Supplies put away.',''];this.lastMessage=lines.join('\n');this.cb.onMessage?.(lines);}
  }
  if(pb.afterBeat&&pb.effect&&!pb.tailMessage&&pb.elapsed>=pb.perSlot-300){pb.tailMessage=true;const lines=pb.afterBeat.lines;this.lastMessage=lines.join('\n');this.cb.onMessage?.(lines);}
  if(pb.elapsed>=pb.perSlot+pb.tailMs){this.held.setVisible(false);const end=pb.quietSpanEnd??pb.index;if(end>pb.index){const last=pb.day.receipts[end]!;this.applyState(last.snapshot);this.cb.onSnapshot?.(last.snapshot,end);}if(!receipt.snapshot.alive||end>=pb.day.receipts.length-1)this.beginEnding();else{pb.index=end+1;this.beginReceipt();}}
 }
 private updateActor(paused:boolean):void {
  if(paused)return;this.actor.setRotation(this.state.alive?0:-Math.PI/2);this.secondHeld.setVisible(false);
  const pb=this.playback,cadence=physicalCadence(this.seed);let pose:RoosterPose='idle';let sleeping=this.modeSleep,seated=false;let point={...this.worldPoint};
  if(this.modeSleep)pose='sleep';else if(!this.state.alive)pose='dead';else if(pb?.stage==='ending'&&pb.elapsed<pb.travel||pb?.stage==='prelude'&&pb.preludeTarget==='store'&&pb.elapsed<900+pb.travel)pose=Math.floor(this.clock/cadence.stepMs)%2?'walk-a':'walk-b';
  else if(pb?.stage==='receipts'){
   const receipt=pb.day.receipts[pb.index];if(pb.elapsed<pb.travel)pose=Math.floor(this.clock/cadence.stepMs)%2?'walk-a':'walk-b';else if(receipt){
    const workElapsed=Math.max(0,pb.elapsed-pb.travel),workDuration=Math.max(1,pb.perSlot-pb.travel),workProgress=Math.min(1,workElapsed/workDuration);
    // A purposeful gesture starts with this action, not an unrelated world clock.
    const beat=Math.floor(workElapsed/cadence.workMs)%2;
    const stroke=receipt.role==='focus'?Math.max(0,Math.sin(workElapsed/cadence.workMs*Math.PI)):Math.sin(Math.min(1,workProgress/.48)*Math.PI);
    if(receipt.action.startsWith('G')&&(receipt.target==='plot1'||receipt.target==='plot2'))this.facing=receipt.target==='plot1'?1:-1;
    else if(receipt.action!=='T01'&&!['H03','H04'].includes(receipt.action))this.facing=1;
    const eating=receipt.action==='H01'||receipt.action==='K07'||receipt.action.startsWith('K')&&pb.effect||receipt.action==='G05'&&receipt.variant==='apple'&&pb.effect;
    const repair=['H08','H09','H10','H11','H12','H15','H20'].includes(receipt.action);
    sleeping=receipt.action==='H03';seated=isSeatedReceipt(receipt);
    pose=sleeping?'sleep':pb.effect&&!receipt.success?'hurt':eating?'eat':receipt.action==='H02'?'treat':receipt.action.startsWith('G')?'garden':repair?'repair':'use';
    if(!sleeping&&workProgress<.13)pose='idle';
    else if(!sleeping&&workProgress>.82&&receipt.success)pose=settlePose(this.state);
    else if(beat&&!sleeping)pose='idle';
    if(sleeping){const from=pb.route.at(-1)||this.worldPoint,t=Math.min(1,workElapsed/400);point={x:Phaser.Math.Linear(from.x,312,t),y:Phaser.Math.Linear(from.y,74,t)};this.worldPoint={...point};this.furnitureExit=targetPoint('bed');this.furnitureRest='bed';this.facing=1;}
    if(seated){const from=pb.route.at(-1)||this.worldPoint,to=receipt.target==='baseSeat'?{x:80,y:331}:{x:168,y:this.state.house.chairAnchor?379:331},t=Math.min(1,workElapsed/320);point={x:Phaser.Math.Linear(from.x,to.x,t),y:Phaser.Math.Linear(from.y,to.y,t)};this.worldPoint={...point};this.furnitureExit=targetPoint(receipt.target,this.state.house.chairAnchor);this.furnitureRest='seat';const personality=samplePersonality({seed:this.seed,clockMs:this.clock,mode:'seated',state:this.state,facing:this.facing,target:receipt.target,activityKey:receipt.day+':'+receipt.slot,activityMs:workElapsed});pose=personality.pose;this.facing=personality.facing;}
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
     const personality=samplePersonality({seed:this.seed,clockMs:this.clock,mode:seated?'seated':'quiet',state:this.state,facing:this.facing,target:receipt.target,activityKey:receipt.day+':'+receipt.slot,activityMs:workElapsed});pose=personality.pose;this.facing=personality.facing;
     if(pb.vignette?.index===pb.index&&workProgress>.16&&workProgress<.73){pose='perk';if(receipt.target==='gardenView')this.facing=workProgress<.45?1:-1;}
     this.held.setVisible(false);
     if(pb.routineHold&&this.furnitureRest==='bed'){sleeping=true;pose='sleep';this.facing=1;}
     else if(pb.routineHold&&this.furnitureRest==='seat'){seated=true;pose=samplePersonality({seed:this.seed,clockMs:this.clock,mode:'seated',state:this.state,facing:this.facing,target:receipt.target,activityKey:receipt.day+':'+receipt.slot,activityMs:workElapsed}).pose;}
    }
    if(isDeliveryCollection(receipt)){
     const home=pb.deliveryReturn,returning=!!home&&pb.elapsed>=home.start&&pb.elapsed<home.start+home.travel;
     pose=returning?Math.floor(this.clock/cadence.stepMs)%2?'walk-a':'walk-b':'use';this.held.setVisible(false);this.secondHeld.setVisible(false);this.syncMailbox(!pb.effect);
    }
   }
  }else{const personality=samplePersonality({seed:this.seed,clockMs:this.clock,mode:sleeping?'sleep':'awake',state:this.state,facing:this.facing,activityKey:this.state.day});pose=personality.pose;this.facing=personality.facing;}
  if(pb?.stage==='receipts'&&pb.elapsed<pb.travel&&!(pb.index===0&&pb.day.startTarget==='bed')){
   const r=pb.day.receipts[pb.index],items=Object.keys(r.inputs) as ItemId[];if(items[0])this.held.setTexture('item-'+items[0]).setOrigin(.5).setScale(.85).setRotation(0).setFlipX(this.facing<0).setVisible(true).setPosition(point.x+this.facing*11,point.y-13).setDepth(point.y+2);else this.held.setVisible(false);
   if(items[1])this.secondHeld.setTexture('item-'+items[1]).setOrigin(.5).setScale(.7).setRotation(0).setVisible(true).setPosition(point.x-this.facing*7,point.y-8).setDepth(point.y+2);
  }
  if(pb?.stage==='receipts'&&pb.beforeBeat?.event.source==='mood'&&pb.elapsed>=pb.travel&&pb.elapsed<pb.introUntil&&pb.elapsed-pb.travel<650)pose='doze';
  if(this.exploreEnabled&&this.attentionAt!==undefined){const attention=sampleAttention({elapsedMs:this.clock-this.attentionAt,state:this.state,sleeping,facing:this.facing,toward:this.attentionFacing});if(attention){pose=attention.pose;this.facing=attention.facing;}else if(this.clock-this.attentionAt>=NPC_ATTENTION_MS)this.attentionAt=undefined;}
  const tremble=!sleeping&&this.state.alive&&this.state.conditions.some(c=>c.kind==='jitters'&&!c.resolved)?Math.floor(this.clock/85)%2:0;
  const onBed=point.x>=286&&point.x<=354&&point.y>=42&&point.y<=112;
  this.pose(pose);this.blanket.setVisible(sleeping&&this.state.alive);this.actor.setPosition(point.x+tremble,point.y).setDepth(sleeping||onBed?113:seated?point.y+7:point.y+1);this.shadow.setPosition(point.x,point.y+1).setDepth(point.y-.5).setVisible(this.actor.visible&&!sleeping&&!seated&&!onBed);
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
  if(this.lampOn&&!this.state.house.powerOut){const strength=night?1:.4;g.fillStyle(0xf4df9e,.14*strength);g.fillEllipse(354,116,60,32);g.fillStyle(0xf4df9e,.08*strength);g.fillEllipse(354,116,36,18);g.fillStyle(0xf4df9e,.07*strength);g.fillEllipse(354,75,26,20);}
  for(let i=0;i<4;i++){const x=72+i*97,y=474+(i%2)*61,wave=Math.floor(Math.sin(this.clock/850+i)*2);g.fillStyle(0xb0c578,night?.24:.65);g.fillRect(x+wave,y,1,3);g.fillRect(x+2+wave,y-1,1,2);}
 }
 private drawVignette():void {
  const g=this.vignetteFx;g.clear();const pb=this.playback,v=pb?.vignette;
  if(!pb||!v||pb.stage!=='receipts'||pb.index!==v.index||pb.elapsed<pb.travel||!this.state.alive)return;
  const t=Math.min(1,(pb.elapsed-pb.travel)/Math.max(1,pb.perSlot-pb.travel)),alpha=Math.sin(t*Math.PI);if(alpha<.15)return;
  const pixel=(color:number,x:number,y:number,w=1,h=1)=>{g.fillStyle(color,alpha);g.fillRect(Math.round(x),Math.round(y),w,h);};
  const glass=(color:number,x:number,y:number)=>{x=Math.round(x);y=Math.round(y);if((x>=123&&x<=132||x>=140&&x<=148)&&(y>=23&&y<=29||y>=35&&y<=41))pixel(color,x,y);};
  if(v.kind.startsWith('window-')){
   const x=121+t*31,y=27+Math.sin(t*Math.PI)*2,wing=Math.floor(t*12)%2;
   if(v.kind==='window-cloud'){for(const[dx,dy]of [[0,1],[1,0],[1,1],[2,0],[2,1],[3,1],[4,1]])glass(0xe5e6ce,x+dx,y+dy);}
   else if(v.kind==='window-bird'){for(const[dx,dy]of [[0,0],[1,0],[0,1],[1,1],[-1,-wing-1],[-2,-wing-2],[-3,-wing-2],[2,-wing-1],[3,-wing-2],[4,-wing-2]])glass(0x354f62,x+dx,y+dy);}
   else{glass(0xe6dfad,x,y);glass(0xefd69b,x-1,y-wing-1);glass(0xefd69b,x+1,y-wing-1);}
  }else{
   const x=411+Math.sin(t*Math.PI*1.3)*27,y=351+Math.sin(t*Math.PI*4)*3,wing=Math.floor(t*14)%2;
   if(v.kind==='garden-breeze'){const drift=404+t*42,fall=348+Math.sin(t*Math.PI)*8;pixel(0xc5cc91,drift,fall,4,2);pixel(0x9cae70,drift+1,fall-1,2,1);pixel(0x7d945a,drift+4,fall+1,1,2);pixel(0xb2c285,drift+13,fall-5,2,1);}
   else{pixel(0x8a6b40,x,y,2,3);if(v.kind==='garden-butterfly'){pixel(0xe9e2b8,x-3,y-2-wing,3,3);pixel(0xc4d08f,x+2,y-2-wing,3,3);}else{g.fillStyle(0xf2d57e,alpha*.14);g.fillRect(Math.round(x)-2,Math.round(y)-2,6,6);pixel(0xf5df8e,x,y,2,2);}}
  }
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
  g.setDepth(isDeliveryCollection(r)?Math.max(480,this.actor.depth+4,533):480);
  const p=(c:number,x:number,y:number,w:number,h:number)=>{g.fillStyle(c);g.fillRect(Math.round(x),Math.round(y),w,h);};
  if(isDeliveryCollection(r)&&pb.effect&&r.success){
   const home=pb.deliveryReturn,deposit=home?.arrived?Math.min(1,Math.max(0,(pb.elapsed-home.start-home.travel)/420)):0;
   if(deposit<1){const x=Phaser.Math.Linear(this.worldPoint.x+this.facing*12,72,deposit),y=Phaser.Math.Linear(this.worldPoint.y-14,64,deposit);p(0x5c4430,x-6,y-4,12,10);p(0xc49b63,x-5,y-4,10,8);p(0xe3bf82,x-5,y-4,10,1);p(0x977141,x-1,y-4,2,8);p(0xf2e7c9,x-3,y-1,7,2);}
  }
  if(r.role==='focus'&&!pb.effect&&r.action==='H09'){
   const t=Math.min(1,(pb.elapsed-pb.travel)/Math.max(1,pb.perSlot-pb.travel)/.72),x=r.variant==='shelter'?432:168,y=r.variant==='shelter'?348:336;
   p(0x805c36,x-14,y-1,28,3);p(0xcda367,x-13,y-1,26,1);if(t>.22){p(0x6e4e30,x-10,y-13,4,15);p(0xaa7e49,x+7,y-13,4,15);}if(t>.48){p(0xb99258,x-11,y-14,24,4);p(0xe2bf7e,x-10,y-14,22,1);}if(t>.68){p(0x7b5935,x-10,y-24,3,12);p(0xb98e53,x+8,y-24,3,12);p(0xceaa69,x-9,y-25,19,3);}
  }
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
  if(r.role==='focus'&&r.action==='G05'&&!pb.effect){const x=r.target==='plot1'?408:456;for(let i=0;i<3;i++)if((tick+i)%3===0){p(0xf4dfa4,x-7+i*6,315-i%2*4,1,3);p(0xf4dfa4,x-8+i*6,316-i%2*4,3,1);}}
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
  const rain=!!r&&hasRecordedRain(r)||episodes.some(e=>e.kind==='rain'&&!e.resolved&&r&&r.slot<=e.boundary);
  if(rain){
   // Weather is presentation of the recorded episode, never another roll.
   this.fireFx.fillStyle(0xa1d0df,.6);
   for(let i=0;i<26;i++){const x=385+(i*29%91),y=273+(i*19+Math.floor(this.clock/65)*3)%139;this.fireFx.fillRect(x,y,1,3);}
   for(let i=0;i<5;i++)this.fireFx.fillRect(125+i*5,25+(i*5+Math.floor(this.clock/90))%14,1,3);
   for(let i=0;i<24;i++){const x=40+i*19%430,y=452+(i*23+Math.floor(this.clock/65)*3)%139;this.fireFx.fillRect(x,y,1,3);}
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
  if(this.opening){this.cameraPoint=this.framePoint(this.openingTarget==='bed'?BEDROOM_VIEW:{x:136,y:120});this.cameras.main.centerOn(Math.round(this.cameraPoint.x),Math.round(this.cameraPoint.y));return;}
  if(this.exploreEnabled&&this.exploring&&this.explorePoint){const target=this.constrainPoint(this.explorePoint),blend=immediate?1:1-Math.exp(-Math.max(0,delta)/130);this.cameraPoint={x:Phaser.Math.Linear(this.cameraPoint.x,target.x,blend),y:Phaser.Math.Linear(this.cameraPoint.y,target.y,blend)};this.cameras.main.centerOn(Math.round(this.cameraPoint.x),Math.round(this.cameraPoint.y));return;}
  const pb=this.playback;const resting=pb?.stage==='receipts'&&pb.elapsed>=pb.travel&&(pb.day.receipts[pb.index]?.action==='H03'||pb.routineHold&&this.furnitureRest==='bed');
  const receipt=pb?.stage==='receipts'?pb.day.receipts[pb.index]:undefined;
  const beat=pb?.stage==='receipts'?(pb.beforeBeat&&pb.elapsed<pb.introUntil?pb.beforeBeat:pb.afterBeat&&pb.effect&&pb.elapsed>=pb.perSlot-300?pb.afterBeat:undefined):undefined;
  if(pb&&beat?.target&&beat.target!=='body'&&beat.target!=='hall'){
   const point=targetPoint(beat.target,this.state.house.chairAnchor),focus=beat.target==='window'?{x:point.x+12,y:84}:beat.target==='plot1'||beat.target==='plot2'?{x:432,y:350}:{x:point.x,y:point.y+17};
   const target=this.frameActor(this.framePoint(focus)),blend=immediate?1:1-Math.exp(-Math.max(0,delta)/230);this.cameraPoint=this.frameActor({x:Phaser.Math.Linear(this.cameraPoint.x,target.x,blend),y:Phaser.Math.Linear(this.cameraPoint.y,target.y,blend)});this.cameras.main.centerOn(Math.round(this.cameraPoint.x),Math.round(this.cameraPoint.y));pb.eventFocused=true;return;
  }
  if(pb?.eventFocused)pb.eventFocused=false;
  const frame=(point:WorldPoint)=>receipt&&(receipt.target==='window'||receipt.action==='H14')?{x:point.x+12,y:84}:{x:point.x,y:point.y+17};
  const cam=this.cameras.main;let target=this.framePoint(this.modeSleep||resting?BEDROOM_VIEW:frame(this.worldPoint));
  // Keep the title's horizontal composition through its first real action. Later receipts follow normally.
  if(this.handoffCamera&&pb?.stage==='receipts'&&pb.index===this.handoffCamera.index)target.x=this.constrainPoint({x:this.handoffCamera.x,y:target.y}).x;else this.handoffCamera=undefined;
  target=this.frameActor(target);
  const blend=1-Math.exp(-Math.max(0,delta)/140);
  if(immediate)this.cameraPoint={...target};else{this.cameraPoint.x=Phaser.Math.Linear(this.cameraPoint.x,target.x,blend);this.cameraPoint.y=Phaser.Math.Linear(this.cameraPoint.y,target.y,blend);}
  this.cameraPoint=this.frameActor(this.cameraPoint);
  cam.centerOn(Math.round(this.cameraPoint.x),Math.round(this.cameraPoint.y));
 }
 public pausePlayback():void {if(this.playback)this.playback.paused=true;this.setMotion(false);}
 public resumePlayback():void {if(this.playback){this.playback.paused=false;this.openAudio();}}
 public skipPlayback():void {const pb=this.playback;if(!pb)return;this.resetPresence();this.playback=null;this.held.setVisible(false);this.actor.setRotation(0);this.setSave(pb.day.finalState);this.cb.onSnapshot?.(pb.day.finalState,pb.day.receipts.length);this.cb.onProgress?.(pb.day.receipts.length,pb.day.receipts.length);this.cb.onComplete?.();}
 public seekReceipt(index:number):void {const pb=this.playback;if(!pb)return;this.resetPresence();pb.stage='receipts';this.modeSleep=false;this.blanket.setVisible(false);pb.index=Phaser.Math.Clamp(index,0,pb.day.receipts.length-1);this.beginReceipt(true,false);const r=pb.day.receipts[pb.index];this.worldPoint=this.receiptPoint(r,r.snapshot);pb.elapsed=pb.travel+(pb.perSlot-pb.travel)*.8;pb.effect=true;pb.arrived=true;this.applyState(r.snapshot);if(isDeliveryCollection(r)&&r.success)this.planDeliveryReturn(pb);this.updateActor(false);this.drawTask();this.drawHazards();pb.paused=true;this.centerCamera(true);this.lastMessage=r.lines.join('\n');this.cb.onSnapshot?.(r.snapshot,pb.index);this.cb.onMessage?.(r.lines);}
 public currentIndex():number{return this.playback?.index??0;}
 public paused():boolean{return !!this.playback?.paused;}
 public enableInput(enabled:boolean):void {this.inputEnabled=enabled;if(!enabled)this.gesture=undefined;if(this.initialized)this.input.enabled=enabled;}
 public mute(value:boolean):void {this.muted=value;if(!value&&this.initialized)this.prepareAudio();}
 public zoom(value:number):void {this.enqueue(()=>{this.desiredZoom=Phaser.Math.Clamp(value,.9,1.3);this.resizeWorld(this.logicalWidth,this.logicalHeight,this.cssScale);});}
 private enqueue(f:()=>void):void{if(this.initialized)f();else this.queued.push(f);}
 private prepareAudio():void {
  if(this.muted||this.audio)return;
  // Hardware setup can be expensive. Prepare before the first opening draw, with no connected sound.
  try{this.audio=new AudioContext();}catch{/* Visual feedback remains complete on a silent platform. */}
 }
 private openAudio(onReady?:()=>void):void {
  if(this.muted||!this.audio||navigator.userActivation&&!navigator.userActivation.hasBeenActive)return;
  if(this.audio.state==='running'){onReady?.();return;}
  if(this.audio.state==='suspended'&&!this.audioReady){
   const pending=this.audio.resume().catch(()=>{});this.audioReady=pending;
   void pending.then(()=>{if(this.audioReady===pending)this.audioReady=null;});
  }
  // Only the explicit Start acknowledgement waits for unlock. Ambient effects never build a backlog.
  const audio=this.audio,pending=this.audioReady;if(onReady&&pending)void pending.then(()=>{if(this.audio===audio&&!this.muted&&audio.state==='running')onReady();});
 }
 private tone(kind:string):void {
  if(this.muted||!this.audio||this.audio.state!=='running'||navigator.userActivation&&!navigator.userActivation.hasBeenActive)return;
  const audio=this.audio;const osc=audio.createOscillator(),gain=audio.createGain();const t=audio.currentTime;const f=({tap:440,step:150,use:520,garden:660,cook:740,hurt:190,death:130} as Record<string,number>)[kind]||440;
  osc.type=kind==='step'?'triangle':'sine';osc.frequency.setValueAtTime(f,t);osc.frequency.exponentialRampToValueAtTime(f*(kind==='hurt'||kind==='death'?.65:1.25),t+.08);gain.gain.setValueAtTime(kind==='step'?.008:.025,t);gain.gain.exponentialRampToValueAtTime(.001,t+.12);osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+.14);
 }
 public shutdownWorld():void {this.clearOpening();this.clearParticles();if(this.audio)void this.audio.close();this.audio=null;this.audioReady=null;}
}

export function createWorldRenderer(container:HTMLElement,callbacks:WorldCallbacks={}):WorldController {
 let resolve=()=>{};const ready=new Promise<void>(r=>{resolve=r;});const scene=new HomeScene(callbacks,resolve);
 const size=()=>{const rect=container.getBoundingClientRect(),physicalWidth=Math.max(1,rect.width),width=Math.max(256,Math.min(480,Math.round(physicalWidth/2))),height=Math.max(1,Math.round(Math.max(1,rect.height)/physicalWidth*width));return{width,height,scale:physicalWidth/width};};
 const initial=size();scene.resizeWorld(initial.width,initial.height,initial.scale);
 const game=new Phaser.Game({type:Phaser.AUTO,parent:container,width:initial.width,height:initial.height,backgroundColor:'#192c34',pixelArt:true,roundPixels:true,antialias:false,transparent:false,render:{antialias:false,pixelArt:true,roundPixels:true},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:initial.width,height:initial.height},scene:[scene],audio:{noAudio:true},fps:{target:60,forceSetTimeOut:false}});
 let frame=0,disposed=false;const resize=()=>{if(disposed||!game.isBooted)return;const next=size();if(game.scale.width!==next.width||game.scale.height!==next.height)game.scale.resize(next.width,next.height);else game.scale.refresh();scene.resizeWorld(next.width,next.height,next.scale);};
 const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(resize);});observer.observe(container);
 void ready.then(resize);
 return{ready,beginOpening:(s,t)=>scene.beginOpening(s,t),finishOpening:()=>scene.finishOpening(),setViewportInsets:(t,b,l,r)=>scene.viewportInsets(t,b,l,r),showSave:(s,o)=>scene.setSave(s,o),playDay:(d,o)=>scene.start(d,o),pause:()=>scene.pausePlayback(),resume:()=>scene.resumePlayback(),skip:()=>scene.skipPlayback(),seek:i=>scene.seekReceipt(i),setMuted:m=>scene.mute(m),setZoom:z=>scene.zoom(z),setInputEnabled:enabled=>scene.enableInput(enabled),setExploreEnabled:enabled=>scene.explore(enabled),focusRoom:room=>scene.focus(room),followActor:()=>scene.follow(),getCurrentIndex:()=>scene.currentIndex(),isPaused:()=>scene.paused(),dispose:()=>{disposed=true;observer.disconnect();cancelAnimationFrame(frame);scene.shutdownWorld();game.destroy(true);}};
}

export {TARGET_LABELS};
