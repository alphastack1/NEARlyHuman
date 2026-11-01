import type { ItemId } from '../domain/types';

export const COLORS={ outline:'#30302b', ink:'#213441', beam:'#6b4830', beamLight:'#9f7147', wood:'#a77b48', woodLight:'#ca985d', woodDark:'#805731', cream:'#eee0b9', creamShade:'#d4c699', floor:'#d9ab70', floorLight:'#e6bb80', floorDark:'#bd8950', moss:'#5e8e55', mossLight:'#82a765', mossDark:'#3c6949', gold:'#cbb976', blue:'#397ac1', blueLight:'#71a8de', blueDark:'#234f8b', metal:'#abb4ae', metalLight:'#d5dad0', metalDark:'#6c7878', red:'#d74b4b', yellow:'#ffe161' } as const;
export interface PixelRect { x:number;y:number;w:number;h:number;color:string }
export type Paint=(color:string,x:number,y:number,w:number,h:number)=>void;
export function canvasArt(width:number,height:number,draw:(p:Paint)=>void):HTMLCanvasElement {
  const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d')!;ctx.imageSmoothingEnabled=false;
  draw((color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));});return c;
}
export function outline(p:Paint,x:number,y:number,w:number,h:number,fill:string,border:string=COLORS.outline):void {p(border,x,y,w,h);p(fill,x+1,y+1,w-2,h-2);}
export function woodPanel(p:Paint,x:number,y:number,w:number,h:number):void {outline(p,x,y,w,h,COLORS.wood);p(COLORS.woodLight,x+1,y+1,w-2,2);p(COLORS.woodDark,x+2,y+h-3,w-4,1);p(COLORS.woodDark,x+2,y+4,1,h-8);p(COLORS.woodLight,x+w-3,y+4,1,h-8);}
export function plantArt(p:Paint,x=0,y=0):void {
  outline(p,x+7,y+20,12,9,'#ab7244');p('#d6a16b',x+7,y+20,12,2);p('#765336',x+9,y+27,8,2);p('#856844',x+12,y+10,2,12);
  const leaves:[[number,number,number,number],...number[][]]=[[3,12,9,7],[12,6,9,8],[14,12,9,7],[5,5,9,7],[9,0,8,8],[0,9,9,6]];
  for(const [a,b,w,h]of leaves){p(COLORS.mossDark,x+a,y+b,w,h);p(COLORS.moss,x+a+1,y+b+1,w-2,h-2);p(COLORS.mossLight,x+a+2,y+b+1,Math.max(2,w-5),2);}
}
export function drawItem(p:Paint,item:ItemId,x=0,y=0):void {
  const r:Paint=(c,a,b,w,h)=>p(c,x+a,y+b,w,h);const o=COLORS.outline;
  if(item==='water') {r(o,5,0,6,3);r('#2159a6',6,0,4,3);r(o,4,3,8,12);r('#229de7',5,3,6,11);r('#53c7f5',5,4,5,7);r('#b9efff',6,5,1,7);r('#287ccc',5,10,6,3);}
  if(item==='milk') {r(o,3,1,10,14);r('#f1f4df',4,3,8,11);r('#d5e5e5',4,1,7,4);r('#70b3df',4,8,8,5);r('#e5f3f0',6,6,4,5);r('#4f9fcf',7,6,2,4);r('#f8fbec',4,3,1,10);}
  if(item==='bread') {r(o,3,3,10,10);r(o,1,6,14,5);r('#af713b',2,6,12,5);r('#eab66b',3,4,10,8);r('#f6ca7c',4,4,8,2);r('#bb803f',6,5,2,3);r('#bb803f',10,6,2,3);r('#d59850',3,10,9,2);}
  if(item==='steak') {r(o,5,2,8,11);r(o,2,5,12,8);r('#ebd5bb',4,3,8,10);r('#e7d9ba',2,6,11,6);r('#c84945',5,4,6,8);r('#ba343a',3,7,8,4);r('#ef7761',5,7,2,2);r('#f3dbc2',9,5,2,3);r('#9b3639',9,7,1,1);}
  if(item==='medicine') {r(o,5,1,6,4);r('#dd3e42',6,2,4,3);r(o,1,5,14,9);r('#c9343b',2,6,12,7);r('#ef5753',2,6,12,2);r('#fff2de',7,7,2,5);r('#fff2de',5,9,6,2);}
  if(item==='coffee') {r(o,4,0,8,3);r('#6d472f',4,0,8,2);r(o,3,3,10,12);r('#ac784d',4,4,8,10);r('#dab784',5,7,6,5);r('#5e3d2a',7,8,2,3);r('#e4c696',5,5,2,1);}
  if(item==='wood') {for(const [a,b]of [[1,3],[3,7],[0,10]]){r(o,a,b,13,4);r('#bd894e',a+1,b+1,11,2);r('#e0af68',a+2,b+1,7,1);r('#8d6037',a+9,b+2,2,1);}}
  if(item==='toolkit') {r(o,3,2,7,4);r('#b5c1bd',3,2,7,3);r('#e0e7d6',4,2,5,1);for(let i=0;i<7;i++)r('#aa7649',8-i,5+i,2,2);r(o,11,8,3,1);r('#e3e9df',11,8,3,2);r('#9faeac',12,10,1,5);r('#e3e9df',8,11,3,1);r('#9faeac',9,12,1,3);}
  if(item==='umbrella') {r(o,4,2,8,2);r(o,2,4,12,4);r('#378ed4',3,4,10,4);r('#71bde9',5,3,5,3);r('#d7f1eb',7,3,1,4);r('#476969',8,8,1,6);r('#c48c4b',6,14,3,2);r('#c48c4b',5,13,2,2);}
  if(item==='rose_seeds'||item==='apple_seeds') {r(o,3,1,10,14);r('#dec395',4,2,8,12);r('#efdfb6',5,5,6,7);r('#b38b59',4,3,8,2);r(item==='rose_seeds'?'#d74783':'#c84e3e',6,6,4,4);r('#65964e',8,5,2,1);r('#845e3b',6,11,1,1);r('#845e3b',9,11,1,1);}
  if(item==='matches') {r(o,2,3,10,11);r('#cf4c3d',3,4,8,9);r('#edd6ab',3,6,8,5);r('#df7d37',6,7,2,3);r('#a56c3b',12,4,1,9);r('#ec6e3f',12,3,2,2);r('#e9bc73',14,6,1,8);r('#e76343',14,5,1,2);}
  if(item==='soap') {r(o,2,5,12,7);r('#ddd3b9',3,6,10,5);r('#f6efd9',2,5,11,5);r('#fff8e7',4,5,7,2);r('#e6dec5',4,9,9,2);}
  if(item==='bandage') {r(o,5,2,6,12);r('#e4e8dc',4,4,8,8);r('#f6f6e8',5,3,6,10);r('#d84b4b',7,5,2,6);r('#d84b4b',5,7,6,2);r('#fffdf0',5,3,2,2);}
  if(item==='compost') {r(o,3,3,10,12);r('#a57540',4,4,8,10);r('#c49458',4,5,8,8);r('#d7a264',5,6,2,5);r('#7a562e',4,3,8,2);r('#508548',7,7,2,6);r('#679e51',5,7,3,3);r('#7caf57',8,6,3,3);}
}
export function itemSvg(item:ItemId,size=32):string {
  const rects:PixelRect[]=[];drawItem((color,x,y,w,h)=>rects.push({color,x,y,w,h}),item);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges">${rects.map(r=>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.color}"/>`).join('')}</svg>`;
}
export function itemImageUrl(item:ItemId):string { return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(itemSvg(item))}`; }
