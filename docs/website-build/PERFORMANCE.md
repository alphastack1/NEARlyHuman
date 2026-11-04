# Website loading refinement — 4 November 2026

## Question

Can the public website appear sooner on a phone while preserving the selected artwork and keeping its downloads separate from the game?

## Change

- Generate responsive AVIF and WebP illustrations directly from the original PNGs, preserving transparency exactly. The common 2× phone uses a **107,624-byte** hero rather than **501,190 bytes**: **78.5% less image data**. Higher-density devices can choose the 960px variant; full-size artwork remains available. [Encoding details and hashes](PERFORMANCE_IMAGES.md).
- Share one image-size definition between the rendered picture and its early resource hint. The homepage can start its illustration, public module and CSS requests before the lazy page runs.
- Restrict homepage hints to an exact bare `/` visit. Old NFT links, wallet returns and `/app` retain the game entry without marketing downloads. Other public pages receive only their public module/CSS hints.
- Lazy-load supporting pictures and keep the hidden handbook illustration from downloading on phones. Cache static website art for an hour, with background revalidation; API responses remain uncached.

## Evidence and decision

The final controlled comparison served the previous published page and frozen candidate over the same local gzip server. Chrome used a 390×844 viewport at 2× density, 150ms latency, 1.6Mbps download and 4× CPU slowdown, with the owned target's cache disabled. Three runs per version produced:

| Measure | Previous page | Optimized candidate |
| --- | ---: | ---: |
| Median largest contentful paint | 4,068ms | 1,584ms |
| Individual LCP runs | 4,268 / 4,068 / 4,032ms | 1,888 / 1,576 / 1,584ms |
| Median first contentful paint | 1,296ms | 1,548ms |
| Hero image bytes | 501,190 | 107,624 |
| Median hero request start | 1,199ms | 332ms |

The hero appears substantially sooner; the earlier image request shares bandwidth with the first text paint, which was about 250ms later in this comparison. Accept this balance: first text remains responsive and the page's largest visual no longer arrives several seconds afterward. These are controlled measurements, not a guarantee for every connection or a claim that every phase improved. [Measurement record](verification/performance/controlled-load.json).

Actual browser checks passed at390px/2×,360px/3× and1440px/1×, plus desktop/phone handbook and phone project pages. Each homepage fetched one correctly sized image. Visible images decoded, no horizontal overflow appeared, and the game handoff worked. Direct game entry and an old root game link fetched no marketing chunks or pictures. No browser errors, wallet signing, paid inference or financial writes occurred. [Browser record](verification/performance/candidate-browser.json), [phone](verification/performance/home-phone.png), [desktop](verification/performance/home-desktop.png).

The focused public-head checks passed for19 pages,15 articles and14 root-query/hash exclusions. The full production build passed. An independent reviewer checked route isolation, image/hash consistency and caching scope. Both canonical rooster files remain byte-identical, and the contracts source archive remains SHA256 `96eb30080976baf50f386e131e338ad69d8575c410210fa55fe2cfeb85e83053`.

## Publication

Published once at **14:35:21 Bangkok time** (07:35:21 UTC), deployment `6aeae02e3af56a46fb3f2476`, from local candidate commit `3c0ff48`. This was a direct deployment of the verified build; its Netlify commit reference is consequently null.

Hosted readback verified all 12 new image variants byte-for-byte, correct AVIF/WebP content types and the new cache headers. The live browser repeated all six responsive page views, the app handoff and both game-entry exclusions. The 23 service/source checks passed, including both testnet lives and their dynamic NFT portraits. Netlify's function inventory confirms all three existing Node24 / API-v2 functions, the background preparation mode and the five-minute reconciliation schedule. [Assets/function metadata](verification/performance/hosted-assets.json), [hosted browser](verification/performance/hosted-browser.json), [services](verification/performance/hosted-services.json).

The deployed site's three checks under the same phone throttling settings gave LCPs of 1,924 / 1,996 / 1,548ms (median **1,924ms**). Each fetched the 107,624-byte image once through the early hint. These hosted timings are a post-release confirmation, separate from the controlled before/after pair above. [Hosted measurement](verification/performance/hosted-load.json).

GitHub's signed-in browser shows the public repository and README, with no visible account warning. Anonymous requests still return 404 and saved CLI/app authentication still fails. No new production push was attempted through that unresolved connection. The optimization is committed locally; GitHub synchronization remains pending. There were no environment edits, ledger resets, mainnet operations or additional paid AI calls.
