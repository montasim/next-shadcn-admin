'use client'

import { deleteTranslator, getTranslators } from './actions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DashboardPageHeaderActions, ActionConfig } from '@/components/dashboard/dashboard-page-header-actions'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Translator } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import TranslatorsContextProvider, { TranslatorsDialogType } from './context/translators-context'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from './components/columns'
import { TranslatorsMutateDrawer } from './components/translators-mutate-drawer'
import { TranslatorsDeleteDialog } from './components/translators-delete-dialog'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import { TableSkeleton } from '@/components/data-table/table-skeleton'
import { Button } from '@/components/ui/button'
import { Trash2, X, Languages } from 'lucide-react'
import { IconUserPlus } from '@tabler/icons-react'
import { RefreshCw } from 'lucide-react'
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

export default function TranslatorsPage() {
  const [translators, setTranslators] = useState<Translator[]>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [totalCount, setTotalCount] = useState(0)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Store current pagination in a ref to avoid stale closures
  const paginationRef = useRef(pagination)
  paginationRef.current = pagination

  // Track component mount
  const isMountedRef = useRef(false)

  // Track last fetched page to prevent duplicates
  const lastFetchedRef = useRef<string>('')

  const fetchTranslatorsForPage = useCallback(async (pageIndex: number, pageSize: number) => {
    const fetchKey = `${pageIndex}-${pageSize}`
    const apiPage = pageIndex + 1

    // Skip if we just fetched this page
    if (lastFetchedRef.current === fetchKey) {
      return
    }

    // Mark as fetching immediately to prevent duplicates
    lastFetchedRef.current = fetchKey

    // Set loading state for initial load or page change
    if (translators.length === 0 || pageIndex !== pagination.pageIndex) {
      setIsLoading(true)
    }

    try {
      const result = await getTranslators({
        page: apiPage,
        pageSize: pageSize,
      })
      setTranslators(result.translators)
      setTotalCount(result.pagination.total)
    } catch (error) {
      console.error('Error fetching translators:', error)
      // Reset on error so we can retry
      lastFetchedRef.current = ''
    } finally {
      setIsLoading(false)
    }
  }, [translators.length, pagination.pageIndex])

  useEffect(() => {
    // Skip first render - let the initial fetch happen naturally
    if (!isMountedRef.current) {
      isMountedRef.current = true
      fetchTranslatorsForPage(pagination.pageIndex, pagination.pageSize)
      return
    }

    fetchTranslatorsForPage(pagination.pageIndex, pagination.pageSize)
  }, [pagination.pageIndex, pagination.pageSize, fetchTranslatorsForPage])

  // Local states
  const [currentRow, setCurrentRow] = useState<Translator | null>(null)
  const [open, setOpen] = useDialogState<TranslatorsDialogType>(null)

  const refreshTranslators = async () => {
    const { pageIndex, pageSize } = paginationRef.current
    await fetchTranslatorsForPage(pageIndex, pageSize)
  }

  const handleDelete = async (translator: Translator) => {
    try {
      await deleteTranslator(translator.id)
      await refreshTranslators()
      toast({
        title: 'The following translator has been deleted:',
        description: (
          <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
            <code className='text-white'>
              {JSON.stringify(translator, null, 2)}
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
        description: 'Failed to delete translator',
        variant: 'destructive',
      })
    }
  }

  const handleBulkDelete = async () => {
    try {
      let deletedCount = 0
      let failedCount = 0

      for (const translatorId of selectedRows) {
        try {
          await deleteTranslator(translatorId)
          deletedCount++
        } catch (error) {
          console.error(`Failed to delete translator ${translatorId}:`, error)
          failedCount++
        }
      }

      await refreshTranslators()
      setSelectedRows([])
      setShowBulkDeleteDialog(false)

      if (failedCount > 0) {
        toast({
          title: 'Partial success',
          description: `${deletedCount} ${deletedCount === 1 ? 'translator' : 'translators'} deleted. ${failedCount} ${failedCount === 1 ? 'translator' : 'translators'} could not be deleted.`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Translators deleted successfully',
          description: `${deletedCount} ${deletedCount === 1 ? 'translator' : 'translators'} deleted.`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete translators',
        variant: 'destructive',
      })
    }
  }

  return (
    <TranslatorsContextProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshTranslators }}>
      <DashboardPage
        icon={Languages}
        title="Translators"
        description="Manage translators in your system"
        actions={
          <DashboardPageHeaderActions
            actions={[
              {
                label: 'Add Translator',
                icon: IconUserPlus,
                onClick: () => setOpen('create'),
              },
              {
                label: 'Refresh',
                icon: RefreshCw,
                onClick: refreshTranslators,
                variant: 'outline',
              },
            ]}
          />
        }
      >
        {selectedRows.length > 0 && (
          <div className='mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-4'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium'>
                {selectedRows.length} {selectedRows.length === 1 ? 'translator' : 'translators'} selected
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

        {isLoading ? (
          <TableSkeleton rowCount={pagination.pageSize} />
        ) : translators.length === 0 ? (
          <EmptyStateCard
            icon={Languages}
            title='No translators found'
            description='There are no translators in the system yet. Create your first translator to get started.'
          />
        ) : (
          <DataTable
            data={translators}
            columns={columns}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalCount={totalCount}
            onSelectedRowsChange={setSelectedRows}
          />
        )}

      <TranslatorsMutateDrawer
        key='translator-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
        onSuccess={refreshTranslators}
      />

      {currentRow && (
        <>
          <TranslatorsMutateDrawer
            key={`translator-update-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
            onSuccess={refreshTranslators}
          />

          <TranslatorsDeleteDialog
            key='translator-delete'
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            onConfirm={() => handleDelete(currentRow)}
            translator={currentRow}
          />
        </>
      )}

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Translators</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRows.length} {selectedRows.length === 1 ? 'translator' : 'translators'}? This action cannot be undone.
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
      </DashboardPage>
    </TranslatorsContextProvider>
  )
}
