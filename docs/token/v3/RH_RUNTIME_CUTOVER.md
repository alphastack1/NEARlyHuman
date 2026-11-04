# Robinhood collection cutover

The active collection is selected by the operator's existing `NEARLYHUMAN_V2_RUNTIME_JSON` setting. The original V2 collection stays served as a pinned archive. Both use the same existing funded campaign, provider accounting, shared relay wallet and nonce outbox. This release does not copy or reset an allocation.

## Request and worker boundaries

`server/v2/runtime-scope.ts` uses `AsyncLocalStorage` to hold one whitelisted identity per request. It never changes process environment variables during a request. The only served Robinhood identities are the configured active collection and the original public V2 deployment record. The original identity retains its controller, verifier, module, rules and role pins, and all actual reads still verify them against the chain.

- Fresh day quotes are rejected for the original collection before signer, inference or reservation access. The direct owner-service entry point independently enforces that boundary.
- Existing original-collection acceptance, wake, job, replay, metadata and purse ownership reads remain available. Contract withdrawals remain possible for the current owner.
- Background dispatch and queue execution resolve their collection from the complete job identity. Scheduled reconciliation visits both whitelisted scopes without changing their campaign.
- Public configuration exposes `admissionsEnabled`, including the contract pause state. The new controller also exposes its actual `transferBurn` values; the old controller has no such getter and does not receive a fabricated burn claim.
- The archived guest remains original NFT1, saved day28. The new collection uses its own configured guest ID/day.

## Public identities

Original public links such as `/life/robinhood-testnet/1` retain their original collection identity. A new NFT uses `/life/robinhood-testnet/0x3e3c6d8d6ddcfaad61c21b4278e977c90ddde3f7/1`. NFT metadata includes the collection in image queries and uses the matching canonical external URL.

Discovery accepts an optional collection within each of the existing two worlds. Its whitelist, durable cache fingerprint and cursor query binding include the exact collection. A cursor for original NFT1 cannot be interpreted as new NFT1. Native NEAR discovery continues to require its enabled current runtime.

## Verification and release gate

The 16-case [runtime scope verification](runtime-scope-verification.json) covers request concurrency and nesting, archived quote rejection, recovery-route availability, foreign-world rejection, worker scope resolution, discovery cache/cursor isolation, actual public configuration reads and old NFT1 metadata. It uses controlled sessions and scratch public-cache records. It buys no inference, reads no wallet key and submits no transaction.

The existing [discovery regression verification](discovery-regression-verification.json) also passes, including fresh-process cursor recovery, stable ranking, stale complete snapshots, empty collections and rejection of partial snapshots. TypeScript and whitespace checks pass.

`node --import tsx scripts/v3/inspect-cutover.ts` is a read-only operator. It authenticates to the existing authorized Netlify site with the signed-in CLI token and projects only aggregate obligations. It has no pause, reconciliation, signature, reset, inference or environment-write mode. The [initial inspection](rh-cutover-inspection.json) found zero pending original days, held/retiring quotes, recovery records, gas holds, active campaign allowances, uncertain original calls or relay work. Its sole quiescence blocker was open original admissions.

The PM must still coordinate the onchain pause and a fresh drain check before switching active configuration. The inspection is a dated observation, not a live lock. No environment change or Netlify deployment was performed by this backend integration.
