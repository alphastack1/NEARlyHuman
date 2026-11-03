# A rooster first, a routine second

This pass addresses the owner's actual first-visit, hatch, playback and menu complaints. It changes presentation and navigation; the accepted-day, wallet-journal, payment, budget and chain authority remain in place. The candidate is local until the PM chooses a reviewed publication boundary.

## What the reference games teach

Bandai's [Tamagotchi Connection manual](https://www.bandai.com/amfile/file/download/file/242/product/1304694/) begins with an egg, basic setup and naming, then returns to the pet. Needs draw attention to care. The same three controls select, confirm and cancel throughout. It also distinguishes resuming a saved pet from resetting one. The useful inference for NEARlyHuman is to make attachment and the current home the anchors, with stable return behavior; a mature stranger's long replay should not stand between a new player and hatching.

The official [Tamagotchi Uni manual](https://tamagotchi-official.com/manual/toy/uni/manual_03/Uni_WEB_IS_EN.pdf), linked from its [manual directory](https://tamagotchi-official.com/manual/toy/uni/), allows ending a walk at any time. Its [How to play page](https://tamagotchi-official.com/us/series/uni/howtoplay/) connects personality, favorite placed items, crafts and ordinary care to the pet. The inference here is a brief optional demonstration with a visible exit, followed by discovering deeper systems through the rooster's home. This is a design adaptation, not a claim that our onchain game has the toy's real-time care rules.

## The old friction and resulting change

| Observed friction | Resulting behavior |
| --- | --- |
| START revealed mature MISO, Day28, with Watch day as the only main action. A new visitor had not chosen to watch or to own that rooster. | START reaches one entry card: Hatch a rooster is gold; Watch example and Your roosters are secondary. Guest data may load behind it, but its HUD is hidden until deliberately visited. |
| The example felt like a commitment, with an unclear way to stop. | The example is explicit, uses a real saved contiguous excerpt, and has visible Hatch your own / Back actions. PM's player implementation bounds the excerpt and returns to entry. |
| BOK looked like a chosen name but was only a placeholder, leaving Hatch disabled. | PIP is a real editable suggested name. Hatch PIP is enabled immediately with valid default traits. Clearing or invalidating the name still blocks submission. |
| Body/Wits/Spirit allocation and two equal currency tabs demanded unexplained choices before meeting a pet. | Personality is an optional disclosure. Current cost remains visible; Change reveals the native/NHC choices. Existing approval, exact amount and draft-recovery behavior is retained. |
| A returning owner had to start/replay a saved day to reach the next preparation. | The current saved home shows Prepare tomorrow, with Watch day N secondary. The HUD starts at the actual saved needs/level. |
| Simply skipping every new saved result would also hide the core payoff of funding a day. | A just-completed accepted job presents Watch day first. The marker remains stable during playback. Finish day reaches the saved result and tomorrow. Returning or explicitly opening the latest home clears the temporary presentation marker. |
| Seven equal menu rows mixed this rooster, other owned roosters, sharing and a new purchase. | A current-rooster card anchors the menu, followed by four local tools and a quieter account/new-rooster area. |
| A single overwritten return screen caused nested sheets to close to an unexpected home/menu. | Nested sheets keep a return stack. Their arrow names the prior context; root sheets use Close. Loading a different actual life establishes its home as a new anchor. |
| Writing a shareable rooster URL made a root visitor appear to have originally entered through a public link. Selecting the latest day from Days also lost its explicit replay context. | Original entry query is captured once. Self-written URLs do not create an invented profile-back route. Explicit day selection keeps Back → Days and the Watch action even when that day is the latest saved day. |
| The default three-item post disabled most unselected supplies. Changing Water to Milk required discovering removal first. | One parcel slot is visibly targeted. Tap a slot, then a supply to replace it immediately. Selected supply tiles toggle out; opening Seeds targets the existing seed. The three-item and one-productive-starter limits remain. |
| A failed initial public-life read offered unrelated hatching choices. | Try again repeats the exact requested life/world/day. Back to start is separate. |

## Complete action map

| Starting context | Main path | Optional exploration / return |
| --- | --- | --- |
| First visit | Brief house opening → START → Hatch a rooster → edit suggested name if desired → Hatch PIP → wallet → confirmed new home | Watch example → short saved excerpt → Back/automatic return; Your roosters → wallet selection → owned list. |
| Hatch card | Suggested name → visible price → Hatch named rooster | Personality expands three existing traits; price Change expands native/NHC choices. Back returns to the originating entry/profile/menu. Cancelling the wallet preserves the draft. |
| Newly minted rooster | Actual Day0 home → Prepare day1 → First post → confirm day | Inspect the real house. Menu and ownership information remain secondary. No invented demonstration state is attributed to the new NFT. |
| Preparing any day | Three-slot post → select target slot → replace care/seed/house supply → Prepare day N → wallet authorization → durable pending day | Selected supply toggles out. Seeds replace an existing productive starter. Closing the card preserves material selection. |
| Funded pending day | Visible progress → saved day becomes ready → Watch day | Pending payment checks, reconnect, terminal failure/retry and expiry retain their existing gates. Leaving the sheet does not delete a submission. |
| Newly saved day | Watch day → ordinary travel/actions → natural ending or Finish day → saved summary → Prepare tomorrow | Pause/inspect/menu can interrupt locally. Finishing only changes presentation to the already saved outcome; it does not advance the chain or make an inference call. |
| Returning owner | Selected latest rooster → current saved home → Prepare tomorrow | Watch day N, current profile, belongings and purse. No mandatory repeat of an old film. |
| Exact public link | Exact world/NFT → public portrait → Visit home | Days, Share, Hatch your own; read error retries the same exact link. No owner operation appears merely because the visitor can read the NFT. |
| Menu | Current rooster card, then Days / Belongings / Purse / Share | Your roosters and Hatch a rooster are account-level actions below the local tools. |
| Saved days | Day list → selected saved film | Back reopens Days with selected row/scroll; Latest home returns to current facts. Nested Days → Back returns to the profile/menu that opened it. |
| Purse | Actual balance → authorized owner withdrawal or token-funded hatch when legal | Public visitor gets Visit home. Empty owner purse returns home. Death does not remove withdrawal rights. |
| Existing payment recovery | Reconnect required account → check journal/receipt → existing outcome | No new payment bypasses an unresolved signed intent. Navigation does not reset the journal or change transaction context. |

## Focused evidence

The application type check passes after the Journey implementation. The separate player reviewer records [independent critique](CRITIQUE.md), [cold-entry/menu evidence](critic-public-flow.json) and [owner-care/cancel evidence](critic-owner-cancel.json). Their cases cover nested Menu → profile → Days → profile → Menu, Belongings → Menu, wallet cancellation preserving the name, optional disclosures, and Water → Milk / seed replacement without a fourth item.

[The fresh-day proof](fresh-day-proof.json) uses the actual public SUNNY #3 Day1 film and commitment, with a controlled preparing → ready **GET response** to exercise this presentation transition. It does not fund or prepare another actual day. The gold action is Watch day after readiness, remains stable during playback, becomes Prepare tomorrow after Finish day, and remains Prepare tomorrow after explicitly reopening Latest home. The return view offers Watch day1 secondarily. There were zero application JavaScript errors and zero application write attempts.

- [Fresh saved day: Watch day](images/fresh-day-watch-390.png)
- [Finish day: saved summary](images/fresh-day-complete-390.png)
- [Returning owner: current home](images/returning-owner-home-390.png)

The first harness attempt expected an obsolete "Watch last day" label at the final assertion; the actual button is "Watch day1". The corrected focused run passed without another application change. Browser tooling used the separate Codex Browser profile and page-local memory stores, closed only its own page, and never connected a signing wallet or touched financial records.

## Final entry-intent repair

PM's final source review found that reparsing `location.search` during every render confused original entry intent with the share URL written after loading a rooster. The Journey now captures the initial query once. It separately tracks explicitly selected days, so selecting the latest saved day still means "watch this day" rather than "show the static owner home". The genuinely older-day shortcut to Latest home remains available.

[The narrow entry-intent proof](entry-intent-proof.json) passes three cases using actual SUNNY Day1 data and a controlled owner address: opening Latest home from a root owner session writes `rooster=3` into the URL without adding a profile-back button; selecting the latest Day1 from Days offers Watch day and Back returns to Days; an original exact-link entry still goes portrait → Visit home → Back to that portrait. There were zero JavaScript errors or application write attempts. The initial harness assertion ran before the asynchronous URL write; waiting for that write fixed the harness, with no additional application change.
