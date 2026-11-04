# Set 02 — The Little Almanac

4 November 2026. Independent website exploration by designer 02. Three **separately generated** high-fidelity images, made with the **built-in image_gen imagegen tool**. This is a design direction for the public website and player guide around the existing game; no implementation, game changes, chain changes, route changes or publication.

## Design proposition

An inviting printed game manual becomes a modern website: warm ivory paper, oxblood book typography, fine rules, numbered folios and tiny crisp pixel plates. Large serif editorial headings carry the emotion; ordinary sans-serif paragraphs carry the practical instructions. The effect is calm and authored rather than a dashboard, a cartoon brand, a scrapbook or a feature-card landing page.

The homepage uses a confident asymmetrical 44/56 composition, where the plain promise and app entrance sit beside one substantial environmental plate. The phone explainer becomes a flowing vertical manual. Documentation keeps the family resemblance but reduces the art, with clear grouped navigation and a stable reading column.

Suggested production palette: paper `#F5F0E4`, oxblood `#702E2A`, dark brown-black body text, occasional ochre and sage within the pixel art. Exact final colors should be checked for contrast once implemented. Serif type needs a medium or sturdy regular cut rather than hairline fashion styling; clean humanist sans is preferred for body copy. Folio accents can be monospace. These are typographic directions, not a chosen font license.

## Images and evaluation

| File | Composition | Evaluation |
| --- | --- | --- |
| 01-home.png | 1536 × 1024 desktop entry viewport. Big promise on the left, clear header and hero Open App, a framed pixel home/garden/workbench plate, three short verbs below. | Strongest expression of the almanac idea. The world, premise and entrance are visible together. Four beds and domestic objects connect to the game without inventing a new mascot. |
| 02-the-game.png | 1024 × 1536 portrait phone composition. Compact header, two-line headline, cropped environment strip, three numbered Hatch / Pack / Watch steps, first-day guide exit. | A distinct substantive page rather than a reduced desktop hero. Supply limits and save-before-film behavior are readable. The image represents a page capture; on a physical narrow phone its content would scroll naturally. |
| 03-guide.png | 1536 × 1024 desktop Your first day article. Search, grouped index, right contents, normal body type, small supply vignette and four practical steps. | Clean documentation with a useful article instead of another marketing poster. The article preserves world/wallet separation, supply limits, fees before confirmation and no aging while away. |

All three selected outputs were visually inspected after generation. None contains a newly generated bird, animal, human, profit, chart, trader, bridge or wallet dialog. Open App is clear in each. No major layout, factual or artwork-invariant failure required a regeneration. Tiny generative lettering and production copy still require normal implementation proofreading; these are design guides rather than shipping screens.

## Research and source handling

Read AGENTS.md, the entire shared brief, RESEARCH.md and all three shared research notes before choosing the concept. Also read README.md for the current behavior and the imagegen skill. Personally inspected the provided Usagi Shima desktop, Neko Atsume how-to, Sunflower documentation screenshots, the actual garden capture and the earlier approved house/care reference.

The references informed the separation of atmosphere, three-step primer and ordinary docs. No third-party reference image was passed to generation, and no layout or character artwork was copied. The actual game screenshots were inspected as product-style references only; they were not edit targets or compositing inputs.

**Canonical artwork:** No rooster was generated. The original procedural generator in src/art/rooster.ts and rooster-data.ts remains canonical and untouched. Any eventual production rooster insert must come from that generator unchanged. These mockups use environmental/object illustrations only.

**Illustration caveat:** The timber home, plants, bread, bottle, seed parcel and garden are new illustrative website concept art, not exact captures of the existing game, not assets substituted into it and not evidence of a particular saved day. In implementation, production art should use real approved environmental captures/assets or clearly retained editorial illustration. The homepage's minor line “supplies, tools, or seeds” should be tightened to “up to three different supplies” to avoid suggesting a new tool supply type. The denser vegetable rows are atmospheric illustration, not the planting catalog. The concise phone and guide copy accurately states the current supply rule.

## Intended motion and interaction

