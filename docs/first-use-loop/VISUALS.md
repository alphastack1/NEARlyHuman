# First-use visual critique — 3 November 2026

Question: can a new player identify the game network, connect without buying unexpectedly, and understand the optional rooster strengths without a dense setup form?

## Observed issues and revisions

The actual live hatch form used a full-width network panel with one small left-aligned line. It looked like passive metadata. The old Personality disclosure named Body, Wits and Spirit without explaining their effects; every plus was initially disabled, with no cue that a point must first be removed. Selecting a wallet also served as an implicit continuation toward minting. The wallet choice buttons all looked like primary purchase actions.

The revised network field is an obvious button: a small linked-node mark, readable Robinhood name, separate Testnet tag and chevron. Its picker contains only actually served, wallet-supported deployments. The current controller serves Robinhood Testnet; a catalog entry alone never becomes a working NEAR or mainnet choice. Shared header Back returns to the original context; no redundant second Back button is needed.

The optional disclosure is now Strengths, with a short “Hardy, handy or upbeat?” cue and a Balanced/Custom summary. Expanded rows give each actual mechanical effect a short description. A brief minus-then-plus cue explains reallocation, and Reset to balanced appears only after changing the defaults. The default 2/2/1 allocation remains ready to use. These labels do not pretend that the three survival/competence stats are Jev's entire seeded personality.

The first main action is Connect wallet, accompanied by Connecting is free. After connection, the same hatch context shows the actual account/balance and the explicit Hatch action. Wallet choices are restrained navy rows with an icon and chevron, rather than several competing gold buttons. A redundant standalone wallet icon was removed after inspecting the rendered screen. The rest of the UI retains the game's navy, cream, moss and gold materials and native pixel-art direction; no rooster source or artwork changed.

## Rendered evidence

- Nine actual live before captures at 320, 390 and 430 pixels wide.
- Sixteen revised local screens across 320×568, 390×844, 430×844 and a short 320×360 viewport. No horizontal page overflow, browser errors or API writes.
- Actual controls: reallocate Body → Wits, reset to 2/2/1, open the network picker, choose its one real deployment and return with the name intact. Choosing a deliberately keyless wallet rejects safely and preserves the hatch form.
- Five final captures after the last copy/icon refinement, including the actual empty-state hatch on narrow and normal phones, strengths, network picker and wallet picker. No errors, overflow or writes.
- A separate synthetic 40% text enlargement case at 320×568 keeps important content scrollable and the Connect action fully reachable. This is not a claim about every physical phone's browser or operating-system text inflation.

The local checks use the real React interface and public configuration. Two wallet labels in controlled captures are explicitly keyless providers; they cannot sign or pay. These screenshots do not establish a real extension confirmation, a new mint, a paid inference or native NEAR gameplay. A hosted funded journey, if run by the PM, is separate evidence.

| Before / revised surface | Verified image |
| --- | --- |
| Revised narrow hatch | [Hatch, 320px](visual/after-hatch-320.png) |
| Short strengths explanations | [Strengths](visual/after-strengths-390.png) |
| Actual supported-network selector | [Networks](visual/after-networks-390.png) |
| Neutral wallet choices | [Wallet](visual/after-wallet-390.png) |

Compact counts and responsive metrics are in [evidence.json](visual/evidence.json). Full disposable scripts and captures remain under ignored `TEMP/first-use-loop/visual/`.
