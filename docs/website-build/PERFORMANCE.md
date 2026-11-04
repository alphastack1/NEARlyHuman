# Website loading refinement — 4 November 2026

## Question

Can the public website appear sooner on a phone while preserving the selected artwork and keeping its downloads separate from the game?

## Change

- Generate responsive AVIF and WebP illustrations directly from the original PNGs, preserving transparency exactly. The common 2× phone uses a **107,624-byte** hero rather than **501,190 bytes**: **78.5% less image data**. Higher-density devices can choose the 960px variant; full-size artwork remains available. [Encoding details and hashes](PERFORMANCE_IMAGES.md).
- Share one image-size definition between the rendered picture and its early resource hint. The homepage can start its illustration, public module and CSS requests before the lazy page runs.
- Restrict homepage hints to an exact bare `/` visit. Old NFT links, wallet returns and `/app` retain the game entry without marketing downloads. Other public pages receive only their public module/CSS hints.
- Lazy-load supporting pictures and keep the hidden handbook illustration from downloading on phones. Cache static website art for an hour, with background revalidation; API responses remain uncached.

## Evidence and decision

The final controlled comparison served the previous published page and frozen candidate over the same local gzip server. Chrome used a390×844 viewport at2× density,150ms latency,1.6Mbps download and4× CPU slowdown, with the owned target's cache disabled. Three runs per version produced:

| Measure | Previous page | Optimized candidate |
| --- | ---: | ---: |
| Median largest contentful paint |4,068ms |1,584ms |
| Individual LCP runs |4,268 /4,068 /4,032ms |1,888 /1,576 /1,584ms |
| Median first contentful paint |1,296ms |1,548ms |
| Hero image bytes |501,190 |107,624 |
| Median hero request start |1,199ms |332ms |

The hero appears substantially sooner; the earlier image request shares bandwidth with the first text paint, which was about250ms later in this comparison. Accept this balance: first text remains responsive and the page's largest visual no longer arrives several seconds afterward. These are controlled measurements, not a guarantee for every connection or a claim that every phase improved. [Measurement record](verification/performance/controlled-load.json).

Actual browser checks passed at390px/2×,360px/3× and1440px/1×, plus desktop/phone handbook and phone project pages. Each homepage fetched one correctly sized image. Visible images decoded, no horizontal overflow appeared, and the game handoff worked. Direct game entry and an old root game link fetched no marketing chunks or pictures. No browser errors, wallet signing, paid inference or financial writes occurred. [Browser record](verification/performance/candidate-browser.json), [phone](verification/performance/home-phone.png), [desktop](verification/performance/home-desktop.png).

The focused public-head checks passed for19 pages,15 articles and14 root-query/hash exclusions. The full production build passed. An independent reviewer checked route isolation, image/hash consistency and caching scope. Both canonical rooster files remain byte-identical, and the contracts source archive remains SHA256 `96eb30080976baf50f386e131e338ad69d8575c410210fa55fe2cfeb85e83053`.

## Publication

The optimized candidate will receive one final Netlify publication and hosted readback. GitHub's signed-in browser shows the public repository and README, but anonymous requests still return404 and saved CLI/app authentication still fails. No new production push is attempted through that unresolved connection; deployment and later repository synchronization are recorded separately.
