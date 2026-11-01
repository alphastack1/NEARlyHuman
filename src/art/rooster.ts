import { BODY_CLASSIC, BEAK_ORANGE, HEADGEAR_GRIDS, BODY_COLOR_INDICES, HEADGEAR_COLOR_INDICES, PALETTE } from './rooster-data';

export type RoosterPose = 'idle' | 'breathe' | 'preen' | 'stretch' | 'perk' | 'doze' | 'peek' | 'walk-a' | 'walk-b' | 'blink' | 'sleep' | 'use' | 'eat' | 'treat' | 'garden' | 'repair' | 'hurt' | 'dead';
export interface RoosterTraits { body: number; wing: number; headgear: number; accent: number }
export const ROOSTER_FRAME = { width:32, height:40, padX:4, padY:12, footX:18, footY:35 } as const;

/** Cosmetic identity only. All simulation randomness belongs to the domain. */
export function roosterTraits(seed: string): RoosterTraits {
  if (seed === 'BOK' || seed === 'demo') return { body:14, wing:3, headgear:6, accent:9 };
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const pick = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return h >>> 0; };
  const bodyIndex = pick() % BODY_COLOR_INDICES.length;
  return { body:BODY_COLOR_INDICES[bodyIndex], wing:BODY_COLOR_INDICES[(bodyIndex+1+pick()%9)%10], headgear:pick()%HEADGEAR_GRIDS.length, accent:HEADGEAR_COLOR_INDICES[pick()%3] };
}

/** Port of the owner's procedural source with accessory-safe eye compositing. */
export function roosterGrid(seed:string, pose:RoosterPose='idle'): Uint8Array {
  const t = roosterTraits(seed);
  const grid = new Uint8Array(BODY_CLASSIC);
  for (let i=0;i<grid.length;i++) {
    if (grid[i]===7) grid[i]=t.body;
    else if(grid[i]===8) grid[i]=t.wing;
  }
  // Move only the original wing for work poses. Identity, silhouette, hat and face
  // stay source-derived; the arm reaches toward the actual tool/food location.
  if(['use','eat','treat','garden','repair','preen','stretch','perk'].includes(pose)){
    for(let y=14;y<19;y++)for(let x=9;x<18;x++)if(BODY_CLASSIC[y*24+x]===8)grid[y*24+x]=t.body;
    const wing=pose==='eat'||pose==='preen'?[[14,11],[15,10],[16,9],[16,10],[15,11]]:pose==='treat'?[[13,13],[14,12],[15,12],[15,13],[14,14]]:pose==='garden'?[[14,16],[15,17],[16,18],[17,18],[17,17]]:pose==='repair'||pose==='stretch'?[[13,12],[14,11],[15,10],[16,10],[16,11]]:pose==='perk'?[[14,14],[15,13],[16,12],[17,12],[17,13]]:[[14,14],[15,13],[16,13],[17,13],[17,14]];
    for(const[x,y]of wing)grid[y*24+x]=t.wing;
  }
  // Close the base eye before overlays, so shades/masks are never overwritten.
  if (pose==='blink'||pose==='sleep'||pose==='dead'||pose==='preen'||pose==='doze') grid[7*24+16]=11;
  const hat = HEADGEAR_GRIDS[t.headgear];
  for(let i=0;i<576;i++) if(hat[i]) grid[i]=hat[i]===5?t.accent:hat[i];
  for(let i=0;i<576;i++) if(BEAK_ORANGE[i]) grid[i]=BEAK_ORANGE[i];
  // A two-frame foot shuffle keeps the same body/anatomy and headgear.
  if(pose==='walk-a'||pose==='walk-b') {
    const dx=pose==='walk-a'?1:-1;
    for(let y=20;y<=22;y++) {
      const row=grid.slice(y*24,(y+1)*24);grid.fill(0,y*24,(y+1)*24);
      for(let x=0;x<24;x++) if(row[x]&&x+dx>=0&&x+dx<24) grid[y*24+x+dx]=row[x];
    }
  }
  return grid;
}

export function roosterCanvas(seed:string, pose:RoosterPose='idle'):HTMLCanvasElement {
  const c=document.createElement('canvas');c.width=ROOSTER_FRAME.width;c.height=ROOSTER_FRAME.height;
  const ctx=c.getContext('2d')!;ctx.imageSmoothingEnabled=false;
  const grid=roosterGrid(seed,pose);
  const bob=pose==='walk-a'?-1:pose==='walk-b'?0:pose==='sleep'||pose==='peek'?1:pose==='garden'?1:pose==='hurt'?1:0;
  // Attention and tiredness move the chest, not the foot anchor. Headgear moves
  // with its existing pixels rather than being repainted over the face.
  const chestLift=pose==='peek'?-2:pose==='breathe'||pose==='perk'?-1:pose==='doze'?1:0;
  for(let y=0;y<24;y++)for(let x=0;x<24;x++) { const v=grid[y*24+x];if(v){ctx.fillStyle=PALETTE[v];ctx.fillRect(x+4,y+12+bob+(y<18?chestLift:0),1,1);} }
  // Join the lifted chest to the planted lower body, including the two-pixel peek.
  if(chestLift<0)for(let row=30+bob+chestLift;row<30+bob;row++)for(let x=0;x<24;x++){const v=grid[18*24+x];if(v){ctx.fillStyle=PALETTE[v];ctx.fillRect(x+4,row,1,1);}}
  return c;
}

export function roosterSvg(seed:string,size=96):string {
  const grid=roosterGrid(seed);const rows:string[]=[];
  for(let y=0;y<24;y++)for(let x=0;x<24;x++){const v=grid[y*24+x];if(v)rows.push(`<rect x="${x+4}" y="${y+12}" width="1" height="1" fill="${PALETTE[v]}"/>`);}
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="${size}" height="${size*1.25}" shape-rendering="crispEdges">${rows.join('')}</svg>`;
}

export function roosterImageUrl(seed:string):string { return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(roosterSvg(seed))}`; }
