import {ITEMS,Op,type State} from './types';
export const itemIndex=(id:string):number=>{const n=(ITEMS as readonly string[]).indexOf(id);if(n<0)throw Error('Unknown item.');return n;};
export const PLANTS=[
 {name:'',ticks:0,yields:0,repeat:0,output:-1},
 {name:'Daisy',ticks:3,yields:1,repeat:0,output:22},
 {name:'Marigold',ticks:3,yields:1,repeat:0,output:23},
 {name:'Lavender',ticks:6,yields:1,repeat:0,output:24},
 {name:'Rose',ticks:8,yields:1,repeat:0,output:25},
 {name:'Strawberry',ticks:3,yields:1,repeat:0,output:26},
 {name:'Blueberry',ticks:6,yields:1,repeat:0,output:27},
 {name:'Grape',ticks:8,yields:6,repeat:2,output:28},
 {name:'Apple',ticks:8,yields:6,repeat:2,output:29},
 {name:'Wood tree',ticks:6,yields:10,repeat:2,output:6},
] as const;
export const RECIPES=[{name:'Spoon',wood:3,output:30},{name:'Toy boat',wood:6,output:31},{name:'Birdhouse',wood:8,output:32},{name:'Large chest',wood:10,output:33}] as const;
export const WEIGHTS=[65,65,95,115,65,95,40,40,116,212,276,340] as const;
export const FRUIT_EFFECTS:Record<number,[number,number]>={26:[3000,1500],27:[4000,1000],28:[3500,2500],29:[6000,1000]};
export const FLOWER_MORALE=[1500,1500,2500,3500] as const;
export const MAIN_OPS=new Set([Op.Toast,Op.CookSteak,Op.Bowl,Op.Sandwich,Op.Repair,Op.Plant,Op.Harvest,Op.Craft,Op.RestoreSoil,Op.BuildChair,Op.BuildShelter,Op.Patch,Op.MoveChair,Op.Abandon,Op.CoverPlot,Op.DeepClean,Op.QuietMain]);
export const ACUTE_OPS=new Set([Op.Douse,Op.Shutdown,Op.BraceRain,Op.CoverRain]);
export const CERTIFICATE_OPS=new Set([Op.Quiet,Op.Pickup,Op.Breakfast,Op.Eat,Op.Drink,Op.Treat,Op.Wash,Op.Rest,Op.Leisure,Op.Coffee,Op.Douse,Op.Shutdown,Op.BraceRain,Op.CoverRain,Op.EnjoyFlower]);
export function topShipment(stock:readonly number[]):number[]{const out:number[]=[];const remaining=stock.slice();for(let i=0;i<4;i++){let at=-1;for(let k=22;k<34;k++)if(remaining[k]!>0&&(at<0||WEIGHTS[k-22]!>WEIGHTS[at-22]!))at=k;if(at<0)break;remaining[at]!--;out.push(at+1);}return out;}
/** Bounded views of already permitted shipments; none creates stock or a new turn. */
export function shipmentBaskets(stock:readonly number[]):{kind:'combined'|'produce'|'surplus';goods:number[]}[]{
 const baskets:{kind:'combined'|'produce'|'surplus';goods:number[]}[]=[
  {kind:'combined',goods:topShipment(stock)},
  {kind:'produce',goods:topShipment(stock.map((n,i)=>i>=22&&i<30?n:0))},
  {kind:'surplus',goods:topShipment(stock.map((n,i)=>i>=22&&i<34?Math.max(0,n-1):0))},
 ];
 const seen=new Set<string>();return baskets.filter(b=>{const key=b.goods.join(',');if(!b.goods.length||seen.has(key))return false;seen.add(key);return true;});
}
export function shipmentPoints(goods:readonly number[]):number{return goods.reduce((s,id)=>s+(id?WEIGHTS[id-23]||0:0),0);}
export function maxShipmentPoints(s:State):number{
 let best=shipmentPoints(topShipment(s.inventory));const harvested=s.inventory.slice();let valid=true;
 for(const p of s.plots)if(p.kind&&p.ticks===0){const id=PLANTS[p.kind]?.output;if(id===undefined||id<0||harvested[id]!>=0xffff_ffff){valid=false;break;}harvested[id]!++;}
 if(valid)best=Math.max(best,shipmentPoints(topShipment(harvested)));
 for(const r of RECIPES)if(s.inventory[6]!>=r.wood&&s.inventory[r.output]!<0xffff_ffff){const a=s.inventory.slice();a[r.output]!++;best=Math.max(best,shipmentPoints(topShipment(a)));}
 return best;
}
