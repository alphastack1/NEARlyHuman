# NEARlyHuman — Master Game Design

Status: revised design after twelve full-guide critiques; the owner has selected visual reference VR-01. The complete scene map has six review perspectives, corrections and targeted post-correction checks. The complete mockup-guide package is available: 99 boards/215 panels with every screen state and storyboard variant referenced. No game implementation, test passage or release approval is claimed.

Owner: Enzo Smith.

Prepared: October 31, 2026, using the Asia/Bangkok calendar.

Purpose: the master authority for product vision, rules, player experience, system boundaries, art process, validation, and release decisions. The companion [complete scene and interaction map](design/SCENE_MAP.md) owns the detailed UI/world inventory and mockup assignments; the [approved VR-01 reference](design/references/VR-01-approved-house-and-care.png) owns the selected visual direction.

The completed 84-answer questionnaire supplied by the owner is the product input for this draft.

The earlier conversation authorizes a sequence of research, questions, a comprehensive Markdown design, visual exploration, complete mockups, testnet implementation, mainnet release, and hackathon submission.

This draft belongs to the design stage of that sequence.

It contains no implementation code.

Proposed numbers are hypotheses for later simulation and playtesting.

An implementation agent may change implementation details to meet these outcomes.

An implementation agent must not silently change an owner decision or label an untested proposal as a proven result.

## Contents

- [1. Authority, terminology, and decision status](#1-authority-terminology-and-decision-status)
  - [1.1 How to use this document](#11-how-to-use-this-document)
  - [1.2 Three kinds of statement](#12-three-kinds-of-statement)
  - [1.3 Governing conflict resolutions](#13-governing-conflict-resolutions)
  - [1.4 Product vocabulary](#14-product-vocabulary)
  - [1.5 What is public and what is private](#15-what-is-public-and-what-is-private)
  - [1.6 What remains intentionally unsettled](#16-what-remains-intentionally-unsettled)
- [2. Vision, audience, and scope](#2-vision-audience-and-scope)
  - [2.1 One-sentence vision](#21-one-sentence-vision)
  - [2.2 Emotional promise](#22-emotional-promise)
  - [2.3 Audience](#23-audience)
  - [2.4 Three design pillars](#24-three-design-pillars)
  - [2.5 Primary success measure](#25-primary-success-measure)
  - [2.6 What makes the loop interesting](#26-what-makes-the-loop-interesting)
  - [2.7 Version-one scope](#27-version-one-scope)
  - [2.8 Explicit exclusions](#28-explicit-exclusions)
  - [2.9 Mainnet ambition and milestone discipline](#29-mainnet-ambition-and-milestone-discipline)
- [3. Player journeys](#3-player-journeys)
  - [3.1 First arrival](#31-first-arrival)
  - [3.2 Returning owner](#32-returning-owner)
  - [3.3 Mint journey](#33-mint-journey)
  - [3.4 Ordinary daily journey](#34-ordinary-daily-journey)
  - [3.5 A representative good day](#35-a-representative-good-day)
  - [3.6 A representative difficult day](#36-a-representative-difficult-day)
  - [3.7 Closing the tab during preparation](#37-closing-the-tab-during-preparation)
  - [3.8 Closing the tab during playback](#38-closing-the-tab-during-playback)
  - [3.9 Returning after months](#39-returning-after-months)
  - [3.10 Transfer journey](#310-transfer-journey)
  - [3.11 Death journey](#311-death-journey)
- [4. Clock, day phases, and canonical state](#4-clock-day-phases-and-canonical-state)
  - [4.1 Three separate times](#41-three-separate-times)
  - [4.2 Phase vocabulary](#42-phase-vocabulary)
  - [4.3 First-day accounting](#43-first-day-accounting)
  - [4.4 Ordinary-day accounting](#44-ordinary-day-accounting)
  - [4.5 Presentation versus truth](#45-presentation-versus-truth)
  - [4.6 Daily start constraints](#46-daily-start-constraints)
  - [4.7 No real-world daily limit](#47-no-real-world-daily-limit)
  - [4.8 Failure invariants](#48-failure-invariants)
  - [4.9 User-facing failure language](#49-user-facing-failure-language)
- [5. The rooster: identity, stats, needs, and progression](#5-the-rooster-identity-stats-needs-and-progression)
  - [5.1 Purpose and status of these rules](#51-purpose-and-status-of-these-rules)
  - [5.2 Permanent identity](#52-permanent-identity)
  - [5.3 Allocation stats](#53-allocation-stats)
  - [5.4 Personality without a second build system](#54-personality-without-a-second-build-system)
  - [5.5 Four needs and one health value](#55-four-needs-and-one-health-value)
  - [5.6 Initial state and daily provisioning](#56-initial-state-and-daily-provisioning)
  - [5.7 Proposed daily resource budget](#57-proposed-daily-resource-budget)
  - [5.8 Low needs and escalating consequences](#58-low-needs-and-escalating-consequences)
  - [5.9 Health, recovery, and level](#59-health-recovery-and-level)
  - [5.10 Care-design references](#510-care-design-references)
- [6. The home: generation, movement, and storage](#6-the-home-generation-movement-and-storage)
  - [6.1 A small stage with many circumstances](#61-a-small-stage-with-many-circumstances)
  - [6.2 Functional zones](#62-functional-zones)
  - [6.3 Generation inputs](#63-generation-inputs)
  - [6.4 Movement and activity destinations](#64-movement-and-activity-destinations)
  - [6.5 Morning mailbox collection](#65-morning-mailbox-collection)
  - [6.6 Supply quantities and storage semantics](#66-supply-quantities-and-storage-semantics)
  - [6.7 World objects differ from supplies](#67-world-objects-differ-from-supplies)
  - [6.8 Furniture arrangement](#68-furniture-arrangement)
  - [6.9 House conditions](#69-house-conditions)
  - [6.10 Tiny garden boundaries](#610-tiny-garden-boundaries)
- [7. The fifteen single-use supplies](#7-the-fifteen-single-use-supplies)
  - [7.1 Catalogue contract](#71-catalogue-contract)
  - [7.2 Shared consumption rules](#72-shared-consumption-rules)
  - [7.3 Water](#73-water)
  - [7.4 Milk](#74-milk)
  - [7.5 Bread](#75-bread)
  - [7.6 Steak](#76-steak)
  - [7.7 Medicine](#77-medicine)
  - [7.8 Coffee](#78-coffee)
  - [7.9 Wood](#79-wood)
  - [7.10 Hammer & Nails](#710-hammer--nails)
  - [7.11 Umbrella](#711-umbrella)
  - [7.12 Rose Seeds](#712-rose-seeds)
  - [7.13 Apple Seeds](#713-apple-seeds)
  - [7.14 Matches](#714-matches)
  - [7.15 Soap](#715-soap)
  - [7.16 Bandage](#716-bandage)
  - [7.17 Compost](#717-compost)
  - [7.18 Catalogue balance obligations](#718-catalogue-balance-obligations)
- [8. Activities, cooking, and gardening](#8-activities-cooking-and-gardening)
  - [8.1 Activity grammar](#81-activity-grammar)
  - [8.2 Home module activities](#82-home-module-activities)
  - [8.3 Kitchen module activities](#83-kitchen-module-activities)
  - [8.4 Initial recipe table](#84-initial-recipe-table)
  - [8.5 Garden & Leisure module activities](#85-garden--leisure-module-activities)
  - [8.6 Exact proposed garden progression](#86-exact-proposed-garden-progression)
  - [8.7 A coherent three-day garden example](#87-a-coherent-three-day-garden-example)
  - [8.8 Candidate quality and domestic variety](#88-candidate-quality-and-domestic-variety)
  - [8.9 Sixty decisions and a three-minute replay](#89-sixty-decisions-and-a-three-minute-replay)
  - [8.10 Example ordinary day](#810-example-ordinary-day)
- [9. The event director, danger, conditions, and death](#9-the-event-director-danger-conditions-and-death)
  - [9.1 Controlled variety](#91-controlled-variety)
  - [9.2 Reference lessons, with limited adoption](#92-reference-lessons-with-limited-adoption)
  - [9.3 Proposed daily incident budget](#93-proposed-daily-incident-budget)
  - [9.4 Event families](#94-event-families)
  - [9.5 Conditions and rescue deadlines](#95-conditions-and-rescue-deadlines)
  - [9.6 Fair warning within a precomputed day](#96-fair-warning-within-a-precomputed-day)
  - [9.7 Rare immediate death and black swans](#97-rare-immediate-death-and-black-swans)
  - [9.8 Lifespan balancing without forced expiry](#98-lifespan-balancing-without-forced-expiry)
  - [9.9 Death finalization](#99-death-finalization)
  - [9.10 Terminal states that are not death](#910-terminal-states-that-are-not-death)
  - [9.11 Content and tone boundaries](#911-content-and-tone-boundaries)
  - [9.12 Open gameplay validation gates](#912-open-gameplay-validation-gates)
- [10. Jev decision design and preparation](#10-jev-decision-design-and-preparation)
  - [10.1 What the model owns](#101-what-the-model-owns)
  - [10.2 What the rules own](#102-what-the-rules-own)
  - [10.3 Verified provider connection](#103-verified-provider-connection)
  - [10.4 Provider version policy](#104-provider-version-policy)
  - [10.5 Decision context](#105-decision-context)
  - [10.6 Candidate actions](#106-candidate-actions)
  - [10.7 Sequential preparation](#107-sequential-preparation)
  - [10.8 Decision budget](#108-decision-budget)
  - [10.9 Playback budget](#109-playback-budget)
  - [10.10 Expected preparation wait](#1010-expected-preparation-wait)
  - [10.11 Response validation](#1011-response-validation)
  - [10.12 Successful decision checkpoints](#1012-successful-decision-checkpoints)
  - [10.13 Terminal failure and player retry](#1013-terminal-failure-and-player-retry)
  - [10.14 Brain panel during preparation](#1014-brain-panel-during-preparation)
  - [10.15 Brain panel during playback](#1015-brain-panel-during-playback)
  - [10.16 Keeping the loop interesting](#1016-keeping-the-loop-interesting)
  - [10.17 Jev validation scenarios](#1017-jev-validation-scenarios)
  - [10.18 Complete-day reliability and behavior gate](#1018-complete-day-reliability-and-behavior-gate)
- [11. The NFT as an owned save state](#11-the-nft-as-an-owned-save-state)
  - [11.1 Purpose and authority](#111-purpose-and-authority)
  - [11.2 Ownership facts](#112-ownership-facts)
  - [11.3 Canonical current-state fields](#113-canonical-current-state-fields)
  - [11.4 Owned-save information boundary](#114-owned-save-information-boundary)
  - [11.5 Death preserves the collectible](#115-death-preserves-the-collectible)
  - [11.6 Metadata and marketplace presentation](#116-metadata-and-marketplace-presentation)
  - [11.7 Transfers and pending-day ownership](#117-transfers-and-pending-day-ownership)
- [12. The request, planning, settlement, and replay lifecycle](#12-the-request-planning-settlement-and-replay-lifecycle)
  - [12.1 The two-transaction day](#121-the-two-transaction-day)
  - [12.2 State-machine boundary](#122-state-machine-boundary)
  - [12.3 Request identity and immutable inputs](#123-request-identity-and-immutable-inputs)
  - [12.4 Fixed weak randomness](#124-fixed-weak-randomness)
  - [12.5 Funded admission, acceptance, and job creation](#125-funded-admission-acceptance-and-job-creation)
  - [12.6 Leases and concurrent execution](#126-leases-and-concurrent-execution)
  - [12.7 Sequential decision checkpoints](#127-sequential-decision-checkpoints)
  - [12.8 Result preparation and availability](#128-result-preparation-and-availability)
  - [12.9 Finalization and contract checks](#129-finalization-and-contract-checks)
  - [12.10 Ambiguous broadcasts and duplicate finalization](#1210-ambiguous-broadcasts-and-duplicate-finalization)
  - [12.11 Failed attempts, fresh transactions, and no deleted history](#1211-failed-attempts-fresh-transactions-and-no-deleted-history)
  - [12.12 Bounded expiry when the service disappears](#1212-bounded-expiry-when-the-service-disappears)
  - [12.13 Tab closure and returning owners](#1213-tab-closure-and-returning-owners)
  - [12.14 Confirmation level and reorganization reconciliation](#1214-confirmation-level-and-reorganization-reconciliation)
- [13. Versioned game modules](#13-versioned-game-modules)
  - [13.1 The module boundary](#131-the-module-boundary)
  - [13.2 Core responsibilities](#132-core-responsibilities)
  - [13.3 Home module](#133-home-module)
  - [13.4 Kitchen module](#134-kitchen-module)
  - [13.5 Garden & Leisure module](#135-garden--leisure-module)
  - [13.6 Shared state and effect contracts](#136-shared-state-and-effect-contracts)
  - [13.7 Version adoption](#137-version-adoption)
- [14. Mint pricing, daily fees, and the treasury](#14-mint-pricing-daily-fees-and-the-treasury)
  - [14.1 User decisions and economic limits](#141-user-decisions-and-economic-limits)
  - [14.2 ETH conversion for the mint](#142-eth-conversion-for-the-mint)
  - [14.3 The supplied Chainlink feed](#143-the-supplied-chainlink-feed)
  - [14.4 Daily gas-based quote semantics](#144-daily-gas-based-quote-semantics)
  - [14.5 The second transaction is an operating cost](#145-the-second-transaction-is-an-operating-cost)
  - [14.6 Jev cost arithmetic](#146-jev-cost-arithmetic)
  - [14.7 Netlify operating costs](#147-netlify-operating-costs)
  - [14.8 Treasury and separate balances](#148-treasury-and-separate-balances)
  - [14.9 Operating measurement and mainnet review](#149-operating-measurement-and-mainnet-review)
- [15. Hosting, durable jobs, budgets, and operational boundaries](#15-hosting-durable-jobs-budgets-and-operational-boundaries)
  - [15.1 Deployment principles](#151-deployment-principles)
  - [15.2 Researched host capabilities](#152-researched-host-capabilities)
  - [15.3 Proposed minimum hosting shape and endpoint boundaries](#153-proposed-minimum-hosting-shape-and-endpoint-boundaries)
  - [15.4 Durable records, retention, and restoration](#154-durable-records-retention-and-restoration)
  - [15.5 Lightweight background-worker option](#155-lightweight-background-worker-option)
  - [15.6 Durable-workflow alternative](#156-durable-workflow-alternative)
  - [15.7 Runtime and latency controls](#157-runtime-and-latency-controls)
  - [15.8 Admission and completion budgets](#158-admission-and-completion-budgets)
  - [15.9 Three-day testnet trial](#159-three-day-testnet-trial)
  - [15.10 Failure categories and user messages](#1510-failure-categories-and-user-messages)
  - [15.11 Secret handling and trusted-relay honesty](#1511-secret-handling-and-trusted-relay-honesty)
  - [15.12 Operations and deployment gates](#1512-operations-and-deployment-gates)
  - [15.13 Technical source notes and verification status](#1513-technical-source-notes-and-verification-status)
- [16. Single-square interface, journeys, and scene specification](#16-single-square-interface-journeys-and-scene-specification)
  - [16.1 Authority and presentation intent](#161-authority-and-presentation-intent)
  - [16.2 The square and its responsive behavior](#162-the-square-and-its-responsive-behavior)
  - [16.3 One house, several interface modes](#163-one-house-several-interface-modes)
  - [16.4 Entry and wallet journey](#164-entry-and-wallet-journey)
  - [16.5 Mint setup and confirmation](#165-mint-setup-and-confirmation)
  - [16.6 Birth and the automatic first day](#166-birth-and-the-automatic-first-day)
  - [16.7 Care menu and needs hierarchy](#167-care-menu-and-needs-hierarchy)
  - [16.8 Supply selection and the mailbox metaphor](#168-supply-selection-and-the-mailbox-metaphor)
  - [16.9 Honest request, inference, and settlement progress](#169-honest-request-inference-and-settlement-progress)
  - [16.10 Ready and replay](#1610-ready-and-replay)
  - [16.11 Summary, next day, and return visits](#1611-summary-next-day-and-return-visits)
  - [16.12 Death, memorial, and trial completion](#1612-death-memorial-and-trial-completion)
  - [16.13 Multiple NFTs, ownership, and transfers](#1613-multiple-nfts-ownership-and-transfers)
  - [16.14 Recovery and uncertainty rules](#1614-recovery-and-uncertainty-rules)
  - [16.15 Mockup identification and responsive evidence](#1615-mockup-identification-and-responsive-evidence)
  - [16.16 Entry, mint, and birth mockup inventory](#1616-entry-mint-and-birth-mockup-inventory)
  - [16.17 Care, selection, and processing mockup inventory](#1617-care-selection-and-processing-mockup-inventory)
  - [16.18 Replay, outcome, and exceptional-state mockup inventory](#1618-replay-outcome-and-exceptional-state-mockup-inventory)
  - [16.19 Interface acceptance criteria](#1619-interface-acceptance-criteria)
- [17. Visual direction, verified art, and asset preparation](#17-visual-direction-verified-art-and-asset-preparation)
  - [17.1 What is fixed and what remains open](#171-what-is-fixed-and-what-remains-open)
  - [17.2 Verified source asset inventory](#172-verified-source-asset-inventory)
  - [17.3 Existing rooster anatomy and variation](#173-existing-rooster-anatomy-and-variation)
  - [17.4 Existing animation capability and missing work](#174-existing-animation-capability-and-missing-work)
  - [17.5 Camera selection and exploration history](#175-camera-selection-and-exploration-history)
  - [17.6 Domestic environment and visual hierarchy](#176-domestic-environment-and-visual-hierarchy)
  - [17.7 Asset families and production inventory](#177-asset-families-and-production-inventory)
  - [17.8 Source provenance and license boundaries](#178-source-provenance-and-license-boundaries)
  - [17.9 Image exploration and selection workflow](#179-image-exploration-and-selection-workflow)
  - [17.10 Visual QA and acceptance](#1710-visual-qa-and-acceptance)
  - [17.11 Technical art contract and replay timing gate](#1711-technical-art-contract-and-replay-timing-gate)
- [18. Copy, audio, accessibility, and comprehension](#18-copy-audio-accessibility-and-comprehension)
  - [18.1 Voice and language principles](#181-voice-and-language-principles)
  - [18.2 The two-line message box](#182-the-two-line-message-box)
  - [18.3 Interface vocabulary and action labels](#183-interface-vocabulary-and-action-labels)
  - [18.4 Warning and error-copy requirements](#184-warning-and-error-copy-requirements)
  - [18.5 Authored content model](#185-authored-content-model)
  - [18.6 Audio direction and scope](#186-audio-direction-and-scope)
  - [18.7 Accessible input and focus](#187-accessible-input-and-focus)
  - [18.8 Motion, contrast, and timing](#188-motion-contrast-and-timing)
  - [18.9 Comprehension and accessibility verification](#189-comprehension-and-accessibility-verification)
- [19. Balance framework and evidence plan](#19-balance-framework-and-evidence-plan)
  - [19.1 Balance is a release outcome](#191-balance-is-a-release-outcome)
  - [19.2 What a fair game should communicate](#192-what-a-fair-game-should-communicate)
  - [19.3 Comparative care policies](#193-comparative-care-policies)
  - [19.4 Attribute allocation evaluation](#194-attribute-allocation-evaluation)
  - [19.5 Supply evaluation](#195-supply-evaluation)
  - [19.6 Event evaluation](#196-event-evaluation)
  - [19.7 Lifespan evaluation](#197-lifespan-evaluation)
  - [19.8 Story variety evaluation](#198-story-variety-evaluation)
  - [19.9 Testing cost discipline](#199-testing-cost-discipline)
  - [19.10 Balance report required before mainnet](#1910-balance-report-required-before-mainnet)
  - [19.11 Product-quality release disposition](#1911-product-quality-release-disposition)
- [20. Verification and acceptance criteria](#20-verification-and-acceptance-criteria)
  - [20.1 Product acceptance](#201-product-acceptance)
  - [20.2 Mint acceptance](#202-mint-acceptance)
  - [20.3 Daily request acceptance](#203-daily-request-acceptance)
  - [20.4 Worker acceptance](#204-worker-acceptance)
  - [20.5 Chain acceptance](#205-chain-acceptance)
  - [20.6 Playback acceptance](#206-playback-acceptance)
  - [20.7 Ownership acceptance](#207-ownership-acceptance)
  - [20.8 Cost acceptance](#208-cost-acceptance)
  - [20.9 UI acceptance](#209-ui-acceptance)
  - [20.10 Scope of testing](#2010-scope-of-testing)
  - [20.11 Small independent acceptance spine](#2011-small-independent-acceptance-spine)
  - [20.12 Repeatable small-screen interaction review](#2012-repeatable-small-screen-interaction-review)
- [21. Build and release sequence](#21-build-and-release-sequence)
  - [21.1 Stage A — design draft](#211-stage-a--design-draft)
  - [21.2 Stage B — visual direction](#212-stage-b--visual-direction)
  - [21.3 Stage C — focused visual refinement](#213-stage-c--focused-visual-refinement)
  - [21.4 Stage D — complete mockup map](#214-stage-d--complete-mockup-map)
  - [21.5 Stage E — deterministic foundation](#215-stage-e--deterministic-foundation)
  - [21.6 Stage F — live-AI testnet integration](#216-stage-f--live-ai-testnet-integration)
  - [21.7 Stage G — product hardening](#217-stage-g--product-hardening)
  - [21.8 Stage H — mainnet release](#218-stage-h--mainnet-release)
  - [21.9 Stage I — hackathon submission](#219-stage-i--hackathon-submission)
  - [21.10 Deployment discipline](#2110-deployment-discipline)
  - [21.11 Proposed dated solo critical path and contingency](#2111-proposed-dated-solo-critical-path-and-contingency)
- [22. Image-generation and mockup production plan](#22-image-generation-and-mockup-production-plan)
  - [22.1 Purpose of the images](#221-purpose-of-the-images)
  - [22.2 First comparison set](#222-first-comparison-set)
  - [22.3 What the comparison should test](#223-what-the-comparison-should-test)
  - [22.4 Refinement comparison](#224-refinement-comparison)
  - [22.5 Final mockup coverage](#225-final-mockup-coverage)
  - [22.6 Asset versus mockup boundaries](#226-asset-versus-mockup-boundaries)
  - [22.7 Permanent outputs](#227-permanent-outputs)
- [23. Hackathon positioning and submission readiness](#23-hackathon-positioning-and-submission-readiness)
  - [23.1 Proposed primary track](#231-proposed-primary-track)
  - [23.2 Fixed chain choice](#232-fixed-chain-choice)
  - [23.3 Event schedule](#233-event-schedule)
  - [23.4 Demonstration story](#234-demonstration-story)
  - [23.5 Submission materials](#235-submission-materials)
  - [23.6 Reuse boundary and public comparison evidence](#236-reuse-boundary-and-public-comparison-evidence)
  - [23.7 Final submission consent and uncertain-send recovery](#237-final-submission-consent-and-uncertain-send-recovery)
- [24. Decision register, risks, and owner review points](#24-decision-register-risks-and-owner-review-points)
  - [24.1 Decisions already settled](#241-decisions-already-settled)
  - [24.2 Concrete design proposals in this draft](#242-concrete-design-proposals-in-this-draft)
  - [24.3 Remaining visual review](#243-remaining-visual-review)
  - [24.4 Remaining technical verification](#244-remaining-technical-verification)
  - [24.5 Operating-cost risk](#245-operating-cost-risk)
  - [24.6 Preparation-wait risk](#246-preparation-wait-risk)
  - [24.7 Content-volume risk](#247-content-volume-risk)
  - [24.8 Availability risk](#248-availability-risk)
  - [24.9 What implementation agents may decide](#249-what-implementation-agents-may-decide)
  - [24.10 Milestone disposition](#2410-milestone-disposition)
  - [24.11 Twelve-perspective critique and correction register](#2411-twelve-perspective-critique-and-correction-register)
- [25. Sources, provenance, and requirement coverage](#25-sources-provenance-and-requirement-coverage)
  - [25.1 Source hierarchy](#251-source-hierarchy)
  - [25.2 Official technical references](#252-official-technical-references)
  - [25.3 Game-design references](#253-game-design-references)
  - [25.4 Local reuse provenance](#254-local-reuse-provenance)
  - [25.5 Questionnaire coverage](#255-questionnaire-coverage)
  - [25.6 Repository cleanliness](#256-repository-cleanliness)
  - [25.7 Completion of the planning artifact](#257-completion-of-the-planning-artifact)

## 1. Authority, terminology, and decision status

### 1.1 How to use this document

- Read the owner decisions before interpreting a suggested implementation.
- Read the day lifecycle before designing screens or contracts.
- Read the failure lifecycle before connecting paid services.
- Read the cost assumptions before exposing public trials.
- Read the art inventory before creating replacement rooster art.
- Read the visual approval process before producing the complete mockup set.
- Keep permanent design amendments in this document.
- Treat supplementary temporary research as disposable working material.
- Use the headings as references when discussing changes.
- Update affected sections together when a rule changes.

### 1.2 Three kinds of statement

**Owner decision** means a preference expressly provided in the conversation or completed questionnaire.

**Design proposal** means a concrete default selected to make the owner's intent implementable and reviewable.

Unless expressly identified as an owner decision or verified service fact, detailed mechanical, interface, storage, and architecture prescriptions in this draft are design proposals.

**Verification gate** means a claim that needs evidence before the corresponding release milestone.

These categories must remain distinct.

For example, the owner chose five allocation points.

The names and numerical effects of the three proposed attributes are design proposals.

Their balance is a verification gate.

### 1.3 Governing conflict resolutions

| Subject | Governing interpretation | Superseded idea |
| --- | --- | --- |
| Species | Procedurally generated roosters performing human domestic routines | Generic humanoid creatures |
| Clock | Only submitted game days advance life | Real-time hunger while absent |
| Daily structure | Generate, save, then replay a complete day | Live intervention during inference |
| Decisions | Approximately 60 meaningful decisions as an initial upper budget | Earlier tentative 20-call day |
| Death | Retain an unplayable NFT with dead metadata | Automatically burn the NFT |
| Supply intent | Player tries to help; the world provides danger | Owner sabotage as a central feature |
| Experience | One square game surface with contextual overlays | A collection of dashboard pages |
| Speech | Authored event lines | A second language model for dialogue |
| Failed inference | Record failed attempt; allow a fresh transaction; no refund | Deleting or rewinding the owner transaction |
| Processing fee | Developer-adjustable multiplier, initially ×2 | Permanently fixed multiplier |
| Social scope | Standard ownership transfer | Multiplayer relationships and breeding |
| Expansion | Versioned future behavior modules | Rebuilding the save contract for each feature |

The later no-absence-decay answer is decisive even though an earlier answer describes starvation after three real days.

The later precomputed-day answer is decisive even though an earlier answer suggests once-per-day intervention buttons.

The retained dead token answer is decisive even where an earlier sentence still says auto-burn.

### 1.4 Product vocabulary

- **Creature**: the individual rooster represented by one NFT.
- **NPC**: the same creature when discussing autonomous behavior.
- **Home**: the generated, bounded domestic environment attached to a creature.
- **Supply**: a single-use consumable or utility input.
- **Object**: a placed or persistent world element, which may have a finite life in game days.
- **Delivery**: up to three distinct supply units selected before an ordinary day; selecting none means use existing stores.
- **Game day**: one biological simulation unit that ends only when its complete living or fatal result is committed; failed service attempts do not complete it.
- **Preparation**: the actual offchain computation and sequential Jev requests.
- **Settlement**: the confirmed transaction that records the completed day.
- **Playback**: animation of the already settled day.
- **Day request**: the owner's transaction authorizing the selected delivery and one attempt at the next day.
- **Intended biological day**: the next uncommitted life-day number; it remains the same through failed or expired transaction attempts.
- **Request-attempt ID**: the operational identity of one accepted owner transaction; a fresh retry gets a new ID without advancing biological time.
- **Committed-day count**: the number of settled biological days, including a fatal day; Failed and Expired attempts add zero.
- **Level**: the number of whole biological days survived; a fatal day does not increase it.
- **Death day**: the biological day of a fatal committed result, distinct from request-attempt count.
- **Pending day**: an accepted request awaiting finalization or explicit release.
- **Memorial**: the retained token's permanent dead state and short life summary.
- **Module**: a versioned collection of bounded game behaviors and associated rules.
- **Treasury**: the contract-controlled destination for mint proceeds and quoted processing payments.
- **Relayer**: the service account permitted to submit completed days.

### 1.5 What is public and what is private

Ownership controls who can authorize play.

Ownership does not make a public blockchain's state secret.

The application will not provide public house spectating in version one.

A technically capable observer may still inspect contract data and transactions.

The product must never describe owner-only gameplay as private onchain storage.

The user does not need to understand this distinction to play normally.

### 1.6 What remains intentionally unsettled

- Final technical pixel scale, source-art facing/pose convention, typography metrics, and asset exports within the owner-selected top-down VR-01 direction.
- Final attribute effects and event probabilities.
- Measured preparation time at the chosen decision budget.
- Actual mainnet operating cost per completed day.
- Final ETH/USD feed selection, heartbeat, consumer-contract reads, and freshness configuration; dated proxy observations are recorded in chapter 14.
- Netlify plan and storage capabilities available to this project.
- Whether the chosen NEAR AI-only integration qualifies for the desired hackathon track.
- Marketplace indexing support on the chosen chain.
- Final production contract addresses.

These are explicit gates, not reasons to substitute a different product without discussion.

## 2. Vision, audience, and scope

### 2.1 One-sentence vision

Raise a strange little onchain rooster by supplying a few useful objects, then watch real AI decisions turn a predictable home into an unpredictable life.

### 2.2 Emotional promise

The player should feel responsible without having to micromanage.

The creature should feel autonomous without appearing arbitrary.

Its house should feel familiar while its days remain surprising.

Its survival should feel earned without requiring constant attendance.

Its death should feel final without erasing the collectible.

The comedy comes from a rooster attempting human routines with limited judgment.

The game should be affectionate toward its creature even when fate is unkind.

### 2.3 Audience

- Adults comfortable connecting an EVM wallet.
- Crypto users interested in a small, playful onchain experiment.
- Players who remember virtual pets, early life simulations, and handheld games.
- People curious about watching a model choose concrete actions.
- Viewers who enjoy telling a short story about an unexpected outcome.

The initial product is not a financial speculation interface.

NFT ownership gives the creature continuity and transferability.

The game loop must remain enjoyable without a secondary-market sale.

### 2.4 Three design pillars

**Streamlined.** One creature, one square, one daily delivery, one wallet confirmation, one saved result.

**Balanced.** Choices create understandable tradeoffs, and care matters more than exploiting one obvious best item.

**Dynamic.** State, supplies, personality, bounded events, and Jev choices combine into varied domestic stories.

Each proposed feature must justify its contribution to at least one pillar.

Features that weaken the other two pillars need a strong reason to exist.

### 2.5 Primary success measure

The player wants to keep the creature alive and increase its level.

Level measures completed days survived.

It does not measure real-world account age.

No maximum level is imposed merely to force turnover.

The approximate 30-game-day ordinary lifespan is a tuning aspiration.

It must not become a hidden scheduled death.

Long-lived creatures remain possible through good choices and favorable outcomes.

### 2.6 What makes the loop interesting

- The player chooses resources rather than a complete action script.
- An object has several possible contextual applications.
- Jev can select a sensible but unexpected application.
- The contract preserves the resulting state.
- A small condition today can change tomorrow's delivery priorities.
- Procedural appearance makes the creature recognizable.
- A stable home makes changing conditions legible.
- Authored reactions give mechanical outcomes personality.
- A bounded story director alternates strain and relief.
- Survival produces attachment without a real-world attendance obligation.

### 2.7 Version-one scope

- Connect an existing wallet on Robinhood Chain.
- Select testnet or mainnet in a deliberate network flow.
- Mint an independent rooster for approximately one dollar in ETH on mainnet.
- Give it a short name and allocate five attribute points.
- Reveal the creature and its generated home.
- Resolve its automatically authorized first day.
- Select up to three distinct supplies for each later day, or use stored supplies without a new delivery.
- Prepare a full day through NEAR AI/Jev.
- Save the completed result onchain.
- Replay the saved day in approximately three minutes.
- Inspect health, needs, conditions, level, and a compact brain trace.
- Transfer the NFT through standard ownership mechanisms.
- Retain a dead collectible with memorial metadata.
- Offer a bounded three-day testnet trial.

### 2.8 Explicit exclusions

- No public house visitor mode.
- No in-game marketplace.
- No leaderboards.
- No separate shop page.
- No paid furniture economy.
- No player chat with the NPC.
- No additional dialogue model.
- No click-to-rescue button during playback.
- No wall-clock daily streak.
- No offline death.
- No player-to-player gifts.
- No battles.
- No breeding or sexual interactions.
- No shared houses.
- No inheritance between newly minted creatures.
- No speculative token.
- No mandatory NEAR contract added behind the owner's stated chain choice.

Future modules may revisit some exclusions.

They do not belong in the launch backlog merely because they are possible.

### 2.9 Mainnet ambition and milestone discipline

Mainnet is the intended completed product.

Testnet is a required verification environment, not the final ambition.

The hackathon accepts testnet submissions, which provides a fallback if a release gate remains unresolved.

That fallback does not authorize silently lowering the mainnet goal.

The public game should feel complete within its small scope.

Completeness means reliable flows and meaningful variety rather than a large list of unfinished features.

## 3. Player journeys

### 3.1 First arrival

The visitor lands directly on the square game surface.

A dim domestic scene establishes the world.

A compact overlay introduces the premise and offers wallet connection.

There is no marketing page that must be dismissed before seeing the game.

The visitor can understand the main loop before paying.

The same overlay can offer the bounded testnet trial.

Network selection must be visible and comprehensible.

The game never creates a paid day solely because the visitor loads the page.

### 3.2 Returning owner

The application restores the last selected owned token when possible.

It checks current ownership rather than trusting a cached wallet list.

It restores any pending request before allowing another request.

It offers a saved unviewed day before a new day's delivery where appropriate.

It displays the next delivery only when the creature is alive and eligible.

A small inline selector handles multiple owned creatures.

The selector stays inside the existing overlay.

The owner does not navigate to a collection dashboard.

### 3.3 Mint journey

1. Connect wallet.
2. Confirm the intended network.
3. Open the mint state within the overlay.
4. Enter a valid name of no more than eight permitted characters.
5. Allocate all five attribute points.
6. Review the approximate dollar price and exact quoted ETH amount.
7. Confirm the wallet transaction.
8. Wait for the mint confirmation state.
9. See the birth reveal.
10. See actual first-day preparation progress.
11. Wait for the first day's save to be confirmed.
12. Start the saved playback.
13. Finish at either the next day's delivery or the memorial state.

Mint includes authorization for the first day's standardized starting inventory.

It does not require an extra ordinary-day wallet confirmation immediately afterward.

If the first preparation fails, the minted creature still exists.

If it is still active, the owner sees its existing progress.

If it is recorded Failed, the owner authorizes a fresh first-day attempt instead of paying to mint another creature.

The retry reuses the original starter stock and does not grant it again or add an ordinary three-item delivery.

### 3.4 Ordinary daily journey

1. Read the sleeping creature's current status.
2. Notice actionable warnings before choosing supplies.
3. Select up to three distinct supply types, or deliberately use existing stores.
4. Review delivery and the total estimated transaction cost.
5. Confirm one owner transaction.
6. See honest confirmation progress.
7. See actual Jev preparation progress.
8. Wait for final settlement.
9. Press Start Day.
10. Watch the completed day.
11. Return to the next meaningful state.

The supply selection is the principal player decision.

The player cannot edit that delivery after the confirmed request begins.

The delivery cannot change merely because the browser reconnects.

### 3.5 A representative good day

The status overlay shows low hydration and a damaged window with a drip.

The owner selects water, a toolkit, and bread.

The rooster collects its mailbox delivery.

Jev selects repairing the window before making breakfast.

The repair consumes the toolkit.

Later, the rooster uses some stored water for a thirsty plant instead of immediately drinking it.

Its next decisions reflect the reduced water supply and remaining hydration need.

An authored line acknowledges its unusual priorities.

The day settles with the rooster alive, the window repaired, and supplies changed.

Playback represents those same decisions and final state.

The story is an illustrative possibility, not a guaranteed sequence.

### 3.6 A representative difficult day

The creature begins with an untreated minor injury.

The delivery overlay makes the condition and its urgency visible.

The owner chooses a bandage among the available delivery slots.

Jev decides when to use it among legal opportunities; this is an uninfected wound, so medicine is not its substitute.

The condition may affect available activities before treatment.

Treatment has an explicit mechanical result.

If a condition requires next-day care, the end-of-day status preserves that warning.

No animated button can rescue a fatal outcome that has already settled.

### 3.7 Closing the tab during preparation

The owner can leave after the request is confirmed.

The backend job continues or remains resumable from durable checkpoints.

The next visit reads the same request and its status.

It does not authorize another day.

It does not pick a new seed.

It does not consume another delivery.

If the day settled while the owner was away, its latest playback is protected while it remains current and the service operates, under the canonical retention policy in section 15.4.

### 3.8 Closing the tab during playback

The game's canonical save is already complete.

Leaving cannot rescue the creature from an outcome.

Leaving cannot damage a surviving creature.

Local progress may resume the scene or restart the replay.

Either choice must reproduce the same completed day.

The next owner request is a separate deliberate action.

### 3.9 Returning after months

The creature has the same canonical needs and status as when last settled.

It has not accumulated hunger from real time.

Its level has not increased from inactivity.

Conditions expressed in remaining game days have not advanced.

The owner can resume play if the service is operational and the creature is alive.

### 3.10 Transfer journey

The transfer mechanism is standard NFT ownership transfer.

The receiving wallet inherits the canonical creature save.

The seller does not keep playable inventory in a separate account.

A pending day must settle or be released before transfer.

The new owner can select a new delivery after ownership changes.

Old cached authorization cannot control the transferred creature.

### 3.11 Death journey

The prepared day's outcome includes a final death state.

Settlement makes the creature unplayable.

Playback reaches the corresponding death event.

A short dedicated death presentation follows.

The token remains in the owner's wallet.

Its metadata identifies it as dead.

Its inactive house and unused supplies provide no reusable value.

A fresh mint is a separate creature with no inherited progress.

## 4. Clock, day phases, and canonical state

### 4.1 Three separate times

**Wall time** is the real calendar clock used for network operations, quotes, job leases, and service monitoring.

**Game time** advances only through accepted, completed game days.

**Playback time** is the presentation clock used to animate a completed result.

They must never be substituted for one another.

The timestamp used in weak randomness does not cause offline needs decay.

The replay's three-minute target does not imply the backend computes instantaneously.

### 4.2 Phase vocabulary

| Phase | Meaning | Player action |
| --- | --- | --- |
| Care ready | Alive, no active pending request | Choose supplies |
| Quoted | Delivery and cost estimate available | Confirm or revise |
| Awaiting wallet | Transaction confirmation requested | Approve or reject |
| Submitted | Transaction sent but not accepted as canonical | Wait or inspect transaction |
| Requested | Owner request confirmed | Observe or leave |
| Preparing | Jev decisions and rules are resolving sequentially | Observe or leave |
| Prepared | Complete valid result durably recorded offchain | Wait for settlement |
| Settling | Finalization transaction awaiting sufficient confirmation | Wait |
| Replay ready | Canonical result accepted, playback available | Start playback |
| Replaying | Completed result is being animated | Watch, mute, pause presentation, or skip |
| Care ready again | Alive result, next day eligible | Choose next delivery |
| Dead | Final memorial state | Inspect summary or mint a separate creature |
| Trial complete | Alive trial reached its allowance | Inspect summary or switch deliberately to mainnet |
| Recoverable | A transient job issue may be retried before a terminal failure | Observe or leave |
| Failed | Attempt recorded unsuccessful; previous complete save preserved | Submit a fresh transaction to try again |
| Released | Failed or expired request no longer blocks the token | Begin a new request under stated rules |
| Expiry available | Pending request is beyond its hard chain deadline | Release expired request through the wallet |
| Release submitted | Recovery transaction sent; its outcome is not yet confirmed | Check the same transaction before trying a new day |

Pause during replay pauses presentation only.

Care ready and replay ready identify different interface purposes.

After settlement, the chain may permit another day while the interface still offers the saved replay.

The client must require an explicit choice to finish or skip that presentation before offering its next delivery flow.

Playback availability never creates a new onchain transfer lock.

It never freezes an unresolved transaction.

It never changes a committed outcome.

### 4.3 First-day accounting

This section and section 1.4 define the counter meanings for every module, request, and interface.

The intended biological day equals committed-day count plus one while the creature is alive.

Each fresh accepted owner transaction receives a new request-attempt ID.

Operational attempts are history records, not biological days.

Committed-day count increases by one only for an accepted complete living or fatal result.

Level increases by one only for an accepted complete living result.

Death records the current intended biological day and makes future play ineligible.

Mint creates level zero.

The automatically authorized first simulation attempts day one.

Surviving that day increases level to one.

Dying during that day preserves level zero and records death on biological day one, regardless of how many operational attempts preceded settlement.

A three-day trial includes day one.

A trial that survives days one, two, and three ends alive at level three.

The trial cap is not a gameplay death.

### 4.4 Ordinary-day accounting

A request starts from the last complete save version.

A failed preparation does not increment level.

Neither an internal retry nor a fresh owner transaction for the same still-uncommitted biological day advances that day number.

Settlement accepts one result for one request and base version.

Survival increments level by exactly one.

Death records the intended biological day, adds one committed result, and does not claim it as a completed surviving day.

For example, a level-five creature with five committed days may have two Failed attempts for day six, then a surviving third attempt.

That produces three request-attempt records, six committed days, level six, and intended day seven.

If the third result is fatal instead, committed-day count becomes six, level stays five, and death day is six.

### 4.5 Presentation versus truth

The canonical save can already contain the day's final condition while the owner is watching the morning.

During replay, the HUD uses the replay snapshot at that moment.

It must not accidentally show tomorrow's health beside this morning's action.

Outside replay, the status overlay uses canonical state.

Debug or explorer views may expose the final result before the animation reaches it.

No promise of hidden future state is made on a public chain.

### 4.6 Daily start constraints

- Current wallet must own the token.
- The token must be alive.
- No other request may be pending for that token.
- The selected rules version must be supported.
- Trial allowance must remain where applicable.
- Service capacity must be available before accepting an avoidable paid request.
- The owner must select a legal delivery or use the standardized first-day delivery.
- The quote must match the token, request parameters, chain, and validity window.
- The canonical base version must still match.

### 4.7 No real-world daily limit

The owner may play successive game days in one sitting.

The word daily refers to the simulation unit.

It does not promise one request per calendar day.

Service quotas can limit throughput for reliability and budget.

Such quotas must be identified as capacity limits rather than hidden life rules.

### 4.8 Failure invariants

- No partial day becomes the canonical creature save.
- No confirmed transaction is described as deleted.
- No retry silently changes its preserved intended-day event seed; edited supplies or new model choices can still produce different outcomes.
- No browser disconnect loses the owner's accepted delivery.
- No second worker can settle an extra day for the same request.
- No playback control can reroll a recorded outcome.
- No infrastructure outage causes hunger or aging by itself.
- No retry claim promises refund of network fees that have already been spent.

### 4.9 User-facing failure language

Prefer a short explanation and one useful next action.

For a temporary provider issue, explain that preparation paused and the saved creature is safe.

An ordinary terminal AI failure is recorded as a failed attempt.

The owner may submit another transaction to try again.

The previous complete save remains unchanged.

No refund or transaction deletion flow is required.

Transient internal retries may occur within the bounded preparation budget before the attempt is declared failed.

If the failure-recording transaction itself cannot be sent, describe the attempt as awaiting failure confirmation rather than falsely claiming the chain recorded it.

Release the pending lock through the confirmed failure transition or the bounded onchain expiry transition described in chapter 12.

If the service cannot release a request, the recovery overlay reads the stored deadline directly from the chain and offers Release expired request once eligible.

That exceptional recovery operation costs its caller network gas but adds no treasury processing charge.

The normal one-confirmation claim applies to an already connected, correctly networked, successful ordinary day; recovery can require a release transaction followed by a fresh request transaction.

Do not expose leases, storage keys, provider routing, or nonce management in the ordinary flow.

Provide an optional transaction link for users who want to inspect it.

## 5. The rooster: identity, stats, needs, and progression

### 5.1 Purpose and status of these rules

The rooster is a small domestic creature trying to perform an ordinary human life. The player supplies possibilities; Jev chooses what the creature actually does. Survival is the objective, and personality makes survival entertaining.

The schedules, coefficients, condition profiles, catalogue, and action tables in chapters 5–9 are one coherent **design proposal**, not implemented or validated behavior. Their exact values make deterministic comparisons possible; they do not establish balance. Changes must update the rules version and affected examples together. The owner's approximately thirty-game-day ordinary lifespan remains a tuning aspiration, never an expiry date. A creature may survive far longer.

Nothing ages, spoils, grows, wears out, or dies while no biological game day advances. Operational Failed attempts, real-world absence, replay, and replay skipping advance none of these systems.

### 5.2 Permanent identity

Each NFT represents one independent rooster and home. Its name has at most eight permitted characters, under the single normalization/validation policy adopted for the interface and contract. Names are inert text, never instructions to the model or an influence on action availability.

Appearance derives from the mint seed and approved procedural rooster components. Art rarity is cosmetic in this proposal; a rare portrait grants no survival advantage. Identity records the birth seed/rules version, five-point allocation, and compact stable personality. Transfer preserves these fields and the current home/save. Tokens never share inventory or inherit supplies, furniture, or progress from a previous life.

### 5.3 Allocation stats

The proposed stats are Body, Wits, and Spirit. The owner allocates exactly five bonus points, each stat accepting zero through five. The suggested 2/2/1 distribution is an accessible default, not a claim of optimal play. Zero points means ordinary baseline competence: every rooster can eat, drink, rest, repair, cook, and garden. No essential action has a stat threshold. Allocation is permanent in v1; levels grant no additional points.

| Stat | Exact provisional eligible effect | Exclusions |
| --- | --- | --- |
| Body | Each point reduces an effect tagged physical damage by 2%, maximum 10% at five points | Metabolic deficit damage, biological illness/infection damage, inventory loss, and an explicitly terminal condition/death outcome |
| Wits | Each point adds two percentage points to an action tagged competence success, maximum ten additional points; the final chance is clamped to 1%–99% | Safe deterministic actions, weather/event selection, contamination exposure, raw-food illness, and black-swan probability |
| Spirit | Each point reduces an effect tagged morale loss by 2%, maximum 10%; routine phase morale loss is explicitly tagged | Energy/nutrition/hydration loss, positive morale recovery, and the model's returned choice/probability |

Physical accident profiles, competence activities, and morale losses are tagged in the action/event tables. Tags cannot be inferred after an outcome to favor a result. Body modifies the source's physical damage once; progression does not repeat the onset hit. Wits affects the rule-defined success roll, not the model's preference. Spirit is applied to each eligible negative effect, including each three-point phase loss.

Needs and health use hundredths of one point. Calculate each tagged effect, round it once to the nearest hundredth with ties away from zero, apply it, and clamp to 0.00–100.00. Modify the positive magnitude of damage/loss before deduction; these stat reductions do not reduce positive restoration. Displayed whole numbers never replace stored precision. For example, five Spirit points reduce a three-point phase loss to 2.70, not zero reduction through whole-number rounding; one Body point changes eight physical damage to 7.84. Do not round a day's summed losses instead of its six separate effects.

Test all **21 legal allocations** under matched seeds and care policies, including small-effect precision and terminal-death attribution. Comparable value over many lives is the goal, not identical formulas. If terminal deadlines bypass nearly all stat benefits or free recovery erases one stat's role, revise these proposed coefficients/roles before claiming parity. The coefficient table alone is not evidence of fair builds.

### 5.4 Personality without a second build system

Two proposed preference axes run cautious–curious and orderly–improvisational. The mint seed assigns compact stable values; the player spends no additional points. Personality can favor inspecting a newly damaged cooker, trying an approved meal, cleaning actual mess, or using a legal temporary repair. It cannot create stock, invent recipes, change costs, bypass a cooldown, or grant another use of a consumed input.

Jev receives these tendencies with current needs and urgency. Authored reactions express the recorded choice afterward; they are not private model reasoning. Personality comparison uses the same world state and offered action instances so a changed shortlist is not mistaken for a personality effect.

### 5.5 Four needs and one health value

Nutrition, hydration, energy, morale, and health each range from 0.00 to 100.00, with higher always better. Nutrition/hydration describe the body, not unopened stock. Energy describes immediate capacity; morale describes composure; health describes accumulated damage and recovery. A supplied item has no bodily effect until a legal action consumes it.

Health is not a routine fifth refill tax. Ordinary healthy days need no medicine. The care overlay exposes precise values, conditions, and relevant stock; the replay HUD uses that replay moment's state. Warning thresholds are nutrition/hydration at or below 30 and energy/morale at or below 20. Written warnings distinguish a low meter from a named lethal deadline.

### 5.6 Initial state and daily provisioning

The proposed birth state is 80 for each need and 100 health, with three bread units, three water units, and three different utility gifts drawn from toolkit, umbrella, soap, bandage, and compost. These are reserves, not daily refills or guaranteed uses. The reveal explains each gift; compost explicitly needs a later planting. If that dependency fails onboarding review, exclude compost from the starter pool without changing its catalogue role.

Mint authorizes day one using this stock. A fresh transaction after failed first-day preparation reuses the unchanged original state, adds no ordinary delivery, credits no second starter pack, and buys no second NFT.

On subsequent biological days the owner may select **zero to three distinct supply types**. Each selected type adds one whole unit. Zero means **Use stored supplies**; one or two are equally legal. This refines the proposed delivery rule while retaining three selection slots and removing compulsory filler. There are no duplicate types within a delivery. Unused stock persists after successful settlement; a Failed attempt credits none of its proposed delivery and consumes no canonical stock.

### 5.7 Proposed daily resource budget

A surviving day contains **60 logical slots, six phases of ten slots**. One accepted activity occupies one slot, including its travel and interaction. Mailbox collection/shelving is a deterministic prelude outside that clock; it credits the authorized delivery once in provisional state. Day one begins from already credited starter stock and adds no ordinary delivery. A slot with one legal meaningful action may resolve deterministically. If no useful choice exists, safe idle consumes one slot and zero energy. Decorative movement and an unchanged inspection are presentation, not extra paid choices.

Logical slot, successful Jev-choice count, and transmitted inference-attempt count are separate counters. A skipped call or retried call changes no slot duration. Roughly sixty meaningful sequential Jev choices remains the initial target/ceiling; a quiet day may buy fewer calls but still reaches all sixty slots. Death alone ends the biological day early. Operational failure commits none of its prefix.

| Phase | Slots; effect after final slot | Nutrition loss | Hydration loss | Morale loss before Spirit |
| --- | --- | --- | --- | --- |
| Dawn | 1–10; after 10 | 5 | 7 | 3 |
| Morning | 11–20; after 20 | 5 | 6 | 3 |
| Midday | 21–30; after 30 | 5 | 7 | 3 |
| Afternoon | 31–40; after 40 | 5 | 7 | 3 |
| Evening | 41–50; after 50 | 5 | 6 | 3 |
| Bedtime | 51–60; after 60 | 5 | 7 | 3 |
| Ordinary total | No additional daily subtraction | 30 | 40 | 18 |

Ordinary purposeful actions cost one energy. Repair, construction, and heavy fixture patching are strenuous and cost three. Small plot actions are ordinary. Rest costs no energy and restores twelve; baseline leisure costs one energy and restores ten morale. Safe idle/flavor costs zero. Energy cost is applied at action start, clamped at zero; a zero-energy rooster can still eat, drink, take medicine, idle, or use available rest/leisure. Strenuous actions require at least three energy and no Exhausted condition.

All rest variants share a rest counter/cooldown; all ordinary leisure variants share a leisure counter/cooldown. Each category allows at most **two uses per biological day**, with at least **ten slot indices between accepted uses**: use at slot 3 next becomes eligible at slot 13. Both reset at the next biological day's start, not after real-world time. Rest/leisure at their meter cap are ineligible. Chair leisure is an alternative within the same leisure allowance. A rose harvest is a consumed crop, not an extra free leisure use; coffee and meals also do not spend those free-use counters.

A living bedtime restores thirty-five energy once. With exhausted free-recovery allowances, safe idling to bedtime is legal; energy zero does not block every option or cause automatic death. Routine purposeful work is not compulsory merely to spend slots. These limits create a defined niche for coffee, comfort meals, and prepared garden rewards without removing baseline recovery.

The authoritative order is:

1. At slot entry, introduce any scheduled eligible episode, derive legal action instances and their currently possible failure categories, then resolve the selected action's energy cost, whole-unit consumption, success branch, immediate effects, and condition clearing/onset. Check health zero or an explicitly fatal result immediately.
2. After slots 10/20/30/40/50/60, apply that phase's three ordinary losses once, then deficit onset/reentry, followed by any episode response deadline due at that boundary. Check death after each effect. No separate daily total is subtracted.
3. After slot 60's phase processing, apply the exact bedtime condition suborder in section 9.5, then resolve due lethal condition deadlines. A treatment taken at slot 60 can clear its condition before these checks, subject to the final phase losses and the reentry rule.
4. If still alive, assess ordinary health-recovery eligibility using the pre-sleep state; apply the single sleep and eligible health recovery; process garden growth, dry-plot consequences, and world-object expiry once; then increment level and construct the final save.

Later growth, sleep, healing, or level gain cannot follow a terminal result. Replay never reapplies these effects. A sixty-slot trace with deterministic slots must have the same boundaries/cooldowns as an otherwise identical trace with paid choices.

### 5.8 Low needs and escalating consequences

Nutrition/hydration reaching zero at a phase checkpoint creates a Food deficit/Water deficit under the exact condition register in section 9.5. The onset hit is fifteen health per distinct episode, not once per phase. Rescue requires the corresponding need to rise above thirty; its deadline is the next biological day's bedtime. Clearing and reacquiring the deficit within the same day retains the original deadline and does not repeat onset damage.

Exhausted blocks strenuous actions and applies the documented precision-task penalty, not an unlisted death roll. Despondent supplies a visible low-mood context and documented precision penalty; a bounded sulk is optional and never a permanent refusal lock. Rest, leisure, suitable consumed supplies, and bedtime provide their listed recovery routes. No unavailable paid object is required merely to escape ordinary low mood. Candidate coverage must include all feasible urgent treatments and low-need recoveries; Jev may still select another legal action.

### 5.9 Health, recovery, and level

Ordinary bedtime recovery is five health if nutrition and hydration are each above thirty, pre-sleep energy is at least twenty, and no Serious wound, serious Illness, Infection, or unresolved Food/Water deficit remains. It caps at one hundred and is applied once. A condition clears only by its own register; restored health alone does not clear infection or a wound. Medicine targets illness/infection; bandage targets the wound. Neither treats missing food/water or revives death.

Level equals whole biological days survived, with no level cap or training tree. Birth is level zero. A rooster that survives day one becomes level one; a rooster that dies on day one remains level zero with death day one. At level ten, the next biological day is eleven even if several operational attempts fail before it settles. A fatal accepted day is a committed day but not another survived level. Replaying, transferring, reading metadata, or a Failed attempt increments none of these biological counters.

### 5.10 Care-design references

The design borrows only bounded lessons from the cited games: visible care needs and distinct medical treatment from [Tamagotchi's official manual](https://tamagotchi-official.com/manual/toy/uni/manual_03/Uni_WEB_IS_EN.pdf); useful activity costing fatigue and rest having a role from [Monster Rancher's official raising manual](https://www.koeitecmoamerica.com/manual/mrdx/mr1/en/2200.html). Their exact rules and finite lifespan are not adopted. These references are inspiration, not evidence that this proposal is balanced.

## 6. The home: generation, movement, and storage

### 6.1 A small stage with many circumstances

The connected home is the entire domestic stage. A fixed logical topology supports predictable reachability and a familiar setting; safe seeded decorations and mirrored arrangements supply individuality within the approved visual language. The owner selected the top-down handheld RPG direction and original Moss & Cream reference VR-01. The home is larger than the visible playfield: the camera follows the rooster through partial room crops, showing a useful activity area and adjoining route rather than most of the house at once. Art cannot choose collision or survival rules. Detailed zones, camera crops, dynamic fixtures and interaction coverage are in [design/SCENE_MAP.md](design/SCENE_MAP.md).

### 6.2 Functional zones

Six connected zones contain entrance/mailbox; kitchen/fridge/pantry/preparation surface/stove; living corner/base seat and free leisure object; sleeping corner/bed/utility cupboard; wash area; and tiny two-plot garden. Bed, basic leisure, safe food/drink access, and all essential routes exist in every starting home. Generated decor cannot block them. The wash area has a visibly limited cistern/dry tap: it supplies no free drinking or irrigation water.

The existing cooker has powered and temporary backup-heat modes. Wood plus matches can activate its backup mode when power is absent and the fixture itself is intact; there is no unshown second appliance. The bed and base leisure object cannot be permanently destroyed by the initial event set. The crafted chair is an optional improvement, not the only recovery route.

### 6.3 Generation inputs

The mint seed selects approved walls/floors, windows, textiles, harmless clutter, garden appearance, and validated safe furniture variants. The first baseline has no harmful starting house quirk or layout-based success modifier. A rare rug does not prevent fire; stats grant no extra floor area or stock. House identity persists after transfer/reload. Future rooms require a versioned change; v1 includes no garage, neighborhood, expansion purchase, or full placement editor.

### 6.4 Movement and activity destinations

An accepted action includes its logical destination and travel within its one slot. Fixed pathfinding animates the route without extra Jev calls, energy per tile, or accident rolls per frame. Changing camera distance/path length changes presentation only. A route failure may recover at its safe endpoint without replaying consumption or simulating a second accident.

Inspecting an unchanged fridge, walking aimlessly, or looking at an already supplied forecast is flavor. An inspection is a paid choice only when its approved row has a distinct current effect or newly changed context; v1 adds no hidden-knowledge subsystem to justify inspection loops. Tidy is legal only for actual minor mess. Rearrangement requires a real movable object and a different vacant approved anchor.

### 6.5 Morning mailbox collection

The deterministic prelude collects the authorized zero-to-three-unit delivery once and shelves it. An empty delivery produces no parcel or fictional three gifts; the rooster can simply begin from its stores. Food/drink go to pantry/fridge, treatment/soap to the cupboard, household materials to storage, and garden inputs to the shelf. These are location tags on one authoritative per-token inventory, not separate unsynchronized stores. Replaying collection credits nothing. Failed preparation discards all provisional effects, including that proposed delivery.

### 6.6 Supply quantities and storage semantics

One supply unit is one whole unopened catalogue input consumed once. Recipes atomically consume their stated units. There are no partial bottles or a retained hammer. Unused supplies persist across biological days and real-world absence; only an explicitly recorded action/event removes them.

The proposed numeric bound is **65,535 units per type**, with no small gameplay inventory cap or paid storage. A selected full type cannot receive a unit; validation/quoting excludes that addition before acceptance. Counts cannot overflow or be silently discarded. The owner can select fewer types or zero and continue using existing stock, including when every type is full. Display one grouped icon/count per type rather than individual bottles. No discard screen or new inventory-management economy is required.

Comfortable stockpiling is an accepted possible result of careful play; perpetual scarcity is not required. Balance reports must nevertheless show per-type inflow/consumption drift, unused stock, and delivery choices at roughly typical and long-tail ages. Compare repeated basic kits, adaptive care, and deliberate stockpiling. The delivery limit constrains new arrivals, not how many already owned units can legally be consumed in a day.

### 6.7 World objects differ from supplies

Consumed ingredients create only the listed output. Persistent outputs are separate from supply inventory, cannot be salvaged, and never regenerate ingredients. Every finite output counts its creation day: at the first living bedtime after creation, its remaining life decreases from the listed maximum by one; it is usable earlier that day and unusable once maintenance reaches zero. Absence, Failed attempts, and replay consume no lifetime. Repair clears damage, never resets age or exceeds the original maximum life.

| Output ID | Creation and logical target/maximum | Exact provisional benefit | Lifetime/expiry |
| --- | --- | --- | --- |
| chair | One wood + one toolkit; one optional living-corner chair at either of two validated anchors; maximum one chair | Its leisure variant restores 15 morale instead of baseline 10, using the same leisure cooldown/two-use allowance; damage disables that variant until repaired or bandage-braced | Five living bedtimes including creation day; no renewal by moving/repairing |
| garden_shelter | One wood + one toolkit; fixed garden shelter anchor; maximum one | Covers both plots; prevents the named weather soil-washout/plant-progress-loss consequence, but supplies no moisture or growth | Four living bedtimes including creation day |
| umbrella_plot | One umbrella; one named plot; maximum one per plot | Same eligible weather-loss prevention for that plot only; rain can still replenish its moisture | Three living bedtimes including creation day; do not offer redundant protection under an active garden shelter |
| wood_patch | One wood; damaged stove or window; maximum one per target | Temporarily makes the stove usable or prevents the targeted drip loss; patched stove competence tasks carry the stated precision penalty | Two living bedtimes including creation day; underlying damage returns to unmitigated effect when patch expires |
| bandage_brace | One bandage; damaged crafted chair only; maximum one | Restores its usable leisure variant temporarily; does not reset the chair's age or heal the rooster | Current living bedtime; cannot outlast chair expiry |
| drip_diversion | One umbrella or one bandage; the active minor window-drip episode/identified threatened stock | Prevents that episode's one recorded stock loss; does not repair the window | Ends with the episode, no later than current bedtime |
| window_brace | One toolkit; the damaged window threatened by an active forecast storm episode; maximum one for that episode | Prevents that episode's physical weather exposure and drip loss; does not repair underlying damage | One episode, no later than current bedtime |
| exposure_cover | One umbrella; current exposed weather response | Cancels that response's listed physical weather-exposure damage; not lightning or general immunity | Consumed in that one response; no persistent inventory umbrella |
| backup_heat | One wood + one matches; mode of the intact existing stove, maximum one | Enables heat-dependent recipes during power loss; grants no power to lights/fridge | Current bedtime |

The wooden shelter covers two plots while a single umbrella covers one; it is not merely a more expensive copy. The chair improves a bounded existing activity rather than adding a furniture stat. Building/replacing an identical active object is excluded. An expired object can be rebuilt later at normal full cost. No output creates a sixteenth stored supply.

### 6.8 Furniture arrangement

Bed, stove, and fridge stay at fixed reachable anchors. Jev can move the optional chair between its two safe anchors if the destination differs and is vacant. Movement changes neither benefits nor age and cannot trap the rooster or duplicate the object. Other output targets are fixed flags/anchors from the table, not arbitrary coordinates. Purely cosmetic repeated moves without changed context are flavor rather than paid candidate padding. Only one object occupies an exclusive anchor.

### 6.9 House conditions

The finite house register below is separate from bodily conditions in section 9.5. There are no unspecified severity levels, hidden attrition rolls, or additional flags inferred from artwork.

| House state | Allowed values and source | Exact effect and clearing |
| --- | --- | --- |
| Mess | 0, 1, or 2; named task/event outcomes add one, capped at two | At severity one, free tidy clears to zero. At two, precision tasks have the shared penalty; soap deep clean reduces two to one, then tidy can finish. Mess itself rolls no extra accident |
| Damaged fixture | Boolean per stove/window/crafted chair; named episode/failure only | Stove blocks heat recipes, window permits its episode's listed drip loss, chair blocks improved leisure. Toolkit repairs a selected fixture; relevant temporary outputs mitigate only their named target. Bed/base leisure stay usable |
| Power unavailable | Current-day episode flag | Powered heat is unavailable; intact cooker can use backup heat. Clears at current bedtime. A named episode may remove one identified milk unit; no implicit entire-fridge spoilage |
| Smoke/fire episode | Active source plus one response boundary and resolved/unresolved state | Uses section 9.4's single small-fire profile, not a per-slot damage process. Safe shutdown/water resolve its listed branches; residual smoke clears after its one boundary effect |
| Contaminated | The shared Contaminated condition with a surface/body target | Uses the sole onset/exposure/soap rules in section 9.5; artwork cannot create another illness roll |
| Sheltered/clean | Derived presentation labels | Sheltered derives from active protection outputs; clean means no mess/contamination. They are not independent bonuses or stacking counters |

Underlying damage persists until repaired, including when a patch temporarily masks it. An active target cannot receive duplicate overlapping patches. All damaging or apparently dirty visuals must correspond to this register or clearly harmless decoration. Each persistent state has a normal clearing path; none removes the only route to a basic survival action.

### 6.10 Tiny garden boundaries

There are exactly two reachable plots. Each holds one rose or apple planting, growth, moisture 0–2, a dry-day count 0–2 while immature, and a soil-blocked flag if a named garden incident caused it. These are the garden fields, not another currency/skill tree. The optional garden diversifies preparedness and gives use to useful rain; direct food remains available. Cartoon-fast apple growth is deliberate fiction, not horticultural realism. Exact growth, harvest, and empty-plot moisture maintenance are in section 8.6.

## 7. The fifteen single-use supplies

### 7.1 Catalogue contract

The proposed v1 catalogue contains exactly fifteen selectable types, all available without progression/rarity locks or an item currency. An ordinary delivery adds one unit of each selected type, zero to three distinct types. The player chooses inputs, not the NPC's action script. Poison is an environmental danger, not an owner-selectable sabotage item.

The following table is the authoritative direct-use/reward proposal. Compound recipes are defined only in section 8.4; protection outputs only in section 6.7. A phrase in narrative copy cannot create an additional supported use.

| Identifier; display name | Direct or primary effect | Other approved context/action family |
| --- | --- | --- |
| water; Water | Drink: +50 hydration | Water one plot; eligible small-fire response; no water-based meal in this initial set |
| milk; Milk | Drink: +25 nutrition, +30 hydration | Comfort bowl/milk coffee; hungry-visitor distraction |
| bread; Bread | Eat: +40 nutrition | Toast/comfort bowl/steak sandwich; seed-eater diversion |
| steak; Steak | Cook under recipe table; risky raw use: +45 nutrition, 25% mild-Illness exposure roll | Steak sandwich; hungry-visitor diversion |
| medicine; Medicine | Clear one targeted Illness or Infection, +15 health | Mild/serious illness and established infection are distinct valid treatment targets, not universal prevention |
| coffee; Coffee | Quick drink: +20 energy, +5 morale, Jitters | Quiet ritual or milk coffee under recipe table; useful after free rest allowance is spent |
| wood; Wood | Temporary fixture patch under output table | Chair/garden shelter; backup heat with matches |
| toolkit; Hammer & Nails | Repair one damaged eligible fixture, restoring its undamaged state on success | Chair/shelter construction; episode-bound window bracing |
| umbrella; Umbrella | Protect one exposed weather response | One-plot shelter; active minor-drip diversion |
| rose_seeds; Rose Seeds | Plant one rose; later harvest: +35 morale and clear Despondent | Seed-eating-pest diversion; no scent-manufacturing context |
| apple_seeds; Apple Seeds | Plant one apple; later harvest: +80 nutrition | Seed-eating-pest diversion; can receive compost but never manufacture it |
| matches; Matches | Ignite backup heat with wood on the intact existing stove | No garden burning/undefined waste-cleanup activity in v1 |
| soap; Soap | Clear one Contaminated target; body wash additionally +5 morale | Reduce serious mess by one level; no hidden water ingredient |
| bandage; Bandage | Clear the one current Minor/Serious wound, +15 health | Current minor-drip patch or one-day damaged-chair brace |
| compost; Compost | Add one pending bonus growth increment to one occupied plot | Restore one soil-blocked plot instead; no simultaneous fertilizer bonus |

These are fictional bounded game effects, not advice about real food safety, treatment, animals, or fire. Restore values cap at one hundred and visible excess is wasted. The NPC's choice context states costs and relevant consequences before it chooses.

### 7.2 Shared consumption rules

One item means one whole unit. A started activity removes every named ingredient atomically even if its competence roll fails; precondition failure before starting consumes nothing and must have been filtered out before inference. Recipes grant only their own effects, never those effects plus each ingredient's direct-use reward. A created output is not a reusable supply. No milk/bread unit can both feed the rooster and become bait. No stored cooked meal, apple fruit, rose cutting, or other sixteenth catalogue unit is generated.

An exact action instance binds family, target, variant, and costs before Jev sees it. Success/failure draws and danger allowances use fixed labeled random positions; renderer frames and optional probability telemetry do not create rolls. An already exhausted/expired protection flag cannot be consumed twice.

### 7.3 Water

Drinking, watering a named occupied plot, and suppressing an eligible non-electrical small fire are distinct choices. Electrical fire is not an approved initial event; water cannot be improvised as its answer. One bottle cannot drink, irrigate both plots, and fight fire. There is no free tap and no water-based recipe in the initial approved table. Garden use while hydration is critical is an explicit tradeoff, not a hidden extra benefit.

### 7.4 Milk

Milk flexibly covers two needs but is weaker than specialist direct supplies for either. It can relieve a mixed low state or join a comfort recipe after free leisure is exhausted. Its exact direct restoration does not by itself clear either deficit from zero: both require above thirty. Unopened milk has no offline spoilage. A named power/contamination event may remove one identified unit; it is then absent from healthy stock, not secretly a hazardous normal milk unit. V1 offers no spoiled-milk meal.

### 7.5 Bread

Bread is the reliable no-roll food available even with a damaged/unpowered cooker. Toast gives up some nutrition for immediate morale; combined meals have their own declared rewards. Bread used as pest bait supplies no nutrition. Only named event losses remove stored bread; there is no pantry attrition roll per slot or real-world day.

### 7.6 Steak

Cooked steak trades a competence roll and working heat for stronger food. Raw steak is an explicitly risky emergency alternative; its biological exposure chance is not modified by Wits or hidden as a routine safe action. Raw use is absent on protected day one. A failed cook spends the steak and uses the shared failure/danger rule, not an independent catastrophe at every animation beat. Steak sandwich spends raw steak plus bread in one immediate recipe; there is no separate stored cooked-steak prerequisite.

### 7.7 Medicine

One dose treats one exact Illness or Infection target. It can clear serious illness or established infection without treating a remaining wound. An infected serious wound may therefore need both medicine and bandage. A dose has no preventive all-day immunity, cannot clean the house, and cannot cure missing food/water. With no eligible condition, it is excluded rather than offered as a free health refill. Restoring health does not erase a still-active deadline.

### 7.8 Coffee

Coffee and its rituals consume one unit and apply Jitters until current bedtime. The condition's finite precision penalty is defined in section 9.5, not guessed per recipe. Coffee can restore energy after two free rests have been used or while rest is on cooldown. It does not add slots, another day, or more inference allowance. Available basic rest remains an understandable alternative when time/allowance permits.

### 7.9 Wood

Wood is one material bundle, never individually reusable planks. It can patch an eligible fixture, combine with toolkit for one output, or combine with matches to activate existing-stove backup heat until bedtime. These uses have distinct targets, costs, and outcomes. A patch reduces a current restriction rather than granting permanent structural immunity.

### 7.10 Hammer & Nails

The displayed Hammer & Nails is a single-use toolkit. Parts are installed/exhausted; no permanent hammer remains. Repair clears damage on one selected target, construction creates the one selected output, and storm bracing protects its one episode. Competence failure spends the kit and cannot duplicate ingredients or leave an invisible successful repair. Fixing a near-expiry chair restores function without renewing its age.

### 7.11 Umbrella

An umbrella is committed to one protection task. A one-plot shelter differs from a wooden two-plot shelter; weather exposure cover differs from a window repair. Its limited protection does not prevent lightning, starvation, all accidents, or damage to an unrelated target. No supply-inventory umbrella durability meter is introduced.

### 7.12 Rose Seeds

One packet plants one empty plot; a rose matures after two eligible growth increments. Its later harvest is a consumed prepared reward outside the ordinary leisure allowance, making it useful when free leisure is exhausted or Despondent must clear despite that cooldown. Planting gives no immediate morale or water. Harvest consumes the planting and returns the plot to empty. An indoor decorative variant, if drawn, shares these same two plots and rules; it adds no third plot. Alternate pest use is only an explicitly seed-eating pest.

### 7.13 Apple Seeds

One packet plants a cartoon apple shrub maturing after three growth increments. Harvest consumes the plant and immediately nourishes the rooster without a stove or competence roll. Rain-assisted growth and prepared food on a later constrained delivery are its intended niches; it is not an infinite orchard. Seeds used as bait produce no plant. Compost fertilizes an existing planting; Apple Seeds never turn into free Compost.

### 7.14 Matches

Matches plus wood provide backup cooking heat during power loss on an intact cooker. Normal powered cooking needs no matches. A failed ignition spends both inputs and follows the shared danger allowance; it does not attack the rooster directly. The undefined garden-cleanup/burning context is excluded rather than introducing a new waste condition merely to give matches a second use. One clear ordinary niche is preferable to invented catalogue breadth.

### 7.15 Soap

Soap wipes one contaminated surface or cleans a contaminated body, or reduces serious mess under the house register. The baseline packet includes its own damp wipe: no unspent tap water is implied. Ordinary minor mess still has free tidying. Soap cannot cure established illness/infection, heal a wound, repair an appliance, or suppress an unrelated fire. Exposure clearing and disease treatment are separate actions.

### 7.16 Bandage

A bandage treats the one current eligible wound. It does not cure Illness or Infection; an infected wound keeps the infection deadline until medicine treats it. The same unit can instead patch the active minor drip or brace a damaged chair for the current day, with no bodily healing. Urgent medical use must be offered when feasible even if an attractive non-medical use exists. Jev chooses the actual application.

### 7.17 Compost

Compost is a damp garden-support packet. Fertilization queues one extra growth increment at the next otherwise eligible wet boundary, never an immediate harvest and never multiple pending bonuses. Soil restoration clears the one plot's soil-blocked state instead of also fertilizing it. There is no house/electrical-fire response or undefined soil-smolder context in the initial event set. These two ordinary garden uses provide the niche without a new hazard subsystem.

### 7.18 Catalogue balance obligations

Every advertised use must map to the finite action matrix in section 8.4 and one reachable target state. Do not force two uses through arbitrary fiction; remove unsupported promises. The catalogue has no recipe chain longer than two supplied ingredients. The basic water/bread/appropriate-utility kit remains viable, while milk, meals, coffee, garden preparation, repair, and responsive medicine have stated situational roles.

Balance evidence compares supply units, energy, slots, delay, risk, and immediate/retained benefit against the safe alternative. Record neglected items and comfortable stockpiles honestly. A charming but inefficient choice may remain an explicitly accepted story tradeoff; counting different animations is not proof of survival utility. Section 19's product-quality review must dispose any dominant loop or useless retained item before release.

## 8. Activities, cooking, and gardening

### 8.1 Activity grammar

An approved activity defines target, variant, prerequisites, whole-unit inputs, slot/energy costs, bounded effects, random branches, and presentation family. Each offered **action instance** freezes those fields and a unique criterion key before inference. Jev selects that instance; the worker cannot later change its plot, wound, fixture, anchor, or ingredient interpretation. Chapter 10 defines the exact adapter and immutable decision configuration.

Every matrix row below occupies one logical slot, including travel. Its energy class is ordinary (one), strenuous (three), or zero. Effects are applied sequentially to provisional state; the next choice sees that updated state. All sixty slots and resulting state settle before playback. No animation, authored line, or live button creates another choice or modifies the settled result.

### 8.2 Home module activities

Home supplies consumption/treatment, bounded rest/leisure, real tidying/deep cleaning, repair, protection, and optional chair movement. Mailbox shelving, unchanged inspection, ordinary looking outside, and decorative motion are presentation steps with no paid call. A newly changed fixture can be described in context without inventing a hidden-knowledge meter. Emergency candidates may replace low-priority chores; they may not hide another due rescue.

Base rest and leisure remain available without a crafted chair or planted garden. Exhaustion does not remove ordinary consumption/treatment or safe idle. A tidy candidate needs severity-one mess; a repair needs actual damaged state. A previously consumed supply or expired output creates no candidate.

### 8.3 Kitchen module activities

Safe bread/water/milk consumption has no random failure. Heat-dependent cooking requires a powered or backup-heated intact/patched cooker and an uncontaminated preparation surface. Compound meals are prepared and consumed in the same slot, leaving no new stored meal type. The intact existing stove supplies powered heat without matches; power loss makes its wood-and-matches mode relevant.

The competence profiles below are provisional. Toast/comfort bowl start at 95%; steak/sandwich, repair, construction, wood patch, and backup ignition at 90%; shoo starts at 75%. Wits adds its stated percentage points; eligible precision penalties then subtract, and the final competence chance clamps to 1%–99%. Wits saturation at the cap must be reported in the 21-allocation comparison. Deterministic success is not passed through that clamp.

Jitters, Exhausted, severity-two Mess, and a patched stove each contribute a five-percentage-point penalty to tagged precision tasks, with a combined penalty capped at ten points. Despondent contributes the same penalty to precision tasks while active, also inside that combined cap. Precision tasks are toast, cook steak, comfort bowl, sandwich, repair, construct, wood patch, and backup ignition. Shoo is competence-based but not precision-based. Drinking, treatment, leisure, gardening, and deterministic protection receive no invented precision roll.

On a failed cooking/build/repair/patch/ignition competence task, started ingredients are spent and intended success benefits are absent. The default failure adds one Mess, capped at two. A fixed 25% conditional branch on that failed task may instead use the sole available harmful-minor allowance: comfort bowl causes Contaminated preparation surface, backup ignition uses the small-fire profile, and other tagged tasks cause Minor wound with eight physical source damage. Failed shoo has its own body-contact branch in H19. A new active fire requires at least two subsequent logical slots before its response boundary; otherwise that branch is ineligible. After the minor allowance is spent, cooking/build/repair/patch/ignition failure produces spent inputs/bounded mess only. These eligible outcomes and resulting success odds must be represented honestly in the candidate context, including when late tasks have a reduced harm set. There is no secret promise that a risky label has an unchanged risk all day.

### 8.4 Initial recipe table

Recipes grant only their own row's immediate reward. Health/need clamping and all input spending follow sections 5.3 and 7.2. The recipe table is the authoritative place for compound-meal values.

| Action family / recipe | Supplies | Prerequisites | Exact provisional success | Failure profile; presentation family |
| --- | --- | --- | --- | --- |
| K01 Toast | One bread | Working heat; clean preparation | +35 nutrition, +8 morale | 95% precision competence; shared task failure; cook/eat |
| K02 Cook steak | One steak | Working heat; clean preparation | +65 nutrition, +6 morale | 90% precision competence; shared task failure; cook/eat |
| K03 Comfort bowl | One milk + one bread | Clean preparation; no heat required | +50 nutrition, +20 hydration, +20 morale | 95% precision competence; shared task failure; prepare/eat |
| K04 Steak sandwich | One raw steak + one bread | Working heat; clean preparation | +80 nutrition, +20 morale | 90% precision competence; shared task failure; cook/eat |
| K05 Coffee ritual | One coffee | Safe preparation spot | +10 energy, +15 morale, Jitters | Deterministic; drink/reaction |
| K06 Milk coffee | One coffee + one milk | Safe preparation spot | +20 energy, +15 hydration, +15 morale, Jitters | Deterministic; drink/reaction |
| K07 Raw steak | One steak | Emergency nutrition warning; no safe direct/ready food candidate; not day one | +45 nutrition; 25% biological exposure to mild Illness only if harmful-minor allowance remains | Not a competence roll; exposure consumes minor allowance if it occurs; eat/risk |

The finite matrix below covers all other promised uses. Target/variant alternatives are separate immutable instances, not arbitrary arguments supplied by a model. A table reference imports its exact result and failure profile. All rows require a living rooster, reachable target, sufficient stock, and applicable cooldown/output capacity. No absent action can be improvised from an evocative item description.

| Family ID | Target/context and exact inputs | Effect / failure contract | Energy; animation/message family |
| --- | --- | --- | --- |
| H01 Direct consumption | Water, milk, bread, or quick-coffee variant at household store; one selected unit | Exact direct effect in 7.1; deterministic; quick coffee applies Jitters | Ordinary; consume/drink |
| H02 Treat condition | One medicine for one Illness/Infection target, or one bandage for the current wound; cupboard/body | Clear that targeted condition and its future progression, +15 health; no unrelated condition clearing | Ordinary; treat/recovery |
| H03 Rest | Bed/base seat; no supplies; energy below cap; shared rest allowance | +12 energy; deterministic; one rest use/cooldown | Zero; rest |
| H04 Leisure | Base leisure object/garden view or usable crafted chair; no supplies; morale below cap | Base/view +10 morale, chair +15; same two-use leisure allowance/cooldown; clear Despondent when morale becomes positive | Ordinary; relax |
| H05 Tidy | Actual severity-one Mess; no supplies | Mess one→zero; deterministic | Ordinary; clean |
| H06 Deep clean | Severity-two Mess; one soap | Mess two→one; deterministic; does not also clear Contaminated | Ordinary; deep-clean |
| H07 Wipe/wash | One named Contaminated surface/body; one soap | Clear that exposure; body variant also +5 morale; no established disease cure | Ordinary; wipe/wash |
| H08 Repair | One damaged stove/window/chair; one toolkit | 90% precision competence: clear selected damage; chair age unchanged; shared task failure | Strenuous; repair |
| H09 Construct | Empty chair anchor or vacant garden-shelter anchor; one wood + one toolkit | 90% precision competence: create exact output in 6.7; shared task failure; no duplicate active object | Strenuous; build |
| H10 Wood patch | Unpatched damaged stove/window; one wood | 90% precision competence: create target's two-day patch; shared task failure | Strenuous; patch |
| H11 Chair brace | Damaged unexpired crafted chair without brace; one bandage | Deterministic current-day chair mitigation under 6.7; no healing | Ordinary; brace |
| H12 Window brace | Damaged window named by active storm forecast; one toolkit | Deterministically prevent this episode's exposure/drip loss, without permanent repair | Strenuous; brace |
| H13 Divert drip | Active minor drip/identified threatened stock; one umbrella or one bandage | Deterministically prevent its one scheduled stock loss; leave underlying window damage | Ordinary; divert/patch |
| H14 Exposure cover | Current exposed weather response; one umbrella | Deterministically cancel that response's named physical exposure damage; no other immunity | Ordinary; cover |
| H15 Backup heat | Intact existing unpowered stove without active backup; one wood + one matches | 90% precision competence: backup_heat until bedtime; shared task failure, eligible small-fire branch | Strenuous; ignite |
| H16 Suppress small fire | Active eligible non-electrical small fire/residual smoke; one water | Deterministically resolve fire and residual smoke; stop its scheduled harm; no electrical-fire variant in v1 | Ordinary; extinguish |
| H17 Safe shutdown | Active stove/fire episode with reachable cutoff; no supplies | Deterministically isolate heat/power and end active flame; residual smoke's single five-physical-damage boundary effect remains unless H16 clears it | Ordinary; shutdown |
| H18 Pest diversion | Active seed-eater: one bread/rose_seeds/apple_seeds; active hungry visitor: one milk/steak | Deterministically end that episode and prevent its recorded loss; grant no consumption/plant benefit | Ordinary; lure |
| H19 Shoo | Active pest; no supplies; at most one attempt per episode | 75% non-precision competence: end episode on success. Failure leaves its existing consequence scheduled; if minor allowance remains, a separate 25% contact branch creates Contaminated body, otherwise no new harm | Ordinary; shoo |
| G01 Plant | Empty unblocked plot; one rose_seeds or apple_seeds | Deterministic planting at growth zero; retains plot's actual moisture; no immediate reward | Ordinary; plant |
| G02 Water plot | One occupied plot; one water | Set its moisture to two, never add uncapped reserve | Ordinary; water |
| G03 Fertilize | One immature unblocked occupied plot with no pending bonus; one compost | Queue one bonus growth increment for next eligible wet boundary | Ordinary; fertilize |
| G04 Restore soil | One soil-blocked plot, occupied or empty; one compost | Clear soil block; no simultaneous growth bonus or moisture | Ordinary; soil-care |
| G05 Harvest | One mature planting; no new supply | Consume plant; rose's 7.1 reward or apple's 7.1 reward immediately; empty plot afterward | Ordinary; harvest/eat/enjoy |
| G06 Plot shelter | One uncovered named plot; one umbrella | Create umbrella_plot under 6.7; exclude redundant wooden-shelter coverage | Ordinary; shelter |
| G07 Abandon planting | One unwanted occupied plot; no supplies | Remove planting/pending bonus with no reward/salvage; soil block if present remains | Ordinary; clear-plot |
| H20 Rearrange chair | Existing movable chair; different vacant approved anchor; no supplies; at most once per day | Move same object, age/damage unchanged; offer only for a changed useful scene context, otherwise flavor | Strenuous; move |
| T01 Safe idle | No useful candidate, or an offered legal quiet alternative; no supplies | Advance one slot, no need benefit, no new roll; flavor may vary without another call | Zero; idle |

Every listed presentation family needs an authored literal fallback matching the receipt before extra jokes are written. The matrix deliberately excludes Apple Seeds→Compost, scent manufacture, free water, garden burning, and arbitrary food combinations. Missing cosmetic content may use a presentation fallback; missing mechanical definitions cannot receive an invented favorable outcome.

### 8.5 Garden & Leisure module activities

Plant, water, fertilize, restore soil, harvest, shelter, and abandon select one exact plot. Leisure may use the garden view without a plant and shares its allowance with indoor leisure. Plot inspection cannot grant growth or manufacture a paid choice. Crops and temporary shelter are bounded world state, not an inventory of accumulating fruit or a new skill economy.

### 8.6 Exact proposed garden progression

Each plot's moisture ranges zero to two. Watering sets two; useful rain sets two once for its explicitly covered plots, including empty plots. At the living bedtime garden boundary:

1. An immature occupied plot is eligible for ordinary growth only if moisture is positive and soil is not blocked. It gains one growth increment, plus its one pending compost bonus if present; that bonus then clears. A dry or blocked plot receives no growth and does not consume its pending bonus.
2. Moisture decreases by one if positive, including on empty/mature plots. Empty wet soil therefore retains only a limited reserve for later planting, not infinite stored rain.
3. An immature plot with no moisture at boundary entry records one dry day; two consecutive dry boundaries wilt and remove its planting/bonus. A wet boundary resets dry days even if soil-blocked. A mature planting does not wilt merely for dry soil; an explicit garden/pest episode may still affect it.
4. A rose matures at two total increments; an apple at three. Growth clamps to maturity. A planting that matured at this boundary is harvestable only during a later biological day, not through an unrecorded post-settlement action. Maintenance grants no harvest reward.

New planting resets its dry-day count and growth; abandoning/wilting clears planting/bonus but not a documented soil block. Mature crops persist until harvested/abandoned or a named event removes them. Neither absence nor replay advances growth, dryness, soil problems, or shelter age.

### 8.7 A coherent three-day garden example

On biological day D, the owner supplies a rose packet and water if those are not already stored; the third delivery slot may remain empty. The rooster plants and waters a plot. At bedtime it reaches growth one/moisture one. Day D+1 needs no new irrigation: it reaches growth two/moisture zero and appears ready in the finalized care overlay. On D+2, Jev may harvest it for its specified immediate morale/Despondent reward, without consuming seed or water again. If it declines, the mature rose remains.

That preparation is useful when the two free leisure uses have already been spent or a serious mood setback exceeds their recovery. Direct leisure is better for an ordinary immediate small deficit when its allowance is free. A rain-assisted apple needs fewer new water units and provides no-heat, no-roll food on a later day while current delivery slots are reserved for water/treatment. Dry-weather apple cultivation deliberately costs more input units than basic bread for the same nutrition scale; do not advertise it as the universally efficient food. Its niches are preparedness, useful rain, different loss exposure from pantry stock, and the larger immediate harvest. Compare it with storing bread as well as cooking steak; retain that tradeoff only if evidence finds the garden worth its complexity.

Comfort bowl/sandwich trade some specialist nutrition/hydration efficiency for immediate morale beyond the free leisure allowance; toast and coffee rituals offer smaller versions of that trade. A recently built chair improves the same bounded leisure opportunity, while a rose is consumed outside that opportunity count. None is required for a baseline home to recover mood.

### 8.8 Candidate quality and domestic variety

Chapter 10.6 owns the exact versioned shortlist policy: normally three to five instances, hard maximum sixteen, earliest-deadline priority with stable ties, and at least one useful feasible response for every urgent condition/critical need while eligible. Include a larger bounded list when necessary rather than omitting a rescue to preserve a nominal five-candidate layout. Interchangeable food or recipe variants do not all need mandatory inclusion; their selected representative must genuinely address the need from current state.

Add meaningful routine/contextual alternatives after that coverage floor. Never force treatment, replace a legal risky choice, or invent a confidence threshold to obtain a nicer outcome. Record offered instances so candidate omission is distinguishable from Jev's actual refusal. Use recent actions and deterministic cooldown/allowance counters to exclude purposeless loops. Names and free text do not change availability. When only one meaningful legal action exists, deterministic resolution is permitted under the clock; when none exists, T01 fills the slot. Do not buy repeated unchanged inspections to manufacture sixty calls.

### 8.9 Sixty decisions and a three-minute replay

Sixty logical slots and approximately sixty meaningful sequential choices are distinct. No surviving quiet day skips phase metabolism, sleep, rescue checks, or maintenance because it needed fewer calls. Retry buys another attempt at the same unresolved slot, not more time to act. A biological death stops all later slots; an operational failure commits none of them.

The ordinary replay targets about 180 seconds, independent of inference latency. Mailbox, travel, interaction, reaction, and bedtime fit the selected presentation timing families; grouped visual beats retain every mechanical receipt/slot index. Reading holds, pause, and reduced motion may extend presentation wall time without changing the save. Chapter 18 owns that timing/readability contract. Playback starts only after the complete result settles and can be skipped/viewed as a saved outcome without another AI call or signature.

### 8.10 Example ordinary day

A rooster with low hydration and a damaged window begins with stored bread and a bandage. Its owner selects water and a toolkit, leaving the third slot empty. The prelude credits those two units once. At a genuine choice, Jev may drink before using the toolkit to repair the window. A later storm can then be harmless at that fixture and useful to its planted apple. If repair fails, the spent kit and exact allowed failure branch are recorded; a remaining bandage may divert the current drip, or the NPC can accept that episode's listed loss. There is no guaranteed script.

Later choices can include a bounded rest, cooking, garden work, actual cleaning, or leisure. Empty portions of the logical schedule use honest idle rather than fake Jev work. Slot 60 and its boundary apply the documented order once. The final save preserves unused stock, conditions, plot state, output ages, and the correct survived-day level. The replay expresses those same actions and consequences with short authored lines.

## 9. The event director, danger, conditions, and death

### 9.1 Controlled variety

The director creates circumstances; Jev chooses responses. Seeded eligible profiles, current stock/home state, and bounded conditions produce stories without model-invented numerical laws. An empty plot loses no nonexistent harvest, a repaired fixture carries no stale damage, and cosmetic frames add no gameplay rolls. Important trouble needs a visible response window, with ordinary life and relief around it.

The initial register below supplies concrete profiles. Family selection weights, phase-selection weights, and the healthy black-swan daily rate are **named unselected release parameters**. No unspecified number may silently become a released probability. Freeze them in the rules package before population balance experiments or live release; unresolved values require an explicit disposition at the quality gate. The roughly thirty-day target is not permission to invent a fatal distribution now.

### 9.2 Reference lessons, with limited adoption

The useful lessons are visible setbacks affecting later choices from [PEAK's developer-published description](https://store.steampowered.com/app/3527290/PEAK/), alternation of danger and recovery from [RimWorld's publisher feature overview](https://rimworld.double11.com/features), and legible fatigue/illness consequences from [Monster Rancher's official events manual](https://www.koeitecmoamerica.com/manual/mrdx/mr1/en/2400.html). NEARlyHuman adopts none of their combat scale, colony systems, or forced finite-life rules. These are design references, not measured validation of this director.

### 9.3 Proposed daily incident budget

This is the single danger-accounting contract for director and activity branches. The daily record identifies the source and allowance used by every mechanical consequence.

| Source | Daily allowance and classification | Outcome when allowance/eligibility is unavailable |
| --- | --- | --- |
| Primary episode | At most one selected family/profile; it can be quiet, beneficial, or harmful | Use eligible quiet/relief profile if no ordinary harmful profile passes feasibility; never draw another hidden primary |
| New harmful minor complication | At most one total across director variants, task failures, raw-food exposure, and any other new minor source; causally tied to the primary episode **or the actually selected task**, even if its family differs | Task failure may spend inputs and add capped Mess only; no additional wound, fire, infection, lethal deadline, or independent harmful event |
| Existing-condition progression and need deficits | Only the finite deterministic/checkpoint effects in 9.5; separately attributed scheduled consequences, not permission for additional director rolls | No unlisted damage/progression or repeats per slot; exposure checks use their one documented daily limit |
| Healthy-rooster black swan | One separately labeled daily check at most, excluded on day one; named rare exception under 9.7 | Never inserted inside every movement/rest/recipe; no substitute ad hoc catastrophic roll |
| Ambient flavor | No danger allowance; zero mechanical harm | Different words, sounds, particles, or camera timing add no random draws |

A primary storm and one cooking-related burn are permitted; four unrelated fresh crises are not. Once the minor allowance is used, subsequent competence failures disclose resource/mess-only branches. Candidate generation must reflect the actual current eligible outcome set and final success chance; the cap is not hidden immunity under an unchanged risk label. A valid model choice is never rerolled to improve its outcome.

A task-generated minor can occur before the scheduled primary; it still occupies the one daily minor allowance and can affect that primary's eligibility/response. Task failure, source physical damage, and condition onset must not each charge the same event again. The primary profile's own listed multi-effect consequence is one episode, not extra independent rolls. Compare aggregate exposures, harm, and cause-of-death attribution as well as the headline episode count.

### 9.4 Event families

A primary profile enters at the start of one of the first five phases, leaving that phase's ten slots for response; it does not first appear after slot 60. The exact phase is a fixed seeded rules parameter. Its one response boundary is the end of that phase unless the row says otherwise. A task-generated small fire uses the end of the current phase if at least two subsequent slots remain before that boundary, otherwise the next phase boundary if at least two slots remain before it and it is no later than slot 60. If neither exists, that fire branch is ineligible. No unresolved fire persists through an unspecified offline timer.

| Family / initial profile | Eligibility and exact provisional consequence | Approved response / lasting result |
| --- | --- | --- |
| Weather / rain at the window | Rain sets plot moisture to two once. With an unmitigated damaged window, its response boundary deals twelve physical weather exposure damage and removes one identified stored water if present; otherwise useful rain only | Repair/wood patch/window brace prevent both effects; umbrella exposure cover prevents only the damage; umbrella/bandage drip diversion prevents only stock loss. Damage remains until repaired |
| Kitchen / small stove flare | Eligible active heat or the permitted task-ignition branch; active fire blocks cooking. If unresolved at its boundary, twenty physical source damage creates/merges Serious wound and Mess rises one, then the automatic cutoff ends the flame | Water resolves eligible non-electrical flame/smoke; safe shutdown ends flame but leaves one five-physical-damage residual-smoke boundary effect unless water then clears it. No ongoing fire remains after that one boundary. Electrical fire is excluded from this initial set |
| Power / short outage | Power unavailable until bedtime; one identified milk unit is removed if present, once on onset | Safe cold food or backup heat on the intact existing stove; no implicit total-fridge spoilage or random illness |
| Pests / seed-eater or hungry visitor | Fix target and bait-compatible pest variant at onset. At response boundary, lose one growth increment from the targeted immature plot (minimum zero), or one identified pantry food unit; choose the single target/loss at onset | H18 compatible diversion or one H19 shoo attempt. No nonexistent target loss or new infection from a failed shoo |
| House / fixture break | Mark one eligible stove/window/chair damaged; no separate bodily damage | Toolkit repair or the named temporary patch/brace; safe bread/rest/base leisure remain legal |
| Body / minor mishap | Eight physical source damage and the one Minor wound state | Bandage or its exact natural-recovery route; low-strain choices and rest can support that route |
| Illness / named sickness | Ten biological onset damage and mild Illness | One medicine targets it; rest helps energy but is not an undocumented cure |
| Mood / domestic disappointment | Twenty morale loss, tagged for Spirit; Despondent begins only if morale reaches zero | Available leisure, a prepared rose, or an approved comfort recipe |
| Garden / soil washout | One occupied plot becomes soil-blocked, stopping future growth until restored; no automatic plant death or new health effect | Active shelter prevents the effect; compost restores soil. Water alone does not remove the block |
| Fortune / quiet or useful rain | No harmful consequence; useful-rain variant sets plot moisture to two once | Ordinary preparation and breathing room; grants no free catalogue unit or rare asset |

These profiles are the initial approved numerical outcomes, not a complete authored joke library. Repeated variants may change target, eligible timing, and text only within their declared mechanical profile. New severities/branches require a versioned profile and the same danger/feasibility checks, not improvised prose. The director does not choose an unavoidable ordinary onset hit that immediately kills an otherwise unwarned low-health rooster with no legal prior response; use a harmless/lower eligible profile or the explicitly separate rare-severe exception.

### 9.5 Conditions and rescue deadlines

The finite bodily/exposure register contains Food deficit, Water deficit, Exhausted, Despondent, one Wound with Minor/Serious severity, Illness with mild/serious severity, Infection, Jitters, and Contaminated targets. A severity is not another simultaneously stacked wound/illness. Each record includes kind/target, onset biological day, severity, source-effect identity, exact due day if any, and the bounded counters needed below. House Mess/damage/power/smoke/protection uses section 6.9, not a second bodily condition interpretation.

Default deadlines are absolute biological-day numbers, resolved at the named day's bedtime after its final phase effects and scheduled progression, before sleep/healing. A deadline D+1 means the owner sees it after day D and has day D+1's legal slots to respond. The ordinary feasibility rule in 9.6 may choose a single later due day for a **new** condition when explicitly permitted; that exact due day is stored/shown from onset. It never silently postpones an already warned condition because Jev refused treatment.

| Condition | Onset / once-only immediate effect | Scheduled progression and clearing | Stacking/reentry / terminal rule |
| --- | --- | --- | --- |
| Food deficit | Nutrition zero at a phase checkpoint; fifteen metabolic health damage, not Body-eligible | Raise nutrition above thirty by a legal action to resolve; default due bedtime D+1 | One episode per need; reentry rules below; unresolved at due bedtime is terminal starvation |
| Water deficit | Hydration zero at a phase checkpoint; fifteen metabolic health damage, not Body-eligible | Raise hydration above thirty; default due bedtime D+1 | Same episode policy; unresolved at due bedtime is terminal dehydration |
| Exhausted | Energy zero; no automatic health damage | Strenuous actions blocked; five-point precision penalty; clear as soon as energy becomes positive through rest/coffee/meal/sleep | One derived condition; warning at twenty remains separate; no direct terminal result |
| Despondent | Morale zero; no automatic health damage | Five-point precision penalty; visible mood/idle flavor, no forced refusal loop; clear when morale becomes positive or a rose explicitly clears it | One derived condition; ordinary leisure remains a legal path when its allowance is available; no direct terminal result |
| Minor wound | Source profile's eight physical damage; no second condition-onset subtraction | Bandage clears. At bedtime of onset day+1, clear naturally if no Infection and nutrition/hydration each above thirty and pre-sleep energy at least twenty; otherwise progress to Serious wound without another hit, default due the following bedtime | One aggregate Wound, highest severity/earliest deadline. Natural clearing grants no separate health bonus; ordinary five-health recovery can apply if eligible |
| Serious wound | A declared source profile's twenty physical damage if directly caused; progression from Minor adds no extra onset damage | Bandage clears wound and grants its listed treatment healing; medicine alone does not clear it. No natural clearing | Default due bedtime D+1 after direct onset; after progression use the stored following-day deadline. Untreated at due bedtime is terminal wound complication |
| Illness, mild | Named sickness/raw-food/contamination exposure: ten biological damage once | At each untreated bedtime, energy burden five. At bedtime of onset day+1, progress to serious with no extra health hit; use ten energy burden at that and later serious bedtimes. Medicine clears either severity | One Illness instance; severity progression does not reset onset. Serious gets default due bedtime onset day+2, terminal illness if untreated then; no unstated natural cure |
| Infection | Specified contaminated-wound exposure: ten biological damage once | Ten energy burden at untreated bedtimes; medicine clears infection, bandage alone does not. Removing the wound leaves established Infection | One Infection; default due bedtime D+1, terminal infection if untreated. No natural cure |
| Jitters | Any coffee variant; no damage on onset | Five-point precision penalty inside shared ten-point penalty cap; clear at current bedtime's scheduled-condition processing | Refreshing coffee does not stack penalty or extend beyond current bedtime; no direct terminal result |
| Contaminated | Failed comfort bowl may contaminate the preparation surface; failed shoo contact may contaminate the body, each under the minor allowance; no immediate health hit | Soap H07 clears one exact target. First exposure eligibility is bedtime of onset day+1, giving a visible next-day cleanup window. With any eligible target still present, make **one combined 25% exposure check per biological day**, not one per target/phase/action. A successful check creates Infection if a wound is present, otherwise mild Illness; no second hit if that disease already exists | At most those two targets. Existing disease persists after soap. Exposure/progression is separately attributed and shown as a known ongoing risk, not a fresh hidden director catastrophe |

Bedtime condition processing has this fixed suborder after the final phase/episode effects: first the one eligible Contaminated exposure check; second Illness severity progression and the once-per-condition Illness/Infection energy burdens; third Minor wound natural recovery or severity progression using the resulting pre-sleep energy; fourth Jitters clearing and derived Exhausted/Despondent updates; fifth due lethal-deadline resolution. Check health zero immediately after any health effect and stop. At a bedtime with mild Illness newly progressing, apply the resulting serious ten-energy burden instead of also applying five; never both. Separate Illness and Infection can each apply their named energy burden once.

The contamination check can trigger only its listed branch. If that disease is already active, no repeat onset hit or fresh deadline occurs; keep the existing onset/deadline. An eligible exposure is one whose target began before the current biological day; a newly acquired target never damages through an exposure check that same bedtime. This grants no additional director roll beyond the one documented ongoing-condition pathway. Ordinary newly created serious consequences still pass 9.6; an explicitly warned unresolved exposure can have the documented consequence of earlier ignored care. If multiple unresolved lethal deadlines are due together, record all due contributing kinds and use stable primary-cause order Food deficit, Water deficit, Wound, Illness, Infection; one terminal transition occurs, with no later recovery.

A newly resolved non-derived condition retains a same-day tombstone in the day's bounded receipt/state until bedtime. If the same kind/target is reacquired before that bedtime, reactivate the same episode with its original earliest deadline and no second onset hit. This prevents clearing/reacquiring at the final boundary from buying another day. After a living bedtime with it resolved, discard the tombstone; a later biological day's new onset is a new episode with its own one-time hit. Wound severity merging never creates two wound cards or two bandage requirements, and never resets an older deadline. A distinct later accepted incident may deal its explicitly listed physical source damage once even if a wound already exists; that is source damage, not repeated onset damage from merely retaining the condition.

For example, a deficit due on day seven that is cleared at slot five of day seven but returns to zero at that day's final phase boundary is due **that bedtime**, not day eight. Medicine on an Infection clears that episode; a remaining Contaminated target is still a separately disclosed exposure source and can reenter under the same earliest-deadline rule. A bandage clears the wound without secretly clearing Infection, and medicine clears Infection without secretly clearing the wound. No health recovery or later action resurrects an already terminal result.

### 9.6 Fair warning within a precomputed day

The owner cannot intervene after authorization. The ordinary-harm eligibility check covers new serious deadlines **and** stock loss, fixture restrictions, exposure, and progression that could destroy an otherwise offered rescue path.

For deadlines due in the already authorized current day, use only the actual fixed delivery, current accessible stock, remaining logical slots, fixtures, and cooldowns. Do not assume the player can edit that accepted kit or receive tomorrow's supplies early.

For a newly introduced next-day deadline, evaluate the complete due bundle against remaining accessible stock plus a legal next delivery of zero-to-three distinct one-unit additions, with actual treatment order, thresholds, fixture prerequisites, and final-boundary reentry. A two-dose requirement cannot assume two copies of one type arrive in that delivery; existing stored copies may satisfy it.

When an unwarned ordinary world consequence would turn a currently feasible required rescue into an impossible one, select a lower/resource-safe consequence or quiet eligible variant instead. This check does not force a treatment, postpone an older deadline, or undo a knowingly chosen risky use/refusal; prior ignored warnings, disclosed voluntary risks, and named rare-severe exceptions remain the causal exceptions described below.

For a newly introduced ordinary consequence that would create an unwarned impossible bundle, choose a nonlethal/lower-severity eligible result first, or assign that new deadline one additional biological day if a concrete feasible schedule then exists. Record and show the exact chosen due day from onset. If neither works, omit that harmful branch and use its resource/mess or quiet fallback. Do not alter an older warned deadline, fabricate medicine, expand the delivery, or secretly force Jev's treatment. The same eligibility principle prevents a newly generated ordinary active fire from leaving no remaining legal response opportunity.

This guarantee concerns a feasible offered path, not a guaranteed outcome. Previously ignored written warnings, failure to supply a known treatment, a legal Jev refusal/risky choice despite offered alternatives, and an explicitly named rare severe exception can still yield an unwinnable/fatal state. Record that causal distinction. Harmless grouping of three visible cards is an interface choice, not a mechanical condition cap or proof of rescue feasibility.

Acceptance fixtures must include zero nutrition/hydration with no useful stock plus an infected serious wound. Bread, water, medicine, and bandage require four distinct new types; one milk does not meet either above-thirty deficit-clearing rule from zero. The ordinary director must show the lower/staggered condition path that prevents this **unwarned** bundle, or the recorded earlier ignored warning/accepted exception that permits it. Another fixture needs separate Illness and Infection with only one new medicine unit available. A third has enough stock but a late treatment slot: chapter 10.6's candidate policy must offer a useful response before its due boundary. A nominal unavailable recipe is not a rescue path.

Add a current-day witness: Food deficit is due at today's bedtime, nutrition starts at twenty, the only food is one milk, and the owner validly selects no delivery. Drinking that milk at slot one raises nutrition to forty-five, clears the deficit, and leaves fifteen after the six phase drains with no reentry. An unwarned slot-one power-loss consequence must not remove that sole milk before the offered rescue; use the outage without that loss or another lower eligible result. No future delivery, forced drink, or deadline extension is the repair.

The delivery overlay states condition, exact due biological day, consequence, relevant stored stock, and useful supply class. Jev receives the same urgency facts. Supplied bandage for a wound and supplied medicine for infection are different cases. All currently required useful responses follow the mandatory coverage floor in 10.6; the returned legal choice remains authoritative, including refusal. Record candidate omission separately from model refusal and from inability caused by the owner's kit.

### 9.7 Rare immediate death and black swans

Rare severe accidents and a named healthy-rooster black swan remain permitted owner direction. The initial named exception is a **freak structural accident**, checked once at the entry to slot 31 if alive and beyond day one, with its separately configured rare daily probability. It may affect a healthy rooster; it is not a separate check inside every slot, frame, or recipe. It directly produces the recorded terminal cause rather than pretending Body, medicine, or a replay button can prevent it. Its released probability must be selected, measured separately, and explicitly disposed at the product-quality review; none is claimed established here.

Protected day one excludes this exception, unsafe raw food, and ignition branches with unavoidable fatal outcomes. Its primary/condition set must have a legal survival path from the starter state. Ordinary health-zero consequences still resolve immediately under the global rule; no later bedtime healing can reverse them. A critical previously warned wound plus a chosen risk differs from a healthy unpreventable exception and receives a different cause attribution. No event targets another NFT, spends treasury funds, creates an obligation to real money, or changes ownership.

### 9.8 Lifespan balancing without forced expiry

The working proposal is a roughly thirty-game-day **median for documented representative routine care**, pending owner review of measured results. Mean, median, long-tail spread, censoring, and cause distributions must be reported distinctly. No individual has an assigned death day, hidden mint-time expiry, mandatory age damage, or rising level-only catastrophe chance to force turnover.

Compare attentive, routine, experimenting, poor, random, and deliberate-stockpile policies; include all 21 allocations and sufficiently long tails. Comfortable prepared lives are acceptable. Separate deterministic policy outcomes from observed genuine-Jev behavior: a scripted policy's median is not the shipped model's measured population lifespan. Attribute deaths to unmet provisioning/ignored warning, valid model refusal despite supplied/offered rescue, ordinary activity damage, scheduled condition progression, and unavoidable named exceptions. Report treatment availability and actual choices, not just final causes.

As a scale check only, an independent constant daily lethal chance of about 2.284% would alone produce a thirty-day median. That arithmetic is **not** the proposed black-swan rate or evidence of this game's survival. It illustrates why tuning the median by independent fatal noise could overwhelm meaningful care. The full incident/exposure accounting, stockpile behavior, and stat saturation must inform the product review rather than a single target number.

### 9.9 Death finalization

Health zero or a due explicit terminal condition ends the biological simulation immediately. Stop later actions, losses, paid calls, sleep, healing, growth, and lifetime maintenance. Finalization accepts the terminal save once, records biological death day/cause and the existing survived-day level, and disables future gameplay for that NFT.

The token remains in its owner's wallet with dead metadata; there is no automatic burn. A brief special death presentation follows the recorded event. Its house/inventory become inactive and cannot be salvaged, sold as separate inputs, inherited, or transferred into another home. The dead NFT remains an ordinarily transferable memorial if token rules permit, with its dead state preserved. A fresh mint is an isolated new life. Historic chain data does not disappear merely because the product stops rendering an active house.

### 9.10 Terminal states that are not death

The testnet allowance remains three committed biological days including the automatic first. A terminal biological day counts toward the allowance; an operational Failed attempt does not. Reaching the cap alive displays Trial complete, retains the actual alive state, and invents no cause of death. Transfer/replay does not reset allowance. Separate wallet/global operating budgets count all admitted attempts and spent/uncertain work under chapters 14–15; a capacity pause is not fake trial completion.

Terminal AI failure preserves the last complete canonical needs, health, inventory, garden, object ages, conditions/deadlines, level, and next intended biological day. It does not credit the failed delivery. A fresh owner transaction has a new attempt ID but targets the same next uncommitted day and preserved intended-day seed under chapter 12. The prior transaction remains recorded; no refund or deletion is implied. First-day retry adds no new gifts and requires no new mint. Host/provider absence never creates background biological decay.

### 9.11 Content and tone boundaries

The tone is affectionate dark domestic comedy. Serious harm gets a clear literal consequence before a joke. Authored lines cannot imply a live player rescue, a model choice absent from the receipt, a healing effect absent from the table, or a real-world countdown. Narrative variations change wording, never mechanical rules or the recorded cause. Only birth and death receive special cinematics; other milestones use the home scene and existing pose/effect families.

### 9.12 Open gameplay validation gates

The amended plan supplies complete provisional clocks, condition transitions, costs, and output functions; it does not claim tests ran. Before release:

- Hand-review independent expected traces for all sixty slot boundaries, a rest/leisure cooldown, deterministic omitted calls, early death, condition reentry, and creation-day object expiry.
- Verify each advertised catalogue use reaches an exact matrix row/target and no input/reward is duplicated. Compare garden/comfort/chair niches with direct safe alternatives, including the two free-use limits and wet/dry garden cases.
- Verify the shared incident allowance with a primary storm, one allowed task complication, and repeated later failures; report source harm/exposures and no extra injuries/fires through hidden branches.
- Demonstrate complete-bundle rescue feasibility and mandatory candidate coverage; separate an omitted path from legal Jev refusal and previously warned poor care.
- Compare all 21 allocations with stored precision, eligible effects, and cap saturation; no parity claim from rounded HUD values.
- Track inventory drift and optional zero delivery at typical and long-tail ages, including the 65,535 bound. Comfortable stockpiles must not accidentally block continued play.
- Freeze and dispose all named event-frequency/black-swan parameters; report policy survival distributions, limited real-Jev observations, immediate-death share, and tail censoring separately.
- Resolve known dominant allocations/delivery loops, useless supplies, unfair rescue stacks, and repetitive days as Fixed, Accepted with evidence, or Blocking at the explicit product-quality review. Merely producing a report is not a pass.

The compact permanent evidence requirements and release process live in chapters 19–21. No paid inference, implementation, wallet creation, or deployment is performed by this design correction.

## 10. Jev decision design and preparation

### 10.1 What the model owns

Jev selects an action from a bounded set of supported alternatives.

It receives the creature's current situation and relevant supplies.

It can favor different actions as conditions change.

It does not directly set health, level, ownership, or inventory totals.

It does not invent arbitrary contract calls.

It does not choose a new token owner.

It does not generate unrestricted game scripts.

It does not perform frame-by-frame movement.

It does not write the creature's dialogue.

### 10.2 What the rules own

- The set of legal actions.
- Preconditions for using a supply.
- Consequences of an accepted action.
- Inventory consumption.
- Movement destinations and reachability.
- The ordering of deterministic effects.
- Event eligibility.
- State bounds.
- Condition timers.
- Survival and death.
- Level changes.
- The settlement payload.

The model chooses within the sandbox.

The rules apply the outcome.

An unexpected choice is acceptable.

An impossible or unsupported choice is a provider validation failure.

### 10.3 Verified provider connection

The NEAR AI Cloud System One endpoint supports typed decision requests.

The model found in the live catalog on October 31, 2026 was typesafe/jev-1.13.

The catalog price was $0.042 per million input tokens and zero per output token.

The successful research response reported the upstream version typesafe/jev-1.13-20260917.

The tiny research call used 428 input tokens and 43 output tokens.

It cost $0.000017976 and selected eating an apple for a hungry creature.

Observed end-to-end latency was approximately 1.4 seconds for that one request.

That observation is not a service-level promise or a performance distribution.

The temporary research key was revoked after the check.

The hosted route was marked non-attested.

A retrieved signature identified itself as a gateway receipt.

The game may accurately say it uses Jev through NEAR AI.

It must not claim that this result proves confidential Jev execution or trustless contract verification.

Sources: [live catalog](https://cloud-api.near.ai/v1/model/list) and [NEAR AI System One integration](https://github.com/nearai/cloud-api/blob/main/docs/jev-systemone.md).

### 10.4 Provider version policy

Record the requested model identifier with each prepared day.

Record the reported serving model when available.

Freeze a decision-configuration package before an attempt begins, separately from the numerical rules package.

The package identifies instructions/templates, context projection, personality representation, candidate eligibility and ordering, action selection, adapter behavior, requested model, and permitted serving-version policy.

A deployment cannot silently replace part of that package during an accepted attempt.

An older active package must remain available until its accepted work resolves; unsupported work pauses or fails honestly instead of mixing versions.

Each accepted step records the exact serialized inference input or a durable immutable reference and digest, its candidate map/order, its actual response, and provider generation/inference identifiers when available.

Provider identifiers aid diagnosis; they do not establish request idempotency or deterministic model output.

Keep provider changes separate from gameplay module changes.

Do not assume the direct Typesafe model version in Jevscape is available through NEAR AI.

Do not silently fall back to a different paid model when Jev is unavailable.

Do not change provider midway through a request without an explicit supported policy.

A complete replay should identify the decision configuration used.

### 10.5 Decision context

Each request should provide the minimum useful context for that choice.

The context should include:

- Current phase of the game day.
- Current needs and health.
- Current conditions and their urgency.
- Relevant attributes.
- Stable personality tendencies.
- Accessible supply counts.
- Nearby or relevant world objects.
- The current event, if any.
- The last six accepted action/target/outcome summaries, including the prior day's tail where applicable, plus deterministic cooldown counters.
- The creature's general survival goal.
- Legal alternatives and their meanings.

It should not include:

- Wallet private keys.
- Provider API keys.
- Unrelated account information.
- A precomputed answer disguised as a preferred action.
- All raw historical days by default.
- Unnecessary rendering coordinates.
- Every available authored line.

The mandatory context floor includes every currently due rescue, its deadline, relevant stock, target identity, and each offered action's prerequisites, costs, and known consequences.

Context uses structured state rather than a growing conversation or another summarization model.

The provisional reservation ceiling is 4,000 input tokens per transmitted call, to be checked against the actual model framing and representative prompts during integration.

Enforce a local input-size preflight using a verified compatible tokenizer or conservative bound; do not add unsupported System One request fields to enforce it.

Optional flavor and remote history are removed before mandatory information.

If the complete mandatory context cannot fit the supported and funded bound, pause admission or fail the attempt as a configuration issue; never buy an uninformed choice by silently dropping a lethal deadline.

Day-one and day-three-hundred contexts must remain bounded under this same contract.
- Huge repeated descriptions of unchanged furniture.

### 10.6 Candidate actions

Candidate labels should identify concrete actions.

Eating bread and using bread as bait are different actions.

Repairing a chair and building a chair are different actions.

Resting and taking a risky shortcut to obtain a resource are different actions.

The request must explain the immediate known consequences sufficiently for a useful choice.

The request must not imply that a probabilistic future event is certain.

Candidates should be filtered for reachability and stock before inference.

No action may consume an item that the creature does not own.

No menu should contain dozens of cosmetic duplicates to bias the choice.

A small representative set is preferable to an exhaustive combinatorial list.

An offered alternative is an immutable action instance, not merely an activity-family name.

Its unique criterion key binds the approved family, target plot/object/condition/anchor, variant, whole-unit inputs, slot cost, and effect rule.

Watering two different plots creates two distinct alternatives when that target choice matters.

The adapter asks one typed choice question about the current state and takes the returned choice field as selecting the exact offered map entry.

It does not resample probabilities, recompute an argmax, or choose missing parameters after inference.

Preserve the candidate map and selected instance with the recorded choice.

The usual shortlist has three to five alternatives, with a hard maximum of sixteen action instances.

While feasible, each urgent condition or critical need must have at least one useful treatment/recovery instance represented; include exposure cleanup when it is necessary to prevent the due condition reentering before its deadline.

This does not require every interchangeable food, recipe, or target variant to be listed.

Use the larger list up to sixteen when distinct mandatory responses exceed the usual size, rather than silently omit a due rescue.

Prioritize earliest due deadlines with stable rule-defined ties; ordinary condition eligibility and rescue-feasibility rules keep the mandatory coverage within that bound.

Add contextual routine alternatives under a versioned stable ordering/rotation policy independent of user names.

An accepted cooldown or lack of a useful effect removes a repeated routine from eligibility; inspection without a new tracked consequence is visual flavor rather than another paid decision.

The rules still permit Jev to refuse an offered treatment; record that separately from a planner failing to offer it.

### 10.7 Sequential preparation

Resolve the next eligible situation from the current provisional state.

Generate the legal candidates for that situation.

Ask Jev for a choice.

Validate the response.

Apply the chosen action through the rules.

Persist the successful result and the new provisional state.

Then prepare the next decision using that updated state.

Future dependent decisions cannot be computed correctly in parallel before their input state exists.

Parallel work may handle unrelated metadata, assets, or different creatures within capacity limits.

It must not fabricate dependency order.

### 10.8 Decision budget

The owner's desired scale is roughly 60 Jev calls per ordinary game day.

The authoritative scheduler in section 5.7 is six phases of ten logical slots.

Every supported activity occupies one slot, including its travel; automatic mailbox collection and shelving are the deterministic prelude.

A no-choice slot safely idles with zero energy cost and still advances the logical schedule.

One legal action can resolve without a paid call, while a retry never advances a slot.

Skipping unnecessary calls never skips phase drains, condition deadlines, bedtime, or maintenance.

| Counter | Proposed bound or meaning |
| --- | --- |
| Logical slots | Sixty for a surviving day; stop at terminal death |
| Accepted model choices | At most sixty; roughly sixty remains the starting product target |
| Transmitted inference attempts | At most seventy-two across the entire owner attempt, including application retries |
| Durable send claims | At most seventy-two; claimed before dispatch, conservatively including uncertain or possibly-unsent crash cases |
| Additional sends for one step | At most two, also constrained by the seventy-two total |
| Committed biological day | One complete settled living or fatal result; service failures add zero |

These are separate counters. The amount of paid work does not define how much life elapsed.

Use 60 meaningful successful decisions as the initial maximum budget.

A fatal result can end the sequence early.

Deterministic mailbox collection does not need an extra paid decision.

Deterministic pathfinding does not need an extra paid decision.

Moving a sprite a few pixels does not need another paid decision.

Avoid inventing meaningless choices to reach the number 60.

Use measured diversity, latency, and cost to decide whether the final normal day needs fewer calls.

A budget change is an explicit product tuning decision.

The preparation progress display must use the actual configured budget.

Retries count against a separate bounded attempt budget.

No worker may retry a failed provider call indefinitely.

The application adapter is the sole retry owner; disable automatic client-library retries or include every actual transmitted retry in the same ceiling.

The provisional per-send timeout is ten seconds, with bounded backoff between eligible retries.

Temporary network errors, provider 429, and retryable 5xx responses may use that allowance.

Authentication, unsupported schema, or invalid core-choice configuration errors stop rather than repeatedly purchasing the same failure.

Never retry a valid legal choice merely because it is foolish, risky, low-confidence, or fatal.

Track actual client sends, accepted choices, ambiguous billable calls, and reported provider usage separately.

Claim each send allowance durably under the fenced job control before the external request, independently of later successful-slot checkpointing.

A lease restart cannot roll that counter back or reuse an uncertain claim for another uncounted request; possibly-unsent claims stay conservatively charged until reconciled.

Unobservable provider-side retry or billing behavior remains covered conservatively by reservations; it is not an exactly-once billing promise.

Stop before the paid-attempt ceiling, worker continuation limit, or remaining hard settlement margin is exhausted.

### 10.9 Playback budget

The ordinary surviving replay targets approximately 180 seconds.

This is independent of how long the provider takes to prepare it.

Travel, interaction, reaction, and transition animation fill the replay timeline.

Not every decision needs an exactly three-second scene.

The timing-family table and sixty-receipt fixture in chapter 17 must include mailbox collection, movement, interactions, reading, and bedtime inside the ordinary target.

Longer actions may group into one readable sequence.

Short reaction beats can connect meaningful actions.

The player should see why a resource was consumed.

A death replay can end before the normal full-day duration.

Optional speed controls and the required low-prominence Skip to summary route leave canonical results unchanged.

### 10.10 Expected preparation wait

Sixty sequential calls at the observed 1.4-second sample latency would take approximately 84 seconds before storage and chain settlement.

Real prompts can be larger than the tiny research prompt.

Cold starts, retries, and provider load may add time.

The interface must not promise instant preparation.

The product should show visible, honest progress during this wait.

The target is a satisfying bounded ritual rather than an unannounced queue.

If measurement shows that the wait undermines the experience, reduce redundant decision volume before adding infrastructure complexity.

### 10.11 Response validation

- The response must be parseable in the expected typed form.
- The returned question key must match the requested question.
- The action identifier must belong to the supplied candidates.
- Any probabilities displayed must be finite and within valid bounds.
- The choice field selects the action even when optional probabilities or confidence are absent.
- Malformed optional telemetry is marked unavailable; it does not by itself invalidate a legal, well-formed core choice.
- Missing optional confidence must not invalidate an otherwise valid action.
- Usage must be recorded when supplied.
- Unexpected response shapes must not mutate canonical state.
- Raw provider error text must not leak credentials or internal request state to the interface.

Probability is a model output about candidate choice.

It is not the action's objective chance of success.

The brain panel must not confuse a 90% model preference with a 90% survival guarantee.

### 10.12 Successful decision checkpoints

Persist the request identity, step index, selected action, result, and state version together.

Also bind the logical slot, complete input digest, candidate map, canonical starting-input digest, and frozen decision configuration.

The single fenced job-control record described in chapter 12 decides which candidate checkpoint becomes accepted progress.

Reuse a durable successful checkpoint when a worker resumes the same active attempt.

Do not deliberately bill the same successful step again after an ordinary process restart.

Cross-attempt reuse is allowed only when the complete current input and configuration match; a changed delivery, target, prompt, candidate order, or model policy invalidates that match.

An ambiguous network timeout can still create uncertainty about whether the provider billed a call.

The system must not promise exactly-once billing under every network failure.

Exactly-once canonical settlement is the stronger required game invariant.

### 10.13 Terminal failure and player retry

The owner's direct clarification governs this flow.

An accepted owner transaction remains in history.

A terminal AI failure marks that attempt failed.

The last complete creature save remains unchanged.

The delivery is not consumed in canonical state.

Level does not increase.

Game-day condition timers do not advance.

The owner can submit a fresh transaction to try again.

No refund is promised or required.

No transaction deletion is implied.

The new attempt has a new request identity.

As a design proposal, preserve the same intended game-day event seed across retries to reduce random-event rerolling.

Do not claim that this makes model outputs deterministic.

The exact retained-checkpoint policy must be stated by the technical design.

### 10.14 Brain panel during preparation

Show that genuine decisions are being computed now.

Show a completed-decision count where meaningful.

Keep logical slot progress separate from the count of successful model choices and transmitted attempts.

Show short event or action labels rather than giant raw payloads.

Provide optional details for users who want the probabilities.

Do not animate invented API traffic to fill a provider stall.

Do not show a recorded replay as if the provider is still choosing live.

Avoid revealing the entire eventual story by default before playback.

An interested user may inspect more detailed preparation output.

Opening a completed choice pins its recorded snapshot while real preparation continues, with a quiet indication when newer decisions become available.

Do not overwrite the inspected choice or pause backend computation to make the panel readable.

### 10.15 Brain panel during playback

Associate each displayed choice with the replay moment it actually produced.

Opening a detailed choice or event pauses presentation at that recorded moment and pins its matching state until the player explicitly resumes.

Use the recorded choice and recorded model output.

Do not call Jev again merely to explain an already saved result.

Do not generate fictional hidden reasoning.

The panel can say what alternatives were offered and which action was chosen.

The protected replay packet carries that recorded-brain minimum under sections 12.8 and 15.4 even after raw diagnostic retention ends.

If a full original request is no longer retained, label it unavailable; do not show a reconstruction as the original exchange.

Authored character thoughts belong to the narrative layer, not to an assertion about the model's internal reasoning.

### 10.16 Keeping the loop interesting

Make a small set of objects interact with several conditions.

Change candidate availability through health and home state.

Use recent history to discourage repeated purposeless choices.

Allow safe idling when no urgent action is necessary.

Let personality choose between reasonable options.

Preserve occasional mistakes without making the model ignore obvious emergency care.

Use event eligibility and resource limits to keep surprises meaningful.

Avoid relying on verbose prompts to compensate for unclear mechanics.

### 10.17 Jev validation scenarios

- Hungry creature with safe food available.
- Thirsty creature with water needed by both plant and body.
- An uninfected bandage-eligible wound with a bandage and attractive leisure options; test infection and medicine in a separate explicit case.
- Exhausted creature choosing between sleep and coffee.
- Broken stove with raw food and repair supplies.
- Drought with a young garden and scarce stored water.
- Existing furniture near the end of its lifetime.
- Creature with no immediate emergency.
- Two distinct personalities facing the same reasonable alternatives.
- Provider response containing an unsupported action.
- Provider timeout after an uncertain upstream completion.
- Duplicate worker invocation for the same step.
- A death result reached before the maximum budget.

These scenarios become meaningful tests during implementation.

They are not evidence that a balanced game already exists.

### 10.18 Complete-day reliability and behavior gate

A single successful call does not establish the reliability of a sixty-choice all-or-nothing day.

The real integration report measures accepted requests that reach an ontime settled result, terminal operational failures by cause and step, all transmitted attempts and uncertain charges, and total usage/cost.

A legitimate biological death is a completed game result, not an operational failure.

Separate queue, inference, persistence, and chain waits, and also report request-to-replay-ready P50, P95, and the observed high tail.

Initial review targets are at least 98% operational completion and P95 request-to-ready within 180 seconds at the stated supported concurrency.

Those targets are provisional quality criteria, not measured results, confidence guarantees, or a provider SLA.

State sample size and observation period; a small sample cannot prove the true long-run failure rate.

A missed target requires a concrete release disposition: fix it, gather justified additional evidence, or present the actual limitation for product review.

Do not silently lower the roughly sixty-choice design or fake progress to pass the gate.

Use deterministic fixtures for transport faults and state accounting, a bounded real-Jev context corpus for urgency and repetition observations, and representative complete genuine-Jev runs for integrated latency and completion evidence.

Record offered emergency treatments and actual refusals separately from candidate omissions.

Define the unacceptable refusal/loop patterns before examining the sample; an implementation bug or omitted urgent option blocks release, while a surprising legal choice remains part of autonomy.

Retain a small sanitized evidence bundle of exact versions, denominators, and representative recorded exchanges outside TEMP before making permanent release claims.

## 11. The NFT as an owned save state

### 11.1 Purpose and authority

The NFT is the persistent identity and current save state of one independent rooster.
The collection contract is the canonical authority for ownership and accepted game state.
Each token has its own state record; a separate deployed contract per rooster is unnecessary.
One rooster's inventory, day counter, health, or failure cannot modify another rooster.
Owning several tokens does not create a shared household or shared stockpile.
The current owner selects up to three distinct supplies, including an empty delivery when using stored stock, and authorizes that day's request.
The owner never sends an arbitrary replacement save state for the contract to trust.
The trusted game service submits the authorized day's validated result.
The service has limited game-settlement authority; it does not receive general ownership of NFTs.
Game-service authority and treasury-withdrawal authority are distinct permissions.

### 11.2 Ownership facts

- Token identifier: stable identifier assigned by the collection.
- Owner: the address recognized by the NFT ownership standard.
- Birth identity: immutable creation identifiers and generated appearance selection.
- Display name: at most eight accepted characters, with final permitted character rules defined during implementation.
- Creation network: mainnet or testnet, never inferred from the website's current selector.
- Birth transaction: public transaction establishing the token and its initial authorization.
- Current life status: alive or dead; trial completion is a separate access condition.
- Current state version: monotonic accepted-save revision used to reject stale results.
- Intended biological day, committed-day count, request-attempt ID, and survived-day level: use the canonical definitions and example in chapters 1 and 4.
- Terminal biological day: identifies the fatal committed day without counting operational Failed/Expired attempts as life advanced.
- Pending request: at most one unresolved authorized day for this token.
- Ruleset reference: the exact approved rules version used by the current save.

A token ID is never reused to imply that a dead rooster has been resurrected.
A new mint creates a new life, even when its owner reuses a familiar display name.
The owner can distinguish identically named tokens through token identifiers.

### 11.3 Canonical current-state fields

The following is a semantic inventory, not a storage-layout prescription.
Implementers should minimize redundant values while preserving all required information.

| State group | Required meaning | Change boundary |
| --- | --- | --- |
| Identity | Token, name, birth selection, appearance seed | Birth, except explicitly supported naming rules |
| Allocation | Body, Wits, Spirit allocations totaling five bonuses | Birth in version one |
| Personality | Approved stable behavioral weights or trait identifiers | Approved game rules |
| Survival | Health and active injury or illness conditions | Accepted day result |
| Needs | Nutrition, hydration, energy, morale | Accepted day result |
| Progress | Committed biological days, survived-day level, and terminal biological day where applicable | Accepted day result |
| Home | Generation seed, topology variant, placed-object state | Birth and accepted day result |
| Supplies | Whole-unit counts of each approved supply type, each bounded from zero through 65,535 in the proposed encoding | Birth and accepted day result |
| Garden | Approved plot states, growth counters, harvest availability | Accepted day result |
| Life | Alive/dead marker, cause, terminal day | Accepted terminal result |
| Versioning | Save revision and applicable rules identifiers | Accepted versioned transition |
| Request | Intended biological day, unique request-attempt identity, seed, zero-to-three authorized delivery units, deadline, versions, and request status | Day-request lifecycle |
| Receipt | Latest result commitment and chain event references | Accepted day result |
| Recent actions | Last six accepted action/target/outcome summaries, including across day boundaries, or an equivalent bounded chain-readable reference | Accepted day result |

Current supplies remain available until legally consumed or explicitly lost through a game event.
Delivery selection adds zero through three distinct supply units; selection does not require consuming them that day.
The proposed per-type bound is an encoding safeguard, not a paid storage upgrade.
A full supply type cannot be added; the owner may choose fewer supplies or an empty delivery to keep playing from stored stock.
Admission prevents overflow before payment rather than discarding stock during settlement.
A resource consumed to build furniture becomes a placed object with its own approved lifetime.
The same consumed resource cannot also remain in the supply count.
A fixed house seed reproduces its safe generated baseline.
Later furniture changes require current-state records in addition to that birth seed.
Garden growth uses committed game-day counters.
A month away from the website creates no hidden garden growth or starvation.

### 11.4 Owned-save information boundary

The owner's NFT-as-save direction requires a definite information boundary. This table is the baseline interpretation of the owned-save, inspection, and transfer requirements; detailed encodings remain implementation proposals.

| Information | Required location and recovery promise | Version-one disposition |
| --- | --- | --- |
| Current semantic save | Canonical onchain representation reconstructs every group in §11.3, including current supplies, conditions and exact deadlines, home/object placement and lifetime, garden state, counters, versions, and the bounded recent-action context | Required; a backend-only field plus its hash is insufficient |
| Birth and significant life/day history | Documented onchain records preserve birth identity, committed day order, day summaries, significant mechanical changes, and terminal cause/day | Required, including after transfer or cinematic packet loss |
| Compact per-slot history | Documented onchain encoding preserves each resolved logical slot's selected action family, target, variant, and mechanical event outcomes, including deterministic/idle slots and an early terminal boundary | Required baseline design promise; a reference to missing offchain bytes does not meet it |
| Actual model exchange | Exact sanitized request/candidate configuration, response, provider identifiers, optional probabilities, and operational usage are retained offchain under §15.4 | Inspectable genuine evidence; full raw exchanges are not promised onchain |
| Cinematic packet | Authored line selections, routes, animation/camera timing, and other presentation bytes are kept offchain with an onchain commitment | Availability follows §15.4; full cinematic bytes are not promised onchain |

The bounded last-six-action context is recoverable without the game backend; it does not add free-text memories or an achievement system to version one.
Compact history provides life continuity without inventing those deferred systems.
Ownership and life status remain direct contract facts; other canonical fields may be compactly encoded if the public decoder reproduces their exact semantics.
Measure the required compact history's encoding, transaction-data/event availability, and gas cost on testnet.
If it cannot fit the intended operating envelope, present that measured conflict for owner review before weakening the recovery promise; an implementation agent cannot resolve it merely by narrowing marketing copy.

A digest verifies retrieved bytes but cannot reconstruct missing bytes.
Keep required cinematic packets and their compatible decoders under the single retention/backup policy in §15.4, including protected copies before finalization.
An authenticated download/export is a useful recovery aid when practical, not an ownership authority or a substitute for the chain save.

The release witness is a clean chain-only restore with the game backend blocked, browser storage cleared, and old game checkouts and TEMP absent.
Using only canonical chain data plus versioned public project code/rule/art assets in permanent locations, reconstruct a separately reviewed expected save containing carried supplies, an urgent condition/deadline, a planting, a temporary object, recent actions, counters, and history.
Also restore a dead token and a trial-complete token without making an inference request.
Matching a service payload's digest alone does not pass this witness.

### 11.5 Death preserves the collectible

The final user decision is to retain the NFT after death.
Version one does not automatically burn the token.
Death disables future ordinary game-day requests for that rooster.
The accepted terminal save records the cause and terminal biological day under chapter 4's counter definitions.
Its survival level remains the count of days actually survived.
The portrait and metadata visibly identify the rooster as dead.
The owner retains the memorial collectible and may transfer it through ordinary NFT mechanisms.
A recipient receives a dead collectible, not a fresh playable life.
Metadata must make that distinction readable before purchase or transfer.
The house and remaining inventory become inactive and provide no salvage.
Inactive data may remain in historic chain records.
Deleting a usable game world does not erase blockchain history.
The memorial does not introduce a separate public graveyard page in version one.
The owner can start a new life by minting a new, isolated token.
No inherited furniture, family progression, or shared currency is created.
An accidental service retry cannot repeat death or decrement a second life.
The terminal transition is accepted once.

### 11.6 Metadata and marketplace presentation

Metadata should expose the name, portrait, life status, survival level, and core traits clearly.
Useful attributes include survived days, birth traits, and current alive/dead status.
Current needs may be included if refresh behavior remains understandable.
A stale marketplace cache must not be treated as the contract's current truth.
The product can request metadata refresh where the relevant standard and marketplace support it.
OpenSea compatibility is a verification gate, not an assumption from ERC-721 alone.
The chosen collection standard, metadata encoding, image URLs, and Robinhood support need live checks.
No marketplace visibility promise should precede those checks.
The artwork must identify one rooster consistently across the house, reveal, and wallet portrait.
The memorial artwork may add an unmistakable death treatment while retaining identity.
External image hosting requires a declared availability approach.
An onchain portrait description or deterministic trait renderer can reduce image-host dependence if practical.
Do not make a long-term art permanence claim until that path is implemented and checked.
Public NFT metadata cannot be made private by restricting the game's owner interface.

### 11.7 Transfers and pending-day ownership

The user owns a transferable save, including its home, inventory, traits, and current life state.
Version one introduces no internal marketplace.
Ordinary transfers remain possible outside an active pending day.
A pending day temporarily locks transfer to prevent owner changes during settlement.
The lock is attached to the token, not to every token in the owner's wallet.
Approvals do not bypass the pending-day lock.
A replay after settlement does not keep a transfer lock active.
A recipient can continue from the accepted current state without inheriting the former owner's browser data.
A recovered historical replay must never submit a new game-day request automatically.
Transfer checks must reject a stale signed authorization from the previous owner.
The backend rereads ownership before acting on a request.
The contract independently checks the relevant authorization at acceptance.
Admission permits from the old owner cannot authorize the recipient's next day; the owner binding and base revision are checked by the contract.
If recovery releases an abandoned request, transfer becomes possible under chapter twelve's recovery rules.
A new owner does not gain the right to revise a previous owner's committed day.
A transfer carries the packet's existing retention dates under §15.4; it does not reset historical replay expiry.
A dead token may transfer as a memorial without becoming playable.
A version change must not silently strip an owned rooster's canonical state.
These transfer cases are mandatory testnet scenarios.

## 12. The request, planning, settlement, and replay lifecycle

### 12.1 The two-transaction day

An ordinary game day has one owner request transaction and one backend finalization transaction.
The owner confirms the request in their wallet.
The backend funds and submits finalization through its restricted relayer.
The three-minute animation starts only after an accepted final result exists.
The owner does not sign sixty separate decisions.
The browser does not send an onchain transaction for every walking step.
Mint includes first-day authorization, avoiding a second introductory owner confirmation.
Mint's first-day job still needs durable planning and finalization.
The request and finalization may be separated by an honest generation wait.
A measured 1.4-second sequential call average suggests roughly eighty-four seconds for sixty calls.
That arithmetic excludes validation, persistence, queueing, retries, and chain confirmation.
It is a planning estimate, not a completion-time guarantee.
The three-minute replay is additional viewing time.
The interface must distinguish generating a day from watching it.

### 12.2 State-machine boundary

| Lifecycle state | Authoritative meaning | Allowed next action |
| --- | --- | --- |
| Care ready | Alive, available, no unresolved day | Owner chooses zero through three distinct supplies and obtains a funded quote/permit |
| Admission reserved | A valid expiring permit holds conservative completion capacity | Approve the matching owner transaction or let the unused permit expire |
| Request submitted | Wallet broadcast is known; acceptance not established | Wait or recover transaction status |
| Request accepted | Chain accepted authorization and fixed its seed | Service durably creates or resumes job |
| Planning | Service is building the sequential day | Inspect progress; no gift changes |
| Failure awaiting confirmation | Service stopped the attempt; terminal chain outcome is not established | Reconcile existing finalization/failure transactions; no fresh request yet |
| Failed attempt | Chain recorded Failed and released the lock | Owner may obtain a new quote/permit and submit a fresh transaction |
| Result prepared | Final state and replay packet are persisted | Relayer attempts one matching finalization |
| Finalization submitted | Result transaction has been broadcast | Recover receipt before resubmission |
| Settled alive | Contract accepted surviving result | Start or replay day; later choose again |
| Settled dead | Contract accepted terminal result | Start terminal replay or open memorial |
| Released | A confirmed Failed/Expired attempt no longer blocks transfers or another attempt | Preserve prior canonical save and intended biological day/seed |
| Trial complete | Testnet committed-day allowance reached | View results; no additional trial day |

Request accepted is a chain fact.
Planning is a service fact.
Replay ready requires both an accepted chain result and the matching available replay packet.
A browser spinner cannot promote a job from planning to settled.
A backend log cannot replace the chain receipt.
The client must not infer success from an HTTP acceptance response.

### 12.3 Request identity and immutable inputs

Each authorized attempt has an unambiguous request identifier, including a monotonic token attempt nonce or an equivalent contract-enforced unique identity.
The identifier is scoped to network, collection, token, intended biological day, and base save revision.
Fresh Failed/Expired retries receive new attempt IDs even while biological day and base revision remain unchanged.
It must not collide with an identical token number on another chain.
The request fixes the starting canonical state revision.
It fixes the canonical selection of zero through three distinct supply units, with an explicitly empty ordinary delivery allowed.
Mint authorizes starter stock once; a first-day retry has no additional delivery.
It fixes the ruleset, module versions, and frozen decision configuration defined in chapter 10.
It fixes the seed needed by the approved weak-randomness scheme.
It fixes the funded admission permit, quoted fee/multiplier, acceptance expiry, and settlement deadline.
Store a digest of these canonical inputs and the originating block/hash/log identity for §12.14 reconciliation.
It records enough authorization context to reject stale owner requests.
Reopening a tab must recover this identifier rather than inventing a new one.
Repeated clicks while the wallet is open must not create parallel requests.
The UI disables duplicate submission while transaction status is unresolved.
The contract enforces the single-pending-request rule regardless of the UI.
A duplicate HTTP request can recover work already running for an accepted request.
An explicit failure ends that attempt and permits a fresh owner transaction.
A repeated day submission after completion returns the existing result.
It does not spend new inference credits.
A stale browser's next-day request is rejected against the actual canonical revision.

### 12.4 Fixed weak randomness

The user accepts predictable game randomness for this experiment.
On the first attempt only, the seed may combine its accepted timestamp, token context, and an explicit counter.
Further attempts for that same uncommitted day reuse the saved intended-day seed.
Exact derivation must be documented before testing.
No description may call it cryptographically secure randomness.
The seed must be fixed by the accepted chain request before dependent planning starts.
A retry uses the original seed.
A worker crash does not produce a new random day.
Each approved random draw has a defined position or label in the day's random stream.
Gameplay randomness and cosmetic particle randomness are separate.
Cosmetic replays may use deterministic visual variation without changing survival.
A presentation frame rate does not consume gameplay random draws.
Neither Solidity block.number nor prevrandao is used as the game's turn clock.
The Robinhood-specific behavior behind that restriction is documented in the source notes.
Predictability is an accepted game limitation, not permission to leak keys or bypass ownership.
An invalid day result is rejected even when its seed is predictable.
Future stronger randomness can be a versioned change without rewriting prior days.

### 12.5 Funded admission, acceptance, and job creation

Funded admission happens before a payable authorization, including mint's automatic first day and every fresh retry.
The quote service first checks current owner/base eligibility or mint parameters, delivery legality/overflow, trial access, supported versions, and the separate operating allowances in §15.8–15.9.
It atomically reserves conservative AI, relayer, hosting, and queue capacity before issuing a short-lived single-use signed quote/admission permit or opening the wallet.
The permit binds network, collection, owner, operation, token/base revision or mint parameters, unique permit ID, zero-to-three delivery, rules/decision configuration, fee estimate, multiplier, maximum processing payment, and acceptance expiry.
Outstanding unexpired permits consume capacity even before a transaction is mined.
Repeated quote requests for an identical draft recover the same issued permit and hold rather than silently multiplying reservations.
Changing already signed terms cannot free the old permit's capacity while that permit can still be accepted.
Use a separately reserved new permit, or an explicitly shared single-use onchain admission identity whose one reservation covers the maximum of all still-valid signed variants; at most one variant may be consumed.
In particular, editing mint parameters must never leave two independently acceptable mint authorizations backed by only one completion allowance.

The contract requires the valid matching permit and consumes its ID atomically with payment acceptance and mint/request creation.
Direct contract calls cannot bypass admission; absent, mismatched, expired, or reused permits revert.
A reverted transaction can still spend network gas, but it retains no processing charge and creates no partial creature or request.
An unused hold is released only after its acceptance window has ended and canonical-chain reconciliation establishes that it did not become accepted; closing a browser or losing a worker lease is insufficient.
A request accepted under an outstanding funded permit inherits that obligation even if new admission subsequently pauses.

The entry endpoint receives the request identity or transaction reference, applies §15.3's cheap ingress checks, and reads the accepted canonical request instead of trusting client-copied gifts.
It verifies network, collection, full input digest, owner/base context, and unresolved status.
It recovers the already reserved completion obligation and atomically creates the durable job control/header if none exists; it does not decide after payment whether this owner should have been funded.
An existing job returns its status without purchasing additional inference.
The browser receives a status handle, not a provider key or worker authority.
Private dispatch and §15.5's reconciler create/resume accepted work without depending on a final successful browser call.
Job records retain encoding and frozen execution versions needed to resume older work safely.

### 12.6 Leases and concurrent execution

A single authoritative per-request control record holds lease identity/generation/expiry, lifecycle status, accepted checkpoint head/index, and control revision.
Lease acquisition, refresh, takeover, accepted progress, and terminal status publication use conditional updates of that same record.
The proposed lightweight Netlify path uses strong reads and matching-ETag compare-and-update; a separate lease read followed by a conditional write to a different progress key is not sufficient fencing.
Taking over an expired lease changes the authoritative control record even when no checkpoint has advanced.
A worker may first write an immutable candidate checkpoint, but it becomes accepted only when its conditional control update proves the current generation, lifecycle state, prior head, and revision still match.
Unreferenced candidate blobs are not resumable progress and may be collected under §15.4.
Prepared/Failed publication is fenced by the same rule, so a stale worker cannot poison a current worker's terminal status.
Before each external inference send, atomically claim a unique send allowance in that same fenced control record, bound to the current attempt, logical slot, exact input digest, and step/global send counters.
Persist the corresponding input/send identity before dispatch; only a successfully claimed allowance can authorize a new HTTP send.
The durable ceiling includes ambiguous or possibly-unsent claims after a crash, so lease recovery cannot reset paid-work accounting to the last successful slot.
Record observed sends, responses, and usage separately. A crash before dispatch may conservatively consume a claim without buying inference; reclaim a transport-count claim only after proven non-dispatch, never merely because its response/checkpoint is missing.
Verified non-billing can release the monetary reservation for that send, but a transmitted request still consumes its actual-send and per-step transport counts.
A new dispatch after uncertainty claims another allowance and remains within both the per-step and seventy-two-total ceilings; an old claim cannot be reused to buy an uncounted send.
A worker that loses its lease stops before another paid decision call where practical.
Lease expiry permits recovery; it does not authorize a new seed.
The replacement worker resumes the latest accepted checkpoint.
Only one accepted checkpoint occupies each logical sequence position, even when competing candidate blobs exist.
A late worker cannot overwrite a newer checkpoint with an older state.
A split execution may still waste an in-flight external call during a rare failure.
The target is idempotent accepted decisions and exactly one final chain transition.
Do not promise mathematically exactly-once external billing without provider support.
Finalization authority onchain remains an independent safeguard against duplicate settlement.
Different tokens may plan concurrently within global resource limits.
One busy token does not hold a collection-wide lock.

### 12.7 Sequential decision checkpoints

The simulation evolves from the previous accepted intermediate state.
The next Jev request uses that state and its current legal choices.
Dependent calls cannot be parallelized as sixty independent guesses.
Chapter ten defines the inference contract and validation rules.
After every resolved logical slot, persist its accepted result before continuing; this includes deterministic/idle slots that require no Jev call.
A checkpoint includes the logical slot and phase, successful-decision and actual HTTP-send counters, and prior accepted checkpoint identity.
Successful slot acceptance does not create or reset the write-ahead send ledger; pre-dispatch claims survive independently under §12.6.
It includes the resulting intermediate state or an exact reproducible representation.
It includes the consumed gameplay random position.
It includes the action family/target/variant, effects and event receipts, scheduler/cooldown counters, and the model exchange when a real choice was requested.
Retain chapter 10's exact serialized inputs or immutable bytes/digest, candidate map/order, response, and actual provider identifiers when available; never save credentials.
It includes all frozen rules, prompt/context/candidate policy, adapter/model policy, and encoding identifiers needed to resume that same configuration.
Progress should report completed decisions without inventing total work already done.
A call that returned but was never durably checkpointed may need to be repeated.
Where the provider supports request identifiers, use them to reduce accidental duplicate work.
Do not claim fixed Jev idempotency semantics until verified.
A completed durable checkpoint must not be rerolled after a service restart.
A checkpoint cannot permit inventory to become negative.
A checkpoint cannot let an already dead rooster make later survival decisions.
A terminal event can finish planning before sixty decisions.
Do not buy meaningless calls solely to display sixty completed steps.
The six phases contain ten logical slots each; skipping a paid call or retrying transport never skips or adds a biological slot.
The complete schedule and its terminal ordering live in chapters 4, 5, and 10.

### 12.8 Result preparation and availability

After the simulation ends, validate the complete proposed state transition.
Confirm that the day begins from the accepted starting revision.
Confirm that only authorized supplies were added.
Confirm that every consumed item had a legal source.
Confirm that effects conform to the fixed ruleset.
Confirm that level increments only for a survived day.
Confirm that a death day records its terminal state consistently.
Build the deterministic replay packet from accepted decisions and authored presentation rules.
Copy the recorded-brain minimum into that protected packet: the original offered candidate instances/order and display meanings, selected instance, relevant slot/phase/state snapshot and mechanical outcome, decision/model identity, and probabilities/confidence when actually supplied.
This copy is required before short-lived checkpoints or raw diagnostics may be pruned; a reference to those prunable records is insufficient.
Persist that packet before submitting finalization.
Read it back and verify its content digest.
Create and verify the protected second packet copy and manifest required by §15.4 before finalization.
Persist the final save payload and required onchain compact per-slot/day receipts from §11.4.
Record their encoding versions.
A prepared result remains bound to the original request identity.
It is immutable once submitted for settlement.
If validation fails, use bounded service recovery or record this attempt Failed.
Do not silently change the accepted day to obtain a nicer result.
A failed upload means the day is not ready for finalization.
The owner's next-day menu must not open from an uncommitted proposed save.

### 12.9 Finalization and contract checks

The relayer submits the prepared result from its approved authority.
The mandatory contract validation floor independently enforces these bounded checks, even when the approved relay submits a correctly shaped payload:

- The token has the matching active request/input digest and locked base revision; it has not settled, Failed, or Expired.
- Execution chain time is at or before that request's stored settlement deadline, and its fixed approved rules/modules remain associated with this attempt.
- The payload can update only explicit mutable save fields. Ownership, immutable birth identity/seed/allocation, and treasury/role authority are outside relay-writable state.
- Every approved numeric field, catalogue/action/condition identifier, target, and encoded shape is bounded. Proposed supply counts are whole units from zero through 65,535.
- For each supply type, final stock cannot exceed base stock plus the authorized addition of zero or one unit. Starter stock cannot be credited again by first-day settlement or retry. Detailed legal consumption remains service-validated within that ceiling.
- Exactly one biological day is committed. A living end state adds exactly one survived level; a terminal result leaves survived level unchanged and records the correct terminal biological day/cause. Dead tokens cannot request another life or be resurrected by settlement.
- A trial result, including a fatal committed day, increments its committed-day counter exactly once without exceeding three; operational failure increments none of these biological counters.
- Save revision advances exactly once for the accepted complete result, and the required compact day/slot history and packet commitment match this request's versioned encoding.

Detailed activity legality, exact supply consumption, event probabilities, and actual Jev provenance remain trusted to the validated service unless an additional cheap deterministic receipt check is explicitly implemented and measured.
The required publication of compact history does not itself imply that Solidity re-executes the whole simulation or proves model execution.
The fixed minimum floor cannot be dropped under an unspecified “whatever is affordable” profile; a measured feasibility conflict requires product review.
It applies the new canonical state atomically.
It marks the request settled and clears the pending-day transfer lock.
It increments the current save revision.
It emits the compact result information and packet commitment.
It records death without burning if the result is terminal.
No ordinary function applies half of a day's proposed final state.
A transaction revert leaves the previous canonical state and request semantics intact.
The backend journals the signed transaction before its first broadcast under §12.10.
The client uses the explicit low-value confirmation/reorg policy in §12.14 before enabling Start Day; testnet stability alone does not establish finality.

### 12.10 Ambiguous broadcasts and duplicate finalization

A timed-out RPC response does not prove that a transaction failed.
One durable serialized relayer outbox allocates account nonces across all jobs and operation kinds, including successful finalization and Failed recording.
Before the first RPC send, sign and persist the request/operation, reserved nonce, call/payload digest, signed bytes, expected transaction hash, and fee/replacement bounds.
Signed bytes stay server-only; the outbox records identities without exposing private keys.
A crash after RPC acceptance but before its response therefore leaves a known transaction to recover.
Rebroadcast identical signed bytes; a same-nonce fee replacement retains the same request and semantic operation and appends its hash to the journal.
An uncertain nonce is not returned to the free pool or allocated to another token.
Reconcile known candidate hashes and canonical contract state before marking the operation complete, replacing it, recording a competing failure, or releasing its reservation.
If the day is already settled, recover the accepted result.
If the transaction remains pending, follow the relayer's bounded replacement policy.
A replacement uses the same request and prepared payload.
It does not create a second independent day.
A nonce conflict must not be solved by guessing unrelated replacement transactions.
A confirmed competing result causes the stale worker to stop.
The contract rejects a repeated settlement attempt.
The backend treats an already accepted matching result as success.
A conflicting accepted digest is a serious inconsistency requiring investigation.
The owner sees a recovery status while that inconsistency is unresolved.
While an ambiguous settlement is being reconciled, the product does not ask the owner to pay for another day to repair that uncertainty.

### 12.11 Failed attempts, fresh transactions, and no deleted history

A confirmed request cannot be deleted from the blockchain.
The user's clarified failure flow ends the attempt and asks the owner to submit a fresh transaction.
Bounded automatic retries may handle a transient provider interruption before declaring failure.
Once Failed is recorded onchain, the attempt is terminal and cannot later finalize a day.
A fenced local decision to fail stops new work but is shown as awaiting failure confirmation until the chain outcome is reconciled.
An already journaled uncertain finalization is reconciled before a competing failure operation; an accepted final result cannot be overwritten by a local failure flag.
The last canonical save remains unchanged.
The rooster does not lose health or age because planning failed.
The failed attempt consumes no survived day or committed trial-day allowance.
The UI explains that NEAR AI failed and offers Try Again.
Try Again returns to the normal daily authorization flow and requires another wallet transaction.
The new request has a new attempt identifier but still targets the same next game day and base save.
Paid network fees and the processing charge from the failed attempt are not refunded by default.
Do not claim a transaction was deleted or charge recovery without showing the normal new quote.
Preserve the intended-day random seed across failed attempts as a proportionate anti-reroll rule.
Completed checkpoints remain diagnostic evidence; reuse follows the exact input/configuration rule below and in chapter 10.
The service must not erase a known terminal result after chain settlement or relabel it as an AI failure.
Record failure onchain through the relayer when it is available and release the attempt's transfer lock.
If the relayer is unavailable, persist failure durably and record its chain resolution when service returns.
A local failure flag alone cannot make an existing onchain lock disappear.
The interface shows recovery pending until that release is confirmed.
The contract rejects late settlement from the now-failed request even if an old worker resumes.
New ownership does not change the preserved intended-day seed or last canonical save.
The proposed fresh-attempt flow preselects the previous gifts for convenience and lets the owner edit them before the new transaction.
Retain the intended-day event seed; do not claim perfect reroll resistance when gifts or model choices can differ.
Reuse successful inference checkpoints only when their exact complete serialized inputs, delivery, state, and frozen decision/rules configuration match chapter 10's reuse policy.
Reused choices are explicitly attributed to their original actual model exchange, not presented as new calls from the fresh attempt.
First-day retries are a specific exception to ordinary delivery editing.
Mint has already credited the original three bread, three water, and three starter utility units once.
A fresh first-day request uses that unchanged starter state, adds no ordinary delivery, and does not mint another NFT.
It may require the normal quoted retry processing payment and network fee, but never another mint purchase.
Keep this failure path proportionate to a low-value experimental game.

### 12.12 Bounded expiry when the service disappears

Every accepted request records a bounded settlement deadline onchain.
The provisional default is thirty wall-clock minutes after acceptance, including queueing, computation, persistence, relayer, and settlement margins.
This timer applies only to request recovery and never to health, needs, level, or biological age.
Finalization is valid only when executed at chain time less than or equal to the stored deadline; expiry is valid strictly after it.
Preparing, signing, or broadcasting a result before the bound does not extend its validity past the bound.
The current owner or any caller may submit expiry directly from canonical chain information and a wallet even when the backend is unavailable.
The transition checks that the request is still pending, records it Expired, and releases its pending-day transfer lock.
It preserves the last completed creature save and the intended-day event seed.
It does not refund previously spent network or processing fees.
The owner may then submit a fresh attempt under the normal retry rules.
Late workers cannot finalize an Expired or Failed attempt.
Settlement, Failed, and Expired are mutually exclusive terminal chain transitions; the first valid one wins and all service/UI records reconcile to it.
The request binds its own deadline so later configuration changes cannot shorten an already accepted window.
The service must stop issuing new inference when the remaining deadline cannot cover bounded completion and settlement.
The explicit Release expired request flow is a recovery exception to the ordinary one-owner-confirmation journey.
It is a network-gas-only expiry transaction, with no new processing charge, followed by normal hash/uncertainty tracking.
Only confirmed release permits a fresh quoted attempt; expiry never occurs merely because a local countdown finishes.
Before expiry is actually confirmed, the interface shows recovery pending rather than claiming the lock disappeared.

### 12.13 Tab closure and returning owners

Closing the tab changes viewing activity, not the accepted game's authority.
A running background worker continues independently within the host's execution limits.
A restart can resume from durable checkpoints.
Returning owners discover pending work by token identity and chain request state.
Their browser does not need a remembered spinner session.
If settlement finished, the matching replay can be opened.
If an attempt failed, show the failure and allow a fresh owner transaction after lock release.
If the token transferred after settlement, the current owner can continue from the new save.
A former owner cannot start new days for it.
Playback position may be saved locally for convenience.
Losing playback position restarts the animation, not the game simulation.
A replay can be skipped after settlement without changing state.
A low-prominence Skip/View saved outcome route is required in Replay ready, replay, resumed, and missing-packet states; it never requests a signature, inference, or state mutation.
The next-day menu opens from the accepted ending save.
A death reveal remains accurate even if the owner never watched the terminal animation.
The product must tolerate a different device opening the same accepted result.
No viewing action spends additional Jev credits.
A repeated Start Day click selects the same packet and result.
When a packet is unavailable or legitimately past retention, the required compact chain summary and explicit skip/continue action reach the current save or memorial without inference, payment, or reroll.

### 12.14 Confirmation level and reorganization reconciliation

The proposed default accepts fast L2 soft confirmations for this low-value product's request planning and saved-day playback, with explicit residual reorganization risk.
This is distinct from Ethereum posting and Ethereum finality; no guessed block depth or observed testnet stability is a substitute for that chain distinction.
Robinhood's official finality documentation describes these stages and possible pre-posting ordering changes: [transaction finality](https://docs.robinhood.com/chain/transaction-finality/).
Record the chosen confirmation level for request planning, playback, and the recovery scan cursor in release configuration.
The scan may react to soft-confirmed work but retains block ancestry and an overlapping rescan until its safe cursor has passed the selected stronger chain checkpoint.

| Canonical reconciliation case | Required response |
| --- | --- |
| Request remains canonical with the identical full input digest | Resume only its accepted checkpoints and frozen configuration; keep its completion reservation |
| Request disappears or is re-included with changed seed/deadline/inputs | Quarantine old-branch work; re-read the canonical request and permit before any further paid resume or settlement; reuse no mismatched checkpoints |
| Observed settlement disappears | Return UI/job to Checking saved day, stop authorizing dependent new days, and reconcile the same journaled prepared result against current pending status and hard deadline |
| A dependent next-day request loses its base | Suspend dependent work until canonical ancestry, base, and inputs are established; an orphaned replay cannot authorize play |
| Settlement, Failed, or expiry wins a race | Recover the one canonical terminal outcome and reconcile locks, counters, packet digest, usage, and reservation once |
| Reorganization exceeds supported ancestry/history or RPCs disagree materially | Freeze affected submissions and paid continuations, retain evidence and obligations, and use bounded operator reconciliation instead of guessing |

Persist originating block hash/log identity and the full immutable request digest, including seed, deadline, delivery, base revision, and versions.
Verify canonical input agreement before a paid resume and before finalization; recover the current owner/state from chain rather than cached events alone.
The event index verifies cursor ancestry and rescans an overlap to detect removed/reordered logs.
Spent and ambiguously billed usage remains real operating spend even when an event is orphaned; release only proven-unused allowances after permit/request reconciliation.
No fresh paid owner retry is offered merely to repair unknown receipt status.
Controlled local acceptance removes a request, re-includes it with a changed seed, orphans a displayed settlement and its dependent request, and races every terminal operation in both orders at the deadline.
At convergence the contract, UI, job, transfer lock, committed trial count, and accepted digest describe the same winner; a documented deep-reorg freeze is acceptable.

## 13. Versioned game modules

### 13.1 The module boundary

The user wants future growth without turning the initial game into many disconnected systems.
The proposed launch set is Home, Kitchen, and Garden & Leisure.
These are behavior domains around one NFT save.
They are not additional NFTs the player must buy.
They are not separate pages or wallet connections.
They are not permission to execute arbitrary downloaded code against collection storage.
The core collection remains the authority for ownership, requests, versions, and accepted results.
Modules define bounded legal actions and their effects.
A central approved ruleset combines the module versions used by a day.
An accepted request fixes that combination until settlement.
No mid-day deployment can replace the worker's action meanings.
Older accepted days retain their original decoding information.
A module can be implemented as a contract, library, or validated rule package where appropriate.
The implementation choice must preserve the onchain-save and contract-validation commitments.
Do not add delegatecall plugins or proxy upgrade complexity by default.

### 13.2 Core responsibilities

- Maintain NFT ownership and normal transfers.
- Hold canonical per-token current state.
- Preserve the required owned-save and compact history information boundary in §11.4.
- Validate mint allocations and name constraints.
- Record birth seeds and generation identifiers.
- Accept one authorized daily request at a time.
- Require and consume the funded single-use mint/day admission permit.
- Fix request inputs, seed, and ruleset.
- Enforce pending-day transfer behavior.
- Accept only authorized result finalization.
- Prevent duplicate settlement and stale-state writes.
- Enforce §12.9's mandatory contract validation floor and §12.12's hard settlement deadline.
- Apply alive/dead transitions.
- Enforce testnet committed-day allowances.
- Maintain treasury-related payment accounting where included.
- Expose reliable state and metadata reads.
- Emit documented lifecycle and outcome events.

The core does not decide colorful authored dialogue.
The core does not directly call the offchain model over HTTP.
The core does not interpret arbitrary natural-language instructions from a browser.

### 13.3 Home module

Home defines the safe domestic environment and approved interactions with its fixtures.
It owns the meanings of room identifiers and usable object positions.
It defines baseline cleaning, resting, organizing, and maintenance actions.
It defines how approved accidents damage the home or the rooster.
It defines furniture placement constraints within the fixed connected topology.
It ensures generation does not block essential routes.
It distinguishes permanent fixtures from resources consumed to create temporary furnishings.
It defines a placed object's lifetime in committed game days.
It prevents expiry from removing a required route or trapping the rooster.
It lets Jev choose among allowed placement or rearrangement alternatives.
It does not let Jev invent unreachable coordinates.
A presentation route follows legal room connectivity.
Walking animations do not reduce health merely because a renderer takes longer.
Cleaning may support multiple needs through authored rules without becoming a dominant infinite action.
Resting cannot create unlimited energy beyond the approved cap.
Maintenance consumes the specific applicable supply once.
A house-level accident must respect the injury and rescue windows in the gameplay rules.

### 13.4 Kitchen module

Kitchen defines food, drink, preparation, and safe consumption semantics.
It recognizes water, milk, bread, steak, coffee, and other approved related supplies.
It distinguishes immediate consumption from a legal prepared meal.
Cooking consumes its required ingredients once.
A prepared meal grants its documented immediate bounded effects; it does not create an additional stored supply type.
The system cannot repeatedly cook the same steak from an unchanged inventory snapshot.
Kitchen tracks any food spoilage through game-day rules.
No wall-clock absence causes spoilage.
Consumption has explicit nutrition and hydration effects.
Coffee's benefits and penalties must remain bounded and readable.
A sick rooster's treatment priority is informed by visible conditions.
Kitchen does not let the model declare that food has arbitrary magical healing properties.
Alternative uses are authored, situational action choices.
One item can offer several possible uses, but only its chosen consumption happens.
A recipe declares all of its inputs; a day adds at most three distinct delivery units, and may add none.
Stored supplies may satisfy a recipe alongside the day's delivery.
Kitchen exposes current legal cooking and consumption options to chapter ten's planner.

### 13.5 Garden & Leisure module

Garden & Leisure combines a tiny garden with low-scope morale activities.
Combining these domains avoids creating a large fourth subsystem at launch.
It recognizes approved seeds, water use, compost, and a small fixed number of plots.
Plot initialization is derived from the house's approved generated variant.
Growth advances only during committed game days.
Harvest output is bounded and versioned.
A seed is consumed on successful planting.
A plot cannot simultaneously contain conflicting plants.
A harvested plant transitions to its approved next state.
Rose and apple plants have clear distinct purposes.
A garden cannot create an unbounded stockpile without time, opportunity, and resource tradeoffs.
Leisure includes permitted quiet activities using the home and current objects.
Morale benefits use chapter 5's proposed limits: ordinary leisure restores ten morale, has a ten-logical-slot cooldown, and is available at most twice per biological day.
Rest uses the corresponding separate cooldown/use counter under the same scheduler; no module silently creates an unlimited recovery loop.
A leisure choice must not bypass urgent rescue rules by secretly curing every need.
The planner can still make an imperfect choice when personality and context allow it.
Gardening accidents and weather effects use the day's fixed random stream.
The umbrella's legal uses are explicit options rather than unrestricted textual reasoning.
Future garages, encounters, and social activities are outside this launch module.
They may add new versioned action families later.

### 13.6 Shared state and effect contracts

Every legal action has an approved identifier.
Every action specifies preconditions.
Every action specifies resources consumed.
Every action specifies bounded numeric effects.
Every action specifies relevant condition changes.
Every action specifies any legal random branch.
Every action specifies the information needed for its compact receipt.
Every action specifies an authored visual and message family.
Its exact family/target/variant and mechanical event outcome fit §11.4's required compact history encoding.
Modules use shared identifiers for needs and conditions.
Home must not interpret health differently from Kitchen.
All modules use chapter 5's hundredth-point numeric semantics, tagged-effect rounding/clamping, and chapter 4's single logical-slot/phase clock; display rounding never changes saved values.
A condition has one canonical owner or one documented shared resolver.
Two modules cannot consume the same item in the same decision.
Cross-module recipes must declare their dependency explicitly.
A new module cannot silently redefine an existing supply identifier.
Unknown action identifiers fail validation.
Unknown condition identifiers fail validation.
Missing optional visual content receives an approved presentation fallback.
Missing rules never receive a favorable invented outcome.

### 13.7 Version adoption

Mint records the initial approved ruleset.
A day request records the versions used for that attempt.
An upgrade cannot reinterpret an already accepted pending seed.
A completed replay retains its original event semantics.
A future balancing version needs a declared adoption rule for existing alive tokens.
The proposed default is adoption at a subsequent day boundary with visible release notes.
Material economic or survival changes require deliberate product review.
Do not change the meaning of a five-point birth allocation without checking old saves.
A migration must be deterministic, bounded, and recoverable.
It must not resurrect dead tokens by omitting their status.
It must not reset the three-day testnet cap.
It must not turn previously valid inventory counts into negative values.
The service must retain or reproduce the rule versions needed by pending work.
That execution bundle includes chapter 10's frozen prompt/context projection, candidate policy/order, personality representation, adapter/model-version policy, and compatible checkpoint encoding.
Reusing an old rules identifier while changing that bundle is not a compatible resume.
An old deployment rollback cannot corrupt jobs created by a newer encoding.
If compatibility is missing, pause those jobs instead of guessing.
Reconcile/resume them through the matching retained version within their hard deadline, or use the confirmed Failed/expiry path without biological advancement.
Keep compatible packet/content decoders and current-save decoding assets for the periods in §15.4; deployment rollback does not shorten those obligations.
The collection must not grant every historical module unrestricted future write authority.
The permissions for each active module remain explicit.

## 14. Mint pricing, daily fees, and the treasury

### 14.1 User decisions and economic limits

The mint targets approximately one US dollar paid in ETH.
A wallet connects to the selected Robinhood network and confirms the purchase.
The mint revenue belongs to the developer-controlled treasury.
Ordinary days use the user's intended gas-based small processing fee.
There are no paid item purchases or paid upgrades in version one.
A product must show the total expected payment honestly.
Actual network fees and a treasury processing fee are different charges.
Calling both charges gas would obscure where the money goes.
The interface shows one compact estimated-total line beside the normal primary action.
An optional details expander explains network and treasury portions without a second confirmation screen.
Use readable text; deliberately tiny or unreadable disclosure is not acceptable.
The developer-controlled total gas multiplier starts at two and may change prospectively.
No design decision silently adds a separate minimum daily fee.
Measure operating costs and disclose any subsidy rather than claiming coverage from an estimate alone.
A free-ish game is an aim, not proof of sustainable hosting.
The mint treasury is a source of possible operating subsidy.
It does not eliminate inference, hosting, or settlement costs.

### 14.2 ETH conversion for the mint

Use an approved ETH/USD feed to calculate the ETH amount for the roughly one-dollar purchase.
Read from the appropriate proxy through its supported aggregator interface.
Read the feed's decimal scale rather than assuming it.
Require a positive answer and a valid update time.
Apply a documented maximum acceptable age compatible with the actual feed heartbeat.
A tiny arbitrary freshness window can reject a healthy heartbeat-based feed.
Do not use a guessed heartbeat.
Round the required amount in a documented direction.
The buyer receives a quote with an explicit short validity period.
The submitted transaction enforces the quote's permitted bounds.
A material price change produces a refreshed quote rather than an unexplained overcharge.
Protect excess payment through a clear refund or exact-value policy.
A rejected payment must not mint a partially initialized token.
The quote also includes the wallet's separate estimated network fee.
Mint's first-day authorization is included in its funded admission permit, without a second introductory owner transaction or separate mint purchase on retry.
No fiat onramp is required for launch.

### 14.3 The supplied Chainlink feed

The user suggested the Robinhood mainnet ETH/USD shared-SVR feed page.
Reference: [ETH/USD shared-SVR feed](https://data.chain.link/feeds/robinhood-chain/robinhood-mainnet/eth-usd-shared-svr).
Research date: 31 October 2026, Asia/Bangkok.
Read-only verification of the official directory and Robinhood mainnet RPC on that date identified these deployed proxies:

| Official feed variant | Observed proxy address | Observed read results |
| --- | --- | --- |
| Standard ETH/USD | 0x78F3556b67E17Df817D51Ef5a990cDaF09E8d3A9 | Bytecode present; decimals eight; description ETH / USD; positive answer returned |
| Shared-SVR ETH/USD | 0x5058aDee53b04e374d8bEDbAD634Bc4778F50b22 | Bytecode present; decimals eight; description ETH / USD; positive answer returned |

These are dated observations, not permanent production configuration or a current quoted price.
The exact feed heartbeat, intended consumer smart-contract caller behavior, and usable testnet feed remain unverified.
A positive answer alone does not establish freshness without the verified update/heartbeat policy.
Select the appropriate standard or shared proxy from official documentation and validate it in the actual consumer contract context before mainnet.
The Chainlink SVR documentation says the feed-reading interface matches ordinary price feeds.
Shared SVR feeds are intended for general protocol integrations.
The game needs price reading, not a liquidation auction or value-recapture strategy.
Using a feed with SVR in its label does not make the game an oracle implementation.
Recheck the selected deployment before use, including chain ID, bytecode, description, decimals, positive answer, valid update time, official heartbeat/freshness bound, and caller access.
Keep the permanent verified configuration and a sanitized dated observation outside TEMP before implementation depends on them; scratch research is not a runtime dependency.
Confirm whether a usable testnet feed exists.
If not, a clearly marked testnet mock can test price-conversion behavior.
A mock must never be selected by mainnet configuration.
The feed gate includes a fail-closed policy for unavailable or stale data.

### 14.4 Daily gas-based quote semantics

The initial rule is an owner total near twice the estimated request network fee.
The product quotes the estimated owner-request network fee.
It separately quotes a processing amount sent to the treasury.
Processing equals the current multiplier minus one, multiplied by that request-fee estimate.
The total multiplier begins at two; a later developer change to three is supported prospectively.
The core contract stores the current multiplier as an integer of at least one.
Only the developer-controlled contract-owner role may change it.
An accepted configuration change records the previous and new values in a chain event.
The quote binds the applicable multiplier and maximum authorized processing payment.
Changing the configuration affects new quotes, not requests already accepted under an earlier quote.
The short-lived signed quote is also the funded single-use admission permit defined in §12.5; it binds the request, network estimate, multiplier, payable processing amount, capacity reservation, and acceptance expiry.
The contract validates and consumes that authority rather than letting a client choose arbitrary payment or bypass capacity with a direct call.
The displayed total combines these two expected costs.
The actual network fee is determined by the accepted transaction.
It may differ from its estimate.
Therefore the actual total is not guaranteed to equal exactly the configured multiple of actual gas spent.
The processing amount is the explicit transaction value or approved contract charge.
It is not a mysterious extra network gas multiplier.
Do not manipulate wallet gas limits to disguise a treasury payment.
Do not send an excessive gas price merely to make the interface's arithmetic match.
A quote expires and is refreshed when its chain assumptions become stale.
The owner can review the total before signing.
The primary action needs only a compact readable estimated total with optional expandable details.
Calculate payments in integer ETH base units and keep display precision separate from payable arithmetic.
Never render a positive estimated total as literal zero or Free: use enough ETH precision, or a clear Est. <$0.01 with a valid fiat conversion and exact ETH amounts in optional details.
When optional fiat data is unavailable/stale, show ETH and label fiat unavailable; mint's required oracle policy still fails closed.
Check one-wei, sub-cent, zero-processing-at-multiplier-one, and ordinary quotes without introducing a hidden minimum or another UI step.
Do not add another fee-confirmation modal or extra navigation step.
The details distinguish network fee from processing and can show the current multiplier.
The transaction must enforce a maximum authorized processing amount.
An accepted quote keeps its authorized fee even if the developer changes the multiplier while it is pending.
New quotes disclose the newly effective amount before the wallet opens.
If the app cannot quote reliably, it should pause submission rather than invent a cheap number.
The testnet version clearly distinguishes valueless test ETH.

### 14.5 The second transaction is an operating cost

The owner-request transaction is only one part of a day's cost.
The backend pays finalization gas from the relayer's ETH balance.
That expenditure does not appear automatically in the owner's request estimate.
The processing fee can contribute to it.
No equality between the two transactions' gas usage is assumed.
Finalization may include state changes and compact receipts with much larger payloads.
Storage growth, changed inventory fields, and death transitions can affect gas.
A day that dies early may have different costs from a full surviving day.
A retry can add external and hosting cost without increasing user revenue.
An ambiguous broadcast may require an RPC recovery operation.
The economic model must use observed completed-day costs.
A single cheap request estimate cannot establish profitability.
Measure at least representative normal, inventory-heavy, gardening, and terminal days.
Include a high-cost percentile and a bounded retry allowance.
Include the expected network fee for initial mint and first-day finalization.
Keep measurements separate for testnet and mainnet.

### 14.6 Jev cost arithmetic

The observed research price supplied to planning is 0.042 dollars per million input tokens and zero output-token price.
That is a dated observed price, not a lifetime promise from the provider.
A sample request using 428 input tokens costs 0.000017976 dollars at that rate.
Sixty comparable calls cost approximately 0.00107856 dollars.
One thousand comparable full days cost approximately 1.07856 dollars in inference alone.
A real day may use longer context than the sample.
Retries, changed model pricing, and additional validation requests can increase this amount.
The operating ledger should record actual billable tokens and provider usage.
It separately records successful model choices, actual client HTTP sends, internal retries, and ambiguous billing under chapter 10's bounded transport policy.
The provisional reservation envelope is at most 72 actual client HTTP sends per attempt, at most two additional sends for one step, ten seconds per send, and at most 4,000 input tokens per send; SDK retries are disabled or included in those sends.
At the dated observed rate, 72 sends each at that input ceiling imply up to $0.012096 in input-token arithmetic before unobservable provider-internal uncertainty; this is a conservative configured envelope, not a measured normal day or billing guarantee.
Do not treat a probability-vector response as unmetered inference.
Do not treat a zero output-token rate as a free whole request.
The sample arithmetic excludes Netlify and finalization gas.
The first-day automatic run is still paid inference.
Three trial days at the sample rate cost approximately 0.00323568 dollars per NFT in inference.
That three-success calculation excludes all Failed/Expired attempts and their actual/uncertain spending; §15.9 meters those separately rather than treating them as free.
Repeated trial mints multiply that cost.
The initial one-dollar AI balance and the mint's one-dollar revenue are different things.
Only the AI balance directly authorizes requests to the provider.

### 14.7 Netlify operating costs

The cost model must include paid function runtime while waiting for sequential model responses.
At one gigabyte allocated for eighty-four seconds, one day uses about 0.02333 GB-hours.
At the researched ten-credit rate, that is about 0.2333 Netlify credits before other work.
One thousand such jobs would use about 233.3 compute credits.
That is an estimate for the stated runtime and allocation, not a measured deployment bill.
The provider's plan and included credits determine the user's actual out-of-pocket timing.
Recharge equivalents differ between plans.
At observed published bundles, the illustrative compute equivalent is roughly 0.00156 to 0.00233 dollars per day.
Reservation measurements also cover the transport envelope, checkpoint/backup operations, continuation/recovery scans, failure recording, replay serving, and ordinary public endpoint traffic.
Do not present an included quota as an infinite free operating budget.
Requests, bandwidth, persistence, retries, and scheduling can add consumption.
Direct NEAR AI calls should not be routed through a paid Netlify AI gateway without a deliberate reason.
Calling an external provider directly still incurs function runtime and the provider's own charge.
A changed host memory setting changes the arithmetic.
Actual measurements must replace these planning estimates before mainnet.

### 14.8 Treasury and separate balances

Track treasury ETH, relayer ETH, NEAR AI credits, and Netlify credits as separate balances.
The treasury receives mint revenue and the explicit processing charge.
The relayer needs ETH available to complete accepted days.
NEAR AI needs its own usable inference credit balance.
Netlify needs an available hosting allowance or paid credit balance.
ETH arriving in the treasury does not automatically top up those services.
No automatic asset conversion is included in this plan.
An operator may withdraw treasury funds under the developer-controlled withdrawal permission.
Withdrawal does not give the operator the right to alter user NFT ownership.
The relayer should have only the amount required for bounded near-term operation.
The settlement key should not be the browser application's signing key.
The public application never receives either private key.
Receipts and dashboards should expose enough operational accounting to diagnose shortfalls.
Private key material must never appear in those diagnostics.
Treat the offered five-dollar wallet funding as a finite initial operating deposit.
It is not evidence that deployment, bridging, inference, and hosting are permanently funded.
Testnet faucet balances have no value toward real provider bills.
An operating reserve policy must be checked before withdrawing all treasury ETH.
Use §15.8's next-review horizon and separate-balance headroom calculation before withdrawals, deployments, or new trial allocations.

### 14.9 Operating measurement and mainnet review

Prepare an observed cost sheet for representative completed days during testnet.
Record average and high-percentile input tokens.
Record model retries and their cost.
Record actual transmitted HTTP attempts, ambiguous billed work, failed/expired fresh attempts, and their wallet/global operating allowance debits.
Record function runtime, memory allocation, and associated hosting usage.
Record request and finalization gas estimates against actual accepted receipts.
Record replay payload size and served bandwidth.
Record retained primary/backup bytes and decode assets under §15.4's declared retention policy, plus non-job requests, scheduler/recovery overhead, deploys, and shared-account headroom.
Record projected trial demand and abuse limits.
Compare processing revenue with all per-day operating costs.
Separately model mint revenue available to subsidize future lives.
Do not assume every rooster dies near thirty days when calculating liabilities.
A well-cared-for rooster may live indefinitely in game days.
If the user's gas-based charge is insufficient, disclose the measured gap and current reserve runway.
The user accepts prospective multiplier changes; apply them through new readable quotes only.
Do not invent a new minimum fee or reduce the designed decision target without discussing that change.
The owner may consciously subsidize operation from mint revenue and finite credits.
Mainnet is not blocked solely because break-even cannot be mathematically guaranteed.
The launch review must still identify funded capacity and behavior when that capacity runs out.
The interface must not promise perpetual funded support from an unmeasured budget.
An accepted request should not be abandoned because new requests consumed its reserved completion capacity.

## 15. Hosting, durable jobs, budgets, and operational boundaries

### 15.1 Deployment principles

Netlify already hosts the project's intended public site.
The repository's main-branch pushes trigger production deployments and consume credits.
Keep production pushes infrequent and deliberate.
Use local iteration and appropriate preview workflows before production.
Temporary research files belong in TEMP and cannot become runtime dependencies.
The application, functions, rule assets, and replay encodings must live in permanent project locations.
No production service may read a developer's desktop answer sheet.
No deployed job may depend on files left in TEMP.
Configuration identifies network, collection, oracle, provider, relayer authority, and storage namespaces explicitly.
Preview contexts must not inherit unrestricted mainnet settlement authority.
Testnet trials and mainnet paid play use separate namespaces and limits.
The public site can share code while enforcing that separation.
A production rollback must preserve compatible access to already accepted jobs.
A deployment is not evidence that existing jobs were migrated safely.

### 15.2 Researched host capabilities

Research date: 31 October 2026.
Netlify documents background functions with up to fifteen minutes of execution.
They return HTTP 202 acceptance and continue independently of the requesting browser.
The documented retry sequence includes a retry after one minute and another after two minutes.
These platform retries can repeat work unless the application is idempotent.
At the planning estimate, an eighty-four-second sequential day fits within fifteen minutes.
Worst-case retries and stalled provider calls still need bounded deadlines.
The configured 72-send/ten-second transport envelope alone can consume twelve minutes; do not assume that leaves enough of a fifteen-minute invocation for all persistence, backoff, and settlement.
Measure margin and use durable continuation before the host bound when necessary, while retaining the separate thirty-minute provisional request deadline.
A function's time budget is not a durable-state guarantee.
Current Netlify Blobs API documentation includes atomic conditional writes using new-key and matching-ETag conditions.
It also offers strong consistency for relevant reads.
The same documentation retains some general last-write-wins cautions.
Verify the exact chosen SDK's conditional behavior in deployment before relying on it.
Do not implement a lease as an unconditional overwrite.
Netlify Async Workloads is an alternative with durable steps and retry controls.
Its production scheduler can create continuing usage even when players are inactive.
Choose its use from measured reliability and budget needs.

### 15.3 Proposed minimum hosting shape and endpoint boundaries

An authenticated quoting endpoint reserves capacity and issues §12.5's one-use permit before payment.
A short acceptance endpoint verifies/reconstructs the canonical request and its existing funded job obligation.
A privately authenticated background invocation performs bounded sequential planning; public callers never supply worker authority.
Short status/current-state endpoints read durable/canonical facts, and an ownership-checked result endpoint serves bounded replay packets.
Status reads do not dispatch new paid work.
The independent reconciler in §15.5 discovers every nonterminal handoff, while the serialized outbox submits/recovers terminal transactions.
A small operator view or documented local procedure inspects budgets, due actions, and failures without adding a player dashboard.

Every public endpoint applies bounded input size/schema/identifier/network allowlists before costly signature, chain, storage, or provider dependencies.
Cache and coalesce repeated reads of the same canonical identity; use bounded pagination and response sizes rather than unbounded history/collection retrieval.
Set wallet/session and deployment-wide work limits for quotes, status, replay retrieval, rejected input, and wake attempts; address rotation must not bypass the global bound.
Authenticate the wallet/session before allowing scarce quote holds, bound outstanding holds, and preserve completion headroom separately from public-read traffic.
The exact existing-host controls remain implementation choices, with measured limits in release configuration; platform throttling supplements atomic spending reservations.
Replay downloads/backoff and maximum payloads are part of the ingress/serving budget, not only the AI-call ledger.
Residual volumetric hosting/RPC risk remains; this plan does not mandate a paid security product or promise DDoS immunity.

The provider and relayer keys remain server-only.
The browser sends approved identifiers rather than arbitrary fetch URLs, blob keys, or execution instructions.
Client input is checked against canonical chain state; an authenticated session does not make its payload authoritative.

### 15.4 Durable records, retention, and restoration

This section is the single retention authority referenced by journeys, playback, transfer, and operating-cost planning.
The proposed minimum distinguishes the permanent owned information in §11.4 from hosted presentation availability.

| Record | Required persistence/retention | Recovery boundary |
| --- | --- | --- |
| Canonical current save, birth, compact day/slot history | Required onchain information under §11.4 | Public permanent project decoders/assets allow cold restore without game backend, browser storage, old checkouts, or TEMP |
| Admission ledger and request index | Protect outstanding permit/accepted request obligations; retain terminal accounting as needed for budget audits | Network/collection scoped; canonical input digest and block/log provenance support reconciliation |
| Job header and atomic control record | Active work protected through its canonical terminal transition plus seven calendar days | Lease generation, lifecycle, accepted head/revision, due next action, and funded reservation survive deploys |
| Accepted checkpoints and prepared results | Protect while active and through canonical terminal transition plus seven calendar days | Immutable accepted sequence; unaccepted orphan candidates are not authoritative progress |
| Latest accepted cinematic packet, including unviewed or terminal replay | Retain while it remains the token's current accepted result and the service is operational | Primary and protected second copy plus digest/version manifest are verified before finalization |
| Superseded full cinematic packets | Retain for thirty calendar days from supersession; older access is best effort | Transfer does not reset dates; historical pruning never removes current canonical state/history |
| Full raw model diagnostics and safe errors | Retain thirty calendar days, with active-work protection taking precedence | Credentials excluded; a small sanitized representative trace may be promoted to permanent release evidence |
| Outbox and usage accounting | Protect unresolved entries; retain terminal nonce/operation summaries and usage aggregates as needed for budget audits | Actual/uncertain spend is never erased by failure, expiry, transfer, or a new attempt ID |
| Rules, public current-save decoders, packet/content decoders | Keep at least as long as all current onchain state and every promised retained packet requires | Historical display support grants no historical module write authority |
| Client convenience | Optional local playback cursor and selected token only | Loss restarts presentation, never life simulation |

Protect the second copy from routine primary cleanup and maintain a manifest of request/result digests, encoding versions, and existing retention dates.
The protected cinematic packet also protects the recorded-brain minimum from §12.8 for the packet's entire promised lifetime, including a current result reopened after six months.
Pruning full raw requests/diagnostics after thirty days must not remove the original offered alternatives, selected action, replay snapshot, outcome, model identity, or supplied optional telemetry required to inspect that retained replay.
Full raw-exchange inspection outside the diagnostic window is not promised unless that data was deliberately retained; show its absence honestly rather than reconstructing it and calling it the original exchange.
Perform periodic verified exports to a protected permanent operator location outside TEMP; include the byte/serving/export allowance in the operating ledger.
No new paid service is mandated. A second copy within the same hosting provider is not independent protection against a provider-wide or account-wide outage; name that boundary honestly in the operator runbook.
During such an outage the canonical chain save remains readable, but hosted cinematic playback may be unavailable until restoration.
An authenticated packet export is offered when practical; owners do not have to make exports to preserve the canonical save.

A missing or legitimately expired packet offers the compact chain summary and an explicit skip/continue-to-current-save or memorial action, without fresh inference, payment, or reroll.
This fallback does not authorize deleting a still-promised latest packet.
Retention does not advance hunger, growth, object wear, biological day, or condition deadlines.

Use site-wide storage across deploys; a deploy-specific store cannot be the only copy of accepted work or a promised packet.
Keep preview and production namespaces/access distinct, derive keys from verified request identities, and prevent preview cleanup from deleting production records.
Keep private secrets and raw wallet signatures out of public diagnostics and replay packets; store no unrelated account/browser data.

Restoration acceptance finishes a day, closes the browser before viewing, deploys/rolls back, and opens the same digest on another device; it also removes a primary test copy and restores from the chosen protected source.
Age a superseded replay past thirty days and verify the truthful compact-summary exit, then repeat after transfer and for a terminal day.
Cold-restore acceptance under §11.4 is separate from cinematic restoration.
After pruning seven-day checkpoints and thirty-day raw diagnostics, reopen a six-month-old still-current packet and inspect a pinned choice: its original candidates, selected target, matching state, and supplied telemetry must remain available without inference or reconstruction from missing diagnostic bytes.
Promote the small sanitized release-evidence bundle needed to reproduce permanent findings before bulk scratch logs in TEMP are discarded; chapter 20 defines that evidence spine.

### 15.5 Lightweight background-worker option

The proposed budget baseline is a background function with durable application checkpoints.
Use strong reads and conditional creation/update on §12.6's one authoritative job control record.
Immutable candidate checkpoints are accepted only by the fenced control-head update; terminal publication uses the same generation/status/revision checks.
A duplicate invocation returns or resumes from existing progress.
A stale lease holder cannot move that pointer backward.
The worker stops before the host hard timeout.
A bounded continuation resumes remaining work on the same request.
The frontend polls a status endpoint with sensible backoff.
Status polling stops when the tab closes.
The worker's authority does not depend on continued polling.
A chain-request recovery scan covers the gap between accepted transaction and initial invocation.
It scans every nonterminal stage, including accepted/no-job, queued/no-first-lease, stale lease, persisted continuation not invoked, prepared/not-journaled, journaled/unconfirmed, and local failure awaiting chain resolution.
Each stage has a durable next action/due time or an equivalent deterministic derivation; repeated dispatch is harmless and status polling is never its trigger.
The proposed maximum recovery scan interval is sixty seconds while accepted work or outstanding permits exist, subject to measured host cost and enough deadline margin.
Use a low-cost scheduled scan or another measured reliable trigger, including reliable discovery of new chain acceptance when no browser is open.
Measure the idle trigger cost; an idle site need not run a busy loop, but outstanding permits cannot disappear from discovery merely because the accepted-work list was empty.
Verify cursor ancestry/overlap and input digests under §12.14 rather than trusting a last-seen block number alone.
Do not quietly create a perpetually busy polling loop.
The operational plan documents how to resume a stuck day when automated recovery is exhausted.
Fault acceptance kills the process immediately before/after every durable-write-to-dispatch handoff, especially job-created/no-lease and continuation-written/not-invoked, with the browser closed.

### 15.6 Durable-workflow alternative

Netlify Async Workloads can turn a multi-step function into a durable workflow.
Successful persisted steps are designed not to repeat during retries.
Its infrastructure uses functions and blobs and consumes the corresponding hosting resources.
It requires enabling the extension and configuring its access.
Do not install it as a hidden planning-stage account change.
A workload can group several decisions into one bounded execution while checkpointing accepted results.
Do not assume sixty event-chained workloads are cheaper than one carefully checkpointed worker.
The researched default event-chain limit is twenty.
A design using sixty chained events must explicitly change or avoid that constraint.
The researched production scheduler defaults to sixty-second polling.
Its configured limits and idle cost must be measured.
A quiet game should not spend a large share of its budget maintaining an unnecessary queue.
If the lightweight option cannot meet recovery requirements, evaluate the workflow option first.
If neither fits the approved budget, report the tradeoff before adding another paid service.
This document does not require a third-party database account by default.

### 15.7 Runtime and latency controls

Chapter 10 owns the transport policy: at most 72 actual client HTTP sends per attempt, at most two additional sends per step, ten seconds per send, and a proposed 4,000-input-token ceiling.
One application layer owns retries; disable or count SDK retries and record every actual send, ambiguous call, successful choice, and reported billed usage separately.
Retry only the bounded transient categories; schema/authentication/core-choice errors use the documented stop policy rather than a loop.
No retry changes a logical slot, seed, accepted checkpoint, or frozen configuration.
Stop at the transport, worker, or request-deadline guard, whichever first limits safe continuation.
Stop at terminal death rather than consuming the unused decision allowance.
Reserve time for final validation and durable packet writes.
Do not spend the final host seconds waiting on another model call.
If a day needs continuation, persist the handoff before the old worker stops.
A new worker begins from the durable checkpoint.
The reconciler must dispatch a handoff even if the old process dies before invoking its successor.
The frontend reports completed work rather than a guessed countdown.
Global concurrency limits protect service budgets and relayer nonce handling.
A queued accepted request retains its seed and gifts.
The player does not need to remain online for its turn to progress.
A replay never waits for fresh inference.

### 15.8 Admission and completion budgets

The service distinguishes pre-payment funded admission under §12.5 from completing its accepted obligations.
Before issuing a permit, record current usable AI, relayer ETH, and hosting allowances; the account/plan scope; balance observation time and allowed freshness; credit expiry; and the next planned operator-review horizon.
Available capacity is the minimum funded attempt capacity across these separate balances after subtracting accepted jobs, outstanding permits, bounded ambiguous/retry/terminal-transaction costs, expected non-job/deploy/traffic consumption until that review, and measured safety headroom.
The runtime/token/transport envelope, chain fee spike/replacement bounds, storage/backup/serving costs, and any ETH/USD reserve valuation assumptions are recorded inputs to that calculation.
Shared team/account host usage and other projects may consume the provider balance despite a local hold; inspect the actual account scope before treating it as dedicated.
Protect headroom before a production deploy, new public-trial allocation, or treasury withdrawal, and stop new permit issuance before a provider's exhaustion threshold.
The internal reservation is accounting, not a promise that providers offer atomic credit holds.
When balance APIs are unavailable, use conservative local quotas and operator checks.
Stale, unknown, or unexpectedly shared consumption uses a conservative cap or pauses new permits; never count unconverted treasury ETH as provider/host credit.
Do not overcommit hundreds of accepted jobs against one small remaining balance.
A low-balance state pauses new requests with readable product copy.
Already accepted work has priority over new trials.
The service records actual usage and reconciles reservations after completion.
Reconcile unused portions after every confirmed terminal outcome, including Failed and Expired, while retaining actual and ambiguous spend.
An abandoned worker lease does not free the underlying day's completion obligation.
A terminal early day releases only the unused allowance under the documented accounting.
Provider credit purchases remain an operator action unless a later approved integration automates them.
The treasury does not automatically refill any service.
A measured small operating reserve is required for the mainnet launch gate.
No assumption of an additional monthly user budget is imposed.
The operator can deliberately fund a finite subsidy and choose the funded trial limits/review horizon after measurement; mathematical break-even is not itself a mainnet gate.
An unavailable refill operator or shared-account exhaustion can still interrupt service; the runbook identifies that remaining boundary and permissionless expiry preserves token transferability.

### 15.9 Three-day testnet trial

The testnet trial includes three total committed days per NFT.
The automatic first day consumes the first of those three only when its biological result commits.
The player can request two more committed days if the rooster survives.
The cap is tied to accepted results, not animation plays.
Rewatching or reopening a replay does not consume another day.
An AI retry for the same request does not consume another day.
A terminal accepted day still belongs to the three committed-day allowance.
Reaching the cap alive is trial completion, not an illness or death event.
The UI shows the remaining day allowance before submission.
Trials use real inference credits even though their ETH is valueless.
Unlimited free NFT creation could bypass a per-token limit.
Maintain separate wallet-level and global service attempt/spending allowances, in addition to the token's three committed-day access counter.
Every admitted mint/first-day attempt, ordinary trial attempt, fresh Failed/Expired retry, internal retry, ambiguous billed call, host operation, and terminal-transaction cost debits or reserves those operating allowances.
Failed/Expired attempts consume no committed trial day but cannot recreate money already spent; release only the unused reservation after canonical reconciliation.
Use explicit operator-configured per-wallet attempt/spend and global spend ceilings for a recorded operating window/reset time; numerical limits derive from the funded measured budget before public trial.
Token committed-day/history counters follow transfers and migrations. Historical wallet debits remain with the wallet that caused them, while the global ledger persists across wallets, new NFTs, transfer, and request IDs.
Operational allowance exhaustion pauses admission with Trial capacity reached or Service capacity reached; it is not Trial complete, a revoked gameplay day, or a biological death.
Do not advertise unlimited trial mints until their cost is funded.
Rate limits supplement those quotas.
The design does not claim that wallet limits prevent determined multi-wallet abuse.
Acceptance forces repeated substantial-progress failures and expiry across one token, new tokens, transferred tokens, and rotating wallets: no biological counter advances, every actual/uncertain cost remains charged to operating budgets, and no further permit is issued beyond the global funded bound.

### 15.10 Failure categories and user messages

A wallet rejection leaves the rooster unchanged and creates no accepted request.
An unconfirmed broadcast is shown as waiting for the network.
A confirmed request with no worker is shown as accepted and waiting for planning.
A provider outage receives bounded service retries, then a Failed attempt with the normal fresh-transaction path.
A low operating balance pauses admission rather than blaming the rooster.
An invalid result is a service issue and must not create a fabricated death.
A finalization receipt delay is shown as saving, with recovery still running.
A missing replay packet after settlement is a presentation-availability incident.
It does not mean that the rooster's accepted state can be rerolled.
Offer §15.4's compact-summary/skip/continue fallback, including an accurate memorial if the unavailable packet was terminal.
A stale owner session requests a state refresh.
A wrong-network wallet is asked to switch before submitting payment.
A token's three-committed-day cap receives a trial-complete explanation; an operating-spend cap receives a capacity pause instead.
A dead token receives its memorial state.
Error text stays inside the square overlay flow.
Diagnostic identifiers can be copied without displaying private credentials.
The default message must not claim that a confirmed transaction was deleted.

### 15.11 Secret handling and trusted-relay honesty

NEAR AI credentials live only in authorized server configuration.
Relayer credentials live only in authorized settlement configuration.
Treasury withdrawal credentials remain separately controlled.
None belongs in source control, screenshots, public metadata, or browser bundles.
A public wallet address is safe to share for funding.
A private key remains sensitive even when the user permits operational use of a small wallet.
Avoid recording secrets in logs during debugging.
A key-management failure can affect provider credits and accepted game days.
Scope permissions and balances to reduce that impact.
The service may inspect signed provider receipts as operational evidence.
A receipt is not proof that model execution occurred in an attested environment.
The researched Jev availability must not be marketed as TEE-backed when its metadata does not support that claim.
The contract trusts the approved relay's submitted result within enforced rules.
The application should describe that trust honestly.
This is an experimental game with a practical trusted bridge.
It is not a trustless AI oracle or fully onchain inference system.

### 15.12 Operations and deployment gates

Before testnet, prove that one accepted day survives tab closure.
Before testnet, prove that duplicate invocation cannot duplicate accepted decisions.
Before testnet, prove that stale workers cannot overwrite progress.
Race lease takeover against an old worker's checkpoint and terminal publication while the step head itself has not advanced.
Race pre-payment permits with capacity for one attempt, including direct contract calls, mint, and first-day retry; verify every accepted job retains its reservation without a browser.
Before testnet, prove that a persisted result can be recovered after deployment.
Exercise every persisted-but-undispatched handoff and the current/superseded packet restoration/pruning cases in §15.4.
Before mainnet, exercise finalization ambiguity and nonce recovery.
Crash before/after outbox signing/journaling/send/inclusion/status update while another token uses the relayer; no unrelated call or uncertain nonce may be replaced.
Submit authorized-relay payloads that violate each minimum chain invariant in §12.9 and verify rejection without partial mutation.
Exercise the hard-deadline equality cases, terminal races, request/settlement orphaning, dependent requests, and beyond-policy freeze in §12.14.
Pass §11.4's independent backend-blocked chain-only restore against a separately reviewed expected fixture.
Before mainnet, exercise transfer locking and release policy.
Before mainnet, exercise all trial-cap paths.
Before mainnet, measure hosting and inference costs with representative days.
Use chapter 10's bounded real-Jev full-day evidence gate, separating operational completion from legitimate biological death, and report queue/inference/storage/chain latency and actual sends rather than inferring integrated reliability from a tiny sample.
Before mainnet, verify the live oracle configuration from official sources.
Before mainnet, verify marketplace metadata behavior actually supported on the chain.
Before mainnet, verify a funded relayer can complete reserved work.
Verify actual account scope, balance freshness, next-review horizon, public-read/host/deploy headroom, and conservative behavior when each is unknown.
Use stubbed dependency load/fault checks to bound endpoint fan-out and actual HTTP sends, with no paid calls needed for those checks.
Before mainnet, confirm the treasury permission boundary.
Before a production push, group reviewed changes to avoid unnecessary deployments.
After deployment, confirm current configuration and one bounded smoke path.
Do not repeatedly deploy simply to inspect a cosmetic change.

### 15.13 Technical source notes and verification status

These are narrow factual references; detailed architecture above is the proposed project design.
Sources were reviewed on 31 October 2026.
Service details can change and must be checked again before mainnet.

- [Robinhood network configuration](https://docs.robinhood.com/chain/connecting/): mainnet chain ID 4663 and testnet 46630, ETH gas, published RPCs and explorers.
- Mainnet public RPC: https://rpc.mainnet.chain.robinhood.com; explorer: https://robinhoodchain.blockscout.com.
- Testnet public RPC: https://rpc.testnet.chain.robinhood.com; explorer: https://explorer.testnet.chain.robinhood.com.
- Read-only chain-ID calls in research returned 0x1237 and 0xb626 respectively.
- [Robinhood deployment guide](https://docs.robinhood.com/chain/deploy-smart-contracts/): standard EVM deployment and explorer verification.
- [Robinhood Solidity differences](https://docs.robinhood.com/chain/differences-from-ethereum/): block.number estimates L1 numbering; prevrandao and difficulty are constant.
- [Robinhood fee model](https://docs.robinhood.com/chain/gas-and-fees/): execution and L1 data costs contribute to estimated transaction fees.
- [Robinhood transaction finality](https://docs.robinhood.com/chain/transaction-finality/): soft confirmation, Ethereum posting, and Ethereum finality are different assurance stages; §12.14 states the proposed product policy.
- [Chainlink SVR](https://docs.chain.link/data-feeds/svr-feeds): ordinary aggregator reading interface, shared/general integrations, and SVR variant distinctions.
- [Chainlink feed selection](https://docs.chain.link/data-feeds/selecting-data-feeds): feed-specific update behavior and developer responsibilities.
- [Solidity contracts](https://docs.solidity.org/en/latest/contracts.html): contracts require calls; they do not wake themselves for scheduled game work.
- [Netlify background functions](https://docs.netlify.com/build/functions/background-functions/): independent asynchronous invocation, fifteen-minute bound, HTTP acceptance, and documented platform retries.
- [Netlify Blobs API](https://docs.netlify.com/build/data-and-storage/netlify-blobs/): site-wide storage, configurable consistency, and conditional write options.
- [Netlify Async Workloads](https://docs.netlify.com/build/async-workloads/overview/): durable steps and provisioned-resource billing.
- [Async Workloads configuration](https://docs.netlify.com/build/async-workloads/optional-configuration/): scheduler interval and workload-chain limits.
- [Netlify function billing](https://docs.netlify.com/build/functions/usage-and-billing/): default memory and runtime-based GB-hour measurement.
- [Netlify credit model](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/): compute credits, web-traffic meters, recharge examples, and production deployment credit usage.
- [Netlify rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/): platform limits supplement the bounded endpoint and atomic spending policy; the project's selected controls/account scope remain unverified.
- [Ethereum JSON-RPC](https://ethereum.org/developers/docs/apis/json-rpc/) and [ethers Transaction](https://docs.ethers.org/v6/api/transaction/): signed transaction submission, transaction identity, and receipt recovery support the outbox ordering; no library choice is mandated.
- Chainlink standard/shared proxy addresses and basic mainnet reads: observed on 31 October 2026 in §14.3; official heartbeat, actual consumer-contract behavior, and testnet availability remain open gates. Recheck the chosen deployment before release.
- Actual day-cost coverage under the user's gas-based fee: still unverified; requires deployed measurements.

## 16. Single-square interface, journeys, and scene specification

### 16.1 Authority and presentation intent

The user has fixed the presentation around one square game surface.
The house is the persistent stage and the menu appears over that stage.
The same composition serves phones and desktop screens, with more physical size on desktop.
This chapter proposes the detailed arrangement and recovery behavior for review.
The owner selected the original Moss & Cream top-down handheld RPG reference VR-01, recorded in chapter 17 and the [complete scene map](design/SCENE_MAP.md).
That reference is approved as a visual direction. The complete mockup-guide collection has been generated and reviewed as appearance/placement references; native source-art verification remains implementation work. No screen has been implemented.

The interface must make three questions easy to answer at every point:

- Which rooster am I looking after?
- What has already been accepted or saved?
- What can I do next?

The primary experience is a prepared day in a domestic world.
It must not resemble an investment dashboard or an NFT trading terminal.
Wallet, network, transaction, and inference facts remain available where they affect a decision.
Routine care should require choosing up to three distinct supplies, including none when using stored stock, and approving one owner transaction.
That one-confirmation path assumes a connected wallet on the correct network; a fresh request after failure or an owner-triggered expired-request release is a clearly explained exception.
Watching a replay requires no additional wallet signature or inference request.
There are no buttons that alter the already prepared day during playback.
There is no real-time neglect timer waiting behind the interface.

### 16.2 The square and its responsive behavior

The game occupies a 1:1 surface within the available page width.
The containing page may center that surface with quiet margins.
All gameplay menus, progress views, messages, and scenes stay inside the square.
Supporting legal or attribution links may sit in a restrained outer footer if required.
The outer page must not split into a house canvas beside a permanent statistics column.
An external wallet application or explorer is an explicitly labeled departure from the game.

The proposed minimum visual review width is 320 CSS pixels.
The preferred phone review widths also include 360, 390, and 430 CSS pixels.
A larger desktop square must preserve the same information hierarchy and interaction order.
Scaling may change font size, padding, and detail visibility within reviewed limits.
Scaling must not turn the desktop layout into a separate product with extra required controls.
The square should remain usable when the phone browser changes its address-bar height.
The interface must respect safe areas and avoid controls behind rounded screen corners.
Large operating-system text settings require a reflowing overlay rather than clipped labels.

The proposed overflow contract is one primary vertical scroll region inside the square.
Only a compact token identity and delivery-selection reference need remain persistent; do not pin five full meters, three full warnings, three full item tiles, and the action footer at once.
The scroll region contains status, condition details, the catalog, and item explanations in reading order, without a second tiny nested catalog scroller.
A compact warning summary preserves every lethal next-game-day deadline even when other status details are collapsed.
The catalog may use small pages within that same region; a page change preserves selection and does not move focus unexpectedly.
The footer may stay visible only while it leaves a useful reading and selection area.
At enlarged text sizes, put the footer and its quiet estimated-total line into normal scroll flow rather than covering content or shrinking text.
The selected-item reference may compress to the selected count and short names with an explicit expansion action; the full details remain reachable.
Review P320 at ordinary and 200% text, with all actionable warnings, without horizontal text scrolling, hidden focused controls, or loss of the primary action.

Proposed composition zones are roles rather than a final pixel template:

- A slim top status strip identifies rooster, game day, and a small state badge.
- The central region presents the house and its moving inhabitant.
- A compact bottom message area reports the current authored event.
- Overlays replace the central region when a decision or explanation is necessary.
- A small overflow control exposes sound, motion, help, and transaction links.

The final art direction may integrate these zones into a virtual-pet frame or domestic border.
It must retain a large, readable playfield and avoid decorative controls without a function.
Only essential status stays visible during ordinary replay.
The four needs and health can be inspected without five permanent large meters covering the house.
Opening replay status, event, or recorded-choice detail pauses presentation and pins the inspected replay step and its values until Explicit resume.
Closing detail leaves presentation paused; its Resume action continues from that step.
During preparation, inspection pins an already completed decision while the actual job continues, with a quiet Newer decisions available indication.
Neither behavior pauses, changes, or rolls back the already committed game state or the running preparation job.

### 16.3 One house, several interface modes

The house remains the visual context during idle, supply selection, preparation, and recovery.
Before a day is prepared, the scene may be dimmed and the rooster asleep.
The sleeping pose expresses an idle interface state, not an advancing sleep simulation.
The house becomes active during replay and returns to the idle presentation afterward.
A disconnected visitor sees a representative unowned house, clearly distinguished from a minted rooster.
A wallet with no token sees mint entry over that representative house.
An owner with several tokens sees only the selected token's house.

The proposed mode set is:

| Mode | Purpose | Main action |
| --- | --- | --- |
| Entry | Explain the game and connect a wallet | Connect wallet |
| Mint setup | Name the rooster and distribute five stat points | Hatch rooster |
| Mint processing | Track approval, confirmation, and first-day preparation | Wait or recover |
| Birth | Introduce the confirmed new rooster | Continue |
| Care menu | Review saved status and choose up to three supplies or stored stock | Prepare day |
| Day processing | Track the accepted request, Jev work, and final save | Wait or recover |
| Replay ready | Confirm that the day is saved and available to watch | Start day |
| Replay | Present the committed sequence for about three minutes | Presentation controls only |
| Summary | Explain survived-day changes and the next care priority | Prepare next day |
| Memorial | Retain identity after a final death | View life summary |
| Trial complete | End a living testnet trial at its three-day limit | View summary |

These are modes within one game surface, not a requirement for separate website routes.
Stable route or token parameters may restore the selected token without exposing a public spectator mode.
The owner can navigate away from the site without imposing new risk on the rooster.

### 16.4 Entry and wallet journey

Entry copy must explain that the player chooses supplies and the AI decides how to use them.
It must disclose permanent in-game death before a paid mint.
It must also explain that leaving the site does not cause offline aging.
Before mint or a new daily authorization, concise supporting copy explains: AI prepares first; the saved playback lasts about three minutes afterward; leaving after the request is accepted is safe.
Do not promise an eighty-four-second wait from the one-call research sample; measured preparation ranges may be added only after complete-day testing.
The chain and approximate mint price belong in the mint entry context.
Testnet is a labeled alternative rather than a nearly invisible environment switch.
The testnet entry explains its three committed game-day allowance before minting.
Wallet-level or global operating quotas are separate capacity limits; an exhausted quota must not describe a living, unfinished trial as Trial complete.
Mainnet must not be presented as available until the verified deployment exists.

The connect action opens the supported wallet selection experience.
Returning from a mobile wallet should preserve selected environment and any unsent mint draft.
Rejecting a connection leaves the visitor on entry with an ordinary Connect wallet action.
A missing wallet gets concise installation or supported-wallet guidance.
A failed wallet bridge gets Retry connection and Close actions.
Never display a permanent red failure screen simply because the visitor declines to connect.

After connection, inspect the actual active chain.
If the chain is wrong, show the desired network name and a Switch network action.
If switching fails or is declined, keep the game readable with mint and daily submission disabled.
Do not imply that viewing a saved state requires paying a transaction fee.
Changing accounts immediately clears ownership-derived action availability until it is checked again.
Unsent supply choices remain a token-and-network-scoped local draft, revalidated against that token after reconnecting; they are never copied to a different rooster.

### 16.5 Mint setup and confirmation

The proposed mint setup captures the name and five-point allocation in one compact overlay.
Its action area carries a quiet purchase summary, chain label, and short first-day/death information.
Fee information does not create an extra screen, confirmation modal, or required review step.
The name input clearly shows its eight-character maximum.
The allowed character set and normalization must match the contract's eventual validation rules.
Do not silently truncate a pasted name that would be rejected by the contract.
The preview identifies random appearance as a reveal rather than promising a specific rolled rooster.

Body, Wits, and Spirit are the proposed stat names, pending mechanical review.
Each stat has a short plain-language explanation and an accessible decrement/increment control.
The five remaining points are visible without mental arithmetic.
A proposed 2/2/1 default helps a new player complete the setup quickly.
The final purchase action is disabled until exactly five points are distributed.
A stat must never be described as cosmetic if it changes later action outcomes.
No rarity percentage or superiority claim appears without an implemented and reviewed rule.

One compact estimated-total line sits beside the mint action and includes the approximate ETH mint price.
A small optional details expander separates mint amount, estimated network fee, and any applicable processing contribution.
It describes the starter food, water, and random safe gifts as included supplies.
It states that mint includes authorization to prepare the first game day.
It distinguishes ownership of a collectible from a guarantee of a long life or resale value.
The primary action names the actual operation, such as Hatch rooster.
The accompanying wallet prompt must match that operation and network.
The compact estimate follows the positive-amount formatting rule in section 18.4; a positive price never becomes a displayed zero through rounding.

The interface preserves the mint draft if a wallet approval is rejected.
Insufficient balance shows a specific amount shortfall when the wallet can provide a reliable estimate.
A changed quote refreshes the same compact estimate before submitting an obsolete payable amount.
If the mint transaction is submitted, the interface switches to transaction tracking.
Repeated tapping must not create several mints unintentionally.
After an accepted mint, subsequent failure to prepare day one must not suggest buying the NFT again.

### 16.6 Birth and the automatic first day

Birth is one of only two special cinematic scenes in the initial release.
It reveals the confirmed rooster appearance, short name, and initial identity.
It should last only a few seconds and offer a clear skip or continue action.
Reduced-motion mode uses a quiet reveal with the same identity information.
It must not require rapid flashing, loud audio, or surprise wallet prompts.
The reveal can show the house coming to light and the rooster entering its home.
Any hatch metaphor is presentation rather than a new breeding or lineage mechanic.

The automatic first day uses the mint-authorized starter state and gifts.
The user does not sign a separate daily owner request immediately after mint.
The same preparation and final-save invariants apply to the first day.
The birth scene may precede the preparation status, or run as a skippable presentation while status persists.
It must not hide an actionable preparation failure behind an endless animation.
Once the first day is finalized, the owner reaches the same Start day state as later days.
The screen identifies day one as already prepared, preventing an accidental duplicate request.

### 16.7 Care menu and needs hierarchy

The care menu opens over a dimmed view of the selected home.
The rooster's name, appearance, survived-day level, and current health appear first.
Nutrition, hydration, energy, and morale follow as compact labeled needs.
Higher values mean better condition for all five displayed meters.
Display rounded whole values while retaining the precise canonical values defined in chapter 5; derive warnings from those rules and condition records rather than from rounded display numbers.
Critical warnings use a written status plus an icon, with color as reinforcement.
The menu may summarize a need as Good, Low, or Critical alongside a numeric value.
Exact thresholds belong to the proposed balance rules rather than visual intuition.

Persistent conditions appear immediately below the needs when they matter to the next day.
Examples include injury, sickness, a damaged appliance, low stored food, or an active household hazard.
The first warning explains the consequence and a useful kind of supply.
It must not claim medicine guarantees survival when the rules do not guarantee that result.
If a condition is known to become fatal next day without treatment, that fact must be prominent.
Warnings must refer to game days, never imply a countdown in real-world hours.
Group more than three actionable conditions without concealing a treatment or deadline.
An uninfected eligible wound points to Bandage; an infected wound distinguishes the wound treatment from Medicine for the separate infection, following the canonical condition register in chapter 9.

The proposed primary sequence within the overlay is:

1. Check rooster and urgent care status.
2. Choose up to three distinct supplies, or choose Use stored supplies with no new delivery.
3. Check the selected slots, stored-stock reference, and the small estimated-total line beside Prepare day.
4. Approve the daily owner request without an extra fee-review step.

The player can collapse status details after understanding them.
The supply picker does not require scrolling past a long lifetime history on every day.
Needs remain available as a compact reference while choosing items.
The house remains context, with dimming sufficient to make the overlay text readable.

### 16.8 Supply selection and the mailbox metaphor

The proposed first-release delivery contains zero through three distinct selected supply types, one unit of each selected type.
The three slots are capacity, not a requirement to add filler.
At zero selected, show Use stored supplies and allow the normal Prepare day action once the quote and other eligibility checks pass.
The fifteen-item catalog is proposed in the mechanics chapter and should fit a small paged or scrolling grid.
Each tile combines a distinct item icon, short name, owned quantity, and delivery selection state.
Its explicit Add or Remove control adds or removes one unit from a delivery slot before submission.
A separately named Details control opens the item explanation without changing selection.
Touch and keyboard users must be able to inspect every item without adding or removing it; do not overload the same tap, hover, or long press with both operations.
Closing detail restores its control focus and catalog position.
A duplicate does not consume a second slot.
The player can replace an item with a direct Remove-and-Add sequence.
With three slots occupied, adding a fourth type is unavailable until a selected item is explicitly removed; inspecting an unselected item never silently replaces one.
An item whose canonical quantity is already at the chapter 6 storage bound cannot be added; the tile explains the full stock and leaves other items and the zero-delivery path available.

The tile detail describes several supported uses in compact language.
It avoids pretending the NPC will choose a particular use.
Food and water values should be concrete when that information is mechanically stable.
Examples such as May drink or cook with this can express possibilities without promising results.
Unavailable future items do not appear as upsells in the initial catalog.
Poison is not a selectable delivery in the proposed baseline.

The compact selected-supply reference remains available while browsing; full tiles may collapse under the overflow rule in section 16.2.
Urgent care recommendations are helpful cues, not automatic substitutions.
The player remains free to select a legal but imperfect kit after reading the warnings.
Warnings are readable in the ordinary selection flow and do not add a routine acknowledgment dialog.
The Prepare day action becomes available with zero, one, two, or three legal distinct selections when its funded quote is current and the ordinary eligibility checks pass.

The selection overlay shows what enters the mailbox and what is already in the household stores.
Use separate Owned and Delivery labels, so an existing quantity is never mistaken for another incoming unit.
Existing unused owned supplies persist until consumed under the inventory rules.
Choosing a daily supply does not imply an extra real-money item charge.
One quiet estimated-total line sits beside Prepare day, using normal readable text with low visual emphasis.
A small optional details expander separates the processing contribution and estimated network fee.
The compact total is available before wallet approval, without a dedicated fee modal, extra step, or dominant cost block.
The interface must not label a treasury payment as network gas.
The developer-controlled total-gas multiplier begins at two and may change prospectively, for example to three.
The current quote reflects the multiplier actually used; a previously accepted request is not repriced.
Use the nonzero adaptive formatting rule in section 18.4, with exact amounts available in optional details.
Admission capacity is reserved as part of obtaining the normal quote before opening the wallet, under chapter 15; this adds no player step.

Mailbox collection and shelving are deterministic presentation steps after the day is saved.
The rooster retrieves the delivery and moves items to their appropriate home stores.
For a zero-item delivery, the opening uses the recorded existing stores and shows no invented new parcel or supply credit.
These short actions establish the day's supplies without paid AI calls for each footstep.
Visual shelving must match the prepared action record and opening inventory state.
An item the AI never uses can remain visible or listed for a later day.
There is no drag-and-drop requirement for phone players.

### 16.9 Honest request, inference, and settlement progress

The progress overlay persists through the full prepare-day pipeline.
It shows a small ordered list of meaningful phases rather than a fake universal percentage.
Proposed phases are Wallet approval, Request confirmed, Jev planning, and Saving day.
Each phase distinguishes waiting, active work, completion, and a recoverable problem.
Transaction confirmation and AI preparation are different operations and need separate labels.
The backend's final-save transaction is distinct from the owner's request transaction.

During Wallet approval, Cancel means stop the unsent local request if that is still possible.
After submission, the interface tracks the transaction even if the wallet closes.
After confirmation, the accepted request cannot be deleted by dismissing the overlay.
The owner may leave and return while preparation continues or recovers.
The game states this briefly when the first preparation begins.
There must be no misleading close action labeled Cancel day after acceptance.

During Jev planning, show actual completed decision count and current activity.
Use wording such as 18 decisions saved, up to 60, rather than 18 of 60 if fewer may be needed.
Only genuine provider work can activate the SEND, JEV, and REPLY indicator.
Local routing, checkpoint recovery, and transaction polling use distinct status wording.
If a worker resumes from decision 18, the interface must not pretend the first 18 are being called again.
The latest real selected action and returned probability may be inspectable in this view.

The default progress view should not reveal the entire upcoming story or cause of death in advance.
An optional decision detail area can explicitly disclose that it may contain day spoilers.
The player can inspect all legal options and returned probabilities when the provider supplies them.
Missing probability data is labeled unavailable rather than invented or derived from animation.
Provider/model labels reflect the actual response and configured verified integration.
A signed gateway receipt is not presented as proof of trustless model execution.
Inspection pins the chosen completed decision and its actual options, target, effects, and available telemetry; newer provider results do not overwrite it while the user is reading.
The job continues independently and the live progress count may advance outside that pinned detail.
Phase, failure, and ready announcements follow section 18.7, without speaking every count or stealing focus.

Preparation duration is separate from the target three-minute replay.
Sixty sequential decisions can take meaningful time even with a fast provider.
The UI must not promise that all decisions will arrive instantly or run in parallel.
An elapsed timer may be displayed as elapsed work, not a deadline that kills the rooster.
After a long wait, offer a meaningful status explanation and safe refresh guidance.
The page's animation must never be the sole evidence that the backend is making progress.
The visible decision count measures genuine successful choices, not the sixty logical simulation slots or transport retries defined in chapters 5 and 10.

During Saving day, show that generation is complete but the final state is not yet finalized.
If the final transaction is pending, show its explorer link when available.
Start day stays unavailable until the final state and required replay packet pass the save checks.
An already accepted outcome cannot be rerolled by refreshing the interface.
Only the confirmed final record moves the mode to Ready.
If the last network read is uncertain, show Checking saved day before offering another request.

### 16.10 Ready and replay

Replay ready means a completed day can be watched; care ready means the interface can offer the next delivery.
Use these distinct semantic names even where the player sees only a simple Start day label.
Require an explicit playback finish or skip choice before the local flow advances to the next delivery.
The replay itself never adds a contract transfer lock or changes the already finalized state.

Ready is a calm state over the prepared home, not another cinematic.
Its main action is Start day.
A short supporting label says Saved onchain and identifies the game-day number.
The owner can open the final transaction link from a small details action.
This state must not require a second wallet signature.
The owner can leave now and return to watch the same saved day later.
Replay availability and transfer behavior follow the single retention policy in section 15.4.
Ready and resumed playback both provide a low-prominence View saved outcome action that reaches the summary without a wallet signature, inference call, or state change.
The neutral default label Day saved need not announce a terminal cause, but inspectable life status and token-selector badges must remain truthful even before the death animation is watched.

The replay presents the already finalized action sequence for a target duration of about 180 seconds.
It is a domestic performance with a coherent beginning, middle, and end.
Automatic mailbox collection, walking, object handling, and routine transitions connect meaningful choices.
Jev is not called for animation frames, path nodes, or an identical choice shown again.
The HUD should label an inspectable AI event as Recorded Jev choice during replay.
The SEND → JEV → REPLY live sequence belongs to preparation rather than replay.

The replay controls include pause/resume presentation, sound, reduced motion, and a required low-prominence Skip to summary action.
Opening status, event, or Recorded Jev choice detail pins the receipt index and replay-state snapshot and pauses the entire presentation clock, including camera and message advance, until Explicit resume.
The user can review earlier messages and mechanically important outcomes from this replay without another transaction or model call.
These controls change only how an accepted record is watched.
There are no food, boost, heal, rescue, or reroll buttons during replay.
If the user pauses immediately before a fatal event, the committed death remains final.
The interface must avoid language that suggests paused presentation suspends survival consequences.

The camera follows the rooster through the larger connected house, showing only a useful portion at a time.
Frame the current interaction and adjoining route at readable phone scale; there is no percentage-of-home target.
Camera movement anticipates doorways and stops instead of oscillating around the sprite.
Important objects should remain visible long enough to understand their use.
The message area shows one short event at a time with sufficient reading duration.
Sparkles, dust, status flashes, and small object animations communicate ordinary changes in place.

### 16.11 Summary, next day, and return visits

A survived day ends with the rooster settling and a compact summary overlay.
The overlay shows the survived-day level, need changes, and up to three consequential events.
Ongoing conditions that affect the next selection appear before decorative life highlights.
The primary action returns to the next care menu.
A secondary action can replay the most recently saved day if its packet is available.
If the packet is unavailable, View saved outcome uses the compact chain history and current save, and still reaches care, memorial, or trial completion as appropriate.
Unavailable presentation never traps a living eligible token or requires paying to reconstruct an already settled day.
Replaying never changes the level, inventory, trial allowance, or treasury balance.

There is no requirement to wait until tomorrow in the real world.
The copy can say Next day while showing the next game-day number.
Do not use Come back tomorrow as a mechanical lock unless a later approved rule introduces one.
Leaving for a week preserves the same authoritative state until another day is requested.
Returning owners see the current accepted mode rather than an arbitrary new entry flow.
An unfinished local playback can resume or restart from the same saved record.

If the owner has never watched an already finalized day and its packet is available, default to Ready or Resume day.
If its packet is unavailable, show Day saved; replay unavailable with View saved outcome instead of a blocked Start day action.
If the owner has watched it, default to the current care menu or memorial.
Local watched markers are convenience data, not authoritative life state.
Clearing the browser does not erase the rooster or reauthorize an already committed day.
The interface may reconcile watched markers with the latest onchain game-day identifier.
All full replay availability, including latest/unviewed, terminal, superseded, and transferred results, follows section 15.4; do not create a separate UI retention promise.
Where a full replay has a retention end date, its details show that date rather than suggesting that transfer or rewatching resets it.

### 16.12 Death, memorial, and trial completion

Death is the second special cinematic scene in the initial release.
Its cause must follow the committed record, not a random visual flourish.
The scene is brief, legible, and darkly comic without mocking the player's care.
It ends in a memorial state that names the rooster and its final survived-day level.
A reduced-motion version communicates the same transition without destructive flashing.
Existing CRYPTOCOCKS burn effects are not automatically appropriate for this retained-token design.

The memorial clearly says the rooster cannot continue playing.
It explains that the collectible remains in the wallet with a dead status.
The house and inventory no longer support play or salvage.
Identity, final cause, final day, and life summary remain inspectable.
Final day means the terminal biological day, not the number of wallet request attempts; survived-day level remains distinct under chapter 4.
The owner may select another owned rooster or start a fresh mint.
A fresh mint inherits no items, level, house, or lineage from this memorial.

Trial completion is visually and linguistically different from death.
A living testnet rooster reaching three committed days receives Trial complete.
It retains its actual living/dead status as recorded, without a fabricated death event.
The overlay explains that the trial's AI allowance has ended.
An earlier failed or expired attempt does not consume a committed trial day, although its actual operating spend counts toward the separate wallet/global capacity quotas in chapter 15.
It can offer the verified mainnet entry when available, without claiming the testnet token will migrate.
If mainnet is not ready, it says so and offers a harmless return to the summary.

### 16.13 Multiple NFTs, ownership, and transfers

Owning several roosters must not require a standalone collection page.
The proposed solution is a compact identity selector inside the care or entry overlay.
Each row shows portrait, short name, level, token identifier when names could be confused, and a truthful life/pending badge.
Trial access is a separate badge from alive/dead status; a capacity pause is neither Trial complete nor death.
The currently selected token is obvious and remains selected during ordinary refreshes.
Long collections can use bounded paging or search by token number inside that selector.
The selector must not fetch every full historical replay before it becomes useful.

Switching tokens changes the entire house, status, inventory, and pending request context together.
An active server job is associated with its token even when another token is selected.
The user may inspect another owned token while a pending job continues.
Starting work on several tokens remains subject to the separate service and wallet budgets.
Do not imply every owned token has its own dedicated inference worker.
No token may inherit another token's stale UI choices or latest Jev result.
Unsent delivery drafts are scoped to token and network; switching tokens restores that token's draft or an empty selection, rather than copying another rooster's kit.

Pending-day transfer locks are explained at the point a transfer is attempted or inspected.
After finalization or legitimate request release, ordinary transferability resumes.
If ownership changes while the old owner watches a replay, remove future care actions immediately.
Previously loaded public data is not described as private or remotely erasable.
The old owner receives a neutral This rooster has a new owner notice.
The new owner can read the current save and continue after ownership verification.

### 16.14 Recovery and uncertainty rules

Recovery must preserve the last finalized state and distinguish failure from uncertainty.
An RPC read failure does not mean the transaction failed.
A disconnected browser does not mean a durable worker stopped.
A provider timeout does not mean the NPC died.
A worker restart does not authorize a new seed or a second finalization.
The interface should expose safe actions appropriate to the actual durable request state.

| Condition | What the player sees | Safe next action |
| --- | --- | --- |
| Wallet approval declined | Request was not sent | Edit selection or try again |
| Owner transaction rejected | Request was not accepted | Review and resubmit |
| Submitted transaction status unknown | Checking transaction | Recheck the same hash |
| Request confirmed, worker starting | Request accepted | Wait or leave and return |
| Jev slow, with no terminal failure yet | Still preparing; current work status | Wait or recheck status without a second request |
| AI preparation recorded failed | Failed; last saved state unchanged | Try Again with a fresh owner transaction and signature |
| Failure known locally, chain release unconfirmed | Recording failed attempt; recovery pending | Recheck the existing transition; no fresh day yet |
| Worker lease recovered | Continuing saved preparation | Observe actual resumed progress |
| Finalization pending | Saving day | Recheck existing settlement |
| Finalization status unknown | Checking saved day | Reconcile before any new request |
| Replay packet unavailable | Day saved; replay unavailable | Retry retrieval or view compact summary |
| Pending request past its onchain deadline | Recovery deadline passed; last save safe | Release expired request through the wallet |
| Expiry release awaiting approval | Release expired request; network fee only | Approve or decline this recovery transaction |
| Expiry release submitted or uncertain | Checking request release | Recheck the same release hash and canonical request |
| Expiry release confirmed | Request released; last save unchanged | Return to selection and obtain a fresh day quote |
| Current chain state unreadable | Connection interrupted | Retry reading; gameplay submission disabled |
| Global trial budget exhausted | Trial capacity reached | Return later or choose available mainnet |
| Wallet operating quota exhausted | Trial capacity for this wallet reached | Show the actual reset/limit policy; no false Trial complete |
| Token ownership lost | New owner detected | Select another owned token |

Once the failed preparation is recorded as Failed and its pending lock is released onchain, the fresh-request retry becomes available; no biological day advances from that failure.
The last finalized needs, inventory, level, and alive/dead state remain unchanged without decay.
Try Again preserves an editable copy of the selected supplies but creates a fresh owner request and requires a new signature.
For a failed automatic first day, Try Again reuses the original starter inventory without adding new gifts or charging for another mint.
That special retry does not open an ordinary zero-to-three-supply delivery.
The earlier failed transaction remains visible and is neither deleted nor refunded.
Any charged network or processing amounts remain according to the actual transaction outcome.
Do not claim a transaction was deleted, fully refunded, or never happened unless that is factually true.
Status refresh and durable-worker recovery remain distinct from the fresh-request Try Again action.
Repeated taps on Try Again must not accidentally submit several new owner transactions.
Diagnostic identifiers are available behind Details so support can identify a request without exposing secrets.

Release expired request uses canonical request/deadline reads and the current owner's wallet even when the job/status/failure-recording backend is unavailable.
Eligibility follows chapter 12: expiry is valid strictly after the stored deadline, and a pending lock remains until the chain confirms a terminal transition.
This release pays network gas only, with no treasury processing fee; show its quiet estimate using section 18.4.
It preserves the last complete save and intended biological-day seed and does not refund the earlier attempt.
If another caller already released the request, recover that fact rather than requesting another payment.
After release, trying the same biological day again is a separate normal request with a fresh quote and wallet confirmation.
These exceptional recovery confirmations do not add signatures to an ordinary successful day.
If finalization or a chain reorganization is uncertain, use Checking saved day and reconcile under chapter 12 rather than offering a paid retry as a repair.

### 16.15 Mockup identification and responsive evidence

The [complete scene and interaction map](design/SCENE_MAP.md) expands the baseline inventory below with explicit entry conditions, visible evidence, safe actions/exits, world interactions, shared camera rules and production assignments. It preserves every existing identifier/derivative and is the detailed inventory authority.
Every mockup below has a stable identifier for that image-production map.
An identifier describes a scene or meaningful state, not a commitment to a separate route.
The same base state must be reviewed at phone and desktop physical sizes.
Use suffix P320 for the 320-pixel phone review, P390 for a common phone review, and D for desktop review.
The final design uses the same square composition across those variants.
For image generation, include only necessary context around the square and label all invented data as representative.

The map below distinguishes shared base compositions from derivatives; it does not require a new page or independently generated image for every state.
Each derivative still needs reviewed message, control, focus, and error placement at the applicable phone sizes.

| Family | Base composition identifiers | Derivative coverage |
| --- | --- | --- |
| Entry | UI-01A | UI-01B–UI-01F use its entry-overlay structure |
| Mint | UI-02A | UI-02B–UI-02H use the mint overlay and its processing derivatives |
| Birth | UI-03A | UI-03B–UI-03C retain the same identity/reveal composition |
| Care and picker | UI-04A, UI-05A | UI-04B–UI-04G and UI-05B–UI-05G share the status/picker structure |
| Processing and ready | UI-06A, UI-07A | UI-06B–UI-06K and UI-07B share these phase/ready compositions |
| Replay and summary | UI-08B, UI-09A | Other UI-08 states and UI-09B–UI-09C derive from these |
| Terminal/access | UI-10A, UI-10B, UI-10D | UI-10C is the reduced-motion death derivative |
| Options and recovery | UI-11A | UI-11B–UI-11H reuse the reviewed overlay structure with their actual state-specific actions |

Additional derivatives below keep their base family identifiers. They are interaction evidence within the complete scene map, not an authorization to implement the game before that map is approved.

### 16.16 Entry, mint, and birth mockup inventory

| ID | Scene or state | Required visible evidence |
| --- | --- | --- |
| UI-01A | Disconnected main entry | Sleeping representative house, game premise, connect action |
| UI-01B | Testnet entry | Clear testnet badge and three-day trial explanation |
| UI-01C | Wallet chooser | Supported wallet options and return path |
| UI-01D | Wallet unavailable | Helpful connection guidance without a fake owned rooster |
| UI-01E | Wrong network | Actual network, required network, switch action |
| UI-01F | Connection rejected or failed | Recoverable notice, retry, preserved environment |
| UI-02A | Mint name and stats | Eight-character limit, five points, proposed stat descriptions |
| UI-02B | Mint validation | Invalid name or unallocated points shown at the affected control |
| UI-02C | Mint inline purchase information | Small nonzero estimated total beside Hatch rooster; optional fee detail, first-day/death information, preparation-then-playback expectation |
| UI-02D | Insufficient balance | Specific shortfall if reliable and an exit to the editable draft |
| UI-02E | Mint wallet approval | Waiting status that does not imply submission |
| UI-02F | Mint submitted | Transaction hash, pending state, no duplicate hatch action |
| UI-02G | Mint uncertain | Recheck the same transaction; confirmed failure uses UI-02G-FAILED in the detailed map before any fresh mint |
| UI-02H | Mint accepted, first-day preparation problem | Owned token retained and no repurchase instruction |
| UI-03A | Birth reveal beginning | Confirmed portrait, name, home identity, skip control |
| UI-03B | Birth reveal completion | Rooster settled in home and first-day preparation continuity |
| UI-03C | Reduced-motion birth | Equivalent reveal information in a quiet static composition |

### 16.17 Care, selection, and processing mockup inventory

| ID | Scene or state | Required visible evidence |
| --- | --- | --- |
| UI-04A | Healthy care menu | Name, level, health, four needs, up-to-three delivery slots and stored-stock reference |
| UI-04B | Low food or water warning | Written care priority tied to stored supplies and next game day |
| UI-04C | Injury or illness warning | Condition, consequence, suggested useful supply class |
| UI-04D | Several simultaneous conditions | Prioritized warnings that fit without hiding the main action |
| UI-04E | Expanded status details | Saved values, active conditions, readable explanations |
| UI-04F | Owned-rooster selector | Several portraits with living, memorial, and pending badges |
| UI-04G | Large owned collection | Bounded selector paging or token search inside the overlay |
| UI-05A | Empty delivery selection | Fifteen-item catalog, three empty slots, Use stored supplies, valid zero-item request |
| UI-05B | Partially filled delivery | Selected tiles and remaining slot count |
| UI-05C | Valid delivery | Zero through three distinct selected items, stored counts, enabled Prepare day with current quote |
| UI-05D | Item detail | Icon, uses, single-use meaning, explicit Add/Remove; opening Details leaves selection unchanged |
| UI-05E | Selected-item replacement | Clear removal state without a confusing second inventory |
| UI-05F | Submission-ready selection | Chosen delivery, current priority, compact total beside Prepare day, optional fee detail |
| UI-05G | Quote stale or unaffordable | Refresh estimate or return to selection without losing choices |
| UI-06A | Daily wallet approval | Chosen token/day, request awaiting signature |
| UI-06B | Daily request pending | Submitted hash and confirmation progress |
| UI-06C | Request accepted, worker starting | Confirmed owner request, safe leave-and-return guidance |
| UI-06D | Jev preparation normal | Actual completed decision count and SEND → JEV → REPLY status |
| UI-06E | Jev preparation detail expanded | Real choice, options, probability, spoiler notice |
| UI-06F | Jev slow, request still preparing | Honest waiting state and status refresh without invented progress |
| UI-06G | Resumed durable preparation | Previously completed count preserved and current resumed phase |
| UI-06H | Final save pending | Generation complete, separate settlement transaction pending |
| UI-06I | Final save uncertain | Checking saved day and duplicate-request prevention |
| UI-06J | AI preparation recorded Failed | No day advanced; Try Again requests a fresh signature; no deletion or refund claim |
| UI-06K | Trial or service budget exhausted | Transparent capacity state, no false provider failure |
| UI-07A | Saved day ready | Start day, saved status, biological day number, details link, View saved outcome |
| UI-07B | Returning to saved unplayed day | Same saved day available, no new signature |

### 16.18 Replay, outcome, and exceptional-state mockup inventory

| ID | Scene or state | Required visible evidence |
| --- | --- | --- |
| UI-08A | Mailbox collection | Delivery retrieved and placed into household stores |
| UI-08B | Routine domestic activity | Rooster moving between meaningful household locations |
| UI-08C | Kitchen item use | Item consumed or transformed according to the saved action |
| UI-08D | Garden interaction | One small plot, readable growth state, context-preserving camera |
| UI-08E | Home maintenance or furniture use | Distinct prop interaction and in-scene feedback |
| UI-08F | Surprising safe choice | Authored short line and readable alternative item use |
| UI-08G | Injury or household accident | Clear danger cue, exact recorded condition change |
| UI-08H | Recorded brain detail | Recorded Jev label, pinned receipt/state/options, actual historical choice data, Explicit resume |
| UI-08I | Paused presentation | Presentation pause clear; no heal, boost, or day-reset controls |
| UI-08J | Reduced-motion replay | Stable framing and equivalent event readability |
| UI-09A | Survived-day summary | Level change, consequential events, current care priority |
| UI-09B | Summary with critical next-day condition | Urgent warning before Prepare next day |
| UI-09C | Return after long real-world absence | Unchanged game-day state and no absence penalty |
| UI-10A | Death scene | Recorded cause, respectful dark humor, no false burn promise |
| UI-10B | Memorial overlay | Retained token, final level, cause, life summary, no continue-play action |
| UI-10C | Reduced-motion death | Equivalent finality in a quiet composition |
| UI-10D | Living testnet trial complete | Trial limit distinct from death and no migration promise |
| UI-11A | Options overlay | Audio, motion, text/readability, help, chain details |
| UI-11B | Request and transaction details | Owner request hash, finalization hash, request identifier |
| UI-11C | Network read interrupted | Last known state marked, retry read, no unauthorized new day |
| UI-11D | Replay retrieval failure | Saved outcome retained, retry retrieval or compact summary |
| UI-11E | Ownership changed | Future actions removed and another-token selection available |
| UI-11F | Pending transfer lock explanation | Accepted pending day identified with recovery/status link |
| UI-11G | Account changed | Ownership recheck and no stale token-specific actions |
| UI-11H | Maintenance pause | Existing save safe and submissions temporarily unavailable |

| Derivative ID | Base | Additional required visible and interaction evidence |
| --- | --- | --- |
| UI-04D-LT | UI-04D | P320 at 200% text, all urgent deadlines discoverable, one vertical scroller, footer in normal flow when necessary |
| UI-05D-INSPECT | UI-05D | Inspect/close details without selection changes; focus and catalog position restored |
| UI-05A-STOCK | UI-05A | Zero delivery and a full stock type, no compulsory filler or overflow, explicit Owned versus Delivery counts |
| UI-05F-TINY | UI-05F | Positive below-cent fee, readable nonzero label, optional exact breakdown, ETH-only fallback when fiat is stale |
| UI-06E-PIN | UI-06E | Completed decision pinned while the backend advances; quiet newer-decisions indicator |
| UI-06J-RELEASE | UI-06J | Failure awaiting chain recording, no fresh request while its lock persists |
| UI-07A-SKIP | UI-07A | Unviewed living, terminal, and third-trial-day results reach truthful saved summaries without viewing or paying again |
| UI-08H-PIN | UI-08H | Reading holds the receipt, values, message, and camera until Explicit resume |
| UI-11D-LATEST | UI-11D | Missing latest packet; compact chain summary and skip/continue path without new inference or payment |
| UI-11F-EXPIRED | UI-11F | Canonical deadline passed; backend unavailable; Release expired request available through the owner's wallet |
| UI-11F-APPROVAL | UI-11F | Expiry release approval, network-gas-only estimate, unchanged save and no-refund explanation |
| UI-11F-PENDING | UI-11F | Release hash submitted or uncertain; no duplicate release or fresh day; canonical recheck |
| UI-11F-RELEASED | UI-11F | Confirmed release or release by another caller; next fresh request requires its own normal quote |
| UI-11A-ANNOUNCE | UI-11A | Keyboard/screen-reader phase, failure, and ready announcements without focus theft or per-call speech |

### 16.19 Interface acceptance criteria

Every listed state must have an entry condition, visible explanation, safe action, and exit condition.
No state should require the user to infer whether a wallet signature has already been accepted.
A fresh visitor should understand the supply-choice concept before seeing a transaction prompt.
A returning owner should reach the correct current token state after a refresh.
A pending job should recover after closing the tab without duplicate preparation or rerolling.
A critical care warning should be understood at the smallest reviewed phone size.
Every ordinary action should fit inside the square without obscuring its own confirmation or error text.
The final scene map must identify any optional states intentionally merged for clarity.
The derivative map must show a valid zero-item request and one/two/three-item requests, independent item inspection, and tiny positive fee formatting.
The P320 enlarged-text case must retain every warning, control, and optional detail through one-direction text reflow and scrolling.
Expiry recovery must work with the static frontend, wallet, and chain reads while the job/status backend is unavailable.
Skip and missing-packet paths must reach the correct care, memorial, or trial-complete state without a new transaction, inference call, or outcome change.
Playback detail must stay pinned until Explicit resume; preparation detail must stay pinned while actual work continues.
Screen-reader users must receive meaningful phase/failure/ready transitions once, without a queue of per-decision announcements.

## 17. Visual direction, verified art, and asset preparation

### 17.1 What is fixed and what remains open

The character species is fixed: colorful seeded roosters imitating human household life.
The desired tone is retro, darkly comic, compact, and readable.
The single-square presentation and meaningful birth/death scenes are fixed user decisions.
The user has authorized reuse of their CRYPTOCOCKS art as a source, without duplicating that game.
The owner selected the top-down room plan with upright rooster sprites (VD-02 family), then the original richer Moss & Cream larger-house reference VR-01.
Warm wood, cream walls, moss accents, blue bed, navy frames, yellow primary action and colorful semantic meters are the approved relationships. Later muted recolors are rejected. Do not generate further palette/style alternatives unless the owner requests them.
The exact source-art pixel scale, facing/pose convention, font metrics, interaction anchors and exports still need technical-art verification. The reference is a visual guide, not a shipping atlas.

The existing Jevscape is a reference for a real AI teammate and inspectable decisions.
Its green terminal dungeon is not automatically the house palette.
The existing CRYPTOCOCKS is a reference for procedural rooster identity.
Its combat, betting, life-bond, and arena branding are outside this game's initial product.
The new home must feel like its own domestic world while visibly using the approved rooster language.
Do not import all existing game screens merely because their source is available.

### 17.2 Verified source asset inventory

The following findings came from local source inspection on 2026-10-31.
They describe existing material, not completed NEARlyHuman assets.
References to another repository are provenance records rather than permitted production dependencies.
Any approved reused source must later be copied into an appropriate permanent project location.
The finished game must not read assets from another developer checkout or from TEMP.

| Source | Verified material | Reuse boundary |
| --- | --- | --- |
| CRYPTOCOCKS src/sprites/trait-data.ts | Base 24×24 rooster, beak/wattle overlay, palette, headgear grids | Strong candidate for exact identity reuse |
| CRYPTOCOCKS src/sprites/render.ts | Seeded compositor and transparent SVG rendering | Adapt to the selected game renderer without importing old mechanics |
| CRYPTOCOCKS src/components/game/CockSprite.tsx | Bob, blink, sleep, victory and simple pose timing | Reference implementation; new animation vocabulary still required |
| CRYPTOCOCKS public/example-cocks/1.svg through 25.svg | Twenty-five seeded portrait examples | Reference and regression comparison for appearance consistency |
| CRYPTOCOCKS CockTraits.sol | Onchain palette, base anatomy, backgrounds, headgear interfaces | Candidate art data source with file-level license notice |
| CRYPTOCOCKS CockArt.sol | Palette-grid rendering and overlay utilities | Candidate rendering reference with file-level license notice |
| CRYPTOCOCKS CockMetadata.sol | Self-contained portrait and metadata composition | Reference only until metadata needs and license treatment are reviewed |
| CRYPTOCOCKS backdrops directory | Crisp room illustrations including kitchen, coop and yard | Visual reference; not a complete traversable house asset set |
| CRYPTOCOCKS public/img | Miscellaneous eggs, UI illustrations, arena and dead-rooster art | Inspect individually; no wholesale assumption of suitability |
| Jevscape game/view | Procedural pixel scenery, humanoid renderer and effects | Interaction/clarity reference; rooster world requires its own art |

The CRYPTOCOCKS source root is C:/Users/Admin/Documents/GitHub/CRYPTOCOCKS.
The Jevscape source root is C:/Users/Admin/Documents/GitHub/enzosmith_xyz.
The original answer sheet is C:/Users/Admin/Desktop/NEARlyHuman.md.
These absolute paths identify research provenance on the author's machine.
They are not stable hosting URLs or promises that another contributor has those directories.

### 17.3 Existing rooster anatomy and variation

The verified base rooster uses a 24×24 palette-index grid.
Its drawn profile faces right, with tail on the left.
Black outlines, an orange beak and feet, and a small eye preserve a recognizable silhouette.
Body and wing are independently recolored within a restricted palette.
Headgear overlays attach to the same body geometry.
The transparent game render omits the portrait background and pattern.

The source contains ten body color choices and nine different wing choices for each body.
It contains thirty headgear shapes with three accent-color variants.
That yields 8,100 nominal combinations before portrait background or pattern variation.
The count is not a promise that every combination is equally visually distinct.
The source also includes twenty-four portrait background colors.
Rarity should remain cosmetic in the proposed baseline unless a later rule explicitly changes that.

Existing headgear includes crowns, hats, shades, bands, jewelry, flowers, horns, and comic accessories.
Some named headgear appears on the face or neck rather than only above the comb.
Pose work must keep all those overlays attached correctly.
An accessory must not become an invisible mask over the eye or break the beak silhouette.
Palette choices must be reviewed against the selected home colors.
A dark outline needs enough local contrast to remain visible at the minimum phone size.

### 17.4 Existing animation capability and missing work

The current walk alternates whole-sprite vertical shifts of one logical pixel.
It does not contain separate stepping-leg drawings.
Blink changes the eye pixel; sleep closes the eye and settles the body downward.
The current peck grid is unchanged from idle and relies on an unimplemented wrapper-motion idea.
Victory lifts the whole body without a new detailed anatomical drawing.
Existing burn frames remove or recolor pixels, reflecting the prior game's different death treatment.

The source-port ledger must also resolve two specific compatibility issues found in the October 31 source inspection before the copied renderer is treated as production-ready:

| Existing source behavior | Required adaptation | Compatibility evidence |
| --- | --- | --- |
| An upward one-row shift within the old 24-row grid discards row-zero pixels present in Wizard Hat, Antenna, and Horns overlays | Preserve logical trait indices while giving approved poses sufficient bounds or layered transforms; no unexplained top-edge crop | Those accessories retain their intended pixels in walk-up, bob, and upward reactions |
| Headgear is flattened before blink/sleep overwrite the eye pixel; some face accessories use that position | Define body/eye, face/neck/head accessory, and prop compositing behavior so eye motion respects each accessory | Monocle, Laser Eyes, shades, and every other face overlay follow an approved pose-specific rule |

The inspected source locations are CRYPTOCOCKS `src/sprites/trait-data.ts` for accessory grids and `src/sprites/render.ts` for composition, upward shifts, eye mutations, and out-of-bounds row handling.
These are verified source-port dependencies, not claims that the new game's pose system has been implemented or corrected.
The adapter may use bounded pose grids, procedural layers, or another reproducible technique that preserves the same seeded identity.

Simple left-facing movement can mirror the existing right-facing profile.
Front, rear, and diagonal walking have not been authored.
Choosing a camera that needs those directions creates explicit new asset work.
A rigid profile sprite can move on a shallow oblique floor if the chosen art direction makes that convention coherent.
Do not claim the source already includes a full isometric character sheet.
Do not use image generation to redraw every seeded appearance independently and lose identity consistency.

Proposed minimum new pose families are:

- Idle and blink, retaining the approved silhouette.
- Walking with a readable but restrained step or bob rhythm.
- Sleeping and waking without implying offline time advance.
- Carrying or accompanying a small mailbox delivery.
- Eating or drinking with an object at a stable contact point.
- Working at a cooker, sink, cupboard, or work surface.
- Planting, watering, and harvesting at the small garden plot.
- Cleaning or repairing with a small contextual prop.
- Reacting to surprise, injury, and illness without a new full cinematic.
- Final death and memorial portrait treatment that retain the collectible identity.

Several actions can share a core pose and change the held prop or nearby effect.
The goal is a coherent small vocabulary, not a custom animation for every item-event combination.
Per-pose attachment points should be consistent for headgear and props.
Feet should stay grounded while the sprite bobs or rotates.
Each pose must be previewed with tall, wide, and face-covering accessory examples.
In addition to those extreme examples, generate a compatibility matrix of all thirty accessory shapes across every shipping pose and facing convention, with principal palette extremes.
The matrix records contact/occlusion boundaries, mirrored prop side, feet pivot, and intentional accessory/eye behavior.
This is shape-by-pose coverage, not a requirement to hand-draw all 8,100 appearance combinations.

### 17.5 Camera selection and exploration history

The owner chose the top-down Harvest Moon / handheld RPG direction, then approved the original Moss & Cream larger-house composition. The exact permanent reference is [VR-01](design/references/VR-01-approved-house-and-care.png), with provenance/hash in [design/SCENE_MAP.md](design/SCENE_MAP.md).

The house extends beyond the viewport. Follow the rooster through continuous connected zones and show the active area plus its approach/exit, rather than a miniature full-house overview. No room-selection tabs or separate room-loading screens are required. Each object/area needs a reachable contact position and visible dynamic state.

| Direction ID | Historical exploration | Current disposition |
| --- | --- | --- |
| VD-01 | Shallow oblique pixel dollhouse | Not selected |
| VD-02 | Top-down room plan with upright character sprites | Selected family; VR-01 is the approved larger-house/care reference |
| VD-03 | Side-on cutaway tiny home | Not selected |
| VD-04 | Isometric miniature home | Not selected |
| VD-05 | Virtual-pet domestic stage with room transitions | Not selected |

These are exploration history, not competing production briefs. The former three-quarter-home framing target is superseded by the owner's larger-house, partial-view requirement. Technical camera acceptance checks doorway continuity, occlusion, accessory bounds, active target/prop visibility, reduced motion and phone readability in the companion map.

### 17.6 Domestic environment and visual hierarchy

The fixed connected home topology should have unmistakable functional areas.
The exact room division follows the mechanics and selected camera.
A bed, food/water storage, cooking surface, storage cupboard, entry/mailbox, and tiny garden need distinct silhouettes.
The floor plan must support routes that look physically plausible.
Doors and interaction positions must remain reachable after safe seeded decoration.
Furniture variation must not create impossible paths or conceal important hazards.

Seeded individuality can appear in wall/floor colors, textiles, harmless clutter, plants, and furniture variants.
Variation should preserve the same navigation and interaction affordances.
A cooker should remain identifiable across approved lighting, damage and temporary-protection states within VR-01.
The mailbox should stand out before the first delivery is collected.
Hazard art should not become indistinguishable from ordinary decoration.
The rooster should remain the highest-interest moving subject.

The camera should reveal enough of the room ahead to explain the next action.
Occluding walls may fade or cut away using a consistent selected-art convention.
Foreground props should not cover the rooster's face during important choices.
Major status effects need distinct shapes and timing rather than several simultaneous particle clouds.
An empty kitchen should not look fully stocked when inventory is exhausted.
World props may summarize counts, but must not contradict the authoritative store state.

### 17.7 Asset families and production inventory

The later asset plan must distinguish reusable identity data, generated references, hand-built assets, and final shipping files.
ImageGen explorations establish a look; they do not automatically become production-ready atlases.
Final assets need consistent scale, palette, anchor, transparency, and licensing records.
The production plan must list how a new contributor regenerates or maintains each asset family.
No build may rely on a scratch contact sheet or a previous chat attachment.
The technical art contract in section 17.11 bridges the chosen look to reproducible source assets before game implementation begins.

| Family ID | Required family | Representative contents |
| --- | --- | --- |
| AS-01 | Rooster identity | Base body, wing palette, beak, headgear overlays |
| AS-02 | Household action poses | Idle, walk, sleep, use, garden, hurt, death |
| AS-03 | Home structure | Walls, floors, doors, windows, thresholds, roof/cutaway convention |
| AS-04 | Functional furniture | Bed, fridge/store, cooker, sink, cupboard, work surface, mailbox |
| AS-05 | Garden | Soil plot, planted states, sprouts, mature output, wilted state |
| AS-06 | Fifteen supplies | Distinct readable icons and optional world-scale props |
| AS-07 | Craft outputs | Proposed chair and other approved temporary world objects |
| AS-08 | Hazards and conditions | Fire, spill, mess, breakage, sickness and injury indicators |
| AS-09 | In-scene feedback | Consumption, repair, growth, damage and level feedback |
| AS-10 | Interface | Need icons, delivery slots, buttons, panel borders, focus and error states |
| AS-11 | Birth and memorial | Reveal elements, final portrait treatment, calm memorial elements |
| AS-12 | Background variation | Reviewed wall/floor palettes and harmless decoration variants |

Every AS-01 through AS-12 family receives a manifest entry within the approved full scene/asset map, with the following fields populated or an explicit not-used disposition.
One manifest can serve all families; this is not another player-facing page.

| Manifest field | Required meaning |
| --- | --- |
| Source of truth and provenance | Reused, generated-reference, or hand-authored status; original revision/path, owner authorization and applicable notices |
| Permanent editable source | Project location outside TEMP and independent of the old checkout |
| Conversion/export route | Reproducible scale, palette, transparency, anchors, and export method; implementation format remains a builder choice |
| Shipping output | Final project location and renderer-facing format; no scratch or external-checkout runtime dependency |
| Coverage | Supported action/message families, poses, facings, accessories, condition/growth states, and reviewed exclusions |
| Acceptance evidence | P320/P390 samples, technical-art checks, compatibility results, version and approval status |

AS-01/AS-02 explicitly include the source-port corrections and thirty-shape compatibility matrix from section 17.4.
The approved action/use matrix in chapters 7–8 supplies stable family identifiers for AS-02, AS-06, AS-08, and AS-09, so a promised use has an actual prop, contact/effect, and message family.
An unsupported contextual use is resolved in the rule matrix before art is commissioned; decorative imagery cannot silently create a new action.

Each supply icon should remain recognizable at its intended phone tile size.
Water and milk need more than a color-only difference.
Medicine and bandage need distinct shapes and labels.
Seeds and compost need distinct containers or symbols.
The toolkit should visibly communicate its bundled hammer-and-nails function.
Matches should not look like an ordinary harmless food package.

### 17.8 Source provenance and license boundaries

The user identifies CRYPTOCOCKS as their own unreleased project and authorizes art reuse here.
That authorization should be recorded alongside the copied asset family.
File notices still matter when source is copied or adapted.
The inspected CockArt.sol and CockTraits.sol declare MIT.
The inspected CockMetadata.sol declares BSD-3-Clause-Clear.
No repository-wide LICENSE or COPYING file was found during the inspection.

The inspected TypeScript art data and renderer lack a separate explicit license header.
This is a provenance fact, not evidence that the user's own reuse is forbidden.
The project should preserve the origin and any applicable notices in its permanent attribution record.
Miscellaneous raster illustrations need individual suitability and provenance review before shipping.
Do not claim that every image in the old public directory has the same confirmed source or license.
Do not use combat marketing imagery to imply a feature in NEARlyHuman.

The final game should generate its own collection-specific metadata description and status fields.
It must not preserve references to arena combat, native-token life bonds, or unrelated agent standards by accident.
The onchain art traits should match the visible in-game seeded identity.
Living and memorial metadata must remain consistent after cache refresh.
Any external marketplace preview is a compatibility verification task, not guaranteed merely by producing valid SVG.

### 17.9 Image exploration and selection workflow

Direction exploration is complete enough to establish VR-01. The owner explicitly stopped further palette variants and requested comprehensive mapping before more image generation.

The current sequence is: finish the complete scene/UI/menu/world interaction map → independent reviews wearing different hats → fix omissions/contradictions → produce the complete mockup collection using the exact approved reference. [design/SCENE_MAP.md](design/SCENE_MAP.md) is the detailed map and production manifest. Reuse base compositions while showing every meaningful state's actual message/actions and exit.

Do not restart direction or recolor exploration as part of ordinary mockup production. The original rich palette and partial-house camera remain fixed. Reference labels do not override rules: brain OFF does not disable AI, three supplies are an example rather than mandatory, and fees remain subtle but readable.

The full collection includes phone readability and desktop scale evidence. Static source-sprite samples and annotated anchor/pose layouts complete the technical art contract in section 17.11. A generated rooster redraw is not proof that the actual procedural source has the needed poses or accessory bounds.

No website or game implementation starts before the agreed map and mockup review sequence is complete. After that approval, the deterministic vertical slice and sixty-receipt timing fixture prove the art contract before the remaining asset vocabulary expands. Their dependency and forecast review belong to chapter 21; a failed forecast does not silently change the camera or remove a module.

### 17.10 Visual QA and acceptance

Review each candidate as a small square before viewing it enlarged.
The rooster must remain identifiable in at least the principal seeded color families.
The selected supply count and primary next action must be understood without zooming.
The house must communicate its functions without a long legend.
The active event should be comprehensible from action, prop, and short message together.
Decorative borders must not consume the space needed for touch targets and warnings.

Test the tallest headgear against doorways, sleep poses, and camera edges.
Test the darkest rooster against dark floor and foreground objects.
Test a pink or red rooster against danger indicators so danger does not disappear into the body color.
Test a fully occupied status overlay with simultaneous injury and low supplies.
Test the death and trial-complete states side by side to ensure they cannot be confused.
Test recorded AI detail during replay so it never resembles a new live request.

### 17.11 Technical art contract and replay timing gate

The top-down VR-01 direction is selected.
Complete the following source-art and interaction contract within that direction during full scene/asset-map review, before game implementation.
Static source-sprite scale samples and annotated layouts are review evidence; they do not authorize an early game build.

| Contract field | Evidence required for full scene approval |
| --- | --- |
| Logical art scale and source identity | Chosen logical pixel/world scale and the actual seeded 24×24 source rooster at its intended P320 and P390 size, rather than only an approximate generated redraw |
| Projection and feet pivot | Selected floor/projection or billboard convention, consistent grounded pivot, supported facings, and the additional poses actually required |
| Safe playfield | Top/bottom UI and overlay bounds, readable active interaction area, and P320 enlarged-text overflow behavior |
| Depth and occlusion | Foreground/wall cutaway rule, prop layering, and protection for the face, held object, and important hazard at contact |
| Interaction anchors | Mailbox, stores, cooker/work surface, bed, both plots, and movable-object contact/placement anchors compatible with the canonical topology |
| Follow-camera bounds | Partial-house framing of active area and adjoining route, edge behavior, doorway anticipation, reduced-motion behavior, and readable target/held prop at phone scale |
| Asset bridge | AS-01–AS-12 source/export/shipping manifest, required pose/facing coverage, and unresolved production work with a named disposition |

Technical choices are recorded in the companion scene/asset brief within selected VR-01. The renderer, atlas format and missing directional anatomy are not yet proven by that visual selection.
After the full map is approved, the first implementation slice reproduces the mailbox → store → use → garden/maintenance → bedtime sequence with the actual selected identity and shipping-style assets.
At P320/P390 the same real rooster must remain grounded, readable, and visible at each relevant contact point with the UI present.
Verify dark bodies, tall/wide/face accessories, danger-colored bodies, and every shipping facing before multiplying content.

The following shared presentation families are provisional pacing budgets, not measured reading-speed claims or rigid durations for every receipt.
The final brief records the selected normal-speed ranges and a short literal-message dwell/hold rule.

| Presentation family | Travel and contact/effect treatment | Initial normal-speed planning range and grouping |
| --- | --- | --- |
| Mailbox and shelving prelude | Show only the authorized incoming units once; zero delivery shows existing stores without invented credit | About eight seconds within the total day budget; no paid choice or logical slot added |
| Ordinary move, tidy, rest, leisure, or safe idle | Condense repeated travel while retaining the destination and any actual effect; idle adds no fictional decision | About two to three seconds per shown receipt; adjacent routine receipts may share a transition |
| Consumption and treatment | Identify item, target, quantity spent, and immediate effect at a stable contact point | About two to three seconds; a message can dwell across a following travel/reaction beat |
| Cooking, repair, craft, and garden | Show prerequisite object, contact, consumption/transformation, and any persistent output | About three to five seconds for a coherent group of related receipts; preserve every receipt index and state boundary |
| Incident and response | Separate the circumstance, chosen response, and recorded harm/recovery; keep its cause and target legible | About four to seven seconds across its related receipts, using time within the action budget rather than an extra danger roll |
| Bedtime and transition | Show the recorded maintenance/recovery boundary and entry to summary | About seven seconds within the total budget; no second application of game effects |
| Critical text and inspection | A literal outcome remains reviewable; pause/hold and Explicit resume control reading | Short messages initially target three to five seconds where shown, overlapping action/reaction when appropriate; reading holds may extend wall time |

A planning allocation of eight seconds for the prelude, approximately 165 for the sixty logical-slot receipts, and seven for bedtime totals about 180 seconds.
It is a fixture hypothesis, not a requirement to squeeze every long action into the same interval or to emit sixty separate flavor messages.
Grouped presentation retains ordered receipt identifiers, selected action/target/variant, consumed units, event outcomes, and the correct intermediate state for Recorded Jev choice inspection.
A group must never hide a mechanically important outcome or replace multiple genuine decisions with an invented explanation.

After complete scene approval, run a deterministic sixty-receipt living-day timing fixture early in the first slice, before expanding animation/content production.
Include long routes, several different uses of the same supply type, one allowed incident sequence, mailbox/shelving, bedtime, and the top/bottom UI; also run an early terminal-day fixture.
Every consequential result must be visible or directly reviewable, and a viewer must distinguish water drunk from water used on a plot or eligible fire.
Check ordinary speed, pinned brain/event inspection, silent and reduced-motion playback, and user reading holds without fresh inference.
Pauses and accessibility holds extending wall-clock viewing are expected; they do not alter the approximate unpaused target, biological clock, or saved outcome.
If legible presentation cannot meet the paired targets, bring measured grouping/pacing or decision-budget options to the product review in chapter 10 rather than silently lowering the target or fabricating events.

## 18. Copy, audio, accessibility, and comprehension

### 18.1 Voice and language principles

The game speaks to adults who enjoy absurd digital creatures and fragile domestic routines.
Its humor comes from a rooster attempting human life and making plausible strange choices.
The player is a caretaker with indirect influence, not an accountant managing an optimization dashboard.
Short lines can be dry, silly, and mildly ominous.
Errors, money, ownership, and permanent outcomes use direct language.
The interface must not turn a provider outage into a joke about the rooster dying.

Use rooster, day, supplies, home, and saved state consistently.
Use level for successfully survived game days, and identify the biological day separately when needed.
For counters and memorials, use the chapter 4 distinction between biological day, request-attempt identifier, committed-day count, and survived-day level.
An operational Failed or Expired attempt is never described as another biological day lived.
Use game day when real-world time could otherwise be misunderstood.
Use recorded choice for a Jev event shown during playback.
Use preparing or planning for real inference before playback.
Use memorial for an ended life whose collectible remains owned.

Avoid implying the model has private human feelings or guaranteed human intelligence.
The fiction may personify the rooster while the system truth remains inspectable.
Avoid financial language about earnings, appreciation, investment, or guaranteed resale.
Avoid suggesting a rare portrait has stronger survival rules unless the rules actually say so.
Avoid celebratory copy that hides an urgent injury or insufficient hydration.
Avoid dramatic death language for a living trial that has simply reached its allowance.

### 18.2 The two-line message box

The user requested a Game Boy-like message area with about twenty characters per line and two lines.
Treat this as a compact in-scene target, not a universal limit on warnings and menus.
Each authored event line should express one visible action or immediate consequence.
Use short concrete verbs instead of several unexplained mechanical abbreviations.
Keep names within their validated eight-character limit when interpolating them.
Never cut a name or word in half to make an event fit.

The message composer should wrap only at approved word boundaries.
Long event details belong in an inspectable event description or summary.
Danger information must not vanish before a slow reader can understand it.
Presentation pause and event review retain current and earlier mechanically important messages from the saved replay.
Opening a message or recorded-choice detail pauses the presentation and pins that step until Explicit resume; merely closing the panel does not advance to a later event.
An optional reading-hold preference may also await presentation acknowledgment between messages; that acknowledgment affects viewing only.
If the default uses a typewriter effect, provide instant-text and reduced-motion alternatives.
The final implementation must measure rendered width rather than assume every glyph has equal width.

Proposed ordinary event lines include:

- Checked the mailbox. / Three new problems.
- Milk goes in first. / Confidence follows.
- Built a tiny chair. / Sat beside it.
- Watered the seeds. / Also the doorstep.
- Made some toast. / Mostly toast.
- Cleaned the cooker. / A rare achievement.
- Took the medicine. / Complained politely.
- Went back to bed. / A sound argument.

These examples establish tone and require final width review in the selected font.
The three-item mailbox line is eligible only for an actual three-unit delivery; singular/plural variants match one or two units, and a zero-delivery line can say No new parcel. / Carrying on.
The literal quantity and supply receipt remain available even when an authored joke is shown.
They are not a promise of specific mechanics beyond the approved action catalog.
The authored library should support several lines per common event family.
Variant selection may be deterministic from the replay record without new inference.
Humor variation must never change a mechanically important reported outcome.
The same replay should not invent a different cause of injury when watched again.

### 18.3 Interface vocabulary and action labels

Primary action labels should identify the next concrete operation.
Use Connect wallet for connection, Hatch rooster for mint submission, and Prepare day for a new owner request.
Use Start day after finalization, when playback alone remains.
Use Resume day for continuing presentation of an already saved sequence.
Use Prepare next day after a survived summary.
Use View memorial for an ended life rather than Continue.
Use View saved outcome from Ready or a missing-packet state, and Skip to summary during playback, for the required no-charge presentation escape.
Use Release expired request only for the eligible recovery transaction; Refresh status never authorizes another attempt.

| Context | Proposed concise wording | Required meaning |
| --- | --- | --- |
| Idle care | Nothing happens while you are away. | No offline aging or neglect |
| Daily selection | Choose up to three supplies, or use stored stock. | Zero through three distinct incoming units; Jev chooses their uses |
| Before authorization | AI prepares first. Watch about three minutes afterward. You can leave after acceptance. | Preparation and saved playback are separate; no instant-completion promise |
| Accepted owner request | Request accepted. Your day is being prepared. | The transaction is already onchain |
| Planning progress | 18 decisions saved, up to 60. | Actual completed work and bounded target |
| Finalization | Saving this day onchain. | Separate final state settlement underway |
| Replay ready | Saved. Ready to watch. | Playback does not require another signature |
| Playback AI detail | Recorded Jev choice | Historical inference, no new paid request |
| AI preparation failed | Jev could not prepare this day. Try Again. | Failed request recorded; fresh signature required; last save unchanged |
| Expiry available | Release expired request. Last save unchanged. | Exceptional wallet transaction, network gas only; no refund or processing charge |
| Missing replay | Day saved. Replay unavailable. View saved outcome. | Compact chain summary still permits the next appropriate state |
| Memorial | This life has ended. The NFT remains yours. | Final gameplay death without automatic token burn |
| Trial cap | Trial complete: three game days. | Allowance ended, not a fabricated death |

The exact phrase NEAR AI should be used where the verified provider integration is relevant.
If an upstream model is named, its actual configured identity must support the label.
Do not show near-instant, free forever, or fully trustless as product claims.
The configured multiplier starts at two and may change for future requests; the compact quote reflects its current value.
An actionable problem should name the recovery action rather than end with a vague Something went wrong.
Technical details can remain in the expandable transaction/request view.

### 18.4 Warning and error-copy requirements

Money-related copy uses one compact estimated-total line beside the main action, available before wallet approval.
The disclosure is deliberately quiet and small, using normal accessible text rather than hidden or misleading labeling.
A small optional details expander distinguishes mint price, processing contribution, and estimated network fee as applicable.
There is no fee-specific modal, extra required step, or dominant pricing block.
Actual wallet fees may differ from an earlier estimate and should not be described as fixed unless fixed.
The treasury contribution is not secretly relabeled as network gas.
No interface text should promise that mint revenue automatically buys AI credits.
The owner should understand the current price without reading a technical whitepaper.

Use adaptive ETH precision or, when a reliable fiat conversion exists, a positive bound such as Est. < $0.01 for an amount below the displayed fiat unit.
A positive quote must never round to literal 0 ETH, $0.00, or Free in the primary disclosure.
If fiat conversion is stale, show a readable ETH-only estimate; the mint's required oracle validity still fails closed under chapter 14 rather than using a stale mint price.
Optional details show the exact authorized processing value, separately estimated owner-request network fee, applicable multiplier, and units.
The actual wallet network fee is additional to the processing value and may differ from its estimate; the compact line combines their estimated total.
An expired quote refreshes in the same flow with selections preserved, and a material displayed change is announced without another fee-confirmation modal.
An already accepted request retains its authorized processing amount under chapter 14.
Release expired request shows network gas only and no processing charge; requesting the next fresh attempt afterward obtains its own normal quote.

An accepted transaction cannot be described as deleted because later preparation failed.
An AI preparation failure is described as Failed after that request outcome is recorded.
An uncertain transaction gets Checking transaction rather than Failed.
Try Again on a Failed AI request always explains that a fresh owner request requires another wallet signature.
Failed requests do not decay the NPC, consume a successful game day, delete prior transactions, or imply a refund.
Use Recording failed attempt or Recovery pending while chain release remains unconfirmed; a local error alone does not enable another request.
Refresh status and resumed-worker recovery are labeled separately because they do not authorize a new day.

Critical condition copy should state what is known and what remains uncertain.
For example, Needs treatment next game day is different from Will definitely die next day.
Only the actual mechanical rule can justify a guaranteed consequence.
Random household danger should be described with understandable risks, not precise invented odds.
Death copy uses the recorded cause and final day, including multiple contributing conditions if the record supports them.
The summary must not blame a player for a service interruption.

### 18.5 Authored content model

Authored event lines are presentation content stored offchain in the proposed baseline.
The authoritative action identifier and outcome select an appropriate line family.
The replay packet preserves enough identity to reproduce the approved presentation.
A text library update must not change an old action's underlying mechanical meaning.
Content versions allow old replays to remain readable after wording corrections.
The chain does not need every flavor sentence to recover current needs and inventory.

The proposed content families include ordinary movement, collection, storing, consumption, cooking, cleaning, crafting, gardening, rest, surprise, injury, sickness, recovery, and death.
Give common actions more variants than rare technical states.
Reserve a clear literal line for every critical event before adding jokes.
Avoid a combinatorial requirement for ten bespoke lines for every possible state cross-product.
Use reviewed templates and compatible tags to cover variety without contradictions.
A character cannot comment on a consumed item as still in its bag.

The template system must reject unsupported or missing fields safely.
Player-supplied names are treated as text rather than markup.
No generated line should expose raw provider errors, addresses, or internal object identifiers in the normal message box.
Diagnostic detail can show sanitized request information outside the tiny narrative area.
Localization remains a future possibility; do not encode essential game rules only in English jokes.
Visual icons and literal summaries should still support the meaning of each important outcome.

### 18.6 Audio direction and scope

The user welcomes quiet household sounds, chiptune music, and expressive character noises.
Audio is a supporting layer and may remain modest in the first release.
Start with a small coherent set rather than an unbounded sound for every event.
Browser playback must follow an actual user interaction and respect platform autoplay restrictions.
Sound state should persist locally as a user preference.
Silence must preserve every important piece of gameplay information.

Proposed audio groups are:

- Quiet room ambience with a low-distraction loop.
- Optional restrained chiptune music with a separate level or toggle.
- Short UI confirm, back, and recoverable-error cues.
- Soft footstep or movement accents used sparingly.
- Mailbox, fridge/cupboard, water, cooking, and garden interactions.
- A small collection of rooster chirps or comic reaction sounds.
- A distinct danger cue that also has a visible equivalent.
- Brief birth and death cues with quiet reduced-stimulation alternatives.

Do not play a new sound for every polling update or decision counter increment.
Provider retries should not become repetitive failure alarms.
The final save can have a small completion cue once the saved state is known.
Birth/death music should stop cleanly when skipped or when the game loses audio focus.
Tab visibility changes should not produce overlapping loops or catch-up bursts.
Audio latency must not alter replay state or simulation outcomes.

### 18.7 Accessible input and focus

Every required interaction must be possible with touch and keyboard.
The supply picker cannot depend on drag-and-drop, hover, or right-click.
Buttons need comfortably spaced touch targets, with 44 CSS pixels as the proposed review baseline.
Actual hit areas may extend beyond a small pixel icon without increasing visual clutter.
The square cannot sacrifice readable controls merely to preserve a decorative frame.
Keyboard focus must be visible against every reviewed palette.

Opening an overlay moves focus to a meaningful heading or first control.
Closing an overlay returns focus to the action that opened it where that action still exists.
Focus must not jump to a different rooster while ownership data refreshes.
Tab order should follow the visible reading order of status, selection, and primary action.
Escape may close optional detail panels, but cannot pretend to cancel an accepted day.
An overlay must not trap focus in a hidden or disabled control.

Screen-reader labels should identify an item and whether it is selected.
The distinct Details control identifies its item and never changes selection; Add/Remove announces the resulting delivery count without rereading the whole catalog.
Need meters expose their names, current values, and critical conditions.
Stat allocation controls announce remaining points without repeating the entire screen after every press.
The active token selector exposes name, token number when needed, and life status.
Transaction links identify whether they open the owner request or final save.
The canvas requires an accompanying accessible summary of the current event and state.

Make request acceptance, meaningful phase changes, terminal failure, confirmed release, and replay readiness programmatically available as status announcements, once per actual transition and with the rooster/day context.
Do not automatically speak every decision count, SEND/JEV/REPLY blink, poll, or changing candidate probability.
Current progress is readable on demand; any automatic milestones remain restrained rather than queueing obsolete updates.
These announcements do not take focus from item/transaction details or a pinned inspection view.
When a mode removes the focused action, move focus to its new meaningful heading or safe action and avoid announcing the same transition twice.
Distinguish a live job's progress from the pinned historical decision being read.
Failure and ready states must be discoverable without visual polling, while no reading acknowledgment adds a payment or changes game state.

### 18.8 Motion, contrast, and timing

Respect reduced-motion preferences from the first rendered frame.
Offer a manual motion setting inside Options as well.
Reduced motion removes or softens screen shake, camera sweeps, flashing particles, and typewriter text.
It retains meaningful pose changes, clear status labels, and the authored event sequence.
Critical information must never be conveyed only through a pulsing red border.
Birth and death need equivalent non-flashing presentation variants.

Use shapes, icons, and text to distinguish health, nutrition, hydration, energy, and morale.
Do not make low-state red and high-state green the only distinction.
Provide sufficient text/background contrast in both bright domestic and dark overlay states.
Pixel fonts are for character and short labels, subject to phone-size readability review.
Long explanations can use a clean readable companion font inside the same visual system.
The chosen font must include the validated name characters and ordinary punctuation.

Do not force reading speed through a three-minute unpausable text stream.
Presentation pause and message review should be possible without a new transaction.
Skip/View saved outcome is required in Replay ready, active/resumed replay, and the missing-packet flow; every resulting summary retains critical condition changes and truthful death/trial status.
Inspection pauses the playback clock and pins its receipt/state until Explicit resume; preparation inspection pins completed data while the backend continues.
No rapid-tap sequence or reflex test is required to keep the rooster alive.
Preparation waits should allow leaving the site and later resuming from durable state.
Service availability should never be confused with a real-time survival countdown.

### 18.9 Comprehension and accessibility verification

Before approving the selected mockup direction, test a representative first-time reader's interpretation.
Ask what choosing supplies changes and what the AI chooses independently.
Ask whether closing the site will hurt the rooster.
Ask whether Start day will charge the wallet again.
Ask whether a replay can still be changed by a button.
Ask whether a memorial token has been burned.

The design succeeds only if those answers match the actual product rules.
Review the same questions in provider failure, slow finalization, and resumed-session states.
Check keyboard-only completion of connection handoff, mint setup, item selection, and details navigation.
Check touch completion at the smallest reviewed square size without accidental item replacement.
Check enlarged text and reduced motion in the most crowded care-warning state.
At P320 and 200% text, verify the single-scroll overflow hierarchy, discoverable lethal deadlines, readable positive fee line, visible focus, item detail, and reachable normal-flow footer.
Inspect items by touch and keyboard with zero, two, and three selected; opening and closing Details must never change the kit.
Check an accepted request whose backend disappears through expiry eligibility, wallet release approval, uncertain release receipt, and confirmed release before a fresh request.
Check a missing latest replay and all required skip routes without a new signature, inference call, state mutation, or counterfeit biological day.
Use a screen reader through normal preparation, failure awaiting release, recorded failure, and replay readiness; verify meaningful announcements without per-decision speech or focus theft.
Read one pinned recorded choice for thirty seconds while playback remains paused, then repeat during preparation while the actual job continues.
Check silent playback of birth, ordinary activity, injury, death, and trial completion.

The final copy inventory should link each critical message to its UI state identifier.
The final audio inventory should link each cue to an event family and visual equivalent.
The final accessibility review should record failures and corrections rather than declare generic compliance.
These checks are release acceptance work, not claims that the current planning document has implemented accessible behavior.

## 19. Balance framework and evidence plan

### 19.1 Balance is a release outcome

The owner wants streamlined, balanced, dynamic play.

This document proposes the rules that should produce it.

Neither a well-written specification nor a plausible item table proves balance.

Balance requires measuring the implemented mechanics with repeatable scenarios and actual model behavior.

Do not call a coefficient final simply because it appears in a table here.

### 19.2 What a fair game should communicate

- The owner can tell which need is becoming urgent.
- The owner can choose a plausible delivery response.
- The creature has a meaningful opportunity to use that response.
- A setback has visible consequences.
- A rescue has visible benefits.
- A rare disaster does not excuse ordinary unclear rules.
- A favorable seed does not require discovering an undocumented exploit.
- A difficult seed still provides understandable decisions.
- A new creature is not doomed before its first useful choice.
- A long life remains possible without an arbitrary expiration date.

### 19.3 Comparative care policies

Evaluate several owner policies rather than only an optimal one.

**Attentive policy:** reads warnings and responds to the most urgent unmet need.

**Routine policy:** repeats a sensible default delivery with occasional adjustments.

**Experimenting policy:** tries varied useful objects while keeping basic needs supplied.

**Poor policy:** repeatedly ignores clear warnings.

**Random policy:** selects legal supplies without reading current state.

The purpose is to see whether useful care improves survival.

The purpose is not to force one predetermined lifespan for all policies.

### 19.4 Attribute allocation evaluation

Cover all twenty-one legal allocations of the five points under the same declared precision and eligibility rules.

Compare allocations under the same event seeds and care policies.

Check early-day safety separately from long-run survival.

Check whether a single stat dominates food, hazard, and recovery outcomes simultaneously.

Check whether an attribute's benefit is comprehensible in play.

Check whether model choice changes undermine the intended tradeoff.

Use the result to reduce effects or revise labels before adding more stats.

### 19.5 Supply evaluation

- Frequency with which each supply is selected.
- Frequency with which it is actually consumed.
- Number of distinct useful contexts it supports.
- Rate of emergency stockpiling.
- Frequency of unusable inventory.
- Whether food and water permanently crowd out every utility item.
- Whether one multipurpose item becomes an automatic choice.
- Whether an item only exists for one excessively rare event.
- Whether crafted outputs repay their input cost too quickly.
- Whether persistent output lifetimes produce an unbounded stockpile.

An item should be removed or revised if it adds explanation without adding meaningful choices.

### 19.6 Event evaluation

Measure event eligibility, actual selection, harm, recovery, and repeat rate.

Track the number of consecutive stressful events.

Track the availability of breathing room after a major setback.

Track deaths without an earlier actionable warning.

Separate intentional low-probability fatal surprises from accidental rule interactions.

Keep black-swan outcomes rare enough that ordinary care is worthwhile.

The exact acceptable probability needs human review after seeing representative stories.

### 19.7 Lifespan evaluation

The approximate 30-game-day typical life is a tuning reference.

Report median, spread, and cause-of-death distribution.

Do not hide results that differ substantially between policies.

Do not tune by imposing a fixed death day.

Measure long-lived tails and early deaths separately.

No forced old-age cutoff is part of the launch design.

Old age may alter event eligibility or resilience only under an explicit bounded rule.

### 19.8 Story variety evaluation

Inspect complete sequences, not only event counts.

Look for repeated action loops.

Look for distinctive object applications.

Look for visible effects from yesterday's conditions.

Look for a recognizable domestic rhythm.

Look for comedy that follows the mechanics rather than contradicting them.

Look for days where nothing meaningful changes.

Revise candidate construction or pacing before adding many more event types.

### 19.9 Testing cost discipline

Run rule and seed simulations without paid inference where they can answer the question.

Use deterministic representative policies to inspect resource pressure.

Use small real-Jev samples to inspect action selection.

Use complete live-AI days to validate the actual integrated experience.

Keep three evidence scopes separate: deterministic rule/accounting experiments, a bounded genuine-Jev context corpus, and complete genuine-Jev day runs.

A scripted attentive policy's survival distribution is not the shipped model's measured population lifespan.

Real context samples retain offered alternatives and actual choices, including legal refusals, without silently replacing surprising choices.

A complete-day report measures operational completion and tail wait as specified in section 10.18; a biological death is a completed result.

Record input token usage per decision and per day.

Avoid hundreds of paid calls merely to retest deterministic arithmetic.

The owner's authorization to use inexpensive Jev credits is not a reason to waste them.

### 19.10 Balance report required before mainnet

The report should state:

- Rules version tested.
- Model identifier observed.
- Seeds and policies evaluated.
- Cases run without inference.
- Cases run with real inference.
- Survival distribution.
- Most common death causes.
- Dominant or neglected supplies.
- Attribute allocation differences.
- Unresolved outliers.
- Changes made and why.

Keep temporary raw runs in TEMP.

Keep any permanent conclusions needed to understand the released rules outside TEMP.

Promote a small sanitized release-evidence bundle containing exact rule and decision versions, deterministic seeds, policy tie breaks, independent expected fixtures, stopping/censoring rules, sample sizes, denominators, aggregate results, and representative recorded real exchanges.

Bulk logs and redundant scratch remain disposable. Never promote credentials or personal submission payloads.

### 19.11 Product-quality release disposition

Having a report is not the same as passing a product gate.

Before mainnet, review a bounded set of eight representative complete days: quiet care, resource shortage, injury rescue, illness rescue, domestic accident, cooking, gardening, and terminal outcome or trial completion.

Use recorded fixtures for controlled cases and label which are genuine-Jev observations.

The review records whether the player understands the next useful action, whether supplied care has a legal opportunity, and whether actions produce visible consequences rather than repetitive filler.

Known dominant allocations or delivery policies, supplies with no credible niche, omitted rescue options, and repeated no-value paid choices receive an explicit disposition: fixed, accepted with measured rationale, or blocking.

An omitted feasible urgent option, irreproducible canonical state, or unintended unavoidable ordinary rescue bundle blocks release.

A measured balance outlier does not automatically require more features; adjust existing parameters or document the acceptable limitation.

The owner reviews the resulting representative experience against streamlined, balanced, and dynamic. Routine coefficient or implementation corrections need no separate approval ritual.

Record the evidence, selected values, and remaining accepted limitations in the release section before claiming those qualities achieved.

## 20. Verification and acceptance criteria

### 20.1 Product acceptance

- A new player can explain the daily loop after seeing the opening overlay.
- A returning player sees the next useful action without navigating between pages.
- The creature's urgent need is visible before supply selection.
- Supply selection is understandable on a phone.
- Preparation visibly uses real AI calls.
- A day cannot start playback before its completed save is confirmed.
- The product-quality disposition in section 19.11 is complete; functional checks alone do not substitute for it.
- The replay matches the completed save.
- Survival increments level once.
- Death retains the token and prevents future play.
- Absence does not advance needs.

### 20.2 Mint acceptance

- The same seed produces the same appearance across reveal, house, and metadata.
- Name length and allowed characters are enforced consistently.
- Five allocated points are preserved accurately.
- Rejected wallet approval creates no creature.
- Failed first-day preparation does not destroy or duplicate the minted creature.
- Retrying the first day does not require a second mint payment.
- The initial supply reserve matches the specified rules version.
- Mainnet and testnet tokens never become mixed in the interface.

### 20.3 Daily request acceptance

- Only the current owner can authorize the next day.
- Duplicate clicks do not create concurrent days.
- Stale status cannot overwrite a newer save.
- The request binds the delivery, token, chain, and base save.
- The quote is current when accepted.
- An accepted request is discoverable after refresh.
- A pending day blocks conflicting transfer or day requests.
- Terminal failure is represented honestly.
- The owner can submit a fresh transaction after the failure lock is released.

### 20.4 Worker acceptance

- A closed browser does not terminate the canonical job lifecycle.
- Duplicate invocations do not duplicate the final day.
- Successful checkpoints survive a process restart.
- A provider error does not mutate canonical creature state.
- Failed preparation does not consume canonical inventory.
- Failed preparation does not age conditions.
- A relayer interruption leaves a recoverable prepared result or an honest failure state.
- Retry limits prevent an unbounded paid loop.
- A paused service does not accept avoidable paid work it cannot handle.

### 20.5 Chain acceptance

- One request settles at most once.
- An old owner cannot settle a new unauthorized day after transfer.
- A dead token rejects new play requests.
- A trial-complete token cannot consume a fourth committed trial day.
- Module version references are explicit.
- Withdrawal permissions match the intended developer authority.
- A fee multiplier change cannot silently change an already accepted quote.
- Compact onchain state reproduces the canonical creature save.
- The replay digest alone is not represented as a complete replay backup.

### 20.6 Playback acceptance

- No paid inference occurs merely because a replay is watched again.
- Pause affects animation only.
- Skip affects presentation only.
- Refresh reproduces the same completed outcome.
- The HUD shows the correct replay moment's state.
- The death scene occurs at the recorded cause and time.
- Resource use is visually legible.
- The message box stays within its intended two-line composition.
- Camera movement keeps the active creature and important interaction visible.
- Authored lines match the actual event.

### 20.7 Ownership acceptance

- The received token carries the same current state and appearance.
- The old owner's cached interface stops offering control.
- A newly connected receiving wallet can continue an eligible creature.
- A pending request cannot be escaped by transferring the token mid-preparation.
- The NFT metadata remains intelligible when external services cache older data.
- Marketplace display is tested on a supported chain before promising a particular marketplace experience.

### 20.8 Cost acceptance

- Record the actual input token distribution for complete days.
- Record provider failures and duplicated uncertain billing where observed.
- Record owner-request transaction costs.
- Record settlement and failure-recording transaction costs.
- Record worker runtime and storage operations.
- Compare the initial multiplier to these measured costs.
- Provide the developer a clear way to adjust prospective quotes.
- Never claim that the ×2 multiplier guarantees profitability.
- Avoid silently changing the owner's charging model to a separate mandatory minimum payment.

### 20.9 UI acceptance

- The complete experience fits a square surface.
- Desktop preserves the same composition rather than creating extra panels.
- Text remains readable on the smallest supported phone viewport.
- Touch targets work without precision tapping.
- Warnings do not depend on color alone.
- Motion and audio controls are available without obscuring the primary loop.
- The total fee estimate is compact but readable.
- The optional cost details do not create a mandatory extra step.
- The actual wallet request matches the displayed payable amount.
- A slow network never becomes a blank unexplained screen.

### 20.10 Scope of testing

Write meaningful tests for state transitions, resource accounting, ownership, fees, and recovery.

Use visual inspection and interaction checks for reversible presentation changes.

Avoid tests that merely repeat the implementation's internal structure.

Use real-Jev integration checks where the provider behavior matters.

Use explicit fault scenarios for duplicate jobs, stale requests, and interrupted settlement.

No required production check is considered passed by this design document.

### 20.11 Small independent acceptance spine

These witnesses share fixtures and infrastructure; they are not a demand for one test per implementation function.

| Witness | Required independent observation |
| --- | --- |
| Arithmetic and scheduler | A hand-reviewed action trace identifies all sixty slots, six boundaries, cooldowns, and expected state; a second trace dies mid-phase and receives no later effects |
| Failure and time separation | Two Failed attempts preserve all biological fields; a fresh third attempt completes the same intended day; wall-time absence and replay add no decay or progress |
| Admission and budget | A one-job reserve cannot issue two capacity-backed permits; all actual transport sends and failed-trial spending count against their separate ceilings |
| Worker and outbox | Lease takeover rejects a paused old worker's progress; crashes before and after signed broadcast recover known request/nonce/hash identities |
| Chain reconciliation | Orphan request, orphan settlement, and competing failure/expiry/finalization converge on one canonical winner without a duplicate life increment |
| Ownership and network | Token number collisions across networks, account switches, and transfers never reuse another context's quote, replay, stock, or authority |
| Cold owned-save restore | A clean installation reconstructs every required current field, bounded recent memory, and specified compact history from canonical chain data and permanent public decoders/assets, with backend, local storage, TEMP, and old checkouts unavailable |
| Genuine decision and viewing | Recorded real-Jev alternatives and chosen target lead to the same saved effect and replay moment; rewatching and skipping buy no inference |
| Constrained interface | A crowded P320 care/retry flow works with enlarged text, keyboard, reduced motion, and the selected screen-reader pair |
| Fresh evaluator | A clean-clone deterministic path and a separate hosted real-testnet path have explicit prerequisites, actions, expected outputs, and honest fallback evidence |

For the simplest arithmetic witness, begin before a phase boundary at nutrition twenty, hydration fifteen, energy fifty, morale sixty, health one hundred, with one bread and one water.

Eat bread in one ordinary slot, then drink water in the next ordinary slot without crossing a boundary.

The expected result is nutrition sixty, hydration sixty-five, energy forty-eight, unchanged morale and health, both supplies consumed, and no new committed day or level yet.

Those expected numbers are reviewed from the rule table rather than obtained by calling the same implementation reducer twice.

For every witness retain the seed, exact versions, action/condition inputs, expected outcome, and observed result in the small release-evidence bundle.

### 20.12 Repeatable small-screen interaction review

Use P320 and P390 with the square surface, the longest legal name, three urgent conditions, selected delivery, current stock, quote, and a recovery notice.

Review normal and 200% text, keyboard-only interaction, sound off, and reduced motion.

Use one primary screen-reader/browser pair for the entire journey and a second mobile platform for key wallet/progress/summary states; record the actual product versions in the evidence.

The proposed mobile review pairs are Chrome/Android with TalkBack and Safari/iOS with VoiceOver; desktop keyboard/focus review can use the supported Windows browser.

Check that essential ordinary text meets the proposed 4.5:1 contrast baseline and that the planned 44 CSS-pixel touch areas remain usable.

Read every lethal warning, inspect an item without selecting it, add/remove/replace supplies, reach the compact nonzero total, expand details, and return focus without hidden content or horizontal text scrolling.

Saving, Failed, and replay-ready announcements occur once without stealing focus; sixty counter updates do not drown out the current selection.

A still mockup supplies design evidence only. Actual interaction review is required after implementation.

These are bounded project checks, not a claim of complete WCAG certification or a new legal approval process.

References: [W3C text resizing](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), and [status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

## 21. Build and release sequence

The stages below describe dependencies, not a requirement to postpone submission work until mainnet.

Submission evidence begins alongside the deterministic and testnet work, with the independently scheduled fallback in section 21.11.

### 21.1 Stage A — design draft

Consolidate the owner's decisions.

Make remaining proposals concrete enough to review.

Keep uncertainties labeled.

Complete the master document without implementation code.

Do not begin mainnet deployment as a side effect of writing the document.

### 21.2 Stage B — visual direction

Exploration completed: the owner selected the top-down Harvest Moon / handheld RPG family. VR-01 records the approved visual direction. Historical candidates are not active production choices.

### 21.3 Stage C — focused visual refinement

The owner approved the original richer Moss & Cream larger-house image and rejected later recolors. Preserve its palette relationships, room crop and navy overlay language. Technical pixel scale, real source poses/facings, anchors and font metrics remain to verify; they do not authorize another palette-comparison round.

### 21.4 Stage D — complete mockup map

Reconcile every state in the UI inventory with the selected visual rules.

Include normal, empty, busy, recovery, terminal, and network-specific states.

Specify what is shared across states.

Avoid treating every modal variant as a separate application page.

The [complete scene map](design/SCENE_MAP.md) is reviewed by distinct subagent perspectives before producing the complete mockup collection. Fix coverage/continuity gaps, then generate within VR-01; no new image generation belongs to the mapping pass.

### 21.5 Stage E — deterministic foundation

After the complete scene review, first build one narrow slice with the selected shipping-style art: mailbox, storage, one use, one garden or maintenance beat, bedtime, and summary.

Prove its scale, pivots, contact points, camera, and recorded-state playback before multiplying the catalogue content.

Use that measured unit of work to update the solo forecast; do not discover all missing poses during late hardening.

Implement the simulation rules independently of rendering.

Implement seeded home and appearance consistency.

Implement replay generation and playback from recorded data.

Use local test data while the deterministic boundaries are validated.

Keep temporary fixtures and visual experiments in TEMP unless they become necessary permanent test assets.

### 21.6 Stage F — live-AI testnet integration

Connect the decision adapter through NEAR AI.

Use real inexpensive Jev calls for integrated days.

Implement request, worker, failure, and settlement flows on Robinhood testnet.

Exercise closed-tab and duplicate-job cases.

Measure actual latency and costs.

Verify the three-day trial behavior.

### 21.7 Stage G — product hardening

Tune resource balance and story variety.

Complete new rooster action poses and interactive household assets.

Validate all approved mockup states against implementation.

Verify accessibility and small-screen readability.

Verify metadata and transfers.

Verify treasury and multiplier controls.

Run the mainnet readiness checks.

### 21.8 Stage H — mainnet release

Use a dedicated developer-controlled wallet as requested by the owner.

Record its public address for owner funding when wallet setup is performed.

Keep private signing material outside the repository.

Verify the intended chain and contracts before funding or deployment.

Deploy only the reviewed release.

Exercise one small real mint and completed day before broad promotion.

Publish verified contract and explorer links.

### 21.9 Stage I — hackathon submission

This workstream runs in parallel from testnet development and does not depend on Stage H completing.

Re-read the live event rules.

Confirm the selected track and integration description.

Prepare a reproducible README and a complete demo.

Have the owner publish the required public demo post.

Review the exact submission payload before the final submission action.

Preserve the working game through judging.

### 21.10 Deployment discipline

Pushing main triggers a Netlify deployment.

Batch coherent changes into infrequent production pushes.

Prefer local verification during iteration.

Check whether branch previews also consume deployment credits before assuming they are free.

Do not change project billing or paid services silently.

The release process should retain a clear known-good version for recovery.

### 21.11 Proposed dated solo critical path and contingency

All dates below are Bangkok time in 2026. They are planning targets dependent on owner visual choices and measured work, not delivery guarantees.

| Target | Dependency and bounded focus | Exit evidence or decision |
| --- | --- | --- |
| November 1 | Compare the first five visual directions | Owner selects a direction after seeing real-source-sprite readability and incremental pose work |
| November 2 | Focused refinements and technical-art contract | Owner selects refinement; scale, pivots, projection, anchors, occlusion, and missing assets documented |
| November 3 | Complete base/derivative scene map and reviewed collection | Every required state covered; no game implementation starts before this gate |
| November 4 | First selected-art deterministic vertical slice | Household route, contact poses, state effects, and sixty-receipt timing fixture provide measured production estimates |
| November 5–8 | Testnet owned save, bounded worker, real-Jev loop, remaining approved content | One full accepted day and recovery path work; submission README/video work begins in parallel |
| November 9–11 | Balance, reliability, mobile, cold restore, and cost evidence | Known severe defects fixed; explicit product-quality and operating-capacity dispositions |
| November 12 | Mainnet readiness and small smoke path if gates pass | Verified contracts, correct oracle context, funded finite capacity, and owner-reviewable release evidence |
| November 13, 18:00 | Submission freeze | Freeze the verified mainnet commit if ready; otherwise prepare the verified testnet submission branch for owner review while mainnet remains unfinished work |
| November 14, 12:00 | Proposed submission target | Public repository, owner demo post, exact payload and consent ready; margin remains before the November 15, 06:59 deadline |

Update the forecast after each visual decision and after the first slice, including missing pose/action counts and remaining effort.

Reserve the final interval for defects and submission, rather than treating every available day as new feature time.

If a dependency slips, present a concrete forecast and the smallest proposal-level staging choices; never silently skip visual review, remove locked features, or call a testnet submission completion of the mainnet goal.

The testnet fallback still needs the canonical save, real NEAR AI choices, complete saved playback, failure conservation, and reproducible demo evidence.

An unverified mainnet oracle, marketplace indexer, or mainnet smoke result must not prevent preparing that valid testnet submission package.

## 22. Image-generation and mockup production plan

### 22.1 Purpose of the images

The images establish visual direction and interaction composition.

They are reviewable design artifacts.

They are not evidence that a feature has been implemented.

A polished mockup must not conceal an unresolved game rule.

### 22.2 First comparison set

Historical stage complete: the owner selected the top-down handheld RPG family. See section 17.5 for candidate history. Do not repeat the comparison while producing final scenes.

### 22.3 What the comparison should test

Current production checks use the selected reference: recognizable rooster at phone size; clear active prop and approach; larger connected house with partial follow-camera crops; understandable dynamic objects; readable navy menu/message surfaces; source-art identity and accessory compatibility; warm approved color relationships; domestic tone; and safe overlay/occlusion behavior. The former whole-house-percentage test is retired.

### 22.4 Refinement comparison

The owner selected [VR-01](design/references/VR-01-approved-house-and-care.png), the original richer Moss & Cream house/care image. Later muted variants are rejected. Further palette experiments are outside the current request. Solve state coverage and legibility within the selected direction.

### 22.5 Final mockup coverage

The [complete scene and interaction map](design/SCENE_MAP.md) expands every baseline UI-01–UI-11 state/derivative, adds actual loading/recovery/context gaps, maps functional zones and all action families, and assigns full UI panels/item derivatives/world storyboards. It is the detailed production inventory. UI-00 covers bootstrap; MB identifiers group at most two square panels; WS identifiers are world state/action sheets; AX identifiers track responsive/interaction evidence. AS-01–AS-12 remain asset families rather than finished files.

Mapping and independent missing-state reviews precede new image generation. Reviewed maps are planning evidence; finished mockups still require image generation and review. Phone P320/P390 and desktop D preserve the same square hierarchy. Exact UI strings and accessible interactions need later implementation checks; generated text alone cannot prove them.

The owner requested smart grouping: use two related full UI scenes, or up to three simple object/state closeups, per generated board. Split dense material instead of shrinking it. The [mockup index](design/mockups/README.md) now links the complete 99-board/215-panel guide package, with scene IDs, prompts, guide notes and explicit remaining coverage. The owner clarified that small text/icon mistakes should be noted rather than stalling production; these images guide appearance and placement, while written rules govern exact behavior. The [RP-01/RP-02 construction diagrams](design/reference-pack/README.md) record provisional topology and UI bounds independently of generated raster geometry.

### 22.6 Asset versus mockup boundaries

An image of a rooster in a mockup is not automatically a production sprite.

An image of furniture is not automatically an interactive tile atlas.

Production sprite extraction must preserve scale, palette, anchors, and transparency.

Existing procedural art should remain procedural where that preserves consistency.

Use image generation for the future approved visual exploration phase, not for silently replacing source-owned art during document drafting.

### 22.7 Permanent outputs

Draft prompts, rejected variants, contact sheets, and inspection renders belong in TEMP.

Approved visual references and final usable assets belong outside TEMP in an organized project directory.

Record the approved visual rules in this document.

The final game must work after TEMP is emptied.

## 23. Hackathon positioning and submission readiness

### 23.1 Proposed primary track

Games With Real Economies is the leading product fit.

The core experience is an autonomous NPC with owned persistent state and a meaningful care loop.

The NFT is how ownership and continuity work.

It is not a substitute for gameplay.

NFTs That Do Something can be considered a secondary track when the implemented inventory, history, and changing life state demonstrate useful behavior.

Avoid choosing tracks only because a keyword appears in the project description.

Source: [official hackathon tracks](https://nearhackathon.com/#tracks).

### 23.2 Fixed chain choice

Robinhood remains the primary chain by owner decision.

NEAR AI provides the Jev inference path.

Version one does not add a NEAR contract solely to make the architecture sound more native.

The current rules do not explicitly confirm that this exact integration qualifies.

Keep that uncertainty visible.

If eligibility feedback requires a product change, bring that concrete conflict back to the owner.

Do not quietly declare the owner's belief to be organizer confirmation.

### 23.3 Event schedule

| Milestone | UTC | Bangkok |
| --- | --- | --- |
| Opens | November 1, 2026, 00:00 | November 1, 2026, 07:00 |
| Submission deadline | November 14, 2026, 23:59 | November 15, 2026, 06:59 |
| Judging starts | November 16, 2026, 00:00 | November 16, 2026, 07:00 |
| Results announced by | November 18, 2026, 23:59 | November 19, 2026, 06:59 |

Testnet submissions are allowed under the published rules.

Code from the October 19 announcement is within the accepted development window.

Older reused work must be disclosed as baseline material.

Source: [organizer rules](https://nearhackathon.com/HACKATHON.md), checked October 31, 2026.

### 23.4 Demonstration story

Show one complete understandable moment.

Begin with the creature's visible status.

Choose a distinctive useful delivery.

Show real NEAR AI preparation without a long technical explanation.

Show the confirmed saved day.

Play the relevant household sequence.

End on a changed condition, surviving level, or memorable outcome.

Explain concretely that Jev chooses actions and Robinhood preserves the creature's state.

| Submission claim | Minimum visible evidence |
| --- | --- |
| Meaningful care loop | One scarce supply has two relevant uses and choosing one changes a later need or condition |
| Real NEAR AI contribution | A sanitized genuine System One input, its exact returned action instance, and the corresponding recorded result |
| Owned evolving NFT | Inventory, conditions, level, and life state remain attached through a standard transfer; the old owner loses control |
| Saved playback | The chain result and compact action record correspond to the same visible replay effect without buying inference again |
| Honest trust boundary | NEAR AI supplies hosted Jev decisions; the trusted service relays them; Robinhood holds the save; no confidential-model or trustless-inference claim |

Use a contrasting recorded context to show the behavior is not one fixed animation script.

Describe an internal resource economy where that is what exists; do not imply a marketplace, NPC token treasury, or autonomous financial spending absent from version one.

Do not describe the external Jev route as confidential model execution.

### 23.5 Submission materials

- Public source repository.
- Reproducible README.
- Clear setup and environment-variable names without secret values.
- A working demo or sufficient video where the demo cannot be opened.
- Public demo post using the required event mention and tags.
- Attribution for reused Jevscape and CRYPTOCOCKS material.
- An appropriate license file.
- Verified deployed addresses where applicable.
- A concise description of NEAR AI's actual role.
- Human-provided team and payout details.

The NEAR prize payout account is distinct from the Robinhood developer wallet.

No payout account should be invented.

The exact final submission details require the owner's review when submission is ready.

The README needs two explicitly different evaluator routes.

The clean-clone deterministic route uses no developer secrets and labels its fixture outcomes as offline verification.

The hosted genuine-testnet route names the supported wallet/network, current official faucet, real service prerequisites, expected preparation/viewing sequence, exact actions, and observable chain/UI results.

The hosted service holds its own provider key; the judge is never given the developer's credentials.

Reserve a bounded amount of live judging capacity within the already funded operating allowance, or state the availability limitation and offer complete recorded evidence immediately.

An uncut action-to-result video with readable request and settlement references remains available if quota, faucet, or provider access prevents live review.

Verify both routes from a clean profile or second machine, not the author's already signed-in environment.

### 23.6 Reuse boundary and public comparison evidence

For each imported Jevscape or CRYPTOCOCKS family, record the origin, actual imported revision, relevant notices, affected paths, and whether it predates the accepted development window.

Separate the new NEAR AI adapter and its game integration from the old direct-Typesafe reference.

Publish a baseline-to-submission comparison link or equivalent reproducible branch/tag diff in the final README.

Attribution credits reused work; the comparison identifies the increment being judged. Neither is replaced by local Windows paths.

Do not erase earlier history or label reused art as newly created for the event.

### 23.7 Final submission consent and uncertain-send recovery

Re-read the live official submission contract immediately before preparing the final payload.

Collect the real team/contact details, supported track selection, and human-provided NEAR mainnet payout account; never invent them or substitute the Robinhood developer address.

Present the contact notice and obtain agreement: "I agree that the organizers may use these details to review our submission and contact us about this hackathon."

Show the exact complete payload and obtain the owner's explicit approval before the send. A general design review is not this final payload approval or contact consent.

The repository must already be public and the owner-published demo post must already exist at that point.

Generate one submission identity, preserve it through an uncertain response or allowed transient retry, and record the confirmed result without committing personal payload data.

An uncertain send is reconciled as that same application; it is not a reason to create another identity or change links to bypass a duplicate response.

Missing consent, missing payout details, or an unreviewed payload leaves the application Draft.

A saved response marks the application submitted; a duplicate or closed-window response follows the live contract instead of blind retries.

No publishing, posting, organizer contact, or submission occurs as part of this design critique.

Source: [official submission guide](https://github.com/nearai/near-hackathon-prompt-examples/blob/main/SUBMITTING.md).

## 24. Decision register, risks, and owner review points

### 24.1 Decisions already settled

- Robinhood is the primary chain.
- NEAR AI is the intended inference service.
- Jev is the decision model.
- The characters are procedural roosters.
- The mainnet mint uses approximately one dollar in ETH.
- Wallet connection is required.
- The name is short, with eight characters as the chosen limit.
- The owner allocates five attribute points.
- Many independent creatures can belong to one wallet.
- Life advances through submitted days only.
- The whole day settles before playback.
- Ordinary playback targets three minutes.
- Roughly 60 Jev decisions is the desired starting scale.
- There are no live intervention buttons.
- Dead tokens remain as unplayable collectibles.
- New creatures are isolated from previous lives.
- All ordinary supplies are single-use inputs.
- New placed objects can have a game-day lifetime.
- A visible brain panel is required.
- Dialogue is authored offchain.
- The game occupies one square.
- The selected visual direction is the original rich Moss & Cream top-down handheld RPG reference VR-01.
- The house extends beyond the view; a follow camera shows partial areas with dynamic NPC interactions.
- Separate collection and marketplace pages are excluded.
- Testnet creatures receive three committed days including the first.
- Failed AI attempts are recorded and can be retried through a fresh transaction.
- Failed attempts do not require refunds.
- The gas-based multiplier begins at two and can be adjusted by the developer.
- Fee presentation stays compact with optional detail.

### 24.2 Concrete design proposals in this draft

- Body, Wits, and Spirit as the initial attribute names.
- Nutrition, hydration, energy, and morale as visible needs alongside health.
- Up to three distinct supplies per ordinary delivery, with an empty delivery allowed when using household stock.
- A specified catalog of fifteen supply types.
- A standardized three-day food and water reserve.
- Three safe random starter utility gifts.
- Home, Kitchen, and Garden & Leisure as the first behavior modules.
- A fixed intended-day event seed across failed attempts.
- A bounded event director with recovery opportunities.
- An inline owned-creature selector.
- Background workers with durable checkpoints as the minimal hosting baseline.

These proposals are usable defaults for review, not additional instructions from the owner's answer sheet.

### 24.3 Remaining visual review

The owner selected the top-down handheld RPG direction and exact original Moss & Cream reference VR-01. Preserve the richer original colors and larger connected house shown in partial crops. Further palette exploration is not requested.

The [complete scene map](design/SCENE_MAP.md) maps UI/menu/world interactions and production coverage before the next images. Six review perspectives checked omissions and contradictions; corrections and targeted postchecks are recorded in the map before full mockup generation.

The existing rooster is a useful identity source, not a finished animation set. Technical-art/source-pose compatibility and the complete generated scene collection remain review gates. No game code, production atlas or completed mockup collection is implied by the map.

### 24.4 Remaining technical verification

- Reverify the dated oracle-proxy observations, consumer-contract reads, heartbeat, freshness configuration, and selected deployment before mint pricing goes live.
- Verify metadata behavior and marketplace support on Robinhood.
- Measure complete-day token count and latency.
- Verify the available Netlify functions plan.
- Verify concurrency primitives against the installed storage version.
- Verify request failure and lock-release paths under relayer interruption.
- Verify day payload size and actual gas costs.
- Verify the reusable art's file-specific notices during porting.
- Verify that no permanent dependency points into TEMP.

### 24.5 Operating-cost risk

The owner expects Jev to be very inexpensive.

The live sample supports that a small individual request is inexpensive.

Sixty requests, settlement gas, worker runtime, and storage still accumulate.

The adjustable multiplier gives the developer a simple response to measured costs.

It does not prove that every small gas-based fee will cover every service cost.

Measure and report the result honestly.

Do not introduce a separate daily subscription or minimum payment without an explicit product decision.

### 24.6 Preparation-wait risk

A three-minute replay can be preceded by a substantial preparation wait.

Honest progress helps but does not remove that wait.

The first optimization is reducing unnecessary model context and redundant choices.

The second is reliable background execution and recovery.

Do not fake completion or play speculative events before settlement to hide a delay.

### 24.7 Content-volume risk

Fifteen objects with contextual uses can create substantial variety.

They can also create an untestable matrix if every possible combination gets a unique mechanic.

Prefer a small shared effect vocabulary with several authored interpretations.

Expand content only after the existing rules remain understandable.

The owner wants a wide possibility space inside a small comprehensible game.

### 24.8 Availability risk

The canonical creature survives a frontend outage because state is onchain.

An offchain replay packet can still become unavailable.

Its digest can establish identity but cannot reconstruct missing bytes.

Follow the canonical retention and restoration policy in section 15.4.

Do not claim that onchain ownership makes every external service permanent.

The exact owned-information boundary is section 11.4, and the single replay/diagnostic retention authority is section 15.4.

A gas measurement cannot silently reduce the promised onchain state or compact history by merely changing marketing wording; a narrower product promise requires a concrete owner-reviewable decision.

### 24.9 What implementation agents may decide

- Internal file layout.
- Exact library versions after checking current documentation.
- Data packing details.
- Function and variable names.
- Rendering optimizations.
- Queue implementation details that preserve the required lifecycle.
- Asset import formats that preserve approved art.
- Test structure appropriate to the state transitions.

They may not silently decide to add offline death, burn the memorial token, charge an unrelated subscription, replace Jev, add a different primary chain, or skip settled-before-playback behavior.

### 24.10 Milestone disposition

| Milestone | Status of this revision | Evidence still required |
| --- | --- | --- |
| Master design critique | Twelve full-guide reviews and independent post-amendment checks completed; consolidated amendments applied | Implementation evidence remains unrun; no remaining high-impact text contradiction identified in the reviewed scope |
| Mechanical coefficients | Concrete provisional baseline | Independent traces, all twenty-one allocations, care-policy and genuine-model evidence |
| Visual direction | Selected: top-down handheld RPG, original rich Moss & Cream VR-01 | Exact permanent reference in design/references/; source-art technical compatibility still required |
| Focused refinement | Owner selected original larger-house/care image; later recolors rejected | Font/pixel scale, facing/poses, anchors, camera/occlusion contract within VR-01 |
| Complete scene collection | Complete as a visual/layout guide: 99 boards/215 panels; all 121 UI states and exact variants/world frames have references | design/mockups/HANDOFF.md and REFERENCE_MAP.md distinguish generated art, derivatives and implementation-stage source/runtime checks |
| Game implementation | Not started by this critique | Approved-scene vertical slice, then full core and content |
| Testnet evidence | Not run | Real-Jev pipeline, recovery, cost, cold restore, and constrained UI witnesses |
| Mainnet release | Not deployed | Measured product/operating gates and the verified small smoke path |
| Hackathon submission | Not sent | Public evidence, human details/consent, and exact final payload approval |

Draft completeness, visual approval, test passage, and release acceptance are different outcomes.

The correction register in section 24.11 records plan-level dispositions; it does not convert future acceptance examples into passed tests.

### 24.11 Twelve-perspective critique and correction register

Twelve independent reviewers each read all 5,240 lines and all twenty-five chapters of the same frozen draft before any fixes began. Their reports contained sixty-eight observations, including overlapping findings.

The frozen draft SHA256 was F8761CD165DBA552BDB46C8F86D4431FC3850610C4E212612D336C9C23BE5689.

| Reviewer | Perspective | Findings |
| --- | --- | ---: |
| R01 | Game balance | 6 |
| R02 | Contract security | 3 |
| R03 | Mobile UX/accessibility | 8 |
| R04 | Distributed recovery | 7 |
| R05 | AI decision design | 6 |
| R06 | Unit economics | 5 |
| R07 | Adversarial play | 3 |
| R08 | Content/rules completeness | 7 |
| R09 | QA/reproducibility | 8 |
| R10 | Art/solo production | 4 |
| R11 | Product authority | 6 |
| R12 | Hackathon jury | 5 |

The following register consolidates those observations into explicit amendments. Every finding ID appears once. “Amended” describes the plan, not a passed game, security, balance, or availability test. The listed sections contain the governing decisions and later witnesses.

| Correction | Original finding IDs | Governing sections | Plan disposition |
| --- | --- | --- | --- |
| G01: Logical slots and phase clock | R01-F01, R05-F01, R08-F04, R09-F01 | 5.7, 10.8, 20.11 | Amended; verify during implementation |
| G02: Combined daily danger accounting | R01-F02, R08-F02 | 9.3, 19.6 | Amended; verify during implementation |
| G03: Useful garden and comfort niches | R01-F03, R08-F06 | 7, 8, 19.5 | Amended; verify during implementation |
| G04: Optional deliveries and bounded inventory continuation | R01-F04 | 6.6, 16.8 | Amended; verify during implementation |
| G05: Feasible ordinary rescue bundles | R01-F05, R08-F07 | 9.5, 9.6 | Amended; verify during implementation |
| G06: Stat precision and all twenty-one allocations | R01-F06 | 5.3, 19.4 | Amended; verify during implementation |
| T01: Capacity-backed permits before payable acceptance | R02-F01, R04-F01, R06-F01, R07-F01 | 12.5, 14.4, 15.8 | Amended; verify during implementation |
| T02: Mandatory contract validation floor | R02-F02 | 12.9 | Amended; verify during implementation |
| T03: Failed trial work charged to operating budgets | R02-F03, R06-F02, R07-F02 | 15.8, 15.9 | Amended; verify during implementation |
| U01: Small-screen overflow and repeatable review | R03-F01, R09-F08 | 16.2, 20.12 | Amended; verify during implementation |
| U02: Inspection distinct from selection | R03-F02 | 16.8 | Amended; verify during implementation |
| U03: Wallet-accessible expiry recovery | R03-F03 | 12.12, 16.14 | Amended; verify during implementation |
| U04: Required skip and missing-packet escape | R03-F04, R11-F04 | 16.10, 18.8 | Amended; verify during implementation |
| U05: Pinned brain and event inspection | R03-F05 | 10.14, 10.15, 16.10 | Amended; verify during implementation |
| U06: Pre-authorization preparation expectations | R03-F06 | 16.4, 16.5 | Amended; verify during implementation |
| U07: Restrained accessible progress announcements | R03-F07 | 18.7 | Amended; verify during implementation |
| U08: Nonzero sub-cent fee display | R03-F08, R06-F05 | 14.4, 16.8, 18.4 | Amended; verify during implementation |
| T04: One atomic fencing boundary | R04-F02 | 12.6, 12.7 | Amended; verify during implementation |
| T05: Signed transaction outbox before broadcast | R04-F03 | 12.10 | Amended; verify during implementation |
| T06: Hard chain-time settlement deadline | R04-F04 | 12.12 | Amended; verify during implementation |
| T07: Recovery across every nonterminal handoff | R04-F05 | 15.5 | Amended; verify during implementation |
| T08: Canonical reorganization reconciliation | R04-F06, R09-F04 | 12.14, 20.11 | Amended; verify during implementation |
| T09: Explicit replay retention and restore | R04-F07, R06-F04, R11-F02 | 15.4, 16.14 | Amended; verify during implementation |
| A01: Target-bound immutable action instances | R05-F02 | 10.6 | Amended; verify during implementation |
| A02: Frozen prompt and decision configuration | R05-F03 | 10.4, 12.3 | Amended; verify during implementation |
| A03: Urgent-choice coverage and repeat eligibility | R05-F04 | 10.6, 5.7 | Amended; verify during implementation |
| A04: Bounded mandatory decision context | R05-F05 | 10.5 | Amended; verify during implementation |
| A05: Transport ceilings and full-day reliability gate | R05-F06, R09-F03 | 10.8, 10.18 | Amended; verify during implementation |
| T10: Shared-host headroom and operator horizon | R06-F03 | 14.9, 15.8 | Amended; verify during implementation |
| T11: Bounded public endpoint dependency work | R07-F03 | 15 | Amended; verify during implementation |
| G07: Finite condition and escalation register | R08-F01 | 9.5 | Amended; verify during implementation |
| G08: Approved supply-to-action matrix | R08-F03 | 7, 8 | Amended; verify during implementation |
| G09: Functional outputs and logical anchors | R08-F05 | 6.7, 8 | Amended; verify during implementation |
| Q01: Separate evidence scopes and permanent witnesses | R09-F02, R09-F06 | 19.9, 19.10, 20.11 | Amended; verify during implementation |
| Q02: Independent chain-only cold restore | R09-F05 | 20.11 | Amended; verify during implementation |
| S01: Fresh evaluator and bounded judging access | R09-F07, R12-F02 | 23.5 | Amended; verify during implementation |
| S02: Dated production and parallel submission path | R10-F01, R12-F01 | 21.5, 21.9, 21.11 | Amended; verify during implementation |
| V01: Mockup-to-runtime technical art contract | R10-F02 | 17.11, 22 | Amended; verify during implementation |
| V02: Compositor corrections and accessory matrix | R10-F03 | 17.4, 17.11 | Amended; verify during implementation |
| V03: Sixty-receipt presentation timing proof | R10-F04 | 17.11, 20.11 | Amended; verify during implementation |
| P01: Explicit owned-save and compact-history promise | R11-F01 | 11.4, 24.8 | Amended; verify during implementation |
| P02: Biological days versus request attempts | R11-F03 | 1.4, 4.3, 4.4 | Amended; verify during implementation |
| P03: Correct wound-treatment examples | R11-F05 | 3.6, 10.17 | Amended; verify during implementation |
| P04: Product-quality and milestone dispositions | R11-F06 | 19.11, 24.10 | Amended; verify during implementation |
| S03: Exact submission consent and uncertain-send identity | R12-F03 | 23.7 | Amended; verify during implementation |
| S04: Auditable imported baseline and new work | R12-F04 | 23.6 | Amended; verify during implementation |
| S05: Track claims tied to real causal evidence | R12-F05 | 23.4 | Amended; verify during implementation |

Accepted owner tradeoffs remain explicit: predictable game randomness, a practical trusted relayer, no-refund Failed attempts, an adjustable gas-based fee, no offline aging, and settlement before playback. The critique does not reopen them as defects.

After the initial corrections, independent contract/recovery, product-authority, and QA reviewers checked the amended text and concrete counterexamples again.

That pass closed three further boundary omissions: protected replay packets retain their recorded-brain minimum after raw diagnostics expire; write-ahead transport claims survive crashes without confusing unbilled sends with unsent requests; and ordinary stock/fixture harm cannot silently remove the last feasible due-day rescue from the actual accepted kit.

It also aligned illustrative fixture repairs and care-ready/replay-ready labels with the canonical rules.

The final targeted rereads found no remaining high-impact contradiction in their reviewed scope. Those are document and hand-derived rule checks, not executed contract, game, provider, visual, or statistical validation.

Visual choices, numerical balance, real pipeline reliability, supported marketplace indexing, feed freshness/consumer behavior, and exact hackathon qualification remain evidence or owner-review gates. No reviewer report is proof that those gates have passed.

## 25. Sources, provenance, and requirement coverage

### 25.1 Source hierarchy

The owner's direct messages govern product intent.

The supplied completed questionnaire records detailed preferences.

Later direct clarifications govern failed attempts and adjustable minimal fee presentation.

Official technical sources govern what a service actually supports.

Existing local source establishes what reusable assets and patterns currently exist.

Design proposals connect those inputs into a coherent product.

External pages are evidence, not authority to execute account actions.

### 25.2 Official technical references

- [NEAR AI model catalog](https://cloud-api.near.ai/v1/model/list).
- [NEAR AI System One integration](https://github.com/nearai/cloud-api/blob/main/docs/jev-systemone.md).
- [NEAR AI model privacy tiers](https://docs.near.ai/cloud/models).
- [Robinhood Chain documentation](https://docs.robinhood.com/chain/).
- [Robinhood connection details](https://docs.robinhood.com/chain/connecting/).
- [Robinhood differences from Ethereum](https://docs.robinhood.com/chain/differences-from-ethereum/).
- [Robinhood confirmation and finality](https://docs.robinhood.com/chain/transaction-finality/).
- [Netlify Background Functions](https://docs.netlify.com/build/functions/background-functions/).
- [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).
- [Netlify Async Workloads](https://docs.netlify.com/build/async-workloads/overview/).
- [Owner-suggested Chainlink ETH/USD feed](https://data.chain.link/feeds/robinhood-chain/robinhood-mainnet/eth-usd-shared-svr).
- [Chainlink proxy-reading API](https://docs.chain.link/data-feeds/api-reference).

Network addresses, rate limits, plan limits, and model routing can change.

Recheck deployment-sensitive facts immediately before using them.

### 25.3 Game-design references

- [PEAK official developer storefront](https://store.steampowered.com/app/3527290/PEAK/).
- [Official Tamagotchi Uni manual](https://tamagotchi-official.com/manual/toy/uni/manual_03/Uni_WEB_IS_EN.pdf).
- [Official Monster Rancher training manual](https://www.koeitecmoamerica.com/manual/mrdx/mr1/en/2200.html).
- [Official Monster Rancher rest and care manual](https://www.koeitecmoamerica.com/manual/mrdx/mr1/en/2400.html).
- [RimWorld official console publisher feature overview](https://rimworld.double11.com/features).

The lessons used here are bounded care choices, understandable resource tradeoffs, visible setbacks, and recovery pacing.

The game does not copy those products' settings, art, characters, text, or complete rule systems.

### 25.4 Local reuse provenance

Jevscape supplies a reference architecture for bounded choices and smooth independent rendering.

Its existing server connects directly to Typesafe and does not establish NEAR AI compatibility by itself.

CRYPTOCOCKS supplies the procedural rooster identity and related source art.

Its fighting-game systems and previous neglect rules are outside the new product scope.

Preserve applicable source notices when actual files are reused.

This document does not require either old project to exist at runtime.

Approved assets and reusable source must be brought into the permanent project when implementation begins.

### 25.5 Questionnaire coverage

| Owner answers | Principal coverage |
| --- | --- |
| 1–5 | Chapters 1, 2, 21, 23 |
| 6 | Chapters 3, 4, 10, 12 |
| 7–11 | Chapters 2, 5, 17, 18 |
| 12 | Chapters 11, 13 |
| 13–18 | Chapters 5, 6, 11, 17 |
| 19–24 | Chapters 7–10, 16, 18 |
| 25–30 | Chapters 6, 8, 13, 17 |
| 31–36 | Chapters 7–9 |
| 37–41 | Chapters 4, 5, 9, 10 |
| 42 | Chapters 10, 12, 15, 16 |
| 43–48 | Chapters 5, 9, 11, 16 |
| 49–54 | Chapters 10–16 |
| 55–60 | Chapters 14, 15, 20 |
| 61–66 | Chapters 3, 11, 13, 16 |
| 67–72 | Chapters 17, 18, 22 |
| 73–78 | Chapters 3, 4, 15–18 |
| 79–81 | Chapters 2, 19–21 |
| 82 | This single comprehensive document |
| 83–84 | Chapters 16, 17, 21, 22 |
| Later failure clarification | Chapters 4, 10, 12, 16 |
| Later multiplier clarification | Chapters 14, 16, 20, 24 |
| Later minimal-fee clarification | Chapters 16, 18, 20 |

### 25.6 Repository cleanliness

TEMP is the location for temporary research, assembly scripts, intermediate drafts, and inspection outputs.

The completed master document belongs outside TEMP.

The finished application and its permanent documentation must not depend on TEMP.

Deleting TEMP after verified outputs are promoted must be safe.

Production pushes remain infrequent because main triggers a Netlify deployment.

### 25.7 Completion of the planning artifact

This critique revision is complete as a planning artifact when all twelve reports have dispositions, authoritative sections agree, links and coverage are checked, and independent cross-review finds no remaining unresolved plan contradiction.

That is a bounded document-review outcome, not a claim that a future game is flawless or that unknown balance, service reliability, and eligibility have been proven.

The owner's later VR-01 selection approves a visual direction, independently of this document critique. It does not approve every final scene or technical art asset.

It is not a report of passing game tests.

It is not evidence of deployed contracts.

It is the agreed place to review and refine the game before those later stages.
