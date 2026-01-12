'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { BookTypeBadge } from '@/components/books/book-type-badge'
import { MDXViewer } from '@/components/ui/mdx-viewer'
import { LendBookDrawer } from '@/components/books/lend-book-drawer'
import { PhysicalLibraryBookSkeleton } from '@/components/books/physical-library-book-skeleton'
import {
  BookOpen,
  LibraryBig,
  Users,
  Share2,
  Building2,
  Calendar,
  Home,
  Printer,
  Copy,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ROUTES } from '@/lib/routes/client-routes'

// Expandable description component with MDX support (defined outside component to avoid recreation)
interface ExpandableDescriptionProps {
  description: string
  isExpanded: boolean
}

function ExpandableDescription({
  description,
  isExpanded,
}: ExpandableDescriptionProps) {
  // Estimate if text is long enough to potentially exceed 4 lines
  const isLong = description.length > 300 || description.split('\n').length > 4

  return (
    <div className="text-sm leading-relaxed">
      {!isExpanded && isLong ? (
        <div className="line-clamp-4">
          <MDXViewer content={description} className='text-sm [&>*]:leading-relaxed' />
        </div>
      ) : (
        <MDXViewer content={description} className='text-sm' />
      )}
    </div>
  )
}

interface Book {
  id: string
  name: string
  description: string | null
  image: string | null
  type: string
  isbn: string | null
  publishedDate: string | null
  pageNumber: number | null
  language: string
  buyingPrice: number | null
  categories: Array<{ id: string; name: string; description?: string | null; image?: string | null }>
  authors: Array<{ id: string; name: string; description?: string | null; image?: string | null }>
  translators: Array<{ id: string; name: string; description?: string | null; image?: string | null }>
  publication: { id: string; name: string; description?: string | null; image?: string | null } | null
  totalCopies: number
  availableCopies: number
  createdAt: string
}

interface Loan {
  id: string
  loanDate: string
  dueDate: string
  returnDate: string | null
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'CANCELLED'
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    username: string | null
    name: string | null
  }
  lentBy: {
    firstName: string | null
    lastName: string | null
  }
}

