# Completed visual coverage audit — historical plan

Prepared 1 November 2026. **Completed by the final pass:** the proposed recipe/contact/lifecycle/camera boards are now generated and every remaining screen state/reference is assigned. See [the complete handoff](HANDOFF.md) and [reference map](REFERENCE_MAP.md). The recommendations below are retained as planning history, not outstanding mockup work. Scope: reviewed chunks 01–04, the scene map's 35 action families/major UI compositions, and boards NH-040–054. This is a visual-guide coverage audit. The selected chunk04 images are now permanent references; not every contextual variant is illustrated and no game tests are claimed.

## Main finding

The collection now has broad reusable UI structure: entry/mint, care/catalog/detail, preparation/save/ready, recorded inspection/pause, summary/memorial/trial, selectors/options/help, wallet/context and recovery cards. The remaining highest-value generated images are **food preparation/consumption, remaining garden actions, baseline rest/leisure, birth/death presentation, and end-of-day/camera continuity**. Producing dozens more near-identical text-error cards would add less build guidance.

The current chunk 04 substantially fills the formerly sparse world-action side: hazards/shutdown/suppression/outage; weather responses; compost/soil/shelter/dryness; chair creation/movement/brace; patch expiry; toolkit repair; pest diversion/shoo; mess cleaning; and separate medicine/bandage treatment. These remain visual references rather than completed source animation or every mechanical branch.

## Action-family coverage and remaining gap

| Family group | Existing/current visual support | Next useful addition |
| --- | --- | --- |
| K01 toast | NH-001 kitchen toast | Reuse; no new independent board needed |
| K02–K07 kitchen recipes/risk | Ingredient/icon guides exist, but recipe contact/transformations largely do not | Three paired recipe boards below |
| H01 direct consume | Water receipt/stock context in NH-008; item icons; no broad consume-pose guide | Three small consume/contact studies; milk can reuse the same gesture with its distinct carton |
| H02 treatment | NH-054 medicine-Infection versus bandage-Wound; condition/status cards | Illness medicine can reuse same treatment pose/prop with different written target |
| H03 rest; H04 baseline/garden leisure | Bed menus exist; NH-019 crafted-chair leisure only | Baseline rest/leisure contact sheet, not another sleeping menu |
| H05/H06 mess; H07 wash | NH-053 tidy/deep-clean; NH-019 body soap wash | Surface contamination wipe is still useful as a paired maintenance scene |
| H08 repair; H09 build; H11 brace; H20 move | NH-048/049/051 plus shelter in NH-046 | Reuse target/pose family; stove repair does not need another whole UI layout |
| H10 wood patch | NH-009/050 prop states; no strong NPC applying-patch contact | One applying-patch scene, preferably window context |
| H12/H13/H14 weather | NH-043 window brace and umbrella stock-diversion | Body exposure cover is distinct; bandage diversion can pair with it |
| H15/H16/H17 heat/fire | NH-040–042 | Reuse; no electrical-fire, second-appliance or offline-fire variants |
| H18/H19 pests | NH-052 seed-eater bread diversion/shoo | Hungry-visitor/milk-steak variants can reuse this composition with explicit bait/target notes; not another autonomous enemy system |
| G01 plant | Plant icons/growth states, not actual planting contact | Rose/apple planting pair |
| G02/G03/G04/G06 garden | NH-018 watering, NH-045 compost/soil, NH-046 shelter | Reuse; alternate plot number does not require a new whole scene |
| G05/G07 harvest/abandon | NH-018 rose harvest; no apple harvest/intentional abandon contrast | Apple harvest versus abandon pair |
| T01 safe idle | NH-033 deterministic recorded step | Reuse; no new paid-choice or idle-loop UI |

## Recommended next generated chunk — thirteen useful boards

Use the same fixed VR-01 palette. Default two full square scenes; at most three small simple contact/pose studies. Exact short copy is provisional, with written rules authoritative.

