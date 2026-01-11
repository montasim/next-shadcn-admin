'use client'

import { Plus, RefreshCw, Sprout } from 'lucide-react'
import { useMoodsContext } from '../context/moods-context'
import { DashboardPageHeaderActions, ActionConfig } from '@/components/dashboard/dashboard-page-header-actions'

interface MoodsHeaderActionsProps {
  onSeedMoods?: () => void
}

export function MoodsHeaderActions({ onSeedMoods }: MoodsHeaderActionsProps) {
  const { setOpen, refreshMoods } = useMoodsContext()

  const actions: ActionConfig[] = [
    {
      label: 'Add Mood',
      icon: Plus,
      onClick: () => setOpen('create'),
    },
    {
      label: 'Refresh',
      icon: RefreshCw,
      onClick: refreshMoods,
      variant: 'outline' as const,
    },
    ...(onSeedMoods ? [{
      label: 'Seed Moods',
      icon: Sprout,
      onClick: onSeedMoods,
      variant: 'outline' as const,
    }] : []),
  ]

  return <DashboardPageHeaderActions actions={actions} />
}
