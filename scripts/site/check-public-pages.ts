import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { buildPublicPages, discoverPublicHints, escapeMarkup, HOME_HERO_PRELOAD, pageHtml, PUBLIC_PAGES, sitemap, templateAssets, type PublicPerformanceHints } from './build-public-pages';
import { SITE_IMAGES } from '../../src/site/project';
import { ACTIVE_ROBINHOOD, ORIGINAL_ROBINHOOD } from '../../src/chain/deployment-catalog';
import { searchArticles } from '../../src/site/search';

const template = '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>Old title</title><meta content="old" name="description"><meta property="og:title" content="Old"><meta content="missing.png" property="og:image"><link href="https://old.invalid/" rel="canonical"><script type="module" crossorigin src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css"><link rel="icon" href="/favicon.svg"></head><body><div id="root"></div><script>window.keep="<unchanged>";</script></body></html>';
const page = { pathname: '/docs/example', title: 'An "NFT" & <life>', description: "One's home > a picture & a story." };
const output = pageHtml(template, page, 'https://nearlyhuman.netlify.app');
assert.ok(output.includes('<title>An &quot;NFT&quot; &amp; &lt;life&gt;</title>'));
assert.ok(output.includes('content="One&#39;s home &gt; a picture &amp; a story."'));
assert.equal((output.match(/rel="canonical"/g) || []).length, 1);
assert.equal((output.match(/name="description"/g) || []).length, 1);
assert.equal((output.match(/property="og:title"/g) || []).length, 1);
assert.ok(output.includes('https://nearlyhuman.netlify.app/docs/example'));
assert.ok(!output.includes('missing.png') && !output.includes('https://old.invalid/'));
assert.ok(!output.includes('property="og:image"'));
assert.deepEqual(templateAssets(output), templateAssets(template));
assert.equal(output.slice(output.indexOf('</head>')), template.slice(template.indexOf('</head>')));
assert.ok(output.includes('<meta charset="UTF-8">') && output.includes('<meta name="viewport" content="width=device-width">'));
const withImage = pageHtml(output, page, 'https://nearlyhuman.netlify.app', '/site/social-card.png');
assert.ok(withImage.includes('https://nearlyhuman.netlify.app/site/social-card.png'));
assert.ok(withImage.includes('content="summary_large_image"'));
assert.equal((withImage.match(/property="og:image"/g) || []).length, 1);
assert.equal(escapeMarkup('<&>"\''), '&lt;&amp;&gt;&quot;&#39;');
assert.throws(() => templateAssets('<script src="./assets/app.js"></script>'), /root asset URLs/);
assert.ok(sitemap([page], 'https://nearlyhuman.netlify.app').includes('<loc>https://nearlyhuman.netlify.app/docs/example</loc>'));

const hints: PublicPerformanceHints = { siteModule: '/assets/Site-hash.js', siteStylesheets: ['/assets/Site-hash.css'], hero: HOME_HERO_PRELOAD };
const home = PUBLIC_PAGES.find(item => item.pathname === '/')!;
const hintedHome = pageHtml(template, home, 'https://nearlyhuman.netlify.app', undefined, hints);
const hintedArticle = pageHtml(template, page, 'https://nearlyhuman.netlify.app', undefined, hints);
assert.equal((pageHtml(hintedHome, home, 'https://nearlyhuman.netlify.app', undefined, hints).match(/id="nh-public-performance"/g) || []).length, 1);
assert.equal(hintedHome.slice(hintedHome.indexOf('</head>')), template.slice(template.indexOf('</head>')));
assert.deepEqual(templateAssets(hintedHome), templateAssets(template));
assert.deepEqual(HOME_HERO_PRELOAD.map(image => [image.href, image.media]), [
  ['/site/open-house-phone.webp', '(max-width: 720px)'], ['/site/open-house-desktop.webp', '(min-width: 721px)'],
]);
assert.ok(!hintedHome.includes(SITE_IMAGES.hero.avifDefault), 'The homepage must not fetch the previous static hero.');

