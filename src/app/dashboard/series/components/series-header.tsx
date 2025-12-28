'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useSeriesContext } from '../context/series-context'
import { useAuth } from '@/context/auth-context'

export function SeriesHeader() {
  const { user } = useAuth()
  const { setOpen } = useSeriesContext()

  const canCreate = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Series</h1>
        <p className="text-muted-foreground mt-1">
          Manage book series and reading orders
        </p>
      </div>
      {canCreate && (
        <Button onClick={() => setOpen('create')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Series
        </Button>
      )}
    </div>
  )
}
