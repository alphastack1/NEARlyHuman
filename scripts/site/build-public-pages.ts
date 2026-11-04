import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARTICLES } from '../../src/site/content';
import { PROJECT, SITE_IMAGES } from '../../src/site/project';

export interface PublicPageMetadata { pathname: string; title: string; description: string }
export interface PublicImagePreload { href: string; srcSet: string; sizes: string; type: 'image/avif' }
export interface PublicPerformanceHints { siteModule: string; siteStylesheets: string[]; hero?: PublicImagePreload }
export const HOME_HERO_PRELOAD: PublicImagePreload = {
  href: SITE_IMAGES.hero.avifDefault, srcSet: SITE_IMAGES.hero.avifSrcSet,
  sizes: SITE_IMAGES.hero.sizes, type: 'image/avif',
};

export const PUBLIC_PAGES: readonly PublicPageMetadata[] = [
  { pathname: '/', title: 'NEARlyHuman — A little life. A mind of its own.', description: 'Hatch a rooster NFT, leave a few supplies and watch an AI-led day unfold. A retro life game, with a home, belongings and history of its own.' },
  { pathname: '/the-game', title: 'The game · NEARlyHuman', description: 'Hatch a rooster NFT. Choose up to three supplies. Watch Jev decide what to grow, make and do during a day at home.' },
  { pathname: '/project', title: 'The project · NEARlyHuman', description: 'Explore NEARlyHuman, its NEAR AI-powered days, testnet worlds, source and onchain ownership. Inspect the actual contracts and trust boundaries.' },
  { pathname: '/docs', title: 'The player handbook · NEARlyHuman', description: 'Guides to the first day, care, garden, workshop, NFT ownership, wallets, NHC and how Jev and saving work.' },
  ...ARTICLES.map(article => ({ pathname: `/docs/${article.slug}`, title: `${article.title} · NEARlyHuman`, description: article.summary })),
];

