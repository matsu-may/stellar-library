import { Button, Card, Icon } from "@stellar/design-system"
import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
	children: ReactNode
}

interface State {
	hasError: boolean
	error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props)
		this.state = { hasError: false }
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error }
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("ErrorBoundary caught:", error, info.componentStack)
	}

	render() {
		if (this.state.hasError) {
			return (
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						minHeight: "60vh",
						padding: "2rem",
					}}
				>
					<Card>
						<div style={{ textAlign: "center" }}>
							<Icon.AlertTriangle
								size="lg"
								style={{
									color: "var(--sds-clr-red-09)",
									width: "2rem",
									height: "2rem",
									marginBottom: "1rem",
								}}
							/>
							<h2>Something went wrong</h2>
							<p style={{ color: "var(--sds-clr-gray-09)", margin: "1rem 0" }}>
								{this.state.error?.message || "An unexpected error occurred."}
							</p>
							<Button
								variant="primary"
								size="md"
								onClick={() => window.location.reload()}
							>
								Reload Page
							</Button>
						</div>
					</Card>
				</div>
			)
		}

		return this.props.children
	}
}
