import { Button, Input } from "@stellar/design-system"
import { useState } from "react"
import styles from "./AdminBookForm.module.css"

interface AdminBookFormProps {
	onSubmit: (
		title: string,
		author: string,
		genre: string,
		totalCopies: number,
	) => Promise<void>
	initialValues?: {
		title: string
		author: string
		genre: string
		totalCopies: number
	}
	submitLabel?: string
}

export const AdminBookForm: React.FC<AdminBookFormProps> = ({
	onSubmit,
	initialValues,
	submitLabel = "Add Book",
}) => {
	const [title, setTitle] = useState(initialValues?.title ?? "")
	const [author, setAuthor] = useState(initialValues?.author ?? "")
	const [genre, setGenre] = useState(initialValues?.genre ?? "")
	const [copies, setCopies] = useState(
		initialValues?.totalCopies?.toString() ?? "1",
	)
	const [loading, setLoading] = useState(false)
	const [touched, setTouched] = useState({
		title: false,
		author: false,
		genre: false,
		copies: false,
	})

	const trimmedTitle = title.trim()
	const trimmedAuthor = author.trim()
	const trimmedGenre = genre.trim()
	const parsedCopies = parseInt(copies.trim()) || 0

	const errors = {
		title: touched.title && !trimmedTitle ? "Title is required" : undefined,
		author: touched.author && !trimmedAuthor ? "Author is required" : undefined,
		genre: touched.genre && !trimmedGenre ? "Genre is required" : undefined,
		copies:
			touched.copies && parsedCopies < 1
				? "At least 1 copy required"
				: undefined,
	}

	const isValid =
		!!trimmedTitle && !!trimmedAuthor && !!trimmedGenre && parsedCopies >= 1

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setTouched({ title: true, author: true, genre: true, copies: true })
		if (!isValid) return
		setLoading(true)
		try {
			await onSubmit(trimmedTitle, trimmedAuthor, trimmedGenre, parsedCopies)
			if (!initialValues) {
				setTitle("")
				setAuthor("")
				setGenre("")
				setCopies("1")
				setTouched({ title: false, author: false, genre: false, copies: false })
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<form className={styles.AdminBookForm} onSubmit={handleSubmit}>
			<Input
				id="book-title"
				label="Title"
				placeholder="Book title"
				fieldSize="md"
				value={title}
				maxLength={100}
				onChange={(e) => setTitle(e.target.value)}
				onBlur={() => setTouched((t) => ({ ...t, title: true }))}
				error={!!errors.title}
				note={errors.title}
			/>
			<Input
				id="book-author"
				label="Author"
				placeholder="Author name"
				fieldSize="md"
				value={author}
				maxLength={100}
				onChange={(e) => setAuthor(e.target.value)}
				onBlur={() => setTouched((t) => ({ ...t, author: true }))}
				error={!!errors.author}
				note={errors.author}
			/>
			<Input
				id="book-genre"
				label="Genre"
				placeholder="Genre"
				fieldSize="md"
				value={genre}
				maxLength={50}
				onChange={(e) => setGenre(e.target.value)}
				onBlur={() => setTouched((t) => ({ ...t, genre: true }))}
				error={!!errors.genre}
				note={errors.genre}
			/>
			<Input
				id="book-copies"
				label="Total Copies"
				placeholder="1"
				fieldSize="md"
				type="number"
				value={copies}
				onChange={(e) => setCopies(e.target.value)}
				onBlur={() => setTouched((t) => ({ ...t, copies: true }))}
				error={!!errors.copies}
				note={errors.copies}
			/>
			<Button variant="primary" size="md" type="submit" disabled={loading}>
				{loading ? "Submitting..." : submitLabel}
			</Button>
		</form>
	)
}
