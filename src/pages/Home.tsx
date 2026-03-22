import { Button, Card, Icon } from "@stellar/design-system"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { BookCard, type BookData } from "../components/library/BookCard"
import { LoadingSkeleton } from "../components/LoadingSkeleton"
import { useLibraryContract } from "../hooks/useLibraryContract"
import { useWallet } from "../hooks/useWallet"
import styles from "./Home.module.css"

const Home: React.FC = () => {
	const { address } = useWallet()
	const { getBooks, getConfig, borrowBook } = useLibraryContract()

	const { data: books = [], isLoading: booksLoading } = useQuery({
		queryKey: ["library-books-featured"],
		queryFn: () => getBooks(0, 4),
	})

	const { data: config } = useQuery({
		queryKey: ["library-config"],
		queryFn: getConfig,
	})

	const handleBorrow = async (bookId: number) => {
		await borrowBook(bookId)
	}

	return (
		<div className={styles.Home}>
			<section className={styles.hero}>
				<h1>Stellar Library</h1>
				<p>
					A decentralized book lending platform powered by Stellar smart
					contracts. Browse the catalog, register as a member, and borrow books
					— all on-chain.
				</p>
				<div className={styles.heroCta}>
					<Link to="/catalog">
						<Button variant="primary" size="lg">
							<Icon.BookOpen01 size="md" />
							Browse Catalog
						</Button>
					</Link>
					<Link to="/my-library">
						<Button variant="secondary" size="lg">
							<Icon.File06 size="md" />
							My Library
						</Button>
					</Link>
				</div>
			</section>

			{config && (
				<section className={styles.stats}>
					<Card className={styles.statCard}>
						<span className={styles.statValue}>
							{(Number(config.membership_fee) / 1e7).toFixed(0)} XLM
						</span>
						<span className={styles.statLabel}>Membership Fee</span>
					</Card>
					<Card className={styles.statCard}>
						<span className={styles.statValue}>
							{config.max_books_per_member}
						</span>
						<span className={styles.statLabel}>Books per Member</span>
					</Card>
					<Card className={styles.statCard}>
						<span className={styles.statValue}>
							{Math.round((config.loan_duration_ledgers * 5) / 86400)}
						</span>
						<span className={styles.statLabel}>Loan Days</span>
					</Card>
				</section>
			)}

			<section className={styles.featured}>
				<h2>Featured Books</h2>
				{booksLoading ? (
					<LoadingSkeleton variant="card" count={4} />
				) : (books as BookData[]).length > 0 ? (
					<div className={styles.bookGrid}>
						{(books as BookData[]).map((book) => (
							<BookCard
								key={book.id}
								book={book}
								isMember={!!address}
								onBorrow={handleBorrow}
							/>
						))}
					</div>
				) : (
					<Card style={{ textAlign: "center", padding: "2rem" }}>
						<p style={{ color: "var(--sds-clr-gray-08)" }}>
							No books in the catalog yet.
						</p>
					</Card>
				)}
				{(books as BookData[]).length > 0 && (
					<div style={{ textAlign: "center", marginTop: "1rem" }}>
						<Link to="/catalog">
							<Button variant="tertiary" size="md">
								View All Books
								<Icon.ArrowRight size="md" />
							</Button>
						</Link>
					</div>
				)}
			</section>

			<section className={styles.howItWorks}>
				<h2>How It Works</h2>
				<div className={styles.steps}>
					<Card className={styles.step}>
						<div className={styles.stepIcon}>
							<Icon.Wallet04 size="lg" />
						</div>
						<h3>1. Connect Wallet</h3>
						<p>Connect your Stellar wallet to interact with the library.</p>
					</Card>
					<Card className={styles.step}>
						<div className={styles.stepIcon}>
							<Icon.UserPlus01 size="lg" />
						</div>
						<h3>2. Register</h3>
						<p>Pay a one-time membership fee to become a library member.</p>
					</Card>
					<Card className={styles.step}>
						<div className={styles.stepIcon}>
							<Icon.BookOpen01 size="lg" />
						</div>
						<h3>3. Borrow Books</h3>
						<p>
							Browse the catalog and borrow up to{" "}
							{config?.max_books_per_member ?? 3} books at a time.
						</p>
					</Card>
				</div>
			</section>
		</div>
	)
}

export default Home
