# Public website and guide: content architecture research

Research date: 4 November 2026, Asia/Bangkok. This is a proposed website architecture for mockups, not a shipped route map or a change to game behavior. Evidence combines the current repository README, wallet integration guide and primary official website text. Root owns direct browser visual inspection; the observations below do not claim to be screenshot reviews.

## What the site must make obvious

The immediate promise is **a small life with a mind of its own**, not a token launch. A visitor should see the actual house/yard art, understand that they pack supplies and watch their own rooster choose, and find one clear **Open App** button. Reading, browsing an example and viewing a shared life need no wallet connection. Wallet/network decisions belong inside the app at deliberate owner actions.

Keep **Home / The game / Guide** as the public navigation, with **Open App** as the only filled primary button. A plain GitHub link and contract links can live in the footer/guide; do not fabricate Discord, social accounts or partner endorsement. A short label near the CTA or footer can say **NEAR + Robinhood · Testnet**. The two current worlds are separate, not bridged.

The homepage should offer a complete useful first viewport, with optional scrolling for substance. A full-height immersive variant is valid if Guide and Open App remain immediately visible and the mobile layout does not trap content. Do not transplant the in-game menu into the marketing site.

## Proposed routes and progression

These are candidate routes for eventual implementation, not routes that exist today:

| Page | Visitor question | Required substance | Main action |
| --- | --- | --- | --- |
| `/` | What is this, and why would I enjoy it? | A little life / actual game view / one-sentence loop / visible app entrance | Open App |
| `/the-game` | What do I actually do? | Three visual beats: hatch a life, pack up to three supplies, watch what it makes of them; house/garden/workshop; NFT continuity | Open App |
| `/guide` | Where is the answer to my question? | Small player-first topic groups, search, quick-start link, deeper world/ownership facts | First day |
| `/guide/first-day` | What happens when I start? | Choose world and its wallet; hatch; pack; free ownership message vs paid day; watch after save | Open App |
| `/guide/garden` | How does growing work? | Four beds, wet bedtimes, finite repeat yields; one clean diagram/table | Read next / Open App |
| `/guide/ownership` | What does the NFT own? | Life, stock, saved intentions, backed purse rights; transfer; remembered life; withdrawal after death | Contract links |
| `/guide/worlds-and-wallets` | Which wallet and which network? | NEAR Testnet+Meteor; Robinhood Testnet+Rabby/EVM; separate lives/NHC; prices from current config rather than hardcoded marketing promise | Open App |
| `/guide/nhc` | What is the purse for? | Earned finished-goods shipment can credit utility NHC; 250 NHC birth; no fixed returns or promised cash redemption | Ownership / Open App |
| `/guide/jev-and-saving` | What is chosen by AI and what is saved? | Jev chooses within legal actions; completed replies are sealed; worker saves/verifies day then film; trusted relay, no attestation claim | View source |
| `/guide/help` | What if a wallet or day fails? | Distinguish no signature/cancel/check original/confirmed failure/new attempt; link relevant flows; no blind repeated payment instructions | Open App / correct help article |
| `/guide/contracts` | Where can I verify it? | Two current testnet deployments, source, exact-chain explorers, supported capabilities and trust boundaries | Explorer / source |

One public guide system can serve both players and technical readers. Sidebar groups: **Start here** (Your first day, Worlds & wallets); **Life at home** (Care, Garden, Workshop, Weather & visitors); **What you own** (NFT & purse, NHC, Sharing & transfers); **Under the hood** (Jev & saving, Contracts, Troubleshooting). Collapse deeper groups until useful. On phone: a clear **Guide contents** control rather than a permanently consuming left sidebar. A question-oriented title and a simple illustration should come before numbers or protocol details.

For three-image concept sets, compare the same substantive coverage: (1) homepage, (2) The game / visual loop page, (3) a real guide article or guide home. A guide article is more informative than three nearly identical hero panels. Keep a primary Open App route on all three. Designers can choose distinct visual formats without inventing different products.

## Three important entry flows

