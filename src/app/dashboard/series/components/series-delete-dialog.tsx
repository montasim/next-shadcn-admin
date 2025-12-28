'use client'

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
import { useSeriesContext } from '../context/series-context'
import { Series } from '../data/schema'
import { deleteSeries } from '../actions'
import { toast } from '@/hooks/use-toast'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface Props {
  series: Series
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SeriesDeleteDialog({ series, open, onOpenChange }: Props) {
  const { refreshSeries, setCurrentRow, setOpen } = useSeriesContext()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteSeries(series.id)
      await refreshSeries()
      toast({
        title: 'Series deleted',
        description: 'The series has been deleted successfully.',
      })
      setOpen(null)
      setCurrentRow(null)
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error deleting series:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete series',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="space-y-2">
            <p>
              This action cannot be undone. This will permanently delete the series
              <span className="font-semibold"> &quot;{series.name}&quot;</span>.
            </p>
            {series._count && series._count.books > 0 && (
              <p className="text-destructive font-medium">
                Warning: This series has {series._count.books} book(s). Books will
                not be deleted, but they will no longer be associated with this series.
              </p>
            )}
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={handleDelete}
          disabled={loading}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialog>
  )
}
