'use client'

import { Plus, RefreshCw } from 'lucide-react'
import { useCategoriesContext } from '../context/categories-context'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'

export function CategoriesHeaderActions() {
  const { setOpen, refreshCategories } = useCategoriesContext()

  const actions = [
    {
      label: 'Add Category',
      icon: Plus,
      onClick: () => setOpen('create'),
    },
    {
      label: 'Refresh',
      icon: RefreshCw,
      onClick: refreshCategories,
      variant: 'outline' as const,
    },
  ]

  return <DashboardPageHeaderActions actions={actions} />
}
