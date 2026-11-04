# Public handbook content

4 November 2026. Player-first content lives in `src/site/content.ts` as plain TypeScript data. It does not import the game engine, wallets, service modules or private configuration.

## Structure

Fifteen substantive articles sit in four groups:

- Start here: Your first day; Worlds & wallets; Help & recovery.
- Life at home: Care & supplies; Strengths & personality; Garden; Workshop; Weather & visitors.
- What you own: NFT & purse; NHC; Sharing & transfers; Remembered lives.
- Under the hood: Jev & saving; Contracts & official links; Public life & your data.

The actual catalog has **15** entries: first-day, worlds-wallets, care-supplies, strengths-personality, garden, workshop, weather-visitors, nft-purse, nhc, sharing-transfers, remembered-lives, jev-saving, contracts, troubleshooting, privacy-data. Group counts are 3 / 5 / 4 / 3.

Each article exposes title, summary, group, stable section IDs, concise paragraph/list/table/link blocks, and related article slugs. Body copy is ordinary text; the UI provides real HTML, search, readable tables, article outlines and next links. Prices are not frozen into these articles; the current app/wallet quote is the payment authority.

## Factual review sources

- Current README and `src/v2/types.ts`, `state.ts`, `catalog.ts`, `kernel.ts`.
- `src/app/v2/V2Journey.tsx` for current Strengths, sign-in, packing and recovery presentation.
- `server/v2/choices.ts` and `preparation.ts` for actual Jev context and delegated choice authority.
- `server/auth.ts`, `server/near/auth.ts`, `src/app/game-api.ts` and `src/chain/near-connector.ts` for public/private/session/browser-data descriptions.
- Current checked-in Robinhood/native NEAR deployment files and native contract/wallet review notes.
- Verified repository remote: https://github.com/alphastack1/NEARlyHuman.

Important distinctions retained: no offline aging; at most three different parcel supplies/one productive packet; damp initial planting versus subsequent well watering; finite wet-bedtime growth; craft costs 3/6/8/10 real wood; finished-goods shipment rather than guaranteed sales; backed purse; owner withdrawal after death; no automatic NFT burn; separate testnet lives/token supplies; free ownership sign-in versus paid day acceptance; failure records retained without automatic refund; trusted relay rather than attested inference; rare unavoidable structural death disclosed in the relevant deeper article.

Contracts address cards belong to the site's shared public project data rather than duplicated changing balances in prose. Source and Open App links now use `PROJECT.sourceUrl` and `PROJECT.appHref` from `src/site/project.ts`. No financial/service state or private key was accessed or changed.

## Focused verification

A pure-data check imported the final content and verified 15 unique slugs, all four known groups (3 / 5 / 4 / 3), 57 sections with unique IDs per article, table row/header agreement, valid related-article references, resolvable internal guide links and HTTPS/local link forms. Result: zero errors. This is a content-structure check; the PM owns real browser readability/navigation review. Scratch checking code remains under ignored TEMP; the content does not depend on it.

## External link check

Primary source reads on 4 November 2026:

- https://docs.near.org/getting-started/faucet — linked from current official NEAR docs; valid. The old `/tools/faucet` path returns 404 and is not used.
- https://help.meteorwallet.app/en/collections/1-getting-started — official Meteor support; valid. The web wallet itself rejected text fetch with 403; no unsupported setup steps inferred from it.
- https://docs.robinhood.com/chain/connecting/ — official network guide confirms testnet ID 46630.
- https://robinhood.com/us/en/support/articles/robinhood-chain-testnet/ — official support confirms testnet faucet destination.
- https://faucet.testnet.chain.robinhood.com/ — first-party support links it; fetch blocked by 403. No faucet availability/amount/cooldown promise made.
- https://rabby.io/ — official EVM wallet site; JS-only shell returned. No claim of a particular install flow or UI was inferred.

No third-party recommendation, market-price estimate, mainnet deployment claim, audit badge, community link or privacy/legal guarantee was invented.

## Owner-directed editorial refinement

The owner asked for occasional personality rather than repeating the same “nearly human / little life” joke throughout the site. The handbook now uses descriptive summaries, plain instructions and direct headings such as Pack supplies, Daily routines, Storage & shipping and Help & recovery. Repeated diminutives and cute packing/purse metaphors were removed while retaining approachable game language. Section IDs remain stable for existing anchors; old wording inside an ID is not displayed. Contract-link wording is position-neutral because the UI may place address cards before the article.
