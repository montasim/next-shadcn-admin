'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Headphones,
  FileText,
  Users,
  Star,
  Lock,
  Eye,
  ArrowRight,
  Bookmark,
  Share2
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
  progress?: {
    currentPage?: number
    progress: number
    isCompleted?: boolean
  }
}

interface BookCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  book: Book
  variant?: 'default' | 'compact'
  showProgress?: boolean
}

const BookCard = React.forwardRef<HTMLDivElement, BookCardProps>(
  ({ className, book, variant = 'default', showProgress = false, ...props }, ref
) => {
  const isEbook = book.type === 'EBOOK'
  const isAudio = book.type === 'AUDIO'
  const isHardCopy = book.type === 'HARD_COPY'

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

  if (variant === 'compact') {
    return (
      <Card
        ref={ref}
        className={cn(
          'group cursor-pointer transition-all duration-200 hover:shadow-md',
          className
        )}
        {...props}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Book Cover - Compact */}
            <div className="flex-shrink-0">
              <Link href={`/books-old/${book.id}`}>
                <div className="relative w-16 h-20 overflow-hidden rounded">
                  {book.image ? (
                    <Image
                      src={book.image}
                      alt={book.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <div className="scale-75">
                        {getTypeIcon()}
                      </div>
                    </div>
                  )}
                  {!book.canAccess && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                      <Lock className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </Link>
            </div>

            {/* Book Info - Compact */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Link href={`/books-old/${book.id}`}>
                  <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                    {book.name}
                  </h3>
                </Link>

                {/* Type Badge */}
                <Badge
                  variant="secondary"
                  className={cn('text-xs flex-shrink-0', getTypeColor())}
                >
                  {getTypeLabel()}
                </Badge>
              </div>

              {/* Authors */}
              {book.authors.length > 0 && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                  by {book.authors.map(author => author.name).join(', ')}
                </p>
              )}

              {/* Categories - Compact */}
              {book.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {book.categories.slice(0, 2).map((category) => (
                    <Badge key={category.id} variant="outline" className="text-xs">
                      {category.name}
                    </Badge>
                  ))}
                  {book.categories.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{book.categories.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Actions - Compact */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {book.requiresPremium && (
                    <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                      Premium
                    </Badge>
                  )}
                  {book.readersCount && book.readersCount > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {book.readersCount}
                    </span>
                  )}
                </div>

                {book.canAccess ? (
                  <Link href={`/books-old/${book.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      {isEbook && 'Read'}
                      {isAudio && 'Listen'}
                      {isHardCopy && 'View'}
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/premium`}>
                    <Button size="sm">
                      <Lock className="h-4 w-4 mr-1" />
                      Upgrade
                    </Button>
                  </Link>
                )}
              </div>

              {/* Progress - Compact */}
              {showProgress && book.progress && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>
                      {book.progress.isCompleted ? 'Completed' : `${Math.round(book.progress.progress)}%`}
                    </span>
                    {book.progress.currentPage && (
                      <span>
                        Page {book.progress.currentPage}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-muted rounded-full h-1">
                    <div
                      className="bg-primary h-1 rounded-full transition-all duration-300"
                      style={{ width: `${book.progress.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      ref={ref}
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:shadow-lg',
        className
      )}
      {...props}
    >
      {/* Book Cover */}
      <div className="relative">
        <Link href={`/books-old/${book.id}`}>
          <div className="aspect-[3/4] overflow-hidden rounded-t-lg">
            {book.image ? (
              <Image
                src={book.image}
                alt={book.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                {getTypeIcon()}
              </div>
            )}
            {!book.canAccess && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                <Lock className="h-8 w-8 text-white" />
              </div>
            )}
            {showProgress && book.progress && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                <div className="flex items-center justify-between text-xs">
                  <span>
                    {book.progress.isCompleted ? 'Completed' : `${Math.round(book.progress.progress)}%`}
                  </span>
                  {book.progress.currentPage && (
                    <span>
                      Page {book.progress.currentPage}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Link>

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <Badge
            variant="secondary"
            className={cn('text-xs', getTypeColor())}
          >
            {getTypeLabel()}
          </Badge>
        </div>

        {/* Premium Badge */}
        {book.requiresPremium && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
              Premium
            </Badge>
          </div>
        )}

        {/* Readers Count */}
        {book.readersCount && book.readersCount > 0 && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-black/70 text-white text-xs">
              <Users className="h-3 w-3 mr-1" />
              {book.readersCount}
            </Badge>
          </div>
        )}
      </div>

      {/* Book Content */}
      <CardContent className="p-4">
        <Link href={`/books-old/${book.id}`}>
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {book.name}
          </h3>
        </Link>

        {/* Authors */}
        {book.authors.length > 0 && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
            by {book.authors.map(author => author.name).join(', ')}
          </p>
        )}

        {/* Summary */}
        {book.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {book.summary}
          </p>
        )}

        {/* Categories */}
        {book.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {book.categories.slice(0, 3).map((category) => (
              <Badge key={category.id} variant="outline" className="text-xs">
                {category.name}
              </Badge>
            ))}
            {book.categories.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{book.categories.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {book.canAccess ? (
              <>
                <Link href={`/books-old/${book.id}`}>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    {isEbook && 'Read'}
                    {isAudio && 'Listen'}
                    {isHardCopy && 'View'}
                  </Button>
                </Link>
                <Button size="sm" variant="ghost">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link href={`/premium`}>
                <Button size="sm">
                  <Lock className="h-4 w-4 mr-1" />
                  Upgrade to Read
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Rating placeholder */}
        {book.readersCount && book.readersCount > 5 && (
          <div className="flex items-center space-x-1 mt-2">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="text-sm text-muted-foreground">
              {book.readersCount} {book.readersCount === 1 ? 'reader' : 'readers'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

BookCard.displayName = 'BookCard'

export { BookCard }