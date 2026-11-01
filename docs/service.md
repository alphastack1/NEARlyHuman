# Preparation service

The frontend submits a wallet transaction, then posts only its hash. The service verifies the canonical `DayRequested` event and the matching onchain request. It reads the saved base state from the contract; client state, candidate lists and outcome claims are never accepted as authority. Closing the page does not cancel an accepted request.

`server/admission.ts` issues short EIP-712 quotes. `server/jobs.ts` prepares and saves a day. `server/chain.ts` owns consistent chain reads and the signed transaction outbox. The endpoint shapes are in [API.md](API.md) and `src/app/api.ts`.

## Admission and fees

A single conditional-write ledger reserves AI credit, service gas and one preparation slot before returning a quote. Initial limits are $0.90 of operator-funded AI budget, $0.06 reserved per accepted attempt, three simultaneous holds/jobs, twelve accepted attempts per wallet and one hundred overall. These bounds are server configuration, rather than browser counters. Known terminal AI spending remains charged to the ledger; uncertain sends retain their conservative charge. Unspent reservation is released after terminal reconciliation.

The gas reservation is one million relay gas units at twice the observed gas price, checked against the service wallet's balance and outstanding reservations. The player pays the signed mint charge plus processing charge. The processing charge is the estimated owner transaction fee multiplied by `multiplier - 1`; the contract starts at multiplier 2, and its owner can change the multiplier for future quotes. Existing signed terms remain usable until their short expiry.

Edits to a draft with the same wallet, operation, token and base revision reuse a single hold and single-use permit ID. Different delivery or identity variants cannot consume that ID twice. A hold is not released just because a menu closes. An unused quote is released only after its chain timestamp expiry and a canonical `usedPermits` check. An accepted but unobserved transaction keeps its allowance until the log reconciler recovers it.

The ledger tracks a finite operator allocation; it is not a provider balance oracle. Operators should lower the configured budget if credits are spent elsewhere, and replenish the relay wallet before admission runs out of gas capacity.

## Durable work and inference

The job control record contains its worker lease generation, accepted checkpoint head and lifecycle. One conditional write advances these together. An expired worker cannot advance a new worker's head. Each immutable checkpoint and receipt is written before the control record points to it. A complete accepted model response is also cached before mechanics advance, so a restart can reuse that choice rather than paying for it again.

The worker passes the contract's accepted 32-byte day seed to `prepareDay`. It does not substitute the engine's standalone demonstration seed derivation. Every new HTTP send first persists its exact input, candidate order and transport allowance. There are at most 72 sends per attempt and at most three sends for one logical decision. Deterministic sole-candidate steps require no model call. Each unknown send retains a 588-microdollar charge, covering the bounded 14,000-byte input at the verified Jev input price. Returned usage reconciles a known charge. The worker stops if actual reported costs exceed its reservation.

The current decision configuration freezes rules version 1, `typesafe/jev-1.13`, an eight-candidate normal shortlist with a 24-candidate urgent ceiling, ambient-v1 idle behavior, incident rate 0.45 and black-swan rate 0.00025. The hash is bound into both quote and canonical accepted request. New behavior versions must be coordinated with outstanding quotes and jobs. Existing committed replay packets retain their original configuration hash and remain watchable.

Before each paid send, the worker rechecks the canonical request, owner, base revision, saved state and deadline. It leaves at least 110 seconds for settlement. A long worker yields after about 530 seconds; its next invocation resumes the accepted checkpoint. Public job reads buy no inference. A wake resumes an existing funded job.

## Settlement and failure

The full replay packet is stored and hashed before finalization is signed. A global outbox scoped to chain and relay account stores the exact signed raw transaction before its first broadcast. A restart recovers those same bytes and nonce. It first recovers any earlier uncertain outbox item before signing a different intent.

`ready` requires canonical `Settled` status, the expected combined contract result hash, and matching day-summary replay and packed-state hashes. A local provider failure remains `recording_failure` until the contract confirms failure or expiry. Failed and expired attempts preserve the previous biological save, inventory and day seed. Gifts are not reapplied. A retry is a fresh paid request for that same next game day.

Expiry is strictly after the contract deadline; finalization is allowed through the deadline. Players can call the permissionless expiry release directly even if the service is unavailable. Onchain requests cannot be deleted or refunded by the preparation worker.

Public testnet RPC replicas can briefly disagree about the newest supported block height. Related state reads pin one block and retry that same height for a bounded interval if a replica reports an unsupported height. The block hash is checked again after the snapshot. The service does not combine unrelated latest-state reads into a purported atomic snapshot.

## Functions, reconciliation and retention

