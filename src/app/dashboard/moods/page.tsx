'use client'

import { deleteMood, getMoods } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { MoodsHeader } from './components/moods-header'
import { useEffect, useState } from 'react'
import { Mood } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import MoodsContextProvider, { MoodsDialogType } from './context/moods-context'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from './components/columns'
import { MoodsMutateDrawer } from './components/moods-mutate-drawer'
import { MoodsDeleteDialog } from './components/moods-delete-dialog'

export default function MoodsPage() {
  const [moods, setMoods] = useState<Mood[]>([])

  useEffect(() => {
    const updateMoods = async () => {
      const rawMoods = await getMoods()
      setMoods(rawMoods)
    }

    updateMoods()
  }, [])

  // Local states
  const [currentRow, setCurrentRow] = useState<Mood | null>(null)
  const [open, setOpen] = useDialogState<MoodsDialogType>(null)

  const refreshMoods = async () => {
    try {
      const rawMoods = await getMoods()
      setMoods(rawMoods)
    } catch (error) {
      console.error('Error refreshing moods:', error)
    }
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

  return (
    <MoodsContextProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshMoods }}>
      <HeaderContainer>
        <MoodsHeader />
      </HeaderContainer>

      <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0">
        <DataTable data={moods} columns={columns} />
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
    </MoodsContextProvider>
  )
}
