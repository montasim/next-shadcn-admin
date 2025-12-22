'use client'

import { deleteBook, getBooks } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { BooksHeader } from './components/books-header'
import { useEffect, useState } from 'react'
import { Book } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import BooksContextProvider, { BooksDialogType } from './context/books-context'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from './components/columns'
import { BooksMutateDrawer } from './components/books-mutate-drawer'
import { BooksDeleteDialog } from './components/books-delete-dialog'

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    const updateBooks = async () => {
      const rawBooks = await getBooks()
      setBooks(rawBooks)
    }

    updateBooks()
  }, [])

  // Local states
  const [currentRow, setCurrentRow] = useState<Book | null>(null)
  const [open, setOpen] = useDialogState<BooksDialogType>(null)

  const refreshBooks = async () => {
    try {
      const rawBooks = await getBooks()
      setBooks(rawBooks)
    } catch (error) {
      console.error('Error refreshing books-old:', error)
    }
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

  return (
    <BooksContextProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshBooks }}>
      <HeaderContainer>
        <BooksHeader />
      </HeaderContainer>

      <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
        <DataTable data={books} columns={columns} />
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
    </BooksContextProvider>
  )
}