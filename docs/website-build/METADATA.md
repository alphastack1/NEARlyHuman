# Public page metadata

4 November 2026. The existing Vite application now emits a small static HTML entry for every real public page. This is a post-build head generator, not another server renderer or framework.

## Generated output

`npm run build` runs the existing TypeScript/Vite build, then `tsx scripts/site/build-public-pages.ts`. It uses Vite's emitted `dist/index.html` as a template and the actual article catalog in `src/site/content.ts`.

- `/`, `/the-game`, `/project`, `/docs` and the 15 current handbook articles: 19 public pages total.
- Each receives its own escaped title, description, canonical URL, Open Graph title/description/URL and Twitter summary metadata.
- `sitemap.xml` lists those exact public routes on the configured project origin. No app, imaginary articles, query NFT IDs or private API routes are added to the sitemap.
- `robots.txt` allows the public site and points to the sitemap while excluding `/api/`, `/.netlify/` and `/app` from crawler discovery. This is crawler advice, not access control; it changes no app behavior.

If `dist/site/social-card.png` exists and is nonempty, it is included as the absolute social image and the card becomes `summary_large_image`. Otherwise no image URL is advertised. To add the card, put the verified image in `public/site/social-card.png` before the final build. No hardcoded image dimensions or nonexistent asset are emitted.

## Preserved boundaries

The generator edits only managed metadata inside the document head. Vite's module scripts, asset references and the body are retained. It validates absolute `/assets/` references against actual built files; a relative or missing bundle fails the step instead of publishing broken deep-page assets.

Direct refresh of a docs route uses that page's static head and the same application entry. Its pathname still selects the public page. Existing root NFT/world/wallet-return queries continue to use the root entry and unchanged route classifier. The generator does not redirect, consume callbacks, alter `/api` precedence or write any runtime service data. The existing Netlify redirects remain unchanged.

The body remains client-rendered. This step provides accurate direct-fetch/share metadata and route discovery; it does not claim server-rendered article contents or a search ranking guarantee.

## Focused verification

`npx tsx scripts/site/check-public-pages.ts` creates its own disposable template/assets in ignored `TEMP/website-build/metadata-fixture`. It verifies:

- 19 pages derived from the current 15-article catalog;
- escaping of quotes, apostrophes, ampersands and angle brackets;
- one current canonical/title/description/OG set rather than duplicate stale tags;
- no missing social-image advertisement, and inclusion once an image is present;
- unchanged module/CSS references and exact body across every generated page;
- sitemap route count and robots sitemap declaration;
- rejection of relative bundle URLs that would break nested docs.

The fixture check passed. It performs no browser, network, wallet, inference, service-ledger or publication operation. Final release verification should also inspect generated heads and assets from the actual built candidate. The script itself and the production build do not depend on fixture contents or any pre-existing TEMP file.
