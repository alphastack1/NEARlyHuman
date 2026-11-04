# V2 economy — decisions and evidence

Research date: 2 November 2026. This is a historical design-stage record, not a description of the later deployed contracts or a prediction of token value, player population or Jev behavior. Production source at that time was `3aa3c84b1ba80126a61fb8831ca35c590349e3c2`. See the [current economy guide](../ECONOMY.md) for the implemented loop.

Three parallel specialist reviews covered integrated production/care, currency/reinvestment and settlement/ownership. A fourth independent reviewer challenged first-use clarity, fun and remaining complexity. The PM reconciled their findings, selected one baseline and reran the preserved models. No paid inference, live transaction, wallet edit or production deployment was needed.

The track fit comes from the life owning productive inventory and real token units, with control moving to its current NFT owner; the public portrait is the visible record of that behavior. This follows the organizer's [NFT track direction](https://github.com/nearai/near-hackathon-prompt-examples/blob/main/tracks/10-nfts.md). The example membership/sub-account prompt on that page is a starting example, not instructions to replace this game with memberships or require a new private key per rooster. A purse allocation must be described honestly as a contract-controlled token claim, rather than falsely calling it a separate NEAR account.

## Selected baseline

Four plots; nine plant choices; one main undertaking and five ordinary routine opportunities; well-watering for all plots; actual food-and-drink breakfast; finite pickup-gated repeat yields; four simple wood recipes; one daily shipment of at most four finished units. Birth has three bread and three water, with the first seed in the Day 1 kit. Supplies permit up to three distinct types and at most one seed/sapling. There is no free saleable output, raw-wood delivery, fertilizer acceleration, offline production or paid seed shop.

Six-decimal project tokens; 250 burned per token-funded NFT; initial one token per base point; `K=50,000`; non-resetting lifetime issuance pressure; a 30,000-token burst bucket with 30,000 tokens of refill per elapsed 24 hours. Current pressure is bound at accepted request, with a provisional 15-minute deadline. Capacity shortage can disable shipping for a newly accepted day without blocking care or destroying stock. Earned purse units remain owner-withdrawable after death and while an AI day is pending.

The final implementation should store pressure directly as cumulative genuine token issuance. The no-other-burn research baseline's `P = totalSupply + NFT-mint burns` is equivalent. This avoids depending on every possible standard token-lifecycle burn being an NFT purchase. All burns leave the selected direct counter unchanged. Purse claims are not an extra quantity to add to the already counted vault tokens.

## Does the day actually fit?

The original four-bed extension would consume about two drinking bottles/day for the plants plus 0.8/day for the body, with at most one bottle/day delivered. It fails by conservation before AI quality matters. Individual well visits also consume too many routine opportunities when food, drink, leisure and treatments remain separate.

The integrated model therefore charges one routine for watering all occupied plots and groups one actual food and one actual drink into a breakfast. It consumes both items and both energy costs. Planting includes its initial water, avoiding a newly planted afternoon seed missing the earlier morning watering visit.

The model explicitly tracks delivered stock, seed consumption, finite plots, moisture, growth, finished inventory, consumed wood, crafting, food/water/morale/energy and shipping. It has six need-loss boundaries, five routine openings and one main. It conservatively charges three energy/main, one/routine, two/breakfast; living bedtime restores 35 energy. Food falls 30/day, water 40/day and the modeled spirit-1 morale loss is 17.64/day.

The broader sweep covers **all 70 four-slot multisets of five distinct production schedules**, two deterministic main heuristics and four relevant craft goals: **350 constructed 365-day schedules**. The five schedules are quick annual, medium annual, slow annual, repeating fruit and wood tree. Same-tier cosmetic/own-use variants do not change pure-shipping yield. Planting order is canonical and fixed. This is not a search over all possible policies or all planting orders.

All baseline schedules preserve their modeled need floors. Across them, the minimum observed food/water/morale/energy is **65 / 53 / 73.26 / 91 percent**. The representative tree/strawberry/lavender/apple policy with two actual weekly treatment chores retains **20.7% of ordinary routine opportunities**, has no wilt, and keeps morale at least 67.7%.

