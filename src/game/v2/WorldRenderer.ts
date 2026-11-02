import Phaser from 'phaser';
import { fixtureCanvas, FIXTURE_SIZES, type FixtureArt, type ArtOptions } from '../../art/fixtures';
import { PROP_URLS } from '../../art/asset-urls';
import { roosterCanvas, ROOSTER_FRAME, type RoosterPose } from '../../art/rooster';
import { Op, type State, type Receipt } from '../../v2/types';
import { v2Personality } from '../../v2/personality';
import { PLANTS, RECIPES } from '../../v2/catalog';
import { landscape, bedArt, itemArt, wellArt, workbenchArt } from './art';
import { WORLD_WIDTH, WORLD_HEIGHT, BEDS, ANCHORS, findRoute, receiptStops, type Point, type InspectTarget } from './layout';
import { openingEase, openingTileTime } from '../opening';

export type { InspectTarget } from './layout';
export interface V2WorldOptions { state: State; onInspect?: (target: InspectTarget) => void; onMotion?: (motion: { traveling: boolean }) => void }
export interface V2WorldController {
  ready: Promise<void>;
  setState(state: State, options?: { receipt?: Receipt; slot?: number; history?: readonly Receipt[] }): void;
  playReceipt(receipt: Receipt, options?: { duration?: number; onImpact?: () => void }): Promise<void>;
  setPaused(paused: boolean): void;
  setInputEnabled(enabled: boolean): void;
  setOpening(phase: 'assembling' | 'title' | 'leaving' | 'closed'): void;
  setViewportInsets(top: number, bottom: number, left?: number, right?: number): void;
  focus(target: InspectTarget): void;
  followActor(): void;
  resize(): void;
  destroy(): void;
}
interface Fixture { kind: FixtureArt; image: Phaser.GameObjects.Image; x: number; y: number; key: string }
interface Film {
  receipt: Receipt; stops: Point[]; stop: number; route: Point[]; phase: 'travel' | 'contact' | 'work' | 'home';
  elapsed: number; work: number; impact: boolean; bedEntered?: boolean; onImpact?: () => void; resolve: () => void;
}
const POSES: RoosterPose[] = ['idle', 'breathe', 'preen', 'stretch', 'perk', 'doze', 'peek', 'walk-a', 'walk-b', 'blink', 'sleep', 'use', 'eat', 'treat', 'garden', 'repair', 'hurt', 'dead'];
const GARDEN_OPS = new Set([Op.Plant, Op.Harvest, Op.Well, Op.RestoreSoil, Op.Abandon, Op.CoverPlot, Op.BuildShelter]);
const FOOD_OPS = new Set([Op.Breakfast, Op.Eat, Op.Drink, Op.Coffee, Op.Toast, Op.CookSteak, Op.Bowl, Op.Sandwich, Op.RawSteak]);
const WORK_OPS = new Set([Op.Repair, Op.Patch, Op.Craft, Op.BuildChair, Op.BuildShelter, Op.MoveChair, Op.BraceRain]);
const pickedUpGoods = (r: Receipt) => r.snapshot.inventory.some((n, i) => n > r.before.inventory[i]!);

/** V2 is a film of canonical receipts. No reward, care, inventory or randomness is decided here. */
class LifeScene extends Phaser.Scene {
  private state: State;
  private initialized = false;
  private fixtures: Fixture[] = [];
  private plots: Phaser.GameObjects.Image[] = [];
  private covers: Phaser.GameObjects.Image[] = [];
  private plotKeys: string[] = [];
  private actor!: Phaser.GameObjects.Image;
  private shadow!: Phaser.GameObjects.Ellipse;
  private held!: Phaser.GameObjects.Image;
  private blanket!: Phaser.GameObjects.Image;
  private foreground!: Phaser.GameObjects.Graphics;
  private marks!: Phaser.GameObjects.Graphics;
  private effects!: Phaser.GameObjects.Graphics;
  private ambient!: Phaser.GameObjects.Graphics;
  private night!: Phaser.GameObjects.Rectangle;
  private lampGlow!: Phaser.GameObjects.Graphics;
  private point: Point = { x: 312, y: 79 };
  private cameraPoint: Point = { x: 312, y: 79 };
  private film?: Film;
  private paused = false;
  private interactionEnabled = true;
  private openingPhase: 'assembling' | 'title' | 'leaving' | 'closed' = 'closed';
  private openingSince = 0;
  private openingMask!: Phaser.GameObjects.Graphics;
  private elapsed = 0;
  private facing = 1;
  private widthLogical = 256;
  private heightLogical = 480;
  private cssScale = 1;
  private insets = { top: 0, bottom: 0, left: 0, right: 0 };
  private focusPoint?: Point;
  private dragging?: { x: number; y: number; camera: Point; moved: boolean };
  private carrying = -1;
  private lastTraveling = false;
  private selected?: { target: InspectTarget; until: number };
  private attention = 0;
  private timeSlot = 0;
  private sleeping = true;
  private rainUntil = 0;
  private visitorUntil = 0;
  private visitorBed = 0;
  private textureSerial = 0;
  private roosterSeed = '';
  private pending?: () => void;
  constructor(private options: V2WorldOptions, private resolveReady: () => void) { super({ key: 'nearlyhuman-v2-life' }); this.state = options.state; }

