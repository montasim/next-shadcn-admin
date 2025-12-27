'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Notice } from '../data/schema'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  notice: Notice
}

export function NoticesDeleteDialog({ open, onOpenChange, onConfirm, notice }: Props) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Notice"
      desc={
        <>
          Are you sure you want to delete the notice <strong>{notice.title}</strong>?
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
