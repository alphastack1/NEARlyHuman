# Wave 4: exact ownership and wallet flows

The V2 player now has a dedicated injected-wallet adapter and bounded owner portfolio. The wallet never borrows the V1 contract codec or substitutes a remembered token number for actual ownership. The public life, day and guest endpoints remain world-qualified reads of the current configured V2 deployment.

## Implemented boundaries

- `src/chain/v2-client.ts` validates the RPC chain, controller/verifier/action-module bytecode hashes, module addresses, rules hash, service roles and token address before signing or submitting. It checks the currently selected provider account and network again before each write. Native value plus a buffered gas allowance is checked before creating a submission intent; a wallet without test ETH gets a typed funding error rather than an ambiguous payment journal. Mainnet is rejected;31337 is permitted only with a loopback RPC for local evidence.
- Native hatching uses the actual current configured mint price. Paid day submission reconstructs typed admission integers, checks the authenticated player/configuration, recovers the quote signer under the exact chain/collection domain, estimates the transaction and submits its exact native value.
- Wallet intents journal account, chain, collection, destination, nonce, starting block, calldata and value before broadcast. A missing hash does not permit a second mint. Historical account nonce search locates the one mined block in logarithmic reads; an RPC without historical account state retains the bounded block-scan fallback. A different transaction at the same nonce is a replacement, never the intended result.
- Receipt waiting distinguishes a fee repricing from cancellation/replacement and checks the receipt block hash. NFT discovery filters actual collection Transfer events from the zero address to the intended owner. Token approval receipts cannot masquerade as NFT births.
- Purse withdrawals, nonce-bound purse births and wallet-token births call the controller directly. Wallet-token payment uses a separate exact250NHC approval followed by the birth; approval and hatching are distinct reviewable wallet actions. There is no blanket allowance or private key per rooster.

## Bounded ownership and public reads

The controller keeps owner arrays plus token indexes inside its ERC-721 update hook. Mint, middle removal, return transfer and self-transfer preserve those lists. `ownedTokens(holder,cursor,limit)` permits at most24 returned IDs; the HTTP portfolio returns eight current lives at a time. No endpoint scans every NFT ever created, and another device can discover a wallet's actual NFTs.

The controller runtime is21489bytes after this addition; action module23096, verifier23685 and coin2045. The biological rules hash is unchanged. Updated controller/coin artifacts include the new source metadata; deployment must use these final artifacts rather than an earlier controller hash.

New public reads include paged owner lives, twelve saved-day summaries at a time, canonical pending-request status/deadline, and a configured real guest replay. A guest requires `NEARLYHUMAN_V2_GUEST_ID` and optional `NEARLYHUMAN_V2_GUEST_DAY`; a missing guest never silently serves a diagnostic packet as an NFT day. Public configuration includes pinned world/module/role data for wallet verification.

Life DTOs carry the observed block hash. Portfolio, configuration, saved-day and history reads recheck their pinned block after the dependent reads. A historical film remains that day's biological state while the attached public purse/ownership can be current. The rich replay is checked against saved state, trace, certificate, commitment and reward.

An authenticated owner can recover an accepted day immediately after closing the tab before its acknowledgement: job reads project the actual request, and Wake locates its canonical acceptance receipt and constructs the funded worker. An expired orphan uses the real expiry transaction before retry is released. A settled request without its job can be projected from its canonical saved-day commitment rather than being shown as an endless queue.

## Actual local evidence

[The wallet/controller proof](wallet-local.json) passes28 scoped checks. It deployed the final controller and used an injected EIP-1193 wallet through the real adapter and authenticated HTTP handlers. It verified native minting, exact NFT receipt discovery, nonce recovery, enumeration, transfer, owner login, quote idempotency, paid admission, missing-provider failure, immediate lost-acknowledgement recovery, quarantine and expiry.

To exercise both real token-funded birth routes without a fixture issuer, the same isolated life advanced100 actual accepted reducer days with scripted legal choices. It earned521.964786NHC from real growth, harvest and crafts. A withdrawal while pending preserved the biological bytes/revision; a stale purse nonce was rejected. One child burned250 from the purse; a separately approved wallet payment burned another250. Both produced real new owned NFTs. Lifetime issuance did not fall with either burn.

The source was then deliberately neglected and died onDay103. Its NFT and remaining purse survived, and an actual owner wallet withdrawal after death succeeded. [The captured dead-life state](dead-life-local.json) is from that local controller immediately before withdrawal, not a fabricated terminal boolean or a public NFT. Final supply plus the500NHC birth burns equaled cumulative issuance; the vault exactly backed the remaining allocations. These are testnet-candidate authority checks, not paid Jev behavior evidence.

The temporary harness preserved focused transaction/deployment identifiers, assertions and aggregate economic results; it did not serialize every earning-day receipt. It was stopped after the proof, and its ephemeral key never left process memory. No public chain, owner funds or inference credit was used.

[A separate short nonce proof](nonce-recovery-local.json) mined4096 empty local blocks after a native mint. The historical-nonce lookup recovered that exact old hash and rejected a changed intent at the same nonce; the paired checks completed in13ms locally. This is evidence that the recovery does not require thousands of manual block-page checks, not a public-RPC latency promise. It did not repeat the100-day economy run.

A final [focused empty-wallet check](funds-local.json) used only isolated Anvil account9, temporarily gave that mock account zero balance, and restored it afterward. Native mint returned the typed funding error and created zero submission intents. No public balance, financial service ledger or AI credit was touched.

## Browser integration host

A separate temporary full HTTP/Vite host on loopback5186 was created for the actual browser callback checks. It uses fresh Anvil contracts, an actual locally saved guest day with scripted choices, and an unlocked ephemeral account. It never calls `loadLocalSecrets`, so missing-provider failure tests cannot accidentally decrypt the workstation Jev key. Its sanitized connection details remain under ignored TEMP. The PM/journey review owns the resulting real browser evidence and closure of this short-lived host. No source or production build depends on it.

The remaining release evidence is final-policy real Jev on the final public testnet deployment, the hosted owner flow and the actual final guest NFT. Local signed transactions, scripted choices and screenshots must not be described as that public end-to-end proof.
