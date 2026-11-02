import { WORLD_HEIGHT, WORLD_WIDTH, type WorldPoint } from './layout';

/** Keeps the sleeping face below the fixed HUD even on a 305px game frame. */
export const BEDROOM_VIEW = {x:368,y:96} as const;
export const HOUSE_ROOMS = [
 { id:'kitchen',label:'Kitchen',x:136,y:88 },
 { id:'bedroom',label:'Bedroom',...BEDROOM_VIEW },
 { id:'living',label:'Living room',x:128,y:338 },
 { id:'wash',label:'Washroom',x:332,y:328 },
 { id:'garden',label:'Garden',x:432,y:336 },
] as const;
export type HouseRoom = typeof HOUSE_ROOMS[number]['id'];
export interface HouseView { exploring:boolean; room?:HouseRoom }

export function constrainHouseView(point:WorldPoint,zoom=1.1,viewportWidth=256,viewportHeight=182,insetTop=0,insetBottom=0,insetLeft=0,insetRight=0):WorldPoint {
 const halfWidth=Math.min(WORLD_WIDTH/2,viewportWidth/2/zoom),halfHeight=Math.min(WORLD_HEIGHT/2,viewportHeight/2/zoom);
 const top=halfHeight-Math.max(0,insetTop)/zoom,bottom=WORLD_HEIGHT-halfHeight+Math.max(0,insetBottom)/zoom;
 const left=halfWidth-Math.max(0,insetLeft)/zoom,right=WORLD_WIDTH-halfWidth+Math.max(0,insetRight)/zoom;
 return {x:Math.max(left,Math.min(right,point.x)),y:Math.max(top,Math.min(bottom,point.y))};
}
export function roomAtView(point:WorldPoint):HouseRoom {
 return HOUSE_ROOMS.reduce((closest,room)=>Math.hypot(room.x-point.x,room.y-point.y)<Math.hypot(closest.x-point.x,closest.y-point.y)?room:closest).id;
}
