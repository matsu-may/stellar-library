use soroban_sdk::{contract, contractimpl, symbol_short, Address, BytesN, Env, String, Vec};

use crate::error::Error;
use crate::types::*;
use crate::xlm;

#[contract]
pub struct Library;

#[contractimpl]
impl Library {
    /// Initialize the library with an admin and default configuration.
    pub fn __constructor(env: &Env, admin: Address) {
        xlm::register(env, &admin);

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::BookCount, &0u32);
        env.storage().instance().set(&DataKey::MemberCount, &0u32);
        env.storage().instance().set(
            &DataKey::Config,
            &Config {
                membership_fee: xlm::to_stroops(1),
                max_books_per_member: 3,
                loan_duration_ledgers: 120_960,
                late_fee_per_ledger: 1_000,
                max_late_fee: xlm::to_stroops(10),
            },
        );
    }

    // ─── Admin Operations ──────────────────────────────────────────

    /// Update the library configuration.
    pub fn update_config(env: &Env, config: Config) -> Result<(), Error> {
        Self::require_admin(env)?;
        env.storage().instance().set(&DataKey::Config, &config);
        Ok(())
    }

    /// Add a new book to the catalog. Returns the book ID.
    pub fn add_book(
        env: &Env,
        title: String,
        author: String,
        genre: String,
        total_copies: u32,
    ) -> Result<u32, Error> {
        Self::require_admin(env)?;
        Self::validate_book_input(&title, &author, &genre, total_copies)?;

        let id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::BookCount)
            .unwrap_or(0);

        let book = BookRecord {
            id,
            title,
            author,
            genre,
            total_copies,
            available_copies: total_copies,
            is_active: true,
        };

        env.storage().persistent().set(&BookKey::Book(id), &book);
        env.storage()
            .instance()
            .set(&DataKey::BookCount, &(id + 1));

        env.events()
            .publish((symbol_short!("book_add"),), (id, book.title.clone()));

        Ok(id)
    }

    /// Update an existing book's metadata and copy count.
    pub fn update_book(
        env: &Env,
        book_id: u32,
        title: String,
        author: String,
        genre: String,
        total_copies: u32,
    ) -> Result<(), Error> {
        Self::require_admin(env)?;
        Self::validate_book_input(&title, &author, &genre, total_copies)?;

        let mut book: BookRecord = env
            .storage()
            .persistent()
            .get(&BookKey::Book(book_id))
            .ok_or(Error::BookNotFound)?;

        let borrowed = book.total_copies - book.available_copies;
        if total_copies < borrowed {
            return Err(Error::InvalidCopies);
        }

        book.title = title;
        book.author = author;
        book.genre = genre;
        book.total_copies = total_copies;
        book.available_copies = total_copies - borrowed;

        env.storage().persistent().set(&BookKey::Book(book_id), &book);
        Ok(())
    }

    /// Soft-delete a book from the catalog.
    pub fn remove_book(env: &Env, book_id: u32) -> Result<(), Error> {
        Self::require_admin(env)?;

        let mut book: BookRecord = env
            .storage()
            .persistent()
            .get(&BookKey::Book(book_id))
            .ok_or(Error::BookNotFound)?;

        book.is_active = false;
        env.storage().persistent().set(&BookKey::Book(book_id), &book);
        Ok(())
    }

    /// Deactivate a member.
    pub fn deactivate_member(env: &Env, member: Address) -> Result<(), Error> {
        Self::require_admin(env)?;

        let mut rec: MemberRecord = env
            .storage()
            .persistent()
            .get(&MemberKey::Member(member.clone()))
            .ok_or(Error::NotAMember)?;

        rec.is_active = false;
        env.storage()
            .persistent()
            .set(&MemberKey::Member(member), &rec);
        Ok(())
    }

    /// Reactivate a deactivated member.
    pub fn reactivate_member(env: &Env, member: Address) -> Result<(), Error> {
        Self::require_admin(env)?;

        let mut rec: MemberRecord = env
            .storage()
            .persistent()
            .get(&MemberKey::Member(member.clone()))
            .ok_or(Error::NotAMember)?;

        rec.is_active = true;
        env.storage()
            .persistent()
            .set(&MemberKey::Member(member), &rec);
        Ok(())
    }

    /// Withdraw collected fees to the admin address.
    pub fn withdraw_fees(env: &Env, amount: i128) -> Result<(), Error> {
        Self::require_admin(env)?;
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        Self::transfer_xlm(
            env,
            &env.current_contract_address(),
            &admin,
            &amount,
            Error::FailedToTransferFee,
        )
    }

    /// Upgrade the contract WASM.
    pub fn upgrade(env: &Env, new_wasm_hash: BytesN<32>) -> Result<(), Error> {
        Self::require_admin(env)?;
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }

    // ─── Member Operations ─────────────────────────────────────────

    /// Register as a library member by paying the membership fee.
    pub fn register_member(
        env: &Env,
        member: Address,
        name: String,
        email: String,
    ) -> Result<(), Error> {
        member.require_auth();

        if env
            .storage()
            .persistent()
            .has(&MemberKey::Member(member.clone()))
        {
            return Err(Error::AlreadyAMember);
        }

        let config = Self::get_config(env);
        Self::transfer_xlm(
            env,
            &member,
            &env.current_contract_address(),
            &config.membership_fee,
            Error::FailedToTransferFee,
        )?;

        let record = MemberRecord {
            address: member.clone(),
            name: name.clone(),
            email,
            borrowed_book_ids: Vec::new(env),
            is_active: true,
            registered_at: env.ledger().sequence(),
        };

        env.storage()
            .persistent()
            .set(&MemberKey::Member(member.clone()), &record);

        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::MemberCount)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&MemberKey::MemberIndex(count), &member.clone());
        env.storage()
            .instance()
            .set(&DataKey::MemberCount, &(count + 1));

        env.events()
            .publish((symbol_short!("member"),), (member, name));

        Ok(())
    }

    /// Borrow a book from the library.
    pub fn borrow_book(
        env: &Env,
        member: Address,
        book_id: u32,
    ) -> Result<BorrowRecord, Error> {
        member.require_auth();

        let mut mem: MemberRecord = env
            .storage()
            .persistent()
            .get(&MemberKey::Member(member.clone()))
            .ok_or(Error::NotAMember)?;

        if !mem.is_active {
            return Err(Error::MemberInactive);
        }

        let config = Self::get_config(env);
        if mem.borrowed_book_ids.len() >= config.max_books_per_member {
            return Err(Error::MaxBorrowsReached);
        }

        // Check not already borrowing this book
        let borrow_key = MemberKey::Borrow(member.clone(), book_id);
        if let Some(existing) = env
            .storage()
            .persistent()
            .get::<_, BorrowRecord>(&borrow_key)
        {
            if !existing.returned {
                return Err(Error::AlreadyBorrowedThisBook);
            }
        }

        let mut book: BookRecord = env
            .storage()
            .persistent()
            .get(&BookKey::Book(book_id))
            .ok_or(Error::BookNotFound)?;

        if !book.is_active {
            return Err(Error::BookInactive);
        }
        if book.available_copies == 0 {
            return Err(Error::BookNotAvailable);
        }

        book.available_copies -= 1;
        mem.borrowed_book_ids.push_back(book_id);

        let current_ledger = env.ledger().sequence();
        let record = BorrowRecord {
            book_id,
            borrowed_at: current_ledger,
            due_at: current_ledger + config.loan_duration_ledgers,
            returned: false,
            renewed: false,
        };

        env.storage().persistent().set(&BookKey::Book(book_id), &book);
        env.storage()
            .persistent()
            .set(&MemberKey::Member(member.clone()), &mem);
        env.storage().persistent().set(&borrow_key, &record);

        env.events()
            .publish((symbol_short!("borrow"),), (member, book_id));

        Ok(record)
    }

    /// Renew a borrowed book (extend due date). One renewal allowed per borrow.
    pub fn renew_book(
        env: &Env,
        member: Address,
        book_id: u32,
    ) -> Result<BorrowRecord, Error> {
        member.require_auth();

        let borrow_key = MemberKey::Borrow(member.clone(), book_id);
        let mut borrow: BorrowRecord = env
            .storage()
            .persistent()
            .get(&borrow_key)
            .ok_or(Error::BookNotBorrowed)?;

        if borrow.returned {
            return Err(Error::BookAlreadyReturned);
        }
        if borrow.renewed {
            return Err(Error::AlreadyRenewed);
        }

        let current_ledger = env.ledger().sequence();
        if current_ledger > borrow.due_at {
            return Err(Error::BookOverdue);
        }

        let config = Self::get_config(env);
        borrow.due_at += config.loan_duration_ledgers;
        borrow.renewed = true;

        env.storage().persistent().set(&borrow_key, &borrow);
        Ok(borrow)
    }

    /// Return a borrowed book. Returns the late fee charged (0 if on time).
    pub fn return_book(env: &Env, member: Address, book_id: u32) -> Result<i128, Error> {
        member.require_auth();

        let mut mem: MemberRecord = env
            .storage()
            .persistent()
            .get(&MemberKey::Member(member.clone()))
            .ok_or(Error::NotAMember)?;

        let borrow_key = MemberKey::Borrow(member.clone(), book_id);
        let mut borrow: BorrowRecord = env
            .storage()
            .persistent()
            .get(&borrow_key)
            .ok_or(Error::BookNotBorrowed)?;

        if borrow.returned {
            return Err(Error::BookAlreadyReturned);
        }

        let mut book: BookRecord = env
            .storage()
            .persistent()
            .get(&BookKey::Book(book_id))
            .ok_or(Error::BookNotFound)?;

        // Calculate late fee (capped at max_late_fee)
        let current_ledger = env.ledger().sequence();
        let config = Self::get_config(env);
        let late_fee = if current_ledger > borrow.due_at {
            let overdue_ledgers = (current_ledger - borrow.due_at) as i128;
            let raw_fee = overdue_ledgers * config.late_fee_per_ledger;
            core::cmp::min(raw_fee, config.max_late_fee)
        } else {
            0i128
        };

        // Collect late fee if any
        if late_fee > 0 {
            Self::transfer_xlm(
                env,
                &member,
                &env.current_contract_address(),
                &late_fee,
                Error::FailedToTransferLateFee,
            )?;
        }

        borrow.returned = true;
        book.available_copies += 1;

        // Remove book_id from borrowed_book_ids
        let mut new_ids = Vec::new(env);
        for id in mem.borrowed_book_ids.iter() {
            if id != book_id {
                new_ids.push_back(id);
            }
        }
        mem.borrowed_book_ids = new_ids;

        // Save borrow history
        let history_key = MemberKey::History(member.clone());
        let mut history: Vec<BorrowRecord> = env
            .storage()
            .persistent()
            .get(&history_key)
            .unwrap_or_else(|| Vec::new(env));
        history.push_back(borrow.clone());
        env.storage().persistent().set(&history_key, &history);

        env.storage().persistent().set(&borrow_key, &borrow);
        env.storage().persistent().set(&BookKey::Book(book_id), &book);
        env.storage()
            .persistent()
            .set(&MemberKey::Member(member.clone()), &mem);

        env.events()
            .publish((symbol_short!("return"),), (member, book_id, late_fee));

        Ok(late_fee)
    }

    // ─── Read-Only Queries ─────────────────────────────────────────

    /// Get a single book by ID.
    pub fn get_book(env: &Env, book_id: u32) -> Result<BookRecord, Error> {
        env.storage()
            .persistent()
            .get(&BookKey::Book(book_id))
            .ok_or(Error::BookNotFound)
    }

    /// Get a paginated list of active books.
    pub fn get_books(env: &Env, start: u32, limit: u32) -> Vec<BookRecord> {
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::BookCount)
            .unwrap_or(0);
        let end = core::cmp::min(start + limit, count);
        let mut books = Vec::new(env);
        for id in start..end {
            if let Some(book) = env
                .storage()
                .persistent()
                .get::<_, BookRecord>(&BookKey::Book(id))
            {
                if book.is_active {
                    books.push_back(book);
                }
            }
        }
        books
    }

    /// Get a member record by address.
    pub fn get_member(env: &Env, member: Address) -> Result<MemberRecord, Error> {
        env.storage()
            .persistent()
            .get(&MemberKey::Member(member))
            .ok_or(Error::NotAMember)
    }

    /// Get a paginated list of all members.
    pub fn get_members(env: &Env, start: u32, limit: u32) -> Vec<MemberRecord> {
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::MemberCount)
            .unwrap_or(0);
        let end = core::cmp::min(start + limit, count);
        let mut members = Vec::new(env);
        for idx in start..end {
            if let Some(addr) = env
                .storage()
                .persistent()
                .get::<_, Address>(&MemberKey::MemberIndex(idx))
            {
                if let Some(rec) = env
                    .storage()
                    .persistent()
                    .get::<_, MemberRecord>(&MemberKey::Member(addr))
                {
                    members.push_back(rec);
                }
            }
        }
        members
    }

    /// Get a borrow record for a specific member and book.
    pub fn get_borrow(
        env: &Env,
        member: Address,
        book_id: u32,
    ) -> Result<BorrowRecord, Error> {
        env.storage()
            .persistent()
            .get(&MemberKey::Borrow(member, book_id))
            .ok_or(Error::BookNotBorrowed)
    }

    /// Get a member's borrow history (returned books).
    pub fn get_borrow_history(env: &Env, member: Address) -> Vec<BorrowRecord> {
        env.storage()
            .persistent()
            .get(&MemberKey::History(member))
            .unwrap_or_else(|| Vec::new(env))
    }

    /// Get the current library configuration.
    pub fn config(env: &Env) -> Config {
        Self::get_config(env)
    }

    /// Get the admin address.
    pub fn admin(env: &Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }

    // ─── Private Helpers ───────────────────────────────────────────

    fn require_admin(env: &Env) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotAdmin)?;
        admin.require_auth();
        Ok(())
    }

    fn get_config(env: &Env) -> Config {
        env.storage()
            .instance()
            .get(&DataKey::Config)
            .expect("config not set")
    }

    fn validate_book_input(
        title: &String,
        author: &String,
        genre: &String,
        total_copies: u32,
    ) -> Result<(), Error> {
        if title.len() == 0 || author.len() == 0 || genre.len() == 0 {
            return Err(Error::InvalidInput);
        }
        if total_copies == 0 {
            return Err(Error::InvalidInput);
        }
        Ok(())
    }

    /// Helper to handle the double-Result from try_transfer.
    fn transfer_xlm(
        env: &Env,
        from: &Address,
        to: &Address,
        amount: &i128,
        err: Error,
    ) -> Result<(), Error> {
        xlm::token_client(env)
            .try_transfer(from, to, amount)
            .map_err(|_| err)? // SDK invocation error
            .map_err(|_| err) // token contract error
    }
}
