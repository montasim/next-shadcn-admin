'use client'

import { deleteNotice, getNotices } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { NoticesHeader } from './components/notices-header'
import { useEffect, useState } from 'react'
import { Notice } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import { NoticesContextProvider, NoticesDialogType } from './context/notices-context'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { TableSkeleton } from '@/components/data-table/table-skeleton'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import { columns } from './components/columns'
import { NoticesMutateDrawer } from './components/notices-mutate-drawer'
import { NoticesDeleteDialog } from './components/notices-delete-dialog'

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const updateNotices = async () => {
      setIsLoading(true)
      try {
        const rawNotices = await getNotices()
        setNotices(rawNotices)
      } catch (error) {
        console.error('Error fetching notices:', error)
      } finally {
        setIsLoading(false)
      }
    }

    updateNotices()
  }, [])

  // Local states
  const [currentRow, setCurrentRow] = useState<Notice | null>(null)
  const [open, setOpen] = useDialogState<NoticesDialogType>(null)

  const refreshNotices = async () => {
    setIsLoading(true)
    try {
      const rawNotices = await getNotices()
      setNotices(rawNotices)
    } catch (error) {
      console.error('Error refreshing notices:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (notice: Notice) => {
    try {
      await deleteNotice(notice.id)
      await refreshNotices()
      toast({
        title: 'The following notice has been deleted:',
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">
              {JSON.stringify(notice, null, 2)}
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
        description: 'Failed to delete notice',
        variant: 'destructive',
      })
    }
  }

  return (
    <NoticesContextProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshNotices }}>
      <HeaderContainer>
        <NoticesHeader />
      </HeaderContainer>

      <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0">
        {isLoading ? (
          <TableSkeleton />
        ) : notices.length === 0 ? (
          <EmptyStateCard
            title="No notices yet"
            description="Get started by creating your first notice to communicate important updates to your users."
          />
        ) : (
          <DataTable data={notices} columns={columns} />
        )}
      </div>

      <NoticesMutateDrawer
        key="notice-create"
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
        onSuccess={refreshNotices}
      />

      {currentRow && (
        <>
          <NoticesMutateDrawer
            key={`notice-update-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
            onSuccess={refreshNotices}
          />

          <NoticesDeleteDialog
            key="notice-delete"
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            onConfirm={() => handleDelete(currentRow)}
            notice={currentRow}
          />
        </>
      )}
    </NoticesContextProvider>
  )
}
