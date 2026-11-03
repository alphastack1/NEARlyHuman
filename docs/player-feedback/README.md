# Player feedback refinement — 3 November 2026

The owner reported an unclear wallet/network flow, an erroneous mail state after mint, confusing default supplies and failures, and physical inconsistencies while watching the rooster. This pass changes those concrete paths and uses independent backend, journey and world reviewers. Mainnet remains disabled; the only playable deployed world is Robinhood Testnet.

## Player flow

Hatch → confirmed NFT egg reveal → Meet your rooster → Prepare day → choose up to three supplies from an empty parcel → Review → Verify wallet if needed → Start day → blockchain confirmation → Jev planning → saved day → Watch.

Review and sign-in create no funded quote. The readable signature establishes a checked owner session; Start submits the separate onchain payment/admission. Valid scoped sessions can be reused for 12 hours. The fee remains a small detail; network, address and actual native balance are visible in the relevant wallet surfaces. New NFT and profile links open the exact collection/token in the explorer.

| Player observation | Implemented correction | Evidence |
| --- | --- | --- |
| Which network and balance? | Explicit Robinhood Testnet account card and actual native ETH read; network identity separate from deployment availability | [Journey](JOURNEY.md), [wallet review](WALLET_RELIABILITY.md) |
| Two unexplained wallet prompts / raw transaction | Explicit free sign-in and paid Start stages; checked session reuse; ABI-aware writes and four publicly verified contract ABIs | [Wallet review](WALLET_RELIABILITY.md) |
| Mail after mint / no NFT reveal | Retain the confirmed mint journal through exact NFT read; original procedural rooster egg reveal, sunburst, NFT number and explorer link | [Journey](JOURNEY.md) |
| Three supplies already chosen / accidental replacement | Empty slots, next-empty targeting, three concise dismissible tips, stable selections when reviewing/editing | [Journey](JOURNEY.md) |
| Unclear AI and failure stages | Different blockchain/AI/saving/ready/failure circuit states; explicit failure and safe retry | [Journey](JOURNEY.md) |
| First failed day, second worked | Established exact failure boundary from real receipts/cached answers; wrapped transient pre-send chain reads resume the same job safely | [Wallet review](WALLET_RELIABILITY.md) |
| Too bright before Watch | Dim waiting scene and a 2.4-second sunrise when the day begins | [World review](WORLD.md) |
| Whole parcel goes in fridge | Actual selected items fan out and glitter at the mailbox; auto-stock there; removed presentation-only fridge delivery | [World review](WORLD.md) |
| Standing by chair / walking through wall | Canonical pose perches on seat and dismounts; rendered walls and pathfinding share real door openings | [World review](WORLD.md) |
| Stock hidden behind menus / odd hammer | Local stock chips including true zero stock, and a flat native-grid hammer head | [World review](WORLD.md) |

## Research applied

[RainbowKit's official connection component](https://rainbowkit.com/docs/connect-button) treats account, network and balance as separate visible concerns. We use that distinction within our existing pixel UI; the owner's requested balance remains visible on phone layouts too.

[Sunflower Land's own architecture description](https://github.com/sunflower-land/sunflower-land#%EF%B8%8F-architecture) separates connection, ready, signature verification and authorization. The practical inference for this game is to show each authority boundary deliberately and preserve context after cancellation. This did not require adopting another state framework or copying its art/code.

## Verification and limits

Local checks cover real React controls with intercepted keyless auth/quote responses, fourteen responsive rendered screens, a genuine public NFT's uninterrupted normal-speed day, actual saved packet/reference immutability, real route continuity, worker retries, server-validated sessions and the viem transaction path. Full details and screenshots are in the linked reviews. Synthetic UI fixtures are identified as such; they are not presented as a new mint or AI result.

The original `src/art/rooster.ts` and `src/art/rooster-data.ts` hashes remain unchanged. No economic rules, saved day facts or original NFT seed/art were rewritten. Private service ledgers remain authoritative and were not reset.

Wallet software decides how it displays a custom transaction. Verified public source/ABI and a readable in-game review improve the experience but cannot guarantee every wallet decodes every argument. The original masked worker exception cannot be recovered; the identified transport classification gap is fixed without claiming a proven reconstruction of that historical exception.

The four-network catalog does not enable four game deployments. Native NEAR still needs its own wallet/contract/service adapter. The funded native NEAR developer account and owner's private desktop import guide are documented separately in [NEAR testnet preparation](../NEAR_TESTNET_PREPARATION.md). No recovery material is included here.

Final hosted release evidence is recorded separately after publication; the local proof above does not substitute for that check.
