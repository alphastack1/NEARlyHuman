# Published testnet release — 1 November 2026

The game is live at **[nearlyhuman.netlify.app](https://nearlyhuman.netlify.app)**. One production push published source commit `66fe2a5124d2169c7711d3b95d9064cd9a65ab83` in Netlify deployment `6ae6f68027c51a49a425c44a`, published at **08:21:58 UTC**. No interim production deployment was used during this sprint.

The release serves **Robinhood Chain Testnet 46630**, collection **[0x998551395f8a0c4ebd1f883b8c18a41d2cecabfb](https://explorer.testnet.chain.robinhood.com/address/0x998551395f8a0c4ebd1f883b8c18a41d2cecabfb)**. It uses the real NEAR AI Jev endpoint and server-only credentials. Mainnet is a separate funded deployment; [mainnet readiness](mainnet-readiness.md) records the verified feed and zero-balance observation.

## Actual hosted flow

An authorized loopback-only test wallet drove the production page's normal EIP-6963 connection and payment flow. Its private key remained outside the browser and production application. No API interception, fake inference or fixture state was used for this playthrough.

The public page connected the developer wallet, loaded BOK #1's verified day-two replay, selected Water/Wood/Hammer & Nails, signed a fresh quote and submitted day three. The hosted background worker prepared sixty slots with **38 real Jev sends**, then saved the result onchain. Recorded AI cost was **2,436 µUSD ($0.002436)**. The durable accepted-job record reached Ready in **48.517 seconds**.

- Request: `0x486fd36029a72d2cee7f29ec8ecbcda3bbb1631bbb711dd29ad986c7f3daedb0`.
- Save: **[0x8209635c53e7abbd78a72d26e85fe25b0d2c954731739daad0804ac2059d2e67](https://explorer.testnet.chain.robinhood.com/tx/0x8209635c53e7abbd78a72d26e85fe25b0d2c954731739daad0804ac2059d2e67)**.
- Replay commitment: `0xccbc9b9c179b4a690fd26e998fe297dff129eb0f5d3ffe375bac3d471e53c2f4`.
- Result: **alive, level three, three committed days, no pending request**.

The actual choices included drinking water, successfully building a chair, using that chair, resting and harvesting the previously planted rose. Playback, pause, recorded choice inspection, resume and skip all worked. The page reached **Trial complete**, with Watch day 3, View summary and Choose rooster available. The playthrough reported **zero browser errors**.

Public config, NFT metadata, its generated SVG image, canonical current state and an earlier committed replay all returned HTTP 200. The public replay reader verified the canonical commitment before returning the film. The earlier local failed attempt remains recorded and did not create another biological day.

An independent read-only review of the actual production bundle checked entry/help at 320×568 and entry/help/options at 390×844. It found no horizontal overflow, browser errors or failed requests, and made no wallet/payment/API POST requests. This is evidence for those browser cases, not every physical phone.

## Retained evidence and cleanup

Verified live captures are permanent:

- [Care on a phone](screenshots/live-care-phone.png).
- [Recorded replay on a phone](screenshots/live-replay-phone.png).
- [Three-day completion](screenshots/live-trial-phone.png).

Verified admission, jobs, replay packets, diagnostics and indexes were imported into production Blobs before the first public request. The live hosted worker then created and used its own durable records. The local app worker was stopped before that test, so its success cannot be attributed to a workstation background job. Temporary wallet tooling was stopped after signing; run-owned QA browser pages were closed. Shipping code/assets/builds do not depend on `TEMP/`.

Across the four application attempts in this sprint, the service recorded **100 Jev sends and $0.006245**: three successful days and one operational failure. This excludes the earlier small provider probe and is not a promise of fixed future pricing.

These post-publication notes and captures are committed locally without a second production push, preserving the one-release deployment budget.

The subsequent refinement sprint and its separately published PEEP day-two verification are recorded in [UX_AUDIT.md](UX_AUDIT.md), with the permanent screenshot gallery, UI dispositions and independent recovery evidence. Mainnet remains deferred by the owner.
