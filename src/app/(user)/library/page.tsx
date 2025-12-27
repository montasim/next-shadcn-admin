'use client'

import { useState, useEffect, useMemo, useRef, useCallback, useTransition, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
    Plus,
    Upload,
    BookOpen,
    Clock,
    TrendingUp,
    Target,
    ChevronUp,
    ChevronDown,
} from 'lucide-react'
import { BookList } from './book-list'
import { Bookshelves } from './components/bookshelves'
import { PDFReaderModal } from '@/components/reader/pdf-reader-modal'
import { BookshelfContent } from './components/bookshelf-content'
import { BookshelfMutateDrawer } from './bookshelf-mutate-drawer'
import { UploadBooksMutateDrawer } from './upload-books-mutate-drawer'
import { LibraryFilterToolbar } from './components/library-filter-toolbar'
import { BookshelfFilterToolbar } from './components/bookshelf-filter-toolbar'
import { Book } from '@/app/dashboard/books/data/schema'
import { deleteBook } from '@/app/dashboard/books/actions'
import { getBookshelves, deleteBookshelf, getUserBooks } from './actions'
import { calculateReadingTimeHours } from '@/lib/utils/reading-time'
import LibraryContextProvider, { LibraryDialogType } from './context/library-context'
import useDialogState from '@/hooks/use-dialog-state'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from '@/hooks/use-toast'

interface LibraryStats {
  completedBooks: number
  completedThisMonth: number
  readingTimeHours: number
  currentlyReading: number
  totalPages: number
  totalPagesRead: number
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
  const bookshelfId = searchParams.get('bookshelfId')
  // Determine active tab from pathname or fallback to query param
  const activeTab = pathname.includes('/bookshelves') ? 'bookshelves' :
  pathname.includes('/my-uploads') ? 'my-uploads' :
  searchParams.get('tab') || 'my-uploads'

  const [books, setBooks] = useState<Book[]>([])
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
  const [showSummary, setShowSummary] = useState(true)

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
    const userBooks = await getUserBooks()
    startTransition(() => {
      setBooks(userBooks)
      setStats(calculateLibraryStats(userBooks))
    })
  }, [])

  const refreshBookshelves = useCallback(async () => {
    const shelves = await getBookshelves()
    startTransition(() => {
      setAllBookshelves(shelves)
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
    }
  }, [refreshBooks, refreshBookshelves])

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

        <Tabs value={activeTab} className="space-y-4" onValueChange={(value) => router.push(`/library/${value === 'my-uploads' ? 'my-uploads' : 'bookshelves'}`)}>
          <TabsList>
            <Link href="/library/my-uploads">
              <TabsTrigger value="my-uploads">My Uploads</TabsTrigger>
            </Link>
            <Link href="/library/bookshelves">
              <TabsTrigger value="bookshelves">Bookshelves</TabsTrigger>
            </Link>
          </TabsList>
          <TabsContent value="my-uploads" className="space-y-6 md:overflow-y-visible md:max-h-none">
            {/* Stats Overview - Fixed position on mobile */}
            {/* Mobile toggle button */}
            <div className="flex items-center justify-between md:hidden mb-2">
              <h2 className="text-lg font-semibold">Summary</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSummary(!showSummary)}
              >
                {showSummary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            {showSummary && (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Books Read</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedBooks}</div>
                  <p className="text-xs text-muted-foreground">{stats.completedThisMonth > 0 ? `${stats.completedThisMonth} this month` : 'Start reading to track'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.readingTimeHours}h</div>
                  <p className="text-xs text-muted-foreground">{stats.totalPagesRead > 0 ? `${stats.totalPagesRead} pages read` : 'Start reading to track'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Currently Reading</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.currentlyReading}</div>
                  <p className="text-xs text-muted-foreground">{stats.currentlyReading > 0 ? 'Books in progress' : 'No books started'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Progress</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{books.length > 0 ? Math.round((stats.completedBooks / books.length) * 100) : 0}%</div>
                  <p className="text-xs text-muted-foreground">{stats.completedBooks} of {books.length} books completed</p>
                  <Progress value={books.length > 0 ? (stats.completedBooks / books.length) * 100 : 0} className="mt-2 h-2" />
                </CardContent>
              </Card>
            </div>
            )}

            {/* Filter Toolbar */}
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

            {/* Scrollable book list - only this scrolls on mobile */}
            <div className={`overflow-y-auto pb-24 md:overflow-y-visible md:max-h-none md:pb-0 ${showSummary ? 'max-h-[calc(100vh-46rem)]' : 'max-h-[calc(100vh-28rem)]'}`}>
              <BookList
                books={filteredBooks}
                onEditAction={handleEditBook}
                onCardClickAction={handleBookClick}
              />
            </div>
          </TabsContent>
          <TabsContent value="bookshelves" className="space-y-4 md:overflow-y-visible md:max-h-none">
            {/* Filter Toolbar */}
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

            <div className="overflow-y-auto max-h-[calc(100vh-24rem)] pb-24 md:overflow-y-visible md:max-h-none md:pb-0">
              <Bookshelves
                key={bookshelfKey}
                bookshelves={filteredBookshelves}
                isLoading={false}
                onEdit={handleEditBookshelf}
                onDelete={handleDeleteBookshelf}
                onRefresh={refreshBookshelves}
              />
            </div>
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
