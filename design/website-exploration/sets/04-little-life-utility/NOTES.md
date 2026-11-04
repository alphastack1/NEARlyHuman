# Little Life Utility — concept 04

Created 4 November 2026 for the NEARlyHuman website exploration. Research and visual mockups only. No app/source/chain/routing/deployment edits.

## Concept

A friendly small-life game presented as a useful old desktop program: lavender dotted surround, a single framed website surface, cobalt title strips, cream content, ink outlines and pale lime entry buttons. The visual grammar comes from tabs, status bars, separators and compact manual diagrams rather than hardware nostalgia. The site introduces the game and hands the visitor to the existing app.

## Deliverables

- **01-home.png** — Complete desktop entry viewport. Immediate emotional proposition, visible Open App in navigation and hero, environmental house/garden preview, a short three-step strip and the away-time reassurance. The garden shows four productive beds. It is explicitly an illustrative environment, without a generated rooster.
- **02-the-game.png** — A different substantive website page. Three ruled sequential rows explain hatch, pack and watch, with egg/house, bread–water-bottle–seed, and garden/workshop imagery. The adjacent large phone webpage demonstrates readable single-column treatment, a compact section menu and immediate Open App.
- **03-guide.png** — Your first day as an actual guide article: grouped contents, current selection, search, breadcrumb, quiet reading column, on-page links, back-to-website context, next article and Open App. Paragraphs use normal sans type. The article distinguishes the worlds and says the day saves before its film.

All three final PNGs are 1568 × 1003 pixels. No resampling, compositing, text overlays or image postprocessing was performed. The built-in generator chose the final raster dimensions despite the requested landscape target.

## Visual system and responsive intent

Suggested implementation palette: lavender #CCC7F2; cobalt #3F43CA; cream #FFFDF0; ink #22213D; pale lime #DFFE68; muted coral as the step accent. Use a short pixel display face for brief headings, window labels and status strips, paired with a normal readable sans face for prose. Two-pixel borders and a small hard offset shadow carry the window metaphor. Production controls should use actual accessible semantic buttons and links.

Desktop uses one coherent canvas and normal page navigation. On phones the outer lavender margin shrinks to a few pixels; the wordmark remains compact, the current section becomes a contents/menu control, and Open App remains directly visible. Homepage copy stacks before its preview; The game uses the single-column treatment shown in image 02. Guide sidebars become Guide contents and On this page controls above the article, with a full-width search option. Article body should remain 17–19 CSS px with generous line height, comfortable side margins and a 60–70-character desktop measure. No mandatory intro, film or game-runtime load before website copy or docs.

Open App enters the existing app and preserves any established returning-owner context. This concept proposes no new authentication flow. Eventual routes must preserve existing exact-life links and world/collection/token query context.

## Motion

Text and actions paint immediately. One optional ambient loop inside an illustrative preview may move a leaf or window light, without changing beds or implying real time progression. Tabs and buttons get a brief 80–120 ms pressed offset. The page does not animate as an operating system, require dragging windows, or introduce a desktop taskbar. Guide reading surfaces remain still. Respect reduced motion.

## Source and provenance

Mode: built-in image_gen__imagegen, one separate call per image, transparent_background=false. No CLI, API script or external image service was used. Each call succeeded on its first generated selection.

The original game artwork was not redrawn or changed. No rooster, chicken or bird appears in any generated image. Environment and item illustrations are exploratory marketing art, not production game assets, a live game frame, a new-day reveal or a promised Jev outcome. Any production rooster insert must use the existing canonical generator.

Input reference for image 01:
- C:/Users/Admin/Documents/GitHub/NEARlyHuman/docs/refinements/environment-color/workshop-after.png — original game environment style only. Visually inspected before use. The prompt excludes its HUD/task labels and any character.
Input reference for images 02 and 03:
- This set's 01-home.png — visual-system reference only, retaining the title bars, borders, colors, typography and item/environment language while changing the page composition.

Original generated output paths:
- 01: C:/Users/Admin/.codex/generated_images/01a1a49d-e13f-7360-a5e6-b56f6b3bba28/exec-9585c35f-9e8e-49e2-8f03-f5c92e33c86c.png
- 02: C:/Users/Admin/.codex/generated_images/01a1a49d-e13f-7360-a5e6-b56f6b3bba28/exec-941841b4-33fb-40ab-98ee-681b3bc4a382.png
- 03: C:/Users/Admin/.codex/generated_images/01a1a49d-e13f-7360-a5e6-b56f6b3bba28/exec-35c0cfd2-ae4f-4987-a2bc-30b762baa960.png

