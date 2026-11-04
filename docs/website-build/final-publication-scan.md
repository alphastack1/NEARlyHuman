# Final candidate secret-scan checkpoint

4 November 2026, 12:27 Bangkok / 05:27 UTC. HEAD: `a4af0b667d9590c8102aff330a4f8cf1a44be00b`.

The frozen candidate snapshot contains **1,585 files**, including **854 machine-text files** (16,902,254 bytes) and 731 binary assets. It includes tracked changes and all non-ignored untracked website, documentation, source-export and NFT-renderer files. No actual credential was found by this final text scan.

Gitleaks 8.30.1, default rules, full redaction and decoding depth 5 reported the same 263 false positives: 257 game-action identifiers, 5 public contract addresses and 1 recovery/cache code expression. There are zero unresolved findings. Supplemental checks on the 854 text files found no valid English BIP39 phrases, NEAR private-key shapes, JWTs or private PEM headers.

Exact all-file fingerprint: `671a02aa5b2c775b6182326a677a24a581890aec54175905988d88b1d95450b8`.

Runtime source/asset fingerprint: `597aecec3c5da0a476ca6708e3a718ec81ed938618f28d05174df283a53ca85e` (273 files, excludes documentation/design paths).

The JSON companion records the fingerprint definition, scan timestamps, changed/added files during the scan and per-finding metadata. Earlier history review still covers the same 50 reachable commits plus local unreachable objects; no broad history scan was repeated.

These findings retain the prior limits: binaries were not OCRed/decompiled; unknown unadvertised GitHub objects and artifacts were not reviewed; ignored files and external private credential stores were excluded. All currently advertised branch/tag objects were checked separately and are included in local history coverage. This is a bounded publication review, not a guarantee or permission to change visibility. Any further source/asset changes require a delta review. Planned plain README/routing documentation added after this checkpoint will not be represented by its exact all-file fingerprint.

## Reviewed README delta

README.md changed while the snapshot scan ran. The updated file separately passed Gitleaks and the four supplemental checks at 2026-11-04T05:28:31.954Z, with zero findings. Its SHA256 is `201393aa70a6de359ac673fc502d8dfeaa8f3b1ed864b157ddc34b30ad2857d6`. Applying that reviewed delta gives candidate fingerprint `d021198a20f7f0a220210ee89d3c6de1844cc6faee535c1eba1072ad5b3c082f`. Remaining changed files after the delta: docs/website-build/BUILD_REVIEW.json, docs/website-build/BUNDLE_REVIEW.md. The runtime fingerprint is unchanged.
