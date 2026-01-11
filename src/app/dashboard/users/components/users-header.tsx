'use client'

import { IconMailPlus, IconUserPlus } from '@tabler/icons-react'
import { useUsersContext } from '../context/users-context'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'

export function UsersHeaderActions() {
  const { setOpen } = useUsersContext()

  const actions = [
    {
      label: 'Invite User',
      icon: IconMailPlus,
      onClick: () => setOpen('invite'),
      variant: 'outline' as const,
    },
    {
      label: 'Add User',
      icon: IconUserPlus,
      onClick: () => setOpen('create'),
    },
  ]

  return <DashboardPageHeaderActions actions={actions} />
}
