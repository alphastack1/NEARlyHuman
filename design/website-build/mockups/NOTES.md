# Morning Utility — approved hybrid build guide

4 November 2026. The owner selected Morning Gate's colour/feeling and Little Life Utility's layout/retro software language, and authorized implementation without another mockup approval. These four boards extend that selected combination across the website. They are implementation references, not an alternative brand exploration.

## Unified direction

Sunlit ivory surfaces, dark teal/navy outlines and title bars, mint active tabs, warm apricot primary actions, lively garden greens and honey/apricot wood. Pixel display accents can distinguish headings and compact controls; use an ordinary readable sans face for explanatory text and documentation. Keep edges deliberate and tactile. The interface is a useful small website with a retro grammar, not a simulated operating system with invented controls.

One obvious **Open App** entrance leads to the existing game. Marketing and docs need no wallet connection. The title bars, tab hierarchy and footer provide continuity; the environment provides warmth and a sense of life. Doc articles quiet the art and keep the reading surface stable.

## Boards

| Board | Views | What it resolves |
| --- | --- | --- |
| [01-home.png](01-home.png) | Desktop home + phone home | Teal utility title bar, mint navigation, apricot entrance, emotionally clear promise and a bright domestic environment. Phone reflows instead of shrinking the desktop. |
| [02-game-and-ownership.png](02-game-and-ownership.png) | The game + ownership story | Hatch / Pack / Watch as concrete actions; a small connected home / belongings / intentions / purse diagram rather than financial metrics. |
| [03-docs.png](03-docs.png) | Handbook landing + phone first-day article | Task-based grouped contents, search, a clear first guide, phone contents control and useful concise instructions. |
| [04-reference-and-help.png](04-reference-and-help.png) | Contracts/official links + phone help + 404 | Separate-world verification links, actionable troubleshooting and a friendly return path for unknown pages. |

Each board was generated separately with the built-in image tool and inspected at its actual output size. No further generation was needed for small wording artifacts. The four boards contain nine related page/viewport views, with at most three on any one board.

## Production environment

[hero-home.webp](../../../public/site/hero-home.webp) is the optimized production website illustration (501,190 bytes). The [original selected PNG](../assets/hero-home-original.png) is preserved outside public assets at 1448 × 1086 RGBA with genuine transparency (300,649 fully transparent pixels). There is no UI/text, bird, animal or human character. It contains a cottage cutaway, household fixtures, four supported crop beds (daisy/lavender/strawberry/blueberry), workbench/logs, red mailbox, fence gate and trees. It is website atmosphere, not a claim of the game's exact playable geometry.

The silhouette fills nearly the complete original PNG bounds. Provide a little inner padding in the containing window rather than clipping it tightly. The illustration is intentionally light and cheerful and can sit on an ivory/sky surface. Root converted the image to WebP at quality 94/method 6; the original and shipping-derivative checksums in manifest.json record both files. This reduces the shipping asset from 2,137,090 to 501,190 bytes without changing its composition.

The owner's original procedural rooster artwork in src/art/rooster.ts and rooster-data.ts remains untouched. Any bird added to the website must come from that generator, with its seeded identity preserved. It is deliberately absent from these generated illustrations.

## Critique and production corrections

- Boards 01/02 still contain generated minimise/maximise icons despite the prompt's request. Omit them in code unless they have a clear actual function. A title bar alone communicates retro software without fake buttons.
- Board 04 says “The game saves your choices” in its small explanatory text. Actual wording must say **Jev chooses**, the completed day is saved, and contracts verify legal state/rewards. The player packs supplies; they do not choose every action.
- Treat copy and icons in the boards as layout references. The real handbook data, current world configuration and actual inventory icons are the factual source.
- The desktop ownership diagram's four tiles should remain a connected small explanation, not grow into a generic card grid. On phones use a short vertical flow.
- A phone article uses a contents button; never carry a full desktop sidebar into the narrow reading column. Keep an app exit directly reachable.
- Use live HTML text, real links, direct exact-NFT routing and existing recovery behavior. Do not turn these boards into rasterized page screenshots.

## Intended restrained motion

Tiny leaf/cloud motion, a warm window glow, a short parcel or tab response and a little title-bar feedback can make the website feel alive. Keep real text and Open App visible immediately, and load the game only when entering it. The production illustration can be a static base with a few lightweight independent foreground accents; it does not need a whole game renderer to animate.

## Provenance

Five built-in imagegen calls total: four boards and one transparent production environment. No API/CLI fallback. Exact prompts, reference roles and original output paths are in [prompts.json](prompts.json); dimensions, byte counts, PNG fingerprints and alpha verification are in [manifest.json](manifest.json). Source references were inspected before generation. No game source, canonical art, wallet, contract, service ledger or deployment was changed by this art task. Scratch verification tooling stays in ignored TEMP.
