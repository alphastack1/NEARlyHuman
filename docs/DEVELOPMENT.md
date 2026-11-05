# Development

Use **Node 24 or newer** and the committed npm lockfile.

## Website preview

```sh
npm ci
npm run build
npm run preview
```

Open the URL printed by Vite, normally `http://127.0.0.1:4173`. The static build includes the website, handbook, page metadata, sitemap and downloadable contract sources.

The static preview does not run the API. Public NFT data and the playable app use API services; use the [hosted site](https://nearlyhuman.netlify.app) to inspect real saved lives without configuring a local service.

## Full local service

Copy [`.env.example`](../.env.example) to an ignored `.env`, configure the services you intend to run, then start:

```sh
npm run dev
```

The development server serves the frontend and API at `http://127.0.0.1:5173` by default. Preparing new days requires your own NEAR AI access, testnet relay funding and configured service allocation. Public chain reads do not provide those credentials.

| Setting | Purpose |
| --- | --- |
| `NEARLYHUMAN_EVM_RUNTIME_JSON` | Exact public EVM runtime identity from the [deployment records](../contracts/deployments/). |
| `NEARLYHUMAN_EVM_RPC_URL` | EVM testnet RPC transport. |
| `NEARLYHUMAN_NEAR_ENABLED` | Enable the native NEAR world. |
| `NEARLYHUMAN_NEAR_RUNTIME_JSON` | Exact public native NEAR runtime identity. |
| `NEARLYHUMAN_NEAR_RELAY_KEY` / `NEARLYHUMAN_RELAY_KEY` | Server-only relay credentials for the selected chains. |
| `NEAR_AI_API_KEY` | Server-only model access. |
| `NEARLYHUMAN_SESSION_SECRET` | Wallet-session signing secret. |
| `NEARLYHUMAN_ORIGINS` | Allowed website and local origins. |
| `NEARLYHUMAN_DATA_DIR` | Private local service storage. |

Use the complete runtime identity for one deployment, including its hashes and collection. Combining values from different deployments does not describe a valid world. The environment example documents the remaining optional settings.

Keep credentials out of source control and browser variables. Only public configuration belongs in variables prefixed with `VITE_`.

## Checks and build output

`npm run check` checks TypeScript. `npm run build` checks types and creates the production files in `dist/`. Use the focused test commands in [`package.json`](../package.json) for the area you change.

The build creates the current contracts-only archive at `/source/nearlyhuman-contracts.zip`. Published historical source URLs remain available for existing references. Original contract compiler inputs and deployed protocol identifiers are preserved in the immutable [release sources](../contracts/releases/).

The [Netlify configuration](../netlify.toml) builds with `npm run build`, publishes `dist/`, and routes the API to the checked-in function entry point. Hosted functions use Node 24. Configure production service values through the hosting environment rather than placing them in the generated frontend.
