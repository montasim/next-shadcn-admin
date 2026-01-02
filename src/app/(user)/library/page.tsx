'use client'

import { useState, useEffect, useMemo, useRef, useCallback, useTransition, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
    Plus,
    Upload,
    BookOpen,
    Clock,
    TrendingUp,
    Target,
    ChevronUp,
    ChevronDown,
    FileText,
    Calendar,
    X,
    MessageCircle,
} from 'lucide-react'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { BookList } from './book-list'
import { Bookshelves } from './components/bookshelves'
import { PDFReaderModal } from '@/components/reader/pdf-reader-modal'
import { BookshelfContent } from './components/bookshelf-content'
import { BookshelfMutateDrawer } from './bookshelf-mutate-drawer'
import { UploadBooksMutateDrawer } from './upload-books-mutate-drawer'
import { LibraryFilterToolbar } from './components/library-filter-toolbar'
import { BookshelfFilterToolbar } from './components/bookshelf-filter-toolbar'
import { RequestBookDrawer } from './request-book-drawer'
import { BookGridSkeleton, DashboardSummarySkeleton, FilterToolbarSkeleton } from '@/components/books/book-grid-skeleton'
import { Book } from '@/app/dashboard/books/data/schema'
import { deleteBook } from '@/app/dashboard/books/actions'
import { getBookshelves, deleteBookshelf, getUserBooks } from './actions'
import { calculateReadingTimeHours } from '@/lib/utils/reading-time'
import LibraryContextProvider, { LibraryDialogType } from './context/library-context'
import useDialogState from '@/hooks/use-dialog-state'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RequestStatus, BookType } from '@prisma/client'

interface LibraryStats {
  completedBooks: number
  completedThisMonth: number
  readingTimeHours: number
  currentlyReading: number
  totalPages: number
  totalPagesRead: number
}

interface BookRequest {
  id: string
  bookName: string
  authorName: string
  type: BookType
  edition: string | null
  publisher: string | null
  isbn: string | null
  description: string | null
  status: RequestStatus
  cancelReason: string | null
  cancelledById: string | null
  createdAt: string
  cancelledBy: {
    id: string
    firstName: string
    lastName: string | null
    name: string
    role: string
  } | null
}

const statusConfig: Record<RequestStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  [RequestStatus.PENDING]: { label: 'Pending', variant: 'secondary' },
  [RequestStatus.IN_PROGRESS]: { label: 'In Progress', variant: 'default' },
  [RequestStatus.APPROVED]: { label: 'Approved', variant: 'default' },
  [RequestStatus.REJECTED]: { label: 'Rejected', variant: 'destructive' },
}

const typeLabels: Record<BookType, string> = {
  [BookType.HARD_COPY]: 'Hard Copy',
  [BookType.EBOOK]: 'E-Book',
  [BookType.AUDIO]: 'Audio Book',
}

// Calculate library statistics from books data
function calculateLibraryStats(books: Book[]): LibraryStats {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const completedBooks = books.filter(book => {
    const progress = book.readingProgress?.[0]?.progress || 0
    return progress >= 95
  })

  const completedThisMonth = completedBooks.filter(book => {
    const lastRead = book.readingProgress?.[0]?.lastReadAt
    return lastRead && new Date(lastRead) >= startOfMonth
  })

  const currentlyReading = books.filter(book => {
    const progress = book.readingProgress?.[0]?.progress || 0
    return progress > 0 && progress < 95
  })

  const totalPages = books.reduce((sum, book) => sum + (book.pageNumber || 0), 0)

  // Calculate reading time based on pages read (2 min per page)
  const totalPagesRead = books.reduce((sum, book) => {
    const currentPage = book.readingProgress?.[0]?.currentPage || 0
    return sum + currentPage
  }, 0)

  const readingTimeHours = calculateReadingTimeHours(totalPagesRead)

  return {
    completedBooks: completedBooks.length,
    completedThisMonth: completedThisMonth.length,
    readingTimeHours,
    currentlyReading: currentlyReading.length,
    totalPages,
    totalPagesRead
  }
}

function LibraryPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const bookshelfId = searchParams.get('bookshelfId')
  // Determine active tab from pathname or query param
  const activeTab = pathname.includes('/bookshelves') ? 'bookshelves' :
  pathname.includes('/my-uploads') ? 'my-uploads' :
  searchParams.get('tab') || 'my-uploads'

  const [books, setBooks] = useState<Book[]>([])
  const [booksLoading, setBooksLoading] = useState(true)
  const [requests, setRequests] = useState<BookRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [bookshelvesLoading, setBookshelvesLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [isRequestDrawerOpen, setIsRequestDrawerOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [requestToCancel, setRequestToCancel] = useState<BookRequest | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [currentRow, setCurrentRow] = useState<Book | null>(null)
  const [open, setOpen] = useDialogState<LibraryDialogType>(null)
  const [isBookDrawerOpen, setIsBookDrawerOpen] = useState(false)
  const [isShelfDrawerOpen, setIsShelfDrawerOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [bookshelfKey, setBookshelfKey] = useState(0)
  const [editingBookshelf, setEditingBookshelf] = useState<any>(null)
  const [stats, setStats] = useState<LibraryStats>({
    completedBooks: 0,
    completedThisMonth: 0,
    readingTimeHours: 0,
    currentlyReading: 0,
    totalPages: 0,
    totalPagesRead: 0,
  })

  // Reader modal state
  const [isReaderModalOpen, setIsReaderModalOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterReadingStatus, setFilterReadingStatus] = useState<string[]>([])
  const [filterAuthors, setFilterAuthors] = useState<string[]>([])

  // Bookshelf filter states
  const [bookshelfSearchQuery, setBookshelfSearchQuery] = useState('')
  const [filterVisibility, setFilterVisibility] = useState<string[]>([])
  const [filterProgressStatus, setFilterProgressStatus] = useState<string[]>([])
  const [filterBookCount, setFilterBookCount] = useState<string[]>([])
  const [allBookshelves, setAllBookshelves] = useState<any[]>([])
  const hasInitialized = useRef(false)
  const [isPending, startTransition] = useTransition()

  const refreshBooks = useCallback(async () => {
    try {
      setBooksLoading(true)
      const userBooks = await getUserBooks()
      startTransition(() => {
        setBooks(userBooks)
        setStats(calculateLibraryStats(userBooks))
      })
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setBooksLoading(false)
    }
  }, [])

  const refreshBookshelves = useCallback(async () => {
    setBookshelvesLoading(true)
    const shelves = await getBookshelves()
    startTransition(() => {
      setAllBookshelves(shelves)
      setBookshelvesLoading(false)
    })
  }, [])

  const handleSuccess = () => {
    refreshBooks()
    refreshBookshelves()
    router.refresh()
    setEditingBook(null)
    setEditingBookshelf(null)
    setBookshelfKey(prev => prev + 1)
  }

  const handleEditBook = (book: Book) => {
    setEditingBook(book)
    setIsBookDrawerOpen(true)
  }

  const handleEditBookshelf = (bookshelf: any) => {
    setEditingBookshelf(bookshelf)
    setIsShelfDrawerOpen(true)
  }

  const handleBookClick = (book: Book) => {
    setSelectedBook(book)
    setIsReaderModalOpen(true)
  }

  const handleDeleteBookshelf = (bookshelf: any) => {
    setCurrentRow(bookshelf)
    setOpen('delete')
  }

  const fetchRequests = async () => {
    try {
      setRequestsLoading(true)
      const response = await fetch('/api/user/book-requests')
      const result = await response.json()

      if (result.success) {
        setRequests(result.data)
      } else {
        toast({ title: 'Failed to load requests', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast({ title: 'Failed to load requests', variant: 'destructive' })
    } finally {
      setRequestsLoading(false)
    }
  }

  const handleCancelRequest = async () => {
    if (!requestToCancel) return

    if (!cancelReason.trim()) {
      setReasonError('Please provide a reason for cancelling this request')
      return
    }

    try {
      setCancellingId(requestToCancel.id)
      const response = await fetch(`/api/user/book-requests/${requestToCancel.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'REJECTED', cancelReason }),
      })

      const result = await response.json()

      if (result.success) {
        toast({ title: 'Request cancelled' })
        fetchRequests()
        setIsCancelDialogOpen(false)
        setRequestToCancel(null)
        setCancelReason('')
        setReasonError('')
      } else {
        toast({ title: result.message, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error cancelling request:', error)
      toast({ title: 'Failed to cancel request', variant: 'destructive' })
    } finally {
      setCancellingId(null)
    }
  }

  const openCancelDialog = (request: BookRequest) => {
    setRequestToCancel(request)
    setCancelReason('')
    setReasonError('')
    setIsCancelDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!currentRow) return
    try {
      // Check if it's a book or bookshelf by checking for fileUrl
      if (currentRow.fileUrl || currentRow.type) {
        // It's a book
        await deleteBook(currentRow.id)
        toast({ title: 'Book deleted successfully' })
        refreshBooks()
      } else {
        // It's a bookshelf
        await deleteBookshelf(currentRow.id)
        toast({ title: 'Bookshelf deleted successfully' })
        setBookshelfKey(prev => prev + 1)
      }
      setOpen(null)
      setCurrentRow(null)
    } catch (error) {
      toast({ title: 'Error deleting', variant: 'destructive' })
    }
  }

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      refreshBooks()
      refreshBookshelves()
      fetchRequests()
    }
  }, [refreshBooks, refreshBookshelves, fetchRequests])

  // Refresh books when page regains focus (user returns from reader)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshBooks()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshBooks])

  // Get unique authors from books
  const uniqueAuthors = useMemo(() => {
    const authors = new Set<string>()
    books.forEach(book => {
      book.authors?.forEach((a: any) => authors.add(a.name))
    })
    return Array.from(authors).sort()
  }, [books])

  // Filter books
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matchesName = book.name?.toLowerCase().includes(searchLower)
        const matchesAuthor = book.authors?.some((a: any) =>
          a.name.toLowerCase().includes(searchLower)
        )
        if (!matchesName && !matchesAuthor) return false
      }

      // Reading status filter
      const progress = Math.round(book.readingProgress?.[0]?.progress || 0)
      if (filterReadingStatus.length > 0) {
        if (filterReadingStatus.includes('not-started') && progress > 0) return false
        if (filterReadingStatus.includes('in-progress') && (progress === 0 || progress >= 95)) return false
        if (filterReadingStatus.includes('completed') && progress < 95) return false
      }

      // Authors filter
      if (filterAuthors.length > 0) {
        const bookAuthors = book.authors?.map((a: any) => a.name) || []
        if (!filterAuthors.some(a => bookAuthors.includes(a))) return false
      }

      return true
    })
  }, [books, searchQuery, filterReadingStatus, filterAuthors])

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('')
    setFilterReadingStatus([])
    setFilterAuthors([])
  }

  // Filter bookshelves
  const filteredBookshelves = useMemo(() => {
    return allBookshelves.filter(shelf => {
      // Search filter
      if (bookshelfSearchQuery) {
        const searchLower = bookshelfSearchQuery.toLowerCase()
        const matchesName = shelf.name?.toLowerCase().includes(searchLower)
        const matchesDescription = shelf.description?.toLowerCase().includes(searchLower)
        if (!matchesName && !matchesDescription) return false
      }

      // Visibility filter
      if (filterVisibility.length > 0) {
        if (filterVisibility.includes('public') && !shelf.isPublic) return false
        if (filterVisibility.includes('private') && shelf.isPublic) return false
      }

      // Progress status filter
      if (filterProgressStatus.length > 0) {
        const progress = shelf.progressPercent || 0
        if (filterProgressStatus.includes('not-started') && progress > 0) return false
        if (filterProgressStatus.includes('in-progress') && (progress === 0 || progress >= 100)) return false
        if (filterProgressStatus.includes('completed') && progress < 100) return false
      }

      // Book count filter
      if (filterBookCount.length > 0) {
        const count = shelf.bookCount || 0
        if (filterBookCount.includes('empty') && count > 0) return false
        if (filterBookCount.includes('small') && (count < 1 || count > 5)) return false
        if (filterBookCount.includes('medium') && (count < 6 || count > 10)) return false
        if (filterBookCount.includes('large') && count < 10) return false
      }

      return true
    })
  }, [allBookshelves, bookshelfSearchQuery, filterVisibility, filterProgressStatus, filterBookCount])

  // Reset bookshelf filters
  const resetBookshelfFilters = () => {
    setBookshelfSearchQuery('')
    setFilterVisibility([])
    setFilterProgressStatus([])
    setFilterBookCount([])
  }

  if (bookshelfId) {
    return (
      <LibraryContextProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshBooks }}>
        <div className="space-y-6">
          <div className="flex items-center">
            <Link href="/library?tab=bookshelves">
              <Button variant="ghost">
                &larr; Back to Bookshelves
              </Button>
            </Link>
          </div>
          <BookshelfContent
            key={bookshelfKey}
            bookshelfId={bookshelfId}
            onAddBooks={() => {
              setEditingBookshelf({ id: bookshelfId })
              setIsShelfDrawerOpen(true)
            }}
          />
        </div>

        {/* Edit Bookshelf Drawer */}
        <BookshelfMutateDrawer
          open={isShelfDrawerOpen}
          onOpenChange={(isOpen) => {
            setIsShelfDrawerOpen(isOpen)
            if (!isOpen) setEditingBookshelf(null)
          }}
          onSuccess={handleSuccess}
          bookshelf={editingBookshelf}
        />

        {/* Delete Dialog */}
        <ConfirmDialog
          open={open === 'delete'}
          onOpenChange={(isOpen) => setOpen(isOpen ? 'delete' : null)}
          title="Are you sure?"
          desc={
            currentRow?.fileUrl ? (
              <>This action cannot be undone. This will permanently delete the book &quot;{currentRow?.name}&quot;.</>
            ) : (
              <>This action cannot be undone. This will permanently delete the bookshelf &quot;{currentRow?.name}&quot;.</>
            )
          }
          cancelBtnText="Cancel"
          confirmText="Delete"
          destructive
          handleConfirm={handleDelete}
        />
      </LibraryContextProvider>
    )
  }

  return (
    <LibraryContextProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshBooks }}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold mb-2">My Library</h1>
            <p className="text-muted-foreground">
              Organize your books into custom collections and manage your uploads.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Button onClick={() => setIsBookDrawerOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Book
            </Button>
            <Button onClick={() => setIsShelfDrawerOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Bookshelf
            </Button>
          </div>
        </div>

        {/* Dashboard Summary - Always visible at top */}
        {booksLoading ? (
          <DashboardSummarySkeleton />
        ) : (
          <DashboardSummary
            summaries={[
              {
                title: 'Books Read',
                value: stats.completedBooks,
                description: stats.completedThisMonth > 0 ? `${stats.completedThisMonth} this month` : 'Start reading to track',
                icon: BookOpen,
              },
              {
                title: 'Reading Time',
                value: `${stats.readingTimeHours}h`,
                description: stats.totalPagesRead > 0 ? `${stats.totalPagesRead} pages read` : 'Start reading to track',
                icon: Clock,
              },
              {
                title: 'Currently Reading',
                value: stats.currentlyReading,
                description: stats.currentlyReading > 0 ? 'Books in progress' : 'No books started',
                icon: TrendingUp,
              },
              {
                title: 'Total Progress',
                value: books.length > 0 ? `${Math.round((stats.completedBooks / books.length) * 100)}%` : '0%',
                description: `${stats.completedBooks} of ${books.length} books completed`,
                icon: Target,
                additionalContent: (
                  <Progress value={books.length > 0 ? (stats.completedBooks / books.length) * 100 : 0} className="h-2" />
                ),
              },
            ]}
          />
        )}

        <Tabs value={activeTab} className="space-y-4" onValueChange={(value) => router.push(`/library?tab=${value}`)}>
          {/* Tabs List with Filter Toolbar - Side by Side */}
          {booksLoading ? (
            <FilterToolbarSkeleton />
          ) : (
            <div className="flex flex-col md:flex-row md:justify-between gap-4">
              <TabsList>
                <Link href="/library?tab=my-uploads">
                  <TabsTrigger value="my-uploads">My Uploads</TabsTrigger>
                </Link>
                <Link href="/library?tab=bookshelves">
                  <TabsTrigger value="bookshelves">Bookshelves</TabsTrigger>
                </Link>
                <Link href="/library?tab=my-requests">
                  <TabsTrigger value="my-requests">My Requests</TabsTrigger>
              </Link>
            </TabsList>

            {/* Filter Toolbar - Shows based on active tab */}
            {activeTab === 'my-uploads' && (
              <LibraryFilterToolbar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                readingStatus={filterReadingStatus}
                onReadingStatusChange={setFilterReadingStatus}
                authors={uniqueAuthors}
                selectedAuthors={filterAuthors}
                onAuthorsChange={setFilterAuthors}
                onReset={resetFilters}
                bookCount={filteredBooks.length}
              />
            )}
            {activeTab === 'bookshelves' && (
              <BookshelfFilterToolbar
                searchValue={bookshelfSearchQuery}
                onSearchChange={setBookshelfSearchQuery}
                visibility={filterVisibility}
                onVisibilityChange={setFilterVisibility}
                progressStatus={filterProgressStatus}
                onProgressStatusChange={setFilterProgressStatus}
                bookCount={filterBookCount}
                onBookCountChange={setFilterBookCount}
                onReset={resetBookshelfFilters}
                bookshelfCount={filteredBookshelves.length}
              />
            )}
            {activeTab === 'my-requests' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {requests.length} request{requests.length !== 1 ? 's' : ''}
                </span>
                <Button onClick={() => setIsRequestDrawerOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Request Book
                </Button>
              </div>
            )}
          </div>
          )}

          <TabsContent value="my-uploads" className="space-y-6 md:overflow-y-visible md:max-h-none">
            {booksLoading ? (
              /* Scrollable skeleton - only this scrolls on mobile */
              <div className="overflow-y-auto pb-24 md:overflow-y-visible md:max-h-none md:pb-0 max-h-[calc(100vh-28rem)]">
                <BookGridSkeleton count={6} />
              </div>
            ) : filteredBooks.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No books uploaded yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your first book to start building your library.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click the &quot;Upload Book&quot; button above to get started.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Scrollable book list - only this scrolls on mobile */
              <div className="overflow-y-auto pb-24 md:overflow-y-visible md:max-h-none md:pb-0 max-h-[calc(100vh-28rem)]">
                <BookList
                  books={filteredBooks}
                  onEditAction={handleEditBook}
                  onCardClickAction={handleBookClick}
                />
              </div>
            )}
          </TabsContent>
          <TabsContent value="bookshelves" className="space-y-4 md:overflow-y-visible md:max-h-none">
            <div className="overflow-y-auto max-h-[calc(100vh-24rem)] pb-24 md:overflow-y-visible md:max-h-none md:pb-0">
              <Bookshelves
                key={bookshelfKey}
                bookshelves={filteredBookshelves}
                isLoading={bookshelvesLoading}
                onEdit={handleEditBookshelf}
                onDelete={handleDeleteBookshelf}
                onRefresh={refreshBookshelves}
              />
            </div>
          </TabsContent>
          <TabsContent value="my-requests" className="space-y-6 md:overflow-y-visible md:max-h-none">
            {requestsLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground">Loading requests...</div>
              </div>
            ) : requests.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven&apos;t requested any books yet.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click the &quot;Request Book&quot; button above to get started.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {requests.map((request) => {
                    const config = statusConfig[request.status]
                    const canCancel = request.status === RequestStatus.PENDING

                    return (
                      <Card key={request.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg line-clamp-2">
                                {request.bookName}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                by {request.authorName}
                              </p>
                            </div>
                            <Badge variant={config.variant}>{config.label}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span>{typeLabels[request.type]}</span>
                          </div>

                          {(request.edition || request.publisher || request.isbn) && (
                            <div className="text-sm text-muted-foreground space-y-1">
                              {request.edition && <div>Edition: {request.edition}</div>}
                              {request.publisher && <div>Publisher: {request.publisher}</div>}
                              {request.isbn && <div>ISBN: {request.isbn}</div>}
                            </div>
                          )}

                          {request.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {request.description}
                            </p>
                          )}

                          {request.cancelReason && (
                            <div className="text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-2 mt-2">
                              <div className="flex items-start gap-2">
                                <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="font-medium text-xs">
                                    Cancelled by: {request.cancelledById === user?.id
                                      ? 'You'
                                      : `${request.cancelledBy?.firstName || request.cancelledBy?.name || 'Unknown'} (${request.cancelledBy?.role || 'Unknown'})`}
                                  </div>
                                  <div className="text-xs mt-1">
                                    <span className="font-medium">Reason:</span> {request.cancelReason}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Requested on {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {canCancel && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => openCancelDialog(request)}
                              disabled={cancellingId === request.id}
                            >
                              {cancellingId === request.id ? (
                                'Cancelling...'
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel Request
                                </>
                              )}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload/Edit Book Drawer */}
      <UploadBooksMutateDrawer
        open={isBookDrawerOpen}
        onOpenChange={(isOpen) => {
          setIsBookDrawerOpen(isOpen)
          if (!isOpen) setEditingBook(null)
        }}
        onSuccess={handleSuccess}
        book={editingBook}
      />

      {/* Create/Edit Bookshelf Drawer */}
      <BookshelfMutateDrawer
        open={isShelfDrawerOpen}
        onOpenChange={(isOpen) => {
          setIsShelfDrawerOpen(isOpen)
          if (!isOpen) setEditingBookshelf(null)
        }}
        onSuccess={handleSuccess}
        bookshelf={editingBookshelf}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={open === 'delete'}
        onOpenChange={(isOpen) => setOpen(isOpen ? 'delete' : null)}
        title="Are you sure?"
        desc={
          currentRow?.fileUrl ? (
            <>This action cannot be undone. This will permanently delete the book &quot;{currentRow?.name}&quot;.</>
          ) : (
            <>This action cannot be undone. This will permanently delete the bookshelf &quot;{currentRow?.name}&quot;.</>
          )
        }
        cancelBtnText="Cancel"
        confirmText="Delete"
        destructive
        handleConfirm={handleDelete}
      />

      {/* PDF Reader Modal */}
      {selectedBook && selectedBook.fileUrl && (
        <PDFReaderModal
          isOpen={isReaderModalOpen}
          onClose={() => setIsReaderModalOpen(false)}
          bookId={selectedBook.id}
          fileUrl={selectedBook.fileUrl}
          initialPage={selectedBook.readingProgress?.[0]?.currentPage}
        />
      )}

      {/* Request Book Drawer */}
      <RequestBookDrawer
        open={isRequestDrawerOpen}
        onOpenChange={setIsRequestDrawerOpen}
        onSuccess={fetchRequests}
      />

      {/* Cancel Request Dialog */}
      <ConfirmDialog
        open={isCancelDialogOpen}
        onOpenChange={(open) => {
          setIsCancelDialogOpen(open)
          if (!open) {
            setCancelReason('')
            setReasonError('')
          }
        }}
        title="Cancel Request"
        desc={
          requestToCancel && (
            <div>
              Are you sure you want to cancel the request for{' '}
              <strong>&quot;{requestToCancel.bookName}&quot;</strong> by {requestToCancel.authorName}?
              This action cannot be undone.
            </div>
          )
        }
        cancelBtnText="Keep Request"
        confirmText={cancellingId ? 'Cancelling...' : 'Cancel Request'}
        destructive
        handleConfirm={handleCancelRequest}
        disabled={cancellingId !== null}
        isLoading={cancellingId !== null}
      >
        <div className="space-y-2 py-4">
          <Label htmlFor="cancel-reason">
            Reason for cancellation <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="cancel-reason"
            placeholder="Please provide a reason for cancelling this request..."
            value={cancelReason}
            onChange={(e) => {
              setCancelReason(e.target.value)
              setReasonError('')
            }}
            className={reasonError ? 'border-destructive' : ''}
          />
          {reasonError && (
            <p className="text-sm text-destructive">{reasonError}</p>
          )}
        </div>
      </ConfirmDialog>
    </LibraryContextProvider>
  )
}

// Wrapper with Suspense boundary for useSearchParams
export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LibraryPageContent />
    </Suspense>
  )
}
