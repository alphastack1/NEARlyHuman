//! Native NEAR combined-interface feasibility probe, not a production game.
//! Fixtures are test-only or LOCAL receipt-probe; default exports no fixture issuer.
use std::collections::HashMap;
use near_sdk::{AccountId, Gas, NearToken, PanicOnDefault, Promise, PromiseOrValue, env, near,
    require, assert_one_yocto, collections::LookupMap, json_types::U128};
use near_contract_standards::{
    fungible_token::{FungibleToken, FungibleTokenCore, FungibleTokenResolver,
        events::{FtMint,FtBurn},
        metadata::{FungibleTokenMetadata, FungibleTokenMetadataProvider}},
    non_fungible_token::{NonFungibleToken, Token, TokenId,
        core::{NonFungibleTokenCore, ext_nft_receiver, ext_nft_resolver, NonFungibleTokenResolver},
        metadata::{NFTContractMetadata, NonFungibleTokenMetadataProvider}, events::NftMint},
    storage_management::{StorageManagement, StorageBalance, StorageBalanceBounds},
};

const U: u128 = 1_000_000;
const PRICE: u128 = 250 * U;
const K: u128 = 50_000 * U;
const RESOLVER_GAS: Gas = Gas::from_tgas(30);

#[near(serializers=[borsh])]
#[derive(Clone)]
pub struct Life { pub purse: u128, pub alive: bool, pub ai_pending: bool, pub intent_nonce: u64 }
#[near(serializers=[borsh])]
pub struct PendingTransfer { pub previous: AccountId, pub receiver: AccountId }

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    nft: NonFungibleToken, ft: FungibleToken,
    lives: LookupMap<TokenId, Life>, transfer_pending: LookupMap<TokenId, PendingTransfer>,
    total_allocated: u128, issued: u128, nft_mint_burns: u128, next_id: u64,
    transfer_calls_enabled: bool,
    probe_operator: AccountId,
    probe_fail_resolver: bool,
}

