# Domain implementation

The serializable rules live in `src/domain/`, outside Phaser and DOM. `prepareDay` clones the canonical base, plans one daily undertaking and morning order, keeps delivery pending until physical pickup, performs sixty logical slots unless death stops earlier, and returns a complete result for settlement. Provider/checkpoint errors throw without mutating the base. Watching receipts never runs these effects again. The current policy and verified real day are recorded in the [continuous-day review](DAILY_LIFE_REVIEW.md); experiments below retain their original historical scope.

The later [choice-variety policy](CHOICE_VARIETY_REVIEW.md) keeps `GameState.recent` as mechanical logical history while providing separate bounded previous-day executed records and current-day meaningful actions to Jev. Optional menus cover useful activity families, preserve urgent care/project materials and retain sensible repeats. Its previous-day inputs are frozen with checkpoints; the worker binds them to canonical compact history before paid inference. The birth-seed personality mapping and state/history codec remain unchanged.

Public integration API is `src/domain/index.ts`: `GameState`, `Receipt`, `Candidate`, `ChoiceProvider`, `createInitialState`, `createDayContext`, `prepareDay`, `legalCandidates`, `shortlistCandidates`, `packState`, `unpackState`, `encodeHistory`, and catalog/condition helpers.

`ChoiceProvider` receives the exact ordered candidate map and returns one exact key plus optional actual telemetry. The domain does not resample probabilities, choose an argmax, or invent a response. Slot zero records the project and morning-order questions in one call; six phase openings offer routine choices, while urgent needs can interrupt. Quiet interludes resolve locally. A single-candidate slot can resolve without a provider call. `DayResult.decisions` counts genuine accepted provider choices, separately from its logical receipts.

`PrepareOptions.onCheckpoint` records the receipt-free slot-zero plan and each accepted logical slot. The caller persists `{context,receipts}` with its own job fencing; `resume` continues from that boundary without purchasing a second plan or duplicating delivery. Pass the accepted chain request's `daySeed` when available. The default is a deterministic versioned birth-seed/day derivation. Labeled random positions do not depend on renderer frames or telemetry.

## Canonical encoding

State is192bytes, little-endian, version1. Identity seed/name/stats are supplied separately by the contract. Header day/level are32bit, five needs and15 stock counts are16bit, followed by eight fixed condition slots, two plots, house/output flags and six compact recent-action records. `codec.ts` publishes offsets through its implementation and shared enum orders; the chain implementation uses the same starter-gift splice algorithm. Byte3 retains contributing death causes. A compact history is four bytes per logical receipt: action code, target code, variant code, outcome flags. Terminal128 is always present on the last fatal receipt. A slot-entry structural death uses T01/terminal-only as an event marker and buys no model choice.

Needs use integer hundredths. Body/Spirit adjustments round once per tagged effect; Wits modifies competence, not choice preference. Food/Water deficits clear above30, retain same-day tombstones, and can reenter with the same earliest deadline. Bedtime checks contamination, disease burdens/progression, wound recovery/progression, Jitters and lethal deadlines before living-only sleep/healing/garden/output aging/level.

## Explicit initial tuning

Root accepted a provisional primary-admission rate0.45 with uniform eligible family selection and one black-swan rate0.00025 at slot31 beyond day1 for initial testnet work. These are unmeasured v1 tuning values, not evidence for a thirty-day lifespan. Neither depends on rooster age. The director conservatively filters new harm/stock loss against a bounded stock/slot rescue witness and falls back to quiet/relief. That witness can omit an event even where a more elaborate garden/recipe path would exist; it never forces a treatment or alters Jev's accepted choice.

## Small verification record

`npm run test:domain` runs twelve fast `node:test` checks: starter/codec; provider-failure preservation; full quiet clock; current-day milk rescue versus outage; separate treatments/atomic costs; garden/output maintenance; late ignition; terminal cutoff; checkpoint equivalence; and stable offered/history vocabulary. Standalone TypeScript checking also passes. No population balance, actual-Jev behavior or runtime renderer claim follows from these checks.

Experiment: a mature rose was not offered for harvest in an all-full morale fixture. Evidence showed it correctly lacked a useful reward. The fixture was changed to actual low morale, retaining the eligibility rule. Decision: keep useful-effect filtering rather than add purposeless paid choices.

Experiment: history vocabulary review found steak-bait's variant missing from the stable enum. Added its code at the end without renumbering existing entries. Decision: keep the finite action/target/variant codec explicit.

Experiment: independent review found an incident admitted and resolved in one slot disappeared from both endpoint snapshots. Added receipt decisionSnapshot after admission, preserving slot-entry before for full changes. A targeted fire witness now proves none → flame → none with the actual douse water cost; the renderer uses the decision snapshot before impact.

Experiment: very-low-health fire could make all responses fatal, and the small random shortlist omitted storm exposure responses. Ordinary fire now requires a survivable shutdown or an affordable douse preserving existing deadline rescue. All current fire, storm and pest responses are retained with explicit dueSlot and bounded decision situation. The frozen decision configuration uses eight normal offered choices, expanding only for mandatory care/response options up to the upstream hard limit of24; its hash is bound to admission and accepted requests. Two focused regression witnesses pass. No further broad test expansion follows.


Experiment: the first real Jev day used its available supplies/rest/leisure early, then50 receipts were the same hall idle. Approved ambient-v1 keeps exactly one zero-cost/no-benefit T01 candidate but seeds its destination among existing window/store/cupboard/gardenView/hall anchors, avoiding the two recent idle destinations. Matching concise messages and renderer look/preen cues make quiet time visible. It adds no paid choice when idle is sole legal, consumes no rest/leisure allowance, and changes no needs or reward. The existing full quiet-day witness also checks varied non-repeating targets while retaining exact biological totals.
