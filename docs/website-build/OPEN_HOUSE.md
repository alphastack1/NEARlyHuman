# Website arrival and saved-game showcase

4 November 2026. The homepage introduces NEARlyHuman as an AI-led NFT life game, with a contained interactive window showing actual saved gameplay. The canonical rooster artwork, house geometry and receipt animation are reused unchanged.

## Reference and decision

Public browser inspection of [Coin Island](https://coinisland.io/) showed why its first view attracts attention: the game world fills the browser before the visitor reads a promotional page. Its root backdrop is a muted looping game video, while its public `/play/` link leads to `/oyna`, where the actual world sits behind a compact guest menu. The background on the root page did not respond to dragging. We opened public Guest Play only as far as its character-preview form; no avatar, account or financial action was submitted.

[Infinite Craft](https://neal.fun/infinite-craft/) provided a second useful comparison: the starter elements are available immediately rather than after a large promotional hero. No server inference was triggered during this inspection.

The distinction between Coin Island's website and its separate play screen matters. A persistent headline and clear next step introduce the product while its footage supplies movement. NEARlyHuman uses that hierarchy: a persistent introduction, a clearly marked **Saved gameplay · MAPLE** window, and one primary **Open App** action. The preview's camera controls remain inside that window. The visitor does not arrive inside an apparently owned game.

On desktop, the introduction and app action sit beside the preview. On phones, the introduction leads into a bounded preview and the app action. The short-phone layout reduces the preview height while keeping the action visible. The visual Hatch → Bring supplies → See what happens strip links to the existing game explanation; Explore leads to real NFT lives. Opening the app preserves returning-player and pending-transaction recovery.

## Interaction and loading

- First paint: a lossless actual-renderer poster and immediately usable website navigation/app action.
- After paint: the read-only renderer and immutable saved replay warm after650ms. A short true recorded segment plays at2× and pauses at a completed receipt, roughly17–20seconds for this sequence. Watching it never gates the app action. Explicit playback returns to normal speed.
- First drag during loading: preserve and apply the gesture when the real camera is ready. The poster remains until then.
- Look around: drag the camera; House follows MAPLE; Garden and Workshop focus the real scene and show saved facts. An inspection pauses a playing film.
- Saved day: receipt playback uses the game's continuous travel and impact animation. Future AI choices remain hidden. Pause/resume and restart stay inside the frame; looking around pauses playback.
- App: `/app?v2=1&entry=app` keeps the normal player entry and recovery flow, without another cartridge title gate. The separately supported explicit `entry=hatch` intent opens the hatch form.

Phaser and the static replay load after the initial website paint. Wallet/NEAR connection modules are not needed by the showcase. Guide and other website pages do not mount the preview or start its renderer. Public viewing does not call AI, sign, switch a wallet network or write an API record.

## Exact public sample

The sample is the already settled MAPLE #8, day 1, on Robinhood Testnet, chain `46630`, collection `0x30cb5213fa94020a95893ddb6b07470dbf7a9efc`. It belongs to that archived collection even after a replacement deployment.

- Original public endpoint: [MAPLE day 1 replay](https://nearlyhuman.netlify.app/api/v2/replay/8?chainId=46630&collection=0x30cb5213fa94020a95893ddb6b07470dbf7a9efc&day=1).
- Asset: `public/assets/preview/maple-open-house-day1-3b83641cc62c.json`, 189,982 bytes.
- Commitment: `0x3b83641cc62cfd4f1ac8f4f9c013262885beaf2e66c9a975f1e29942b4287dae`.
- Verification: `keccak256(UTF8(JSON.stringify(packet)))` matched the returned commitment before publication.
- Asset SHA-256: `fce64e1a8df0d13a2e39bae56183bb1862dde56e1e06fc790a8bd36e8fa42cff`.

The idle scene displays saved final home facts in a daylight presentation beside the living-room chair. Beginning playback explicitly rewinds to the first receipt's prior state. Finishing explicitly seeks to the real final state. Neither operation changes the NFT.

## Poster provenance

Both posters were captured from `createV2WorldRenderer` with the same sample/controller and viewport insets as the homepage. All DOM siblings were hidden during capture, so no controls or duplicate hints are baked into the images. The WebP decode was compared byte-for-byte with the captured RGBA pixels.

| Asset | Dimensions | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `public/site/open-house-phone.webp` | 390×844 | 6,398 | `64aac17e1ad461bc2d5cee39c29a8aac32093b85edd63f8c176e576ada66f8bb` |
| `public/site/open-house-desktop.webp` | 1440×900 | 10,318 | `32c466fcfee0df34c3e7a18a19d2f0be961d96e56ec1c3f670873af7a2e3bb1a` |

## Verification record

Question: can the first view expose the actual game without slowing the ordinary website or requiring a wallet?

Evidence: actual shared-Codex-profile renders at1440×900,390×844 and320×568 established the website hierarchy and exposed phone defects for correction. Independent preview checks covered700×560,366×330 and296×260 frames, actual garden/workshop focus, delayed-first-drag preservation, automatic rest and resume. The pause boundary held byte-identical pixels for2.3seconds, then resumed from3% to27%. The underlying full60-receipt film also completed in107,944ms. No browser errors, wallet requests or API writes occurred. The original rooster source files were not edited.

Change after review: separate the website from the owned app; keep the introduction visible during playback; contain input and controls in the preview; preserve early gestures; correct mobile headline wrapping, inherited background tiling and short-phone app-action placement. Menu and camera visibility receive integrated review before publication.

Decision: retain the real read-only showcase inside an unmistakable website. Permanent sources are `HomePreview.tsx`, `home-preview.css`, the shared saved-world adapter/data and `Site.tsx`/`arrival.css`. Exploratory scripts and captures stay in ignored `TEMP/landing-revamp/`; no permanent source or asset depends on them.