Accepted requests and explicit wakes dispatch immediately to the authenticated `prepare-background` function. Its worker secret is never returned to the browser. Netlify's five-minute scheduled function only dispatches authenticated background reconciliation, keeping chain scanning out of the scheduled function's shorter execution limit. Netlify documents [15-minute background work](https://docs.netlify.com/build/functions/background-functions/) and the [scheduled execution limits](https://docs.netlify.com/build/functions/scheduled-functions/).

The reconciler uses a conditional-write lease, bounded log ranges and a saved cursor. It scans `DayRequested` events independently of browser acknowledgements, resumes abandoned leases, reconciles canonical terminal requests and frees unused expired quote holds. Production uses Netlify Blobs with strong reads and real conditional writes. The local development store lives outside the checkout and assumes one server process; it is not a multi-process database.

Replay indexes are scoped to chain and collection, so testnet token 1 and mainnet token 1 cannot share a record. The newest saved replay is retained, including an unwatched or fatal replay. Previous replays expire thirty days after being superseded. Diagnostics and checkpoints are pruned after thirty terminal days. Maintenance deletes at most twenty blobs per pass and preserves the current full replay packet. Compact day history remains onchain after a full old replay expires.

## Evidence from this sprint

On 1 November 2026, testnet token 1, BOK, was minted and prepared through the actual service and Jev endpoint. The request completed in approximately 28 seconds with twelve paid model sends, sixty replay receipts and 240 bytes of compact history. The service recorded 707 microdollars ($0.000707) of AI usage. It verified the saved packet against the canonical day summary and the contract's combined result hash, then loaded the same replay after reconciliation and network-index migration.

- Mint: `0x841f3e07c4a18319d27575ab14e4f6761cabdbc0459d02d72ac139284ac82d00`.
- Request: `0x2d9d044ed2852a8d9c5a8c9aa7a082a020cc4b22edb33f842fcbbf57b621748b`.
- Save: `0x9599ce3afb3dd4e506825ecdd683676792744a76ae5874aa07df7294dac00776`.
- Replay commitment: `0xc546607e5b746900c5cbc95ee73a0cb9278076babcd371c9c83faf6e32f16910`.

Five focused service witnesses cover concurrent hold reuse/capacity, prior-spend and attempt limits, uncertain-send allowances, idempotent terminal accounting, and explicit hosted background dispatch when the build-time Netlify flag is absent. Run them with `npx tsx --test server/service.test.ts`. They use an isolated temporary local store and cannot use production Blobs. TypeScript checks also pass for the service and functions. The contracts have seventeen lifecycle witnesses and separate live codec checks, documented in [chain.md](chain.md).

The first real day revealed a long stretch of idle steps after starter food was consumed. Ambient-v1 now varies the rooster's harmless idle destination through existing house anchors without changing resources, survival odds or the number of paid decisions. The original replay remains unchanged.

| Question | Evidence | Change | Result and decision |
| --- | --- | --- | --- |
| Does the real path complete, with affordable Jev inference? | One funded testnet mint, actual model calls, canonical save and verified replay. | Connected admission, durable preparation and settlement. | Twelve sends cost $0.000707; sixty receipts saved. Continue with real UI playthroughs. |
| Can a transient RPC replica race break replay loading? | One replica rejected the height returned moments earlier by another. | Retry the same pinned height and verify its block hash. | Reconciliation and replay reload succeeded; keep bounded snapshot retries. |
| Can a missing wallet response cause a duplicate NFT mint? | A wallet can broadcast before losing its response; the UI cannot rely on an error meaning rejection. | Added bounded permit-to-event recovery and strict expired-unused proof in the chain client. | The helper recovered BOK's original mint hash from its permit; preserve the unresolved submission until proved. |
| Will dense decision state exceed the input limit? | Full inventory, eight conditions, fire and damaged house measured 5,223 bytes for the urgent shortlist; twenty-one legal records measured 7,484 bytes. | Retained the 14,000-byte hard bound and conservative send reserve. | Both witnesses fit; no extra inference spend or larger context allowance needed. |
| Was the first UI day-two failure a mechanics error? | Its accepted checkpoint 23 and cached real slot-24 response reproduced a valid checkpoint 24 with no paid inference. A complete local temporary file was left at the failed rename. | Added private redacted exception records and resumable handling for storage contention; serialized local I/O passed 120 overlapping read/update operations. | The real UI retry completed sixty slots with thirty-four model choices and preserved the intended day-two seed. The failed attempt had preserved day one and consumed no delivery. |
| Can an environment mismatch send work to the wrong network or local runtime? | The Functions runtime does not guarantee the build-time `NETLIFY` flag; a deliberately mismatched mainnet/testnet RPC was also probed. | Added explicit hosted-runtime selection and canonical chain/code/codec/mode checks. | Hosted dispatch passed without `NETLIFY`; the wrong RPC configuration was rejected before paid work. |
