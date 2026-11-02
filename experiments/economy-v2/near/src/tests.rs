use super::*;
use near_sdk::{testing_env, PromiseResult, test_utils::VMContextBuilder};
use std::panic::{catch_unwind, AssertUnwindSafe};

fn account(s:&str)->AccountId {s.parse().unwrap()}
fn context(predecessor:&str,deposit:u128,results:Vec<PromiseResult>) {
    let mut b=VMContextBuilder::new();
    b.current_account_id(account("game.testnet")).predecessor_account_id(account(predecessor))
        .signer_account_id(account("alice.testnet")).attached_deposit(NearToken::from_yoctonear(deposit))
        .prepaid_gas(Gas::from_tgas(300)).account_balance(NearToken::from_near(100));
    testing_env!(b.build(),near_sdk::test_vm_config(),near_sdk::RuntimeFeesConfig::test(),HashMap::new(),results);
}
fn reject(f:impl FnOnce()) {assert!(catch_unwind(AssertUnwindSafe(f)).is_err());}

fn fixture(balance:u128)->Contract {
    near_sdk::mock::with_mocked_blockchain(|b| {b.take_storage();});
    context("game.testnet",0,vec![]);
    let mut c=Contract::new();
    assert!(!c.transfer_call_enabled());
    c.transfer_calls_enabled=true;
    c.ft.internal_register_account(&account("alice.testnet"));
    c.ft.internal_register_account(&account("bob.testnet"));
    c.nft.internal_mint_with_refund("0".into(),account("alice.testnet"),None,None);
    c.lives.insert(&"0".into(),&Life {purse:0,alive:true,ai_pending:false,intent_nonce:0});
    credit(&mut c,balance);
    c
}
fn credit(c:&mut Contract,amount:u128) {
    let mut life=c.life(&"0".into());
    c.ft.internal_deposit(&account("game.testnet"),amount);
    c.issued=c.issued.checked_add(amount).unwrap();
    life.purse+=amount;c.total_allocated+=amount;c.lives.insert(&"0".into(),&life);
}
fn conserved(c:&Contract) {
    assert_eq!(c.ft_balance_of(account("game.testnet")).0,c.total_allocated);
    let wallets=c.ft_balance_of(account("alice.testnet")).0+c.ft_balance_of(account("bob.testnet")).0;
    assert_eq!(c.ft_total_supply().0,c.total_allocated+wallets);
}
fn start_transfer(c:&mut Contract) {
    context("alice.testnet",1,vec![]);
    let _=c.nft_transfer_call(account("bob.testnet"),"0".into(),None,None,"probe".into());
    assert!(c.transfer_in_flight("0".into()));
    assert_eq!(c.nft_token("0".into()).unwrap().owner_id,account("bob.testnet"));
}
fn resolve(c:&mut Contract,result:PromiseResult)->bool {
    context("game.testnet",0,vec![result]);
    c.nft_resolve_transfer(account("alice.testnet"),account("bob.testnet"),"0".into(),Some(HashMap::new()))
}

#[test]
fn combined_interfaces_and_exact_quote() {
    let c=fixture(50_000*U);
    assert_eq!(c.ft_metadata().decimals,6);
    assert_eq!(c.nft_metadata().spec,"nft-1.0.0");
    assert_eq!(c.quote_decipoints(1360).0,68*U);
    assert_eq!(c.quote_decipoints(65).0,3_250_000);
    assert_eq!(c.nft_token("0".into()).unwrap().owner_id,account("alice.testnet"));
    conserved(&c);
}

#[test]
fn dead_or_ai_pending_purse_stays_withdrawable_and_incremental() {
    for (alive,pending) in [(false,false),(true,true)] {
        let mut c=fixture(100*U);
        let mut l=c.life(&"0".into());l.alive=alive;l.ai_pending=pending;c.lives.insert(&"0".into(),&l);
        context("alice.testnet",1,vec![]);
        c.withdraw("0".into(),U128(40*U));
        credit(&mut c,10*U); // models incremental credit, not a purse snapshot.
        assert_eq!(c.purse_of("0".into()).0,70*U);
        assert_eq!(c.ft_balance_of(account("alice.testnet")).0,40*U);
        assert_eq!(c.lifetime_issued().0,110*U);
        conserved(&c);
    }
}

#[test]
fn immediate_owner_not_signer_or_nft_operator_controls_purse() {
    let mut c=fixture(300*U);
    let mut approvals=HashMap::new();approvals.insert(account("operator.testnet"),1);
    c.nft.approvals_by_id.as_mut().unwrap().insert(&"0".into(),&approvals);
    context("operator.testnet",1,vec![]); // signer remains Alice, predecessor is operator.
    reject(||c.withdraw("0".into(),U128(U)));
    reject(||{c.mint_from_purse("0".into(),0);});
    context("alice.testnet",1,vec![]);
    c.nft_transfer(account("bob.testnet"),"0".into(),None,None);
    assert_eq!(c.life(&"0".into()).intent_nonce,1);
    reject(||c.withdraw("0".into(),U128(U)));
    context("bob.testnet",1,vec![]);c.withdraw("0".into(),U128(U));
    c.nft_transfer(account("alice.testnet"),"0".into(),None,None);
    context("alice.testnet",10u128.pow(24),vec![]);
    reject(||{c.mint_from_purse("0".into(),0);});
    assert_eq!(c.life(&"0".into()).intent_nonce,2);
    conserved(&c);
}

