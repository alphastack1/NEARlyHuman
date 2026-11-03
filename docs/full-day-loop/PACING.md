# A full day with a clearer rhythm

This review watches the actual saved **MISO #1, Day 28** from beginning to end at normal **1×** speed. It does not use the shortened example, seek, Pause or Finish day. The approved art generator and all canonical receipts remain unchanged.

## Observed baseline

The actual live film completed naturally in **73.209 seconds**, with zero hidden-tab samples, application errors or application write requests. A read-only renderer/DOM sampler recorded the actual walking, contact and work phases every 100 ms. The initial API replay is bound to request `0x0a11268acafbd6a709eaa5bb8cb965dc41a82430eb330ed4a2dddc6eb625d98b` and commitment `0xd17903f931ec0917ed8fa59fae2d53af9fd54c52967d8b9c1af987de10292277`.

| Observed portion | Approximate sampled time | Player effect |
| --- | ---: | --- |
| Walking and carrying a parcel home | 47.489s | About 65% of the whole film is transit. The world stays continuous, but mundane commutes dominate. |
| Action/quiet work | 21.807s | The substantial harvest has weight, but the shorter routines share much of the same held-pose timing. |
| Arrival/contact pauses | 3.604s | Stops are distinct but add to repeated trips. |
| Delivery alone | 22.990s | The morning post is important, but its full round trip is almost a third of the day. |
| Late drink | 10.200s | 8.399s is walking; the caption says “A cool drink” long before the rooster reaches the pantry. |
| Main harvest | 11.100s | 5.596s is actual work. This is the part worth retaining as the day's substantial undertaking. |

The displayed **The morning post** caption lasted approximately 23.990 s. **Feet up** lasted 6.900 s while the canonical slot 31 events included **A wing needs care** and a domestic mishap, so the day's real surprise was easy to miss. The bedtime caption appeared during the walk to bed rather than distinguishing the journey from settling in.

The old code does **not** literally show “Just a moment” for every empty span. The player filters those interludes and retains the previous action's text. The issue is stale action/result text across quiet breaths, alongside the first deliberate quiet start. Source label counts are not treated as observed screen counts.

[Baseline timing summary](pace/before-summary.json) contains the measured phase/caption groups and transition spans. The raw sampler trace remains in ignored TEMP; no need to duplicate a full public replay packet in the permanent repository.

- [Actual mailbox pickup](pace/before-mailbox.png)
- [The actual wing event hidden beneath Feet up](pace/before-mishap.png)
- [The main harvest](pace/before-main.png)
- [Natural completion](pace/before-complete.png)

## Presentation repairs

- Route-purpose captions distinguish checking the post, carrying the parcel home, visiting the pantry, heading to the garden/workbench and going to bed. They describe travel without claiming that work has already happened.
- Quiet breaths have short time-of-day observations rather than indefinitely retaining the last completed task. The existing morning/afternoon/evening boundaries are respected.
- Meals are time-aware: a later Breakfast operation can be a late breakfast or breakfast for supper, and a late Drink becomes one last sip. No meal, preference or action is invented.
- `receiptEventNote` exposes an actual canonical condition/incident/death message separately. The Player must call it only at receipt impact; approach/work titles do not reveal future incidents. Ordinary quiet events do not become dramatic notices.
- The substantial main work remains **5,600 ms**. Empty breaths use500–650 ms, deliberate routine Quiet 1,000 ms, Drink 1,050 ms and Eat 1,300 ms; care/coffee/meal timing differs modestly. Event-bearing routines retain at least 1,900 ms. This leaves room for the incident to register while sharpening the contrast between small routines and the big project.

[The focused helper proof](pace/helpers-proof.json) uses the actual saved MISO result plus one explicitly synthetic late-Breakfast caption fixture. All **60 receipt indices** remain ordered and covered exactly once by 14 film beats. The result hash is identical before/after the presentation helpers. The MISO work budget changes from 21,900 ms to 18,600 ms, with its main work unchanged at5,600 ms. This is a work-budget comparison, not a claim about final full-film duration; the renderer's transit changes are reviewed separately.

## Short experiment record

