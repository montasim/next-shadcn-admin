'use client'

import { BookCard } from './book-card'
import { Book } from '@/app/dashboard/books/data/schema'
import { Link } from 'next/link'

export interface BookGridProps {
  books: Book[]
  // View mode
  viewMode?: 'grid' | 'list'
  // Layout
  className?: string
  gridClassName?: string
  // Individual card props
  variant?: 'default' | 'compact'
  coverHeight?: 'default' | 'tall'
  // Feature flags
  showTypeBadge?: boolean
  showPremiumBadge?: boolean
  showCategories?: boolean
  showReaderCount?: boolean
  showAddToBookshelf?: boolean
  showUploader?: boolean
  showLockOverlay?: boolean
  showEditActions?: boolean
  showProgressActions?: boolean
  // Interactions
  onEdit?: (book: Book) => void
  onDelete?: (book: Book) => void
  onClick?: (book: Book) => void
  viewMoreHref?: string | ((book: Book) => string)
}

/**
 * Reusable BookGrid component for displaying books in a grid or list layout.
 * Supports both public catalog view and library management view.
 */
export function BookGrid({
  books,
  viewMode = 'grid',
  className,
  gridClassName,
  variant = 'default',
  coverHeight = 'default',
  showTypeBadge = false,
  showPremiumBadge = false,
  showCategories = false,
  showReaderCount = false,
  showAddToBookshelf = false,
  showUploader = false,
  showLockOverlay = false,
  showEditActions = false,
  showProgressActions = false,
  onEdit,
  onDelete,
  onClick,
  viewMoreHref,
}: BookGridProps) {
  if (books.length === 0) {
    return null
  }

  const getHref = (book: Book) => {
    if (typeof viewMoreHref === 'function') {
      return viewMoreHref(book)
    }
    return viewMoreHref || ''
  }

  // List/Compact view uses a 3-column grid layout with compact variant
  if (viewMode === 'list') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${gridClassName || ''}`}>
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            variant="compact"
            coverHeight={coverHeight}
            onEdit={onEdit}
            onDelete={onDelete}
            onClick={onClick}
            viewMoreHref={getHref(book)}
            showTypeBadge={showTypeBadge}
            showPremiumBadge={showPremiumBadge}
            showCategories={showCategories}
            showReaderCount={showReaderCount}
            showAddToBookshelf={showAddToBookshelf}
            showUploader={showUploader}
            showLockOverlay={showLockOverlay}
            showEditActions={showEditActions}
            showProgressActions={showProgressActions}
          />
        ))}
      </div>
    )
  }

  // Grid view uses responsive columns
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${gridClassName || ''}`}>
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          variant={variant}
          coverHeight={coverHeight}
          onEdit={onEdit}
          onDelete={onDelete}
          onClick={onClick}
          viewMoreHref={getHref(book)}
          showTypeBadge={showTypeBadge}
          showPremiumBadge={showPremiumBadge}
          showCategories={showCategories}
          showReaderCount={showReaderCount}
          showAddToBookshelf={showAddToBookshelf}
          showUploader={showUploader}
          showLockOverlay={showLockOverlay}
          showEditActions={showEditActions}
          showProgressActions={showProgressActions}
        />
      ))}
    </div>
  )
}
