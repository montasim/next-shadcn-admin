'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FolderOpen, Plus, Loader2 } from 'lucide-react'
import { getBookshelfById, removeBookFromBookshelf } from '../actions'
import { UploadBooksMutateDrawer } from '../upload-books-mutate-drawer'
import { toast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {BookCard} from "@/components";

interface BookshelfContentProps {
  bookshelfId: string;
  onAddBooks?: () => void;
}

export function BookshelfContent({ bookshelfId, onAddBooks }: BookshelfContentProps) {
  const [bookshelf, setBookshelf] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBookDrawerOpen, setIsBookDrawerOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<any>(null)
  const [deletingBook, setDeletingBook] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const fetchBookshelf = async () => {
      setIsLoading(true)
      try {
        const data = await getBookshelfById(bookshelfId)
        setBookshelf(data)
      } catch (error) {
        console.error('Error fetching bookshelf:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (bookshelfId) {
      fetchBookshelf()
    }
  }, [bookshelfId])

  const handleEditBook = (book: any) => {
    setEditingBook(book)
    setIsBookDrawerOpen(true)
  }

  const handleDeleteBook = (book: any) => {
    setDeletingBook(book)
    setShowDeleteDialog(true)
  }

  const confirmRemoveBook = async () => {
    if (!deletingBook) return

    try {
      const result = await removeBookFromBookshelf(bookshelfId, deletingBook.id)
      if (result.success) {
        toast({ title: result.message })
        // Refresh bookshelf data
        const data = await getBookshelfById(bookshelfId)
        setBookshelf(data)
      } else {
        toast({ title: result.message, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error removing book:', error)
      toast({ title: 'Failed to remove book from bookshelf', variant: 'destructive' })
    } finally {
      setShowDeleteDialog(false)
      setDeletingBook(null)
    }
  }

  const handleSuccess = async () => {
    // Refresh bookshelf data after book edit
    const data = await getBookshelfById(bookshelfId)
    setBookshelf(data)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="w-full h-48 bg-muted rounded-lg mb-4" />
              <div className="h-5 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!bookshelf) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Bookshelf not found</h3>
            <p className="text-muted-foreground">
              The bookshelf you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const books = bookshelf.books?.map((item: any) => ({
    ...item.book,
    authors: item.book.authors.map((ba: any) => ba.author),
    readingProgress: item.book.readingProgress || []
  })) || []

  return (
    <div className="space-y-6">
      {/* Bookshelf Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{bookshelf.name}</h2>
          {bookshelf.description && (
            <p className="text-muted-foreground mt-1">{bookshelf.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {books.length} {books.length === 1 ? 'book' : 'books'} in this bookshelf
          </p>
        </div>
        <Button onClick={onAddBooks}>
          <Plus className="h-4 w-4 mr-2" />
          Add Books
        </Button>
      </div>

      {/* Books Grid */}
      {books.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No books yet</h3>
              <p className="text-muted-foreground mb-4">
                This bookshelf is empty. Add some books to get started.
              </p>
              <Button onClick={onAddBooks}>
                <Plus className="h-4 w-4 mr-2" />
                Add Books
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book: any) => (
            <BookCard
              key={book.id}
              book={book}
              onEdit={handleEditBook}
              onDelete={handleDeleteBook}
            />
          ))}
        </div>
      )}

      {/* Edit Book Drawer */}
      <UploadBooksMutateDrawer
        open={isBookDrawerOpen}
        onOpenChange={(isOpen) => {
          setIsBookDrawerOpen(isOpen)
          if (!isOpen) setEditingBook(null)
        }}
        onSuccess={handleSuccess}
        book={editingBook}
      />

      {/* Remove from Bookshelf Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={`Remove Book from "${bookshelf.name}" bookshelf?`}
        desc={
          <>
            Are you sure you want to remove &quot;{deletingBook?.name}&quot; from the &quot;{bookshelf.name}&quot; bookshelf?
            The book will not be deleted from your library.
          </>
        }
        cancelBtnText="Cancel"
        confirmText="Remove"
        handleConfirm={confirmRemoveBook}
      />
    </div>
  )
}
