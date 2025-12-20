'use client'

import { deleteTask, getTasks } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { TasksHeader } from './components/tasks-header'
import { useEffect, useState } from 'react'
import { Task } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import TasksContextProvider, { TasksDialogType } from './context/tasks-context'
import { toast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import { TasksImportDialog } from './components/tasks-import-dialog'
import { TasksMutateDrawer } from './components/tasks-mutate-drawer'

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([])
 
  useEffect(() => {
    const updateTasks = async () => {
      const tasks = await getTasks()
      setTasks(tasks)
    }

    updateTasks()
  }, [])

  // Local states
  const [currentRow, setCurrentRow] = useState<Task | null>(null)
  const [open, setOpen] = useDialogState<TasksDialogType>(null)

  const handleDelete = async (task: Task) => {
    try {
      await deleteTask(task.id)
      setTasks(tasks.filter(t => t.id !== task.id))
      toast({
        title: 'The following task has been deleted:',
        description: (
          <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
            <code className='text-white'>
              {JSON.stringify(task, null, 2)}
            </code>
          </pre>
        ),
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      <HeaderContainer>
        <TasksHeader />
      </HeaderContainer>

      <TasksContextProvider value={{ open, setOpen, currentRow, setCurrentRow }}>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <DataTable data={tasks} columns={columns} />
        </div>

        <TasksMutateDrawer
          key='task-create'
          open={open === 'create'}
          onOpenChange={() => setOpen('create')}
        />

        <TasksImportDialog
          key='tasks-import'
          open={open === 'import'}
          onOpenChange={() => setOpen('import')}
        />

        {currentRow && (
          <>
            <TasksMutateDrawer
              key={`task-update-${currentRow.id}`}
              open={open === 'update'}
              onOpenChange={() => {
                setOpen('update')
                setTimeout(() => {
                  setCurrentRow(null)
                }, 500)
              }}
              currentRow={currentRow}
            />

            <ConfirmDialog
              key='task-delete'
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
              title={`Delete this task: ${currentRow.id} ?`}
              desc={
                <>
                  You are about to delete a task with the ID{' '}
                  <strong>{currentRow.id}</strong>. <br />
                  This action cannot be undone.
                </>
              }
              confirmText='Delete'
            />
          </>
        )}
      </TasksContextProvider>
    </>
  )
}
