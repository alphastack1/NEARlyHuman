# Public NFT viewing and discovery

4 November 2026. The owner authorized attractive public NFT pages and collection browsing, while declining an internal NFT marketplace and the proposed funded-purse handoff narrative. Token earning/withdrawal remains a valid use; no sale, swap liquidity or guaranteed cash-out is implied by these viewing pages.

## Pages and behavior

- `/explore`: choose a served world, Discover or Longest lives, search a name/number, optionally filter living/remembered lives, and visit an exact NFT. The single-life NEAR collection has a deliberate featured treatment rather than artificial filler. Ranking uses completed lifetimes/level, shares ranks for ties and never ranks purse balances.
- `/life/{near-testnet|robinhood-testnet}/{id}`: canonical current portrait, identity/status, Visit home and Watch saved day; then owner/strengths, four garden beds, belongings, NHC purse, recorded days and collapsed chain details. Public viewing never requests a wallet or starts inference.
- Exact app links bind world, collection and token. `view=home` skips the duplicate game profile; `view=watch&day=N` starts the selected verified film. Existing root NFT links retain their original profile behavior.
- NFT metadata's `external_url` now opens the new public life page. Twenty-nine static metadata pages include the nine verified life identities. Future unlisted NFTs receive an accurate generic life HTTP head and load live identity/canonical metadata in the client, without requiring a production deployment for every mint.

Explore retains world/query/expanded pages/scroll when returning. API-check freshness is separate from scroll-save time. Changing filters cancels obsolete reads; matching snapshots preserve expanded pages. Errors do not masquerade as empty collections. Retry, Show all and back actions remain reachable.

## Research and visual direction

[Platform research](NFT_PLATFORM_RESEARCH.md) covers eight collectible platforms, with actual desktop/phone inspections and recorded access/consent limits. Useful patterns came from OpenSea/Rarible item hierarchy, Aavegotchi game-collectible grids/rankings and Axie's grouped creature facts. Third-party screenshots/art remain temporary references, not product assets.

The implementation keeps the approved cream, teal, leaf and apricot materials. Artwork leads; one Visit action stays obvious, with a phone dock only while the inline action is offscreen. Technical identifiers are disclosed below game facts. No fake prices, rarity, sales, popularity or community counters were added.

Item icons reuse the exact existing paint commands through a shared lightweight renderer. All 39 item indices retain their rounded ordered paint instructions. Both original rooster files are unchanged. Public pages load no Phaser, viem, wallet or NEAR Connect runtime before the app handoff; the viewing module and its CSS load only on viewing routes.

## Authority and external links

[The discovery backend](NFT_DISCOVERY_BACKEND.md) publishes verified complete, pinned snapshots in a new public-only cache namespace, with durable cursors, bounded reads, tied ranks and explicit stale/failure behavior. Current exact-life details use their normal authoritative endpoints. The directory's 128-life per-world refresh bound is explicit; it must be replaced by a larger incremental index before a larger deployment rather than silently truncating a ranking.

Current explorer links work for their exact network. **No OpenSea button is rendered for these testnet/native deployments.** OpenSea discontinued testnets, and native NEAR is absent from its verified chain catalog. A future indexed Robinhood mainnet asset can receive its verified `opensea_url`; a plausible-looking mainnet URL for a testnet NFT would be wrong. [Official testnet retirement](https://support.opensea.io/en/articles/11833955-farewell-testnets), [chain catalog](https://api.opensea.io/api/v2/chains), [Robinhood mainnet support](https://opensea.io/blog/articles/robinhood-chain-is-live-on-opensea).

The revised **0.5% transfer burn** is separate future-contract work. [The fixed-rate, controller-toggled ERC-20 module](../../contracts/token/README.md) passed 18 local execution groups and an independent review, including gross allowances, actual supply burns, purse backing and direct 250-NHC birth burns. It is not activated on the immutable existing Robinhood token. Native NEAR remains a migration/refund design, not a claimed live implementation. No existing NFT, token balance, financial ledger, budget or deployment identity was replaced to make a tax appear active.

## Critique and verification

First rendered reviews found phone actions below the fold, oversized Share/copy tools, a sparse singleton grid and a Filter that did not dismiss. Interaction review found a non-autoplay Watch handoff, mismatched search length and cache freshness renewed by browsing. Those were fixed and rechecked. A final phone review caught footer links under the fixed action dock; end-of-document clearance now preserves their touch targets at 390px, 320px and scoped 130% supporting text.

Evidence:

- [Journey](verification/nft-viewing/journey.json): worlds, ties, search/no-results, missing NFT, return context and scroll1102→1102.
- [Saved-film handoff](verification/nft-viewing/watch.json): actual Robinhood day1, native NEAR day3, historical Robinhood day27, plus unchanged root-profile behavior.
- [Cache/pagination](verification/nft-viewing/pagination-cache.json) and [freshness](verification/nft-viewing/freshness.json): controlled 16-card pagination, same-head preservation and refresh despite navigation saves.
- [Failure/filter recovery](verification/nft-viewing/filters-retry.json), [public module boundary](verification/nft-viewing/public-boundary.json), and [phone typography/footer stress](verification/nft-viewing/visual.json).
- [Backend controls and chain reads](NFT_DISCOVERY_BACKEND.md#verification): 12 controlled cases, fresh-process cursors, real 1-NEAR/8-Robinhood snapshots and HTTP routing.

No paid model call, wallet signature, testnet/mainnet transaction, service-ledger reset or owner-key read was needed for viewing-page verification. Local public caches and captures stay in ignored TEMP; permanent source/builds do not depend on them. Future burn execution tests used an isolated local Anvil chain only.

## Publication

The owner reports the GitHub account is soft-banned and is resolving it. Commits stay local; the final hosted candidate is published directly through Netlify. Because the API changed, package the updated API with all three existing Node24/API-v2 functions and retain the reconciliation schedule. Do not substitute an old API bundle or drop functions for a static-only upload. Hosted identity and final readback follow the finished release.
