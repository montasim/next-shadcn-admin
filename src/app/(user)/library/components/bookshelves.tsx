'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FolderOpen, Edit, Trash2, Bookmark, Clock } from 'lucide-react'
import { getBookshelves } from '../actions'
import { Badge } from '@/components/ui/badge'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { Progress } from '@/components/ui/progress'

interface Bookshelf {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  bookCount: number
  image?: string | null
  completedBooks?: number
  progressPercent?: number
  totalPages?: number
}

interface BookshelvesProps {
  onEdit?: (bookshelf: Bookshelf) => void
  onDelete?: (bookshelf: Bookshelf) => void
  bookshelves?: Bookshelf[]
  isLoading?: boolean
  onRefresh?: () => void
}

export function Bookshelves({ onEdit, onDelete, bookshelves: externalBookshelves, isLoading: externalIsLoading, onRefresh }: BookshelvesProps) {
  const [internalBookshelves, setInternalBookshelves] = useState<Bookshelf[]>([])
  const [internalIsLoading, setInternalIsLoading] = useState(true)

  const bookshelves = externalBookshelves ?? internalBookshelves
  const isLoading = externalIsLoading ?? internalIsLoading

  const fetchBookshelves = async () => {
    setInternalIsLoading(true)
    const data = await getBookshelves()
    setInternalBookshelves(data)
    setInternalIsLoading(false)
  }

  useEffect(() => {
    if (!externalBookshelves) {
      fetchBookshelves()
    }
  }, [])

  useEffect(() => {
    if (onRefresh) {
      fetchBookshelves()
    }
  }, [onRefresh])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="w-full h-32 bg-muted rounded-lg mb-4" />
              <div className="h-5 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (bookshelves.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bookshelves yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first bookshelf to start organizing your books.
            </p>
            <p className="text-sm text-muted-foreground">
              Click the "Create Bookshelf" button above to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {bookshelves.map((shelf) => (
        <Card key={shelf.id} className="group transition-all hover:shadow-lg">
          <CardContent className="p-4">
            {/* Mobile: Horizontal layout */}
            <div className="flex gap-4 md:hidden">
              {/* Bookshelf Cover - smaller, on the left */}
              <div className="w-20 h-28 sm:w-24 sm:h-32 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                <Link href={`/library?tab=bookshelves&bookshelfId=${shelf.id}`} className="block w-full h-full">
                  {shelf.image ? (
                    <img
                      src={getProxiedImageUrl(shelf.image) || shelf.image}
                      alt={shelf.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Bookmark className="h-8 w-8 text-muted-foreground" />
                  )}
                </Link>
              </div>

              {/* Bookshelf Info - on the right */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/library?tab=bookshelves&bookshelfId=${shelf.id}`} className="flex-1">
                      <h3 className="font-semibold line-clamp-2 text-sm">{shelf.name}</h3>
                    </Link>
                    {/* Action Buttons */}
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-background/50 hover:bg-background/80"
                        onClick={(e) => {
                          e.preventDefault()
                          onEdit?.(shelf)
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-background/50 hover:bg-background/80 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault()
                          onDelete?.(shelf)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {shelf.isPublic && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0 ml-auto">
                      Public
                    </Badge>
                  )}
                  {shelf.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {shelf.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {shelf.bookCount} {shelf.bookCount === 1 ? 'book' : 'books'}
                  </p>
                </div>

                {/* Progress Section */}
                {shelf.bookCount > 0 && shelf.progressPercent !== undefined && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium">{shelf.progressPercent}%</span>
                    </div>
                    <Progress value={shelf.progressPercent} className="h-2" />
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{shelf.completedBooks} of {shelf.bookCount} read</span>
                      {shelf.totalPages > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {shelf.totalPages * 2 < 60
                              ? `${shelf.totalPages * 2} min`
                              : `${Math.round((shelf.totalPages * 2) / 60)}h`}
                          </span>
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Desktop: Vertical layout - existing design */}
            <div className="hidden md:block">
              <div className="relative">
                <Link href={`/library?tab=bookshelves&bookshelfId=${shelf.id}`} className="block">
                  <div className="w-full h-32 bg-muted rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                    {shelf.image ? (
                      <Image
                        src={getProxiedImageUrl(shelf.image) || shelf.image}
                        alt={shelf.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <Bookmark className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                </Link>
                {/* Action Icons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-background/50 hover:bg-background/80"
                    onClick={(e) => {
                      e.preventDefault()
                      onEdit?.(shelf)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-background/50 hover:bg-background/80 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault()
                      onDelete?.(shelf)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Link
                  href={`/library?tab=bookshelves&bookshelfId=${shelf.id}`}
                  className="block"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                      {shelf.name}
                    </h3>
                    {shelf.isPublic && (
                      <Badge variant="secondary" className="text-xs">
                        Public
                      </Badge>
                    )}
                  </div>
                  {shelf.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {shelf.description}
                    </p>
                  )}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {shelf.bookCount} {shelf.bookCount === 1 ? 'book' : 'books'}
                </p>

                {/* Progress Summary */}
                {shelf.bookCount > 0 && shelf.progressPercent !== undefined && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className='flex items-center justify-between'>
                        {shelf.completedBooks} of {shelf.bookCount} {shelf.bookCount === 1 ? 'book' : 'books'} read
                      </span>
                      <span>{shelf.progressPercent}%</span>
                    </div>
                    <Progress value={shelf.progressPercent} className="h-1.5" />
                  </div>
                )}

                {/* Total Reading Time */}
                {shelf.totalPages > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {shelf.totalPages * 2 < 60
                        ? `${shelf.totalPages * 2} min read`
                        : `${Math.round((shelf.totalPages * 2) / 60)}h read`}
                    </span>
                    <span>• {shelf.totalPages} pages</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
