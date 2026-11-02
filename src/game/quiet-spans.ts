import type { Episode, GameState, Receipt } from '../domain/types';
import { isDeliveryCollection } from '../domain/day-plan';

const biologicalFacts=(state:GameState)=>JSON.stringify({day:state.day,level:state.level,alive:state.alive,deathCause:state.deathCause,needs:state.needs,inventory:state.inventory,conditions:state.conditions,plots:state.plots,house:state.house});

/** Only empty recorded time can be edited; recent-action memory is still retained. */
export function isUnchangedQuietReceipt(receipt:Receipt,episodes:readonly Episode[]=receipt.choice?.situation?.episodes||[]):boolean {
 const approach=receipt.decisionSnapshot||receipt.before;
 return receipt.action==='T01'&&receipt.success&&approach.alive&&receipt.snapshot.alive&&receipt.changes.length===0
  &&receipt.role==='interlude'&&!receipt.choice&&!isDeliveryCollection(receipt)
  &&receipt.events.every(event=>event.kind==='action'||event.kind==='quiet')
  &&receipt.snapshot.house.fire==='none'&&!receipt.snapshot.house.powerOut
  &&!episodes.some(episode=>!episode.resolved&&episode.kind!=='quiet')
  &&biologicalFacts(receipt.before)===biologicalFacts(receipt.snapshot)
  &&biologicalFacts(approach)===biologicalFacts(receipt.snapshot);
}

export interface QuietSpan {start:number;end:number;count:number}

/** The original receipts/indices remain untouched and individually seekable. */
export function quietSpanAt(receipts:readonly Receipt[],start:number):QuietSpan|undefined {
 const first=receipts[start];if(!first)return;
 let episodes:readonly Episode[]=[];
 for(let i=0;i<start;i++)if(receipts[i].choice?.situation)episodes=receipts[i].choice!.situation!.episodes;
 let end=start-1;
 for(let i=start;i<receipts.length;i++){
  const receipt=receipts[i];if(receipt.phase!==first.phase||receipt.target!==first.target)break;
  if(receipt.choice?.situation)episodes=receipt.choice.situation.episodes;
  if(!isUnchangedQuietReceipt(receipt,episodes))break;
  end=i;
 }
 return end-start>=2?{start,end,count:end-start+1}:undefined;
}
