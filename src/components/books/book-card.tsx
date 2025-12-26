'use client'

import React, { useState, useContext } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  Lock,
  Edit,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { calculateReadingTime } from '@/lib/utils/reading-time'
import { getUserDisplayName } from '@/lib/utils/user'
import { LibraryContext } from '@/app/(user)/library/context/library-context'
import { AddToBookshelf } from '@/components/books/add-to-bookshelf'
import { BookTypeBadge } from '@/components/books/book-type-badge'
import type { BookType } from '@prisma/client'

interface Book {
  id: string
  name: string
  type?: BookType
  summary?: string
  image?: string
  authors?: Array<{ id: string; name: string }>
  categories?: Array<{ id: string; name: string }>
  pageNumber?: number | null
  fileUrl?: string
  readingProgress?: Array<{ currentPage?: number; progress?: number; lastReadAt?: string }>
  progress?: { currentPage?: number; progress?: number; isCompleted?: boolean }
  requiresPremium?: boolean
  canAccess?: boolean
  readersCount?: number
  entryBy?: {
    id: string
    username?: string | null
    firstName?: string | null
    lastName?: string | null
    name?: string
    avatar?: string | null
  } | null
}

interface BookCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  book: Book
  variant?: 'default' | 'compact'

  // Click/navigation
  onClick?: (book: Book) => void
  viewMoreHref?: string

  // Library-specific features
  showEditActions?: boolean
  onEdit?: (book: Book) => void
  onDelete?: (book: Book) => void
  showProgressActions?: boolean

  // Public catalog features
  showTypeBadge?: boolean
  showPremiumBadge?: boolean
  showCategories?: boolean
  showReaderCount?: boolean
  showAddToBookshelf?: boolean
  showUploader?: boolean
  showLockOverlay?: boolean
  coverHeight?: 'default' | 'tall'
}

