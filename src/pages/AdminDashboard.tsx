import { Button, Card, Input } from "@stellar/design-system"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { ConnectWalletCTA } from "../components/ConnectWalletCTA"
import { ActivityLog } from "../components/library/ActivityLog"
import { AdminBookForm } from "../components/library/AdminBookForm"
import { type BookData } from "../components/library/BookCard"
import { LoadingSkeleton } from "../components/LoadingSkeleton"
import { useLibraryContract } from "../hooks/useLibraryContract"
import { useNotification } from "../hooks/useNotification"
import { useWallet } from "../hooks/useWallet"
import { shortenContractId } from "../util/contract"
import styles from "./AdminDashboard.module.css"

interface ConfirmAction {
	type: "remove" | "deactivate"
	id: number | string
	label: string
}

const AdminDashboard: React.FC = () => {
	const { address } = useWallet()
	const {
		getAdmin,
		getBooks,
		getMembers,
		addBook,
		removeBook,
		deactivateMember,
		reactivateMember,
		withdrawFees,
	} = useLibraryContract()
	const { addNotification } = useNotification()
	const queryClient = useQueryClient()

	const [memberAddr, setMemberAddr] = useState("")
	const [withdrawAmount, setWithdrawAmount] = useState("")
	const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

	const { data: admin, isLoading: adminLoading } = useQuery({
		queryKey: ["library-admin"],
		queryFn: getAdmin,
	})

	const isAdmin = !!address && !!admin && address === admin

	const { data: books = [], isLoading: booksLoading } = useQuery({
		queryKey: ["library-books-admin"],
		queryFn: () => getBooks(0, 100),
		enabled: isAdmin,
		staleTime: 60000,
	})

	const { data: members = [], isLoading: membersLoading } = useQuery({
		queryKey: ["library-members-admin"],
		queryFn: () => getMembers(0, 100),
		enabled: isAdmin,
		staleTime: 60000,
	})

	const allBooks = books as BookData[]
	const totalCopiesOut = allBooks.reduce(
		(sum, b) => sum + (b.total_copies - b.available_copies),
		0,
	)

	const handleAddBook = useCallback(
		async (
			title: string,
			author: string,
			genre: string,
			totalCopies: number,
		) => {
			try {
				await addBook(title, author, genre, totalCopies)
				addNotification("Book added!", "success")
				void queryClient.invalidateQueries({ queryKey: ["library-books"] })
			} catch (err) {
				addNotification(
					`Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
					"error",
				)
			}
		},
		[addBook, addNotification, queryClient],
	)

	const handleConfirmedRemove = useCallback(
		async (bookId: number) => {
			try {
				await removeBook(bookId)
				addNotification("Book removed.", "success")
				void queryClient.invalidateQueries({ queryKey: ["library-books"] })
			} catch (err) {
				addNotification(
					`Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
					"error",
				)
			}
		},
		[removeBook, addNotification, queryClient],
	)

	const handleConfirmedDeactivate = useCallback(async () => {
		if (!memberAddr) return
		try {
			await deactivateMember(memberAddr)
			addNotification("Member deactivated.", "success")
			setMemberAddr("")
		} catch (err) {
			addNotification(
				`Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
				"error",
			)
		}
	}, [memberAddr, deactivateMember, addNotification])

	const handleReactivate = useCallback(
		async (memberAddress: string) => {
			try {
				await reactivateMember(memberAddress)
				addNotification("Member reactivated.", "success")
				void queryClient.invalidateQueries({
					queryKey: ["library-members-admin"],
				})
			} catch (err) {
				addNotification(
					`Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
					"error",
				)
			}
		},
		[reactivateMember, addNotification, queryClient],
	)

	const handleWithdraw = useCallback(async () => {
		const xlm = parseFloat(withdrawAmount)
		if (!xlm || xlm <= 0) return
		try {
			const stroops = BigInt(Math.round(xlm * 1e7))
			await withdrawFees(stroops)
			addNotification(`Withdrew ${xlm} XLM`, "success")
			setWithdrawAmount("")
		} catch (err) {
			addNotification(
				`Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
				"error",
			)
		}
	}, [withdrawAmount, withdrawFees, addNotification])

	const handleConfirm = useCallback(async () => {
		if (!confirmAction) return
		if (confirmAction.type === "remove") {
			await handleConfirmedRemove(confirmAction.id as number)
		} else {
			await handleConfirmedDeactivate()
		}
		setConfirmAction(null)
	}, [confirmAction, handleConfirmedRemove, handleConfirmedDeactivate])

	const isValidStellarAddress = (addr: string) => /^G[A-Z2-7]{55}$/.test(addr)

	if (!address) {
		return (
			<div className={styles.Admin}>
				<h1>Admin Dashboard</h1>
				<ConnectWalletCTA message="Connect your admin wallet to manage the library." />
			</div>
		)
	}

	if (adminLoading) {
		return (
			<div className={styles.Admin}>
				<h1>Admin Dashboard</h1>
				<LoadingSkeleton variant="stats" count={3} />
			</div>
		)
	}

	if (!isAdmin) {
		return (
			<div className={styles.Admin}>
				<h1>Admin Dashboard</h1>
				<Card style={{ textAlign: "center", padding: "2rem" }}>
					<p>Admin access required. Your wallet is not the library admin.</p>
				</Card>
			</div>
		)
	}

	return (
		<div className={styles.Admin}>
			<h1>Admin Dashboard</h1>

			<div className={styles.statsGrid}>
				<Card className={styles.statCard}>
					<span className={styles.statValue}>{allBooks.length}</span>
					<span className={styles.statLabel}>Total Books</span>
				</Card>
				<Card className={styles.statCard}>
					<span className={styles.statValue}>{totalCopiesOut}</span>
					<span className={styles.statLabel}>Copies Borrowed</span>
				</Card>
				<Card className={styles.statCard}>
					<span className={styles.statValue}>
						{allBooks.reduce((sum, b) => sum + b.total_copies, 0)}
					</span>
					<span className={styles.statLabel}>Total Copies</span>
				</Card>
				<Card className={styles.statCard}>
					<span className={styles.statValue}>
						{(members as { address: string }[]).length}
					</span>
					<span className={styles.statLabel}>Total Members</span>
				</Card>
			</div>

			<ActivityLog />

			<Card>
				<h2>Add New Book</h2>
				<AdminBookForm onSubmit={handleAddBook} />
			</Card>

			<Card>
				<h2>Book Inventory ({allBooks.length})</h2>
				{booksLoading ? (
					<LoadingSkeleton variant="list" count={3} />
				) : allBooks.length === 0 ? (
					<p style={{ color: "var(--sds-clr-gray-08)" }}>
						Add your first book above.
					</p>
				) : (
					<div className={styles.bookList}>
						{allBooks.map((book) => (
							<div key={book.id} className={styles.bookRow}>
								<div>
									<strong>{book.title}</strong> — {book.author}
									<span className={styles.copies}>
										{" "}
										({book.available_copies}/{book.total_copies})
									</span>
								</div>
								<Button
									variant="error"
									size="sm"
									onClick={() =>
										setConfirmAction({
											type: "remove",
											id: book.id,
											label: book.title,
										})
									}
								>
									Remove
								</Button>
							</div>
						))}
					</div>
				)}
			</Card>

			<Card>
				<h2>Members ({(members as { address: string }[]).length})</h2>
				{membersLoading ? (
					<LoadingSkeleton variant="list" count={3} />
				) : (members as { address: string }[]).length === 0 ? (
					<p style={{ color: "var(--sds-clr-gray-08)" }}>No members yet.</p>
				) : (
					<div className={styles.bookList}>
						{(
							members as {
								address: string
								name: string
								borrowed_book_ids: number[]
								is_active: boolean
							}[]
						).map((m) => (
							<div key={m.address} className={styles.bookRow}>
								<div>
									<strong>{m.name || "Unnamed"}</strong>
									{" — "}
									<span className={styles.copies}>
										{shortenContractId(m.address)}
									</span>
									{" — "}
									{m.borrowed_book_ids.length} borrowed
								</div>
								<span
									style={{
										color: m.is_active
											? "var(--sds-clr-green-09)"
											: "var(--sds-clr-red-09)",
										fontWeight: 600,
										fontSize: "0.85rem",
									}}
								>
									{m.is_active ? "Active" : "Inactive"}
								</span>
								{!m.is_active && (
									<Button
										variant="secondary"
										size="sm"
										onClick={() => void handleReactivate(m.address)}
									>
										Reactivate
									</Button>
								)}
							</div>
						))}
					</div>
				)}
			</Card>

			<Card>
				<h2>Member Management</h2>
				<div className={styles.actionRow}>
					<Input
						id="member-address"
						placeholder="Member address (G...)"
						fieldSize="md"
						value={memberAddr}
						onChange={(e) => setMemberAddr(e.target.value)}
						error={memberAddr.length > 0 && !isValidStellarAddress(memberAddr)}
						note={
							memberAddr.length > 0 && !isValidStellarAddress(memberAddr)
								? "Invalid Stellar address"
								: undefined
						}
					/>
					<Button
						variant="error"
						size="md"
						disabled={!isValidStellarAddress(memberAddr)}
						onClick={() =>
							setConfirmAction({
								type: "deactivate",
								id: memberAddr,
								label: memberAddr,
							})
						}
					>
						Deactivate
					</Button>
				</div>
			</Card>

			<Card>
				<h2>Withdraw Fees</h2>
				<div className={styles.actionRow}>
					<Input
						id="withdraw-amount"
						placeholder="Amount in XLM"
						fieldSize="md"
						type="number"
						value={withdrawAmount}
						onChange={(e) => setWithdrawAmount(e.target.value)}
					/>
					<Button
						variant="primary"
						size="md"
						disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
						onClick={() => void handleWithdraw()}
					>
						Withdraw
					</Button>
				</div>
			</Card>

			<ConfirmDialog
				isOpen={!!confirmAction}
				title={
					confirmAction?.type === "remove" ? "Remove Book" : "Deactivate Member"
				}
				message={
					confirmAction?.type === "remove"
						? `Are you sure you want to remove "${confirmAction?.label}"? This will hide it from the catalog.`
						: `Are you sure you want to deactivate member ${confirmAction?.label?.slice(0, 8)}...?`
				}
				confirmLabel={
					confirmAction?.type === "remove" ? "Remove" : "Deactivate"
				}
				variant="error"
				onConfirm={() => void handleConfirm()}
				onCancel={() => setConfirmAction(null)}
			/>
		</div>
	)
}

export default AdminDashboard
