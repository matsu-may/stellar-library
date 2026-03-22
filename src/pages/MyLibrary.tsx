import { Button, Card, Icon } from "@stellar/design-system"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { ConnectWalletCTA } from "../components/ConnectWalletCTA"
import { LateFeeDisplay } from "../components/library/LateFeeDisplay"
import { MembershipRegistration } from "../components/library/MembershipRegistration"
import { ReturnButton } from "../components/library/ReturnButton"
import { LoadingSkeleton } from "../components/LoadingSkeleton"
import { useLibraryContract } from "../hooks/useLibraryContract"
import { useNotification } from "../hooks/useNotification"
import { useWallet } from "../hooks/useWallet"
import styles from "./MyLibrary.module.css"

const MyLibrary: React.FC = () => {
	const { address } = useWallet()
	const {
		getMember,
		getConfig,
		getBook,
		getBorrow,
		getBorrowHistory,
		registerMember,
		returnBook,
		renewBook,
		getCurrentLedger,
	} = useLibraryContract()
	const { addNotification } = useNotification()
	const queryClient = useQueryClient()

	const { data: config } = useQuery({
		queryKey: ["library-config"],
		queryFn: getConfig,
	})

	const { data: member, isLoading: memberLoading } = useQuery({
		queryKey: ["library-member", address],
		queryFn: () => getMember(address!),
		enabled: !!address,
		refetchOnMount: "always",
	})

	const { data: currentLedger } = useQuery({
		queryKey: ["current-ledger"],
		queryFn: getCurrentLedger,
		refetchInterval: 30000,
	})

	const borrowedIds = (member?.borrowed_book_ids ?? []) as number[]

	const { data: borrowDetails = [], isLoading: borrowsLoading } = useQuery({
		queryKey: ["library-borrows", address, JSON.stringify(borrowedIds.sort())],
		queryFn: async () => {
			const results = await Promise.allSettled(
				borrowedIds.map(async (bookId) => {
					const [book, borrow] = await Promise.all([
						getBook(bookId),
						getBorrow(address!, bookId),
					])
					return { book, borrow }
				}),
			)
			return results
				.filter(
					(
						r,
					): r is PromiseFulfilledResult<{ book: unknown; borrow: unknown }> =>
						r.status === "fulfilled",
				)
				.map((r) => r.value) as {
				book: { title: string; author: string }
				borrow: {
					book_id: number
					borrowed_at: number
					due_at: number
					returned: boolean
					renewed: boolean
				}
			}[]
		},
		enabled: !!address && borrowedIds.length > 0,
	})

	const { data: history = [] } = useQuery({
		queryKey: ["library-history", address],
		queryFn: () => getBorrowHistory(address!),
		enabled: !!address && !!member,
	})

	const handleRegister = useCallback(
		async (name: string, email: string) => {
			try {
				await registerMember(name, email)
				addNotification("Membership registered!", "success")
				void queryClient.invalidateQueries({ queryKey: ["library-member"] })
			} catch (err) {
				addNotification(
					`Registration failed: ${err instanceof Error ? err.message : "Unknown error"}`,
					"error",
				)
			}
		},
		[registerMember, addNotification, queryClient],
	)

	const handleReturn = useCallback(
		async (bookId: number): Promise<bigint> => {
			try {
				const result = await returnBook(bookId)
				addNotification("Book returned!", "success")
				void queryClient.invalidateQueries({ queryKey: ["library-member"] })
				void queryClient.invalidateQueries({ queryKey: ["library-books"] })
				void queryClient.invalidateQueries({ queryKey: ["library-borrows"] })
				void queryClient.invalidateQueries({ queryKey: ["library-history"] })
				return result as bigint
			} catch (err) {
				addNotification(
					`Return failed: ${err instanceof Error ? err.message : "Unknown error"}`,
					"error",
				)
				return 0n
			}
		},
		[returnBook, addNotification, queryClient],
	)

	const handleRenew = useCallback(
		async (bookId: number) => {
			try {
				await renewBook(bookId)
				addNotification("Book renewed! Due date extended.", "success")
				void queryClient.invalidateQueries({ queryKey: ["library-borrows"] })
			} catch (err) {
				addNotification(
					`Renewal failed: ${err instanceof Error ? err.message : "Unknown error"}`,
					"error",
				)
			}
		},
		[renewBook, addNotification, queryClient],
	)

	if (!address) {
		return (
			<div className={styles.MyLibrary}>
				<h1>My Library</h1>
				<ConnectWalletCTA message="Connect your wallet to view your library and borrowed books." />
			</div>
		)
	}

	if (memberLoading) {
		return (
			<div className={styles.MyLibrary}>
				<h1>My Library</h1>
				<LoadingSkeleton variant="list" count={3} />
			</div>
		)
	}

	if (!member) {
		return (
			<div className={styles.MyLibrary}>
				<h1>My Library</h1>
				{config && (
					<MembershipRegistration
						membershipFee={config.membership_fee as unknown as bigint}
						onRegister={handleRegister}
					/>
				)}
			</div>
		)
	}

	return (
		<div className={styles.MyLibrary}>
			<h1>My Library</h1>

			<Card className={styles.status}>
				<Icon.CheckCircle size="md" />
				<span>Active Member</span>
			</Card>

			<h2>Borrowed Books ({borrowedIds.length})</h2>

			{borrowsLoading && <LoadingSkeleton variant="list" count={2} />}

			{!borrowsLoading && borrowedIds.length === 0 && (
				<div className={styles.empty}>
					<Icon.BookOpen01
						size="lg"
						style={{
							color: "var(--sds-clr-gray-06)",
							width: "2rem",
							height: "2rem",
						}}
					/>
					<p>You haven&apos;t borrowed any books yet.</p>
					<a href="/catalog" className="Link Link--primary">
						Browse the Catalog
					</a>
				</div>
			)}

			<div className={styles.borrowList}>
				{borrowDetails.map(({ book, borrow }) => (
					<Card key={borrow.book_id} className={styles.borrowCard}>
						<div className={styles.borrowInfo}>
							<h3>{book.title}</h3>
							<p>{book.author}</p>
							{config && currentLedger && (
								<LateFeeDisplay
									dueAt={borrow.due_at}
									currentLedger={currentLedger}
									lateFeePerLedger={
										config.late_fee_per_ledger as unknown as bigint
									}
								/>
							)}
						</div>
						<div className={styles.borrowActions}>
							{!borrow.renewed &&
								currentLedger &&
								currentLedger <= borrow.due_at && (
									<Button
										variant="tertiary"
										size="sm"
										onClick={() => void handleRenew(borrow.book_id)}
									>
										Renew
									</Button>
								)}
							<ReturnButton bookId={borrow.book_id} onReturn={handleReturn} />
						</div>
					</Card>
				))}
			</div>

			{(history as unknown[]).length > 0 && (
				<>
					<h2>History</h2>
					<div className={styles.historyList}>
						{(
							history as {
								book_id: number
								borrowed_at: number
								due_at: number
							}[]
						).map((entry, i) => (
							<div key={i} className={styles.historyItem}>
								<span>Book #{entry.book_id}</span>
								<span className={styles.historyMeta}>Returned</span>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	)
}

export default MyLibrary
