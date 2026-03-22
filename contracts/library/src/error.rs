#[soroban_sdk::contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotAdmin = 1,
    BookNotFound = 2,
    BookNotAvailable = 3,
    NotAMember = 4,
    AlreadyAMember = 5,
    MaxBorrowsReached = 6,
    BookNotBorrowed = 7,
    AlreadyBorrowedThisBook = 8,
    BookAlreadyReturned = 9,
    InsufficientPayment = 10,
    MemberInactive = 11,
    BookInactive = 12,
    FailedToTransferFee = 13,
    FailedToTransferLateFee = 14,
    InvalidCopies = 15,
    InvalidInput = 16,
    AlreadyRenewed = 17,
    BookOverdue = 18,
}