- Content, navigation and Open App render immediately; art does not gate entry.
- The single home/garden plate can carry one or two tiny loops: leaves shifting, a warm window pixel flicker or a mailbox flag settling. These should be sparse and avoid suggesting real-time offline simulation.
- No mandatory intro, autoplay movie, parallax reading surface or full game runtime for the public guide.
- The header becomes gently sticky on long pages. Open App remains the only filled action. Quiet links underline on hover/focus.
- Respect reduced motion with a still frame. The concept does not depend on animation.
- Docs search, contents anchors and current-section indicator support task finding; all reading works without a wallet. A factual article or exact-life link should keep its direct destination.

## Mobile and responsive behavior

The second image deliberately tests the phone rather than adding a tiny phone as decoration beside a desktop. At narrow widths the main headline stacks, an environmental strip is kept compact and all three steps become a single reading flow. Small object vignettes can move below their text if they would squeeze a 360px viewport. Use 16–18px minimum body type in implementation, sensible touch targets and natural document scrolling; do not force the whole page into one screen.

The homepage stacks copy → app action → compact world plate → three verbs. Preserve a visible Open App in the compact header; secondary The game and Guide links can move into an accessible menu. Avoid putting the complete illustration above all explanation.

Guide columns collapse to one article. Replace the permanent index with a “Guide contents” control, let search open a simple narrow overlay and place page contents inline under the title. The guide's warm background should remain smooth enough for sustained reading; texture is optional and can disappear on mobile.

## Strengths and tradeoffs

- A distinctive, quiet identity with strong information hierarchy and an emotionally fitting sense of a small recorded life.
- The same system serves an expressive homepage and useful ordinary documentation.
- A limited palette and simple rules are straightforward to implement as lightweight HTML/CSS around the existing app.
- Serif/paper can feel more literary and less instantly “retro game” than a bold pixel wordmark; the environmental plates provide the genre connection.
- The deliberately composed plates need authentic production assets or a clearly editorial illustration policy. Mockup art should not imply an exact in-game layout, crop or saved result.
- Keep paper texture subtle and optional. Contrast, text size and actual mobile breakpoints must be verified in code after direction selection.
- Avoid expanding folios, labels and rules into decorative clutter; the pages work because the marks are sparse.
- Existing exact-life URLs and return context must be preserved by any later routing work. No new /app route was implemented here.

## Image provenance

The tool saved outputs under the Codex generated-images folder; selected outputs were copied into this owned set folder. The originals remain there. No external image API or CLI was used.

1. **01-home.png** — new generation, no image inputs. Original: C:/Users/Admin/.codex/generated_images/01a1a497-c772-7eb0-97f4-c87947d64866/exec-ff3840c0-e968-4b2f-909d-3a2ff6d2661f.png
2. **02-the-game.png** — new generation using 01-home.png as a brand/style reference only, not an edit target. Original: C:/Users/Admin/.codex/generated_images/01a1a497-c772-7eb0-97f4-c87947d64866/exec-46d31be9-22f7-4102-bb81-f1a91ff6074e.png
3. **03-guide.png** — new generation using 01-home.png as a brand/style reference only, not an edit target. Original: C:/Users/Admin/.codex/generated_images/01a1a497-c772-7eb0-97f4-c87947d64866/exec-57853a1a-2750-4189-9e49-c70a80e77f1e.png

## Full prompt — 01-home.png

