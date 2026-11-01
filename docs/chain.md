# Chain implementation

The collection stores the NFT's current192-byte semantic save, identity/stats/seed, biological day, survived-day level, revision and terminal status. Each committed day also preserves its compact4-byte-per-slot history, state hash and replay commitment. Model exchanges and cinematic packets remain offchain. The relayer is trusted to execute and validate the rules; this is not a trustless inference proof.

## Deployed testnet collection

- Network: Robinhood Chain Testnet, chain 46630.
- Address: [0x998551395f8a0c4ebd1f883b8c18a41d2cecabfb](https://explorer.testnet.chain.robinhood.com/address/0x998551395f8a0c4ebd1f883b8c18a41d2cecabfb).
- Deployment: [0x74784f5bfd71f08c5065bdde988c2c27e4327b97d06f24b4ce3dc1c0a7ca359d](https://explorer.testnet.chain.robinhood.com/tx/0x74784f5bfd71f08c5065bdde988c2c27e4327b97d06f24b4ce3dc1c0a7ca359d), block 146395229,1November2026.
- Owner/treasury: project developer wallet 0x131C15fD2d9151F361213d8e8BC2a188Dc0149c6.
- Quote signer/limited game relayer:0x3c63FD61B244b3B3290c74993F603816c6144C26, separate from owner/treasury.
- Initial testnet mint price:0.00001testETH, no real-world value; three committed days per NFT including the first.
- Deployment used5,273,605gas. Testnet relay reserve0.002ETH was funded; owner retained0.00694679145testETH after deployment/funding. These are dated observations, not future fee estimates.

Compiler solc0.8.38, OpenZeppelin5.6.1, Cancun target, optimizer200/viaIR. Runtime22,663bytes. Public deployment data/code/source hashes are in contracts/deployments.json; frontend/server addresses are exported by src/chain/deployments.ts. The exact artifact is contracts/artifacts/NEARlyHuman.json and ABI is src/chain/abi.ts.

## Lifecycle

- A signed EIP-712 single-use AdmissionPermit binds chain/collection/player/operation/base revision/delivery/name+stats/config/fee/acceptance expiry/window. The service must reserve funded completion capacity before signing it. Direct calls cannot bypass the signature.
- Mint creates starter state and its included first-day pending request atomically. A failed first-day retry uses the same stock, adds no delivery and charges no second mint.
- Only the current owner can request another day. At most three distinct one-unit additions; full65535 stock types cannot receive another unit. Pending requests lock all ERC721 transfers, including approved operators.
- Successful finalization is relayer-only, matches the base revision/intended day, and validates codec bounds/history shape. Alive results require all60 logical slots; terminal results stop early and retain the NFT. Day and level are separate counters.
- Failed/Expired attempts retain the exact prior save and intended-day seed, release the pending lock and advance no biology. Failed history and paid transactions are not deleted/refunded.
- Finalization is valid at or before the accepted deadline. Permissionless release is valid strictly after it and is network-gas only. The first valid terminal transition wins.
- A transfer after release/settlement preserves state and increments revision, invalidating old-owner/base permits. A dead NFT remains transferable and unplayable.

The quote's processing value equals(network estimate × (multiplier−1)); multiplier starts2 and is adjustable for future quotes. The actual network fee is separate. Exact msg.value is enforced; signed prices are never silently changed. Mainnet mint pricing fails closed against an explicit ETH/USD feed/freshness configuration. The mainnet constructor cannot enable testnet price mode.

## Checks and tool boundary

One short local lifecycle experiment used Anvil1.7.1 entirely under the ignored temporary folder and the exact Cancun deployment artifact. Seventeen checks passed: payment/signature/authority, starter state, transfer lock/release, duplicate settlement, complete ownership transfer, failure preservation, retry seed, strict deadline equality, permissionless expiry, trial cap, no day-one delivery, retained terminal NFT, dead play blocked and memorial transfer. Three live read-only initialState seeds matched the public TypeScript codec byte-for-byte. The live deployment also verified code, owner, quote signer, relayer, mint price and192-byte output.

Build with `node scripts/chain/build-contract.mjs`. Deploy estimates without signing by default: `node scripts/chain/deploy-contract.mjs`. An explicitly authorized broadcast uses `--broadcast` and a securely injected NEARLYHUMAN_OWNER_PRIVATE_KEY process environment. Keys must never be printed or saved in this repo. Signed deployment intent is journaled outside the repo before broadcast, so interruption does not silently create a second deployment.

Mainnet is a real available network, chain 4663, but this document does not claim a mainnet deployment. Its verified feed/freshness inputs and funding are separate from testnet.

## Official sources

Robinhood's [connection documentation](https://docs.robinhood.com/chain/connecting/) and [mainnet support article](https://robinhood.com/us/en/support/articles/robinhood-chain-mainnet/) confirm chain 4663/mainnet and46630/testnet, ETH gas, official public RPCs and explorer domains. Public RPCs are rate-limited; a production provider can be selected without changing contract state. OpenZeppelin's [ERC721 documentation](https://docs.openzeppelin.com/contracts/5.x/api/token/erc721) supplies the standard transfer/approval behavior; only the pending-request gate and bounded owned paging are customized. [Foundry Anvil](https://www.getfoundry.sh/anvil/index.html) supplies the in-memory development chain.
