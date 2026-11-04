//! Fixed 50bps transfer burn with layout-compatible, isolated extension storage.
//! The existing Contract Borsh fields/collection prefixes remain unchanged.
use super::*;
use near_contract_standards::fungible_token::receiver::ext_ft_receiver;
use near_sdk::{assert_one_yocto, ext_contract};

const ENABLED: &[u8] = b"\xffnh/burn/v1/enabled";
const BURNED: &[u8] = b"\xffnh/burn/v1/burned";
const RESERVED: &[u8] = b"\xffnh/burn/v1/reserved";
const NEXT: &[u8] = b"\xffnh/burn/v1/next";
const PENDING: &[u8] = b"\xffnh/burn/v1/pending";
const CALL_PREFIX: &[u8] = b"\xffnh/burn/v1/call/";
const MAX_PENDING: u128 = 32;
const NATIVE_MARGIN: u128 = 20_000_000_000_000_000_000_000;

#[near(serializers=[borsh])]
struct FeeCall {
    sender: AccountId,
    receiver: AccountId,
    gross: u128,
    net: u128,
    fee: u128,
}
fn value(key: &[u8]) -> u128 {
    env::storage_read(key)
        .map(|bytes| {
            u128::from_le_bytes(
                bytes
                    .try_into()
                    .unwrap_or_else(|_| env::panic_str("invalid burn extension")),
            )
        })
        .unwrap_or(0)
}
fn put(key: &[u8], amount: u128) {
    env::storage_write(key, &amount.to_le_bytes());
}
fn call_key(id: u64) -> Vec<u8> {
    let mut key = CALL_PREFIX.to_vec();
    key.extend_from_slice(&id.to_le_bytes());
    key
}
fn amounts(gross: u128, enabled: bool) -> (u128, u128) {
    let fee = if enabled { gross / 200 } else { 0 };
    (gross - fee, fee)
}
fn used_fee(used_net: u128, max_fee: u128) -> u128 {
    max_fee.min(used_net / 199)
}

#[ext_contract(ext_burn_resolver)]
trait BurnResolver {
    fn resolve_transfer_burn(&mut self, call_id: u64) -> U128;
}

#[near]
impl Contract {
    fn require_transfer_call_storage(&self) {
        let storage_cost = u128::from(env::storage_usage())
            .checked_mul(env::storage_byte_cost().as_yoctonear())
            .expect("storage overflow");
        let required = storage_cost
            .checked_add(self.native_storage_reserved)
            .and_then(|amount| amount.checked_add(NATIVE_MARGIN))
            .expect("storage margin overflow");
        require!(
            env::account_balance().as_yoctonear() >= required,
            "transfer callback storage margin"
        );
    }
    /// Defaults ON for both a new deployment and a compatible old-state upgrade.
    pub fn transfer_burn_enabled(&self) -> bool {
        env::storage_read(ENABLED)
            .map(|b| {
                require!(b.len() == 1 && b[0] <= 1, "invalid burn toggle");
                b[0] == 1
            })
            .unwrap_or(true)
    }
    pub fn total_transfer_burned(&self) -> U128 {
        U128(value(BURNED))
    }
    pub fn transfer_burn_config(&self) -> Value {
        json!({"enabled":self.transfer_burn_enabled(),"bps":50,"total_burned":value(BURNED).to_string(),"reserved":value(RESERVED).to_string(),"pending":value(PENDING)})
    }
    pub fn preview_transfer(&self, amount: U128) -> Value {
        let (net, fee) = amounts(amount.0, self.transfer_burn_enabled());
        json!({"gross":amount,"received":U128(net),"burned":U128(fee),"enabled":self.transfer_burn_enabled(),"bps":50})
    }
    pub fn set_transfer_burn_enabled(&mut self, enabled: bool) {
        self.admin();
        env::storage_write(ENABLED, &[u8::from(enabled)]);
        env::log_str(&json!({"standard":"nearlyhuman","version":"3.0.0","event":"transfer_burn_toggled","data":[{"enabled":enabled,"bps":50}]}).to_string());
    }

