# 06 — Little Life Archive

Research and image exploration only. Created 4 November 2026. Three independent built-in image-generation calls produced three final PNGs; no application, game, contract, routing or deployment changes were made.

## Concept

A small life can be understood as a collection that continues: a home, belongings, saved intentions and a history, all carried by its NFT. “Little Life Archive” gives that idea a joyful contemporary exhibit identity. The homepage is one large framed specimen rather than a feature-card grid. The lilac mount connects the house, four beds, possessions and saved days, while the editorial left column explains the emotional premise immediately.

The interface uses warm ivory (`#F4F0E7`), deep blue-teal ink (`#173E43`), terracotta (`#B94D39`) for Open App, and pale lilac (`#D9CFF0`) for illustrated specimen mounts. Rounded humanist headings and ordinary sans-serif body text keep it friendly; small monospaced captions, corner ticks and hairlines make it feel authored and precise. Color values are intended production tokens, not a claim of exact sampled raster colors.

## Three pages

- **01-home.png — Homepage.** A complete desktop first viewport. The single environmental exhibit shows home, possessions and saved-day imagery together, with a short proposition and a clear app entrance. “Illustrative example” identifies the display. The bottom ownership band makes the NFT metaphor tangible without a price, balance, fabricated collection size or sales activity.
- **02-the-game.png — The game, desktop and phone.** One separate generation contains a desktop layout beside a substantial readable mobile adaptation. The continuous three-step exhibit shows Hatch / Pack / Watch with an egg, actual supply categories (water bottle, bread and seed packet), and a workshop scene. The three-supply and one-productive-seed limit are visible. The phone has its own stacked layout and visible Open App rather than shrinking a desktop page.
- **03-guide.png — Your NFT & its purse.** A real article with grouped navigation, search, on-page contents, return context and Open App. It explains NFT-bound home/belongings/intentions/purse rights, backed token allocation, possible finished-goods shipping, current-owner withdrawal including after death, transfer of the saved life and purse rights, pending transfer locks, separate testnet worlds, no bridge and no promised cash redemption.

## Mobile behavior

Image 02 explicitly demonstrates phone navigation and reading. The wordmark and Open App share a compact header; The game and Guide remain a separate short row. Step numbers stay visible, images become modest full-width mounts or inline specimens, and normal body type remains legible. Text is not baked into production images.

For the homepage at a narrow width, the short heading and a compact portion of the exhibit appear together before long explanatory sections. The ownership exhibit then follows the copy, with a vertical connection between Home / Belongings / Saved days; avoid squeezing the entire wide mount into a tiny thumbnail. Keep Open App immediately visible.

For docs, hide the permanent left sidebar and right contents rail at phone widths. Replace them with “Guide contents” and “On this page” controls above the article. Keep search, the current title and Open App available. Stack the four ownership specimens in a short two-by-two explanatory strip only if captions remain comfortably readable; otherwise use one horizontal scroll region with an explicit edge hint. Ordinary article text stays the main surface.

## Motion

All copy, navigation and Open App should render immediately. The exhibit may have two or three small optional loops: a window glint, a subtle mailbox flag movement, a plant swaying by one pixel. Saved-day frames can change only on an intentional interaction. The archive leader lines and text remain still. Hover/focus on a labelled specimen could lightly tint its existing mount and reveal a useful caption, with no required animation. Respect reduced motion and never load the game engine merely to read a guide. Do not show an owner's unrevealed upcoming Jev choice on the public website.

## Artwork and factual boundaries

The owner's procedural rooster remains canonical. No rooster, chicken, bird or substitute mascot was generated in these images. The egg, parcel, journal, purse, supplies and environments are exploratory generated illustration. The environments interpret the supplied pixel language; they are not screenshots or literal captures of the current home layout. A production game or portrait insert must come from the existing `src/art/rooster.ts` / `rooster-data.ts` generator, preserving its seed, shape, palette, accessories and pose.

