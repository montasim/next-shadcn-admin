'use client'

import { deleteMood, getMoods } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { MoodsHeader } from './components/moods-header'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Mood } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import MoodsContextProvider, { MoodsDialogType } from './context/moods-context'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { TableSkeleton } from '@/components/data-table/table-skeleton'
import { columns } from './components/columns'
import { MoodsMutateDrawer } from './components/moods-mutate-drawer'
import { MoodsDeleteDialog } from './components/moods-delete-dialog'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import { Button } from '@/components/ui/button'
import { Trash2, X } from 'lucide-react'
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

export default function MoodsPage() {
  const [moods, setMoods] = useState<Mood[]>([])
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [seedDialogOpen, setSeedDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Track component mount
  const isMountedRef = useRef(false)

  const fetchMoods = useCallback(async () => {
    setIsLoading(true)
    try {
      const rawMoods = await getMoods()
      setMoods(rawMoods)
    } catch (error) {
      console.error('Error fetching moods:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      fetchMoods()
    }
  }, [fetchMoods])

  // Local states
  const [currentRow, setCurrentRow] = useState<Mood | null>(null)
  const [open, setOpen] = useDialogState<MoodsDialogType>(null)

  const refreshMoods = async () => {
    await fetchMoods()
  }

  const handleDelete = async (mood: Mood) => {
    try {
      await deleteMood(mood.id)
      await refreshMoods()
      toast({
        title: 'The following mood has been deleted:',
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">
              {JSON.stringify(mood, null, 2)}
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
        description: 'Failed to delete mood',
        variant: 'destructive',
      })
    }
  }

  const handleBulkDelete = async () => {
    try {
      let deletedCount = 0
      let failedCount = 0

      for (const moodId of selectedRows) {
        try {
          await deleteMood(moodId)
          deletedCount++
        } catch (error) {
          console.error(`Failed to delete mood ${moodId}:`, error)
          failedCount++
        }
      }

      await refreshMoods()
      setSelectedRows([])
      setShowBulkDeleteDialog(false)

      if (failedCount > 0) {
        toast({
          title: 'Partial success',
          description: `${deletedCount} ${deletedCount === 1 ? 'mood' : 'moods'} deleted. ${failedCount} ${failedCount === 1 ? 'mood' : 'moods'} could not be deleted.`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Moods deleted successfully',
          description: `${deletedCount} ${deletedCount === 1 ? 'mood' : 'moods'} deleted.`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete moods',
        variant: 'destructive',
      })
    }
  }

  const handleSeedMoods = async () => {
    try {
      const response = await fetch('/api/admin/moods/seed', { method: 'POST' })
      const result = await response.json()
      if (result.success) {
        toast({
          title: 'Moods seeded successfully',
          description: result.message,
        })
        await refreshMoods()
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to seed moods',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to seed moods',
        variant: 'destructive',
      })
    } finally {
      setSeedDialogOpen(false)
    }
  }

  return (
    <MoodsContextProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshMoods }}>
      <HeaderContainer>
        <MoodsHeader onSeedMoods={() => setSeedDialogOpen(true)} />
      </HeaderContainer>

      {selectedRows.length > 0 && (
        <div className='mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-4'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>
              {selectedRows.length} {selectedRows.length === 1 ? 'mood' : 'moods'} selected
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setSelectedRows([])}
            >
              <X className='mr-2 h-4 w-4' />
              Clear
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0">
        {isLoading ? (
          <TableSkeleton />
        ) : moods.length === 0 ? (
          <EmptyStateCard
            title='No moods found'
            description='There are no moods in the system yet. Create your first mood to get started.'
          />
        ) : (
          <DataTable data={moods} columns={columns} onSelectedRowsChange={setSelectedRows} />
        )}
      </div>

      <MoodsMutateDrawer
        key="mood-create"
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
        onSuccess={refreshMoods}
      />

      {currentRow && (
        <>
          <MoodsMutateDrawer
            key={`mood-update-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
            onSuccess={refreshMoods}
          />

          <MoodsDeleteDialog
            key="mood-delete"
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            onConfirm={() => handleDelete(currentRow)}
            mood={currentRow}
          />
        </>
      )}

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Moods</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRows.length} {selectedRows.length === 1 ? 'mood' : 'moods'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seed Mood Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will seed initial mood data. This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSeedMoods}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MoodsContextProvider>
  )
}
