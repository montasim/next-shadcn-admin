'use client'

import { useState, useEffect } from 'react'
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
    Target
} from 'lucide-react'
import { BookList } from './book-list'
import { Bookshelves } from './components/bookshelves'
import { BookshelfContent } from './components/bookshelf-content'
import { BookshelfMutateDrawer } from './bookshelf-mutate-drawer'
import { UploadBooksMutateDrawer } from './upload-books-mutate-drawer'
import { Book } from '@/app/dashboard/books/data/schema'
import { deleteBook } from '@/app/dashboard/books/actions'
import { getBookshelves, deleteBookshelf, getUserBooks } from './actions'
import LibraryContextProvider, { LibraryDialogType } from './context/library-context'
import useDialogState from '@/hooks/use-dialog-state'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'

// Mock stats data
const stats = {
    completedBooks: 8,
    readingTime: 45, // hours
    currentlyReading: 3,
}

export default function LibraryPage() {
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

  const refreshBooks = async () => {
    const userBooks = await getUserBooks()
    setBooks(userBooks)
  }

  const handleSuccess = () => {
    refreshBooks()
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
    refreshBooks()
  }, [])

  // Refresh books when page regains focus (user returns from reader)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshBooks()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

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
        <AlertDialog open={open === 'delete'} onOpenChange={(isOpen) => setOpen(isOpen ? 'delete' : null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {currentRow?.fileUrl ? (
                  <>This action cannot be undone. This will permanently delete the book "{currentRow?.name}".</>
                ) : (
                  <>This action cannot be undone. This will permanently delete the bookshelf "{currentRow?.name}".</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCurrentRow(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </LibraryContextProvider>
    )
  }

  return (
    <LibraryContextProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshBooks }}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Library</h1>
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
          <TabsContent value="my-uploads" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Books Read</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedBooks}</div>
                  <p className="text-xs text-muted-foreground">2 this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.readingTime}h</div>
                  <p className="text-xs text-muted-foreground">Total time invested</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Currently Reading</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.currentlyReading}</div>
                  <p className="text-xs text-muted-foreground">Active books</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reading Goal</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">67%</div>
                  <p className="text-xs text-muted-foreground">8 of 12 books</p>
                  <Progress value={67} className="mt-2 h-2" />
                </CardContent>
              </Card>
            </div>
            <BookList
              books={books}
              openDrawer={() => setIsBookDrawerOpen(true)}
              onEdit={handleEditBook}
            />
          </TabsContent>
          <TabsContent value="bookshelves" className="space-y-4">
            <Bookshelves
              key={bookshelfKey}
              onEdit={handleEditBookshelf}
              onDelete={handleDeleteBookshelf}
            />
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
      <AlertDialog open={open === 'delete'} onOpenChange={(isOpen) => setOpen(isOpen ? 'delete' : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {currentRow?.fileUrl ? (
                <>This action cannot be undone. This will permanently delete the book "{currentRow?.name}".</>
              ) : (
                <>This action cannot be undone. This will permanently delete the bookshelf "{currentRow?.name}".</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCurrentRow(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LibraryContextProvider>
  )
}
