# Testnet transfer-burn release operators

These operators keep the same hosted service store and funded campaign, `nearlyhuman-v2-testnet-20261102`. None creates an allocation, resets a ledger, copies reservations, exports a private key or deploys to mainnet. All default invocations are read-only. Root alone runs the explicit mutation gates.

## 1. Pause retiring admissions, then inspect

```powershell
node --import tsx scripts/v3/cutover-testnet.ts
node --import tsx scripts/v3/cutover-testnet.ts --broadcast --gate=testnet-transfer-burn-cutover
```

The mutation branch permits only original Robinhood `setAdmissionsPaused(true)` and original native `set_admissions_paused({paused:true})`. It pins the actual old controller/interpreter, testnet, owner and native F8hc code hash. It cannot unpause, upgrade code, transfer treasury funds or write a service setting. The RH transaction uses the shared developer-wallet lock, a bounded fee and an exact signed-intent journal outside the checkout. Native operations reuse the existing protected owner helper and durable journal. The native helper's private gate is enabled only inside that explicitly selected process; Netlify environment variables are not changed.

The resulting `TEMP/rh-v3/cutover-both-inspection.json` includes fresh aggregate chain and hosted obligations for both chains. A pause is not a drain: pending days, held or retiring quotes, gas holds, uncertain sends, live job allowances and relay outboxes must still be checked. Existing reconciliation can finish those obligations using their original accounting. Do not delete or reset them.

The read-only observation before Root's cutoff found original RH48 ready jobs and1 failed job, native3 ready jobs, and zero outstanding chain, quote, gas, AI-job or relay obligations. Both used the same90,000-microUSD campaign with36,590 charged. The only blockers at that observation were open admissions. Root's later cutoff result supersedes that dated observation.

This specific pause operator intentionally refuses a native account already upgraded beyond its old F8hc pin. After the code-only upgrade, use the new-runtime operators below rather than weakening that old pin.

## 2. Perform the separately reviewed code-only native upgrade

Root uses `scripts/near-v3/upgrade-testnet.ts` and its own exact artifact gates. The verified output must be `contracts/near-v3/deployments/testnet.json`, preserving all prior state. Neither settings operator below initializes or upgrades the native contract.

## 3. Review and apply public runtime settings

```powershell
node --import tsx scripts/v3/configure-runtime.ts --rh-guest=none
node --import tsx scripts/v3/configure-runtime.ts --apply --gate=testnet-transfer-burn-runtime --expected-plan=HASH_FROM_FRESH_DRY_RUN --rh-guest=none
```

To use an actual newly saved RH example instead, supply `--rh-guest=ID --rh-day=DAY` on both invocations. The operator verifies its exact onchain day and hosted replay commitment. With `none`, only the new active RH guest fields are cleared; the backend's pinned original guest remains NFT1/day28.

The allowlist contains only RH public runtime, unchanged RH RPC, active RH guest ID/day and upgraded native public runtime. Existing values must match the reviewed old identity or exact new target. Both campaign settings must already point at the same existing allocation. Private keys, session secrets, build variables, native guest settings, custom contexts and every unrelated value remain untouched. Unknown public values, secret flags, unexpected scopes or custom contexts stop the operator for review.

Apply requires the reviewed plan hash, the verified native deployment record, a fresh full original-RH/upgraded-native drain, and the same campaign identity. Production-context values use individual PATCH requests. A variable with exactly one all-context value uses the official CLI's full-variable PUT form, preserving its key, functions scope and nonsecret flag. Multiple or custom contexts are rejected before full replacement. Final readback verifies the public targets and a hash over every untouched setting. No deploy is triggered by this operator; the PM publishes the final website/functions candidate once.

Control requests close their HTTP connection after each response. Only GET requests may retry transient socket/time-out failures or HTTP429/502/503/504, with at most3 attempts and short bounded backoff. PATCH and PUT are sent once. An uncertain write requires an exact target-value read before resumption; the old/new value allowlist then preserves an already-applied target instead of blindly repeating it. Validation errors project schema field names only; raw messages, values and encrypted responses are withheld.

Request forms were checked against the installed official Netlify CLI24.11.1 and its `@netlify/open-api` schema, as well as the official [environment-variable API documentation](https://open-api.netlify.com/#tag/environmentVariables) and [API guide](https://docs.netlify.com/api-and-cli-guides/api-guides/get-started-with-api/). [Schema verification](env-update-schema-verification.json) records the exact public schema fingerprint and controlled request-body checks. Following a422 response in Root's second apply, a fresh read confirmed all RH target settings had already succeeded and only the native all-context runtime remained old. The resume path skips successful targets and uses the official client's all-context PUT form for that remaining value; it does not reset or roll back them.

The initial [public settings preflight](runtime-env-preflight.json) is a dated ready-for-apply record, not a substitute for a fresh dry run.

## 4. Publish, then reopen native days

After the final backend/frontend publication:

```powershell
node --import tsx scripts/v3/resume-native-testnet.ts
node --import tsx scripts/v3/resume-native-testnet.ts --broadcast --gate=resume-native-transfer-burn-v3
```

Resume pins the verified new native account, owner, EpAu code hash, reviewed Wasm SHA and enabled50bps policy. It requires the configured public runtime and the actual published `/api/near/v2/config` to match that new identity. Merely setting a future deploy's environment value is insufficient. It also validates the shared campaign and zero native obligations before signing the single owner `paused:false` operation through the existing durable helper.

Original Robinhood admissions remain paused. New RH V3 is a separate active controller. Root verifies the actual published wallet/hatch/first-day flows after publication.

## Operator verification

- Four operator sources pass strict TypeScript checking with zero diagnostics.
- [Three negative gate checks](operator-gates-verification.json) prove missing or incorrect mutation gates reject before wallet or cloud operations.
- [Nine controlled transport checks](cloud-transport-verification.json) cover stale read sockets, bounded read retries, response-body failures, permanent read rejection, safe validation-field projection and the absence of automatic PATCH/PUT retries. The experiment addressed a closed idle connection after a long drain inspection; public target-value readback confirmed the first interrupted apply had written nothing before this change.
- Public pause/Cloud inspection and public settings preflights ran without signatures or writes by the implementation agent.
- Native resume correctly refused the still-old Netlify runtime pin before publication; no resume transaction was sent by the implementation agent.

Scratch reports are aggregate/public observations only. Exact signed bytes remain in the existing private operator journals outside the repository and must not be published.
