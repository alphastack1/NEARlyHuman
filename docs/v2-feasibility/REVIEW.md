# V2 feasibility — small working experiments

2 November 2026. This closes the historical preparatory research wave before the six implementation/refinement waves. It records design-stage economy and transition experiments. Application source and the live V1 game were unchanged during this work. All financial execution here used isolated local chains; no developer wallet, external testnet funds, mainnet, paid AI or deployment credits were used. See the [current economy](../ECONOMY.md) and [architecture](../ARCHITECTURE.md) for the later implementation.

Three parallel builders tested biology/care, actual EVM economics and native NEAR custody. They reviewed each other's results. The PM independently replayed the clinical counterexample and reviewed source. A fresh adversarial reviewer then found exhausted-state, full-counter, process-isolation and evidence-identity issues, which were corrected before preservation.

## What this wave establishes

| Area | Actual evidence | What it does not establish |
| --- | --- | --- |
| Care alongside four productive beds | Imported real V1 health/condition/action functions with an explicit V2 garden/scheduling adapter;84 matched90-day cases and4 targeted360-day cases. | Actual Jev behavior, statistical survival, every incident ordering, or the final unified reducer. |
| RH/EVM economic feasibility | Actual local Anvil transactions against real ERC-721/ERC-20 contracts:37 witnesses,394 successful receipts including3 deployments,20 intentional reverts. Four witnesses use an injected pure counter-bound harness. | Full biological chronology, valid death proof, signed quotes/fees, metadata or full-game code size. |
| Native NEAR custody | Actual SDK/standards Rust,8 host tests,23-transaction local campaign plus2 focused storage transactions on protocol88. | Full game/economy reducer, issuance bucket, complete day expiry or general failed-resolver recovery. |

Source and drivers are preserved under [experiments/economy-v2](../../experiments/economy-v2/README.md). Binaries, caches, chain databases, local signing keys and verbose traces remain disposable under TEMP. Application/build code imports none of these probes.

## Care, events and production

The [biology results](biology.json) start from actual health100 and food/water/energy/morale80, with exactly bread3 and water3. They import unchanged V1 metabolism, condition deadlines, damage, treatment, legal domestic actions, competence, bedtime and director functions. Four-bed plant/harvest/well/craft/shipping, breakfast and role budgets are explicit new adapters. This distinction matters: these new rules are not already present in V1.

The84 matched cases are all21 stat allocations, two identity seeds and two emergency modes over90 days. Structural exceptions are disabled for that comparison; ordinary source incidents and task outcomes remain active. Every case survives, with no wilt. Minimum sampled health/food/water/energy/morale is90/70/60/73/21.68%. Samples are at action/boundary checkpoints, not every intermediate mutation inside a helper.

Balanced seed21, with the actual structural rate enabled separately, ships365.4 base points in90 days. Five mains restore soil, three repair the house, and three craft. There are111 quiet ordinary opportunities out of450, about24.7%. This demonstrates useful room around care, without pretending the garden produces the earlier no-damage model's exact return.

Four targeted360-day cases extend two low-morale stat configurations with personal use off/on. All survive without wilt. The spirit-zero banking sample dips to15% but ends at86%; personal use raises its floor to23% and ends at83%. Those dips recover; the sample does not justify a new free mood buff. It is a selected deterministic policy, not a population statistic.

The additional16 personal-use90-day cases consume actual fruit/flowers. Example balanced seed808 banks353.4 points with minimum morale50.86%, versus337.4 points/minimum56.3% when opportunistically consuming four apples. This policy differs from the older deliberately cozy household reservation policy; do not combine their averages into a promised median.

Exact six-decimal rewards over the84 actual shipment traces, assuming an otherwise empty economy and all proceeds saved, reach250 tokens on Days57–68. Balanced seed21 crosses on Day57 from230.897276 to250.805341. These are active game-day examples, not Jev results, calendar timing or financial payback. Other issuance changes them.

