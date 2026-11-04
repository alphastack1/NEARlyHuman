# NEARlyHuman website exploration — shared designer brief

4 November 2026. Research and mockups only; the owner will choose a direction before implementation. Six fresh independent designers each receive this same pack. Each owns one numbered set containing **three separately generated images**, not one crowded triptych. Use the built-in image generator. Save final selected images and full prompts beside the set's notes. No app/source/chain/deployment changes.

## The product

**NEARlyHuman** — **A little life. A mind of its own.**

A retro, phone-first AI-led virtual pet game. Hatch a procedurally varied rooster NFT. Pack up to three different supplies, at most one productive seed/sapling. Jev on NEAR AI Cloud chooses a substantial project and small routines. The rooster physically walks around its home, garden, workshop and mailbox. A day is saved onchain before its film plays. Future choices remain sealed until they happen. Nothing ages while the player is away.

Four productive beds, nine planting choices, four wood crafts. Finished goods may be shipped to credit NHC to the NFT's own backed purse; shipping and profit are not guaranteed. The NFT carries its saved home, inventory, intentions and purse rights. Remembered dead lives retain their NFT and withdrawal rights. Native NEAR Testnet and Robinhood Testnet are separate worlds, with separate lives, inventories and currencies. Neither mainnet is enabled. No NPC merchant, player trading market, direct chat, cross-chain bridge, offline earning, social login or trustless AI attestation is implemented. Jev/relay is trusted, contracts derive legal state and rewards.

Use README.md as the current factual source rather than old planning documents.

## What the owner wants

A beautiful public website around the existing app, with docs pages like other crypto projects and a prominent **Open App** button. Friendly, clean, balanced, self-explanatory, alive and retro in a way connected to the game. The public site must not become a cartoon shell, crypto dashboard, generic SaaS feature-card grid or a new game mechanic. It can extend beyond moss/cream; the game and original artwork remain intact. Six truly different layouts and identities, not a palette swap. Give the owner a useful choice; do not implement or publish any direction.

## Artwork invariants

The procedural rooster in src/art/rooster.ts and rooster-data.ts is canonical. **Do not draw, redesign, upscale inventively or substitute a new rooster mascot.** Existing screenshots are product references; any eventual game/portrait insert must use the exact canonical asset. Safest mockup approach: environmental house/garden/crop/mail imagery and existing captured views, with no newly illustrated birds. Keep pixel environments crisp and top-down compatible; avoid vector/3D/cartoon mascot restyles. No copying other projects' art, logos or exact layout.

Useful local references (view before passing to imagegen):

- docs/refinements/environment-color/garden-after.png
- docs/refinements/environment-color/kitchen-after.png
- docs/refinements/environment-color/living-after.png
- docs/refinements/environment-color/workshop-after.png
- design/references/VR-01-approved-house-and-care.png (earlier approved art direction)
- reference-captures/ in this folder: actual source-site screenshots and URL/text evidence.

## Equal coverage for each set

1. **Homepage.** Beautiful first impression, concrete world, short emotional proposition, readable header, obvious **Open App**. A complete entry viewport rather than only a poster. Optional additional content below; do not cram a whole scrolling website into tiny type. No wallet dialog on the marketing page.
2. **The game / How it plays.** A different substantive page or section. Visually show hatch → pack → watch, or the house/garden/workshop and why watching is interesting. Use a phone presentation here if it best shows the design adapting; at least one image in the set should contain a readable mobile treatment. No spoilers for an owner's new day. No actual app redesign.
3. **Guide / documentation.** A real usable guide article, such as Your first day, with navigation, search, quiet reading surface, short useful instructions, return context and Open App. Show that the expressive brand becomes readable docs. A small adjacent mobile treatment is welcome only if clear; not required if image 2 is a phone layout. Normal body type, not tiny pixel paragraphs.

Suggested common nav: The game / Guide / Open App. Home logo is the return. Footer can hold actual source/contract links. Guide may also be labelled Docs or Handbook. Keep the main action filled and secondary links quiet. Browsing docs is wallet-free.

Good concise copy: “A little life. A mind of its own.” / “Hatch a rooster. Leave a few supplies. See what it makes of the day.” / “You prepare. They decide.” / “Nothing ages while you're away.” / “One NFT. Its home, belongings and little history.”

No fabricated users, profits, token charts, testimonials, partnerships, audit badges, social handles, live activity, countdown or mainnet availability. Quiet factual **NEAR + Robinhood · Testnet** is sufficient where relevant. Sample day imagery is illustrative or an older saved example, never a promised AI outcome.

## Shared research, read before designing

- RESEARCH.md: PM's rendered-screen observations and synthesis.
- research/research-pet-games.md: eight official cozy/pet/pixel families.
- research/research-crypto-docs.md: eight onchain/AI/docs reference families.
- research/research-content-architecture.md: facts, visitor journeys, proposed routes and concise copy.

Study the actual screenshots, not only names. Tiny atmospheric animation is feasible later, but text and Open App must appear immediately; no forced intro/video/game-engine load on docs. Document intended motion in notes rather than fake motion with illegible busy art.

## Candidate flow and docs map

First visitor: website → understands loop → Open App → existing world/name/wallet/hatch flow. Returning owner: Open App directly resumes context. Exact NFT URLs: go directly to that life, retaining world/collection/token query data. A future /app split requires careful routing; these mockups do not create routes.

Guide groups: Start here (Your first day, Worlds & wallets); Life at home (Care, Garden, Workshop, Weather & visitors); What you own (NFT & purse, NHC, Sharing & transfers); Under the hood (Jev & saving, Contracts, Help). A phone uses a contents control instead of a permanent sidebar.

## Deliverables per independent designer

Choose your own name, typographic voice, composition and palette inside your assigned broad territory. Declare the concept and three-image plan before generating so PM can avoid repetition. Then generate 01-home.png, 02-the-game.png, 03-guide.png in your assigned design/website-exploration/sets/NN-slug/. Use **one imagegen call per image**; use prior generated image as a style reference for the next if helpful. Read imagegen SKILL.md. Inspect every output. Fix major layout/factual/style errors, but do not waste time on tiny generative lettering defects: these are design guides, not shipping pages. Save full prompt text, image provenance, what each image shows, proposed motion and mobile behavior, strengths/tradeoffs and any illustrative-art caveat in NOTES.md/manifest.json. Use only owned set folder for permanent edits and TEMP/website-exploration/NN-* for scratch.
