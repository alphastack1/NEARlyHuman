# Every stage returns to a little home

This pass extends the preceding [virtual-pet first-use review](../vpet-refinement/JOURNEY.md) across the whole current game. It reviews what the player can see, what the main action means and where Back returns. It preserves the original procedural rooster art, existing financial authority and asynchronous saved-day model. The UI changes in this workstream are confined to `src/app/v2/V2Journey.tsx`; world/art, audio, inspection and visual styling are separately owned by the PM and other reviewers.

## Findings and repairs

| Question | Observed problem | Change and evidence |
| --- | --- | --- |
| Does waiting explain the actual operation? | NHC permission, a mint and a withdrawal all used the same “day taking shape” presentation. | Operation-specific title, emblem, concise status and check action. An accepted day has Post → Plans → Saved states derived from job phases; the old decision-count percentage is removed. Eight controlled pending variants were inspected. |
| Can someone leave an unresolved first hatch safely? | Closing its pending card could reveal the mature guest's home, followed by another Hatch action that redirected back to payment recovery. | A nonowner returns to the entry with Continue hatching, Open my day or Check transfer, using the existing guarded resume path. Current owners can return to their own home. The unresolved intent is preserved. |
| Does another rooster's history briefly appear? | The shared Days state could retain MISO rows when opening SUNNY, before its read finished. | Loading a life resets the visible history from that life's cache. Dedicated loading feedback hides false-empty messaging. A real MISO28 → SUNNY1 selection with delayed GET responses showed no MISO rows or false-empty message while reading. |
| Does a retry actually recover the screen? | A successful same-screen retry could leave its old inline error visible. | History, portfolio and pending checks clear their old read error when the retry starts. A controlled 503 → successful Days read removed the alert and restored the real Day1 row. |
| Do menu returns preserve the right scroll? | One reused scrolling body could inherit another sheet's position. | Scroll is retained per life and per sheet. Belongings → Menu starts Menu at its own position; reopening Belongings restores its prior position. Days retains its existing selected-row/history cache behavior. |
| Is inventory understandable at a glance? | Care, seed packets, fruit, wood and crafts appeared in one mixed grid. | Only nonempty groups are shown: For home, Seeds, From garden and Workshop. The grid retains item art and exact counts, without inventing a marketplace or extra item subpages. |
| Do the care tabs match the player's intent? | Bandages appeared under House; compost was separated from planting supplies. | Care includes Bandage; Garden contains seed/sapling choices plus Compost. The two extra care/garden supplies use wide rows. House is a compact two-column set of its four remaining objects. The same kit limits and onchain material IDs remain. |
| Does a balance below 250 appear ready to hatch? | A three-decimal display could round249.999999 to250 while the birth control remained unavailable. | NHC uses exact integer formatting through all six decimals. The funded birth option appears only when at least250 NHC is present. No amount is converted to a floating-point balance. |
| Are old and current facts distinguished? | Belongings from an older film could look like current inventory. | Historical inventory names its saved day in the heading. Profile and purse continue to show the current NFT/life and actual current purse. |
| Can death become an unclear dead end? | A remembered life offered little explanation and the owner-facing hatch wording sounded like a visitor acquisition action. | Canonical death reason is shown concisely on its current profile; owner playback uses Hatch another. The purse remains available after death, including withdrawal and funded birth when permitted. |
| Are controls safe while a wallet request is open? | Material controls froze, while the sheet Close could still discard local return context. | Close freezes only during the existing synchronous wallet-operation lease. Sound remains available. Cancellation restores the editable hatch and name; no new provider transport is introduced just to describe a prompt. |
| Is expiry offered at the right time? | A quarantined job previously always offered a release action. | A public request read must confirm pending status and chain timestamp strictly greater than deadline, matching the deployed contract. Before or exactly at the deadline, Close expired day is absent. |
| Can background readiness interrupt someone reading? | The poll itself stopped after leaving its card, but a ready-packet GET already in flight could later close Belongings or History. | Automatic ready commits and their errors are guarded by the originating pending screen. The ready job remains available when the player leaves. A focused delayed-success/error proof preserved the current sheet. |
| Does waiting imply another manual advance? | Gold Check day competed with a status that already updates automatically. An explicit ready Watch could also open another Watch step. | Processing offers Back home primarily and Check again quietly. Ready, retry and confirmed-expiry actions remain primary. An intentional Watch of a known ready request loads and plays that same request once; automatic readiness still leaves the preplay Watch choice. |

