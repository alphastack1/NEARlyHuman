# Production and the NFT purse

The player supplies possibilities; Jev chooses the day's work. NHC follows completed shipments of actual finished goods. Opening the app, harvesting, crafting or replaying a film does not by itself credit tokens.

## Garden and workshop

The garden has four beds. Each holds a flower, fruit planting or wood tree. Growth counts wet bedtimes of completed game days; offline time does not count. Watering from the well is separate from drinking bottled water.

The [catalog](../src/domain/catalog.ts) defines four flowers, four fruits and one wood tree. First growth takes three, six or eight wet bedtimes. Single-use plants clear after harvest. Grape and apple support six total fruit pickups; a wood tree supports ten wood pickups. Repeated yields need two further wet bedtimes.

One substantial undertaking covers planting, a harvest round, crafting or domestic work. Care, watering and other ordinary routines share a bounded daily allowance. Workshop recipes use stored wood: spoon **3**, toy boat **6**, birdhouse **8**, large chest **10**.

## Shipping and NHC

At most one shipping round can send up to four eligible finished goods per day. Flowers, fruit and finished crafts qualify; care supplies and raw wood do not. Jev may keep, consume or enjoy an item instead.

NHC uses six decimal places. A credited purse is an allocation backed by real token units in that world's contract vault. Its current NFT owner can withdraw, including while a day is preparing or after the rooster dies. The remaining purse rights travel with an NFT transfer. A pending day temporarily locks that transfer.

A token-funded birth burns **250 NHC** from one selected purse or the owner's wallet. Robinhood wallet-token births need an ERC-20 allowance; native NEAR burns wallet units directly. Burning for a birth does not reset cumulative issuance pressure.

Each world has cumulative issuance pressure and bounded reward capacity. Later shipments can credit less NHC for the same goods. Survival, growing time, materials, choices and available capacity all affect production. NHC is a game utility token with no promised income or cash redemption. Network gas and day-preparation fees are separate.

## Transfer burn and separate worlds

Current testnet tokens burn **0.5%** of ordinary address-to-address transfers while their owner-controlled switch is enabled. Purse withdrawals debit the gross amount and send the net amount shown in the app. Shipment issuance and direct birth burns have no additional transfer charge. The original Robinhood collection retains its original token rules.

NEAR and Robinhood have separate NFTs, inventories, token supplies and purse backing. There is no bridge or combined cross-chain balance.

The [player handbook](https://nearlyhuman.netlify.app/docs/nhc) explains these rules in the app. See [Contracts](CONTRACTS.md) for deployment identities and authority.
