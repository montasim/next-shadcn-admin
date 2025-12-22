'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FolderOpen, Edit, Trash2 } from 'lucide-react'
import { getBookshelves } from '../actions'
import { Badge } from '@/components/ui/badge'

interface Bookshelf {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  bookCount: number
}

interface BookshelvesProps {
  onEdit?: (bookshelf: Bookshelf) => void
  onDelete?: (bookshelf: Bookshelf) => void
}

export function Bookshelves({ onEdit, onDelete }: BookshelvesProps) {
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchBookshelves = async () => {
    setIsLoading(true)
    const data = await getBookshelves()
    setBookshelves(data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchBookshelves()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          <CardContent className="p-6">
            <div className="relative">
              <Link href={`/library?tab=bookshelves&bookshelfId=${shelf.id}`} className="block">
                <div className="w-full h-32 bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <FolderOpen className="h-12 w-12 text-muted-foreground" />
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
