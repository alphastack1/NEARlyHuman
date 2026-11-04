# Independent website review

4 November 2026. Reviewed the public website code, route boundary, handbook data, selected hybrid mockups and the PM’s rendered first-pass phone/desktop captures. This was a separate critique from the implementation authors. No wallet, chain, inference, service-ledger or deployment actions were performed.

## Judgment

The site now has a clear visitor path and a coherent visual identity. Morning Gate’s bright cottage/garden and warm ivory combine with Little Life Utility’s teal title bar, selected tabs, hard edges and apricot action buttons. The real phone captures retain the main action, readable text and game-world imagery. The guide becomes a quiet reading surface instead of another decorative hero.

No blocking routing, canonical-art or trust-claim issue was found in this review. The two concrete first-pass UX findings—literal search failures and disappearing long-article navigation—have been addressed in the implementation. One follow-up from the sticky change needs PM verification: the header's More popup must layer above the mobile Guide contents row. Final deployment and scroll-depth/browser interaction verification remain PM responsibilities; this report does not substitute for those checks.

## Critique loop and fixes

| Question | Initial evidence | Change | Independent result |
| --- | --- | --- | --- |
| Can a new player find ordinary help terms? | `seeds` omitted the garden; `blueberries` and `minting` returned nothing; `dead` accidentally matched `deadline`. | Shared token index with explicit word forms and topic aliases. | `blueberries` finds Garden; `minting` starts with Your first day; `dead` starts with Remembered lives and no longer returns the deadline article. |
| Do long articles retain navigation? | Desktop chapters/outline and mobile contents/search were normal scrolling blocks. | Sticky bounded desktop navigation and a compact sticky mobile guide row. | Code supports navigation at reading depth; PM should confirm the drawer, keyboard and real scroll behavior. |
| Does the home explain its distinctive feature without more copy? | “A small life simulation” left the AI role implicit. | Eyebrow changed to “An AI-led life game.” | Concrete and concise; the existing premise and one clear app entrance stay intact. |
| Is the tone overworked? | Some second-level copy used a cute phrase where a direct instruction would help. | Plain “Prepare supplies,” “Watch the day,” “Player handbook,” and direct project descriptions. | The first-pass captures read clearly. Occasional brand character remains in the main promise rather than every label. |

## Search verification

A focused pure-data check called the actual exported search function against current articles. It did not duplicate the implementation or call a service.

| Query | Leading result(s) | Assessment |
| --- | --- | --- |
| `seeds` | Care & supplies; Garden | Both relevant. Garden first would be a small ranking improvement, not a failure. |
| `blueberries` | Garden | Correct. |
| `minting` | Your first day | Correct onboarding result. |
| `dead` | Remembered lives | Correct; Strengths/deadline excluded. |
| `withdraw after death` | NHC; Your NFT & its purse | Both directly useful. |
| `wallet` / `NEAR wallet` | Worlds & wallets | Correct. |
| `rain` | Weather & visitors | Correct. |
| A nonexistent item string | No results | Correct empty state. |

The UI asks for keywords rather than natural-language questions. A complete question such as “what happens if my rooster dies” currently has too many mandatory words and returns no match. Ignoring common question/stop words would be useful if this expands later. It is not necessary to introduce fuzzy-search infrastructure to deliver the current guide.

## Rendered review

Inspected actual first-pass captures of Home at phone and desktop widths; the handbook index on phone; a first-day article on phone and desktop; The game on phone; and Project on phone. Compared them with the hybrid Home and Docs boards.

- The phone home shows its premise, Open App, world label, complete garden scene and three-step loop. The roster uses the original canonical generator rather than a redrawn mascot.
- The game explanation has sensible paragraph lengths and one topic per step. The hatch illustration communicates egg → original rooster without an additional tutorial paragraph.
- The guide index gives a prominent first-day start, a useful search field and four small subject groups. No wallet gate or token-market clutter interrupts reading.
- The article body is readable at the sampled phone width and keeps the relevant wallet/world explanation close to the start. Desktop columns have clear selection and a quiet main reading surface.
- Project connects the AI role and NFT continuity to real source and chain information. It does not invent partner walls, earnings statistics or mainnet availability.

The PM subsequently corrected the production environment aspect ratio. This review does not claim that a screenshot captured before that correction proves the final image sizing; use the final PM capture set for that particular check.

## Integration and factual boundaries

The new main entry lazy-loads either the public site or GameEntry. Public pages do not import the game renderer or wallet implementation. Existing root NFT/world/version/callback markers retain their game route and original URL; ordinary website links use full navigation so game CSS does not remain mounted over the website. The final bundle/network check should confirm this intended separation.

Project data reads public collection/token identifiers from the checked-in deployments and does not describe snapshot balances or admission flags as live state. The handbook accurately distinguishes NFT-bound purse rights, withdrawal after death, pending transfer locks, separate testnet supplies, a trusted relay and onchain rule verification. No audit, bridge, guaranteed reward, merchant NPC, offline-aging or trustless-inference claim was found.

The original procedural rooster source is unchanged. Website environment art is a presentation illustration, not a new playable map. Any future art revisions must preserve that boundary.

## Final PM checks worth retaining

Verify all public routes and article refreshes, same-word searches in both search surfaces, modal Escape/focus/navigation, copy-address feedback, chapter drawer at article depth, enlarged phone text, and old exact-life/root/native return paths. These are bounded integration checks, not a reason to add a broad testing framework or rerun unrelated game economics.

In particular, the initial header stacking context was z-index 20 while the new sticky mobile guide row was 25. The More popup starts at the same vertical position as that guide row on an article; it needs a higher header/popup layer or a portal so its first option is not hidden. Open the More menu on a phone article to confirm the final fix. The main header can remain nonsticky.
