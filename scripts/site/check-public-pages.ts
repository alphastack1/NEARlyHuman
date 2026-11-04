import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildPublicPages, escapeMarkup, pageHtml, PUBLIC_PAGES, sitemap, templateAssets } from './build-public-pages';

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

// Isolated fixture output only; no existing build, service state or ledger is touched.
const dir = path.resolve('TEMP/website-build/metadata-fixture');
await mkdir(path.join(dir, 'assets'), { recursive: true });
await writeFile(path.join(dir, 'assets/app.js'), '/* fixture bundle */');
await writeFile(path.join(dir, 'assets/app.css'), '/* fixture stylesheet */');
await writeFile(path.join(dir, 'index.html'), template);
const result = await buildPublicPages(dir);
assert.equal(result.pages, 4 + result.articles);
assert.equal(result.socialImage, false);
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
console.log(JSON.stringify({ ...result, escaping: true, noMissingImageAdvertised: true, optionalImageIncludedWhenPresent: imageResult.socialImage, allPageAssetsAndBodyPreserved: true, pass: true }));
