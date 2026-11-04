//! Local receipt-test receiver only. Never included in the game Wasm.
use near_sdk::{
    AccountId, Gas, NearToken, PanicOnDefault, Promise, PromiseOrValue, env,
    json_types::U128,
    near, require,
    serde_json::{Value, json},
};
#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Receiver {
    token: AccountId,
}
#[near]
impl Receiver {
    #[init]
    pub fn new(token: AccountId) -> Self {
        Self { token }
    }
    pub fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<Value> {
        require!(env::predecessor_account_id() == self.token, "token only");
        let _ = sender_id;
        if msg == "use" {
            return PromiseOrValue::Value(json!("0"));
        }
        if msg == "refund" {
            return PromiseOrValue::Value(json!(amount));
        }
        if msg == "panic" {
            env::panic_str("controlled receiver failure")
        }
        if msg == "malformed" {
            return PromiseOrValue::Value(json!("not a U128"));
        }
        if let Some(n) = msg.strip_prefix("partial:") {
            return PromiseOrValue::Value(json!(n));
        }
        if let Some(args) = msg.strip_prefix("spend:") {
            let values: Vec<&str> = args.split(':').collect();
            require!(values.len() == 3, "spend vector");
            let target: AccountId = values[0].parse().unwrap();
            let gross = values[1].parse::<u128>().unwrap();
            let unused = values[2].parse::<u128>().unwrap();
            return PromiseOrValue::Promise(Promise::new(self.token.clone()).function_call("ft_transfer",near_sdk::serde_json::to_vec(&json!({"receiver_id":target,"amount":gross.to_string(),"memo":"receiver spent"})).unwrap(),NearToken::from_yoctonear(1),Gas::from_tgas(40)).then(Self::ext(env::current_account_id()).with_static_gas(Gas::from_tgas(5)).return_unused(U128(unused))));
        }
        PromiseOrValue::Value(json!(amount))
    }
    #[private]
    pub fn return_unused(&self, unused: U128) -> Value {
        json!(unused)
    }
}
