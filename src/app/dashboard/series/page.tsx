'use client'

import { getSeries } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { SeriesHeader } from './components/series-header'
import { useEffect, useState } from 'react'
import { Series } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from './components/columns'
import { SeriesMutateDrawer } from './components/series-mutate-drawer'
import { SeriesDeleteDialog } from './components/series-delete-dialog'
import SeriesProvider, { useSeriesContext, SeriesDialogType } from './context/series-context'

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([])

  useEffect(() => {
    const updateSeries = async () => {
      try {
        const rawSeries = await getSeries()
        setSeries(rawSeries)
      } catch (error) {
        console.error('Error fetching series:', error)
        toast({
          title: 'Error',
          description: 'Failed to load series',
          variant: 'destructive',
        })
      }
    }

    updateSeries()
  }, [])

  // Local states
  const [currentRow, setCurrentRow] = useState<Series | null>(null)
  const [open, setOpen] = useDialogState<SeriesDialogType>(null)

  const refreshSeries = async () => {
    try {
      const rawSeries = await getSeries()
      setSeries(rawSeries)
    } catch (error) {
      console.error('Error refreshing series:', error)
      toast({
        title: 'Error',
        description: 'Failed to refresh series',
        variant: 'destructive',
      })
    }
  }

  return (
    <SeriesProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshSeries }}>
      <HeaderContainer>
        <SeriesHeader />
      </HeaderContainer>

      <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0">
        <DataTable data={series} columns={columns} />
      </div>

      <SeriesMutateDrawer
        key="series-create"
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
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
    </SeriesProvider>
  )
}
