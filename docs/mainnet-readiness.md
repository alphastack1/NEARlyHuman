# Robinhood mainnet readiness — 1 November 2026

An official ETH/USD feed is available and its interface was verified with **read-only RPC calls**. The owner and relay wallets both still have **0 wei on mainnet**. No deployment, signature, funding transfer or contract change was made. The released application remains on testnet.

## Verified feed and future configuration

Robinhood identifies mainnet as chain **4663**, with ETH gas and public RPC `https://rpc.mainnet.chain.robinhood.com`. Its oracle guide directs developers to Chainlink's feed directory for proxy addresses and parameters. [Robinhood connection details](https://docs.robinhood.com/chain/connecting/), [Robinhood oracle guide](https://docs.robinhood.com/chain/oracles-and-price-feeds/).

The [official Chainlink Robinhood directory](https://docs.chain.link/data-feeds/price-feeds/addresses?network=robinhood) publishes this ETH/USD entry:

| Field | Published value |
| --- | --- |
| Proxy (`proxyAddress`) | `0x78F3556b67E17Df817D51Ef5a990cDaF09E8d3A9` |
| Aggregator (`contractAddress`) | `0x6091E64eb7138EEF066a80FD3A0d7427B91f2721` |
| Pair / decimals | ETH / USD · 8 |
| Heartbeat | 86,400 seconds / 24 hours |
| Deviation threshold | 0.5% |
| Directory path | `eth-usd-shared-svr` |

**PM-selected future mainnet settings:**

```text
NEARLYHUMAN_PRICE_FEED=0x78F3556b67E17Df817D51Ef5a990cDaF09E8d3A9
NEARLYHUMAN_PRICE_MAX_AGE=90000
```

The 90,000-second maximum age is the project's explicit policy: the published 24-hour heartbeat plus one hour of allowance. It is not a Chainlink-published parameter. The existing contract rejects answers older than this limit, nonpositive answers, future/zero timestamps and incomplete rounds. Its signed mint-price tolerance remains 1%. A one-hour maximum age would have rejected the valid observed round below.

## Read-only observation

Checked **2026-11-01 08:19:15 UTC**, using the official mainnet RPC. `eth_chainId` returned **4663**. Calls were pinned to block **103239796** and its hash was checked again after the reads:

`0x677e20c5944a5ede56e4e1fb639355e6e87f96d26c09ee4252ba993d899106f9`

| Read | Result |
| --- | --- |
| Proxy bytecode | Present, 9,571 bytes |
| `description()` | `ETH / USD` |
| `decimals()` | `8` |
| `version()` | `6` |
| `aggregator()` | Matches the directory aggregator above |
| `latestRoundData().roundId` | `18446744073709554660` |
| `answer` | `226211217171` = $2,262.11217171 per ETH at that snapshot |
| `startedAt` | `1793495570` |
| `updatedAt` | `1793495582` = 2026-11-01 01:13:02 UTC |
| `answeredInRound` | `18446744073709554660`, equal to the round ID |
| Block timestamp / round age | `1793521152` / 25,570 seconds, below the selected 90,000-second limit |
| Developer `0x131C15fD2d9151F361213d8e8BC2a188Dc0149c6` | 0 wei |
| Relay `0x3c63FD61B244b3B3290c74993F603816c6144C26` | 0 wei |

These are dated observations, not a current-price or perpetual-freshness claim. Re-read the official directory and the proxy immediately before any authorized mainnet deployment. Configure the proxy, not the aggregator or the unrelated Data Streams verifier.

## Remaining mainnet work

Funding is still required separately for the owner deployment and the mainnet relay. There is no mainnet collection in `src/chain/deployments.ts` or `contracts/deployments.json`. The frozen deployment script estimates without broadcasting by default and requires the explicit feed/freshness settings above for mainnet; actual deployment still needs its authorized funded step and post-deployment role/price/codec verification. Do not change production away from unresolved testnet work.

The deeper UX audit also identified a future contract-context review: v1 request IDs can be reused after an acceptance rollback. The PM kept the existing testnet collection and bounded server recovery for this sprint. Before a mainnet version, review full accepted-context IDs/digest-bound relay outcomes together with collection-scoped client state and metadata routes that preserve existing NFT identities; changing only an ID hash does not remove those migration obligations. See [the recovery audit](RECOVERY_AUDIT.md).

Robinhood recommends checking sequencer uptime on L2. Chainlink's current supported-network list does not publish a Robinhood uptime-feed address, and states that expansion to additional networks has stopped. The current game contract checks price freshness but does not add a sequencer feed/grace-period check; no address was invented or borrowed from another chain. Keep that limitation explicit in the mainnet review. [Robinhood guidance](https://docs.robinhood.com/chain/oracles-and-price-feeds/), [Chainlink uptime-feed availability](https://docs.chain.link/data-feeds/l2-sequencer-feeds).
