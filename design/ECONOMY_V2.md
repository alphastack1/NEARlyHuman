# NEARlyHuman V2 — a life that grows, makes and owns things

Design decision: 2 November 2026. This is the recommended next version, selected after the owner delegated the balancing decisions and three specialist reviews. It is **not deployed behavior**. The current Robinhood testnet collection, live game and paid-service settings remain unchanged.

This document is the authority for the next design pass where it differs from earlier economy brainstorming. The original guide and mockups still define the game's character and visual quality. Supporting calculations, experiment limits and reproduction instructions are in [the research record](../docs/economy-v2/RESEARCH.md).

## The player experience

Bring a few supplies. Watch a particular little mind make something of them. Its garden, workshop, possessions, memories and earned tokens belong to that NFT. The player helps; Jev decides how the day goes.

Keep the existing continuous day, following the rooster through connected rooms and the front door. Extend the yard into a clear four-bed garden with a well, a modest workshop and the existing roadside mailbox. Growing plants visibly change. A harvest is carried home; wood becomes an object at the bench; outgoing goods are physically carried to the mailbox. The house and yard remain part of one game, not a collection of management dashboards.

The normal loop remains **Prepare day → watch → see what changed → Prepare day**. There is one main action in each screen. Supplies, elapsed growth and saved intentions make the next day interesting without a new checklist for the player. Day results lead with growing, making, caring and the rooster's personality; earnings are compact secondary feedback. A token-funded new life is optional, not the measure of a successful day.

### What the player controls

- Choose up to three different supply types for the next day. At most one is a seed packet or sapling. Care supplies are free game inputs; the native processing fee is separate.
- Inspect a plant, object, pantry or mailbox by touching it. Small details reveal readiness, remaining yields, useful stock and outgoing goods where they matter.
- Withdraw earned tokens, or spend 250 of them to create another life. These are explicit owner actions; Jev never spends the purse in this version.
- Share a link to this exact life, or transfer the NFT with its saved world and purse.

Jev chooses planting, watering, breakfast, other care, the day's main project, keeping versus using produce, crafting and shipping. The player does not have to order every movement or approve every sale.

### The first few days

1. The free visitor experience shows an actual saved day. An exact-NFT link opens that life immediately and preserves visitor context; it must not substitute the default demonstration rooster.
2. Minting creates a procedurally varied rooster and home with **3 bread, 3 drinking water and four empty plots**. No wood, finished saleable products or hidden token grant. Keep seed choice out of the mint form.
3. The first Prepare day dock makes a bread/water/quick-flower-seed kit the obvious starting arrangement, editable with one tap. The morning parcel and a visibly empty bed establish the connection through the rooster's actions.
4. If Jev plants the quick seed on Day 1, its three wet bedtimes make it first collectable on Day 4. Seedling stages and moist/dry soil communicate progress. The rooster may enjoy the flower or ship it; either outcome has an obvious local animation.
5. The first actual shipment briefly shows the parcel leaving and the purse increasing by the committed amount. No financial tutorial, exchange chart, extra currency meter over the playfield or automatic wallet prompt.

The suggested first kit does not force Jev to plant or guarantee a sale. Its choices must still be real. The visitor sequence should demonstrate at least one grown object reaching the mailbox so the purpose is visible before purchase.

## A readable day with room to breathe

Retain Dawn/morning plus five ordinary routine opportunities and **one substantial undertaking**. The main undertaking happens during the afternoon and can be:

- Plant one empty bed.
- Make one physical harvest round collecting all currently ready beds, up to four.
- Craft one object from existing wood.
- Continue a nonproductive domestic activity, or have a quiet day.

These are logical commitments, not extra buttons the player has to schedule. Animation may show several scoops, cuts, assembly stages or walks without inventing more main undertakings. Ordinary routines include eating/drinking, a well-watering round, appropriate treatments, leisure and one outgoing-mail round. A combined breakfast consumes one actual food and one actual drink, with both costs and effects. It is not free extra recovery.

