# Parcel, wallet and birth refinement

Question: can a first-time owner see which network they are using, understand the two wallet operations, choose their own supplies and recognize their newly minted rooster as an NFT?

## Implemented flow

1. Hatching shows the configured network before a wallet opens. Connected wallet cards show the abbreviated account and an actual native balance from that network's public RPC.
2. A confirmed mint opens an egg reveal with the original seeded rooster generator, a small sunburst and the real NFT number. The explorer link opens that exact collection and token. The confirmed mint journal is retained until the NFT can actually be read; a delayed read stays in hatching rather than becoming an unrelated day/mail screen.
3. Packing starts with three empty slots. An empty slot uses a plus, not an item-shaped icon. Selecting a supply advances to the next empty slot. Three short, dismissible tips react to the player's choices. The review button stays visible while browsing a long supply list.
4. Review shows the selected items, current network/account/balance and two distinct wallet steps: free sign-in, then the day transaction. Packing and review do not request a funded quote. Verifying the wallet only signs in. Only pressing **Start day** requests a funded quote and starts the transaction sequence. Editing retains the parcel and verified session.
5. Blockchain confirmation, Jev planning, saving, success and failure use different states of one restrained pixel circuit graphic. The progress strip is Pack → Wallet → AI; a redundant second strip was removed. Failures say that preparation failed and expose a safe retry rather than suggesting the day already happened.

## Evidence

The actual local React interface was inspected in the separate Codex shared Chrome profile, using the real public NFT 4 Day 1 snapshot. The development-only preview supplied that public ownership state; this was not represented as a real new mint. Connected balances were read from the public testnet RPC. There were no real signatures, service ledger writes, funded quotes or AI calls in these checks.

- Rendered 14 screens at 320 × 568, 390 × 844, 1100 × 800 and a 320 × 360 short view. No horizontal overflow or browser errors. Important actions remained reachable; the short hatch form scrolls inside its sheet.
- Exercised actual choices: an empty parcel → three supplies → review → edit. No auth or quote request occurred at review. Editing preserved exactly the three selections.
- Exercised actual React wallet handlers with a keyless controlled provider and intercepted auth/session/quote responses. Verify produced one mock readable sign-in, no quote and no transaction. Editing and returning preserved verified status. Start alone requested one intercepted quote and reused the checked session without signing again. A deliberately stale quote was rejected before any send and returned to the correct review screen.
- The revealed rooster image is the canonical 32 × 40 generator output, displayed at an integer multiple. No replacement rooster artwork was introduced.
- An actual cold boot with both browser storage getters throwing `SecurityError` still reached the title, START and the hatch form without browser errors or app writes. The title's session preference is now optional rather than an uncaught boot dependency.
- Unconfirmed blockchain work uses linked pixel blocks; saving uses a book, and the success check is reserved for a completed state.
- A confirmed transaction triggers one scoped balance refresh in the background, including mint recovery without an attached signer. Read generations and the account/world scope discard stale responses. A read-only replay of NFT 3's historical mint receipt, with deliberately delayed controlled balance responses, proved that the birth appears before the refresh completes and a late initial balance cannot overwrite the refreshed one. Exactly two reads occurred: the initial read and the confirmation refresh. No new transaction was sent.
- Independent world/render reviewer inspected the pack, review, birth and AI screenshots and found the network, two wallet operations, empty parcel and loading state understandable and visually consistent.

Representative verified captures:

| Surface | Capture |
| --- | --- |
| First empty parcel, narrow phone | [care-empty-320.png](screens/care-empty-320.png) |
| Actual selected parcel and wallet review | [review-picked-390.png](screens/review-picked-390.png) |
| Sign-in completed, transaction still explicit | [review-verified-390.png](screens/review-verified-390.png) |
| Original rooster NFT reveal | [birth-revealed-390.png](screens/birth-revealed-390.png) |
| Jev planning | [jev-390.png](screens/jev-390.png) |

Result: the local presentation and controlled sequencing checks pass. Final hosted mint/day verification is a separate release check. Wallet software controls its own transaction display; ABI-aware app calls and explorer verification improve decode availability but cannot guarantee every wallet's prompt layout. Synthetic viewport checks do not establish physical keyboard or every operating system's text inflation behavior.
