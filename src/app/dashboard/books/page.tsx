'use client'

import { deleteBook, getBooks } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { BooksHeader } from './components/books-header'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Book } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import BooksContextProvider, { BooksDialogType } from './context/books-context'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from './components/columns'
import { BooksMutateDrawer } from './components/books-mutate-drawer'
import { BooksDeleteDialog } from './components/books-delete-dialog'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import { Button } from '@/components/ui/button'
import { Trash2, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [totalCount, setTotalCount] = useState(0)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  // Store current pagination in a ref to avoid stale closures
  const paginationRef = useRef(pagination)
  paginationRef.current = pagination

  // Track component mount
  const isMountedRef = useRef(false)

  // Track last fetched page to prevent duplicates
  const lastFetchedRef = useRef<string>('')

  const fetchBooksForPage = useCallback(async (pageIndex: number, pageSize: number) => {
    const fetchKey = `${pageIndex}-${pageSize}`
    const apiPage = pageIndex + 1

    // Skip if we just fetched this page
    if (lastFetchedRef.current === fetchKey) {
      return
    }

    // Mark as fetching immediately to prevent duplicates
    lastFetchedRef.current = fetchKey

    try {
      const result = await getBooks({
        page: apiPage,
        pageSize: pageSize,
      })
      setBooks(result.books)
      setTotalCount(result.pagination.total)
    } catch (error) {
      console.error('Error fetching books:', error)
      // Reset on error so we can retry
      lastFetchedRef.current = ''
    }
  }, [])

  useEffect(() => {
    // Skip first render - let the initial fetch happen naturally
    if (!isMountedRef.current) {
      isMountedRef.current = true
      fetchBooksForPage(pagination.pageIndex, pagination.pageSize)
      return
    }

    fetchBooksForPage(pagination.pageIndex, pagination.pageSize)
  }, [pagination.pageIndex, pagination.pageSize, fetchBooksForPage])

  // Local states
  const [currentRow, setCurrentRow] = useState<Book | null>(null)
  const [open, setOpen] = useDialogState<BooksDialogType>(null)

  const refreshBooks = async () => {
    const { pageIndex, pageSize } = paginationRef.current
    await fetchBooksForPage(pageIndex, pageSize)
  }

  const handleDelete = async (book: Book) => {
    try {
      await deleteBook(book.id)
      await refreshBooks()
      toast({
        title: 'The following book has been deleted:',
        description: (
          <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
            <code className='text-white'>
              {JSON.stringify(book, null, 2)}
            </code>
          </pre>
        ),
      })
      // Close the delete modal and clear the current row
      setOpen(null)
      setCurrentRow(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete book',
        variant: 'destructive',
      })
    }
  }

  const handleBulkDelete = async () => {
    try {
      let deletedCount = 0
      let failedCount = 0

      for (const bookId of selectedRows) {
        try {
          await deleteBook(bookId)
          deletedCount++
        } catch (error) {
          console.error(`Failed to delete book ${bookId}:`, error)
          failedCount++
        }
      }

      await refreshBooks()
      setSelectedRows([])
      setShowBulkDeleteDialog(false)

      if (failedCount > 0) {
        toast({
          title: 'Partial success',
          description: `${deletedCount} ${deletedCount === 1 ? 'book' : 'books'} deleted. ${failedCount} ${failedCount === 1 ? 'book' : 'books'} could not be deleted.`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Books deleted successfully',
          description: `${deletedCount} ${deletedCount === 1 ? 'book' : 'books'} deleted.`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete books',
        variant: 'destructive',
      })
    }
  }

  return (
    <BooksContextProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshBooks }}>
      <HeaderContainer>
        <BooksHeader />
      </HeaderContainer>

      {selectedRows.length > 0 && (
        <div className='mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-4'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>
              {selectedRows.length} {selectedRows.length === 1 ? 'book' : 'books'} selected
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setSelectedRows([])}
            >
              <X className='mr-2 h-4 w-4' />
              Clear
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
        {books.length === 0 ? (
          <EmptyStateCard
            title='No books found'
            description='There are no books in the system yet. Create your first book to get started.'
          />
        ) : (
          <DataTable
            data={books}
            columns={columns}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalCount={totalCount}
            onSelectedRowsChange={setSelectedRows}
          />
        )}
      </div>

      <BooksMutateDrawer
        key='book-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
        onSuccess={refreshBooks}
      />

      {currentRow && (
        <>
          <BooksMutateDrawer
            key={`book-update-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
            onSuccess={refreshBooks}
          />

          <BooksDeleteDialog
            key='book-delete'
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            onConfirm={() => handleDelete(currentRow)}
            book={currentRow}
          />
        </>
      )}

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Books</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRows.length} {selectedRows.length === 1 ? 'book' : 'books'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BooksContextProvider>
  )
}