# World event and survival review

This is developer research, not a player guide or a list to show before a day. Keep discoveries in the scene. The bounded offline results below are evidence about authority and capacity, not claims about real Jev choices or every possible playthrough. Compact measurements: [world-event-balance.json](world-event-balance.json).

## What the current authority actually does

The shared TypeScript, Robinhood Solidity and native NEAR Rust kernels use the same ten-family primary event gate: 45% nominal admission, then one uniformly selected family. Each family has an approximately 4.5% nominal chance before eligibility and rescue checks. There is one onset per day at slot 1, 11, 21, 31 or 41, followed by its phase boundary nine slots later. An ineligible family becomes quiet; there is no redraw. A harmful eligible proposal needs a valid witness that survives the remaining day plus two future days with bounded care and supplies. The witness proves that rescue exists; it does not force the actual AI to follow it.

| Family | Eligibility / actual consequence | Available response |
| --- | --- | --- |
| Rain | Waters every occupied bed. With an unprotected damaged window, a physical health hit up to 12% and one exposed water bottle at the boundary. A lethal unavoidable exposure is softened. | Toolkit brace prevents both consequences; umbrella covers the body only. A sound/patched window is safe. |
| Fire | Requires usable heat and the immediately previous logical action to be toast, cooked steak, sandwich or backup heat. Unanswered flame causes a physical hit up to 20% and a serious wound. | Douse spends one bottle; shutoff leaves a physical smoke hit up to 5%. |
| Outage | Power fails for the day and one stored milk spoils if present. | Existing cold food remains usable; backup heat can restore cooking with wood and matches. |
| Seed eater | Only an already-progressed, still-growing planting is eligible. At most one wet bedtime of delay, capped at that growth cycle. | One shoo attempt or appropriate bait. |
| Hungry visitor | Requires stored bread, milk or steak; at most one selected unit is lost if still present at the boundary. Fruit alone does not attract this visitor. | One shoo attempt or milk/steak bait. This is not a trader. |
| Fixture break | Breaks an eligible stove, window or existing chair. Existing broken fixtures are excluded. | Actual repair, temporary patch, or suitable alternative activity. |
| Mishap | Minor physical wound; cannot be introduced when its initial hit would kill. | Bandage; a minor wound can also heal under the specified good-care conditions. |
| Sickness | Initial 10% health loss and a treatment deadline. Cannot be introduced at 10% health or lower. | Medicine. |
| Disappointment | Up to 20% morale loss, reduced modestly by Spirit. | Ordinary comfort or other legal recovery. |
| Washout | Blocks one occupied, unprotected bed. Growth stops until soil is restored; this shower does not additionally water crops. | Compost restores soil; existing cover prevents eligibility. Ready goods can still be harvested. |

Daily authority caps remain five ordinary opportunities, one main undertaking, two acute responses, two naps, two leisure actions and one shipment of at most four real finished goods. One successful watering action covers all four occupied beds and consumes no drinking bottles. A separate task failure may create one minor complication; backup-heat failure can create a real responsive fire even though the primary-fire cadence problem below exists.

There is no NPC barter, roaming merchant, purchase offer or player market. Shipping consumes canonical home-grown/handmade inventory and credits the NFT purse under the contract reward formula. A decorative visitor must not imply a trade or reward.

## Why an apparently quiet game can still have these rules

In 100,000 fixed deterministic seed draws, the raw gate admitted 44.955%; individual families appeared in 4.452–4.563% of draws. Explicit pre-onset boundary samples isolated eligibility: new-home fixtures admitted a visible nonquiet family in 31.67%, established-garden fixtures 39.33%, fragile fixtures 15.67%, and supplied injured fixtures 29.83%. These are fixture rates, not a population forecast. All 96 bounded eligible witness samples passed; ordinary eligibility, rather than blanket witness rejection, dominated this healthy sample. A separate impossible-current-treatment fixture correctly rejected the witness and softened an outage while retaining the pre-existing illness.

Two concrete liveness issues were found:

1. The current worker acts at routine phase starts and usually performs its main undertaking at slot 36. At later primary-event onsets, the immediately previous logical slot is quiet. Completed normal days also end in a quiet slot. Consequently primary fire is unavailable along the normal worker cadence even after a cooking project. Task-complication fire remains reachable. Repairing this through an artificial last-second cooking schedule would distort pacing; a real rule change needs a separately reviewed kernel version on both chains.
2. The worker previously dropped the current episode from Jev's perception. Jev could see an offered response and current house/stock but could not identify the threatened bed/food or its actual boundary. Mind8 now includes only already-started, unresolved current episode facts and exact conditional consequences. It exposes no future seed, proposal or care witness. This changes neither candidates nor action allowances. A controlled same-choice before/after day produced identical 60 receipts, state, trace, witness, reward and provider call count. [Focused proof](../near-integration/mind8-observed-events.json).

