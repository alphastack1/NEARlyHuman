# NEAR developer account — 2 November 2026

The owner requested a NEAR testnet developer wallet while considering native NEAR support alongside Robinhood Chain. This preparation does not deploy a game contract or claim that the current EVM implementation already runs natively on NEAR.

- Account: `nearlyhuman-dev-20261102-26c8bd.testnet`
- Network: NEAR testnet
- Verified balance: **10 test NEAR**
- Public key: `ed25519:E35ptAqr7e97GX1PERwd2BhztQhnkM92u6y4BCWeyiAX`
- Creation transaction: [6TJfotfnXQuVKLEwTKnBgZt22ifJEPvSBwuQhRCqMhD6](https://explorer.testnet.near.org/transactions/6TJfotfnXQuVKLEwTKnBgZt22ifJEPvSBwuQhRCqMhD6)
- Purpose: developer testing; this is not a mainnet or prize-payout account.

The official NEAR CLI v0.30.1 portable Windows binary was downloaded from its official release and matched its published SHA256: `f5927854d916a6464e0092b379a6e96d54e40bee91e0dbc483786a6f680b4cbc`. The official faucet-sponsored creation flow generated a new Ed25519 key and reported successful storage in the Windows user keychain. It did not print private recovery material. No private key is stored in the repository or deletable scratch directory.

Independent finality-based RPC reads verified the account balance and that the expected public key has full developer access. The verification snapshot is [near-testnet-developer.json](near-testnet-developer.json). This full-access developer key is not intended for Jev or an automated game agent; any future settlement service needs separate, deliberately scoped authorization.

The downloaded CLI is temporary tooling. Its removal does not delete the keychain entry or account. A later official CLI installation can use the same keychain. Public operational metadata is also retained outside the checkout under the local user's NEARlyHuman credential directory, alongside the existing encrypted development credentials.

Native NEAR work still needs its own contract and chain adapter: accounts/authentication, transactions/finality, NFT/token interfaces, storage costs and settlement callbacks differ from the existing Robinhood/EVM implementation. The current Robinhood deployment and live game were left unchanged during this preparation. No mainnet account, game contract or cross-chain bridge was created.

Sources: [official account-creation documentation](https://docs.near.org/getting-started/create-account), [NEAR CLI](https://docs.near.org/tools/near-cli), and [v0.30.1 release](https://github.com/near/near-cli-rs/releases/tag/v0.30.1).
