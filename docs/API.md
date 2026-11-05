# API reference

The hosted API serves public saved lives and owner-authorized day preparation. JSON amounts that exceed JavaScript's safe integer range are encoded as strings. Public reads need no wallet. Owner operations require a verified session and explicit onchain confirmation where applicable.

## Select an exact world

Use `GET /api/worlds` to discover served worlds. EVM requests use `/api/evm/` with `chainId` and `collection`; native NEAR requests use `/api/near/` with `networkId=near-testnet` and `collection`. Include the exact scope when sharing or reading an NFT. A foreign or malformed identity is rejected rather than silently mapped to another collection.

```text
GET /api/evm/rooster/1?chainId=46630&collection=0x3e3c6d8d6ddcfaad61c21b4278e977c90ddde3f7
GET /api/near/rooster/1?networkId=near-testnet&collection=game.nearlyhuman-dev-20261102-26c8bd.testnet
```

## Read endpoints

The following paths are relative to either world prefix.

| GET path | Result |
| --- | --- |
| `config` | Public runtime configuration and world identity. |
| `guest` | Configured public example life. |
| `lives?owner=…&cursor=…` | Paged lives owned by an account. |
| `rooster/:id` | One saved life. |
| `days/:id?before=…` | Saved-day history. |
| `day/:id/:day` | One recorded day. |
| `replay/:id?day=…` | Saved playback packet. |
| `nft/:id` | NFT metadata; exact world scope is required. |
| `nft/:id/image.svg` | Saved-state portrait; exact world scope is required. |
| `request/:requestId` | Public status of an accepted request. |

`GET /api/explore/lives` supplies the public directory, filtering and ranking. Query parsing and response types are defined in [`server/discovery/`](../server/discovery/) and [`src/chain/`](../src/chain/).

## Owner operations

Each world provides `POST auth/challenge` and `POST auth/verify` for its wallet signature format, and `GET session` to inspect the verified session. Signing in is separate from a paid transaction.

| Operation | Purpose |
| --- | --- |
| `POST quote` | Quote a next day for one owned NFT and supply selection. |
| `POST accept` | Reconcile an owner-confirmed transaction with its original request. |
| `GET job/:requestId` | Read the owner's durable preparation status. |
| `POST wake` | Resume reconciliation of that accepted request. |

Mutation requests use JSON and must satisfy the configured origin, session, identity and size checks. A quote does not itself accept a day, and a retry does not authorize a new payment. The app checks uncertain transactions against their original request before offering another attempt.

Errors use `{ "error": { "code": "…", "message": "…" } }` with an appropriate HTTP status. Treat the message as user-facing context and the code/status as the programmatic signal. A failed read is not proof that a payment failed.

Canonical routes are implemented through [`server/http.ts`](../server/http.ts), [`server/evm/`](../server/evm/) and [`server/near/`](../server/near/). Published metadata aliases remain available for deployed NFTs; new integrations should use the canonical world prefixes above.
