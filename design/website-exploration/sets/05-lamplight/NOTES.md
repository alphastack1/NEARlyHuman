# 05 — Lamplight

4 November 2026. Three selected image mockups for owner comparison. No application implementation or deployment.

## Concept

Lamplight treats the website as the inviting view into a little home after dusk. A large centered promise sits above a long, connected cutaway of rooms and garden. This is deliberately different from a split hero or a dashboard grid: the lower scene behaves like a stage, with the typographic introduction resting in its quiet sky.

Ivory editorial serif display type, ordinary legible sans body copy, indigo navigation, amber actions and a tiny abstract four-square window mark form the identity. Pixel art carries domestic texture; it does not carry long paragraphs. The brand does not require a new mascot.

## Three selected images

- **01-home.png — 1536 × 1024.** Complete desktop entry viewport. Clear header and hero Open App actions, The game and Guide, concise factual testnet label, one connected lamp-lit home and exactly four-bed garden. A second quiet line explains the player/AI relationship and absence of offline aging.
- **02-the-game.png — 793 × 1983.** One continuous narrow responsive page, intended to scroll. Hatch, Pack and Watch stack vertically; the body is larger than in the rejected first attempt. The shelf shows a blue water **bottle**, bread and a seed packet. This is explanatory public-site imagery, not a redesigned app. A small environmental vignette shows only a partial garden; it is not a full game map.
- **03-guide.png — 1536 × 1024.** A practical Your first day article. The indigo rail holds grouped guide topics and search. The broad ivory article covers worlds/wallets, hatching and packing, saving and watching. Page contents and an app exit remain available. Ordinary body type is calm and readable.

## Evidence and reference use