Busy labels use neutral action verbs such as Hatching and Starting day. They do not pretend the broad operation lease is an exact measurement of when a wallet prompt is visible. A compact wallet-purpose cue explains which action selected the wallet, while the existing provider selection, session and intent checks retain authority.

## Full stage and action map

| Stage / state | What the player sees and can do | Return, ownership and saved facts |
| --- | --- | --- |
| First visit | House opening → one START → Hatch a rooster. Watch example and Your roosters remain secondary. | A decorative house replaces the guest's HUD until an example or real life is deliberately selected. |
| Optional example | Short actual saved excerpt, explicit EXAMPLE, Hatch your own and Back. | Back and automatic completion return to entry. The example never becomes an owner care or purse operation. |
| Hatch setup | Editable suggested name, current price, optional Personality and payment Change. | Draft values survive wallet cancellation and unresolved-payment restoration. The original random art is not redesigned or chosen by these controls. |
| Wallet selection | Named providers and a concise action purpose. | The selected provider's account/network and deployed world are checked. No new write skips an unresolved intent. |
| Wallet permission / signing | The ongoing action remains visible; price, name and material choices are frozen. | Close remains disabled only for the active operation lease. Sound stays usable. Cancelling releases that lease and preserves the draft. |
| NHC approval pending | Permission to hatch, the250-NHC step and Check permission. | Confirmed approval returns to the same hatch draft. Approval is not presented as an already minted NFT. |
| Mint pending / uncertain | Hatching the selected name and Check hatching or Reconnect wallet. | Closing a first hatch returns to Continue hatching at entry, with the exact prior journal preserved. It does not start another purchase. |
| New Day0 home | The actual newly owned rooster, its needs and the first preparation action. | No old guest film is attributed to the new NFT. |
| First post | Three visible parcel slots; Care, Garden and House choices. The main action is Start day1. | Select a slot, then a supply to replace it. At most three unique supplies and one productive starter remain. |
| Later post | The same parcel structure and Start dayN. | Preparing and starting now use different verbs. Selected kit/category and per-sheet scroll remain when returning. |
| Accepted day: queued / planning | Post and Plans stages, a concise current status, Back home primarily and Check again secondarily. | Automatic status reads do not buy another attempt. A fresh day uses the previously accepted request. |
| Accepted day: prepared / saving | Post and Plans done; Saved current. | A film is not advertised as ready until the job is ready. No fictitious percentage is displayed. |
| Ready day | A day to watch; one Watch action begins the actual saved packet. | The fresh-day marker preserves the new-day payoff. Automatic completion while the player waits presents preplay Watch without forcing playback. Known readiness after leaving offers Watch new day at home and uses GET only. |
| Failed / expired, retry-safe | Home is just as you left it; Pack another post. | A new attempt uses the existing safe retry flow. Confirmed submissions and charges are not deleted or refunded by the UI. |
| Quarantined / not yet expired | A little pause and another check. | No closing action is offered merely because a job is quarantined. |
| Confirmed expiry available | Close expired day is available only after an actual request read proves the strict deadline condition. | The wallet and contract still enforce expiry. This visibility check grants no authority. |
| Watching a saved day | Continuous travel and actions, pause, seek, inspection, Find rooster and Finish day. | These are presentation controls; they cannot change the saved biological or financial result. |
| Finished day | Actual saved needs, level and any actual earned amount, then preparation of tomorrow. | Returning owners can reach their saved home without replaying an old film. |
| Rooster profile | Current dynamic portrait, day, level and purse; Visit home, Days and Share. | Its original canonical procedural appearance is preserved. A remembered life gets its canonical ending note. |
| Saved Days | Actual day rows, a Latest cue, selected return context and Earlier days. | Explicit selection of even the latest day means replay. Back restores Days; Latest home deliberately restores current facts. |
| History loading / error | Opening days, then rows; a failed read offers Try days again. | No prior rooster rows or false-empty message are shown. A successful retry clears the old error. |
| Belongings | Grouped exact counts; a historical heading names DayN. | Current inventory comes from the current saved life; older-film inventory comes from that packet. Scroll belongs to that sheet and life. |
| World inspection | Factual garden growth/readiness, pantry care/food, supplies, workshop wood/crafts and post box shipments. | PM's inspection work links the owner's post box to the existing preparation flow; browsing does not create or consume goods. |
| Empty owner purse | Actual0NHC, concise origin of earnings, Back home or Hatch another for a remembered life. | No disabled withdrawal is presented as usable. |
| Positive owner purse below250 | Exact balance and Withdraw to wallet. | A rounded display cannot imply that a250-NHC hatch is funded. |
| Funded owner purse | Exact balance, withdrawal, and Hatch another ·250NHC. | Current wallet/ownership, purse nonce and contract authority still control spending. |
| Remembered life with funds | Canonical ending context and the same positive-purse rights. | Death does not remove the NFT or its purse withdrawal rights. |
| Public visitor's purse | Readable actual balance and Visit home. | Reading an NFT never exposes withdrawal or spending rights. |
| Transfer pending | Taking NHC home and Check transfer / reconnect as required. | Recovery checks the existing transfer; it does not submit another withdrawal. |
| Your roosters | Read/loading state, actual owned lives, more results and Change wallet. | A new account invalidates an older portfolio response. An empty result explicitly refers to this wallet, rather than implying all lives were lost. |
| Sound | Menu toggle; compact sound control at the title, example and non-menu sheets. | Audio can be muted during waiting or an active wallet operation without changing transaction context. |

