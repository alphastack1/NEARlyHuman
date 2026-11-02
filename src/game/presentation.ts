import type { Receipt } from '../domain/types';
import { isDeliveryCollection } from '../domain/day-plan';

/** Visible purposeful walking keeps one gait through a connected house. */
export const purposefulTravelMs=(routeLength:number):number=>routeLength<3?80:Math.max(250,routeLength/115*1000);
export const receiptImpactFraction=(receipt:Receipt):number=>receipt.role==='focus'?.72:.48;

export interface ReceiptTimingContext { continuingSeat?:boolean }

/** Empty local time stays perceptible without accumulating another full routine. */
export const quietSpanWorkMs=(count:number):number=>Math.min(1350,1000+Math.max(0,count-3)*70);

/** Every visible trip uses the same gait; only unchosen empty time is condensed. */
export function receiptTiming(receipt:Receipt,routeLength:number,normalMs=2900,context:ReceiptTimingContext={}):{travel:number;duration:number} {
 const travel=purposefulTravelMs(routeLength);
 const incident=!receipt.snapshot.alive||receipt.events.some(e=>['incident','weather','death'].includes(e.kind));
 const delivery=isDeliveryCollection(receipt);
 const focus=receipt.role==='focus';
 const continuingSeat=context.continuingSeat&&receipt.role!=='interlude'&&(receipt.action==='H04'&&receipt.variant!=='garden'||receipt.action==='T01'&&receipt.target==='baseSeat'&&receipt.variant==='idle');
 const work=focus?10500:delivery?2500:receipt.action==='H03'?3500:continuingSeat?(receipt.action==='H04'?1100:850):receipt.action==='T01'?(receipt.choice?1050:650):Math.max(1800,Math.min(2900,normalMs));
 return{travel,duration:travel+Math.max(work,incident?3000:0)};
}
