# Wave 6 independent player review

This review uses the separate Codex Browser profile, one tracked tab at a time. It does not load signing keys, submit a quote/day, call Jev or send a transaction. The temporary local host accepts GET only and reads the actual testnet runtime and saved packets. Public-chain reads made by wallet verification are distinguished from application write requests.

## Repairs from the fresh review

| Question | Evidence | Repair | Focused result |
| --- | --- | --- | --- |
| Does a saved-day list refresh after the life advances? | A controlled read-only transition around actual Day26 showed current HUDDay27 but cached Days still started at26; the history endpoint had been called only once. | Refresh the first page when the current saved day is newer, merge/deduplicate prior pages, and derive the next cursor from the first missing contiguous day. Fence late results against a changed life generation. | The same controlled transition now lists27 and26 with two calls. An independently loaded complete26-day history refreshes to27 rows, remains complete, retains selectedDay1 and adjusts its scroll947→1012 so the selected row stays visible. An emptyDay0 history refreshes toDay1. |
| Can a returning player choose the wallet that owns the NFT? | The menu used the auto-injected account even before selecting a wallet. In a multiwallet browser this could show an empty list without offering the actual keeper. After choosing a wrong wallet, the same card had no way to choose another. | Your lives now follows the existing connection/selection action. A secondary Change wallet action clears only the selected client wallet/session when no unresolved payment exists; otherwise the existing payment guard remains in control. | Two explicitly announced mock provider identities verify the selector. The wrong empty account can choose Change wallet, select the keeper and display the real MISO/PEEP portfolio without reloading. No signature or send method was used. |

The history evidence is explicitly a presentation boundary test: it uses real Day26/Day1 films with synthetic future/current-day metadata and read responses. It does **not** claim an actual Day27 transaction. [Before](ui-history-before.json), [refresh](ui-history-refresh.json) and [complete/empty cases](ui-history-cases.json) preserve that scope.

The [wallet-selection record](ui-wallet-choice.json) uses mock EIP-6963 identities and actual public testnet configuration/portfolio reads. Its browser JSON-RPC calls were read methods, not onchain writes. It made zero application POSTs, signatures, inference calls or transactions. Real wallet authentication and hosted money flows belong to the separately authorized operator review.

The assigned application source changes are limited to `V2Journey.tsx`. The type check passed after both repairs.

## Actual final-policy phone preflight

The [actual read-only preflight](ui-actual-preflight.json) loaded genuine mind7 NFT1 Day28 from the candidate API. It binds request `0x0a11268acafbd6a709eaa5bb8cb965dc41a82430eb330ed4a2dddc6eb625d98b` and commitment `0xd17903f931ec0917ed8fa59fae2d53af9fd54c52967d8b9c1af987de10292277`, under decision configuration `0x5f8f7f1d79381d02783c3960fa2b8f12da19cac75f6b483aece39f0f73766892`. The actual current life and purse were Day28/0NHC. No new day was prepared by this reviewer.

The cold title→Start→Watch action, exact public portrait, name/stats/native-price hatch form and saved-day list were inspected at390×844,320×568 and430×932. The320×360 visible-height hatch check reaches the gold action through its own scroll area while Close remains visible; it approximates available keyboard height and does not claim a physical keyboard measurement. Selected screenshots are under `images/ui-final-*`. The warm wood/moss, blue bed and restrained navy/gold cards remain aligned with VR-01. The portrait shots wait for the actual SVG response rather than treating a request still in flight as a final blank image.

All eight candidate views had zero horizontal overflow, application errors or application write requests. This was a short read-only card/startup review, not another complete film or a hosted owner transaction. Hosted verification remains the next step after PM publication.

## Final wallet-operation boundary

The focused late-read experiment found one release blocker: a delayed Days read could finish while a new wallet selection was awaiting network permission and clear the shared busy flag. [Before repair](ui-busy-race-before.json), every wallet button re-enabled during the still-pending selection. The Journey now has a separate wallet-busy state and a synchronous operation token. Reads cannot release that token. `run`, wallet attachment and direct payment checking claim ownership before touching the operation or context; nested payment checking retains the caller's token. The single-provider path explicitly transfers ownership without deadlocking. Change wallet and retry cannot discard context under an active wallet operation.

The [same delayed-read proof](ui-busy-race.json) now keeps every choice disabled. The [synchronous invocation stress check](ui-wallet-fence-double.json) invokes the same Your lives callback twice and the pending attach callback twice. Exactly one account request and one network request result, and the sole-provider transfer completes to the genuine MISO/PEEP portfolio. The mock identity contains no key. No application write, signature or wallet send occurs.

The [material consistency check](ui-wallet-material-freeze.json) uses an explicitly controlled development preview of the actual public config/life without a film, so care is reachable without another full playback. While network selection waits, the name/stat controls, native/NHC price choices, parcel tray and supply choices remain disabled. Directly invoking saved pre-wait callbacks cannot change the selected native price or Water/Bread/Daisy seed parcel. Both selections are cancelled at the mocked network request, before role verification or any transaction. Categories and read navigation remain usable. This is focused presentation-boundary evidence, not a hosted financial acceptance test.

The final Journey type check passes. Application-source edits are frozen after these focused repairs; hosted read-only verification follows PM's final publication.
