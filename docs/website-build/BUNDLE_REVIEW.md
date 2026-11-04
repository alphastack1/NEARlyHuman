# Public bundle boundary review

4 November 2026. Independent inspection of the first actual production build found that the HTML preloaded `wallet-BWGh2gEH.js` (291,724 bytes). The public entry imported Vite's `__vitePreload` helper from that chunk. Existing manual wallet grouping had absorbed the shared helper, so a source-level lazy game boundary alone did not keep wallet crypto off the public path.

The installed Vite implementation identifies that virtual module as `\0vite/preload-helper.js`. `vite.config.ts` now assigns it an explicit, small `preload-helper` chunk before the existing Phaser/viem grouping. It changes no application or dependency behavior; it prevents the shared loader helper from requiring the wallet bundle.

The first AST-based artifact inspection verified all 19 static metadata heads, actual sitemap/robots output, an exact-source 1200×630 social card, unchanged API-first hosting configuration and original rooster fingerprints. Its public JS branch was 626,999 raw bytes including the accidentally eager wallet. The focused fix was held for the next planned build and checked against the final import graph below; the first candidate was not approved as fully lazy.

## Final candidate

The frozen build uses `index-D4ctt7hE.js` and `Site-Cucz9YmZ.js`. Its HTML preloads only the Rolldown runtime and the 1,519-byte preload helper. The AST import closure for the selected public-site branch contains only the entry, Site, shared Icons/canonical art, helper and runtime: 338,654 raw JavaScript bytes. No wallet, Phaser, V2/legacy game or native-connector chunk is eager on that public path. The entry retains dynamic imports of both Site and GameEntry; GameEntry still dynamically selects the V2 or legacy app.

All 19 route heads match current article metadata, sitemap routes match the actual catalog, and all referenced initial assets exist. The social card is the exact shipped source PNG at 1200×630. The final contracts download contains exactly nine allowed source files and four archive support files; independent ZIP/CRC, manifest, raw source and public text-copy comparisons pass. Netlify's API-first configuration and canonical rooster files remain unchanged.

The permanent [BUILD_REVIEW.json](BUILD_REVIEW.json) records these final artifact checks, sizes and hashes. This closes the first candidate's eager-wallet finding without another broad test run or any browser, service or chain operation.

No browser, signing, inference, ledger or deployment operation was used for this inspection. The temporary graph tooling and first-candidate output remain ignored in TEMP.
