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

Published once at **18:05:53 Bangkok time** (11:05:53 UTC), deployment `6aeb1185c9b13b8dc8d87c39`, from source commit `570060a`. GitHub remains soft-banned according to the owner; commits are local and the release used Netlify's direct upload. Its Netlify Git commit reference is null.

The updated API and all three existing Node24/API-v2 functions were packaged and verified; background preparation and the five-minute reconciliation schedule remain intact. Twelve hosted compiled assets match local bytes. The new live directory returns complete fresh snapshots for one NEAR and eight Robinhood lives, cursor continuation preserves the snapshot, and MAPLE name/ID search succeeds. Both NFT JSON endpoints now advertise their exact public life page. Known identity HTTP metadata and the future-life fallback work on the hosted site, and the current contracts ZIP keeps its original SHA256.

All eight hosted responsive views render without horizontal overflow or eager game/wallet modules. An actual hosted click path passes Explore → MAPLE → Visit home, and selected saved days auto-start for MAPLE/RH and FERN/NEAR. Zero browser errors or API writes occurred in that check. No signature, funded inference, chain transaction or financial/service ledger reset was used for this release.

[Hosted directory/metadata proof](verification/nft-viewing/hosted-directory.json) · [assets/functions](verification/nft-viewing/hosted-assets.json) · [responsive captures](verification/nft-viewing/hosted-captures.json) · [hosted journey](verification/nft-viewing/hosted-journey.json) · [final compiled import graph](verification/nft-viewing/build.json). The four representative screenshots above are refreshed from the live release.

The future burn module was committed separately as `bc1924c`; it was not deployed or activated. A rollout-choice question remains pending. No existing testnet life or token was migrated. Mainnet and hackathon submission were not performed in this viewing-page sprint.