## Evidence and limits

[The17-case stage record](journey-stages.json) combines the checked pending, purse, scroll and controlled wallet-cancel cases. It uses actual SUNNY #3 Day1 data as its base, while pending phases, balances, death and inventory examples are explicitly synthetic presentation fixtures. It is not a claim that the public game earned300NHC, died, minted another NFT or made a new paid inference. The controlled wallet accepted only one account-permission request and cancelled before signing; application write attempts and JavaScript errors were zero.

The initial wallet harness reached all other assertions, then waited for its controlled callback while two wallet choices were displayed. The corrected focused probe selected only Journey QA hold. That tooling recovery is retained in the evidence and did not require an application change.

[Read-context evidence](journey-read-context.json) uses actual public MISO/SUNNY snapshots, films and day lists. Controlled delays and a503 response exercise loading and retry. The mock connected address allows only account/network methods; every signing/sending method rejects. The old history disappears while the new read is in flight, a retry clears its alert, and an unresolved first hatch returns to the recovery entry. [Expiry boundary evidence](journey-expiry-boundary.json) separately checks before-deadline and exact-deadline hiding; the existing due-request probe verifies availability after the deadline.

[The final ready-context proof](journey-ready-context.json) starts with a controlled before-day0 presentation and uses the actual SUNNY Day1 film as its ready result. A delayed success and a delayed503 both preserve the player's Belongings sheet without an unrelated alert. Returning home and pressing Watch new day starts that packet with one click and no application POST. A separate automatic-ready case still presents Watch without starting playback, and an exact-deadline case keeps expiry hidden. These are controlled read/presentation transitions, not a new accepted or paid day. The original stage record explicitly notes which first-pass button priorities were superseded by this final review.

[Styled selected states](journey-styled.json) were captured after the visual work settled. Finite entrance transitions were fast-forwarded only for layout screenshots; no natural animation timing is claimed by these captures.

- [Planning stage](journey/styled-job-preparing.png) and [saving stage](journey/styled-job-saving.png).
- [Permission step](journey/styled-approve.png) and [grouped320px inventory](journey/styled-stock-320.png).
- [Switching history](journey/history-loading-new-life.png), [recovered history](journey/history-retry-recovered.png) and [first-hatch recovery entry](journey/pending-first-hatch-return.png).
- [Ready result preserves a reading sheet](journey/late-ready-stays-stock.png), [one-click ready playback](journey/late-ready-one-click-watch.png) and [automatic readiness leaves a Watch choice](journey/automatic-ready-preplay.png).

The application type check passes. Temporary harnesses use the separate Codex Browser profile, page-local stores and owned tabs only; all owned tabs are closed. No production push, budget/ledger mutation, actual quote, paid model call or chain transaction was performed by this journey workstream. Final independent PM review and hosted release evidence are recorded separately from these controlled presentation checks.
