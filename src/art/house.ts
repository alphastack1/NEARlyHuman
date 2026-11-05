import type { Paint } from './pixels';
function hash(x:number,y:number,seed:number):number {let h=Math.imul(x+17,374761393)^Math.imul(y+31,668265263)^seed;h=Math.imul(h^(h>>>13),1274126177);return(h^(h>>>16))>>>0;}

/** Cosmetic birth identity. It never selects rules, rooms, collisions or outcomes. */
export function homeArtSeed(value:string):number {let h=2166136261;for(const c of value)h=Math.imul(h^c.charCodeAt(0),16777619);return(h^(h>>>16))>>>0;}

export function drawRug(p:Paint,x:number,y:number,w:number,h:number,seed=7):void{
 const tones=[['#3c6343','#bbaf70','#5c8d53','#719556','#426d46'],['#3b5f46','#b9ad71','#587f58','#789867','#446849'],['#405f4a','#c5b381','#6c8f5d','#81a06a','#4c7350']][(seed>>>4)%3];
 p(tones[0],x,y,w,h);p(tones[1],x+1,y+1,w-2,h-2);p(tones[2],x+3,y+3,w-6,h-6);p(tones[3],x+4,y+4,w-8,1);p(tones[4],x+4,y+h-5,w-8,1);
 for(let a=x+5;a<x+w-5;a+=4)for(let b=y+6;b<y+h-5;b+=4){const n=hash(a,b,seed);if(n%3===0)p(n%2?'#69975a':'#52824c',a,b,2,2);}
 for(let a=x+3;a<x+w-3;a+=5){p('#d1bd78',a,y+1,2,1);p('#d1bd78',a,y+h-2,2,1);}
 if(seed%3===1)for(let b=y+7;b<y+h-6;b+=6)p(tones[3],x+5,b,w-10,1);
 if(seed%3===2)for(let a=x+9;a<x+w-8;a+=12)for(let b=y+9;b<y+h-7;b+=10){p(tones[3],a,b,3,1);p(tones[3],a+1,b-1,1,3);}
}
