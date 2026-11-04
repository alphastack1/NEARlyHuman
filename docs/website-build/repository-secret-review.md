# Repository publication — secret review

4 November 2026. Read-only review for the owner considering a public hackathon repository. No GitHub visibility, refs, source code, keys, financial state or service ledgers were changed.

## Result

No actual private credential was found by the defined machine-text scans. This is a bounded review, not a guarantee that no sensitive material exists. Repository publication still requires the owner's decision; this report does not authorize that change.

## Methods and evidence

- Downloaded Gitleaks **8.30.1** from its official GitHub release and verified the archive against the release SHA256 checksum. Ran default rules with full redaction, recursive decoding depth 5 and no allowlist suppressions.
- Scanned **all 50 locally reachable commits**, not only the current branch tip. The Git object index contains 2,341 reachable entries. Supplemental scanning covered 1,098 unique historical text blobs, 23,032,975 bytes.
- Took a publication-candidate snapshot from `git ls-files --cached --others --exclude-standard`, including current modified and non-ignored untracked website/art files. The final snapshot contained 1,580 files: 849 machine-text files, 16,805,243 bytes, and 731 binary assets. This supersedes the initial 821-text-file snapshot. Ignored TEMP, dependencies, build output and private environment files were not copied.
- Checked local unreachable Git objects as well: 141 entries comprising 85 blobs, 54 trees and 2 commits. Extracted/scanned the text among them plus reachable commit metadata: 133 additional text objects. Four binary objects were skipped.
- Supplemental patterns checked for NEAR base58 private-key shape, JWT shape, private PEM headers and checksum-valid English BIP39 mnemonic sequences. No matches were found.
- A subsequent authenticated GitHub branch/tag and advertised-ref check found exactly one branch (`main`) and no tags. Main's commit is locally present and included in the scanned history. All advertised branch/tag objects were covered; `repository-remote-scope.json` records the check without fetching or mutating refs.
- Reviewed history filenames for actual `.env`, private-key/PEM/DPAPI files, recovery phrases and raw auth/financial journal paths. None was found. `.env.example` contains empty credential slots, public configuration and explanatory comments.

## Scanner findings and triage

Gitleaks reported 263 generic-key findings in both the reachable history and the candidate snapshot. All were reviewed without displaying secret values:

| Category | Count | Reason |
| --- | ---: | --- |
| Deterministic game-action identifiers |257| `key`, `actionKey` and `beforeActionKey` fields encode operation/target/variant names, such as the game's H/G/K action families; they are not authentication credentials. |
| Public deployed addresses |5| `token` or `tokenController` values have the exact public EVM address shape. |
| Recovery/cache code expression |1| A transaction-journal comparison expression in application code, not a credential value. |

The extra-object scan reported two more generic-key findings, both earlier recovery/cache comparison expressions. No unresolved scanner finding remains. For minified JSON where directory scan column offsets differ, current files were compared with their already-scanned HEAD content after line-ending normalization; no secret values were printed or included in this report.

No known public Anvil/private-test key needed to be exempted: the findings were identifiers and public addresses, rather than secret-key values.

## Limits before changing visibility

- The 731 binary candidate assets were **not OCRed or decompiled**. Most are game/mockup screenshots and media, but this machine-text review cannot certify text visible inside every image. Review any wallet/recovery screenshots separately if their contents are uncertain.
- The scan covers locally available Git history, local unreachable objects and all currently advertised GitHub branch/tag objects. Unknown unadvertised objects, GitHub artifacts and external services are not included.
- Private credential stores outside the checkout were not read. Ordinary personal information and Git author/contact metadata are not covered by the secret scanner.
- This candidate is still being edited. Re-run the redacted scan after the final files/history are frozen before making the repository public.

The sanitized machine summary is `history-review.json` in the same folder. Scanner reports and tooling remain under ignored TEMP; no permanent build depends on them.
