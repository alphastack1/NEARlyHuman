# Future NHC transfer burn

This module implements the owner's revised token policy: **0.5% (50 basis points) is burned on every address-to-address NHC transfer when enabled**. The game owner may turn it on or off. The rate itself is fixed. There is no treasury share, pair registry, owner-wallet exemption or arbitrary fee setter.

**Status:** source and local execution verification only. The current Robinhood token/game, native NEAR contract, deployment artifacts, runtime pins and existing lives are unchanged. The live app does not yet have this tax.

## Exact accounting

For a gross transfer `G` in micro-NHC:

```text
burned  = enabled ? floor(G × 50 / 10,000) : 0
received = G − burned
sender's balance decreases by G
totalSupply decreases by burned
```

NHC retains six decimals. A transfer of 100 NHC delivers 99.5 NHC and burns 0.5 NHC. The first nonzero fee is at 200 micro-NHC (`0.0002 NHC`); smaller transfers round down to zero. Splitting amounts can change rounding, so this is not claimed to produce an unavoidable exact fractional fee at dust scale.

`transferFrom` spends **gross** allowance. A self-transfer must have the gross balance even though its final balance only decreases by the burn. Zero transfers retain normal ERC-20 behavior. Minting from zero and explicit burning to zero are supply operations, not address-to-address transfers; they do not receive an additional fee. The burn uses the base ERC-20 update, avoiding recursive taxation.

`totalTransferBurned` counts only the automatic transfer burns. Standard `Transfer` events record the burn to zero and the net recipient transfer; `TransferBurn` also records gross/burned values. Explicit birth burns remain separate. No fee is sent to a treasury or a nominal dead wallet.

## Authority

The deploying game becomes the immutable `controller`. Only that controller can mint vault units, burn vault units, burn a wallet's approved birth payment or call `setTransferBurnEnabled(bool)`.

The next game must forward its existing owner authorization:

```solidity
function setNHCTransferBurnEnabled(bool enabled) external onlyOwner {
    token.setTransferBurnEnabled(enabled);
}
```

Pass the initial flag explicitly when the next game deploys `new NHCTransferBurn(initiallyEnabled)`. This source does not silently choose a mainnet launch setting. NFT keepers do not acquire the protocol-wide toggle. A game ownership transfer changes who can use its forwarding method without changing the token's immutable controller.

## Integrate with a future Robinhood game

The current ERC-20 and the game's token reference are immutable. They cannot adopt this implementation through a configuration change. This module is **not** a proxy upgrade, replacement of deployed bytecode, migration instruction or authorization to create new live assets. The next deployment requires its own reviewed runtime identity and rollout decision. Existing NFT IDs, purses, public examples and ledgers must remain available; do not reset them to make a new token appear active.

The next game can retain `mintVault()` and `burnVault()` for their current purposes. Two payment paths need explicit accounting:

1. **Purse withdrawal is taxed.** Debit the NFT purse and `totalAllocated` by gross `G`; transfer gross `G` from the game vault. The wallet receives `G − fee` and the fee is truly burned. Vault balance falls by exactly `G`, so the remaining allocated purses stay backed. Display the gross debit, net received and burn in the withdrawal review. An ordinary direct transfer into the vault is also taxed; it must not automatically create a purse allocation.
2. **A 250-NHC wallet-funded birth burns directly from the approved wallet.** Replace `transferFrom(wallet, vault, 250)` followed by `burnVault(250)` with `burnWalletForBirth(wallet, 250_000_000)`. It spends the wallet's allowance for the game and burns the exact birth price directly. There is no address-to-address transfer to tax. Otherwise the vault would receive 248.75 NHC and a subsequent 250-NHC burn could revert or consume another purse's backing. The existing 250-NHC purse-funded birth remains a direct vault burn and does not incur a second transfer fee.

Keep cumulative issuance/reward pressure monotonic. Transfer burns lower circulating supply; they do not rewrite past issued amounts, free reserved rewards or increase shipment quotes. Any different reward-pressure policy is a separate economic change.

While the toggle is enabled, every ordinary `transfer`/`transferFrom` involving a wallet, pool, router, game vault or recipient contract is subject to the same rule. Adding/removing liquidity and routed transfers may incur fees too. The module does not label these movements as buys or sells.

## Native NEAR companion design

No native source or Wasm was changed. A future NEAR implementation needs more than changing `ft_transfer`:

