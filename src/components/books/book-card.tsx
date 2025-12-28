'use client'

import React, { useState, useContext } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { calculateReadingTime } from '@/lib/utils/reading-time'
import { getUserDisplayName } from '@/lib/utils/user'
import { LibraryContext } from '@/app/(user)/library/context/library-context'
import { AddToBookshelf } from '@/components/books/add-to-bookshelf'
import { BookTypeBadge } from '@/components/books/book-type-badge'
import { useQueryClient } from '@tanstack/react-query'
import type { Book as BookTypePublic } from '@/hooks/use-book'

interface BookCardProps extends Omit<React.ComponentPropsWithoutRef<typeof Card>, 'onClick'> {
  book: BookTypePublic
  variant?: 'default' | 'compact'

  // Click/navigation
  onClick?: (book: BookTypePublic) => void
  viewMoreHref?: string

  // Library-specific features
  showEditActions?: boolean
  onEdit?: (book: BookTypePublic) => void
  onDelete?: (book: BookTypePublic) => void
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
    const queryClient = useQueryClient()
    const router = useRouter()

    // Prefetch book data on hover
    const handleMouseEnter = () => {
      if (viewMoreHref) {
        // Extract book ID from href (e.g., /books/d7dfc67b-7179-43c1-9386-0e46c36618e4)
        const bookId = viewMoreHref.split('/').pop()
        if (bookId) {
          queryClient.prefetchQuery({
            queryKey: ['book', bookId],
            queryFn: async () => {
              const response = await fetch(`/api/public/books/${bookId}`)
              if (!response.ok) {
                throw new Error('Failed to fetch book')
              }
              return response.json()
            }
          })
        }
      }
    }

    // Safely get library context - it may not be available in all contexts (e.g., public books page)
    const libraryContext = useContext(LibraryContext)
    const { setOpen, setCurrentRow } = libraryContext || { setOpen: () => {}, setCurrentRow: () => {} }

    const isEbook = book.type === 'EBOOK'
    const isAudio = book.type === 'AUDIO'
    const isHardCopy = book.type === 'HARD_COPY'

    // Get icon based on book type
    const getTypeIcon = () => {
      return <BookOpen className="h-6 w-6" />
    }

    // Unified progress handling - check both readingProgress and progress fields
    const progressData = book.readingProgress || book.progress
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

