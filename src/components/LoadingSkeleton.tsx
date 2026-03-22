import styles from "./LoadingSkeleton.module.css"

interface LoadingSkeletonProps {
	variant: "card" | "list" | "stats"
	count?: number
}

const SkeletonCard = () => (
	<div className={styles.card}>
		<div className={styles.line} style={{ width: "60%", height: "1.2rem" }} />
		<div className={styles.line} style={{ width: "40%", height: "0.9rem" }} />
		<div className={styles.line} style={{ width: "30%", height: "0.8rem" }} />
		<div className={styles.spacer} />
		<div className={styles.row}>
			<div className={styles.line} style={{ width: "40%", height: "0.9rem" }} />
			<div className={styles.line} style={{ width: "5rem", height: "2rem" }} />
		</div>
	</div>
)

const SkeletonList = () => (
	<div className={styles.listItem}>
		<div>
			<div className={styles.line} style={{ width: "50%", height: "1rem" }} />
			<div className={styles.line} style={{ width: "30%", height: "0.8rem" }} />
		</div>
		<div className={styles.line} style={{ width: "4rem", height: "2rem" }} />
	</div>
)

const SkeletonStats = () => (
	<div className={styles.statsCard}>
		<div className={styles.line} style={{ width: "60%", height: "0.8rem" }} />
		<div className={styles.line} style={{ width: "40%", height: "1.5rem" }} />
	</div>
)

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
	variant,
	count = 3,
}) => {
	const items = Array.from({ length: count }, (_, i) => i)

	if (variant === "card") {
		return (
			<div className={styles.cardGrid}>
				{items.map((i) => (
					<SkeletonCard key={i} />
				))}
			</div>
		)
	}

	if (variant === "list") {
		return (
			<div className={styles.listGroup}>
				{items.map((i) => (
					<SkeletonList key={i} />
				))}
			</div>
		)
	}

	return (
		<div className={styles.statsGrid}>
			{items.map((i) => (
				<SkeletonStats key={i} />
			))}
		</div>
	)
}