There is **one shipping round per completed day, up to four finished units total**. Extra goods stay in the cupboard. A main harvest cannot also be a main craft. Harvested fruit can still be used or shipped in a later ordinary routine that day. All travel remains continuous; no teleport between plot, workshop, pantry and mailbox.

Emergency responses must have explicit bounded rules in the canonical day trace. They cannot quietly create additional planting, crafting or shipping turns. Preserve room for the existing varied small routines; do not turn five opportunities into five compulsory production chores.

Nothing ages, grows, regrows or earns while the player is away. Rewatching, seeking, skipping, API waiting, failed attempts and wallet transfers advance no biological clock. No arbitrary wall-clock cooldown is added to an otherwise valid game day.

## Four slots, nine plant choices

All figures below are selected **V2 testnet defaults**. Growth counts completed wet bedtimes, not time spent watching. Base points are internal valuation weights; the player sees the current token quote when relevant.

| Plant | First growth ticks | Total pickups | Ticks after pickup | Base points per output | Personal use of one output |
| --- | ---: | ---: | ---: | ---: | --- |
| Daisy | 3 | 1 | — | 6.5 | +15 morale |
| Marigold | 3 | 1 | — | 6.5 | +15 morale |
| Lavender | 6 | 1 | — | 9.5 | +25 morale |
| Rose | 8 | 1 | — | 11.5 | +35 morale |
| Strawberry | 3 | 1 | — | 6.5 | +30 food, +15 water |
| Blueberry | 6 | 1 | — | 9.5 | +40 food, +10 water |
| Grape | 8 | 6 including first | 2 | 4 | +35 food, +25 water |
| Apple | 8 | 6 including first | 2 | 4 | +60 food, +10 water |
| Wood tree | 6 | 10 including first | 2 | Not directly saleable | One wood per pickup |

Four slots means four total plants, including trees. Daisy and marigold intentionally share mechanics and differ in appearance. Flowers have morale uses; fruits have nutrition/hydration uses. Using an output consumes it, so it cannot also be sold. Personal-use gains are capped at the need's maximum. These are V2 values, not a description of V1 apple recovery.

### Water, readiness and finite harvests

- A nontradeable well supplies garden water. Drinking bottles are for the rooster.
- Planting consumes one actual seed/sapling, includes initial well watering and sets moisture to 2.
- One small watering round sets every occupied slot to moisture 2, including ready plants. That matters if a ready plant is picked later the same day and begins regrowth.
- At a committed living bedtime, a growing wet plant gets at most one growth tick and moisture falls by one. A dry growing plant pauses; the second consecutive dry growing bedtime wilts it. A wet growth tick resets that dry streak.
- A ready plant holds exactly one output. It waits without producing more or rotting. There is no hidden stack of repeat fruit or wood.
- Collection creates one output, decrements the remaining lifetime count and starts the two-tick repeat timer, if any. The collection day's bedtime may supply its first repeat tick. The final pickup clears the slot.
- No fertilizer acceleration, bonus yield, saleable loot event or free raw-wood delivery is included in this baseline. Any later productive bonus must be added to the conservation rules, reward bound and balance evidence first.

A Day 1 planting is first collectable on Day 4, 7 or 9. With immediate pickup and uninterrupted wet growth, a tree gives wood on Days 7, 9, …, 25; grape/apple give fruit on Days 9, 11, …, 19. Delaying a pickup delays regrowth. A failed day applies no tick.

The free daily kit permits at most one seed/sapling and at most one unit of each selected type. Other positions can carry food, drink or treatment supplies. The model's normal kit is bread + water + one seed; two treatment deliveries per week displace two of those seed deliveries. No paid seed shop is required to keep playing.

Care deliveries have no direct sale/transfer/recipe-conversion route. Persistent inventory uses checked, generous integer bounds; there is no silent overflow, destructive automatic sale or small cupboard cap that invalidates the studied schedules.

## A workshop with choices rather than subrecipes

| Object | Wood consumed | Main undertakings | Base points |
| --- | ---: | ---: | ---: |
| Spoon | 3 | 1 | 11.6 |
| Toy boat | 6 | 1 | 21.2 |
| Birdhouse | 8 | 1 | 27.6 |
| Large chest | 10 | 1 | 34 |