Read: AGENTS.md, SHARED_BRIEF.md, RESEARCH.md, all three research Markdown files, and the current README. Directly inspected these retained screenshot references: Pixels desktop, Neko how-to desktop, Sunflower desktop, Fren Pet docs desktop, NEAR docs phone, plus the original garden/workshop environment captures. Useful lessons were one strong app destination, clear separation of visual explanation from reference, a house/garden that conveys genre, and ordinary guide typography. Their art and exact layouts were not reused. Other set folders were not inspected.

## Review, strengths and tradeoffs

Each generated output was visually inspected at full display size. The selected outputs have no birds, no substituted rooster art, no watering-can supply, no invented earnings/counters, no mainnet claim, no wallet dialog and no app redesign. Water is consistently a capped bottle. Packing is accurately described as up to three different supplies and at most one seed/sapling. Docs have ordinary readable paragraphs and correct save-before-film wording. Image 02's large phone treatment keeps its essential text and action readable.

Strengths: distinct cohesive interface grammar across promotional and documentation surfaces; compact viewport; strong action contrast; useful phone adaptation; visual game explanation without exposing a new day's choices; practical docs navigation.

Tradeoffs: the window metaphor can feel dense if over-decorated, so a production build should preserve the single-canvas discipline and avoid extra fake controls. Bright cobalt plus lime needs measured use and focus-state testing. The generated title bars have slight shaded raster texture despite the flat-color request; implemented surfaces should use flat CSS tokens. Generative type is a concept guide; final text must be live, selectable HTML. The modest egg/house/items are illustrative, and the world preview should ultimately use authentic environment assets or a verified unchanged game capture. No small generative lettering defect warranted another generation.

## Full prompt — image 01

Use case: ui-mockup
Asset type: one polished public website homepage design, not a slide, not a collage.
Primary request: Design the NEARlyHuman public homepage in a distinctive “Little Life Utility” identity: playful old desktop game software translated into an excellent modern website. Generate one landscape 1600 by 1000 design image with crisp readable typography and believable website spacing. This is independent concept 04. Do NOT draw any rooster, chicken, bird, mascot, animal, human or game character anywhere.

Input reference: the local workshop screenshot is ONLY a reference for the original game's warm overhead pixel environment style, wood tones and small domestic scale. Do not copy its HUD or new-day task labels. Do not include a rooster from any reference. All environmental art in this mockup is illustrative, no claim of a live game or specific saved outcome.

Design system: pale lavender desktop background #CCC7F2 with a barely visible orderly tiny-dot pattern. One generous actual website canvas inset about 70px from viewport edges. Ink #22213D crisp two-pixel outlines, flat 5px offset shadows, square corners, cobalt #3F43CA title bars, butter-cream #FFFDF0 content, fluorescent pale lime #DFFE68 primary buttons, warm coral small accents. NO gradients, glass, giant CRT monitor, computer hardware, scanlines, photographic texture or SaaS feature-card grid. References teach clarity, not copying their exact layout. Pixel type restricted to short labels; the hero is a charming large squared mono/sans display, body is ordinary readable modern sans at comfortable size.

Layout:
A. A slim top title bar on the canvas: small pixel window icon then wordmark “NEARlyHuman” left. On the right, small quiet “NEAR + Robinhood · Testnet”.
B. A clear cream navigation row beneath: left simple selected raised “Welcome” tab, other links “The game” and “Guide”. At far right a large lime rectangular “Open App ↗” action. This is ordinary public website navigation, no wallet button. No minimize/close controls that look actionable.
C. Main welcoming content fills most of the page, asymmetrical 43% text left and 57% large environmental preview right. Ample margins, compact confident composition. Small cobalt outlined eyebrow “A SMALL LIFE SIMULATION”. Large gorgeous black display headline, three lines: “A little life.” / “A mind of” / “its own.” Follow with readable body: “Hatch a rooster. Leave a few supplies. See what it makes of the day.” Add one lime “Open App ↗” button, then a quiet text link “Read the first-day guide →”.
D. On the right: a polished contained game-world preview window. Cobalt title strip “A place of its own”. Within it draw a crisp overhead pixel garden outside a tiny wooden home: warm timber porch along top, mailbox left, exactly four raised soil beds in a 2 by 2 formation, cream paths between, soft green lawn and a few daisies. Some little seedlings in one bed, empty soil in the rest, a small workshop corner visible through the home cutaway. NO birds or characters. Pixel art is flat top-down, readable enlarged logical pixels, subtle soft environmental light rather than isometric 3D. Footnote inside the frame “Illustrative environment”. No in-game controls and no invented balances or task revelations.
E. The lower 165px is one full-width cream utility strip with three numbered horizontal columns separated by slim vertical rules, not floating cards: “01 Hatch a life” with a very small plain egg icon; “02 Pack a little post” with small bread / WATER BOTTLE / seed packet item icons; “03 Watch its day unfold” with small filmstrip icon. Each has one short descriptive sentence. The water supply is a capped blue bottle, never a watering can.
F. Bottom canvas status strip reads “Nothing ages while you're away.” at left and “Game · Guide · Source” as quiet footer links right.

