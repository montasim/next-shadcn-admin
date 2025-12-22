import { getUserBooks } from './actions'
import { BookList } from './book-list'

export default async function MyBooksPage() {
  const books = await getUserBooks()

  return <BookList initialBooks={books} />
}
