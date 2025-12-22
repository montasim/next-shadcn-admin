'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload } from 'lucide-react'
import { getUserBooks } from './actions'
import { useRouter } from 'next/navigation'
import { BookCard } from './book-card'

interface BookListProps {
  openDrawer: () => void;
}

export function BookList({ openDrawer }: BookListProps) {
  const [books, setBooks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true)
      const userBooks = await getUserBooks()
      setBooks(userBooks)
      setIsLoading(false)
    }
    fetchBooks()
  }, [])
  
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded-lg" />
            <CardContent className="p-4 space-y-2">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-10 bg-muted rounded mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      {books.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No books uploaded yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first ebook or audiobook to get started.
            </p>
            <Button onClick={openDrawer}>
              Upload Book
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </>
  )
}
