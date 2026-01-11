'use client'

import { RefreshCw } from 'lucide-react'
import { IconUserPlus } from "@tabler/icons-react";
import { useAuthorsContext } from '../context/authors-context'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'

export function AuthorsHeaderActions() {
  const { setOpen, refreshAuthors } = useAuthorsContext()

  const handleAddAuthor = () => {
    setOpen('create')
  }

  const actions = [
    {
      label: 'Add Author',
      icon: IconUserPlus,
      onClick: handleAddAuthor,
    },
    {
      label: 'Refresh',
      icon: RefreshCw,
      onClick: refreshAuthors,
      variant: 'outline' as const,
    },
  ]

  return <DashboardPageHeaderActions actions={actions} />
}
