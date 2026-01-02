'use client'

import { deleteUser, getUsers } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { UsersHeader } from './components/users-header'
import { useEffect, useState } from 'react'
import { User, userListSchema } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import UsersContextProvider, { UsersDialogType } from './context/users-context'
import { toast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { TableSkeleton } from '@/components/data-table/table-skeleton'
import { columns } from './components/columns'
import { UsersInviteDialog } from './components/users-invite-dialog'
import { UsersMutateDrawer } from './components/users-mutate-drawer'
import { UsersImportDialog } from './components/users-import-dialog'

export default function Page() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const updateUsers = async () => {
      setIsLoading(true)
      try {
        const rawUsers = await getUsers()
        const users = userListSchema.parse(rawUsers)
        setUsers(users)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setIsLoading(false)
      }
    }

    updateUsers()
  }, [])

  // Local states
  const [currentRow, setCurrentRow] = useState<User | null>(null)
  const [open, setOpen] = useDialogState<UsersDialogType>(null)

  const refreshUsers = async () => {
    setIsLoading(true)
    try {
      const rawUsers = await getUsers()
      const users = userListSchema.parse(rawUsers)
      setUsers(users)
    } catch (error) {
      console.error('Error refreshing users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (user: User) => {
    try {
      await deleteUser(user.id)
      await refreshUsers()
      toast({
        title: 'The following user has been deleted:',
        description: (
          <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
            <code className='text-white'>
              {JSON.stringify(user, null, 2)}
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
        description: 'Failed to delete user',
        variant: 'destructive',
      })
    }
  }

  return (
    <UsersContextProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshUsers }}>
      <HeaderContainer>
        <UsersHeader />
      </HeaderContainer>

      <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
        {isLoading ? <TableSkeleton /> : <DataTable data={users} columns={columns} />}
      </div>

      <UsersMutateDrawer
        key='user-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
        onSuccess={refreshUsers}
      />

      <UsersInviteDialog
        key='user-invite'
        open={open === 'invite'}
        onOpenChange={() => setOpen('invite')}
      />

      <UsersImportDialog
        key='users-import'
        open={open === 'import'}
        onOpenChange={() => setOpen('import')}
      />

      {currentRow && (
        <>
          <UsersMutateDrawer
            key={`user-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => {
              setOpen('update')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
            onSuccess={refreshUsers}
          />

          <ConfirmDialog
            key='user-delete'
            destructive
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            handleConfirm={() => handleDelete(currentRow)}
            className='max-w-md'
            title={`Delete this user: ${currentRow.id} ?`}
            desc={
              <>
                You are about to delete a user with the ID{' '}
                <strong>{currentRow.id}</strong>. <br />
                This action cannot be undone.
              </>
            }
            confirmText='Delete'
          />
        </>
      )}
    </UsersContextProvider>
  )
}
