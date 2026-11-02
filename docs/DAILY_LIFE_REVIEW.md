# A continuous day — 2 November 2026

This sprint replaces the restless sequence of equally weighted choices with one daily undertaking, a few smaller care decisions and ordinary time between them. It also connects the house to a front yard and makes delivery an actual morning trip. The [rendered gallery](daily-life-review/index.html) distinguishes the final canonical NORI visit from diagnostic Jev examples. The visual reference remains [The House Wakes Up](../design/mockups/cartridge-openings/03-the-house-wakes-up.png).

## What the player sees

Jev chooses one feasible main undertaking and a morning order in a single planning request. A rooster can fetch the delivery first, or use existing pantry coffee/breakfast or look through the window before going out. It cannot use the pending parcel before collecting it. Project inputs are reserved against ordinary care, while genuine urgent needs can interrupt the plan.

The rooster gets out of bed and walks through connected rooms, through the front door, along the lawn path to the mailbox, then carries the parcel home to the pantry. The yard includes grass, a fence, gate and road. Ordinary playback follows the rooster continuously; explicit seeking and room exploration remain deliberate navigation operations.

The main undertaking has about 10.5 seconds of work plus travel. Routine care is shorter, and quiet time stays local instead of sending the rooster on a new cross-house errand for every history slot. Six phase openings offer small decisions; emergencies can add more. The existing sixty-slot day still preserves biological deadlines and compact history. Those slots are not sixty purchased Jev decisions. The current ordinary live examples used six or seven calls, including the morning plan.

A compact goal sits beneath the needs strip. It shows intent during travel/work and shows a result only at the actual action impact. The day log groups ordinary local stretches, with the original individual records still available for seeking. The morning-plan panel explains the previously recorded choice when inspected; delivery and the undertaking do not pretend to buy fresh inference. Phone room controls use a balanced 3×2 grid.

The title, room assembly and gameplay continue to use the same native pixel renderer. The default opening now uses the verified NORI day-three recording, including its bed start and matching cosmetic fallback identity. It needs no RPC to obtain the content-hashed preview. No intro video or additional image download was introduced.

## Review loops and corrections

Separate reviewers challenged movement, game rules, trusted-worker recovery/accounting, contract/art identity and actual rendered UI. The PM inspected real screenshots beside the selected mockup and coordinated corrections before the final build.

| Finding | Correction and focused evidence |
| --- | --- |
| Ordinary camera cuts and distant quiet destinations made the day feel like disconnected clips. | Removed ordinary montage/camera cuts, retained constant walking speed and connected routes, and kept typed interludes at the current routine anchor. The native continuity witness crosses the front door both ways without an ordinary cut. |
| Delivery previously existed before the rooster visited its box. | Keep accepted supplies pending until one reserved pickup receipt. That receipt walks outside, applies its inventory delta once, carries the parcel indoors and deposits it before another receipt. Checkpoint recovery and fatal unopened-delivery cases were checked separately. |
| A shelter could be offered for an empty garden. | Filter infeasible/useless project choices. The plan presents at most four distinct feasible projects, with honest quiet-day alternatives when none exist. |
| A CSS selector collapsed the working-goal badge into a tiny vertical strip. | Gave the progress pips their own class; independent actual-browser captures verify full-width working and completed states without early outcome text. |
| The six room buttons formed five plus one on narrow phones. | Use 3×2 on phones and six across when space permits, retaining 48px control height. |
| Controls covered the rooster on 568×320 landscape. | Move the dock and paused-visit controls into the side column at that size; the fresh capture keeps the actor and action visible. |
| A parcel could disappear behind the outdoor actor/post. | Give carried parcel graphics an outdoor-safe depth. Actual natural playback shows the parcel at the post and through the front door. |
| The rooster emerged from bed already holding coffee ingredients. | Suppress only the first bed-to-task travelling ingredient prop. The work prop still appears at the counter. A narrow actual-browser follow-up confirms both states. |
| Repeated relaxation made the rooster unnecessarily leave its chair and sit back down. | Preserve contact only when the next seated action names the same seat. A genuine mundane “Sit for a while” also sits without adding any recovery. The targeted 21→31→41 playback check retains the seat, then gets up and walks to the rose project at 46. |
| Preparing still said “Up to60 choices.” | Remove the unnecessary technical ceiling; retain the short phase feedback. |
| An explicit provider charge could be undercounted when token telemetry was missing. | Honor the larger explicit charge, retain the unknown-usage reserve, reject nonfinite costs and enforce the same budget guard when reusing a cached answer. One focused mocked regression verifies initial work and restart behavior. |

Development hot reload invalidated one review run's later frames. Those frames were excluded; source-frozen playback independently rechecked the actual work location and result. Controlled native fixtures, genuine diagnostic Jev days and the canonical paid day are identified separately below.

## Real testnet result

NORI #4's day three was submitted through the actual UI against the new local worker using the shared production Cloud store. It settled on Robinhood testnet 46630. It is an authentic committed game day, rather than a fabricated opening scene.

