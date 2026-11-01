# Final narrow RPC recovery review

Reviewed commit `421f2cc` read-only: `server/chain.ts`, `server/jobs.ts`, `server/service.test.ts`, and `docs/variety-review/RPC_RECOVERY.md`. Also read the captured NORI4 retry result and saved day2 packet. No source, browser, network/model or chain actions were performed for this review. Existing focused checks were inspected; they were not redundantly rerun.

**No blocking defect found in the narrow patch.**

The shared block-unavailability category covers the actual viem `BlockNotFoundError` and exact observed missing-block wording. Cause traversal is bounded and cycle-safe. Contract/execution revert barriers are checked before text inspection; only the first meaningful or explicitDetails lines are inspected. Application404s and transaction-not-found messages are not promoted into the new category. The underlying pre-existing HTTP/RPC transport recovery categories are unchanged.

Pinned reads retain five attempts, with2.5seconds of backoff in addition to the read durations. Latest/pinned revalidation, accepted-block and receipt-confirmation reads use the same helper. Retry exhaustion inside an unfinished leased preparation returns it to queued without deleting receipts, checkpoint, cached answers, send counts or spending. The lease is cleared in finally. A completed immutable packet stays in saving; an existing terminal journal is retained. There is no added failure intent or onchain refund/delete behavior.

Real changed block hashes still produce the precise checking409 quarantine. Existing CanonicalChanged input, ownership, revision, accepted-fork, checkpoint and result checks remain intact. Cached answers are reused only after their exact recomputed input hash matches. A mismatch cannot buy an alternate outcome; it stays checking. Gameplay actions, success rolls, incident RNG, codec, model request policy and decision fingerprint are unchanged in the421f2cc diff.

The focused worker witness is meaningful: it reconstructs40 actual fixture receipt blobs, preserves cached answer41 across five installed-viem missing-block failures, verifies queued/40/sent41 with no failure or journal, then resumes. The intercepted model fixture is called for42–60 only; answer41 stays count1. Final history and state equal uninterrupted preparation. The separate changed-hash injection stays checking; post-preparation block absence retains saving. These are explicitly local fixtures, not a claim of paid network inference or full chain settlement.

Limits, not blockers: queuing is not an instant retry loop. Resume uses the existing wake/reconciliation path; hosted reconciliation is scheduled every five minutes, and a longer outage can still reach the accepted deadline. The original already confirmed failure remains historical. The patch addresses this precise missing-block failure class; it does not promise complete availability for every RPC/provider/storage error. An RPC retry adds latency; it does not change selected actions or outcomes.

The permanent RPC recovery note accurately states the root cause, mock boundary and focused evidence. Its final no-calls/no-commits/source-frozen wording describes the patch authoring/test stage; the PM's final deployment/live-check section should supply the later operational evidence rather than present those historical statements as the present deployment status.

Captured live retry evidence is consistent with successful UI recovery: NORI token4/day2, autoplaytrue, progress10, one owner transaction, successful auth/quote/accept requests and no browser errors. The saved day2 packet contains60 receipts/60 decisions and survivedtrue, commitment `0x5a7c66213e560119238a3b0e280f806d65bb4364fd844b8562159525bb86c82e`. This review did not independently query the chain; the PM owns the separate canonical verification. The UI capture alone is not labeled proof that the retry encountered another missing-block failure.

Decision: no further backend changes or additional model calls are required by this narrow final review. Proceed with the PM's canonical verification and final evidence/doc cleanup.
