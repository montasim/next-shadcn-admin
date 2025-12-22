'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PDFViewerProps {
  fileUrl: string
  onPageChange?: (currentPage: number, totalPages: number) => void
  onProgressChange?: (progress: number) => void
  initialPage?: number
  initialScale?: number
  className?: string
}

interface PDFDocument {
  numPages: number
  getPage: (pageNumber: number) => Promise<PDFPage>
}

interface PDFPage {
  viewport: {
    width: number
    height: number
    scale: (scale: number) => PDFViewport
  }
  getViewport: (params: { scale: number }) => PDFViewport
  render: (params: { viewport: PDFViewport; canvasContext: CanvasRenderingContext2D }) => Promise<void>
  textContent: () => Promise<{ items: Array<{ str: string }> }>
}

interface PDFViewport {
  width: number
  height: number
}

export function PDFViewer({
  fileUrl,
  onPageChange,
  onProgressChange,
  initialPage = 1,
  initialScale = 1.2,
  className
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pdfDocument, setPdfDocument] = useState<PDFDocument | null>(null)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [scale, setScale] = useState(initialScale)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Load PDF.js dynamically
  const loadPDFJS = useCallback(async () => {
    try {
      const pdfjs = await import('pdfjs-dist')
      // Use jsdelivr CDN which is more reliable
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
      return pdfjs
    } catch (err) {
      throw new Error('Failed to load PDF viewer')
    }
  }, [])

  // Load PDF document
  const loadPDF = useCallback(async () => {
    if (!fileUrl) return

    try {
      setIsLoading(true)
      setError(null)
      setLoadingProgress(0)

      // Convert Google Drive URLs to proxy API URLs to avoid CORS/iframe issues
      let proxiedUrl = fileUrl
      if (fileUrl.includes('drive.google.com') || fileUrl.includes('docs.google.com')) {
        proxiedUrl = `/api/proxy/pdf?url=${encodeURIComponent(fileUrl)}`
      }

      const pdfjs = await loadPDFJS()
      const loadingTask = pdfjs.getDocument({
        url: proxiedUrl,
        onProgress: (progress: any) => {
          setLoadingProgress(Math.round((progress.loaded / progress.total) * 100))
        }
      })

      const pdf = await loadingTask.promise
      setPdfDocument(pdf)
      setTotalPages(pdf.numPages)

      // Load first page
      if (initialPage <= pdf.numPages) {
        await renderPage(pdf, initialPage, scale, rotation)
      }

      onPageChange?.(initialPage, pdf.numPages)
      onProgressChange?.((initialPage / pdf.numPages) * 100)
    } catch (err) {
      console.error('Error loading PDF:', err)
      setError(err instanceof Error ? err.message : 'Failed to load PDF')
    } finally {
      setIsLoading(false)
    }
  }, [fileUrl, initialPage, scale, rotation, loadPDFJS, onPageChange, onProgressChange])

  // Render specific page
  const renderPage = useCallback(async (pdf: PDFDocument, pageNumber: number, currentScale: number, currentRotation: number) => {
    if (!canvasRef.current) return

    try {
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({
        scale: currentScale,
        rotation: currentRotation
      })

      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      if (!context) return

      // Set canvas dimensions
      canvas.height = viewport.height
      canvas.width = viewport.width

      // Render PDF page
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise

      // Update progress
      const progress = (pageNumber / pdf.numPages) * 100
      onProgressChange?.(progress)
    } catch (err) {
      console.error('Error rendering page:', err)
      throw err
    }
  }, [onProgressChange])

  // Navigate to specific page
  const goToPage = useCallback(async (pageNumber: number) => {
    if (!pdfDocument || pageNumber < 1 || pageNumber > totalPages) return

    try {
      setCurrentPage(pageNumber)
      await renderPage(pdfDocument, pageNumber, scale, rotation)
      onPageChange?.(pageNumber, totalPages)

      // Update URL if in reader page
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.set('page', pageNumber.toString())
        window.history.replaceState({}, '', url.toString())
      }
    } catch (err) {
      console.error('Error navigating to page:', err)
    }
  }, [pdfDocument, totalPages, scale, rotation, onPageChange, renderPage])

  // Change zoom level
  const handleZoomChange = useCallback(async (newScale: number[]) => {
    const targetScale = newScale[0]
    setScale(targetScale)

    if (pdfDocument && currentPage) {
      try {
        await renderPage(pdfDocument, currentPage, targetScale, rotation)
      } catch (err) {
        console.error('Error zooming:', err)
      }
    }
  }, [pdfDocument, currentPage, rotation, renderPage])

  // Rotate page
  const handleRotate = useCallback(async () => {
    const newRotation = (rotation + 90) % 360
    setRotation(newRotation)

    if (pdfDocument && currentPage) {
      try {
        await renderPage(pdfDocument, currentPage, scale, newRotation)
      } catch (err) {
        console.error('Error rotating:', err)
      }
    }
  }, [pdfDocument, currentPage, scale, rotation, renderPage])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Download PDF
  const handleDownload = useCallback(() => {
    // For Google Drive URLs, use proxy for download
    const downloadUrl = fileUrl.includes('drive.google.com')
      ? `/api/proxy/pdf?url=${encodeURIComponent(fileUrl)}`
      : fileUrl

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${fileUrl.split('/').pop() || 'book'}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [fileUrl, currentPage])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!pdfDocument) return

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          goToPage(Math.max(1, currentPage - 1))
          break
        case 'ArrowRight':
          event.preventDefault()
          goToPage(Math.min(totalPages, currentPage + 1))
          break
        case 'Home':
          event.preventDefault()
          goToPage(1)
          break
        case 'End':
          event.preventDefault()
          goToPage(totalPages)
          break
        case '+':
        case '=':
          event.preventDefault()
          handleZoomChange([Math.min(3, scale + 0.2)])
          break
        case '-':
          event.preventDefault()
          handleZoomChange([Math.max(0.5, scale - 0.2)])
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, totalPages, pdfDocument, scale, goToPage, handleZoomChange])

  // Load PDF on mount
  useEffect(() => {
    loadPDF()
  }, [loadPDF])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load PDF</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadPDF} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn("flex flex-col bg-background w-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-8 py-2 border-b bg-background/95 backdrop-blur flex-shrink-0">
        {/* Page Navigation */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(1)}
            disabled={currentPage <= 1}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-2 px-3">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value)
                if (!isNaN(page)) {
                  goToPage(page)
                }
              }}
              className="w-16 text-center border rounded px-2 py-1 text-sm"
              min={1}
              max={totalPages}
            />
            <span className="text-sm text-muted-foreground">
              of {totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage >= totalPages}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoomChange([Math.max(0.5, scale - 0.2)])}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="w-32">
              <Slider
                value={[scale]}
                onValueChange={handleZoomChange}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoomChange([Math.min(3, scale + 0.2)])}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[3rem]">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRotate}
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Canvas Container */}
      <div className="flex-1 overflow-auto bg-muted/30 min-h-0 mx-8 mt-6 rounded-lg">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Loading PDF...
            </p>
            {loadingProgress > 0 && (
              <p className="text-xs text-muted-foreground">
                {loadingProgress}% complete
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-full p-4">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto shadow-lg rounded"
              style={{
                imageRendering: 'crisp-edges'
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}