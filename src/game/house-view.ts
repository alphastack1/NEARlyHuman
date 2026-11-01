import { WORLD_HEIGHT, WORLD_WIDTH, type WorldPoint } from './layout';

/** Keeps the sleeping face below the fixed HUD even on a 305px game frame. */
export const BEDROOM_VIEW = {x:368,y:96} as const;
export const HOUSE_ROOMS = [
 { id:'kitchen',label:'Kitchen',x:136,y:116 },
 { id:'bedroom',label:'Bedroom',...BEDROOM_VIEW },
 { id:'living',label:'Living room',x:128,y:338 },
 { id:'wash',label:'Washroom',x:332,y:328 },
 { id:'garden',label:'Garden',x:432,y:350 },
] as const;
export type HouseRoom = typeof HOUSE_ROOMS[number]['id'];
export interface HouseView { exploring:boolean; room?:HouseRoom }

export function constrainHouseView(point:WorldPoint,zoom=1.1):WorldPoint {
 const halfWidth=128/zoom,halfHeight=91/zoom;
 return {x:Math.max(halfWidth,Math.min(WORLD_WIDTH-halfWidth,point.x)),y:Math.max(halfHeight,Math.min(WORLD_HEIGHT-halfHeight,point.y))};
}
export function roomAtView(point:WorldPoint):HouseRoom {
 return HOUSE_ROOMS.reduce((closest,room)=>Math.hypot(room.x-point.x,room.y-point.y)<Math.hypot(closest.x-point.x,closest.y-point.y)?room:closest).id;
}
