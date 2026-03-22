import { Button, Input } from "@stellar/design-system"
import { useState } from "react"
import styles from "./RegistrationModal.module.css"

interface RegistrationModalProps {
	isOpen: boolean
	membershipFee: bigint
	onSubmit: (name: string, email: string) => Promise<void>
	onCancel: () => void
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
	isOpen,
	membershipFee,
	onSubmit,
	onCancel,
}) => {
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [loading, setLoading] = useState(false)
	const [touched, setTouched] = useState(false)

	const feeXlm = (Number(membershipFee) / 1e7).toFixed(2)
	const trimmedName = name.trim()
	const nameError = touched && !trimmedName ? "Name is required" : undefined

	if (!isOpen) return null

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setTouched(true)
		if (!trimmedName) return
		setLoading(true)
		try {
			await onSubmit(trimmedName, email.trim())
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className={styles.backdrop} onClick={onCancel}>
			<div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
				<h3>Register as Member</h3>
				<p className={styles.feeInfo}>
					Membership fee: <strong>{feeXlm} XLM</strong>
				</p>

				<form className={styles.form} onSubmit={handleSubmit}>
					<Input
						id="reg-name"
						label="Name"
						placeholder="Your display name"
						fieldSize="md"
						value={name}
						maxLength={50}
						onChange={(e) => setName(e.target.value)}
						onBlur={() => setTouched(true)}
						error={!!nameError}
						note={nameError}
					/>
					<Input
						id="reg-email"
						label="Email (optional)"
						placeholder="your@email.com"
						fieldSize="md"
						value={email}
						maxLength={100}
						onChange={(e) => setEmail(e.target.value)}
					/>

					<div className={styles.actions}>
						<Button
							variant="tertiary"
							size="md"
							onClick={onCancel}
							type="button"
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							size="md"
							type="submit"
							disabled={loading || !trimmedName}
						>
							{loading ? "Registering..." : "Register & Pay"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}
