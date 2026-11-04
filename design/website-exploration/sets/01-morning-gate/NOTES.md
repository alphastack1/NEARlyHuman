# Morning Gate — set 01

A sunny entrance into a little place of its own. The home and garden are the main invitation; modern, open typography lets the same identity become practical documentation.

## Deliverables

| File | Coverage | Layout |
| --- | --- | --- |
| `01-home.png` | Homepage | Landscape desktop first viewport; quiet ivory copy at left, sunny house and garden filling the lower and right stage, always-visible Open App. |
| `02-the-game.png` | The game / how it plays | Portrait mobile website treatment, three numbered Hatch / Pack / Watch sections, compact header app entrance and clear guide continuation. |
| `03-guide.png` | Your first day guide article | Desktop three-column documentation, search, task-grouped sidebar, readable article, local contents and direct app exit. |

These are three separately generated images, not a triptych. The home received one targeted revision to replace unsupported vegetable imagery with supported planting types; the discarded first draft is scratch material only.

## Design system

- Palette: warm ivory, evergreen text, sunny grass, sage rules, honey wood/path, terracotta roof and apricot primary action.
- Type: friendly heavy rounded modern sans for headlines and wordmark; ordinary readable sans for body and guide. Pixel geometry accents the action and environmental edges, never guide paragraphs.
- Layout: the home creates a coherent world across the page rather than an inset game card. The mobile game primer uses three consistent, spaced rows and one factual sentence per step. The guide returns to conventional task navigation and a stable reading surface.
- Header: home logo, The game, Guide and filled Open App. Search is added where it serves guide tasks. World/wallet choices remain inside the existing app.
- Plant artwork: daisies, lavender, strawberries and blueberries. Four productive beds appear in the illustrative garden.

## Intended motion and implementation behavior

A very small cloud drift, one window-light shimmer and occasional leaf movement can make the homepage alive. Keep total motion gentle; respect reduced-motion settings. A mail-envelope highlight can respond to hover/focus without implying live activity. No forced introduction and no game-runtime dependency for the website or guide. Text and Open App should appear immediately.

On a phone, retain the compact logo and Open App in the first row. Secondary routes can sit in a short second row. Recompose the home art vertically rather than shrinking the entire desktop scene: keep the promise and action first, then a cropped house/gate moment. The game image is a portrait responsive direction; in implementation retain at least 16px body type and let the page scroll naturally rather than force all rows into one viewport. For guide mobile, replace the permanent sidebar with Guide contents and move local article contents into a disclosure.

Open App resumes the existing app flow. Existing exact-life and recovery URLs retain their context. No routing, game, wallet, contract or chain change is implemented by these mockups.

## Strengths

- Immediate cozy genre recognition from one coherent domestic place.
- A clear, consistently contrasted app entrance.
- Large concise copy paired with concrete objects explains watching without inventing new mechanics.
- The documentation has a distinct reading mode while preserving visual identity.

## Tradeoffs and caveats

- The full-bleed scene needs careful responsive cropping and accessible text placement. Decorative art should not make the website as heavy as the app.
- The sunlit cottage/garden is new illustrative environmental concept artwork, not a screenshot or a shipped game environment. Production should reconcile its pixel density and top-down camera with existing owned assets.
- The canonical procedural rooster is deliberately absent from generated illustration. Any production rooster or real game insert must come from the existing generator or an unchanged authentic capture.
- This broad sunny style is inviting but less austere/editorial than some alternatives; the guide keeps that warmth in low-density edge art.
- Generated lettering is concept guidance. The implementation must use real text and verify responsive type sizes.

## Factual and visual QA

Inspected every selected image with the image viewer. No generated rooster or replacement mascot; no fake player metrics, token prices, profit claims, mainnet, NPC traders, player market, bridge, offline aging or wallet dialog. The article correctly distinguishes NEAR Testnet/Meteor and Robinhood Testnet/Rabby or EVM, separate belongings, up-to-three distinct supplies with at most one productive seed/sapling, and save before film. A targeted home correction replaced the initial unsupported vegetable art; selected plants are within the existing catalog. Environment and egg/parcel illustrations are conceptual, not promises of exact UI or an owner's future Jev choice.

No source changes, deployment or push. Permanent files do not depend on TEMP.

## Research and inputs

