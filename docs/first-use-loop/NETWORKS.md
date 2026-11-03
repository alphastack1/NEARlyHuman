# First-use network review — 3 November 2026

The network label now identifies an actual playable world rather than implying that every catalog entry is deployed. This review separated a clearer selector from the substantially larger native NEAR game port.

## Implemented connection correction

`connectV2Wallet` rejects an unsupported configuration before asking for wallet access. If the wallet is already on Robinhood Testnet, it makes no redundant switch request. After switching and checking the public contract identity, it rereads the wallet's final chain and selected account before adopting the connection. A cancelled switch stops; a false success response or an account change produces a connection error before signing or payment.

`playableNetworks(config)` enables only the currently served, wallet-supported Robinhood Testnet world. It checks chain/environment, the optional declared network ID and the optional availability list. Older public configs without the optional fields remain readable. An empty, contradictory or malformed list does not enable a network. Extra catalog IDs cannot silently enable NEAR or either mainnet.

The original write guard, exact submission journal, ambiguous-send recovery and server-verified session boundaries remain in place. A network picker must preserve the form/return context and must not switch while an unresolved wallet intent is being reviewed.

## Focused evidence

The existing controlled-wallet operator, `scripts/v2/check-wallet.ts`, passes its actual viem ABI/intent checks and seven new connection cases:

1. Already-selected network: connection succeeds with no switch request.
2. Other starting network: one switch, then final account/chain verification.
3. Unknown network: add, switch and verify.
4. User refuses the switch: no add-chain or signing request follows.
5. Wallet acknowledges a switch without changing chain: connection is rejected.
6. Selected account changes during connection: connection is rejected.
7. Unsupported world: zero wallet requests.

The network table checks also cover old configs without optional fields, conflicting network IDs, incorrect environment, missing served ID, malformed availability and fake additional catalog IDs. TypeScript and whitespace checks pass. These are keyless controlled-provider/RPC checks, not real wallet signatures or payments. No service/financial ledger, mainnet or paid inference was touched by this review.

Independent Journey source review found and referred two additional UX issues for repair: Wallet → Networks → Back had inherited a fallback that returned to home instead of wallet choices; and the new free Connect action inherited a fee footnote from the paid Hatch action. The builder corrected the return case and made the fee cue contextual. Opening the picker does not reset the validated session, create a quote or send a transaction.

The independent actual React navigation check after source freeze also passed: Hatch → Networks → Back retained the custom name/strengths; Wallet → Networks → Back returned to wallet choices; closing wallet retained the draft; and selecting a controlled provider returned to an explicit Hatch button. The provider received only `eth_requestAccounts`, `eth_chainId`, `eth_accounts` and `eth_chainId`. There was no switch, message signature, quote, transaction, browser error or application POST. Public contract/balance reads were real Robinhood Testnet reads; the provider was keyless and no NFT was minted. Compact evidence is [network-peer.json](network-peer.json). Earlier scratch runs used stale Back labels during concurrent UI edits and were corrected before this frozen-source run; they were not product failures.

## Why Meteor cannot enable native gameplay by itself

The deployed game uses EVM addresses, EIP-1193 wallets, Ethereum sign-in, an EVM controller/verifier, ABI transactions, EVM receipts and chain-bound day quotes. The server runtime accepts Robinhood Testnet or explicit isolated local test chains. Its public world and owner types are not native NEAR account identities.

The preserved [native NEAR experiment](../../experiments/economy-v2/near/src/lib.rs) is explicitly a custody feasibility probe. It demonstrates NFT/FT ownership and purse operations, but it does not contain the complete biological/economic reducer, production admission and expiry, full-game metadata, native owner authentication or hosted worker adapter. Its receipt tests also leave general failed NFT transfer-call recovery unresolved; that path is disabled by default. It must not be exposed as the production game by adding a wallet button.

The funded NEAR developer wallet is ready for that separate implementation, as recorded in [NEAR testnet preparation](../NEAR_TESTNET_PREPARATION.md). Native NEAR gameplay is not completed or enabled by this UX pass. Neither mainnet is enabled.

[NEAR's official connector documentation](https://docs.near.org/tools/near-connect) confirms Meteor support. Its [wallet login guide](https://docs.near.org/web3-apps/tutorials/wallet-login) provides the proper native transaction and NEP-413 message-signing interfaces. Those are the appropriate connection/authentication tools for a real native adapter; they do not substitute for the game contract and authority work. The [Ethereum switch-chain specification](https://eips.ethereum.org/EIPS/eip-3326) also treats network changes as an explicit wallet operation, which supports avoiding redundant requests and rechecking the connection afterward.
