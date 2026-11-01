# Game art sources

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
