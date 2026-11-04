# Set 03 — Small Life, Big Type

4 November 2026. Independent website and documentation design exploration for NEARlyHuman. **Three separately generated images** using the built-in imagegen tool, one call per image. Research and mockups only; no application, artwork generator, game rules, chain, routing, source, publishing or deployment changes.

## Concept

A contemporary independent magazine meets the small physical pleasures of a retro pixel home. Confident oversized black sans typography makes the emotional proposition legible before the visitor needs to understand wallets, ownership or AI. Apricot, cobalt, cream and thin black rules organize the page. Pixel objects provide the specific game-world texture. This direction deliberately gives the public website a brighter identity than the in-game HUD.

Proposed palette: apricot #FFB682, cobalt #3046F5, cream #FFFDF2, near-black #171814; sparse acid-yellow pixels. The generated results introduce slight surface variation despite the prompts asking for flat fields; that is a mockup artifact, not a requirement for implementation.

The wordmark is typographic, not a new illustrated logo. There is one filled **Open App** action per view. Other actions are ordinary quiet text links.

## Files and coverage

| File | Pixels | Coverage |
| --- | --- | --- |
| 01-home.png | 1536 × 1024 | Complete desktop entry viewport: immediate proposition, brief loop, prominent Open App, illustrative cottage/four-bed environment and three isolated pixel objects |
| 02-the-game.png | 948 × 1659 | Single mobile page, edge to edge: Hatch → Pack → Watch, supply limit, saving-before-film fact, no-offline-aging reassurance and illustrative saved-day scene |
| 03-guide.png | 1536 × 1024 | Proper first-day article: search, grouped topic sidebar, page contents, four concise steps, next topic and direct app exit |

The requested portrait dimensions were approximate; the built-in generator chose the final dimensions above. The portrait is a responsive webpage reference, not a separate mobile app or altered game UI.

## Reading and reference provenance

Read before generation: repository AGENTS.md, README.md, SHARED_BRIEF.md, RESEARCH.md, and all three research notes (pet games, crypto/docs, content architecture).

Visually inspected the supplied local captures of Pixels, Provable Games, Neko Atsume how-to and NEAR docs, plus docs/refinements/environment-color/garden-after.png. They informed (respectively) joyful bold color, typographic confidence, short explanatory beats and conventional documentation information design. Their art and logos were not passed to imagegen or copied.

The game environment screenshot was studied as a product reference, not an edit target. No screenshot was presented as a current live owner day. Generated environmental art is deliberately marked illustrative on the play page.

Image 1 had no image input. Images 2 and 3 used only this set's generated 01-home.png as a **style reference**, not an edit target. The local reference had been viewed before passing it to imagegen.

No rooster, bird, animal, character portrait or new mascot appears in any image. This preserves the owner's canonical procedural rooster by avoiding any redraw or substitution. In an eventual implementation, use the existing generator or unchanged authenticated game captures wherever a rooster appears; do not reproduce the illustrative environment as replacement game artwork.

## Image generation provenance

Mode: built-in image_gen__imagegen, transparent_background false. No API, CLI, external image service, generated HTML screenshot or post-generation image editing was used. Final PNGs were copied unchanged into this set folder, with the original generated files left in place.

1. 01-home.png — first attempt selected, no input images. Original: C:/Users/Admin/.codex/generated_images/01a1a497-e7fe-7fe1-9cd5-67026dd1182d/exec-756be664-4b5b-4803-9e4e-b036a02b072f.png
2. 02-the-game.png — first attempt selected. referenced_image_paths: this set's 01-home.png. Original: C:/Users/Admin/.codex/generated_images/01a1a497-e7fe-7fe1-9cd5-67026dd1182d/exec-b65810f8-1227-498f-87a8-968958a706de.png
3. 03-guide.png — first attempt selected. referenced_image_paths: this set's 01-home.png. Original: C:/Users/Admin/.codex/generated_images/01a1a497-e7fe-7fe1-9cd5-67026dd1182d/exec-f2d811ad-6500-4398-b6d2-fd775071a029.png

## Layout and intended behavior

**Home:** a compact cream header sits above an asymmetrical apricot stage and cobalt object column. Headline dominates, with a real sentence beneath. Garden/home art joins the copy to the kind of life being observed. The cream bottom line holds the player's role and no-offline-aging reassurance. The app exit is immediately visible in the header.

**The game:** a mobile-first long page uses a cobalt typographic introduction, three ruled editorial rows, then a brief environment glimpse. Every step has a number, a readable short explanation and one object grouping. No grid of six marketing features, fake app buttons or pretend owner balances is introduced. A desktop version could widen the same sequence into staggered editorial rows while retaining a single reading order.

