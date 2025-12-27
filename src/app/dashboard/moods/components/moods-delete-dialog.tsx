'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Mood } from '../data/schema'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  mood: Mood
}

export function MoodsDeleteDialog({ open, onOpenChange, onConfirm, mood }: Props) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Mood"
      desc={
        <>
          Are you sure you want to delete the mood <strong>{mood.emoji} {mood.name}</strong>?
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
