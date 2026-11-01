# Release and operator handoff

This release serves **Robinhood testnet 46630** and collection **0x998551395f8a0c4ebd1f883b8c18a41d2cecabfb**. There is no deployed mainnet collection in the public deployment map. A push to `main` triggers Netlify; finish the sprint locally, then publish one reviewed release.

## Environment and runtime

[.env.example](../.env.example) lists the names and safe public defaults. Copy it to `.env` for local development; `npm run dev` loads those values before the optional Windows encrypted credentials outside the checkout. Keep the hosted runtime flag commented out locally. Production uses Netlify environment variables. Keep the AI key, limited relay key and session/worker secret in **Functions scope, production context**, never in `VITE_` variables, source, logs or frontend build values. The owner/treasury key is not a production application secret.

The function manifests were built for Node 22. Pin `NODE_VERSION=22` and, if overriding the function runtime, `AWS_LAMBDA_JS_RUNTIME=nodejs22.x` in Netlify project configuration. Runtime selection must be set through Netlify's environment/UI/API, rather than `netlify.toml`; see the [official runtime configuration](https://docs.netlify.com/build/functions/configuration/). Changing deployed environment values requires a new deployment. Production `URL` and Blobs credentials/context are supplied by Netlify, rather than copied from local `.env` data.

Set **`NEARLYHUMAN_RUNTIME=netlify` in Functions scope**. The build-time `NETLIFY` flag is not a sufficient runtime discriminator. The explicit hosted flag selects durable site Blobs and authenticated background dispatch, instead of local files or a detached local worker; see [Netlify's runtime environment documentation](https://docs.netlify.com/build/functions/environment-variables/). Local development omits this flag.

The API, background worker and five-minute scheduled dispatcher are permanent source files under `netlify/functions`. Scratch function zips and manifests in `TEMP` are evidence only. Deployment rebuilds functions from the permanent source and installed lockfile. No source, art, secret or process required at runtime lives in `TEMP`.

## Before the final release

1. Keep this sprint's chain/collection/RPC values together. Runtime checks verify the RPC's chain ID, deployed code, rules version, state size and testnet flag before paid work or transaction signing. A mismatch closes admission.
2. Keep the current onchain signer/relayer equal to the configured service key, and enough ETH in that service wallet for the funded reservations. Keep the AI allocation at or below credits reserved for this app. The budget ledger does not query the provider's balance.
3. Preserve existing durable admission, job, packet, replay-index and relay-outbox records when moving verified local work to production Blobs. Copy only a consistent quiescent snapshot after workers finish; verify conditional writes against the actual production store. Do not overwrite live records after new production requests begin.
4. Finish TypeScript/build checks and the already-defined focused witnesses. Inspect the produced function manifest for background invocation and `*/5 * * * *` reconciliation. Rebuild these artifacts after the final source change; old scratch zips are not the release.
5. Use one authorized `main` push. After it publishes, verify public config, saved NFT metadata and an existing replay, then use the already-planned real public-site request to witness the cloud worker. Do not manufacture extra paid requests for redundant checks.

## Interrupted requests

The player's saved state remains authoritative until a canonical successful save. `queued` means work can resume; `preparing` means a worker owns a lease; `saving` means the full immutable result is waiting for canonical settlement. `recording_failure` remains an obligation until its terminal transaction is confirmed. `checking` can quarantine a changed input/configuration or recover an uncertain transaction; it does not authorize a second payment.

An authenticated wake resumes an existing funded job and buys no new request. If its control record is missing, the wake can recover the recent indexed accepted event and its funded allowance immediately; older history is found by the scheduled cursor scan. Browser transaction journals preserve a known hash or uncertain permit submission. A missing wallet response is resolved through canonical logs; a new submission is allowed only after proof that the old permit expired unused.

Worker leases last ninety seconds and are fenced by generation. A crashed worker can therefore need that lease to expire before another worker takes over. Storage/RPC interruptions leave resumable work queued rather than discarding a cached paid choice. Players may leave and return, use the status action, or release an expired request directly through the wallet. Expiry requires chain time strictly later than the request deadline and charges only that release's network gas.

For an operator investigation, use the job's request ID to read its private control record and redacted exception reference. Do not expose raw diagnostics, credentials or signed transaction bytes in product error messages. Never clear an uncertain relay outbox to unblock its nonce; recover the exact journaled transaction first.

## Changing rules or moving to mainnet

Pause new admission through the owner contract setting before a rules change, allow issued quotes to expire, and finish or release accepted requests. Resume only when the new service configuration is ready. New inference is blocked if a stored accepted configuration hash differs from the running implementation. Existing fully prepared packets may still settle, and older saved replays remain readable. A rollback to the original implementation can resume its unexpired accepted job.

Mainnet is a separate deployment and funding step. Its script requires an explicitly verified ETH/USD feed and maximum age, refuses a mismatched RPC, journals the exact signed deployment before broadcast, and estimates without broadcasting by default. The constructor rejects testnet pricing on chain 4663. Verify the resulting roles, state codec, price feed freshness and public deployment record, and fund the mainnet relay independently before changing production chain settings. Do not switch a live service away from unresolved testnet obligations.

Do not reset the AI ledger to regain capacity. Raise its funded allocation only after adding actual credits, or adjust operating limits deliberately. The multiplier setter changes processing fees on future quotes. Full previous replays age out thirty days after being superseded; the latest saved replay, including a fatal one, remains protected. Compact contract history persists independently.

Detailed implementation and witnessed transactions are in [chain.md](chain.md) and [service.md](service.md). The concise [sprint record](SPRINT_RECORD.md) distinguishes real requests, browser observations and the final public-runtime evidence.
