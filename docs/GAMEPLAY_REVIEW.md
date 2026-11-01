# Gameplay, animation and fun critique — 1 November 2026

This pass followed the earlier [UX/recovery audit](UX_AUDIT.md). The PM assigned three parallel hats: a world/motion owner, a UI/gamefeel owner and an independent player/fun critic. They used actual saved BOK/PEEP films, canonical controlled contact fixtures and the approved Moss & Cream mockups. The PM reviewed rendered pixels and sent rejected results back for correction.

The permanent [comparison and motion gallery](gameplay-review/index.html) contains **18 screenshots and two twelve-second before/after clips**. It works without `TEMP/`, including the original reference links. The game source, assets and build have no dependency on these audit artifacts.

## Findings and decisions

| Question / actual finding | Change | Evidence and decision |
| --- | --- | --- |
| Why do long purposeful trips look rushed? Actual routes of 640/528/352 world pixels all took 1.45 seconds. | Use a consistent distance-based **115 world pixels/second** gait for purposeful routes, delivery and bedtime. Keep the connected route visible. | The 640-pixel trip takes 5.565 seconds. No additional opaque cuts were added for purposeful movement. |
| Why can toast face away from its stove? The work direction inherited the preceding route. | Face the relevant fixture; start windup/contact/recovery with that action, with small watering/repair tool arcs. | Controlled completed-frame contacts and the actual full film were reviewed. These gestures do not change success or biological state. |
| Is the character prominent enough beside the mockup's composed action? | Increase actor-only scale **1.25 → 1.45**, retaining the source identity and foot pivot. | Matched 390px prototypes were compared; final toast, watering and bed frames confirm contact and blanket fit. Furniture and whole-room zoom are unchanged. |
| Why do quiet stretches feel choppy? A real public 45-second PEEP sample detected twelve flat-navy segments, estimated 4.31% scene-cover time. | For eligible runs of at least three unchanged quiet receipts in one recorded phase, show the first and last actual target; omit middle visual visits. | This addresses repetition rather than shaving another few milliseconds off every fade. All original records and their indices remain individually seekable. |
| Can editing quiet time hide something important? | Require living, successful T01, no biological/house/inventory/condition/plot changes, only action/quiet events, no fire/power outage and no unresolved nonquiet episode. Split at phase boundaries. | Explicit negative cases cover phase, changes, incidents, missing change metadata with real state differences, fire and unresolved episodes. Seeking an omitted middle entry restores its exact state/caption and resumes normally. |
| What did the choice actually do? The inspector showed probabilities and a joke but omitted costs/results. | Show the actual target and compact literal need, stock, condition, plot and house changes. Briefly cue changed need meters at the recorded impact. | Actual Milk: Food +25, Water +27, Energy −1, Milk −1. Actual chair: Energy −3, Wood −1, Hammer & Nails −1, Chair built. These are net receipt changes, not invented causal explanations from the model. |
| Where are the interesting moments in sixty equally weighted lines? | Add six phase landmarks, relevant item/action icons and quieter unchanged entries, using the shared quiet-eligibility helper. | All sixty original entries remain present and seekable. No cost or model call is incurred by inspection. |
| Why does the day feel uneventful after building a chair? PEEP's saved summary surfaced only Jitters cleared. | Derive up to three concise literal highlights from successful saved receipts and the existing recap, prioritizing a tangible accomplishment. | Actual PEEP recap: **Built a chair. / Jitters cleared. / Drank some milk.** The packet is unchanged; terminal results receive no healthy highlights. |
| Can the richer recap actually be read on a phone? New text produced a cramped panel and a title under the HUD. | Reserve HUD space; keep one main action and place the two secondary links on one row. | The PM rejected both intermediate 320px and 390px frames. Final 320/390/430 frames show the title and all three highlights; secondary controls are 44px high. The fix is scoped to portrait phone summaries. |
| Why does an older completed day barely replay? After natural completion, Watch day one returned to the archive in 4.337 seconds. | An explicit Saved days **Watch day N** starts at receipt zero. Ready's separate Resume behavior remains. | Independent after-review reopened DAY01/LV00 at its beginning after a late seek/return. Current-day acknowledgement and the three-item care draft remain intact. |

