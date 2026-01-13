'use client'

import { deleteSeries, getSeries } from './actions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Series } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from './components/columns'
import { SeriesMutateDrawer } from './components/series-mutate-drawer'
import { SeriesDeleteDialog } from './components/series-delete-dialog'
import SeriesProvider, { useSeriesContext, SeriesDialogType } from './context/series-context'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import { TableSkeleton } from '@/components/data-table/table-skeleton'
import { Button } from '@/components/ui/button'
import { Trash2, X, Layers, Plus } from 'lucide-react'
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

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([])
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

  const fetchSeriesForPage = useCallback(async (pageIndex: number, pageSize: number) => {
    const fetchKey = `${pageIndex}-${pageSize}`
    const apiPage = pageIndex + 1

    // Skip if we just fetched this page
    if (lastFetchedRef.current === fetchKey) {
      return
    }

    // Mark as fetching immediately to prevent duplicates
    lastFetchedRef.current = fetchKey

    // Set loading state for initial load or page change
    if (series.length === 0 || pageIndex !== pagination.pageIndex) {
      setIsLoading(true)
    }

    try {
      const result = await getSeries({
        page: apiPage,
        pageSize: pageSize,
      })
      setSeries(result.series)
      setTotalCount(result.pagination.total)
    } catch (error) {
      console.error('Error fetching series:', error)
      // Reset on error so we can retry
      lastFetchedRef.current = ''
      toast({
        title: 'Error',
        description: 'Failed to load series',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [series.length, pagination.pageIndex])

  useEffect(() => {
    // Skip first render - let the initial fetch happen naturally
    if (!isMountedRef.current) {
      isMountedRef.current = true
      fetchSeriesForPage(pagination.pageIndex, pagination.pageSize)
      return
    }

    fetchSeriesForPage(pagination.pageIndex, pagination.pageSize)
  }, [pagination.pageIndex, pagination.pageSize, fetchSeriesForPage])

  // Local states
  const [currentRow, setCurrentRow] = useState<Series | null>(null)
  const [open, setOpen] = useDialogState<SeriesDialogType>(null)

  const refreshSeries = async () => {
    const { pageIndex, pageSize } = paginationRef.current
    await fetchSeriesForPage(pageIndex, pageSize)
  }

  const handleBulkDelete = async () => {
    try {
      let deletedCount = 0
      let failedCount = 0

      for (const seriesId of selectedRows) {
        try {
          await deleteSeries(seriesId)
          deletedCount++
        } catch (error) {
          console.error(`Failed to delete series ${seriesId}:`, error)
          failedCount++
        }
      }

      await refreshSeries()
      setSelectedRows([])
      setShowBulkDeleteDialog(false)

      if (failedCount > 0) {
        toast({
          title: 'Partial success',
          description: `${deletedCount} ${deletedCount === 1 ? 'series' : 'series'} deleted. ${failedCount} ${failedCount === 1 ? 'series' : 'series'} could not be deleted.`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Series deleted successfully',
          description: `${deletedCount} ${deletedCount === 1 ? 'series' : 'series'} deleted.`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete series',
        variant: 'destructive',
      })
    }
  }

  return (
    <SeriesProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshSeries }}>
      <DashboardPage
        icon={Layers}
        title="Series"
        description="Manage book series in your system"
        actions={
          <DashboardPageHeaderActions
            actions={[
              {
                label: 'Add Series',
                icon: Plus,
                onClick: () => setOpen('create'),
              },
            ]}
          />
        }
      >
        {selectedRows.length > 0 && (
          <div className='mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-4'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium'>
                {selectedRows.length} {selectedRows.length === 1 ? 'series' : 'series'} selected
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
        ) : series.length === 0 ? (
          <EmptyStateCard
            icon={Layers}
            title='No series found'
            description='There are no series in the system yet. Create your first series to get started.'
          />
        ) : (
          <DataTable
            data={series}
            columns={columns}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalCount={totalCount}
            onSelectedRowsChange={setSelectedRows}
          />
        )}

      <SeriesMutateDrawer
        key="series-create"
        open={open === 'create'}
        onOpenChange={(open) => setOpen(open ? 'create' : null)}
        onSuccess={refreshSeries}
      />

      {currentRow && (
        <>
          <SeriesMutateDrawer
            key={`series-update-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
            onSuccess={refreshSeries}
          />

          <SeriesDeleteDialog
            key="series-delete"
            series={currentRow}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen(null)
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
          />
        </>
      )}

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Series</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRows.length} {selectedRows.length === 1 ? 'series' : 'series'}? This action cannot be undone.
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
    </SeriesProvider>
  )
}