#[near]
impl Contract {
    #[init]
    pub fn new() -> Self {
        let vault = env::current_account_id();
        let mut ft = FungibleToken::new(b"f".to_vec());
        ft.internal_register_account(&vault);
        Self { nft: NonFungibleToken::new(b"n".to_vec(), vault,
                None::<Vec<u8>>, Some(b"e".to_vec()), Some(b"a".to_vec())),
            ft, lives: LookupMap::new(b"l"), transfer_pending: LookupMap::new(b"t"),
            total_allocated: 0, issued: 0, nft_mint_burns: 0, next_id: 0,
            transfer_calls_enabled: false, probe_operator: env::predecessor_account_id(), probe_fail_resolver: false }
    }
    pub fn purse_of(&self, token_id: TokenId) -> U128 { U128(self.life(&token_id).purse) }
    pub fn lifetime_issued(&self) -> U128 { U128(self.issued) }
    pub fn allocated(&self) -> U128 { U128(self.total_allocated) }
    pub fn transfer_in_flight(&self, token_id: TokenId) -> bool { self.transfer_pending.get(&token_id).is_some() }
    pub fn transfer_call_enabled(&self) -> bool { self.transfer_calls_enabled }
    pub fn quote_decipoints(&self, decipoints: u16) -> U128 {
        require!(decipoints <= 1360, "bounded four-chest quote");
        U128(u128::from(decipoints) * U * K / (10 * (K + self.issued)))
    }
    #[payable]
    pub fn withdraw(&mut self, token_id: TokenId, amount: U128) {
        assert_one_yocto();
        let owner = self.actual_owner(&token_id);
        require!(env::predecessor_account_id() == owner, "owner only");
        self.no_tentative_owner(&token_id);
        let mut life = self.life(&token_id);
        require!(amount.0 > 0 && life.purse >= amount.0, "purse funds");
        require!(self.ft.accounts.get(&owner).is_some(), "register FT account first");
        self.ft.internal_transfer(&env::current_account_id(), &owner, amount.0, Some("NFT purse withdrawal".into()));
        life.purse -= amount.0; self.total_allocated -= amount.0;
        self.lives.insert(&token_id, &life);
    }
    /// Native storage deposit is separate from the 250-token price.
    #[payable]
    pub fn mint_from_purse(&mut self, token_id: TokenId, expected_nonce: u64) -> TokenId {
        let owner = self.actual_owner(&token_id);
        require!(env::predecessor_account_id() == owner, "owner only");
        self.no_tentative_owner(&token_id);
        let mut life = self.life(&token_id);
        require!(life.intent_nonce == expected_nonce, "stale intent");
        require!(life.purse >= PRICE, "purse funds");
        let next = self.next_id.checked_add(1).expect("ID overflow");
        let new_id = next.to_string();
        require!(self.nft.nft_token(new_id.clone()).is_none(), "ID already used");
        let before = env::storage_usage();
        self.ft.internal_withdraw(&env::current_account_id(), PRICE);
        self.nft_mint_burns = self.nft_mint_burns.checked_add(PRICE).expect("burn overflow");
        life.purse -= PRICE; life.intent_nonce=life.intent_nonce.checked_add(1).expect("nonce overflow");
        self.total_allocated -= PRICE; self.lives.insert(&token_id, &life);
        self.nft.internal_mint_with_refund(new_id.clone(), owner.clone(), None, None);
        self.lives.insert(&new_id, &Life { purse: 0, alive: true, ai_pending: false, intent_nonce: 0 });
        self.next_id = next;
        let cost=env::storage_byte_cost().as_yoctonear()*u128::from(env::storage_usage()-before);
        let attached=env::attached_deposit().as_yoctonear();
        require!(attached >= cost,"attach birth storage deposit");
        if attached>cost { Promise::new(owner.clone()).transfer(NearToken::from_yoctonear(attached-cost)).detach(); }
        FtBurn {owner_id:&env::current_account_id(),amount:U128(PRICE),memo:Some("NFT birth")}.emit();
        NftMint { owner_id: &owner, token_ids: &[&new_id], memo: Some("purse-funded birth probe") }.emit();
        new_id
    }
    /// Exercises ownership locking only; does not authorize or settle a day.
    #[payable]
    pub fn begin_day_probe(&mut self, token_id: TokenId) {
        assert_one_yocto();
        require!(env::predecessor_account_id()==self.actual_owner(&token_id),"owner only");
        self.no_tentative_owner(&token_id);
        let mut life=self.life(&token_id);
        require!(life.alive && !life.ai_pending,"day unavailable");
        life.ai_pending=true; self.lives.insert(&token_id,&life);
    }
}
impl Contract {
    fn life(&self,id:&TokenId)->Life { self.lives.get(id).expect("life exists") }
    fn actual_owner(&self,id:&TokenId)->AccountId { self.nft.nft_token(id.clone()).expect("NFT exists").owner_id }
    fn no_tentative_owner(&self,id:&TokenId) { require!(self.transfer_pending.get(id).is_none(),"transfer unresolved"); }
    fn can_transfer(&self,id:&TokenId) { self.no_tentative_owner(id); require!(!self.life(id).ai_pending,"day pending"); }
    fn advance_nonce(&mut self,id:&TokenId) { let mut life=self.life(id); life.intent_nonce=life.intent_nonce.checked_add(1).expect("nonce overflow"); self.lives.insert(id,&life); }
}
#[near]
impl NonFungibleTokenCore for Contract {
    #[payable]
    fn nft_transfer(&mut self,receiver_id:AccountId,token_id:TokenId,approval_id:Option<u64>,memo:Option<String>) {
        self.can_transfer(&token_id);
        self.nft.nft_transfer(receiver_id,token_id.clone(),approval_id,memo); self.advance_nonce(&token_id);
    }
    #[payable]
    fn nft_transfer_call(&mut self,receiver_id:AccountId,token_id:TokenId,approval_id:Option<u64>,memo:Option<String>,msg:String)->PromiseOrValue<bool> {
        require!(self.transfer_calls_enabled,"transfer-call not enabled");
        assert_one_yocto(); self.can_transfer(&token_id);
        require!(env::prepaid_gas()>=Gas::from_tgas(90),"attach at least 90 Tgas");
        let sender=env::predecessor_account_id();
        let (previous,approvals)=self.nft.internal_transfer(&sender,&receiver_id,&token_id,approval_id,memo);
        self.advance_nonce(&token_id);
        self.transfer_pending.insert(&token_id,&PendingTransfer {previous:previous.clone(),receiver:receiver_id.clone()});
        ext_nft_receiver::ext(receiver_id.clone()).with_static_gas(Gas::from_tgas(40)).with_unused_gas_weight(1)
            .nft_on_transfer(sender,previous.clone(),token_id.clone(),msg)
            .then(ext_nft_resolver::ext(env::current_account_id()).with_static_gas(RESOLVER_GAS).with_unused_gas_weight(0)
                .nft_resolve_transfer(previous,receiver_id,token_id,approvals)).into()
    }
    fn nft_token(&self,token_id:TokenId)->Option<Token> { self.nft.nft_token(token_id) }
}
#[near]
impl NonFungibleTokenResolver for Contract {
    #[private]
    fn nft_resolve_transfer(&mut self,previous_owner_id:AccountId,receiver_id:AccountId,token_id:TokenId,approved_account_ids:Option<HashMap<AccountId,u64>>)->bool {
        require!(env::predecessor_account_id()==env::current_account_id(),"private resolver");
        let pending=self.transfer_pending.get(&token_id).expect("pending transfer exists");
        require!(pending.previous==previous_owner_id && pending.receiver==receiver_id,"callback binding");
        #[cfg(feature="receipt-probe")]
        require!(!self.probe_fail_resolver,"injected resolver failure");
        let accepted=self.nft.nft_resolve_transfer(previous_owner_id,receiver_id,token_id.clone(),approved_account_ids);
        self.transfer_pending.remove(&token_id); self.advance_nonce(&token_id); accepted
    }
}
#[near]
impl FungibleTokenCore for Contract {
    #[payable]
    fn ft_transfer(&mut self,receiver_id:AccountId,amount:U128,memo:Option<String>) {
        require!(env::predecessor_account_id()!=env::current_account_id(),"vault cannot use public FT transfer");
        self.ft.ft_transfer(receiver_id,amount,memo)
    }
    #[payable]
    fn ft_transfer_call(&mut self,receiver_id:AccountId,amount:U128,memo:Option<String>,msg:String)->PromiseOrValue<U128> {
        require!(env::predecessor_account_id()!=env::current_account_id(),"vault cannot use public FT transfer-call");
        self.ft.ft_transfer_call(receiver_id,amount,memo,msg)
    }
    fn ft_total_supply(&self)->U128 { self.ft.ft_total_supply() }
    fn ft_balance_of(&self,account_id:AccountId)->U128 { self.ft.ft_balance_of(account_id) }
}
#[near]
impl FungibleTokenResolver for Contract {
    #[private]
    fn ft_resolve_transfer(&mut self,sender_id:AccountId,receiver_id:AccountId,amount:U128)->U128 {
        require!(env::predecessor_account_id()==env::current_account_id(),"private FT resolver");
        require!(sender_id!=env::current_account_id(),"no vault FT transfer-call was issued");
        self.ft.ft_resolve_transfer(sender_id,receiver_id,amount)
    }
}
#[near]
impl StorageManagement for Contract {
    #[payable]
    fn storage_deposit(&mut self,account_id:Option<AccountId>,registration_only:Option<bool>)->StorageBalance { self.ft.storage_deposit(account_id,registration_only) }
    #[payable]
    fn storage_withdraw(&mut self,amount:Option<NearToken>)->StorageBalance { self.ft.storage_withdraw(amount) }
    #[payable]
    fn storage_unregister(&mut self,force:Option<bool>)->bool {
        require!(env::predecessor_account_id()!=env::current_account_id(),"vault cannot unregister");
        if let Some((account,balance))=self.ft.internal_storage_unregister(force) {
            if balance>0 {FtBurn{owner_id:&account,amount:U128(balance),memo:Some("forced unregister")}.emit();}
            true
        }else{false}
    }
    fn storage_balance_bounds(&self)->StorageBalanceBounds { self.ft.storage_balance_bounds() }
    fn storage_balance_of(&self,account_id:AccountId)->Option<StorageBalance> { self.ft.storage_balance_of(account_id) }
}
#[near]
impl FungibleTokenMetadataProvider for Contract {
    fn ft_metadata(&self)->FungibleTokenMetadata { FungibleTokenMetadata { spec:"ft-1.0.0".into(),name:"NEARlyHuman Probe".into(),symbol:"PROBE".into(),icon:None,reference:None,reference_hash:None,decimals:6 } }
}
#[near]
impl NonFungibleTokenMetadataProvider for Contract {
    fn nft_metadata(&self)->NFTContractMetadata { NFTContractMetadata { spec:"nft-1.0.0".into(),name:"NEARlyHuman Probe".into(),symbol:"LIFE".into(),icon:None,base_uri:None,reference:None,reference_hash:None } }
}
#[cfg(test)] mod tests;