```text
Use case: ui-mockup
Asset type: high-fidelity public website design direction, one complete desktop homepage viewport.
Primary request: Design a beautiful public website for NEARlyHuman, the small retro AI-led virtual life game, as “The Little Almanac”: the website has the typographic authority and quiet craft of an old printed field almanac or game instruction manual, expressed as a modern usable website. Create ONE image, landscape 1536 by 1024. This must look like an actual website screenshot, not a photographed book, presentation slide or moodboard.
Style and composition: ivory paper #F5F0E4 across the full browser viewport, a faint warm stock texture barely visible, oxblood #702E2A ink, dark brown-black text, ochre and soft sage pixel accents. Strong asymmetrical editorial grid with generous whitespace. Sophisticated large book serif headline; clean humanist sans body and navigation; tiny monospaced folio labels. All body text clear and comfortably readable. Simple squared corners, delicate rules. No generic feature cards, no rounded dashboard widgets, no decorative torn paper, tape, collage or scrapbook elements. Keep modern web usability.
Layout: slim top header with NEARlyHuman wordmark at left in oxblood serif, quiet The game and Guide links at right, and a prominent filled oxblood “Open App ↗” button, white lettering. Hairline below. Main left column about 44% width: small eyebrow “AN AI-LED LIFE GAME”; huge beautifully set headline, split over three lines “A little life. / A mind of / its own.” Below, modest body “Hatch a rooster. Leave a few supplies. See what it makes of the day.” One filled oxblood “Open App ↗” button then quiet text link “Read the guide →”. Small line below “NEAR + Robinhood · Testnet”.
Right half: a single substantial crisp pixel art environmental vignette of an empty small timber home with ochre roof, open domestic cutaway at top, and its four productive raised garden beds, orderly path, small outgoing mailbox and wood workbench. Top-down compatible 2D retro game pixel art, small earthy pixel grid, dappled late-afternoon light; precisely hard pixel edges with tasteful limited palette. No perspective isometric 3D. No creatures or birds of any kind. The vignette is NOT an app screen, no game HUD. Present as a simple rectangular slightly offset illustrated “plate” integrated into paper, edged with one fine oxblood frame and tiny folio corner markers; no floating island. Add short readable caption beneath: “FIELD NOTES / A home, a garden, a day of its own.” Atmospheric but coherent; do not overfill.
Bottom visible band separated by fine horizontal rule: three short editorial text blocks in a row, not cards: “01 Hatch a life.” “02 Pack a little post.” “03 Watch its day unfold.” with small quiet one-line explanatory copy. At bottom left a gentle reassurance “Nothing ages while you’re away.”
Constraints: public marketing design around existing game, not game/app redesign. No wallet dialog, portraits, new rooster, chicken, egg-shaped character, mascot, humans, animals, photo, 3D or vector cartoon. Do not draw a new bird. No financial returns, prices, fake users, profit, token charts, testimonials, partners, social icons, claims of mainnet or offline aging. No fake browser chrome. Text should be spelled correctly; prioritize the headline, brand, navigation, Open App and the three verbs. This is a polished usable home viewport, not a full website shrunk to tiny type.
```

## Full prompt — 02-the-game.png

Input image: this set's 01-home.png, solely as brand/style reference.

```text
Use case: ui-mockup
Asset type: high-fidelity MOBILE public website page, one complete readable mobile composition.
Primary request: Create ONE distinct second page in the NEARlyHuman website concept “The Little Almanac”. Use the provided previous homepage ONLY as brand/style reference, not an edit target; preserve its warm ivory stock, oxblood rules and serif/sans editorial voice. This image is the public “The game” page on a PHONE. Portrait aspect ratio 1024 by 1536, edge-to-edge mobile web screenshot; no device hardware, no surrounding presentation board or desktop. Make the site feel genuinely adapted to a 390px phone: generous readable type, short lines, no tiny desktop columns. The body content is a simple flowing printed manual, not cards.
Header: compact NEARlyHuman wordmark left, a quiet small menu icon, filled oxblood “Open App ↗” at right. Fine ruled divider. Small breadcrumb “THE GAME / FIELD GUIDE 01”.
Main: large serif heading “You prepare. / They decide.” then clean sans introduction “Hatch a rooster. Leave a few supplies. See what it makes of the day.” Keep header, heading and first small image visible without scrolling.
Below hero: a small crisp pixel-art environmental strip, top-down compatible, showing an empty home doorway, four little garden beds and path, warm timber, sage and ochre. No animal, bird, rooster, chicken, egg character or human; no game HUD. It is decorative editorial illustration, not a fake app screenshot.
Follow with THREE substantive stacked numbered manual steps separated by thin horizontal rules, no boxes:
“01  Hatch a life.”
“Choose a testnet world, name your rooster and hatch its NFT.”
Beside this text or in small margin, a simple pixel house key object.
“02  Pack a little post.”
“Choose up to three different supplies, with at most one seed or sapling.”
Beside it, small crisp pixel bread, water bottle and closed seed packet objects. No fake controls or new gameplay.
“03  Watch its day unfold.”
“Jev chooses the project and small routines. The day is saved before its film plays.”
Beside it, a small crisp pixel mailbox and workbench objects. These editorial object vignettes are tiny, sparse and do not dominate text.
End with one quiet reassurance band “Nothing ages while you’re away.” and a simple Guide link “Your first day →”. At bottom, small factual footer “NEAR + Robinhood · Testnet”. The top header Open App remains the strongest colored control. Keep ample breathing room and manually balanced editorial hierarchy. The whole portrait is a coherent mobile public explainer page with comfortably readable short text.
Avoid: bird or rooster art of any kind; no redrawn canonical mascot; no invented game outcome, sample profits, prices, shipping promises, metrics, testimonials, logo wall, wallets, mainnet, offline aging. No phone bezel, mockup shadows, photo texture, book photographed at angle, scrapbook, sticker collage, rounded SaaS cards, desktop multi-column layout or dashboard. Crisp pixel imagery and quiet normal body font. Match the visual quality of the first image while using genuinely different mobile layout.
```

