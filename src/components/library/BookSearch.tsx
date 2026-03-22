import { Input } from "@stellar/design-system"
import { useRef, useState } from "react"
import styles from "./BookSearch.module.css"

interface BookSearchProps {
	value: string
	onChange: (value: string) => void
}

export const BookSearch: React.FC<BookSearchProps> = ({ value, onChange }) => {
	const [inputValue, setInputValue] = useState(value)
	const timerRef = useRef<number>(undefined)

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value
		setInputValue(val)
		clearTimeout(timerRef.current)
		timerRef.current = window.setTimeout(() => {
			onChange(val)
		}, 300)
	}

	return (
		<div className={styles.BookSearch}>
			<Input
				id="book-search"
				placeholder="Search by title, author, or genre..."
				fieldSize="md"
				value={inputValue}
				onChange={handleChange}
			/>
		</div>
	)
}
