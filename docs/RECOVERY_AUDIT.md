# Wallet and preparation recovery audit — 1 November 2026

This deeper sprint distinguishes production observations from controlled lifecycle witnesses. Local chains use the exact deployed Solidity artifact, chain ID 46630, disposable Anvil accounts and temporary data. Controlled provider responses are not reported as real Jev behavior. No mainnet transaction or production push was performed by this audit worker.

## Production observation and recovery

PEEP #2's owner transaction was accepted, but its job remained `queued`, generation 0, with no lease, slot or inference send. An authenticated wake also returned without progress. Private Netlify invocation logs established the cause: the warm background function's retained Blobs client used an expired token and failed before acquiring the job lease. Scheduled background reconciliation failed for the same reason.

The storage owner replaced the retained token-bearing client with a factory using the current invocation context. One focused witness changed synthetic invocation contexts on the same storage wrapper and observed the authorization header change. This is source-fix evidence; the next published build still needs its ordinary live worker verification.

The PM authorized recovery of the **existing funded request**, using fresh authenticated Cloud Blobs access and the normal fenced worker. It completed without another owner payment, quote or mint:

- Request: `0xdc2aa9e27c38f2b785730c7bfa8bb9a256643e1bb40734882ea252c4edc172d9`.
- Outcome: generation 1, 60 slots, 12 actual Jev sends, **712 µUSD ($0.000712)**.
- Save transaction: `0x2a59f76bc9144111a363b37c9eb43277052ce4d288d7f11b06c2ab18e6721f93`.
- Replay commitment: `0xe4395a451fdcb8f7eafc1174624dfb446c6888306a11934ddc8ea39dccfa7d08`.
- The recorded 584,711 ms from acceptance to ready includes the initial stalled queue; it is not pure inference or worker runtime.

## Controlled lifecycle evidence

| Question | Actual controlled witness | Finding / source change | Result |
| --- | --- | --- | --- |
| Does wallet repricing preserve the accepted request? | Original mint and higher-fee same-nonce replacement were sent to Anvil; the reader returned the replacement's successful receipt. | UI still posted the original hash, which had no receipt. The chain reader now exposes replacement reason; UI persists the canonical receipt hash before acceptance and distinguishes cancellation/no-request replacements. | Original failure reproduced. Actual UI confirmation belongs in the UI coverage record; the transport no longer hides the replacement identity. |
| Does a configured collection inherit another contract's scan height? | The local collection was at block 2; reconciliation requested official testnet deployment block 146395197. | Apply a deployment start block only when both chain and collection address match. Unknown configured collections start a bounded scan at zero; targeted wakes use the matching deployment or zero. | Local event recovery and subsequent normal settlement work for the configured collection. |
| Can a reorg leave a false `ready` forever? | After a complete saved result, the controlled chain rolled back to its still-pending request while durable records remained ready. A wake originally did nothing. | Terminal status reads and reconciliation now recheck canonical request/day facts. A reverted save returns to checking and an authenticated wake resettles its immutable packet. | Checking → ready, canonical day 1 restored, **zero additional model calls**. |
| What if owner acceptance itself disappears? | A separate chain rolled back before the mint: NFT absent, request None, permit unused, and original owner nonce available again. The original service stayed checking and retained its accepted hold even after signed quote expiry. | Capture actual permit operation/expiry/owner nonce; use one canonical proof path for job reads/wakes and cold admission. Automatic retirement is limited to pre-settlement work with no unsafe signed/outbox intent. | Before expiry: checking, no retry permission. After strict expiry + same-block unused permit + orphaned receipt: **unaccepted / retrySafe**, spending closed once, and a cold quote without a client job ID succeeded. Zero real AI calls. |
| Does the next mint collide with that retired job ID? | The next accepted local mint reused the v1 token/attempt request ID with a different funded permit and input digest. | Verify the old retirement proof remains canonical, retain an immutable archive of the old control, close its spending, and replace the active control by CAS with a new generation. | The fresh permit became accepted, its canonical context matched, and its controlled immutable packet reached ready. Zero real AI calls. |
| Can stale replay metadata protect an orphan instead of the new life? | The same save witness injected an orphan index at day 3 and an already-expired day-one entry before saving the new canonical day one. | Bind `index.latest` to the canonical rooster's day; clear retention on the current entry and supersede noncurrent/orphan entries. | Index latest became 1, current day one had no expiry marker, and orphan day three was marked superseded. |
| Does an unsafe relay journal incorrectly allow another payment? | A valid signed local relay failure intent was left in the outbox without being broadcast, then the owner acceptance was rolled out. | An outstanding outbox item or an unretired known relay nonce blocks automatic acceptance retirement. Prepared/failure-settlement cases remain quarantined for separate context review. | Even after owner-permit expiry and unused proof: checking, retrySafe false, hold retained, and a cold quote returned checking. Zero real AI calls and no relay broadcast. |
| Can an old failure be newly signed against a re-mined birth? | The exact same raw owner mint was mined again 30 seconds later, before its permit expired. Its permit/request IDs stayed the same while birth seed, accepted block and input digest changed. The old control was already recording a provider failure. | Failure and expiry relay paths now validate the canonical permit, input digest, seed, day, delivery, deadline, rules/config, pending owner/base and accepted block before creating a terminal intent. A context mismatch remains checking. | Before: the new canonical request became Failed. After: it remains Pending, with no new relay journal, no model calls and no spending. The worker-only resume was also checked without a second acceptance API call. |
| Can an untouched re-mined request resume without another payment? | The same re-mining scenario retained a control with zero sends/spend, no allowance, checkpoint, receipt, packet or terminal intent. | An accepted receipt can rebind only that pristine control under its CAS generation fence. It adopts the canonical base, seed, digest, deadline and receipt identity while preserving its funded reservation and counters. Paid/prepared/failure contexts are excluded. | Queued with the canonical seed/digest/block, accepted hold unchanged, canonical request still Pending, and zero model calls or spend. This witness stops at queued; it does not purchase inference to retest the unchanged preparation engine. |
| Is a paid response lost when checkpoint persistence fails? | A single controlled `EPERM` was injected after the first response was cached and before checkpoint 1 became accepted. | Existing resumable infrastructure handling retained the cached response and left the job queued. | Resume reached ready with 60 controlled sends total; the first slot was sent once. No real Jev calls. |
| Can a stale worker overwrite a replacement worker? | Generation 1 was held with a response in flight; its lease was deliberately expired. Generation 2 finished before the old response was released. | The shared control-record lease generation fences progress and finalization. | Generation 2 remained ready at slot 60; accepted checkpoint head did not change after the old response returned. Sixty-one controlled sends included the counted uncertain extra send. No real Jev calls. |
| Is expiry strictly later than the deadline, and does retry preserve biology? | A separate isolated chain was moved to exact deadline, then deadline +1; a different account performed the release. | Existing contract and client gates agree. A lost browser acknowledgement was recovered through the authenticated indexed-event wake. | Equality unavailable/rejected; +1 available. Canonical base stock/state and day 0 stayed unchanged, retry retained the same day seed and zero day-one delivery. No real Jev calls. |

