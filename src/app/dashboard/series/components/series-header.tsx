'use client'

import { Plus } from 'lucide-react'
import { useSeriesContext } from '../context/series-context'
import { useAuth } from '@/context/auth-context'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'

export function SeriesHeaderActions() {
  const { user } = useAuth()
  const { setOpen } = useSeriesContext()

  const canCreate = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  if (!canCreate) return null

  const actions = [
    {
      label: 'Add Series',
      icon: Plus,
      onClick: () => setOpen('create'),
    },
  ]

  return <DashboardPageHeaderActions actions={actions} />
}