One craft consumes its wood once and makes one object. No additional toolkit, ingredient tree or multi-day work-in-progress system is required. Small crafts conserve wood; larger crafts use fewer workshop days per wood. Main-action competition means neither advantage establishes a universal winning recipe.

Wood collection itself mints no currency. Finished objects are stored or shipped. Personal household placement, if later allowed for these objects, must consume/reserve the real unit and block simultaneous shipping; permanent buffs are outside this baseline. Existing decorative/comfort work can remain non-saleable where that keeps the rules honest.

The four recipes together use **27 wood**. A single ten-yield tree cannot supply all four. In the integrated one-tree mixed treatment schedule, the first spoon/boat/birdhouse/chest appear on Days 14/27/48/83. That is a useful long-term arc; do not advertise a twenty-day trial as covering the whole catalog.

## One modest long-term intention

Store one bounded goal ID, its creation day and its next review day. Start with no goal, enjoy-a-flower, tend-the-garden, and save-for-spoon/boat/birdhouse/chest. Progress comes from real wood, recipes, plants and saved inventory; do not store a second invented progress balance.

Jev sees that intention alongside needs, deliveries, personality, recent meaningful actions, ready plants and current selling values. A goal biases choices without forcing them or preventing sensible care. Review it on completion, immediately when impossible, or after three committed days without relevant progress. A review invites reconsideration, not forced production; a long chest-saving goal can remain worthwhile. Update it only with a committed result; failed provider text never becomes permanent memory. No freeform executable diary, wallet address memory, extra memory model or independent token-spending agent.

No goal creates an output, grants an extra turn or authorizes money. Personality can explain a slower seller who enjoys flowers or saves for a chest. Avoid forcing every rooster into the best observed toy-boat policy.

## The token model

The project token is game currency with a fixed token-funded NFT price during a season. It has no promised cash redemption or exchange rate. The native-coin mint option remains separate; its price policy and processing fees do not feed this token curve.

| Parameter | Selected first V2 testnet value |
| --- | --- |
| Native token decimals on both implementations | 6 |
| Tokens to create one new NFT | 250, burned in full |
| Initial tokens per base point | 1 |
| Reward pressure scale `K` | 50,000 tokens |
| Pressure `P` | Cumulative tokens ever issued, stored directly and never reset |
| Issuance bucket capacity | 30,000 tokens |
| Continuous refill | 30,000 tokens per 86,400 seconds |
| Firm accepted quote | Current pressure at request acceptance |
| Pending-day deadline | 15 minutes, subject to measured service-latency validation before public release |

Use the token contract's actual `totalSupply` for outstanding supply. Wallets, treasury holdings and vault tokens backing living/dead purses are already included. Purse allocations are claims on those vault units, not additional supply to count again. Transfers and withdrawals change neither supply nor pressure.

Store `P` directly as cumulative issuance, incrementing it for every genuine token mint. A token-funded birth burns 250 outstanding units and records that NFT-mint burn without reducing `P`. Under the modeled baseline with no other burns, `P = totalSupply + cumulativeNFTMintBurns`. Storing the issuance counter directly keeps the rule correct even if a standard token-lifecycle operation burns units; such burns also leave `P` unchanged. This is deliberately **lifetime issuance pressure**, not literal circulating supply. No ordinary burn-reward mechanism is added in this version.

This is a small but important revision of the original supply-only idea: buying more producers must not repeatedly reset their output price to its launch level. It means later roosters earn fewer tokens for the same goods. Free care inputs keep their game playable; a further token-funded birth takes more play. Do not secretly reset the pressure at season boundaries. A season fixes the NFT price; it does not restart balances, plant lifetimes, nonces or issuance controls.

For shipment base points `B`, the conceptual quote is:

`tokens = B × 50,000 / (50,000 + P)`

At `P=0`, a daisy quotes 6.5 tokens. At `P=50,000`, it quotes 3.25 and a chest quotes 17. These are unit examples, not market prices. Four previously saved chests can validly ship together for 68 tokens at that pressure. The long-run six-base-point resource bound is **not** a daily payout cap.