export default function PhysicalLibraryBookPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookId = params.id as string
  const activeTab = searchParams.get('tab') || 'details'
  const { user } = useAuth()

  // Dialog states
  const [isLendDialogOpen, setIsLendDialogOpen] = useState(false)

  // QR Code state
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [qrCodeLoading, setQrCodeLoading] = useState(false)
  const [qrCodeError, setQrCodeError] = useState<string | null>(null)

  // Expand/collapse state for descriptions
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  // Toggle expand/collapse for a section
  const toggleExpanded = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  // Fetch book details
  const { data: book, error, isLoading } = useSWR(
    bookId ? `/api/public/books/${bookId}` : null,
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch book')
      const json = await res.json()
      return json.data?.book as Book
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  )

  // Print QR code
  const handlePrintQRCode = useCallback(() => {
    if (!qrCodeData || !book) return

    const printWindow = window.open('', '', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${book.name}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
              }
              .qr-label {
                border: 2px solid #000;
                padding: 20px;
                text-align: center;
                width: 350px;
                page-break-inside: avoid;
              }
              .qr-label h2 {
                margin: 0 0 10px 0;
                font-size: 16px;
                word-wrap: break-word;
                line-height: 1.3;
              }
              .qr-label .meta {
                margin: 5px 0;
                font-size: 12px;
                color: #666;
              }
              .qr-label .qr-image {
                margin: 15px 0;
                display: flex;
                justify-content: center;
              }
              .qr-label .qr-image img {
                width: 150px;
                height: 150px;
              }
              .qr-label .instructions {
                margin-top: 10px;
                font-size: 10px;
                color: #888;
              }
              @media print {
                body { padding: 0; }
                .qr-label { border: 2px solid #000; }
              }
            </style>
          </head>
          <body>
            <div class="qr-label">
              <h2>${book.name}</h2>
              ${book.authors && book.authors.length > 0 ? `<p class="meta">by ${book.authors.map(a => a.name).join(', ')}</p>` : ''}
              ${book.publication ? `<p class="meta">${book.publication.name}</p>` : ''}
              <div class="qr-image">
                <img src="${qrCodeData}" alt="QR Code" />
              </div>
              <p class="instructions">Scan to view book details</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.onload = function () {
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    }
  }, [qrCodeData, book])

  // Download QR code
  const handleDownloadQRCode = useCallback(() => {
    if (!qrCodeData) return

    const link = document.createElement('a')
    link.href = qrCodeData
    link.download = `qr-code-${bookId}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [qrCodeData, bookId])

  // Fetch QR code data - moved after book is declared
  useEffect(() => {
    if (bookId && book?.type === 'HARD_COPY') {
      const fetchQRCode = async () => {
        setQrCodeLoading(true)
        setQrCodeError(null)
        try {
          console.log('[Physical Library] Fetching QR code for book:', bookId)
          const response = await fetch(`/api/books/${bookId}/qr-code`, { method: 'POST' })
          console.log('[Physical Library] QR code response status:', response.status)

          if (!response.ok) {
            const errorData = await response.json()
            console.error('[Physical Library] QR code error:', errorData)
            throw new Error(errorData.error || 'Failed to generate QR code')
          }

          const data = await response.json()
          console.log('[Physical Library] QR code data received')
          setQrCodeData(data.qrCode)
        } catch (err) {
          console.error('[Physical Library] QR code fetch error:', err)
          setQrCodeError(err instanceof Error ? err.message : 'Failed to load QR code')
        } finally {
          setQrCodeLoading(false)
        }
      }

      fetchQRCode()
    }
  }, [bookId, book?.type])

  // Fetch loan history
  const { data: loans } = useSWR(
    bookId ? `/api/books/${bookId}/loans` : null,
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch loans')
      const json = await res.json()
      return json.data?.loans as Loan[]
    }
  )

  // Track page view
  useEffect(() => {
    if (bookId && book) {
      fetch(`/api/books/${bookId}/view`, { method: 'POST' }).catch((err) => {
        console.error('Failed to track view:', err)
      })
    }
  }, [bookId, book])

  const canManageLoans = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isAvailable = book && book.availableCopies > 0

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: book?.name,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return 'N/A'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" /> Active</Badge>
      case 'RETURNED':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Returned</Badge>
      case 'OVERDUE':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Overdue</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return <PhysicalLibraryBookSkeleton />
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto border-2">
            <CardContent className="p-12 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold">Book Not Found</h1>
                <p className="text-muted-foreground text-lg">
                  We couldn&apos;t find the book you&apos;re looking for
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href={ROUTES.physicalLibrary.href}>
                    <LibraryBig className="h-4 w-4 mr-2" />
                    Browse Physical Library
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href={ROUTES.home.href}>
                    <Home className="h-4 w-4 mr-2" />
                    Go to Homepage
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Book Details */}
      <div className="container mx-auto px-4 py-8 pb-24 sm:pb-8">
        {/* Breadcrumb */}
        <NavigationBreadcrumb
          className="mb-6"
          items={[
            { label: 'Home', href: ROUTES.home.href, icon: <Home className="h-4 w-4" /> },
            { label: 'Physical Library', href: ROUTES.physicalLibrary.href, icon: <LibraryBig className="h-4 w-4" /> },
            { label: book.name },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-6">
          {/* Book Cover and Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Book Cover */}
              <div className="relative mb-4 sm:mb-6 max-w-auto mx-auto lg:mx-0">
                <div className="aspect-[3/4] overflow-hidden rounded-lg shadow-lg bg-muted">
                  {book.image ? (
                    <Image
                      src={getProxiedImageUrl(book.image) || book.image}
                      alt={book.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <BookOpen className="h-12 w-12" />
                    </div>
                  )}
                </div>

                {/* Type Badge - Top Left */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <BookTypeBadge type="HARD_COPY" size="md" />
                  <Badge variant={isAvailable ? 'default' : 'secondary'} className="text-xs">
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>

                {/* Action Icons - Top Right */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="bg-background/80 hover:bg-background backdrop-blur-sm h-9 w-9"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {canManageLoans && (
                  <Button
                    onClick={() => setIsLendDialogOpen(true)}
                    className="w-full"
                    size="lg"
                    disabled={!isAvailable}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {isAvailable ? 'Lend Book' : 'No Copies Available'}
                  </Button>
                )}

                {/* QR Code */}
                {qrCodeLoading && (
                  <div className="flex justify-center p-4 border rounded-lg bg-muted/30">
                    <div className="w-32 h-32 bg-muted animate-pulse rounded" />
                  </div>
                )}

                {qrCodeError && (
                  <div className="text-center py-2 px-4 border rounded-lg bg-destructive/10">
                    <p className="text-xs text-destructive">{qrCodeError}</p>
                  </div>
                )}

                {qrCodeData && !qrCodeLoading && (
                  <div className="border rounded-lg p-4 bg-card space-y-3">
                    <div className="flex justify-center bg-white p-3 rounded-lg">
                      <img src={qrCodeData} alt="QR Code" className="w-32 h-32" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleDownloadQRCode} variant="outline" size="sm" className="flex-1">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button onClick={handlePrintQRCode} variant="outline" size="sm" className="flex-1">
                        <Printer className="h-3 w-3 mr-1" />
                        Print
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Book Information */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              {/* Title */}
              <h1 className="text-xl font-bold mb-4">{book.name}</h1>

              {/* Authors */}
              {book.authors && book.authors.length > 0 && (
                <div className="text-lg text-muted-foreground mb-4">
                  by{' '}
                  {book.authors.map((author, index) => (
                    <span key={author.id}>
                      <Link href={`/authors/${author.id}`} className="hover:text-primary hover:underline transition-colors font-medium">
                        {author.name}
                      </Link>
                      {index < book.authors!.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}

                {/* Publication */}
                {book.publication && (
                    <div className="text-sm text-muted-foreground mb-4">
                        Published by{' '}
                        <Link href={`/publications/${book.publication.id}`} className="hover:text-primary hover:underline transition-colors font-medium">
                            {book.publication.name}
                        </Link>
                    </div>
                )}

              {/* Categories */}
              {book.categories && book.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {book.categories.map((category) => (
                    <Link key={category.id} href={`/categories/${category.id}`}>
                      <Badge variant="outline" className="hover:bg-primary/10 hover:underline cursor-pointer">
                        {category.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total Copies</span>
                  <span className="font-medium">{book.totalCopies}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-medium text-green-600">{book.availableCopies}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Borrowed</span>
                  <span className="font-medium text-orange-600">{book.totalCopies - book.availableCopies}</span>
                </div>
                {book.pageNumber && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Pages</span>
                    <span className="font-medium">{book.pageNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Language</span>
                  <span className="font-medium capitalize">{book.language || 'N/A'}</span>
                </div>
                  {book.buyingPrice && (
                      <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Price</span>
                          <span className="font-medium">৳{book.buyingPrice}</span>
                      </div>
                  )}
              </div>
            </div>

            {/* Detailed Information Tabs */}
            <Tabs value={activeTab}>
              <TabsList className="grid w-full grid-cols-2">
                <Link href={`/physical-library/${bookId}?tab=details`}>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </Link>
                <Link href={`/physical-library/${bookId}?tab=history`}>
                  <TabsTrigger value="history">Loan History</TabsTrigger>
                </Link>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="mt-4 space-y-4">
                {/* Description */}
                {book.description && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg">About This Book</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded('book-description')}
                        className="shrink-0"
                      >
                        {expandedSections['book-description'] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CardHeader>
                    {expandedSections['book-description'] !== false && (
                    <CardContent>
                      <ExpandableDescription
                        description={book.description}
                        isExpanded={expandedSections['book-description'] || false}
                      />
                    </CardContent>
                    )}
                  </Card>
                )}

                {/* Authors with Descriptions */}
                {book.authors && book.authors.length > 0 && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg">About the Author{book.authors.length > 1 ? 's' : ''}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const shouldExpand = !expandedSections['authors-section']
                          setExpandedSections((prev) => {
                            const newSections = { ...prev }
                            // Toggle the section
                            newSections['authors-section'] = shouldExpand
                            // Toggle all individual author descriptions
                            book.authors.forEach((author) => {
                              newSections[`author-${author.id}`] = shouldExpand
                            })
                            return newSections
                          })
                        }}
                        className="shrink-0"
                      >
                        {expandedSections['authors-section'] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CardHeader>
                    {expandedSections['authors-section'] !== false && (
                    <CardContent className="space-y-6">
                      {book.authors.map((author) => (
                        <div key={author.id} className="flex gap-4">
                          <Avatar className="h-16 w-16 flex-shrink-0">
                            <AvatarImage
                              src={author.image ? getProxiedImageUrl(author.image) || author.image : undefined}
                              alt={author.name}
                            />
                            <AvatarFallback className="text-lg bg-primary/10">
                              {author.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <Link href={`/authors/${author.id}`}>
                              <h3 className="font-semibold text-lg hover:text-primary hover:underline transition-colors">
                                {author.name}
                              </h3>
                            </Link>
                            {author.description && (
                              <div className="text-muted-foreground mt-1">
                                <ExpandableDescription
                                  description={author.description}
                                  isExpanded={expandedSections[`author-${author.id}`] || false}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                    )}
                  </Card>
                )}

                {/* Translators */}
                {book.translators && book.translators.length > 0 && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg">About the Translator{book.translators.length > 1 ? 's' : ''}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const shouldExpand = !expandedSections['translators-section']
                          setExpandedSections((prev) => {
                            const newSections = { ...prev }
                            // Toggle the section
                            newSections['translators-section'] = shouldExpand
                            // Toggle all individual translator descriptions
                            book.translators.forEach((translator) => {
                              newSections[`translator-${translator.id}`] = shouldExpand
                            })
                            return newSections
                          })
                        }}
                        className="shrink-0"
                      >
                        {expandedSections['translators-section'] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CardHeader>
                    {expandedSections['translators-section'] !== false && (
                    <CardContent className="space-y-6">
                      {book.translators.map((translator) => (
                        <div key={translator.id} className="flex gap-4">
                          <Avatar className="h-16 w-16 flex-shrink-0">
                            <AvatarImage
                              src={translator.image ? getProxiedImageUrl(translator.image) || translator.image : undefined}
                              alt={translator.name}
                            />
                            <AvatarFallback className="text-lg bg-primary/10">
                              {translator.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <Link href={`/translators/${translator.id}`}>
                              <h3 className="font-semibold text-lg hover:text-primary hover:underline transition-colors">
                                {translator.name}
                              </h3>
                            </Link>
                            {translator.description && (
                              <div className="text-muted-foreground mt-1">
                                <ExpandableDescription
                                  description={translator.description}
                                  isExpanded={expandedSections[`translator-${translator.id}`] || false}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                    )}
                  </Card>
                )}

                {/* Publications */}
                {book.publication && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg">About the Publisher</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const shouldExpand = !expandedSections['publication-section']
                          setExpandedSections((prev) => {
                            const newSections = { ...prev }
                            // Toggle the section
                            newSections['publication-section'] = shouldExpand
                            // Toggle the publication description
                            if (book.publication?.id) {
                              newSections[`publication-${book.publication.id}`] = shouldExpand
                            }
                            return newSections
                          })
                        }}
                        className="shrink-0"
                      >
                        {expandedSections['publication-section'] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CardHeader>
                    {expandedSections['publication-section'] !== false && (
                    <CardContent className="space-y-6">
                      <div className="flex gap-4">
                        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                          {book.publication.image ? (
                            <Image
                              src={getProxiedImageUrl(book.publication.image) || book.publication.image}
                              alt={book.publication.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                              unoptimized
                            />
                          ) : (
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/publications/${book.publication.id}`}>
                            <h3 className="font-semibold text-lg text-primary hover:underline">
                              {book.publication.name}
                            </h3>
                          </Link>
                          {book.publication.description && (
                            <div className="text-muted-foreground mt-1">
                              <ExpandableDescription
                                description={book.publication.description}
                                isExpanded={expandedSections[`publication-${book.publication.id}`] || false}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    )}
                  </Card>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Loan History</CardTitle>
                    <CardDescription>Track all borrows and returns for this book</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!loans || loans.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No loan history available</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Borrower</TableHead>
                            <TableHead>Lent By</TableHead>
                            <TableHead>Borrowed On</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Returned On</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loans.map((loan) => (
                            <TableRow key={loan.id}>
                              <TableCell className="font-medium">
                                {loan.user.name ||
                                  `${loan.user.firstName || ''} ${loan.user.lastName || ''}`.trim() ||
                                  loan.user.username ||
                                  'Unknown'}
                              </TableCell>
                              <TableCell>
                                {loan.lentBy.firstName && loan.lentBy.lastName
                                  ? `${loan.lentBy.firstName} ${loan.lentBy.lastName}`
                                  : loan.lentBy.firstName || loan.lentBy.lastName || 'Unknown'}
                              </TableCell>
                              <TableCell>{formatDate(loan.loanDate)}</TableCell>
                              <TableCell>{formatDate(loan.dueDate)}</TableCell>
                              <TableCell>{loan.returnDate ? formatDate(loan.returnDate) : '-'}</TableCell>
                              <TableCell>{getStatusBadge(loan.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Lend Book Drawer */}
      {canManageLoans && (
        <LendBookDrawer
          open={isLendDialogOpen}
          onOpenChange={setIsLendDialogOpen}
          bookId={bookId}
          bookName={book.name}
          onSuccess={() => {
            // Refresh the page data
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
