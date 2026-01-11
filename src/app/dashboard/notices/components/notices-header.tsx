'use client'

import { Plus, RefreshCw } from 'lucide-react'
import { useNoticesContext } from '../context/notices-context'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'

export function NoticesHeaderActions() {
  const { setOpen, refreshNotices } = useNoticesContext()

  const actions = [
    {
      label: 'Add Notice',
      icon: Plus,
      onClick: () => setOpen('create'),
    },
    {
      label: 'Refresh',
      icon: RefreshCw,
      onClick: refreshNotices,
      variant: 'outline' as const,
    },
  ]

  return <DashboardPageHeaderActions actions={actions} />
}