Read AGENTS.md, current README.md, SHARED_BRIEF.md, RESEARCH.md and all three research/*.md files before designing. Inspected the actual garden, kitchen, living and workshop captures with view_image; also inspected the retained Parallel desktop, Neko how-to and NEAR Docs desktop screenshots. The captures informed the balance of world, verbs and reading structure, not copied art or layouts.

The first generated image used workshop-after.png as a crisp domestic pixel-material reference. The selected game page used its initial generated mobile attempt as a style reference, itself derived from the home mockup. The guide used the home mockup as an identity reference. Full prompts and file-level provenance appear below and in manifest.json.

## Artwork and factual boundaries

The original procedural rooster artwork is not drawn in any image. There are no generated birds or other characters. If selected for implementation, any rooster insert must use the exact existing generator in src/art/rooster.ts and rooster-data.ts. Those files are unchanged.

All environmental/item pictures are generated design illustrations. They are not exact current-game captures and do not propose new game mechanics, room architecture or a replacement asset system. The illustrations are slightly more detailed than the current game tiles, so production adaptation would need to match the existing artwork and rendering scale. An egg beside a doorway is a symbolic public-site illustration.

Current factual copy follows README: two separate testnet worlds, NEAR/Meteor and Robinhood/Rabby-EVM, rooster NFT, up to three different supplies with at most one seed/sapling, Jev decisions, save before film, and nothing aging while away. No metrics, token charts, merchant, direct chat, mainnet or earning guarantees were added. Future choices are not shown.

## Intended behavior and motion

Text, navigation and Open App render immediately. The environment is decorative and never blocks entry or guide reading. Later implementation could add two or three tiny loops: a warm window light settling, sparse firefly dots at the garden edge, or very slight plant movement. Use slow 6–10 second cycles, pause when offscreen and honor reduced motion. No animation belongs behind article text.

Open App is direct for new and returning visitors, with existing exact-life queries preserved by any eventual routing implementation. No wallet dialog appears on marketing or guide pages. Existing routes have not been created or changed here.

## Mobile behavior

The second image is the mobile treatment and a long scrolling page, not an entire phone viewport. At implementation use normal 18–20 CSS px body copy, comfortable line height, a compact sticky wordmark/menu/Open App header and at least 44px touch targets. Every beat stacks vertically with the image below its text. No horizontal-scrolling three-step rail is required.

The homepage would stack its title, short explanation and CTA before a purposeful environment crop; never miniaturize the whole desktop scene. Guide sidebars become Guide contents and On this page controls, with the reading surface taking full width. Keep Open App immediately visible and keep the docs wallet-free.

## Strengths and tradeoffs

Lamplight is warm, emotionally specific and distinct from a daylight farm homepage. The night shell is consistent across marketing and guide, while the guide's ivory reading plane supports real reading. The long home scene gives a sense of domestic scale without inventing a new rooster.

Contrast needs validation in actual implementation; glow should remain concentrated in artwork. The centered phone flow is calm but uses vertical space. The illustration detail needs a disciplined translation to the current game palette and canonical sprite scale. Generated screenshots are direction guides with no production accessibility or functional test claim. Search, article map and paths are proposed UI only.

## Generation and review

Built-in image_gen__imagegen only; no CLI/API fallback. Four calls produced three final selected images. One initial mobile output was rejected for side-by-side text/art that felt too compressed at phone size. A single targeted correction stacked every beat and increased type. The rejected attempt was copied only to TEMP/website-exploration/05-the-game-rejected.png; it is not a final deliverable and nothing permanent depends on it.

Each selected image was opened with view_image. Reviewed layout, text hierarchy, body readability, Open App visibility, bird absence, world/wallet pairing, supply types and key game facts. Metadata/dimensions and SHA-256 hashes are recorded in manifest.json. No source, app, chain, deployment or production-push changes.

## Full prompt — 01-home.png

```text
Use case: ui-mockup
Asset type: finished website design concept, desktop homepage, one screen.
Primary request: Create a beautiful high-fidelity public website homepage for NEARlyHuman, an intimate phone-first AI-led virtual pet game. Direction name LAMPLIGHT: warm lit windows in an expansive indigo evening. Produce ONE flat website screenshot, approximately 1536 x 1024 landscape. No laptop, browser chrome, outer presentation board, annotations or multiple screens.
Reference image role: the supplied workshop screenshot is only a reference for crisp orthogonal 2D pixel environment materials and the actual domestic game's scale. Do not reproduce its UI. Do not invent, redraw, depict or substitute any bird or rooster. Artwork in this mockup is environments and objects only.
Composition: a clean header on deep dusk indigo; left NEARlyHuman wordmark in restrained friendly geometric sans with a tiny abstract four-square lit-window mark, center-right quiet text links The game and Guide, far right a filled pale golden Open App button. Generous horizontal padding. Under the header a spacious centered typographic hero, NOT a left-copy/right-art split and NOT a card grid. The hero floats in quiet night sky. Set the huge headline in a sophisticated friendly editorial serif, normal high-quality typography (not pixel body type), ivory with a subtly warm accent on the second phrase. Headline exactly: "A little life." line break "A mind of its own." The second line can be slightly smaller. Below it set this readable two-line description: "Hatch a rooster. Leave a few supplies." then "See what it makes of the day." Under the description place filled amber "Open App" button and a modest unfilled text link "How it plays →". Small quiet factual caption underneath: "NEAR + Robinhood · Testnet".
The lower 45 percent is one long authored pixel-art domestic environment spanning almost the entire page: a strictly orthogonal 2D top-down cutaway house with a kitchen, sitting room and workbench, adjacent to a nighttime garden with exactly four productive beds, low fences, a mailbox and warm square windows. A small bread loaf and blue water bottle sit on a kitchen counter. Trees and dark hedges softly contain the scene. Crisp pixel clusters, straight perspective, clearly readable wood plank floors, rugs, lamps, tiny crop seedlings. House interior is honey-lit, outdoor foliage emerald/plum, paths muted lavender. Environment is connected and inhabited but contains NO characters, NO animals and NO birds. Avoid fake game HUD or a redesigned app. It feels like peeking into a little home after dusk, not a cinematic haunted house. Pixel art is crisp, not blurry gradients, vector, 3D or handpainted.
Small quiet stars in the upper sky; extremely restrained scattered firefly light dots at garden edges. Keep all text against quiet solid areas. Lower page edge has one thin rule and two short calm text blocks: "You prepare. They decide." and "Nothing ages while you're away." There can be a tiny down-arrow to indicate a longer page, but do not cram additional sections.
Palette: deep readable indigo #20243f, jewel blue #30375d, warm ivory #fff1cf, amber #f1c36b, emerald foliage, muted lilac. Night is welcoming and gentle, never gloomy. Rounded rectangular buttons with a tiny pixel-cut corner, thin quiet lines, generous space. Typography impeccably legible; real navigation, clear hierarchy, balanced margins. No gradients behind text, no neon, no crypto charts, no wallet modal, no metrics, no fake partners, no earning promises, no economic dashboard, no extra claims. Primary Open App is immediate and unmistakable.
```

## Full prompt — initial mobile attempt (rejected)

```text
Use case: ui-mockup
Asset type: high-fidelity mobile website design, The game page, one continuous phone viewport design.
Primary request: Create the SECOND image of the LAMPLIGHT website concept for NEARlyHuman. The provided first image is a style reference: match its deep dusk-indigo background, warm ivory and amber type, small four-square window mark, quiet stars, crisp cozy domestic pixel art, gently pixel-cut amber buttons, editorial serif display voice. This is a different page and a MOBILE layout, not a crop or palette variant of the homepage.
Output: ONE tall flat mobile website screenshot, about 900 x 1600 pixels, a 390 CSS pixel page scaled for inspection. No physical phone, device frame, browser chrome, outer board, annotations, desktop panels or second screen. Main text should be generously sized and readable. Design a coherent phone page that fits the whole screenshot without a huge empty sky or crammed tiny text.
Header: compact four-square window icon and "NEARlyHuman" at upper left, modest menu icon and an amber "Open App" button at upper right. Add a quiet "← Home" link just below, then a small uppercase eyebrow "THE GAME".
Large ivory serif title on two lines: "You prepare." and "They decide." Body beneath in a plain legible sans: "Hatch a rooster. Leave a few supplies. See what it makes of the day."
Main layout: A flowing VERTICAL editorial explanation, no generic feature-card grid, separated by thin understated rules. Three numbered beats with short text plus restrained environment/object illustrations. The number is in a tiny amber square at the left margin, with strong heading and body to its right.
Beat 01 heading exactly "Hatch a little life". Body exactly "Choose a testnet world and hatch a rooster NFT." Illustration is a small uncracked cream egg beside a warmly lit empty doorway. NO rooster, NO chicken, NO animal, NO character of any kind. The illustration is symbolic public-site art, not a game screen.
Beat 02 heading exactly "Pack a few possibilities". Body exactly "Choose up to three different supplies. At most one seed or sapling." Beneath the sentence, three horizontally arranged little pixel objects with clear labels: an actual small blue water BOTTLE labelled "Water"; a bread loaf labelled "Bread"; a closed seed packet with a daisy symbol labelled "Seeds". No watering can in the supply row. Show these as explanatory objects on a wooden shelf with subtle violet shadow, not interactive app controls, no totals, prices or invented balances.
Beat 03 heading exactly "Watch its day unfold". Body exactly "Jev chooses the projects and little routines. The day is saved before its film plays." Under this text show one wide, crisp orthogonal pixel-art cutaway domestic vignette of an empty warm-lit kitchen connected to a night garden path and mailbox. Include no birds or other characters, no fake HUD, no countdown, no unrevealed intentions, no named day's outcome. A small caption reads "A home, a garden, a workbench."
Bottom: warm ivory reassurance strip with dark indigo text "Nothing ages while you're away." Then a large full-width amber "Open App" button and a quiet text link "Read the first-day guide →". Footnote "NEAR + Robinhood · Testnet". Keep all UI within safe margins and visible. The final page should feel cozy, balanced, grounded and delightful to read, with atmosphere at the edges and solid dark surfaces behind text.
Constraints: preserve factual copy and hierarchy. Canonical procedural rooster is intentionally omitted from these exploratory environmental visuals; NEVER generate a new rooster or animal. No profit or earning promises, no mainnet, no social login, no direct chat, no offline aging, no traders, no stats or partnerships. No extra mechanic, no actual app redesign. Pixel art crisp 2D at consistent scale, not 3D, not vector. Use serif only for headline/short headings; readable normal sans body and button text.
```

## Full prompt — selected 02-the-game.png correction

```text
Use case: ui-mockup
Asset type: responsive mobile website screenshot for NEARlyHuman, The game page, readable narrow single-column correction.
Primary request: Recreate this supplied LAMPLIGHT style-reference mobile page as a TRUE narrow-phone responsive layout. Preserve the design identity and factual story but correct the current mobile layout problem: ALL content must stack vertically in ONE COLUMN. No text beside art, no two-column rows, no desktop layout compressed down. The output is ONE tall flat screenshot of a mobile web page, approximately 1024 x 2560 pixels, corresponding to 390 CSS px wide with readable 16-18 CSS px body type. At this render scale make BODY text around 42-46 pixels, headings 60 pixels, primary title 90 pixels. Navigation 36 pixels. Readability outranks decorative art. No phone frame, no outside presentation board, no annotations.
Identity: warm ivory and amber on deep dusk indigo, subtle stars, four-square lit-window logo, large confident editorial serif headlines, plain legible sans body, cozy crisp pixel environment/object art, amber Open App buttons with small cut pixel corners. Match supplied style reference, do not copy exact arrangement.
Top bar in one compact horizontal line: small window mark, "NEARlyHuman", right "Open App". Keep full brand and action readable; secondary nav can be a menu icon. Below: small "THE GAME" eyebrow, title exactly "You prepare." line break "They decide." Intro body exactly "Hatch a rooster. Leave a few supplies. See what it makes of the day." This body MUST WRAP into three short readable lines instead of one long line.
Then three sections in a SINGLE VERTICAL FLOW with thin amber dividing lines. Each section's number, heading and all explanatory text are at full mobile width ABOVE its small illustration. Never put text and illustration side by side.
01 "Hatch a little life". Body: "Choose a testnet world and hatch a rooster NFT." Body wraps in 2 or 3 lines. Small centered illustration below: a cream uncracked egg by a warm lit doorway. No bird or animal.
02 "Pack a few possibilities". Body: "Up to three different supplies. At most one seed or sapling." Body wraps in 2 or 3 lines. Below: three small crisp pixel objects on a simple wood shelf: a blue water BOTTLE, bread loaf, daisy seed packet. Large normal labels below exactly "Water", "Bread", "Seeds". These are explanatory objects, not interactive app controls. No watering can.
03 "Watch its day unfold". Body: "Jev chooses the projects and little routines. The day is saved before its film plays." Body wraps in 3 or 4 readable lines. Below: a shallow SMALL environmental pixel vignette of an empty warm kitchen and dark garden/mailbox, not a dominant huge scene. No fake HUD, no named day, no spoilers, no rooster or other character.
Bottom: a simple warm ivory strip with 2-line text exactly "Nothing ages while you're away." A filled large amber "Open App" button below. Then quiet "Read the first-day guide →" link. Small footnote "NEAR + Robinhood · Testnet".
Constraints: this is an actual readable phone web layout, not a poster. Keep comfortable 28 CSS px side margins, consistent vertical spacing and large type. Make page taller if needed. Art supports the explanation and never crowds text. Omit all animals, birds and new rooster designs. No invented mechanics, economic claims, mainnet, direct chat, offline aging or fake metrics. Original rooster remains canonical and is not depicted in generated art.
```

## Full prompt — 03-guide.png

```text
Use case: ui-mockup
Asset type: high-fidelity public game documentation webpage screenshot, practical guide article, ONE desktop viewport about 1536 x 1024.
Primary request: Create the THIRD image for NEARlyHuman's LAMPLIGHT website direction. Supplied homepage is a style reference for identity only: indigo evening, warm lamplight, ivory serif headings, four-square window mark and amber pixel-cut Open App button. Now show how this expressive game brand becomes a QUIET, USABLE, HIGHLY READABLE DOCUMENTATION SITE. This is a real guide article layout, not another homepage or poster. ONE flat website screenshot, no browser chrome, no laptop, no outer board or callout annotations.
Structure:
Global header, deep indigo, around 88px tall: window mark plus "NEARlyHuman" left, quiet links "The game" and "Guide" right with Guide active, filled amber "Open App" far right. Main canvas beneath has a deep indigo left guide-navigation rail about 260px wide, a generous warm ivory article surface across most of the remaining page, and a narrow muted ivory right page-contents column. Indigo peeks around the reading canvas but never behind body copy. Tiny quiet stars may appear only on outer indigo edges. Art is just a small lamp-lit window motif at upper right, no large environment interrupting reading.
Left rail: readable high-contrast ivory normal sans. At top "Guide" title, then a visibly usable search field labelled "Search the guide" with magnifier. Grouped small uppercase amber labels with topic links below:
"START HERE": "Your first day" (active, filled warm ivory with dark text), "Worlds & wallets".
"LIFE AT HOME": "Care", "Garden", "Workshop", "Weather & visitors".
"WHAT YOU OWN": "NFT & purse", "NHC", "Sharing & transfers".
"UNDER THE HOOD": "Jev & saving", "Contracts", "Help".
At rail bottom a quiet "← Back to website".
Article content: broad comfortable margins, article text max about 690px, ordinary crisp sans body around 20px, dark indigo ink. Editorial serif only for large title; docs body must not be pixel font. Short breadcrumb at top: "Guide / Start here". Large title exactly "Your first day". Intro in slightly larger sans exactly "A small start, and a little room for surprise." Then a fine rule and THREE practical article sections, each with a visible small amber number and a clear normal heading:
1. "Choose your world"
Body: "Open App, choose a testnet world, then connect its matching wallet."
A compact simple two-row ruled table, no economic styling:
"NEAR Testnet" | "Meteor"
"Robinhood Testnet" | "Rabby / EVM"
Small caption "These are separate worlds, with separate lives and inventories."
2. "Hatch, then pack"
Body: "Hatch your rooster NFT. Choose up to three different supplies, with at most one seed packet or sapling."
A small inline row of crisp pixel objects can sit at right of the paragraph or below it: a BLUE WATER BOTTLE, bread loaf, daisy seed packet. No watering can. Keep it secondary to text, no giant illustration, no UI redesign.
3. "Save, then watch"
Body: "Review the day quote and confirm when ready. Jev makes the choices. The day is saved before its film plays."
Small note below: "New choices stay hidden until they happen."
A soft pale-amber reassurance callout reads exactly "Nothing ages while you're away."
At article bottom a thin divider and a clear next-article link "Next: Care & supplies →". Do not include a large footer that makes text tiny.
Right contents column: title "ON THIS PAGE", then "Choose your world", "Hatch, then pack", "Save, then watch", in short readable dark text. A small simple pixel desk-lamp beside an amber square window can anchor the corner. No characters or animals. A quiet small text link "Open App ↗" here is optional; the header's main action remains clear.
Style and finish: polished, warm, professional docs with dependable reading rhythm, generous line heights, legible column proportions, no tiny copy. Warm ivory #fff3d8 reading plane, dark indigo ink, golden amber accents, muted violet rules. Main article looks like a useful modern handbook in a lit room. Dusk atmosphere belongs to navigation and edges. No card-grid homepage. No metrics, charts, profit promises, mainnet claims, direct chat, traders, fabricated audit/partner badges or instructions to pay twice. Canonical rooster art is intentionally absent: do not draw a bird or any character. Only environments and objects in generated art.
```
