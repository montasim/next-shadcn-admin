'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PDFViewer } from '@/components/reader/pdf-viewer'
import {
  X,
  Loader2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  Minimize2,
} from 'lucide-react'
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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fetchedBookIdRef = useRef<string | null>(null)
  const saveProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pdfViewerRef = useRef<{ downloadPDF: () => void }>(null)

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
    (page: number, progress: number, total: number) => {
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
              currentPage: page,
              progress,
              totalPages: total,
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
        setCurrentPage(1)
        setTotalPages(0)
        setScale(1.2)
        setRotation(0)
        setIsFullscreen(false)
        fetchedBookIdRef.current = null
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Toolbar control handlers
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(3, prev + 0.2))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.2))
  }, [])

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
  }, [])

  const handleDownload = useCallback(() => {
    if (pdfViewerRef.current) {
      pdfViewerRef.current.downloadPDF()
    }
  }, [])

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const handlePageChange = useCallback(
    (page: number, total: number) => {
      const progress = (page / total) * 100
      setCurrentPage(page)
      setTotalPages(total)
      setReadingProgress({ currentPage: page, progress })
      saveReadingProgress(page, progress, total)
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

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const fileUrl = propFileUrl || book?.fileUrl
  const initialPage = propInitialPage || readingProgress?.currentPage || 1

  // Don't render dialog if not open
  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="h-[95vh] w-[95vw] max-w-none p-0 gap-0 border-0 rounded-lg overflow-hidden [&>button]:hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={() => onClose()}
        aria-label="PDF Reader Modal"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b px-2 sm:px-4 py-2 bg-background flex-shrink-0 gap-2">
          {/* Mobile: Toolbar controls, Desktop: Reading Mode text */}
          <div className="flex items-center gap-1 sm:gap-2 flex-1">
            {/* Mobile toolbar controls */}
            <div className="sm:hidden flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className="h-8 w-8"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>

              <span className="text-xs font-medium min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={scale >= 3}
                className="h-8 w-8"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleRotate}
                className="h-8 w-8"
                aria-label="Rotate"
              >
                <RotateCw className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFullscreen}
                className="h-8 w-8"
                aria-label="Toggle fullscreen"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="h-8 w-8"
                aria-label="Download PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* Desktop: Reading Mode text */}
            <h2 className="hidden sm:block text-sm font-semibold text-muted-foreground truncate">
              Reading Mode
            </h2>
          </div>

          {/* Close button */}
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
        <div className="flex-1 overflow-hidden bg-neutral-100 dark:bg-neutral-900 min-h-0">
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
              ref={pdfViewerRef}
              key={`${bookId}-${fileUrl}`}
              fileUrl={fileUrl}
              initialPage={initialPage}
              onPageChange={handlePageChange}
              scale={scale}
              rotation={rotation}
              onScaleChange={setScale}
              onRotationChange={setRotation}
              hideToolbarOnMobile={true}
              className="h-full"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