Treatment stock is real: medicine and bandage deliveries displace seeds, then treatment routines consume them. But the experiment **does not model the injury itself, illness drain, health, contamination, fire or the complete death predicate**. It establishes room for those supplies and chores, not full incident survival. Its zero-need failure marker is not production death logic.

## Production tradeoffs

The base-point catalog is in the design and [production evidence](production.json). The broad sweep's best observed result for each tree count is:

| Trees | Observed layout and policy | Base points / 365 game days | Points/day |
| ---: | --- | ---: | ---: |
| 0 | Three grape plants + strawberry, batching | 1,834.5 | 5.026 |
| 1 | Tree + two grapes + strawberry, spoons, batching | 1,893.5 | 5.188 |
| 2 | Two trees + blueberry + strawberry, chests, batching | 1,929.0 | 5.285 |
| 3 | Three trees + strawberry, toy boats, batching | 1,987.6 | 5.445 |
| 4 | Four trees, toy boats, batching | 1,950.4 | 5.344 |

This is a useful narrow spread across production classes, not a guarantee that they are equally fun or an optimality proof. The best-observed policy extended to 2,190 game days averages 5.562 points/day; the shorter figure includes its startup mix. Jev should not be instructed to repeat the maximizing schedule.

Other representative 365-day outcomes:

| Policy | Points/day | What differs |
| --- | ---: | --- |
| Mixed no-tree daisy/lavender/grape/apple | 4.792 | Appearance/use variety rather than best shipping combination |
| Mixed tree/strawberry/lavender/apple + treatments | 4.516 | Real treatment supplies and two chores every seventh day |
| Same mixed household garden, no treatments, personal use | 2.458 | Actually enjoys flowers and sometimes eats fruit |
| Personal use plus treatment chores | 2.116 | Both opportunity costs remain real |
| Mixed garden skipping well on two consecutive days each fortnight | 3.812 | 49 wilted plants; imperfect policy deliberately retained |

The personal-use policy reserves at most one household flower and one fruit, uses a flower below 80 morale and chooses own fruit at every third-day breakfast when available. It consumes goods rather than granting their effects while also selling them. Lower exports buy domestic satisfaction/routine space. This is a legitimate personality, not a broken seller or an assumed median return.

All four crafts together require 27 wood. The integrated one-tree mixed treatment schedule first makes a spoon on Day 14, boat on Day 27, birdhouse on Day 48 and chest on Day 83. Isolated earliest-craft tables from the older research do not include all this competition and must not be presented as the same schedule.

### Why these values have a useful resource bound

The reference allocation gives one point per minimum occupied plot-day and two per main undertaking. A one-shot crop of `t` growth ticks occupies `t+1` relevant daily plot opportunities, because its pickup day cannot also replant. Add one planting main and at least a quarter of a four-bed harvest main:

`annual value = (t + 1) + 2 + 2/4 = t + 3.5`

This gives 6.5 / 9.5 / 11.5 for the 3 / 6 / 8 tiers. A six-yield perennial uses at least 19 occupied plot-days plus one planting main and six quarter-harvest shares: `(19+2+3)/6 = 4` per fruit. A ten-yield tree uses 25 occupied plot-days plus planting and harvest shares: `(25+2+5)/10 = 3.2` shadow points/wood. A craft converts that wood shadow value and adds two points for its main. Wood itself is never exported or monetized twice.

Four plot-days plus one main/day yield a **conditional long-run six-point resource envelope** from an empty productive start. It assumes this exact closed catalog, finite pickups, no free finished goods and no unaccounted productive bonuses. This is a conservation allocation, not an exhaustive optimal policy proof. Inventory built earlier can legitimately ship a much larger lump; four saved chests are 136 points. Enforcing six tokens per shipment would destroy the connection to saved work.

## First token-funded life

[Independent six-decimal integer arithmetic](independent-crosscheck.json), importing the physical model but no currency model code, reproduces these first thresholds for **one fixed NFT in an otherwise empty economy**, saving all proceeds:

| Constructed policy | Game day reaching 250 | Saved tokens immediately before | Saved tokens on crossing |
| --- | ---: | ---: | ---: |
| Best observed | 57 | 247.030588 | 268.126361 |
| Mixed treatment chores | 58 | 233.885336 | 253.792217 |
| Personal use | 105 | 232.495093 | 253.596971 |
| Personal use + treatments | 127 | 248.124854 | 254.592757 |

