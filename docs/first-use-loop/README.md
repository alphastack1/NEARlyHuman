# First-use critique loop — 3 November 2026

Question: does a first-time visitor understand the selected network, connect without accidentally buying, hatch a rooster, and prepare the first day without losing context?

Three reviewers owned the player journey, rendered visual design, and wallet/network authority. Each inspected the live starting point, implemented their part, then challenged another part. The PM reviewed the actual rendered narrow and normal phone screens before preparing a single final testnet release. The original rooster art and game/economic rules are unchanged.

## Resulting flow

START → Hatch a rooster → name / optional Strengths → Connect wallet → choose wallet → return to the same hatch form with balance and price → explicit Hatch → NFT egg reveal → home → empty first-day parcel → Review → free Verify if needed → explicit Start day → Jev → saved day → Watch.

The network field is a genuine button with a brand, separate Testnet tag and chevron. Its picker preserves the previous screen and draft. The currently deployed game has one supported world: Robinhood Testnet. Other catalog entries do not become playable merely because their names exist. Native NEAR still needs its actual contract, wallet/authentication and day-service adapter; the funded Meteor-compatible developer account alone is not that implementation.

## Adversarial findings that led to repairs

| Finding | Change | Evidence / decision |
| --- | --- | --- |
| Picking a wallet could immediately continue into an NFT payment | Separate free Connect from explicit Hatch, then show actual balance before purchase | Controlled React proof found zero signature/quote/transaction requests at Connect; only Hatch reaches the payment boundary |
| Passive, unbalanced network line | Full-width network button and compact contextual chooser | Actual phone pixels inspected at 320/390/430 widths |
| Wallet → Networks → Back escaped to start/home | Preserve the wallet return destination and intent | Independent reviewer reproduced the issue, builder fixed it, final navigation proof passes |
| Correct-network wallets still received a switch request | Skip no-op switches; verify final chain/account before adopting the connection | Seven controlled connection cases pass, including rejection, false switch acknowledgement and mid-connect account change |
| Personality did not describe the stats' actual meaning | Optional Strengths, Balanced/Custom cue, concise actual effects and reset | Actual reducer inspected; five-point mechanics remain unchanged |
| Free Connect was labelled with a network-fee footnote | Contextual Connecting is free / Network fee applies | Final pixel recaptures show the appropriate state |
| Multiple purchase-like gold wallet buttons and duplicate controls | Neutral wallet rows, one shared Back, remove duplicated icon | Final chooser inspected against the game's existing materials |
| Selecting a second productive starter silently replaced the first | Garden-only one-seed/sapling cue | Actual first-day controls preserve the valid three-item parcel |
| Empty-wallet recovery might be a dead end | Verified the existing Get test ETH action, without adding another warning | Controlled insufficient-funds preflight preserves draft and exposes the official faucet link before any transaction request |

## Research applied

Bandai's [official Tamagotchi Connection manual](https://www.bandai.com/amfile/file/download/file/242/product/1304694/) moves from egg/setup/naming back to the pet, with stable select/confirm/cancel controls and visible care feedback. Our inference is to keep optional customization out of the critical path and preserve a predictable return destination. This is not a claim that Tamagotchi uses our Body/Wits/Spirit system.

[RainbowKit's official connection component](https://rainbowkit.com/docs/connect-button) separates account, chain and balance. We use that separation within the existing retro UI, without replacing the wallet stack. [Official NEAR Connect documentation](https://docs.near.org/tools/near-connect) confirms Meteor support; it supplies wallet operations, not the missing native game contract or backend authority.

Detailed evidence: [Journey](JOURNEY.md), [Visuals](VISUALS.md), [Networks](NETWORKS.md). The separate [completed hosted release check](RELEASE.md) records an actual cold-entry connection, new BASIL #6 mint and first paid Jev day with canonical readback. Temporary scripts, full logs and unselected captures stay in ignored `TEMP/first-use-loop/`; controlled UI fixtures are not labelled as real new NFTs or paid days.
