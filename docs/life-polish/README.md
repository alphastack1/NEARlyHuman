# A little more life, with the original rooster

This pass extends the previous first-use review across the game's whole current journey. Three specialists owned the world/art restoration, stage-by-stage flow and quiet audio; the audio builder then independently critiqued the other work. PM inspected actual rendered results, implemented the shared UI treatment and inspection links, and sent the concrete findings back through targeted repair/review loops.

## Original art is the source of truth

The prior V2-only replacement silhouette is removed. The world again calls the owner's unchanged `roosterCanvas` and uses its original frame and poses. No new body, palette, accessory or trait mapping is substituted. Both original rooster source hashes are unchanged, and **54 actual renderer textures**—three saved NFT seeds across 18 poses—match the canonical generator byte-for-byte. The owner constraint is now recorded in [AGENTS.md](../../AGENTS.md). The rejected helper is archived only in ignored TEMP.

[World evidence](WORLD.md) separates that restoration from the permitted environmental work: restrained teal/rust textiles, coral flower pictures, blue water/mailbox accents, warmer light, richer greenery and tiny cloth/leaf/butterfly motion. No global tint is applied to the rooster. Produce icons are now distinct at their native 20×20 resolution; Strawberry and Apple no longer look like the same red block.

## Clearer stages and controls

The [full state/action matrix](JOURNEY.md) covers adoption, first post, wallet permission, mint/transfer confirmation, planning/saving/readiness, retry/expiry, current and historic films, belongings, purse, remembered lives and returns between them.

- Waiting describes the actual operation. Accepted-day milestones reflect real phases, not a percentage guessed from model-choice counts. **Back home** is the main option during processing; **Check again** is secondary. Ready, retry and confirmed expiry have their own next action.
- A ready day opens and starts with one explicit Watch action. An automatic handoff still offers Watch first. A late automatic read cannot close a belongings sheet, interrupt another view or leak its unrelated error into that view.
- Days/portfolio reads have scoped loading and retry states, retain the right life/scroll context, and avoid stale rows or a false-empty flash.
- Belongings group food/care, seeds, garden goods and workshop materials. Historical inventory names its day. Exact six-decimal balances avoid showing 250 NHC when the actual balance is 249.999999.
- Care/Garden/House are clearer supply groups. Bandage sits with care; Compost sits with seeds in Garden. Wide utility rows and the four-item House grid keep those categories balanced.
- Remembered owners see **Hatch another**, their canonical ending cause and reachable withdrawal rights. Nothing about death custody or token authority changed.
- Buttons, tabs and selected items share pressed/selected treatments. A brighter restrained palette, native-size icons, wallet clasp detail and less heavy backdrop dimming add warmth. The underlying Player is inert while an external sheet is active.

World inspection also has a purpose: the pantry shows actual food/care stock, the post box shows finished shippable goods and links directly to packing the next post, and **Find rooster** is available before playback after exploring the house. These are local presentation/navigation actions; the NPC still chooses its own activities.

## A little sound

[The audio layer](AUDIO.md) adds quiet selection/back/parcel/project/day cues and an original sparse musical phrase during active playback. It creates no AudioContext before a gesture and downloads no music asset. Sound is reachable from the title, entry/hatch, example and menu, and remembers its setting. Pause, menus, mute and hidden-page handling stop music; one visit reuses one context.

The actual offline synthesis has no clipping and substantial silence. Browser proofs cover pending unlock versus mute/disposal, re-enabling, voice limits and real Player integration. These are measured lifecycle/signal results, not a human listening claim. A [generated reference preview](audio/quiet-preview.wav) is preserved separately; the application generates its own audio and does not load this file.

## Short experiment record

| Question | Evidence | Change/result |
| --- | --- | --- |
| Did the rooster change? | The prior world used a separately authored silhouette. | Restored the canonical generator; 54 texture comparisons and unchanged source hashes verify identity. |
| Does every waiting screen explain its next action? | Permission, hatching and transfers shared day-planning wording; Check day looked required. | Operation-specific states and honest milestones; processing now foregrounds leaving safely rather than repeated checking. |
| Can a day arrive without interrupting exploration? | A ready response could start a replay read before the player left the pending sheet. | Commit/error guards preserve the newer view. Delayed success/error and one-click/automatic Watch cases pass. |
| Are amounts and supplies understandable? | 249.999999 rounded to 250; Bandage/Compost were under House; old-day stock lacked its date. | Exact formatting, natural categories, dated historical inventory and useful grouping; independent targeted review passes. |
| Can a first visitor mute? | Menu was unavailable during the example. | Title/sheet/example controls, keyboard-safe title behavior and silent muted playback verified at 320 width. |
| Are new visuals useful? | Strawberry and Apple looked alike; pantry/post inspections were generic. | Distinct native icons, actual filtered stock and a direct packing route; real pointer taps and drags pass. |

## Verification scope

[Independent critique](CRITIQUE.md) records 28 initial inspected views and eight focused post-repair cases. [Ready/context proof](journey-ready-context.json) checks the final delayed-read/Watch/expiry boundaries. [PM layout review](pm/review.json) covers 13 views at 320/390/430 widths, a short 320×360 hatch surface and desktop. [PM world interactions](pm/inspect-flow.json) use actual pointer drags/taps and actual MISO inventory with a controlled owner address. Settled layout captures fast-forward finite CSS entrances; motion, audio and natural demo timing are separate checks.

Unavailable purse/death/job states are explicitly synthetic presentations of the actual source. They are not new accepted days, withdrawals, token earnings or chain receipts. QA made no inference call or onchain transaction. Contracts, economic rules, model policy, credentials and financial ledgers are unchanged. The final type check and production build pass. Temporary tooling/builds stay in ignored TEMP; the permanent application depends on none of it. Publication happens once after final review, with the actual hosted outcome recorded separately.

- [Current menu](pm/menu-390.png), [grouped belongings](world/produce-stock-320.png) and [care post](pm/care-320.png).
- [Original rooster and warmer room](world/after-bedroom.png), [yard](world/after-yard.png) and [distinct produce](world/produce-native2x.png).
- [Useful post box](pm/inspect-post-box-390.png) and [packing from the world](pm/post-box-to-post-390.png).
