# NFT discovery and exact-life research — 4 November 2026

Research only. No product source, transactions, consent confirmations, deployments or profile resets. Codex shared browser CDP9222; each script tracked and closed its one owned tab. Third-party artwork stays reference material, not production assets.

## Actual references inspected

| Platform / page | Actual observation | Useful adaptation |
| --- | --- | --- |
| [OpenSea Cool Cats items](https://opensea.io/collection/cool-cats-nft/items) | Collection identity/chain context, tabbed content, search/filter/sort and portrait grid. Phone collection statistics consume much of the first view. | Keep world/collection identity and a compact control row. Omit market statistics for our viewing experience. |
| [OpenSea exact Cool Cat7729](https://opensea.io/item/ethereum/0x1a92f7381b9f03921564a437210bb9396471050c/7729) | Large art left, identity/owner/standard and action pane right; Details/Orders/Activity below. Phone image first and sticky bottom conversion actions. | Portrait-led two-column desktop/one-column phone; primary Visit home reachable while scrolling; quiet external tools. |
| [Rarible Cool Cats](https://rarible.com/collection/0x1a92f7381b9f03921564a437210bb9396471050c/items) | Search/sort next to grid, generous cards and collection/back context. Mobile long description/stats pushes all cards below first view. | Compact intro and bounded description; keep actual roosters visible early. |
| [Rarible exact Cool Cat1615](https://og.rarible.com/token/0x1a92f7381b9f03921564a437210bb9396471050c:1615) | Portrait dominates; name/collection and share tools grouped; primary action in a contained pane; properties and activity progressively disclosed. | One strong action; Share alongside identity; Garden/Belongings/Days separate from technical metadata. |
| [Aavegotchi Explore](https://www.aavegotchi.com/explore/aavegotchis) | Good nearest gameplay analogue: two-column phone art cards, name/ID search, compact sort/filter controls. Marketplace versions contain many game-specific filters. | Name/ID search, world selector, restrained status filter and Discover/Longest lives modes. No rarity/filter taxonomy without actual meaning. |
| [Aavegotchi Baazaar](https://www.aavegotchi.com/baazaar/aavegotchis?chainId=8453) | Desktop filter rail and dense portrait grid; phone filters collapse to icons. | Filters stay optional; open browsing without wallet. |
| [Aavegotchi leaderboard](https://www.aavegotchi.com/earn) | Separate categories/snapshots and rank podium; mobile decorative podium occupies substantial space before entries. | Clear ranking meaning, no decorative podium before real life cards; equal scores share ranks. |
| [Axie collection](https://app.axieinfinity.com/marketplace/axies/) / [Axie12211801](https://app.axieinfinity.com/marketplace/axies/12211801/) | Creature art, owner/status pane, grouped Traits/Body parts/Genes/Utilities and breadcrumb. Legal confirmation overlay blocks a clean complete browse; no confirmation clicked. | Keep game facts grouped; current locked/status fact matters more than raw metadata. Do not import Axie's large stat taxonomy. |
| [CryptoPunk5822](https://www.cryptopunks.app/cryptopunks/details/5822) | Strong identity/portrait/breadcrumb/attributes hierarchy in a simple page. Terms overlay observed; no agreement clicked. | Crisp original pixel portrait and direct factual identity; no imitation rarity counts. |
| [Courtyard marketplace](https://courtyard.io/marketplace) | Compact search/sort row, very art-led physical-card grid, readable card title/value summaries; separate leaderboard entrance. | Let each portrait breathe; one concise card footer. Do not copy the market-value badge. |
| [Tensor Mad Lads](https://www.tensor.trade/trade/madlads) | Trading workstation with many financial actions, stats, sweep/bid modes and compressed layouts. | Useful negative reference: avoid this density in a virtual-pet discovery page. |
| [Magic Eden collection](https://magiceden.io/collections/ethereum/0x23581767a106ae21c074b2276d25e5c3e136a68b) | Browser403; cookie surface only. No bypass or consent attempt. Official help describes collection browsing and item-detail entry. | Do not claim a complete live visual review for the blocked surface. |

All captures and extracted headings/actions are in `platforms.json`, `details.json`, `collectibles.json` and `{page}-{desktop,phone}.png` beside this file. The exact figures/prices seen are incidental observations, not facts to reuse in NEARlyHuman.

## Proposed screen map

### Explore

Existing website frame → short title → familiar NEAR/Robinhood world selector → Discover / Longest lives → Search name or#ID → portrait grid.

Card: current dynamic portrait, name/#ID, one progression metric, living/remembered status, one Visit action. Make the card itself the clear destination; avoid nested button/link conflicts. At390px a two-column grid works; ensure title/footer and tap area survive320px. Keep filter/sort optional and restrained, without financial controls or fake community numbers.

Preserve view/world/query and scroll on return from a life. Search empty state needs Clear search or Show all lives. Do not fabricate an empty collection when a data request failed. A cached snapshot can remain useful with quiet freshness context.

### Exact life

Breadcrumb back to Explore (preserving its filter) → square portrait + identity/status → one primary Visit home → optional Watch saved day → Share and verified external links.

Desktop: art/summary two-column composition. Phone: portrait then identity; a compact sticky Visit action can help reachability on longer pages, provided safe-area and bottom padding are accounted for. Keep wallet connection out of public viewing. Visit home hands ownership-only controls to the existing app.

Below the hero: Garden (four real beds), Belongings (actual nonzero stock), NHC purse and saved days. Do not frame withdrawal as a loss of achievement or insist that owners transfer a funded purse; the owner's earning/withdrawal use case remains valid. No generated biography or future Jev itinerary.

Use progressive disclosure for full owner/contract addresses, token standard, network, observed block, source and explorer. Strengths can use the three existing stats with concise gameplay meaning. Do not claim rarity percentages, financial value, sales history or milestones unsupported by authority.

Saved-day cards should identify the day and provide a Watch link, without showing the unwatched itinerary. Use the existing game replay route; do not mount Phaser in every card or on public page load.

### External marketplace behavior

The inspected current OpenSea item pattern is `/item/<chain-slug>/<contract>/<tokenId>`. A syntactically valid URL is not evidence of support or successful indexing. Never default a Robinhood/native NEAR asset to Ethereum just because the contract address resembles an EVM address. Only show an OpenSea action for an exact supported chain/environment/asset after verification; keep the actual explorer action for other worlds. No disabled Coming soon notices or fake Buy buttons.

If metadata's `external_url` is updated to a new public profile, preserve all existing root exact-NFT/game links. The new profile's Visit action should resolve the exact world and NFT, and browsing another world must not cause a wallet-chain switch.

## Design priorities

1. Art before analytics.
2. One obvious action, supporting tools grouped quietly.
3. Exact identity/world and reliable back context.
4. Actual gameplay facts before technical metadata.
5. Public browsing requires no wallet, payment or AI call.
6. Ordinary failure/empty/loading states retain a useful next action.

The approved cream/teal/leaf/apricot software-window treatment remains the visual language. Borrow hierarchy and interaction conventions rather than the references' dark trading themes or marketing chrome.
