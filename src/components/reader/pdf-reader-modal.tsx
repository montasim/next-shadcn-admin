'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PDFViewer } from '@/components/reader/pdf-viewer'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Book {
  fileUrl: string
  pageNumber?: number | null
}

interface ReadingProgress {
  currentPage: number
  progress: number
}

interface PDFReaderModalProps {
  isOpen: boolean
  onClose: () => void
  bookId: string
  fileUrl?: string | null
  initialPage?: number | null
}

export function PDFReaderModal({
  isOpen,
  onClose,
  bookId,
  fileUrl: propFileUrl,
  initialPage: propInitialPage,
}: PDFReaderModalProps) {
  const [book, setBook] = useState<Book | null>(null)
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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
          return data.readingProgress.currentPage || 1
        }
      }
      return 1
    } catch (err) {
      console.error('Error fetching reading progress:', err)
      return 1
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

  // Fetch book data and progress when modal opens
  useEffect(() => {
    if (!isOpen || !bookId) return

    const fetchBookData = async () => {
      // If we already have fileUrl passed as prop, use it
      if (propFileUrl) {
        setBook({ fileUrl: propFileUrl, pageNumber: null })
        // Still fetch reading progress
        const currentPage = await fetchReadingProgress()
        setReadingProgress({ currentPage, progress: 0 })
        return
      }

      // Otherwise fetch from API
      if (bookId === fetchedBookIdRef.current) return
      fetchedBookIdRef.current = bookId

      setIsLoading(true)
      setError(null)

      try {
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

    fetchBookData()

    // Cleanup timeout on unmount
    return () => {
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current)
      }
    }
  }, [isOpen, bookId, propFileUrl, fetchReadingProgress])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to allow close animation
      const timer = setTimeout(() => {
        setBook(null)
        setReadingProgress(null)
        setError(null)
        setIsLoading(false)
        fetchedBookIdRef.current = null
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handlePageChange = useCallback(
    (currentPage: number, totalPages: number) => {
      const progress = (currentPage / totalPages) * 100
      setReadingProgress({ currentPage, progress })
      saveReadingProgress(currentPage, progress, totalPages)
    },
    [saveReadingProgress]
  )

  // Handle keyboard close (Escape key)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Don't render dialog if not open
  if (!isOpen) return null

  const fileUrl = propFileUrl || book?.fileUrl
  const currentPage = propInitialPage || readingProgress?.currentPage || 1

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="h-[95vh] w-[95vw] max-w-none p-0 gap-0 border-0 rounded-lg overflow-hidden [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={() => onClose()}
        aria-label="PDF Reader Modal"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b px-2 py-1.5 bg-background flex-shrink-0">
          <h2 className="text-sm font-semibold text-muted-foreground truncate mr-4">
            Reading Mode
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
            aria-label="Close reader"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* PDF Viewer Container */}
        <div className="flex-1 overflow-hidden bg-neutral-100 dark:bg-neutral-900">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Loading book...</p>
            </div>
          ) : error || !fileUrl ? (
            <div className="flex items-center justify-center h-full p-8">
              <Card className="max-w-md">
                <CardContent className="pt-12 pb-12 text-center">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Failed to load book</h3>
                  <p className="text-muted-foreground mb-4">{error || 'Book file not found'}</p>
                  <Button onClick={onClose} variant="outline">
                    Close Reader
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <PDFViewer
              key={`${bookId}-${fileUrl}`}
              fileUrl={fileUrl}
              initialPage={currentPage}
              onPageChange={handlePageChange}
              className="h-full"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