## Pacing and retained facts

These are comparisons of the **same immutable BOK day-two packet** in the real Phaser renderer under a controlled clock:

| Presentation | Visible receipt moments | Quiet montage cuts | Controlled film time |
| --- | ---: | ---: | ---: |
| Published baseline | 60 | 48 | 110.4 seconds |
| Consistent gait, before quiet editing | 60 | 48 | 121.8 seconds |
| Final edit | 28 | 18 | **74.4 seconds** |

All sixty records, decisions, encoded history and final state are retained. The final PEEP day-two packet renders thirty visible moments / seventeen cuts / 75.0 controlled seconds. These counts describe presentation, not fewer biological actions or paid model choices. The old full BOK real-time capture took 112.53 seconds; clock-driven and wall-clock observations are identified separately.

The independent frozen-browser review watched real PEEP day two from receipt zero through summary in **79.179 seconds**, including a 1.766-second pause and screenshot overhead. It found the gait, larger character, effects and reduced fragmentation easier to follow. Pause held identical world pixels for 1.1 seconds. It sought a quiet middle entry, verified its genuine recorded choice and target, resumed, and confirmed historical restart. It reported **zero page errors and zero non-GET API requests**.

That independent candidate still had the crowded 390px recap; the reviewer confirmed the PM's finding. The final CSS-only correction was subsequently inspected and measured at 390/430, with the already-approved 320 layout retained. The final compiled browser build also passed a PM read-only check at320/390/430: heading below HUD, all three highlights visible, zero horizontal overflow/errors/API writes. The [final browser proof](gameplay-review/final-browser-proof.json) identifies that artifact. The full movie was not needlessly repeated for the summary media-query change.

## Provenance and practical limits

The [motion metrics](gameplay-review/motion-metrics.json), [seek/boundary proof](gameplay-review/quiet-span-proof.json), [UI feedback proof](gameplay-review/ui-feedback-proof.json), [restart/draft proof](gameplay-review/restart-summary-proof.json), [portrait summary proof](gameplay-review/summary-phones-proof.json) and [independent review data](gameplay-review/independent-after.json) retain the focused observations. Controlled contact fixtures are labeled as fixtures; they are not presented as naturally selected paid Jev outcomes. The two clips are actual renderer recordings cropped to its world viewport, with nearest-neighbor scaling.

This pass made **no new model calls or owner transactions** and changed no domain rules, fees, contract, saved packets or AI choices. It refined their presentation. Existing domain/service/contract suites were not repeatedly rerun for animation and layout changes; build/type checking and the targeted state/pixel witnesses address the changed paths.

The public baseline had two interrupted non-JSON reads and one later JSON 503, followed by successful read-only recovery. These were recorded without inventing a new gameplay cause. Physical phone keyboards, every headgear/outcome combination, mainnet and population balance remain outside this pass. Mainnet stays deferred by the owner.

## Published verification

One production push published source `4bda9d1e321eb8d4f612e4b5a58520a28fc5fb9a`, Netlify deployment `6ae73c3d6fe27a0b24af0583`, at **20:19:23 Bangkok time (13:19:23 UTC)**. The public page loaded the exact final `index-C-zCEsnz.js` build.

With workstation QA servers stopped, a read-only public check opened PEEP's saved day two, played its beginning and skipped to the actual saved recap. At **320/390/430px**, the heading stays below the HUD, all three literal highlights are visible and there is no horizontal overflow. The check reported **zero page errors and zero API writes**. The [published browser evidence](gameplay-review/published-browser-proof.json) records each measurement; the three final recap images in the gallery are the published captures.

The independent full-film review and exact quiet-entry/restart checks above exercised the same gameplay code before publication. The final live check confirms its published artifact and corrected portrait layout. No new paid preparation was needed for this presentation pass. Owned browser tabs and temporary servers are closed, and the working evidence is committed locally without another production push. Mainnet remains deferred.
