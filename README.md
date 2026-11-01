# NEARlyHuman

A little life. A mind of its own.

Hatch a rooster NFT, bring up to three supplies, and watch NEAR AI's Jev choose its own domestic routine. The rooster cooks, rests, gardens, repairs its home and tries to stay alive. Its completed state and compact action history are saved on Robinhood Chain before the film begins. Nothing ages while you are away. A life that ends remains in your wallet as a memorial.

**Play:** [nearlyhuman.netlify.app](https://nearlyhuman.netlify.app). The current collection uses Robinhood Chain Testnet, chain **46630**, and allows three saved days per rooster. Test ETH has no real-world value. The mainnet mint is designed around approximately $1 in ETH with fail-closed feed pricing; mainnet release requires its separately funded deployment.

## Run locally

Use Node 22.12 or later, install with `npm ci`, then run `npm run dev`. Open `http://127.0.0.1:5173`. Supply the server environment described in [.env.example](.env.example) and [the release guide](docs/release.md). The owner's Windows workstation can optionally unlock its existing encrypted credentials outside this checkout; credentials are never part of the game bundle.

`npm run build` checks TypeScript and creates the browser build. Netlify builds the API, background preparation worker and scheduled reconciler from `netlify/functions/`. Local durable records live outside the checkout; production uses site-wide Netlify Blobs with strong reads and conditional writes. No production source, asset or build depends on `TEMP/`.

## How it works

- The wallet authorizes a mint or next-day request using a short-lived signed quote. The service reserves AI budget, relay gas and a worker slot before issuing that quote.
- Jev receives the actual state and finite legal choices through NEAR AI's `/v1/systemone` endpoint. It can use supplied items as it chooses. Deterministic steps do not buy model calls.
- A fenced, checkpointed worker prepares the complete day, stores its replay packet and commits the packed state, compact history and replay hash onchain.
- The phone-first Phaser house follows the rooster through recorded activities. Pause, inspect, seek and skip affect presentation only.
- Operational failures are recorded without advancing the biological save. A retry is a fresh request. Transactions are not deleted or refunded. Pending requests lock transfers; expired requests have a direct onchain release path.

The service is a trusted relay. Jev is called through NEAR AI; this integration does not claim that offchain inference is trustless or attested. Pseudo-random game outcomes are intentionally suitable for a casual game.

## Project map

| Area | Location |
| --- | --- |
| React screens, wallet flow, HUD and care dock | `src/app/` |
| Serializable simulation and compact codecs | `src/domain/` |
| Connected house, camera, recorded animation and art | `src/game/`, `src/art/`, `public/assets/game/` |
| NFT and request lifecycle | `contracts/`, `src/chain/` |
| Quotes, authentication, real Jev calls and durable work | `server/`, `netlify/functions/` |

The [service guide](docs/service.md), [contract guide](docs/chain.md), [domain notes](docs/domain-notes.md), [asset provenance](docs/assets.md) and [sprint record](docs/SPRINT_RECORD.md) explain decisions and verification. The [refinement audit](docs/UX_AUDIT.md), [screenshot gallery](docs/ux-audit/index.html), [UI coverage ledger](docs/UI_COVERAGE.md) and [recovery witnesses](docs/RECOVERY_AUDIT.md) record the later critique and repair loops. The [gameplay and animation review](docs/GAMEPLAY_REVIEW.md) and its [before/after motion gallery](docs/gameplay-review/index.html) cover the subsequent fun and presentation pass. The first actual day completed sixty slots using twelve Jev calls for a recorded **$0.000707**; this is one measured run, not a fixed future price or balance claim.

## Design references

The [individuality and first-use review](docs/VARIETY_AND_FIRST_USE_REVIEW.md) and [comparison gallery](docs/variety-review/index.html) cover persistent preferences, genuine model timing comparisons, recorded-event clarity and the wallet-free first visit.

The [NPC and house presence review](docs/HOUSE_PRESENCE_REVIEW.md) and [interactive-house evidence gallery](docs/house-review/index.html) cover the later care exploration, physical mannerisms, object responses and useful stock/plot readers.

The [master guide](NEARlyHuman.md), [scene map](design/SCENE_MAP.md), [approved Moss & Cream reference](design/references/VR-01-approved-house-and-care.png) and [99-board mockup gallery](design/mockups/index.html) preserve the agreed vision. [Reference mapping](design/mockups/REFERENCE_MAP.md) assigns every planned screen and storyboard; construction references are in `design/reference-pack/`. Current implementation notes record intentional changes such as a larger portrait supply dock and shorter quiet-film beats.

Temporary experiments, captures, logs and intermediate files belong in the ignored `TEMP/` folder. Production pushes remain infrequent: pushing `main` triggers Netlify and consumes deployment credits.

