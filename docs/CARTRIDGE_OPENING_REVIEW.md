# The House Wakes Up — 2 November 2026

The owner asked for an opening like a Game Boy/Sega cartridge: animation → title → game, with the same pixel-art treatment throughout. Direction03 was selected because the real room can carry all three stages. Earlier illustrated website-surround concepts are superseded.

The [actual-build gallery](opening-review/index.html) contains18 captures, a motion recording and the focused verification records. The [chosen storyboard](../design/mockups/cartridge-openings/03-the-house-wakes-up.png) remains the visual reference. Finished assets and build processes do not depend on the scratch folder.

## Result

The existing floor and furniture assemble in a short native animation. A pixel house wordmark and START hold over that same room; Start clears the title and brings in the actual recorded PEEP day. The nominal assembly clock is900ms, followed by a voluntary title hold and a420ms exit. Skip works during assembly. Intro clocks never advance biological state, consume inventory, choose actions or spend inference credits.

The real house now fills the visible browser rather than sitting as a square in a cream page. The canvas follows the host aspect; its camera uses measured HUD/dock coverage. Portrait screens keep controls at the bottom, short landscape screens move the action dock to the side, and the world remains visible behind the interface. Mint, care, inspection and saved-day panels retain their existing behavior.

The first view does not wait for configuration/RPC or the preview request. An eager command runs before the first native draw, resolving the genuine preview approach if available or its verified cosmetic PEEP identity otherwise. Only the actual saved packet supplies gameplay facts. Both guest-start paths remain gated while the opening is active, so a film cannot advance unseen behind its title.

Returning players can bypass the opening. Options → Title screen and `?intro=1` provide explicit entry. Valid pending-submission markers and rooster deep links retain priority. Finishing removes only the intro parameter, preserving other query/hash context. This feature adds no wallet or payment gate.

## Waves and actual corrections

Parallel owners built the renderer and React integration while PM handled the fullscreen layout. Independent browser, integration-source and performance reviewers then challenged the results. These were concrete findings, rather than changes made to satisfy a test framework:

| Finding / evidence | Correction | Focused result |
| --- | --- | --- |
| Fixed-square internals could not safely fill a tall browser. Full-map bounds kept entry/garden actors behind bottom controls. | Dynamic logical dimensions, uniform scale, physical UI insets and camera clamping over the unobstructed region; native wall tiles continue under covered edges. | Native target/view witnesses and actual room inspection keep the intended world and actor visible. Map, routes and collision rules are unchanged. |
| An early Skip could reveal a title the player had skipped. | Retain whether the title was actually reached before animating it out. | Early Skip keeps title hidden, finishes once and enters the existing guest path. |
| A closed-entry saved-view effect could call `showSave(undefined)` between the opening and the film, replacing the real room with demo state. | Only push a real saved state. | [Handoff trace](opening-review/proofs/handoff.json): no intervening default save, one playback start and retained horizontal camera composition. Paid Ready's prior RAF guard remains intact. |
| At844×390, stacked controls left little useful world. A safe foot coordinate could still hide headgear. | Side dock, four physical insets and conservative whole-sprite following. | Actual Follow and native full-texture bounds fit the measured usable rectangle. |
| Writing dock height after reading event position could leave a stale inset when the dock grew. Position changes alone need not notify ResizeObserver. | Publish HUD/dock sizes first, then read fresh positions. | [Same-node growth witness](opening-review/proofs/layout.json): event top343→251, native bottom inset225→317, exactly matching the resulting position. |
| A128px logical-height minimum stretched1920×400 and made pointer scaling inconsistent. | Preserve host aspect down to1px logical height. | [Native geometry witness](opening-review/proofs/native-first-draw.json):480×100 canvas, uniform4× scaling and correct fridge inspection. |
| Transparent texture padding could make a whole-sprite fit impossible even when the visible NPC had room. Actual1920×400 capture clipped the face. | Use cached alpha bounds only in that infeasible case; normal conservative framing stays. | [Alpha witness](opening-review/proofs/native-alpha-bounds.json): visible bounds101.2–228.8px fit the85–292px band. Normal844px behavior is unchanged; repeated calls scan the frame once. |
| A delayed preview exposed sleeping demo BOK for at least554ms before switching to the intended PEEP kitchen. This was visible in compositor frames. | Queue native opening before its first draw; initialize the internal default before flushing external commands; remove the preview wait. | First-draw/early-skip witnesses start with awake PEEP. The separately captured delayed-preview regression starts with PEEP's assembly instead of the bedroom. |
| A trusted cold START click stalled while creating the first AudioContext:197.4ms inside the native constructor. | Prepare an unconnected context during boot, honor mute, and resume/play only after user activation. Ambient tones do not queue while suspended. | Final compiled input checks contain no Start constructor or long task. The cost moved into startup; it was not eliminated. |
| Curating final responsive screenshots found a paused-resize variant: resize used old insets, then fresh insets arrived without another paused follow tick. | Apply the fresh geometry immediately for a paused/noninteractive view. Active camera movement still eases normally. | Final62asVBDm screenshots follow the same paused film through320×568,844×390,1440×900 and1920×400; the visible NPC remains in view. |

