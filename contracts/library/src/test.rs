#![cfg(test)]
extern crate std;

use soroban_sdk::{testutils::Address as _, testutils::Ledger as _, Address, Env, String};

use crate::contract::{Library, LibraryClient};
use crate::error::Error;
use crate::xlm;

fn setup(env: &Env) -> (Address, LibraryClient) {
    let admin = Address::generate(env);
    env.mock_all_auths();
    let contract_id = env.register(Library, (&admin,));
    env.set_auths(&[]);
    (admin, LibraryClient::new(env, &contract_id))
}

fn fund_account(env: &Env, client: &LibraryClient, account: &Address) {
    let xlm_addr = env.as_contract(&client.address, || xlm::contract_id(env));
    let sac = soroban_sdk::token::StellarAssetClient::new(env, &xlm_addr);
    sac.mint(account, &xlm::to_stroops(1_000));
}

fn add_sample_book(env: &Env, client: &LibraryClient) -> u32 {
    client.add_book(
        &String::from_str(env, "Book"),
        &String::from_str(env, "Author"),
        &String::from_str(env, "Genre"),
        &1,
    )
}

fn register_user(env: &Env, client: &LibraryClient, user: &Address) {
    fund_account(env, client, user);
    client.register_member(
        user,
        &String::from_str(env, "Test User"),
        &String::from_str(env, "test@example.com"),
    );
}

// ─── Original Tests ────────────────────────────────────────────

#[test]
fn test_constructor() {
    let env = Env::default();
    let (admin, client) = setup(&env);

    assert_eq!(client.admin(), Some(admin));
    let config = client.config();
    assert_eq!(config.membership_fee, xlm::to_stroops(1));
    assert_eq!(config.max_books_per_member, 3);
    assert_eq!(config.max_late_fee, xlm::to_stroops(10));
}

#[test]
fn test_add_book() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    let id = client.add_book(
        &String::from_str(&env, "The Rust Book"),
        &String::from_str(&env, "Steve Klabnik"),
        &String::from_str(&env, "Programming"),
        &5,
    );
    assert_eq!(id, 0);

    let book = client.get_book(&0);
    assert_eq!(book.title, String::from_str(&env, "The Rust Book"));
    assert_eq!(book.total_copies, 5);
    assert_eq!(book.available_copies, 5);
    assert!(book.is_active);
}

#[test]
fn test_update_book() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    client.add_book(
        &String::from_str(&env, "Old Title"),
        &String::from_str(&env, "Author"),
        &String::from_str(&env, "Genre"),
        &3,
    );

    client.update_book(
        &0,
        &String::from_str(&env, "New Title"),
        &String::from_str(&env, "Author"),
        &String::from_str(&env, "Genre"),
        &5,
    );

    let book = client.get_book(&0);
    assert_eq!(book.title, String::from_str(&env, "New Title"));
    assert_eq!(book.total_copies, 5);
    assert_eq!(book.available_copies, 5);
}

#[test]
fn test_remove_book() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    add_sample_book(&env, &client);
    client.remove_book(&0);

    let book = client.get_book(&0);
    assert!(!book.is_active);

    let books = client.get_books(&0, &10);
    assert_eq!(books.len(), 0);
}

#[test]
fn test_register_member() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    let user = Address::generate(&env);
    register_user(&env, &client, &user);

    let member = client.get_member(&user);
    assert!(member.is_active);
    assert_eq!(member.name, String::from_str(&env, "Test User"));
    assert_eq!(member.borrowed_book_ids.len(), 0);
}

#[test]
fn test_cannot_register_twice() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    let user = Address::generate(&env);
    register_user(&env, &client, &user);

    let result = client.try_register_member(
        &user,
        &String::from_str(&env, "Dupe"),
        &String::from_str(&env, ""),
    );
    assert_eq!(result, Err(Ok(Error::AlreadyAMember)));
}

#[test]
fn test_borrow_book() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    client.add_book(
        &String::from_str(&env, "Book"),
        &String::from_str(&env, "Author"),
        &String::from_str(&env, "Genre"),
        &2,
    );

    let user = Address::generate(&env);
    register_user(&env, &client, &user);

    let borrow = client.borrow_book(&user, &0);
    assert_eq!(borrow.book_id, 0);
    assert!(!borrow.returned);
    assert!(!borrow.renewed);

    let book = client.get_book(&0);
    assert_eq!(book.available_copies, 1);

    let member = client.get_member(&user);
    assert_eq!(member.borrowed_book_ids.len(), 1);
}

