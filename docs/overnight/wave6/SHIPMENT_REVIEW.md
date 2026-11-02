# Final shipment-choice review

The observed issue was choice availability, rather than invalid onchain economics. MISO's actualDay26 inventory contained one Toy boat, one Strawberry and two Apples. The provider previously saw only the top combined parcel: it had to send its first special craft to post any of that fruit. Both the TypeScript reducer and deployed Solidity action module already permit smaller valid baskets.

The candidate menu now exposes at most three deduplicated existing-valid baskets:

| Basket | Exact actual MISO26 goods | Base points | Toy boat afterward |
| --- | --- | ---: | ---: |
| Combined | Toy boat1, Strawberry1, Apple2 |35.7|0|
| Produce only | Strawberry1, Apple2 |14.5|1|
| Surplus | Apple1 |4.0|1|

The surplus basket withholds one of each currently held finished item before selecting at most four units. This is an action-local stock choice, not a promise that a later action will preserve the remainder. Empty or equal baskets disappear. Care supplies and raw wood are never exportable, and all choices remain within the original maximum-shipment reservation.

Only candidate generation, labels, bounded provider coverage and the offchain mind policy changed. `applyStep`, Solidity, its runtime/rules hash, rewards, turns, material provenance and the one-shipment-per-day restriction did not change. No new weight, goal or forced sale was added. The generic preparation menu retains distinct basket keys. The real provider first selects its original care coverage and quiet option, then may append at most two shipping alternatives within a14-choice ceiling. It never removes a clinical option to fit a parcel.

The new mind7 decision configuration is `0x5f8f7f1d79381d02783c3960fa2b8f12da19cac75f6b483aece39f0f73766892`. The PM must drain and record the policy transition before accepting any new day; this review signed nothing and bought no inference.

## Focused evidence

[The proof](shipment-options.json) covers six bounded experiments: exact baskets/nonmutation; empty/equal/max-count/stock/reward bounds; provider and generic menu retention; care-only/shipping-disabled exclusion; retained baseline clinical/urgent-rest choices; and request size. The mixed and clinical request bodies were8274 and10254bytes, below the existing14000-byte cap. Existing choice facts10, opportunity facts10 and economy-facts checks still pass. Application and standalone script type checks pass.

Three **actual deployed-verifier read-only calls** used MISO's exact recordedDay26 state bytes at block147271666. An explicit test seed and each test shipment trace produced exactly the same encoded state and points in TypeScript and Solidity. The smaller baskets kept the real Toy boat. The actual read is bound to state hash `0xcd348b22467bd6f3ef48deebadba84e585e6bf86b53232a430b8a09346c4bfaa` and the deployed verifier `0x7620cde82d323074b102cfb8cf1c2fdd9999ee34`.

Those calls did **not** accept a day, issue NHC, submit a transaction or establish a new Jev choice. Public balances remain whatever the actual controller records until a separately authorized real day is prepared and settled. The permanent check is `scripts/v2/check-shipment-options.ts`; its optional `--public-parity --block=147271666` replays this historical read if the RPC can still serve it. Temporary outputs remain ignored.