### Concrete corrections

**Persistent soil.** The first adapter accidentally stored blockage on the plant; harvest/wilt erased it. Both peers and PM caught this. Soil is now per bed and survives an empty slot. A real compost delivery and one main restore it. Forced four-bed washout gives103.1 points/30days with restoration versus39 without. Both roosters live; water alone cannot repair soil. Compost remains restorative only, never growth acceleration.

**Actual acute response.** A source H15 failure at Day2 slot51, seed0x52, consumes saved wood/matches and creates a flare. Five ordinary routines are already spent. Without response it causes a serious wound; actual H16 at52 spends one water and prevents it. This supports at most two typed immediate-threat responses, one per existing episode, without extra healing/production/shipping. An injected Dawn-fire fixture is also retained, but its admission through the current fire-history guard is not claimed.

**Exhausted mains.** Fresh review found custom productive mains subtracting300 energy without checking it was available. Cohorts never fall near that boundary, so their metrics remain identical after correction. The new focused fixture at299 energy retains the seed and produces nothing; in a separate same-start fixture, actual H03 rest enables a later main, leaving1199 energy. It does not grant a second main to the first fixture.

**Real mortality.** A neglect control dies of dehydration on Day3 under actual death rules. A deliberately injected simultaneous illness/infection/wound fixture lacks enough medicine and dies; it is not claimed reachable through normal admission. The owner-approved structural exception separately kills identity66 on Day23 despite care. Its configured0.00025 draw is once/day at31 beyond Day1, not60 rolls/day; retain honest cause attribution and post-death purse access.

### The deadline counterexample

The preserved [accepted-state fixture and prefix](../../experiments/economy-v2/biology/admission-fixture.json) contain actual Day3 medicine at11, bread at21, leisure at31 and phase boundaries10/20/30/40. The main is spent. Water deficit and a serious wound are due tonight; water and bandage at41/51 rescue the life.

Unchanged source `introduceEpisode` then genuinely admits sickness under seed0x42. It reactivates the treated illness with its **original due-today deadline**. There are now three clinical tasks and only two opportunities. The old helper still reports feasibility because it counts logical slots and can consider a later horizon.

The bounded actual-action search finds two surviving paths before onset, zero after, and two after softening only that proposed episode. PM's [independent replay](independent-admission.json) imports the actual action/phase/bedtime helpers but none of the biology probe code and reproduces2→0→2. No future kit, emergency medicine or late extra main is used.

This supports the selected positive care-certificate design in the transition document. It does **not** mean a universal V2 admission verifier is already implemented. That port must respect each deadline prefix, real opportunities, certain care effects and available kits. A pure owned snapshot avoids accidentally writing real NEAR collections during hypothetical simulation. Conservative softening discretion is explicit; mortality is not the issuance brake.

### Remaining adapter boundary

The auxiliary earned wood and V1 `inventory.wood` remain separate in these cohort experiments. Earned-wood comfort chairs, wood patches and backup heat are not integrated. The focused flare fixture states its saved wood/matches as preconditions. The final kernel must unify stock before claiming a complete garden/house economic simulation. Pre-pickup recovering routines also need their final global-budget fixture; they are not exercised by the cohort's immediate pickup.

## Actual EVM execution

The [EVM report](evm.json) uses solc0.8.38, optimizer200, via-IR, Cancun and Anvil1.7.1. The prototype implements controlled six-decimal ERC-20, ERC-721 ownership, finite four-bed production, craft/ship consumption, firm reservation, refill, failure/expiry, backed purse withdrawal and purse-funded births.

It verifies quick first pickup on Day4, ten wood/six apples, duplicate shipping/overdraw rollback, illegal multiple mains, nonowner/non-relay denial, no arbitrary token mint, first-kit retry behavior, late/replayed settlement, protected held quotes, care-only admission, pending/dead withdrawals and stale purse intents after ownership returns. A closed122-day **economics-only** production trace earns enough for two250-token births. No finished products or money are injected into that trace.

