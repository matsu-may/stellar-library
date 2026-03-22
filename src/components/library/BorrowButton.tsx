import { Button } from "@stellar/design-system"
import { useState } from "react"

interface BorrowButtonProps {
	bookId: number
	disabled: boolean
	onBorrow: (bookId: number) => Promise<void>
}

export const BorrowButton: React.FC<BorrowButtonProps> = ({
	bookId,
	disabled,
	onBorrow,
}) => {
	const [loading, setLoading] = useState(false)

	const handleBorrow = async () => {
		setLoading(true)
		try {
			await onBorrow(bookId)
		} finally {
			setLoading(false)
		}
	}

	return (
		<Button
			variant="secondary"
			size="sm"
			disabled={disabled || loading}
			onClick={handleBorrow}
		>
			{loading ? "Borrowing..." : "Borrow"}
		</Button>
	)
}
