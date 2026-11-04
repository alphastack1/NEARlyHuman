# Project documentation

Start with the **[player handbook](https://nearlyhuman.netlify.app/docs)** for the first day, care, growing, crafting, wallets and NFT ownership. The public guide is part of the application and stays alongside the current rules.

## Build and understand the project

| Document | Purpose |
| --- | --- |
| [Development](DEVELOPMENT.md) | Run the website, configure a full local service, and understand publication boundaries. |
| [Architecture](ARCHITECTURE.md) | Follow a day from player supplies through Jev to the saved life and film. |
| [Economy](ECONOMY.md) | The four-bed production loop, NHC purse and token-funded births. |
| [Native NEAR contract review](near-integration/CONTRACT.md) | Authority, custody, storage and actual contract evidence. |
| [Wallets and world switching](near-integration/WALLET_AND_SWITCHING.md) | Exact-world identity, Meteor/EVM handoffs and interrupted-payment recovery. |
| [World events and balance](research/WORLD_EVENT_BALANCE.md) | Implemented events, bounded simulations and known rule limits. |

## Current presentation and release evidence

| Record | What it establishes |
| --- | --- |
| [Website and integration plan](website-build/PLAN.md) | The public-site/app boundary and the selected visual direction. |
| [Visual refinement](website-build/VISUAL_REVIEW.md) | Actual rendered comparisons and the changes they drove. |
| [NFT artwork](website-build/NFT_ART.md) | Original rooster invariants, saved-state art and real NFT comparisons. |
| [Routing](website-build/ROUTING.md) | Public pages, the app and historical exact-NFT URLs. |
| [NFT viewing and discovery](website-build/NFT_VIEWING.md) | Public collection/life pages, research, rankings and verified saved-film handoffs. |
| [Bundle review](website-build/BUNDLE_REVIEW.md) | The separate public-site and game/wallet loading paths. |
| [Publication review](website-build/PUBLICATION_REVIEW.md) | Contracts-only export and the bounded repository/history review. |

The [current hybrid mockups](../design/website-build/mockups/index.html) and [original approved game reference](../design/references/VR-01-approved-house-and-care.png) preserve the visual direction. Mockups describe appearance; they are not evidence that a transaction or AI choice occurred.

## Reproduction and supporting records

- [Robinhood contract source and deployment](../contracts/v2/README.md), [native NEAR API](../contracts/near/API.md), and [native build tooling](../scripts/near/contract-build.ps1).
- [Earlier V2 model research](economy-v2/RESEARCH.md) and [feasibility receipts](v2-feasibility/REVIEW.md). These are dated design-stage experiments with explicit limitations, separate from later deployed behavior.
- [Retained release-wave evidence](overnight/) and [environment/event refinements](refinements/). These are supporting records, not the main setup guide.

Superseded design boards, incremental screenshot collections and V1 handoffs have been removed from the current public tree. Runtime code, contract artifacts, required experiment inputs and current evidence remain. The cleanup did not rewrite Git history.

[Cleanup scope and verification](website-build/CLEANUP.md) records the preserved inputs and checked archive operation.
