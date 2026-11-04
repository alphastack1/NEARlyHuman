use super::*;
use near_sdk::{
    PromiseResult,
    test_utils::{VMContextBuilder, get_created_receipts, get_logs},
    testing_env,
};
fn acc(s: &str) -> AccountId {
    s.parse().unwrap()
}
fn builder(who: &str, deposit: u128) -> VMContextBuilder {
    let mut b = VMContextBuilder::new();
    b.current_account_id(acc("game.testnet"))
        .predecessor_account_id(acc(who))
        .signer_account_id(acc(who))
        .attached_deposit(NearToken::from_yoctonear(deposit))
        .prepaid_gas(Gas::from_tgas(300))
        .account_balance(NearToken::from_near(100))
        .block_timestamp(100_000_000_000);
    b
}
fn ctx(who: &str, deposit: u128) {
    testing_env!(builder(who, deposit).build());
}
fn fresh() -> Contract {
    near_sdk::mock::with_mocked_blockchain(|b| {
        b.take_storage();
    });
    ctx("owner.testnet", 0);
    let mut c = Contract::new(
        acc("owner.testnet"),
        acc("relay.testnet"),
        Base64VecU8(vec![1; 32]),
        U128(STORAGE),
        hx(&[2; 32]),
        "https://nearlyhuman.netlify.app".into(),
    );
    for a in ["alice.testnet", "bob.testnet", "recv.testnet"] {
        c.ft.internal_register_account(&acc(a));
    }
    c
}
fn fund(c: &mut Contract, who: &str, amount: u128) {
    c.ft.internal_deposit(&acc(who), amount);
}
fn balance(c: &Contract, who: &str) -> u128 {
    c.ft.ft_balance_of(acc(who)).0
}
fn result(value: PromiseResult) {
    testing_env!(
        builder("game.testnet", 0).build(),
        near_sdk::test_vm_config(),
        near_sdk::RuntimeFeesConfig::test(),
        std::collections::HashMap::new(),
        vec![value]
    );
}
fn reply(unused: u128) -> PromiseResult {
    PromiseResult::Successful(near_sdk::serde_json::to_vec(&U128(unused)).unwrap())
}
fn transfer_call(c: &mut Contract, gross: u128) {
    ctx("alice.testnet", 1);
    let _ = c.ft_transfer_call(acc("recv.testnet"), U128(gross), None, "probe".into());
}
fn resolve(c: &mut Contract, unused: u128) -> u128 {
    result(reply(unused));
    c.resolve_transfer_burn(0).0
}
fn rejects(f: impl FnOnce()) {
    assert!(std::panic::catch_unwind(std::panic::AssertUnwindSafe(f)).is_err())
}

