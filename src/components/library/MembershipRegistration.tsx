import { Button, Card, Icon } from "@stellar/design-system"
import { useState } from "react"
import styles from "./MembershipRegistration.module.css"
import { RegistrationModal } from "./RegistrationModal"

interface MembershipRegistrationProps {
	membershipFee: bigint
	onRegister: (name: string, email: string) => Promise<void>
}

export const MembershipRegistration: React.FC<MembershipRegistrationProps> = ({
	membershipFee,
	onRegister,
}) => {
	const [showModal, setShowModal] = useState(false)
	const feeXlm = (Number(membershipFee) / 1e7).toFixed(2)

	const handleSubmit = async (name: string, email: string) => {
		await onRegister(name, email)
		setShowModal(false)
	}

	return (
		<>
			<div className={styles.Registration}>
				<Card>
					<Icon.UserPlus01 size="lg" />
					<h3>Become a Member</h3>
					<p>
						Register as a library member to borrow books. A one-time membership
						fee of <strong>{feeXlm} XLM</strong> is required.
					</p>
					<Button
						variant="primary"
						size="md"
						onClick={() => setShowModal(true)}
					>
						Register Membership
					</Button>
				</Card>
			</div>

			<RegistrationModal
				isOpen={showModal}
				membershipFee={membershipFee}
				onSubmit={handleSubmit}
				onCancel={() => setShowModal(false)}
			/>
		</>
	)
}
