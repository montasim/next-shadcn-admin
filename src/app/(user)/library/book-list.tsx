'use client'

import { BookCard } from '@/components/books/book-card'
import { Book } from '@/app/dashboard/books/data/schema'

export function BookList({
  books,
  openDrawer,
  onEdit,
  onCardClick
}: {
  books: Book[]
  openDrawer?: () => void
  onEdit?: (book: Book) => void
  onCardClick?: (book: Book) => void
}) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onEdit={onEdit}
          onClick={onCardClick}
          showEditActions={true}
          showProgressActions={true}
          coverHeight="default"
        />
      ))}
    </div>
  )
}