Witness scripts and detailed disposable results are under `TEMP/audit/`; the permanent conclusions above do not require those files to build or run the game.

## UI scenario authority and remaining boundaries

The actual local full app at port 5175 uses the local chain, real API authentication/quotes/jobs and limited audit wallets. Its provider endpoint is intercepted only inside the temporary audit server. Wallet rejection, lost response, repricing, cancellation, revert, account changes and transfer can therefore be exercised without another production payment.

The following rare **controlled canonical snapshots** were created with accepted local requests and the normal immutable-packet settlement path, under an explicitly named controlled fixture configuration and with zero real AI calls:

| Local token | Fixture | Intended UI evidence |
| --- | --- | --- |
| 1 · REPRICE | Living day-one save | Standard replay/care and transport recovery |
| 2 · STOCK | All fifteen stock types at 65,535 | Full-stock delivery enabledness and zero-supply continuation |
| 3 · CARE | Low needs and all eight condition types | Deadline, treatment and condition-detail clarity |
| 4 · GARDEN | Two plots, shelter, umbrellas, chair and patches | Persistent garden/output/damage presentation |
| 5 · MEMORY | Retained dead NFT | Fatal save, replay fallback and memorial navigation |
| 6 · TRIAL | Alive after three committed days | Trial routing and mixed owned-token badges |

These establish rendering and authority fixtures, not probability, balance, genuine model decisions or naturally attained gameplay histories. UI screenshots and action results are tracked separately in [UI_COVERAGE.md](UI_COVERAGE.md).

## Bounded v1 recovery and future foundation review

`unaccepted` is an offchain recovery conclusion about a vanished acceptance. It is not a fabricated onchain Failed or Expired event. Operation and expiry come from an actual signed quote/transaction, never an assumption that day zero must mean mint. The owner nonce is captured for investigation but does not by itself permit another payment. Actual and conservatively uncertain spending stays charged when unused capacity is released. An older record without sufficient proof remains checking.

The PM retained the current collection for this UX audit. Its request ID is derived from chain, collection, token and attempt, so a safely retired birth can reuse an ID; the archive/CAS path above handles the witnessed case. Automatic retirement does not cover prepared packets or a failure already entering settlement. Unsafe journal/outbox cases stay quarantined rather than granting a premature retry. No generic relay cancellation or outbox rewrite was added in this round.

Same-permit re-mining is separate from unused-permit retirement: it grants no retry payment. Only a control that has done no work may adopt the already-funded canonical request. Any paid work or terminal intent remains tied to its original accepted context and cannot generate a fresh failure/expiry for the replacement context.

Before a future mainnet version, review full accepted-context identity and digest-bound relay outcomes. Adding only the permit ID does not cover every same-permit re-mining/context change. A new collection also requires collection-scoped client drafts/watched state and address/version-aware metadata routes that preserve the old NFTs' existing URI identity. That migration, ABI and verification work is real; it was not presented as a two-line deployment fix, and no replacement collection was deployed by this audit.

A production chain reorg, an actual third-party wallet's fee-bump UI, mainnet funding/deployment, and a real rare biological death were not exercised by these controlled witnesses. They must not be described as production-tested merely because the equivalent local authority or UI state was inspected. Existing contract/domain checks cover further structural cases; they are listed in [chain.md](chain.md) and [domain-notes.md](domain-notes.md), rather than rerun without a new uncertainty.
