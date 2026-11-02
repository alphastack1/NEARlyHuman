# V2 feasibility probes

These are reviewed, isolated research sources, not the production game. [The report](../../docs/v2-feasibility/REVIEW.md) distinguishes actual biology, local EVM transactions, native host tests and native receipts. No application or normal build imports these files. Generated outputs, caches, binaries, local node data and ephemeral signing keys belong in ignored TEMP.

## Biology

From the repository root, with existing project dependencies:

```powershell
node --import tsx experiments/economy-v2/biology/probe.ts
node --import tsx experiments/economy-v2/biology/replay-admission.ts
```

Outputs are created at `TEMP/economy-v2-feasibility/biology/`. The independent replay uses adjacent permanent `admission-fixture.json`, not an old scratch result. The main probe imports the actual V1 domain helpers; `source-hashes.json` records the measured version. A meaningful domain change requires reviewing/regenerating this evidence. The adapter deliberately does not unify legacy wood-consuming furniture/heat with the new earned-wood ledger.

## EVM

`evm/EconomySlice.sol` uses installed solc0.8.38/OpenZeppelin5.6.1 and a separate local Anvil1.7.1. The driver additionally needs ethers6.17.0. Do not modify the game's package manifest for this research.

Set `NH_ANVIL_BIN` to an explicit Anvil executable, or put Anvil on PATH. If ethers is not available by ordinary module resolution, set `NH_EVM_TOOL_PACKAGE` to an external tooling package's `package.json`; `createRequire` resolves ethers there. That tooling may be installed afresh under TEMP. No old TEMP path is hardcoded as an input. Then:

```powershell
node experiments/economy-v2/evm/run.cjs
```

The driver launches and owns an ephemeral loopback node, verifies fresh chain31337/block0, sends only to its discovered endpoint and stops that child. Outputs default to `TEMP/economy-v2-feasibility/evm/`; optional `NH_EVM_OUT` selects another scratch output directory. The free founder and terminal fixture are explicit experiment-only shortcuts. Never deploy this as the complete game.

## Native NEAR

`near/` pins Rust SDK/standards5.30.0 through Cargo manifests/locks. The observed compiler was existing Rust1.95.0. Set Cargo cache/target directories to a scratch location before building. Native host tests require the platform's normal linker and NASM for the resolved crypto dependency; the measured Windows run used a portable official NASM under TEMP.

```powershell
$env:CARGO_HOME = Join-Path $PWD 'TEMP/economy-v2-feasibility/near/cargo-home'
$env:CARGO_TARGET_DIR = Join-Path $PWD 'TEMP/economy-v2-feasibility/near/target'
cargo +1.95.0 test --locked --manifest-path experiments/economy-v2/near/Cargo.toml --lib
```

The research Wasm build used existing rust-src with process-local `RUSTC_BOOTSTRAP=1`, `RUSTFLAGS=--cfg near`, and `cargo +1.95.0 build -Z build-std=std,panic_abort --target wasm32-unknown-unknown --release`. The `--cfg near` flag is substantive for SDK5.30 host behavior. This is recorded reproduction guidance, not the selected production build process.

Build three artifacts: default contract, contract with `--features receipt-probe`, and `near/receiver/Cargo.toml`. Place them in the chosen generated work directory as `default-probe.wasm`, `receipt-probe.wasm` and `receiver-probe.wasm`. The default artifact has transfer-call off and no fixture issuer/enable export; the receipt feature is capped/operator-controlled and local-only.

The receipt driver requires an **independently created and running local near-sandbox2.14.0-rc.4**, not public testnet. Put its ephemeral home at `<work>/sandbox-home`. `NH_NEAR_WORK_DIR` selects the generated working directory; its default is `TEMP/economy-v2-feasibility/near/`. `NH_NEAR_RPC` defaults to `http://127.0.0.1:3036` and permits only literal loopback HTTP. The driver verifies a local `test-chain-*` matching that home's genesis, and signs only with that home's `test.near` validator key. It never reads the developer wallet.

Inside the local Linux environment, with Python3 and cryptography available:

```text
python3 receipts.py
python3 storage_receipt.py
python3 inspect_receipts.py
```

Use the permanent script paths or invoke from this source directory; all generated files/keys/Wasm are in the configured work directory. `receipts.py` creates only fresh children in that local chain; the storage follow-up uses those recorded local outcomes. Start/stop only the node you own. Do not point these fixture scripts at a public network. The driver was preserved from the executed campaign with working-directory/local-home guards; original captured driver hashes and the preserved-source manifest distinguish that path-only hardening.

The unresolved resolver-failure fixture intentionally remains locked. No script or timer guesses an owner to recover it. Actual receipt records prove this boundary, not a recovery mechanism.