The home’s saved-day miniatures and game-page workshop are visibly illustrative; there is no real NFT ID, owner, balance, sale, live feed, fabricated statistic or promised outcome. The seed/bread/water specimen is a marketing explanation, not a new supply-packing interface or app redesign. Both worlds are testnets and remain separate. The guide’s ownership text is grounded in the current README and shared factual research. It makes no bridge, mainnet, offline aging, merchant, player-trading or trustless-AI claim.

In a production copy pass, change the phone shorthand “Save first, then watch” to “The day is saved, then its film plays” so that the automatic save order cannot be mistaken for a new player-operated Save control.

## Strengths and tradeoffs

**Strengths:** the NFT is communicated through concrete continuing life, not finance; the central mount joins home and possessions instead of scattering isolated feature cards; strong single-action contrast and generous typography; the same identity becomes both a phone explainer and a readable detailed article; all three pages have materially different content and composition.

**Tradeoffs:** without an exact canonical rooster insert, this exploration underrepresents the individual companion that owners will care about. The exhibit metaphor can feel slightly static; production should add restrained environmental motion and genuine saved examples while preserving immediate reading. The generated house is richer and more compressed than actual gameplay, so use real environment crops or carefully implemented website art after selection rather than treating this raster as product evidence. The repeated framing and corner ticks can become busy if applied to every object; reserve them for major teaching moments. Desktop docs use three columns; the phone must collapse both side rails.

## Inputs reviewed

- `AGENTS.md`, `README.md`.
- `design/website-exploration/SHARED_BRIEF.md`, `RESEARCH.md`, and all three `research/*.md` files.
- Visually inspected source-site captures: `reference-captures/neko-how-desktop.png`, `aavegotchi-desktop.png`, `near-docs-desktop.png`.
- Visually inspected actual game/environment references: `docs/refinements/environment-color/garden-after.png`, `living-after.png`, `workshop-after.png`.
- Source-site art was studied for hierarchy and behavior only. No source-site art or logo was passed into generation or copied.

## Generation provenance and verification

Built-in `image_gen__imagegen`, normal opaque PNG generation. No CLI, external image API or programmatic image drawing was used. Each deliverable was made by one separate image-generation call, three calls total. Image 01 was generated without image inputs. Images 02 and 03 each used the selected Image 01 as their sole visual-system reference. Final images were inspected visually; the delivery files were checked for dimensions and SHA-256 hashes. No major factual/layout/artwork violation required a replacement call.

Original tool outputs, retained by the tool:
- 01: `C:/Users/Admin/.codex/generated_images/01a1a49e-5b0e-7b93-9f9a-88123ade0d9d/exec-ee05862d-8f4d-4502-9d35-d66f1f80fc8c.png`
- 02: `C:/Users/Admin/.codex/generated_images/01a1a49e-5b0e-7b93-9f9a-88123ade0d9d/exec-7dcfa38a-922d-4882-8ece-e7cdff4d8032.png`
- 03: `C:/Users/Admin/.codex/generated_images/01a1a49e-5b0e-7b93-9f9a-88123ade0d9d/exec-a878f3d0-3ab8-496b-bc23-f54d07fa6295.png`

The selected PNGs are copied into this permanent set folder and have no dependency on TEMP or the default tool-output directory. Dimensions and hashes are in `manifest.json`.

## Full prompts

### 01 — Homepage

