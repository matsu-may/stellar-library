import { Buffer } from "buffer"
import { Address } from "@stellar/stellar-sdk"
import {
	AssembledTransaction,
	Client as ContractClient,
	ClientOptions as ContractClientOptions,
	MethodOptions,
	Result,
	Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract"
import type {
	u32,
	i32,
	u64,
	i64,
	u128,
	i128,
	u256,
	i256,
	Option,
	Timepoint,
	Duration,
} from "@stellar/stellar-sdk/contract"
export * from "@stellar/stellar-sdk"
export * as contract from "@stellar/stellar-sdk/contract"
export * as rpc from "@stellar/stellar-sdk/rpc"

if (typeof window !== "undefined") {
	//@ts-ignore Buffer exists
	window.Buffer = window.Buffer || Buffer
}

export const networks = {
	standalone: {
		networkPassphrase: "Standalone Network ; February 2017",
		contractId: "CC66LEXFJPK5F6AEEU4LJ6BQHYVOJYFEJP4QF7R3GSV4Y4S7R6M7QF4Y",
	},
} as const

export const Errors = {
	1: { message: "NotAdmin" },
	2: { message: "BookNotFound" },
	3: { message: "BookNotAvailable" },
	4: { message: "NotAMember" },
	5: { message: "AlreadyAMember" },
	6: { message: "MaxBorrowsReached" },
	7: { message: "BookNotBorrowed" },
	8: { message: "AlreadyBorrowedThisBook" },
	9: { message: "BookAlreadyReturned" },
	10: { message: "InsufficientPayment" },
	11: { message: "MemberInactive" },
	12: { message: "BookInactive" },
	13: { message: "FailedToTransferFee" },
	14: { message: "FailedToTransferLateFee" },
	15: { message: "InvalidCopies" },
	16: { message: "InvalidInput" },
	17: { message: "AlreadyRenewed" },
	18: { message: "BookOverdue" },
}

/**
 * Keys for instance storage (global config, loaded on every invocation)
 */
export type DataKey =
	| { tag: "Admin"; values: void }
	| { tag: "Config"; values: void }
	| { tag: "BookCount"; values: void }
	| { tag: "MemberCount"; values: void }

/**
 * Keys for persistent storage (per-book)
 */
export type BookKey = { tag: "Book"; values: readonly [u32] }

/**
 * Keys for persistent storage (per-member and per-borrow)
 */
export type MemberKey =
	| { tag: "Member"; values: readonly [string] }
	| { tag: "Borrow"; values: readonly [string, u32] }
	| { tag: "History"; values: readonly [string] }
	| { tag: "MemberIndex"; values: readonly [u32] }

/**
 * Global library configuration
 */
export interface Config {
	late_fee_per_ledger: i128
	loan_duration_ledgers: u32
	max_books_per_member: u32
	max_late_fee: i128
	membership_fee: i128
}

/**
 * A book in the catalog
 */
export interface BookRecord {
	author: string
	available_copies: u32
	genre: string
	id: u32
	is_active: boolean
	title: string
	total_copies: u32
}

/**
 * A registered library member
 */
export interface MemberRecord {
	address: string
	borrowed_book_ids: Array<u32>
	email: string
	is_active: boolean
	name: string
	registered_at: u32
}

/**
 * A single borrow transaction
 */
export interface BorrowRecord {
	book_id: u32
	borrowed_at: u32
	due_at: u32
	renewed: boolean
	returned: boolean
}

export interface Client {
	/**
	 * Construct and simulate a update_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Update the library configuration.
	 */
	update_config: (
		{ config }: { config: Config },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a add_book transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Add a new book to the catalog. Returns the book ID.
	 */
	add_book: (
		{
			title,
			author,
			genre,
			total_copies,
		}: { title: string; author: string; genre: string; total_copies: u32 },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<u32>>>

	/**
	 * Construct and simulate a update_book transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Update an existing book's metadata and copy count.
	 */
	update_book: (
		{
			book_id,
			title,
			author,
			genre,
			total_copies,
		}: {
			book_id: u32
			title: string
			author: string
			genre: string
			total_copies: u32
		},
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a remove_book transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Soft-delete a book from the catalog.
	 */
	remove_book: (
		{ book_id }: { book_id: u32 },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a deactivate_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Deactivate a member.
	 */
	deactivate_member: (
		{ member }: { member: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a reactivate_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Reactivate a deactivated member.
	 */
	reactivate_member: (
		{ member }: { member: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a withdraw_fees transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Withdraw collected fees to the admin address.
	 */
	withdraw_fees: (
		{ amount }: { amount: i128 },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Upgrade the contract WASM.
	 */
	upgrade: (
		{ new_wasm_hash }: { new_wasm_hash: Buffer },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a register_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Register as a library member by paying the membership fee.
	 */
	register_member: (
		{ member, name, email }: { member: string; name: string; email: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a borrow_book transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Borrow a book from the library.
	 */
	borrow_book: (
		{ member, book_id }: { member: string; book_id: u32 },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<BorrowRecord>>>

	/**
	 * Construct and simulate a renew_book transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Renew a borrowed book (extend due date). One renewal allowed per borrow.
	 */
	renew_book: (
		{ member, book_id }: { member: string; book_id: u32 },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<BorrowRecord>>>

	/**
	 * Construct and simulate a return_book transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Return a borrowed book. Returns the late fee charged (0 if on time).
	 */
	return_book: (
		{ member, book_id }: { member: string; book_id: u32 },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<i128>>>

	/**
	 * Construct and simulate a get_book transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Get a single book by ID.
	 */
	get_book: (
		{ book_id }: { book_id: u32 },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<BookRecord>>>

	/**
	 * Construct and simulate a get_books transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Get a paginated list of active books.
	 */
	get_books: (
		{ start, limit }: { start: u32; limit: u32 },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Array<BookRecord>>>

	/**
	 * Construct and simulate a get_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Get a member record by address.
	 */
	get_member: (
		{ member }: { member: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<MemberRecord>>>

	/**
	 * Construct and simulate a get_members transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Get a paginated list of all members.
	 */
	get_members: (
		{ start, limit }: { start: u32; limit: u32 },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Array<MemberRecord>>>

	/**
	 * Construct and simulate a get_borrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Get a borrow record for a specific member and book.
	 */
	get_borrow: (
		{ member, book_id }: { member: string; book_id: u32 },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<BorrowRecord>>>

	/**
	 * Construct and simulate a get_borrow_history transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Get a member's borrow history (returned books).
	 */
	get_borrow_history: (
		{ member }: { member: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Array<BorrowRecord>>>

	/**
	 * Construct and simulate a config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Get the current library configuration.
	 */
	config: (options?: MethodOptions) => Promise<AssembledTransaction<Config>>

	/**
	 * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Get the admin address.
	 */
	admin: (
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Option<string>>>
}
export class Client extends ContractClient {
	static async deploy<T = Client>(
		/** Constructor/Initialization Args for the contract's `__constructor` method */
		{ admin }: { admin: string },
		/** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
		options: MethodOptions &
			Omit<ContractClientOptions, "contractId"> & {
				/** The hash of the Wasm blob, which must already be installed on-chain. */
				wasmHash: Buffer | string
				/** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
				salt?: Buffer | Uint8Array
				/** The format used to decode `wasmHash`, if it's provided as a string. */
				format?: "hex" | "base64"
			},
	): Promise<AssembledTransaction<T>> {
		return ContractClient.deploy({ admin }, options)
	}
	constructor(public readonly options: ContractClientOptions) {
		super(
			new ContractSpec([
				"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",
				"AAAAAAAAACVHZXQgYSBwYWdpbmF0ZWQgbGlzdCBvZiBhY3RpdmUgYm9va3MuAAAAAAAACWdldF9ib29rcwAAAAAAAAIAAAAAAAAABXN0YXJ0AAAAAAAABAAAAAAAAAAFbGltaXQAAAAAAAAEAAAAAQAAA+oAAAfQAAAACkJvb2tSZWNvcmQAAA==",
				"AAAAAAAAAB9HZXQgYSBtZW1iZXIgcmVjb3JkIGJ5IGFkZHJlc3MuAAAAAApnZXRfbWVtYmVyAAAAAAABAAAAAAAAAAZtZW1iZXIAAAAAABMAAAABAAAD6QAAB9AAAAAMTWVtYmVyUmVjb3JkAAAAAw==",
				"AAAAAAAAACRHZXQgYSBwYWdpbmF0ZWQgbGlzdCBvZiBhbGwgbWVtYmVycy4AAAALZ2V0X21lbWJlcnMAAAAAAgAAAAAAAAAFc3RhcnQAAAAAAAAEAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAABAAAD6gAAB9AAAAAMTWVtYmVyUmVjb3Jk",
				"AAAAAAAAADNHZXQgYSBib3Jyb3cgcmVjb3JkIGZvciBhIHNwZWNpZmljIG1lbWJlciBhbmQgYm9vay4AAAAACmdldF9ib3Jyb3cAAAAAAAIAAAAAAAAABm1lbWJlcgAAAAAAEwAAAAAAAAAHYm9va19pZAAAAAAEAAAAAQAAA+kAAAfQAAAADEJvcnJvd1JlY29yZAAAAAM=",
				"AAAAAAAAAC9HZXQgYSBtZW1iZXIncyBib3Jyb3cgaGlzdG9yeSAocmV0dXJuZWQgYm9va3MpLgAAAAASZ2V0X2JvcnJvd19oaXN0b3J5AAAAAAABAAAAAAAAAAZtZW1iZXIAAAAAABMAAAABAAAD6gAAB9AAAAAMQm9ycm93UmVjb3Jk",
				"AAAAAAAAACZHZXQgdGhlIGN1cnJlbnQgbGlicmFyeSBjb25maWd1cmF0aW9uLgAAAAAABmNvbmZpZwAAAAAAAAAAAAEAAAfQAAAABkNvbmZpZwAA",
				"AAAAAAAAABZHZXQgdGhlIGFkbWluIGFkZHJlc3MuAAAAAAAFYWRtaW4AAAAAAAAAAAAAAQAAA+gAAAAT",
				"AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAEgAAAAAAAAAITm90QWRtaW4AAAABAAAAAAAAAAxCb29rTm90Rm91bmQAAAACAAAAAAAAABBCb29rTm90QXZhaWxhYmxlAAAAAwAAAAAAAAAKTm90QU1lbWJlcgAAAAAABAAAAAAAAAAOQWxyZWFkeUFNZW1iZXIAAAAAAAUAAAAAAAAAEU1heEJvcnJvd3NSZWFjaGVkAAAAAAAABgAAAAAAAAAPQm9va05vdEJvcnJvd2VkAAAAAAcAAAAAAAAAF0FscmVhZHlCb3Jyb3dlZFRoaXNCb29rAAAAAAgAAAAAAAAAE0Jvb2tBbHJlYWR5UmV0dXJuZWQAAAAACQAAAAAAAAATSW5zdWZmaWNpZW50UGF5bWVudAAAAAAKAAAAAAAAAA5NZW1iZXJJbmFjdGl2ZQAAAAAACwAAAAAAAAAMQm9va0luYWN0aXZlAAAADAAAAAAAAAATRmFpbGVkVG9UcmFuc2ZlckZlZQAAAAANAAAAAAAAABdGYWlsZWRUb1RyYW5zZmVyTGF0ZUZlZQAAAAAOAAAAAAAAAA1JbnZhbGlkQ29waWVzAAAAAAAADwAAAAAAAAAMSW52YWxpZElucHV0AAAAEAAAAAAAAAAOQWxyZWFkeVJlbmV3ZWQAAAAAABEAAAAAAAAAC0Jvb2tPdmVyZHVlAAAAABI=",
				"AAAAAgAAAEVLZXlzIGZvciBpbnN0YW5jZSBzdG9yYWdlIChnbG9iYWwgY29uZmlnLCBsb2FkZWQgb24gZXZlcnkgaW52b2NhdGlvbikAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAGQ29uZmlnAAAAAAAAAAAAAAAAAAlCb29rQ291bnQAAAAAAAAAAAAAAAAAAAtNZW1iZXJDb3VudAA=",
				"AAAAAgAAACZLZXlzIGZvciBwZXJzaXN0ZW50IHN0b3JhZ2UgKHBlci1ib29rKQAAAAAAAAAAAAdCb29rS2V5AAAAAAEAAAABAAAAAAAAAARCb29rAAAAAQAAAAQ=",
				"AAAAAgAAADdLZXlzIGZvciBwZXJzaXN0ZW50IHN0b3JhZ2UgKHBlci1tZW1iZXIgYW5kIHBlci1ib3Jyb3cpAAAAAAAAAAAJTWVtYmVyS2V5AAAAAAAABAAAAAEAAAAAAAAABk1lbWJlcgAAAAAAAQAAABMAAAABAAAAAAAAAAZCb3Jyb3cAAAAAAAIAAAATAAAABAAAAAEAAAAAAAAAB0hpc3RvcnkAAAAAAQAAABMAAAABAAAAAAAAAAtNZW1iZXJJbmRleAAAAAABAAAABA==",
				"AAAAAQAAABxHbG9iYWwgbGlicmFyeSBjb25maWd1cmF0aW9uAAAAAAAAAAZDb25maWcAAAAAAAUAAAAAAAAAE2xhdGVfZmVlX3Blcl9sZWRnZXIAAAAACwAAAAAAAAAVbG9hbl9kdXJhdGlvbl9sZWRnZXJzAAAAAAAABAAAAAAAAAAUbWF4X2Jvb2tzX3Blcl9tZW1iZXIAAAAEAAAAAAAAAAxtYXhfbGF0ZV9mZWUAAAALAAAAAAAAAA5tZW1iZXJzaGlwX2ZlZQAAAAAACw==",
				"AAAAAQAAABVBIGJvb2sgaW4gdGhlIGNhdGFsb2cAAAAAAAAAAAAACkJvb2tSZWNvcmQAAAAAAAcAAAAAAAAABmF1dGhvcgAAAAAAEAAAAAAAAAAQYXZhaWxhYmxlX2NvcGllcwAAAAQAAAAAAAAABWdlbnJlAAAAAAAAEAAAAAAAAAACaWQAAAAAAAQAAAAAAAAACWlzX2FjdGl2ZQAAAAAAAAEAAAAAAAAABXRpdGxlAAAAAAAAEAAAAAAAAAAMdG90YWxfY29waWVzAAAABA==",
				"AAAAAQAAABtBIHJlZ2lzdGVyZWQgbGlicmFyeSBtZW1iZXIAAAAAAAAAAAxNZW1iZXJSZWNvcmQAAAAGAAAAAAAAAAdhZGRyZXNzAAAAABMAAAAAAAAAEWJvcnJvd2VkX2Jvb2tfaWRzAAAAAAAD6gAAAAQAAAAAAAAABWVtYWlsAAAAAAAAEAAAAAAAAAAJaXNfYWN0aXZlAAAAAAAAAQAAAAAAAAAEbmFtZQAAABAAAAAAAAAADXJlZ2lzdGVyZWRfYXQAAAAAAAAE",
				"AAAAAQAAABtBIHNpbmdsZSBib3Jyb3cgdHJhbnNhY3Rpb24AAAAAAAAAAAxCb3Jyb3dSZWNvcmQAAAAFAAAAAAAAAAdib29rX2lkAAAAAAQAAAAAAAAAC2JvcnJvd2VkX2F0AAAAAAQAAAAAAAAABmR1ZV9hdAAAAAAABAAAAAAAAAAHcmVuZXdlZAAAAAABAAAAAAAAAAhyZXR1cm5lZAAAAAE=",
			]),
			options,
		)
	}
	public readonly fromJSON = {
		update_config: this.txFromJSON<Result<void>>,
		add_book: this.txFromJSON<Result<u32>>,
		update_book: this.txFromJSON<Result<void>>,
		remove_book: this.txFromJSON<Result<void>>,
		deactivate_member: this.txFromJSON<Result<void>>,
		reactivate_member: this.txFromJSON<Result<void>>,
		withdraw_fees: this.txFromJSON<Result<void>>,
		upgrade: this.txFromJSON<Result<void>>,
		register_member: this.txFromJSON<Result<void>>,
		borrow_book: this.txFromJSON<Result<BorrowRecord>>,
		renew_book: this.txFromJSON<Result<BorrowRecord>>,
		return_book: this.txFromJSON<Result<i128>>,
		get_book: this.txFromJSON<Result<BookRecord>>,
		get_books: this.txFromJSON<Array<BookRecord>>,
		get_member: this.txFromJSON<Result<MemberRecord>>,
		get_members: this.txFromJSON<Array<MemberRecord>>,
		get_borrow: this.txFromJSON<Result<BorrowRecord>>,
		get_borrow_history: this.txFromJSON<Array<BorrowRecord>>,
		config: this.txFromJSON<Config>,
		admin: this.txFromJSON<Option<string>>,
	}
}