**Guide:** the brand steps back. Ordinary sans body type, large comfortable article title, grouped navigation and clear contents support scanning. Cobalt denotes current location; apricot is used only for a rule and small reassurance. Search and the app exit remain obvious. The return-home link avoids a documentation dead end. A deeper production article should link current wallet/network facts from one content source.

## Motion ideas

- One occasional two-frame glint on the watering can or mailbox flag, at a slow cadence.
- Sparse leaf pixels can shift once, then rest; no continuous parallax sweep.
- On The game, the object beside the current row could change subtly with scroll, without delaying text.
- Hover/focus changes are instantaneous underline or color changes.
- All text and Open App paint immediately. No intro film, game engine, wallet connection or animated entrance blocks reading.
- Reduced-motion uses the same static composition. Documentation stays still.

## Mobile behavior

The second image is the explicit readable phone treatment. Its header keeps the logo and Open App in one row, with quiet route links beneath. At real phone scale, the stacked page is meant to scroll naturally; the three rows do not need to fit one screen. The actual mobile top viewport should retain the CTA plus the premise and the start of the loop.

For the homepage, collapse the cobalt object column into a narrow horizontal object row under the short copy, reduce the headline with fluid type, and put the environment at the bottom of the initial section. Keep copy, CTA and a glimpse of the world together before long explanation. Test the hero crop with actual canonical game art rather than forcing this composition verbatim.

For docs, replace both desktop side columns with a **Guide contents** control and a collapsible **On this page** list. Keep the article near the full viewport width with comfortable padding and at least 16px body text. Search remains in the header/menu. Open App stays directly reachable without opening the contents drawer. Keyboard focus should be visible in cobalt/black with appropriate contrast.

## Inspection and critique

All three generated outputs were visually inspected. No major redraw, factual, layout or readability errors warranted regeneration. Important copy is legible, the CTA is clear, mobile limits say three different supplies / at most one seed or sapling, and the guide correctly describes separate testnet worlds and saved-before-film behavior.

**Strengths:** unusually distinct from an immersive full-screen world or warm-paper handbook; immediate emotional clarity; bright palette without crypto-dashboard styling; a credible calm guide within the same identity; phone coverage is substantive rather than a decorative device thumbnail.

**Tradeoffs:** the oversized home type leaves less room for mechanics in the first viewport. The header-only app exit could benefit from a sticky treatment on a long phone page, to be validated later without adding competing CTAs. The homepage cottage is more oblique than the existing top-down game view and must be treated as exploratory environment art, not a replacement renderer. A production build should use exact project-owned environment assets or unchanged captures. The three-step mobile page omits deeper wallet and payment details and sends them to the guide. The guide is an overview article; actual operational copy needs current config links and task-specific help rather than hardcoded marketing promises.

No profit, real-player metrics, trading, mainnet, guaranteed shipping, offline aging, direct chat or trustless AI claim appears. The garden/objects do not reveal an owner's upcoming Jev choices.

## Full prompts

### 01-home.png