- Preserve the shared NFT/FT contract's state, total supply, allocated purses, pending days, operation IDs, historical records and existing balances. New toggle/counter/pending-fee fields require a reviewed Borsh-state migration or an explicitly compatible storage design. Existing code/runtime fingerprints must be updated only after a verified upgrade.
- Use the protocol owner's existing `admin()` authorization for a fixed 50-bps on/off switch. Do not grant NFT holders a global switch or exempt owner wallets.
- A simple `ft_transfer` must debit gross, deliver net and emit the net transfer plus actual burn. Direct internal withdrawal also needs this treatment: preserve the gross purse debit and backed allocation, while the keeper receives net.
- Native wallet-funded births already burn directly from the wallet through internal accounting. Preserve that exact-price supply operation; do not replace it with a taxed vault deposit. Purse-funded births and shipment minting remain direct supply operations.
- `ft_transfer_call` requires custom **transfer-and-refund** accounting. Pass the receiver the net amount it actually obtains. Reserve any prospective fee until the receiver's outcome is known, rather than irrevocably burning a fee before a possibly failed swap. A fully failed/unused transfer should reverse the whole operation, including its reserved fee. Refund reversal is bookkeeping of an uncompleted transfer, not a second taxable user transfer.
- Define and verify partial-use rounding. Persist the per-call gross/net/reserved fee under a unique private callback context; clamp hostile unused-amount replies; consume each callback once. The resolver must not refund or burn other purses' backing. Receiver balance changes, sender/receiver unregistration, malformed replies, missing receiver hooks and repeated callbacks all need execution tests. Retain NEP-141's account/unregistration behavior and distinguish registration-related burns from transfer-tax burns.
- Emit coherent `FtTransfer` / `FtBurn` logs and expose the toggle and cumulative transfer-burn counter. Refresh service/runtime code pins and withdrawal net estimates together. A code upload alone does not establish these guarantees.

The present standard NEP-141 resolver expects the original transferred amount. Charging a fee while keeping the old callback amount unchanged would overstate what the receiving contract can use. Burning before failure would also turn a refunded swap into a fee-charged operation. These are design requirements for a later native upgrade, not claims that the EVM source proves NEAR behavior.

## Compatibility boundary

This is a fee-on-transfer token when enabled. Uniswap v3 and v4 do not support such tokens through their ordinary pool/router paths. Compatible v2-style flows need `SupportingFeeOnTransfer` handling and correct net minimum amounts. Generic routers, bridges, centralized exchanges, pooled liquidity actions and NEAR Intents are not assumed compatible. Verify an actual supported route before advertising that NHC can be swapped for another currency.

The transfer-burn toggle can change between a quote and mining. Frontends should read and disclose the live state and account for the fixed maximum 0.5% when displaying net amounts. This module does not promise a market, price, liquidity, cash redemption or compatibility with an external exchange.

Primary references: [Uniswap fee-on-transfer limitations](https://developers.uniswap.org/docs/protocols/v3/concepts/unsupported-tokens), [v3/v4 support guidance](https://support.uniswap.org/hc/en-us/articles/20981158150029-I-can-t-remove-my-liquidity-position), [v2 transfer-fee routing](https://developers.uniswap.org/docs/protocols/v2/guides/troubleshooting), [NEP-141 transfer/resolver rules](https://github.com/near/NEPs/blob/master/neps/nep-0141.md).

## Local verification

Prerequisites: the repository's pinned dependencies and an existing Anvil binary. On Windows the runner uses `~/.foundry/bin/anvil.exe`; `ANVIL_BIN` can select another installed binary. It starts one ephemeral loopback chain31337, compiles the new module and test harness with the installed solc, and keeps build/state scratch outputs under ignored `TEMP/token-transfer-burn/`.

```sh
node scripts/token/check-transfer-burn.mjs
```

The harness is a minimal local purse/accounting model, **not** the deployed game or a mainnet release. The final run passed 18 grouped execution cases: enabled/disabled construction and toggle authority, true supply burn and logs, dust thresholds, self-transfer gross funding, gross/infinite allowances, a mined reverted allowance-write rollback, maximum-uint arithmetic, backed taxed withdrawals, direct approved wallet births and purse births. It also verifies that the current V2/native source and artifact files were not changed.

[Verified local result](../../docs/token/transfer-burn-verification.json). These checks are focused implementation evidence, not an independent security audit or live deployment verification. No production build depends on the scratch files or Anvil.
