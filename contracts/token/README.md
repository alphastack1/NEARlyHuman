# NHC transfer burn

`NHCTransferBurn.sol` is the EVM utility token used by the game controller. It burns **0.5% (50 basis points)** of ordinary address-to-address transfers while enabled. The game’s protocol owner can turn this fixed rule on or off through the controller.

## Accounting

- The sender spends the gross amount; the receiver gets gross minus the rounded-down fee.
- The fee reduces total supply. It is not paid to a developer wallet.
- Allowances are consumed by the gross amount.
- Purse withdrawals debit the gross allocation, keeping the vault backed for the remaining lives.
- Shipment issuance is a supply operation, not an ordinary taxed transfer.
- A250-NHC birth uses a direct burn, without an extra taxed vault deposit.
- Burning transfers does not roll back cumulative issuance pressure used for future shipment quotes.

Only the game controller has issuance/burn permissions. Owning a rooster does not grant token administration. The live public settings are read by the app; an administrator can change the enabled flag before a pending transaction is mined.

Fee-on-transfer tokens need explicit support from exchanges, routers and other integrations. The project does not currently supply a token market, cash redemption or a guaranteed swap route.

See [Economy](../../docs/ECONOMY.md) and the [EVM source guide](../evm/README.md). Native NEAR implements the corresponding policy inside its authority contract.
