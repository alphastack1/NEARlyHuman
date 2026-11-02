# Contract, artwork and trusted-worker review

Reviewed 2 November 2026. The Solidity contract and its deployment artifact were left unchanged. Fresh compilation, local EVM attack cases, read-only deployed-code checks and a subsequent funded testnet day support the conclusions below. This is a bounded project review, not an external audit or formal verification.

The contract/art reviewer sent no public-chain transactions and read no private user credentials. Local EVM checks used the exact deployment artifact, isolated local nodes and an in-memory random quote key; both nodes were stopped afterward. The later funded integration was a separate, explicitly authorized developer-wallet test. Its evidence is identified separately below.

## What minting generates

[NEARlyHuman.sol](../contracts/NEARlyHuman.sol) records a 256-bit birth seed derived from chain ID, collection address, token ID, player address and block timestamp. That seed is retained separately from the 192-byte game save and is not rewritten by day settlement or NFT transfer.

The current [procedural renderer](../src/art/rooster.ts) uses the seed to select body color, a different wing color, one of 30 headgear grids and an accent. The same pixel source supplies the game sprite and hosted NFT SVG. Each mint assembles seeded pixel art; it does not buy an AI-generated image or redraw a new random appearance every frame. The seed uses predictable casual-game pseudorandomness rather than a verifiable-randomness service.

Appearance is **not guaranteed unique**. There are at most 8,100 nominal cosmetic trait tuples: 10 body colors × 9 different wing colors × 30 headgear grids × 3 accent colors. Some overlays conceal base colors, so fewer distinct visible images result. A reproducible sample of 4,096 seeds produced 3,193 trait tuples and 2,580 pixel images, exercised all 10 body colors and all 30 headgear grids, and repeated each input identically. An explicit pair of different seeds produced the same pixel image. These sample counts do not establish uniform randomness or enumerate every possible appearance. See [art-audit.json](daily-life-review/proofs/art-audit.json).

The hosted BOK #1 SVG was fetched read-only and matched the current generator applied to its onchain birth seed byte for byte inside the image wrapper. Artwork identity is stable under the current renderer, but the SVG is hosted: `tokenURI` points to hosted JSON, the owner can change `metadataBase`, and a future renderer deployment can change the image mapping. See [art-live.json](daily-life-review/proofs/art-live.json).

## Source and deployed-code identity

The current Solidity source was recompiled in memory with solc 0.8.38, optimizer 200, `viaIR`, Cancun and the installed OpenZeppelin source. Creation bytecode and runtime template exactly matched the shipped artifact. Source SHA256 matched the artifact and recorded deployment:

`9e4883591c5ab951619b04ae6bbd5fca6bd0d6cf93fa0e540c95eaa129f69418`

Read-only Robinhood Chain testnet calls, chain ID 46630, confirmed collection `0x998551395f8a0c4ebd1f883b8c18a41d2cecabfb` had this code hash:

`0xb0344d8faa4f4c47b56d40fb9126f41009593e7a26a66b3f7fea16ca2acb19f1`

It matched the recorded deployed hash. Live runtime also matched the recompiled template outside compiler-declared constructor-filled immutable ranges. Owner, signer, relayer, treasury and testnet flag matched the deployment record. Runtime size was 22,663 bytes, and the collection had four tokens at the read. See [contract-live-readonly.json](daily-life-review/proofs/contract-live-readonly.json) and the compilation property in [contract-adversarial.json](daily-life-review/proofs/contract-adversarial.json).

## Fresh local contract checks

The existing exact-artifact lifecycle witness was rerun on a new local chain: **17 checks passed**. It covers acceptance/payment, initial state, transfer lock, duplicate settlement, transfer, failure preservation, retry seed, strict expiry, trial cap and retained terminal NFTs. Its generic revert checks are a baseline rather than independent proof of each rejection reason. See [baseline-lifecycle.json](daily-life-review/proofs/baseline-lifecycle.json).

A separate new harness passed **24 grouped properties with 74 rejection variants**. Custom-error cases checked exact selectors; constructor and `require` cases checked actual EVM reverts. The grouped properties cover:

- Signature, caller, domain, expiry, rules, configuration and fee binding; name/stat substitution; exact payment; permit rollback and one-use acceptance.
- Atomic genesis seed and first-day request; owner, approved-operator and safe-transfer locking.
- Relayer-only terminal writes; malformed state lengths, versions, day, level, needs, plots and house fields; incomplete or invalid history; zero commitment; canonical state/history/result hashes; duplicate finalization.
- Complete state/seed preservation and enumeration across transfer; revision invalidation even after transfer back; delivery bit/count limits; failure retention; stable retry day/seed; deadline equality versus strict expiry; first-terminal-wins behavior; full uint16 stock; three-day testnet cap.
- No delivery or starter duplication on a failed first-day retry; retained dead NFT; no survived-day award after death; dead play blocked; memorial transfer.
- All nine economic, service and metadata administrative mutations rejecting a stranger; multiplier/window bounds; reverting treasury recipient.
- A malicious ERC721 receiver attempting transfer during mint and reentry into `mint`, `requestDay` and `recordFailure`. It deliberately held relayer authority for the failure attempt. Transfer hit `RequestLocked`; guarded reentry hit `ReentrancyGuardReentrantCall`.
- A separate local chain with ID 4663 rejecting testnet constructor mode and a missing feed. Mock mainnet pricing rejected zero, negative, stale, future, incomplete, bad-decimal and unavailable feed data, underpayment and signed price drift beyond tolerance. These mocks do not verify a future real mainnet feed or funding.

The compiler/attack summary and scope are in [contract-adversarial.json](daily-life-review/proofs/contract-adversarial.json). No demonstrated contract defect from these checks required a contract change or redeployment.

