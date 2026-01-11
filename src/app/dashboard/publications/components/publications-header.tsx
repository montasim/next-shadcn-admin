'use client'

import { Plus, RefreshCw } from 'lucide-react'
import { usePublicationsContext } from '../context/publications-context'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'

export function PublicationsHeaderActions() {
  const { setOpen, refreshPublications } = usePublicationsContext()

  const actions = [
    {
      label: 'Add Publication',
      icon: Plus,
      onClick: () => setOpen('create'),
    },
    {
      label: 'Refresh',
      icon: RefreshCw,
      onClick: refreshPublications,
      variant: 'outline' as const,
    },
  ]

  return <DashboardPageHeaderActions actions={actions} />
}