Keep the overall homepage friendly, authored, beautifully balanced and ready to implement, complete entry viewport with no cropped header. Hero and world together make immediate sense. Main action immediately obvious. No false users, economics, guaranteed profit, metrics, chart, mainnet, merchant, market, direct chat, offline growth, loading screen, mandatory tutorial or recreated app UI. No screenshots of other projects, no logos other than NEARlyHuman, no watermark. Render all specified text accurately; leave generous whitespace and do not add extra writing.

## Full prompt — image 02

Use case: ui-mockup
Asset type: one polished “The game” public website design with a clearly readable responsive phone companion.
Primary request: Create image TWO of the NEARlyHuman “Little Life Utility” website concept. One landscape 1600 by 1000 design image. Use the attached FIRST HOMEPAGE as a precise visual-system reference: lavender dotted desktop, cobalt title bars, warm cream surfaces, ink square outlines, small offset shadows, lime Open App, short pixel labels and ordinary readable sans body text. This is a substantive The game page, not another homepage and not an app redesign. NO birds, roosters, chickens, mascots, animals, people or game characters anywhere.

Composition: the main desktop website view occupies the left 1120px, inset 35px with about 900px height. A large clearly readable 360px-wide mobile website treatment occupies the right, separated by 36px of lavender background. The phone treatment is a flat responsive webpage with a simple 3px ink boundary and tiny square corner, NOT a realistic device, no hardware, no black bezel. Make both views large and visible. No browser chrome, slide labels, annotations or arrows between the views.

Desktop:
- Same cobalt brand title strip: small pixel landscape icon and “NEARlyHuman”; quiet “Testnet” at far right.
- Cream site navigation: “Welcome”, selected “The game” raised tab, “Guide”; a prominent lime “Open App ↗” at far right.
- A restrained page intro with small outlined cobalt label “HOW IT PLAYS”, then bold squared display heading “You prepare. They decide.” in two lines if needed. Comfortable ordinary sans paragraph: “A few supplies. A world of little possibilities.”
- Below is a single long sequential manual-style diagram, exactly three generous rows separated by thin ink rules, not floating cards. Each row has a coral two-digit step number, bold simple step heading and short description on the left; on the right a generous crisp pixel illustration. Enough room to read every sentence.
Row 01 heading “Hatch a life”. Body “Choose a testnet world, connect its wallet, and hatch a rooster NFT.” Illustration is ONLY a plain small speckled egg in a simple cream-and-cobalt square frame beside a tiny wooden house facade icon, no hatching animal.
Row 02 heading “Pack a little post”. Body “Pick up to three different supplies. At most one can be a seed or sapling.” Illustration is a simple cream postal tray with exactly three clear pixel supply items arranged across: slice of BREAD, capped blue WATER BOTTLE, SEED PACKET with green sprout label. Small labels “Bread” / “Water bottle” / “Seed” below items. These are explanatory static supplies, no interactive app controls, no watering can.
Row 03 heading “Watch its day unfold”. Body “Jev chooses the day. It is saved onchain before the film plays.” Illustration is a wide small overhead pixel environment excerpt in the same style as home: on left a green garden with cream path and a soil bed, on right a warm timber workshop with bench, no characters. Add a small quiet caption “Illustrative environment”.
- Thin bottom status bar cobalt: “Nothing ages while you're away.” left; quiet “First-day guide →” right.
- No economics, no live-day reveal, no game playback controls.

Phone:
- Same cobalt brand strip with compact “NEARlyHuman”.
- Cream navigation row with small “The game ▾” on left and obvious lime “Open App ↗” on right, large enough to tap.
- Readable white/cream body, about 22px horizontal padding. Small “HOW IT PLAYS” label. Heading “You prepare.” then “They decide.” in bold squared display, fitting cleanly.
- Three sequential compact sections with strong headings and normal readable body. “01 Hatch a life” plus small plain egg icon and “Choose a world. Connect its wallet. Hatch your NFT.”; thin rule.
- “02 Pack a little post”, three large pixel icons: Bread / Water bottle / Seed, then “Up to three different supplies. At most one seed or sapling.”; thin rule.
- “03 Watch its day unfold” and “Jev chooses. The day is saved before its film plays.” with a small readable garden crop below if space permits.
- Keep the mobile Open App button visible immediately and allow the lower content naturally to continue below; do not shrink type to cram a whole site. This is a responsive public explanation, not the game HUD.

