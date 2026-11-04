import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARTICLES } from '../../src/site/content';
import { PROJECT } from '../../src/site/project';

export interface PublicPageMetadata { pathname: string; title: string; description: string }

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

/** Change only managed head metadata; Vite's body, module scripts and asset
 * links are preserved byte-for-byte. No server renderer or extra runtime. */
export function pageHtml(template: string, page: PublicPageMetadata, origin: string, socialImage?: string): string {
  const match = template.match(/^([\s\S]*?<head\b[^>]*>)([\s\S]*?)(<\/head>[\s\S]*)$/i);
  if (!match) throw Error('The Vite template has no document head.');
  const [, before, originalHead, after] = match;
  const head = originalHead!
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

export async function buildPublicPages(outDir = path.resolve('dist')) {
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
  for (const page of PUBLIC_PAGES) {
    const target = path.join(directory, page.pathname.slice(1), 'index.html');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, pageHtml(template, page, origin, socialImage));
  }
  await writeFile(path.join(directory, 'sitemap.xml'), sitemap(PUBLIC_PAGES, origin));
  await writeFile(path.join(directory, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /.netlify/\nDisallow: /app\n\nSitemap: ${origin}/sitemap.xml\n`);
  return { pages: PUBLIC_PAGES.length, articles: ARTICLES.length, assetReferencesPreserved: assets.length, socialImage: !!socialImage };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--out-dir')) throw Error('Usage: tsx scripts/site/build-public-pages.ts [--out-dir directory]');
  console.log(JSON.stringify({ ...await buildPublicPages(args[1]), pass: true }));
}
