# Game art sources

The bundled Press Start 2P font is distributed with its original copyright and
SIL Open Font License in [Press-Start-2P-OFL.txt](../public/licenses/Press-Start-2P-OFL.txt).

The running house is a connected 32 × 28 tile scene with a moving camera. Floor,
walls, furnishings, plants, actor, tools, damage, patches, water and small effects
are separate layers. The approved mockup is a visual reference, never a runtime
background or screenshot overlay.

## BOK and other rooster identities

`src/art/rooster-data.ts` preserves the owner's 24 × 24 source body, beak,
palette and 30 headgear grids from the authorized local CRYPTOCOCKS project:

- Original file: `CRYPTOCOCKS/src/sprites/trait-data.ts`.
- Inspected revision: `8e351c06da9eb8d6061dba83401192dca1b26d32`.
- Source header: generated 2026-05-14 from CockTraits
  `0xc75A5c1243A53da671047C8eb48B0734960BD876`, chain 5003.
- Original art contract: `packages/contracts/contracts/CockTraits.sol`, marked
  `SPDX-License-Identifier: MIT`. The original source headers are retained.
- Reuse was explicitly authorized by the owner. Only art anatomy/accessory data
  was copied; old battle rules, networking, economy and runtime code were not.

`src/art/rooster.ts` renders identity from the NEARlyHuman seed. Its padded 32 × 40
frames keep tall headgear within bounds and use a common foot anchor. Eye closing
occurs before headgear compositing so masks and glasses remain intact. Feet and
wing poses animate the same identity for walking, eating, treating, gardening,
repair, sleep, hurt and death. The original source repository is not needed to
build or run NEARlyHuman.

## Furniture and original pixel work

Three transparent furniture source sheets were generated with the built-in image
generator using `design/references/VR-01-approved-house-and-care.png` as the sole
style reference. Mode: **reference-guided generation**, transparent background,
three isolated objects per sheet. They contain no mockup panels or room scenery.

| Editable source | Runtime PNGs | Native frame sizes |
| --- | --- | --- |
| `src/art/sources/kitchen.png` | fridge, stove, prep | 30×44, 32×34, 34×28 |
| `src/art/sources/bedroom.png` | bed, cupboard, plant | 44×66, 28×44, 26×31 |
| `src/art/sources/living.png` | table, chair, baseSeat | 52×36, 18×25, 24×28 |

The table source includes its two dining chairs. Its output frame is wider than
the initial requested footprint to preserve those silhouettes. The chairs are
not separate gameplay outputs. The optional crafted chair remains independent.

Shipping exports live in `public/assets/game/props/`, with dimensions and anchors
in `manifest.json`. The source sheets and all prompts are permanent in
`src/art/sources/`. To regenerate native exports after an intentional source
change, run `python src/art/export_furniture.py` with Pillow installed. This
authoring step finds the three isolated silhouettes by alpha gutters, preserves aspect ratio, uses nearest
neighbor scaling, limits each object to 48 colors and bottom-aligns its fixed
frame. It is not a production build dependency.

`src/art/pixels.ts`, `fixtures.ts` and `house.ts` contain original code-native
pixel art for all 15 item icons, wall/floor tiles, rugs, garden soil and plants,
mailbox, sink, window, bedside lamp, patches, braces, umbrella and shelter.
Dynamic versions are composed over the same furniture textures. Runtime geometry
and pixels do not depend on anything in `TEMP/`.

The palette follows the approved warm honey wood, cream plaster, moss textiles,
navy panels and blue bedding. Bright red, yellow, blue and green remain semantic
accents for needs, actions and feedback.

## Verification record

The permanent [evidence gallery](ux-audit/index.html) preserves world
before/after comparisons, terminal and delivery frames, and all fourteen
action/condition coverage sheets. It works without `TEMP/`; temporary audit
scripts, raw captures and motion clips are optional supporting material.

- All nine native furniture exports were inspected at game scale on the actual
  Phaser camera; the bed, cupboard, plant, continuous counter and stove replaced
  the first flatter draft.
- The actor uses a fixed foot anchor and independent foreground blanket. Walking
  stays on the house's presentation paths; rules and outcomes come only from the
  domain receipts.
- The window's presentation approach is tile (8,5), on the floor in front of the
  cabinet run. The draft (8,2) position overlapped the wall glass in actual
  interaction pixels. Its stable `window` target and all mechanics are unchanged.
- Asset preload and room rendering were checked in the shared Chrome browser;
  no page errors occurred. Browser captures and experimental fixtures remain in
  `TEMP/build/world/` and are disposable.
