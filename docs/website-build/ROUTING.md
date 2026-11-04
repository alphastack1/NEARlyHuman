# Website and game route foundation

4 November 2026. Public presentation is integrated into the existing repository and Netlify origin. No wallet, API, game kernel, deployment, credential, service ledger or storage key changes are part of this boundary.

## Entry behavior

| URL | Destination |
| --- | --- |
| `/` without game markers, including normal UTM tracking | Public website |
| `/the-game`, `/project`, `/docs`, `/docs/:slug` | Public website route |
| Unknown public path | Website's useful not-found view |
| `/app` and `/app/` | Existing game version selector |
| `/app?v2=1` | Current game explicitly; used by website Open App |
| Existing root NFT/world/version/day/recovery URLs | Existing game at the original URL |
| Root wallet return query/hash markers | Existing game, with callback data untouched |

`src/site/routing.ts` is a small pure classifier. Root markers include `rooster`, `id`, `day`, `collection`, `chainId`, `networkId`, `v2`, `legacy` and explicit pending/recovery identifiers. NEAR wallet return identifiers such as `account_id`, `public_key`, `transactionHashes`, errors and signed-message fragments bypass the marketing homepage. Their presence only selects the entry surface; this layer does not parse authority, trust values, sign, consume callbacks or rewrite URLs.

Malformed world links still reach the game's existing validator. Bare historic `?rooster=1` retains the legacy collection selection. Known legacy collection addresses retain that version; an explicit `v2=1` selects the current game. A `v2=0` parameter keeps the previously shipped selector semantics rather than silently introducing a new legacy switch.

Queries on named public pages do not unexpectedly open the game. In particular, a wallet-guide world filter remains a docs URL, and marketing UTM parameters never count as game intent.

## Loading and navigation

`src/app/Entry.tsx` selects a lazy `Site` or `GameEntry`. The public website does not statically import the Phaser renderer, wallet connector or game styles. `GameEntry.tsx` loads the original font, styles.css and viewport.css before the existing lazy V2/legacy app. Moving those imports out of main.tsx prevents global game rules (`body { overflow:hidden }`, fixed root height, pixel-font controls) from constraining website reading.

Entry sets `html[data-surface]` and the browser theme colour. Public CSS can scope its document rules to `html[data-surface="site"]`. The two surfaces use normal document links; the website is not an application router around the mounted game. This keeps cached game CSS from leaking through a same-document game → site transition and lets ordinary browser Back preserve document history. Neither auth nor financial storage is cleared.

The game menu adds quiet **Website** and **Player guide** links in new tabs. The original life stays mounted while a player reads. No viewport/prepare/payment path or pending-state handler is changed by these links.

## Hosting

The existing Netlify redirect order already sends `/api/*` to Functions before the SPA wildcard fallback. It supports direct docs/app refresh without an additional rewrite. API route and asset precedence remain unchanged. Existing `gameLifeUrl` continues to emit its canonical root query URL, so NFT metadata and previously shared links need no migration.

## Focused checks

Run `npx tsx scripts/site/check-routing.ts` for 30 surface cases, 11 version cases and preservation of an original callback URL. These cases target the real regression risk: a new marketing root capturing an older exact-life or wallet-return URL. A final browser review must also inspect normal navigation, direct-refresh docs, exact NEAR/RH links, a historical legacy link and the lazy public bundle before release. No repeated paid day or mint is required for this presentation-only boundary.