#[test]
fn default_on_toggle_authority_and_root_layout() {
    let mut c = fresh();
    assert!(c.transfer_burn_enabled());
    let before = near_sdk::borsh::to_vec(&c).unwrap();
    ctx("alice.testnet", 0);
    rejects(|| c.set_transfer_burn_enabled(false));
    ctx("owner.testnet", 0);
    c.set_transfer_burn_enabled(false);
    assert!(!c.transfer_burn_enabled());
    assert_eq!(near_sdk::borsh::to_vec(&c).unwrap(), before);
    assert_eq!(c.config()["transfer_burn_bps"], 50);
    c.set_transfer_burn_enabled(true);
    assert!(c.transfer_burn_enabled());
}
#[test]
fn ordinary_transfer_true_burn_and_no_privileged_wallet_exemption() {
    let mut c = fresh();
    fund(&mut c, "alice.testnet", 100 * UNIT);
    let supply = c.ft.total_supply;
    ctx("alice.testnet", 1);
    c.ft_transfer(acc("bob.testnet"), U128(100 * UNIT), None);
    assert_eq!(balance(&c, "alice.testnet"), 0);
    assert_eq!(balance(&c, "bob.testnet"), 99_500_000);
    assert_eq!(c.ft.total_supply, supply - 500_000);
    assert_eq!(c.total_transfer_burned().0, 500_000);
    assert!(get_logs().iter().any(|s| s.contains("ft_burn")));
}
#[test]
fn disabled_transfer_exact_amount_and_dust_rounding() {
    let mut c = fresh();
    fund(&mut c, "alice.testnet", 1000);
    ctx("alice.testnet", 1);
    c.ft_transfer(acc("bob.testnet"), U128(199), None);
    assert_eq!(balance(&c, "bob.testnet"), 199);
    assert_eq!(c.total_transfer_burned().0, 0);
    c.ft_transfer(acc("bob.testnet"), U128(200), None);
    assert_eq!(balance(&c, "bob.testnet"), 398);
    assert_eq!(c.total_transfer_burned().0, 1);
    ctx("owner.testnet", 0);
    c.set_transfer_burn_enabled(false);
    ctx("alice.testnet", 1);
    c.ft_transfer(acc("bob.testnet"), U128(200), None);
    assert_eq!(balance(&c, "bob.testnet"), 598);
    assert_eq!(c.total_transfer_burned().0, 1);
}
#[test]
fn near_standard_self_zero_and_gross_balance_requirements() {
    let mut c = fresh();
    fund(&mut c, "alice.testnet", 199);
    ctx("alice.testnet", 1);
    rejects(|| c.ft_transfer(acc("alice.testnet"), U128(199), None));
    rejects(|| c.ft_transfer(acc("bob.testnet"), U128(0), None));
    rejects(|| c.ft_transfer(acc("bob.testnet"), U128(200), None));
    assert_eq!(balance(&c, "alice.testnet"), 199);
    assert_eq!(c.total_transfer_burned().0, 0);
}
#[test]
fn full_success_reserves_then_burns_and_refunds_nothing() {
    let mut c = fresh();
    fund(&mut c, "alice.testnet", 1000);
    let supply = c.ft.total_supply;
    transfer_call(&mut c, 1000);
    assert_eq!(balance(&c, "recv.testnet"), 995);
    assert_eq!(balance(&c, "game.testnet"), 5);
    assert_eq!(c.ft.total_supply, supply);
    assert_eq!(c.transfer_call_reserved(), 5);
    assert_eq!(c.transfer_call_pending(), 1);
    assert!(!get_created_receipts().is_empty());
    assert_eq!(resolve(&mut c, 0), 1000);
    assert_eq!(c.ft.total_supply, supply - 5);
    assert_eq!(c.total_transfer_burned().0, 5);
    assert_eq!(c.transfer_call_reserved(), 0);
    assert_eq!(c.transfer_call_pending(), 0);
}
#[test]
fn full_failure_restores_gross_without_tax() {
    let mut c = fresh();
    fund(&mut c, "alice.testnet", 1000);
    let supply = c.ft.total_supply;
    transfer_call(&mut c, 1000);
    result(PromiseResult::Failed);
    assert_eq!(c.resolve_transfer_burn(0).0, 0);
    assert_eq!(balance(&c, "alice.testnet"), 1000);
    assert_eq!(balance(&c, "recv.testnet"), 0);
    assert_eq!(balance(&c, "game.testnet"), 0);
    assert_eq!(c.ft.total_supply, supply);
    assert_eq!(c.total_transfer_burned().0, 0);
}
#[test]
fn partial_use_charges_exact_gross_fee_and_refunds_rest() {
    let mut c = fresh();
    fund(&mut c, "alice.testnet", 1000);
    transfer_call(&mut c, 1000);
    assert_eq!(resolve(&mut c, 497), 500);
    assert_eq!(balance(&c, "recv.testnet"), 498);
    assert_eq!(balance(&c, "alice.testnet"), 500);
    assert_eq!(c.total_transfer_burned().0, 2);
    assert_eq!(balance(&c, "game.testnet"), 0);
}
#[test]
fn partial_rounding_is_overflow_safe_and_exact_for_used_gross() {
    for gross in [0, 1, 199, 200, 201, 399, 400, 1000, 100_000_000, u128::MAX] {
        let fee = gross / 200;
        let net = gross - fee;
        for used in [0, net / 4, net / 2, net.saturating_sub(1), net] {
            let burned = fee.min(used / 199);
            let charged = used.checked_add(burned).unwrap();
            assert!(charged <= gross);
            assert_eq!(charged / 200, burned);
            if used == 0 {
                assert_eq!(burned, 0)
            }
            if used == net {
                assert_eq!(burned, fee)
            }
        }
    }
}
#[test]
fn malformed_and_excess_unused_replies_are_clamped() {
    for malformed in [true, false] {
        let mut c = fresh();
        fund(&mut c, "alice.testnet", 1000);
        transfer_call(&mut c, 1000);
        result(if malformed {
            PromiseResult::Successful(b"not a U128".to_vec())
        } else {
            reply(u128::MAX)
        });
        assert_eq!(c.resolve_transfer_burn(0).0, 0);
        assert_eq!(balance(&c, "alice.testnet"), 1000);
        assert_eq!(c.total_transfer_burned().0, 0);
    }
}
#[test]
fn receiver_balance_changes_cannot_take_vault_backing() {
    let mut c = fresh();
    fund(&mut c, "alice.testnet", 1000);
    fund(&mut c, "game.testnet", 10000);
    c.allocated = 10000;
    transfer_call(&mut c, 1000);
    c.ft.internal_transfer(&acc("recv.testnet"), &acc("bob.testnet"), 900, None);
    assert_eq!(resolve(&mut c, 995), 904);
    assert_eq!(balance(&c, "alice.testnet"), 96);
    assert_eq!(balance(&c, "game.testnet"), 10000);
    assert_eq!(c.total_transfer_burned().0, 4);
    c.backed();
}
#[test]
fn duplicate_callback_is_consumed_once_and_toggle_does_not_reprice() {
    let mut c = fresh();
    fund(&mut c, "alice.testnet", 1000);
    transfer_call(&mut c, 1000);
    ctx("owner.testnet", 0);
    c.set_transfer_burn_enabled(false);
    assert_eq!(resolve(&mut c, 0), 1000);
    let snapshot = (
        c.ft.total_supply,
        c.total_transfer_burned().0,
        balance(&c, "recv.testnet"),
    );
    assert_eq!(resolve(&mut c, 995), 0);
    assert_eq!(
        (
            c.ft.total_supply,
            c.total_transfer_burned().0,
            balance(&c, "recv.testnet")
        ),
        snapshot
    );
}
#[test]
fn sender_unregister_refund_is_burned_without_extra_transfer_fee() {
    let mut c = fresh();
    fund(&mut c, "alice.testnet", 1000);
    transfer_call(&mut c, 1000);
    ctx("alice.testnet", 1);
    assert!(c.storage_unregister(Some(true)));
    assert_eq!(resolve(&mut c, 995), 1000);
    assert_eq!(balance(&c, "recv.testnet"), 0);
    assert_eq!(balance(&c, "game.testnet"), 0);
    assert_eq!(c.ft.total_supply, 0);
    assert_eq!(c.total_transfer_burned().0, 0);
    assert_eq!(c.unregister_burns, 1000);
}
#[test]
fn vault_cannot_use_public_transfer_paths() {
    let mut c = fresh();
    fund(&mut c, "game.testnet", 1000);
    ctx("game.testnet", 1);
    rejects(|| c.ft_transfer(acc("alice.testnet"), U128(1000), None));
    rejects(|| {
        let _ = c.ft_transfer_call(acc("alice.testnet"), U128(1000), None, "".into());
    });
    assert_eq!(balance(&c, "game.testnet"), 1000);
}
#[test]
fn receiver_unregister_burns_its_balance_without_using_other_purses() {
    let mut c = fresh();
    fund(&mut c, "alice.testnet", 1000);
    fund(&mut c, "game.testnet", 5000);
    c.allocated = 5000;
    transfer_call(&mut c, 1000);
    ctx("recv.testnet", 1);
    assert!(c.storage_unregister(Some(true)));
    assert_eq!(resolve(&mut c, 995), 1000);
    assert_eq!(c.total_transfer_burned().0, 5);
    assert_eq!(c.unregister_burns, 995);
    assert_eq!(balance(&c, "game.testnet"), 5000);
    c.backed();
}
#[test]
fn maximum_u128_callback_conserves_supply_without_multiplication() {
    let mut c = fresh();
    fund(&mut c, "alice.testnet", u128::MAX);
    transfer_call(&mut c, u128::MAX);
    assert_eq!(resolve(&mut c, 0), u128::MAX);
    assert_eq!(c.total_transfer_burned().0, u128::MAX / 200);
    assert_eq!(c.ft.total_supply, u128::MAX - u128::MAX / 200);
}
#[test]
fn private_callback_and_bounded_pending_queue() {
    let mut c = fresh();
    fund(&mut c, "alice.testnet", 33000);
    for _ in 0..32 {
        transfer_call(&mut c, 1000);
    }
    ctx("alice.testnet", 1);
    let before = (
        balance(&c, "alice.testnet"),
        balance(&c, "recv.testnet"),
        balance(&c, "game.testnet"),
    );
    rejects(|| {
        let _ = c.ft_transfer_call(acc("recv.testnet"), U128(1000), None, "".into());
    });
    assert_eq!(
        (
            balance(&c, "alice.testnet"),
            balance(&c, "recv.testnet"),
            balance(&c, "game.testnet")
        ),
        before
    );
    rejects(|| {
        let _ = c.resolve_transfer_burn(0);
    });
    assert_eq!(c.transfer_call_pending(), 32);
}
#[test]
fn disabled_transfer_call_uses_legacy_resolver_without_retroactive_fee() {
    let mut c = fresh();
    fund(&mut c, "alice.testnet", 1000);
    ctx("owner.testnet", 0);
    c.set_transfer_burn_enabled(false);
    transfer_call(&mut c, 1000);
    assert_eq!(c.transfer_call_reserved(), 0);
    ctx("owner.testnet", 0);
    c.set_transfer_burn_enabled(true);
    result(reply(0));
    assert_eq!(
        c.ft_resolve_transfer(acc("alice.testnet"), acc("recv.testnet"), U128(1000))
            .0,
        1000
    );
    assert_eq!(c.total_transfer_burned().0, 0);
    assert_eq!(balance(&c, "recv.testnet"), 1000);
}
#[test]
fn transfer_call_storage_cannot_consume_accepted_day_native_reserve() {
    let mut c = fresh();
    fund(&mut c, "alice.testnet", 1000);
    c.native_storage_reserved = 3 * 10u128.pow(24);
    let usage = env::storage_usage();
    let rent = u128::from(usage) * env::storage_byte_cost().as_yoctonear();
    let mut b = builder("alice.testnet", 1);
    b.storage_usage(usage);
    b.account_balance(NearToken::from_yoctonear(
        // The mock runtime adds the attached one yocto to account_balance.
        rent + c.native_storage_reserved + 20_000_000_000_000_000_000_000 - 2,
    ));
    testing_env!(b.build());
    let before = (
        balance(&c, "alice.testnet"),
        balance(&c, "recv.testnet"),
        balance(&c, "game.testnet"),
        c.ft.total_supply,
        env::storage_usage(),
    );
    rejects(|| {
        let _ = c.ft_transfer_call(acc("recv.testnet"), U128(1000), None, "probe".into());
    });
    assert_eq!(
        (
            balance(&c, "alice.testnet"),
            balance(&c, "recv.testnet"),
            balance(&c, "game.testnet"),
            c.ft.total_supply,
            env::storage_usage(),
        ),
        before
    );
    assert_eq!(c.native_storage_reserved, 3 * 10u128.pow(24));
    assert_eq!(c.transfer_call_reserved(), 0);
    assert_eq!(c.transfer_call_pending(), 0);
    assert_eq!(c.total_transfer_burned().0, 0);
}
#[test]
fn taxed_purse_withdraw_is_gross_and_birth_burns_remain_direct() {
    let mut c = fresh();
    ctx("alice.testnet", STORAGE);
    let token = c.mint_nft("PIP".into(), [2, 2, 1], hx(&[3; 32]), acc("alice.testnet"));
    let mut life = c.must_life(&token);
    life.purse = 600 * UNIT;
    c.lives.insert(&token, &life);
    c.allocated = 600 * UNIT;
    fund(&mut c, "game.testnet", 600 * UNIT);
    ctx("alice.testnet", STORAGE);
    c.withdraw(
        token.clone(),
        U128(100 * UNIT),
        hx(&[4; 32]),
        acc("alice.testnet"),
    );
    assert_eq!(c.must_life(&token).purse, 500 * UNIT);
    assert_eq!(c.allocated, 500 * UNIT);
    assert_eq!(balance(&c, "game.testnet"), 500 * UNIT);
    assert_eq!(balance(&c, "alice.testnet"), 99_500_000);
    assert_eq!(c.total_transfer_burned().0, 500_000);
    ctx("alice.testnet", STORAGE);
    let child = c.birth_from_purse(
        token.clone(),
        "1".into(),
        "PIP2".into(),
        [2, 2, 1],
        hx(&[5; 32]),
        acc("alice.testnet"),
    );
    assert_ne!(child, token);
    assert_eq!(c.allocated, 250 * UNIT);
    assert_eq!(balance(&c, "game.testnet"), 250 * UNIT);
    assert_eq!(c.total_transfer_burned().0, 500_000);
    fund(&mut c, "alice.testnet", 250 * UNIT);
    ctx("alice.testnet", STORAGE);
    let _ = c.birth_from_wallet("PIP3".into(), [2, 2, 1], hx(&[6; 32]), acc("alice.testnet"));
    assert_eq!(c.allocated, 250 * UNIT);
    assert_eq!(balance(&c, "game.testnet"), 250 * UNIT);
    assert_eq!(c.total_transfer_burned().0, 500_000);
    assert_eq!(c.burns, 500 * UNIT);
    c.backed();
}