### Exact arithmetic and a bounded burst

Use integer decipoints `D`, one token `U=1,000,000` smallest units, and `K=50,000×U`. Bind `P` in smallest units at accepted request:

`rewardSmallestUnits = floor(D × U × K / [10 × (K + P)])`

Aggregate the shipment first and round down once. No floating-point monetary arithmetic in production. The implementation must use overflow-safe multiplication/division and explicit inventory/clock bounds. Both chain implementations use six decimals; never format these amounts with an eighteen-decimal native-ETH helper.

Let `A` be available issuance capacity, `R` reserved capacity, `C=30,000×U`, and `r=30,000×U/86,400` per second. Refill only into unreserved space. Reserve a quote by moving its maximum from `A` to `R`. Settlement removes the reservation, credits the actual reward and returns unused room. Terminal failure/expiry returns the same reserved capacity once. Always maintain:

`A ≥ 0; R ≥ 0; A + R ≤ C`

Refill uses integer seconds with a fractional carry; discard carry when saturated so there is no hidden second bucket. Over an interval, minted tokens cannot exceed starting stored credit **`A + R`**, which is at most `C`, plus elapsed refill. Include existing reservations because they may settle inside that interval. Burns do not replenish capacity. A full initial bucket plus a day's refill can permit 60,000 tokens during the first 24 hours. This is a continuous backstop with a burst, **not** a 30,000-per-calendar-day claim.

The backstop is per deployment, not shared between RH and NEAR. The curve and bucket slow issuance; they do not fix market value or promise a maximum population. Skilled repeat play and new life creation remain welcome.

### Firm shipping and uninterrupted care

Before accepting a paid day, compute the maximum legal shipment from existing finished stock plus the best possible **single** main undertaking: either all currently ready harvests or one currently affordable craft. Select the top four actual finished units in each alternative and reserve the largest quote. A newly planted crop cannot mature that day; raw wood has no direct sale value. Any future event that creates a good must enter this bound.

The owner's accepted request binds the quote, catalog and shipping entitlement. An accepted shipment is never repriced, clipped or refused after its goods have been consumed. Existing reservations survive price changes until valid completion or terminal failure/expiry. The current quoted goods value can be inspected at the mailbox; it is not fixed back when the seed was planted. If an aggregate shipment rounds to zero token units, Ship is unavailable and its goods remain; never consume products for a zero payout.

If full shipping capacity is unavailable, offer the **same day flow with shipping disabled**, clearly reflected before payment by a compact resting-mailbox cue and “Post later.” Jev can still eat, tend, harvest, use or craft; Ship is absent from that accepted day's legal choices. Goods remain intact for a later day, quoted then. The signed request explicitly binds this mode. Never silently downgrade an already accepted shipping-enabled request. A race that loses its reservation must refresh the quote before admitting a care-only day.

This is a rare market state, not a new regular setting or compulsory modal. It prevents market congestion from trapping a sick rooster or turning stockpiled chests into a reason every care day needs a large reservation.

The normal-cohort currency experiment settles actual packets immediately. It does not prove that worst-feasible reservations held during inference never queue: at launch, 1,000 simultaneous four-chest reservations would need 136,000 tokens, more than the 30,000 burst. The explicit care-only path handles that distinction. Bound pending requests and release expired reservations; do not promise arbitrary concurrency from a payout simulation.

## What the NFT actually owns

Each NFT has a distinct onchain purse allocation. Earning mints actual project-token units into the vault and credits that allocation. The current NFT owner can withdraw to their wallet. Transfer of the NFT conveys its saved life, productive inventory, goal and remaining purse together. NFT approvals do not separately authorize purse withdrawals.

Death stops days and future production. It does **not** burn the NFT or erase banked currency. Keep a memorial NFT as the ownership/claim record, with withdrawals available to its current owner even if the AI service is offline. All remaining unshipped productive inventory becomes inactive; it is not an owner withdrawal route. If a valid chronological day ships goods before a later death, that earlier valid shipment is still paid.