1. **First visitor:** Homepage -> sees actual world + short loop -> Open App -> current app's world/name/wallet/hatch flow. A secondary **Watch a day** link can open the existing saved example; no modal tutorial or required example film before hatch. It must be labelled as an example, not imply a live unsaved AI simulation.
2. **Returning owner:** Open App remains prominent and direct, skips marketing roadblocks, preserves selected world/last life. The website must not ask for a second connect or overwrite the app's recovery state.
3. **Shared exact NFT link:** Existing world+collection+token URLs must open that exact life immediately, not bounce through the new marketing homepage or substitute a generic rooster. Provide a quiet About/Guide route from the app if desired. These links already work and are a release constraint for a later implementation.

An eventual `/app` split is a proposal only. It needs deliberate legacy-link routing and query preservation. Do not advertise that path in working links before it is actually supported.

## Suggested concise truthful copy

Hero: **A little life. A mind of its own.**

Body: **Hatch a rooster. Leave a few supplies. See what it makes of the day.**

Small secondary line: **An AI-led life game, saved onchain.**

Loop: **Hatch a life. / Pack a little post. / Watch its day unfold.**

Reassurance: **Nothing ages while you're away.**

Ownership: **One NFT. Its home, belongings and little history.**

Jev: **You bring the possibilities. Jev chooses what happens next.**

Purse: **Finished goods can earn NHC for this life.** (Not every harvest ships; avoid promising it.)

Guide article opening: **Choose up to three supplies. Your rooster decides how to use them.**

Worlds: **NEAR Testnet / Robinhood Testnet**. Mainnets are not available. Product UI need not lead with a status paragraph, but paid entry must not masquerade as mainnet.

Do not use: fully autonomous economy; trustless AI; guaranteed income; permanent immortal pet; cross-chain inventory; NPC trading; verified/third-party audited; real-time living while away. None describes the current shipped product. A remembered dead life retains its NFT and purse, so do not say death burns the asset or confiscates its money.

## Primary reference observations and transferable lessons

- **NEAR Docs** — https://docs.near.org/ . The text navigation separates Protocol, Smart Contracts, Web3 Apps and further specialist categories; the homepage gives task starts and links into reference material. Borrow search + task-first entry + deeper grouped sections. Do not mirror its developer-heavy categories for a pet game's first page. Source viewed 4 Nov; textual evidence.
- **Stardew Valley official site** — https://www.stardewvalley.net/ . Public nav includes Blog, Forums, Wiki, Media and FAQ. A short move-to-the-valley premise precedes screenshots and activity-oriented features. Borrow emotional premise -> actual world -> specific things to do, with reference material outside the main pitch. Do not copy its dense ecosystem navigation at our scale. Textual evidence; visual assessment belongs to root captures.
- **Sky Mavis / Axie official support** — https://support.axieinfinity.com/hc/en-us . Search accepts a question or problem; topic groups distinguish game/product areas and promoted articles include getting started and account security. Borrow questions in the reader's language and a short getting-started path, not an everything-at-once manual. Its service-status machinery and many products are unnecessary for NEARlyHuman. Textual evidence.
- **Usagi Shima official site** — https://usagishima.net/ . Nav separates Home, Presskit, About and Support; the inspected text currently foregrounds Steam and merchandise. Borrow separation of press/help from the world introduction. Avoid letting merchandise/news archives push the actual game proposition out of view. Textual extraction does not establish the first rendered viewport.

## Visual and interaction implications for designers

- Preserve the existing procedural rooster art exactly. Use supplied game captures/unchanged canonical art; do not reinterpret it as a cute new mascot.
- The public website can have a broader palette than the game, but should feel like an entrance into its pixel world, not a separate 3D/cartoon brand.
- Use readable normal text for guides; reserve pixel display type for short headings and small accents.
- Motion should explain a transition or bring a small world detail alive: light through a window, a seed sprouting, a paper parcel becoming a day. No loading movie required before seeing Open App; no heavy game runtime just to read documentation.
- Documentation may be atmospheric around its edges, but the article needs a stable quiet reading surface, clear current section, search and obvious return context.
- Any future live counters, journal examples, balances or day details must be actual public data or visibly illustrative. Static mockup samples should not imply authenticated ownership.

## Decisions to defer until the owner selects a direction

Do not implement site routes, alter the game entry, change wallet logic or deploy. Compare the six designs first. Keep website architecture simple enough to implement as lightweight presentation/guide pages around the existing app.
