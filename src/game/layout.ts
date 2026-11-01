import type { TargetId } from '../domain/types';
export const TILE=16,WORLD_WIDTH=512,WORLD_HEIGHT=448;
export interface TilePoint {x:number;y:number}
export interface WorldPoint {x:number;y:number}
export interface Zone {id:string;label:string;x:number;y:number;w:number;h:number;outdoor?:boolean}
export const ZONES:Zone[]=[
 {id:'kitchen',label:'Kitchen',x:2,y:2,w:12,h:10},
 {id:'bedroom',label:'Bedroom',x:17,y:2,w:12,h:10},
 {id:'hall',label:'Hall',x:2,y:13,w:28,h:3},
 {id:'connector',label:'Hall',x:14,y:15,w:3,h:12},
 {id:'living',label:'Living room',x:2,y:17,w:12,h:9},
 {id:'wash',label:'Washroom',x:18,y:17,w:5,h:5},
 {id:'garden',label:'Garden',x:24,y:17,w:6,h:9,outdoor:true},
 {id:'entry',label:'Entrance',x:18,y:23,w:5,h:4},
];
export const DOORS:TilePoint[]=[{x:8,y:12},{x:22,y:12},{x:8,y:16},{x:20,y:16},{x:26,y:16},{x:17,y:24}];
export const TARGET_TILES:Record<TargetId,TilePoint>={
 store:{x:4,y:5},prep:{x:12,y:5},stove:{x:10,y:5},cutoff:{x:10,y:5},surface:{x:12,y:5},window:{x:8,y:5},
 bed:{x:21,y:6},cupboard:{x:26,y:5},body:{x:19,y:21},baseSeat:{x:5,y:21},chair:{x:10,y:21},chairA:{x:10,y:21},chairB:{x:10,y:24},
 plot1:{x:25,y:21},plot2:{x:28,y:21},gardenShelter:{x:26,y:19},gardenView:{x:26,y:24},pest:{x:25,y:22},mailbox:{x:20,y:24},hall:{x:16,y:14},
};
export const TARGET_LABELS:Record<TargetId,string>={store:'Pantry',prep:'Preparation counter',stove:'Stove',cutoff:'Stove',surface:'Kitchen counter',window:'Window',bed:'Bed',cupboard:'Supply cupboard',body:'Washroom',baseSeat:'Comfortable seat',chair:'Crafted chair',chairA:'Crafted chair',chairB:'Crafted chair',plot1:'Plot 1',plot2:'Plot 2',gardenShelter:'Garden shelter',gardenView:'Garden',pest:'Garden visitor',mailbox:'Delivery box',hall:'Hall'};
export const SOLIDS:[number,number,number,number][]=[
 [4,3,2,2],[7,3,2,2],[10,3,2,2],[12,3,2,2], [18,3,3,4],[26,3,2,2],
 [4,19,2,2],[10,20,1,1],[10,23,1,1],[20,18,2,2],[25,20,1,1],[28,20,1,1],[26,18,1,1],[21,24,1,1],
 [5,8,5,2],[6,3,1,2],[9,3,1,2],
];
export const tileToWorld=(p:TilePoint):WorldPoint=>({x:p.x*TILE+8,y:p.y*TILE+9});
export const targetPoint=(id:TargetId,chairAnchor=0):WorldPoint=>tileToWorld(id==='chair'?(chairAnchor?TARGET_TILES.chairB:TARGET_TILES.chairA):TARGET_TILES[id]);
export function isFloor(x:number,y:number):boolean {return ZONES.some(z=>x>=z.x&&y>=z.y&&x<z.x+z.w&&y<z.y+z.h)||DOORS.some(d=>d.x===x&&d.y===y);}
export function isWalkable(x:number,y:number):boolean {return isFloor(x,y)&&!SOLIDS.some(([a,b,w,h])=>x>=a&&y>=b&&x<a+w&&y<b+h);}

/** One fixed presentation path. No state/rules/energy are changed here. */
export function findRoute(from:WorldPoint,to:WorldPoint):WorldPoint[] {
 const start={x:Math.floor(from.x/TILE),y:Math.floor(from.y/TILE)},end={x:Math.floor(to.x/TILE),y:Math.floor(to.y/TILE)};
 const key=(p:TilePoint)=>p.y*32+p.x;
 const queue=[start],seen=new Set([key(start)]),parents=new Map<number,number>();
 let found=false;
 for(let i=0;i<queue.length;i++){
  const p=queue[i];if(p.x===end.x&&p.y===end.y){found=true;break;}
  for(const d of [{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1}]){
   const n={x:p.x+d.x,y:p.y+d.y};const k=key(n);if(n.x<0||n.y<0||n.x>=32||n.y>=28||seen.has(k)||!isWalkable(n.x,n.y))continue;seen.add(k);parents.set(k,key(p));queue.push(n);
  }
 }
 if(!found)return [to];
 const route:WorldPoint[]=[];let k=key(end);const a=key(start);
 while(k!==a){route.push(tileToWorld({x:k%32,y:Math.floor(k/32)}));const parent=parents.get(k);if(parent===undefined)break;k=parent;}
 route.reverse();if(route.length)route[route.length-1]=to;else route.push(to);return route;
}