// Isolated receipt harness only. This feature MUST NOT be enabled in a valuable
// deployment. Fixture credits are operator-bound and cumulatively capped at1000.
#[cfg(feature="receipt-probe")]
#[near]
impl Contract {
    pub fn probe_seed(&mut self,owner_id:AccountId,amount:U128,alive:bool,ai_pending:bool)->TokenId {
        require!(env::predecessor_account_id()==self.probe_operator,"probe operator only");
        require!(amount.0>0 && self.issued+amount.0<=1000*U,"probe issuance cap");
        self.next_id+=1;let id=self.next_id.to_string();
        self.nft.internal_mint_with_refund(id.clone(),owner_id.clone(),None,None);
        self.lives.insert(&id,&Life {purse:amount.0,alive,ai_pending,intent_nonce:0});
        self.ft.internal_deposit(&env::current_account_id(),amount.0);
        self.total_allocated+=amount.0;self.issued+=amount.0;
        FtMint {owner_id:&env::current_account_id(),amount,memo:Some("LOCAL fixture funding")}.emit();
        NftMint {owner_id:&owner_id,token_ids:&[&id],memo:Some("LOCAL fixture life")}.emit();id
    }
    pub fn probe_configure(&mut self,enable_transfer_call:bool,fail_resolver:bool) {
        require!(env::predecessor_account_id()==self.probe_operator,"probe operator only");
        self.transfer_calls_enabled=enable_transfer_call;self.probe_fail_resolver=fail_resolver;
    }
    pub fn probe_status(&self,token_id:TokenId)->near_sdk::serde_json::Value {
        let l=self.life(&token_id);
        near_sdk::serde_json::json!({"owner":self.actual_owner(&token_id),"purse":l.purse.to_string(),
            "alive":l.alive,"ai_pending":l.ai_pending,"nonce":l.intent_nonce,
            "transfer_pending":self.transfer_pending.get(&token_id).is_some(),
            "vault":self.ft.ft_balance_of(env::current_account_id()).0.to_string(),
            "allocated":self.total_allocated.to_string(),"supply":self.ft.ft_total_supply().0.to_string(),
            "issued":self.issued.to_string(),"mint_burns":self.nft_mint_burns.to_string()})
    }
}
