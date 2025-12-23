'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  BookOpen,
  Headphones,
  FileText,
  Users,
  Clock,
  CheckCircle,
  Lock,
  BookmarkPlus,
  Check,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { useAuth } from '@/context/auth-context'
import { addBookToBookshelf, getUserBookshelvesForBook } from '@/app/(user)/library/actions'
import { toast } from '@/hooks/use-toast'
import type { BookType } from '@prisma/client'

interface Book {
  id: string
  name: string
  summary?: string
  type: BookType
  image?: string
  requiresPremium: boolean
  canAccess: boolean
  authors: Array<{
    id: string
    name: string
  }>
  categories: Array<{
    id: string
    name: string
  }>
  fileUrl?: string
  readersCount?: number
  pageNumber?: number | null
  progress?: {
    currentPage?: number
    progress: number
    isCompleted?: boolean
  }
}

interface BookCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  book: Book
  variant?: 'default' | 'compact'
}

// Calculate estimated reading time based on page count (average reading speed: ~2 minutes per page)
function calculateReadingTime(pageCount?: number | null): string | null {
  if (!pageCount || pageCount <= 0) return null
  const minutesPerPage = 2
  const totalMinutes = pageCount * minutesPerPage

  if (totalMinutes < 60) {
    return `${totalMinutes} min read`
  }
  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`
}

const BookCard = React.forwardRef<HTMLDivElement, BookCardProps>(
  ({ className, book, variant = 'default', ...props }, ref) => {
    const { user } = useAuth()
    const isEbook = book.type === 'EBOOK'
    const isAudio = book.type === 'AUDIO'
    const isHardCopy = book.type === 'HARD_COPY'

    // Bookshelf state
    const [bookshelves, setBookshelves] = useState<any[]>([])
    const [loadingBookshelves, setLoadingBookshelves] = useState(false)
    const [addingToBookshelf, setAddingToBookshelf] = useState<string | null>(null)

    const getTypeIcon = () => {
      switch (book.type) {
        case 'EBOOK':
          return <FileText className="h-4 w-4" />
        case 'AUDIO':
          return <Headphones className="h-4 w-4" />
        case 'HARD_COPY':
          return <BookOpen className="h-4 w-4" />
        default:
          return <BookOpen className="h-4 w-4" />
      }
    }

    const getTypeLabel = () => {
      switch (book.type) {
        case 'EBOOK':
          return 'Ebook'
        case 'AUDIO':
          return 'Audiobook'
        case 'HARD_COPY':
          return 'Hard Copy'
        default:
          return 'Book'
      }
    }

    const getTypeColor = () => {
      switch (book.type) {
        case 'EBOOK':
          return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        case 'AUDIO':
          return 'bg-purple-100 text-purple-800 hover:bg-purple-200'
        case 'HARD_COPY':
          return 'bg-green-100 text-green-800 hover:bg-green-200'
        default:
          return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      }
    }

    const estimatedReadingTime = calculateReadingTime(book.pageNumber)
    const progress = Math.round(book.progress?.progress || 0)
    const currentPage = book.progress?.currentPage || 0
    const totalPages = book.pageNumber || '?'

    // Fetch user's bookshelves when popover opens
    const handleBookshelfOpen = async (open: boolean) => {
      if (open && user) {
        setLoadingBookshelves(true)
        try {
          const shelves = await getUserBookshelvesForBook(book.id)
          setBookshelves(shelves)
        } catch (error) {
          console.error('Failed to fetch bookshelves:', error)
          toast({
            title: 'Error',
            description: 'Failed to load bookshelves. Please try again.',
            variant: 'destructive',
          })
        } finally {
          setLoadingBookshelves(false)
        }
      }
    }

    // Add book to bookshelf
    const handleAddToBookshelf = async (bookshelfId: string, bookshelfName: string) => {
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please login to add books to your library.',
          variant: 'destructive',
        })
        return
      }

      setAddingToBookshelf(bookshelfId)
      try {
        const result = await addBookToBookshelf(bookshelfId, book.id)
        if (result.success) {
          toast({
            title: 'Added to library',
            description: `"${book.name}" has been added to "${bookshelfName}".`,
          })
          // Refresh bookshelves to update hasBook status
          const shelves = await getUserBookshelvesForBook(book.id)
          setBookshelves(shelves)
        } else {
          toast({
            title: 'Failed to add',
            description: result.message,
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: 'Failed to add',
          description: 'An error occurred while adding the book.',
          variant: 'destructive',
        })
      } finally {
        setAddingToBookshelf(null)
      }
    }

    // Compact variant (list view)
    if (variant === 'compact') {
      return (
        <Card
          ref={ref}
          className={cn(
            'group transition-all duration-200 hover:shadow-md',
            className
          )}
          {...props}
        >
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Book Cover - Compact */}
              <div className="flex-shrink-0">
                <div className="relative w-16 h-20 overflow-hidden rounded bg-muted">
                  {book.image ? (
                    <img
                      src={getProxiedImageUrl(book.image) || book.image}
                      alt={book.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {getTypeIcon()}
                    </div>
                  )}
                  {!book.canAccess && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                      <Lock className="h-4 w-4 text-white" />
                    </div>
                  )}

                  {/* Add to Bookshelf Button - Compact */}
                  <Popover onOpenChange={handleBookshelfOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 z-20 h-5 w-5 bg-background/80 hover:bg-background backdrop-blur-sm p-0"
                        aria-label="Add to bookshelf"
                      >
                        <BookmarkPlus className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="end">
                      <div className="text-sm font-medium mb-2 px-2">Add to Bookshelf</div>
                      {!user ? (
                        <div className="text-sm text-muted-foreground py-2 px-2">
                          Please login to add books to your bookshelves.
                        </div>
                      ) : loadingBookshelves ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : bookshelves.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-2 px-2">
                          No bookshelves found. Create one in your library.
                        </div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto">
                          {bookshelves.map((shelf) => (
                            <button
                              key={shelf.id}
                              onClick={() => handleAddToBookshelf(shelf.id, shelf.name)}
                              disabled={shelf.hasBook || addingToBookshelf === shelf.id}
                              className={cn(
                                'w-full text-left px-2 py-2 text-sm rounded-md hover:bg-accent transition-colors flex items-center justify-between',
                                shelf.hasBook && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              <span className="truncate">{shelf.name}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-2">
                                {shelf._count.books}
                                {shelf.hasBook && <Check className="h-3 w-3 text-green-600" />}
                                {addingToBookshelf === shelf.id && (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                )}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Book Info - Compact */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-base line-clamp-1 text-foreground" title={book.name}>
                    {book.name}
                  </h3>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Type Badge */}
                    <Badge
                      variant="secondary"
                      className={cn('text-xs', getTypeColor())}
                    >
                      {getTypeLabel()}
                    </Badge>
                  </div>
                </div>

                {/* Authors */}
                {book.authors.length > 0 && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-1" title={`by ${book.authors.map(author => author.name).join(', ')}`}>
                    by {book.authors.map(author => author.name).join(', ')}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
                  {book.readersCount && book.readersCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {book.readersCount}
                    </span>
                  )}
                </div>

                {/* Progress - Compact */}
                {progress > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>
                        {book.progress?.isCompleted || progress >= 95 ? 'Completed' : `${progress}%`}
                      </span>
                      <span className="flex items-center gap-2">
                        Page {currentPage} of {totalPages}
                        {estimatedReadingTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {estimatedReadingTime}
                          </span>
                        )}
                      </span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                )}

                {/* View More Button */}
                <Link href={`/books/${book.id}`} className="inline-block">
                  <Button variant="outline" size="sm" className="w-full">
                    View More
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    // Default variant - responsive (horizontal on mobile, vertical on desktop)
    return (
      <Card
        ref={ref}
        className={cn(
          'group transition-all hover:shadow-lg',
          className
        )}
        {...props}
      >
        <CardContent className="p-4">
          {/* Mobile: Horizontal layout */}
          <div className="flex gap-4 md:hidden">
            {/* Book Cover - Mobile */}
            <div className="flex-shrink-0 relative">
              <div className="w-20 h-28 bg-muted rounded flex items-center justify-center overflow-hidden relative">
                {book.image ? (
                  <img
                    src={getProxiedImageUrl(book.image) || book.image}
                    alt={book.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center text-muted-foreground">
                    {getTypeIcon()}
                  </div>
                )}

                {/* Type Badge - Top Left */}
                <div className="absolute top-1 left-1 z-10 pointer-events-none">
                  <Badge
                    variant="secondary"
                    className={cn('text-[10px] px-1 py-0', getTypeColor())}
                  >
                    {getTypeLabel()}
                  </Badge>
                </div>

                {/* Add to Bookshelf Button - Mobile */}
                <Popover onOpenChange={handleBookshelfOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 z-20 h-6 w-6 bg-background/80 hover:bg-background backdrop-blur-sm p-0"
                      aria-label="Add to bookshelf"
                    >
                      <BookmarkPlus className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="end">
                    <div className="text-sm font-medium mb-2 px-2">Add to Bookshelf</div>
                    {!user ? (
                      <div className="text-sm text-muted-foreground py-2 px-2">
                        Please login to add books to your bookshelves.
                      </div>
                    ) : loadingBookshelves ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : bookshelves.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2 px-2">
                        No bookshelves found. Create one in your library.
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {bookshelves.map((shelf) => (
                          <button
                            key={shelf.id}
                            onClick={() => handleAddToBookshelf(shelf.id, shelf.name)}
                            disabled={shelf.hasBook || addingToBookshelf === shelf.id}
                            className={cn(
                              'w-full text-left px-2 py-2 text-sm rounded-md hover:bg-accent transition-colors flex items-center justify-between',
                              shelf.hasBook && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            <span className="truncate">{shelf.name}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-2">
                              {shelf._count.books}
                              {shelf.hasBook && <Check className="h-3 w-3 text-green-600" />}
                              {addingToBookshelf === shelf.id && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {!book.canAccess && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded pointer-events-none z-10">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Book Info - Mobile */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold line-clamp-1 text-sm mb-1" title={book.name}>
                  {book.name}
                </h3>
                <p className="text-sm text-muted-foreground truncate" title={`by ${book.authors.map(a => a.name).join(', ') || 'Unknown'}`}>
                  by {book.authors.map(a => a.name).join(', ') || 'Unknown'}
                </p>
              </div>

              {/* Metadata and View More - Mobile */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {book.readersCount && book.readersCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {book.readersCount}
                    </span>
                  )}
                </div>

                {/* View More Button - Mobile */}
                <Link href={`/books/${book.id}`} className="block">
                  <Button variant="outline" size="sm" className="w-full">
                    View More
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Desktop: Vertical layout */}
          <div className="hidden md:block">
            {/* Book Cover - Desktop */}
            <div className="relative w-full h-64 bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden group">
              {book.image ? (
                <img
                  src={getProxiedImageUrl(book.image) || book.image}
                  alt={book.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center justify-center text-muted-foreground w-full h-full">
                  <div className="scale-150">{getTypeIcon()}</div>
                </div>
              )}

              {/* Type Badge - Top Left */}
              <div className="absolute top-2 left-2 z-10 pointer-events-none">
                <Badge
                  variant="secondary"
                  className={cn('text-xs', getTypeColor())}
                >
                  {getTypeLabel()}
                </Badge>
              </div>

              {/* Premium Badge - Top Right (if premium) */}
              {book.requiresPremium && (
                <div className="absolute top-2 right-12 z-10 pointer-events-none">
                  <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                    Premium
                  </Badge>
                </div>
              )}

              {/* Add to Bookshelf Button - Desktop */}
              <Popover onOpenChange={handleBookshelfOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-20 h-7 w-7 bg-background/80 hover:bg-background backdrop-blur-sm p-0"
                    aria-label="Add to bookshelf"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="text-sm font-medium mb-2 px-2">Add to Bookshelf</div>
                  {!user ? (
                    <div className="text-sm text-muted-foreground py-2 px-2">
                      Please login to add books to your bookshelves.
                    </div>
                  ) : loadingBookshelves ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : bookshelves.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2 px-2">
                      No bookshelves found. Create one in your library.
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {bookshelves.map((shelf) => (
                        <button
                          key={shelf.id}
                          onClick={() => handleAddToBookshelf(shelf.id, shelf.name)}
                          disabled={shelf.hasBook || addingToBookshelf === shelf.id}
                          className={cn(
                            'w-full text-left px-2 py-2 text-sm rounded-md hover:bg-accent transition-colors flex items-center justify-between',
                            shelf.hasBook && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <span className="truncate">{shelf.name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-2">
                            {shelf._count.books}
                            {shelf.hasBook && <Check className="h-3 w-3 text-green-600" />}
                            {addingToBookshelf === shelf.id && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* Lock Overlay */}
              {!book.canAccess && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg pointer-events-none">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              )}
            </div>

            {/* Book Info - Desktop */}
            <div className="space-y-3">

              {/* Title */}
              <h3 className="font-semibold line-clamp-1 text-foreground" title={book.name}>
                {book.name}
              </h3>

              {/* Author */}
              {book.authors.length > 0 && (
                <p className="text-sm text-muted-foreground line-clamp-1" title={`by ${book.authors.map(author => author.name).join(', ')}`}>
                  by {book.authors.map(author => author.name).join(', ')}
                </p>
              )}

              {/* Metadata - Desktop */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {book.readersCount && book.readersCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {book.readersCount} {book.readersCount === 1 ? 'reader' : 'readers'}
                  </span>
                )}
              </div>

              {/* Progress - Desktop */}
              {progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {book.progress?.isCompleted || progress >= 95 ? 'Completed' : 'Progress'}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                      Page {currentPage} of {totalPages}
                      {estimatedReadingTime && (
                          <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                              {estimatedReadingTime}
                        </span>
                      )}
                  </div>
                </div>
              )}

              {/* Categories - Desktop (limit to 2) */}
              {book.categories.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap overflow-hidden">
                  {book.categories.slice(0, 2).map((category) => (
                    <Badge key={category.id} variant="outline" className="text-xs truncate max-w-[120px]" title={category.name}>
                      {category.name}
                    </Badge>
                  ))}
                  {book.categories.length > 2 && (
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      +{book.categories.length - 2} more
                    </Badge>
                  )}
                </div>
              )}

              {/* View More Button - Desktop */}
              <Link href={`/books/${book.id}`} className="block">
                <Button variant="outline" size="sm" className="w-full">
                  View More
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)

BookCard.displayName = 'BookCard'

export { BookCard }
