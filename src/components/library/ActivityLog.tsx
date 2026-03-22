import { Card, Icon } from "@stellar/design-system"
import { type Api } from "@stellar/stellar-sdk/rpc"
import { networks } from "library"
import { useCallback, useState } from "react"
import { useSubscription } from "../../hooks/useSubscription"
import styles from "./ActivityLog.module.css"

interface ActivityEvent {
	id: string
	type: "member" | "book_add" | "borrow" | "return"
	ledger: number
	description: string
}

const MAX_EVENTS = 50
const contractId = networks.standalone.contractId

function describeEvent(
	type: ActivityEvent["type"],
	event: Api.EventResponse,
): string {
	try {
		// Event value is XDR-encoded, but we can use the raw topic/value for basic display
		const topicStr = event.topic
			.map((t) => {
				try {
					return t.value().toString()
				} catch {
					return "?"
				}
			})
			.join(", ")

		switch (type) {
			case "member":
				return `New member registered (ledger ${event.ledger})`
			case "book_add":
				return `Book added to catalog (ledger ${event.ledger})`
			case "borrow":
				return `Book borrowed (ledger ${event.ledger})`
			case "return":
				return `Book returned (ledger ${event.ledger})`
			default:
				return `Event: ${topicStr}`
		}
	} catch {
		return `${type} event at ledger ${event.ledger}`
	}
}

function iconForType(type: ActivityEvent["type"]) {
	switch (type) {
		case "member":
			return <Icon.UserPlus01 size="sm" />
		case "book_add":
			return <Icon.BookOpen01 size="sm" />
		case "borrow":
			return <Icon.ArrowRight size="sm" />
		case "return":
			return <Icon.CheckCircle size="sm" />
	}
}

export const ActivityLog: React.FC = () => {
	const [events, setEvents] = useState<ActivityEvent[]>([])

	const addEvent = useCallback(
		(type: ActivityEvent["type"]) => (event: Api.EventResponse) => {
			const entry: ActivityEvent = {
				id: `${type}-${event.ledger}-${Date.now()}`,
				type,
				ledger: event.ledger,
				description: describeEvent(type, event),
			}
			setEvents((prev) => [entry, ...prev].slice(0, MAX_EVENTS))
		},
		[],
	)

	useSubscription(contractId, "member", addEvent("member"))
	useSubscription(contractId, "book_add", addEvent("book_add"))
	useSubscription(contractId, "borrow", addEvent("borrow"))
	useSubscription(contractId, "return", addEvent("return"))

	return (
		<Card>
			<h2>Recent Activity</h2>
			<div className={styles.feed}>
				{events.length === 0 ? (
					<p className={styles.empty}>Listening for events...</p>
				) : (
					events.map((evt) => (
						<div key={evt.id} className={styles.item}>
							<span className={styles.icon}>{iconForType(evt.type)}</span>
							<span className={styles.text}>{evt.description}</span>
						</div>
					))
				)}
			</div>
		</Card>
	)
}
