import {canvasArt,COLORS as C,outline,type Paint} from './pixels';
import {ZONES,DOORS,TILE,WORLD_WIDTH,WORLD_HEIGHT,isFloor} from '../game/layout';

function hash(x:number,y:number,seed:number):number {let h=Math.imul(x+17,374761393)^Math.imul(y+31,668265263)^seed;h=Math.imul(h^(h>>>13),1274126177);return(h^(h>>>16))>>>0;}
/** Cosmetic birth identity. It never selects rules, rooms, collisions or outcomes. */
export function homeArtSeed(value:string):number {let h=2166136261;for(const c of value)h=Math.imul(h^c.charCodeAt(0),16777619);return(h^(h>>>16))>>>0;}
function roomFloor(p:Paint,x:number,y:number,w:number,h:number,seed:number):void{
 p('#bc8953',x,y,w,h);
 for(let ry=0;ry<h;ry+=6){const offset=(Math.floor((y+ry)/6)%2)*16;
  for(let rx=-offset;rx<w;rx+=32){const noise=hash(x+rx,y+ry,seed);const a=Math.max(0,rx),right=Math.min(w,rx+32);if(right<=a)continue;
   const woods=[['#d4a76b','#d9ad73','#dfb078','#d6a56a'],['#d2a268','#d8aa6c','#dcb173','#d5a369'],['#d6a96f','#dcaf75','#dfb47c','#d6a76d']][(seed>>>6)%3];
   const height=Math.min(6,h-ry);p(woods[noise%4],x+a,y+ry,right-a,height);p('#e8bc82',x+a,y+ry,right-a,1);p('#bb8850',x+a,y+ry+height-1,right-a,1);
   if(rx>=0)p('#c38f55',x+rx,y+ry,1,height);
   const gx=rx+4+((noise>>>8)%16);if(gx>=0&&gx+7<w&&height>3)p('#cd9c61',x+gx,y+ry+3,7,1);
  }
 }
}
export function drawRug(p:Paint,x:number,y:number,w:number,h:number,seed=7):void{
 const tones=[['#3c6343','#bbaf70','#5c8d53','#719556','#426d46'],['#3b5f46','#b9ad71','#587f58','#789867','#446849'],['#405f4a','#c5b381','#6c8f5d','#81a06a','#4c7350']][(seed>>>4)%3];
 p(tones[0],x,y,w,h);p(tones[1],x+1,y+1,w-2,h-2);p(tones[2],x+3,y+3,w-6,h-6);p(tones[3],x+4,y+4,w-8,1);p(tones[4],x+4,y+h-5,w-8,1);
 for(let a=x+5;a<x+w-5;a+=4)for(let b=y+6;b<y+h-5;b+=4){const n=hash(a,b,seed);if(n%3===0)p(n%2?'#69975a':'#52824c',a,b,2,2);}
 for(let a=x+3;a<x+w-3;a+=5){p('#d1bd78',a,y+1,2,1);p('#d1bd78',a,y+h-2,2,1);}
 if(seed%3===1)for(let b=y+7;b<y+h-6;b+=6)p(tones[3],x+5,b,w-10,1);
 if(seed%3===2)for(let a=x+9;a<x+w-8;a+=12)for(let b=y+9;b<y+h-7;b+=10){p(tones[3],a,b,3,1);p(tones[3],a+1,b-1,1,3);}
}
function wall(p:Paint,x:number,y:number,w:number,h:number,seed:number):void{
 p('#332e27',x,y,w,h);p('#7d5536',x+2,y+2,w-4,h-3);p('#b18a54',x+2,y+2,w-4,2);
 if(w>8&&h>8){p('#e0d3a7',x+4,y+5,w-8,h-8);p('#eee0b9',x+5,y+6,w-10,h-11);p('#c7b68c',x+5,y+h-7,w-10,2);
  for(let a=x+7;a<x+w-8;a+=7){const n=hash(a,y,seed);p(n%2?'#e1d4a9':'#ebdcb1',a,y+7+(n%Math.max(1,h-17)),1,2);}
 }
}
export function houseCanvas(seed=14):HTMLCanvasElement {
 return canvasArt(WORLD_WIDTH,WORLD_HEIGHT,p=>{
  p('#39372e',0,0,WORLD_WIDTH,WORLD_HEIGHT);
  for(let y=0;y<WORLD_HEIGHT/TILE;y++)for(let x=0;x<WORLD_WIDTH/TILE;x++){
   if(!isFloor(x,y)){p('#705236',x*TILE,y*TILE,TILE,TILE);p('#82603c',x*TILE+1,y*TILE+1,14,14);p('#967049',x*TILE+1,y*TILE+1,14,1);continue;}
   p(C.floor,x*TILE,y*TILE,TILE,TILE);
  }
  for(const z of ZONES)if(!z.outdoor)roomFloor(p,z.x*TILE,z.y*TILE,z.w*TILE,z.h*TILE,seed);
  for(const z of ZONES)if(z.id!=='hall'&&z.id!=='connector'&&!z.outdoor){
   const x=z.x*TILE,y=z.y*TILE,w=z.w*TILE,h=z.h*TILE;
   wall(p,x-8,y-16,w+16,24,seed);
   // Waist-height return walls read as continuous cutaway architecture.
   p('#342e27',x-8,y+8,8,h-2);p('#7d5537',x-6,y+8,4,h-4);p('#b17f4d',x-5,y+9,1,h-6);
   p('#342e27',x+w,y+8,8,h-2);p('#7d5537',x+w+2,y+8,4,h-4);p('#b17f4d',x+w+2,y+9,1,h-6);
   p('#382f25',x-8,y+h-2,w+16,8);p('#805734',x-6,y+h,w+12,4);p('#ae7b48',x-5,y+h,w+10,1);
  }
  // Exact door openings are clear floor, with posts to either side.
  for(const d of DOORS){const x=d.x*TILE,y=d.y*TILE;roomFloor(p,x,y,TILE,TILE,seed);p('#4e3928',x-4,y-1,4,10);p('#aa7d4c',x-3,y,2,8);p('#4e3928',x+16,y-1,4,10);p('#aa7d4c',x+17,y,2,8);}
  // Long hall rugs connect the rooms without obscuring door approaches.
  drawRug(p,37,214,145,25,seed);drawRug(p,231,253,27,156,seed);
  drawRug(p,335,116,58,37,seed);drawRug(p,291,62,17,59,seed);
  drawRug(p,61,349,113,41,seed);
  drawRug(p,302,387,44,24,seed);
  // A narrow kitchen runner and domestic wall bases.
  drawRug(p,36,113,17,66,seed);drawRug(p,163,129,45,44,seed);
  // Two-plot garden: a small sandy landing, lawn trim and quiet stone route.
  const g=ZONES.find(z=>z.id==='garden')!;const gx=g.x*16,gy=g.y*16;
  p(['#86a15d','#88a063','#819b58'][(seed>>>2)%3],gx,gy,g.w*16,g.h*16);p('#c8ae6e',gx+7,gy+8,g.w*16-14,g.h*16-12);
  for(let y=gy+3;y<gy+g.h*16;y+=5)for(let x=gx+1;x<gx+g.w*16;x+=5){const n=hash(x,y,seed);if(n%3===0)p(['#7f9d57','#a7ad64','#d0b979'][n%3],x,y,3,2);}
  for(const [x,y]of [[389,286],[397,292],[391,355],[415,370],[438,371],[468,357],[476,299]]){p('#9e9d79',x,y,11,7);p('#c1bea0',x+1,y,9,5);p('#d2c9a8',x+2,y,6,1);}
  // Garden outer fence stays behind the actor/plots.
  p('#4d4930',gx+g.w*16,gy,5,g.h*16);p('#827044',gx+g.w*16+1,gy,2,g.h*16);
  for(let y=gy;y<gy+g.h*16;y+=14){p('#5f5634',gx+g.w*16-2,y,8,9);p('#a38950',gx+g.w*16,y+1,3,7);}
  // Baseboard rhythm and joints are deliberate, not random map collision.
  for(const [x,y]of [[32,32],[224,32],[272,32],[464,32],[32,272],[224,272]]){p('#3d3026',x-5,y-16,7,31);p('#855d3a',x-3,y-14,3,27);p('#b28750',x-3,y-13,1,25);}
  // The front door opens onto the same connected map: lawn, delivery post and a little road.
  p('#527146',0,440,WORLD_WIDTH,168);p('#83a659',27,448,458,146);p('#93b866',29,449,454,2);
  for(let y=451;y<594;y+=6)for(let x=30;x<484;x+=7){const n=hash(x,y,seed);if(n%4===0){p(n%2?'#70944e':'#a1ba6a',x,y,3,1);p('#739951',x+1,y-1,1,3);}}
  // Broad pale stepping stones make the walk from door to gate and mailbox readable.
  for(let y=443;y<593;y+=14){p('#91886b',318,y,24,10);p('#c2b68a',319,y,22,8);p('#ddd0a3',321,y,18,1);p('#ac9e77',319,y+7,22,1);}
  for(let x=342;x<413;x+=14){p('#91886b',x,521,12,9);p('#c7bb91',x+1,521,10,7);p('#dfd3a8',x+2,521,7,1);}
  // A clipped hedge beside the house and small flower clumps keep the lawn alive without new mechanics.
  for(const[x,y]of [[58,470],[109,549],[201,490],[275,564],[452,477],[466,558]]){p('#54783e',x-5,y+1,11,4);p('#6c944a',x-3,y-2,7,5);p('#b2c87b',x-1,y-4,3,2);p('#f4e7ba',x+3,y-5,2,2);p('#e4be5d',x+3,y-4,1,1);}
  p('#45633b',30,441,282,8);p('#6c8d4b',32,441,278,4);p('#a7b76a',34,441,274,1);p('#45633b',348,441,135,8);p('#6c8d4b',350,441,131,4);
  // Fence collision has a two-tile gate in the path. Side rails are outside the walkable lawn.
  const post=(x:number,y:number)=>{p('#423b2b',x,y,7,14);p('#8f7649',x+1,y+1,5,12);p('#c1a66c',x+1,y+1,4,2);p('#6d5939',x+5,y+3,1,10);};
  for(let y=452;y<593;y+=18){p('#544a32',20,y+3,9,3);p('#ae925c',21,y+3,7,1);post(22,y-2);p('#544a32',483,y+3,9,3);p('#ae925c',484,y+3,7,1);post(485,y-2);}
  for(const[a,b]of [[29,317],[350,486]]){p('#51452f',a,590,b-a,5);p('#ac8d57',a,590,b-a,2);p('#695739',a,599,b-a,3);for(let x=a;x<b;x+=16)post(x,585);}
  // Sidewalk and road remain scenery beyond the little gate, on the same pixel grid.
  p('#c7c2a1',0,607,WORLD_WIDTH,7);p('#e4d9b6',0,607,WORLD_WIDTH,1);p('#928e79',0,614,WORLD_WIDTH,2);p('#52616a',0,616,WORLD_WIDTH,24);
  for(let x=0;x<WORLD_WIDTH;x+=25){p('#b5b294',x,608,1,6);p('#ebdc94',x+4,633,13,2);}
  // Restore the clear doorstep after lawn/hedge paint; both floor tiles join the entrance.
  roomFloor(p,320,432,16,16,seed);p('#57442d',316,432,4,12);p('#ac8450',317,432,2,10);p('#57442d',336,432,4,12);p('#ac8450',337,432,2,10);
 });
}
