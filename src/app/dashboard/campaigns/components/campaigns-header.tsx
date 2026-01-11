'use client'

import { useCampaignsContext } from '../context/campaigns-context'
import { IconPlus } from '@tabler/icons-react'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'

export function CampaignsHeaderActions({ campaignCount }: { campaignCount: number }) {
  const { setOpen } = useCampaignsContext()

  const actions = [
    {
      label: 'New Campaign',
      icon: IconPlus,
      onClick: () => setOpen('create'),
    },
  ]

  return <DashboardPageHeaderActions actions={actions} />
}
