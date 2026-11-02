//! LOCAL sandbox receiver only. Never a production account or wallet.
use near_sdk::{near,env,require,ext_contract,AccountId,PromiseOrValue,Gas,NearToken,json_types::U128};
use near_contract_standards::non_fungible_token::{core::NonFungibleTokenReceiver,TokenId};
#[ext_contract(ext_game)]
trait Game { fn withdraw(&mut self,token_id:TokenId,amount:U128); }
#[ext_contract(ext_self)]
trait ReceiverSelf {fn after_attack(&mut self)->bool;}
#[near(contract_state)]
#[derive(Default)]
pub struct Receiver {last_attack_failed:bool}
#[near]
impl Receiver {
    #[init] pub fn new()->Self {Self::default()}
    pub fn attack_failed(&self)->bool {self.last_attack_failed}
    #[private] pub fn after_attack(&mut self)->bool {
        require!(env::predecessor_account_id()==env::current_account_id(),"private callback");
        self.last_attack_failed=matches!(env::promise_result(0),near_sdk::PromiseResult::Failed);
        true
    }
}
#[near]
impl NonFungibleTokenReceiver for Receiver {
    fn nft_on_transfer(&mut self,sender_id:AccountId,previous_owner_id:AccountId,token_id:TokenId,msg:String)->PromiseOrValue<bool> {
        let _=(sender_id,previous_owner_id);
        match msg.as_str() {
            "accept"=>PromiseOrValue::Value(false),
            "reject"=>PromiseOrValue::Value(true),
            "panic"=>env::panic_str("injected receiver failure"),
            "drain-reject"=>ext_game::ext(env::predecessor_account_id()).with_attached_deposit(NearToken::from_yoctonear(1))
                .with_static_gas(Gas::from_tgas(12)).withdraw(token_id,U128(1_000_000))
                .then(ext_self::ext(env::current_account_id()).with_static_gas(Gas::from_tgas(5)).after_attack()).into(),
            _=>env::panic_str("unsupported LOCAL mode")
        }
    }
}
