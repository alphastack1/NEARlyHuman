import assert from 'node:assert/strict';
import test from 'node:test';
import { roosterSvg } from '../../src/art/rooster';
import { PLANTS } from '../../src/domain/catalog';
import { createState, emptyPlot, seedHex } from '../../src/domain/state';
import type { Plot } from '../../src/domain/types';
import { portraitPlant } from './portrait-plants';
import { evmLifePortrait } from './portrait';

const life = (seed = 1n, name = 'FERN') => ({ name, state: createState({ seed }) });
const plant = (kind: number, ticks: number, left: number = PLANTS[kind]!.yields): Plot => ({ kind, ticks, left, moisture: 1, dry: 0, soilBlocked: false });
const canonicalBody = (seed: string, dead = false) => roosterSvg(seed, 32, dead ? 'dead' : 'idle').replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const roosterBody = (svg: string) => {
  const found = /<g data-canonical-rooster="true">([\s\S]*?)<\/g>/.exec(svg);
  assert.ok(found, 'an identifiable canonical rooster must be present');
  return found[1];
};

test('the exact seeded canonical rooster survives both life states', () => {
  for (const seed of [1n, 2n, 77n, 0xdeadbeefn, (1n << 256n) - 1n]) {
    const fixture = life(seed);
    assert.equal(roosterBody(evmLifePortrait(fixture)), canonicalBody(seedHex(seed)));
    fixture.state.alive = false;
    fixture.state.deathCause = 1;
    assert.equal(roosterBody(evmLifePortrait(fixture)), canonicalBody(seedHex(seed), true));
  }
});

test('saved art is deterministic, does not mutate state, and never depends on a wall clock', () => {
  const fixture = life(91n);
  fixture.state.plots[2] = plant(7, 2, 4);
  const before = structuredClone(fixture);
  const image = evmLifePortrait(fixture);
  assert.equal(evmLifePortrait(fixture), image);
  assert.deepEqual(fixture, before);
  assert.notEqual(evmLifePortrait(life(92n)), evmLifePortrait(life(91n)), 'seeded identities must have different art');
});

test('untrusted names remain title text and never create SVG elements or attributes', () => {
  const image = evmLifePortrait(life(1n, '<script href="https://bad.test/">&\'雪</script>'));
  assert.match(image, /&lt;script href=&quot;https:\/\/bad\.test\/&quot;&gt;&amp;&apos;雪&lt;\/script&gt;/);
  assert.doesNotMatch(image, /<script\b|<foreignObject\b|\son[a-z]+\s*=/i);
});