## Delivery history compatibility

The physical collection record uses the existing tuple `T01 / mailbox / default / success`: action code 35, target 18, variant 0, outcome 1, encoded as `0x23120001`. It fits the contract's existing 35/20/40 code bounds and retains the same 240-byte alive-day history and 192-byte save.

At the earlier compatibility audit, all eight then-known saved days in the four-token testnet collection were inspected: three canonical archive packets, the verified PEEP day2 snapshot and four other public canonical replays. There were **zero matching collection tuples among 480 records**. This is a historical observation for that deployment at the audit time. The later NORI day3 below intentionally contains the new collection receipt. Historical source paths in the proof identify what was inspected rather than runtime dependencies. See [delivery-history-compatibility.json](daily-life-review/proofs/delivery-history-compatibility.json).

A focused local exact-artifact experiment accepted this tuple as the first record in a valid day2 history with delivery bitmask 7, settled day2/level2 and preserved the expected 240-byte history. That proves structural compatibility without a contract redeployment. See [delivery-tuple-evm.json](daily-life-review/proofs/delivery-tuple-evm.json).

The contract does not independently execute pickup timing, estate delivery credit, inventory conservation or Jev's choice. Those remain trusted service rules. The worker persists pickup state and credits once, validates uint16 limits, and versions the policy so earlier accepted work and historical packets keep their original semantics. Structural EVM acceptance alone does not prove those service mechanics.

## Worker accounting correction

The separate worker review found that an explicit provider charge could be ignored when token telemetry was absent or zero. The worker now honors the larger explicit charge while retaining its 588 microUSD uncertainty reserve when useful telemetry is unavailable. Cached answers also pass the over-budget guard before reuse. Provider costs must be finite and nonnegative.

One focused mocked regression covered over-budget planning, ordinary-action accounting, cached recovery without another send/charge, and unknown usage retaining its reserve. All **10 service/storage checks**, TypeScript and the scoped diff check passed. The over-budget planner stopped after one send at 70,000 microUSD; the ordinary-action case stopped after two sends at 70,588 microUSD. These were mocked charges, not real AI spending. See [worker-accounting-after.json](daily-life-review/proofs/worker-accounting-after.json).

## Funded new-policy integration

After the source reviews, a separate authorized testnet request saved NORI #4's day3 using the new daily-focus policy:

`0x31eaa17eed2526572050f27eb9987c5a9646f191c7957474197193df26f0413d`

The genuine Jev run made **six calls**, cost **548 microUSD ($0.000548)** and retained all **60 receipts**. Its single main undertaking planted roses successfully at slot 46. It collected the delivery once at slot 1, crediting exactly one water, wood and toolkit. Independent provider-output accounting matched the durable worker total.

The immutable packet commitment, canonical 192-byte state, 240-byte history, day replay commitment and combined contract result hash all matched. The public replay returned 200 with the same result and commitment. The latest replay index protected this packet. At the verification snapshot, no request was pending; all 12 jobs were terminal: nine ready, two failed and one expired. See the **27 passing named checks** in [verified-ready.json](daily-life-review/proofs/verified-ready.json).

| Record | Verified value |
| --- | --- |
| Request | `0x0f68a12974c0c84793b7ad804ee1ef66b587ad3c741d547674347cae2118c2b2` |
| Owner transaction | `0xac1389b5484cb98df9257f71a350206e83d74fb20e6d3bda4ebc6c37392e9673` |
| Settlement transaction | `0x78e369dd3b4cd83c6e058ab67622d3a27404575e5d259afff656305cbabe43fa` |
| Replay commitment | `0xebda065a42957a11e42a0bdb1fb4863203f5ef726c90350315a363a63dc876c4` |

Accepted-job time was 156.893 seconds using the local new-code worker with the shared Cloud store. This measures that staged integration, not the new hosted worker's production latency. The actual browser run automatically opened replay, made one owner send, reached living level 3 / Trial complete and recorded no page errors. See [funded-browser.json](daily-life-review/proofs/funded-browser.json).

A plain JSON comparison of the decoded canonical state and replay final state differed only because decoding adds `deathContributors: []` while the living replay omits that optional field. Every other leaf matched, and packed bytes were identical. See [state-diff.json](daily-life-review/proofs/state-diff.json).

The canonical preview metadata is retained in [canonical-preview.json](daily-life-review/proofs/canonical-preview.json), describing the [NORI day3 preview asset](../public/assets/preview/nori-day3-05de911accb2.json). It identifies the verified packet rather than a synthetic demonstration.

For the release boundary, admissions were paused, every older signed quote was strictly expired and the fresh new-policy request was the only pending job. It then reached the verified terminal outcome above. The snapshot in [release-boundary.json](daily-life-review/proofs/release-boundary.json) records that transition; it is not a claim that admissions remain paused after the final release.

## Trust and coverage boundary

The authorized relayer can submit any structurally valid bounded state/history for a pending request. The local full-stock check deliberately used that privilege, confirming that detailed stock provenance is not re-executed onchain. Players cannot directly settle another user's request, but the relayer and owner remain trusted bridge roles. The owner can rotate services, adjust pricing/fees and change hosted metadata.

The source establishes the pending lock before `_safeMint` invokes an ERC721 receiver; the fresh attack harness exercised that ordering. Exact installed dependency source and compiled bytes underpin the code checks. Remaining coverage limits include compiler/EVM defects, untested adversarial sequences, future mainnet oracle configuration, production key custody and offchain-service correctness. Mainnet remains a separate funded and verified deployment step.

The permanent proof subset contains public addresses, hashes, seeded-art samples, bounded check results and sanitized browser/provider measurements. It excludes private control/ledger records, credentials, session tokens, signatures and raw signed transactions. The application does not depend on the scratch scripts used to collect this evidence.
