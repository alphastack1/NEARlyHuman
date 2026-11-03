# A clearer first rooster, a clearer daily loop

This refinement responds to the owner's first-hand report that the example, hatching, next day and menus felt confusing, and the pixel art looked uneven. Three specialists reviewed the player journey, pixel rendering and cold-player experience. PM integrated the changes, inspected the actual phone views and sent the concrete remaining issues back through a second repair/review pass.

The [complete action map and genre research](JOURNEY.md) covers entry, adoption, the first post, new versus returning days, public links, history, belongings, purse, wallet selection and payment recovery. Primary Bandai and Nintendo manuals informed the design; their common emphasis on meeting/naming a pet, returning home and consistent cancellation is adapted to this game's asynchronous onchain day rather than copied as a real-time aging mechanic.

## What changed

- **One first action.** START reaches an adoption card with Hatch a rooster as the main choice. The mature example's HUD is absent. Watch example and Your roosters remain secondary.
- **A small commitment to watch.** The optional example plays a contiguous excerpt from an actual saved day at 2× presentation speed. It stops after the main project or 28 active seconds, whichever comes first, and always has Hatch your own and Back. An uninterrupted independent run returned after 23.456 seconds. A normal owned day retains its ordinary pace and has an explicit Finish day action.
- **Attachment before configuration.** PIP is an actual editable name, not a misleading placeholder. The hatch action is usable immediately. Personality and alternate payment options expand on demand; the current price stays visible.
- **Different treatment for new and familiar days.** A freshly completed funded day offers Watch day first. A returning owner reaches the saved needs/level with Prepare tomorrow primary and Watch day N secondary. Finishing a film reveals the saved result; it never advances the chain or buys inference.
- **A menu with a home.** A current-rooster card anchors four local tools, with account/new-rooster actions below. Nested sheets return to their actual parent. An explicit day selection preserves its replay intent, even when it is the latest day. Writing a shareable URL no longer invents an original exact-link Back route.
- **Direct parcel swaps.** Select one visible parcel slot, then tap any supply to replace it. Previously, a full default parcel made most choices appear unavailable. Seed replacement still permits at most one productive starter; no fourth item is introduced. Closing preparation preserves the selection.
- **A uniform world grid.** Integer canvas magnification, camera scroll and native sprite coordinates replace compounded fractional scaling. The first crisp result made the pet too small, so a larger silhouette was authored on the native grid, keeping seeded identity and pose animation. UI item art/icons also use native-size multiples where practical. Responsive DOM text is not claimed to be pixel-perfect at every browser zoom.

## Short experiment record

| Question | Evidence | Change and result |
| --- | --- | --- |
| Can a newcomer find adoption without watching a stranger's long day? | Actual cold live START led to MISO Day28 and Watch day. | Explicit adoption entry; optional bounded example, visible Back and natural return verified. |
| Is the first hatch action obvious and usable? | The old placeholder looked prefilled while the action was disabled. | Editable valid PIP suggestion, collapsed advanced choices and visible price; cancellation preserves a changed name. |
| Does preparing another day require replaying yesterday? | Returning owner could not reach preparation before replay. | Saved-home and freshly-ready contexts separated; both transitions independently exercised with actual saved films and controlled read responses. |
| Do menus return where the player expects? | A single return variable lost nested parents; a self-written URL invented public-link context. | Explicit overlay stack and stable entry query; profile/history/menu, wallet cancel and latest-day replay branches pass. |
| Do the pixels actually align? | A 390px viewport previously used 256 backing pixels plus 1.22 camera zoom and 1.4 sprite scaling. | Integer 2× phone/3× large-screen grid. In 33,775 sampled static world blocks, unequal inside-block neighbors fell to zero. Larger authored pet independently approved. |
| Does the new grid preserve interaction? | Renderer review found the enlarged transparent actor frame could cover a bed tap. | Alpha-based hit testing lets that same tap reach the bed. Nine actual pet/object/drag cases pass at 390, odd 391 and 1100 widths; see [input evidence](pixels/interaction.json). |

## Verification and evidence

[Independent critique](CRITIQUE.md) records the observed problems, official references, repairs and follow-up. Its owner checks use actual SUNNY data with a controlled owner address; the fresh-ready transition uses a controlled GET response. Neither is presented as a new paid transaction. The uniquely named cancellation provider rejects before signing. All application writes were blocked in those presentation probes.

[PM phone review](pm/review.json) covers 13 views at 320, 390 and 430 widths, a short 320×360 hatch surface and desktop menu. It recorded zero application JavaScript errors, application writes or horizontal overflow. Finite entrance animations were fast-forwarded for settled layout captures; the independent example timing and motion checks were observed separately. The short surface approximates available keyboard height, not a physical keyboard test.

- [Entry](pm/entry-320.png), [hatch](pm/hatch-320.png) and [short hatch](pm/hatch-short-320.png).
- [Optional example with exit](pm/example-390.png), [menu](pm/menu-390.png) and [parcel](pm/care-320.png).
- [Newly saved day](images/fresh-day-watch-390.png), [finished day](images/fresh-day-complete-390.png) and [returning home](images/returning-owner-home-390.png).
- [Pixel comparison, viewport metrics and authored character](PIXELS.md).
- [Stable entry / explicit latest-day proof](entry-intent-proof.json).

Application type checking and the production-flag Vite build pass. Compiled public checks use the actual built assets and public APIs, without development previews. No contract, accepted-day rule, inference policy, financial store, allocation or key was changed in this refinement. QA incurred no new inference calls or chain transactions. Temporary tools, caches and build outputs remain in ignored TEMP and are not application dependencies. Publication is performed once after the final review; its actual hosted outcome is recorded separately.

One intermediate compiled pass received a transient public configuration read failure and displayed the existing Try again action. Follow-up direct and proxied reads returned200; the final compiled public pass completed without that failure. The read was not retried as a payment, no financial state was changed, and a persistent service outage is not claimed. The final source also fixes same-life retry for an exact public link. The [compiled public report](built/public-smoke.json) records the successful final build pass.
