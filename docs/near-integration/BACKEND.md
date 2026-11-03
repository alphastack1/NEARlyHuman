# Native NEAR backend and authority review

The native adapter is separate from the existing Robinhood service. Native account IDs and NEAR transaction hashes remain native values; neither is represented by a fabricated EVM address or chain ID.

## Shared game behaviour

`server/v2/preparation.ts` now retains its original EVM validation wrapper and exports a chain-neutral `prepareV2Core`. Both adapters use that same deterministic game kernel, Jev request builders, mind policy, care certificates and replay packet implementation. Native acceptance validates its own contract identity and finalized request before entering the shared core. The complete native frozen input is committed by its own hash.

An offline before/after experiment used the actual failed RH NFT #4 Day 1 frozen input, its first cached replies, then an explicitly deterministic continuation. This is a regression fixture, not a new real Jev outcome. The wrapper/core extraction preserved every request hash and the exact final packet:

- Commitment: `0x265e559bad37a961367327bb2ea20d6ee7e3fa89e6d363083eb4b8a2b4f74474`.
- Serialized packet SHA-256: `ed1393f0a5540c7b4bf0d79fa76bb7927ad19a7a869c79e62f664dc2d8418e90`.
- Five request hashes remained identical.

The shared portrait function accepts only the name/state fields it actually renders. Native NFTs therefore use the unchanged original procedural rooster SVG and the same saved-life portrait. No rooster artwork or EVM packet/contract semantics were changed.

## Native service boundary

HTTP routes live under `/api/near/v2`. Auth uses `/auth/challenge`, `/auth/verify` and `/session`; the remaining config/life/replay/quote/accept/job/wake/NFT routes follow the existing game interface. Every protected session binds the exact native account, network and collection. Query-string network/collection contradictions and EVM chain IDs are rejected.

The server pins a NEAR Testnet runtime, contract code hash, semantic rules hash, decision configuration, relayer account and Ed25519 quote key. Reads share a finalized block. Wallet callbacks with a known transaction hash must match the actual signer, receiver, single native `accept_day` action and attached fee. A hashless callback can recover only the actual canonical request backed by the service's existing private quote reservation; it never fabricates a transaction hash or requests another payment.

Native discovery additionally requires the enabled flag, configured campaign ID, a valid session secret and a loaded relay key whose public key matches the pinned runtime. Its cache uses an opaque credential/configuration fingerprint, so changing or removing a key invalidates stale discovery without exposing the secret. It does not inspect transient budget availability or reserve credits: an existing world remains selectable for watching and withdrawing when there is temporarily not enough capacity to start a day. If only the native world is reachable, the directory's default points to that actual available world.