    #[private]
    pub fn resolve_transfer_burn(&mut self, call_id: u64) -> U128 {
        require!(
            env::predecessor_account_id() == env::current_account_id(),
            "private fee resolver"
        );
        let key = call_key(call_id);
        let Some(bytes) = env::storage_read(&key) else {
            return U128(0);
        };
        require!(env::promise_results_count() == 1, "one receiver result");
        let call: FeeCall = near_sdk::borsh::from_slice(&bytes)
            .unwrap_or_else(|_| env::panic_str("invalid fee callback"));
        env::storage_remove(&key);
        put(
            PENDING,
            value(PENDING).checked_sub(1).expect("pending underflow"),
        );
        put(
            RESERVED,
            value(RESERVED)
                .checked_sub(call.fee)
                .expect("reserved underflow"),
        );
        // The standard resolver clamps hostile replies and the receiver's current
        // available balance. Its burned result is an unregistered sender's refund.
        let (standard_used, net_refund_burned) =
            self.ft
                .internal_ft_resolve_transfer(&call.sender, call.receiver, U128(call.net));
        self.unregister_burns = self
            .unregister_burns
            .checked_add(net_refund_burned)
            .expect("burn overflow");
        let economic_used = standard_used
            .checked_sub(net_refund_burned)
            .expect("refund accounting");
        let fee_used = used_fee(economic_used, call.fee);
        let fee_refund = call.fee - fee_used;
        let vault = env::current_account_id();
        if fee_used > 0 {
            self.ft.internal_withdraw(&vault, fee_used);
            self.record_transfer_burn(&vault, fee_used);
        }
        let sender_exists = self.ft.accounts.get(&call.sender).is_some();
        if fee_refund > 0 {
            if sender_exists {
                self.ft.internal_transfer(
                    &vault,
                    &call.sender,
                    fee_refund,
                    Some("transfer fee refund".into()),
                );
            } else {
                self.ft.internal_withdraw(&vault, fee_refund);
                self.unregister_burns = self
                    .unregister_burns
                    .checked_add(fee_refund)
                    .expect("burn overflow");
                FtBurn {
                    owner_id: &vault,
                    amount: U128(fee_refund),
                    memo: Some("unregistered sender fee refund"),
                }
                .emit();
            }
        }
        self.backed();
        // Net + fee <= captured gross. A missing sender follows NEP-141: amounts
        // that could not be returned are burned, rather than credited elsewhere.
        let spent = if sender_exists {
            standard_used.checked_add(fee_used)
        } else {
            standard_used.checked_add(call.fee)
        }
        .expect("used overflow");
        require!(spent <= call.gross, "used exceeds gross");
        U128(spent)
    }
}

impl Contract {
    pub(super) fn transfer_call_reserved(&self) -> u128 {
        value(RESERVED)
    }
    pub(super) fn transfer_call_pending(&self) -> u128 {
        value(PENDING)
    }
    fn record_transfer_burn(&mut self, owner: &AccountId, amount: u128) {
        put(
            BURNED,
            value(BURNED)
                .checked_add(amount)
                .expect("transfer burn overflow"),
        );
        FtBurn {
            owner_id: owner,
            amount: U128(amount),
            memo: Some("0.5% transfer burn"),
        }
        .emit();
    }
    pub(super) fn taxed_transfer(
        &mut self,
        sender: &AccountId,
        receiver: &AccountId,
        gross: u128,
        memo: Option<String>,
    ) {
        require!(
            sender != receiver,
            "Sender and receiver should be different"
        );
        require!(gross > 0, "The amount should be a positive number");
        require!(
            self.ft.internal_unwrap_balance_of(sender) >= gross,
            "gross transfer balance"
        );
        self.ft.internal_unwrap_balance_of(receiver);
        let (net, fee) = amounts(gross, self.transfer_burn_enabled());
        if fee > 0 {
            self.ft.internal_withdraw(sender, fee);
            self.record_transfer_burn(sender, fee);
        }
        self.ft.internal_transfer(sender, receiver, net, memo);
        self.backed();
    }
    pub(super) fn taxed_transfer_call(
        &mut self,
        receiver: AccountId,
        gross: u128,
        memo: Option<String>,
        msg: String,
    ) -> PromiseOrValue<U128> {
        assert_one_yocto();
        let sender = env::predecessor_account_id();
        let (net, fee) = amounts(gross, self.transfer_burn_enabled());
        if fee == 0 {
            return self.ft.ft_transfer_call(receiver, U128(gross), memo, msg);
        }
        require!(
            sender != receiver,
            "Sender and receiver should be different"
        );
        require!(
            self.ft.internal_unwrap_balance_of(&sender) >= gross,
            "gross transfer balance"
        );
        self.ft.internal_unwrap_balance_of(&receiver);
        require!(value(PENDING) < MAX_PENDING, "transfer callbacks busy");
        require!(
            env::prepaid_gas() >= Gas::from_tgas(50),
            "attach at least50Tgas"
        );
        // Accepted game days own this native settlement reserve. A public FT
        // callback may use only the remaining balance, including its new rent.
        self.require_transfer_call_storage();
        let call_id = u64::try_from(value(NEXT)).expect("call ID overflow");
        let next = call_id.checked_add(1).expect("call ID overflow");
        put(NEXT, u128::from(next));
        let vault = env::current_account_id();
        let call = FeeCall {
            sender: sender.clone(),
            receiver: receiver.clone(),
            gross,
            net,
            fee,
        };
        require!(
            !env::storage_has_key(&call_key(call_id)),
            "duplicate fee call"
        );
        env::storage_write(
            &call_key(call_id),
            &near_sdk::borsh::to_vec(&call).expect("fee encode"),
        );
        put(PENDING, value(PENDING) + 1);
        put(
            RESERVED,
            value(RESERVED)
                .checked_add(fee)
                .expect("fee reserve overflow"),
        );
        self.require_transfer_call_storage();
        self.ft.internal_transfer(&sender, &receiver, net, memo);
        self.ft
            .internal_transfer(&sender, &vault, fee, Some("transfer fee reserve".into()));
        self.backed();
        ext_ft_receiver::ext(receiver)
            .with_unused_gas_weight(1)
            .ft_on_transfer(sender, U128(net), msg)
            .then(
                ext_burn_resolver::ext(vault)
                    .with_static_gas(Gas::from_tgas(25))
                    .with_unused_gas_weight(0)
                    .resolve_transfer_burn(call_id),
            )
            .into()
    }
}