- **Six successful real Jev calls; $0.000548** accounted inference cost, independently recounted from provider outputs.
- One parcel pickup at slot 1, crediting one water, wood and toolkit exactly once.
- One main undertaking: planting roses in plot1, completed at slot 46.
- Sixty receipts, 192-byte packed final state and 240-byte contract history.
- The immutable packet, canonical packed state/history, replay commitment and combined contract result hash agree. The only JSON shape difference is an omitted optional empty `deathContributors` array, which decodes as `[]`; packed bytes are identical.
- The UI sent one owner transaction, opened the saved replay automatically from level 2, and reached the level 3 trial-complete screen with no browser errors.

The accepted job took 156.893 seconds with the local worker and shared Cloud storage. This is staging evidence, not a hosted-worker performance measurement. Earlier final-policy diagnostic days used six calls / $0.000617 for coffee-before-mail/roses and seven calls / $0.000657 for an afternoon chair with mundane choices. The ripe-apple diagnostic deliberately supplied a mature plant; it does not claim the three-day testnet trial naturally matures apples that quickly.

Request: `0x0f68a12974c0c84793b7ad804ee1ef66b587ad3c741d547674347cae2118c2b2`.

[Owner transaction](https://explorer.testnet.chain.robinhood.com/tx/0xac1389b5484cb98df9257f71a350206e83d74fb20e6d3bda4ebc6c37392e9673) · [settlement transaction](https://explorer.testnet.chain.robinhood.com/tx/0x78e369dd3b4cd83c6e058ab67622d3a27404575e5d259afff656305cbabe43fa).

Replay commitment: `0xebda065a42957a11e42a0bdb1fb4863203f5ef726c90350315a363a63dc876c4`.

The [independent canonical checks](daily-life-review/proofs/verified-ready.json), [funded browser result](daily-life-review/proofs/funded-browser.json) and [preview manifest](daily-life-review/proofs/canonical-preview.json) record the exact identity and result.

## Recovery, contract and art boundaries

The PC restart interrupted the preceding attempt at slot 8 after one paid planning call / $0.000089. It expired canonically, preserving NORI's day-two state and inventory. The fresh retry above advanced biology exactly once. Confirmed submissions are retained as history; no refund or deletion was attempted.

Before changing the decision policy, admissions were paused, older signed quotes were proven strictly expired, and the current job completed. At the final staging check there were no pending requests and all twelve jobs were terminal. The new policy fingerprint is `0x31eaa17eed2526572050f27eb9987c5a9646f191c7957474197193df26f0413d`. State/history codec 1 and the deployed contract remain unchanged.

The [contract and artwork review](CONTRACT_AND_ART_REVIEW.md) records the fresh 17 lifecycle checks and 24 grouped adversarial properties / 74 rejection variants, deployed bytecode identity and art sampling. Minted appearances are stable procedural pixel combinations from the birth seed, shared by the game and NFT image. They are not AI-generated images and are not guaranteed visually unique.

Jev runs offchain. The trusted service enforces detailed gameplay and submits bounded results through the limited relayer. The contract validates ownership, request/payment rules, result shape and commitments; it does not independently execute the model or prove inventory provenance. The contract checks are internal evidence, not an external security audit. Mainnet remains a separate, deferred step.

## Verification scope and release

Domain 17 and service/storage 10 checks passed after their meaningful changes. The final TypeScript/build checks passed. Browser reviews cover phone, short landscape and desktop sizes, title/skip/reentry, room exploration, plan/log/seek/resume and work/result feedback. The native movement witness uses an offline finite-choice fixture and reports exact route/state continuity; it is not a live inference or performance benchmark.

The actual compiled canonical NORI day completed naturally in 70.257 seconds, from title through mail collection, parcel return, planting and bed. Final visible needs, inventory and plots matched the packet, and all 60 original log entries remained individually available. That full watch used `index-D6lyQZGL.js`. The subsequent seating-only correction passed a focused actual-source check through repeated relaxation, mundane sitting and departure for the project; the final build is `index-CPacLGh4.js`, with unchanged `index-CSAx3zug.css`. This distinction is preserved in the [natural playback proof](daily-life-review/proofs/natural-day.json), [seating proof](daily-life-review/proofs/same-seat.json) and [gameplay review](daily-life-review/GAMEPLAY_REVIEW.md).

The [compiled phone review](daily-life-review/COMPILED_PHONE_REVIEW.md) includes a delayed-preview identity check and the balanced phone room grid. The [function package inspection](daily-life-review/proofs/function-bundles.json) confirms Node 22, background preparation, five-minute reconciliation and the new policy code without development-wallet/scratch imports. The [credential audit](daily-life-review/proofs/credential-audit.json) compares all four real private credential values against the source, frontend output and every decompressed function entry; no values were found. A defensive environment-variable name in exception redaction is documented separately and is not a credential value.

Verified permanent source/assets/proofs live outside `TEMP`; no runtime or build input depends on scratch contents. There is one final production push for this sprint, followed by public verification and reopening testnet admission. No mainnet deployment is part of this release.
