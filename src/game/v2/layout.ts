import { Op, type Receipt } from '../../v2/types';

export const TILE = 16, WORLD_WIDTH = 512, WORLD_HEIGHT = 832;
export interface Point { x: number; y: number }
export interface InspectTarget { kind: 'bed' | 'well' | 'workshop' | 'mailbox' | 'fixture'; index?: number; label?: string }
export const BEDS: readonly Point[] = [{ x: 376, y: 536 }, { x: 456, y: 536 }, { x: 376, y: 632 }, { x: 456, y: 632 }];
export const ANCHORS = {
  pantry: { x: 72, y: 89 }, stove: { x: 168, y: 89 }, counter: { x: 216, y: 89 }, window: { x: 136, y: 89 },
  bed: { x: 312, y: 137 }, seat: { x: 88, y: 345 }, chair: { x: 168, y: 345 }, wash: { x: 328, y: 329 },
  hall: { x: 248, y: 233 }, workshop: { x: 424, y: 345 }, well: { x: 280, y: 553 }, mailbox: { x: 408, y: 745 },
  garden: { x: 328, y: 601 }, doorway: { x: 328, y: 457 },
} satisfies Record<string, Point>;

const rooms = [[2, 2, 12, 10], [17, 2, 12, 10], [2, 13, 28, 3], [14, 15, 3, 12], [2, 17, 12, 9], [18, 17, 5, 5], [24, 17, 6, 9], [18, 23, 5, 4]];
const doors = [[8, 12], [22, 12], [8, 16], [20, 16], [26, 16], [17, 24], [20, 27]];
const solids = [[4, 3, 2, 2], [7, 3, 2, 2], [10, 3, 2, 2], [12, 3, 2, 2], [18, 3, 3, 4], [26, 3, 2, 2], [4, 19, 2, 2], [10, 20, 1, 1], [20, 18, 2, 2], [5, 8, 5, 2], [6, 3, 1, 2], [9, 3, 1, 2], [25, 18, 4, 2], [26, 44, 1, 2], [16, 31, 2, 3]];

export function walkable(x: number, y: number): boolean {
  const floor = rooms.some(([a, b, w, h]) => x >= a && y >= b && x < a! + w! && y < b! + h!) || doors.some(([a, b]) => x === a && y === b)
    || (x >= 2 && x < 30 && y >= 28 && y < 49) || (x >= 20 && x <= 21 && y === 49);
  if (!floor || solids.some(([a, b, w, h]) => x >= a! && y >= b! && x < a! + w! && y < b! + h!)) return false;
  return !BEDS.some(p => x >= Math.floor((p.x - 22) / TILE) && x <= Math.floor((p.x + 22) / TILE) && y >= Math.floor((p.y - 30) / TILE) && y <= Math.floor((p.y - 2) / TILE));
}

const tilePoint = (p: Point): Point => ({ x: Math.floor(p.x / TILE), y: Math.floor(p.y / TILE) });
const center = (p: Point): Point => ({ x: p.x * TILE + 8, y: p.y * TILE + 9 });
/** Presentation-only navigation. An unreachable destination never becomes a line through the house. */
export function findRoute(from: Point, to: Point): Point[] {
  const start = tilePoint(from), end = tilePoint(to), key = (p: Point) => p.y * 32 + p.x;
  if (!walkable(end.x, end.y)) return [];
  const queue = [start], seen = new Set([key(start)]), parents = new Map<number, number>();
  let found = false;
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i]!;
    if (p.x === end.x && p.y === end.y) { found = true; break; }
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const n = { x: p.x + dx!, y: p.y + dy! }, k = key(n);
      if (seen.has(k) || !walkable(n.x, n.y)) continue;
      seen.add(k); parents.set(k, key(p)); queue.push(n);
    }
  }
  if (!found) return [];
  const path: Point[] = []; let k = key(end);
  while (k !== key(start)) { path.push(center({ x: k % 32, y: Math.floor(k / 32) })); const next = parents.get(k); if (next === undefined) return []; k = next; }
  path.reverse();
  if (path.length) path[path.length - 1] = { ...to }; else if (Math.hypot(to.x - from.x, to.y - from.y) > .1) path.push({ ...to });
  return path;
}

export function bedApproach(index: number): Point { const bed = BEDS[index] || BEDS[0]!; return { x: bed.x, y: bed.y + 17 }; }

/** All anchors describe contact with the real fixture, never simulation choices. */
export function receiptStops(r: Receipt, here: Point): Point[] {
  if (r.events.some(e => e.kind === 'bedtime')) return [ANCHORS.bed];
  switch (r.op) {
    case Op.Quiet: case Op.QuietMain: return [];
    case Op.Pickup: case Op.Ship: return [ANCHORS.mailbox];
    case Op.Well: return [ANCHORS.well, ...r.before.plots.flatMap((p, i) => p.kind && p.moisture < 2 ? [bedApproach(i)] : [])];
    case Op.Plant: case Op.Abandon: case Op.RestoreSoil: case Op.CoverPlot: return [bedApproach(r.arg)];
    case Op.Harvest: return r.before.plots.flatMap((p, i) => p.kind && p.ticks === 0 ? [bedApproach(i)] : []);
    case Op.Shoo: case Op.Bait: case Op.CoverRain: return [ANCHORS.garden];
    case Op.Craft: case Op.BuildChair: case Op.BuildShelter: return [ANCHORS.workshop];
    case Op.Rest: return [ANCHORS.bed];
    case Op.Leisure: return [r.variant === 1 ? ANCHORS.garden : r.variant === 2 ? { x: 168, y: r.before.house.chairAnchor ? 393 : 345 } : ANCHORS.seat];
    case Op.Wash: return [r.arg === 7 ? ANCHORS.counter : ANCHORS.wash];
    case Op.Treat: return Math.hypot(here.x - ANCHORS.wash.x, here.y - ANCHORS.wash.y) < 140 ? [ANCHORS.wash] : [];
    case Op.Repair: case Op.Patch: return [r.arg === 0 ? ANCHORS.stove : r.arg === 1 ? ANCHORS.window : ANCHORS.chair];
    case Op.MoveChair: return [r.before.house.chairAnchor ? { x: 168, y: 393 } : ANCHORS.chair, r.snapshot.house.chairAnchor ? { x: 168, y: 393 } : ANCHORS.chair];
    case Op.BraceRain: return [ANCHORS.window];
    case Op.Tidy: case Op.DeepClean: case Op.Bowl: case Op.Sandwich: return [ANCHORS.counter];
    case Op.Toast: case Op.CookSteak: case Op.BackupHeat: case Op.Douse: case Op.Shutdown: return [ANCHORS.stove];
    case Op.Coffee: return [r.variant === 2 ? ANCHORS.stove : ANCHORS.counter];
    case Op.Breakfast: case Op.Eat: case Op.RawSteak: return [ANCHORS.pantry];
    case Op.Drink: return [ANCHORS.pantry];
    case Op.EnjoyFlower: return [];
    default: return [];
  }
}
