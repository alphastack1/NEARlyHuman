# Native NEAR V2 contract interface

Native world: `network_id = "near-testnet"`, collection is the contract's NEAR account ID. No EVM chain ID or EVM owner address is invented. V2 semantic state, trace and certificate use the **exact current ABI encoding** from `src/v2/codec.ts` (not the obsolete 192-byte V1 format). All hex is lower-case `0x` prefixed. IDs, amounts and timestamps are decimal strings where precision matters. Times use Unix seconds.

Initialization: `new({owner_id,relayer_id,quote_public_key,native_mint_price,decision_config,metadata_base})`. `quote_public_key` is base64 raw 32-byte Ed25519 key. Default multiplier 2, configurable by owner 1..20. `metadata_base` is the HTTPS game origin.

Views:

- `config()` → `{network_id,contract_id,owner_id,relayer_id,quote_public_key,rules_hash,decision_config,native_mint_price,token_mint_price_micro,storage_deposit,multiplier,admissions_paused,issued,nft_mint_burns,total_allocated,available,reserved}`. `storage_deposit` is 0.1 NEAR; native mint requires the configured exact price and includes storage coverage, token births attach `storage_deposit` and refund excess actual storage.
- `life({token_id})` → `{token_id,owner_id,name,state,revision,purse_micro,purse_nonce,pending_request,appearance_seed}`; `state` is exact ABI hex. Missing ID returns null.
- `request({request_id})` → `{request_id,token_id,player,base_revision,day,kit_mask,shipping,accepted_at,deadline,day_seed,decision_config,base_hash,pressure,reserved_reward,status}`. Status 0 absent, 1 Pending, 2 Settled, 3 Failed, 4 Expired. Absent request returns null.
- `day_record({token_id,day})` → `{request_id,seed,state_hash,trace_hash,certificate_hash,replay_commitment,reward,history}` or null. `history` is packed hex goal byte + chronological 8-byte steps (same existing compact V2 format).
- `quote_day({token_id})` → `{maximum,pressure,capacity}`.
- `owned_tokens({owner_id,cursor,limit})` → `{token_ids,next_cursor}`. Cursor decimal offset, limit 1..24. NEP-181 NFT enumeration also available.
- NEP-171 `nft_token`; NEP-141 `ft_balance_of`,`ft_total_supply`,`ft_metadata`; NEP-145 storage registration. Combined NFT+FT collection account; six decimal NHC, not bridged to the RH supply.

Writes (gas suggestion 100 Tgas mint/birth, 80 Tgas admission, 300 Tgas finalize):

- `mint_nft({name,stats:[body,wits,spirit],operation_id,expected_owner})` attaches exact `native_mint_price`; returns token ID. Names 1..8 ASCII upper-case/digits/internal spaces; exactly five stat points.
- `accept_day({admission,signature})` attaches exact `admission.processingFee`; signature is base64 64-byte Ed25519. Admission fields: `{id,player,tokenId,baseRevision,kitMask,shipping,processingFee,multiplier,expiresAt,decisionConfig}`. Owner signs this native transaction. Contract verifies predecessor ownership, exact save revision/policy, unexpired quote (max 900 sec), one unresolved request, valid gifts, reserve capacity and signer authority.
- `finalize({request_id,trace,certificate,replay_commitment})` relayer only; derives the result and reward itself, never accepts supplied output stock/reward/death. `trace`,`certificate` exact ABI hex, commitment bytes32 hex. No attached deposit required.
- `fail({request_id})` relayer only; preserves save and releases reserve.
- `expire({request_id})` permissionless strictly after deadline; preserves save and releases reserve.
- `withdraw({token_id,amount,operation_id,expected_owner})` attaches `storage_deposit`, refunds unused actual storage, and automatically registers the recipient FT account if needed. Actual NFT owner only, including after death. Direct atomic internal FT movement from the NFT vault. Storage funding covers the immutable operation outcome; one yoctoNEAR would not cover this journal and could enable storage griefing.
- `birth_from_wallet({name,stats,operation_id,expected_owner})` attaches `storage_deposit`, directly burns 250 NHC from predecessor (no ERC-20 approval).
- `birth_from_purse({source_token_id,expected_nonce,name,stats,operation_id,expected_owner})` attaches `storage_deposit`, burns 250 NHC from that NFT's purse after checking actual ownership and nonce. Old purse remains spendable while AI pending or after death; new birth has no productive gifts.
- NEP-171 direct `nft_transfer` attaches 1 yoctoNEAR and is locked while a day is pending. NFT transfer-call is deliberately refused; no tentative ownership/callback gap is exposed. NEP-178 approval and NEP-181 enumeration are supported.

## Admission signature bytes

Sign the following UTF-8 bytes directly with Ed25519 (no extra hash, no trailing newline). Every field is canonical as described above:

```
NEARLYHUMAN_DAY_V2
near-testnet
<contract account ID>
<id>
<player>
<tokenId>
<baseRevision decimal>
<kitMask decimal>
<shipping: 1 or 0>
<processingFee decimal>
<multiplier decimal>
<expiresAt decimal>
<decisionConfig>
```

Native day and appearance seeds are contract-derived bytes32 and stored immutably in their respective records. The deterministic V2 draw function consumes the same lower-case hex seed/day/slot/label string as TypeScript and Solidity. Hashes of encoded state, trace, certificate and packet commitments remain Keccak-256. Native transaction/account hashes are NEAR values and are not treated as EVM hashes.

## Exact operation recovery and fees

The four custom owner operations require a nonzero bytes32 `operation_id` and `expected_owner` matching the immediate predecessor. `get_operation({account_id,operation_id})` returns `{method,token_id,request_id:null,status:"complete",amount,fingerprint}` only after the operation atomically succeeds. An exact duplicate returns the prior outcome and refunds all newly attached deposit without repeating a mint, burn or withdrawal; changed payloads reject. Outcomes remain independent of FT registration and are never pruned by `storage_unregister`.

`config()` also returns `min_processing_fee` (initial 0.02 NEAR), `native_fees`, and `nft_transfer_call_enabled:false`. Fees cover admission and settlement record storage; the contract's internal Borsh state is compact while exposed ABI bytes remain exact. `set_fees({native_mint_price,min_processing_fee,multiplier})` is owner-only with bounds: mint at least0.1NEAR, minimum fee0.02..0.2NEAR, multiplier1..20. Role updates are owner-only. A native funding method sends earned fees only to the configured relayer with a storage floor; it is not an unrestricted treasury drain.
