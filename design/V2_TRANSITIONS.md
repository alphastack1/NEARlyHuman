# V2 transition boundaries

Selected after the small-scale feasibility wave on 2 November 2026. This supplements [ECONOMY_V2.md](ECONOMY_V2.md). It specifies the next unified kernel; it is not a claim that the prototypes already implement that kernel. Actual experiments and limits are in [the feasibility review](../docs/v2-feasibility/REVIEW.md).

## One life snapshot, separate money ledgers

Use one authoritative material inventory for care items, seeds, earned wood and finished products. The biology experiment intentionally kept its new wood separate from V1 wood; that adapter is evidence, not the final architecture. A wood used for a comfort chair, patch or backup heat cannot also remain available to craft a saleable object.

The life snapshot contains day/level/life, five needs, conditions, four beds, material stock, relevant house state and a bounded intention. Each bed retains its soil state even when empty. Identity seed/name/stats belong to the NFT. Purse allocations, lifetime issuance, bucket/reservations, ownership and pending requests are distinct authority ledgers.

Newborn needs are health100 and food/water/energy/morale80. Stock is three bread and three water. Four empty beds retain no inherited productive assets. The first chosen kit can be delivered on Day1. No random V1 starter-care gifts are assumed by the new baseline.

## Clock and role budgets

Keep six biological phases and a deterministic sixty-slot clock while preserving existing condition/incident timing. Animation duration never changes that clock. A sparse submitted trace can omit quiet slots; the reducer still processes their elapsed time and relevant mechanical recent records.

| Role | Limit | Rules |
| --- | --- | --- |
| Delivery | One pickup | Only accepted supplies; no use before pickup. A valid terminal prefix can retain an unopened parcel as inactive estate stock. |
| Ordinary | Five total | Food/drink, breakfast, treatment, soap, rest/leisure, well, one outgoing shipment, and allowed mundane activities. A recovering pre-pickup morning action shares this budget. |
| Main | One | Plant one bed, harvest all ready, craft one object, repair a house fixture, restore one soil block, or an allowed domestic/quiet focus. |
| Acute response | Two maximum | At most one per eligible primary/task episode, before its deadline. Only nonproductive fire/rain interventions with their actual item/energy costs. No emergency medicine, arbitrary healing, shipping or production. |
| Implicit quiet | Remaining time | No recovery, item, extra use, new chance roll or cooldown reset. Canonical elapsed time **does** advance cooldown eligibility and deadlines. |

The ordinary openings are normally11/21/31/41/51 and the main is normally36. A simultaneous acute response can move the ordinary activity to the next available slot of that phase while retaining the global five limit. Never postpone a rescue beyond its deadline or grant a sixth ordinary action. A selected morning action must be counted even if its visual animation is part of the introduction.

Implicit quiet must remain visible to the six-logical-action mechanical history if retaining the existing fire-eligibility rule. The last meaningful Jev actions are a separate bounded memory; do not substitute one for the other.

## Legal production is deterministic

Planting, well watering, collecting ready output and crafting a recipe succeed when legal. These ordinary production actions have no new hidden failure or injury roll. Preserve competence rolls on explicitly tagged cooking/repair/risky domestic actions; safe eating, drinking and treatment remain100%.

A productive main or soil restoration requires at least300 energy units, equivalent to3%. Spend the300 once. Below that, productive choices are unavailable; rest or quiet remains possible. Do not clamp an attempted cost to zero while still awarding its output. Actual tagged domestic actions retain their declared individual costs and legality.

Started inputs, success/failure effects and competence draws are derived by the kernel, never trusted from the worker's reported deltas. A failed tagged main consumes its one main opportunity and actual started materials, but creates no success output. A second main cannot repair that result later in the same day.

Bed rules retain the selected3/6/8 wet ticks, pickup-gated two-tick repeats, six fruit/ten wood total yields, and initial watering. Soil blockage belongs to the bed, survives wilt/final pickup/abandonment and prevents planting. Compost consumes one item and one main to restore one bed; it never accelerates growth. Ready output holds one unit without silent regrowth/rot. The well also waters ready occupied beds so later pickup can begin wet regrowth that night.

One daily shipment consumes at most four actual finished units, with positive aggregate integer reward. Keep all other goods. Full real counters must not break quote calculation: cap temporary quote counts at four, exclude a craft with no real output room, and exclude the whole harvest alternative if any collected output would overflow. A quote exploration cannot mutate stored stock or alias another alternative's memory.

## A bounded positive care witness

Do not port the old `rescueFeasible` formula as authority for five ordinary opportunities. It counts logical slots and can borrow time beyond a reactivated condition's earlier deadline. The actual Day3 counterexample has two real surviving paths before a new illness and zero after it; merely changing60 to5 does not fix deadline borrowing.

For the next kernel, use a **positive, bounded rescue certificate** for harmful ordinary onsets. The worker provides a hypothetical legal care path from the proposed post-onset snapshot. The contract verifies that one path rather than searching all possible routines.