```text
Use case: ui-mockup.
Asset type: one finished high-fidelity desktop public website homepage mockup for NEARlyHuman, design exploration 06 “Little Life Archive”. Render one flat screen, landscape 1536 by 1024 pixels, edge-to-edge website UI, no browser chrome, no device mockup, no collage of alternative pages.
Primary request: A distinctive authored website for a retro AI-led virtual pet NFT game, with the identity of a joyful small living archive / intimate contemporary museum exhibit. Show a little domestic life, its home, possessions and saved history as one collection. Elegant, friendly and precise, not financial, not generic SaaS, not antique scrapbook.
Visual system: warm ivory #F4F0E7 full background, very dark blue-teal #173E43 ink, vivid warm terracotta #B94D39 single primary button color, pale lilac #D9CFF0 large art mount, sparse sunny ochre accents. Clean humanist sans body typography, substantial gently rounded humanist display heading. Tiny monospaced archival captions and hairline teal rules. Flat color, perfect generous spacing. No page texture, gradient, 3D, shadowed cards or decorative fake aged paper.
Composition: 1440-ish content width with 58px side margins. Top 96px header: text wordmark “NEARlyHuman” on left with a tiny square seed/house glyph, quiet nav “The game” and “Guide” on the right followed by a clearly filled terracotta “Open App ↗” button. Below, split 42/58 editorial hero. Left column begins small overline “A LIVING LIFE ARCHIVE”. Then large headline, four comfortable lines, exactly: “A little life.\nA mind of\nits own.” Under it two readable lines: “Hatch a rooster. Leave a few supplies.\nSee what it makes of the day.” Then exactly ONE terracotta hero “Open App ↗” button and quiet inline “Meet the game →” text link. Below, a small hairline and readable note “NEAR + Robinhood · Testnet” and “Nothing ages while you're away.”
Right hero is one striking big precise lilac specimen mount, architectural and playful, 700px wide by 575px high, with a thin teal rectangular border and corner ticks. At its top a slim caption strip says “A LIFE, COLLECTED” left, “Illustrative example” right. On this mount show a large crisp pixel-art TOP-DOWN CUTAWAY domestic home and adjoining garden, no roof, no perspective, directly connected plank rooms, terracotta rug, teal sink, wooden workbench, potted plants, mailbox outside and four raised rectangular beds in the garden. Use chunky 16-bit pixels consistent with a small browser game, honey wood and grass green with teal details. No characters, no birds, no animals. This is environmental art, not actual gameplay UI. Leave the house visible and legible.
Around edges of the single art mount use only three small annotation tags attached by thin straight teal leader lines: “HOME”, “BELONGINGS”, “SAVED DAYS”. At lower right inside mount, a small framed pixel toy boat and a small parcel support “BELONGINGS”; at lower left a tiny row of overlapping rectangular saved-day thumbnail frames supports “SAVED DAYS”. No numbers, token IDs, balances or fake data. One circular ivory egg specimen, not bird art, may sit above the house in a small circular inset.
Under hero across screen a full-width thin-rule statement band: left small label “ONE NFT”; center large sentence “Its home, belongings and little history.” Right quiet text link “How a life works →”. At bottom edge a short three-word index on a continuous single ruled line “01 Hatch / 02 Pack / 03 Watch”, not three cards.
Exact copy should be clean and readable at desktop size. Keep the tone welcoming and concrete. Maintain one main action wording “Open App” throughout. Do not invent live activity, collection counts, fake sales, profits, guaranteed AI outcomes, wallet dialog, user quotes, mainnet or partner logos. Do not draw a rooster, chicken, bird or new mascot anywhere. Canonical rooster artwork is deliberately absent and would be inserted from the existing procedural generator during production. No other animal characters.
```

### 02 — The game + phone

