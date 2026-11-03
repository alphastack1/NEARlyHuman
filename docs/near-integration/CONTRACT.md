# Native NEAR contract review and evidence

The native contract derives biological state, material production, shipment points, reward amounts and NFT death from the same bounded action trace as the existing Robinhood game. The relayer supplies choices, a care witness and replay commitment; it cannot submit an output stock, arbitrary reward or death flag.

Source: [Rust authority](../../contracts/near/src/lib.rs), [deterministic interpreter and ABI codec](../../contracts/near/src/kernel.rs), [API agreement](../../contracts/near/API.md). NFT and FT custody share one NEAR contract account, with separate interfaces and a backed purse per NFT. The native NHC supply is independent of Robinhood's supply; there is no bridge or aggregate accounting fiction.

## Local verification

Eleven focused Rust host checks pass, including **82 independent TypeScript state/reward vectors**, exact 4,160-byte V2 ABI roundtrip, real Ed25519 admissions, strict expiry, stable retry seeds, pending transfer lock, NFT revision/nonce changes, exact operation idempotency, expected-wallet binding, native funded storage, dead purse withdrawal, FT auto-registration, both token-funded birth paths, forced unregister burn accounting and relay-funding escrow/callback handling. Host-only custody fixtures are not exported in the production Wasm.

The actual production Wasm then executed a closed economic campaign through **186 local near-sandbox transactions**. Across **83 productive days**, one life earned **265.810662 NHC**, burned 250 from its purse to create another NFT, then died through three days of genuine neglect. Its remaining 15.810662 NHC stayed attached to the dead NFT, moved with direct ownership transfer, and was withdrawn by the new owner with atomic FT registration. Repeating the withdrawal did not credit again. Forced FT unregister burned that withdrawn balance without reducing lifetime issuance or erasing the immutable operation outcome. Every one of the 86 day outputs matched an independent TypeScript replay byte for byte and the onchain reward formula. No product, token or terminal flag was injected into these actual receipts.

An earlier paid attempt was deliberately failed; its save remained unchanged and the retry retained the exact intended-day seed. Pending ownership transfer was refused. Actual duplicate mint, changed operation payload and wrong selected-owner attempts were also checked.

A later artifact adds a bounded private funding-callback result read and explicit callback predecessor guard after the closed campaign. Its separate targeted actual receipts verify the same stored game, ownership roundtrip followed by a new day with revision greater than biological day, valid three-day care witness, late-invalid witness softening, escrow-preserving fee-funded relay transfer and failed-transfer accounting recovery. A final Wasm-width audit found and fixed a separate canonical-decoding issue: a declared dynamic array count could narrow from u64 to wasm32 usize before its limit check. Both trace and certificate counts are now bounded before narrowing. An actual final-artifact receipt rejects count 2^32+n, preserves the same paid request and save, and subsequently accepts its canonical trace with exact TS output. The long economic campaign was not repeated for those isolated changes. Evidence distinguishes these exact artifacts rather than claiming all transactions used the final bytes.

All receipt tests used **localhost 127.0.0.1:3038**, near-sandbox 2.14.0-rc.4 / protocol 88, and an ephemeral local validator key. They did not load or spend the developer wallet, public testnet tokens, AI credits or service budgets. Public deployment and real Meteor/Jev verification belong to the PM's subsequent release checks.

## Measured bounds and storage funding

| Operation / case | Actual local measurement |
| --- | --- |
| Policy administration candidate Wasm | 489,972 bytes; SHA-256 `d1fc9ae7ad38895ede3dca756100f1e56583b312fb45349aa963b18f9792f880` |
| Candidate NEAR code hash | `F8hcchfZEbdVzEpKaFxM65LsVHiZSs2Lu72TLbRC1PfV` |
| Newborn, including NFT, compact Borsh life, FT registration and immutable operation | 1,289 bytes / 0.01289 local NEAR storage stake |
| Paid day admission | 393 bytes of new storage; about 3.46 Tgas |
| Final day record, focused cases | 269–285 net new bytes |
| Ordinary complete productive day | Approximately 4.38–4.92 Tgas finalization |
| Valid 8-step three-day witness plus 6 real day actions | 5.676 Tgas finalization |
| Late-invalid 9-step witness plus 7 real day actions | 6.164 Tgas finalization, with onset softened and exact TS output preserved |