  preload(): void { for (const [kind, url] of Object.entries(PROP_URLS)) this.load.image(`v2-asset-${kind}`, url); }
  create(): void {
    this.textures.addCanvas('v2-landscape', landscape(this.state.seed)); this.add.image(0, 0, 'v2-landscape').setOrigin(0).setDepth(-100);
    const prop = (kind: FixtureArt, x: number, y: number, target?: InspectTarget, opts: ArtOptions = {}) => this.addFixture(kind, x, y, target, opts);
    prop('window', 136, 48, { kind: 'fixture', label: 'Window', index: 1 });
    prop('fridge', 72, 80, { kind: 'fixture', label: 'Pantry', index: 3 }); prop('pantry', 120, 80);
    const counter = this.add.graphics().setDepth(50); counter.fillStyle(0x60442d).fillRect(82, 53, 143, 28); counter.fillStyle(0xa77946).fillRect(84, 55, 139, 23); counter.fillStyle(0xd5a76b).fillRect(84, 55, 139, 3);
    prop('stove', 176, 80, { kind: 'fixture', label: 'Stove', index: 0 }); prop('prep', 208, 80, { kind: 'fixture', label: 'Kitchen counter', index: 4 });
    prop('plant', 47, 87); prop('shelf', 207, 37); prop('table', 124, 160); prop('plant', 56, 183);
    prop('bed', 312, 112, { kind: 'fixture', label: 'Bed', index: 5 }); prop('bedside', 354, 101); prop('cupboard', 432, 80, { kind: 'fixture', label: 'Supplies', index: 6 });
    prop('plant', 395, 79); prop('painting', 284, 48); prop('painting', 449, 153); prop('shelf', 345, 177);
    prop('baseSeat', 80, 336, { kind: 'fixture', label: 'Armchair', index: 7 }); prop('plant', 115, 323); prop('painting', 69, 292); prop('painting', 172, 292); prop('plant', 193, 379);
    prop('chair', 168, 336, { kind: 'fixture', label: 'Handmade chair', index: 2 }); prop('sink', 336, 320, { kind: 'fixture', label: 'Washroom', index: 8 }); prop('plant', 301, 327); prop('painting', 335, 280);
    prop('plant', 304, 402); prop('shelf', 434, 287); prop('plant', 470, 406);
    this.textures.addCanvas('v2-bench', workbenchArt()); this.add.image(432, 323, 'v2-bench').setOrigin(.5, 1).setDepth(323).setInteractive().on('pointerup', (pointer: Phaser.Input.Pointer) => this.inspect({ kind: 'workshop', label: 'Workshop' }, pointer));
    this.textures.addCanvas('v2-well', wellArt()); this.add.image(280, 536, 'v2-well').setOrigin(.5, 1).setDepth(536).setInteractive().on('pointerup', (pointer: Phaser.Input.Pointer) => this.inspect({ kind: 'well', label: 'Well' }, pointer));
    prop('mailbox', 424, 728, { kind: 'mailbox', label: 'Mailbox' });
    for (let i = 0; i < 4; i++) {
      const p = BEDS[i]!; const key = `v2-plot-initial-${i}`; this.textures.addCanvas(key, bedArt(this.state.plots[i]!)); this.plotKeys[i] = key;
      this.plots[i] = this.add.image(p.x, p.y + 3, key).setOrigin(.5, 1).setDepth(p.y).setInteractive(new Phaser.Geom.Rectangle(6, 17, 52, 70), Phaser.Geom.Rectangle.Contains).on('pointerup', (pointer: Phaser.Input.Pointer) => this.inspect({ kind: 'bed', index: i, label: `Garden bed ${i + 1}` }, pointer));
      this.covers[i] = this.add.image(p.x + 8, p.y - 15, this.fixtureTexture('umbrella', {})).setOrigin(.5, 1).setDepth(p.y + 5).setVisible(false);
    }
    this.foreground = this.add.graphics(); this.effects = this.add.graphics().setDepth(950); this.ambient = this.add.graphics().setDepth(960); this.marks = this.add.graphics().setDepth(970);
    this.shadow = this.add.ellipse(this.point.x, this.point.y + 1, 20, 6, 0x342f28, .25);
    this.actor = this.add.image(this.point.x, this.point.y, this.roosterTexture('idle')).setOrigin(ROOSTER_FRAME.footX / ROOSTER_FRAME.width, ROOSTER_FRAME.footY / ROOSTER_FRAME.height).setScale(1.4).setInteractive();
    this.actor.on('pointerup', (pointer: Phaser.Input.Pointer) => { if (this.allowPointer(pointer) && !this.dragging?.moved) this.attention = this.elapsed + 1400; });
    this.held = this.add.image(0, 0, this.itemTexture(6)).setVisible(false).setScale(1.1);
    this.blanket = this.add.image(312, 112, this.fixtureTexture('bedCover', {})).setOrigin(.5, 1).setDepth(115).setScale(1.2).setVisible(true);
    this.night = this.add.rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x172439, 1).setOrigin(0).setDepth(1000).setAlpha(0);
    this.openingMask = this.add.graphics().setDepth(1200);
    this.lampGlow = this.add.graphics().setDepth(1001);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (this.allowPointer(p)) this.dragging = { x: p.x, y: p.y, camera: { ...this.cameraPoint }, moved: false }; });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const d = this.dragging; if (!this.interactionEnabled || !p.isDown || !d || this.film && !this.paused) return;
      if (Math.hypot(p.x - d.x, p.y - d.y) > 5) d.moved = true;
      if (d.moved) this.focusPoint = this.clampCamera({ x: d.camera.x - (p.x - d.x) / this.cameras.main.zoom, y: d.camera.y - (p.y - d.y) / this.cameras.main.zoom });
    });
    this.input.on('pointerup', () => { queueMicrotask(() => { this.dragging = undefined; }); });
    this.input.on('pointerupoutside', () => { this.dragging = undefined; });
    this.input.enabled = this.interactionEnabled;
    this.initialized = true; this.applyState(this.state); this.resizeWorld(this.widthLogical, this.heightLogical, this.cssScale); this.resolveReady(); this.pending?.(); this.pending = undefined;
  }

  private fixtureTexture(kind: FixtureArt, opts: ArtOptions): string {
    const key = `v2-fixture-${kind}-${JSON.stringify(opts)}`; if (this.textures.exists(key)) return key;
    const asset = kind === 'pantry' ? 'prep' : kind === 'bedCover' ? 'bed' : kind;
    if (this.textures.exists(`v2-asset-${asset}`) && !opts.damaged && !opts.patched && !opts.open) {
      if (kind !== 'bedCover') return `v2-asset-${asset}`;
      const source = this.textures.get(`v2-asset-${asset}`).getSourceImage() as HTMLImageElement, c = document.createElement('canvas'); c.width = source.width; c.height = source.height;
      const ctx = c.getContext('2d')!; ctx.drawImage(source, 0, 0); ctx.clearRect(0, 0, c.width, 25); this.textures.addCanvas(key, c); return key;
    }
    this.textures.addCanvas(key, fixtureCanvas(kind, opts)); return key;
  }
  private addFixture(kind: FixtureArt, x: number, y: number, target?: InspectTarget, opts: ArtOptions = {}): void {
    const key = this.fixtureTexture(kind, opts), [width] = FIXTURE_SIZES[kind];
    if (!['window', 'shelf', 'painting', 'bedCover'].includes(kind)) this.add.ellipse(x + 1, y, width * .9, Math.max(3, width * .15), 0x44392b, .2).setDepth(y - 1);
    const image = this.add.image(x, y, key).setOrigin(.5, 1).setDepth(kind === 'window' ? 12 : y); if (kind === 'bed') image.setScale(1.2);
    if (target) image.setInteractive(new Phaser.Geom.Rectangle(-3, -3, image.width + 6, image.height + 8), Phaser.Geom.Rectangle.Contains).on('pointerup', (pointer: Phaser.Input.Pointer) => this.inspect(target, pointer));
    this.fixtures.push({ kind, image, x, y, key });
  }
  private roosterTexture(pose: RoosterPose): string {
    if (this.roosterSeed !== this.state.seed) { this.roosterSeed = this.state.seed; for (const p of POSES) { const key = `v2-rooster-${p}`; if (this.textures.exists(key)) this.textures.remove(key); this.textures.addCanvas(key, roosterCanvas(this.state.seed, p)); } }
    return `v2-rooster-${pose}`;
  }
  private itemTexture(index: number): string { const key = `v2-item-${index}`; if (!this.textures.exists(key)) this.textures.addCanvas(key, itemArt(index)); return key; }
  private allowPointer(pointer: Phaser.Input.Pointer): boolean { return this.interactionEnabled && pointer.event?.target === this.game.canvas; }
  private inspect(target: InspectTarget, pointer: Phaser.Input.Pointer): void { if (!this.allowPointer(pointer) || this.dragging?.moved) return; this.selected = { target, until: this.elapsed + 900 }; this.options.onInspect?.(target); }
  private replaceBed(index: number, state = this.state.plots[index]!): void {
    const key = `v2-plot-${index}-${++this.textureSerial}`, previous = this.plotKeys[index]; this.textures.addCanvas(key, bedArt(state)); this.plots[index]!.setTexture(key); this.plotKeys[index] = key;
    if (previous) this.textures.remove(previous);
  }
  private applyState(state: State): void {
    const before = this.state; this.state = state; if (!this.initialized) return;
    for (let i = 0; i < 4; i++) { if (!before || JSON.stringify(before.plots[i]) !== JSON.stringify(state.plots[i]) || this.textureSerial === 0) this.replaceBed(i); this.covers[i]!.setVisible(!!state.house.umbrellaLife[i]); }
    for (const f of this.fixtures) {
      let opts: ArtOptions = {};
      if (f.kind === 'stove') opts = { damaged: !!(state.house.damage & 1), patched: !!state.house.stovePatch };
      if (f.kind === 'window') opts = { damaged: !!(state.house.damage & 2), braced: state.house.windowBrace };
      if (f.kind === 'chair') { opts = { damaged: !!(state.house.damage & 4), braced: state.house.chairBrace }; f.image.setVisible(state.house.chairLife > 0); f.image.setY(state.house.chairAnchor ? 384 : f.y).setDepth(state.house.chairAnchor ? 384 : f.y); }
      const key = this.fixtureTexture(f.kind, opts); if (key !== f.key) { f.image.setTexture(key); f.key = key; }
    }
    this.drawInventory();
  }
  private drawInventory(): void {
    const g = this.foreground; g.clear().setDepth(381); const px = (c: number, x: number, y: number, w: number, h: number) => g.fillStyle(c).fillRect(x, y, w, h);
    for (let i = 0; i < Math.min(12, this.state.inventory[6] || 0); i++) { const x = 402 + i % 4 * 9, y = 375 - Math.floor(i / 4) * 6; px(0x62452d, x, y, 12, 6); px(0xba9155, x + 1, y, 10, 4); px(0xe0bc7b, x + 1, y + 1, 3, 3); px(0x7e5b36, x + 5, y + 1, 4, 1); }
    for (let i = 0; i < 4; i++) if (this.state.inventory[30 + i]) { const key = `v2-display-${i}`; const old = this.children.getByName(key) as Phaser.GameObjects.Image | null; if (!old) this.add.image(404 + i * 17, 287, this.itemTexture(30 + i)).setOrigin(.5, 1).setDepth(288).setName(key); } else this.children.getByName(`v2-display-${i}`)?.destroy();
    if (this.state.house.shelterLife) { px(0x51412e, 349, 477, 3, 195); px(0x51412e, 478, 477, 3, 195); px(0xc7bc8b, 350, 477, 130, 3); for (let x = 354; x < 478; x += 9) px(0xb5ae7b, x, 478, 3, 7); }
    if (this.state.house.mess) { for (let i = 0; i < Math.min(10, this.state.house.mess); i++) { const x = 101 + i * 17 % 103, y = 100 + i * 29 % 73; px(0x9a7750, x, y, 3, 2); px(0xb48c55, x + 3, y + 1, 2, 1); } }
  }

  setState(state: State, options: { receipt?: Receipt; slot?: number; history?: readonly Receipt[] } = {}): void {
    this.cancelFilm(); if (!this.initialized) { this.state = state; return; }
    const different = state.seed !== this.state.seed; this.applyState(state); this.focusPoint = undefined; this.carrying = -1;
    if (different) { this.point = { x: 312, y: 79 }; this.roosterTexture('idle'); }
    // An explicit film seek may jump. Ordinary receipt playback always walks its route.
    const history = options.history || (options.receipt ? [options.receipt] : []);
    if (options.history || options.slot === 0) { this.point = { x: 312, y: 79 }; this.sleeping = true; this.rainUntil = 0; this.visitorUntil = 0; }
    for (const r of history) {
      for (const e of r.events) { if (e.source === 'rain') this.rainUntil = Math.ceil((r.slot + 1) / 10) * 10; if (e.source === 'seedEater' || e.source === 'visitor') { this.visitorUntil = Math.ceil((r.slot + 1) / 10) * 10; this.visitorBed = Math.min(3, e.target); } }
      if ((r.op === Op.Shoo || r.op === Op.Bait) && r.success) this.visitorUntil = 0;
      if (r.op === Op.Rest || r.events.some(e => e.kind === 'bedtime')) { this.point = { x: 312, y: 79 }; this.sleeping = true; }
      else {
        const last = receiptStops(r, this.point).at(-1); if (last) this.point = { ...last };
        if (r.op === Op.Pickup && pickedUpGoods(r)) this.point = { ...ANCHORS.pantry };
        if (r.op !== Op.Quiet) this.sleeping = false;
      }
    }
    if (options.slot !== undefined) this.timeSlot = options.slot;
    this.blanket.setVisible(this.point.y < 114 && this.point.x > 286 && this.point.x < 332); this.centerCamera(1);
  }
  private cancelFilm(): void { const film = this.film; this.film = undefined; this.motion(false); if (film) film.resolve(); }
  play(receipt: Receipt, options: { duration?: number; onImpact?: () => void } = {}): Promise<void> {
    return new Promise(resolve => {
      const begin = () => {
        this.cancelFilm(); this.paused = false; this.focusPoint = undefined; this.sleeping = this.sleeping && receipt.op === Op.Quiet; this.blanket.setVisible(this.sleeping); this.timeSlot = receipt.slot; this.applyState(receipt.before);
        for (const e of receipt.events) { if (e.source === 'rain') this.rainUntil = Math.ceil((receipt.slot + 1) / 10) * 10; if (e.source === 'seedEater' || e.source === 'visitor') { this.visitorUntil = Math.ceil((receipt.slot + 1) / 10) * 10; this.visitorBed = Math.min(3, e.target); } }
        this.carrying = receipt.op === Op.Ship ? 34 : receipt.op === Op.Plant ? 12 + receipt.variant : receipt.op === Op.Craft ? 6 : receipt.op === Op.Well ? 36 : -1;
        const work = options.duration ?? (receipt.role === 'main' ? 2500 : receipt.op === Op.Quiet ? 650 : 1150);
        this.film = { receipt, stops: receiptStops(receipt, this.point), stop: 0, route: [], phase: 'travel', elapsed: 0, work: Math.max(250, work), impact: false, onImpact: options.onImpact, resolve };
        if (receipt.op === Op.Pickup) this.mailbox(pickedUpGoods(receipt));
        this.planLeg();
      };
      if (this.initialized) begin(); else { const previous = this.pending; this.pending = () => { previous?.(); begin(); }; }
    });
  }
  private planLeg(): void {
    const f = this.film; if (!f) return;
    const target = f.stops[f.stop], leavingBed = this.point.x > 286 && this.point.x < 333 && this.point.y < 116;
    f.route = target ? leavingBed ? [{ x: 312, y: 121 }, ...findRoute({ x: 312, y: 121 }, target)] : findRoute(this.point, target) : [];
    if (target && !f.route.length && Math.hypot(target.x - this.point.x, target.y - this.point.y) > 2) {
      // Keep the actor where it is if a future map change makes a contact inaccessible.
      // The canonical receipt still plays; a visual failure can never invent another game outcome.
      console.warn('V2 presentation anchor is inaccessible', target);
    }
    f.phase = f.route.length ? 'travel' : 'contact'; f.elapsed = 0; this.motion(!!f.route.length);
  }
  private mailbox(open: boolean): void { const p = this.fixtures.find(f => f.kind === 'mailbox'); if (p) { const key = this.fixtureTexture('mailbox', { open, parcel: open }); p.image.setTexture(key); p.key = key; } }
  private impact(): void {
    const f = this.film; if (!f || f.impact) return; f.impact = true; this.applyState(f.receipt.snapshot); f.onImpact?.();
    if (f.receipt.op === Op.Pickup) { this.mailbox(false); this.carrying = pickedUpGoods(f.receipt) ? 34 : -1; }
    else if (f.receipt.op === Op.Craft) this.carrying = RECIPES[f.receipt.arg]?.output ?? -1;
    else if (f.receipt.op === Op.Harvest) { const p = f.receipt.before.plots.find(p => p.kind && !p.ticks); this.carrying = p ? PLANTS[p.kind]?.output ?? -1 : -1; }
    else if (f.receipt.op === Op.Ship) { this.mailbox(true); this.carrying = -1; }
    if ((f.receipt.op === Op.Shoo || f.receipt.op === Op.Bait) && f.receipt.success) this.visitorUntil = 0;
  }
  private finish(): void { const f = this.film; if (!f) return; this.impact(); this.film = undefined; this.carrying = -1; this.motion(false); f.resolve(); }
  private motion(traveling: boolean): void { if (traveling !== this.lastTraveling) { this.lastTraveling = traveling; this.options.onMotion?.({ traveling }); } }
  setPaused(paused: boolean): void { this.paused = paused; this.motion(!!this.film && (this.film.phase === 'travel' || this.film.phase === 'home') && !paused); }
  setInputEnabled(enabled: boolean): void { this.interactionEnabled = enabled; if (this.input) this.input.enabled = enabled; if (!enabled) this.dragging = undefined; }
  setOpening(phase: 'assembling' | 'title' | 'leaving' | 'closed'): void { if (phase !== this.openingPhase) { this.openingPhase = phase; this.openingSince = this.elapsed; } }
  setInsets(top: number, bottom: number, left = 0, right = 0): void { this.insets = { top, bottom, left, right }; if (this.initialized) this.centerCamera(1); }
  resizeWorld(width: number, height: number, scale: number): void { this.widthLogical = width; this.heightLogical = height; this.cssScale = scale; if (this.initialized) { this.cameras.main.setViewport(0, 0, width, height).setZoom(Math.max(1.22, width / WORLD_WIDTH)); this.centerCamera(1); } }
  focus(target: InspectTarget): void {
    this.focusPoint = target.kind === 'bed' ? { ...BEDS[target.index || 0]!, y: BEDS[target.index || 0]!.y - 20 } : target.kind === 'well' ? { x: 280, y: 510 } : target.kind === 'workshop' ? { x: 432, y: 330 } : target.kind === 'mailbox' ? { x: 424, y: 710 } : undefined;
  }
  follow(): void { this.focusPoint = undefined; }
  private clampCamera(p: Point): Point {
    const c = this.cameras.main, halfX = c.width / c.zoom / 2, halfY = c.height / c.zoom / 2, factor = this.cssScale * c.zoom;
    // World-edge overscan lives behind the measured HUD/dock, leaving the whole subject in the visible playfield.
    return { x: Math.max(halfX - this.insets.left / factor, Math.min(WORLD_WIDTH - halfX + this.insets.right / factor, p.x)), y: Math.max(halfY - this.insets.top / factor, Math.min(WORLD_HEIGHT - halfY + this.insets.bottom / factor, p.y)) };
  }
  private centerCamera(blend: number): void {
    const c = this.cameras.main, point = this.focusPoint || { x: this.point.x + this.facing * 12, y: this.point.y - 20 }, z = c.zoom;
    const target = this.clampCamera({ x: point.x - (this.insets.left - this.insets.right) / this.cssScale / (2 * z), y: point.y - (this.insets.top - this.insets.bottom) / this.cssScale / (2 * z) });
    this.cameraPoint.x += (target.x - this.cameraPoint.x) * blend; this.cameraPoint.y += (target.y - this.cameraPoint.y) * blend; c.centerOn(Math.round(this.cameraPoint.x), Math.round(this.cameraPoint.y));
  }
  update(_time: number, delta: number): void {
    if (!this.initialized) return; const dt = Math.min(50, delta); this.elapsed += dt;
    const f = this.film;
    if (f && !this.paused) {
      if (f.phase === 'travel' || f.phase === 'home') {
        let budget = dt * (v2Personality(this.state.seed).tempo === 'brisk' ? .102 : v2Personality(this.state.seed).tempo === 'unhurried' ? .082 : .092);
        while (f.route.length && budget > 0) { const p = f.route[0]!, dx = p.x - this.point.x, dy = p.y - this.point.y, distance = Math.hypot(dx, dy); if (Math.abs(dx) > .5) this.facing = dx < 0 ? -1 : 1;
          if (distance <= budget) { this.point = { ...p }; f.route.shift(); budget -= distance; } else { this.point.x += dx / distance * budget; this.point.y += dy / distance * budget; budget = 0; }
        }
        if (!f.route.length) { if (f.phase === 'home') this.finish(); else { f.phase = 'contact'; f.elapsed = 0; this.motion(false); } }
      } else {
        f.elapsed += dt;
        if (f.phase === 'contact') {
          const contactHold = f.stops.length > 1 ? 470 : 180;
          if (f.elapsed >= contactHold) {
            const bedtime = f.receipt.events.some(e => e.kind === 'bedtime');
            if ((f.receipt.op === Op.Rest || bedtime) && !f.bedEntered) { f.bedEntered = true; f.phase = 'travel'; f.route = [{ x: 312, y: 121 }, { x: 312, y: 79 }]; this.motion(true); }
            else {
            if (f.receipt.op === Op.Well && f.stop > 0) { const bed = BEDS.findIndex(p => Math.abs(p.x - this.point.x) < 8 && Math.abs(p.y + 17 - this.point.y) < 8); if (bed >= 0) this.replaceBed(bed, { ...f.receipt.before.plots[bed]!, moisture: 2 }); }
            if (f.receipt.op === Op.Harvest) { const bed = BEDS.findIndex(p => Math.abs(p.x - this.point.x) < 8 && Math.abs(p.y + 17 - this.point.y) < 8); if (bed >= 0) { this.replaceBed(bed, f.receipt.snapshot.plots[bed]!); this.carrying = PLANTS[f.receipt.before.plots[bed]!.kind]?.output ?? -1; } }
            if (f.stop < f.stops.length - 1) { f.stop++; this.planLeg(); }
            else { f.phase = 'work'; f.elapsed = 0; if (f.receipt.op === Op.Rest || bedtime) { this.blanket.setVisible(true); this.sleeping = true; } }
            }
          }
        } else {
          if (!f.impact && f.elapsed >= f.work * .56) this.impact();
          if (f.elapsed >= f.work) { if (f.receipt.op === Op.Pickup && pickedUpGoods(f.receipt)) { f.phase = 'home'; f.route = findRoute(this.point, ANCHORS.pantry); this.motion(!!f.route.length); if (!f.route.length) this.finish(); } else this.finish(); }
        }
      }
    }
    this.drawActor(); this.drawEffects(); this.centerCamera(1 - Math.exp(-dt / 150)); this.drawOpening();
  }
  private drawOpening(): void {
    const g = this.openingMask; g.clear();
    const elapsed = this.elapsed - this.openingSince;
    if (this.openingPhase !== 'assembling' || elapsed > 900) return;
    // A brief presentation-only tile reveal uses the actual house art. No day,
    // needs, inventory or random draw advances while the cartridge wakes up.
    for (let y = 0; y < WORLD_HEIGHT; y += 16) for (let x = 0; x < WORLD_WIDTH; x += 16) {
      const alpha = 1 - openingEase((elapsed - openingTileTime(x - 184, y + 31)) / 320);
      if (alpha > .01) g.fillStyle(0x172c3d, alpha).fillRect(x, y, 16, 16);
    }
  }
  private drawActor(): void {
    const f = this.film, traveling = !!f && (f.phase === 'travel' || f.phase === 'home') && !this.paused, working = !!f && f.phase !== 'travel' && f.phase !== 'home';
    let pose: RoosterPose = 'idle';
    if (!this.state.alive) pose = 'dead';
    else if (this.sleeping) pose = 'sleep';
    else if (traveling) pose = Math.floor(this.elapsed / 135) % 2 ? 'walk-a' : 'walk-b';
    else if (working && f) pose = f.receipt.op === Op.Rest ? 'doze' : FOOD_OPS.has(f.receipt.op) ? 'eat' : GARDEN_OPS.has(f.receipt.op) ? 'garden' : WORK_OPS.has(f.receipt.op) ? 'repair' : f.receipt.op === Op.Treat ? 'treat' : f.receipt.op === Op.Quiet || f.receipt.op === Op.QuietMain ? Math.floor(this.elapsed / 200) % 16 > 11 ? v2Personality(this.state.seed).signature : 'breathe' : 'use';
    else if (this.attention > this.elapsed) pose = 'perk';
    else { const beat = Math.floor(this.elapsed / 150) % 64; pose = beat < 2 ? 'blink' : beat > 45 && beat < 54 ? v2Personality(this.state.seed).signature : 'breathe'; }
    const bob = traveling ? Math.floor(this.elapsed / 135) % 2 : pose === 'breathe' && Math.floor(this.elapsed / 650) % 2 ? 1 : 0;
    const inBed = this.point.x > 286 && this.point.x < 333 && this.point.y < 116;
    this.actor.setTexture(this.roosterTexture(pose)).setPosition(Math.round(this.point.x), Math.round(this.point.y - bob)).setFlipX(this.facing < 0).setDepth(inBed ? 114 : this.point.y + 1);
    this.shadow.setPosition(Math.round(this.point.x), Math.round(this.point.y + 1)).setDepth(this.point.y - 1).setScale(pose === 'doze' ? 1.2 : 1, 1);
    let item = this.carrying;
    if (working && f && FOOD_OPS.has(f.receipt.op)) item = f.receipt.op === Op.Drink ? f.receipt.arg : f.receipt.op === Op.Coffee ? 35 : f.receipt.arg || 2;
    if (working && f && WORK_OPS.has(f.receipt.op) && !f.impact) item = 37;
    if (working && f?.receipt.op === Op.EnjoyFlower) item = f.receipt.arg;
    this.held.setVisible(item >= 0 && this.state.alive); if (item >= 0) this.held.setTexture(this.itemTexture(item)).setPosition(Math.round(this.point.x + this.facing * 13), Math.round(this.point.y - 17 - bob - (item === 37 ? Math.floor(this.elapsed / 170) % 2 * 4 : 0))).setFlipX(this.facing < 0 && (item === 36 || item === 37)).setDepth(this.point.y + 3);
  }
  private drawEffects(): void {
    const g = this.effects, a = this.ambient; g.clear(); a.clear(); const px = (color: number, x: number, y: number, w = 1, h = 1, alpha = 1) => g.fillStyle(color, alpha).fillRect(Math.round(x), Math.round(y), w, h);
    const f = this.film, t = Math.floor(this.elapsed / 170) % 3, working = f && f.phase !== 'travel' && f.phase !== 'home';
    if (working && f) {
      const op = f.receipt.op, x = this.point.x, y = this.point.y;
      if (op === Op.Rest || this.sleeping) { px(0xe4e4c9, x + 13, y - 35 - t * 3, 5, 1); px(0xe4e4c9, x + 16 - t, y - 33 - t * 3, 2, 1); px(0xe4e4c9, x + 12, y - 31 - t * 3, 5, 1); }
      if (op === Op.Well) for (let i = 0; i < 5; i++) px(0x9bd2da, x + this.facing * (12 + i * 2), y - 22 + (i + t) % 5 * 3, 1, 2);
      if (WORK_OPS.has(op) && !f.impact) for (let i = 0; i < 3; i++) if ((t + i) % 2) { px(0xf0d895, x + 17 + i * 3, y - 23 - i * 4, 1, 3); px(0xf0d895, x + 16 + i * 3, y - 22 - i * 4, 3, 1); }
      if (op === Op.Craft && !f.impact) { const progress = f.elapsed / Math.max(1, f.work * .56); px(0x8c633b, 420, 296, 23, 3); px(0xd6af70, 421, 296, 21, 1); if (progress > .3) { px(0xb28a50, 422, 291, 4, 8); px(0xc49b5e, 438, 291, 4, 8); } if (progress > .65) { px(0x805a34, 421, 289, 22, 3); px(0xe1ba77, 422, 289, 20, 1); } }
      if ([Op.Toast, Op.CookSteak, Op.Coffee].includes(op)) for (let i = 0; i < 3; i++) px(0xe4e4c6, (op === Op.Coffee ? 209 : 175) + i * 4 + Math.sin(this.elapsed / 190 + i), 48 - (this.elapsed / 130 + i * 3) % 14, 1, 3, .7);
      if ([Op.Wash, Op.DeepClean].includes(op)) for (let i = 0; i < 3; i++) { px(0xc8e0d1, x + i * 6 - 5, y - 21 - t * 2 - i % 2 * 3, 3, 2); px(0xf3efd8, x + i * 6 - 5, y - 21 - t * 2 - i % 2 * 3, 1, 1); }
      if (f.impact && f.receipt.success && f.elapsed < f.work * .8 && op !== Op.Quiet) for (let i = 0; i < 3; i++) { px(0xe8d48f, x - 13 + i * 13, y - 31 - t * 3 - i % 2 * 5, 1, 3); px(0xe8d48f, x - 14 + i * 13, y - 30 - t * 3 - i % 2 * 5, 3, 1); }
    }
    if (this.state.house.fire) { for (let i = 0; i < 5; i++) px(this.state.house.fire === 1 ? 0xf2b651 : 0x747b72, 172 + i * 3, 56 - (this.elapsed / 80 + i * 4) % 23, 3, 5, .7); }
    if (this.rainUntil >= this.timeSlot && this.rainUntil > 0) { for (let i = 0; i < 44; i++) px(0xa5c4c7, 33 + i * 37 % 442, 452 + (i * 23 + this.elapsed / 40 * 3) % 322, 1, 4, .55); }
    if (this.visitorUntil >= this.timeSlot && this.visitorUntil > 0) { const p = BEDS[this.visitorBed] || BEDS[0]!, x = p.x + 20, y = p.y - 10 - (Math.floor(this.elapsed / 300) % 4 === 0 ? 2 : 0); px(0x514230, x - 4, y - 6, 10, 6); px(0x9c8051, x - 3, y - 5, 7, 4); px(0x6b583c, x + 2, y - 9, 5, 5); px(0x233532, x + 5, y - 7); px(0xd2a552, x + 7, y - 6, 3, 1); }
    if (this.state.alive) { const x = this.point.x, y = this.point.y; if (!this.state.conditions[2]?.resolved && this.state.conditions[2]?.severity) { px(0xe0dec3, x + 2, y - 16, 5, 2); px(0xc06052, x + 4, y - 17, 1, 4); } if (!this.state.conditions[3]?.resolved && this.state.conditions[3]?.severity) px(0xa5b97d, x + 10, y - 32 - t, 2, 2); if (!this.state.conditions[6]?.resolved && this.state.conditions[6]?.severity) { px(0x947546, x - 4, y - 14, 2, 1); px(0x947546, x + 1, y - 9, 2, 1); } }
    // Slow moving light, leaf flicks and butterflies give the place a pulse without inventing events.
    for (let i = 0; i < 4; i++) { const x = 350 + i * 34 + Math.sin(this.elapsed / 2300 + i * 3) * 10, y = 488 + i * 44 + Math.sin(this.elapsed / 1700 + i) * 8; a.fillStyle(i % 2 ? 0xd7ce97 : 0xb7c37c, .72); a.fillRect(Math.round(x), Math.round(y), 2, 1); }
    const butterflyX = 252 + Math.sin(this.elapsed / 3600) * 28, butterflyY = 616 + Math.cos(this.elapsed / 2400) * 16, wing = Math.floor(this.elapsed / 180) % 2;
    a.fillStyle(0xe6dfb1).fillRect(Math.round(butterflyX) - 3, Math.round(butterflyY) - wing, 3, 2 + wing).fillRect(Math.round(butterflyX) + 1, Math.round(butterflyY) - wing, 3, 2 + wing); a.fillStyle(0x6d6340).fillRect(Math.round(butterflyX), Math.round(butterflyY), 1, 3);
    for (let i = 0; i < 4; i++) if (this.state.plots[i]!.kind && !this.state.plots[i]!.ticks) { const p = BEDS[i]!, blink = (this.elapsed / 500 + i) % 5; if (blink < 1) { a.fillStyle(0xf0dfa0, .75).fillRect(p.x + 20, p.y - 40, 1, 3).fillRect(p.x + 19, p.y - 39, 3, 1); } }
    this.marks.clear();
    if (this.selected && this.selected.until > this.elapsed) { const target = this.selected.target, p = target.kind === 'bed' ? BEDS[target.index || 0]! : target.kind === 'well' ? { x: 280, y: 533 } : target.kind === 'workshop' ? { x: 432, y: 321 } : target.kind === 'mailbox' ? { x: 424, y: 728 } : this.point;
      this.marks.lineStyle(1, 0xf0d474, .9).strokeRoundedRect(p.x - 26, p.y - 35, 52, 38, 2);
    }
    const slot = this.timeSlot, dim = slot > 45 ? Math.min(.42, (slot - 45) / 36) : slot < 8 ? (8 - slot) * .012 : 0; this.night.setAlpha(Math.max(dim, this.state.house.powerOut ? .16 : 0));
    this.lampGlow.clear(); if (dim > .14 && !this.state.house.powerOut) { this.lampGlow.fillStyle(0xf5d68c, dim * .15).fillRect(336, 62, 36, 42).fillRect(329, 73, 50, 24); this.lampGlow.fillStyle(0xf2d798, dim * .35).fillRect(349, 71, 11, 9); }
  }
  dispose(): void { this.cancelFilm(); this.pending = undefined; }
}

