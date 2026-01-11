'use client'

import { Plus, RefreshCw } from 'lucide-react'
import { useLoansContext } from '../context/loans-context'
import { DashboardPageHeaderActions, ActionConfig } from '@/components/dashboard/dashboard-page-header-actions'

interface LoansHeaderActionsProps {
  onLendBook?: () => void
}

export function LoansHeaderActions({ onLendBook }: LoansHeaderActionsProps) {
  const { refreshLoans } = useLoansContext()

  const actions: ActionConfig[] = [
    ...(onLendBook ? [{
      label: 'Lend Book',
      icon: Plus,
      onClick: onLendBook,
    }] : []),
    {
      label: 'Refresh',
      icon: RefreshCw,
      onClick: refreshLoans,
      variant: 'outline' as const,
    },
  ]

  return <DashboardPageHeaderActions actions={actions} />
}
