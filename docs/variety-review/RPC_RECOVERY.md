# Temporary RPC block recovery

Question: can the exact live `BlockNotFoundError` at a pinned block revalidation incorrectly burn a funded attempt as `preparation_interrupted`?

Evidence: NORI4 day2 stopped at checkpoint40/sent40 after viem returned `Block at number "146583663" could not be found.` from `canonicalRequest`. The old block-unavailability regex did not match this typed error or wording, so the worker recorded a terminal failure. The completed day1/base supplies remained unchanged. That already confirmed failure is not reversible by this patch.

Change: a shared precise `blockUnavailable` category recognizes viem's typed missing-block error, the observed wording and supported RPC header/block-height errors, with bounded/cycle-safe causes. It excludes known contract reverts and arbitrary transaction/application404 errors; text scanning is limited to first meaningful/explicitDetails lines. `pinnedRead` retains its five attempts/2.5second total backoff. Latest, pinned revalidation, accepted-height, receipt-height and finalization-height block reads use it. After retry exhaustion, unfinished preparation queues with its existing checkpoint and paid allowance. A genuine changed block hash remains in `checking` quarantine through the precise ServiceErrorchecking409 signal, alongside existing CanonicalChanged checks. Ownership, exact input hashes and deadline handling remain unchanged.

Focused result: the isolated real worker test starts from40 exact saved receipt blobs and a cached answer41. A mocked JSON-RPC missing block causes five real viem getBlock failures at canonical revalidation. The worker queues at40; all receipts/allowances remain identical; lease clears; no inference, failure flag, journal or terminal transaction occurs. Restoring the mocked RPC resumes, consumes cached41 once without another send, and finishes60 receipts. Nineteen additional inference responses are local injected fixtures only; no network or paid request is made. Final compact history and state equal uninterrupted preparation. A separate changed-hash injection leaves40/41 intact in checking with no failure journal. Post-preparation missing block retains the immutable packet in saving.

Independent adversarial review caught and fixed a potential multiline contract-revert false positive. The final negative witness uses an actual viem ContractFunctionRevertedError and wrapped cause.

Checks: TypeScript passed; existing service/storage suite now8/8 passes, including the two focused recovery tests. Whitespace passed. A final leading-newline classifier adjustment passed its focused test. No contract/domain suite was rerun because legal rules/state/codec/provider policy are untouched.

Permanent files: server/chain.ts, server/jobs.ts, server/service.test.ts. No decisionConfig/prompt/body changes, new infrastructure, product edits, credentials, actual chain/model calls, commits or pushes. Source frozen for PM deployment and the new same-NPC day2 retry.