Visual quality: clean sharp utility-window grammar, friendly confidence, consistent 2px borders and 5px offset shadows, no glossy gradients, no CRT, no desk hardware, no scanlines, no huge poster whitespace, no floating SaaS cards. Do not copy another site's art or layout. The source homepage is stylistic reference only; vary the information composition. Exact-copy important text, no extra invented navigation or mechanics. No fake metrics, income, trading, wallet-free mint, mainnet, offline aging, NPC merchant, direct chat or water-can supply.

## Full prompt — image 03

Use case: ui-mockup
Asset type: one polished public player-guide documentation article design.
Primary request: Create image THREE of the NEARlyHuman “Little Life Utility” website concept: a real readable “Your first day” guide article. One landscape 1600 by 1000 image, full desktop webpage viewport. Use the attached first HOMEPAGE as a precise style reference, retaining the lavender dotted surround, cobalt title bars, warm cream, dark ink borders, modest hard offset shadows, square corners and lime Open App button. Transform the playful visual identity into excellent documentation. Quiet reading surface and normal modern sans serif text, NOT pixel body paragraphs. This is the website guide, NOT the app or a wallet interface. No birds, roosters, animals, people, mascots or game characters.

Canvas: inset one large website pane roughly 50px from edges on the lavender background. No physical monitor, no browser chrome. Top same compact cobalt title bar with small pixel landscape icon and “NEARlyHuman” wordmark, quiet “NEAR + Robinhood · Testnet” right. Under that a cream navigation row “Welcome”, “The game”, selected raised “Guide” tab. Prominent filled lime rectangular “Open App ↗” on the right.

Below header: three-column documentation layout, ALL WITHIN one big cream window:
- Left grouped contents sidebar about 265px wide, very pale lavender background, right ink rule. Search field at the top “Search the guide…” with magnifying glass icon. Short ordinary readable sans text; labels may use small pixel/mono accent. Group “START HERE”: selected cobalt row “Your first day” with cream text, next “Worlds & wallets”. Group “LIFE AT HOME”: “Care”, “Garden”, “Workshop”, “Weather & visitors”. Group “WHAT YOU OWN”: “NFT & purse”, “NHC”, “Sharing & transfers”. Group “UNDER THE HOOD”: “Jev & saving”, “Contracts”, “Help”. Bottom quiet back link “← Back to website”. Comfortable consistent row height, not cramped tiny print.
- Main article column about 770px wide with 48px padding, normal left-aligned reading layout, maximum text line around 65 characters. Ordinary sans body around 20px, good generous line height. A small breadcrumb “Guide / Start here”. Large dark squared display h1 “Your first day” (only title may have pixel character). Intro in larger ordinary sans: “Choose a few supplies. Your rooster decides what to make of the day.”
Three clear sections with coral number markers and normal bold sans headings:
“01 Choose a world and hatch”
Paragraph: “Open the app and choose NEAR Testnet with Meteor, or Robinhood Testnet with an EVM wallet. Name your rooster, connect its wallet, then hatch.”
A quiet one-line inset note with tiny outlined square icon: “Each world has its own lives and belongings.”
“02 Pack a little post”
Paragraph: “Choose up to three different supplies. Include at most one seed packet or sapling. Your rooster decides how to use them.”
Below this paragraph a compact inline 84px-high cream supply diagram with exactly three small crisp pixel icons: a slice of bread, capped blue WATER BOTTLE, and seed packet. Readable small labels “Bread”, “Water bottle”, “Seed”. These are explanatory illustrations only, no game controls or packing buttons, no watering can.
“03 Confirm, then watch”
Paragraph: “Review the preparation quote in the app. Jev chooses the day, which is saved onchain before its film plays. The next day's choices stay sealed until they happen.”
Then a thin lavender-tinted note band reading “Nothing ages while you're away.”, small simple pause icon.
Bottom article next-page link row with top rule: “Next: Worlds & wallets →”.
Make the entire article legible and reasonably spacious; prioritize clean type and reading over decorations.
- Right small page-contents column about 195px, separated with a quiet pale rule. Label “ON THIS PAGE”. Links “Choose a world”, “Pack a little post”, “Confirm, then watch”. Beneath ample whitespace, small cream utility note with a simple outlined book icon and text “Reading the guide needs no wallet.” Do not make this a bright feature card.

Bottom cobalt status strip about 30px high: “Guide / Your first day” left and “Source ↗” right.

Quality and constraints: A believable usable help site that feels authored, clean, calm and compact. Ordinary readable body text, readable current nav, strong selection states, obvious Open App exit, no information-dense whitepaper, no giant illustrations, no duplicate hero, no fake terminal, no CRT, no grids of floating SaaS cards. All specified copy should be accurate, no invented extra mechanics, no free-mint or no-wallet app claim, no mainnet, no profit, metrics, live stats, trading, merchants, direct chat, offline aging, audit badge or claims of trustless AI. No copyright logos or borrowed characters, no watermark.