#[test]
fn test_max_borrows_enforced() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    for _ in 0..4u32 {
        add_sample_book(&env, &client);
    }

    let user = Address::generate(&env);
    register_user(&env, &client, &user);

    client.borrow_book(&user, &0);
    client.borrow_book(&user, &1);
    client.borrow_book(&user, &2);

    let result = client.try_borrow_book(&user, &3);
    assert_eq!(result, Err(Ok(Error::MaxBorrowsReached)));
}

#[test]
fn test_return_book_no_late_fee() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    add_sample_book(&env, &client);

    let user = Address::generate(&env);
    register_user(&env, &client, &user);
    client.borrow_book(&user, &0);

    let fee = client.return_book(&user, &0);
    assert_eq!(fee, 0);

    let book = client.get_book(&0);
    assert_eq!(book.available_copies, 1);

    let member = client.get_member(&user);
    assert_eq!(member.borrowed_book_ids.len(), 0);
}

#[test]
fn test_return_book_with_late_fee() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    add_sample_book(&env, &client);

    let user = Address::generate(&env);
    register_user(&env, &client, &user);
    client.borrow_book(&user, &0);

    let config = client.config();
    let current = env.ledger().sequence();
    let overdue_ledgers = 100u32;
    env.ledger()
        .set_sequence_number(current + config.loan_duration_ledgers + overdue_ledgers);

    let fee = client.return_book(&user, &0);
    let expected_fee = (overdue_ledgers as i128) * config.late_fee_per_ledger;
    assert_eq!(fee, expected_fee);
}

#[test]
fn test_cannot_borrow_inactive_book() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    add_sample_book(&env, &client);
    client.remove_book(&0);

    let user = Address::generate(&env);
    register_user(&env, &client, &user);

    let result = client.try_borrow_book(&user, &0);
    assert_eq!(result, Err(Ok(Error::BookInactive)));
}

#[test]
fn test_cannot_borrow_unavailable_book() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    add_sample_book(&env, &client);

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    register_user(&env, &client, &user1);
    register_user(&env, &client, &user2);

    client.borrow_book(&user1, &0);

    let result = client.try_borrow_book(&user2, &0);
    assert_eq!(result, Err(Ok(Error::BookNotAvailable)));
}

#[test]
fn test_deactivate_member() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    let user = Address::generate(&env);
    register_user(&env, &client, &user);

    client.deactivate_member(&user);

    let member = client.get_member(&user);
    assert!(!member.is_active);
}

#[test]
fn test_get_books_pagination() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    for _ in 0..5u32 {
        add_sample_book(&env, &client);
    }

    let page1 = client.get_books(&0, &3);
    assert_eq!(page1.len(), 3);

    let page2 = client.get_books(&3, &3);
    assert_eq!(page2.len(), 2);
}

#[test]
fn test_update_config() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    let new_config = crate::types::Config {
        membership_fee: xlm::to_stroops(2),
        max_books_per_member: 5,
        loan_duration_ledgers: 200_000,
        late_fee_per_ledger: 2_000,
        max_late_fee: xlm::to_stroops(20),
    };

    client.update_config(&new_config);

    let config = client.config();
    assert_eq!(config.membership_fee, xlm::to_stroops(2));
    assert_eq!(config.max_books_per_member, 5);
    assert_eq!(config.max_late_fee, xlm::to_stroops(20));
}

// ─── New Tests ─────────────────────────────────────────────────

#[test]
fn test_add_book_zero_copies() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    let result = client.try_add_book(
        &String::from_str(&env, "Book"),
        &String::from_str(&env, "Author"),
        &String::from_str(&env, "Genre"),
        &0,
    );
    assert_eq!(result, Err(Ok(Error::InvalidInput)));
}

#[test]
fn test_add_book_empty_title() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    let result = client.try_add_book(
        &String::from_str(&env, ""),
        &String::from_str(&env, "Author"),
        &String::from_str(&env, "Genre"),
        &1,
    );
    assert_eq!(result, Err(Ok(Error::InvalidInput)));
}

