# UX and recovery refinement audit — 1 November 2026

The audit used repeated **observe → capture → independent critique → fix → rerender** loops. It reviewed the actual game against the original Moss & Cream reference, including an equal-width comparison, rather than treating the mockup gallery or TypeScript as proof of a working experience.

The permanent [browsable evidence gallery](ux-audit/index.html) contains **83 curated captures**, including before/after comparisons and fourteen world-coverage sheets. The images and gallery work without `TEMP/`. [UI_COVERAGE.md](UI_COVERAGE.md) maps named guide states to executed evidence, explicit shared-layout derivatives and remaining limits. [RECOVERY_AUDIT.md](RECOVERY_AUDIT.md) records the authority and persistence witnesses; [assets.md](assets.md) records the renderer and art evidence.

## Review roles and process

The PM owned priorities, integration and actual pixel review. Separate workers owned player menus, world/art, and wallet/preparation recovery. A fresh first-player critic explored the rendered app before reading the implementation or previous findings. An independent backend critic challenged the recovery implementation with new isolated witnesses. A separate transport/error critic interrupted specific reads and checked recovery on the same page. A limited component subtask kept saved-day list work separate from the main UI state machine.

Concurrency was bounded by the environment; workers ran in parallel and ownership rotated into independent review. Production was held for one final refinement release rather than repeated interim pushes.

## What the evidence means

| Evidence class | What was exercised | What it does not establish |
| --- | --- | --- |
| Actual project chain | BOK/PEEP identity, stock, saved packets, metadata and compact history read from Robinhood testnet; the funded PEEP hatch and recovery used real Jev. | Mainnet, population balance or every physical wallet. |
| Controlled local authority | The same contract artifact, API, authentication, quotes and job machinery on disposable Anvil, with deliberately controlled provider responses. | A genuine Jev selection or natural occurrence of every rare condition. |
| Controlled transport | A specific real-data GET was aborted or delayed, then restored. | A production outage of the entire hosting platform. |
| Controlled renderer | Synthetic legal starting states with canonical action outcomes, displayed by the real Phaser renderer. | A complete payment/API journey for that frame. |
| Viewport surrogate | Chrome phone dimensions, coarse pointer, text stress and explicit visible-viewport offsets/heights. | A physical phone keyboard, biometric prompt or every device's text inflation behavior. |

No real provider call, payment or chain outcome was invented to populate an inspector. Deterministic receipts remain distinguishable from genuine model choices. Reading, watching, pausing and seeking do not generate another biological day.

## Short experiment record