```text
Use case: ui-mockup
Asset type: one finished desktop website homepage design mockup for NEARlyHuman, a retro phone-first virtual pet game. Generate a single landscape image, approximately 1536 x 1024, showing an actual complete website viewport straight-on, not a perspective laptop and not a collage.
Concept: SMALL LIFE, BIG TYPE. Contemporary independent magazine typography meeting joyful retro pixel-world objects. Editorial, confident, playful and beautifully balanced, with deliberate asymmetry. This is a polished plausible web page, not a poster.
Composition: slim cream header with NEARlyHuman plain black typographic wordmark at left, quiet "The game" and "Guide" text links at right, exactly one filled black "Open App ↗" button at far right. Under the header, a massive apricot hero occupying roughly 77 percent width and a slim cobalt vertical panel on the right, continuing to the bottom. Wide margins and crisp geometry. Oversized very bold modern sans type at upper left spanning three lines reads "A little life. / A mind of / its own." Black typography; each line is large and airy, with exceptionally confident optical spacing, near 130px at this viewport. Keep all type fully inside the viewport.
Under the headline, left-aligned readable body copy: "Hatch a rooster. Leave a few supplies. See what it makes of the day." This copy should be 22px equivalent, two to three lines. Add a quiet underlined text link "See how it plays →" beneath, not a second filled CTA.
Pixel environment art occupies the lower right third of the apricot hero, spilling slightly onto the cobalt panel: a crisp, charming top-down / oblique-top-down pixel cottage corner with terracotta roof, wooden deck, four raised garden beds, a mailbox and leafy plant. This art should be tiny crisp raster blocks scaled with nearest-neighbor edges, NOT vectors, NOT photoreal or 3D. Surround it with generous negative space; black headline remains dominant. No bird or animal or new mascot of any kind, no character portraits. At the top of the cobalt panel, put the tiny white label "A LIFE OF ITS OWN", and three isolated pixel objects spaced vertically: seed packet, watering can, wooden toy boat. No cards, no feature grid.
Bottom of hero has a thin black rule. Under it, a short cream row in large readable type: "You prepare. They decide." at left, "Nothing ages while you're away." at center-right, tiny "NEAR + Robinhood · Testnet" at bottom right. Pixel details may be fun but this remains refined editorial web design, with clean ordinary sans body type and sophisticated spacing.
Palette: ripe apricot #FFB682, bright cobalt #3046F5, cream #FFFDF2, near-black #171814, small acid-yellow pixel accent. Flat solid color blocks; no gradients or grain. No shadows except crisp two-pixel environmental shading. Thin rules, square corners.
Text (verbatim priority): "NEARlyHuman", "The game", "Guide", "Open App ↗", "A little life.", "A mind of", "its own.", "Hatch a rooster. Leave a few supplies. See what it makes of the day.", "See how it plays →", "You prepare. They decide.", "Nothing ages while you're away.", "NEAR + Robinhood · Testnet".
Constraints: one actual website viewport. Header and action obvious immediately. No browser chrome. No wallet dialog. No fictitious statistics, prices, profits, token charts, social badges, roadmap, mainnet, live activity. Canonical rooster artwork must never be redrawn: show NO rooster and NO animal at all. Do not imitate any other game's logo or art. Environmental illustration is exploratory, not an actual game screenshot. No SaaS rounded feature-card grid. No cartoon brand. Make all visible important text readable.
```

### 02-the-game.png

```text
Use case: ui-mockup
Asset type: second image in a website design exploration for NEARlyHuman: a single highly readable MOBILE WEBPAGE for "The game", portrait ratio approximately 1024 x 1792. Show the responsive page straight-on filling the canvas edge to edge, with no phone hardware, no perspective, no multiple screens, no outer presentation-board labels.
Input image: the supplied homepage is a STYLE REFERENCE ONLY. Make a new page, not an edit. Keep its independent-editorial typography, apricot/cobalt/cream/black palette, crisp pixel object style, square geometry and thin black rules. Do not duplicate its homepage composition.
Concept: SMALL LIFE, BIG TYPE, a contemporary magazine crossed with a retro pixel game. Mobile page must look genuinely usable at 390px wide. Large ordinary readable body sans typography, clear generous spacing, no tiny paragraphs and no feature-card grid.
Composition: cream mobile header with small NEARlyHuman wordmark left and exactly one black filled "Open App ↗" button right. Immediately beneath, a small text navigation strip "The game / Guide", with The game selected. Cobalt blue masthead with a small label "HOW IT PLAYS" and a big very bold cream modern sans heading in three lines: "You prepare. / They / decide." Under it a short readable cream line "A small life with a mind of its own." Cobalt block is about the first 30% of page.
Then cream background, three airy numbered editorial rows, separated by fine black rules. No boxes, no rounded cards. Large black 01, 02, 03 sit flush left; bold title and short body at center; a crisp small pixel object on the right. Each row has enough height for clear 18px-equivalent text at actual 390px width.
01 title "Hatch a life." body "Choose a testnet world and hatch your own rooster NFT." Object: a small intact cream egg on a quiet patch of pixel grass, no bird, no eyes, no face.
02 title "Pack a little post." body "Up to three different supplies. At most one seed or sapling." Object: a pixel brown paper parcel beside seed packet and watering can.
03 title "Watch its day." body "Jev chooses what to do. The day is saved before its film plays." Object: a small pixel wooden workbench with wood and tiny toy boat.
Below these rows a narrow apricot reassurance strip reads "Nothing ages while you're away." Below it, a modest full-width pixel illustration of four raised garden beds, a mailbox and a cottage edge, no creatures. Caption beneath: "Illustrative saved-day scene". Tiny quiet footer "NEAR + Robinhood · Testnet" and underlined "Read the first-day guide →". Keep this image a single mobile website page with the whole useful loop readable, not a decorative phone mockup.
Color: cobalt #3046F5, apricot #FFB682, cream #FFFDF2, black #171814. Bold flat color fields and deliberate asymmetry. Exactly one filled CTA total. No fake app controls, no app redesign, no token balance, no invented outcome, no live activity.
Canonical rooster must NOT be redrawn or substituted: show absolutely NO rooster, bird, animal or new mascot; environmental art and objects only. Do not use cartoon or 3D vector style. No crypto charts, dashboard, profits, testimonials, stats, mainnet, social icons or wallet dialog. All important text fully inside canvas and readable.
```

