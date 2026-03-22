interface LateFeeDisplayProps {
	dueAt: number
	currentLedger: number
	lateFeePerLedger: bigint
}

export const LateFeeDisplay: React.FC<LateFeeDisplayProps> = ({
	dueAt,
	currentLedger,
	lateFeePerLedger,
}) => {
	if (currentLedger <= dueAt) {
		const remaining = dueAt - currentLedger
		const approxHours = Math.round((remaining * 5) / 3600)
		return (
			<span style={{ color: "var(--sds-clr-green-11)", fontSize: "0.85rem" }}>
				{approxHours > 0 ? `~${approxHours}h remaining` : "Due soon"}
			</span>
		)
	}

	const overdue = currentLedger - dueAt
	const fee = BigInt(overdue) * lateFeePerLedger
	const feeXlm = (Number(fee) / 1e7).toFixed(4)

	return (
		<span style={{ color: "var(--sds-clr-red-11)", fontSize: "0.85rem" }}>
			Overdue — est. fee: {feeXlm} XLM
		</span>
	)
}
