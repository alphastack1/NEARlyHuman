# Original rooster, livelier home

The owner explicitly protected the procedural NFT rooster artwork. The prior V2-only authored silhouette has therefore been removed from production and archived under ignored TEMP. The renderer again calls the existing `src/art/rooster.ts` generator directly, uses its 32×40 frame and original foot anchor, and keeps its scale at one native world pixel. The shared generator, palette, traits, accessories and pose data were not edited.

## Exact identity check

[The actual renderer comparison](world/identity.json) reads the loaded texture canvases for MISO, PEEP and SUNNY, using their actual public saved seeds. Each of 18 poses is compared byte-for-byte with a freshly generated canonical `roosterCanvas` for that same seed and pose. All **54 textures match**, with zero unequal RGBA bytes. The actor retains native 1× scale, no color tint and its alpha-based hit test.

The two protected source files also retain their exact pre-pass SHA-256 values:

| Protected file | SHA-256 |
| --- | --- |
| `src/art/rooster.ts` | `77394d48de4e07c9bbeb2734c7fd5bb2e6c16789032eec957cfd22eaea793f54` |
| `src/art/rooster-data.ts` | `bf21c7a5f5d58bb4718b6258a60710a01cc08b1573b6dce3899292d53fe38907` |

This proves source/texture identity, not that normal facing flips, pose animation or the existing day/night illumination are disabled. No replacement silhouette, resampling, new accessory or actor tint is used.

## Small environmental changes

The art direction remains warm timber, cream, moss, navy and a blue bed. Local accents give the rooms and yard a little more color:

- A teal bedroom rug, rust living-room rug and blue-green washroom textile distinguish the rooms without changing their layout or collision routes.
- The bedroom gets a coral flower picture, a warmer lamp shade and a small blue shelf book. Decorative initial options now survive later state refreshes; a review caught that the old fixture updater discarded those options.
- Houseplant greenery is slightly richer. Only a copy of each scenery texture is changed; the loaded asset and rooster textures are outside this operation.
- Grass, flowers, laundry, well water and the mailbox receive restrained green, coral, lavender, lemon and turquoise accents. The four productive beds remain the only productive beds; decorative border flowers grant no items.
- Window light is drawn on the floor below actors and furniture. A butterfly, leaf tips and cloth hems have small native-pixel motion. These effects never advance needs, growth, inventory or a random decision.

The original rooster now looks smaller than the rejected authored version because its actual shape is restored. Size was not compensated by distorting its pixels. Continuous routes, the integer viewport/camera grid and opaque-pixel hit testing remain in place. Held tools/food use the original character's lower contact height again.

## Actual visual review

[Before capture record](world/before-captures.json) and [after capture record](world/after-captures.json) used the actual local source and public MISO #1 film state. The camera was moved with normal pointer drags; no simulation setter, wallet, quote, inference or chain transaction was used. The five exploration views cover the bedroom, kitchen, workshop, yard and a 1100×900 wide view. The final pass also watched the beginning of the actual film at 390×844 to inspect the restored character in motion.

- [Bedroom before](world/before-bedroom.png) / [bedroom after](world/after-bedroom.png).
- [Yard before](world/before-yard.png) / [yard after](world/after-yard.png).
- [Kitchen](world/after-kitchen.png), [workshop](world/after-workshop.png), [wide home](world/after-wide.png) and [original rooster walking](world/after-moving.png).

Both capture passes recorded zero application JavaScript errors and zero non-GET application requests. The full application type check passes after the integrated audio typing repair. Finite CSS entrances were settled for screenshots; world motion was separately observed during the actual film. Root owns the concurrent UI/audio review and final integration/build gate.

## Short experiment record

| Question | Evidence | Change | Result / decision |
| --- | --- | --- | --- |
| Did the in-game pet drift from its NFT artwork? | V2 imported an authored alternate body/frame. | Restore the canonical generator and frame; remove the replacement helper. | 54 actual texture comparisons match exactly; protected source hashes unchanged. Keep canonical art fixed. |
| Can the world feel more alive without a global saturation filter? | Green rugs repeated through most rooms; yard details and water were muted. | Selective complementary textiles, brighter small scenery accents and native-pixel background motion. | Actual phone/wide views remain restrained and coherent; no actor tint or game fact changed. |
| Do decorative choices persist through a saved day? | The fixture updater rebuilt every texture with empty options. | Retain the fixture's initial decorative options while applying actual damage/bracing state. | Flower picture/book color persists through replay state refreshes. Keep the authoritative condition fields unchanged. |

## Final produce-icon refinement

PM's actual 320px belongings capture showed that Strawberry and Apple were nearly identical red blocks. The final art-only repair gives items22–29 their own native20×20 silhouettes:

- Daisy has separated cream petals and a gold center; Marigold is a dense orange-gold head; Lavender is three upright purple spikes; Rose is a coral spiral bud.
- Strawberry is a seeded, tapering heart; Apple is broad with a top cleft, stem and leaf; Blueberry is a blue berry cluster; Grape is a vertical purple bunch with a vine leaf.

The [actual native2× contact sheet](world/produce-native2x.png) uses the same `itemArt` canvases as the game at exactly40CSS pixels. Its labels/tiles are a review surface only. [Before stock](world/produce-before-stock-320.png), [actual stock at320](world/produce-stock-320.png) and [actual stock at390](world/produce-stock-390.png) make the Strawberry/Apple distinction visible with MISO's unchanged quantities. [The focused report](world/produce-review.json) records zero application errors, writes and horizontal overflow.

No rooster art, seed packet, wood/craft icon, inventory quantity or rule changed. The full application type check passes. MISO's latest saved day contains no fruit-use receipt, so this refinement does not claim a held-fruit playback test or fabricate an eating action.
