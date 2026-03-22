use soroban_sdk::{contracttype, Address, String, Vec};

/// Keys for instance storage (global config, loaded on every invocation)
#[contracttype]
pub enum DataKey {
    Admin,
    Config,
    BookCount,
    MemberCount,
}

/// Keys for persistent storage (per-book)
#[contracttype]
pub enum BookKey {
    Book(u32),
}

/// Keys for persistent storage (per-member and per-borrow)
#[contracttype]
pub enum MemberKey {
    Member(Address),
    Borrow(Address, u32),
    History(Address),
    MemberIndex(u32),
}

/// Global library configuration
#[contracttype]
#[derive(Clone)]
pub struct Config {
    pub membership_fee: i128,
    pub max_books_per_member: u32,
    pub loan_duration_ledgers: u32,
    pub late_fee_per_ledger: i128,
    pub max_late_fee: i128,
}

/// A book in the catalog
#[contracttype]
#[derive(Clone)]
pub struct BookRecord {
    pub id: u32,
    pub title: String,
    pub author: String,
    pub genre: String,
    pub total_copies: u32,
    pub available_copies: u32,
    pub is_active: bool,
}

/// A registered library member
#[contracttype]
#[derive(Clone)]
pub struct MemberRecord {
    pub address: Address,
    pub name: String,
    pub email: String,
    pub borrowed_book_ids: Vec<u32>,
    pub is_active: bool,
    pub registered_at: u32,
}

/// A single borrow transaction
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct BorrowRecord {
    pub book_id: u32,
    pub borrowed_at: u32,
    pub due_at: u32,
    pub returned: bool,
    pub renewed: bool,
}
