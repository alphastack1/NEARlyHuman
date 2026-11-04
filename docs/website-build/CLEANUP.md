# Public repository cleanup

4 November 2026. The owner authorized cleanup before making the repository public. The PM approved an exact archive whitelist after dependency inspection. No repository visibility, Git history, wallet, service ledger or deployment was changed by this cleanup.

## Current tree

The root README now leads into [one documentation index](../index.md). Current architecture, development and economy guides replace obsolete V1 setup material. Contract source/artifacts/deployments, application code, public assets, scripts, native contract/wallet evidence and current website/NFT reviews remain in place.

**48 approved paths, containing 923 files / 251,829,348 bytes (240.16 MiB), were moved out of the current public tree.** These were superseded 99-board design mockups, rejected website directions and source-site screenshot studies, incremental gameplay/UI review capture collections, the original brainstorming master document and dated root handoffs. All moved paths were resolved and checked inside the intended repository and ignored archive directory before each move. Every archived file's byte count and SHA256 was checked before and after; all matched.

The full local archive and file-level manifest are disposable working material in ignored `TEMP/public-cleanup/`. Final source, builds and documentation do not read them. Earlier committed versions remain in Git history; this cleanup intentionally does not rewrite history or claim that historical blobs disappeared from repository storage.

## Preserved references and evidence

- The selected website directions were retained as [Morning Gate](../../design/references/website-morning-gate.png) and [Utility](../../design/references/website-utility.png), beside the original approved game reference.
- Four authored website research notes remain in [research](research/RESEARCH.md), with official source links. Third-party screenshot collections are not part of the current public tree.
- Historical fee and provisional-research JSON evidence needed by the retained V2 research was copied byte-for-byte into `docs/economy-v2/` before archiving its former directory.
- Native contract/wallet review and its linked evidence, current world-event research, actual release-wave evidence, current visual/NFT records and all source/artifact proofs were retained.
- `experiments/economy-v2/` remains because `scripts/v2/check-kernel.ts` reads its permanent clinical admission fixture. No source supporting historical exact-NFT links was removed.

## Verification

- Runtime/build path search found no reads of the archived design/docs packages; public `/docs/...` URLs are application routes, not those repository files.
- The retained Markdown/HTML link check covered **66 documents** with **zero missing relative file links** at the cleanup checkpoint. Updated links point to current guides or preserved evidence, never into TEMP. The README author owns its final narrative/media links and the release check can repeat this narrow link check after those assets are complete.
- The actual preserved-fixture kernel check passed **20 focused cases / 82 fixtures**, with no failure. This resolves the specific risk that cleanup could remove a required permanent input.
- Canonical artwork remains byte-identical: `rooster.ts` SHA256 `77394d48de4e07c9bbeb2734c7fd5bb2e6c16789032eec957cfd22eaea793f54`; `rooster-data.ts` SHA256 `bf21c7a5f5d58bb4718b6258a60710a01cc08b1573b6dce3899292d53fe38907`.

The website build, final source-publication scan and hosted verification remain separate PM release checks.
