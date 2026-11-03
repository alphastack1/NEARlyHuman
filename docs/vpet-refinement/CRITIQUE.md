# Virtual-pet journey: independent player review

This review starts from the actual published game, not the builder's intended flow. Its browser uses the separate Codex profile with page-local memory storage. The reviewer opened and closed only its own tab. Every non-GET application request was blocked; no wallet, inference, quote, transaction or service ledger was used.

## What the genre teaches

The [official Nintendogs + Cats manual](https://csassets.nintendo.com/noaext/image/private/t_KA_PDF/manual-3DS-nintendogs-cats-en?_a=DATAg1AAZAA0) describes a first session that starts at the kennel: meet/pet a puppy, choose it, bring it home, call and reassure it, then name it. Returning sessions start at home. The useful principle is emotional attachment and an immediate understandable verb before configuration; the literal microphone/name-training mechanic is not appropriate here.

The [official Tamagotchi Uni manual](https://tamagotchi-official.com/manual/toy/uni/Uni_WEB_IS_EN.pdf) anchors care options to the main room, uses a consistent cancel/back control and limits which options are available at the baby stage. Food and mood have distinct visible effects; advanced services are separate. The [Original Tamagotchi manual](https://tamagotchi-official.com/manual/toy/original/Original_webmanual.pdf) similarly connects an attention signal to checking a need, choosing one care action, seeing its result and returning to the pet. These are references for predictable navigation and progressive disclosure, not reasons to copy their hardware menus or real-time neglect.

Inference for NEARlyHuman: the player should understand **this is my rooster → I send a small parcel → it lives its day → I can inspect what changed and prepare tomorrow**. Watching someone else's life is useful optional discovery. It should not masquerade as starting the player's game or be a prerequisite for ownership and care.

## Actual published before-flow

At 390×844, a cold page showed:

`House assembly → title with START and Skip → MISO LV27 / DAY28 → Watch day → long saved-day playback`

There was no immediate hatch action after Start. Finding it required `gear → seven-row Home menu → Hatch a life`. Returning from Belongings to the menu did work in the observed simple branch. Deeper branches depended on one overwritten return variable in source, so a nested stack was required before claiming predictable back behavior.

| Priority | Concrete observation | Why it matters | Required direction |
| --- | --- | --- | --- |
| High | Start opens a mature stranger, with Watch day as the sole large action. | A first-time player reasonably reads MISO as their pet, or assumes watching the whole film is how the game begins. | Adoption first; clearly optional short example. |
| High | A running example has pause/seek/next-moment icons but no visible End example or leave action. | The skip icon means next moment, not skip the example. The viewer does not know how much remains or how to leave. | A persistent explicit exit that returns to the same entry context; a short bounded example. |
| High | Owners with a saved film cannot prepare tomorrow until completing playback. | Rewatching becomes a task before the actual repeated care action. | Current home and tomorrow's parcel must be reachable independently of playback. |
| Medium | The Home menu has seven equal-weight rows: MISO, Days, Belongings, Purse, Your lives, Share, Hatch. | Current-rooster information, player account navigation and acquisition compete without hierarchy. | A recognizable current-rooster anchor, compact local tools, separate secondary player controls. |
| Medium | Hatch initially asks for name, three point allocations and two currencies. | Setup asks for strategic knowledge before the player has seen the basic care loop. | Editable default name; personality and alternate payment disclosed on demand. |
| Medium | The name field displays BOK as placeholder while actual name is empty and Hatch is disabled. | It looks prefilled while the obvious action silently does nothing. | A real valid suggestion or unmistakably empty required field. |
| Medium | Back arrow and gear both lead to the same menu in ordinary home. | Two different navigation symbols have the same result; the back arrow suggests a prior place that does not exist. | Back only when there is a prior context; menu stays menu. |

The before-run recorded zero application errors and zero attempted application writes. These are UX findings, not infrastructure failures.

## Review boundary

Builders are changing entry/adoption, optional personality, menu grouping, nested back, owner day readiness, demo duration/exits and pixel-grid rendering. The independent follow-up below must inspect actual local output. Preview-only owner/newborn cases must be identified separately from real public state; a displayed button is not a paid transaction or inference proof.

## Follow-up

The [actual local public flow](critic-public-flow.json) uses the edited source and real public MISO data. It records zero application errors, zero non-GET application requests and zero horizontal overflow across the checked screens. The observed sequence is now:

`One START → adoption entry → Hatch primary / Watch example and Your roosters secondary`

Hatching uses an editable valid **PIP** suggestion, with personality and alternate payment collapsed. The main action is enabled immediately, and it names the chosen rooster. The cost remains visible in its collapsed row. [Entry](images/entry-390.png), [hatch](images/hatch-390.png) and [menu](images/menu-390.png) were visually inspected after the new styles settled.

The example is explicitly marked **EXAMPLE** and starts only when chosen. Its visible **Back** returns to the same adoption entry; **Hatch your own** stays available. An uninterrupted replay of the real saved packet returned naturally after **23.456 seconds**, before the 28-second hard cap. The example option was still present afterward. The first provisional timing run coincided with development hot reload and is not retained as final evidence. [The inspected exit](images/example-exit-390.png) fits inside the phone viewport.

The seven-row menu is now a current-rooster portrait anchor, a four-tool grid and secondary account/acquisition controls. Actual `Menu → MISO → Days → Back to rooster → Back to menu` and `Menu → Belongings → Back to menu` branches retained their parent contexts. The cold hatch Back returned to the adoption entry. An exact public NFT link still opened that rooster's portrait directly.

The [owner/cancel presentation probe](critic-owner-cancel.json) uses SUNNY's actual public Day1 snapshot and packet with a controlled owner address through the existing development preview. It does not claim a connected wallet or a fresh paid day. The current home starts at the saved **LV01**, with **Prepare tomorrow** primary and **Watch day1** secondary. Preparation is reachable without replaying. Choosing the Water parcel slot and then Milk replaces that slot while retaining exactly three slots; every supply remains available instead of appearing locked. The Seeds surface shows all nine plant choices and growing days. Starting the saved film and choosing **Finish day** restores the actual final state and the tomorrow action.

The cancellation case uses a uniquely named controlled EIP-6963 provider. It rejects its single account-permission request before network verification, signing or sending. The hatch retains **BEAN**, shows the cancellation feedback and returns to the same entry through Back. Earlier harness attempts used a generic injected-wallet selector and did not reach the controlled provider; those are retained only in TEMP and are not claimed as application cancellation failures. The successful probe had zero application errors, attempted application writes or horizontal overflow. [Cancellation](images/wallet-cancel-390.png), [care](images/care-390.png), [replacement](images/care-replaced-390.png) and [seeds](images/seeds-390.png) were inspected as actual rendered views.

## Final independent polish check

Two concrete visual/state observations were returned to PM: the current owner home displayed an unchecked completed project because its check state depended on replay progress, and the newly crisp native-size rooster felt small compared with its furniture. Both received repairs, followed by the [narrow final check](critic-final-state-pixels.json).

The actual saved SUNNY Day1 home now shows its completed **Plant Daisy** with a check and keeps **Prepare tomorrow** as the primary action. Starting its earlier saved film correctly removes that completion marker until the action occurs in replay. This distinguishes the current home from the beginning of a historical day without inventing new state. See [current home](images/final-owner-checked-390.png).

The larger authored silhouette restores the rooster's visual weight while preserving one-world-pixel contours. MISO retains its green body, black tail, orange beak and recognizable head; SUNNY retains its blue identity. The new fuller breast and longer body read as a bird rather than an enlarged square glyph. Its scale fits the bed, paths and garden, and the held seed parcel remains understandable at contact. [SUNNY leaving bed](images/final-owner-moving-390.png) and [SUNNY at the real Day1 planting action](images/final-owner-project-390.png) are actual rendered captures. The latter uses the player's explicit seek/resume control to reach the actual main receipt; it is presentation inspection, not a newly advanced day. The final check recorded zero application errors, attempted writes or horizontal overflow.

No high-priority flow or visual blocker remains in the reviewed local candidate. The result is substantially easier to enter and navigate than the published before-flow. This is an independent local player review, not a claim that every physical phone, real external wallet or economic path was retested. No production release, inference or chain write was made by this reviewer. All owned tabs and browser connections were closed.
