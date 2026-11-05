import { canvasArt, type Paint } from '../art/pixels';
import { drawItemArt } from '../art/items';
import { homeArtSeed } from '../art/house';
import { houseShell, clearDoorways } from './house-shell';
import { PLANTS } from '../domain/catalog';
import type { Plot } from '../domain/types';
import { BEDS, WORLD_HEIGHT, WORLD_WIDTH } from './layout';

const noise = (x: number, y: number, seed: number) => { let h = Math.imul(x + 17, 374761393) ^ Math.imul(y + 31, 668265263) ^ seed; h = Math.imul(h ^ h >>> 13, 1274126177); return (h ^ h >>> 16) >>> 0; };

/** Small material accents apply only to scenery copies, never to rooster art. */
export function accentFixture(source: HTMLCanvasElement, kind: string): HTMLCanvasElement {
  const palettes: Record<string, Record<string, string>> = {
    mailbox: { '456d78': '327f91', '64929a': '62adba', '9cb6ae': 'b3ded3', '30515f': '2b6070', 'bd5143': 'd45e4d' },
    bedside: { c3bd98: 'd8b979', e8ddb5: 'f3d58c', f5e9c5: 'ffebb0', d1c79f: 'd5b177' },
    window: { '527e95': '518ba7', '7caed0': '7fc1db', a3cbdf: 'b2dce8' },
    painting: { b96862: 'd27274', e0a083: 'f0ae8d', '78a8ba': '73afc3', '86b3bf': '81bfcf', '87b4bc': '88c9cc' },
  };
  const wood = ['table', 'chair', 'cupboard', 'pantry', 'prep', 'bed', 'bedCover', 'baseSeat', 'shelf', 'bedside'].includes(kind);
  const steel = kind === 'fridge' || kind === 'stove' || kind === 'sink';
  if (!palettes[kind] && kind !== 'plant' && !wood && !steel) return source;
  const context = source.getContext('2d')!, image = context.getImageData(0, 0, source.width, source.height), pixels = image.data;
  for (let i = 0; i < pixels.length; i += 4) {
    if (!pixels[i + 3]) continue;
    const r = pixels[i]!, g = pixels[i + 1]!, b = pixels[i + 2]!;
    const key = [r, g, b].map(n => n.toString(16).padStart(2, '0')).join(''), replacement = palettes[kind]?.[key];
    if (replacement) { pixels[i] = parseInt(replacement.slice(0, 2), 16); pixels[i + 1] = parseInt(replacement.slice(2, 4), 16); pixels[i + 2] = parseInt(replacement.slice(4, 6), 16); }
    else if ((kind === 'plant' || kind === 'baseSeat') && g > 55 && g > r * 1.08 && g > b * 1.05) { pixels[i] = Math.min(255, r + 1); pixels[i + 1] = Math.min(255, g + (kind === 'plant' ? 17 : 10)); pixels[i + 2] = Math.min(255, b + 1); }
    else if (wood && r > 105 && r > g * 1.12 && g > b * 1.12) { pixels[i] = Math.min(255, r + 7); pixels[i + 1] = Math.min(255, g + 4); pixels[i + 2] = Math.max(0, b - 2); }
    else if ((kind === 'bed' || kind === 'bedCover') && b > 90 && b > r * 1.3 && b > g * 1.08) { pixels[i] = Math.min(255, r + 2); pixels[i + 1] = Math.min(255, g + 8); pixels[i + 2] = Math.min(255, b + 10); }
    else if (steel && Math.max(r, g, b) - Math.min(r, g, b) < 32 && r > 115) { pixels[i] = Math.min(255, r + 5); pixels[i + 1] = Math.min(255, g + 7); pixels[i + 2] = Math.min(255, b + 7); }
  }
  context.putImageData(image, 0, 0);
  // Material highlights are placed on existing faces, never outside the asset's
  // original silhouette. This also preserves every furniture contact anchor.
  context.globalCompositeOperation = 'source-atop';
  if (kind === 'cupboard') { context.fillStyle = '#dfac6a'; context.fillRect(6, 8, 1, 19); context.fillRect(18, 10, 4, 1); context.fillStyle = '#85542f'; context.fillRect(7, 25, 4, 1); }
  if (kind === 'fridge') { context.fillStyle = '#f3f3dc'; context.fillRect(6, 5, 1, 10); context.fillStyle = '#d4e8df'; context.fillRect(7, 25, 1, 9); }
  context.globalCompositeOperation = 'source-over'; return source;
}

