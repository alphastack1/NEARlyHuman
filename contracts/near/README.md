# Native NEAR authority

This contract implements the NFT life, inventory, garden, history and NHC purse on native NEAR. Its NFT and fungible-token interfaces share one authority account. Only accepted legal traces can change a life or credit a shipment reward.

Current source is in `src/`; the verified production Wasm and source fingerprints are in `artifacts/`. Public account and code-hash records are in `../deployments/near-testnet.json`.

## Build

Use Rust1.95.0 with `rust-src` and the `wasm32-unknown-unknown` target, plus the pinned Cargo lockfile. From the repository root on Windows:

```powershell
powershell -File scripts/contracts/build-near.ps1 -Check
```

The script runs unit tests, builds into ignored temporary output, and requires the result to match the recorded deployed Wasm. It never deploys, initializes an account or reads a wallet key. `-Promote` copies a matching verified artifact into its maintained location.

The source package and module identifiers are preserved as compiler inputs for the deployed release. They are not application-version selectors. The maintained app uses one current life protocol.

## Interfaces and accounting

- NEP-171 ownership, direct transfer, approvals and enumeration.
- NEP-141 NHC balances, storage registration and transfer callbacks.
- NFT-bound purse allocations backed by NHC units held by the contract.
- Owner-authorized days, canonical game transitions and saved replay commitments.
- Withdrawals remain available for a remembered life.
- Fixed0.5% transfer burn with an owner on/off switch; gross/net accounting and asynchronous refunds preserve backing.

NFT transfer-call settlement is disabled. Inference and relaying are trusted offchain services; the contract checks and derives the resulting state. Read the public [contract guide](../../docs/CONTRACTS.md) and [economy](../../docs/ECONOMY.md) for the current behavior and limits.
