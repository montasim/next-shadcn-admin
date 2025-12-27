'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Author } from '../data/schema'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  author: Author
}

export function AuthorsDeleteDialog({ open, onOpenChange, onConfirm, author }: Props) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Author"
      desc={
        <>
          Are you sure you want to delete the author <strong>&quot;{author.name}&quot;</strong>?
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