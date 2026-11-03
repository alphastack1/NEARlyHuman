# Wallet, network and paid-day reliability

Reviewed 2026-11-03. Scope: the owner's actual NFT 4 playtest, wallet prompts, the inference/chain bridge, network identity and public contract decoding. No original rooster artwork, game rules, Jev prompts, economic limits or deployed contract logic changed.

## Actual first-day failure

Read-only hosted storage contained 44 V2 jobs: 43 ready and one failed. The failed job belongs to NFT 4, owner `0xC4cFeb23E3533BE399B8E1026f67816c18243Dee`. All four relevant transactions have successful, canonical receipts:

| Operation | Time UTC | Receipt |
| --- | --- | --- |
| First paid Day 1 admission | 06:22:40 | [Owner transaction](https://explorer.testnet.chain.robinhood.com/tx/0xa0db5c98994023495bb4e3b15dce54648467436d55f90ec70d221a48c5131fcc) |
| First attempt recorded failed | 06:22:56 | [Failure record](https://explorer.testnet.chain.robinhood.com/tx/0xe797ea85999abc23a4e666c139a2d1619d062eec82db56249383288578786f7d) |
| Retried Day 1 admission | 06:26:54 | [Owner transaction](https://explorer.testnet.chain.robinhood.com/tx/0xf2c42445b4aea13d4f1aefe0ac6034cef0a9ebdcc7cec510590b23ba03ac510f) |
| Retried Day 1 saved | 06:27:10 | [Saved result](https://explorer.testnet.chain.robinhood.com/tx/0xcd5e52ffe1edd37d07b0acf15c3756d55ca53ced225798e61ad11e58da7f317b) |

First request: `0x0f7d718b16786faeb0ec1e571bf552b06d0b78c41c2806b41b5bb94e113c5ed2`.
Retry: `0x6cefa5c5dc05010994d46375afc49115cdae35ec1a0683c37413201e56edb64d`.

The first admission succeeded. Jev completed Dawn and two routine answers, costing 350 micro-USD in total. The fourth input, `routine:41`, was recorded with hash `320f514164046a808f2dd1897b6537685233be40192dacddb8f1bb282ad42f49`, but the durable paid-call ledger contains **no fourth send**. It also contains no uncertain provider calls for this attempt. The game then recorded the failure onchain, which permitted the owner's retry.

The retry completed five answers for 580 micro-USD, finalized successfully and produced commitment `0xeb1ca4b0759012a48f276dde3b6019357d099a657c9c547b02f32f9e38e4af4e`. A later public read confirmed NFT 4 alive at day 1/revision 1 with no pending request.

The original worker replaced the exception with `preparation_interrupted`. Its exact exception class and message were not retained. We can establish the failure boundary, but cannot honestly recover the exact underlying error.

An offline replay used the failed job's frozen input and its three actual cached answers. It reached the same fourth input hash. All questions and candidate keys validated; request sizes were 7,076 / 6,644 / 5,908 / 6,009 bytes, below the 14,000-byte limit. The replay stopped before any uncached provider call. This rules out a deterministic fourth-request size/key error for that input.

The canonical chain recheck before each new model send is one possible failure point in this boundary. A concrete reliability gap existed there: viem can wrap a transient transport failure inside a contract-call error, while the worker only inspected the outer error name. Such a read interruption could become a terminal failed day. This gap is fixed; it remains an inference, not a proven reconstruction of the old masked exception.

## Implemented bridge fixes

- Inspect bounded cause chains for recognized transient read failures, including HTTP transport/timeout and the observed pinned-block state lag. Decoded contract reverts, ordinary RPC errors and HTTP 400 responses do not become transport retries.
- A transient pre-send read returns the existing job to `queued`. The same admitted request, frozen input, lease fencing and completed-answer cache remain authoritative. No additional owner payment is required to resume that request.
- Provider send uncertainty remains terminal/conservative. It does not become permission to resend or reset a budget entry. Existing quote reservations, inference accounting, paid-call fences and relay journals remain intact.
- Persist a safe failure code, stage and private bounded exception-class chain. Raw RPC bodies, credentials, signatures, stack traces and provider text are excluded. The public job view exposes only a code and fixed concise explanation.
- Clear stale transient diagnostics after successful preparation, and mark an expired queued request as expired.

The failure-display fields are optional additions to `V2OwnerJob`: `failureCode` and `failureMessage`. Older jobs remain readable. A historical generic failure says that the day could not be prepared and the saved home is unchanged; it does not invent a provider outage.

## Sign-in and the onchain payment

The readable message establishes an authenticated owner session for protected preparation endpoints. It spends no funds. The subsequent `acceptDay` transaction pays the processing fee and creates the canonical onchain request. They have different authority and cannot be merged merely by changing the button label.

Valid sign-in sessions last 12 hours. Previously, the client remembered authentication only in memory, so reloading could require the same readable signature again. The new cache uses `sessionStorage`, scoped to account + chain + collection, with an equally scoped in-memory cache for browsers that block storage. Before reuse, `/api/v2/session` verifies the existing HMAC and expiry on the server and returns the current collection. The browser accepts it only when account, chain, collection and expiry all match. A reset while verification is in flight prevents stale adoption. Invalid/expired credentials are discarded; transient verification outages do not silently request another signature. Independent restart review found and fixed a storage-unavailable Verify → Start loop: a successful signature can now continue during that visit without requiring browser persistence.

The Journey owner integrates this helper into the explicit wallet-verification step. Review remains free of quote/admission holds. Only the player's final Start action obtains the real quote and begins the existing protected payment sequence.

## Networks and balances

`src/chain/networks.ts` separates network identity from deployment availability. Its catalog knows Robinhood Testnet, Robinhood Mainnet, NEAR Testnet and NEAR Mainnet, including wallet family and native units. The API publishes only its actual served network in `availableNetworks`; the current hosted deployment serves Robinhood Testnet. The wallet rejects a catalog identity that conflicts with the selected chain. Mainnet and NEAR descriptors do not enable unsupported deployments.

The UI can show the exact connected account, `Robinhood Testnet`, and its native ETH balance using the existing reader and compact formatter. Gas ETH and the NFT's NHC purse remain separate amounts. Future NEAR support still needs its actual wallet, contract and service adapter; no EVM chain number is substituted for NEAR's network identity.

[Official Robinhood network configuration](https://docs.robinhood.com/chain/connecting/) confirms the chain IDs, ETH gas currency, RPC endpoints and explorers. The official [App.Axie wallet integration guide](https://support.axieinfinity.com/hc/en-us/articles/32585037724315-App-Axie-Ronin-Waypoint-Integration) provides a useful game reference for keeping wallet choice in the account menu and surfacing transaction prompts at the action that needs them.

## ABI-aware writes and public verification

The wallet now calls viem's ABI-aware `writeContract` for game methods and the exact NHC approval. Existing safeguards run first: verified world, preflight estimate, native balance check, nonce capture and durable submission intent. Arguments are frozen before the guard. The bytes/value/nonce shown to the wallet still match the recovery journal exactly. A deep wallet rejection is normalized; an ambiguous send retains its intent for recovery.

Viem's [official implementation](https://github.com/wevm/viem/blob/main/src/actions/wallet/writeContract.ts) encodes ABI data and delegates to a transaction send. It does **not** transmit an arbitrary ABI to the wallet or guarantee how a wallet renders a custom method. A clear in-game review and a verified public ABI are practical improvements; some wallet products may still show raw custom transaction details.

All four deployed contracts were initially unverified or unindexed on Blockscout. They are now **Pass - Verified**, with source and ABI publicly available:

| Contract | Public source |
| --- | --- |
| NEARlyHumanV2 | [Controller](https://explorer.testnet.chain.robinhood.com/address/0x30cb5213fa94020a95893ddb6b07470dbf7a9efc?tab=contract) |
| V2LifeVerifier | [Verifier](https://explorer.testnet.chain.robinhood.com/address/0x7620cde82d323074b102cfb8cf1c2fdd9999ee34?tab=contract) |
| V2ActionModule | [Action module](https://explorer.testnet.chain.robinhood.com/address/0xc22067bb7845342a2e2b135c4fb03f47547f2091?tab=contract) |
| NEARlyHumanCoin | [NHC](https://explorer.testnet.chain.robinhood.com/address/0x4DC12133f8B71E9FD7e3571d6FAda84a5DdBE5a2?tab=contract) |

Exact Solidity `0.8.38+commit.1835d247`, optimizer runs 1, viaIR and Cancun reproduced the committed artifacts. The controller, verifier and module creation bytecodes matched their canonical creation transaction inputs. The nested NHC token's 2,045-byte runtime matched its artifact after the exact known controller immutable substitution. Standard-input SHA-256: `b146f7d60d987e175eb2af91243027de737ea59f67338bb23c367169fb371fc3`.

After verification, Blockscout's actual transaction API decodes the owner's first payment as `acceptDay((bytes32,address,uint256,uint32,uint64,bool,uint256,uint16,uint64,bytes32) a, bytes signature)` and names its verified `NEARlyHumanV2` destination.

This published public source metadata only: no contract redeployment, wallet signature, gas spend or financial-store write. The [official Robinhood guide](https://docs.robinhood.com/chain/deploy-smart-contracts/) identifies the testnet verification endpoint; [Blockscout's official verification API](https://docs.blockscout.com/devs/verification/blockscout-smart-contract-verification-api) documents standard JSON source submissions and status checks.

Permanent evidence: `contracts/v2/deployments/robinhood-testnet.verification.json`. Reusable operator: `node node_modules/tsx/dist/cli.mjs scripts/v2/verify-testnet-source.ts` performs a dry-run. `--submit` publishes only after artifact and chain-bytecode checks. Generated inputs/reports stay in ignored TEMP; the operator reads permanent source/artifacts directly.

## Focused checks and experiment decisions

| Question | Evidence | Change/result | Decision |
| --- | --- | --- | --- |
| Did the first wallet payment fail? | Four canonical successful receipts; hosted failed job then ready retry | Located failure after three AI answers and before a fourth send | Keep the onchain failed-attempt model; make the true preparation outcome explicit |
| Was the fourth Jev request invalid? | Actual cached replay reached the matching input hash with valid 6,009-byte body | No deterministic request error reproduced | Do not change AI policy to explain an unknown exception |
| Can a wrapped pre-send read failure resume safely? | Six worker checks, including completed-answer cache and admission retention | Timeout queues; cached send count and charged amount remain unchanged | Resume only safe existing requests; keep uncertain sends conservative |
| Can a reload reuse sign-in securely? | Ten checks against actual HMAC/chain/expiry validation, including blocked browser storage | Valid cache reused; forged/expired/wrong-world/stale results rejected; outage preserved; Verify → Start works within a storage-blocked visit | Reduce repeat signatures without weakening authentication |
| Does ABI writing preserve recovery? | Controlled actual viem wallet/RPC path; mint, expire, approve, rejection and ambiguous send | Exact data/value/nonce equal the intent; ambiguous intent retained | Use ABI-aware calls with the existing safety envelope |
| Is public method decoding real? | Four official Pass - Verified results; actual historical acceptDay decoded | Source/ABI now visible, including formerly unindexed NHC | Keep explorer links; do not promise arbitrary wallet display behavior |

Checks: `npm run check`; `scripts/v2/check-worker.ts`; `scripts/v2/check-session.ts`; `scripts/v2/check-wallet.ts`; exact compiler/source-verification dry-run. No live AI credits, owner wallet writes or ledger changes were needed for these checks. Temporary audit/replay fixtures and logs remain under `TEMP/player-feedback/wallet/` and can be deleted after review.

## Restart peer review and capacity

The 2026-11-03 09:20 UTC read-only Cloud snapshot still showed 43 ready jobs, one historical failed job, all 44 quotes retired, zero active gas holds and no uncertain inference sends. The current testnet campaign had spent 31,708 of 90,000 micro-USD, leaving 58,292 micro-USD with no active job allowance. It could reserve one 40,000-micro-USD day at that moment. This is a time-specific capacity check, not permission to reset, clone or replenish any ledger.

The confirmed mint's browser journal remains until the exact minted NFT loads successfully; a read interruption retains both its confirmed transaction and birth screen. Packing and Verify create no funded quote. Only the explicit Start action obtains the quote, so reviewing or editing supplies does not reserve scarce inference capacity.

The EVM token URI, its dynamic image and public life link all include the chain ID and collection. The four-network catalog is descriptive only: native NEAR integration still requires an actual NEAR wallet adapter, account-based contract/runtime identity, NEAR transaction admission/recovery and chain-specific metadata routing. Its credentials and RPC are not interchangeable with the Robinhood EVM wallet. These unsupported deployments remain unavailable in the current game.
