# Physical work, small reactions and a calmer stride

This specialist pass owns the recorded-day renderer. It leaves every original rooster texture, seeded appearance and pose generator unchanged. The visual day still follows the canonical receipt sequence; the renderer decides no action, need, crop, inventory, reward or death outcome. The full uninterrupted normal-day timing comparison belongs to the separate pacing reviewer.

## Camera follow refinement

The PM/source review found another source of perceived jumps: changing a caption or inspection height called both `setInsets` and `resizeWorld`, and both immediately recentered the camera even when the canvas dimensions had not changed. This could look like a teleport despite a continuous actor position.

The focused [before](animation/camera-before.json) and [after](animation/camera-after.json) probes use the actual MISO Day19 saved Craft snapshot, an explicit UI seek and a real tap on the workshop. Passive wrappers observe the resize/inset methods without changing their arguments or results. The actor remains stationary at its actual contact point throughout; this is not another broad full-day replay.

| Phone viewport | Before immediate camera change | Before redundant same-size resizes | After immediate change | After largest observed frame step | After same-size resizes |
| --- | ---: | ---: | ---: | ---: | ---: |
| 390×844 | 14 world /28 CSS pixels | 2 | 0 | 1 world /2 CSS pixels | 0 |
| 320×568 | 16 world /32 CSS pixels | 2 | 0 | 1 world /2 CSS pixels | 0 |

The first inset measurement still frames the initial view immediately. Subsequent caption/inspection changes follow the existing150 ms camera easing. The factory caches logical width, height and integer scale and skips identical-size scene resizes while refreshing input bounds. Actual viewport changes remain immediate, resize the scene exactly once and preserve the correct 2× backing/CSS dimensions. Both before/after probes had zero application errors and zero writes. The final integrated TypeScript check passes.

No additional actor, route, pose, rule or timeline change was made for this fix. The already observed uninterrupted day timings remain the pacing reviewer's evidence; this small final repair is verified by the defined camera/UI probe above.

## Findings and repairs

| Question | Observed evidence | Change / result |
| --- | --- | --- |
| Does the pet pause when the day pauses? | During the actual MISO Day19 craft, work time stayed at 979.28 ms but the hammer moved from y328 to324 over410 ms paused. | Actor/tool/work effects now use an active clock. A real420 ms pause after repair held that clock, canonical pose and hammer position exactly. Ambient light/leaves can continue. |
| Are feet grounded and matched to movement? | Canonical walk frames already contain a one-pixel bob; the renderer added a second bob and periodically lifted the whole breathing body. | Keep the original frame at its foot anchor. The two existing walk frames follow actual distance traveled, including the short-example playback rate. |
| Can long commutes feel purposeful without skipping space? | The baseline parcel visit and pantry return dominate the opening. | Only routes longer than240 world pixels receive a gradual boost, capped at1.28×. Local movement and the relative seeded brisk/measured/unhurried tempos remain. All route points are walked continuously. |
| Does gardening happen at each bed? | Earlier beds got470ms of contact; the full work budget happened at the last one. | Watering and harvesting divide the same requested work budget between their actual stops. Per-bed visual updates occur with the local work, only on successful canonical receipts. The final snapshot/impact callback is still committed once. |
| Can a film seek leave the garden in an old preview state? | Per-bed visual previews are separate from the last complete receipt state. | Track those previews so the next canonical state/explicit seek restores their textures and mature-crop glints correctly. No simulation state is mutated. |
| Does finishing look finished? | Craft kept the repair pose after its hammer became a finished boat; harvest kept working empty soil. | Outcomes occur near the end of work, with a short original perk/peek settle. A harvested item can remain visible into the existing empty breath for about1.1 s total, ending before a new real activity. Crafts instead remain visibly on the bench. |
| Do mundane routines differ? | Leisure fell through to the generic empty-handed use pose, dawn look stayed asleep, and already-asleep bedtime could walk out of bed solely to re-enter it. | Use existing doze/preen/signature poses for actual leisure, peek for the actual routine look, and keep an already-resting pet in bed. Quiet gestures have a seeded phase offset; actual incidents/physical changes can produce a brief canonical perk/hurt reaction. |
| Are held things truthful? | A generic `arg || bread` made cooked/raw steak and some meals show bread. Coffee at the stove steamed at the counter. | Map the actual food operation/ingredients, display Bandage for wound treatment and Medicine otherwise, and show Soap only when consumed. Steam follows the actual stove/counter variant. |

An explicit opaque-pixel pet tap now gets a small acknowledgement while an active route continues; a sleeping or paused pet can use an existing peek/perk. It changes no morale, health or recorded action and does not invent a new incident.

## Actual Toy boat contact review

The selected-event proof uses the real **MISO #1 Day19** Toy boat receipt: main slot 36, Craft arg 1, wood 6→0 and boat 0→1. Its request is `0x6de34d03184f78d4ea363da739c18a351073b6d6baa8e655430096b529a4f205`; its packet commitment is `0x28cad0e52229da8275ef06166b848e7c6b1e19ef71b717e381e6d032464ff951`. The script deliberately seeks to the preceding saved receipt, then resumes normally. It is not a second full-day timing run and makes no new inference, wallet or chain transaction.

The actual [before view](animation/before-craft-contact.png) confirmed a physical gap: foot y345, hammer center y328, while the bench surface was aroundy285. The parent approved a bounded non-rooster repair: retain the68 px bench width, draw its cabinet at a native40 px height and move only the workshop approach fromy345to the walkable row at y329. The tabletop is nowy303, within the actual hammer stroke at y305→301. The feet remain below the furniture; the route does not walk through the table. No stool, actor rescaling or new mechanic was introduced.

The work-in-progress used to build the same chair-like scaffold for every recipe. It now reveals the existing native finished-item art progressively above a little wood/shaving surface. The actual Toy boat therefore looks like a boat being made, without new item art or a reward change.

The previous inventory display used depth288 behind the opaque bench at323, hiding completed goods. Finished crafts now sit visibly on the tabletop at depth324. A first crafted object is not simultaneously drawn both held and stored: it settles in the hand, then appears on the bench.

[After proof](animation/craft-after.json) recorded zero application JavaScript errors and zero application writes:

- [Paused physical contact](animation/after-craft-paused.png):420 ms between reads, unchanged actor clock/pose/held position.
- [Recipe-specific progress](animation/after-craft-progress.png): actual item31, native cropped pixels.
- [Finished boat](animation/after-craft-outcome.png): original perk pose holding the boat, no hammer, no duplicate stored object.
- [Boat on the bench](animation/after-craft-on-bench.png): visible atworld y303/depth324 after the receipt ends.

The selected proof uses the separate Codex Browser profile and one run-owned tab, with page-local memory storage and sound muted. Runtime data are read only to observe the renderer; no renderer state setter is invoked beyond the game's normal explicit seek control. The owned tab is closed. Type checking passes after the integrated renderer changes. The original rooster source files were never edited.

## Scope

The production edits are the renderer plus the parent-approved workbench drawing and single workshop anchor. Crop/craft previews show the result already present in an accepted saved packet. All 60 receipt facts remain intact. The pacing and independent fun reviewers inspect the final complete-day experience separately; this report does not claim a new paid day or unobserved rare-action playback.
