'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Publication } from '../data/schema'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  publication: Publication
}

export function PublicationsDeleteDialog({ open, onOpenChange, onConfirm, publication }: Props) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Publication"
      desc={
        <>
          Are you sure you want to delete the publication <strong>&quot;{publication.name}&quot;</strong>?
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