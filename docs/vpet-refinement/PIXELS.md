# Pixel rendering refinement

The user identified uneven, soft-looking pixel art and supplied a reference about integer scaling. The actual renderer had nearest sampling enabled, but two later transformations defeated a consistent pixel grid: a fractional browser fit scale, followed by a 1.22 camera zoom. At a 390px phone width, the 256px backing canvas was stretched by 1.5234375, so each world pixel occupied about 1.8586 CSS pixels. The actor, bed and carried objects added their own 1.4, 1.2, 1.1 or 0.78 multipliers.

The renderer now uses one world pixel grid with a 1x camera. A phone shows a variable-size native viewport at exactly 2 CSS pixels per world pixel; a stage at least 960px wide uses 3. Odd dimensions receive at most two spare edge pixels, cropped by the world host. There is no whole-screen stretch or phone letterbox. The camera rounds its scroll origin, including odd-sized logical viewports. Nearest texture sampling and WebGL antialiasing settings are explicit.

Sprites, beds, blankets and held objects render at native size. Odd-width fixtures receive an integer top-left origin. Contact shadows use hard-edged pixel textures, and inspection marks use integer rectangular brackets. Ambient effects retain their existing rounded world-pixel placement. No model choice, map route, care rule, inventory outcome or economic transition changed.

PM and the independent reviewer found the first native-grid rooster too small. The second pass authors a fuller V2 body at the same one-pixel pitch, rather than stretching the original image. Its occupied height is about 27 native pixels, or 54 CSS pixels on a phone. The original seeded trait palette, face and headgear remain; a native tail/breast, planted wing, reaching/food/garden poses and foot shuffle provide the larger silhouette. The foot anchor remains at the same route location, and held food rises to meet the taller face. The shared NFT portrait generator is unchanged.

The film controller also exposes a presentation-only playback rate clamped from 1 to 2 for PM's short optional example. It changes active film travel/contact/work time together; normal days default to 1. Ambient time and authoritative receipts remain unchanged.

## Actual evidence

One owned tab in the persistent Codex Browser profile loaded actual public NFT1/Day28 through the local GET-only host. No wallet, quote, inference, signature or chain write was used. The tab was closed after capture; the shared profile was preserved.

| Viewport | Backing canvas | Display canvas | Scale | Horizontal overflow |
| --- | --- | --- | --- | --- |
| 320×568 | 160×284 | 320×568 | 2× | None |
| 390×844 | 195×422 | 390×844 | 2× | None |
| 391×844 | 196×422 | 392×844, 1px cropped | 2× | None |
| 430×932 | 215×466 | 430×932 | 2× | None |
| 1100×900 | 367×300 | 1101×900, 1px cropped | 3× | None |

[Viewport metrics](pixels/viewports.json) recorded zero application JavaScript errors. Actual motion shows the rooster leave the bed and walk across the room without a position jump. PM owns the parallel flow and UI changes visible in these captures.

The screenshot check compared 33,775 static 2×2 CSS blocks outside the DOM HUD/dock. Before, 2,994 horizontal and 7,691 vertical pairs differed inside those blocks; afterward both counts are **zero**. This confirms an actual uniform world grid, beyond simply checking a nearest-filter flag. See [pixel evidence](pixels/grid-evidence.json).

- [Before, 390px](pixels/before-home-390.png) and [after, 390px](pixels/after-home-390.png).
- [Actual walking, 390px](pixels/after-motion-390.png).
- [Narrow phone](pixels/after-home-320.png) and [desktop](pixels/after-home-1100.png).

The first native-grid pass reduced the pet too far; the authored-body refinement restores its visual weight while keeping one-pixel contours. DOM text remains responsive and is not claimed to share the same raster grid at every browser zoom or magnification. The full application TypeScript check passes after the renderer and playback-rate changes.

## Input alignment follow-up

PM requested one final check that the scale rewrite had not displaced actual canvas taps or dragging. The initial bed-center tap revealed an object-overlap issue: the larger rooster's transparent image rectangle swallowed a visible blanket tap. Its input now tests actual nontransparent pixels, allowing that same blanket coordinate through to the bed while keeping the visible pet responsive.

[Nine focused actual interaction cases](pixels/interaction.json) pass: the exact repaired bed tap, panning to and inspecting the workshop, panning to and inspecting the Apple bed, bed inspection at odd 391px width, bed and stove inspection at desktop 3×, and a visible awake-pet tap that triggers the perk pose. The two drag gestures did not create an unwanted inspection. The script uses real CSS mouse events, observes the resulting actual selected object and DOM card, and reads camera coordinates only to locate visible world subjects. It calls no renderer method or state setter. The case run recorded zero application errors and zero non-GET application API requests, then closed its owned tab. No quote, signature, inference or transaction occurred.

The first pet-attention probe tapped during the initial sleeping beat: the attention event fired, but the sleep pose correctly remained. The final probe waits for the rooster to wake and pauses playback before tapping; it verifies the actual `perk` texture, rather than trying to assert an awake pose while the pet is asleep.

- [Bed through transparent rooster margin](pixels/interaction-bed-390.png).
- [Workshop after panning](pixels/interaction-workshop-390.png) and [Apple bed after panning](pixels/interaction-garden-390.png).
- [Awake rooster responding](pixels/interaction-pet-390.png) and [desktop stove](pixels/interaction-stove-desktop3x.png).

## Sources

The implementation was checked against the installed Phaser 3.90 ScaleManager source and its [official scale-manager documentation](https://docs.phaser.io/phaser/concepts/scale-manager), which distinguishes resizing a NONE-mode canvas from fitting it to a parent. [Phaser's camera guide](https://phaser.io/oss/docs/phaser/concepts/cameras) documents whole-pixel camera rounding. The installed version's implementation was used for the actual API details because the current camera guide displays Phaser 4.
