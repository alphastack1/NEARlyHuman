import type { Receipt } from '../domain/types';
import { isDeliveryCollection } from '../domain/day-plan';

/** Visible purposeful walking keeps one gait through a connected house. */
export const purposefulTravelMs=(routeLength:number):number=>routeLength<3?80:Math.max(250,routeLength/115*1000);
export const receiptImpactFraction=(receipt:Receipt):number=>receipt.role==='focus'?.72:.48;

/** Every visible trip uses the same gait; only unchosen empty time is condensed. */
export function receiptTiming(receipt:Receipt,routeLength:number,normalMs=2900):{travel:number;duration:number} {
 const travel=purposefulTravelMs(routeLength);
 const incident=!receipt.snapshot.alive||receipt.events.some(e=>['incident','weather','death'].includes(e.kind));
 const delivery=isDeliveryCollection(receipt);
 const focus=receipt.role==='focus';
 const work=focus?10500:delivery?2500:receipt.action==='H03'?3500:receipt.action==='T01'?(receipt.choice?1050:650):Math.max(1800,Math.min(2900,normalMs));
 return{travel,duration:travel+Math.max(work,incident?3000:0)};
}
