# Publication review

4 November 2026. This review prepares the authorized contracts-only download and the separate decision about public repository visibility. It does not change GitHub visibility, push a branch, deploy a site or access a wallet/service ledger.

## Authorization and scope

The owner explicitly approved publishing **contracts-only source**. The GitHub repository was confirmed private during this sprint. Making the complete repository public is a separate action; the owner asked to check the hackathon rules, not to change visibility immediately.

The [official hackathon submission page](https://nearhackathon.com/) and [organizer checklist](https://github.com/nearai/near-hackathon-prompt-examples/blob/main/SUBMITTING.md) require a public project repository and a check that secrets are absent from repository history. A contracts-only download supports transparency but does not substitute for the public project repository required for submission.

## Contracts-only export

`scripts/site/export-contracts.ts` publishes an explicit file allowlist, not a directory traversal or broad repository archive. It writes to the build output's `source/` directory:

- `contracts.zip`: nine unchanged source files plus four generated build/reference documents.
- `manifest.json`: byte sizes, SHA256 values, compiler configuration and selected public testnet identifiers.
- `README.txt`: scope, build instructions and verification boundaries.
- `files/<original-path>.txt`: readable copies preserving each original file's bytes.

The original files are the five Solidity contracts in `contracts/v2`, native `contracts/near/src/lib.rs` and `kernel.rs`, and native `Cargo.toml`/`Cargo.lock`. The extra ZIP entries are `manifest.json`, `README.md`, `BUILD_EVM.cjs` and the pinned dependency `package.json`.

The allowlist excludes application code, repository documentation, Git history, operator/deployment scripts, tests, environment files, credentials, recovery material, private signed journals, service records and financial ledgers. Deployment metadata is reduced to chain/account/address/code hashes and public explorer links. Stale operational balances, admission flags and signer/owner configuration are not exported.

The build step is portable Node/TypeScript and a small deterministic ZIP/STORE writer; it adds no package dependency and never calls a network. Integrate after the existing Vite/public-page build:

```text
tsx scripts/site/export-contracts.ts
```

Final output does not depend on any file in `TEMP/`.

## Export verification

The following checks passed against the prepared archive:

- Python's independent `zipfile` reader parsed all **13 entries** and validated their CRC values.
- All **nine sources** and individual readable copies exactly match the repository bytes and manifest hashes.
- Native source hashes match all **four** source fingerprints in the recorded Wasm build. Those hashes also match Git's stored bytes, including preserved CRLF in the native Rust files; checkout normalization does not introduce a known Linux-build mismatch.
- The generated EVM build helper was run from the extracted archive using the exact pinned Solidity/OpenZeppelin versions. Creation and runtime bytecode match all **five recorded artifacts**: controller, NHC token, action module, verifier and types library.
- A focused TypeScript check passed for the exporter.

Prepared archive size: **190,741 bytes**. SHA256: `96eb30080976baf50f386e131e338ad69d8575c410210fa55fe2cfeb85e83053`.

These are offline source/artifact checks, not a fresh onchain verification or security audit. The native Wasm was not rebuilt for a website export; its existing recorded build/source fingerprints are checked. The generated README states this boundary.

## Repository/history review

The read-only scan completed with **no actual private credential found by the defined machine-text checks**. This is a bounded review, not a guarantee of absence or authorization to change visibility.

- Official Gitleaks **8.30.1**, with its download checksum verified, scanned all **50 locally reachable commits** and a publication-candidate snapshot including modified and non-ignored untracked files.
- The final snapshot contained **1,580 files**, including **849 text files / 16.8 MB**. Supplemental checks scanned **1,098 unique historical text blobs / 23.0 MB** for NEAR private-key, JWT, private PEM and checksum-valid English BIP39 phrase shapes; no matches were found.
- Gitleaks reported **263 findings** in history and the candidate. All were triaged as 257 deterministic gameplay identifiers, five public contract addresses and one recovery/cache code expression. No unresolved finding remains.
- **141 local unreachable Git entries** were also inspected. Their text and commit metadata produced two further code-expression false positives and no private credential.
- Authenticated GitHub branch/tag metadata and `git ls-remote --refs` showed **one remote branch, main, and no tags**. Its commit `72b9ab82206d57e1c98fa92afdd63aeb2af494a7` is locally present and included in the scanned history. All advertised remote branch/tag objects are covered. No fetch, ref mutation or remote change was performed.

The permanent [machine summary](repository-secret-review.json), [detailed method/limits](repository-secret-review.md) and [remote-scope proof](repository-remote-scope.json) contain no secret values. Tooling and fully redacted scanner reports remain ignored in TEMP.

## Final frozen-candidate checkpoint

At **12:27 Bangkok / 05:27 UTC**, the final scan covered **1,585 files**, including **854 text files / 16.9 MB**. Gitleaks again found only the same 263 classified false positives, with zero unresolved findings. Supplemental checks again found no valid mnemonic/private-key/JWT/PEM shape. The expected README change during the scan separately passed both checks at **05:28 UTC**. Runtime source/assets did not change during this check.

The runtime fingerprint is `597aecec3c5da0a476ca6708e3a718ec81ed938618f28d05174df283a53ca85e` across 273 files, excluding documentation/design. [The final checkpoint](final-publication-scan.md) and [machine proof](final-publication-scan.json) record the exact HEAD, snapshot definition and reviewed delta. Subsequent plain build-review documentation is identified separately rather than falsely included in the earlier all-file fingerprint.

**Limits:** the **731 candidate binary assets** were not OCRed or decompiled; ordinary personal data and author/contact metadata are not secret-scanner coverage. Unknown unadvertised GitHub objects/artifacts and private credential stores outside the checkout were not read. Further source/asset changes need a delta check. Repository-wide publication remains the owner's separate decision; no visibility change was performed by this review.

## Owner decision and final preparation

After reviewing the requirement, the owner explicitly approved making the full repository public after cleanup and a visual README. The cleanup record, current root README and permanent docs/media assets complete those prerequisites. This approval is separate from the earlier contracts-only export approval.

The later handbook illustration integration and README/media changes contain public asset references and authored presentation text. The generated image was visually inspected; it contains no characters, readable lettering or supplied credentials. These changes do not alter runtime custody, service keys or history. The frozen-candidate scan and separate README delta remain recorded in final-publication-scan.md. Publication follows the final build/flow checks; this paragraph records authorization, not a visibility mutation by the audit agent.
