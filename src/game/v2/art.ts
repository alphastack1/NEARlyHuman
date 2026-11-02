import { canvasArt, drawItem, type Paint } from '../../art/pixels';
import { houseCanvas, homeArtSeed } from '../../art/house';
import { PLANTS } from '../../v2/catalog';
import type { Plot } from '../../v2/types';
import { BEDS, WORLD_HEIGHT, WORLD_WIDTH } from './layout';

const noise = (x: number, y: number, seed: number) => { let h = Math.imul(x + 17, 374761393) ^ Math.imul(y + 31, 668265263) ^ seed; h = Math.imul(h ^ h >>> 13, 1274126177); return (h ^ h >>> 16) >>> 0; };

export function landscape(seed: string): HTMLCanvasElement {
  const n = homeArtSeed(seed), c = canvasArt(WORLD_WIDTH, WORLD_HEIGHT, p => {
    p('#4e6a43', 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    p('#82a15e', 28, 440, 456, 350); p('#90ac69', 30, 442, 452, 2);
    for (let y = 448; y < 784; y += 5) for (let x = 32; x < 480; x += 6) {
      const z = noise(x, y, n); if (z % 5 === 0) { p(z % 2 ? '#739553' : '#99b36c', x, y, 3, 1); p('#779956', x + 1, y - 1, 1, 3); }
    }
    // The garden is a recognizable place, with four permanent soil beds and room to walk between them.
    p('#6a7e4d', 341, 474, 142, 204); p('#b8a475', 343, 476, 138, 200); p('#c8b282', 346, 479, 132, 194);
    for (let y = 481; y < 670; y += 5) for (let x = 348; x < 475; x += 7) if (noise(x, y, n) % 4 === 0) p('#b29d72', x, y, 2, 1);
    for (const bed of BEDS) { p('#9a8157', bed.x - 28, bed.y - 30, 56, 36); p('#d4bf8c', bed.x - 27, bed.y - 29, 54, 1); }
    const stone = (x: number, y: number, w = 22, h = 10) => { p('#8d8a6b', x, y, w, h); p('#c4bc93', x + 1, y, w - 2, h - 2); p('#ddd2a5', x + 2, y, w - 5, 1); p('#b2a77f', x + 1, y + h - 3, w - 2, 1); };
    for (let y = 444; y < 783; y += 14) stone(318 + (Math.floor(y / 14) % 2), y, 22, 10);
    for (let x = 275; x < 322; x += 14) stone(x, 544, 12, 9);
    for (let x = 342; x < 409; x += 14) stone(x, 736, 12, 9);
    // Low hedges frame the cutaway house; the doorstep remains the only opening.
    for (const [x, w] of [[30, 281], [346, 136]]) { p('#3e6140', x, 441, w, 10); p('#60824c', x + 2, 441, w - 4, 6); p('#91a85f', x + 4, 441, w - 8, 2); }
    const post = (x: number, y: number) => { p('#48402f', x, y, 7, 16); p('#91794e', x + 1, y + 1, 5, 13); p('#c2a870', x + 1, y + 1, 4, 2); p('#6b5a3c', x + 5, y + 4, 1, 10); };
    for (let y = 452; y < 785; y += 19) { p('#625333', 20, y + 4, 8, 3); p('#b39a61', 21, y + 4, 7, 1); post(22, y - 2); p('#625333', 484, y + 4, 8, 3); p('#b39a61', 485, y + 4, 7, 1); post(485, y - 2); }
    for (const [a, b] of [[29, 317], [348, 486]]) { p('#5c4c32', a, 782, b - a, 5); p('#b39962', a, 782, b - a, 2); p('#79643e', a, 792, b - a, 3); for (let x = a; x < b; x += 16) post(x, 777); }
    p('#c7c2a1', 0, 800, 512, 9); p('#e3d8b5', 0, 800, 512, 1); p('#8b8e7b', 0, 809, 512, 2); p('#53636b', 0, 811, 512, 21);
    for (let x = 0; x < 512; x += 25) { p('#b2b296', x, 801, 1, 7); p('#e6d894', x + 4, 827, 13, 2); }
    // Ordinary little domestic details, deliberately outside the routes to work and care.
    for (const [x, y] of [[58, 473], [104, 740], [207, 490], [284, 699], [468, 703], [61, 648]]) {
      p('#547441', x - 6, y + 1, 13, 4); p('#6c904d', x - 4, y - 3, 9, 6); p('#a7bb70', x - 1, y - 6, 3, 3); p('#efe5be', x + 3, y - 7, 2, 2); p('#dfbd5c', x + 3, y - 6, 1, 1);
    }
    // Two fence posts, a slack washing line and a slow little sheet give the yard a home.
    post(72, 529); post(184, 529); p('#6b6145', 76, 522, 109, 1);
    p('#c9cbb0', 93, 523, 29, 27); p('#e2dfbf', 94, 523, 27, 24); p('#b5bea0', 99, 524, 2, 23); p('#f0e9c8', 103, 523, 16, 1);
    p('#61868b', 143, 523, 18, 21); p('#91a6a0', 145, 524, 14, 17); p('#4e747d', 152, 525, 2, 17); p('#ad8b51', 97, 520, 2, 5); p('#ad8b51', 118, 520, 2, 5); p('#ad8b51', 146, 520, 2, 5);
    // A picnic table is scenery, not a fifth productive slot.
    p('#526c42', 108, 673, 72, 11); p('#4f412e', 117, 647, 7, 31); p('#4f412e', 162, 647, 7, 31); p('#a07849', 112, 641, 61, 27); p('#c59b62', 112, 641, 61, 3); p('#785a37', 112, 650, 61, 1); p('#785a37', 112, 659, 61, 1); p('#61472d', 105, 667, 76, 6); p('#b18b55', 106, 667, 74, 2); p('#efe0b9', 137, 645, 14, 16); p('#c5b58f', 138, 652, 12, 1);
    p('#725934', 141, 643, 5, 6); p('#9ca869', 140, 638, 7, 6); p('#c2c386', 142, 637, 3, 3);
  });
  const ctx = c.getContext('2d')!; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(houseCanvas(n), 0, 0, 512, 440, 0, 0, 512, 440);
  const paint: Paint = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  // The former small garden annex becomes a covered, open-front workshop.
  paint('#735139', 384, 272, 96, 144);
  for (let y = 273; y < 415; y += 6) { paint(y % 12 ? '#c79d66' : '#d0a46b', 386, y, 91, 5); paint('#e0b77c', 386, y, 91, 1); for (let x = 393 + (y % 12 ? 0 : 15); x < 476; x += 31) paint('#b18653', x, y, 1, 5); }
  paint('#493c2c', 383, 265, 99, 11); paint('#927247', 385, 267, 95, 5); paint('#b39358', 385, 267, 95, 1); paint('#4a3c2c', 478, 272, 5, 145); paint('#9e7b4c', 479, 274, 2, 140);
  // Front door threshold, continuous with the yard stones.
  paint('#cfaa70', 320, 432, 16, 16); paint('#e6bf81', 321, 433, 14, 1); paint('#674b30', 316, 432, 4, 12); paint('#ac8450', 317, 432, 2, 10); paint('#674b30', 336, 432, 4, 12); paint('#ac8450', 337, 432, 2, 10);
  return c;
}

export function bedArt(plot: Plot): HTMLCanvasElement {
  return canvasArt(64, 88, p => {
    const wet = plot.moisture > 0, soil = wet ? '#755034' : '#a17b4e';
    p('#54412e', 7, 57, 50, 29); p('#b58d53', 8, 57, 48, 27); p('#d8b477', 8, 57, 48, 2); p(soil, 10, 60, 44, 22); p('#8a633c', 10, 80, 44, 2);
    for (let y = 63; y < 80; y += 6) { p(wet ? '#5d412d' : '#8b6942', 12, y, 40, 2); p(wet ? '#8b6640' : '#af8c56', 12, y + 2, 40, 1); }
    if (wet) for (const [x, y] of [[14, 65], [41, 74], [26, 78]]) { p('#8d7750', x, y, 2, 1); p('#a19467', x, y, 1, 1); }
    if (plot.soilBlocked) { for (const [x, y] of [[19, 64], [40, 72], [28, 77]]) { p('#4e5735', x, y - 5, 1, 8); p('#6c7b43', x - 3, y - 3, 7, 1); p('#8c9650', x + 1, y - 5, 3, 1); } p('#533e2c', 24, 66, 7, 1); p('#533e2c', 30, 67, 1, 6); }
    if (!plot.kind) return;
    const spec = PLANTS[plot.kind], grown = spec ? Math.max(.1, 1 - plot.ticks / spec.ticks) : .1, ready = plot.ticks === 0;
    const leaf = plot.dry > 1 ? '#8e9250' : '#4d7544', light = plot.dry > 1 ? '#b2ac68' : '#85a35d';
    if (plot.kind >= 8) {
      const big = grown >= .48, top = big ? 15 : 43, width = big ? 42 : 23;
      p('#4c3b2b', 28, top + 14, 7, 58 - top); p('#947046', 30, top + 13, 4, 58 - top); p('#c19961', 30, top + 15, 1, 58 - top); p('#6a4c32', 25, 66, 15, 3);
      const x = 32 - Math.floor(width / 2), scale = width / 42;
      const crown = (color: string, a: number, b: number, w: number, h: number) => p(color, x + Math.round(a * scale), top + Math.round(b * scale), Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
      // Broad little leaf clusters keep the canopy legible without turning it into a flat tile.
      crown('#2f5135', 13, 0, 16, 3); crown('#2f5135', 7, 3, 28, 4); crown('#2f5135', 3, 7, 36, 5);
      crown('#2f5135', 0, 12, 42, 11); crown('#2f5135', 3, 23, 35, 5); crown('#2f5135', 10, 28, 23, 3);
      crown(leaf, 12, 3, 16, 3); crown(leaf, 6, 6, 27, 6); crown(leaf, 2, 12, 36, 9); crown(leaf, 6, 21, 30, 6); crown(leaf, 13, 27, 16, 2);
      const cluster = (a: number, b: number, w: number, h: number, color: string) => { crown(color, a + 2, b, w - 4, h); crown(color, a, b + 2, w, h - 4); };
      cluster(11, 4, 17, 11, '#63894e'); cluster(4, 11, 16, 12, '#63894e'); cluster(22, 10, 16, 12, '#527b45'); cluster(14, 18, 17, 11, '#527b45');
      cluster(13, 5, 12, 7, light); cluster(6, 12, 11, 7, light); cluster(25, 11, 10, 7, '#739751');
      crown('#a1b96e', 15, 5, 5, 1); crown('#a1b96e', 8, 12, 4, 1); crown('#8ba75f', 27, 11, 4, 1);
      crown('#375d3a', 3, 21, 4, 2); crown('#375d3a', 11, 25, 4, 2); crown('#375d3a', 28, 25, 6, 2); crown('#375d3a', 36, 18, 3, 3);
      if (big) { p('#6a4c32', 27, 47, 5, 2); p('#947046', 28, 46, 3, 2); p('#6a4c32', 33, 50, 6, 2); p('#947046', 34, 49, 4, 2); p('#6a4c32', 31, 57, 2, 7); }
      if (ready && plot.kind === 8) for (const [a, b] of [[19, 30], [37, 24], [43, 38], [27, 42]]) { p('#6d3c32', a - 1, b, 5, 5); p('#c45d45', a, b, 4, 4); p('#ea9867', a, b, 2, 1); p('#564b31', a + 1, b - 2, 1, 2); }
      if (ready && plot.kind === 9) { p('#e5cb7b', 35, 51, 2, 2); p('#b48b52', 24, 59, 15, 4); p('#6b4a30', 28, 60, 9, 1); }
    } else if (plot.kind === 7) {
      p('#664a31', 17, 31, 3, 40); p('#a6804d', 18, 31, 1, 39); p('#664a31', 45, 31, 3, 40); p('#a6804d', 46, 31, 1, 39); p('#96794d', 18, 39, 29, 2); p('#96794d', 18, 54, 29, 2);
      for (let i = 0; i < (grown > .6 ? 8 : 3); i++) { const x = 19 + i * 7 % 25, y = 58 - Math.floor(i / 3) * 11; p(leaf, x, y, 9, 5); p(light, x + 1, y, 4, 1); }
      if (ready) for (const [x, y] of [[23, 45], [36, 57], [39, 35]]) { p('#534052', x, y, 7, 7); p('#80618d', x, y, 3, 5); p('#9d81a0', x + 1, y, 2, 1); p('#6c4c74', x + 2, y + 5, 3, 4); }
    } else {
      const height = grown > .6 ? 21 : grown > .25 ? 13 : 6;
      for (const [x, y] of [[20, 72], [39, 71], [29, 62]]) {
        p('#3e613c', x, y - height, 2, height); p(leaf, x - 5, y - height + 8, 7, 3); p(light, x - 4, y - height + 8, 4, 1); p(leaf, x + 1, y - height + 3, 6, 3); p(light, x + 2, y - height + 3, 4, 1);
        if (ready) {
          const colors = ['#eee8c6', '#e6b54d', '#9e86b2', '#c66267', '#cc5e4e', '#6684a7']; const color = colors[plot.kind - 1] || colors[0]!;
          if (plot.kind === 3) { for (let a = 0; a < 3; a++) { p('#65516f', x + a * 3 - 3, y - height - 5, 2, 9); p(color, x + a * 3 - 3, y - height - 5, 2, 6); p('#c5abcf', x + a * 3 - 3, y - height - 5, 1, 2); } }
          else if (plot.kind >= 5) { p(color, x - 5, y - 6, 5, 5); p(color, x + 3, y - 10, 5, 5); p(plot.kind === 5 ? '#efad73' : '#9babc3', x - 4, y - 5, 1, 1); p('#678147', x - 4, y - 7, 3, 2); }
          else { p(color, x - 3, y - height - 3, 8, 5); p(color, x - 1, y - height - 5, 4, 9); p(plot.kind === 4 ? '#e39a8b' : '#e3c75e', x, y - height - 1, 2, 2); }
        }
      }
    }
  });
}

export function wellArt(): HTMLCanvasElement {
  return canvasArt(60, 75, p => {
    p('#537044', 6, 63, 49, 8); p('#4d4938', 10, 43, 40, 27); p('#9f9e83', 12, 46, 36, 22); p('#c0bca0', 13, 46, 34, 2);
    for (let y = 49; y < 68; y += 6) { p('#807f68', 13, y, 34, 1); for (let x = 15 + y % 2 * 5; x < 47; x += 10) p('#777865', x, y, 1, 6); }
    p('#4b5148', 12, 42, 36, 10); p('#c3bea1', 12, 42, 36, 3); p('#d6ceaa', 14, 42, 31, 1); p('#334f56', 18, 46, 23, 3); p('#719493', 21, 47, 14, 1);
    for (const x of [11, 45]) { p('#4b3c2d', x, 16, 5, 39); p('#9c7748', x + 1, 17, 3, 37); p('#c39b62', x + 1, 17, 1, 36); }
    p('#53402e', 5, 14, 50, 9); p('#a37c47', 8, 9, 44, 11); p('#bf965b', 13, 4, 34, 11); p('#d3b077', 15, 4, 29, 2); p('#806039', 8, 18, 44, 3); p('#4d3b2b', 27, 20, 4, 23); p('#b8aa7c', 28, 21, 1, 22);
    p('#4c6361', 23, 37, 12, 11); p('#9aaca2', 24, 37, 10, 2); p('#6f8884', 25, 39, 8, 7); p('#d0c59c', 26, 33, 6, 2); p('#d0c59c', 24, 34, 1, 5); p('#d0c59c', 33, 34, 1, 5);
  });
}

export function workbenchArt(): HTMLCanvasElement {
  return canvasArt(68, 58, p => {
    p('#4c3b2b', 5, 23, 58, 30); p('#a37b49', 7, 24, 54, 27); p('#704e31', 9, 35, 50, 14); p('#c09a5e', 10, 36, 48, 2); p('#d1b276', 14, 43, 2, 2); p('#d1b276', 52, 43, 2, 2);
    p('#3f3429', 2, 20, 64, 10); p('#bd9356', 3, 20, 62, 7); p('#e1bc7b', 4, 20, 60, 2); p('#d1aa6e', 5, 24, 54, 1); p('#755130', 5, 51, 6, 6); p('#755130', 56, 51, 6, 6);
    p('#4e4030', 7, 2, 54, 18); p('#9b7b4b', 8, 3, 52, 16); p('#bb9658', 9, 4, 50, 1); p('#655238', 16, 5, 1, 13); p('#655238', 39, 5, 1, 13);
    p('#616d69', 14, 7, 13, 3); p('#9ea79a', 14, 7, 12, 1); p('#b18c52', 18, 9, 3, 8); p('#5c7070', 33, 6, 3, 11); p('#bbc3ae', 33, 6, 2, 5); p('#b58f52', 45, 6, 3, 11); p('#697e79', 43, 7, 8, 4);
    p('#9a6f3e', 14, 18, 26, 5); p('#ddbb7c', 14, 18, 25, 1); p('#677b77', 45, 20, 11, 3); p('#abb9a5', 45, 20, 10, 1); p('#ad8a50', 52, 22, 9, 2);
  });
}

export function itemArt(index: number): HTMLCanvasElement {
  return canvasArt(20, 20, p => {
    if (index === 34) { p('#59422d', 2, 5, 16, 13); p('#bd955f', 3, 5, 14, 11); p('#dbb67a', 3, 5, 14, 2); p('#e0d1a6', 9, 5, 2, 11); p('#9c7546', 3, 10, 14, 1); p('#eee0b8', 4, 8, 5, 3); p('#b5a078', 5, 9, 3, 1); return; }
    if (index === 35) { p('#4b5146', 3, 5, 11, 12); p('#e4ddbd', 4, 6, 9, 10); p('#c6c5a6', 11, 7, 2, 8); p('#705239', 5, 6, 7, 2); p('#eee7c9', 13, 7, 4, 2); p('#eee7c9', 16, 8, 1, 5); p('#eee7c9', 13, 12, 4, 2); return; }
    if (index === 36) { p('#435851', 2, 8, 12, 10); p('#7a9a8a', 3, 9, 10, 8); p('#acc0a3', 4, 9, 7, 2); p('#4f7067', 11, 10, 2, 6); p('#56756c', 13, 10, 3, 4); p('#8fae99', 15, 7, 3, 5); p('#48645c', 17, 6, 2, 3); p('#9bb7a0', 5, 4, 6, 2); p('#9bb7a0', 4, 5, 2, 5); p('#9bb7a0', 10, 5, 2, 4); return; }
    if (index === 37) { p('#57432e', 8, 6, 3, 13); p('#b58c52', 9, 7, 1, 10); p('#3e5350', 4, 3, 12, 6); p('#9aa99a', 5, 3, 10, 4); p('#c3cbb4', 5, 3, 9, 1); p('#697d72', 13, 5, 3, 3); return; }
    if (index >= 0 && index <= 12 && index !== 6) { const care = ['water', 'milk', 'bread', 'steak', 'medicine', 'coffee', 'wood', 'toolkit', 'umbrella', 'matches', 'soap', 'bandage', 'compost'] as const; drawItem(p, care[index]!, 2, 2); return; }
    if (index >= 13 && index <= 21) { p('#675335', 4, 5, 12, 14); p('#d7be83', 5, 5, 10, 12); p('#f0dda6', 5, 5, 10, 2); p('#7e9a55', 9, 9, 2, 5); p('#537a45', 6, 9, 4, 2); p('#7d9b53', 11, 7, 3, 2); p('#a98a54', 6, 15, 8, 1); return; }
    if (index === 6) { for (const [x, y] of [[2, 11], [7, 6], [10, 13]]) { p('#59402b', x, y, 8, 5); p('#b38a50', x + 1, y, 6, 4); p('#e0bc7b', x + 1, y, 2, 3); p('#805b34', x + 4, y + 1, 2, 1); } return; }
    if (index === 30) { p('#60462c', 9, 3, 3, 14); p('#c49b60', 9, 4, 2, 12); p('#735033', 7, 2, 7, 6); p('#d3ac70', 8, 2, 5, 4); p('#e7c68b', 8, 2, 3, 1); return; }
    if (index === 31) { p('#684a2f', 2, 12, 16, 4); p('#b78b50', 4, 14, 12, 3); p('#e1ba76', 3, 12, 14, 1); p('#725437', 9, 2, 2, 11); p('#e6d9b0', 11, 3, 6, 8); p('#bcac81', 11, 10, 6, 1); return; }
    if (index === 32) { p('#714e30', 5, 6, 11, 11); p('#c69a5d', 6, 7, 9, 9); p('#4b3b2c', 9, 8, 4, 4); p('#8a623a', 3, 6, 15, 2); p('#b48248', 6, 3, 9, 4); p('#dfb87c', 8, 3, 5, 1); p('#674c32', 10, 16, 2, 3); return; }
    if (index === 33) { p('#57412e', 2, 6, 16, 12); p('#a77b45', 3, 7, 14, 10); p('#cba265', 3, 7, 14, 2); p('#6f5130', 3, 11, 14, 2); p('#d4ba73', 5, 7, 2, 10); p('#d4ba73', 14, 7, 2, 10); p('#d9c189', 9, 11, 3, 3); return; }
    if (index >= 22 && index <= 25) { const colors = ['#eee7c8', '#e5b350', '#a38ab7', '#cb6970']; p('#44663e', 10, 7, 2, 11); p('#769953', 6, 13, 5, 2); p(colors[index - 22]!, 6, 3, 10, 6); p(colors[index - 22]!, 9, 1, 4, 10); p('#e9c569', 10, 5, 2, 2); return; }
    if (index >= 26 && index <= 29) { const colors = ['#cb6553', '#6484aa', '#8c6c9e', '#c36a50']; p('#4d6840', 9, 3, 2, 3); p('#8a9c55', 11, 3, 5, 2); p('#5d4238', 4, 7, 12, 10); p(colors[index - 26]!, 5, 6, 10, 10); p(index === 26 ? '#edbc7c' : '#b9b1b1', 6, 8, 2, 2); if (index === 28) { p('#b19cc0', 7, 8, 1, 1); p('#4f375d', 9, 7, 1, 8); p('#4f375d', 5, 11, 10, 1); } return; }
    p('#536d71', 7, 2, 6, 3); p('#a5d6d7', 7, 4, 6, 12); p('#3f9bd0', 6, 7, 8, 11); p('#78c7e7', 7, 8, 2, 8); p('#c5e9e2', 7, 8, 1, 5);
  });
}