const BookCard = React.forwardRef<HTMLDivElement, BookCardProps>(
  ({
    className,
    book,
    variant = 'default',
    onClick,
    viewMoreHref,
    showEditActions = false,
    onEdit,
    onDelete,
    showProgressActions = false,
    showTypeBadge = false,
    showPremiumBadge = false,
    showCategories = false,
    showReaderCount = false,
    showAddToBookshelf = false,
    showUploader = false,
    showLockOverlay = false,
    coverHeight = 'default',
    ...props
  }, ref) => {
    // Safely get library context - it may not be available in all contexts (e.g., public books page)
    const libraryContext = useContext(LibraryContext)
    const { setOpen, setCurrentRow } = libraryContext || { setOpen: () => {}, setCurrentRow: () => {} }

    const isEbook = book.type === 'EBOOK'
    const isAudio = book.type === 'AUDIO'
    const isHardCopy = book.type === 'HARD_COPY'

    // Unified progress handling
    const progressData = book.readingProgress?.[0] || book.progress
    const progress = Math.round(progressData?.progress || 0)
    const currentPage = progressData?.currentPage || 0
    const totalPages = book.pageNumber || '?'
    const isCompleted = progressData?.isCompleted || progress >= 95

    const estimatedReadingTime = calculateReadingTime(book.pageNumber)
    const authors = book.authors?.map((a: any) => a.name).join(', ') || 'Unknown'

    const handleEdit = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (onEdit) {
        onEdit(book)
      } else {
        setCurrentRow(book)
        setOpen('edit')
      }
    }

    const handleDelete = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (onDelete) {
        onDelete(book)
      } else {
        setCurrentRow(book)
        setOpen('delete')
      }
    }

    const handleClick = () => {
      if (onClick) onClick(book)
    }

    const coverHeightClass = coverHeight === 'tall' ? 'h-64' : 'h-48'

    // Compact variant (list view)
    if (variant === 'compact') {
      return (
        <Card
          ref={ref}
          className={cn(
            'group transition-all duration-200 hover:shadow-md',
            onClick && 'cursor-pointer',
            className
          )}
          onClick={handleClick}
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
                  {showLockOverlay && (book.requiresPremium || !book.canAccess) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                      <Lock className="h-4 w-4 text-white" />
                    </div>
                  )}

                  {/* Add to Bookshelf Button - Compact */}
                  {showAddToBookshelf && (
                    <div className="absolute top-1 right-1 z-20">
                      <AddToBookshelf
                        bookId={book.id}
                        bookName={book.name}
                        variant="manage"
                        triggerClassName="h-5 w-5"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Book Info - Compact */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-base line-clamp-1 text-foreground" title={book.name}>
                    {book.name}
                  </h3>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {showTypeBadge && book.type && (
                      <BookTypeBadge type={book.type} size="sm" />
                    )}
                    {showEditActions && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 bg-background/50 hover:bg-background/80"
                          onClick={handleEdit}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 bg-background/50 hover:bg-background/80 text-destructive hover:text-destructive"
                          onClick={handleDelete}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Authors */}
                {book.authors && book.authors.length > 0 && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-1" title={`by ${authors}`}>
                    by {authors}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
                  {showReaderCount && book.readersCount && book.readersCount > 0 && (
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
                      <span>{isCompleted ? 'Completed' : `${progress}%`}</span>
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
                {viewMoreHref && (
                  <Link href={viewMoreHref} className="inline-block" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" className="w-full">
                      View More
                    </Button>
                  </Link>
                )}
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
          onClick && 'cursor-pointer',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <CardContent className="p-4">
          {/* Mobile: Horizontal layout */}
          <div className="flex gap-4 md:hidden">
            {/* Book Cover + Metadata - Mobile */}
            <div className="flex-shrink-0">
              {/* Cover Image */}
              <div className="relative mb-2">
                <div className="w-20 h-28 bg-muted rounded-t flex items-center justify-center overflow-hidden relative">
                  {book.image ? (
                    <img
                      src={getProxiedImageUrl(book.image) || book.image}
                      alt={book.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center text-muted-foreground">
                      <BookOpen className="h-8 w-8" />
                    </div>
                  )}

                  {/* Type Badge - Top Left */}
                  {showTypeBadge && book.type && (
                    <div className="absolute top-1 left-1 z-10 pointer-events-none">
                      <BookTypeBadge type={book.type} size="sm" />
                    </div>
                  )}

                  {/* Premium Badge - Bottom Left */}
                  {showPremiumBadge && book.requiresPremium && (
                    <div className="absolute bottom-1 left-1 z-10 pointer-events-none">
                      <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[9px] px-1.5 py-0.5">
                        Premium
                      </Badge>
                    </div>
                  )}

                  {/* Edit/Delete Actions - Mobile */}
                  {showEditActions && (
                    <div className="absolute top-1 right-1 z-20 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 bg-background/80 hover:bg-background/80 backdrop-blur-sm p-0"
                        onClick={handleEdit}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 bg-background/80 hover:bg-background/80 text-destructive backdrop-blur-sm p-0"
                        onClick={handleDelete}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* Add to Bookshelf Button - Mobile */}
                  {showAddToBookshelf && (
                    <div className="absolute top-1 right-1 z-20">
                      <AddToBookshelf
                        bookId={book.id}
                        bookName={book.name}
                        variant="manage"
                        triggerClassName="h-6 w-6"
                      />
                    </div>
                  )}

                  {showLockOverlay && (book.requiresPremium || !book.canAccess) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t pointer-events-none z-10">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata below image - Mobile */}
              <div className="w-20 space-y-1.5">
                {/* Uploader info */}
                {showUploader && book.entryBy && (
                  <Link
                    href={`/users/${book.entryBy.id}`}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {book.entryBy.avatar ? (
                        <img
                          src={getProxiedImageUrl(book.entryBy.avatar) || book.entryBy.avatar}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[8px] font-medium">
                          {book.entryBy.username?.[0]?.toUpperCase() ||
                           book.entryBy.firstName?.[0]?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground truncate">
                      {(book.entryBy.username || getUserDisplayName({
                        firstName: book.entryBy.firstName,
                        lastName: book.entryBy.lastName,
                        name: book.entryBy.name,
                        email: '',
                      })).substring(0, 8)}
                    </span>
                  </Link>
                )}

                {/* Reader count */}
                {showReaderCount && book.readersCount && book.readersCount > 0 && (
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{book.readersCount}</span>
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
                <p className="text-sm text-muted-foreground truncate" title={`by ${authors}`}>
                  by {authors}
                </p>
              </div>

              {/* Metadata and Actions - Mobile */}
              <div className="space-y-2">
                {/* Progress Section */}
                {progress > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>Page {currentPage} of {totalPages}</span>
                      {estimatedReadingTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {estimatedReadingTime}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  estimatedReadingTime && (
                    <div className="text-xs text-muted-foreground">{estimatedReadingTime}</div>
                  )
                )}

                {/* View More Button - Mobile */}
                {viewMoreHref && (
                  <Link href={viewMoreHref} className="block" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" className="w-full">
                      View More
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Desktop: Vertical layout */}
          <div className="hidden md:block">
            {/* Book Cover - Desktop */}
            <div className="relative w-full bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden group" style={{ height: coverHeight === 'tall' ? '16rem' : '12rem' }}>
              {book.image ? (
                <img
                  src={getProxiedImageUrl(book.image) || book.image}
                  alt={book.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center justify-center text-muted-foreground w-full h-full">
                  <div className="scale-150"><BookOpen className="h-12 w-12" /></div>
                </div>
              )}

              {/* Type Badge - Top Left */}
              {showTypeBadge && book.type && (
                <div className="absolute top-2 left-2 z-10 pointer-events-none">
                  <BookTypeBadge type={book.type} size="md" />
                </div>
              )}

              {/* Premium Badge - Bottom Left */}
              {showPremiumBadge && book.requiresPremium && (
                <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
                  <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                    Premium
                  </Badge>
                </div>
              )}

              {/* Edit/Delete Actions - Desktop */}
              {showEditActions && (
                <div className="absolute top-2 right-2 z-20 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-background/80 hover:bg-background/80 backdrop-blur-sm"
                    onClick={handleEdit}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-background/80 hover:bg-background/80 text-destructive backdrop-blur-sm"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Add to Bookshelf Button - Desktop */}
              {showAddToBookshelf && (
                <div className="absolute top-2 right-2 z-20">
                  <AddToBookshelf
                    bookId={book.id}
                    bookName={book.name}
                    variant="manage"
                    triggerClassName="h-8 w-8"
                  />
                </div>
              )}

              {/* Lock Overlay */}
              {showLockOverlay && (book.requiresPremium || !book.canAccess) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg pointer-events-none">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              )}
            </div>

            {/* Book Info - Desktop */}
            <div className="space-y-3">
              {/* Title */}
              <h3 className="font-semibold truncate text-foreground group-hover:text-primary transition-colors" title={book.name}>
                {book.name}
              </h3>

              {/* Author */}
              {book.authors && book.authors.length > 0 && (
                <p className="text-sm text-muted-foreground truncate" title={`by ${authors}`}>
                  by {authors}
                </p>
              )}

              {/* Metadata - Desktop */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {showReaderCount && book.readersCount && book.readersCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {book.readersCount} {book.readersCount === 1 ? 'reader' : 'readers'}
                  </span>
                )}
                {/* Uploader - Desktop */}
                {showUploader && book.entryBy && (
                  <Link
                    href={`/users/${book.entryBy.id}`}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Avatar className="h-5 w-5">
                      {book.entryBy.avatar ? (
                        <AvatarImage
                          src={getProxiedImageUrl(book.entryBy.avatar) || book.entryBy.avatar}
                          alt=""
                        />
                      ) : null}
                      <AvatarFallback className="text-[9px] bg-primary/10">
                        {book.entryBy.username
                          ? book.entryBy.username[0].toUpperCase()
                          : book.entryBy.firstName?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">
                      {getUserDisplayName({
                        firstName: book.entryBy.firstName,
                        lastName: book.entryBy.lastName,
                        username: book.entryBy.username,
                        name: book.entryBy.name,
                        email: '',
                      })}
                    </span>
                  </Link>
                )}
              </div>

              {/* Progress - Desktop */}
              {progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isCompleted ? 'Completed' : 'Progress'}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Page {currentPage} of {totalPages}</span>
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
              {showCategories && book.categories && book.categories.length > 0 && (
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

              {/* Progress Action Buttons (Library) */}
              {showProgressActions && (
                <div className="pt-2">
                  {progress === 0 ? (
                    <Button className="w-full" size="sm">
                      Start Reading
                    </Button>
                  ) : isCompleted ? (
                    <Button variant="outline" className="w-full" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Read Again
                    </Button>
                  ) : (
                    <Button className="w-full" size="sm">
                      <Clock className="h-4 w-4 mr-2" />
                      Continue
                    </Button>
                  )}
                </div>
              )}

              {/* View More Button - Desktop */}
              {viewMoreHref && (
                <Link href={viewMoreHref} className="block" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" className="w-full">
                    View More
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)

BookCard.displayName = 'BookCard'

export { BookCard }
