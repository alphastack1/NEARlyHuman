# Contracts and ownership

NEARlyHuman runs in two testnet worlds. Always identify a life by its world, collection and NFT number. The same number on another collection is a different asset.

| World | Life collection | NHC |
| --- | --- | --- |
| NEAR Testnet | [`game.nearlyhuman-dev-20261102-26c8bd.testnet`](https://testnet.nearblocks.io/address/game.nearlyhuman-dev-20261102-26c8bd.testnet) | NEP-141 interface on the same account. |
| Robinhood Testnet, chain `46630` | [`0x3e3c6d8d6ddcfaad61c21b4278e977c90ddde3f7`](https://explorer.testnet.chain.robinhood.com/address/0x3e3c6d8d6ddcfaad61c21b4278e977c90ddde3f7) | [`0x5D559CB58f899BA000E9f5Df200B1b52173DB26F`](https://explorer.testnet.chain.robinhood.com/address/0x5D559CB58f899BA000E9f5Df200B1b52173DB26F) |

The [deployment records](../contracts/deployments/) preserve exact public runtime identities and build references. Availability and admission settings can change; the app checks the configured world before preparing a new day.

## Owner rights

An NFT carries its saved life, home, garden, inventory, intentions and remaining purse rights. Only its current owner can authorize a new day or withdraw NHC. A pending day locks NFT transfers until resolved. Death prevents new days but keeps the NFT, saved history and already credited purse.

Robinhood uses ERC-721 and ERC-20 interfaces. Native NEAR combines NEP-171 NFTs and NEP-141 tokens in one authority. Native NEAR supports direct NFT transfers, approvals and enumeration; its asynchronous `nft_transfer_call` path is disabled.

NHC uses six decimals. A token-funded birth burns 250 NHC. Current tokens have a switchable 0.5% ordinary-transfer burn; see [Economy](ECONOMY.md) for issuance, purse backing and withdrawals.

## What the contracts check

The service submits bounded legal actions. The contracts derive inventory changes, garden growth, crafted goods, survival and shipment rewards. They do not accept arbitrary model-proposed balances.

Jev inference and relaying remain trusted offchain work. Administrative roles can pause admissions and manage supported settings within contract rules. The app, model service and relay remain operational dependencies. Published source is available for inspection and is not a third-party security audit.

## Source

- [EVM contracts](../contracts/evm/), [native NEAR authority](../contracts/near/) and [NHC token](../contracts/token/).
- [Current contract-source archive](https://nearlyhuman.netlify.app/source/nearlyhuman-contracts.zip).
- [Immutable release sources](../contracts/releases/), retaining original compiler inputs and protocol identifiers for reproducibility.
- [Public contract links in the app](https://nearlyhuman.netlify.app/docs/contracts).

Existing exact-NFT links and published metadata/source URLs remain valid for earlier collections. Compatibility routes preserve those identities; they do not merge the collections or change ownership rights.