Read AGENTS.md, SHARED_BRIEF.md, RESEARCH.md and all three research/*.md documents. Read README.md as current product truth and checked src/v2/catalog.ts for supported plants. Visually inspected the existing garden-after.png and living-after.png game captures, plus captured Stardew desktop, Sunflower desktop and NEAR docs desktop references. Existing source-site screenshots were study references and were not passed as generation inputs; no source layout or artwork was copied.

Built-in image_gen__imagegen was used for every image, not API/CLI fallback. Generation date: 4 November 2026.

### Provenance

1. Homepage initial: game garden/living captures as style references only. Default output: C:/Users/Admin/.codex/generated_images/01a1a497-a702-79f0-a7b1-ec2e1273154e/exec-d561b31f-dcd3-42e9-bbf6-378a5440f8b0.png
2. Homepage selected targeted revision: initial homepage as edit target; only productive plant depictions corrected. Default output: C:/Users/Admin/.codex/generated_images/01a1a497-a702-79f0-a7b1-ec2e1273154e/exec-efe7b024-b631-4c40-b65c-8eb729902d72.png
3. The game: selected homepage as style reference. Default output: C:/Users/Admin/.codex/generated_images/01a1a497-a702-79f0-a7b1-ec2e1273154e/exec-3aeb018a-5564-40a5-8bf6-e0ee91da8a14.png
4. Guide: selected homepage as style reference. Default output: C:/Users/Admin/.codex/generated_images/01a1a497-a702-79f0-a7b1-ec2e1273154e/exec-f1076831-aaf2-47a2-84c7-d8f3a6ab8208.png

Selected outputs are copied into this folder; default source outputs are retained. Full verbatim prompts follow.

## Full prompt — homepage initial

```text
Use case: ui-mockup
Asset type: complete polished desktop website homepage design exploration, ONE separate image, landscape 3:2 around 1536x1024, no browser chrome.
Primary request: Design NEARlyHuman's sunny world-first marketing homepage, concept “Morning Gate”. It should feel like the first welcoming step into a tiny lived-in pixel home and garden. A genuinely useful public website with an instantly visible Open App entrance, exquisitely balanced composition and crisp art.
Input images: the two supplied local game screenshots are STYLE REFERENCES ONLY for the pixel environment vocabulary and warm materials. They are NOT edit targets. Do not reproduce their UI, do not reuse or redraw any rooster visible in them. No new animal or human characters.
Composition: full-bleed world across the viewport. Slim spacious header at top: wordmark NEARlyHuman left, The game and Guide right, apricot filled Open App button far right. Under header, upper-left generous ivory open air area carries large dark evergreen modern rounded sans heading, not pixel paragraphs: “A little life.” newline “A mind of its own.” At mid left short body: “Hatch a rooster. Leave a few supplies.” newline “See what it makes of the day.” Then a chunky apricot primary Open App button with restrained hard pixel shadow; quiet text link “Discover the game ↓”. Small line “NEAR + Robinhood · Testnet”.
The environment is the dominant lower two-thirds and right side, composed as a coherent orthographic top-down / slight RPG roof-reveal domestic scene with natural garden boundaries, NOT floating island. A small warm timber cottage on right with brick-red roof, golden planks, open doorway and flowerbox; four orderly productive soil beds as 2x2 in the lower-middle garden, a winding honey-colored path from a gate bottom center to cottage, a humble mailbox with envelope, small workbench and wood stack near the cottage, irregular deep green tree edge, daisies and a few soft pixel cloud shapes near top right. Clean grass, sunlight from upper left, crafted stepped pixel shadows, atmospheric but readable. House and garden must be clearly grounded and compatible with existing top-down game. Leave the left text area beautifully uncluttered, art naturally rises on right. At bottom a thin quiet cream strip with small 01 HATCH / 02 PACK / 03 WATCH labels and the factual reassurance “Nothing ages while you're away.” No detailed instructions or fake activity.
Style: original crisp hand-authored-looking 2D pixel environmental artwork at controlled pixel scale, clean silhouette clusters, warm sunny grass green, dusty sage, ivory #fff9e8, honey path, terracotta roof, apricot CTA, dark evergreen type. Modern approachable editorial typography, strong readable contrast. No excessive gradients, bevels, noisy dithering, skeuomorphic wooden website frame or generic card grid. Art can be charming without cartoon outlines.
Text (verbatim): “NEARlyHuman”, “The game”, “Guide”, “Open App”, “A little life.”, “A mind of its own.”, “Hatch a rooster. Leave a few supplies.”, “See what it makes of the day.”, “Discover the game ↓”, “NEAR + Robinhood · Testnet”, “01 HATCH”, “02 PACK”, “03 WATCH”, “Nothing ages while you're away.”
Constraints: this is a public marketing homepage, not the actual game UI. No wallet popup. No birds, roosters, chickens, eggs with faces, mascots, people, invented characters. Canonical rooster artwork must not be recreated or substituted. Environmental art is illustrative. Do not show live game state, new-day choices, metrics, token prices, guaranteed profits, NPC merchants, player market, mainnet, bridges, offline aging, social login, audit badges or partner logos. No imitating any existing site's composition or artwork.
```

## Full prompt — homepage plant correction

```text
Use case: precise-object-edit
Asset type: website homepage mockup, targeted factual illustration correction.
Input image: the supplied homepage is the EDIT TARGET.
Change ONLY the plants growing in its four wooden beds. Replace any vegetable/cabbage/carrot/tomato depictions with these supported planting choices: upper-left bed white-and-yellow daisies; upper-right bed small upright purple lavender; lower-left bed low strawberry plants with tiny bright red strawberries; lower-right bed low blueberry bushes with tiny dark blue berries. Keep four beds and same art density/overall green mass. No tomato vines, carrots, cabbage or vegetables.
Preserve the complete entire image's layout, typography, text, palette, sunlight, house, garden, mailbox, buttons, pixel scale and composition unchanged. No birds or roosters. Keep every existing word intact.
```

## Full prompt — The game mobile

```text
Use case: ui-mockup
Asset type: ONE separate polished MOBILE WEBSITE design mockup for NEARlyHuman “The game” page. Portrait canvas approximately 1024x1536. Render the entire canvas as the actual narrow-screen responsive webpage, no phone hardware, browser chrome, desk, poster or multiple-device presentation. It should be readable when fitted to a phone.
Input image: supplied Morning Gate homepage is a STYLE REFERENCE ONLY. This is a new substantive page, not an edit. Carry through its forest-green modern rounded sans, ivory open space, apricot pixel-edge Open App button, sunny hand-authored 2D pixel home/garden objects and precise art scale.
Layout: compact ivory top header, “NEARlyHuman” left and apricot “Open App” right, small quiet second nav row “The game” (active) and “Guide”. Generous 28px equivalent side padding. Small page eyebrow “THE GAME”. A strong simple heading “You prepare.” newline “They decide.” Body beneath: “A little life with its own plans.” Then three clear numbered steps stacked in one continuous warm-ivory reading surface, separated by generous spacing and slender sage rules, NOT a generic feature-card grid. Each step has a strong 01/02/03, short heading, 1–2 lines of very readable normal text, and a small carefully integrated pixel environment/object vignette offset right or below. Make the content calm and clear, words as prominent as art. Pixel art should occupy about one third of the screen.
Step 01 heading “Hatch a life.” Body “Choose a testnet world, name your rooster, and hatch its NFT.” Vignette: a simple unmarked cream egg resting on a tiny wooden doorstep, no face and no creature.
Step 02 heading “Pack a little post.” Body “Up to three different supplies. At most one seed or sapling.” Vignette: an open small parcel with three slots holding one daisy seed packet, simple water container, and bread; no animals. This is an explanatory marketing illustration, not a new in-app interface.
Step 03 heading “Watch its day unfold.” Body “Jev chooses. The day saves onchain before its film plays.” Vignette: warm small cottage cutaway with visible workbench, doorway path and four productive garden beds with daisies, lavender, strawberries and blueberries, no birds or people. Small caption “Illustrative scene”.
Near the bottom a calm sage-tinted short line “Nothing ages while you're away.” and a quiet link “Read the first-day guide →”. A final apricot “Open App” button can sit just above the footer. Footer line “NEAR + Robinhood · Testnet”.
Text exact and no further invented UI/copy. Use large readable normal sans body text, with no microscopic decorative labels. Preserve the cheerful sunny morning brand and breathing room. No huge hero that pushes all three actual steps off the image.
Constraints: public website around existing game, not an app redesign. No wallets/dialogs, no new-day spoilers, no bird/rooster redraw or mascot, no cartoons/3D/vector animals. No claim to live while away, no fake player numbers, no profits/token prices/guaranteed sales, no NPC traders, market, bridge or mainnet. The canonical rooster art must not be drawn; use only environment and objects. No logo copying.
```

## Full prompt — Guide article

```text
Use case: ui-mockup
Asset type: ONE complete desktop documentation article webpage, landscape 3:2 around 1536x1024, no browser chrome.
Primary request: Design the usable NEARlyHuman Guide article “Your first day” in the sunny Morning Gate brand of the supplied homepage. This is a distinct practical documentation screen, not another homepage or poster. Keep atmosphere at the edges and provide an excellent quiet reading surface. This is a design exploration, no working product redesign.
Input image: supplied Morning Gate homepage is a STYLE REFERENCE ONLY for wordmark, apricot pixel-edge buttons, forest-green friendly modern sans, ivory and sage palette, small crisp pixel garden motifs. Do not recreate a rooster. No animals at all.
Composition: ivory full-page docs shell. Slim header across full width: NEARlyHuman wordmark left (a home link), The game and Guide navigation, quiet central search box “Search the guide…” with magnifier, prominent apricot “Open App” right. Below thin sage line, use conventional spacious three-column documentation: grouped left sidebar about 230px, main article about 760px, right page-contents about 190px. Use comfortably readable body text, article paragraphs about 20–22px in this image, dark green-black on almost white warm ivory. No pixel body text. Thin rules and generous vertical rhythm; minimal boxes.
Left sidebar:
START HERE
Your first day (active with pale sage pill)
Worlds & wallets
LIFE AT HOME
Care
Garden
Workshop
Weather & visitors
WHAT YOU OWN
NFT & purse
NHC
Sharing & transfers
UNDER THE HOOD
Jev & saving
Contracts
Help
Small quiet footer link “← Back to website”.
Main article at top breadcrumb “Guide / Start here”; large heading “Your first day”. Two-line intro “Choose up to three supplies.” / “Your rooster decides how to use them.” Beside title upper-right in article a small tasteful pixel mailbox and daisy sprig, leaving article text unobstructed.
Article content, exactly:
“1. Choose a world”
“NEAR Testnet uses Meteor. Robinhood Testnet uses Rabby or an EVM wallet. Your lives and belongings stay separate.”
A single simple two-column line or table: “NEAR Testnet — Meteor” and “Robinhood Testnet — Rabby / EVM”.
“2. Hatch your rooster”
“Open the app, choose a name, connect your wallet and confirm the hatch.”
“3. Pack a little post”
“Choose up to three different supplies, with at most one seed packet or sapling.”
“4. Watch after the save”
“Jev makes the choices. Your day is saved onchain before its film plays.”
A restrained pale-sage callout with tiny leaf icon: “Nothing ages while you're away.”
Below article a quiet thin-rule next-article link “Next: Worlds & wallets →”.
Right column heading “ON THIS PAGE” followed by “Choose a world”, “Hatch your rooster”, “Pack a little post”, “Watch after the save”. Further down a tiny sunny pixel garden/wooden gate vignette, no birds, with quiet text “A little life. A mind of its own.” and “NEAR + Robinhood · Testnet”.
Style: precise polished usable docs, clear active states, calm typography, thin borders, article width and generous margins; no generic marketing grid, large environmental hero, heavy ornamental frame or tiny pixel paragraphs. Enough original sunny garden character to belong with homepage while prioritizing reading.
Factual constraints: Testnet worlds only; neither mainnet enabled. No bridge. Canonical procedural rooster must never be redrawn or substituted; no animal illustration. No wallet dialog on docs. No profit/earnings promise, token charts, live activity, NPC trader, trading market, offline aging, direct chat, social login, audit badges, fake endorsements or new game mechanics. Do not add prices or fees not supplied in text.
```


## PM production correction

The watering can shown with packing imagery is a conceptual illustration. The actual drinking-water supply uses a bottle. Use the real game's bottle and supported plant/item assets in implementation; these mockups do not introduce a packable watering can or new crops. See ../../REVIEW.md for the combined independent review.
