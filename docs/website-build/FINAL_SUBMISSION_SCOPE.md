# Final feature scope before submission

4 November 2026. Planning/research only: no marketplace, token liquidity, new contract, deployment or submission was performed during this review.

Three independent perspectives challenged the proposal: hackathon judge/product strategy; marketplace settlement/security; and virtual-pet/social discovery design. Their common recommendation is to make the existing living-NFT behavior visible and provable before expanding into an exchange.

## Recommended final sprint

1. **Explore lives with an integrated leaderboard.** One attractive public destination, using actual dynamic NFT portraits, direct life links and wallet-free saved films.
2. **Strengthen the public life presentation.** Make its saved garden, belongings, history and purse easy to understand, using existing facts rather than a new dashboard or generated biography.
3. **Create a genuine native NEAR economic/ownership showcase.** Grow or craft, ship a product, earn NHC into the NFT, transfer the same life, and verify the new owner's control and old owner's loss of authority.
4. **Package the evidence for judges.** A concise actual-game video, reproducible README actions, public source, license and reviewed submission payload.

A narrow NFT trading post is a possible additional protocol sprint after this bundle. An NHC exchange is deferred from the recommended submission scope.

## Product and scope comparison

| Addition | Benefit | Scope/risk | Decision |
| --- | --- | --- | --- |
| Explore + Longest lives | Shows collection variety, activity and replayability immediately | Public read model, responsive cards, filtering, cache/pagination; no new economic rules | Build first |
| Public life details and a few factual milestones | Makes possessions and history visible as part of the NFT | Read existing saved state/history; avoid future-choice spoilers | Build a compact version |
| Transfer/gift flow and two-wallet proof | Demonstrates that ownership carries behavior, possessions and purse rights | Existing chain transfers plus exact-recipient confirmation, recovery and owner refresh | High priority; proof before a broad sale UI |
| Native NEAR productive showcase | Shows the track's central economic claim in the public deployment | Real play and real Jev; no synthetic reward/admin credit masquerading as earnings | High priority |
| Fixed-price NFT sale | Gives owners a natural optional exit/acquisition path | New settlement module, approvals/listing/cancel/buy/recovery, state/purse protection; native NEAR is asynchronous | Separate explicit scope decision |
| NHC/native exchange or AMM | Provides token price discovery and a hatch-funding route | Real reserves, prices, slippage, approvals, thin-liquidity manipulation and settlement | Defer |

## Explore and ranking

Suggested journey: **Website → Explore → exact public life → Visit home / watch a saved day.** Browsing needs no wallet, transaction or new AI call. It remains outside the hatch/prepare/watch path.

- Use the existing cream/teal/leaf/apricot materials and canonical dynamic portraits. No game canvases per card; lazy-load image variants.
- A card needs only portrait, name/number, completed days/level, living/remembered status and one main visit action. Display a Watch action only when a verified film exists.
- Give newcomers a discovery view alongside **Longest lives**. Keep NEAR/Robinhood world selection familiar; public filtering must not ask the wallet to switch chains.
- Rank by completed surviving days/level. Equal levels receive equal displayed ranks; token ID may stabilize presentation without breaking the tie. Remembered lives retain their achieved lifetime and visible status.
- Living level equals day in the present rules. This is a longevity/progression category, not an independent skill score or wall-clock age claim. Advancing many days has a time/gas advantage; no token prizes attach to this board.
- Do not rank by purse, wallet wealth, AI calls or raw cumulative NHC. Withdrawals and ownership changes affect purse; issuance pressure makes nominal rewards differ over time.
- Show actual deployed NFTs, without invented users, sales, popularity or activity totals. Controlled local fixtures never enter the public directory. Featured examples can be curated without pretending they are a measured popularity contest.

The current API lists lives by owner only. A global directory needs a bounded, cached authoritative read model. Robinhood exposes `nextTokenId` and life/state views; native NEAR exposes NFT supply/enumeration. Do not enumerate the whole collection from every browser visit. Use per-world observed-chain context, deterministic pagination, bounded update work and a last-good snapshot on provider failure. A partial provider response must not silently become an authoritative top ranking.

For an initial small release, a curated discovery row plus per-world indexed ranking is safer than claiming a cross-chain global arrival order without verified mint timestamps. Refresh individual life details on entry. Do not compare the value of separate worlds' currencies or imply a bridge.

## Make the NFT's behavior tangible

Build on the current exact-NFT profile and saved-day reader. A compact presentation can show the actual garden, belongings, settled history and NHC purse, with Visit home as its main action. Keep explorer/source actions secondary. Milestones such as first planting, harvest, craft or shipment must derive from settled traces/history; current stock alone cannot establish an achievement because goods may have been consumed or shipped.

The strongest demonstration is a developed life moving from wallet A to wallet B. Its seed, home, plants, inventory, saved days and remaining purse remain; A loses permission to accept a day or withdraw, while B gains the current-owner rights. Pending-day transfer locks remain intact. Preserve the same state hash where appropriate, while accounting for the intentional revision/purse-nonce changes on transfer.