Owner login follows [NEP-413](https://github.com/near/NEPs/blob/master/neps/nep-0413.md): a one-use challenge, tagged Borsh payload, SHA-256 and Ed25519 signature from a currently registered FullAccess key. The application origin, account, network and collection are bound into the challenge/session. Sessions use a separate HMAC domain from Ethereum login and expire after 12 hours. Callback URLs, if explicitly supplied, must remain on the allowed origin; the current connector path omits one.

## Budget, custody and exact relay intents

Native jobs use `near/v2/jobs/near-testnet/<contract>/<request>` and independent native quote/packet/relay namespaces. They reuse the **same existing funded Jev campaign** as Robinhood. Each full job reserves the existing 40,000-micro-USD allowance through the shared atomic accounting. Full job IDs are included in provider call IDs. No pool, previous charge, RH hold or campaign allocation is reset or copied.

Before each new paid inference send, the worker rechecks the finalized native pending request, base state/revision, owner, policy and deadline. Completed replies resume from the existing cache. An interrupted read before a send can return to queued. A provider transport loss after the durable send fence remains uncertain and is not automatically purchased again. Leases and immutable input/packet hashes fence overlapping workers.

Native fees and gas holds are denominated in yoctoNEAR and never share RH's wei ledger. The developer can adjust the contract multiplier. Processing-fee estimation separates actual measured execution bases from the larger signed transaction gas ceiling:

- `NEARLYHUMAN_NEAR_REQUEST_GAS_BASIS`: initially 8 Tgas, bounded to 1–80 Tgas.
- `NEARLYHUMAN_NEAR_SETTLE_GAS_BASIS`: initially 10 Tgas, bounded to 1–300 Tgas.
- Processing fee: current gas price × settlement basis × 1.25 × multiplier, plus the contract's storage floor.
- The relay reservation separately covers a 300-Tgas signed ceiling with two-price headroom. It is a capacity hold, not a claim that each day burns 300 Tgas.
- `NEARLYHUMAN_NEAR_MAX_PROCESSING_FEE`: default 0.2 NEAR, bounded to at most 1 NEAR. The native wallet checks the published bound before sending.

These initial bases follow local contract measurements and remain estimates. The PM records actual broader care-certificate measurements and final release values separately.

The server uses the official `near-api-js` transaction/signing codecs. Exact signed relay bytes are durably journaled before broadcast. Receipt uncertainty retains those bytes. Business success requires the actual canonical day record to match the immutable packet commitment; a detached refund receipt cannot erase a successfully committed game operation. An expired old finalize can be retired only after a final block proves its deadline passed. A retained nonce floor prevents new bytes from reusing its nonce. Quote/AI/gas holds retire only after a canonical terminal request or a strictly expired finalized-unused quote.

## Focused adversarial evidence

`node node_modules/tsx/dist/cli.mjs scripts/near/backend-check.ts` passes eighteen focused cases (native in-memory controlled RPC/provider plus real EVM HTTP-handler guards):

1. Official SDK NEP-413 signatures match the independent server verifier. Function-call-only keys, replay, wrong recipient and cross-world sessions are rejected.
2. Concurrent equivalent quotes share one native job allowance. A simulated RH 40k reservation remains intact; a third allocation is refused rather than expanding the pool.
3. Wrong-sender receipts are rejected; valid canonical hashless admission recovery reuses the existing request.
4. A pre-send transport interruption resumes from two cached answers with no duplicate purchase or progress entries.
5. Exact SDK relay signing settles only the matching canonical record; a controlled detached-refund failure does not overwrite the successful main result. Native holds retire while the RH fixture's hold stays active.
6. A recovered SDK-decoded journal verifies the exact signature/bytes and returns its known receipt without signing or broadcasting again.
7. An uncertain provider send remains accounted for and is never automatically retried.
8. A live finalize cannot be discarded; strictly expired proof allows scoped retirement with a nonce floor.
9. A transferred NFT's save revision can exceed its biological day; the public view preserves both without advancing or reseeding the life.
10. A relay access key with the wrong receiver/method permissions is rejected before allocating a quote, AI allowance or gas hold.
11. An already-persisted `control.pending` journal receives the same full bytes/signature/hash/action validation as the fallback restored from a job. Tampered pending data is rejected before status lookup or broadcast.
12. Public replay obtains life and day record from one coherent finalized snapshot, preserving ownership and day context through concurrent advancement or transfer.
13. Authenticated owner polling can resume an already-admitted queued job after a five-second backoff. A durable CAS claim throttles dispatch to once per 15 seconds; uncertain provider jobs are excluded and no new quote, budget or attempt is created.
14. Native discovery rejects missing/mismatched relay credentials, missing campaign configuration and a short session secret; valid discovery makes no financial-store mutation or reserve check.
15. Five actual EVM HTTP checks load the permanent public RH runtime and reject foreign-collection POST quote, mixed native-network POST quote and foreign GET config with 404 before authentication/RPC. Valid scoped and legacy unscoped fake sessions both return 401 before quote/storage. The fetch guard observes zero RPC requests.
16. Moving between verified NEAR Testnet RPC endpoints preserves exact frozen input/hash, signed admission bytes and Jev Dawn body/hash. RPC transport is excluded from the authority domain; actual network, code hash, account, policy and contract checks remain required.
17. An HTTP 429 on explicitly allowlisted read methods receives one 250–1,000 ms backoff/retry. `send_tx` and other writes never receive a generic RPC retry; their exact signed outbox remains the recovery authority. No multi-provider fallback was introduced.
18. Both owner-job DTOs expose only actual completed Jev reply labels, including Dawn. Retried cached replies keep their ordered stable IDs without duplicates; the public whitelist excludes private prompt, lease, usage and answer fields. No model call is added by progress recording.

## Player-visible real preparation progress

The optional shared `progress` array contains at most eight entries: `{id,stage,label,slot?}`. Its ID is the actual completed request hash, its stage is plan/routine/acute/focus, and its concise label is selected from the validated offered choices. Dawn records the validated main undertaking. Cached responses are still actual earlier responses and retain their same ID. Old jobs without recorded progress do not invent historical labels.

The stream describes what Jev chose, not actions already watched or a completed chain save. Saving remains the actual prepared/saving/ready job lifecycle. No raw prompts, response payloads, probabilities, credentials, usage accounting, leases or private budget fields are exposed. Both native and RH count completed replies including the Dawn response. The game packet and onchain replay commitment are unchanged by these separate operational progress records.

This check uses ephemeral generated fixture keys and an in-memory store only. It makes no public RPC, actual paid inference, financial-store operation or public transaction. It observed six completed simulated sends and one deliberately uncertain send, accounted as 5,600 fixture micro-USD. Those are not actual provider costs.

The SDK round-trip proof found that `near-api-js` v7 decodes a nested plain signature whose prototype `.data` getter is absent. Recovery now reads `ed25519Signature.data` explicitly and normalizes its byte array. This was fixed before any public relay broadcast. Full native Sandbox and hosted end-to-end results are separate release evidence, not implied by these controlled cases.

Independent contract/backend review also corrected the native public view's initial assumption that save revision equals biological day: NFT transfers intentionally advance revision to invalidate stale quotes without aging or reseeding the life. The relay's actual registered access-key permissions are now checked before reserving a day. A supplied failed transaction hash cannot be recorded as a successful owner payment; the real canonical request can still be recovered without a hash. Safe storage contention and shared-core deadline errors follow the existing retry/expiry classification. Server and browser use one shared canonical admission-message helper.

Temporary regression inputs, raw controlled logs and captures remain in ignored `TEMP/near-integration/`. Permanent code, package dependencies and build processes do not depend on that directory.
