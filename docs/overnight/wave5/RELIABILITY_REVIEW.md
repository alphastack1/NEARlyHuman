# Wave 5 reliability critique

## Fixed local worker boundaries

The new public-chain checks use the existing durable local store before the final hosted cutover. Source review found that its compare-and-write exclusion covered one Node process only. Two local processes could read the same etag, both pass their private comparison, and replace one another's lease, budget or nonce-outbox record.

`server/storage.ts` now uses an exclusive filesystem lock for each key around conditional writes and deletes. Lock metadata contains a PID and unique ownership token. Normal contention waits for a bounded interval; a crashed writer's lock is never automatically unlinked. The cloud store retains its existing real conditional-write behavior.

An independent actual two-child-process experiment used only a new isolated TEMP store:

- Exactly one of two writers using the same etag won its conditional update.
- Two writers preserved all80 increments, finishing at81 after the initial winner; three retries were observed.
- Delete waited for the same key lock to be released.
- An explicit stale lock remained intact and returned `StoreConflict` after5038ms.

The focused [filesystem result](local-store.json) records this scope. It used no user ledger, RPC, credentials or inference. The existing cloud invocation-credential test also passed; the application type check passed.

A separate preparation repro found that `StoreConflict` inherited the name `Error`, while the V2 worker classified transient conflicts using the string name `StoreConflict`. A controlled configuration-stage conflict incorrectly changed a funded accepted job to `failure_due`. The class now has a clear name and the worker uses `instanceof StoreConflict`. The same repro now returns `queued`, preserving its allowance for recovery rather than recording an unnecessary chain failure. [The result](store-conflict.json) uses an explicit synthetic accepted input and no RPC or paid choice.

### Conservative lock recovery

Real local locks are adjacent to the private hashed record, named `<record-hash>.json.lock`. If a local worker crashes, stop all local writers first. Inspect that exact lock's metadata and verify that its PID is no longer alive; reconcile the associated record and any transaction journal before removing only the stale lock. Do not remove the `.json` financial record, clear a directory, or automatically unlink locks by age. The ownership token prevents one ordinary writer from releasing another writer's lock. Import/cutover still requires an explicitly quiescent source.

## Actual chain observations

The independent [authority read](authority-initial.json) verified the deployed Robinhood testnet runtime/module/role hashes and then pinned one block for owner, treasury, native mint price, token controller/decimals and the supply/backing identities. At that initial snapshot no NFT had been created and issuance was zero; it is deployment authority evidence, not an earned-token or Jev-day claim.

The subsequent [independent saved-day readback](saved-days-independent.json) verifies actual MISO NFT1 Days1–2 with the final preparation policy and returned model `typesafe/jev-1.13-20260917`. Both requests are Settled and jobs are ready. Their actual limited-relay receipts succeeded, and packet JSON, encoded result state, trace, certificate, compact history and reward hashes match the onchain records. Day1 used five paid sends/507microUSD and1768069 finalization gas; Day2 used five sends/575microUSD and1747067 gas. Both quote records are retired, AI job holds inactive and exact gas holds absent. Both rewards were zero; these planting days are not earned-token evidence.

The Day2 harness reported a later contract-read error after the save. This readback found no stranded financial or biological transition. Its separate diagnostic deliberately estimating `finalize` after settlement receives `accepted base`, as expected; that artificial estimate is not the provenance of the original short-message error. Do not replay a paid day merely to reconstruct a missing report entry. Instrument the failing read's method if that provider error recurs.

The instrumented next attempt identified an actual RPC state-lag defect: a returned latest header was ahead of another backend serving `eth_getCode`/`eth_call`. Those calls at the explicitly pinned block returned code-32000 with `unsupported block number147239899`. A later identical read succeeded. This is different from a logical contract revert or invalid parameters.

The shared `src/chain/v2-transport.ts` now retries only that exact error when its reported number equals the explicitly requested numeric block. It preserves the identical method/arguments/block, adds at most four short waits totaling2400ms, and never substitutes latest or another block. Exhaustion has an explicit transient error, recognized through wrapper causes by the preparation worker so the job stays queued. Backend V2 clients and browser readers use the same transport; the actual mind harness adopted it before resuming its already prepared Day3, without buying its choices again.

[Seven controlled transport checks](transport-retry.json) pass through the real viem HTTP layer: the same pinned request succeeds after two simulated lag responses; logical reverts, generic invalid parameters, a different reported block, latest and transaction submission receive no extra retry; repeated exact lag exhausts in2429ms/five calls and remains transient through a nested cause. `scripts/v2/check-transport.ts` preserves this small zero-network proof. Application and standalone script type checks pass.