- Art, actor and world modules are checked by the project's TypeScript build.

## Replay pacing and quiet life

The PM approved treating the original three-minute replay target as an upper
bound. Consecutive quiet T01 receipts use approximately 1.05-second local beats;
travel may extend a beat so BOK follows the actual route rather than teleporting.
Purposeful actions retain approximately 2.9 seconds, and incident/death receipts
retain at least 3.4 seconds. Every receipt, snapshot and phase boundary remains
present and individually seekable. Repeated quiet lines are held without flashing
or success sparkles; quiet movement, breathing, preening and looking grant no
benefit and make no inference calls. The canonical ambient-v1 target comes from
the recorded receipt, not a second renderer decision.

The first real saved day had 50 quiet receipts and 12 Jev decisions. Its adaptive
presentation schedule is approximately 92 seconds, retaining all 60 receipts,
ten purposeful activities and the final walk/tuck into bed. This changes only
viewing time, not the saved day or that earlier packet's choices.

Long quiet routes over 180 world pixels use a short travel montage: the visible
24-pixel exit and 40-pixel entrance move at 80 world pixels/second, the middle of
the same route passes beneath a brief navy fade, and the camera changes rooms
only while covered. Short routes, purposeful actions and incidents retain
continuous camera follow. This avoids repeated rapid whole-house camera pans
without changing a destination or introducing an extra choice. A stable
30-second before/after review used the actual saved second-day packet; both
completed without page errors or API writes. The final first-day schedule is
approximately 91 seconds after this refinement; the earlier full viewing run
measured 93.423 seconds before montage timing.

## Persistent home identity

The canonical birth seed now selects a stable cosmetic house identity. It varies
wood grain/tone within the approved honeywood range, moss rug weave, garden
texture, framed pictures, restrained plant tints/size, book/lamp details and blue
blanket stitching. Room geometry, fixture anchors, collision, supplies and
biological rules remain the same.

Changing the selected rooster refreshes one reused floor canvas and selects from
four bounded decor variants; it does not cache a new background texture per NFT.
The previous rooster's animation textures are removed. An A→B→A renderer check
confirmed different floor hashes for A/B, identical floor/decor identity on A's
return, and one resident rooster texture in each saved-bedroom sample. That
identity follows the seed after transfer or reload, independently of the owner.

## Deep world/replay review

The 2026-11-01 follow-up reviewed82 controlled variants, conditions and phases
across all35 action families, beside the approved VR01 reference. Controlled
starting states use canonical legal-candidate/action results, not invented Jev
choices. Real-packet evidence uses token1 saved days1/2 from the read-only replay
source. The table counts saved occurrences, not necessarily paid model calls.

| Family | Saved day1 | Saved day2 | Controlled cases |
| --- | ---: | ---: | ---: |
| K01 | 2 | 0 | 3 |
| K02 | 0 | 0 | 1 |
| K03 | 0 | 0 | 2 |
| K04 | 0 | 0 | 1 |
| K05 | 0 | 0 | 1 |
| K06 | 0 | 0 | 1 |
| K07 | 0 | 0 | 1 |
| H01 | 4 | 2 | 4 |
| H02 | 0 | 0 | 3 |
| H03 | 2 | 2 | 1 |
| H04 | 2 | 2 | 3 |
| H05 | 0 | 0 | 1 |
| H06 | 0 | 0 | 1 |
| H07 | 0 | 0 | 2 |
| H08 | 0 | 0 | 3 |
| H09 | 0 | 0 | 2 |
| H10 | 0 | 0 | 2 |
| H11 | 0 | 0 | 1 |
| H12 | 0 | 0 | 1 |
| H13 | 0 | 0 | 2 |
| H14 | 0 | 0 | 1 |
| H15 | 0 | 0 | 1 |
| H16 | 0 | 0 | 2 |
| H17 | 0 | 0 | 1 |
| H18 | 0 | 0 | 5 |
| H19 | 0 | 0 | 3 |
| G01 | 0 | 1 | 2 |
| G02 | 0 | 0 | 2 |
| G03 | 0 | 1 | 1 |
| G04 | 0 | 0 | 1 |
| G05 | 0 | 0 | 2 |
| G06 | 0 | 1 | 2 |
| G07 | 0 | 0 | 1 |
| H20 | 0 | 0 | 2 |
| T01 | 50 | 51 | 20 |

