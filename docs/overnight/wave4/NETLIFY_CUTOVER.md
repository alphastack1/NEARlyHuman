# V2 testnet Netlify cutover preparation

This preparation performed read-only Netlify/API/Blobs inspection. It did not change environment variables, copy cloud records, pause a contract or deploy the site.

## Verified capability

The installed CLI is24.11.1 at `C:/Users/Admin/AppData/Roaming/npm/netlify.ps1`. Its existing signed-in account configuration is `%APPDATA%/netlify/Config/config.json`. Operator code can read the selected CLI user's token into memory; never print it or place it in a command argument, repository file or TEMP file.

The authorized site was verified through the authenticated Netlify API:

- Site: `15eabb4e-7828-4019-a628-2da95c19d2bd`, `nearlyhuman`, https://nearlyhuman.netlify.app.
- Account slug: `metamellow-apps`.
- Durable named store: `nearlyhuman-v1`, accessed with the installed `@netlify/blobs` SDK using explicit `siteID`, token and strong consistency.
- At this read-only inspection, the cloud had zero `v2/` records. Its V1 admission ledger had33423microUSD spent,15done and1released hold, zero held/accepted reservations. All15 V1 jobs were terminal and the shared cloud relayer outbox had no pending transaction or active lease.
- **V1 admissions were still unpaused at the observed block.** The empty queue observation alone is not a cutover fence. Pause V1 admissions onchain, then repeat the cloud drain audit before any local V2 public relayer transaction or import. Local and cloud stores cannot independently serialize the same relayer wallet.

The existing production Functions secrets for NEAR AI, the relay wallet and session signing are configured. This inspection printed only key names/scopes/context/configured flags, never secret values.

## Strict V2 record import

The permanent helper is `scripts/v2/import-netlify.ts`:

```powershell
node node_modules/tsx/dist/cli.mjs scripts/v2/import-netlify.ts
```

This default is read-only with respect to Netlify. It checks the exact authorized site, the current original V1 `admissionPaused` state, cloud V1 jobs/holds/outbox, local V2 jobs/quote/gas holds and the validated V2 pool/campaign audits. It inspects only `v2/` as importable source records. It does not copy any V1 record or the global relayer outbox.

The current local source has three V2 records: the pool, the closed research campaign and the new90000microUSD public campaign. The research's original30000 limit, all50 completed sends and5413 charge remain intact. Its audited24587 unused release makes total pool commitment95413, leaving4587 unallocated. These numbers must be recomputed after the actual testnet/AI play; do not reuse today's manifest hash at the final cutover.

The helper bounds source import to1000records/50MB, with10MB per record. It writes a reviewed key/hash/size manifest under the private local data directory's `ops/` subfolder. Record values, model answers and raw signed journals are not printed or exported into repository evidence. Import uses the exact JSON property order because rich film commitments are hashes of serialized packets.

After the final actual testnet days, stop local V2 worker processes and finish/release every accepted day, quote and native-gas hold. No campaign entry may remain `sent`, including a jobless diagnostic whose response can still reconcile a cost. Conservatively charged `uncertain` entries are preserved. Then run the dry check again. Only when its pause/drain/source checks pass, use its new reviewed hash:

```powershell
node node_modules/tsx/dist/cli.mjs scripts/v2/import-netlify.ts --apply --quiescent --manifest-hash=THE_REVIEWED_HASH
```

Apply refuses an unpaused V1 collection, active source jobs/holds, a changed source manifest, any different existing cloud V2 value, or extra cloud V2 keys. Existing identical records are skipped. Missing records use **`onlyIfNew:true`** and are reread with strong consistency; a concurrent different write fails instead of being overwritten. Campaigns/packets/jobs/quotes precede the pool. There is no rollback that deletes financial records. A partial run can resume only while the unchanged source and existing cloud records still match. Final source and complete cloud namespace are rechecked before reporting completion. Netlify documents the conditional-write and explicit-site SDK mechanisms in [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).

Apply first writes a one-way local spending fence at `control/v2-store-cutover`, bound to the exact site/store/manifest. It is outside the imported namespace. New local campaign creation, job reservations and paid sends then fail closed, including after an accidental developer-server restart. Existing complete answers remain readable, and an already-sent call can still reconcile its actual charge. The original ledgers are not deleted or reset. A partial import keeps its source sealed and can resume with the same reviewed hash; full verification marks that seal complete. The hosted target must have no such seal. The importer rejects a hosted-runtime environment before any authentication/network operation so `storage()` cannot accidentally seal the target instead of the local source.

Do not resume local V2 paid work after a successful import. The cloud becomes the sole V2 worker store. The local financial snapshot and import audit remain preserved, not reset or reused as an independent new allowance.

## Environment plan for the one final release

Only after the final controller and real saved guest NFT exist, prepare the following **production-context** entries:

| Key | Scope | Source |
| --- | --- | --- |
| `VITE_NEARLYHUMAN_V2` | builds | `1` |
| `NEARLYHUMAN_V2_RUNTIME_JSON` | functions | Verified `runtime` from `contracts/v2/deployments/robinhood-testnet.json` |
| `NEARLYHUMAN_V2_RPC_URL` | functions | `https://rpc.testnet.chain.robinhood.com` |
| `NEARLYHUMAN_V2_CAMPAIGN` | functions | `nearlyhuman-v2-testnet-20261102` |
| `NEARLYHUMAN_V2_GUEST_ID` | functions | Exact final testnet NFT ID with an actual saved Jev film |
| `NEARLYHUMAN_V2_GUEST_DAY` | functions | Exact reviewed saved guest day |

Keep existing `NEARLYHUMAN_COLLECTION` pointed at V1 so its old reconciliation/records remain readable. V2 has its separate runtime identity. Keep the existing chain46630, runtime, origins and private Functions secrets. Do not set `NEARLYHUMAN_V2_LOCAL` in production. Any optional AI/hosting native fee allowances must use the final validated names/bounds from `server/v2/service.ts`, with an explicit intended testnet value.

The existing CLI authentication can also perform scoped API environment changes. Its installed primary API specification supports:

- `GET /api/v1/accounts/metamellow-apps/env?site_id=15eabb4e-7828-4019-a628-2da95c19d2bd` to inspect metadata.
- `POST` to that endpoint for a new variable, body `[{key,scopes:["functions"],values:[{context:"production",value:PUBLIC_VALUE}]}]`.
- `PATCH /api/v1/accounts/metamellow-apps/env/KEY?site_id=...` for an existing production value, body `{context:"production",value:PUBLIC_VALUE}`. Preserve other contexts and scopes.

Use structured request bodies and the in-memory token; do not dump API responses that may contain existing values. These V2 entries contain public runtime identity/configuration, so no existing secret needs to be read back or rotated. Prefer this narrow API update over importing an entire `.env` file.

Netlify applies updated environment values on a new deploy; prepare these entries before the single planned final main push. Updating variables is not a substitute for verifying the resulting deployed Functions/build. See [Functions environment variables](https://docs.netlify.com/build/functions/environment-variables/) and [CLI environment guidance](https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/).

The final release must verify the hosted V2 configuration, exact guest/public-life route, a complete real Jev day, owner payment/retry and purse behavior. No environment or production push was performed by this preparation.
