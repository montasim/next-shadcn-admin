'use client'

import { IconDownload, IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import useDialogState from '@/hooks/use-dialog-state'
import { TasksDialogType } from '../context/tasks-context'

export function TasksHeader() {
  const [open, setOpen] = useDialogState<TasksDialogType>(null)

  return (
    <>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Tasks</h2>
        <p className='text-muted-foreground'>
          Here&apos;s a list of your tasks for this month!
        </p>
      </div>
      <div className='flex gap-2'>
        <Button
          variant='outline'
          className='space-x-1'
          onClick={() => setOpen('import')}
        >
          <span>Import</span> <IconDownload size={18} />
        </Button>
        <Button
          className='space-x-1'
          onClick={() => setOpen('create')}
        >
          <span>Create</span> <IconPlus size={18} />
        </Button>
      </div>
    </>
  )
}
