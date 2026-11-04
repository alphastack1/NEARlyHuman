# Production and the NFT purse

The player supplies possibilities; Jev chooses the day's work. The economy follows actual materials, growth and finished shipments rather than issuing tokens for opening the app or replaying a film.

## Four beds and one main undertaking

The garden has four beds. Each holds one flower, fruit planting or wood tree. Growth counts wet bedtimes of advanced game days; offline time does not count. A watering round uses the well and can water all occupied beds, separately from drinking bottles.

The [catalog](../src/v2/catalog.ts) defines four flowers, four fruits and one wood tree. Initial growth takes three, six or eight wet bedtimes. Single-use plants clear after harvest; grape/apple have six total fruit pickups and the wood tree has ten total wood pickups, with two wet bedtimes between repeated yields.

One substantial undertaking covers planting, a harvest round, a craft or domestic work. Care, watering and other ordinary routines share a bounded daily allowance. Four crafts use stored wood: spoon (3), toy boat (6), birdhouse (8) and large chest (10).

## Finished goods and NHC

There is at most one shipping round per day, carrying up to four eligible finished goods. Harvesting or crafting alone does not credit NHC. Care supplies and raw wood cannot be shipped. Jev may keep, consume or enjoy something instead.

NHC uses six decimals. The NFT's purse is a contract allocation backed by real token units in its world's vault, not an additional unbacked balance. Its current owner can withdraw, including after death. Transferring the NFT carries the remaining purse rights, while an accepted pending day temporarily locks transfer.

An owner can burn **250 NHC** to hatch another NFT. Birth burns do not reset cumulative issuance pressure. Later shipment rewards respond to lifetime issuance and the world's bounded reward capacity. Network/preparation fees are separate from NHC, and no cash redemption or earning rate is promised.

## Separate worlds and reproducible rules

Robinhood's ERC-20 and native NEAR's NEP-141 units belong to separate economies. NFTs, inventories, purse allocations and supplies do not bridge. Both authorities derive results through their deterministic rules rather than accepting an arbitrary model-proposed token amount.

See the [live player handbook](https://nearlyhuman.netlify.app/docs/nhc), [shared catalog and reducer](../src/v2/), [Robinhood contracts](../contracts/v2/) and [native authority](../contracts/near/src/). The dated [model research](economy-v2/RESEARCH.md), [feasibility receipts](v2-feasibility/REVIEW.md) and [world-event balance review](research/WORLD_EVENT_BALANCE.md) distinguish controlled models, actual chain execution and real Jev behavior.