The witness measurements exercise actual heavy paths; they are not a universal worst-gas proof for every legal state. Trace and witness byte/step budgets remain enforced and finalization has a hard prepaid-gas ceiling.

The initial 0.1 NEAR native mint price covers the measured newborn storage. Token-funded births and custom purse withdrawals attach a refundable 0.1 NEAR storage deposit. Charging only one yoctoNEAR for a withdrawal's new immutable journal would permit storage griefing; funding actual new storage prevents that. The recipient FT account is created atomically when needed, and unused attached deposit is returned.

Admission retains actual new-request storage costs and escrows 0.01 NEAR for the future day record under the initial 0.02 NEAR minimum processing fee. Escrow is excluded from earned fees. Successful settlement consumes only the record's actual net growth and releases the remainder; failure/expiry releases the unused reserve. Relay funding cannot spend this escrow, storage stake or the operating buffer. Actual fee-funded top-up of **all earned fees while a day was pending** still left that day able to finalize.

## Authority and custody decisions

The policy administration candidate adds only `set_decision_config`: the owner must pause admissions and drain every paid day before updating a nonzero, different mind fingerprint. The existing native storage escrow provides the drain check even for nonshipping days; no storage fields or kernel rules change. Three focused host checks and an actual initialized local code upgrade preserved both NFTs and saved day records ([receipts](policy-upgrade-receipts.json)). The previous reviewed `BMxLckeFy9Sg2ynJB9CpkPdXjzA6v1c1JwL26WzHpscV` artifact and manifest remain in [Mind7 history](../../contracts/near/artifacts/history/mind7/).

- Operation IDs are bound to the immediate expected owner and exact payload. A retry returns the stored outcome and refunds newly attached deposit; it never repeats a mint, burn or withdrawal. FT unregister cannot erase this journal.
- A direct NFT transfer advances the life revision and purse nonce, even without a biological day. The new actual owner inherits purse rights; approved NFT operators cannot withdraw the purse. Pending days lock ownership transfer.
- Failed/expired AI attempts retain their original onchain history and do not advance biology or delete payments.
- Lifetime issuance pressure never rewinds when tokens are burned for births or forced unregister. The vault backs allocated purses; unsolicited ordinary FT transfers to the vault are unallocated donations, so the safety invariant is `vault >= allocated`.
- The native NFT transfer-call entry deliberately refuses the asynchronous tentative-ownership path. Direct NFT transfer, approval and enumeration work; no unsafe receiver/resolver custody window is exposed. This limitation is explicit in configuration and API documentation.
- Owner and current relayer may replenish the configured relayer only from earned fees. One transfer is in flight at a time. A private, amount-bound callback returns accounting credit after failed transfers; it cannot redirect funds to arbitrary recipients.

## Reproduction and retained outputs

Build with `scripts/near/contract-build.ps1`. It pins Rust 1.95.0, near-sdk/standards 5.30.0, the committed Cargo lock, `--cfg near`, release LTO and symbol stripping. It generates caches/targets under ignored TEMP and can rebuild when TEMP is empty; historical cache contents are optional only. `-Check` runs focused host checks; native Windows host checks require a working C toolchain/NASM. `-Promote` copies a reviewed artifact and source/build hashes into [artifacts](../../contracts/near/artifacts/).

The contract's local `.gitattributes` preserves the reviewed Rust source bytes on checkout so its recorded source hashes remain verifiable across platforms.

The pure [contract test planner](../../scripts/near/contract-plan.ts) reads a canonical snapshot on stdin and emits an independently replayed trace. It contains no wallet, RPC, model or financial-store access and is not the production AI policy.

Compact actual evidence: [closed economics](contract-economy.json) and [callback artifact meter](contract-meter.json) and [final Wasm codec regression](contract-codec-regression.json). Full local outcomes, planner inputs, logs, local keys and sandbox data remain disposable in ignored `TEMP/near-integration/`. Permanent source/build/artifact paths do not import from those scratch files.
