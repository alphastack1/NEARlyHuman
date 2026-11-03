# Player feedback: physical continuity and readable routines

Verified locally on 3 November 2026 using the Codex Browser profile, a GET-only preview of the release source, and public saved Robinhood testnet days. No wallet transaction, AI call or game write was needed for these playback checks.

## Question, evidence, change, result

| Question | Evidence | Change | Result and decision |
| --- | --- | --- | --- |
| Can the rooster cross a visible wall? | The living-room right wall occupies pixels 224–231, while the old navigation treated that boundary as connector floor. Some painted doors also failed to clear the full wall depth. | Share actual wall and door geometry between house rendering and navigation; validate the ground-foot strip along returned path segments, including exact contact endpoints. Clear real doorways after workshop scenery paint. | All 1,200 contact pairs across absent, original and moved-chair configurations are reachable without wall intersections. The actual user day also has zero sampled ground-foot wall overlaps. Keep one geometry source. |
| Does a breather look like sitting? | The previous actor remained at the floor contact in front of the armchair. | Move the untouched canonical sprite onto the seat, then ease down before walking. Quiet interludes retain the seated context. | Actual NFT #4 Day 1 places the actor's foot at (80,327), above the route contact (88,345), and returns to the ground before planting. Keep the original generator and poses. |
| Where did the parcel go? | Pickup presentation carried one box back to the fridge regardless of its contents; replay seeking also inferred that extra commute. | Open the parcel at the mailbox. Fan out the actual inventory additions with small sparkles, then use the canonical stocked inventory. Remove the invented fridge commute from playback and seek reconstruction. | The user's actual saved parcel reveals water, a toolkit and a blueberry seed. No held box or extra fridge detour. |
| Can stock be understood without repeatedly opening a menu? | Nearby supplies had no compact visual readout. Peer critique caught that hiding empty lists would conceal the most useful case. | Show nearby native item icons and small counts for pantry, workshop, plots and well. Empty pantry/workshop retain one honest zero-count chip. | Real crafting displays wood changing into the finished toy boat. Controlled zero-stock render fixtures show bread 0 and wood 0 instead of disappearing. Keep the chips contextual. |
| Does Watch day feel like morning? | The waiting scene was already bright. | Dim the waiting home and ease daylight in over 2.4 seconds when playback begins. Seeking and finishing show the correct saved time rather than restarting dawn. | Actual pre-Watch night alpha is 0.26; the mailbox scene is brighter. Pausing freezes the film clock and the lighting transition. |
| Does crafting use sensible art and contacts? | The hammer head read as skewed; watching makes small contact errors conspicuous. | Flatten the native hammer head. Preserve the existing bench workpiece and completed-object staging. | MISO's actual saved Day 19 pauses cleanly with the original repair pose and hammer, reveals its toy boat, then leaves that boat visibly on the bench. |

## Actual normal-speed full day

Watched the owner's real **NFT #4 Day 1** from Visit home → Watch day through natural completion at **1× speed**, with no pause, seek, finish action, or renderer setter during playback.

- Elapsed wall time: **62.858 seconds**. This is an observed duration, not a claim of improvement against a different NFT's day.
- All **60 canonical receipts** retained. The exact parsed packet object handed to the application was serialized before and after playback: packet and result hashes were unchanged.
- Final actual renderer state equals the saved canonical result.
- **626 read-only samples**, zero hidden-tab samples, zero browser errors, zero application writes.
- Zero sampled ground-foot overlaps with a house wall, excluding the intentional climb into the bed. No move exceeds the renderer's defined maximum walk speed when measured against its simulation clock.
- Saved request: `0x6cefa5c5dc05010994d46375afc49115cdae35ec1a0683c37413201e56edb64d`.
- Saved commitment: `0xeb1ca4b0759012a48f276dde3b6019357d099a657c9c547b02f32f9e38e4af4e`.

The subsequent empty-stock fallback affects only contextual display. Its two zero-count cases were checked separately; repeating the complete film would not answer a new route or timing question. The first focused MISO run was interrupted by an intentional source update in a separate UI task; the completed run after source freeze passed. That interruption was not treated as a player failure.

## Pixel review and independent critique

Reviewed actual 390×844 renders against `design/references/VR-01-approved-house-and-care.png` and the doorway/camera guide. The current scenes retain the top-down cutaway house, warm wood, restricted navy/cream controls, native pixel items and uncluttered playfield. The independent journey/UI reviewer accepted the chair and garden contact shots and identified the empty-stock improvement above. This is a visual-direction comparison, not a claim that the generated mockup is an executable pixel specification.

The original procedural rooster sources are unchanged:

- `src/art/rooster.ts`: `77394d48de4e07c9bbeb2734c7fd5bb2e6c16789032eec957cfd22eaea793f54`
- `src/art/rooster-data.ts`: `bf21c7a5f5d58bb4718b6258a60710a01cc08b1573b6dce3899292d53fe38907`

Verified captures are in [world/](world/). Compact evidence is in [normal-day-evidence.json](world/normal-day-evidence.json) and [focused-evidence.json](world/focused-evidence.json). Full samples and exploratory tooling remain disposable in ignored `TEMP/player-feedback/world/`; permanent source and build processes do not depend on them.

These checks prove local release-source playback and focused presentation behavior. Hosted post-release checks are recorded separately by the PM; this document does not claim a new funded day or a mainnet deployment.
