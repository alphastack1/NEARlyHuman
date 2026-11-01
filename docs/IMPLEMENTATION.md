# Implementation ownership and sprint record

The current user instruction authorizes the full build and a single final production release. The main thread acts as PM: priorities, interface contracts, integration, actual pixel review and independent critique. Three workers run concurrently, the session's available limit; ownership rotates when work reaches review.

- Domain: `src/domain/` — canonical rules, legal choices, receipts, deterministic preparation and compact state/history codec.
- World/art: `src/game/`, `src/art/`, `public/assets/game/` — actual source rooster, dynamic home/fixtures, camera, contacts and recorded playback.
- Chain: `contracts/`, `src/chain/`, `scripts/chain/` — NFT/request lifecycle, signed admission, state/history and wallet transport.
- PM integration: scaffold, `src/app/`, `server/`, `netlify/functions/`, infrastructure setup and final release.

The first target is a real vertical slice: mint → included real-Jev preparation → onchain save → recorded house playback → next supply selection. Expand the complete action catalog and all main flows around that same architecture. Optional fallback/reduced-motion variants are deferred; important text and real phone/keyboard usability remain required.

Rules live outside Phaser. The chain owns the completed save, request status and authority. Server preparation owns provisional state and actual model exchanges. The client owns local UI drafts, input feedback and recorded presentation. Playback never applies game effects again.

Use short experiments: question, evidence, change, result, decision. Run a check for a concrete uncertainty or meaningful change. No large speculative test framework. Production remains untouched until the final reviewed release.

Temporary screenshots, experiments, diagnostics and tooling live in the ignored TEMP folder. Shipping code and assets have no dependency on it. Secrets remain encrypted outside the repository and server-only in hosting configuration.
