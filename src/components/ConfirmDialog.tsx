import { Button } from "@stellar/design-system"
import styles from "./ConfirmDialog.module.css"

interface ConfirmDialogProps {
	isOpen: boolean
	title: string
	message: string
	confirmLabel?: string
	variant?: "primary" | "error"
	onConfirm: () => void
	onCancel: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
	isOpen,
	title,
	message,
	confirmLabel = "Confirm",
	variant = "error",
	onConfirm,
	onCancel,
}) => {
	if (!isOpen) return null

	return (
		<div className={styles.backdrop} onClick={onCancel}>
			<div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
				<h3>{title}</h3>
				<p>{message}</p>
				<div className={styles.actions}>
					<Button variant="tertiary" size="md" onClick={onCancel}>
						Cancel
					</Button>
					<Button variant={variant} size="md" onClick={onConfirm}>
						{confirmLabel}
					</Button>
				</div>
			</div>
		</div>
	)
}
