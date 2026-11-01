import type { Receipt } from '../domain/types';

/** Presentation time only. Every receipt and boundary still plays exactly once. */
export function receiptTiming(receipt:Receipt,routeLength:number,normalMs=2900,consecutiveQuiet=false):{travel:number;duration:number;montage?:boolean} {
 const travel=routeLength<3?80:Math.min(1450,Math.max(250,routeLength*13));
 const incident=!receipt.snapshot.alive||receipt.events.some(e=>['incident','weather','death'].includes(e.kind));
 if(receipt.action==='T01'&&consecutiveQuiet&&!incident){
  if(routeLength>180)return{travel:1100,duration:1750,montage:true};
  return{travel,duration:Math.max(1050,travel+450)};
 }
 return{travel,duration:Math.max(normalMs,travel+900,incident?3400:0)};
}