| Question / observed problem | Evidence | Change | Verified result and decision |
| --- | --- | --- | --- |
| Can a warm worker still prepare a hatch? | PEEP's real funded request remained queued with generation/sends/slots zero. Private invocation logs showed an expired captured Blobs credential. | Resolve the Blobs client from the current invocation context for every operation. | The same warm wrapper used two different synthetic invocation credentials. The existing funded PEEP job was recovered through the normal fenced worker, without another payment. Keep a focused regression witness. |
| Does reconnecting lose replay access? | Cold BOK trial and watched summaries had no watch control because a packet was not in page memory. | Make watch access independent of in-memory prefetch. | Real canonical reconnect/watch passes; opening a saved day remains a GET-only operation. |
| Does Back preserve a mint draft? | Reducing Body then leaving/reopening reset the allocation. | Persist both decrement and increment edits in the scoped draft. | Body 1 and its unallocated point return correctly. |
| Do menus stay usable on phones? | Help/status were constrained to a short square region despite unused phone height. Gear/brain targets were 24/22 pixels. | Use the visible viewport for reading dialogs, one body scroller, bounded labels and larger hit regions. | Frozen 320/390 dialogs are readable; gear/brain targets are 44×32, supply Info/pager targets at least 44 pixels in reviewed layouts. Mouse and native touch probes hit the intended controls. |
| Can an empty plus slot actually add a supply? | First-player taps on the largest add affordance produced no response. | Reuse the fifteen-item catalog as a direct, labeled picker. | Add once, remove, Back without mutation, and three-distinct selection all pass. |
| Can a menu tap reach furniture behind it? | An exact stable mobile Options → Help click repeatedly opened Crafted chair. | Synchronous UI inspection gate, explicit renderer input gate and native own-canvas event check. | The same sequence passes twice; closing menus retains pause, and a positive canvas chair tap still works. |
| Is the active film's state visible immediately? | During older Day 2 delivery, the world had Day 2 but the HUD/details retained Day 3 until receipt one. | Publish the recorded initial snapshot at start and initialize the UI HUD/reading day atomically. | Before the first receipt: Day 2/LV01, exact recorded needs/stock and the real Day 2 receipt links. Future care-delivery counts are absent from recorded item details. |
| Can seeking restart delivery or add stock twice? | Seeking during delivery left the old prelude stage active. | Enter receipt playback explicitly on seek. | First/later seeks and repeated seeks retain exact inventory; Skip retains final inventory. |
| Can one NPC inherit another film's caption? | A new living film temporarily displayed the previous NPC's structural-death line. | Clear a first-receipt caption; later starts use that packet's prior recorded receipt. | Completed frames show the correct empty/previous-recorded caption and subsequent actual action. |
| Is the saved life discoverable? | The useful transcript was hidden behind narration; previous days were not reachable. | Add visible Day log and Saved days, bounded historical reads and literal compact-history fallback. | Older films return to their reading/draft context without acknowledging the newest day; a held latest response cannot replace the older film. |
| Are transaction details actual evidence? | The former panel had only identity/network/wallet. | Read exact-day metadata, expose verified request/save links and retain an NFT explorer fallback. | Historical Day 2 links its actual request and `0xe892cfdd…d827153` save, including during the delivery introduction. |
| Do successful reads clear their errors? | Ownership retry, replay retry and a valid selection retained old failure alerts. | Scope read notices/tickets to their request and navigation generation. | Independent same-page retests pass all three; actual token 999999 still produces specific 404 copy. |
| Does failed ownership look like no NFTs? | A deliberately failed ownership GET was reviewed at 320/390. | Keep unknown ownership distinct from verified empty ownership. | Retry is offered without a duplicate hatch. A real public relay identity with zero owned tokens correctly reaches Hatch. |
| Can asynchronous completion steal another selection? | A late `/accept` response selected Garden after the player chose Trial. | Fence visible acceptance and operation cleanup by the originating navigation generation, while fulfilling accepted work. | The actual controlled transaction settles; the player stays on Trial. |
| Can a stale view approve the wrong next day? | A real valid quote used revision 2 while the UI intentionally held revision 1. | Compare permit/base context before wallet send and reconcile known canonical conflicts. | Zero sends, preserved supplies and a review route. An actual ownership conflict also reaches the new-owner route without Prepare. |
| Does a fee bump or cancellation become a permanent spinner? | Actual same-nonce local replacements were mined. | Persist the canonical replacement receipt hash; distinguish cancellation/no-request replacement. | Repricing reaches Ready; cancellation preserves the previous biological day and draft. |
| Can an unknown submission cause another mint? | A controlled wallet lost its returned hash. | Preserve the pre-send permit journal; require canonical recovery or strict expired-unused proof. | A second mint stays blocked until proof permits recovery. |
| Does an included-day failure force another NFT purchase? | Controlled provider outage → canonical Failed → retry on the same local NFT. | Retain first-day retry semantics and explicit context. | Original starter stock/day 0 retained; day retry had mint fee zero and token 7 reached day one/level one without reminting. |
| Can a rollback reuse old work or failure decisions? | Separate local witnesses rolled out finalization or acceptance, and re-mined the same signed mint on a different block. | Recheck canonical terminal/context facts, fence untouched context rebinding, quarantine paid/signed mismatches and require strict proof for unaccepted recovery. | Ready rollback resettles an existing packet without new AI. Re-mined untouched work adopts canonical context with counters unchanged. A stale failure cannot newly fail the replacement life. Independent after-witnesses pass. |
| Are large inventories and small containers readable? | The full-stock 320 view clipped the first digit of 65,535. A short-wide column squeezed Info to 27.9 pixels. | Use bounded inventory columns and derive the quick catalog from its actual container. | Full numbers and supply access remain reachable; all fifteen types stay available across paging/resizing. |
| Does wide-short layout waste the available space? | 1024×600 rendered a tiny pillar with broken labels. | Place the same square house beside the same care dock at the bounded wide-short breakpoint. | Actual 900×600 and 1024×600 frames fit cleanly; the phone layout remains unchanged. |
| Does the reading backdrop preserve the selected art direction? | The page-wide dark overlay turned the approved cream surround flat gray. | Preserve the cream surround and keep the navy reading card/input boundary. | PM before/after pixel review approved the cleaner result. |
| Are the world outcomes legible and attached to the right object? | Visitor bait reached the garden while its visitor was in the kitchen; shelter intercepted crop taps; moved-chair feedback stayed at its old anchor; meal/harvest output was unclear. | Bind contact to recorded context, use current bounds, pass sheltered crop taps, and show the literal food/harvest result. | Controlled completed-frame and pointer checks pass. All 35 action families are represented in the 82-case world sweep. |
| Does a fatal historical record look fatal? | The initial paused seek capture remained upright. A stale WebGL capture was first rejected. | Fix the terminal pose and explicitly render a completed frame before evaluating the paused screenshot. | The verified image shows head/beak left and feet right. Field values alone were not accepted as visual proof. |

