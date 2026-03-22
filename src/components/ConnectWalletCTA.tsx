import { Button, Card, Icon } from "@stellar/design-system"
import { connectWallet } from "../util/wallet"

interface ConnectWalletCTAProps {
	message?: string
}

export const ConnectWalletCTA: React.FC<ConnectWalletCTAProps> = ({
	message = "Connect your wallet to get started.",
}) => {
	return (
		<Card
			style={{
				textAlign: "center",
				padding: "2rem",
				maxWidth: "400px",
				margin: "2rem auto",
			}}
		>
			<Icon.Wallet04
				size="lg"
				style={{
					color: "var(--sds-clr-lilac-09)",
					width: "2rem",
					height: "2rem",
					marginBottom: "0.75rem",
				}}
			/>
			<p style={{ color: "var(--sds-clr-gray-09)", margin: "0 0 1rem" }}>
				{message}
			</p>
			<Button variant="primary" size="md" onClick={() => void connectWallet()}>
				Connect Wallet
			</Button>
		</Card>
	)
}