| Question | Evidence | Change | Decision |
| --- | --- | --- | --- |
| What actually makes the full day slow? | A natural 73.209 s live run spends about 65% in transit. | Give travel a clear purpose and let the renderer reduce uneventful commuting. | Preserve continuous routes and keep main work meaningful. |
| Does the quiet time feel varied? | Empty spans retain old action/result captions; the first quiet routine says Just a moment. | Contextual quiet/meal observations and modest breath trimming. | Keep calm pauses rather than removing every breath. |
| Can the player notice the day's little surprise? | The actual wound/mishap arrives while the screen says Feet up. | Canonical event helper, revealed at impact only. | Do not fabricate incidents or spoil them before their recorded impact. |
| Do pacing changes alter the actual game? | Focused checks cover all 60 original indices and hash the complete result. | Pure display helpers and duration changes only. | No state, reward, choice, event or onchain rule changes. |

## Observed integrated after-run

The integrated candidate completed the **same actual MISO Day28 film** naturally in **61.519 seconds**, compared with 73.209s before: an observed 11.690s reduction, approximately 16%. Both runs use the same 390×844 phone viewport and normal 1× global playback rate, with zero hidden-tab samples, application errors or application writes. No Pause, Seek or Finish action was used in either full watch. The renderer's separate long-commute boost is bounded; this is not a whole-film 2× fast-forward.

| Observed portion | Before | After | Interpretation |
| --- | ---: | ---: | --- |
| Whole natural film | 73.209s | 61.519s | Less waiting, while keeping every recorded activity. |
| Transit including parcel return | 47.489s | 39.600s | Still continuous walking through the large house/yard; no position jump or invented shortcut. |
| Work/quiet phases | 21.807s | 18.502s | Shorter mundane actions/breaths preserve the substantial project. |
| Contact | 3.604s | 2.899s | Fewer repeated dead holds around real fixture contact. |
| Delivery | 22.990s | 18.099s | Checking, pickup and carrying home now have distinct purpose captions. |
| Main harvest work | 5.596s sampled | 5.600s sampled | The main project retains its weight. |
| Late drink, including walk | 10.200s | 8.001s | Travel is described as a pantry visit, then the actual drink is one last sip. |

The after-run's delivery captions are **Checking the morning post → The morning post → Taking the parcel home**, instead of one delivery caption lingering for almost 24s. The late drink similarly distinguishes the 6.7s pantry walk from the 1.3s visible drinking-caption interval. Bedtime has **Heading to bed → Goodnight**, and quiet spans now show time-of-day observations.

The actual wing notice was visible **only after the slot 31 receipt impact**. [The captured notice](pace/after-mishap.png) is legible beneath Feet up. The final card remembers the actual **Apple +1** result and the truthful **A wound still needs care** hint, rather than only a generic day/level message. [The completed card](pace/after-complete.png) makes both the accomplishment and next care need clear. The phase-start [main-work frame](pace/after-main.png) shows work before the apple is picked; it is not used to claim a held-fruit payoff frame.

The [comparison record](pace/comparison.json) also checks the **actual replay object handed to React**, not a cloned diagnostic copy. A transparent page-local wrapper calls the original `Response.json`, retains that exact returned `packet` reference before the API client receives it, then returns the same object untouched. After natural completion, both its complete result and full packet serialize to identical hashes:

- Result before/after: `70bc45ec80f65ed6d38fc06a9c1d8260f8adf350a89eade15c2a7517ab784377`
- Full packet before/after: `aac01d4568371051a7619832182320eac2a7b62d50f82f007b0aacc594e5fff1`

That covers all 60 receipts, snapshots, events and the packet's other data while the renderer performs its distributed previews and the Player creates its ending summary. [The after phase/caption record](pace/after-summary.json) preserves the observed transitions. Raw 100ms samples remain in TEMP.

The integrated full watch found no remaining pacing blocker. The improved captions explain the movement, the main harvest still feels substantial, the small mishap now registers, and the ending provides a factual reason to care for another day. Small typography/camera-only refinements do not require buying or simulating another authoritative day. The application type check passed after the display helpers; PM owns the final integrated build/release checks.
