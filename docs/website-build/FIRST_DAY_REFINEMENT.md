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

The final live check uses one developer-wallet Robinhood testnet NFT and its first day. It will exercise the actual hosted screens, two onchain transactions and real Jev preparation, with public transaction/state evidence and no private keys in the browser or repository. A key-backed test provider exercises the app's EIP-1193 interface; this does not claim to test a native Rabby extension's own confirmation dialog. Results and hosted deployment identity are recorded after the run.