Do not compensate for quiet days by faking authority events in scenery or listing future incidents to the player. Make actual arrivals, weather, stock loss, damage and recovery readable when their receipt takes effect. Presentation can vary those ordinary moments without adding resources or changing probabilities.

## Capacity and survival

Fifteen controlled offline worker runs covered five starts and three stat allocations, for 450 played days. Starts included a new home, a severe wound due for treatment, scarce food/water with a damaged window, a mature four-bed garden, and stored workshop wood. The latter four are explicit boundary fixtures, not asserted genesis histories. A deterministic care/production ranking replaced the model; this is not live Jev evidence. All 15 runs survived 30 days. There were 154 accepted nonquiet primary episodes (34.22%), 296 quiet days and no softened harmful proposal along these sufficiently supplied trajectories.

| Start | Runs / days | Accepted episodes | Watering actions per 30 days | NHC capacity over 30 days at fixed zero pressure |
| --- | --- | --- | --- | --- |
| New home | 3 / 90 | 27 | 13, 14, 13 | 82.8–110.8 |
| Due wound | 3 / 90 | 39 | 13, 11, 13 | 73.8–104.3 |
| Scarce stock | 3 / 90 | 32 | 13, 14, 14 | 71.1–104.3 |
| Mature garden | 3 / 90 | 26 | 13, 14, 14 | 127.8 |
| Workshop | 3 / 90 | 30 | 12, 13, 12 | 163.8–178.8 |

The mature/workshop starts include existing productive assets, so their outputs must not be presented as free newborn earning rates. Fixed zero pressure is a capacity bound; actual accepted issuance pressure lowers quotes. The experiment did not model many competing NFTs, real Jev selection quality, all 21 stat allocations or every reachable condition combination.

Food falls 30 percentage points per day and water 40. One bread plus one bottle in a combined breakfast can replace both losses within one ordinary opportunity. Watering all beds roughly every second day leaves room for shipping, treatment and comfort. Healthy action energy costs are below the 35-point living bedtime restoration; naps are usually optional, not a required daily chore. The scarce-stock runs needed one initial nap each; other sampled runs needed none. Main-project opportunities, growing time and actual materials constrain production more than garden watering does.

Neglect still matters: an explicit near-empty, unsupplied fixture develops hunger/thirst warnings, loses 30 health points at first onset, and dies after its next untreated due day. Collecting bread/water and eating a Dawn breakfast prevents both deficits with the same canonical rules. These tests establish a concrete rescue and concrete failure, not universal survival.

The unchanged kernel also contains an independent, unmitigable structural death draw after day 1: nominally one in 4,000 per advanced day. It bypasses care witnesses and healthy stats. Cumulative risk is about 0.72% by 30 played days, 2.44% by 100, 8.70% by 365 and 22.10% by 1,000. No offline day advances, so time away does not add exposure. The 450-day sample happened not to draw it; that is not evidence that it is absent. Making this event preventable or removing it requires a separately approved kernel/economy change; Mind8 does not alter it.

## Economy observations

At zero issuance pressure, a spoon returns 11.6 NHC for three real wood; toy boat 21.2 for six; birdhouse 27.6 for eight; large chest 34 for ten. Small crafts return more per wood, larger crafts more per main-project action. This is a genuine resource/time tradeoff, not a universal upgrade ladder. Four beds are feasible because watering and harvesting can each service multiple beds in one action. Death ends future production but already-credited purse funds remain withdrawable. Lifetime issuance pressure does not rewind when tokens burn, so a death/burn loop does not restore earlier high quotes.

## Genre research and current decision

Bandai's [Original Tamagotchi manual](https://tamagotchi-official.com/manual/toy/original/Original_webmanual.pdf) ties a visible care signal to an action and meter feedback. Nintendo explains that [Animal Crossing visitors depend on time, conditions and progression](https://en-americas-support.nintendo.com/app/answers/detail/a_id/49516/~/why-am-i-missing-this-visitor%2C-event%2C-or-activity-on-my-island%3F-%28animal); rare discoveries are compatible with a daily-life game. Valve's [AI Systems of Left 4 Dead](https://steamcdn-a.akamaihd.net/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf) discusses alternating quiet intervals with unpredictable intensity rather than maintaining constant pressure.

Our application of those sources is a design inference: preserve a readable care loop and genuine quiet days, make current consequences visible, and vary harmless domestic staging before adding more hazards or more controls. This sprint repairs current-event perception and actual event presentation. A trader, primary-fire rule revision or survival-rule migration is a separate design decision, not part of the current polish.
