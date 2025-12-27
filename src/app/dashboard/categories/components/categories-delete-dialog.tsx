'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Category } from '../data/schema'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  category: Category
}

export function CategoriesDeleteDialog({ open, onOpenChange, onConfirm, category }: Props) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Category"
      desc={
        <>
          Are you sure you want to delete the category <strong>&quot;{category.name}&quot;</strong>?
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