test('explorer artwork is standalone SVG with local references and no font or active dependency', () => {
  for (const alive of [true, false]) {
    const fixture = life(7n);
    fixture.state.alive = alive;
    const image = evmLifePortrait(fixture);
    assert.match(image, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(image, /viewBox="0 0 160 160"/);
    assert.doesNotMatch(image, /<(?:script|image|foreignObject|style|text|use)\b|(?:href|font-family)=|@import|url\(["']?(?!#)/i);
    assert.doesNotMatch(image, /(?:NaN|undefined|Infinity)/);
    for (const dimensions of image.matchAll(/\b(?:width|height)="([^"]+)"/g)) assert.ok(Number(dimensions[1]) > 0, `positive dimensions required: ${dimensions[0]}`);
  }
});

test('remembered art has an opaque full-canvas base before any faded layers', () => {
  const fixture = life(7n);
  fixture.state.alive = false;
  fixture.state.deathCause = 1;
  const art = evmLifePortrait(fixture).split('<g clip-path="url(#frame)">')[1]?.trimStart();
  assert.ok(art);
  const base = /^<rect\b([^>]*)\/>/.exec(art);
  assert.ok(base, 'remembered art needs a painted background beneath its opacity layers');
  assert.match(base[1], /\bwidth="160"/);
  assert.match(base[1], /\bheight="160"/);
  assert.doesNotMatch(base[1], /opacity=|fill="none"/);
  assert.ok(art.indexOf('opacity=') > base[0].length);
});

test('both seeded orientations keep ordered saved beds and an unmirrored canonical rooster on the porch', () => {
  const orientations = new Set<string>();
  for (const seed of [1n, 2n]) {
    const image = evmLifePortrait(life(seed));
    orientations.add(/data-environment-orientation="([^"]+)"/.exec(image)![1]!);
    assert.deepEqual([...image.matchAll(/data-plot-index="(\d)"/g)].map(m => Number(m[1])), [0,1,2,3]);
    assert.match(image, /data-rooster-placement="porch" transform="translate\((?:15|45) 15\) scale\(3\)"/);
    const groups: string[] = [];
    for (const token of image.matchAll(/<\/?g(?:\s[^>]*)?>/g)) {
      if (token[0].startsWith('</')) groups.pop();
      else {
        if (token[0].includes('data-canonical-rooster')) {
          assert.ok(groups.every(g => !g.includes('scale(-1') && !g.includes('opacity=')), 'the rooster cannot inherit environmental mirroring or grading');
        }
        groups.push(token[0]);
      }
    }
    assert.equal(roosterBody(image), canonicalBody(seedHex(seed)));
  }
  assert.deepEqual([...orientations].sort(), ['garden-left','garden-right']);
});

test('an empty saved bed never invents a plant', () => {
  assert.equal(portraitPlant(emptyPlot(), 30, 50, 123), '');
  assert.equal(portraitPlant(emptyPlot(true), 30, 50, 123), '');
});

test('all nine saved plant kinds have distinct ripe artwork and no premature harvest', () => {
  const harvestColor: Record<number, string[]> = {
    1: ['#f0e8c6', '#fff5d9'], 2: ['#dc9a45', '#f2c46a'],
    3: ['#b5a4cd', '#80688d'], 4: ['#b85b69', '#dd8b88'],
    5: ['#a94642', '#efb17a'], 6: ['#354b6d', '#a6b8c3'],
    7: ['#4e405d', '#a08baa'], 8: ['#923c3e', '#cf6351'],
  };
  const ripe = new Set<string>();
  for (let kind = 1; kind <= 9; kind++) {
    const spec = PLANTS[kind]!;
    const initial = portraitPlant(plant(kind, spec.ticks), 30, 50, 123);
    const mature = portraitPlant(plant(kind, 0), 30, 50, 123);
    assert.ok(initial && mature);
    assert.notEqual(initial, mature, `${spec.name} must grow from its initial stage`);
    ripe.add(mature);
    for (const color of harvestColor[kind] || []) {
      assert.ok(mature.includes(color), `${spec.name} needs its own recognisable ripe harvest`);
      for (let ticks = 1; ticks <= spec.ticks; ticks++) assert.ok(!portraitPlant(plant(kind, ticks), 30, 50, 123).includes(color), `${spec.name} cannot show a ready harvest with ${ticks} saved ticks left`);
    }
  }
  assert.equal(ripe.size, 9, 'all four flowers, four fruits and the wood tree need their own art');
});

test('repeat crops keep their grown structure while waiting for actual saved regrowth', () => {
  for (const kind of [7, 8, 9]) {
    const spec = PLANTS[kind]!;
    const seedling = portraitPlant(plant(kind, spec.ticks), 30, 50, 123);
    const regrowing = portraitPlant(plant(kind, spec.repeat, spec.yields - 1), 30, 50, 123);
    assert.notEqual(regrowing, seedling, `${spec.name} cannot become a new seedling after harvesting`);
    // A grown plant still reaches above the initial sprout's nine-pixel extent.
    const ys = [...regrowing.matchAll(/\by="(-?\d+)"/g)].map(m => Number(m[1]));
    assert.ok(Math.min(...ys) < 30, `${spec.name} must retain its grown canopy`);
    if (kind === 7) assert.ok(!regrowing.includes('#4e405d'), 'regrowing grapes cannot show ripe grapes');
    if (kind === 8) assert.ok(!regrowing.includes('#923c3e'), 'regrowing apples cannot show ripe apples');
  }
});

test('each depicted plant is the plant in its saved bed and inventory changes preserve the rooster', () => {
  for (let kind = 1; kind <= 9; kind++) {
    const fixture = life(38n);
    fixture.state.plots[0] = plant(kind, 0);
    const image = evmLifePortrait(fixture);
    assert.equal(roosterBody(image), canonicalBody(fixture.state.seed));
    // A third-party explorer should show the real kind, never a generic stand-in.
    const original = fixture.state.plots[0];
    for (const otherKind of [kind % 9 + 1]) {
      fixture.state.plots[0] = plant(otherKind, 0);
      assert.notEqual(evmLifePortrait(fixture), image);
    }
    fixture.state.plots[0] = original;
    for (const stock of [6, 7, 30, 31, 32, 33]) {
      fixture.state.inventory[stock] = 1;
      const changed = evmLifePortrait(fixture);
      assert.notEqual(changed, image, `saved inventory ${stock} must be visible`);
      assert.equal(roosterBody(changed), canonicalBody(fixture.state.seed));
      fixture.state.inventory[stock] = 0;
    }
  }
});
