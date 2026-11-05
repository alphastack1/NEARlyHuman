import { canvasArt, type Paint } from '../art/pixels';
import { drawRug } from '../art/house';
import { DOOR_OPENINGS, HOUSE_ROOMS, HOUSE_WALLS, TILE } from './layout';

const hash = (x: number, y: number, seed: number) => { let h = Math.imul(x + 17, 374761393) ^ Math.imul(y + 31, 668265263) ^ seed; h = Math.imul(h ^ h >>> 13, 1274126177); return (h ^ h >>> 16) >>> 0; };
export function roomFloor(p: Paint, x: number, y: number, w: number, h: number, seed: number): void {
  p('#b88248', x, y, w, h);
  for (let ry = 0; ry < h; ry += 6) for (let rx = -Math.floor((y + ry) / 6) % 2 * 16; rx < w; rx += 32) {
    const n = hash(x + rx, y + ry, seed), a = Math.max(0, rx), right = Math.min(w, rx + 32), height = Math.min(6, h - ry);
    const woods = [['#ddb071', '#e3b879', '#e8bd80', '#deb174'], ['#dbae6c', '#e2b575', '#e7bc7b', '#ddb171'], ['#dfb476', '#e5bc7d', '#e8c185', '#e0b577']][(seed >>> 6) % 3]!;
    p(woods[n % 4]!, x + a, y + ry, right - a, height); p('#f0c78b', x + a, y + ry, right - a, 1); p('#c6965b', x + a, y + ry + height - 1, right - a, 1);
    if (rx >= 0) p('#ce9f61', x + rx, y + ry, 1, height);
    const gx = rx + 4 + ((n >>> 8) % 16); if (gx >= 0 && gx + 7 < w && height > 3) p('#d8a86a', x + gx, y + ry + 3, 7, 1);
  }
}
/** The cutaway shell and pathfinder consume the same wall and doorway rectangles. */
export function houseShell(seed: number): HTMLCanvasElement {
  return canvasArt(512, 440, p => {
    p('#62452f', 0, 0, 512, 440);
    for (let y = 0; y < 440; y += TILE) for (let x = 0; x < 512; x += TILE) { p('#7a5636', x + 1, y + 1, 14, 14); p('#956b40', x + 1, y + 1, 14, 1); }
    for (const r of HOUSE_ROOMS) roomFloor(p, r.x * TILE, r.y * TILE, r.w * TILE, r.h * TILE, seed);
    for (const r of HOUSE_WALLS) {
      p('#3a2e25', r.x, r.y, r.w, r.h);
      if (r.h >= 24 && r.w > 8) {
        p('#795033', r.x + 2, r.y + 2, r.w - 4, r.h - 3); p('#bc9159', r.x + 2, r.y + 2, r.w - 4, 2);
        p('#e9d9aa', r.x + 4, r.y + 5, r.w - 8, r.h - 8); p('#f5e7bc', r.x + 5, r.y + 6, r.w - 10, r.h - 11); p('#d0ba8a', r.x + 5, r.y + r.h - 7, r.w - 10, 2);
        for (let x = r.x + 7; x < r.x + r.w - 8; x += 11) p('#e8d8ab', x, r.y + 7 + hash(x, r.y, seed) % Math.max(1, r.h - 17), 1, 2);
      } else if (r.w <= 8) { p('#795034', r.x + 2, r.y, Math.max(1, r.w - 4), r.h - 2); p('#bc8d51', r.x + 2, r.y + 1, 1, r.h - 4); }
      else { p('#79502f', r.x + 2, r.y + 2, r.w - 4, Math.max(1, r.h - 4)); p('#b58247', r.x + 3, r.y + 2, r.w - 6, 1); }
    }
    clearDoorways(p, seed);
    drawRug(p, 37, 214, 145, 25, seed); drawRug(p, 291, 62, 17, 59, seed); drawRug(p, 36, 113, 17, 66, seed); drawRug(p, 163, 129, 45, 44, seed);
  });
}
/** Run after scenery paint as well: a roof or textile must not seal a real opening. */
export function clearDoorways(p: Paint, seed: number): void {
  for (const r of DOOR_OPENINGS) roomFloor(p, r.x, r.y, r.w, r.h, seed);
}
