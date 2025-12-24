'use client'

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
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
  AlertCircle,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculatePageProgress } from '@/lib/utils/reading-progress'

interface PDFViewerProps {
  fileUrl: string
  onPageChange?: (currentPage: number, totalPages: number) => void
  onProgressChange?: (progress: number) => void
  initialPage?: number
  initialScale?: number
  scale?: number
  rotation?: number
  onScaleChange?: (scale: number) => void
  onRotationChange?: (rotation: number) => void
  className?: string
  hideToolbarOnMobile?: boolean
}

export interface PDFViewerRef {
  downloadPDF: () => void
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

export const PDFViewer = forwardRef<PDFViewerRef, PDFViewerProps>(({
  fileUrl,
  onPageChange,
  onProgressChange,
  initialPage = 1,
  initialScale = 1.2,
  scale: externalScale,
  rotation: externalRotation,
  onScaleChange,
  onRotationChange,
  className,
  hideToolbarOnMobile = false
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pdfDocument, setPdfDocument] = useState<PDFDocument | null>(null)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [internalScale, setInternalScale] = useState(initialScale)
  const [internalRotation, setInternalRotation] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const loadedPdfUrl = useRef<string | null>(null)

  // Use external scale/rotation if provided, otherwise use internal state
  const scale = externalScale ?? internalScale
  const rotation = externalRotation ?? internalRotation

  // Expose download method via ref
  useImperativeHandle(ref, () => ({
    downloadPDF: () => {
      const downloadUrl = fileUrl.includes('drive.google.com')
        ? `/api/proxy/pdf?url=${encodeURIComponent(fileUrl)}`
        : fileUrl

      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${fileUrl.split('/').pop() || 'book'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }), [fileUrl])

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

      // Note: Page rendering is handled by useEffect below when canvas is mounted
      onPageChange?.(initialPage, pdf.numPages)
      onProgressChange?.(calculatePageProgress(initialPage, pdf.numPages))
    } catch (err) {
      console.error('Error loading PDF:', err)
      setError(err instanceof Error ? err.message : 'Failed to load PDF')
    } finally {
      setIsLoading(false)
    }
  }, [fileUrl, initialPage, loadPDFJS, onPageChange, onProgressChange]) // eslint-disable-line react-hooks/exhaustive-deps -- scale & rotation read via closure, not as deps

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
      const progress = calculatePageProgress(pageNumber, pdf.numPages)
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

    // Update internal state or notify parent
    if (externalScale !== undefined) {
      onScaleChange?.(targetScale)
    } else {
      setInternalScale(targetScale)
    }

    if (pdfDocument && currentPage) {
      try {
        await renderPage(pdfDocument, currentPage, targetScale, rotation)
      } catch (err) {
        console.error('Error zooming:', err)
      }
    }
  }, [pdfDocument, currentPage, rotation, renderPage, externalScale, onScaleChange])

  // Rotate page
  const handleRotate = useCallback(async () => {
    const newRotation = (rotation + 90) % 360

    // Update internal state or notify parent
    if (externalRotation !== undefined) {
      onRotationChange?.(newRotation)
    } else {
      setInternalRotation(newRotation)
    }

    if (pdfDocument && currentPage) {
      try {
        await renderPage(pdfDocument, currentPage, scale, newRotation)
      } catch (err) {
        console.error('Error rotating:', err)
      }
    }
  }, [pdfDocument, currentPage, scale, rotation, renderPage, externalRotation, onRotationChange])

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

  // Load PDF on mount or when fileUrl changes
  useEffect(() => {
    // Prevent reloading the same PDF URL
    if (fileUrl === loadedPdfUrl.current) return
    loadedPdfUrl.current = fileUrl

    loadPDF()
  }, [fileUrl, loadPDF])

  // Render initial page when PDF document loads and canvas is available
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return

    const renderInitialPage = async () => {
      try {
        await renderPage(pdfDocument, currentPage, scale, rotation)
      } catch (err) {
        console.error('Error rendering initial page:', err)
      }
    }

    renderInitialPage()
  }, [pdfDocument]) // Only run when pdfDocument is first set

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
      {/* Toolbar - Hidden on mobile when hideToolbarOnMobile is true */}
      <div className={cn(
        "flex flex-col bg-background/95 backdrop-blur flex-shrink-0 border-b",
        hideToolbarOnMobile && "hidden sm:flex"
      )}>
        {/* Primary Toolbar Row */}
        <div className="flex items-center justify-between px-2 sm:px-4 md:px-8 py-2">
          {/* Page Navigation - Mobile: compact, Desktop: full */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-1">
            {/* First page button - hidden on mobile */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={currentPage <= 1}
              className="hidden sm:inline-flex"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            {/* Previous page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="min-h-[36px] sm:min-h-[32px]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page input - desktop */}
            <div className="hidden sm:flex items-center space-x-2 px-2">
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

            {/* Page display - mobile only */}
            <div className="sm:hidden flex items-center px-2">
              <span className="text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
            </div>

            {/* Next page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="min-h-[36px] sm:min-h-[32px]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last page button - hidden on mobile */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="hidden sm:inline-flex"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {/* Zoom buttons - always visible on tablet+, compact on mobile */}
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoomChange([Math.max(0.5, scale - 0.2)])}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="w-24 lg:w-32">
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

            {/* Rotate button - hidden on mobile */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="hidden sm:inline-flex"
            >
              <RotateCw className="h-4 w-4" />
            </Button>

            {/* Fullscreen button - hidden on mobile */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="hidden sm:inline-flex"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>

            {/* Download button - hidden on mobile */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="hidden sm:inline-flex"
            >
              <Download className="h-4 w-4" />
            </Button>

            {/* Mobile menu toggle button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden min-h-[36px]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu - Collapsible */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t bg-background px-2 py-3 space-y-3">
            {/* Zoom controls for mobile */}
            <div className="flex items-center justify-between space-x-2">
              <span className="text-sm font-medium">Zoom</span>
              <div className="flex items-center space-x-2 flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoomChange([Math.max(0.5, scale - 0.2)])}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <div className="flex-1 max-w-[120px]">
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
                <span className="text-sm text-muted-foreground min-w-[3.5rem]">
                  {Math.round(scale * 100)}%
                </span>
              </div>
            </div>

            {/* Additional controls grid */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
                className="justify-start min-h-[44px]"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Rotate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="justify-start min-h-[44px]"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Fullscreen
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="justify-start min-h-[44px] col-span-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* PDF Canvas Container */}
      <div className="flex-1 overflow-auto bg-muted/30 min-h-0 mx-2 sm:mx-4 md:mx-8 mt-3 sm:mt-4 md:mt-6 rounded-lg relative">
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

        {/* Mobile Floating Page Navigation Buttons */}
        <div className="sm:hidden fixed bottom-6 left-4 right-4 flex items-center justify-between gap-2 z-50 pointer-events-none">
          <Button
            variant="default"
            size="lg"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-14 w-14 rounded-full shadow-lg pointer-events-auto bg-primary/90 backdrop-blur-sm hover:bg-primary"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-full shadow-sm pointer-events-auto">
            <span className="text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
          </div>

          <Button
            variant="default"
            size="lg"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-14 w-14 rounded-full shadow-lg pointer-events-auto bg-primary/90 backdrop-blur-sm hover:bg-primary"
            aria-label="Next page"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
})