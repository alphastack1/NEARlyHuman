# EVM contracts

`Game.sol` is the deployed NFT life and backed-purse controller. `rules/` contains the stateless life verifier, action module and shared types used by it. The NHC transfer-burn implementation is in `../token/`.

The maintained source tree is unversioned. Contract identifiers and compiler source-unit names inside the deployed source are preserved: changing them would change Solidity metadata and prevent exact reproduction of the live bytecode. `../release-files.json` maps those compiler units to the files here.

```sh
npm ci
npm run check:contracts
```

The check uses Solidity0.8.38, OpenZeppelin5.6.1, Cancun, viaIR and optimizer runs1, then compares creation and runtime bytecode against the checked-in deployment artifacts. It does not deploy or sign anything.

Current and original collection identities are in `../deployments/`. Frozen published source bundles in `../releases/` allow historical NFT source links to remain inspectable without retaining another application runtime.
