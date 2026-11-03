import { Op, type Receipt } from '../../v2/types';

export const TILE = 16, WORLD_WIDTH = 512, WORLD_HEIGHT = 832;
export interface Point { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }
export interface InspectTarget { kind: 'bed' | 'well' | 'workshop' | 'mailbox' | 'fixture'; index?: number; label?: string }
export const BEDS: readonly Point[] = [{ x: 376, y: 536 }, { x: 456, y: 536 }, { x: 376, y: 632 }, { x: 456, y: 632 }];
export const ANCHORS = {
  pantry: { x: 72, y: 89 }, stove: { x: 168, y: 89 }, counter: { x: 216, y: 89 }, window: { x: 136, y: 89 },
  bed: { x: 312, y: 137 }, seat: { x: 88, y: 345 }, chair: { x: 168, y: 345 }, wash: { x: 328, y: 329 },
  hall: { x: 248, y: 233 }, workshop: { x: 424, y: 329 }, well: { x: 280, y: 553 }, mailbox: { x: 408, y: 745 },
  garden: { x: 328, y: 601 }, doorway: { x: 328, y: 457 },
} satisfies Record<string, Point>;

/** The same shell defines the visible V2 house and its navigation. */
export const HOUSE_ROOMS = [
  { id: 'kitchen', x: 2, y: 2, w: 12, h: 10 }, { id: 'bedroom', x: 17, y: 2, w: 12, h: 10 },
  { id: 'hall', x: 2, y: 13, w: 28, h: 3 }, { id: 'connector', x: 14, y: 15, w: 3, h: 12 },
  { id: 'living', x: 2, y: 17, w: 12, h: 9 }, { id: 'wash', x: 18, y: 17, w: 5, h: 5 },
  { id: 'workshop', x: 24, y: 17, w: 6, h: 9 }, { id: 'entry', x: 18, y: 23, w: 5, h: 4 },
] as const;
export const HOUSE_DOORS = [
  { x: 8, y: 12, side: false }, { x: 22, y: 12, side: false }, { x: 8, y: 16, side: false },
  { x: 20, y: 16, side: false }, { x: 26, y: 16, side: false }, { x: 17, y: 24, side: true }, { x: 20, y: 27, side: false },
] as const;
export const DOOR_OPENINGS: readonly Rect[] = HOUSE_DOORS.map(d => d.side
  ? { x: d.x * TILE - 3, y: d.y * TILE, w: 30, h: TILE }
  : { x: d.x * TILE, y: d.y * TILE - 3, w: TILE, h: 30 });
export const HOUSE_WALLS: readonly Rect[] = HOUSE_ROOMS.flatMap(room => {
  if (room.id === 'hall' || room.id === 'connector') return [];
  const x = room.x * TILE, y = room.y * TILE, w = room.w * TILE, h = room.h * TILE;
  if (room.id === 'workshop') return [{ x: x - 1, y: y - 7, w: w + 3, h: 11 }, { x: x + w - 2, y, w: 5, h: h + 1 }];
  return [{ x: x - 8, y: y - 16, w: w + 16, h: 24 }, { x: x - 8, y: y + 8, w: 8, h: h - 2 },
    { x: x + w, y: y + 8, w: 8, h: h - 2 }, { x: x - 8, y: y + h - 2, w: w + 16, h: 8 }];
});
const inside = (x: number, y: number, r: Rect) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
export function wallAt(x: number, y: number): boolean {
  return !DOOR_OPENINGS.some(r => inside(x, y, r)) && HOUSE_WALLS.some(r => inside(x, y, r));
}
const solids = [[4, 3, 2, 2], [7, 3, 2, 2], [10, 3, 2, 2], [12, 3, 2, 2], [18, 3, 3, 4], [26, 3, 2, 2],
  [4, 19, 2, 2], [20, 18, 2, 2], [5, 8, 5, 2], [6, 3, 1, 2], [9, 3, 1, 2], [25, 18, 4, 2], [26, 44, 1, 2], [16, 31, 2, 3]];
export interface NavigationHouse { chairLife: number; chairAnchor: number }
export function floorTile(x: number, y: number): boolean {
  return HOUSE_ROOMS.some(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h)
    || HOUSE_DOORS.some(d => x === d.x && y === d.y)
    || (x >= 2 && x < 30 && y >= 28 && y < 49) || (x >= 20 && x <= 21 && y === 49);
}
function clearFoot(x: number, y: number): boolean { return [-3, 0, 3].every(dx => [-1, 0, 1].every(dy => !wallAt(x + dx, y + dy))); }
export function walkable(x: number, y: number, house?: NavigationHouse): boolean {
  if (!floorTile(x, y) || !clearFoot(x * TILE + 8, y * TILE + 9)) return false;
  if (solids.some(([a, b, w, h]) => x >= a! && y >= b! && x < a! + w! && y < b! + h!)) return false;
  if (house?.chairLife && x === 10 && y === (house.chairAnchor ? 23 : 20)) return false;
  return !BEDS.some(p => x >= Math.floor((p.x - 22) / TILE) && x <= Math.floor((p.x + 22) / TILE)
    && y >= Math.floor((p.y - 30) / TILE) && y <= Math.floor((p.y - 2) / TILE));
}
/** Pixel-segment checks prevent corner cutting between otherwise valid floor tiles. */
export function clearRouteSegment(from: Point, to: Point): boolean {
  const count = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y)));
  for (let i = 0; i <= count; i++) if (!clearFoot(from.x + (to.x - from.x) * i / count, from.y + (to.y - from.y) * i / count)) return false;
  return true;
}
const tilePoint = (p: Point): Point => ({ x: Math.floor(p.x / TILE), y: Math.floor(p.y / TILE) });
const center = (p: Point): Point => ({ x: p.x * TILE + 8, y: p.y * TILE + 9 });
/** Unreachable contacts fail closed. Every returned segment uses real openings. */
export function findRoute(from: Point, to: Point, house?: NavigationHouse): Point[] {
  const start = tilePoint(from), end = tilePoint(to), key = (p: Point) => p.y * 32 + p.x;
  if (!walkable(start.x, start.y, house) || !walkable(end.x, end.y, house)) return [];
  const queue = [start], seen = new Set([key(start)]), parents = new Map<number, number>(); let found = false;
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i]!; if (p.x === end.x && p.y === end.y) { found = true; break; }
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const n = { x: p.x + dx!, y: p.y + dy! }, k = key(n);
      if (seen.has(k) || !walkable(n.x, n.y, house) || !clearRouteSegment(center(p), center(n))) continue;
      seen.add(k); parents.set(k, key(p)); queue.push(n);
    }
  }
  if (!found) return [];
  const path: Point[] = []; let k = key(end);
  while (k !== key(start)) { path.push(center({ x: k % 32, y: Math.floor(k / 32) })); const next = parents.get(k); if (next === undefined) return []; k = next; }
  path.reverse(); let previous = from;
  for (const p of path) { if (!clearRouteSegment(previous, p)) return []; previous = p; }
  if (Math.hypot(to.x - previous.x, to.y - previous.y) > .1) { if (!clearRouteSegment(previous, to)) return []; path.push({ ...to }); }
  return path;
}
export function bedApproach(index: number): Point { const bed = BEDS[index] || BEDS[0]!; return { x: bed.x, y: bed.y + 17 }; }
/** All contacts are presentation targets, never simulation choices. */
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
    case Op.Breakfast: case Op.Eat: case Op.RawSteak: case Op.Drink: return [ANCHORS.pantry];
    case Op.EnjoyFlower: return [];
    default: return [];
  }
}
