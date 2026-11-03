# NEARlyHuman

A little life. A mind of its own.

NEARlyHuman is a retro, phone-first life game powered by **NEAR AI Cloud's Jev model**. Hatch a rooster NFT, leave a few supplies, and watch it decide what to grow, make, use or send away. Its home, inventory, saved intentions and earned-token purse travel with the NFT. Nothing ages while you are away.

**Hackathon track:** `nfts` — **NFTs That Do Something**. The asset carries continuing behavior, a changing portrait, possessions and rights to real onchain token units.

**Play on testnet:** [nearlyhuman.netlify.app](https://nearlyhuman.netlify.app). Visit [MISO's exact life](https://nearlyhuman.netlify.app/?rooster=1&chainId=46630&collection=0x30cb5213fa94020a95893ddb6b07470dbf7a9efc), or hatch your own. The [release sequence](docs/OVERNIGHT_REFINEMENT.md) records the implementation and verification boundaries.

## A day in a little home

Choose a testnet world, name a rooster, connect its wallet, then explicitly hatch. Optional **Strengths** and alternate payments open on demand; the balanced defaults are ready to use. Meet the newly hatched NFT and pack its first post. An optional short example has a visible exit. Returning owners arrive at their saved home ready to prepare tomorrow; a newly completed day offers its film first.

Choose up to three different supplies, with at most one seed packet or sapling. Jev plans one substantial undertaking and a morning order, then chooses smaller routines such as breakfast, watering, treatment, rest or leisure. The rooster walks through connected rooms, outside to the mailbox, into its garden and over to the workbench. The completed day is saved before its film plays.

Four beds support four flowers, four fruits and one wood-tree variety, with three-, six- or eight-day initial growth. Repeat crops have finite yields. The workshop makes spoons, toy boats, birdhouses and large chests from accumulated wood. Jev may keep produce, enjoy it, eat it or carry finished goods to the outgoing mailbox. A harvest does not guarantee a sale.

Touch objects to inspect them, revisit saved days, share an exact life, or prepare another day. Pause, seek and Finish day change only presentation.

## Ownership with behavior

Shipping earned finished goods can credit **NHC**, a six-decimal utility token: ERC-20 on Robinhood and NEP-141 on native NEAR. Gifted care supplies and raw wood cannot be shipped. Each NFT has its own allocation backed by actual units in its world's contract vault. The current owner can withdraw, including while a day is preparing or after the rooster dies. A remembered life retains its NFT and purse.

An owner can burn **250 NHC** from one selected purse to hatch another NFT atomically. Robinhood wallet-token payment uses an exact approval followed by birth; native NEAR burns the wallet's units directly without an ERC-20 approval. Transferring the NFT transfers its saved life, inventory and remaining purse rights; pending days temporarily lock transfers. Native NEAR supports direct NFT transfer, approval and enumeration; asynchronous `nft_transfer_call` is deliberately disabled.

Each contract verifies material consumption, growth, crafting, death and shipment points through the same deterministic reducer. Each world has its own reward bucket and cumulative lifetime issuance, which reduce later shipment rewards. Birth burns do not reset that pressure. **Lives, inventory, purses and token supplies remain separate between chains; there is no bridge.** NHC has no promised cash redemption.

## Testnet deployment and trust

V2 supports two chain-specific testnet worlds, sharing the game and original procedural rooster artwork. Native NEAR has been verified against its actual public contract with real Meteor Web signing and Jev; Robinhood has a separate real mint-and-day regression. Individual evidence records identify staged and hosted checks.

| World | Wallet | Native hatch price |
| --- | --- | --- |
| Robinhood Chain Testnet, chain 46630 | Rabby or another EVM wallet | 0.0004 test ETH |
| Native NEAR Testnet | Meteor through NEAR Connect | 0.1 test NEAR |

Robinhood contracts:

| Asset | Address |
| --- | --- |
| Collection/controller | [0x30cb5213fa94020a95893ddb6b07470dbf7a9efc](https://explorer.testnet.chain.robinhood.com/address/0x30cb5213fa94020a95893ddb6b07470dbf7a9efc) |
| NHC token | [0x4DC12133f8B71E9FD7e3571d6FAda84a5DdBE5a2](https://explorer.testnet.chain.robinhood.com/address/0x4DC12133f8B71E9FD7e3571d6FAda84a5DdBE5a2) |

The native NEAR collection and NEP-141 token share one contract account: [game.nearlyhuman-dev-20261102-26c8bd.testnet](https://testnet.nearblocks.io/address/game.nearlyhuman-dev-20261102-26c8bd.testnet). Native token-funded births and purse withdrawals attach a refundable storage deposit; unused storage funding is returned and FT registration is handled atomically when needed. Network/preparation fees are separate from NHC. Actual addresses, code hashes and receipts are recorded for [Robinhood](contracts/v2/deployments/robinhood-testnet.json) and [native NEAR](contracts/near/deployments/testnet.json). Neither mainnet is enabled.

Jev receives finite legal choices through NEAR AI's `/v1/systemone` endpoint. A signed quote reserves inference and relay capacity before a day is accepted. The durable worker caches choices, stores the replay packet and submits its trace for contract verification. Operational failures leave the biological save unchanged; retry is a fresh attempt, without deleting or refunding confirmed transactions.

The relay is trusted to call Jev and select delegated actions. Offchain inference is not claimed to be trustless or attested. Each contract derives inventory and rewards rather than accepting an arbitrary supplied balance. Game randomness suits a casual game. Native NEAR uses NEP-413 wallet verification, domain-bound Ed25519 admissions and immutable operation IDs for interrupted-wallet recovery; its [contract and custody review](docs/near-integration/CONTRACT.md) records the implemented authority and explicit transfer-call limitation.

## Build and inspect

Use **Node 24 or newer** for the application and NEAR SDK:

```sh
npm ci
npm run dev
npm run build
```

Configure the V2 values in [.env.example](.env.example), then open `http://127.0.0.1:5173/?v2=1`. Paid routes also need server credentials, testnet gas and an explicitly funded durable campaign. Credentials stay outside the repository and browser bundle. Use one active funded worker store; the [cutover guide](docs/overnight/wave4/NETLIFY_CUTOVER.md) preserves accounting and seals a retired local allowance.

| Area | Source |
| --- | --- |
| Life rules, catalog and codecs | `src/v2/` |
| Player journey and physical world | `src/app/v2/`, `src/game/v2/`, `src/art/` |
| Jev, quotes and durable workers | `server/v2/`, `netlify/functions/` |
| Robinhood verifier, NFT, token and purse | `contracts/v2/`, `src/chain/v2-client.ts` |
| Native NEAR authority, NFT, FT and purse | `contracts/near/`, `scripts/near/contract-build.ps1` |
| Native wallet, authentication and workers | `src/chain/near-*.ts`, `server/near/` |
| World switching and chain-specific API adapters | `src/chain/game-*.ts`, `src/app/game-api.ts`, `server/game-worlds.ts` |

No production build depends on ignored `TEMP/`. Pushing `main` triggers Netlify, so publication is deliberate and infrequent.

## Verification and design

The [local controller/wallet proof](docs/overnight/wave4/CHAIN_REVIEW.md) advanced 100 accepted days with scripted legal choices, earned 521.964786 NHC, tested both 250-NHC birth routes and withdrew after death. These are isolated-chain authority tests, separate from paid Jev behavior.

The [actual Meteor/Jev Day 1](docs/near-integration/actual-native-day.json) records a real Meteor Web mint and NEP-413 sign-in, one accepted paid day, **five real Jev sends** and **60 saved receipts** for FERN #1. An [independent public-contract review](docs/near-integration/actual-public-contract-review.json) matched every replay receipt, state/trace/certificate commitment, NFT metadata and purse backing. Its separate [local contract proof](docs/near-integration/CONTRACT.md) covers 82 TypeScript parity vectors and a closed 83-day earning/birth/death-withdrawal cycle. The [Robinhood regression](docs/near-integration/actual-rh-regression.json) verifies SAGE #7's real mint and first day against all 60 canonical receipts.

Completed Jev replies appear as a compact live choice stream before the distinct onchain-save stage. During playback the rooster fetches consumed supplies, carries them to its task and stores finished goods. Care impacts briefly highlight actual need changes; quiet decay stays unobtrusive. These presentation steps do not create extra inventory, actions or rewards. The native wallet and interrupted-payment checks are recorded in [wallet and switching](docs/near-integration/WALLET_AND_SWITCHING.md).

The earlier Robinhood pre-publication run saved41 real Jev days across two NPCs using209 sends for$0.030202, with zero uncertain sends. MISO made a Toy boat from earned wood and kept it; both purses remained0NHC. [The earlier checkpoint](docs/overnight/wave5/JEV_REVIEW.md) separates observed behavior from the local earning proof. Drained policy transitions added truthful care/economy facts and [bounded produce/surplus shipping choices](docs/overnight/wave6/SHIPMENT_REVIEW.md) without forcing sales or changing contracts. [Independent chain checks](docs/overnight/wave5/RELIABILITY_REVIEW.md) and [actual rendered playback](docs/overnight/wave5/PLAYER_REVIEW.md) distinguish receipts, model calls, controlled fixtures and screenshots.

The [V2 design](design/ECONOMY_V2.md), [contract guide](contracts/v2/README.md), [approved visual reference](design/references/VR-01-approved-house-and-care.png) and [99-board mockup gallery](design/mockups/index.html) preserve the intended game and visual direction.

The [virtual-pet flow and pixel refinement](docs/vpet-refinement/README.md) maps the full player journey, cites the reference games, and records independent phone/menu/input reviews of the subsequent usability pass.

The [whole-game presentation pass](docs/life-polish/README.md) extends that review through waiting, recovery, history, belongings and remembered lives. It restores the original procedural rooster artwork, adds restrained environmental color and gives the interface a quiet optional sound layer with reachable mute controls.

The [full-day pacing and animation loop](docs/full-day-loop/README.md) follows complete real saved days at normal speed, improves physical task contact and camera continuity, and makes actual incidents, project outcomes and unfinished care visible without changing the original rooster art or saved facts.
