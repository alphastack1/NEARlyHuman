import type { Receipt } from '../domain/types';

/** Visible purposeful walking keeps one gait through a connected house. */
export const purposefulTravelMs=(routeLength:number):number=>routeLength<3?80:Math.max(250,routeLength/115*1000);

/** Presentation time only: receipts stay seekable; unchanged quiet spans may be edited. */
export function receiptTiming(receipt:Receipt,routeLength:number,normalMs=2900,consecutiveQuiet=false):{travel:number;duration:number;montage?:boolean} {
 const travel=routeLength<3?80:Math.min(1450,Math.max(250,routeLength*13));
 const incident=!receipt.snapshot.alive||receipt.events.some(e=>['incident','weather','death'].includes(e.kind));
 if(receipt.action==='T01'&&consecutiveQuiet&&!incident){
  if(routeLength>180)return{travel:880,duration:1530,montage:true};
  return{travel,duration:Math.max(1050,travel+450)};
 }
 const purposefulTravel=purposefulTravelMs(routeLength);
 return{travel:purposefulTravel,duration:Math.max(normalMs,purposefulTravel+1250,incident?3400:0)};
}