function textile(p: Paint, x: number, y: number, w: number, h: number, colors: readonly string[]): void {
  p(colors[0]!, x, y, w, h); p('#c7b784', x + 1, y + 1, w - 2, h - 2); p(colors[1]!, x + 3, y + 3, w - 6, h - 6);
  p(colors[2]!, x + 4, y + 4, w - 8, 1); p(colors[0]!, x + 4, y + h - 5, w - 8, 1);
  for (let a = x + 7; a < x + w - 6; a += 8) for (let b = y + 7; b < y + h - 6; b += 8) { p(colors[2]!, a, b, 3, 1); p(colors[2]!, a + 1, b - 1, 1, 3); }
  for (let a = x + 3; a < x + w - 3; a += 5) { p('#e2ca89', a, y + 1, 2, 1); p('#e2ca89', a, y + h - 2, 2, 1); }
}

/** Hard-edged contact shadow on the same one-pixel grid as the furniture. */
export function shadowArt(width: number, height: number): HTMLCanvasElement {
  return canvasArt(width, height, p => {
    p('#342f28', 3, 0, width - 6, 1);
    p('#342f28', 1, 1, width - 2, height - 2);
    p('#342f28', 3, height - 1, width - 6, 1);
  });
}

export function landscape(seed: string): HTMLCanvasElement {
  const n = homeArtSeed(seed), c = canvasArt(WORLD_WIDTH, WORLD_HEIGHT, p => {
    p('#3d6541', 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    p('#83b95e', 28, 440, 456, 350); p('#afd879', 30, 442, 452, 2);
    for (let y = 448; y < 784; y += 5) for (let x = 32; x < 480; x += 6) {
      const z = noise(x, y, n); if (z % 5 === 0) { p(z % 2 ? '#659b49' : '#b4d779', x, y, 3, 1); p('#76aa4f', x + 1, y - 1, 1, 3); }
    }
    // The garden is a recognizable place, with four permanent soil beds and room to walk between them.
    p('#547e43', 341, 474, 142, 204); p('#a4c477', 343, 476, 138, 200); p('#93b76a', 346, 479, 132, 194);
    // Four raised beds sit in grass, connected by the same clear walking lanes.
    // The gravel follows the existing bed approaches; no new collision is added.
    p('#a88e5e', 406, 479, 22, 194); p('#e2cc99', 408, 479, 18, 194); p('#f0dca9', 408, 479, 1, 194);
    for (const y of [544, 640]) { p('#a88e5e', 341, y, 140, 18); p('#e2cc99', 341, y + 1, 140, 15); p('#f0dca9', 341, y + 1, 140, 1); p('#e2cc99', 408, y, 18, 18); }
    for (let y = 481; y < 670; y += 5) for (let x = 348; x < 475; x += 7) {
      const path = x >= 406 && x < 428 || y >= 544 && y < 562 || y >= 640 && y < 658;
      if (noise(x, y, n) % 6 === 0) p(path ? '#c3aa79' : '#a7cb77', x, y, path ? 2 : 3, 1);
    }
    for (const bed of BEDS) { p('#9a8157', bed.x - 28, bed.y - 30, 56, 36); p('#d4bf8c', bed.x - 27, bed.y - 29, 54, 1); }
    const stone = (x: number, y: number, w = 22, h = 10) => { p('#7c866c', x, y + 1, w, h - 1); p('#c6c7a2', x + 1, y, w - 2, h - 2); p('#eee0b7', x + 2, y, w - 5, 1); p('#a7b18a', x + 1, y + h - 3, w - 2, 1); p('#d8d3ad', x + 3, y + 2, Math.max(3, w - 12), 1); };
    for (let y = 444; y < 783; y += 14) stone(318 + (Math.floor(y / 14) % 2), y, 22, 10);
    for (let x = 275; x < 322; x += 14) stone(x, 544, 12, 9);
    for (let x = 342; x < 409; x += 14) stone(x, 736, 12, 9);
    // Low hedges frame the cutaway house; the doorstep remains the only opening.
    for (const [x, w] of [[30, 281], [346, 136]]) { p('#315c3c', x, 441, w, 10); p('#578a43', x + 2, 441, w - 4, 6); p('#91bb62', x + 4, 441, w - 8, 2); }
    const post = (x: number, y: number) => { p('#48402f', x, y, 7, 16); p('#91794e', x + 1, y + 1, 5, 13); p('#c2a870', x + 1, y + 1, 4, 2); p('#6b5a3c', x + 5, y + 4, 1, 10); };
    for (let y = 452; y < 785; y += 19) { p('#625333', 20, y + 4, 8, 3); p('#b39a61', 21, y + 4, 7, 1); post(22, y - 2); p('#625333', 484, y + 4, 8, 3); p('#b39a61', 485, y + 4, 7, 1); post(485, y - 2); }
    for (const [a, b] of [[29, 317], [348, 486]]) { p('#5c4c32', a, 782, b - a, 5); p('#b39962', a, 782, b - a, 2); p('#79643e', a, 792, b - a, 3); for (let x = a; x < b; x += 16) post(x, 777); }
    p('#c7c2a1', 0, 800, 512, 9); p('#e3d8b5', 0, 800, 512, 1); p('#8b8e7b', 0, 809, 512, 2); p('#53636b', 0, 811, 512, 21);
    for (let x = 0; x < 512; x += 25) { p('#b2b296', x, 801, 1, 7); p('#e6d894', x + 4, 827, 13, 2); }
    // Ordinary little domestic details, deliberately outside the routes to work and care.
    const flowerColors = ['#f5ca55', '#ed8a78', '#b894d1', '#fff0c7'];
    for (const [i, [x, y]] of [[58, 473], [104, 740], [207, 490], [284, 699], [468, 703], [61, 648], [351, 466], [475, 466], [475, 683], [351, 494], [474, 494], [350, 675], [475, 675]].entries()) {
      p('#3f783d', x! - 5, y! - 1, 11, 6); p('#629e49', x! - 6, y! - 3, 5, 5); p('#629e49', x! + 1, y! - 5, 5, 7); p('#acd26d', x! - 4, y! - 3, 3, 1); p('#91bf5d', x! + 2, y! - 5, 3, 1);
      p('#44783e', x! + 2, y! - 7, 1, 8); p(flowerColors[i % flowerColors.length]!, x!, y! - 10, 5, 3); p(flowerColors[i % flowerColors.length]!, x! + 1, y! - 11, 3, 5); p('#fff1bf', x! + 2, y! - 9, 1, 1);
    }
    // Two fence posts, a slack washing line and a slow little sheet give the yard a home.
    post(72, 529); post(184, 529); p('#6b6145', 76, 522, 109, 1);
    p('#c9cbb0', 93, 523, 29, 27); p('#e2dfbf', 94, 523, 27, 24); p('#b5bea0', 99, 524, 2, 23); p('#f0e9c8', 103, 523, 16, 1);
    p('#438d98', 143, 523, 18, 21); p('#87c1bd', 145, 524, 14, 17); p('#377780', 152, 525, 2, 17); p('#d1866b', 166, 523, 13, 18); p('#e6ad8b', 167, 524, 10, 15); p('#ad8b51', 97, 520, 2, 5); p('#ad8b51', 118, 520, 2, 5); p('#ad8b51', 146, 520, 2, 5); p('#ad8b51', 171, 520, 2, 5);
    // A picnic table is scenery, not a fifth productive slot.
    p('#526c42', 108, 673, 72, 11); p('#4f412e', 117, 647, 7, 31); p('#4f412e', 162, 647, 7, 31); p('#a07849', 112, 641, 61, 27); p('#c59b62', 112, 641, 61, 3); p('#785a37', 112, 650, 61, 1); p('#785a37', 112, 659, 61, 1); p('#61472d', 105, 667, 76, 6); p('#b18b55', 106, 667, 74, 2); p('#efe0b9', 137, 645, 14, 16); p('#c5b58f', 138, 652, 12, 1);
    p('#725934', 141, 643, 5, 6); p('#9ca869', 140, 638, 7, 6); p('#c2c386', 142, 637, 3, 3);
  });
  const ctx = c.getContext('2d')!; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(houseShell(n), 0, 0);
  const paint: Paint = (color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  // A few complementary textiles give each room an identity within the warm wood house.
  textile(paint, 335, 116, 58, 37, ['#23535b', '#36878a', '#83b9aa']);
  textile(paint, 231, 253, 27, 156, ['#2f594a', '#44866b', '#91b981']);
  textile(paint, 61, 349, 113, 41, ['#794637', '#bd7958', '#e0a779']);
  textile(paint, 302, 387, 44, 24, ['#315d6b', '#569da4', '#acd0bc']);
  // The former small garden annex becomes a covered, open-front workshop.
  paint('#735139', 384, 272, 96, 144);
  for (let y = 273; y < 415; y += 6) { paint(y % 12 ? '#c79d66' : '#d0a46b', 386, y, 91, 5); paint('#e0b77c', 386, y, 91, 1); for (let x = 393 + (y % 12 ? 0 : 15); x < 476; x += 31) paint('#b18653', x, y, 1, 5); }
  paint('#493c2c', 383, 265, 99, 11); paint('#927247', 385, 267, 95, 5); paint('#b39358', 385, 267, 95, 1); paint('#4a3c2c', 478, 272, 5, 145); paint('#9e7b4c', 479, 274, 2, 140);
  clearDoorways(paint, n);
  // Front door threshold, continuous with the yard stones.
  paint('#cfaa70', 320, 432, 16, 16); paint('#e6bf81', 321, 433, 14, 1); paint('#674b30', 316, 432, 4, 12); paint('#ac8450', 317, 432, 2, 10); paint('#674b30', 336, 432, 4, 12); paint('#ac8450', 337, 432, 2, 10);
  return c;
}

export function bedArt(plot: Plot): HTMLCanvasElement {
  return canvasArt(64, 88, p => {
    const wet = plot.moisture > 0, soil = wet ? '#714b30' : '#a77b49';
    p('#4b3628', 7, 57, 50, 29); p('#bb8b4b', 8, 57, 48, 27); p('#edc385', 8, 57, 48, 2); p(soil, 10, 60, 44, 22); p('#83572f', 10, 80, 44, 2);
    p('#d8a45f', 8, 60, 2, 22); p('#986338', 54, 60, 2, 24); p('#e6b773', 10, 82, 44, 1); p('#a6743e', 10, 83, 44, 1);
    for (const [x, y] of [[8, 58], [54, 58], [8, 83], [54, 83]]) p('#65533a', x, y, 1, 1);
    for (let y = 63; y < 80; y += 6) { p(wet ? '#563a28' : '#8e663d', 12, y, 40, 2); p(wet ? '#926b43' : '#bd9459', 12, y + 2, 40, 1); }
    if (wet) for (const [x, y] of [[14, 65], [41, 74], [26, 78]]) { p('#8d7750', x, y, 2, 1); p('#a19467', x, y, 1, 1); }
    if (plot.soilBlocked) { for (const [x, y] of [[19, 64], [40, 72], [28, 77]]) { p('#4e5735', x, y - 5, 1, 8); p('#6c7b43', x - 3, y - 3, 7, 1); p('#8c9650', x + 1, y - 5, 3, 1); } p('#533e2c', 24, 66, 7, 1); p('#533e2c', 30, 67, 1, 6); }
    if (!plot.kind) return;
    const spec = PLANTS[plot.kind], grown = spec ? Math.max(.1, 1 - plot.ticks / spec.ticks) : .1, ready = plot.ticks === 0;
    const leaf = plot.dry > 1 ? '#8e9250' : '#477d3e', light = plot.dry > 1 ? '#b2ac68' : '#92bb5e';
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
          const colors = ['#fff1cb', '#efbd49', '#ad89c2', '#db6c7c', '#e56c4f', '#638bc3']; const color = colors[plot.kind - 1] || colors[0]!;
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
    p('#548544', 6, 63, 49, 8); p('#47513d', 10, 43, 40, 27); p('#b5b69a', 12, 46, 36, 22); p('#ded7b3', 13, 46, 34, 2);
    for (let y = 49; y < 68; y += 6) { p('#8a9477', 13, y, 34, 1); for (let x = 15 + y % 2 * 5; x < 47; x += 10) p('#7e8a70', x, y, 1, 6); }
    p('#475544', 12, 42, 36, 10); p('#d2cba7', 12, 42, 36, 3); p('#f0dfb6', 14, 42, 31, 1); p('#237e9d', 18, 46, 23, 3); p('#7bd9e3', 21, 47, 14, 1); p('#dcf4df', 28, 47, 3, 1);
    for (const x of [11, 45]) { p('#4b3c2d', x, 16, 5, 39); p('#9c7748', x + 1, 17, 3, 37); p('#c39b62', x + 1, 17, 1, 36); }
    p('#583e2b', 5, 14, 50, 9); p('#b48749', 8, 9, 44, 11); p('#d2a15f', 13, 4, 34, 11); p('#f1ce8b', 15, 4, 29, 2); p('#90663b', 8, 18, 44, 3); p('#4d3b2b', 27, 20, 4, 23); p('#d6ba81', 28, 21, 1, 22);
    p('#4c6361', 23, 37, 12, 11); p('#9aaca2', 24, 37, 10, 2); p('#6f8884', 25, 39, 8, 7); p('#d0c59c', 26, 33, 6, 2); p('#d0c59c', 24, 34, 1, 5); p('#d0c59c', 33, 34, 1, 5);
  });
}

export function workbenchArt(): HTMLCanvasElement {
  return canvasArt(68, 40, p => {
    p('#4c3b2b', 5, 23, 58, 13); p('#a37b49', 7, 24, 54, 10); p('#704e31', 9, 28, 50, 5); p('#c09a5e', 10, 28, 48, 1); p('#d1b276', 14, 30, 2, 2); p('#d1b276', 52, 30, 2, 2);
    p('#3f3429', 2, 20, 64, 6); p('#bd9356', 3, 20, 62, 4); p('#e1bc7b', 4, 20, 60, 2); p('#d1aa6e', 5, 24, 54, 1); p('#755130', 5, 35, 6, 4); p('#755130', 56, 35, 6, 4);
    p('#4e4030', 7, 2, 54, 18); p('#9b7b4b', 8, 3, 52, 16); p('#bb9658', 9, 4, 50, 1); p('#655238', 16, 5, 1, 13); p('#655238', 39, 5, 1, 13);
    p('#616d69', 14, 7, 13, 3); p('#9ea79a', 14, 7, 12, 1); p('#b18c52', 18, 9, 3, 8); p('#5c7070', 33, 6, 3, 11); p('#bbc3ae', 33, 6, 2, 5); p('#b58f52', 45, 6, 3, 11); p('#697e79', 43, 7, 8, 4);
    p('#9a6f3e', 14, 18, 26, 5); p('#ddbb7c', 14, 18, 25, 1); p('#677b77', 45, 20, 11, 3); p('#abb9a5', 45, 20, 10, 1); p('#ad8a50', 52, 22, 9, 2);
    p('#2c6578', 53, 13, 7, 7); p('#66aebc', 54, 13, 5, 6); p('#bae0d7', 54, 13, 4, 1); p('#d7aa57', 55, 8, 1, 6); p('#e7c579', 57, 9, 1, 5);
  });
}

export function itemArt(index: number): HTMLCanvasElement {
  return canvasArt(20, 20, p => drawItemArt(p, index));
}