A separate read-only RPC observation found that the finalized timestamp trailed latest by1091seconds. The unused-permit release correctly waits for a finalized block strictly after the signed expiry. An abandoned120-second quote can therefore retain its full AI/gas hold for roughly20minutes on this observed testnet. This is not permission to weaken finality or reset holds. Complete accepted attempts, avoid abandoned quotes during the last QA flow, and use fresh finalized evidence when draining the source before import.

## Release settings and revised mind facts

The public-only Netlify environment helper was reviewed without making cloud writes. Its six-key production plan, scope checks, exact saved packet/job/model checks, testnet runtime verification and completed source-seal/import gate are consistent. The review identified one real sequencing gap: the still-deployed original V1 quote path could reserve a hold before its later gas estimate discovers the onchain pause. A hold appearing after the import's drain snapshot can temporarily block V2 admission. The PM owns a fresh cloud legacy-hold/outbox and onchain-pause check immediately before environment apply and final publication.

The final candidate's `server/admission.ts` now checks the original collection's actual `admissionPaused` value immediately after its unchanged connection verification, before loading the service account, reconciling admissions or writing a reservation. [A controlled mock proof](legacy-pause.json) used absent relay/provider keys and created zero local files; it made no actual legacy quote or ledger call. This prevents new old-world holds after the new candidate is published; it does not retroactively change the existing deployed function during the interim window.

[The independent Mind5 audit](mind5-independent.json) checked60 pure quiet-continuation vectors against the actual kernel: all valid Spirit allocations and slots1/10/11/20/21/31/36/41/51/60 match the nominal food/water/morale arithmetic. Energy stays unchanged until the separately stated living-bedtime gain. Additional boundaries confirm that a Dawn quiet moment shares Morning and leaves four ordinary opportunities, late-day counts include the current opportunity without granting a sixth, and a spent main/typed acute allowance stays spent. Routine criteria state a cost of one, and actual explicit quiet steps remain in bounded history. The context excludes future actions, project recovery, condition harm and death from its nominal forecast rather than promising survival. No new action, care benefit, forced choice or changed kernel rule is introduced.

[The independent Mind6 audit](mind6-independent.json) checked the later economy descriptions without buying inference. Sixteen recipe/value vectors cover four crafts at zero,50k,150k and maximum-uint issuance pressure; the bigint comparison matches the controller's curve. Four actual pure-kernel craft transitions consume3/6/8/10wood, create exactly one spoon/boat/birdhouse/chest, and produce no shipment points by themselves. The facts give no needs recovery or household buff. A two-boat shipment at50k pressure correctly describes21.2NHC, consumption of actual goods, one ordinary opportunity and credit to this NFT's purse. Care-only legal menus contain no shipment. Craft values remain explicitly potential, eligible-shipment comparisons at the accepted pressure; they are not automatic current-day credit or guaranteed future quotes. The owner-only250NHC hatch utility, no AI purse spending, no promised cash redemption and optional keeping/eating/enjoying alternatives are truthful. No new goal, action, probability weight or biological rule was added by these descriptions.

## Closure hash portability

The existing immutable research closure used the workstation's implicit English key collation. A locale-independent comparator produces a different hash, so replacing its old validator outright would wrongly reject the preserved audit after hosting. The final validator explicitly uses `en-GB` for the original untagged closure; new closures carry `canonicalization:code-unit-v1` and use locale-independent key order. Unknown tags or changed snapshot hashes are rejected. The hash payload excludes closure metadata, and pool release validation compares the full matching audit/tag and unchanged unused-fund arithmetic.

[The independent portability check](closure-portability-independent.json) read the actual original closure without mutation: its untagged hash remains `9f7508619fb51e1cd54ca2725f3609210c5cd5c5ffe532770b006eed49618353`, original limit30000 and charge5413. A controlled new closure received the code-unit tag, retained its10000 limit/123 charge and halted state, released only9877 unused, and remained byte-stable through reads. No real ledger was rewritten, reopened or reset by this audit.

## Final release evidence still required

- Pause original V1 admissions, then recheck its cloud jobs, holds and shared relayer outbox before public V2 relay writes. Empty local state does not prove the cloud wallet is idle.
- Use an actual final-policy Jev day and its exact saved packet/chain commitment as the public guest. Diagnostic/scripted local films are not substitutes.
- Before import, confirm all local jobs are terminal, paid sends no longer in flight, quotes/gas holds released, and the shared outbox has no pending signed transaction.
- Import the reviewed immutable snapshot with the permanent source spending fence; do not restart the old local allowance afterward.
- Publish the one completed testnet candidate, then verify hosted configuration, actual guest/exact-life links, an owner paid day through hosted background preparation, and actual purse reads/rights. Preserve the final screenshots, receipts and AI charges with their precise scope.
