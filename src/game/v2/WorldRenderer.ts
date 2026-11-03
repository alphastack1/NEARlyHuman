import Phaser from 'phaser';
import { fixtureCanvas, FIXTURE_SIZES, type FixtureArt, type ArtOptions } from '../../art/fixtures';
import { PROP_URLS } from '../../art/asset-urls';
import { roosterCanvas, ROOSTER_FRAME, type RoosterPose } from '../../art/rooster';
import { Op, type State, type Receipt } from '../../v2/types';
import { v2Personality } from '../../v2/personality';
import { PLANTS, RECIPES } from '../../v2/catalog';
import { landscape, bedArt, itemArt, wellArt, workbenchArt, shadowArt, accentFixture } from './art';
import { pixelViewport } from './pixel-grid';
import { WORLD_WIDTH, WORLD_HEIGHT, BEDS, ANCHORS, findRoute, receiptStops, receiptLegs, receiptItems, type ReceiptLeg, type ItemStack, type Point, type InspectTarget } from './layout';
import { openingEase, openingTileTime } from '../opening';

export type { InspectTarget } from './layout';
export interface V2WorldOptions { state: State; onInspect?: (target: InspectTarget) => void; onMotion?: (motion: { traveling: boolean; purpose?: 'fetching' | 'storing' | 'watering' }) => void }
export interface V2WorldController {
  ready: Promise<void>;
  setState(state: State, options?: { receipt?: Receipt; slot?: number; history?: readonly Receipt[] }): void;
  playReceipt(receipt: Receipt, options?: { duration?: number; onImpact?: () => void }): Promise<void>;
  setPaused(paused: boolean): void;
  setPlaybackRate(rate: number): void;
  setInputEnabled(enabled: boolean): void;
  setOpening(phase: 'assembling' | 'title' | 'leaving' | 'closed'): void;
  setDawn(phase: 'waiting' | 'rise' | 'none'): void;
  setViewportInsets(top: number, bottom: number, left?: number, right?: number): void;
  focus(target: InspectTarget): void;
  followActor(): void;
  resize(): void;
  destroy(): void;
}
interface Fixture { kind: FixtureArt; image: Phaser.GameObjects.Image; x: number; y: number; key: string; opts: ArtOptions }
interface Film {
  receipt: Receipt; stops: Point[]; legs: ReceiptLeg[]; stop: number; route: Point[]; phase: 'travel' | 'contact' | 'work' | 'dismount';
  elapsed: number; work: number; workBudget: number; stopImpacted: boolean; travelSpeed: number; impact: boolean; bedEntered?: boolean; onImpact?: () => void; resolve: () => void;
}
const POSES: RoosterPose[] = ['idle', 'breathe', 'preen', 'stretch', 'perk', 'doze', 'peek', 'walk-a', 'walk-b', 'blink', 'sleep', 'use', 'eat', 'treat', 'garden', 'repair', 'hurt', 'dead'];
const GARDEN_OPS = new Set([Op.Plant, Op.Harvest, Op.Well, Op.RestoreSoil, Op.Abandon, Op.CoverPlot]);
const GARDEN_TOURS = new Set([Op.Harvest, Op.Well]);
const FOOD_OPS = new Set([Op.Breakfast, Op.Eat, Op.Drink, Op.Coffee, Op.Toast, Op.CookSteak, Op.Bowl, Op.Sandwich, Op.RawSteak]);
const WORK_OPS = new Set([Op.Repair, Op.Patch, Op.Craft, Op.BuildChair, Op.BuildShelter, Op.BraceRain]);
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
  private shadow!: Phaser.GameObjects.Image;
  private held!: Phaser.GameObjects.Image;
  private heldExtras: Phaser.GameObjects.Image[] = [];
  private workpiece!: Phaser.GameObjects.Image;
  private blanket!: Phaser.GameObjects.Image;
  private foreground!: Phaser.GameObjects.Graphics;
  private marks!: Phaser.GameObjects.Graphics;
  private effects!: Phaser.GameObjects.Graphics;
  private ambient!: Phaser.GameObjects.Graphics;
  private sunlight!: Phaser.GameObjects.Graphics;
  private night!: Phaser.GameObjects.Rectangle;
  private lampGlow!: Phaser.GameObjects.Graphics;
  private stock!: Phaser.GameObjects.Graphics;
  private stockIcons: Phaser.GameObjects.Image[] = [];
  private parcelIcons: Phaser.GameObjects.Image[] = [];
  private parcel?: { items: number[]; at: number; until: number };
  private perch?: Point;
  private perchOffset: Point = { x: 0, y: 0 };
  private dawn: 'waiting' | 'rise' | 'none' = 'none';
  private dawnSince = 0;
  private point: Point = { x: 312, y: 79 };
  private cameraPoint: Point = { x: 312, y: 79 };
  private film?: Film;
  private paused = false;
  private playbackRate = 1;
  private interactionEnabled = true;
  private openingPhase: 'assembling' | 'title' | 'leaving' | 'closed' = 'closed';
  private openingSince = 0;
  private openingMask!: Phaser.GameObjects.Graphics;
  private elapsed = 0;
  private actorClock = 0;
  private walked = 0;
  private plotPreview = new Map<number, State['plots'][number]>();
  private reaction?: { until: number; pose: 'hurt' | 'perk'; surprise: boolean };
  private facing = 1;
  private widthLogical = 256;
  private heightLogical = 480;
  private cssScale = 1;
  private insets = { top: 0, bottom: 0, left: 0, right: 0 };
  private measuredInsets = false;
  private focusPoint?: Point;
  private dragging?: { x: number; y: number; camera: Point; moved: boolean };
  private carrying = -1;
  private cargo: ItemStack[] = [];
  private motionPurpose?: 'fetching' | 'storing' | 'watering';
  private harvestOutcome?: { item: number; until: number };
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
    this.sunlight = this.add.graphics().setDepth(-80);
    const prop = (kind: FixtureArt, x: number, y: number, target?: InspectTarget, opts: ArtOptions = {}) => this.addFixture(kind, x, y, target, opts);
    prop('window', 136, 48, { kind: 'fixture', label: 'Window', index: 1 });
    prop('fridge', 72, 80, { kind: 'fixture', label: 'Pantry', index: 3 }); prop('pantry', 120, 80);
    const counter = this.add.graphics().setDepth(50); counter.fillStyle(0x60442d).fillRect(82, 53, 143, 28); counter.fillStyle(0xa77946).fillRect(84, 55, 139, 23); counter.fillStyle(0xd5a76b).fillRect(84, 55, 139, 3);
    prop('stove', 176, 80, { kind: 'fixture', label: 'Stove', index: 0 }); prop('prep', 208, 80, { kind: 'fixture', label: 'Kitchen counter', index: 4 });
    prop('plant', 47, 87); prop('shelf', 207, 37, undefined, { variant: 1 }); prop('table', 124, 160); prop('plant', 56, 183);
    prop('bed', 312, 112, { kind: 'fixture', label: 'Bed', index: 5 }); prop('bedside', 354, 101); prop('cupboard', 432, 80, { kind: 'fixture', label: 'Supplies', index: 6 });
    prop('plant', 395, 79); prop('painting', 284, 48, undefined, { variant: 2 }); prop('painting', 449, 153); prop('shelf', 345, 177, undefined, { variant: 1 });
    prop('baseSeat', 80, 336, { kind: 'fixture', label: 'Armchair', index: 7 }); prop('plant', 115, 323); prop('painting', 69, 292); prop('painting', 172, 292); prop('plant', 193, 379);
    prop('chair', 168, 336, { kind: 'fixture', label: 'Handmade chair', index: 2 }); prop('sink', 336, 320, { kind: 'fixture', label: 'Washroom', index: 8 }); prop('plant', 301, 327); prop('painting', 335, 280, undefined, { variant: 1 });
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
    this.shadow = this.add.image(this.point.x, this.point.y + 1, this.shadowTexture(20, 6)).setAlpha(.25);
    this.actor = this.add.image(this.point.x, this.point.y, this.roosterTexture('idle')).setOrigin(ROOSTER_FRAME.footX / ROOSTER_FRAME.width, ROOSTER_FRAME.footY / ROOSTER_FRAME.height).setInteractive({ pixelPerfect: true, alphaTolerance: 1 });
    this.actor.on('pointerup', (pointer: Phaser.Input.Pointer) => { if (this.allowPointer(pointer) && !this.dragging?.moved) this.attention = this.elapsed + 1400; });
    this.held = this.add.image(0, 0, this.itemTexture(6)).setVisible(false);
    for (let i = 0; i < 2; i++) this.heldExtras.push(this.add.image(0, 0, this.itemTexture(6)).setVisible(false).setScale(.7));
    this.workpiece = this.add.image(432, 303, this.itemTexture(30)).setOrigin(.5, 1).setDepth(324).setVisible(false);
    this.blanket = this.add.image(312, 112, this.fixtureTexture('bedCover', {})).setOrigin(.5, 1).setDepth(115).setVisible(true);
    this.night = this.add.rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x172439, 1).setOrigin(0).setDepth(1000).setAlpha(0);
    this.openingMask = this.add.graphics().setDepth(1200);
    this.lampGlow = this.add.graphics().setDepth(1001);
    this.stock = this.add.graphics().setDepth(1010);
    for (let i = 0; i < 3; i++) {
      this.stockIcons.push(this.add.image(0, 0, this.itemTexture(0)).setDepth(1011).setVisible(false));
      this.parcelIcons.push(this.add.image(0, 0, this.itemTexture(0)).setDepth(1012).setVisible(false));
    }
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
      if (kind !== 'bedCover' && kind !== 'plant') return `v2-asset-${asset}`;
      const source = this.textures.get(`v2-asset-${asset}`).getSourceImage() as HTMLImageElement, c = document.createElement('canvas'); c.width = source.width; c.height = source.height;
      const ctx = c.getContext('2d')!; ctx.drawImage(source, 0, 0); if (kind === 'bedCover') ctx.clearRect(0, 0, c.width, 25); this.textures.addCanvas(key, accentFixture(c, kind)); return key;
    }
    this.textures.addCanvas(key, accentFixture(fixtureCanvas(kind, opts), kind)); return key;
  }
  private addFixture(kind: FixtureArt, x: number, y: number, target?: InspectTarget, opts: ArtOptions = {}): void {
    const key = this.fixtureTexture(kind, opts), [width] = FIXTURE_SIZES[kind];
    if (!['window', 'shelf', 'painting', 'bedCover'].includes(kind)) this.add.image(x + 1, y, this.shadowTexture(Math.max(8, Math.round(width * .45) * 2), Math.max(4, Math.round(width * .075) * 2))).setAlpha(.2).setDepth(y - 1);
    const image = this.add.image(x, y, key).setDepth(kind === 'window' ? 12 : y);
    // An odd-sized texture still starts on a whole world pixel.
    image.setOrigin(Math.floor(image.width / 2) / image.width, 1);
    if (target) image.setInteractive(new Phaser.Geom.Rectangle(-3, -3, image.width + 6, image.height + 8), Phaser.Geom.Rectangle.Contains).on('pointerup', (pointer: Phaser.Input.Pointer) => this.inspect(target, pointer));
    this.fixtures.push({ kind, image, x, y, key, opts });
  }
  private roosterTexture(pose: RoosterPose): string {
    if (this.roosterSeed !== this.state.seed) { this.roosterSeed = this.state.seed; for (const p of POSES) { const key = `v2-rooster-${p}`; if (this.textures.exists(key)) this.textures.remove(key); this.textures.addCanvas(key, roosterCanvas(this.state.seed, p)); } }
    return `v2-rooster-${pose}`;
  }
  private itemTexture(index: number): string { const key = `v2-item-${index}`; if (!this.textures.exists(key)) this.textures.addCanvas(key, itemArt(index)); return key; }
  private shadowTexture(width: number, height: number): string { const key = `v2-shadow-${width}-${height}`; if (!this.textures.exists(key)) this.textures.addCanvas(key, shadowArt(width, height)); return key; }
  private allowPointer(pointer: Phaser.Input.Pointer): boolean { return this.interactionEnabled && pointer.event?.target === this.game.canvas; }
  private inspect(target: InspectTarget, pointer: Phaser.Input.Pointer): void { if (!this.allowPointer(pointer) || this.dragging?.moved) return; this.selected = { target, until: this.elapsed + 900 }; this.options.onInspect?.(target); }
  private replaceBed(index: number, state = this.state.plots[index]!): void {
    const key = `v2-plot-${index}-${++this.textureSerial}`, previous = this.plotKeys[index]; this.textures.addCanvas(key, bedArt(state)); this.plots[index]!.setTexture(key); this.plotKeys[index] = key;
    if (previous) this.textures.remove(previous);
  }
  private applyState(state: State): void {
    const before = this.state; this.state = state; if (!this.initialized) return;
    const staged = new Set(this.plotPreview.keys()); this.plotPreview.clear();
    for (let i = 0; i < 4; i++) { if (staged.has(i) || !before || JSON.stringify(before.plots[i]) !== JSON.stringify(state.plots[i]) || this.textureSerial === 0) this.replaceBed(i); this.covers[i]!.setVisible(!!state.house.umbrellaLife[i]); }
    for (const f of this.fixtures) {
      let opts: ArtOptions = { ...f.opts };
      if (f.kind === 'stove') opts = { damaged: !!(state.house.damage & 1), patched: !!state.house.stovePatch };
      if (f.kind === 'window') opts = { damaged: !!(state.house.damage & 2), braced: state.house.windowBrace };
      if (f.kind === 'chair') { opts = { damaged: !!(state.house.damage & 4), braced: state.house.chairBrace }; f.image.setVisible(state.house.chairLife > 0); f.image.setY(state.house.chairAnchor ? 384 : f.y).setDepth(state.house.chairAnchor ? 384 : f.y); }
      const key = this.fixtureTexture(f.kind, opts); if (key !== f.key) { f.image.setTexture(key); f.key = key; }
    }
    this.drawInventory();
  }
  private drawInventory(): void {
    const g = this.foreground; g.clear().setDepth(381); const px = (c: number, x: number, y: number, w: number, h: number) => g.fillStyle(c).fillRect(x, y, w, h);
    for (let i = 0; i < Math.min(12, this.storedStock(6)); i++) { const x = 402 + i % 4 * 9, y = 375 - Math.floor(i / 4) * 6; px(0x62452d, x, y, 12, 6); px(0xba9155, x + 1, y, 10, 4); px(0xe0bc7b, x + 1, y + 1, 3, 3); px(0x7e5b36, x + 5, y + 1, 4, 1); }
    for (let i = 0; i < 4; i++) {
      const item = 30 + i, crafting = this.film?.receipt.op === Op.Craft && this.film.impact && RECIPES[this.film.receipt.arg]?.output === item && !this.film.receipt.before.inventory[item];
      if (this.storedStock(item) && !crafting) { const key = `v2-display-${i}`; const old = this.children.getByName(key) as Phaser.GameObjects.Image | null; if (!old) this.add.image(404 + i * 17, 303, this.itemTexture(item)).setOrigin(.5, 1).setDepth(324).setName(key); }
      else this.children.getByName(`v2-display-${i}`)?.destroy();
    }
    if (this.state.house.shelterLife) { px(0x51412e, 349, 477, 3, 195); px(0x51412e, 478, 477, 3, 195); px(0xc7bc8b, 350, 477, 130, 3); for (let x = 354; x < 478; x += 9) px(0xb5ae7b, x, 478, 3, 7); }
    if (this.state.house.mess) { for (let i = 0; i < Math.min(10, this.state.house.mess); i++) { const x = 101 + i * 17 % 103, y = 100 + i * 29 % 73; px(0x9a7750, x, y, 3, 2); px(0xb48c55, x + 3, y + 1, 2, 1); } }
  }
  private storedStock(item: number): number {
    // A multi-bed harvest is shown before its one canonical inventory impact.
    // Until that impact its newly gathered goods were never in storage.
    const inHands = this.film?.receipt.op === Op.Harvest && !this.film.impact ? 0 : this.cargo.filter(s => s.item === item).reduce((n, s) => n + s.quantity, 0);
    return Math.max(0, (this.state.inventory[item] || 0) - inHands);
  }
  private addCargo(items: readonly ItemStack[]): void {
    for (const stack of items) { const old = this.cargo.find(s => s.item === stack.item); if (old) old.quantity += stack.quantity; else this.cargo.push({ ...stack }); }
    this.drawInventory();
  }
  private removeCargo(items: readonly ItemStack[]): void {
    for (const stack of items) { const old = this.cargo.find(s => s.item === stack.item); if (old) old.quantity = Math.max(0, old.quantity - stack.quantity); }
    this.cargo = this.cargo.filter(s => s.quantity > 0); this.drawInventory();
  }

  setState(state: State, options: { receipt?: Receipt; slot?: number; history?: readonly Receipt[] } = {}): void {
    this.cancelFilm(); if (!this.initialized) { this.state = state; return; }
    const different = state.seed !== this.state.seed; this.cargo = []; this.applyState(state); this.focusPoint = undefined; this.carrying = -1; this.harvestOutcome = undefined; this.reaction = undefined; this.parcel = undefined;
    if (different) { this.point = { x: 312, y: 79 }; this.perch = undefined; this.perchOffset = { x: 0, y: 0 }; this.roosterTexture('idle'); }
    // An explicit film seek may jump. Ordinary receipt playback always walks its route.
    const history = options.history || (options.receipt ? [options.receipt] : []);
    if (options.history || options.slot === 0) { this.point = { x: 312, y: 79 }; this.sleeping = true; this.rainUntil = 0; this.visitorUntil = 0; this.perch = undefined; this.perchOffset = { x: 0, y: 0 }; }
    for (const r of history) {
      for (const e of r.events) { if (e.source === 'rain') this.rainUntil = Math.ceil((r.slot + 1) / 10) * 10; if (e.source === 'seedEater' || e.source === 'visitor') { this.visitorUntil = Math.ceil((r.slot + 1) / 10) * 10; this.visitorBed = Math.min(3, e.target); } }
      if ((r.op === Op.Shoo || r.op === Op.Bait) && r.success) this.visitorUntil = 0;
      if (r.op === Op.Rest || r.events.some(e => e.kind === 'bedtime')) { this.point = { x: 312, y: 79 }; this.sleeping = true; this.perch = undefined; }
      else {
        const last = receiptStops(r, this.point).at(-1); if (last) this.point = { ...last };
        if (r.op === Op.Leisure && r.variant !== 1) this.perch = r.variant === 2 ? { x: 0, y: -17 } : { x: -8, y: -18 };
        else if (r.op !== Op.Quiet && r.op !== Op.QuietMain) this.perch = undefined;
        if (r.op !== Op.Quiet) this.sleeping = false;
      }
    }
    this.perchOffset = this.perch ? { ...this.perch } : { x: 0, y: 0 };
    if (options.slot !== undefined) this.timeSlot = options.slot;
    this.blanket.setVisible(this.point.y < 114 && this.point.x > 286 && this.point.x < 332); this.centerCamera(1);
  }
  private cancelFilm(): void { const film = this.film; this.film = undefined; this.motion(false); if (film) film.resolve(); }
  play(receipt: Receipt, options: { duration?: number; onImpact?: () => void } = {}): Promise<void> {
    return new Promise(resolve => {
      const begin = () => {
        this.cancelFilm(); this.paused = false; this.focusPoint = undefined; this.reaction = undefined; this.sleeping = this.sleeping && receipt.op === Op.Quiet; this.blanket.setVisible(this.sleeping); this.timeSlot = receipt.slot; this.applyState(receipt.before);
        if (receipt.op !== Op.Quiet && receipt.op !== Op.QuietMain) this.harvestOutcome = undefined;
        for (const e of receipt.events) { if (e.source === 'rain') this.rainUntil = Math.ceil((receipt.slot + 1) / 10) * 10; if (e.source === 'seedEater' || e.source === 'visitor') { this.visitorUntil = Math.ceil((receipt.slot + 1) / 10) * 10; this.visitorBed = Math.min(3, e.target); } }
        this.cargo = []; this.carrying = -1;
        const requestedWork = options.duration ?? (receipt.role === 'main' ? 2500 : receipt.op === Op.Quiet ? 650 : 1150);
        // The parcel opens here, not while walking away: leave time to see each real supply.
        const work = receipt.op === Op.Pickup && pickedUpGoods(receipt) ? Math.max(1900, requestedWork) : requestedWork;
        const bedtime = receipt.events.some(e => e.kind === 'bedtime'), alreadyInBed = this.point.x > 286 && this.point.x < 333 && this.point.y < 116;
        const bedEntered = alreadyInBed && (receipt.op === Op.Rest || bedtime);
        const legs = bedEntered ? [] : receiptLegs(receipt, this.point);
        this.film = { receipt, stops: legs.map(leg => leg.at), legs, stop: 0, route: [], phase: 'travel', elapsed: 0, work: Math.max(250, work), workBudget: Math.max(250, work), stopImpacted: false, travelSpeed: 0, impact: false, bedEntered, onImpact: options.onImpact, resolve };
        if (receipt.op === Op.Pickup) this.mailbox(false);
        this.planLeg();
      };
      if (this.initialized) begin(); else { const previous = this.pending; this.pending = () => { previous?.(); begin(); }; }
    });
  }
  private planLeg(): void {
    const f = this.film; if (!f) return;
    if (this.perch && f.receipt.op !== Op.Quiet && f.receipt.op !== Op.QuietMain) { this.perch = undefined; f.phase = 'dismount'; f.elapsed = 0; this.motion(false); return; }
    const target = f.stops[f.stop], leavingBed = this.point.x > 286 && this.point.x < 333 && this.point.y < 116;
    f.route = target ? leavingBed ? [{ x: 312, y: 121 }, ...findRoute({ x: 312, y: 121 }, target, this.state.house)] : findRoute(this.point, target, this.state.house) : [];
    if (target && !f.route.length && Math.hypot(target.x - this.point.x, target.y - this.point.y) > 2) {
      // Keep the actor where it is if a future map change makes a contact inaccessible.
      // The canonical receipt still plays; a visual failure can never invent another game outcome.
      console.warn('V2 presentation anchor is inaccessible', target);
    }
    let distance = 0, previous = this.point;
    for (const point of f.route) { distance += Math.hypot(point.x - previous.x, point.y - previous.y); previous = point; }
    const profile = v2Personality(this.state.seed), base = profile.tempo === 'brisk' ? .102 : profile.tempo === 'unhurried' ? .082 : .092;
    f.travelSpeed = base * (1 + Math.min(.28, Math.max(0, distance - 240) / 600 * .28));
    const leg = f.legs[f.stop];
    f.work = leg?.kind === 'pickup' ? 420 : leg?.kind === 'store' ? 320 : leg?.kind === 'fill' ? 680 : f.workBudget / Math.max(1, f.legs.filter(l => l.kind === 'work').length);
    f.phase = f.route.length ? 'travel' : 'contact'; f.elapsed = 0; f.stopImpacted = false; this.motion(!!f.route.length);
  }
  private contactFacing(f: Film): void {
    const target = f.stops[f.stop]; if (!target) return;
    const bed = BEDS.find(p => Math.abs(p.x - target.x) < 8 && Math.abs(p.y + 17 - target.y) < 8);
    const fixture = [...this.fixtures].sort((a, b) => Math.hypot(a.image.x - target.x, a.image.y - target.y) - Math.hypot(b.image.x - target.x, b.image.y - target.y))[0];
    const leg = f.legs[f.stop];
    const x = bed?.x ?? (leg?.storage === 'supplies' ? 432 : leg?.storage === 'pantry' ? 72 : leg?.storage === 'workshop' ? 432 : f.receipt.op === Op.Craft || f.receipt.op === Op.BuildChair || f.receipt.op === Op.BuildShelter ? 432 : f.receipt.op === Op.Well ? 280 : fixture?.image.x);
    if (x !== undefined && Math.abs(x - this.point.x) > 3) this.facing = x < this.point.x ? -1 : 1;
    else if (bed || FOOD_OPS.has(f.receipt.op) || f.receipt.op === Op.Well) this.facing = 1;
  }
  private impactTime(f: Film): number { return f.legs[f.stop]?.kind === 'work' && f.receipt.op === Op.Pickup && pickedUpGoods(f.receipt) ? 350 : Math.max(120, f.work - Math.min(420, f.work * .3)); }
  private stopImpact(f: Film): void {
    f.stopImpacted = true;
    const leg = f.legs[f.stop];
    if (leg?.kind === 'pickup') { this.addCargo(leg.items || []); return; }
    if (leg?.kind === 'store') { this.removeCargo(leg.items || []); if (leg.tool !== undefined) this.carrying = -1; return; }
    if (leg?.kind === 'fill') { this.carrying = leg.tool ?? -1; return; }
    const bed = BEDS.findIndex(p => Math.abs(p.x - this.point.x) < 8 && Math.abs(p.y + 17 - this.point.y) < 8);
    if (f.receipt.success && GARDEN_TOURS.has(f.receipt.op) && bed >= 0) {
      const next = f.receipt.snapshot.plots[bed]!; this.plotPreview.set(bed, next); this.replaceBed(bed, next);
      if (f.receipt.op === Op.Harvest) {
        const output = PLANTS[f.receipt.before.plots[bed]!.kind]?.output;
        if (output !== undefined && f.receipt.snapshot.inventory[output]! > f.receipt.before.inventory[output]!) this.addCargo([{ item: output, quantity: 1 }]);
      }
    }
    if (!f.legs.slice(f.stop + 1).some(l => l.kind === 'work')) this.impact();
  }
  private mailbox(open: boolean): void { const p = this.fixtures.find(f => f.kind === 'mailbox'); if (p) { const key = this.fixtureTexture('mailbox', { open, parcel: open }); p.image.setTexture(key); p.key = key; } }
  private impact(): void {
    const f = this.film; if (!f || f.impact) return; f.impact = true;
    this.removeCargo(receiptItems(f.receipt, 'inputs'));
    const outputs = receiptItems(f.receipt, 'outputs');
    if (f.receipt.op !== Op.Harvest) this.addCargo(outputs);
    this.applyState(f.receipt.snapshot); f.onImpact?.();
    if (f.receipt.op === Op.Pickup) {
      this.mailbox(false); this.carrying = -1;
      const items = f.receipt.snapshot.inventory.flatMap((n, i) => Array(Math.min(3, Math.max(0, n - f.receipt.before.inventory[i]!))).fill(i) as number[]).slice(0, 3);
      if (items.length) this.parcel = { items, at: this.actorClock, until: this.actorClock + 1500 };
    }
    else if (f.receipt.op === Op.Ship) { this.mailbox(true); this.carrying = -1; }
    if ((f.receipt.op === Op.Shoo || f.receipt.op === Op.Bait) && f.receipt.success) this.visitorUntil = 0;
    if (f.receipt.events.some(e => e.kind === 'incident' || e.kind === 'condition')) {
      const before = f.receipt.before, after = f.receipt.snapshot, wound = after.conditions[2]!;
      const physical = wound.severity > 0 && !wound.resolved && (before.conditions[2]!.resolved || wound.severity > before.conditions[2]!.severity) || after.needs[0]! < before.needs[0]!;
      this.reaction = { until: this.actorClock + Math.min(500, Math.max(250, f.work - f.elapsed)), pose: physical ? 'hurt' : 'perk', surprise: !physical };
    }
  }
  private finish(): void { const f = this.film; if (!f) return; this.impact(); this.film = undefined; this.carrying = -1; this.cargo = []; this.drawInventory(); this.motion(false); f.resolve(); }
  private motion(traveling: boolean): void {
    const leg = this.film?.legs[this.film.stop], purpose = leg?.kind === 'pickup' ? 'fetching' : leg?.kind === 'store' ? 'storing' : leg?.kind === 'fill' ? 'watering' : undefined;
    if (traveling !== this.lastTraveling || purpose !== this.motionPurpose) { this.lastTraveling = traveling; this.motionPurpose = purpose; this.options.onMotion?.({ traveling, purpose }); }
  }
  setPaused(paused: boolean): void { this.paused = paused; this.motion(!!this.film && this.film.phase === 'travel' && !paused); }
  setPlaybackRate(rate: number): void { this.playbackRate = Number.isFinite(rate) ? Math.max(1, Math.min(2, rate)) : 1; }
  setInputEnabled(enabled: boolean): void { this.interactionEnabled = enabled; if (this.input) this.input.enabled = enabled; if (!enabled) this.dragging = undefined; }
  setOpening(phase: 'assembling' | 'title' | 'leaving' | 'closed'): void { if (phase !== this.openingPhase) { this.openingPhase = phase; this.openingSince = this.elapsed; } }
  setDawn(phase: 'waiting' | 'rise' | 'none'): void { if (phase !== this.dawn) { this.dawn = phase; this.dawnSince = this.actorClock; } }
  setInsets(top: number, bottom: number, left = 0, right = 0): void {
    const first = !this.measuredInsets; this.measuredInsets = true; this.insets = { top, bottom, left, right };
    // Frame the first view immediately. Later caption/inspection height changes
    // use the same smooth follow as the moving actor instead of snapping it.
    if (this.initialized && first) this.centerCamera(1);
  }
  resizeWorld(width: number, height: number, scale: number): void { this.widthLogical = width; this.heightLogical = height; this.cssScale = scale; if (this.initialized) { this.cameras.main.setViewport(0, 0, width, height).setZoom(1).setRoundPixels(true); this.centerCamera(1); } }
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
    this.cameraPoint.x += (target.x - this.cameraPoint.x) * blend; this.cameraPoint.y += (target.y - this.cameraPoint.y) * blend;
    // Round the scroll origin itself. Rounding the center leaves a half-pixel
    // scroll whenever the logical viewport has an odd width or height.
    c.setScroll(Math.round(this.cameraPoint.x - c.width / z / 2), Math.round(this.cameraPoint.y - c.height / z / 2));
  }
  update(_time: number, delta: number): void {
    if (!this.initialized) return; const dt = Math.min(50, delta); this.elapsed += dt;
    const f = this.film;
    if (!this.paused) this.actorClock += dt * (f ? this.playbackRate : 1);
    if (!this.paused) { const blend = 1 - Math.exp(-dt * (f ? this.playbackRate : 1) / 90); this.perchOffset.x += ((this.perch?.x || 0) - this.perchOffset.x) * blend; this.perchOffset.y += ((this.perch?.y || 0) - this.perchOffset.y) * blend; }
    if (f && !this.paused) {
      const filmDelta = dt * this.playbackRate;
      if (f.phase === 'dismount') { f.elapsed += filmDelta; if (f.elapsed >= 400) { this.perchOffset = { x: 0, y: 0 }; this.planLeg(); } }
      else if (f.phase === 'travel') {
        let budget = filmDelta * f.travelSpeed;
        while (f.route.length && budget > 0) { const p = f.route[0]!, dx = p.x - this.point.x, dy = p.y - this.point.y, distance = Math.hypot(dx, dy); if (Math.abs(dx) > .5) this.facing = dx < 0 ? -1 : 1;
          if (distance <= budget) { this.point = { ...p }; f.route.shift(); budget -= distance; this.walked += distance; } else { this.point.x += dx / distance * budget; this.point.y += dy / distance * budget; this.walked += budget; budget = 0; }
        }
        if (!f.route.length) { f.phase = 'contact'; f.elapsed = 0; this.contactFacing(f); this.motion(false); }
      } else {
        f.elapsed += filmDelta;
        if (f.phase === 'contact') {
          this.contactFacing(f);
          const leg = f.legs[f.stop], realWork = !leg || leg.kind === 'work';
          const contactHold = realWork && GARDEN_TOURS.has(f.receipt.op) ? 130 : 150;
          if (f.elapsed >= contactHold) {
            const bedtime = f.receipt.events.some(e => e.kind === 'bedtime');
            if ((f.receipt.op === Op.Rest || bedtime) && !f.bedEntered) { f.bedEntered = true; f.phase = 'travel'; f.route = [{ x: 312, y: 121 }, { x: 312, y: 79 }]; this.motion(true); }
            else {
            f.phase = 'work'; f.elapsed = 0;
            if (leg?.kind === 'fill') this.carrying = leg.tool ?? -1;
            if (realWork && f.receipt.op === Op.Pickup) this.mailbox(pickedUpGoods(f.receipt));
            if (realWork && f.receipt.op === Op.Leisure && f.receipt.variant !== 1) this.perch = f.receipt.variant === 2 ? { x: 0, y: -17 } : { x: -8, y: -18 };
            if (realWork && (f.receipt.op === Op.Rest || bedtime)) { this.blanket.setVisible(true); this.sleeping = true; }
            }
          }
        } else {
          if (!f.stopImpacted && f.elapsed >= this.impactTime(f)) this.stopImpact(f);
          if (f.elapsed >= f.work) {
            if (f.stop < f.stops.length - 1) { f.stop++; this.planLeg(); }
            else this.finish();
          }
        }
      }
    }
    this.drawActor(); this.drawEffects(); this.drawStock(); this.centerCamera(1 - Math.exp(-dt / 150)); this.drawOpening();
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
    const f = this.film, inTransit = !!f && f.phase === 'travel', atContact = !!f && f.phase === 'work', leg = f?.legs[f.stop], working = atContact && (!leg || leg.kind === 'work'), clock = this.actorClock;
    const bedtime = !!f?.receipt.events.some(e => e.kind === 'bedtime');
    const quietClock = clock + Number.parseInt(this.state.seed.slice(-4), 16) % 17 * 137 + (f?.receipt.slot || 0) * 97;
    let pose: RoosterPose = 'idle';
    if (!this.state.alive) pose = 'dead';
    else if (this.reaction && this.reaction.until > clock) pose = this.reaction.pose;
    else if (this.attention > this.elapsed && (!f || this.paused)) pose = this.sleeping ? 'peek' : 'perk';
    else if (working && f && (f.receipt.op === Op.Rest || bedtime)) pose = bedtime ? 'sleep' : 'doze';
    else if (working && f?.receipt.op === Op.Quiet && f.receipt.role === 'routine') pose = f.stopImpacted ? 'perk' : 'peek';
    else if (this.sleeping) pose = 'sleep';
    else if (inTransit) pose = Math.floor(this.walked / 12) % 2 ? 'walk-a' : 'walk-b';
    else if (atContact && !working) pose = 'use';
    else if (working && f && f.stopImpacted && f.receipt.op !== Op.Quiet && f.receipt.op !== Op.QuietMain) pose = f.receipt.success ? 'perk' : 'peek';
    else if (working && f) pose = FOOD_OPS.has(f.receipt.op) ? (Math.floor(clock / 260) % 3 === 0 ? 'use' : 'eat') : f.receipt.op === Op.Well && f.stop === 0 ? 'use' : GARDEN_OPS.has(f.receipt.op) ? 'garden' : WORK_OPS.has(f.receipt.op) ? 'repair' : f.receipt.op === Op.Treat ? 'treat' : f.receipt.op === Op.Leisure ? f.receipt.variant === 1 ? v2Personality(this.state.seed).signature : Math.floor(clock / 600) % 2 ? 'preen' : 'doze' : f.receipt.op === Op.Quiet || f.receipt.op === Op.QuietMain ? Math.floor(quietClock / 220) % 8 >= 5 ? v2Personality(this.state.seed).signature : 'breathe' : 'use';
    else if (this.attention > this.elapsed) pose = 'perk';
    else { const beat = Math.floor(clock / 150) % 64; pose = beat < 2 ? 'blink' : beat > 45 && beat < 54 ? v2Personality(this.state.seed).signature : 'breathe'; }
    // The existing garden texture leans one pixel lower than use. Alternating
    // those poses gives real contact a small reach/pat rhythm at the same route anchor.
    if (working && f && !f.stopImpacted && (f.receipt.op === Op.Plant || f.receipt.op === Op.Harvest)) pose = Math.floor(clock / 240) % 2 ? 'garden' : 'use';
    const inBed = this.point.x > 286 && this.point.x < 333 && this.point.y < 116;
    const actorX = Math.round(this.point.x + this.perchOffset.x), actorY = Math.round(this.point.y + this.perchOffset.y);
    this.actor.setTexture(this.roosterTexture(pose)).setPosition(actorX, actorY).setFlipX(this.facing < 0).setDepth(inBed ? 114 : this.point.y + 1);
    this.shadow.setTexture(this.shadowTexture(pose === 'doze' ? 24 : 20, 6)).setPosition(Math.round(this.point.x), Math.round(this.point.y + 1)).setDepth(this.point.y - 1).setVisible(Math.abs(this.perchOffset.y) < 4);
    let item = this.carrying >= 0 ? this.carrying : this.cargo[0]?.item ?? -1;
    if (item < 0 && this.harvestOutcome && this.harvestOutcome.until > clock && (!f || f.receipt.op === Op.Quiet || f.receipt.op === Op.QuietMain)) item = this.harvestOutcome.item;
    if (working && f && FOOD_OPS.has(f.receipt.op)) {
      const op = f.receipt.op;
      const ingredients = op === Op.Coffee ? [35] : receiptItems(f.receipt, 'inputs').map(stack => stack.item);
      const at = Math.min(ingredients.length - 1, Math.floor(f.elapsed / this.impactTime(f) * ingredients.length));
      item = f.stopImpacted ? -1 : ingredients[at] ?? -1;
    }
    if (working && f && WORK_OPS.has(f.receipt.op) && !f.stopImpacted) item = 37;
    if (working && f && !f.stopImpacted && f.receipt.op === Op.Treat) item = f.receipt.arg === 2 ? 11 : 4;
    if (working && f && !f.stopImpacted && [Op.Wash, Op.DeepClean].includes(f.receipt.op) && f.receipt.before.inventory[10]! > f.receipt.snapshot.inventory[10]!) item = 10;
    if (working && f?.receipt.op === Op.EnjoyFlower) item = f.receipt.arg;
    const handHeight = working && f && FOOD_OPS.has(f.receipt.op) ? 19 : item === 37 ? 17 : 14;
    const grouped = this.cargo.length > 1 && !working && this.carrying < 0;
    this.held.setVisible(item >= 0 && this.state.alive).setScale(grouped ? .8 : 1); if (item >= 0) this.held.setTexture(this.itemTexture(item)).setPosition(Math.round(this.point.x + this.facing * 15), Math.round(this.point.y - handHeight - (item === 37 ? Math.floor(clock / 170) % 2 * 4 : 0))).setFlipX(this.facing < 0 && (item === 36 || item === 37)).setDepth(this.point.y + 3);
    for (const [i, extra] of this.heldExtras.entries()) { const stack = grouped ? this.cargo[i + 1] : undefined; extra.setVisible(!!stack && this.state.alive); if (stack) extra.setTexture(this.itemTexture(stack.item)).setPosition(Math.round(this.point.x + this.facing * (21 + i * 4)), Math.round(this.point.y - 8 - i * 8)).setDepth(this.point.y + 4 + i); }
  }
  private drawStock(): void {
    const g = this.stock; g.clear(); for (const image of this.stockIcons) image.setVisible(false);
    for (const image of this.parcelIcons) image.setVisible(false);
    const burst = this.parcel, clock = this.actorClock;
    if (burst && burst.until > clock) {
      const age = clock - burst.at, spread = Math.min(1, age / 280), lift = Math.round(Math.sin(Math.min(1, age / 300) * Math.PI / 2) * 21);
      for (const [i, item] of burst.items.entries()) {
        const x = Math.round(419 + (i - (burst.items.length - 1) / 2) * 27 * spread), y = 703 - lift - (i === 1 && burst.items.length === 3 ? 5 : 0);
        this.parcelIcons[i]!.setTexture(this.itemTexture(item)).setPosition(x, y).setVisible(true);
        if (age < 1300) { const b = Math.floor(age / 150 + i) % 3; g.fillStyle(0xf8e6a0).fillRect(x - 13, y - 7 - b, 1, 3).fillRect(x - 14, y - 6 - b, 3, 1); g.fillStyle(0xfff3c1).fillRect(x + 12, y + 4 + b, 1, 3).fillRect(x + 11, y + 5 + b, 3, 1); }
      }
      return;
    }
    if (this.openingPhase !== 'closed' || this.sleeping || !this.state.alive) return;
    const nearby = (p: Point, radius: number) => Math.hypot(this.point.x - p.x, this.point.y - p.y) < radius;
    const stock = (ids: number[]) => ids.filter(id => this.storedStock(id) > 0).slice(0, 3).map(id => ({ item: id, quantity: this.storedStock(id) }));
    let chips: { item: number; quantity: number }[] = [], at = { x: 72, y: 116 };
    if (nearby(ANCHORS.pantry, 65)) { chips = stock([0, 2, 1, 3, 5, 26, 27, 28, 29]); if (!chips.length) chips = [{ item: 2, quantity: 0 }]; }
    else if (nearby(ANCHORS.supplies, 55)) { chips = stock([13, 14, 15, 16, 17, 18, 19, 20, 21, 4, 7, 8, 9, 10, 11, 12, 22, 23, 24, 25]); at = { x: 432, y: 116 }; }
    else if (nearby(ANCHORS.workshop, 63)) { chips = stock([6, 30, 31, 32, 33]); if (!chips.length) chips = [{ item: 6, quantity: 0 }]; at = { x: 432, y: 354 }; }
    else {
      const bed = BEDS.findIndex(p => nearby({ x: p.x, y: p.y + 17 }, 35));
      const nearbyPlot = bed >= 0 ? this.plotPreview.get(bed) || this.state.plots[bed]! : undefined;
      if (bed >= 0 && nearbyPlot?.kind && nearbyPlot.moisture === 0) {
        const p = BEDS[bed]!, x = p.x, y = p.y + 26;
        // A hollow drop above cracked soil is a care cue, never a bottle count.
        g.fillStyle(0x192f3b, .94).fillRect(x - 12, y - 8, 25, 23);
        g.fillStyle(0xe4bc70).fillRect(x, y - 5, 1, 2).fillRect(x - 2, y - 3, 1, 2).fillRect(x + 2, y - 3, 1, 2).fillRect(x - 3, y - 1, 1, 3).fillRect(x + 3, y - 1, 1, 3).fillRect(x - 2, y + 2, 5, 1);
        g.fillStyle(0x9c7950).fillRect(x - 8, y + 7, 17, 2); g.fillStyle(0xe4bc70).fillRect(x - 1, y + 6, 1, 3).fillRect(x + 1, y + 9, 2, 1); return;
      }
      else if (nearby(ANCHORS.well, 38)) {
        // The well supplies irrigation freely; bottled drinking water lives indoors.
        this.stockIcons[0]!.setTexture(this.itemTexture(36)).setPosition(280, 563).setVisible(true); return;
      }
    }
    const digits = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
    const width = chips.length * 34 + 3, left = Math.round(at.x - width / 2), top = at.y - 12;
    if (!chips.length) return;
    g.fillStyle(0x192f3b, .94).fillRect(left, top, width, 25); g.fillStyle(0x70928d).fillRect(left + 1, top + 1, width - 2, 1); g.fillStyle(0x36535a).fillRect(left + 1, top + 23, width - 2, 1);
    for (const [i, chip] of chips.entries()) {
      this.stockIcons[i]!.setTexture(this.itemTexture(chip.item)).setPosition(left + i * 34 + 11, top + 12).setVisible(true);
      const count = chip.quantity > 99 ? '99+' : String(chip.quantity), textX = left + i * 34 + 21;
      for (const [j, char] of [...count].entries()) {
        if (char === '+') { g.fillStyle(0xe7e4bd).fillRect(textX + j * 4, top + 16, 3, 1).fillRect(textX + j * 4 + 1, top + 15, 1, 3); continue; }
        const bits = digits[Number(char)]!;
        for (let bit = 0; bit < 15; bit++) if (bits[bit] === '1') g.fillStyle(0xf2e8c7).fillRect(textX + j * 4 + bit % 3, top + 13 + Math.floor(bit / 3), 1, 1);
      }
    }
  }
  private drawEffects(): void {
    const g = this.effects, a = this.ambient; g.clear(); a.clear(); const px = (color: number, x: number, y: number, w = 1, h = 1, alpha = 1) => g.fillStyle(color, alpha).fillRect(Math.round(x), Math.round(y), w, h);
    // Window light lives on the floor layer, below props and the untouched NFT sprite.
    const rise = this.dawn === 'rise' ? Math.min(1, (this.actorClock - this.dawnSince) / 2400) : this.dawn === 'waiting' ? 0 : 1;
    const daylight = (this.timeSlot < 6 ? .3 : this.timeSlot > 45 ? Math.max(0, (60 - this.timeSlot) / 15) : 1) * (.3 + rise * .7);
    const windowLight = daylight * (this.state.house.damage & 2 ? .055 : .13), drift = Math.floor(this.elapsed / 3200) % 2;
    this.sunlight.clear().fillStyle(0xffdc8e, windowLight).fillRect(121 + drift, 77, 12, 31).fillRect(138 + drift, 77, 12, 31);
    this.sunlight.fillStyle(0xffe5a8, windowLight * .45).fillRect(122 + drift, 108, 28, 5);
    this.workpiece.setVisible(false);
    const f = this.film, clock = this.actorClock, t = Math.floor(clock / 170) % 3, leg = f?.legs[f.stop], working = f && f.phase === 'work' && (!leg || leg.kind === 'work');
    if (f?.phase === 'work' && leg?.kind === 'fill' && !f.stopImpacted) { px(0x94d4df, 272 + t * 3, 508, 6, 1); px(0xcce9d8, 277 + t, 510, 4, 1); }
    if (working && f) {
      const op = f.receipt.op, x = this.point.x + this.perchOffset.x, y = this.point.y + this.perchOffset.y;
      if ((op === Op.Rest || this.sleeping) && !(op === Op.Quiet && f.receipt.role === 'routine') && this.attention <= this.elapsed) { px(0xe4e4c9, x + 13, y - 35 - t * 3, 5, 1); px(0xe4e4c9, x + 16 - t, y - 33 - t * 3, 2, 1); px(0xe4e4c9, x + 12, y - 31 - t * 3, 5, 1); }
      if (!f.stopImpacted) {
        if (op === Op.Well) for (let i = 0; i < 5; i++) px(0x9bd2da, x + this.facing * (12 + i * 2), y - 22 + (i + t) % 5 * 3, 1, 2);
        if (op === Op.Plant || op === Op.Harvest) { const color = op === Op.Plant ? 0xb29765 : 0x8ea765; px(color, x + this.facing * (10 + t * 2), y - 6 - t * 3, 2, 1, .75); px(op === Op.Plant ? 0x8a704d : 0xb3be82, x + this.facing * (15 - t), y - 3 - (t + 1) % 3 * 3, 1, 1, .65); }
        if (WORK_OPS.has(op)) for (let i = 0; i < 3; i++) if ((t + i) % 2) { px(0xf0d895, x + this.facing * (17 + i * 3), y - 23 - i * 4, 1, 3); px(0xf0d895, x + this.facing * (16 + i * 3), y - 22 - i * 4, 3, 1); }
        if (op === Op.Craft) {
          const progress = Math.min(1, f.elapsed / this.impactTime(f)), recipe = RECIPES[f.receipt.arg]!;
          px(0x8c633b, 420, 301, 24, 2); px(0xd6af70, 421, 301, 22, 1);
          for (let i = 0; i < Math.floor(progress * 4); i++) px(0xd2b078, 418 + i * 8, 305 + i % 2, 2, 1);
          const reveal = Math.floor(Math.max(0, progress - .2) / .8 * 20);
          if (f.receipt.success && reveal > 0) this.workpiece.setTexture(this.itemTexture(recipe.output)).setCrop(0, 20 - reveal, 20, reveal).setVisible(true);
        }
        if ([Op.Toast, Op.CookSteak, Op.Coffee].includes(op)) for (let i = 0; i < 3; i++) px(0xe4e4c6, (op === Op.Coffee && f.receipt.variant !== 2 ? 209 : 175) + i * 4 + Math.sin(clock / 190 + i), 48 - (clock / 130 + i * 3) % 14, 1, 3, .7);
        if ([Op.Wash, Op.DeepClean].includes(op)) for (let i = 0; i < 3; i++) { px(0xc8e0d1, x + i * 6 - 5, y - 21 - t * 2 - i % 2 * 3, 3, 2); px(0xf3efd8, x + i * 6 - 5, y - 21 - t * 2 - i % 2 * 3, 1, 1); }
      }
      if (f.stopImpacted && f.receipt.success && (f.receipt.role === 'main' || [Op.Pickup, Op.Well, Op.Ship, Op.Treat].includes(op))) for (let i = 0; i < 3; i++) { px(0xe8d48f, x - 13 + i * 13, y - 31 - t * 3 - i % 2 * 5, 1, 3); px(0xe8d48f, x - 14 + i * 13, y - 30 - t * 3 - i % 2 * 5, 3, 1); }
    }
    if (this.reaction?.surprise && this.reaction.until > clock) { px(0xf4d979, this.point.x + 11, this.point.y - 37, 2, 5); px(0xf4d979, this.point.x + 11, this.point.y - 30, 2, 2); }
    if (this.attention > this.elapsed) { const blink = Math.floor(this.elapsed / 170) % 2; px(0xe7d48e, this.point.x - 12, this.point.y - 29 - blink, 1, 3); px(0xe7d48e, this.point.x - 13, this.point.y - 28 - blink, 3, 1); }
    if (this.state.house.fire) { for (let i = 0; i < 5; i++) px(this.state.house.fire === 1 ? 0xf2b651 : 0x747b72, 172 + i * 3, 56 - (this.elapsed / 80 + i * 4) % 23, 3, 5, .7); }
    if (this.rainUntil >= this.timeSlot && this.rainUntil > 0) { for (let i = 0; i < 44; i++) px(0xa5c4c7, 33 + i * 37 % 442, 452 + (i * 23 + this.elapsed / 40 * 3) % 322, 1, 4, .55); }
    if (this.visitorUntil >= this.timeSlot && this.visitorUntil > 0) { const p = BEDS[this.visitorBed] || BEDS[0]!, x = p.x + 20, y = p.y - 10 - (Math.floor(this.elapsed / 300) % 4 === 0 ? 2 : 0); px(0x514230, x - 4, y - 6, 10, 6); px(0x9c8051, x - 3, y - 5, 7, 4); px(0x6b583c, x + 2, y - 9, 5, 5); px(0x233532, x + 5, y - 7); px(0xd2a552, x + 7, y - 6, 3, 1); }
    if (this.state.alive) { const x = this.point.x, y = this.point.y; if (!this.state.conditions[2]?.resolved && this.state.conditions[2]?.severity) { px(0xe0dec3, x + 2, y - 16, 5, 2); px(0xc06052, x + 4, y - 17, 1, 4); } if (!this.state.conditions[3]?.resolved && this.state.conditions[3]?.severity) px(0xa5b97d, x + 10, y - 32 - t, 2, 2); if (!this.state.conditions[6]?.resolved && this.state.conditions[6]?.severity) { px(0x947546, x - 4, y - 14, 2, 1); px(0x947546, x + 1, y - 9, 2, 1); } }
    // Slow moving light, leaf flicks and butterflies give the place a pulse without inventing events.
    for (let i = 0; i < 4; i++) { const x = 350 + i * 34 + Math.sin(this.elapsed / 2300 + i * 3) * 10, y = 488 + i * 44 + Math.sin(this.elapsed / 1700 + i) * 8; a.fillStyle(i % 2 ? 0xd7ce97 : 0xb7c37c, .72); a.fillRect(Math.round(x), Math.round(y), 2, 1); }
    const butterflyX = 252 + Math.sin(this.elapsed / 3600) * 28, butterflyY = 616 + Math.cos(this.elapsed / 2400) * 16, wing = Math.floor(this.elapsed / 180) % 2;
    a.fillStyle(0xf1c777).fillRect(Math.round(butterflyX) - 3, Math.round(butterflyY) - wing, 3, 2 + wing).fillRect(Math.round(butterflyX) + 1, Math.round(butterflyY) - wing, 3, 2 + wing); a.fillStyle(0x6d6340).fillRect(Math.round(butterflyX), Math.round(butterflyY), 1, 3);
    // A cloth hem and two leaf tips move by one native pixel; nothing advances game state.
    const breeze = Math.floor(this.elapsed / 1100) % 3 === 0 ? 1 : 0;
    a.fillStyle(0xece5c4).fillRect(96 + breeze, 546, 23, 1); a.fillStyle(0x87c1bd).fillRect(145 + breeze, 541, 14, 1); a.fillStyle(0xe6ad8b).fillRect(168 + breeze, 538, 9, 1);
    a.fillStyle(0x7ca75a, .8).fillRect(394 + breeze, 50, 2, 1).fillRect(303 - breeze, 373, 2, 1);
    for (let i = 0; i < 4; i++) { const plant = this.plotPreview.get(i) || this.state.plots[i]!; if (plant.kind && !plant.ticks) { const p = BEDS[i]!, blink = (this.elapsed / 500 + i) % 5; if (blink < 1) { a.fillStyle(0xf0dfa0, .75).fillRect(p.x + 20, p.y - 40, 1, 3).fillRect(p.x + 19, p.y - 39, 3, 1); } } }
    this.marks.clear();
    if (this.selected && this.selected.until > this.elapsed) { const target = this.selected.target, p = target.kind === 'bed' ? BEDS[target.index || 0]! : target.kind === 'well' ? { x: 280, y: 533 } : target.kind === 'workshop' ? { x: 432, y: 321 } : target.kind === 'mailbox' ? { x: 424, y: 728 } : this.point;
      this.marks.fillStyle(0xf0d474, .9);
      for (const [x, y, w, h] of [[p.x - 26, p.y - 35, 9, 1], [p.x - 26, p.y - 35, 1, 9], [p.x + 17, p.y - 35, 9, 1], [p.x + 25, p.y - 35, 1, 9], [p.x - 26, p.y + 2, 9, 1], [p.x - 26, p.y - 6, 1, 9], [p.x + 17, p.y + 2, 9, 1], [p.x + 25, p.y - 6, 1, 9]]) this.marks.fillRect(x!, y!, w!, h!);
    }
    const slot = this.timeSlot, dim = Math.max(slot > 45 ? Math.min(.42, (slot - 45) / 36) : slot < 8 ? (8 - slot) * .012 : 0, .26 * (1 - rise)); this.night.setAlpha(Math.max(dim, this.state.house.powerOut ? .16 : 0));
    this.lampGlow.clear(); if (dim > .14 && !this.state.house.powerOut) { this.lampGlow.fillStyle(0xf5d68c, dim * .15).fillRect(336, 62, 36, 42).fillRect(329, 73, 50, 24); this.lampGlow.fillStyle(0xf2d798, dim * .35).fillRect(349, 71, 11, 9); }
  }
  dispose(): void { this.cancelFilm(); this.pending = undefined; }
}