export function escapeMarkup(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const MANAGED_META = new Set([
  'description', 'og:type', 'og:site_name', 'og:title', 'og:description', 'og:url',
  'og:image', 'og:image:width', 'og:image:height', 'og:image:alt',
  'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt',
]);
function attribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

const PERFORMANCE_SCRIPT_ID = 'nh-public-performance';

/** Start the public page's critical requests before the lazy React page is
 * evaluated. The root template also serves old NFT/wallet URLs, so its hints
 * intentionally apply only to an exact bare homepage visit. */
export function performanceHead(page: PublicPageMetadata, hints?: PublicPerformanceHints): string {
  if (!hints) return '';
  const root = page.pathname === '/';
  const payload = JSON.stringify({ siteModule: hints.siteModule, siteStylesheets: hints.siteStylesheets, hero: root ? hints.hero : undefined })
    .replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const gate = root ? "if(location.pathname!=='/'||location.search||location.hash)return;" : '';
  // Preload CSS as a resource, not an already-applied stylesheet: Vite still
  // creates/awaits its stylesheet, preventing a dynamic-style first-paint race.
  return `    <script id="${PERFORMANCE_SCRIPT_ID}">(function(p){${gate}function add(a){if(Array.from(document.head.querySelectorAll('link')).some(function(l){return l.rel===a.rel&&l.getAttribute('href')===a.href}))return;var l=document.createElement('link');Object.keys(a).forEach(function(k){l[k]=a[k]});document.head.appendChild(l)}if(p.hero)add({rel:'preload',as:'image',type:p.hero.type,href:p.hero.href,imageSrcset:p.hero.srcSet,imageSizes:p.hero.sizes,fetchPriority:'high'});p.siteStylesheets.forEach(function(h){add({rel:'preload',as:'style',href:h,crossOrigin:'anonymous'})});add({rel:'modulepreload',href:p.siteModule,crossOrigin:'anonymous'})})(${payload});</script>`;
}

export async function discoverPublicHints(directory: string, hero?: PublicImagePreload): Promise<PublicPerformanceHints | undefined> {
  const files = await readdir(path.join(directory, 'assets'));
  const modules = files.filter(file => /^Site-[A-Za-z\d_-]+\.js$/.test(file));
  const styles = files.filter(file => /^Site-[A-Za-z\d_-]+\.css$/.test(file));
  // Small isolated metadata fixtures need no public split chunks. A real
  // partial/ambiguous Site build must not emit a stale or guessed hint.
  if (!modules.length && !styles.length) return;
  if (modules.length !== 1 || styles.length !== 1) throw Error('Expected one public Site module and stylesheet. Build into a clean output directory.');
  for (const file of [...modules, ...styles]) if (!(await stat(path.join(directory, 'assets', file))).isFile()) throw Error(`Public hint is not a built file: ${file}`);
  if (hero) {
    const sources = [hero.href, ...hero.srcSet.split(',').map(item => item.trim().split(/\s+/)[0]!)];
    if (!hero.sizes.trim()) throw Error('The hero preload needs the same sizes as its picture.');
    for (const source of new Set(sources)) {
      if (!/^\/site\/[A-Za-z\d_-]+\.avif$/.test(source)) throw Error(`Unexpected public image hint: ${source}`);
      if (!(await stat(path.join(directory, source.slice(1)))).isFile()) throw Error(`Missing public preload image: ${source}`);
    }
  }
  return { siteModule: `/assets/${modules[0]}`, siteStylesheets: [`/assets/${styles[0]}`], ...(hero ? { hero } : {}) };
}

/** Update managed head metadata and resource hints. Vite's body, module
 * scripts and asset links stay byte-for-byte; no server renderer is added. */
export function pageHtml(template: string, page: PublicPageMetadata, origin: string, socialImage?: string, performanceHints?: PublicPerformanceHints): string {
  const match = template.match(/^([\s\S]*?<head\b[^>]*>)([\s\S]*?)(<\/head>[\s\S]*)$/i);
  if (!match) throw Error('The Vite template has no document head.');
  const [, before, originalHead, after] = match;
  const head = originalHead!
    .replace(/<script\b[^>]*\bid=["']nh-public-performance["'][^>]*>[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>\s*/gi, '')
    .replace(/<meta\b[^>]*>\s*/gi, tag => MANAGED_META.has((attribute(tag, 'name') || attribute(tag, 'property') || '').toLowerCase()) ? '' : tag)
    .replace(/<link\b[^>]*>\s*/gi, tag => (attribute(tag, 'rel') || '').toLowerCase().split(/\s+/).includes('canonical') ? '' : tag);
  const canonical = new URL(page.pathname, origin).href;
  const meta = (key: string, value: string, property = false) => `    <meta ${property ? 'property' : 'name'}="${key}" content="${escapeMarkup(value)}" />`;
  const metadata = [
    `    <title>${escapeMarkup(page.title)}</title>`,
    meta('description', page.description),
    `    <link rel="canonical" href="${escapeMarkup(canonical)}" />`,
    meta('og:type', 'website', true), meta('og:site_name', PROJECT.name, true),
    meta('og:title', page.title, true), meta('og:description', page.description, true), meta('og:url', canonical, true),
    meta('twitter:card', socialImage ? 'summary_large_image' : 'summary'),
    meta('twitter:title', page.title), meta('twitter:description', page.description),
  ];
  if (socialImage) {
    const imageUrl = new URL(socialImage, origin).href;
    metadata.push(meta('og:image', imageUrl, true), meta('og:image:alt', 'NEARlyHuman — a domestic pixel art home and garden.', true), meta('twitter:image', imageUrl));
  }
  const hints = performanceHead(page, performanceHints);
  if (hints) metadata.push(hints);
  return `${before}${head.trimEnd()}\n${metadata.join('\n')}\n  ${after}`;
}

/** The per-route copies must keep Vite's absolute asset links. Relative bundle
 * links would resolve inside /docs/article/ and must fail the build visibly. */
export function templateAssets(template: string): string[] {
  const assets: string[] = [];
  for (const tag of template.match(/<(?:script|link)\b[^>]*>/gi) || []) {
    const source = attribute(tag, 'src') || attribute(tag, 'href');
    if (!source || !/(?:^|\/)assets\//.test(source)) continue;
    if (!source.startsWith('/assets/')) throw Error(`Public page bundle must use root asset URLs: ${source}`);
    assets.push(source);
  }
  return assets;
}

export function sitemap(pages: readonly PublicPageMetadata[], origin: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page => `  <url><loc>${escapeMarkup(new URL(page.pathname, origin).href)}</loc></url>`).join('\n')}\n</urlset>\n`;
}

export async function buildPublicPages(outDir = path.resolve('dist'), heroPreload = HOME_HERO_PRELOAD) {
  const directory = path.resolve(outDir), origin = new URL(PROJECT.siteUrl).origin;
  if (!origin.startsWith('https://')) throw Error('The public website origin must use HTTPS.');
  const unique = new Set<string>();
  for (const page of PUBLIC_PAGES) {
    if (!/^\/(?:the-game|project|docs(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?)?$/.test(page.pathname) || unique.has(page.pathname)) throw Error(`Invalid or duplicate public page: ${page.pathname}`);
    unique.add(page.pathname);
  }
  const template = await readFile(path.join(directory, 'index.html'), 'utf8');
  const assets = templateAssets(template);
  if (!assets.length) throw Error('Build public pages after Vite has emitted its assets.');
  for (const source of assets) {
    const relative = source.split(/[?#]/)[0]!.slice(1);
    if (relative.split('/').includes('..')) throw Error('Unexpected asset path.');
    if (!(await stat(path.join(directory, relative))).isFile()) throw Error(`Missing built asset: ${source}`);
  }
  const socialFile = path.join(directory, 'site', 'social-card.png');
  const socialImage = await stat(socialFile).then(info => info.isFile() && info.size > 0 ? '/site/social-card.png' : undefined).catch(() => undefined);
  const performanceHints = await discoverPublicHints(directory, heroPreload);
  for (const page of PUBLIC_PAGES) {
    const target = path.join(directory, page.pathname.slice(1), 'index.html');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, pageHtml(template, page, origin, socialImage, performanceHints));
  }
  await writeFile(path.join(directory, 'sitemap.xml'), sitemap(PUBLIC_PAGES, origin));
  await writeFile(path.join(directory, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /.netlify/\nDisallow: /app\n\nSitemap: ${origin}/sitemap.xml\n`);
  return { pages: PUBLIC_PAGES.length, articles: ARTICLES.length, assetReferencesPreserved: assets.length, socialImage: !!socialImage, earlyPublicHints: !!performanceHints, earlyHeroHint: !!performanceHints?.hero };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--out-dir')) throw Error('Usage: tsx scripts/site/build-public-pages.ts [--out-dir directory]');
  console.log(JSON.stringify({ ...await buildPublicPages(args[1]), pass: true }));
}
