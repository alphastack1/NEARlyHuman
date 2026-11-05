import { roosterSvg } from '../../src/art/rooster';
import { hash32 } from '../../src/domain/state';
import type { EvmPublicLife } from './views';
import { portraitPlant } from './portrait-plants';
import { portraitWallMaterial } from './portrait-materials';
import { portraitCornerFoliage } from './portrait-foliage';

const xml = (s: string) => s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));
const rect = (x: number, y: number, w: number, h: number, color: string, opacity?: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"${opacity === undefined ? '' : ` opacity="${opacity}"`}/>`;
const path = (d: string, color: string, opacity?: number) => `<path d="${d}" fill="${color}"${opacity === undefined ? '' : ` opacity="${opacity}"`}/>`;

/** Architectural colors are cosmetic identity, never a forecast or a game event. */
const WORLDS = [
  { sky: ['#77c4c3', '#ade0cf', '#f5e9b4'], hill: '#448970', far: '#8bba91', grass: '#5a984e', light: '#b5d77c', deep: '#285b42', wall: '#e3b877', plaster: '#ffe4af', roof: '#286d6e', roofHi: '#55998e', trim: '#694136', wood: '#c58b51', glow: '#ffe6a2' },
  { sky: ['#8e88bd', '#c1aad4', '#f2cbbb'], hill: '#566d8c', far: '#a798bc', grass: '#54885b', light: '#add482', deep: '#285e4a', wall: '#e0b38d', plaster: '#ffe1b3', roof: '#654c8a', roofHi: '#9b7db6', trim: '#653e47', wood: '#c5845c', glow: '#ffe6a2' },
  { sky: ['#72b9d3', '#b1d9db', '#f8e7b6'], hill: '#408a83', far: '#86b3a0', grass: '#4d9259', light: '#add57c', deep: '#205a49', wall: '#e3bb83', plaster: '#ffe8bc', roof: '#ac513f', roofHi: '#dd8960', trim: '#713c31', wood: '#ca9258', glow: '#ffecad' },
  { sky: ['#d39e99', '#efc39e', '#ffe3a6'], hill: '#698969', far: '#adb88d', grass: '#6c9c51', light: '#c7dc83', deep: '#38613d', wall: '#ddb875', plaster: '#ffe4ac', roof: '#365e83', roofHi: '#6e90aa', trim: '#674034', wood: '#c88b50', glow: '#ffe9a1' },
  { sky: ['#75c0b5', '#b3ddbd', '#f5e8aa'], hill: '#3e8674', far: '#84b391', grass: '#599751', light: '#bfdc79', deep: '#255e42', wall: '#deb789', plaster: '#ffe6b9', roof: '#945258', roofHi: '#c88179', trim: '#68392f', wood: '#c47e47', glow: '#ffeda9' },
  { sky: ['#879fcb', '#b6cce0', '#f6deb7'], hill: '#557994', far: '#91aebb', grass: '#5b9465', light: '#b6d28c', deep: '#2f5d4e', wall: '#d8b57e', plaster: '#ffe6b7', roof: '#2d6d8a', roofHi: '#6fa4b3', trim: '#634036', wood: '#c58b58', glow: '#ffe9a1' },
] as const;
type World = typeof WORLDS[number];

function landscape(p: World, salt: number): string {
  let out = rect(0, 0, 160, 160, p.sky[0]) + rect(0, 24, 160, 29, p.sky[1]) + rect(0, 53, 160, 37, p.sky[2]);
  const sun = 128 + salt % 13;
  out += path(`M${sun} 10h8v2h3v8h-3v2h-8v-2h-3v-8h3z`, '#fff1c2', .84);
  out += path('M111 29h14v-2h11v2h9v3h-34zM148 39h12v4h-22v-2h10z', '#f8ead0', .75);
  out += path('M95 61h6v-5h7v-4h7v-3h9v5h7v4h9v-5h8v-3h12v35H95z', p.far);
  out += path('M95 78h9v-7h10v-4h13v4h7v-8h9v5h9v4h8v36H95z', p.hill);
  out += path('M104 86h12v-4h12v3h15v-6h17v81H94V99h10z', p.grass);
  for (let i = 0; i < 26; i++) {
    const h = hash32(`${salt}:hedge:${i}`), x = 102 + h % 57, y = 74 + (h >>> 9) % 20;
    out += rect(x, y, 2 + h % 4, 1 + (h >>> 8) % 3, i % 3 ? p.light : p.deep, .45);
  }
  out += rect(108, 80, 52, 2, '#ceb78d') + rect(108, 87, 52, 2, '#ae9676');
  for (let x = 110; x < 160; x += 14) out += path(`M${x} 77h3v18h-3zM${x} 75h2v2h-2z`, '#e1c99a');
  return out;
}

/** A cropped wild canopy adds near/far depth; it is not a planted game tree. */
function canopy(p: World, salt: number): string {
  let out = path('M159 30h-4v9h-5v7h-6v3h-8v3h-5v2h11v-3h7v-4h6v-7h5z',p.trim);
  const clusters = [[160,34,15],[152,43,12],[157,56,13],[142,52,10]];
  for (let i=0;i<clusters.length;i++) {
    const [x,y,w]=clusters[i]!, dx=(salt >>> (i*3))%3-1;
    out += path(`M${x-w+dx} ${y-4}h${w+2}v3h4v8h-4v4h-${w+4}v-3h-3v-8h3z`,p.deep);
    out += path(`M${x-w+dx+2} ${y-5}h${w-1}v3h4v5h-3v3h-${w+1}v-3h-2v-5h2z`,p.grass);
    out += path(`M${x-w+dx+4} ${y-5}h5v2h-3v2h-4v-2h2zM${x-2} ${y+1}h4v2h-4z`,p.light);
    out += rect(x-w+dx+5,y+5,3,2,p.deep,.7);
  }
  return out;
}

/** Three permanent roof/threshold silhouettes, without gameplay functionality. */
const architecture = (salt: number) => (salt >>> 16) % 3;
function roof(p: World, salt: number): string {
  const family = architecture(salt);
  const silhouette = family === 0
    ? 'M0 0h83v4h9v5h9v5h9v5h8v6H0z'
    : family === 1
      ? 'M0 0h78v4h8v5h8v5h8v5h9v3H0z'
      : 'M0 0h89v4h8v5h8v5h6v4H0z';
  let tiles = '';
  for (let row=0;row<5;row++) for (let col=0;col<10;col++) {
    const x=col*13-(row%2)*6, y=row*6;
    tiles += path(`M${x} ${y}h11v2h-2v2h-8z`,p.roofHi,.58+(hash32(`${salt}:${row}:${col}`)%29)/100);
    tiles += rect(x+10,y+2,1,3,p.trim,.65);
    if(family===0) tiles += rect(x+2,y+1,2,3,p.roofHi,.75);
  }
  let out = `<defs><clipPath id="roof-profile"><path d="${silhouette}"/></clipPath></defs>${path(silhouette,p.roof)}<g clip-path="url(#roof-profile)">${tiles}</g>`;
  if(family===0) {
    // A deep tiled eave projects beyond the wall, with a lit lip/dark underside.
    out += path('M0 23h118v2h-2v4H0z',p.trim);
    out += rect(0,22,116,2,'#dfb578') + rect(0,23,114,1,'#f6d397');
    out += path('M8 29h5v3h4v3h-4v-2H8zM47 29h5v4h-2v-2h-3zM95 29h6v5h-3v-2h-3z','#533e32');
  } else if(family===1) {
    out += rect(0,20,110,4,p.trim) + rect(0,20,106,1,'#dcb77e');
    // A little pitched entrance hood changes the main facade's silhouette.
    out += path('M2 37h5v-4h5v-4h5v-4h7v4h5v4h5v4h6v5H2z',p.trim);
    out += path('M3 36h5v-4h5v-4h5v-4h5v4h5v4h5v4h6v3H3z',p.roof);
    out += path('M4 35h5v-4h5v-4h5v-3h3v4h-6v4h-5v4H4z',p.roofHi);
    out += path('M4 39h35v2H4zM6 41h3v5H6zM33 41h3v5h-3z','#c18c58');
    out += rect(10,41,22,3,p.trim,.35);
  } else {
    // A short heavy stone-cottage roof, with exposed golden rafter ends.
    out += rect(0,17,112,4,p.trim) + rect(0,17,109,1,'#e9c48b');
    for(let x=5;x<108;x+=14) out += path(`M${x} 21h4v5h-2v-2h-2z`,'#b38557');
  }
  return out;
}

function threshold(p: World, salt: number): string {
  const family=architecture(salt);
  if(family===2) return path('M0 102h99v3h4v3h4v6H0z','#836343') + path('M0 102h99v3h4v2H0z','#f0d298') + rect(0,103,96,1,'#ffe7ae') + path('M0 107h103v5H0z','#a88355') + rect(2,107,98,1,'#c69f69') + path('M0 112h107v3h-2v2H0z','#e9c78b') + rect(0,116,103,3,p.trim,.3) + path('M29 108h1v3h-1zM69 108h1v3h-1zM23 113h1v2h-1zM82 113h1v2h-1z','#785f43');
  if(family===0) return path('M0 105h98v3h3v3H0z','#9e6f46') + rect(0,105,98,2,'#efca88') + rect(1,105,95,1,'#ffe3a6') + rect(0,111,98,3,p.trim,.18);
  return path('M0 105h99v3H0z','#9d6b43') + rect(0,104,97,2,'#dab077') + path('M8 106h22v1H8zM41 106h19v1H41zM73 106h18v1H73z','#f0cf95') + rect(0,108,98,3,p.trim,.24);
}

function cottage(p: World, salt: number, s: EvmPublicLife['state']): string {
  let out = path('M0 18h102v4h5v72h-4v14H0z', p.trim);
  out += path('M0 17h96v4h7v70h-5v16H0z', p.wall);
  out += path('M7 23h81v64H7zM88 27h10v47H88z', p.plaster);
  out += portraitWallMaterial(salt,p);
  // A coherent dark underside makes the eave a projecting volume.
  out += path('M8 23h88v8H89v3H76v-2H56v2H35v-2H8z',p.trim,.28);
  out += rect(92,28,4,63,p.trim,.16);
  out += path('M96 33h-7v13h-7v13h-7v12h-7v13h-7v10h35z',p.glow,.16);
  for (let i = 0; i < 32; i++) {
    const h = hash32(`${salt}:plaster:${i}`), x = h % 96, y = 24 + (h >>> 8) % 61;
    if (x > 29 && x < 86 && y > 43) continue;
    out += rect(x, y, 1 + (h >>> 16) % 4, 1, i % 3 ? '#c7ac83' : '#f8e7be', .5);
  }
  out += roof(p,salt);
  out += rect(4, 22, 4, 76, p.wood) + rect(96, 22, 5, 74, p.trim);
  out += rect(6, 25, 1, 68, '#e8c78f') + rect(99, 25, 1, 65, p.wood);
  out += rect(10, 40, 24, 53, p.trim) + rect(13, 43, 18, 49, '#4d5147') + rect(15, 44, 3, 46, '#766751');
  out += path('M19 46h10v44H19z', '#625e49') + rect(27, 61, 2, 2, '#dfb777');
  out += salt%2 ? rect(20,47,7,17,'#777057') + rect(20,68,7,18,'#777057') : rect(22,46,1,42,'#898064') + rect(26,46,1,42,'#454b40');
  out += rect(10, 91, 26, 3, '#cfb388') + rect(9, 94, 29, 3, '#967958');
  const broken = !!(s.house.damage & 2);
  out += rect(65, 26, 26, 29, p.trim) + rect(68, 29, 20, 23, '#5c858b');
  out += rect(68, 29, 20, 8, p.sky[1]) + path('M68 40h4v-3h5v3h4v-4h7v16H68z', p.hill);
  out += path('M68 29h20v2H70v21h-2z','#354f52',.65);
  const curtain = ['#ebd6b3','#d5ad8f','#b6c5b1'][salt%3]!;
  out += path('M69 30h5v2h-2v16h-3zM83 30h4v18h-2V33h-2z', curtain);
  out += rect(77, 29, 2, 23, '#d0ba92') + rect(68, 40, 20, 2, '#d0ba92') + rect(63, 54, 30, 3, p.wood) + rect(64, 54, 27, 1, '#e2be89');
  out += path('M65 57h28v2h-4v2H69v-2h-4z',p.trim,.22);
  if (broken) out += path('M81 30h2v5h-2v3h-2v5h2v4h-2v-3h-2v-7h2v-3h2z', '#293f43');
  if (s.house.windowPatch) out += path('M68 35h20v3H68zM68 46h20v3H68z', '#ae815c');
  if (s.house.windowBrace) out += path('M69 30h3v4h3v4h3v4h3v4h3v5h-3v-4h-3v-4h-3v-4h-3v-4h-3z', '#b59265');
  out += path('M44 25h3v5h5v2H42v-2h2zM44 33h7v9h-7z', p.trim);
  out += rect(45, 34, 5, 6, s.house.powerOut ? '#797e68' : p.glow) + rect(46, 35, 2, 4, s.house.powerOut ? '#a4aa8c' : '#fff1c9');
  out += path('M0 94h98v15H0z', '#8e8c77') + rect(0, 95, 97, 2, '#b6af8c');
  for (let row = 0; row < 2; row++) for (let col = 0; col < 8; col++) out += rect(col * 14 - (row % 2) * 7, 99 + row * 6, 12, 4, ['#a19c80', '#b4aa86', '#858974'][(row + col + salt) % 3]!);
  if(architecture(salt)===2) for(let y=30;y<94;y+=10) out += path(`M93 ${y}h9v5h-2v4h-7z`,'#c0aa82') + rect(94,y,7,1,'#edcf99');
  return out;
}

function foreground(p: World, salt: number): string {
  let out = path('M0 107h93v-9h10v8h9v13h-8v41H0z', '#846744');
  out += path('M0 109h92v-8h8v11h10v6h-9v42H0z', '#d0a464');
  const stones = [[-4,110,30,15],[28,109,29,15],[59,108,29,17],[3,127,27,16],[32,127,35,15],[69,127,28,14],[-5,145,25,15],[22,145,34,15],[59,144,35,16]];
  for (let i = 0; i < stones.length; i++) {
    const [x,y,w,h] = stones[i]!;
    out += path(`M${x+2} ${y}h${w-4}v2h2v${h-4}h-2v2H${x+2}v-2h-2v-${h-4}h2z`, ['#f1d28e','#e8c680','#dcb976'][i % 3]!);
    out += rect(x+4,y+2,w-9,1,'#ffe4a6',.8) + rect(x+w-4,y+4,1,h-7,'#b88f55',.65);
    if (i % 2 === 0) out += path(`M${x+7} ${y+h-4}h4v-1h4v1h3v1H${x+7}z`, '#b7a67a',.65);
  }
  out += path('M99 111h5v9h-4v9h-3v31H92v-16h3v-20h4z', p.deep, .68);
  out += path('M0 109h34v3h-5v3h-7v2h-8v3H0zM95 112h5v7h-6v5h-5v6h-6v5h-5v-5h4v-7h6v-6h7z',p.trim,.17);
  out += path('M38 128h15v-2h16v-2h14v4H71v3H55v2H38z', '#fff0bf',.2);
  for (let i = 0; i < 77; i++) {
    const h = hash32(`${salt}:ground:${i}`), x = 104 + h % 56, y = 94 + (h >>> 9) % 64;
    out += rect(x,y,1 + (h >>> 18) % 3,1,i % 3 ? p.light : p.deep,.7);
    if (i % 8 === 0) out += rect(x+1,y-2,1,2,p.deep,.7);
  }
  out += path('M0 156h14v-2h9v3h15v-2h8v3h20v2H0zM97 155h8v-3h7v3h9v-2h10v4h12v-3h8v3h9v3H97z', p.deep);
  out += path('M4 155h8v1H4zM101 153h5v1h-5zM130 155h7v1h-7zM149 153h5v1h-5z', p.light);
  return out;
}

/** Close, unharvestable wild foliage frames the courtyard, outside the plots. */
function wildFrame(p: World, salt: number): string {
  let out = '';
  // Climbing ivy belongs to the architecture, not to a fifth game bed.
  out += path('M1 23h2v31h2v19h3v15H6V75H3V56H1z',p.deep);
  for(let i=0;i<11;i++) {
    const y=25+i*5, x=i%2?4:0, light=i%3? p.grass:p.light;
    out += path(`M${x} ${y}h4v-2h4v5H${x+5}v2H${x}z`,p.deep);
    out += path(`M${x} ${y-1}h3v-2h4v3H${x+4}v2H${x}z`,light);
    out += rect(x+2,y-1,2,1,p.light);
  }
  // Broad leaves are deliberately much larger in this nearest depth band.
  return out + portraitCornerFoliage(p,salt);
}

function workshop(p: World, s: EvmPublicLife['state']): string {
  let out = path('M0 74h26v4H0zM2 78h3v27H2zM21 78h3v25h-3zM4 96h18v3H4z', p.trim) + rect(0,73,26,2,p.wood) + rect(1,73,23,1,'#e1ba82');
  const stock = s.inventory;
  if (stock[6]) for (let n = 0; n < Math.min(4, stock[6]); n++) out += path(`M${5+n%2*8} ${92-Math.floor(n/2)*4}h7v3H${5+n%2*8}z`, '#a17a51') + rect(6+n%2*8,92-Math.floor(n/2)*4,2,2,'#dbc18b');
  if (stock[7]) out += rect(15,67,8,6,'#756d66') + rect(17,65,4,2,'#5a514b') + rect(18,68,2,3,'#c9b98d');
  if (stock[30]) out += path('M3 68h3v3H3zM4 71h1v3H4z', '#e9d4a1');
  if (stock[31]) out += path('M7 69h12l-3 3H10z', '#7e9c9e') + path('M13 61v8h6z', '#e8dabc') + rect(12,60,1,9,'#815b42');
  if (stock[32]) out += path('M3 61h10v10H3zM1 61l7-6 7 6z', '#b67953') + rect(7,63,3,3,'#3f514e') + rect(2,60,12,1,'#dfb37a');
  if (stock[33]) out += rect(1,67,18,6,'#946c48') + rect(2,66,16,2,'#c79964') + rect(8,67,2,6,'#6b5a45') + rect(8,69,2,2,'#e0be7e');
  out += path('M8 81h13v12H8zM9 92h2v3H9zM18 92h2v3h-2z', '#586562') + rect(9,81,11,2,'#8b9686') + rect(11,85,7,5,'#344a48');
  if (s.house.damage & 1) out += path('M15 82h2v3h-2v3h-2v3h-1v-4h2z','#d3bc94');
  if (s.house.stovePatch) out += rect(10,85,9,2,'#b78e60');
  if (s.house.fire) out += path('M12 88h2v-5h2v3h2v5h-6z','#e0a453') + rect(14,87,2,3,'#f9d878');
  if (s.house.chairLife) {
    const x = s.house.chairAnchor ? 80 : 27;
    out += path(`M${x} 87h3v19h-3zM${x+3} 89h8v2h-8zM${x+3} 96h9v3h-9zM${x+10} 99h2v8h-2zM${x+3} 99h2v8h-2z`, p.trim);
    out += rect(x+3,96,8,1,p.wood);
    if (s.house.damage & 4) out += rect(x+10,103,2,3,p.wall);
    if (s.house.chairBrace) out += path(`M${x+3} 102h8v2h-8z`,p.wood);
  }
  if (s.house.mess) out += path('M8 108h4v1H8zM17 111h5v1h-5zM29 107h3v1h-3z', '#766d50');
  if (s.house.mess > 1) out += path('M37 118h6v2h-6zM14 121h3v1h-3zM31 125h4v1h-4z','#7c7256');
  return out;
}

function garden(s: EvmPublicLife['state'], salt: number): string {
  const places = [[116,107],[145,109],[113,140],[144,143]];
  let out = '';
  for (let i = 0; i < 4; i++) {
    const p = s.plots[i]!, [x,y] = places[i]!;
    out += `<g data-plot-index="${i}">`;
    out += path(`M${x-12} ${y-4}h24v3h2v6h-2v2h-24v-2h-2v-6h2z`, '#65563e');
    out += rect(x-12,y-4,24,2,'#c49c68') + rect(x-12,y-2,24,6,p.soilBlocked ? '#817a60' : p.moisture ? '#6f6246' : '#9a8056');
    out += rect(x-10,y+5,20,1,'#b58d5c') + rect(x-10,y-1,3,1,p.moisture ? '#978361' : '#bea070') + rect(x+5,y+2,3,1,'#c0a170');
    if (p.moisture) out += rect(x-5,y+2,3,1,'#788f81') + rect(x+6,y-1,2,1,'#788f81');
    if (p.soilBlocked) out += path(`M${x-9} ${y}h6v1h4v-2h3v2h5v1h-7v1h-5v-1h-6z`,'#b3b297');
    out += portraitPlant(p,x,y,salt+i*773);
    if (s.house.umbrellaLife[i]) out += path(`M${x} ${y-29}h2v30h-2z`,'#8e7253') + path(`M${x-12} ${y-23}h5v-3h5v-3h6v3h5v3h5v3h-26z`,'#839fa0') + path(`M${x-3} ${y-28}h3v8h-4zM${x+4} ${y-25}h3v5h-3z`,'#b6ccbc');
    out += '</g>';
  }
  if (s.house.shelterLife) out += path('M100 63h2v83h-2zM157 64h2v83h-2z','#735b45') + path('M98 65h62v5H98zM101 61h56v4h-56z','#b7a475') + path('M104 64h4v5h-4zM115 64h4v5h-4zM126 64h4v5h-4zM137 64h4v5h-4zM148 64h4v5h-4z','#d8c89c');
  return out;
}

/** Shared, self-contained NFT art. Only saved state can change its belongings. */
export function evmLifePortrait(life: Pick<EvmPublicLife, 'state' | 'name'>): string {
  const s = life.state, salt = hash32(`${s.seed}:portrait-v3`), remembered = !s.alive;
  const p = WORLDS[salt % WORLDS.length]!, mirrored = !!((salt >>> 8) & 1);
  const art = roosterSvg(s.seed,32,remembered ? 'dead' : 'idle').replace(/<svg[^>]*>/,'<g data-canonical-rooster="true">').replace('</svg>','</g>');
  const castShadow = path('M57 118h29v3h8v2H81v3H67v3H51v3H34v-3h-8v-3h10v-3h11v-3h10z','#594c36',.25) + path('M55 120h31v3H75v3H58v2H43v-3h12z','#594c36',.24) + path('M43 120h10v-2h30v2h12v3H84v2H54v-2H43z','#625e48',.38);
  const environment = landscape(p,salt) + canopy(p,salt) + cottage(p,salt,s) + foreground(p,salt) + threshold(p,salt) + workshop(p,s) + garden(s,salt) + wildFrame(p,salt);
  // Only the environment changes orientation. The canonical rooster remains a
  // positive 3× scale in a separate sibling, placed with both feet on the porch.
  const world = `<g data-environment-orientation="${mirrored ? 'garden-left' : 'garden-right'}"${mirrored ? ' transform="translate(160 0) scale(-1 1)"' : ''}>${environment}</g>`;
  const shadow = `<g${mirrored ? ' transform="translate(169 0) scale(-1 1)"' : ''}>${castShadow}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 160 160" shape-rendering="crispEdges" role="img" aria-labelledby="title desc">
<title id="title">${xml(life.name)} — ${remembered ? 'a remembered life' : `saved day ${s.day}`}</title>
<desc id="desc">The original seeded rooster in its home. Four garden beds, growing plants, crafted belongings and household care reflect this NFT's saved state. Architecture, orientation and atmospheric colors are permanent cosmetic seed traits.</desc>
<defs><clipPath id="frame"><rect width="160" height="160"/></clipPath></defs><g clip-path="url(#frame)">
${remembered ? `<rect width="160" height="160" fill="#adb6aa"/><g opacity="0.74">${world}${shadow}</g><rect width="160" height="160" fill="#adb6aa" opacity="0.2"/>` : world+shadow}
<g data-rooster-placement="porch" transform="translate(${mirrored ? 45 : 15} 15) scale(3)">${art}</g></g></svg>`;
}
