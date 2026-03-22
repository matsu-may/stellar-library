import { Card, Icon } from "@stellar/design-system"
import styles from "./BookCard.module.css"
import { BorrowButton } from "./BorrowButton"

export interface BookData {
	id: number
	title: string
	author: string
	genre: string
	total_copies: number
	available_copies: number
	is_active: boolean
}

interface BookCardProps {
	book: BookData
	isMember: boolean
	onBorrow: (bookId: number) => Promise<void>
}

export const BookCard: React.FC<BookCardProps> = ({
	book,
	isMember,
	onBorrow,
}) => {
	const available = book.available_copies > 0

	return (
		<Card className={styles.BookCard}>
			<div className={styles.header}>
				<Icon.BookOpen01 size="md" />
				<h3 className={styles.title}>{book.title}</h3>
			</div>
			<p className={styles.author}>{book.author}</p>
			<span className={styles.genre}>{book.genre}</span>
			<div className={styles.footer}>
				<span className={available ? styles.available : styles.unavailable}>
					{book.available_copies}/{book.total_copies} available
				</span>
				<BorrowButton
					bookId={book.id}
					disabled={!available || !isMember}
					onBorrow={onBorrow}
				/>
			</div>
		</Card>
	)
}