These are active game-day examples, not calendar durations, gas payback, actual Jev behavior or value promises. Other players' issuance makes later milestones slower. The optional sensitivity check adds each of nine possible birth seeds to all four policies: all 36 variants have identical shipment arrays and threshold days. The selected flow still omits that extra birth choice.

## Reinvestment and monetary pressure

The currency model takes four frozen 2,190-day physical shipment profiles and tests 35 scenarios. Cohorts pool earnings and reinvest immediately, with newborns starting at the next opportunity. These are deliberately strong-holder scenarios with competent care, no mortality requirement and no external token valuation.

Under 100 founders, one game-day opportunity per real day and 365 real days, with no bucket, current-supply pressure `S` produces 85,380 NFTs and 21.32 million cumulative issued units. Non-resetting pressure produces 1,339 NFTs and about 309,950 issued. This is a mechanism witness: NFT purchases both burn tokens and add producers, so allowing the burn to reset reward prices undermines the brake. These numbers are not population forecasts.

The selected pressure does not limit total lifetime NFTs or guarantee an external token price. It also gives later entrants fewer tokens for the same goods. Free supplies keep playing independent of currency wealth, while the optional 250-token birth goal takes longer. The actual-time bucket supplies the separate finite-time bound.

| Physical policy, 1,000 founders, six game days / real day | Burst + refill / 24h | Horizon | Actual-payout packet blocks |
| --- | ---: | ---: | ---: |
| Fixed population | 10k + 10k | 365 real days | 223 |
| Fixed population | 30k + 30k | 365 real days | 0 |
| Pooled reinvestment | 10k + 10k | 365 real days | 727 |
| Pooled reinvestment | 30k + 30k | 365 real days | 0 |

The selected reinvestment case ends at 12,683 NFTs and about 2.921 million issued tokens. The deliberately optimistic six-point envelope at 96 opportunities per real day triggers the 30k breaker while respecting its bound; it issues about 10.978 million over 365 periods. An interval can spend credit already reserved at its start, so the correct initial term is `A+R`, at most capacity, plus elapsed refill. Burns do not refill it.

**Reservation liveness is not established by the table.** The cohort model reserves and settles actual packets immediately. It does not hold worst-feasible quotes through inference. A thousand launch-price four-chest quotes need 136k of reservation, exceeding a 30k bucket even if many roosters would not ship. The selected care-only admission rule preserves play and goods when such reservations cannot fit. Price snapshots also grant an ordinary timing advantage; the model does not promise perfect fairness under concurrent submissions.

Currency scenario arithmetic uses floating-point aggregation for speed with tolerances; it is a comparative design model. Exact integer witnesses separately verify six-decimal quotes, a 68-token four-chest shipment at half factor, and 7,693 second/refill/reserve/settle states. Production money must use the specified integer formula and checked bounds.

## Settlement and ownership critique

The [bounded reference model](settlement.json) passes 35 focused witnesses: finite output, material conservation, once-per-day shipment, failure/expiry/retry, owner/domain authority, purse withdrawal after death, withdrawal while a day is pending, explicit care-only entitlement, first-kit replay, atomic purse-funded NFT creation and stale spending permissions after ownership returns. It also covers 251,001 rounding pairs and 441 tiny reachable bucket states / 3,255 transitions.

Those counts are inexpensive evidence for the abstract economy slice, **not an audit, Solidity/Rust proof or complete biological reducer**. Its terminal fixture stands for a separately validated death trace; no fixture boolean or supplied death flag may become production authority.

Concrete corrections selected from the loops:

- One four-item action is insufficient: shipping must also be limited to one round/day.
- Bind and reserve the full feasible accepted quote; never consume goods then clip payment.
- Preserve care when capacity is busy; shipping entitlement is explicit before payment.
- Separate purse credits from biological snapshots, so pending work cannot overwrite a withdrawal.
- Keep the memorial NFT and direct owner exit after death; pay valid shipments before a later terminal event.
- Use an owner-only atomic purse-funded birth helper, and invalidate spending intents on transfer.
- Do not silently consume goods for a zero-unit rounded quote.
- Reject late settlement even if nobody has run expiry cleanup; exactly one terminal outcome.
- For NEAR, guard tentative transfer-call ownership and prototype private resolver/recovery before claiming compatibility.