#[test]
fn purse_funded_birth_is_local_burn_and_keeps_pressure() {
    for (alive,pending) in [(false,false),(true,true)] {
        let mut c=fixture(300*U);
        let mut l=c.life(&"0".into());l.alive=alive;l.ai_pending=pending;c.lives.insert(&"0".into(),&l);
        context("alice.testnet",10u128.pow(24),vec![]);
        let child=c.mint_from_purse("0".into(),0);
        assert_eq!(child,"1");assert_eq!(c.nft_token(child.clone()).unwrap().owner_id,account("alice.testnet"));
        assert_eq!(c.purse_of("0".into()).0,50*U);assert_eq!(c.purse_of(child).0,0);
        assert_eq!(c.ft_total_supply().0,50*U);assert_eq!(c.lifetime_issued().0,300*U);
        assert_eq!(c.nft_mint_burns,250*U);assert_eq!(c.life(&"0".into()).intent_nonce,1);
        let logs=near_sdk::test_utils::get_logs();
        assert_eq!(logs.iter().filter(|l|l.contains("\"event\":\"ft_burn\"")).count(),1);
        assert_eq!(logs.iter().filter(|l|l.contains("\"event\":\"nft_mint\"")).count(),1);
        conserved(&c);
    }
}

#[test]
fn tentative_receiver_cannot_drain_spend_start_day_or_forward() {
    let mut c=fixture(300*U);start_transfer(&mut c);
    context("bob.testnet",1,vec![]);
    reject(||c.withdraw("0".into(),U128(U)));
    reject(||{c.mint_from_purse("0".into(),1);});
    reject(||c.begin_day_probe("0".into()));
    reject(||c.nft_transfer(account("alice.testnet"),"0".into(),None,None));
    reject(||{c.nft_resolve_transfer(account("alice.testnet"),account("bob.testnet"),"0".into(),None);});
    assert!(c.transfer_in_flight("0".into()));assert_eq!(c.purse_of("0".into()).0,300*U);
    assert!(!resolve(&mut c,PromiseResult::Successful(b"true".to_vec())));
    assert_eq!(c.actual_owner(&"0".into()),account("alice.testnet"));assert!(!c.transfer_in_flight("0".into()));
    assert_eq!(c.life(&"0".into()).intent_nonce,2);
    conserved(&c);
}

#[test]
fn receiver_accept_failure_and_malformed_results_preserve_standard_resolution() {
    for (result,expected_owner,accepted) in [
        (PromiseResult::Successful(b"false".to_vec()),"bob.testnet",true),
        (PromiseResult::Failed,"alice.testnet",false),
        (PromiseResult::Successful(b"garbage".to_vec()),"alice.testnet",false),
    ] {
        let mut c=fixture(300*U);start_transfer(&mut c);
        assert_eq!(resolve(&mut c,result),accepted);
        assert_eq!(c.actual_owner(&"0".into()),account(expected_owner));
        assert!(!c.transfer_in_flight("0".into()));conserved(&c);
    }
}

#[test]
fn force_unregister_burn_cannot_rewind_pressure_or_erase_purse() {
    let mut c=fixture(300*U);
    context("alice.testnet",1,vec![]);c.withdraw("0".into(),U128(50*U));
    assert!(c.storage_unregister(Some(true)));
    assert_eq!(c.ft_total_supply().0,250*U);assert_eq!(c.lifetime_issued().0,300*U);
    assert_eq!(c.purse_of("0".into()).0,250*U);
    reject(||c.withdraw("0".into(),U128(U)));
    context("alice.testnet",10u128.pow(24),vec![]);c.storage_deposit(None,Some(true));
    context("alice.testnet",1,vec![]);c.withdraw("0".into(),U128(U));
    context("game.testnet",1,vec![]);reject(||{c.storage_unregister(Some(true));});
    conserved(&c);
}

#[test]
fn vault_cannot_use_public_token_methods_or_forged_refund() {
    let mut c=fixture(300*U);
    context("game.testnet",1,vec![]);
    reject(||c.ft_transfer(account("alice.testnet"),U128(U),None));
    reject(||{c.ft_transfer_call(account("alice.testnet"),U128(U),None,"".into());});
    reject(||{c.ft_resolve_transfer(account("game.testnet"),account("alice.testnet"),U128(U));});
    assert_eq!(c.purse_of("0".into()).0,300*U);conserved(&c);
}