## Full prompt — 03-guide.png

Input image: this set's 01-home.png, solely as brand/style reference.

```text
Use case: ui-mockup
Asset type: high-fidelity desktop player documentation article for a public game website.
Primary request: Create ONE new third image for NEARlyHuman’s “The Little Almanac” website direction. Landscape 1536 by 1024, a clean, fully usable guide article. The provided homepage is ONLY a brand/style reference, not an edit target. Keep warm ivory paper, oxblood fine rules and serif headings, but make this a quieter reading surface with normal comfortable sans-serif article body. It must look like a real web guide screenshot, not a book spread, slide, poster or sparse landing-page hero. Clear hierarchy, legible text, genuinely useful article content.
Shared header: compact oxblood NEARlyHuman wordmark left, search field “Search the guide…” middle with tiny magnifier, quiet “The game” and “Guide” links right and filled oxblood “Open App ↗” button. Thin ruled divider. No wallet dialog.
Desktop layout: generous page gutters; grouped left guide index about 240px wide, central readable article about 760px wide, small right page contents about 190px. Vertical fine rule separates left index from reading surface; no card grid. All body paragraphs in crisp clean humanist sans-serif. Serif only for title and section heads. Little monospaced folio numbers and overlines. Quiet warm gray text, strong contrast, lots of breathing room.
Left sidebar text:
“PLAYER HANDBOOK”
“START HERE”
“Your first day” [current page, slim oxblood indicator and soft ivory-red highlight]
“Worlds & wallets”
“LIFE AT HOME”
“Care”
“Garden”
“Workshop”
“Weather & visitors”
“WHAT YOU OWN”
“NFT & purse”
“NHC”
“Sharing & transfers”
“UNDER THE HOOD”
“Jev & saving”
“Contracts”
“Help”
Bottom quiet return link “← Back to website”.
Central main article: breadcrumb “Guide / Start here”, large beautiful serif title “Your first day”, intro “Choose up to three supplies. Your rooster decides how to use them.” Then a slim pixel-art strip of a closed parcel, bread, water bottle and seed packet on warm paper, optional small caption “You prepare the possibilities.” No birds, no characters, no app controls. This is an editorial object illustration, not a game screenshot.
Four numbered practical article sections, with comfortably readable concise copy:
“01  Choose a world”
“NEAR Testnet uses Meteor. Robinhood Testnet uses Rabby or another EVM wallet. These are separate lives and inventories.”
“02  Hatch your rooster”
“Open the app, choose a name and connect the wallet for your world. Hatching needs testnet funds.”
“03  Pack its first post”
“Choose up to three different supplies, with at most one seed or sapling. The app shows the day’s preparation fee before you confirm.”
“04  Watch the day”
“Jev chooses its project and small routines. The completed day is saved before its film plays. Nothing ages while you’re away.”
Article bottom thin rule and next-article text “Next: Worlds & wallets →”.
Right page contents in normal small legible text: overline “ON THIS PAGE”; “Choose a world”; “Hatch your rooster”; “Pack its first post”; “Watch the day”. Lower a small unboxed note “Need a hand?” with quiet “Read Help →”. Tiny pixel sprig, no decorative clutter.
Constraints: keep all steps clear and truthful. Browsing guide is wallet-free; no connection panel. No prices, returns, trading, merchants, bridge, mainnet, direct chat, live outcomes, offline aging, profit, user counts, audit badge, social proof or invented feature. No bird, rooster, chicken, animal, egg mascot or human in any art. No game/app redesign. No giant pixel body text, generic SaaS cards, scrapbook, torn paper, tape, photographed manual or fake browser chrome. The guide should feel calm, practical and usable, yet visibly from the same editorial brand.
```