    // Compact variant (list view) - Mobile only
    if (variant === 'compact') {
      return (
        <Card
          ref={ref}
          className={cn(
            'group transition-all duration-200 hover:shadow-md',
            book.requiresPremium && 'shadow-md shadow-purple-500/20 border-purple-500/50',
            onClick && 'cursor-pointer',
            className
          )}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          {...props}
        >
          <CardContent className="p-3">
            {/* Unified layout for both mobile and desktop list view */}
            <div>
              {/* Badges - Top right of card */}
              <div className="flex justify-end gap-1 mb-2">
                {showTypeBadge && book.type && (
                  <BookTypeBadge type={book.type} size="sm" showIcon={false} />
                )}
                {showPremiumBadge && book.requiresPremium && (
                  <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] px-2 py-0.5">
                    Premium
                  </Badge>
                )}
              </div>

              <div className="flex gap-3">
                {/* Book Cover - Larger on mobile */}
                <div className="flex-shrink-0">
                  <div className="relative w-36 h-52 overflow-hidden rounded bg-muted">
                    {book.image ? (
                      <Image
                        src={getProxiedImageUrl(book.image) || book.image}
                        alt={book.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="144px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {getTypeIcon()}
                      </div>
                    )}
                    {showLockOverlay && (book.requiresPremium || !book.canAccess) && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                        <Lock className="h-5 w-5 text-white" />
                      </div>
                    )}

                    {/* Add to Bookshelf Button - Top right of image */}
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
                  </div>

                  {/* Reader count below image */}
                  {showReaderCount && (book.statistics?.totalReaders || book.analytics?.totalViews) && (
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{book.statistics?.totalReaders || book.analytics?.totalViews || 0}</span>
                    </div>
                  )}
                </div>

                {/* Book Info - Mobile */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm line-clamp-1 mb-1" title={book.name}>
                      {book.name}
                    </h3>

                    {/* Authors - Not clickable */}
                    {book.authors && book.authors.length > 0 && (
                      <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1" title={`by ${authors}`}>
                        by {authors}
                      </p>
                    )}

                    {/* Uploaded by - Clickable, below author */}
                    {showUploader && book.entryBy && typeof book.entryBy === 'object' && (
                      <Link
                        href={`/users/${book.entryBy.id}`}
                        className="flex items-center gap-1 hover:text-foreground transition-colors mb-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                          {book.entryBy.avatar ? (
                            <Image
                              src={getProxiedImageUrl(book.entryBy.avatar) || book.entryBy.avatar}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="16px"
                              unoptimized
                            />
                          ) : (
                            <span className="text-[8px] font-medium">
                              {book.entryBy.username?.[0]?.toUpperCase() ||
                               book.entryBy.firstName?.[0]?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate">
                          <span className="font-medium">Uploaded by</span>{' '}
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

                    {/* Categories - Below uploader, clickable */}
                    {showCategories && book.categories && book.categories.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mb-2">
                        {book.categories.slice(0, 3).map((category) => (
                          <Link
                            key={category.id}
                            href={`/categories/${category.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 truncate max-w-[80px] h-5 flex items-center">
                              {category.name}
                            </Badge>
                          </Link>
                        ))}
                        {book.categories.length > 3 && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 h-5 flex items-center">
                            +{book.categories.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom section: Page count, read time, progress, and View More */}
                  <div className="space-y-1.5 mt-auto">
                    {/* Page count and read time - justify-between */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Page {book.pageNumber || '?'}</span>
                      {estimatedReadingTime && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {estimatedReadingTime}
                        </span>
                      )}
                    </div>

                    {/* Progress bar (if any progress) */}
                    {progress > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">{isCompleted ? 'Completed' : 'Progress'}</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1" />
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Page {currentPage} of {totalPages}</span>
                          {estimatedReadingTime && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {estimatedReadingTime}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* View More and Continue buttons - side by side */}
                    <div className="flex items-center gap-2">
                      {showProgressActions ? (
                        <>
                          {viewMoreHref && (
                            <Link
                              href={viewMoreHref}
                              className="flex-1"
                              onClick={(e) => e.stopPropagation()}
                              onMouseEnter={handleMouseEnter}
                            >
                              <Button variant="outline" size="sm" className="w-full h-6 text-[10px] px-2">
                                View More
                              </Button>
                            </Link>
                          )}

                          <Button
                            size="sm"
                            className="flex-1 h-6 text-[10px]"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              const baseUrl = viewMoreHref || `/books/${book.id}`
                              const url = baseUrl.includes('?') ? `${baseUrl}&openReader=true` : `${baseUrl}?openReader=true`
                              router.push(url)
                            }}
                          >
                            {progress === 0 ? 'Start' : isCompleted ? 'Read Again' : 'Continue'}
                          </Button>
                        </>
                      ) : (
                        viewMoreHref && (
                          <Link
                            href={viewMoreHref}
                            className="w-full"
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={handleMouseEnter}
                          >
                            <Button variant="outline" size="sm" className="w-full h-6 text-[10px] px-2">
                              View More
                            </Button>
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit actions - bottom right for mobile */}
              {showEditActions && (
                <div className="flex justify-end gap-1 mt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleEdit}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
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
          book.requiresPremium && 'shadow-lg shadow-purple-500/20 border-purple-500/50',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        {...props}
      >
        <CardContent className="p-4">
          {/* Unified vertical layout for both mobile and desktop */}
          {/* Book Cover */}
          <div className="relative w-full bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden group" style={{ height: coverHeight === 'tall' ? '14rem' : '10rem' }}>
            {book.image ? (
              <Image
                src={getProxiedImageUrl(book.image) || book.image}
                alt={book.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized
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
                  <Crown className="h-3 w-3 mr-1 hidden sm:inline-block" />
                  Premium
                </Badge>
              </div>
            )}

            {/* Edit/Delete Actions */}
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

            {/* Add to Bookshelf Button */}
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

            {/* Reader Count - Bottom Right of Image */}
            {showReaderCount && (book.statistics?.totalReaders || book.analytics?.totalViews) && (
              <div className="absolute bottom-2 right-2 z-10 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 pointer-events-none">
                <Users className="h-3.5 w-3.5 text-white" />
                <span className="text-[10px] font-medium text-white">
                  {book.statistics?.totalReaders || book.analytics?.totalViews || 0}
                </span>
              </div>
            )}
          </div>

          {/* Book Info */}
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

            {/* Metadata */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {/* Uploader */}
              {showUploader && book.entryBy && typeof book.entryBy === 'object' && (
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

            {/* Progress */}
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

            {/* Categories (limit to 2) */}
            {showCategories && book.categories && book.categories.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap overflow-hidden">
                {book.categories.slice(0, 2).map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge variant="outline" className="text-xs truncate max-w-[120px]" title={category.name}>
                      {category.name}
                    </Badge>
                  </Link>
                ))}
                {book.categories.length > 2 && (
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    +{book.categories.length - 2} more
                  </Badge>
                )}
              </div>
            )}

            {/* Action Buttons - Side by side */}
            <div className="flex items-center justify-between gap-2 pt-2">
              {/* Progress Action Buttons (Library) */}
              {showProgressActions && (
                <>
                  {progress === 0 ? (
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const baseUrl = viewMoreHref || `/books/${book.id}`
                        const url = baseUrl.includes('?') ? `${baseUrl}&openReader=true` : `${baseUrl}?openReader=true`
                        router.push(url)
                      }}
                    >
                      Start Reading
                    </Button>
                  ) : isCompleted ? (
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const baseUrl = viewMoreHref || `/books/${book.id}`
                        const url = baseUrl.includes('?') ? `${baseUrl}&openReader=true` : `${baseUrl}?openReader=true`
                        router.push(url)
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Read Again
                    </Button>
                  ) : (
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const baseUrl = viewMoreHref || `/books/${book.id}`
                        const url = baseUrl.includes('?') ? `${baseUrl}&openReader=true` : `${baseUrl}?openReader=true`
                        router.push(url)
                      }}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Continue
                    </Button>
                  )}
                </>
              )}

              {/* View More Button */}
              {viewMoreHref && (
                <Link
                  href={viewMoreHref}
                  className={showProgressActions ? 'flex-1' : 'w-full'}
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={handleMouseEnter}
                >
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
