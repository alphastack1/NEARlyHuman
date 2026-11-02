# Final release operations and hosted wallet preparation

This fresh review inspected the actual source cutover and production-setting helpers. It performed no cloud write, environment change, Git publication, owner signature or inference call. Root retains those operations until an explicit hosted-QA handoff.

The import helper keeps the required boundaries: exact authorized site/store; V1 onchain pause and cloud drain; no active local jobs, sends, quotes or gas holds; validated campaign/pool audits; strict create-only missing V2 records; exact JSON hash comparison; pool last; source manifest checks throughout; and a non-copied source spending seal. The configuration helper requires the completed import/seal and verifies the actual final-policy guest packet, job, state/trace/certificate/reward hashes, production scopes and fresh legacy hold/outbox checks. It changes only six public V2 keys and preserves private secrets and other contexts.

Two concrete player/operations boundaries were reported to PM for repair or final verification:

- Menu **Your lives** used an automatically discovered account even when no wallet provider had been explicitly selected. With multiple EIP-6963 wallets, a returning owner could be shown another provider's empty portfolio rather than a clear wallet choice. The existing `run('connect')` action provides that choice without a transaction.
- V2 day quoting checked relay funds but did not check the player's native balance before reserving its full AI/gas allowance. A wallet unable to submit could leave an unused quote held through Robinhood's observed finality delay. Checking the pinned player balance against preparation fee plus buffered request cost before any reservation avoids that ordinary empty-wallet case; it does not justify weakening unused-permit finality.

The assigned quote repair is now implemented in `server/v2/quotes.ts`: player balance is read at the same verified block, and funds below preparation fee plus twice the request-network estimate return the existing typed `funds` error before any store access, quote record, budget hold, gas hold or signature. Relay funds remain separate. [Two controlled boundary cases](quote-player-funds.json)—zero balance and one wei below the threshold—both reached that error with zero store operations/signatures/network requests. The nine existing fee-math checks and application TypeScript check pass. No actual quote or financial ledger was created by this proof.

The foreground quote path also no longer runs the historical funding reconciler. It touches the current quote scope and funded accounting records; authenticated background/scheduled reconciliation retains the existing terminal/finality checks. [A controlled funded-store proof](quote-foreground.json) included41 retired history records and issued/renewed one dummy admission with **zero history lists/gets**, the same scope ID, one full job allowance and no charge. The unfunded-wallet proof still stops before every store access. Background history scanning remains a separate scaling follow-up; no index framework, shortened finality, deleted hold or weakened reservation was introduced.

## Temporary hosted wallet harness

`TEMP/overnight/wave6/ops/hosted-wallet-qa.ts` is run-owned test tooling, never a production dependency. Its default keyless check passed six rejection/acceptance boundaries and strict TypeScript checking. The default loads no credential, opens no browser and makes no network request.

Actual mode additionally requires an explicit Root gate. It verifies the hosted exact V2 world/policy and actual RPC runtime before unlocking the existing encrypted owner key. The key stays in Node memory. A Playwright binding supplies a uniquely named EIP-6963 QA wallet in one tracked Codex Browser tab. No key or raw signed transaction enters page code, TEMP evidence or the profile. Browser-facing failures are sanitized because RPC error messages can contain signed request bytes.

The signing path permits only chain46630 and the fixed final controller/token. It validates method, native value, admission player/policy, exact250NHC approval, gas, nonce and decoded intent. A run permits at most its one native mint and one accepted day, or one withdrawal from the specifically selected NFT. Unsupported methods, mainnet, arbitrary recipients and signing payloads are rejected. New writes wait behind any unresolved earlier signed intent. Exact raw transactions are journaled before broadcast under the private data directory outside the checkout and checked again before recovery; an exclusive PID/token lock serializes the run.

The harness uses page-local client storage without clearing the persistent profile, closes only its own tab, and leaves financial records intact.

## Actual hosted release check

After PM opened the hosted testnet gate for published commit `c3895b037fd328f7992a6d78de034fbb4d4ec264`, the real website minted **SUNNY #3**, accepted its first paid day, ran Jev through the hosted background worker and played the saved film. Exactly two owner transactions were sent: native mint `0x27933bc681bea39d38b93599fd9a124334ceba02718cc8d4c8bbdf7a07091d72` and day admission `0x6feab49b373464acf0b5b2d12abf09310e82d38f3ca4ae2bfb99b6e6b734431d`. No new NFT or duplicate payment was made when recovering the test harness. Owner-write control was explicitly returned to PM immediately afterward.

[The canonical Cloud/chain readback](hosted-owner-day.json) verified the actual ready job, immutable film packet, request and all state/trace/certificate/reward commitments against SUNNY's onchain Day1 record. The finalization transaction is `0xfcd302444d40932d144c43d57c93d2b7817e1ba467b48b9d1bd7686b4fa83c3c`. Five paid Jev sends cost **$0.000576** in the provider ledger; all entries completed, the quote retired, the AI allowance became inactive and the gas hold was removed. The actual saved project was **Plant Daisy**. Application JavaScript errors: **0**.

This was a recovered harness sequence, not an uninterrupted single attempt. The first browser injection failed because a TypeScript serializer inserted a helper unavailable in the page; it made zero wallet requests. After plain-JavaScript provider injection was verified, mint succeeded, then a test selector matched both the home and dialog preparation buttons; no day was paid at that point. A subsequent return attempt had no selected provider. Scoping the preparation selector and taking the real **Your lives → QA Wallet → SUNNY** return path resumed the same NFT and completed its one day. These were tooling failures; they did not require another app release or another mint. The sanitized [successful browser report](hosted-mint-day-result.json) includes the two confirmed owner receipts and actual queued → preparing → prepared → ready API observations. Initial replay404 responses were for a newborn life before any saved day; replay then returned200 for Day1.

The three actual testnet purses held zero. No positive hosted withdrawal was attempted or claimed. A separate [read-only hosted UI check](hosted-readonly-captures.json), using only the public owner address and a provider that rejects signing/writes, confirmed the zero purse provides **Back home** and has no withdraw button. It also checked the public profile, completed film and next-day supply picker without requesting another quote or AI day. It recorded zero application errors, zero attempted signing/sends and zero non-GET API requests. Only run-owned Codex Browser tabs were closed; the shared profile was preserved.

Verified phone evidence at390×844:

- [Hatch](hosted-hatch-390.png), [minted home](hosted-minted-390.png), [saved day](hosted-saved-day-390.png), [playing film](hosted-playing-390.png).
- [Public NFT life](hosted-public-profile-390.png), [zero purse](hosted-zero-purse-390.png), [day complete](hosted-day-complete-390.png), [settled next-day supplies](hosted-care-settled-390.png).

The original care capture landed during its entrance fade and is kept only in TEMP. The settled replacement shows the next-day picker after the actual first day; it does not claim another payment or another saved day.