#[test]
fn test_update_book_below_borrowed() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    client.add_book(
        &String::from_str(&env, "Book"),
        &String::from_str(&env, "Author"),
        &String::from_str(&env, "Genre"),
        &3,
    );

    let user = Address::generate(&env);
    register_user(&env, &client, &user);
    client.borrow_book(&user, &0);
    // 1 copy borrowed out of 3, try to set total to 0 (invalid) gets InvalidInput
    // try to set total to 1 when 1 is borrowed — that's fine (available = 0)
    // So borrow 2 copies via 2 users
    let user2 = Address::generate(&env);
    register_user(&env, &client, &user2);
    client.borrow_book(&user2, &0);
    // 2 copies borrowed out of 3, try to set total to 1
    let result = client.try_update_book(
        &0,
        &String::from_str(&env, "Book"),
        &String::from_str(&env, "Author"),
        &String::from_str(&env, "Genre"),
        &1,
    );
    assert_eq!(result, Err(Ok(Error::InvalidCopies)));
}

#[test]
fn test_late_fee_capped() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    add_sample_book(&env, &client);

    let user = Address::generate(&env);
    register_user(&env, &client, &user);
    client.borrow_book(&user, &0);

    let config = client.config();
    let current = env.ledger().sequence();
    // Advance 1,000,000 ledgers overdue — raw fee would be huge
    env.ledger()
        .set_sequence_number(current + config.loan_duration_ledgers + 1_000_000);

    let fee = client.return_book(&user, &0);
    // Fee should be capped at max_late_fee
    assert_eq!(fee, config.max_late_fee);
}

#[test]
fn test_renew_book() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    add_sample_book(&env, &client);

    let user = Address::generate(&env);
    register_user(&env, &client, &user);
    let borrow = client.borrow_book(&user, &0);

    let config = client.config();
    let renewed = client.renew_book(&user, &0);
    assert_eq!(renewed.due_at, borrow.due_at + config.loan_duration_ledgers);
    assert!(renewed.renewed);
}

#[test]
fn test_renew_overdue_fails() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    add_sample_book(&env, &client);

    let user = Address::generate(&env);
    register_user(&env, &client, &user);
    client.borrow_book(&user, &0);

    let config = client.config();
    let current = env.ledger().sequence();
    env.ledger()
        .set_sequence_number(current + config.loan_duration_ledgers + 100);

    let result = client.try_renew_book(&user, &0);
    assert_eq!(result, Err(Ok(Error::BookOverdue)));
}

#[test]
fn test_renew_twice_fails() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    add_sample_book(&env, &client);

    let user = Address::generate(&env);
    register_user(&env, &client, &user);
    client.borrow_book(&user, &0);

    client.renew_book(&user, &0);

    let result = client.try_renew_book(&user, &0);
    assert_eq!(result, Err(Ok(Error::AlreadyRenewed)));
}

#[test]
fn test_borrow_history_after_return() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    add_sample_book(&env, &client);

    let user = Address::generate(&env);
    register_user(&env, &client, &user);
    client.borrow_book(&user, &0);
    client.return_book(&user, &0);

    let history = client.get_borrow_history(&user);
    assert_eq!(history.len(), 1);
    let entry = history.get(0).unwrap();
    assert_eq!(entry.book_id, 0);
    assert!(entry.returned);
}

#[test]
fn test_borrow_same_book_twice_fails() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    client.add_book(
        &String::from_str(&env, "Book"),
        &String::from_str(&env, "Author"),
        &String::from_str(&env, "Genre"),
        &5,
    );

    let user = Address::generate(&env);
    register_user(&env, &client, &user);
    client.borrow_book(&user, &0);

    let result = client.try_borrow_book(&user, &0);
    assert_eq!(result, Err(Ok(Error::AlreadyBorrowedThisBook)));
}

#[test]
fn test_register_member_with_profile() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    let user = Address::generate(&env);
    fund_account(&env, &client, &user);
    client.register_member(
        &user,
        &String::from_str(&env, "Alice"),
        &String::from_str(&env, "alice@example.com"),
    );

    let member = client.get_member(&user);
    assert_eq!(member.name, String::from_str(&env, "Alice"));
    assert_eq!(member.email, String::from_str(&env, "alice@example.com"));
    assert!(member.is_active);
}

#[test]
fn test_get_members_pagination() {
    let env = Env::default();
    let (_admin, client) = setup(&env);
    env.mock_all_auths();

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let user3 = Address::generate(&env);
    register_user(&env, &client, &user1);
    register_user(&env, &client, &user2);
    register_user(&env, &client, &user3);

    let page1 = client.get_members(&0, &2);
    assert_eq!(page1.len(), 2);

    let page2 = client.get_members(&2, &2);
    assert_eq!(page2.len(), 1);

    let all = client.get_members(&0, &10);
    assert_eq!(all.len(), 3);
}