interface HintLink { rel?: string; href?: string; as?: string; type?: string; media?: string; crossOrigin?: string; imageSrcset?: string; imageSizes?: string; fetchPriority?: string; getAttribute(name: string): string | undefined }
function executeHints(html: string, url: string) {
  const code = html.match(/<script id="nh-public-performance">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(code, 'Expected a managed public-hints script.');
  const links: HintLink[] = [];
  const context = { location: new URL(url), document: {
    createElement: (tag: string) => { assert.equal(tag, 'link'); return { getAttribute(this: HintLink, name: string) { return this[name as keyof HintLink] as string | undefined; } }; },
    head: { querySelectorAll: (selector: string) => { assert.equal(selector, 'link'); return links; }, appendChild: (link: HintLink) => links.push(link) },
  } };
  runInNewContext(code!, context);
  // The runtime guard also avoids duplicate requests if accidentally invoked
  // twice, independently of pageHtml's replacement of old managed scripts.
  const count = links.length; runInNewContext(code!, context); assert.equal(links.length, count);
  return links;
}
const homeHints = executeHints(hintedHome, 'https://nearlyhuman.netlify.app/');
assert.equal(homeHints.length, 4);
assert.deepEqual(homeHints.map(link => [link.rel, link.as || '']), [['preload', 'image'], ['preload', 'image'], ['preload', 'style'], ['modulepreload', '']]);
assert.deepEqual(homeHints.slice(0, 2).map(link => [link.href, link.media]), HOME_HERO_PRELOAD.map(image => [image.href, image.media]));
assert.equal(homeHints[0]!.imageSrcset, undefined);
assert.equal(homeHints[0]!.imageSizes, undefined);
assert.equal(homeHints[0]!.type, 'image/webp');
assert.equal(homeHints[0]!.fetchPriority, 'high');
assert.equal(homeHints[2]!.crossOrigin, 'anonymous');
assert.equal(homeHints[3]!.crossOrigin, 'anonymous');
const fonts = ['/assets/figtree-latin-wght-normal-hash.woff2', '/assets/pixelify-sans-latin-wght-normal-hash.woff2'];
const fontHome = executeHints(pageHtml(template, home, 'https://nearlyhuman.netlify.app', undefined, { ...hints, fonts }), 'https://nearlyhuman.netlify.app/');
const fontArticle = executeHints(pageHtml(template, page, 'https://nearlyhuman.netlify.app', undefined, { ...hints, fonts }), 'https://nearlyhuman.netlify.app/docs/example');
assert.deepEqual(fontHome.filter(link => link.as === 'font').map(link => link.href), fonts);
assert.deepEqual(fontArticle.filter(link => link.as === 'font').map(link => link.href), [fonts[0]]);
for (const [query, slug] of [['two signatures','jev-saving'],['how much does it cost','worlds-wallets'],['my rooster died','remembered-lives'],['can I sell my rooster','sharing-transfers'],['water plants','garden'],['connect Meteor','worlds-wallets'],['toy boat','workshop'],['how do I earn money','nhc']]) assert.equal(searchArticles(query!)[0]?.slug,slug,query);
for (const query of ['', 'zxqv blorptastic', 'wallet zxqv']) assert.equal(searchArticles(query).length,0);
const skipped = [
  '/?rooster=1', '/?id=1&day=3', '/?v2=1', '/?collection=0x123&chainId=46630',
  '/?networkId=near-testnet&collection=account.testnet', '/?account_id=owner.testnet',
  '/?transactionHashes=hash', '/?pending=request', '/?utm_source=x',
  '/#features', '/#account_id=owner.testnet', '/#/?transactionHashes=hash',
  '/app?v2=1', '/docs/first-day',
];
for (const route of skipped) assert.equal(executeHints(hintedHome, 'https://nearlyhuman.netlify.app' + route).length, 0, route);
const articleHints = executeHints(hintedArticle, 'https://nearlyhuman.netlify.app/docs/example?filter=care');
assert.equal(articleHints.length, 2);
assert.ok(articleHints.every(link => link.as !== 'image'));
assert.ok(!hintedArticle.includes(SITE_IMAGES.hero.avifDefault));
assert.ok(!/localStorage|sessionStorage|fetch\(|wallet-|phaser-/i.test(hintedHome.match(/<script id="nh-public-performance">([\s\S]*?)<\/script>/)![1]!));

// Isolated fixture output only; no existing build, service state or ledger is touched.
await mkdir(path.resolve('TEMP/website-build'), { recursive: true });
const dir = await mkdtemp(path.resolve('TEMP/website-build/metadata-fixture-'));
await mkdir(path.join(dir, 'assets'), { recursive: true });
await writeFile(path.join(dir, 'assets/app.js'), '/* fixture bundle */');
await writeFile(path.join(dir, 'assets/app.css'), '/* fixture stylesheet */');
await writeFile(path.join(dir, 'index.html'), template);
const result = await buildPublicPages(dir);
assert.equal(result.pages, PUBLIC_PAGES.length);
assert.ok(PUBLIC_PAGES.some(page => page.pathname === '/explore'));
assert.ok(PUBLIC_PAGES.some(page => page.pathname === '/life/robinhood-testnet/8' && page.title.includes('MAPLE')));
assert.ok(PUBLIC_PAGES.some(page => page.pathname === '/life/robinhood-testnet/1' && page.title.includes('MISO')));
assert.ok(PUBLIC_PAGES.some(page => page.pathname === `/life/robinhood-testnet/${ACTIVE_ROBINHOOD.runtime.collection.toLowerCase()}/1` && page.title.includes('CLOVER')));
assert.notEqual(ACTIVE_ROBINHOOD.runtime.collection.toLowerCase(), ORIGINAL_ROBINHOOD.runtime.collection.toLowerCase());
assert.ok(!PUBLIC_PAGES.some(page => page.pathname === `/life/robinhood-testnet/${ACTIVE_ROBINHOOD.runtime.collection.toLowerCase()}/8` && page.title.includes('MAPLE')), 'An old collection name must not be assigned to a new collection ID.');
assert.ok(PUBLIC_PAGES.some(page => page.pathname === '/life/near-testnet/1' && page.title.includes('FERN')));
assert.equal(result.socialImage, false);
assert.equal(result.earlyPublicHints, false);
for (const item of PUBLIC_PAGES) {
  const html = await readFile(path.join(dir, item.pathname.slice(1), 'index.html'), 'utf8');
  assert.ok(html.includes(`<title>${escapeMarkup(item.title)}</title>`), item.pathname);
  assert.ok(html.includes(new URL(item.pathname, 'https://nearlyhuman.netlify.app').href), item.pathname);
  assert.deepEqual(templateAssets(html), ['/assets/app.js', '/assets/app.css']);
  assert.equal(html.slice(html.indexOf('</head>')), template.slice(template.indexOf('</head>')));
}
assert.equal(((await readFile(path.join(dir, 'sitemap.xml'), 'utf8')).match(/<url>/g) || []).length, PUBLIC_PAGES.length);
const robots = await readFile(path.join(dir, 'robots.txt'), 'utf8');
assert.ok(robots.includes('Disallow: /api/') && robots.includes('Sitemap: https://nearlyhuman.netlify.app/sitemap.xml'));
await mkdir(path.join(dir, 'site'), { recursive: true });
await writeFile(path.join(dir, 'site/social-card.png'), 'present-fixture');
const imageResult = await buildPublicPages(dir);
assert.equal(imageResult.socialImage, true);
assert.ok((await readFile(path.join(dir, 'docs/index.html'), 'utf8')).includes('property="og:image"'));
const futureLife = await readFile(path.join(dir, 'life/index.html'), 'utf8');
assert.ok(futureLife.includes('A saved life'));
assert.ok(!/rel="canonical"|property="og:url"/.test(futureLife), 'Unknown future lives must not advertise the homepage as their canonical identity.');
// A split public build discovers current hashes, checks selected image files
// and emits an image hint only in the homepage template.
await writeFile(path.join(dir, 'assets/Site-fixture.js'), '/* current Site module */');
await writeFile(path.join(dir, 'assets/Site-fixture.css'), '/* current Site CSS */');
for (const image of HOME_HERO_PRELOAD) await writeFile(path.join(dir, image.href.slice(1)), 'fixture WebP bytes');
const splitResult = await buildPublicPages(dir);
assert.equal(splitResult.earlyPublicHints, true);
assert.equal(splitResult.earlyHeroHint, true);
const builtHome = await readFile(path.join(dir, 'index.html'), 'utf8');
const builtArticle = await readFile(path.join(dir, 'docs/first-day/index.html'), 'utf8');
assert.equal(executeHints(builtHome, 'https://nearlyhuman.netlify.app/')[3]!.href, '/assets/Site-fixture.js');
assert.equal(executeHints(builtArticle, 'https://nearlyhuman.netlify.app/docs/first-day').length, 2);
await assert.rejects(discoverPublicHints(dir, [{ href: '/site/missing.webp', type: 'image/webp' }]), /ENOENT|Missing public preload image/);
await writeFile(path.join(dir, 'assets/Site-stale.js'), '/* must not guess among multiple hashes */');
await assert.rejects(discoverPublicHints(dir, HOME_HERO_PRELOAD), /clean output directory/);
console.log(JSON.stringify({ ...splitResult, escaping: true, noMissingImageAdvertised: true, optionalImageIncludedWhenPresent: imageResult.socialImage, allPageAssetsAndBodyPreserved: true, earlyHints: { bareHomepage: true, skippedRootVariants: skipped.length, noHeroOnArticles: true, cssPreloadKeepsViteStylesheetWait: true, complementaryWebpPosters: true, idempotent: true, builtHashDiscovery: true, missingAndAmbiguousAssetsRejected: true }, pass: true }));