Final accounting:579.725298 issued,79.725298 outstanding,500 burned for NFTs, and77.725298 in both vault backing and purse allocations; two more tokens are in owner wallets. Burns leave issuance pressure unchanged.

Fresh review found a real counter-bound issue: hypothetical uint32 output increments could overflow before quoting existing saleable stock. The fix caps temporary quote counts at four and excludes an entire harvest/craft alternative whose actual outputs cannot fit. Separate pure fixtures test maximum counters and aggregate same-species overflow without fabricating a funded life. Quote alternatives use fresh arrays rather than aliasing one another.

The runner now proves it owns a newly bound local process: port zero, listener announcement from that child, live child, actual chain31337 and block0 before transactions. It does not print/store the local-key banner and shuts down that child. This fixes a rerun-isolation defect without touching other local services.

| Measurement, final corrected slice | Observed result |
| --- | ---: |
| Controller runtime | 15,171 bytes |
| Token runtime | 2,007 bytes |
| Controller+token deployment | About3.98M gas |
| Accept request | 148,618–296,862 gas |
| Plant commit | About97,700 gas |
| Batch harvest and ship | 130,773–158,200 gas |
| Withdrawal | 69,372 gas |
| Purse-funded birth, pending/dead source | 137,125 /120,025 gas |

This leaves less than the full24,576-byte [EIP-170 allowance](https://eips.ethereum.org/EIPS/eip-170); the complete controller is not shown to fit. Full biology, authentication, metadata and history need actual measurement. A separate immutable pure reducer module is a reasonable implementation route if needed, not a module already built here.

Typical request plus economic settlement is roughly340–375k gas. That is total execution across player request and relay settlement, not all developer expense: the player pays request network gas directly; the treasury must separately cover relay execution, inference and hosting. Keep those accounting paths distinct when calibrating the configurable processing multiplier. No native-price/USD profit is inferred.

The prototype's free founder and `validatedTerminalFixture` are explicit harness boundaries. They must never become production purchase/death authority.

## Actual native NEAR receipts

The [native source/build report](near.json), [campaign states](near-receipts.json), [transaction summaries](near-transactions.json), [receipt gas](near-gas.json) and [storage measurement](near-storage.json) separate host evidence from actual receipt execution. Rust1.95.0 with SDK/standards5.30.0 compiles the combined NFT/FT/purse account. Actual receipts ran on an isolated WSL near-sandbox2.14.0-rc.4, protocol88, using newly generated local accounts/keys.

The final campaign is23 transactions plus two focused storage transactions, not25 independent use cases. It verifies:

- Transfer-call is refused by default. The explicit receipt-feature build enables it only for the local campaign.
- Receiver accept, reject and panic follow the standard resolver's intended owner result.
- A registered receiver with a funded purse fails its tentative drain specifically at `transfer unresolved`; rejection returns the NFT with backing intact. Missing registration/funds did not mask the guard.
- Low-storage birth fails atomically, preserving purse, supply, nonce and owner and emitting no successful mint/burn event.
- Pending/dead withdrawal and purse-funded birth work. A successful birth emits exactly one FT burn250 and one NFT mint.
- An injected private-resolver failure leaves the receiver tentatively owning the NFT, the100-token purse backed and the lock retained. A later drain remains blocked. **Recovery remains unsolved**, which supports keeping this path off initially.

| Whole local custody transaction | Gas burned |
| --- | ---: |
| Pending withdrawal | 2.960 Tgas |
| Pending-source birth | 4.730 Tgas |
| Dead-source birth | 5.240 Tgas |
| Receiver accept /reject /panic | 8.286 /9.643 /9.562 Tgas |
| Attempted drain, reject and return | 14.114 Tgas |

The resolver itself uses2.106–3.477 Tgas in these cases, with30 reserved. This does not prove every future extension/approval-map path fits. The custody-only newborn adds395 bytes, corresponding to0.00395 local NEAR at the measured storage rate. Full biological state and compact day history add storage; gas alone is not the full native cost.

Actual receipts caught a meaningful build issue: SDK5.30's manual Wasm build requires `--cfg near` for its intended NEAR host panic/crypto paths. The earlier Node validation/host tests missed it. The corrected build produces precise contract errors and passed receipt execution. This remains a research build route; production should use a selected reproducible toolchain.

| Final artifact | Bytes | SHA256 |
| --- | ---: | --- |
| Default, no fixture issuer/enable export | 493,649 | `203a032fa51966dccd205a2650c65323beeafd94f9f5ade81da6e8a1804ed9f7` |
| Executed local receipt feature | 534,261 | `9b5f38c46a56f1b39b3fa6e3673015e67e008968849594799458156203fa1dce` |
| Local receiver | 107,376 | `7f091c9a46692d953b0780524fcc3972463a7d2b709dec1493d72180b20f1422` |

The receipt feature exposes an operator-bound fixture issuer capped at1000 tokens. Default source exports none of those fixture methods. Do not confuse their identities or call the feature artifact production-safe. The eight host tests additionally cover private predecessor authority, operator/former-owner denial, vault public-token guards, forced unregister and incremental credits. Forced-unregister burn events are source/host evidence, not part of the actual receipt campaign.

Public FT transfer/call, forged vault-sender resolution and unregister cannot drain allocated vault backing. Deliberate internal purse withdrawals/burns perform the matching allocation debit. Explicit FT mint/burn events were added because the standard library's internal deposit/withdraw methods do not emit them. These are actual source findings for the pinned version.

The separate-receipt failure boundary follows [NEAR's asynchronous-call semantics](https://docs.near.org/smart-contracts/anatomy/crosscontract). The combined local core avoids an external FT callback for purse credit/withdraw/birth, but does not remove NFT transfer-call recovery requirements or establish complete [NEP-171](https://github.com/near/NEPs/blob/master/neps/nep-0171.md) marketplace compatibility.

## Experiment decisions

| Question | Evidence | Correction /decision |
| --- | --- | --- |
| Does four-bed care fit real health rules? |84 matched90-day and4 targeted360-day runs. | Retain care design; report exact adapter/policy limits and real mood dips. |
| Does a removed plant erase soil damage? | Peer/PM source review and changed harvest totals. | Persistent per-bed soil plus reachable compost/main repair. |
| Can a new onset silently remove the only rescue? | Actual Day3 prefix and independent2→0→2 replay. | Bounded positive deadline-aware care certificates; no raw-slot shortcut. |
| Can the last ordinary task leave no fire response? | Actual failed H15 and H16 at52. | Two constrained acute responses, with real costs, no extra productive turn. |
| Can exhausted work create output or a full counter block quoting? | Fresh independent boundary review. | Energy legality gate and bounded hypothetical quote arithmetic. |
| Do actual funds survive pending work, death and transfer? | EVM receipts and native host/receipt paths. | Keep separate backed purse, owner-only spending and transfer intent nonces. |
| Does Wasm compilation establish native runtime behavior? | Actual runtime found missing `--cfg near`. | Preserve corrected feature-specific builds and receipt evidence. |
| Can callback failure safely unlock by time? | Injected resolver fails; backing remains but lock persists. | No guessed timeout; default transfer-call remains off. |

## Next work

The subsequent implementation built one unified owned-snapshot kernel with explicit IDs, phase order, a single inventory, legal-action roles and verifiable care certificates. These counterexamples and money fixtures remain evidence for that work, rather than a substitute for current game execution. The [documentation index](../index.md) leads to the current source, contract and release records.

The final sixth wave is authorized to publish the completed tested RH testnet candidate once. Mainnet remains deferred. Current local proof does not justify copying fixture issuers/terminal flags into that release, enabling unresolved async ownership, or claiming complete end-to-end gameplay before it exists.