```text
Use case: ui-mockup.
Asset type: second finished high-fidelity website mockup for NEARlyHuman / concept 06 “Little Life Archive”, showing the substantive “The game” page and its readable mobile adaptation. One landscape image 1536x1024. Flat UI screenshots on a simple pale lilac presentation canvas: left a large desktop webpage 1050px wide by 990px high, right a 390px wide phone webpage by 920px high. Very narrow surrounding margins, tiny “Desktop” / “Mobile” labels outside screenshots optional. No physical devices, no perspective, no extra alternative pages.
Input reference: reference image 1 is the homepage VISUAL SYSTEM ONLY. Preserve its warm ivory, deep blue-teal ink, terracotta filled Open App button, lilac art mount, thin ruled exhibit labels and gently rounded humanist sans typography. This is a NEW page, do not reproduce the home hero or house collage.
Primary request: explain the actual three-part rhythm as one continuous vertical exhibition. Refined, cheerful, precise, friendly, retro game pixels in the art, comfortable web typography elsewhere. No generic feature-card grid, no software-window UI.
Desktop composition: matching ivory header with “NEARlyHuman” wordmark, “The game” active with thin underline, “Guide” quiet and terracotta “Open App ↗” action. Below 40px margins: overline “THE GAME / THREE SMALL RITUALS”. Large title “You prepare.\nThey decide.” and short introduction “A few supplies. A little freedom. A day worth watching.”
Below create three horizontal exhibit rows connected by a fine vertical numbered line; editorial rows, not cards. Each row has left 210px square-ish lilac pixel-art specimen and right 620px content. Use generous 25px text, keep everything readable.
Row 01: one simple CREAM PIXEL EGG in a precise thin-line specimen mount, no animal or creature. Heading “Hatch a life”. Body “Choose a testnet world, name your rooster and hatch its NFT.” Small footer caption “A home and a new beginning.”
Row 02: inside pale lilac rectangular mount place THREE separate chunky crisp pixel objects: a capped WATER BOTTLE, a loaf of BREAD and a SEED PACKET bearing a small leaf. Give clear tiny labels below the objects “Water” / “Bread” / “Seed”. NO watering can. Heading “Pack a few possibilities”. Body “Up to three different supplies. At most one seed or sapling.” Smaller line “You choose what to send. Your rooster chooses how to use it.”
Row 03: a no-character TOP-DOWN pixel workshop with honey-wood floor, a workbench and tiny toy boat, exact art style as reference. Heading “Watch a day become history”. Body “Jev chooses. The day is saved onchain before its film plays.” Smaller line “Your next day stays a surprise.” Thin caption underneath art “Illustrative saved-day scene”.
Desktop bottom full-width ruled strip: “Nothing ages while you're away.” left, quiet “Read the guide →” link right.
Mobile adaptation: TRUE readable 390px responsive page on ivory, no device border. Header wordmark “NEARlyHuman” 18px and terracotta “Open App ↗” 15px, quiet compact nav row “The game” active / “Guide”. Large 34px title “You prepare.\nThey decide.” directly followed by one-line summary. Vertically stack three compact numbered sections; at 01 show the egg small at right of text, at 02 show water bottle/bread/seed icon strip with clear labels and the three-supplies fact, at 03 show a cropped clean top-down workbench scene with caption. Mobile normal text at least 17px, generous line height, clear boundaries; not a shrunken desktop screenshot. On mobile visible text should be:
“01  Hatch a life”
“Choose a world. Name your rooster. Hatch its NFT.”
“02  Pack a few possibilities”
“Up to three supplies. One seed or sapling at most.”
“03  Watch its day”
“Jev chooses. Save first, then watch.”
At bottom “Nothing ages while you're away.” and quiet “Guide →”. Include small “Testnet” in mobile header nav if space.
Constraints: No characters, birds, chickens, rooster drawings or substitute mascots anywhere. The owner's canonical rooster would be inserted from the existing generator at production, never regenerated. No app redesign or wallet popup. No fake NFTs or actual-looking token IDs, no metrics, no investment/earning promises, no mainnet, no market, no offline activity, no invented controls. Homepage reference is for coherent color/typography only. Preserve immediate one consistently named action Open App. Crisp polished website visual, no tiny unreadable text.
```

### 03 — Ownership guide

