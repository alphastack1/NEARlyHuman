# Native NEAR transfer burn

This is the deployed **same-account testnet upgrade** of the native NEAR contract. It adds a fixed **0.5% (50 bps) NHC transfer burn**, enabled by default, with an owner toggle. It preserves the existing collection, NFT IDs, lives, purses, game rules and financial history. The [upgrade record](deployments/testnet.json) includes the confirmed transaction and exact preserved-storage proof. Original source and Wasm remain recorded separately in `contracts/near`.

## Behavior

- Ordinary `ft_transfer` debits the gross amount, burns `floor(gross / 200)` smallest units and credits the receiver with the rest. The owner and relay receive no exemption. Standard NEAR positive-amount and different-sender/receiver rules remain in force.
- NFT purse withdrawals debit the gross allocation and transfer the net amount to the current owner. The vault must continue to back all remaining purse allocations and outstanding transfer-call fee reservations.
- Productive game issuance has no transfer fee. Both existing **250 NHC birth burns** remain direct burns, without a second transfer fee. No private key is created for an NFT.
- The toggle affects future transfers. A pending transfer-call retains its captured fee calculation.
- Dust transfers below 200 smallest units have a zero fee. NHC has six decimals.

## NEP-141 transfer-call refunds

For gross `G`, reserve `F = floor(G / 200)` in the vault and transfer `N = G - F` to the receiver. The receiver callback sees the net amount. The standard resolver clamps malformed or excessive unused replies and handles changes to the receiver balance. After the receiver result, let `U` be net units actually used, excluding any refund burned because the original sender unregistered. The final transfer fee is `min(F, floor(U / 199))`; unused reserved fees return to the original registered sender. This calculation avoids multiplication overflow and gives an exact 50 bps floor on the resulting consumed gross amount.

Failed hooks, malformed returns and full unused returns **refund the full gross amount without a transfer burn** while the sender remains registered. If the sender has unregistered, the standard non-returnable refund is burned and recorded separately from transfer burns. Private callbacks consume a unique context once; duplicate calls cannot burn or refund twice. Fee reservations cannot consume NFT purse backing. Outstanding fee contexts are limited to 32 and require native storage headroom **after protecting accepted game days' native settlement reserve**, plus a 0.02 NEAR operating margin. This is checked before any token movement and again against newly allocated context rent. Transfer-call requires at least 50 Tgas; its resolver reserves 25 Tgas.

## Compatible storage

The `Contract`, `Life`, `Request`, `Record` and completed `Operation` Borsh layouts are unchanged. New fee state uses isolated raw keys beginning with `0xff + "nh/burn/v1/"`, outside existing collection prefixes. The original root is deserialized directly; no initialization, migration, token minting, campaign cloning or ledger reset is required. A missing toggle key means enabled. The unchanged kernel is imported from the permanent `../near/src/kernel.rs`, and its hash is included in the build record.

The sandbox proof deployed the actual old Wasm, created a life, settled productive days, completed a withdrawal, upgraded the **same account**, and verified equality of **every existing raw storage row** before continuing gameplay. Replaying the completed pre-upgrade withdrawal left balances and operation history unchanged.

## Added API

| Method | Result / argument |
| --- | --- |
| `transfer_burn_enabled()` | Boolean, defaults to `true` |
| `total_transfer_burned()` | Decimal string (`U128`) |
| `transfer_burn_config()` | `{ enabled, bps: 50, total_burned, reserved, pending }`; amounts are decimal strings |
| `preview_transfer({ amount })` | `{ gross, received, burned, enabled, bps: 50 }`; amounts are decimal strings |
| `set_transfer_burn_enabled({ enabled })` | Existing contract owner only |

`config()` keeps every existing field and adds `transfer_burn_enabled`, `transfer_burn_bps`, `total_transfer_burned`, `transfer_call_reserved` and `transfer_call_pending`. The private `resolve_transfer_burn({ call_id })` is exclusively a self callback.

## Build and evidence

Run `scripts/near/transfer-burn-build.ps1 -Check -Promote` using Rust 1.95.0 with its Rust sources and the Wasm target. Cargo caches and intermediate build outputs default to ignored `TEMP/near-v3`. The promoted artifact and source hashes live in `artifacts/build.json`; no permanent source depends on `TEMP`.

The receiver in `test-receiver` is an adversarial **local test fixture**, never part of production Wasm. Build it with the same Wasm toolchain and pass its path through `NEAR_BURN_RECEIVER_WASM`. Start an ephemeral local `near-sandbox` chain whose validator is named `testnet`, expose its RPC on loopback port 3039 and set `NEAR_BURN_SANDBOX_HOME` to its home. Run `node scripts/near/check-transfer-burn-sandbox.mjs`. The runner refuses a public chain and uses only its temporary local validator, without importing developer-wallet loaders or backend ledgers.

Permanent evidence is in `docs/token/v3/near-unit-proof.json`, `near-sandbox-proof.json` and `near-public-balances.json`. The sandbox proof covers actual Wasm receipts; the 19 unit checks additionally exercise receiver balance changes, sender/receiver unregistration, maximum-u128 rounding, callback identity, reservation bounds, captured toggles and protection of accepted days' native settlement reserve.

## Release boundary

This source/artifact alone does not claim a live upgrade. `scripts/near-v3/upgrade-testnet.ts` defaults to public read-only preflight. It verifies artifact/source/proof hashes and the existing testnet account, owner, contract key and runtime pins. Explicit `--broadcast --gate=native-transfer-burn-v3 --unlock-testnet-dpapi --expect-sha=<reviewed SHA-256>` enables only the exact code-only upgrade. Its fixed operation ID reuses the original exact signed transaction on retry, and its durable baseline journal lives outside the repository in the existing user's `.codex/data/nearlyhuman/near-upgrades` area. A candidate already onchain is verified against that preserved baseline and the original confirmed transaction, without signing another upgrade.

The parent operator must first pause new day admissions and drain pending accepted days. The tool records all-state SHA-256 and financial/configuration facts before signing, verifies the unchanged raw state and old configuration after final confirmation, and writes only the new `contracts/near-v3/deployments/testnet.json`. It does not initialize, migrate, resume admissions or change runtime/AI campaign settings. Refresh the exact server runtime pin before resuming admissions. Preserve the earlier deployment record and the same funded AI campaign. Mainnet is outside this testnet work.
