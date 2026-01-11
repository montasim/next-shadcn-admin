'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useSeriesContext } from '../context/series-context'
import { useAuth } from '@/context/auth-context'

export function SeriesHeader() {
  const { user } = useAuth()
  const { setOpen } = useSeriesContext()

  const canCreate = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  return (
    <>
      <div>
        <h2 className='text-xl font-bold tracking-tight'>Series List</h2>
        <p className='text-muted-foreground'>
          Manage book series and reading orders
        </p>
      </div>
      {canCreate && (
        <Button onClick={() => setOpen('create')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Series
        </Button>
      )}
    </>
  )
}