```text
Use case: ui-mockup.
Asset type: third finished high-fidelity desktop website screenshot for NEARlyHuman / concept 06 “Little Life Archive”. A real usable Guide article called “Your NFT & its purse”. One landscape 1536x1024 image, flat edge-to-edge web UI, no browser chrome, no perspective, no collage, no device frame.
Input reference: reference image 1 is the homepage, VISUAL SYSTEM only. Match its ivory background, dark blue-teal ink, pale lilac specimen mounts, terracotta main Open App action, gently rounded humanist headings, clean sans body, tiny monospaced archive captions, thin hairline rules and small pixel house logo. This is a quiet documentation article; lower the decorative volume and preserve reading comfort.
Primary request: a delightful contemporary life archive becomes a trustworthy, clear player guide. Full width header about 86px tall: same “NEARlyHuman” logo/wordmark on left, “The game”, active “Guide”, terracotta “Open App ↗” on right. Next line: a compact left return link “← The website”, wide simple search box “Search the guide…” with search icon. No wallet dialog.
Below, proper three-column docs layout. Left sidebar 235px with comfortable 18px text, separated from reading column by hairline: small title “GUIDE CONTENTS”; grouped navigation “Start here” with “Your first day” and “Worlds & wallets”; “Life at home” with “Care”, “Garden”, “Workshop”; “What you own” with selected lilac highlight “Your NFT & its purse”, plus “NHC” and “Sharing & transfers”; “Under the hood” with “Jev & saving”, “Contracts”, “Help”. Keep sidebar quiet and readable.
Center main article 830px wide, generous margins, body normal sans around 21px with 1.45 line spacing, heading 51px. Breadcrumb small “Guide / What you own”. H1 exactly “Your NFT & its purse”. Short introductory paragraph exactly: “One NFT carries a continuing life: its home, belongings, saved intentions and rights to its own NHC purse.”
Under intro, a single narrow pale lilac specimen strip with four small crisp retro pixel icons on one continuous horizontal connector line: a TOP-DOWN wooden house fragment, a small PARCEL, a CLOSED JOURNAL, a drawstring PURSE. Captions exactly “Home” / “Belongings” / “Saved intentions” / “Purse rights”. No bird, mascot, token symbol, amounts or token IDs. The strip's tiny caption “Ownership, illustrated” clarifies illustrative icons.
Then real article sections, ample breathing room, very legible paragraphs. Use exact section text:
Heading “A purse for this life”
Paragraph “Shipping finished goods may credit NHC to the NFT's own purse. Shipping and profit are not guaranteed.”
Paragraph “Its allocation is backed by token units in that world's contract vault.”
Heading “Rights stay with the owner”
Paragraph “The current owner can withdraw, including after the rooster dies. A remembered life keeps its NFT and purse.”
Paragraph “Transferring the NFT carries its saved life, belongings and remaining purse rights. Pending days temporarily lock transfers.”
Below a pale lilac/ivory quiet outlined callout with small title “Two separate worlds” and text “NEAR Testnet and Robinhood Testnet keep separate lives, inventories and NHC. There is no bridge.”
Small final note below in readable body: “NHC has no promised cash redemption.”
At bottom of visible article a ruled next-article link “Next: Worlds & wallets →” and small footer label “NEAR + Robinhood · Testnet”.
Right rail 220px, narrow teal rule, small heading “ON THIS PAGE”, contents links “A purse for this life”, “Rights stay with the owner”, “Two separate worlds”. Below a tiny pale lilac specimen mount holding one pixel parcel and closed journal, caption “The life travels with it.” No card grid.
Everything should fit comfortably within screen with no cramped tiny text. The focus is a real readable guide, not hero art. Keep expressive identity in small archive details and the single explanatory object strip. White space and alignment impeccable. All sections must be visibly readable, not lorem ipsum or decorative fake writing.
Constraints: no new rooster, chicken, bird, animal or substitute mascot anywhere. No invented NFT ID, collection metrics, live activity, balances, token charts, fees, mainnet, bridge, NPC merchants, user quotes, audits or earning guarantee. No claims of trustless AI or offline aging. Copy is supplied factual documentation, no invented product behavior. Do not reproduce homepage layout; adapt its brand to a calm article reading surface.
```
