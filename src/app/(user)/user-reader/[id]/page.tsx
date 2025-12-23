'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { PDFViewer } from '@/components/reader/pdf-viewer'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Book {
  fileUrl: string
  pageNumber?: number | null
}

interface ReadingProgress {
  currentPage: number
  progress: number
}

export default function UserReaderPage() {
  const params = useParams()
  const bookId = params.id as string
  const [book, setBook] = useState<Book | null>(null)
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchedBookIdRef = useRef<string | null>(null)
  const saveProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch reading progress
  const fetchReadingProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/reading-progress?bookId=${bookId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.readingProgress) {
          setReadingProgress({
            currentPage: data.readingProgress.currentPage || 1,
            progress: data.readingProgress.progress || 0,
          })
        }
      }
    } catch (err) {
      console.error('Error fetching reading progress:', err)
    }
  }, [bookId])

  // Save reading progress (debounced)
  const saveReadingProgress = useCallback(
    (currentPage: number, progress: number, totalPages: number) => {
      // Clear any existing timeout
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current)
      }

      // Debounce save to avoid too many API calls
      saveProgressTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch('/api/reading-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookId,
              currentPage,
              progress,
              totalPages,
            }),
          })
        } catch (err) {
          console.error('Error saving reading progress:', err)
        }
      }, 1000) // Save after 1 second of no page changes
    },
    [bookId]
  )

  useEffect(() => {
    const fetchBook = async () => {
      // Prevent fetching the same book twice
      if (bookId === fetchedBookIdRef.current) return
      fetchedBookIdRef.current = bookId

      setIsLoading(true)
      setError(null)

      try {
        // Fetch book and reading progress in parallel
        const [bookResponse] = await Promise.all([
          fetch(`/api/books/${bookId}`),
          fetchReadingProgress(),
        ])

        if (!bookResponse.ok) {
          throw new Error('Book not found')
        }
        const data = await bookResponse.json()
        setBook(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load book')
      } finally {
        setIsLoading(false)
      }
    }

    if (bookId) {
      fetchBook()
    }

    // Cleanup timeout on unmount
    return () => {
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current)
      }
    }
  }, [bookId, fetchReadingProgress])

  const handlePageChange = useCallback(
    (currentPage: number, totalPages: number) => {
      const progress = (currentPage / totalPages) * 100
      setReadingProgress({ currentPage, progress })
      saveReadingProgress(currentPage, progress, totalPages)
    },
    [saveReadingProgress]
  )

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading book...</p>
        </div>
      </div>
    )
  }

  if (error || !book?.fileUrl) {
    return (
      <div className="h-[calc(100vh-5rem)] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-destructive mb-2">Error</p>
            <p className="text-muted-foreground">{error || 'Book not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="-mx-4 h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
      <PDFViewer
        fileUrl={book.fileUrl}
        initialPage={readingProgress?.currentPage || 1}
        onPageChange={handlePageChange}
        className="h-full"
      />
    </div>
  )
}