## Chain feasibility and fee boundaries

The EVM candidate is a game/NFT controller plus a separate controlled ERC-20. Native NEAR's candidate is a combined NFT/FT/game account to avoid external token callbacks during reward, purse withdrawal and token-funded birth. This is an implementation hypothesis to prototype, not completed compatibility.

NEAR external calls and callbacks execute independently and do not provide automatic rollback; a separate FT contract would need explicit durable pending/reconciliation logic. A tentative NFT transfer-call must not allow its receiver to drain a purse and then return the NFT. These conclusions follow from the [NEAR cross-contract documentation](https://docs.near.org/smart-contracts/anatomy/crosscontract), [NEP-171](https://github.com/near/NEPs/blob/master/neps/nep-0171.md) and [NEP-141](https://github.com/near/NEPs/blob/master/neps/nep-0141.md). Combined core does not remove storage-registration, token event or ownership requirements.

The developer's NEAR testnet account is funded and recorded separately. RH and NEAR have independent lives, supply and issuance budgets. There is no bridge or aggregate cross-chain ceiling in this design.

Native fees are not game-token sinks. Three historical testnet receipts in [the earlier fee evidence](legacy-observed-fees.json) had processing fees below the relay execution-gas component alone. No test-ETH USD valuation was assumed. The public fee multiplier remains adjustable, but its launch value must follow actual end-to-end settlement, inference and hosting cost measurements. A busy game does not automatically mean a profitable operator.

## Short experiment record

| Question | Evidence | Change | Result and decision |
| --- | --- | --- | --- |
| Can four plants coexist with care? | Bottle conservation fails; routine contention is tight. | Well round, genuine breakfast, planting includes first water. | 350 schedules and mixed treatment chores retain care capacity; select baseline. |
| Must everyone choose the same crop/craft? | Best observed classes are close; personal use trades sales for care. | Keep finite catalog and real uses; raw wood is material only. | Retain prices for testnet validation; do not force Jev to maximize them. |
| Does burning to create NFTs safely reduce rewards? | Supply-only reinvestment restores launch prices. | Store non-resetting cumulative issuance pressure. | Preserve expansion without price reset; acknowledge slower late milestones. |
| Can a daily cap destroy saved work? | Four chests legitimately exceed the average work rate. | Reserve whole shipment, round once, never clip. | 68 tokens at half factor; select backed quotes. |
| Can a busy market trap care? | Worst-feasible reservations exceed actual packets; 1,000 four-chest requests need 136k. | Explicit care-only accepted day. | Goods and life continue; no arbitrary concurrency promise. |
| Can funds survive failure, transfer and death? | Snapshot purses and tentative NEAR transfer create concrete holes. | Incremental claims, owner exit, intent nonces, async guards. | Abstract witnesses pass; native implementation gates remain. |
| Does the saved research reproduce outside scratch? | Reran promoted models with only permanent inputs. | Redirect generated outputs to newly created TEMP directories. | Identical meaningful scenario metrics; six-decimal cross-check preserves all threshold days. |

## Reproduction and remaining gates

See [standalone model instructions](../../scripts/economy-research/README.md). They use Python's standard library and Node built-ins, require no wallet/network/AI, create their outputs under ignored TEMP, and have no TEMP input dependency. Frozen profiles and compact evidence are permanent. Full daily traces can be regenerated without storing megabytes of redundant captures.

The preserved manifest records source and evidence hashes. The older [provisional economy research](legacy-research-index.json) remains useful derivation history; its open questions and optional paid-seed/current-supply candidates were superseded by the selected V2 baseline where stated.

The next work is a **small authoritative-transition and chain-cost prototype**, then the revised map/public-life/purse mockups and actual multi-day Jev play. Full incident survival, native NEAR transfer-call recovery, real reservations under concurrency, fee coverage and actual entertainment value require that implementation evidence. No further abstract parameter sweep is needed before it.
