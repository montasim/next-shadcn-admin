'use client'

import { BookGrid } from '@/components/books/book-grid'
import { Book } from '@/app/dashboard/books/data/schema'
import type { Book as PublicBook, Author, Category, Publication, Series } from '@/hooks/use-book'

// Transform dashboard Book to public Book with canAccess property
const toPublicBook = (book: Book): PublicBook => ({
  id: book.id,
  name: book.name,
  summary: book.summary ?? null,
  type: book.type,
  bindingType: book.bindingType ?? null,
  pageNumber: book.pageNumber ?? null,
  buyingPrice: book.buyingPrice ?? null,
  sellingPrice: book.sellingPrice ?? null,
  numberOfCopies: book.numberOfCopies ?? null,
  purchaseDate: book.purchaseDate ?? null,
  entryDate: book.entryDate ?? undefined,
  image: book.image ?? null,
  fileUrl: book.fileUrl ?? null,
  directFileUrl: book.directFileUrl ?? null,
  aiSummary: book.aiSummary ?? null,
  aiSummaryGeneratedAt: book.aiSummaryGeneratedAt ?? null,
  aiSummaryStatus: book.aiSummaryStatus ?? null,
  suggestedQuestions: book.suggestedQuestions ?? null,
  questionsStatus: book.questionsStatus ?? null,
  canAccess: true, // User has access to their own library books
  requiresPremium: book.requiresPremium ?? false,
  authors: book.authors as Author[],
  categories: book.categories as Category[],
  publications: book.publications as Publication[],
  series: book.series ? (book.series.map(s => ({
    id: s.seriesId,
    name: s.seriesName,
    description: null,
    image: null,
  })) as unknown as Series[]) : undefined,
  readingProgress: book.readingProgress?.[0] ?? null, // Take first progress entry
  progress: book.readingProgress?.[0] ? {
    currentPage: book.readingProgress[0].currentPage ?? undefined,
    progress: book.readingProgress[0].progress,
    isCompleted: book.readingProgress[0].isCompleted ?? undefined,
  } : undefined,
  statistics: {
    totalReaders: 0,
    avgProgress: 0,
  },
  analytics: {
    totalViews: 0,
  },
  entryBy: book.entryBy ?? null,
})

export function BookList({
  books,
  onEditAction,
  onCardClickAction
}: {
  books: Book[]
  onEditAction?: (book: Book) => void
  onCardClickAction?: (book: Book) => void
}) {
  const publicBooks = books.map(toPublicBook)

  // Create a map to find original book by id
  const bookMap = new Map(books.map(b => [b.id, b]))

  // Wrap callbacks to convert back to dashboard Book type
  const handleEdit = onEditAction
    ? (publicBook: PublicBook) => {
        const originalBook = bookMap.get(publicBook.id)
        if (originalBook) onEditAction(originalBook)
      }
    : undefined

  const handleCardClick = onCardClickAction
    ? (publicBook: PublicBook) => {
        const originalBook = bookMap.get(publicBook.id)
        if (originalBook) onCardClickAction(originalBook)
      }
    : undefined

  return (
    <BookGrid
      books={publicBooks}
      onEdit={handleEdit}
      onClick={handleCardClick}
      showEditActions={true}
      showProgressActions={true}
      showTypeBadge={true}
      coverHeight="default"
    />
  )
}