## Presentation and runtime review

The original reference and rendered phone build were compared at equal 370-pixel frame widths. The retained direction is top-down handheld pixel art, honey wood/cream/moss materials, blue bedding, navy beveled UI and one yellow main action. The separate portrait care dock is intentional: it preserves the square house while giving selection controls room to be used.

The same recorded day-two motion segment improved from **16.0% fully covered / 24.8% dimmed** to **5.12% / 11.09%**, retaining its recorded routes and calm visible walking. It is a controlled renderer timing sample, not a claim about every physical device's frame rate.

The six fast service witnesses pass, including current-invocation credentials. Existing domain and contract evidence was not repeatedly rerun when unchanged; new independent witnesses targeted the specific uncertainties above. Frozen compiled candidates were used for long playback and transaction proofs. Hot-reload resets and test-selector mismatches were recorded as audit-tool artifacts, not product defects.

## Scope boundaries

Mainnet remains deferred by the owner. Real third-party wallet approval/fee-bump screens, physical phone keyboards, rare naturally chosen Jev deaths, every cosmetic headgear/device combination and optional reduced-motion/fallback treatment are not claimed as tested. Controlled authority, geometry and renderer cases remain labeled as such.

The retained v1 collection also has explicit deep-fork/signed-intent limitations documented in the recovery audit and mainnet-readiness notes. Mainnet foundation review must account for full-context outcome binding and metadata/collection identity; a new deployment was not treated as a cost-free fix that could mislabel existing NFTs.

## Published refinement verification

One production push published source `8dbcdedf25aa0edbe2a460a49a7a2ef6afc39b0d`, Netlify deployment `6ae72b2c06cae709c234b89f`, at **12:06:37 UTC**. Mainnet remains deferred. The browser build and all three hosted function bundles compiled; the function manifest specifies Node 22, background preparation and five-minute reconciliation. The staged source/browser-output credential scan found no credential leaks or tracked temporary files.

The public page connected the authorized testnet wallet, selected **Milk, Coffee and Wood** for PEEP #2, and submitted one normal next-day transaction. Its hosted worker reached Ready in **42.412 seconds** from the durable accepted-job record, using **33 real Jev sends / 2,114 µUSD ($0.002114)**. The result is **day two, level two, alive, sixty receipts, 240 compact-history bytes and no pending request**.

- [Owner request transaction](https://explorer.testnet.chain.robinhood.com/tx/0x10fcbf35f8cd266e7a92726230e07ed79865d5790ce07fde6766ef36d0f9525f).
- [Saved-day transaction](https://explorer.testnet.chain.robinhood.com/tx/0x6466018d898ddde62edc841a4edbcf8cf72f1835441465a712998cb3de9d23c0).
- Request ID: `0x37e70f146037c3682ae05922357d80640bffa85a425462abd7281b8b0d9021d6`.
- Replay commitment: `0xa32e9752d7b9e6694defc33cfa9105d808814f9f24bfa6f272be9350ae9344af`.

A separate read-only chain/cloud verification recomputed the replay commitment, packed-state hash and request result hash, and compared the exact saved compact history. All checks matched. The permanent [machine-readable verification](ux-audit/live-verification.json) contains public identifiers and measurements only.

The public flow reached Ready, played the actual film, paused for genuine recorded choice probabilities, resumed, skipped to the saved summary, listed days two/one and opened day one. It reported no page errors. The original harness then waited for the current-day label “Skip to summary” in the older film, whose correct control is “Back to saved days.” That selector timeout was retained as a tool error; no second payment or preparation was used to replace the run.

An independent cold review of the exact published JavaScript/CSS verified PEEP's current day-two state, both saved days, and **Watch day one → Back to saved days → Back** returning to care at level two/NEXT03 with its selected kit intact. It compared the exact request/save explorer links above with the day-two API result. Seven API reads returned 200, with **zero non-GET requests and zero console/page errors**. Phone 390/320 and desktop 1440 captures are in the gallery; the [read-only evidence record](ux-audit/published-read-review.json) preserves the endpoint and cache observations. Hashed JavaScript is immutable; the versioned furniture PNG revalidates.

The workstation wallet bridge and disposable QA servers were stopped after signing and verification. The new hosted job lived in production Blobs and was processed by the hosted background worker; the workstation's local data store did not contain that accepted job. Post-release notes and captures are retained in a local evidence commit without another production push.
