# NEARlyHuman cartridge-game openings — current direction

The owner clarified that this is a **retro Game Boy / Sega-style game opening**, all part of the game. Every board shows one continuous sequence: the first visible opening animation → its title screen → the start of play. All three stages use the existing game's pixel-art treatment. The earlier website-surround and hand-drawn cartoon interpretations are superseded.

**Direction03 is selected and implemented.** See the [actual-build gallery](../../../docs/opening-review/index.html) and [critique/fix review](../../../docs/CARTRIDGE_OPENING_REVIEW.md). The implementation reuses the live room's actual assets, rather than displaying a generated board as the game.

Open the [four-board comparison](index.html).

| Board | First visible image | Transformation/title | Game starts |
| --- | --- | --- | --- |
| [01 · Rise and Shine](01-rise-and-shine.png) | Pixel sunrise over the NPC's house. | Light reveals the title as the same roof breaks into square pixels. | Camera moves into that same house; roof/title clear and the HUD appears. |
| [02 · Special Delivery](02-special-delivery.png) | A small pixel supply box lands on the kitchen floor. | It opens; the title and familiar item icons pop into place over that same floor. | Camera pulls back into the room and the flourish settles into play. |
| [03 · The House Wakes Up](03-the-house-wakes-up.png) | Familiar room tiles and furniture assemble with pixel dust. | The title appears over the same room, with START. | Title particles clear and the room becomes the playable view. |
| [04 · Pixel Rush](04-pixel-rush.png) | A diagonal wave of room tiles accompanies the rooster sprite. | Tiles form the title while revealing more of the same kitchen. | The remaining wipe completes and title clears into the game's interface. |

## Direction to preserve

- Same GBA/16-bit pixel art, stepped outlines, furniture, sprite treatment and world throughout the opening, title and play. No hand-drawn/cel illustration or change of medium during the handoff.
- The frames describe a transformation over time, not unrelated scenes. Carry camera anchors, floorboards, furniture and the NPC through the sequence. Exact placement and sprite scale in generated boards are approximate.
- The title screen belongs to the game. START leads into the game experience; it is not a wallet, transaction or account gate.
- The final view is the game itself. No CRT, decorative window, illustrated website frame, mascot footer or external logo masthead.
- Preserve the game's existing warm interior art. Color freedom can support a cohesive game-native title sequence; it does not require a different art style.
- Fixed browser-height experience, mobile first. Scale/crop the real game camera with the available viewport; don't stretch its square source art to copy these generated mockups. The house/HUD layout here guides future implementation rather than documenting a renderer change already made.
- Brief animation, immediately skippable. Let real initialization run concurrently and avoid delaying ready gameplay. Tile wipes, sprite motion, opacity and camera movement can reuse the actual assets; these still images establish neither animation duration nor measured load performance.
- Intro particles, supply icons and roof removal are presentation. They do not grant supplies, mint an NPC or change its saved life.

All four concepts were generated with the built-in image tool. The actual generation prompts are in [prompts.json](prompts.json). The first completed all-pixel board,03, supplied a style/continuity reference for the other three. Permanent assets are copied here; they do not depend on the scratch folder. The later implementation and its publication record are documented in the review linked above.