### 03-guide.png

```text
Use case: ui-mockup
Asset type: third image in a website design set for NEARlyHuman, a complete highly readable desktop GUIDE ARTICLE page, straight-on landscape approximately 1536 x 1152. Generate one page, no collaged screens, no device hardware, no browser chrome.
Input image: supplied NEARlyHuman homepage is a STYLE REFERENCE ONLY. Retain its confident contemporary heavy sans typography, black thin rules, cream/apricot/cobalt palette and small crisp pixel objects. This is a new documentation page, not an edit. Quiet, usable article layout with ordinary normal-sized reading text, not another hero poster.
Header: warm cream 80px-high band. NEARlyHuman black wordmark left, quiet "The game" and active "Guide" links at right, exactly one black filled "Open App ↗" button far right. Thin black rule. Beneath, full width quiet search strip with search icon, "Search the guide" and tiny "Ctrl K" hint, no additional filled action.
Layout: a proper grouped documentation left sidebar about 245px wide on cream; a white or near-white central article about 800px wide with generous padding; modest right page-contents column with fine left rule, about 220px. The article is a stable peaceful reading surface. Pixel type only for little section numbers, no pixel font paragraphs.
Sidebar content, readable:
"START HERE"
"Your first day" (selected in cobalt with cream text)
"Worlds & wallets"
"LIFE AT HOME"
"Care"
"Garden"
"Workshop"
"Weather & visitors"
"WHAT YOU OWN"
"NFT & purse"
"NHC"
"Sharing & transfers"
"UNDER THE HOOD"
"Jev & saving"
"Contracts"
"Help"
At bottom a quiet underlined "← Back to website".
Main article: breadcrumb "Guide / Start here" in small cobalt. Large bold black H1 "Your first day." around 72px. A short introduction in readable 22px sans: "Choose a world, hatch a life, pack a few possibilities." Small apricot horizontal rule then actual useful article sections. Use 20px-equivalent normal body type with open leading, an approximately 65-character reading line. Section headings bold modern sans 24px with small cobalt numbers.
"01  Choose your world"
"NEAR Testnet and Robinhood Testnet are separate worlds. Choose one in the app, then connect its supported wallet."
Small underlined link "Worlds & wallets →".
"02  Hatch your rooster"
"Name your life and confirm the hatch with your wallet. Its home, inventory and purse travel with its NFT."
"03  Pack a little post"
"Choose up to three different supplies, with at most one seed or sapling. Your rooster decides how to use them."
"04  Save, then watch"
"Confirm the day. Jev chooses its actions. The completed day is saved before its film plays."
After section 04 a narrow pale apricot note with small black pixel sun icon: "Nothing ages while you're away." At article end a fine rule and understated "Next: Worlds & wallets →".
Right contents: "ON THIS PAGE" then "Choose your world", "Hatch your rooster", "Pack a little post", "Save, then watch". Below, large empty space and one small crisp retro pixel parcel, seed packet and watering can, treated as an object illustration. Beneath it a small quiet line "You prepare. They decide." Avoid distracting hero-sized environment art on the guide.
Footer small factual label "NEAR + Robinhood · Testnet". No price promises or onchain trust claim. All navigation, body paragraphs and headings must be cleanly readable and have enough contrast. Practical guide layout first; the brand lives in type, color selection and little pixel details.
Constraints: canonical rooster artwork is preserved by showing NO bird, rooster, animal, mascot or character. This is surrounding website/docs only, no app redesign. No feature-card grid, token chart, balances, profits, testimonials, fabricated stats, mainnet, chat or wallet connection dialog. No side panel that looks like a game HUD. No gray low-contrast tiny text, no cropped article paragraphs. Exactly one filled Open App CTA and quiet text links elsewhere.
```


## PM production correction

The watering can shown with packing imagery is a conceptual illustration. The actual drinking-water supply uses a bottle. Use the real game's bottle and supported plant/item assets in implementation; these mockups do not introduce a packable watering can or new crops. See ../../REVIEW.md for the combined independent review.
