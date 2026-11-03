# Hosted first-use verification — 3 November 2026

The reviewed first-use refinement is live at [nearlyhuman.netlify.app](https://nearlyhuman.netlify.app). One main push published the finished candidate; later evidence commits stay local to avoid another Netlify deployment.

- Source: `d523f692415d33a99b31831f5b6e3ca60dea1b95`.
- Netlify: `6ae9b3d5c6b759518b32d16b`, ready, published **10:14:23 UTC / 17:14:23 Bangkok**.
- Reviewed and hosted entry both match `index-BuSEPwJz.js` using the existing production V2 entry flag.
- Runtime remains Robinhood Testnet 46630 and collection `0x30cb5213fa94020a95893ddb6b07470dbf7a9efc`, with the unchanged Mind 7 decision configuration. Native NEAR and mainnet are not enabled by this UI release.

## Actual cold-entry journey

Used a fresh run-owned Codex Browser tab at 390×844 with page-local storage, the existing funded developer account and a strictly bounded Node-backed EIP-1193 provider. This is a new browser visit and new NFT, not a claim that the developer account had never owned a rooster. The developer key and raw signed-operation journal stayed outside the browser and checkout. All wallet, hosted service, model and chain outcomes below are real; the provider's confirmation window is controlled, so this does not claim a human Rabby-extension playtest.

1. Opened the published game, pressed **START**, chose **Hatch a rooster**, and named the rooster **BASIL**.
2. Opened the clickable network control, saw its one genuine playable world and selected it. The hatch name stayed intact.
3. Pressed **Connect wallet** and selected the developer wallet. The same hatch form returned with the actual account/balance and explicit **Hatch BASIL** action. Connection requested **zero signatures, zero funded quotes and zero transactions**.
4. Pressed **Hatch BASIL** explicitly. Mint succeeded as **NFT #6**, and the egg reveal displayed the original canonical 32×40 rooster source and correct NFT explorer link.
5. Entered home and prepared Day 1. The parcel began empty. Chose water, bread and one Daisy seed, then reviewed.
6. Verify generated exactly **one free sign-in**; no quote was made until the separate **Start day 1** action. Start generated one funded quote and one day transaction. Two actual server session checks returned 200, without another sign-in.
7. The real hosted worker completed **five Jev sends** for **575 micro-USD / $0.000575**. Its selected main project was **Plant Daisy**. The day reached ready on its first accepted attempt, then opened and began playback successfully.

Zero browser errors or extension errors were observed. The already-verified world renderer was not changed in this pass; a second full-day timing test would not answer a new rendering uncertainty.

## Independent saved-result check

The subsequent read-only Cloud/onchain verifier matched the packet commitment, encoded semantic state, trace, certificate hashes and reward against the canonical pinned Day 1 record. The actual relayer save receipt succeeded. All five provider entries are completed, the quote is retired, the AI allowance is inactive and no relay-gas hold remains for this request. No financial ledger was reset or replenished.

| Operation | Canonical transaction |
| --- | --- |
| Mint BASIL #6 | [0x9da772…581937](https://explorer.testnet.chain.robinhood.com/tx/0x9da7725a2e7263c3da2ba933ee7581d2b00fef99e639218bf6efb5d6ed581937) |
| Accept Day 1 | [0x651592…378205](https://explorer.testnet.chain.robinhood.com/tx/0x651592a00bc356831885ad7e47219bc2a4ff1280beeffd38f643bfd45a378205) |
| Save Day 1 | [0x43c6f2…7b04f6](https://explorer.testnet.chain.robinhood.com/tx/0x43c6f2bd74e04b733465b0b5dd8ea605e5bc9fe8102d4e207bbe3805837b04f6) |

Full public identifiers and checks are in [hosted-owner-day.json](hosted-owner-day.json). Actual hosted images: [before connection](hosted/hosted-hatch-before-connect-390.png), [connected hatch](hosted/hosted-hatch-connected-390.png), [NFT birth](hosted/hosted-birth-390.png), [empty first parcel](hosted/hosted-pack-empty-390.png), [verified first-day review](hosted/hosted-review-verified-390.png).

The separate local checks cover cancellation, low-gas recovery, nested navigation, seven wallet/network edge cases, responsive layouts and text stress. See [Journey](JOURNEY.md), [Visuals](VISUALS.md) and [Networks](NETWORKS.md). The original procedural rooster files retain their protected hashes. No game/economic rules or contracts were changed.
