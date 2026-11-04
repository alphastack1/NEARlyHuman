# Public website — implementation plan

4 November 2026. The owner selected Morning Gate's warm sunlit palette/world and Little Life Utility's retro software layout. This pass implements that hybrid around the current two-testnet game, including a complete public handbook. The existing canonical rooster remains unchanged.

## Foundations and ownership

- PM: shared public components/styles, Home, The game, Docs index/search/articles, Project/contracts presentation, error navigation, actual visual QA and one final release.
- Route specialist: lazy public/game entry, existing root/NFT/world/callback routing, game-only CSS boundary, narrow website/guide exits from the game, route regression evidence.
- Content specialist: player-first handbook articles, facts checked against current code/deployments, concise tables and truthful ownership/AI/help/privacy reference.
- Art specialist: four hybrid mockup boards spanning desktop/phone/site/docs/help plus a production-ready illustrated home/garden asset. No new rooster art.
- Independent critics after implementation: entry/recovery correctness, first-visit clarity and phone visual balance. Findings drive focused fixes before publication.

## Pages and content

| Route | Purpose | Main action |
| --- | --- | --- |
| `/` | World, emotional premise and clear app entrance. Concise hatch/pack/watch rhythm and NFT continuity. | Open App |
| `/the-game` | Visual explanation, supplies, daily autonomy, garden/workshop and ownership. No future choice spoilers. | Open App |
| `/docs` | Find an answer; four small topic groups and useful search. | Your first day |
| `/docs/:slug` | Real articles: first day, wallets/worlds, care, garden, workshop, events, NFT/purse, NHC, transfers, remembered lives, AI/saving, contracts, help and data. | Relevant next article / Open App |
| `/project` | Project purpose, NEAR AI role, actual chain contracts, source and trust boundaries. No fake team/partner/stat/roadmap content. | Source / contract / Open App |
| Unknown public route | Clear return to the site or guide. | Back home |
| `/app` | Existing game unchanged, with its current wallet and life context. | Existing game action |

## Integration constraints

Old exact-NFT/root query links continue directly to their intended game version and world, including malformed links reaching existing validation. Preserve query/hash callbacks, native wallet returns, pending journals and selected-life context. New public pages use normal anchors into the app, avoiding residual game CSS on public navigation. API rewrites retain precedence. Game/chain/authentication libraries load only on game entry; the public home and handbook do not bootstrap them.

Use one public project-data module for verified contract identifiers, official source and per-world app links. Deployment snapshots supply identifiers only, never stale balances, admission flags or live status claims. Current prices stay in the actual app. No changes to service ledgers, AI campaign, wallet authority, game rules, contracts or mainnet.

## Visual implementation

Warm ivory surfaces, deep teal title bars and ink edges, restrained green desktop texture, apricot primary controls, bright garden details. Pixel display type accents short bars; ordinary body type carries articles. Real functional tabs/menu/search/copy controls. No fake desktop controls, crowded crypto statistics, token chart, obligatory animation or wallet gate on docs.

Phone first at 390px, with checks for 320px/short phones, wider phones, tablet and desktop. Header actions stay reachable; docs contents becomes a drawer. Text remains HTML. At larger text settings important content scrolls/wraps instead of clipping. Tiny foliage/cloud/light/sprite details make the site alive; Open App is available immediately.

## Build and critique sequence

1. Map routes and interfaces; create hybrid mockups in parallel with data/foundations.
2. Build shared window/navigation/typography, then complete pages and handbook search.
3. Insert and optimize production environment art and exact canonical rooster renders.
4. Build once; inspect real phone/desktop captures beside selected/hybrid mockups.
5. Fresh independent critiques, targeted fixes and only meaningful repeated checks.
6. Verify all public routes/articles, search/no-results/keyboard behavior, app boundaries, old NFT/native links and absence of paid/service mutations during QA.
7. Commit and make one finished testnet-site release through the existing Netlify/main connection; verify public site and both testnet app entries. Mainnet stays disabled.

Temporary scripts/captures/builds stay ignored in TEMP; final source/assets/mockups/review evidence are permanent. Final runtime must not depend on TEMP. The selected visual direction is authorized; no additional design approval is required.

## Owner steering during implementation

- Keep occasional personality but remove repeated diminutives, bird jokes and themed wordplay from routine navigation, instructions and errors. Main tagline can remain; ordinary copy stays direct.
- Spend further critique loops on actual visual fine polish: type, controls, layout balance, spacing, tables, responsive flow and the exact relationship to the approved mockups.
- Upgrade actual dynamic NFT artwork around the unchanged canonical rooster. Both native NEAR and Robinhood share the SVG portrait renderer. Only saved facts may affect plants/items/damage; cosmetic architecture is deterministically seeded. No new AI choices, state, token values or contract changes.
- The owner approved publication of a reviewed contracts-only source download. The full GitHub repository remains private until a separately authorized visibility change. Official hackathon requirements need a public project repository before submission; first prepare a tracked-files/history review. No submission or X post is being sent during this website sprint.