Purse allocations are separate from biological state revisions. Settlement adds earned units; it never replaces the purse with the worker's snapshot. Consequently the owner can withdraw old earnings while AI is processing a day. The baseline day never spends purse tokens. Ownership transfers remain locked during a pending day, and become releasable through a direct expiry path.

For a clean token-funded birth, prefer an owner-only transaction that burns 250 from **one selected owned NFT purse** and creates the new NFT to that owner atomically. It avoids a compulsory withdraw/approve/mint sequence. A wallet-token payment route can coexist. The purse debit, backing-token burn, burn counter and new NFT must succeed or revert together. This is explicit owner spending, never an AI action, and does not rewrite the source life. Async transfer-pending ownership cannot use this helper.

The action uses that selected purse's balance, not a sum across NFTs. If funds are split, offer the direct withdrawal-to-wallet route for combining them. Bind spending to chain, collection, source NFT, current owner, season/price, birth parameters, native fee, deadline and an intent nonce. Advance the nonce on ownership changes as well as spending, so a stale permission cannot revive after an ownership round trip. Native NEAR owner authorization uses the immediate predecessor, not the original signer through an arbitrary forwarding contract.

Fee treasury permissions cannot sweep allocated purse funds. Avoid an unbounded administrator mint-to-any-address role or blanket withdrawal pause that contradicts these guarantees. New admissions/issuance can be paused separately. Any upgrade authority must be disclosed honestly; do not describe an administrator-controlled deployment as immutable.

## Contract authority and the actual trust boundary

Do not bolt valuable token rewards onto V1's accepted state blob. V1 checks structural limits and trusts its relayer's biological/material save; it does not verify all productive consequences.

V2 needs a bounded deterministic day reducer. Jev selects legal actions; the contract derives or verifies the resulting care, incidents, growth, material consumption, crafts, death and shipment points from the previously accepted state. The worker cannot submit an arbitrary output balance, purse snapshot, reward amount or death flag. Use one clear rule specification and matching TypeScript/Solidity/Rust fixtures; rendering and walking do not create authoritative inventory.

Bind a request to chain, collection, token ID, current owner, base revision/hash, next game day, attempt nonce, rules/catalog version, care kit, decision configuration, quote, shipping entitlement and deadline. One pending request per life; one commit per accepted attempt. A complete living day or a validated chronological terminal-death prefix can settle once, including its real kit and any legitimate shipment before death. Do not turn a validated death into a failed attempt because optional later narration or animation fails.

An incomplete nonterminal trace followed by provider failure applies no kit, growth, output, token reward or biological day. Retry is a fresh attempt against the unchanged accepted save and may choose a different kit. It never reinitializes birth stock. Settlement, failure and expiry are mutually exclusive terminal outcomes with one reservation release/consumption. Settlement checks the actual deadline even when no expiry-cleanup transaction has run. Confirmed native transaction/processing costs are not deleted or refunded.

The service is still trusted to submit Jev's delegated choices. A valid action trace does not prove the choice came from Jev, and a malicious relay may make legally foolish choices. Enforce conservation and ownership rather than claiming fully trustless AI. Use limited settlement authorization, bounded requests and direct recovery/withdrawal paths. Pseudo-random outcomes must never introduce an unbounded economic gift; the game does not need a tradable rare-random-jackpot system.

## RH and native NEAR

Share game semantics, catalog IDs, public-life presentation and contract fixtures. Use distinct chain adapters and deployment identities. An identity is `(chain, collection, token ID)`, never a token number alone.

- **Robinhood/EVM:** an ERC-721/game controller plus a separate controlled ERC-20 and backed purse ledger. Controller minting follows the verified reducer and issuance bucket. Safe token handling and reentrancy protection cover withdrawal, token-funded births and NFT receiver callbacks.
- **NEAR:** first prototype a single account holding NEP-171 NFT, NEP-141 token, game and purse ledgers. This may allow reward credit, withdrawal to the owner's registered FT ledger and token-funded birth to be local atomic mutations. Distinct storage namespaces, events, registration and storage payments still need implementation. No storage-unregister path may burn vault backing allocated to purses. This is a preferred design to validate, not a claim of completed standards compatibility.
- NEAR's transfer-call can provisionally move an NFT and later return it. Block purse/game mutations during that provisional ownership and require a private resolver with reserved gas and explicit recovery. Test the reject/return/failure paths before enabling that route. Do not promise marketplace compatibility until it works. Direct transfer is the simpler initial path.
- These are separate worlds with independent tokens, pressure and budgets. No bridge, global supply counter or duplicated purse claim. Show the current world quietly and switch deliberately; never copy an RH owner proof to NEAR.

