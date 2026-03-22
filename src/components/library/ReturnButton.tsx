import { Button } from "@stellar/design-system"
import { useState } from "react"

interface ReturnButtonProps {
	bookId: number
	onReturn: (bookId: number) => Promise<bigint>
}

export const ReturnButton: React.FC<ReturnButtonProps> = ({
	bookId,
	onReturn,
}) => {
	const [loading, setLoading] = useState(false)
	const [lateFee, setLateFee] = useState<bigint | null>(null)

	const handleReturn = async () => {
		setLoading(true)
		try {
			const fee = await onReturn(bookId)
			setLateFee(fee)
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<Button
				variant="secondary"
				size="sm"
				disabled={loading}
				onClick={handleReturn}
			>
				{loading ? "Returning..." : "Return"}
			</Button>
			{lateFee !== null && lateFee > 0n && (
				<span style={{ color: "var(--sds-clr-red-11)", fontSize: "0.85rem" }}>
					Late fee: {(Number(lateFee) / 1e7).toFixed(4)} XLM
				</span>
			)}
		</>
	)
}
