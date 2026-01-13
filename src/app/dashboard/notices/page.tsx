'use client'

import { deleteNotice, getNotices } from './actions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'
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
import { Bell, Plus, RefreshCw } from 'lucide-react'

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
      <DashboardPage
        icon={Bell}
        title="Notices"
        description="Manage notices and announcements for your users"
        actions={
          <DashboardPageHeaderActions
            actions={[
              {
                label: 'Add Notice',
                icon: Plus,
                onClick: () => setOpen('create'),
              },
              {
                label: 'Refresh',
                icon: RefreshCw,
                onClick: refreshNotices,
                variant: 'outline',
              },
            ]}
          />
        }
      >
        {isLoading ? (
          <TableSkeleton />
        ) : notices.length === 0 ? (
          <EmptyStateCard
            icon={Bell}
            title="No notices yet"
            description="Get started by creating your first notice to communicate important updates to your users."
          />
        ) : (
          <DataTable data={notices} columns={columns} />
        )}

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
      </DashboardPage>
    </NoticesContextProvider>
  )
}
