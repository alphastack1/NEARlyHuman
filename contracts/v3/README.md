# Robinhood transfer-burn deployment generation

This is deployment generation3 of the Robinhood testnet controller. The life protocol, saved-state encoding, verifier rules, V2 ABI and EIP-712 admission domain remain version2. The versioned directory preserves the exact source/artifacts behind the existing V2 NFTs; it does not overwrite or migrate them.

## What changes

- The new controller constructs `NHCTransferBurn(true)`: fixed50bps /0.5% address-to-address transfer burn enabled initially.
- The protocol owner calls `setNHCTransferBurnEnabled(bool)`; only the controller can forward the token switch. NFT ownership does not grant this protocol-wide setting.
- `nhcTransferBurn()` returns `(bool enabled, uint16 bps, uint256 burned)` for configuration/UI reads. The bps field is the fixed50 even while disabled; callers use the enabled flag.
- `previewPurseWithdrawal(id,gross)` returns the current net/burn after checking the existing purse amount. Gross withdrawal accounting and the maximum fixed fee must be shown by the client; an owner toggle may change before a transaction mines.
- Wallet-funded births call `burnWalletForBirth(wallet,250_000_000)` directly, consuming gross allowance and burning the exact existing birth price without a taxed vault deposit.
- Purse-funded births remain direct250-NHC vault burns. Reward minting remains a supply operation. Transfer burns do not reduce cumulative issuance pressure or raise future reward quotes.

All other biological/material rules, admissions, mint price mechanism, transfer locks, history commitments, purse ownership and treasury-fee accounting are retained from the current controller. No broad wallet, pool or vault exemption was introduced. Ordinary vault withdrawals are taxed when enabled and debit gross, preserving backing for the remaining allocated purses.

The current interpreter is stateless apart from its immutable action-module reference. A new controller can reuse the verified existing `V2LifeVerifier` and `V2ActionModule` after code/rules/role checks, avoiding two unnecessary testnet deployments. The new token's controller is the new game address, independently of the old game.

## Reproduction

```sh
node scripts/v3/compile.cjs --artifacts
node --import tsx scripts/v3/check-integrated-burn.mjs
node --import tsx scripts/v3/deploy-testnet.ts
```

Use Node24 and the existing pinned dependencies. The local integration test requires Anvil on PATH or `ANVIL_BIN`; Windows also checks the ordinary `.foundry/bin/anvil.exe` location. All scratch chains and compiled intermediates stay in ignored TEMP. The production build does not depend on them.

Compiler: Solidity0.8.38, viaIR, optimizer runs1, Cancun. New controller runtime22,239 bytes, below the24,576-byte limit. Artifacts include exact ABI, bytecode, compiler settings and SHA256 hashes of every resolved compiler source, including V2 interfaces/types and OpenZeppelin dependencies. Deployment preflight rechecks those exact input texts, resolving package imports under `node_modules`. The test harness exposes synthetic purse setup and is **not a release artifact** or a public reward path.

## Verification

Nine grouped local execution cases passed against the original real verifier/action-module bytecode deployed to an ephemeral Anvil chain:

1. Default-enabled50bps controller/token identity and compatible game interfaces.
2. Owner forwarding and rejection of token/game outsiders.
3. Actual verifier initialization of a minted life, without free productive goods or NHC supply.
4. V2 typed admission, pending transfer lock and canonical actual-verifier day finalization/history commitment.
5. Settled NFT transfer retaining life data and removing former-owner withdrawal authority.
6. Gross taxed withdrawal, net keeper delivery, real supply burn and backing of another NFT purse.
7. Direct allowance-backed250-NHC wallet birth without consuming vault backing.
8. Direct purse birth, no double fee, and exact toggle-off withdrawal.
9. Protocol ownership handoff moving toggle authority independently of NFT ownership.

The purse setup in the test-only inherited harness is explicitly synthetic accounting input, not a claim of real public earnings. The release controller has no test-credit method. The token's separate18-case suite was also executed at optimizer runs1, and its creation-bytecode SHA256 exactly matches the V3 token release artifact. It covers dust/maximum arithmetic, gross allowances/self-transfers, rollback and supply events. [Exact token artifact proof](../../docs/token/v3/token-exact-verification.json).

## Deployment boundary and budget

The deployment script defaults to public read-only preflight: it validates the old controller/interpreter pins, checks current roles/treasury and balances, estimates the new deployment, and writes a temporary plan. It does not unlock a key unless `--broadcast` is explicitly supplied. Mainnet is refused.

At the initial preflight, the developer wallet held0.00059130169 testETH. Deployment estimate was6,029,100gas; the conservative125%+50,000gas ceiling at twice the observed gas price was0.0001517275ETH. That leaves tight headroom for the existing0.0004ETH hatch price and a full first-day fee.

The old V2 contract held exactly0.0057088ETH in earned `nativeFees`; its immutable treasury and current owner were the developer wallet. `withdrawFees` estimated43,431gas. That method is permissionless and always pays the fixed treasury; the caller cannot redirect the payment. Through an explicit `--withdraw-old-fees` broadcast flag, the script additionally pins the old owner and treasury to the developer wallet before requesting that payout and deploying the new controller. It does not touch relay funds, NFT purses or service/campaign ledgers. These are a dated read-only observation, not authority to spend by themselves.

Broadcasting uses a separate durable V3 deployment journal under the operator's private user-data directory. Frozen signed intents are revalidated and rebroadcast exactly on retry; old V2 journals are untouched. New public deployment metadata is written only after confirmed receipts and runtime/burn-policy verification. No automatic old-admission pause, environment switch, ledger reset, relay funding, NFT migration or old-source replacement is performed.

The PM thread coordinates deployment and the active/legacy runtime registry. Old public NFTs/history must remain readable by their original collection identity; a new token's NFT#1 cannot silently replace the old collection's NFT#1.
