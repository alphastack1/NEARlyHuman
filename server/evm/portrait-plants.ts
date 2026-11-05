import { PLANTS } from '../../src/domain/catalog';
import type { Plot } from '../../src/domain/types';

/** Saved plants only. x/y is the plant's root on the surface of its real bed. */
export function portraitPlant(plot: Plot, x: number, y: number, seed: number): string {
  const spec = PLANTS[plot.kind];
  if (!plot.kind || !spec) return '';
  const out: string[] = [];
  const rect = (xx: number, yy: number, w: number, h: number, c: string) => out.push(`<rect x="${xx}" y="${yy}" width="${w}" height="${h}" fill="${c}"/>`);
  const path = (d: string, c: string) => out.push(`<path d="${d}" fill="${c}"/>`);
  const repeat = plot.left < spec.yields;
  const progress = repeat ? 1 : 1 - plot.ticks / spec.ticks;
  const ready = plot.ticks === 0;
  const stage = progress < .34 ? 0 : progress < .7 ? 1 : 2;
  const dark = plot.dry ? '#5b6340' : '#304c3d';
  const mid = plot.dry ? '#858151' : '#54794b';
  const light = plot.dry ? '#b0a06a' : '#83a65b';
  const glint = plot.dry ? '#c1af77' : '#acc97b';
  const lean = ((seed >>> 3) % 3) - 1;
  const leaf = (xx: number, yy: number, side: number, size = 1) => {
    const lx = side < 0 ? xx - 4 * size : xx;
    rect(lx, yy, 4 * size, 2 * size, dark);
    rect(lx + (side < 0 ? 0 : size), yy - size, 3 * size, 2 * size, mid);
    rect(lx + size, yy - size, 2 * size, size, light);
  };
  const stem = (xx: number, top: number, bottom: number) => {
    rect(xx, top, 2, bottom - top, dark);
    rect(xx, top, 1, bottom - top, mid);
  };
  const crown = (xx: number, yy: number, width: number, height: number) => {
    rect(xx + 3, yy, width - 6, height, dark);
    rect(xx, yy + 3, width, height - 6, dark);
    rect(xx + 2, yy + 2, width - 4, height - 5, mid);
    rect(xx + 4, yy, width - 9, 3, mid);
    rect(xx + 3, yy + 2, 5, 3, light);
    rect(xx + width - 7, yy + 4, 4, 2, light);
    rect(xx + 5, yy + 1, 3, 1, glint);
    rect(xx + width - 5, yy + height - 5, 3, 2, dark);
    rect(xx + 4, yy + height - 3, 5, 2, dark);
  };
  // The first stage has leaves, never a speculative harvest or a mature tree.
  if (stage === 0 && !repeat) {
    stem(x, y - 6, y);
    leaf(x, y - 5, -1);
    leaf(x + 1, y - 7, 1);
    rect(x + lean, y - 9, 2, 3, light);
    return `<g>${out.join('')}</g>`;
  }
  if (plot.kind === 8 || plot.kind === 9) {
    const tree = plot.kind === 9;
    const tall = stage === 1 ? 19 : tree ? 38 : 31;
    const top = y - tall;
    rect(x - 2, top + 9, 5, tall - 9, '#504338');
    rect(x - 1, top + 10, 2, tall - 10, '#92714a');
    rect(x - 1, y - 8, 1, 6, '#b19662');
    path(`M${x - 1} ${y - 10}h-3v-3h-4v-2h5v2h4z`, '#6f573e');
    if (stage === 1) {
      crown(x - 8, top, 16, 13);
      leaf(x - 4, y - 9, -1);
    } else {
      crown(x - 13, top + 5, 25, 17);
      crown(x - 9, top, 20, 17);
      crown(x - 3, top + 9, 17, 14);
      rect(x - 9, top + 10, 3, 2, light);
      rect(x + 5, top + 3, 2, 2, glint);
      if (!tree && ready) {
        for (const [dx, dy] of [[-8, 10], [3, 5], [7, 16], [-2, 18]]) {
          rect(x + dx, top + dy, 4, 4, '#923c3e');
          rect(x + dx, top + dy, 3, 3, '#cf6351');
          rect(x + dx, top + dy, 1, 1, '#f2b47a');
          rect(x + dx + 2, top + dy - 1, 1, 1, '#504338');
        }
      }
    }
  } else if (plot.kind === 7) {
    // Grapes grow on their own woody vine; no unsaved player-built trellis.
    const height = stage === 1 ? 16 : 28;
    path(`M${x - 1} ${y}v-${height - 5}h3v-5h2v7h-3v${height - 7}z`, '#806b47');
    for (const [dx, dy] of [[-6, 9], [3, 14], [-4, 20], [4, 26]]) {
      if (dy > height) continue;
      crown(x + dx - 4, y - dy, 10, 8);
    }
    if (ready) {
      for (const [dx, dy] of [[-6, 15], [4, 22], [3, 9]]) {
        rect(x + dx, y - dy, 5, 4, '#4e405d');
        rect(x + dx + 1, y - dy + 3, 3, 3, '#67577e');
        rect(x + dx, y - dy, 2, 2, '#a08baa');
        rect(x + dx + 3, y - dy + 1, 2, 2, '#83709e');
      }
    }
  } else if (plot.kind === 6) {
    const top = y - (stage === 1 ? 13 : 21);
    stem(x, top + 6, y);
    crown(x - 9, top + 5, 18, 12);
    crown(x - 6, top, 13, 13);
    if (ready) {
      for (const [dx, dy] of [[-7, 9], [-1, 3], [4, 10], [-2, 15]]) {
        rect(x + dx, top + dy, 3, 3, '#354b6d');
        rect(x + dx, top + dy, 2, 2, '#758aa0');
        rect(x + dx + 1, top + dy, 1, 1, '#a6b8c3');
      }
    }
  } else if (plot.kind === 5) {
    for (const [dx, dy, side] of [[-3, 4, -1], [1, 8, 1], [-1, 10, -1], [3, 3, 1]]) leaf(x + dx, y - dy, side);
    stem(x, y - 10, y);
    if (ready) {
      for (const [dx, dy] of [[-7, -3], [3, -6], [-1, -11]]) {
        rect(x + dx, y + dy, 4, 3, '#a94642');
        rect(x + dx + 1, y + dy + 3, 2, 1, '#7b3a3d');
        rect(x + dx, y + dy - 1, 4, 1, light);
        rect(x + dx + 1, y + dy, 1, 1, '#efb17a');
      }
    }
  } else {
    const height = stage === 1 ? 13 : plot.kind === 3 ? 25 : plot.kind === 4 ? 23 : 19;
    const stems = plot.kind === 3 ? [-5, 0, 5] : [-4, 3];
    for (let i = 0; i < stems.length; i++) {
      const xx = x + stems[i]!;
      const top = y - height + (i % 2 ? 3 : 0);
      stem(xx, top, y - (i ? 0 : 2));
      leaf(xx, y - 7, i % 2 ? 1 : -1);
      leaf(xx, y - 12, i % 2 ? -1 : 1);
      if (!ready) {
        if (stage === 2) rect(xx - 1, top - 2, 3, 3, light);
        continue;
      }
      if (plot.kind === 3) {
        // Lavender's narrow staggered florets remain recognisable at thumbnail scale.
        for (let j = 0; j < 4; j++) {
          rect(xx - 1 + j % 2, top - j * 2, 3, 2, j % 2 ? '#b5a4cd' : '#80688d');
          rect(xx - 1 + j % 2, top - j * 2, 1, 1, '#d3c4dc');
        }
      } else if (plot.kind === 4) {
        rect(xx - 3, top - 4, 6, 5, '#773f51');
        rect(xx - 2, top - 5, 5, 5, '#b85b69');
        rect(xx - 3, top - 3, 4, 3, '#dd8b88');
        rect(xx - 1, top - 4, 2, 2, '#f2b7a2');
        rect(xx, top - 2, 2, 2, '#8f4354');
      } else {
        const petal = plot.kind === 1 ? '#f0e8c6' : '#dc9a45';
        const shine = plot.kind === 1 ? '#fff5d9' : '#f2c46a';
        rect(xx - 3, top - 3, 7, 3, petal);
        rect(xx - 1, top - 5, 3, 7, petal);
        rect(xx - 2, top - 4, 5, 5, shine);
        rect(xx - 1, top - 3, 3, 3, '#af702f');
        rect(xx - 1, top - 3, 2, 2, '#eed276');
      }
    }
  }
  return `<g>${out.join('')}</g>`;
}