- Respect the real remaining ordinary opportunities, main availability, acute-response usage, pickup timing, supplies and every crossed deadline. At most two future completed game days may be considered; unsupported horizons fall back conservatively.
- Future kits obey three distinct types, at most one unit/type and normal availability. They establish an owner-selectable possible rescue, not a promise that the owner will choose that kit. They cannot appear before their actual day/pickup.
- Use the small deterministic care subset and actual already scheduled consequences. No assumed lucky competence roll, new favorable future incident, future structural outcome, sale, purse spending or invented productive output.
- Run this on a **pure owned snapshot**. Never clone a NEAR contract with storage collection handles and invoke mutating methods on the clone: the handles can still refer to actual storage. No external calls or persistent writes occur during verification.
- The hypothetical path commits no day, items, growth, recovery or reward. Apply the real proposed onset once only after admission; fallback must leave none of its rejected damage behind.
- Without a valid supplied witness, soften the proposed episode to quiet or its explicitly harmless profile. Preserve existing conditions and deadlines. This does not rescue an already doomed life or prevent an actual later foolish choice.

This is intentionally conservative. The service can omit a witness and soften an event that was actually survivable. Record the proposed profile, admission/fallback disposition and certificate identity in the committed trace. The nominal0.45 primary-proposal rate is not a guarantee of0.45 harmful onsets. This limited softening discretion is an explicit trust boundary; token conservation and the issuance bound do not depend on mortality or incident damage.

Keep the certified care options available to Jev when relevant. It may still choose differently. Neither a certificate nor the relay's legal action trace proves that Jev made a wise choice or that its response was cryptographically attested.

The ordinary episode structure remains at most one primary plus one bounded task complication. The owner-approved structural exception remains separate: rate0.00025, at most one draw at slot31 beyond Day1. It may end a well-cared-for life; record that cause honestly. Do not increase fatal noise to hit an old thirty-day target or use mortality as monetary control.

## Conditions and terminal order

Preserve condition kind, severity, onset, earliest due day and same-day resolved tombstones. Treating/reacquiring a condition must not reset its old deadline. This is what made the actual reactivated-illness witness important.

Each logical slot applies scheduled onset/choices and the fixed phase consequences in one specified order. All six need-loss boundaries execute. Living bedtime handles exposure, escalation, deadline deaths, allowed recovery, one garden tick and temporary-house aging in the same order on every port. An immediate terminal consequence stops later action and growth.

A complete living day or verified terminal prefix settles once. A terminal result records its attempted day but does not gain a living-level increment or later garden growth. A valid earlier shipment is paid even if death follows. An incomplete nonterminal provider failure commits no new kit/day/material result. It is not a death event. Expiry rejects late settlement even before cleanup; success, failure and expiry are mutually exclusive.

The next production controller must never accept `validatedTerminalFixture`, a supplied `alive` result, arbitrary output balances or a worker-provided purse snapshot as biological authority. The experiment's fixture helpers are deliberately excluded from this contract.

## Versioning, arithmetic and data

Use integer hundredths for needs, decipoints for product weights and six-decimal token units. Safe deterministic actions retain certainty; only competence-tagged tasks use the1–99% clamp. Integer probability comparisons should use a32-bit draw against basis points without floating-point money or platform-specific rounding.

Before merging ports, freeze shared draw/state/trace vectors, typed IDs and exact byte order. Keep a single declared casual-game draw algorithm/domain; do not silently mix JavaScript string hashing, Solidity integer encoding and NEAR host hashes. The sample biology seeds currently use the existing source's `hash32/randomAt`; a new accepted-seed derivation must be versioned and tested explicitly. No VRF or inference attestation is claimed or required by these conservation rules.

V1's16-bit kit mask,192-byte state and fixed item/target IDs cannot represent this expansion unchanged. A retained-care/nine-input/twelve-output catalog has about34 inventory types. Use checked generous quantities and explicit invalid/reserved-byte rejection. A rough packed snapshot estimate is near320bytes; it is not a benchmark or final ABI.

Keep current authoritative state and compact canonical history/commitments; avoid storing a full replay snapshot after every visual frame. Rich film packets can remain durably stored with a committed hash as in the existing architecture. Measure actual NEAR storage growth for the chosen history format. Native storage funding is separate from execution gas and project-token rewards, and belongs in the quiet total transaction quote.

Purse withdrawal and purse-funded births use their own nonce/accounting and never replace the biological save. Project events should identify the source NFT for earnings, withdrawal and birth, alongside standard token/NFT events. This makes public life history reconstructible without pretending that a generic vault transfer names its rooster.

## Native ownership and next implementation gate

Use a backed purse/controller on RH and the verified combined-account direction on native NEAR. Public NEAR FT methods cannot transfer allocated vault backing out; deliberate internal withdrawal/burn paths perform the correct allocation debit. Every genuine issuance increments pressure; token burns leave it unchanged.

NEAR transfer-call stays **off by default**. Actual local receipts verified ordinary accept/reject/panic and protected purse-drain attempts, but an injected failed resolver retains the tentative lock. No timeout can infer the missing receiver result. Direct transfer remains the initial path; full callback recovery, extensions and marketplace support require an explicit later design/test.

Build the unified owned-snapshot reducer first, including one material ledger and bounded care certificates, then verify matching fixtures in the contract module. EVM runtime size and native NEAR storage/gas must be measured for that full kernel; the current economy/custody measurements are lower-scope evidence. Actual Jev choices, full game flows and screenshots follow in the scheduled implementation/refinement waves.
