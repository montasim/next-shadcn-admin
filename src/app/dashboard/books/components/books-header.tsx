'use client'

import { Plus, RefreshCw, Upload, Trash2 } from 'lucide-react'
import { useBooksContext } from '../context/books-context'
import { BulkImportDrawer } from './bulk-import-drawer'
import { useState } from 'react'
import { invalidateCache } from '../actions'
import { toast } from 'sonner'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'

export function BooksHeaderActions() {
  const { setOpen, refreshBooks } = useBooksContext()
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [isInvalidating, setIsInvalidating] = useState(false)

  const handleInvalidateCache = async () => {
    setIsInvalidating(true)
    try {
      await invalidateCache()
      toast.success('Books cache invalidated successfully')
      await refreshBooks?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to invalidate cache')
    } finally {
      setIsInvalidating(false)
    }
  }

  const actions = [
    {
      label: 'Add Book',
      icon: Plus,
      onClick: () => setOpen('create'),
    },
    {
      label: 'Bulk Import',
      icon: Upload,
      onClick: () => setBulkImportOpen(true),
      variant: 'outline' as const,
    },
    {
      label: 'Refresh',
      icon: RefreshCw,
      onClick: () => refreshBooks?.(),
      variant: 'outline' as const,
    },
    {
      label: 'Invalidate Cache',
      icon: Trash2,
      onClick: handleInvalidateCache,
      variant: 'outline' as const,
      disabled: isInvalidating,
      loading: isInvalidating,
    },
  ]

  return (
    <>
      <DashboardPageHeaderActions actions={actions} />
      <BulkImportDrawer
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onSuccess={() => refreshBooks?.()}
      />
    </>
  )
}