export function createV2WorldRenderer(host: HTMLElement, options: V2WorldOptions): V2WorldController {
  let resolveReady!: () => void; const ready = new Promise<void>(resolve => { resolveReady = resolve; }); const scene = new LifeScene(options, resolveReady);
  const size = () => { const r = host.getBoundingClientRect(); return pixelViewport(Math.max(1, r.width), Math.max(1, r.height)); };
  const first = size(); scene.resizeWorld(first.width, first.height, first.scale);
  const game = new Phaser.Game({ type: Phaser.AUTO, parent: host, width: first.width, height: first.height, backgroundColor: '#263c3c', pixelArt: true, roundPixels: true, antialias: false, antialiasGL: false, autoRound: true, render: { antialias: false, antialiasGL: false, pixelArt: true, roundPixels: true, mipmapFilter: 'NEAREST' }, scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.NO_CENTER, zoom: first.scale, width: first.width, height: first.height }, scene: [scene], audio: { noAudio: true }, fps: { target: 60 } });
  let disposed = false, frame = 0, previous = first;
  const resize = () => {
    if (disposed || !game.isBooted) return;
    const next = size(); game.scale.getParentBounds(); game.scale.updateBounds();
    if (next.width === previous.width && next.height === previous.height && next.scale === previous.scale) return;
    previous = next; game.scale.setZoom(next.scale); game.scale.resize(next.width, next.height); scene.resizeWorld(next.width, next.height, next.scale);
  };
  const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(resize); }); observer.observe(host); void ready.then(resize);
  return { ready, setState: (state, options) => scene.setState(state, options), playReceipt: (r, o) => scene.play(r, o), setPaused: value => scene.setPaused(value), setPlaybackRate: rate => scene.setPlaybackRate(rate), setInputEnabled: enabled => scene.setInputEnabled(enabled), setOpening: phase => scene.setOpening(phase), setDawn: phase => scene.setDawn(phase), setViewportInsets: (t, b, l, r) => scene.setInsets(t, b, l, r), focus: target => scene.focus(target), followActor: () => scene.follow(), resize, destroy: () => { disposed = true; observer.disconnect(); cancelAnimationFrame(frame); scene.dispose(); game.destroy(true); } };
}
