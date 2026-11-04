# Landing to first day — 4 November 2026

Three independent reviewers followed the live entry at 390×844 and 320×568, examined the hatch/first-day transitions and challenged the selected actions. Fixes target interruptions and context loss rather than adding a tutorial.

| Question | Evidence | Change | Verified result |
| --- | --- | --- | --- |
| Can a visitor hatch while the example film is still loading? | The live welcome button remained disabled while an optional guest replay loaded after configuration was already available. | Load the guest independently; keep active/mounted/generation/wallet/pending guards. Show “Opening…” only during critical startup reads. | Held-response browser test enables Hatch before releasing the guest. A subsequently released example cannot replace an owned SAGE life or URL. |
| Does browsing supplies preserve deliberate choices? | Reopening Garden targeted the existing seed. Switching back to Care and packing Water replaced it despite empty parcel slots. | Distinguish an inferred target from a player-tapped replacement slot; prefer empty space for automatic targeting. | Seven browser cases pass, including Care/Garden browsing, nonseed garden supplies, explicit replacements, full parcels and the one-seed rule. |
| Does the new visitor get concise setup choices? | Welcome repeated the landing premise; a healthy chooser displayed Refresh as another decision. | Short “Welcome home” heading; remove repeated sentence. Keep Hatch, optional example and owned-life choices. Show retry only for failed/empty network discovery; add one wallet/funds guide link. | Actual mobile flow retains its choice structure and network draft context without the extra service control. |
| Can an empty wallet find the next action before a failed payment? | Balance displayed zero, but the faucet link appeared only after a failed attempt. | Conditional testnet funding link for a known zero balance; readable 13px text and 44px target. Refresh balance on returning focus/visibility, with request deduplication and late-read guards. | Controlled zero→funded browser reads show/remove the right link after returning focus. No transaction or real faucet operation was used for this fixture. |
| Is the AI stage focused on progress? | Normal preparation promoted Back home as the main action, directing a newcomer away from the loading stage. | Make Back home a secondary escape; keep Watch day primary when ready. | Phone captures show animation/sealed thoughts, a quiet return option and no future-choice itinerary. |

Controlled browser checks use the Codex profile and run-owned tabs, with memory storage scoped to the test page. The first-day fixture is explicitly a presentation clone of a real saved life, not a claimed real newborn. No shared profile or service ledger is cleared.

[Startup evidence](verification/first-day/startup.json) · [parcel evidence](verification/first-day/parcel.json) · [funding/progress evidence](verification/first-day/zero-funds-and-progress.json) · [production artifact review](verification/first-day/build.json).

The production build passes, including 19 public metadata pages and the unchanged 341,565-byte public JavaScript closure. Wallet/game modules remain deferred. Routing checks pass 30 entry cases and 11 version cases. The original rooster hashes and reviewed contracts ZIP match their recorded values. No game rules, onchain contracts, AI prompts, service budgets or financial configuration changed.

## Hosted verification

Published once at **16:13:28 Bangkok time** (09:13:28 UTC), Netlify deployment `6aeaf733faf58a2bc25f99f3`, from local source commit `f83a399`. This was a direct deployment of the verified build; its Netlify Git commit reference is null. The hosted compiled files match the local candidate, and the three existing Node24/API-v2 functions retain background preparation and the five-minute reconciliation schedule. The 23 read-only service/source checks pass for both testnets.

The actual hosted first-day check **passed**, completed at 16:24:43 Bangkok time:

- Minted **MAPLE #8** into the developer wallet on Robinhood testnet, with the existing procedural rooster generator.
- Followed the real egg reveal and Meet MAPLE → Prepare day 1 controls. Packed Daisy seed, Water and Bread through Garden/Care tab changes; the final parcel preserved all three.
- Used one free wallet sign-in, one player hatch transaction and one player day-start transaction. Jev returned **five real responses**, followed by the normal relay's onchain finalization.
- Watched the complete saved day without skipping to the end. The morning post, supply collection, household routines, planting and bedtime played through. The ending reports Daisy planted and offers Prepare tomorrow.
- Independent public readback confirms owner `0x131C15fD2d9151F361213d8e8BC2a188Dc0149c6`, day 1, level 1, alive, revision 1 and no pending request. The dynamic NFT portrait uses canonical rooster art and reflects the saved life.

[Open MAPLE's public life](https://nearlyhuman.netlify.app/?rooster=8&chainId=46630&collection=0x30cb5213fa94020a95893ddb6b07470dbf7a9efc) · [mint transaction](https://explorer.testnet.chain.robinhood.com/tx/0xa2ce311657fef99a2729f324434b0a372871436de2268772255f69dca95dade1) · [day-start transaction](https://explorer.testnet.chain.robinhood.com/tx/0xe56ad21c8e41930a527648fe5360058abe821126c829eeffb098ca3c40ead9a0).

The real run used a key-backed test provider at the app's EIP-1193 interface. The private key stayed in the local operator process, which was terminated after the run. This verifies actual player transactions, authentication and hosted service results; it does not claim to test the native Rabby extension's own dialog. The operator initially rejected the app's canonical root NFT URL, then needed a fresh browser binding when resuming. These were test-tool restrictions, fixed without production edits, a second mint, a duplicate day or any ledger reset. The run resumed the same day-zero NFT before its first day-start transaction. Recorded end-to-end wall time includes that instrumentation recovery and is not a user-speed benchmark.

The actual paid/chain run covers Robinhood testnet. Native NEAR remains covered by hosted service readback and network/UI checks; no fresh Meteor mint is claimed in this pass. No mainnet operation was performed.

[Real run and progress record](verification/first-day/live-run.json) · [final public NFT/life readback](verification/first-day/hosted-life.json) · [hosted asset/function proof](verification/first-day/hosted-assets.json) · [both testnets' service/source proof](verification/first-day/hosted-services.json).

[Hatched NFT](verification/first-day/maple-hatched.png) · [packed supplies](verification/first-day/packed-first-day.png) · [first-day review](verification/first-day/review-first-day.png) · [saving](verification/first-day/saving-day.png) · [morning post](verification/first-day/first-post.png) · [day completed](verification/first-day/day-finished.png) · [empty-wallet help](verification/first-day/empty-wallet.png).