| Proposed board | Panels | Coverage and purpose |
| --- | --- | --- |
| Cooked steak versus emergency raw steak | 2 full scenes | K02/K07; working heat/prep versus narrowly legal emergency raw use beyond day 1; no invented recipe or guaranteed illness |
| Comfort bowl versus steak sandwich | 2 full scenes | K03/K04; milk+bread no-heat preparation versus steak+bread heat-dependent cooking; immediate meal effect, no stored sixteenth supply |
| Coffee ritual versus milk coffee | 2 full scenes | K05/K06; exact ingredients/target, Jitters, one-time inputs; distinguish from quick coffee |
| Direct consume/contact sheet | 3 small studies | H01 water, bread and quick coffee at household store; milk uses same consume pose with carton shape/label variant. Native final sprites remain separate |
| Plant rose versus plant apple | 2 full scenes | G01 type-specific seed/plot contact, growth 0, actual retained moisture; no instant fruit/tree |
| Apple harvest versus abandon planting | 2 full scenes | G05/G07; immediate reward and empty plant versus no reward/salvage; soil block remains after abandon |
| Baseline recovery contacts | 3 small studies | H03 bed rest; H04 permanent base leisure; H04 garden view. Clearly show the free baseline paths separate from crafted-chair improvement |
| Exposure cover versus bandage drip diversion | 2 full scenes | H14 body umbrella prevents named exposure damage; H13 bandage diverts threatened stock loss. The protection targets/effects differ |
| Surface wipe versus applying wood patch | 2 full scenes | H07 contaminated prep surface with one soap; H10 damaged window/stove patch with one wood, temporary damage mitigation. Avoid also deep-cleaning/curing disease |
| Birth beginning versus reduced-motion reveal | 2 full scenes | UI-03A/UI-03C. Confirmed procedural identity/home, skippable and same actual preparation status; no repurchase or second starter grant |
| Recorded death versus reduced-motion death | 2 full scenes | UI-10A/UI-10C. Literal recorded cause, no burn/ghost roaming/resurrection; retained memorial follows |
| Living bedtime versus terminal cutoff | 2 full scenes | UI-08M/TERMINAL and WS-26. Final phase/condition deadlines before living-only sleep/healing/growth/expiry/level; terminal result skips all later effects |
| Doorway and foreground/camera continuity | 2 full scenes or3simple contacts | WS-25/RP-04. Same rooster/scale, visible feet/held item through doorway, wall-cutaway and edge-clamp guide; no full-house camera or room tabs |

This is a proposal for the **minimum next useful visual vocabulary**, not permission to mark every WS frame or full source-art test complete. A small separate success/failure outcome strip may still help if the cooking/maintenance boards fail to show spent-input failure clearly; reuse existing Mess/wound/contamination/fire states rather than inventing new harm.

## Handle remaining text-state variants with a traceable reuse bridge

The ledger currently has many pending UI IDs. Keep that honest. For states whose layout is already illustrated, add a derivative-reference mapping rather than spending one new generation per string change:

- Connection rejection/unavailable, mint validation/insufficient funds, oracle/capacity/quote loading: reuse entry/form/message layouts, specifying the exact condition and enabled control in the written bridge.
- Daily approval/submitted/queued/slow/resumed status: reuse mint-wallet and preparation cards with correct token/day/request context. Unknown stays checking; no paid retry until actual terminal release.
- First-day quote unavailable, local failure awaiting chain record, expiry approval/revert/race: reuse existing first-day/recovery/transaction layouts with explicit distinct safe actions.
- Historical replay retention, unavailable/unverified packet, reorganization quarantine: reuse details/missing-replay/checking cards while preserving truthful state and original retention dates.
- Full stock, stale base, selected-item removal, one/two/three delivery variants: reuse care/detail compositions; no forced filler or silent replacement.
- Token switch confirmation and phone OS-keyboard cases: existing selector/forms supply appearance, while written focus/draft/safe-area/reflow rules need actual implementation evidence. A generated keyboard picture cannot prove behavior.

Use distinct statuses such as **illustrated reference**, **derivative reference** and **pending**. Do not silently relabel text-only template reuse as an independently generated image, finished source asset, or passing runtime/accessibility test.

## Bridge from guide images to the later build

Before claiming a full technical-art contract, prepare actual-source scale/contact samples for the 24×24 procedural rooster, selected facings, tall/face accessories and native item icon legibility. Use reproducible source compositing for the 30-accessory compatibility matrix, not image-generated guesses of those identities. Those exact-source checks are more useful than another palette or recolor round. Full timed playback, phone reflow, collision, AI/provider behavior and contract recovery remain implementation-stage evidence.
