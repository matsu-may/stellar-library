import { Button, Card, Icon } from "@stellar/design-system"
import { type BookData } from "./BookCard"
import styles from "./BookDetailModal.module.css"

interface BookDetailModalProps {
	book: BookData
	isMember: boolean
	isOpen: boolean
	onClose: () => void
	onBorrow: (bookId: number) => Promise<void>
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
	book,
	isMember,
	isOpen,
	onClose,
	onBorrow,
}) => {
	if (!isOpen) return null

	const available = book.available_copies > 0

	return (
		<div className={styles.backdrop} onClick={onClose}>
			<Card className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<button className={styles.closeBtn} onClick={onClose}>
					<Icon.XClose size="md" />
				</button>

				<div className={styles.header}>
					<Icon.BookOpen01
						size="lg"
						style={{ color: "var(--sds-clr-lilac-09)" }}
					/>
					<h2>{book.title}</h2>
				</div>

				<div className={styles.meta}>
					<div className={styles.metaRow}>
						<span className={styles.label}>Author</span>
						<span>{book.author}</span>
					</div>
					<div className={styles.metaRow}>
						<span className={styles.label}>Genre</span>
						<span className={styles.genre}>{book.genre}</span>
					</div>
					<div className={styles.metaRow}>
						<span className={styles.label}>Availability</span>
						<span className={available ? styles.available : styles.unavailable}>
							{book.available_copies} of {book.total_copies} available
						</span>
					</div>
				</div>

				<div className={styles.actions}>
					{isMember && available && (
						<Button
							variant="primary"
							size="md"
							onClick={() => void onBorrow(book.id)}
						>
							Borrow This Book
						</Button>
					)}
					{!isMember && (
						<p className={styles.hint}>Register as a member to borrow books.</p>
					)}
					{isMember && !available && (
						<p className={styles.hint}>
							This book is currently unavailable. Check back later.
						</p>
					)}
				</div>
			</Card>
		</div>
	)
}
