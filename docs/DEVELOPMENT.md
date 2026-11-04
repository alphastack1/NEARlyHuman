# Development and publication

Use **Node 24 or newer** and the committed npm lockfile. Private keys, recovery words, API credentials and live operating ledgers are not included in the repository.

## Preview the website

```sh
npm ci
npm run build
npm run preview
```

Open the local URL printed by Vite, normally `http://127.0.0.1:4173`. Home, The game, Project and the 15 handbook articles work as a static build. The build also emits per-page metadata, `sitemap.xml`, `robots.txt` and `/source/contracts.zip`.

The static preview is not an API server. To inspect the already-running game without local operator setup, open the [hosted app](https://nearlyhuman.netlify.app/app?v2=1) or a public exact-NFT link from the README.

## Full local service

Copy [`.env.example`](../.env.example) to an ignored `.env` and configure the services you intend to operate. Then:

```sh
npm run dev
```

The application server listens on `http://127.0.0.1:5173` by default. It serves the frontend and API and starts its local reconciliation loop. Configure an isolated local data directory and explicit funding before testing new accepted days. Do not point a second local worker at a live campaign or duplicate a service ledger.

| Setting | Purpose |
| --- | --- |
| `VITE_NEARLYHUMAN_V2=1` | Explicit current-game entry where a default is needed. |
| `NEARLYHUMAN_V2_RUNTIME_JSON` | The public `runtime` identity from the [Robinhood deployment record](../contracts/v2/deployments/robinhood-testnet.json). |
| `NEARLYHUMAN_V2_RPC_URL` | Verified Robinhood Testnet RPC transport. |
| `NEARLYHUMAN_NEAR_ENABLED=1` | Enable the native NEAR world. |
| `NEARLYHUMAN_NEAR_RUNTIME_JSON` | The public `runtime` identity from the [native deployment record](../contracts/near/deployments/testnet.json). |
| `NEARLYHUMAN_ORIGINS` | Exact allowed website/local origins. |
| `NEAR_AI_API_KEY` | Server-only NEAR AI access. |
| `NEARLYHUMAN_RELAY_KEY` / `NEARLYHUMAN_NEAR_RELAY_KEY` | Chain-specific limited relay signing keys. |
| `NEARLYHUMAN_SESSION_SECRET` | Server-side wallet session signing. |
| `NEARLYHUMAN_DATA_DIR` | Private local service storage. |

The legacy collection defaults in `.env.example` preserve earlier NFT support; they are not the current V2 world identity. Copy current public identity fields from the deployment records rather than mixing collections, code hashes or policy fingerprints. Each world and operating campaign must agree with its actual contract and available funding.

On the authorized Windows workstation, the development server can load encrypted local credentials from outside the checkout. A fresh clone has none. A frontend-only visual check should use the static preview rather than starting an unnecessary funded worker.

## Focused verification

`npm run check` checks application types, and `npm run build` creates the production artifact. Relevant checks are grouped in [`scripts/site/`](../scripts/site/), [`scripts/v2/`](../scripts/v2/) and [`scripts/near/`](../scripts/near/). The shared NFT renderer has focused tests in [`server/v2/portrait.test.ts`](../server/v2/portrait.test.ts).

Keep generated test tooling, local validators, captures and exploratory output in ignored `TEMP/`. The kernel check's preserved admission input in [`experiments/economy-v2/biology/`](../experiments/economy-v2/biology/) is a permanent fixture and must remain available when TEMP is empty.

## Hosted publication

The existing Netlify project builds with `npm run build` and publishes `dist`. Its API rewrite precedes the website fallback. The checked-in [Netlify configuration](../netlify.toml) and [function source](../netlify/functions/) are the release inputs; temporary function packages are not.

Hosted Functions use Node 24 and `NEARLYHUMAN_RUNTIME=netlify`. Private values belong in Functions scope and the intended deployment context, never in `VITE_` variables. Durable hosted admission, campaign, job and relay records must remain the original records through a frontend or artwork release.

A push to `main` triggers deployment and consumes credits. Publish a reviewed candidate once, then verify public routes, exact-NFT links, metadata and both testnet worlds. Mainnet deployment and hackathon submission are separate actions. The [publication review](website-build/PUBLICATION_REVIEW.md) and [hackathon checklist](website-build/HACKATHON_REQUIREMENTS.md) record those boundaries.