An actual public earned-purse example is a current demo gap. The readily visible MISO/Robinhood and FERN/NEAR examples had zero purse at this review; their queried recent days did not establish a shipment reward. The native near-sandbox campaign has substantial economic evidence, but that stays labeled as local evidence. The public showcase should use actual Jev choices and legitimate shipments, without forcing a model result or creating administrator-issued balances for the video.

## NFT sales: the decisive design issue

A rooster is a changing bundle. Listing a funded purse and then emptying it before a purchase must not deliver less than the buyer accepted.

Current withdrawals and token-funded births from a purse increment `purseNonce` without incrementing the life revision. Checking revision alone is insufficient. Transfers also lock while a day is pending. Existing generic NFT marketplace orders do not automatically bind these facts.

If sales become part of the final scope, start with one served collection per world, native currency only, fixed price, complete NFT sale and a short expiry. Keep auctions, offers, arbitrary payment tokens, royalties dashboards, bridging and fractional ownership out. The sale module must receive no NHC minting authority.

- **Robinhood option:** noncustodial signed orders binding chain, collection, NFT, seller, price, expiry, listing nonce, expected life revision and expected purse nonce/minimum purse. Validate the bundle and pending status in the same transaction as NFT/payment settlement. Preserve selected state, approval revocation and transfer-away/back invalidation. Seller proceeds can use pull payments rather than relying on a recipient accepting ETH during fulfillment.
- **Native NEAR option:** escrow/freeze the life before it becomes purchasable, or explicitly extend the game's transfer API with conditional settlement. A view in one receipt cannot guarantee the state seen by a later transfer receipt. The present `nft_transfer_call` is disabled and there is no payout extension, so a generic marketplace cannot be assumed compatible. Purchase/cancel/refund requires explicit receipt/callback states and recovery. No offline aging makes a paused listed life coherent, but the engineering work remains real.

Decisive tests would cover purse drain after listing, changed day/state, pending-day purchase, transfer-away/back, revoked/reissued approval, expiry/cancel, duplicate fulfillment and failed recipients/callbacks. The UI should re-review a changed bundle rather than silently buy it. These are acceptance criteria for a future sales feature, not claims that one has been implemented.

## Why defer token trading

NHC already has a genuine use: productive shipments credit the NFT; an owner can withdraw; 250 NHC can be burned to hatch another life. Purchased wallet NHC does not pay native day fees and cannot currently top up an NFT purse. A swap therefore adds little to the daily care loop.

An AMM requires funded reserves and a chosen initial price. A finite peer-to-peer whole-bundle board would avoid promising continuous liquidity, but still introduces escrow, approvals, deposits, cancellation and refunds. A page with Buy/Sell buttons is not a completed trading mechanism. No guaranteed buyback, cash redemption, price floor or cross-world token equivalence should be implied.

## Submission readiness

Official rules were rechecked at 16:58 Bangkok. Testnet-only projects are eligible; no mainnet game deployment is needed solely for entry. The prize payout account is a separate mainnet NEAR account. The published guidance emphasizes a working, reproducible project; humans decide the winners after screening. No formal weighted scoring rubric was found.

The anonymous repository and raw README still return **404**, despite signed-in access previously showing Public. Current work is committed locally and deployed independently through Netlify; judges need a genuinely public, current cloneable repository. This is a release blocker, not a reason to label the repository private without evidence.

There is no root LICENSE file. Select and add a license before submission; MIT is allowed by the organizer, but the owner's code/art licensing choice should be explicit. Preserve applicable third-party notices. Do not treat public visibility alone as a licensing decision.

The final package needs the public repository, actual demo post on X, mainnet NEAR payout account and exact reviewed application payload. Submission is one-shot and cannot be edited. Current deadline: **14 November 2026, 23:59 UTC / 15 November, 06:59 Bangkok**. The demo and README must distinguish public testnet behavior from controlled/local evidence and identify the native NEAR integration accurately.

No X post or application was sent during this planning review. The final payload must be made reviewable before its final confirmation.

## Primary references

- [Official website and judging FAQ](https://nearhackathon.com/).
- [Live rules, especially Q-010, Q-011, Q-014 and Q-017](https://nearhackathon.com/HACKATHON.md).
- [Submission checklist](https://raw.githubusercontent.com/nearai/near-hackathon-prompt-examples/main/SUBMITTING.md).
- [NFT track direction](https://raw.githubusercontent.com/nearai/near-hackathon-prompt-examples/main/tracks/10-nfts.md).
- [NEAR cross-contract execution](https://docs.near.org/smart-contracts/anatomy/crosscontract), [NEP-178 approvals](https://github.com/near/NEPs/blob/master/neps/nep-0178.md).
- [Uniswap V2 liquidity mechanics](https://developers.uniswap.org/docs/protocols/v2/guides/providing-liquidity), [Seaport settlement model](https://docs.opensea.io/docs/seaport).

Implementation facts were checked against the current deployed-contract sources, wallet adapters, state/kernel, public API and economy documentation. The market designs above remain proposals; they are not audited or deployed contracts.
