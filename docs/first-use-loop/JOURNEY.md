# First-use journey critique and refinement

Reviewed on 3 November 2026 in the separate Codex Browser profile. The initial live hatch screenshot confirmed the owner's observations: a static left-aligned network line and an unexplained Personality disclosure containing Body, Wits and Spirit.

## Changes

- The network is now an explicit button with a network mark, brand, separate Testnet badge and chevron. It opens a contextual picker, then returns to the exact hatch, wallet or day-review screen. A catalog name cannot enable a nonexistent deployment. Only the currently validated served world is selectable.
- **Connect wallet** is its own free action. Choosing a wallet connects and checks the runtime/balance, then returns to the preserved hatch form. **Hatch NAME** subsequently requests the NFT transaction. Choosing a wallet cannot silently mint. The tiny footer changes from “Connecting is free” to “Network fee applies” after connection.
- Wallet choices use neutral rows. The duplicated standalone wallet icon and the duplicated Back action in the network sheet were removed.
- Renamed the stat editor **Strengths**. Its default summary says **Balanced**; altered allocations say **Custom**. A short “Hardy, handy or upbeat?” cue suggests the choice before expanding. Inside, Body says “Less hurt from mishaps”, Wits says “Fewer fumbles”, and Spirit says “Cheerful for longer”. The five-point rule, minus/plus move instruction and optional reset make adjustment clear without requiring it.
- Garden supply selection now explains its one-productive-starter limit with “1 seed or sapling per day”. Choosing another replaces the selected starter rather than silently appearing to permit two.
- Independent network review found a nested return bug: Wallet → Networks → Back previously escaped to home/start because the generic close handler rejected every wallet return. The network sheet can now return to the wallet choices without connecting or minting.

The Strengths descriptions follow the actual V2 reducer: Body reduces physical damage, Wits raises the success chance of eligible risky domestic actions, and Spirit slows morale loss. Those are different from the rooster's seed-based tastes and routines. No stat/economic rule or original rooster artwork changed.

## Focused handler evidence

The actual local React and viem handlers ran in Codex Browser against the real public testnet runtime, balance and preflight reads. The provider was keyless and controlled; all auth/session/quote responses were intercepted. A Day 0 presentation wrapper was explicitly constructed from SPROUT's public first-day state. It is a UI fixture, not an actual new mint or newly saved day.

| Question | Evidence and result | Decision |
| --- | --- | --- |
| Does connecting buy an NFT? | Connect requested wallet access and read-only checks; zero signatures, quotes or transaction requests. Correct-chain connection produced no redundant chain switch. Name PEEP and allocation 3/1/1 remained intact. | Keep connection separate from explicit mint. |
| Does network selection lose context? | Hatch → Networks → Hatch and Wallet → Networks → Wallet preserved the exact form and wallet intent. Day review also returned correctly. Only one genuinely served network row appeared. | Use capability filtering and the existing return stack. |
| Does cancelling a mint lose setup? | Only explicit Hatch reached one fake-provider transaction request. A controlled 4001 rejection returned to the hatch form with the exact name and strengths. No signing or broadcast occurred. | Preserve the existing cancellation/journal safety. |
| Is the first parcel clear? | Three initially empty slots accepted water, bread and one starter. The Garden-only limit was visible. Review and editing kept all three selections. | Keep empty-first packing with concise contextual guidance. |
| Do review/verification reserve credits or pay? | Review made no quote. Verify produced one intercepted mock sign-in and no quote. Start alone obtained one intercepted deliberately stale quote, reused the checked session and rejected it before another send. | Preserve the separate free verification and paid admission boundaries. |
| Is low gas a dead end? | An intercepted insufficient-funds gas preflight returned to Hatch with preserved fields and the existing **Get test ETH** link to the official Robinhood testnet faucet. Zero transaction requests occurred. | Keep the contextual recovery action; do not add a persistent warning. |

All cases finished with zero browser errors and zero unintercepted service POSTs. No private key, real signature, signed transaction, broadcast, funded quote, ledger write or AI call was used by these local checks. Initial harness locator failures occurred before wallet access and were corrected; they were not treated as product transaction failures.

Selected verified captures: [connected hatch](journey/connected-hatch-390.png), [cancelled hatch retains setup](journey/hatch-cancel-390.png), [low-gas recovery](journey/funds-recovery-390.png). Responsive visual evidence is recorded separately by the visual reviewer. Full disposable handler logs and scripts remain in ignored `TEMP/first-use-loop/`.

These checks establish the local revised flow and its recovery behavior. Hosted publication and any real wallet/day check are separate PM release decisions. Native NEAR/Meteor gameplay requires its actual contract and service adapter; a visual picker alone does not implement it.