The last paused-resize change was verified against that specific uncertainty. It did not justify repeating the unrelated network/CPU matrix or payment tests.

## Motion, input and startup

The6.6-second [motion recording](opening-review/motion/opening.webm) captures the actual compiled D7 App on the natural browser clock: assembly, held title, Start and genuine recorded milk activity. It is a silent compositor capture, not a pre-rendered intro delivered to players. Performance measurements were taken separately because recording can affect timing. The final62 build adds the paused-resize refresh outside the clip's path.

Final measured active startup/input snapshot: `index-D7L9ExCi.js`, CSS `index-BdosObvX.css`. The published candidate is `index-62asVBDm.js`; its subsequent change only refreshes paused geometry. The [release manifest](opening-review/proofs/release-manifest.json) records both identities and current asset hashes.

| Cold Chrome case | Title phase | Trusted click event → leaving | Start → film-mode commit |
| --- | ---: | ---: | ---: |
| Normal desktop |1561ms |4.6ms |448ms |
|400KiB/s,80ms latency,4×CPU emulation |4316ms |23.4ms |472ms |

These are one bounded cold-cache run per profile, not startup percentile estimates or physical-phone guarantees. DOM milestones identify committed states; separate pixels/motion establish what those states render. Both cases recorded trusted input events and zero page errors, non-GET requests or network failures. The intentional exit accounts for approximately420ms of the film handoff.

The normal audio constructor costs193.1ms during boot, before the title, and neither Start path creates audio or incurs a long task. Steady title/play RAF p95 gaps on this high-refresh desktop are4.4/4.8ms normally and5.3/5.3ms constrained; no measured leaving/post-start frame exceeds34ms. This is evidence for those desktop/emulated cases, not a universal FPS claim.

The final candidate adds about6KB of gzip JS/CSS over the published baseline, approximately1.1%, using the same Node gzip method. Phaser, wallet and runtime assets remain byte-identical. No intro bitmap or video download was introduced. Actual browser requests use the existing nine furniture PNGs, existing font and verified preview JSON. See [timing data](opening-review/proofs/performance-summary.json), [full normal trace](opening-review/proofs/performance-normal.json), [constrained trace](opening-review/proofs/performance-constrained.json) and [current bytes/hashes](opening-review/proofs/release-manifest.json). Compression comparisons do not promise CDN throughput.

## Flows and limits

The focused input/read-failure cases cover early Skip with delayed assets, rapid Start/Enter, Space/Escape, failed configuration/preview, held preview, same-tab return, explicit title re-entry and pending/deep-link priority. [Input cases](opening-review/proofs/input-failure-cases.json), [entry priority](opening-review/proofs/entry-priority.json) and [early Skip](opening-review/proofs/early-skip.json) retain the results.

An independent title hold preserves the complete state with no playback behind it. Real saved NORI state is readable through a read-only account fixture; Pantry and saved days1/2 remain reachable, with the controlled three-item draft unchanged. No Prepare or Hatch submission occurred. Name/Traits, price and Hatch remain reachable at320px with Chrome OS text scale2 and a320×360 viewport simulating keyboard space. Existing-player checks restored the scoped draft/selection keys they touched; the browser profile was not cleared.

Native fixtures prove state/packet preservation, camera bounds, queued first-draw order and callback counts; actual compiled/public checks prove the surrounding App integration. Their boundaries are deliberately separate. Failed harness attempts—an existing returning-player marker, incorrect mock-wallet selection, a wrong CDP method name and an initial pointer hitting the actor in front of the fridge—are not counted as product defects or successful assertions.

TypeScript/build and focused whitespace/credential scans pass. No domain, codec, contract, incident RNG, legal action, model policy, server admission or trusted result changed. No new AI inference or onchain submission was purchased for this presentation sprint. Physical-phone GPUs, mobile-wallet behavior and universal audio policy remain outside the desktop/emulation evidence; previous real funded day proofs remain in the earlier review.

## Published verification

The single final main push published source commit `503296dddc169d2fcfd8a8f5ff8a0c45f9d6a4b3` in Netlify deployment `6ae7e729550088b4b90522b4`, Ready at **2026-11-02T01:28:46.383Z** (2 November2026, Bangkok morning). The [actual public-browser witness](opening-review/proofs/published.json) loads `index-62asVBDm.js`, reaches the held title, starts the real recorded day and shows genuine milk consumption. The intro query clears;390×844 has no document overflow. Config returns200 with the unchanged decision fingerprint; no page errors or non-GET requests occur.

This ordinary live-network check reaches the title at approximately2.96s and records trusted click-to-leaving4.9ms. It is separate from the controlled cold-cache benchmarks. [Publication record](opening-review/proofs/publication.json).

The source, screenshots, movie and proof records are permanent. The publication-only documentation completion is committed locally rather than causing a second deployment. Mainnet remains deferred.
