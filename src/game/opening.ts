/** Presentation only. This clock never advances a biological day or its RNG. */
export const OPENING_ASSEMBLY_MS=900;
export const OPENING_EXIT_MS=420;
export const openingEase=(t:number)=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3);
export function openingTileTime(x:number,y:number):number {
 return Math.min(470,Math.abs(x-128)*.82+Math.abs(y-108)*.6)+((x/16+y/16)%3)*24;
}
export function openingPropTime(x:number,y:number):number {
 return 150+Math.min(340,Math.abs(x-128)*.5+Math.abs(y-110)*.45);
}