The material fixes were: recorded visitor/plot-aware approaches, readable finished
meal/harvest props, side-on garden work and visible soil changes, rain protection
framed with its window, low backup burner glow distinct from a dangerous fire,
neutral plot labels, larger object hit areas, crop taps through a translucent
shelter, feedback at the moved object, terminal pose on seek, and caption-key
reconciliation after historical seek/resume. Temporary meal/fruit/flower props
are original pixel art in `src/art/action-props.ts`; they create no catalogue unit
or additional reward.

The same30-second actual-day2 segment improved from16.0% fully covered/24.8%
dimmed to5.12%/11.09%, with identical recorded targets/outcomes and80-world-pixel
visible entry/exit speed. Long quiet cuts now cover the route middle for80ms
instead of300ms; the full fade lasts280ms instead of630ms. World viewing time is
presentation only.

All final contact/impact frames advance the real Phaser renderer. Paused
seek/inspect captures explicitly complete a WebGL frame: an early seek image was
stale despite updated actor fields and was rejected and replaced. The corrected
frame visibly lies head-left/feet-right. A20-second pause preserved the world
clock, actor, playback position and save; skip completed once. Actual saved day1
seek2/resume3 correctly changed the caption from water back to toast.

Saved sleeping homes now use a blue room grade with a lighter shade, warm lamp
and readable actor, matching the approved night bedroom more closely. Day-zero
reveal stays light; explicit bright mode remains supported. Recorded phases
control replay lighting rather than the current wall clock.

This is world/art evidence, not a claim that every application screen, owner
recovery, wallet transport, real phone browser or model balance passed. Condition
marks supplement the host HUD/status; exact deadlines remain there. A long
harmless-rain animation after an already-resolved episode and all rare
headgear/phone combinations remain unverified. The fourteen coverage sheets and
curated before/after frames are retained in the permanent gallery linked above.
The detailed scratch ledger, raw captures and motion clips in
`TEMP/build/world/audit2` may be deleted without affecting this record, the
gallery, source, assets or builds.

The furniture preloader uses `src/art/asset-urls.ts`, a generated registry with
twelve-character SHA-256 query versions derived from the shipping PNG bytes.
The optional furniture exporter regenerates this registry alongside the manifest.
This invalidates an earlier browser-cached bare PNG URL when art changes, without
regenerating pixels or relying on a temporary build file. All nine versioned
asset requests returned200 in the browser after the change; TypeScript passes.

An independent UI/player-comprehension hat reviewed eight individual revised
contact/outcome/death/night frames against VR01 and reported no world freeze
hold. That reviewer confirmed visitor placement, weather context, visible garden
results, meal/harvest props, a visibly fallen terminal pose and readable blue
night lighting. The reviewer assessed still frames; motion percentages above are
the renderer owner's recorded evidence, not an independent video verdict.

The final input review reproduced a stable320px menu tap reaching the world
behind the menu. The renderer now exposes a synchronous input gate and accepts
object taps only when the native event originates on its own canvas; the host
also gates modal entry. Actual mouse and touch matrices verified disabled world
input, DOM-only clicks, and a positive chair tap with menus closed. Independent
stable-app runs followed history → Built chair → Resume → Pause → needs → Back
→ Options → How to play: Help opened, and a later canvas tap still opened the
chair. These read-only proofs reported no page errors or API writes.

Seeking during the delivery prelude now explicitly enters receipt playback, so
Resume cannot restart a stale mailbox route. First- and later-receipt seeks,
repeated seeks and skip retained their exact recorded inventories, with no
additional delivery units. A final completed-frame caption check also confirmed
and fixed a context leak: a new NPC's first day could inherit the previous
film's death caption until its first impact. A first-receipt start now clears
that caption; a later start uses this packet's previous recorded receipt.
The delivery introduction and historical water → toast seek/resume remain
correct. Before/after frames and the bounded event record are temporary audit
artifacts; TypeScript passes after these changes.

Replay start now emits its initial recorded approach snapshot immediately,
including during delivery. This fixes the previous host HUD/status retaining
another saved day's values for the3.5-second prelude. An actual saved Day3 →
Day2 completed-frame check now displays Day2/LV01 immediately and emits one
initial snapshot; first-day and later-receipt starts also emit one. The recorded
water/bread/rose-seed delivery remains present exactly once, unchanged through
the prelude. No game state is recalculated or delivery applied by this callback.


The subsequent [gameplay and animation critique](GAMEPLAY_REVIEW.md) records the calm115px/s gait, actor1.45, first/last editing of unchanged quiet spans, literal outcome cues, historical restart and final portrait recap. Its [permanent motion gallery](gameplay-review/index.html) includes matched390px frames and twelve-second before/after clips. Original receipts and exact seeking remain unchanged.
