import { Button, Card, Icon } from "@stellar/design-system"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"
import { ConnectWalletCTA } from "../components/ConnectWalletCTA"
import { BookCard, type BookData } from "../components/library/BookCard"
import { BookDetailModal } from "../components/library/BookDetailModal"
import { BookSearch } from "../components/library/BookSearch"
import { LoadingSkeleton } from "../components/LoadingSkeleton"
import { useLibraryContract } from "../hooks/useLibraryContract"
import { useNotification } from "../hooks/useNotification"
import { useWallet } from "../hooks/useWallet"
import styles from "./Catalog.module.css"

const PAGE_SIZE = 20

const Catalog: React.FC = () => {
	const { address } = useWallet()
	const { getBooks, getMember, borrowBook } = useLibraryContract()
	const { addNotification } = useNotification()
	const queryClient = useQueryClient()
	const [search, setSearch] = useState("")
	const [page, setPage] = useState(0)
	const [selectedBook, setSelectedBook] = useState<BookData | null>(null)

	const {
		data: books = [],
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: ["library-books", page],
		queryFn: () => getBooks(page * PAGE_SIZE, PAGE_SIZE),
	})

	const { data: member, isLoading: memberLoading } = useQuery({
		queryKey: ["library-member", address],
		queryFn: () => getMember(address!),
		enabled: !!address,
		refetchOnMount: "always",
	})

	const isMember = !!member?.is_active
	const memberCheckDone = !memberLoading && !!address

	const filteredBooks = useMemo(() => {
		if (!search) return books as BookData[]
		const q = search.toLowerCase()
		return (books as BookData[]).filter(
			(b) =>
				b.title.toLowerCase().includes(q) ||
				b.author.toLowerCase().includes(q) ||
				b.genre.toLowerCase().includes(q),
		)
	}, [books, search])

	const handleBorrow = useCallback(
		async (bookId: number) => {
			try {
				await borrowBook(bookId)
				addNotification("Book borrowed successfully!", "success")
				void queryClient.invalidateQueries({ queryKey: ["library-books"] })
				void queryClient.invalidateQueries({ queryKey: ["library-member"] })
				setSelectedBook(null)
			} catch (err) {
				addNotification(
					`Failed to borrow: ${err instanceof Error ? err.message : "Unknown error"}`,
					"error",
				)
			}
		},
		[borrowBook, addNotification, queryClient],
	)

	return (
		<div className={styles.Catalog}>
			<h1>Book Catalog</h1>

			{!address && (
				<ConnectWalletCTA message="Connect your wallet to borrow books from the catalog." />
			)}

			{memberCheckDone && !isMember && (
				<Card style={{ marginBottom: "1.5rem", padding: "1rem" }}>
					<p style={{ margin: 0 }}>
						<Icon.InfoCircle size="sm" /> You need to{" "}
						<a href="/my-library" className="Link Link--primary">
							register as a member
						</a>{" "}
						before borrowing books.
					</p>
				</Card>
			)}

			<BookSearch value={search} onChange={setSearch} />

			{isLoading && <LoadingSkeleton variant="card" count={6} />}

			{isError && (
				<Card style={{ textAlign: "center", padding: "2rem" }}>
					<Icon.AlertTriangle
						size="md"
						style={{ color: "var(--sds-clr-red-09)" }}
					/>
					<p>Failed to load books.</p>
					<Button variant="secondary" size="sm" onClick={() => void refetch()}>
						Retry
					</Button>
				</Card>
			)}

			{!isLoading && !isError && (
				<>
					<div className={styles.grid}>
						{filteredBooks.map((book) => (
							<div
								key={book.id}
								onClick={() => setSelectedBook(book)}
								style={{ cursor: "pointer" }}
							>
								<BookCard
									book={book}
									isMember={isMember}
									onBorrow={handleBorrow}
								/>
							</div>
						))}
					</div>

					{filteredBooks.length === 0 && (
						<div className={styles.empty}>
							<Icon.BookOpen01
								size="lg"
								style={{
									color: "var(--sds-clr-gray-06)",
									width: "2rem",
									height: "2rem",
								}}
							/>
							<p>No books found.</p>
							{search && (
								<Button
									variant="tertiary"
									size="sm"
									onClick={() => setSearch("")}
								>
									Clear search
								</Button>
							)}
						</div>
					)}

					<div className={styles.pagination}>
						{page > 0 && (
							<Button
								variant="tertiary"
								size="sm"
								onClick={() => setPage((p) => p - 1)}
							>
								Previous
							</Button>
						)}
						{(books as BookData[]).length === PAGE_SIZE && (
							<Button
								variant="tertiary"
								size="sm"
								onClick={() => setPage((p) => p + 1)}
							>
								Next
							</Button>
						)}
					</div>
				</>
			)}

			{selectedBook && (
				<BookDetailModal
					book={selectedBook}
					isMember={isMember}
					isOpen={true}
					onClose={() => setSelectedBook(null)}
					onBorrow={handleBorrow}
				/>
			)}
		</div>
	)
}

export default Catalog