The funded NEAR developer account is recorded in [NEAR testnet preparation](../docs/NEAR_TESTNET_PREPARATION.md). No new key per rooster is required. Mainnet remains deferred until the whole candidate is tested and finalized.

## The public life page

Make this a small playable-looking window into the exact rooster's home. Lead with its portrait/name and saved home, with one obvious **Watch day** action. A compact strip can show day/level/life and purse. The owner gets Prepare day; visitors get a quiet way to begin their own life. Saved history and the purse drawer are secondary surfaces, preserving return context.

The public portrait must reflect saved development: current age/level/life, a garden/workshop cue and a notable crafted possession where appropriate, all derived from canonical facts. Keep the mint appearance seed stable so the rooster stays recognizable. A memorial gets a gentle final portrait rather than an invalid asset link. Metadata, public route and game must agree on chain and token ID.

Mockups should cover: new visitor, growing garden, harvest/carry, workshop assembly, outgoing parcel/purse feedback, public life, owner purse/withdraw/new-life, memorial withdrawal, shipping-resting day and chain switch. Keep two or three related states per board. Preserve the approved top-down game art and clean phone layout; no extra economic dashboard around it.

## Evidence, decisions and next work

The integrated study covers 350 constructed 365-day schedules. Competent baseline care remains feasible; a mixed treatment-chore schedule retains about 21% of ordinary routine opportunities. Best observed exports are 5.445 base points/game day; a personal-use garden exports about 2.458. These are deterministic design witnesses, not actual Jev results or a complete mortality proof.

In an otherwise empty economy, one fixed NFT saving all proceeds reaches 250 tokens on illustrative Days 57 / 58 / 105 / 127 for best-observed / mixed-treatment / personal-use / personal-use-treatment policies. Other issuance slows these thresholds. These are active game days, not calendar durations or financial payback claims.

The next implementation order is selected:

1. Freeze the smallest complete canonical V2 care/incident/action specification and bound the serialized state/trace. Retain the studied production rules; measure, rather than assume, what fits on each chain.
2. Make a small Solidity/Rust feasibility prototype with matching fixtures: finite harvests, craft/ship conservation, failure/retry, reserved quotes, zero-shipping care, dead/pending withdrawals, token-funded birth and NEAR transfer-call recovery. Check gas/storage/latency before committing to the full contracts.
3. Mock up the revised yard, workshop, public life and purse flows together, with first-use progression and small feedback. Review against real phone dimensions before extending the full game.
4. Build the V2 candidate in isolation from V1, then run several actual Jev personalities across enough committed days to show a full tree life, repeat fruit, long craft and first token-funded birth. Use logical simulation for long horizons; do not spend inference calls just to replicate a deterministic arithmetic check.
5. Resolve observed gameplay balance, native-fee coverage and UI critiques, then make one planned testnet release. No mainnet release until the owner-requested tested/finalized stage.

The existing three-day V1 trial cannot validate this economy. Use a longer controlled V2 testnet run with explicit operator AI/gas limits; do not silently widen V1 limits or reset its ledger. Native processing-fee calibration is separate: previous testnet receipts did not cover relay gas alone, before AI/hosting. Preserve the configurable multiplier but measure end-to-end costs before setting a public fee. Keep fee detail quiet and reachable in the product.

V2 starts with fresh authoritative lives and zero issued project tokens. Do not import V1's freely delivered wood or trusted output snapshots as valuable V2 inventory, or duplicate balances across collections/chains. Preserve earlier records without building a second active legacy economy.

The research establishes a coherent starting point and identifies what needs real implementation evidence. It does not replace that evidence with a claim that the economy, contracts or AI are flawless.
