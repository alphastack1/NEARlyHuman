import { roosterTraits, type RoosterPose } from '../../art/rooster';
import { BODY_CLASSIC, HEADGEAR_GRIDS, BEAK_ORANGE, PALETTE } from '../../art/rooster-data';

export const V2_ROOSTER_FRAME = { width: 40, height: 48, footX: 20, footY: 40 } as const;

/** Larger authored body, not a scaled copy: every outline and feather remains one world pixel. */
export function v2RoosterCanvas(seed: string, pose: RoosterPose): HTMLCanvasElement {
  const traits = roosterTraits(seed), grid = new Uint8Array(32 * 32);
  const dot = (x: number, y: number, color: number) => { if (x >= 0 && x < 32 && y >= 0 && y < 32) grid[y * 32 + x] = color; };
  const box = (x: number, y: number, w: number, h: number, color: number) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) dot(xx, yy, color); };
  const bodyRow = (y: number, left: number, right: number) => { box(left, y, right - left + 1, 1, 11); box(left + 1, y, right - left - 1, 1, traits.body); };

  // The original face, comb and accessory anchor keep each NFT's identity.
  for (let y = 0; y <= 10; y++) for (let x = 13; x < 24; x++) {
    const value = BODY_CLASSIC[y * 24 + x]!;
    if (value) dot(x + 2, y, value === 7 ? traits.body : value === 8 ? traits.wing : value);
  }
  for (let y = 11; y < 16; y++) bodyRow(y, 15, 20);

  // A one-pixel tail contour and fuller breast replace the old fractional scale.
  box(6, 12, 3, 1, 11);
  for (const [y, left, right] of [[13, 5, 9], [14, 4, 9], [15, 4, 10], [16, 4, 11], [17, 4, 10], [18, 5, 9]]) bodyRow(y!, left!, right!);
  box(5, 19, 3, 1, 11);
  for (const [y, left, right] of [[15, 14, 20], [16, 12, 20], [17, 10, 20], [18, 9, 20], [19, 9, 20], [20, 9, 20], [21, 9, 20], [22, 9, 20], [23, 9, 20], [24, 10, 20], [25, 11, 19]]) bodyRow(y!, left!, right!);
  box(12, 26, 7, 1, 11);

  const shift = pose === 'walk-a' ? 1 : pose === 'walk-b' ? -1 : 0;
  for (const x of [13, 17]) { box(x + shift, 27, 1, 2, 11); box(x - 1 + shift, 29, 3, 1, 6); }

  // The larger body has its own planted wing and reach poses at the same pixel pitch.
  if (pose === 'eat' || pose === 'preen') {
    box(16, 16, 3, 6, traits.wing); box(18, 12, 2, 6, traits.wing); box(19, 10, 2, 4, traits.wing);
  } else if (pose === 'garden') {
    box(16, 19, 3, 4, traits.wing); box(18, 22, 3, 2, traits.wing); box(20, 21, 1, 2, traits.wing);
  } else if (pose === 'repair' || pose === 'stretch') {
    box(16, 17, 3, 5, traits.wing); box(18, 15, 2, 4, traits.wing); box(19, 13, 2, 3, traits.wing);
  } else if (pose === 'use' || pose === 'treat' || pose === 'perk') {
    box(16, 18, 3, 4, traits.wing); box(18, 16, 3, 3, traits.wing); box(20, pose === 'treat' ? 16 : 17, 1, 2, traits.wing);
  } else {
    box(13, 19, 6, 4, traits.wing); box(14, 23, 5, 1, traits.wing); box(15, 24, 3, 1, traits.wing);
  }
  if (['blink', 'sleep', 'dead', 'preen', 'doze'].includes(pose)) dot(18, 7, 11);

  const accessory = HEADGEAR_GRIDS[traits.headgear]!;
  const neckwear = [13, 14, 23, 24, 25].includes(traits.headgear);
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
    const value = accessory[y * 24 + x]!;
    if (!value) continue;
    const yy = y + (neckwear || traits.headgear === 28 && y >= 11 ? 4 : 0);
    dot(x + 2, yy, value === 5 ? traits.accent : value);
    // The ghost sheet gets a straight native-pixel seam over the longer chest.
    if (traits.headgear === 28 && y === 11) box(x + 2, 11, 1, 4, value === 5 ? traits.accent : value);
  }
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) { const value = BEAK_ORANGE[y * 24 + x]!; if (value) dot(x + 2, y, value); }

  const canvas = document.createElement('canvas'); canvas.width = V2_ROOSTER_FRAME.width; canvas.height = V2_ROOSTER_FRAME.height;
  const context = canvas.getContext('2d')!; context.imageSmoothingEnabled = false;
  const bob = pose === 'walk-a' ? -1 : ['sleep', 'peek', 'garden', 'hurt'].includes(pose) ? 1 : 0;
  const lift = pose === 'peek' ? -2 : pose === 'breathe' || pose === 'perk' ? -1 : pose === 'doze' ? 1 : 0;
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const value = grid[y * 32 + x]!; if (value) { context.fillStyle = PALETTE[value]!; context.fillRect(x + 4, y + 10 + bob + (y < 26 ? lift : 0), 1, 1); } }
  if (lift < 0) for (let y = 36 + bob + lift; y < 36 + bob; y++) for (let x = 0; x < 32; x++) { const value = grid[25 * 32 + x]!; if (value) { context.fillStyle = PALETTE[value]!; context.fillRect(x + 4, y, 1, 1); } }
  return canvas;
}
