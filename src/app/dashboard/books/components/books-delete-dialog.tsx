'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Book } from '../data/schema'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  book: Book
}

export function BooksDeleteDialog({ open, onOpenChange, onConfirm, book }: Props) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Book"
      desc={
        <>
          Are you sure you want to delete the book <strong>&quot;{book.name}&quot;</strong>?
          This action cannot be undone.
        </>
      }
      cancelBtnText="Cancel"
      confirmText="Delete"
      destructive
      handleConfirm={onConfirm}
    />
  )
}