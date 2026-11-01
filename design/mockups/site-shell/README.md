# A website around the game

**Superseded interpretation.** The owner clarified that the opening must be part of the retro pixel-art game itself: intro animation → title → game starts, with a consistent art style. Use the [current cartridge-game opening boards](../cartridge-openings/index.html) and [current brief](../cartridge-openings/README.md). These earlier surrounding-website concepts are retained only for comparison.

Four visual directions requested by the owner. Each board contains three consecutive portrait-browser frames: opening, transition, and the game within the finished surrounding website. These are concept illustrations, not screenshots of an implemented shell or a new game layout.

Owner clarification after this first set: **Moss & Cream is the game's palette, not a restriction on the surrounding website.** Future shell exploration can use a richer, independent cartoon palette. Match the general cozy, quirky retro mood and keep the existing game visually intact. The prompts below record the historical generation instructions; their stronger shell-palette restriction is superseded by this clarification.

Open [the comparison viewer](index.html), or the individual boards:

| Board | Flow | Character |
| --- | --- | --- |
| [01 · Saturday Morning](01-saturday-morning.png) | Rooster peeks through an iris → cartoon title → game reveal inside the illustrated setting | Closest to a cartoon episode starting; expressive mascot and rounded graphic shapes. |
| [02 · The Cozy CRT](02-cozy-crt.png) | TV switches on → channel ident → game fills the screen | A warm television cabinet gives the page a physical home. |
| [03 · Come On In](03-come-on-in.png) | House exterior → window opens → game inside the window | The website directly introduces the home and creature the player will care for. |
| [04 · Cartoon Channel](04-cartoon-channel.png) | Graphic station ident → rectangular wipe → game within a playful broadcast design | Bold type and simple geometric movement; the simplest direction to animate from a few layers. |

## Shared implementation intent

- Keep the existing square pixel game large, sharp, interactive and visually intact. In the build, use its actual DOM/canvas rather than painting the game into the background artwork. Image-generation details are approximate.
- Fit the product within the visible browser height. Portrait phones lead; background edges can crop or extend on other aspect ratios. The game may need to scale with both available width and height on short screens.
- The third frame is the settled website. Surrounding artwork remains after the opening, with restrained peripheral movement that yields to the game.
- The opening should be brief, skippable, and run while the actual game initializes. It must not add a wait after the game is ready. Returning owners should get directly to their home.
- Keep Skip reachable in every opening stage, including the middle house-window stage where the illustration omits it. On short phones, reduce the wordmark/decorative margins before reducing the game. Sound is optional; the sequence must also work silently.
- Prefer a few compact reusable illustrated layers with transform/opacity/mask animation over a full-screen video. These boards do not establish an actual byte budget or measured startup time; measure and optimize assets during implementation.
- CRT/window decoration must stay outside all game pixels and touch controls. The CRT's rounded glass and reflections are artistic cues; the actual game stays flat, undistorted and glare-free.
- Preserve the existing game's colors. Give the surrounding website freedom to use a richer, independent palette that matches its cozy, quirky retro mood. Keep the page free of marketing paragraphs, blockchain decoration and additional competing actions.

Built-in `image_gen` produced all four boards using the approved house reference and a current real game capture. The exact prompts and reference paths are in [prompts.json](prompts.json). Outputs were visually checked, then copied into this permanent directory. No runtime or asset here depends on `TEMP/`; no live site change or production deployment was made for these concepts.

An independent concept reviewer inspected all four generated boards. All pass the three-stage continuity, distinct direction, prominent game and finished-background checks. No regeneration was needed; the remaining notes concern implementation boundaries above. The reviewer favored03 for warmth/world continuity and04 for a simple quick reveal.