export function createV2WorldRenderer(host: HTMLElement, options: V2WorldOptions): V2WorldController {
  let resolveReady!: () => void; const ready = new Promise<void>(resolve => { resolveReady = resolve; }); const scene = new LifeScene(options, resolveReady);
  const size = () => { const r = host.getBoundingClientRect(), physical = Math.max(1, r.width), width = Math.max(256, Math.min(480, Math.round(physical / 1.6))); return { width, height: Math.max(1, Math.round(Math.max(1, r.height) / physical * width)), scale: physical / width }; };
  const first = size(); scene.resizeWorld(first.width, first.height, first.scale);
  const game = new Phaser.Game({ type: Phaser.AUTO, parent: host, width: first.width, height: first.height, backgroundColor: '#263c3c', pixelArt: true, roundPixels: true, antialias: false, render: { antialias: false, pixelArt: true, roundPixels: true }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: first.width, height: first.height }, scene: [scene], audio: { noAudio: true }, fps: { target: 60 } });
  let disposed = false, frame = 0;
  const resize = () => { if (disposed || !game.isBooted) return; const next = size(); game.scale.getParentBounds(); game.scale.setGameSize(next.width, next.height); scene.resizeWorld(next.width, next.height, next.scale); };
  const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(resize); }); observer.observe(host); void ready.then(resize);
  return { ready, setState: (state, options) => scene.setState(state, options), playReceipt: (r, o) => scene.play(r, o), setPaused: value => scene.setPaused(value), setInputEnabled: enabled => scene.setInputEnabled(enabled), setOpening: phase => scene.setOpening(phase), setViewportInsets: (t, b, l, r) => scene.setInsets(t, b, l, r), focus: target => scene.focus(target), followActor: () => scene.follow(), resize, destroy: () => { disposed = true; observer.disconnect(); cancelAnimationFrame(frame); scene.dispose(); game.destroy(true); } };
}
