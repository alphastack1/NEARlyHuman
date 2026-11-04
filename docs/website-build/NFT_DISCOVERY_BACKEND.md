# Public NFT discovery — backend

4 November 2026. This public read model supplies the collection gallery and longevity board. It does not connect a wallet, sign a message, call Jev, advance a day, alter a purse or read a private signer.

## Endpoint and DTO

`GET /api/explore/lives?world=near-testnet&sort=newest&status=all&limit=12`

| Parameter | Values |
| --- | --- |
| `world` | `near-testnet` (default), `robinhood-testnet`; only the currently configured, verified collection is read |
| `sort` | `newest` (descending token number within the world), `longest` (descending completed level) |
| `status` | `all`, `alive`, `remembered` |
| `q` | Name/number terms, optional `#`, up to40 characters; case-insensitive |
| `limit` | 1–24, default12 |
| `cursor` | Opaque snapshot-bound next-page token returned by the endpoint |

Shared types are in `src/chain/discovery-types.ts`. A response contains the exact world identity, immutable snapshot ID/height/hash/time, explicit complete/stale flags, filtered count, collection count, summaries and an optional next cursor. Summaries contain ID, owner, name, day, level, living/pending flags, NHC purse units and planted/ready bed counts. No future AI choices or session fields are included.

Ranks are calculated across the full saved world before search/status filtering. Equal levels share competition ranks; token ID only stabilizes card order within a tie. Search therefore does not turn every matching rooster into rank1. Remembered lives retain their achieved level. Sorting and ranking do not use purse balances or wallet wealth.

`newest` means larger token numbers within one collection; it does not claim a cross-chain timestamp comparison. Portrait URLs and individual life/history views use the existing APIs. The directory's numeric facts are as of its supplied chain snapshot; individual details refresh when opened.

## Authority and bounded work

- Robinhood verifies the served runtime's chain/code/policy identity, pins the block, enumerates `nextTokenId`, and checks each saved state's day/level/alive/seed against `lifeInfo`. Owner, purse and pending status share that block. A final block-hash check rejects an inconsistent refresh.
- This deployed ERC-721 collection does not burn remembered lives, so minted IDs remain contiguous. A missing ID fails the complete snapshot; it is never silently omitted.
- Native NEAR verifies finalized code/config identity, reads supply and paginated `nft_tokens`, then reads each life at the same finalized hash. The enumeration owner must match the saved life owner. Duplicate/missing entries fail the refresh.
- Four lives are read concurrently. A failed worker stops assigning more lives. A refresh is limited to128 lives; exceeding this bound returns `collection_capacity` instead of publishing a truncated leaderboard. Scaling beyond this release bound requires an incremental indexer or an explicitly reviewed resource increase.
- The browser never enumerates the collection. Existing exact-life/replay/owner-list routes are unchanged.

## Durable snapshots and failure behavior

Snapshots live only under the new `public/discovery/v1/<world>/<public-runtime-fingerprint>/` namespace. Nothing enumerates or deletes authentication, campaign, quote, job, gas or financial records.

The current snapshot is fresh for three minutes. A conditional cloud lease coalesces refreshes across function instances. Only a complete successful refresh becomes the head; an earlier refresh cannot overwrite a newer observed height. In-process work is coalesced as well.

Each snapshot is immutable and hashed. A cursor binds its snapshot, position and exact filter/sort query, so another instance or a later refresh cannot reorder an in-progress page. Cursors expire after one hour. Up to24 recent snapshots are retained; pruning uses only their exact public-cache keys, without store enumeration. The bounded warm cache is an optimization, never the sole cursor store.

If RPC refresh fails, the last complete snapshot may remain available for up to24 hours, with `snapshot.stale=true` and its original observed time/height. UI must retain that freshness context. Capacity errors explicitly fail rather than masquerading as a current complete top. Cold contention or unavailable providers return a concise retriable503; invalid queries return400 and expired/mismatched cursors409.

These are informational views. They must never be used as authority for spending, trading, transfer rights or a current purse balance; those paths retain their own live contract checks.

## Verification

- TypeScript check passed.
- Twelve controlled cases passed: shared ranks; deterministic pagination; query/status filtering; fresh-process durable cursor resolution; pagination across refresh; stale-complete fallback; capacity rejection; malformed/expired queries/cursors; empty collection; and duplicate/partial snapshot rejection.
- A separate Node child with an empty module cache resolved a persisted cursor without invoking the refresh reader.
- All controlled stores enforce the public-cache prefix, reject store enumeration and write only within ignored TEMP.
- Real read-only chain verification found **1 native NEAR life** and **8 Robinhood lives**, with correct pinned heights and shared rank4 for five Robinhood lives at level1. Cold verified reads took about2 seconds per world on the workstation; this is not a hosted latency guarantee.
- The real probe used only public deployment fingerprints/RPC methods, with no private environment loader, signer, paid model, ledger mutation or transaction.
- An actual `handleApi` route check passed the ordinary and Netlify-normalized paths, snapshot cursor continuation, public response headers, and rejection of unsupported method/world values.

[Controlled proof](verification/discovery-backend/controlled-proof.json) · [read-only chain proof](verification/discovery-backend/live-proof.json) · [HTTP integration proof](verification/discovery-backend/http-proof.json). Scratch probes/fixtures remain in ignored TEMP and are not runtime dependencies. Hosted publication/readback is owned by the main release flow.
