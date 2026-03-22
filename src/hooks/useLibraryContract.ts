import { rpc as SorobanRpc } from "library"
import { useCallback } from "react"
import library from "../contracts/library"
import { rpcUrl } from "../contracts/util"
import { useWallet } from "./useWallet"

export function useLibraryContract() {
	const { address, signTransaction, updateBalances } = useWallet()

	const addBook = useCallback(
		async (
			title: string,
			author: string,
			genre: string,
			totalCopies: number,
		) => {
			const tx = await library.add_book(
				{ title, author, genre, total_copies: totalCopies },
				{ publicKey: address },
			)
			const { result } = await tx.signAndSend({ signTransaction })
			await updateBalances()
			return result
		},
		[address, signTransaction, updateBalances],
	)

	const updateBook = useCallback(
		async (
			bookId: number,
			title: string,
			author: string,
			genre: string,
			totalCopies: number,
		) => {
			const tx = await library.update_book(
				{ book_id: bookId, title, author, genre, total_copies: totalCopies },
				{ publicKey: address },
			)
			const { result } = await tx.signAndSend({ signTransaction })
			await updateBalances()
			return result
		},
		[address, signTransaction, updateBalances],
	)

	const removeBook = useCallback(
		async (bookId: number) => {
			const tx = await library.remove_book(
				{ book_id: bookId },
				{ publicKey: address },
			)
			const { result } = await tx.signAndSend({ signTransaction })
			await updateBalances()
			return result
		},
		[address, signTransaction, updateBalances],
	)

	const registerMember = useCallback(
		async (name: string, email: string) => {
			const tx = await library.register_member(
				{ member: address!, name, email },
				{ publicKey: address },
			)
			const { result } = await tx.signAndSend({ signTransaction })
			await updateBalances()
			return result
		},
		[address, signTransaction, updateBalances],
	)

	const borrowBook = useCallback(
		async (bookId: number) => {
			const tx = await library.borrow_book(
				{ member: address!, book_id: bookId },
				{ publicKey: address },
			)
			const { result } = await tx.signAndSend({ signTransaction })
			await updateBalances()
			return result
		},
		[address, signTransaction, updateBalances],
	)

	const renewBook = useCallback(
		async (bookId: number) => {
			const tx = await library.renew_book(
				{ member: address!, book_id: bookId },
				{ publicKey: address },
			)
			const { result } = await tx.signAndSend({ signTransaction })
			return result
		},
		[address, signTransaction],
	)

	const returnBook = useCallback(
		async (bookId: number) => {
			const tx = await library.return_book(
				{ member: address!, book_id: bookId },
				{ publicKey: address },
			)
			const { result } = await tx.signAndSend({ signTransaction })
			await updateBalances()
			return result
		},
		[address, signTransaction, updateBalances],
	)

	const deactivateMember = useCallback(
		async (memberAddress: string) => {
			const tx = await library.deactivate_member(
				{ member: memberAddress },
				{ publicKey: address },
			)
			const { result } = await tx.signAndSend({ signTransaction })
			await updateBalances()
			return result
		},
		[address, signTransaction, updateBalances],
	)

	const reactivateMember = useCallback(
		async (memberAddress: string) => {
			const tx = await library.reactivate_member(
				{ member: memberAddress },
				{ publicKey: address },
			)
			const { result } = await tx.signAndSend({ signTransaction })
			await updateBalances()
			return result
		},
		[address, signTransaction, updateBalances],
	)

	const withdrawFees = useCallback(
		async (amount: bigint) => {
			const tx = await library.withdraw_fees({ amount }, { publicKey: address })
			const { result } = await tx.signAndSend({ signTransaction })
			await updateBalances()
			return result
		},
		[address, signTransaction, updateBalances],
	)

	const getBooks = useCallback(async (start: number, limit: number) => {
		const { result } = await library.get_books({ start, limit })
		return result
	}, [])

	const getBook = useCallback(async (bookId: number) => {
		const { result } = await library.get_book({ book_id: bookId })
		if (result.isErr()) throw new Error(result.unwrapErr().message)
		return result.unwrap()
	}, [])

	const getMember = useCallback(async (memberAddress: string) => {
		const { result } = await library.get_member({ member: memberAddress })
		if (result.isErr()) return null
		return result.unwrap()
	}, [])

	const getMembers = useCallback(async (start: number, limit: number) => {
		const { result } = await library.get_members({ start, limit })
		return result
	}, [])

	const getBorrow = useCallback(
		async (memberAddress: string, bookId: number) => {
			const { result } = await library.get_borrow({
				member: memberAddress,
				book_id: bookId,
			})
			if (result.isErr()) throw new Error(result.unwrapErr().message)
			return result.unwrap()
		},
		[],
	)

	const getBorrowHistory = useCallback(async (memberAddress: string) => {
		const { result } = await library.get_borrow_history({
			member: memberAddress,
		})
		return result
	}, [])

	const getConfig = useCallback(async () => {
		const { result } = await library.config()
		return result
	}, [])

	const getAdmin = useCallback(async () => {
		const { result } = await library.admin()
		return result
	}, [])

	const getCurrentLedger = useCallback(async () => {
		const server = new SorobanRpc.Server(rpcUrl, { allowHttp: true })
		const info = await server.getLatestLedger()
		return info.sequence
	}, [])

	return {
		address,
		addBook,
		updateBook,
		removeBook,
		registerMember,
		borrowBook,
		renewBook,
		returnBook,
		deactivateMember,
		reactivateMember,
		withdrawFees,
		getBooks,
		getBook,
		getMember,
		getMembers,
		getBorrow,
		getBorrowHistory,
		getConfig,
		getAdmin,
		getCurrentLedger,
	}
}
