'use client'

import { getLoans, markAsReturned } from './actions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DashboardPageHeaderActions, ActionConfig } from '@/components/dashboard/dashboard-page-header-actions'
import { LendBookDrawer } from './components/lend-book-drawer'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Loan } from './data/schema'
import { LoansProvider, LoansDialogType } from './context/loans-context'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from './components/columns'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import { BookOpen, AlertTriangle, CheckCircle, Clock, HandCoins, Plus, RefreshCw } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { DashboardSummarySkeleton, TableSkeleton } from '@/components/data-table/table-skeleton'

export default function LoansPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [loans, setLoans] = useState<Loan[]>([])
  const [currentRow, setCurrentRow] = useState<Loan | null>(null)
  const [open, setOpen] = useState<LoansDialogType>(null)
  const [isLendDialogOpen, setIsLendDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const isMountedRef = useRef(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/sign-in')
    } else if (!authLoading && user?.role === 'USER') {
      router.push('/profile/loans')
    }
  }, [user, authLoading, router])

  const fetchLoans = useCallback(async () => {
    setIsLoading(true)
    try {
      const rawLoans = await getLoans()
      setLoans(rawLoans)
    } catch (error) {
      console.error('Error fetching loans:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isMountedRef.current && user) {
      isMountedRef.current = true
      fetchLoans()
    }
  }, [fetchLoans, user])

  const refreshLoans = async () => {
    await fetchLoans()
  }

  const handleMarkAsReturned = async (loan: Loan) => {
    try {
      await markAsReturned(loan.id)
      await refreshLoans()
      toast({
        title: 'Book returned successfully',
        description: `"${loan.bookName}" has been marked as returned.`,
      })
      setOpen(null)
      setCurrentRow(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark book as returned',
        variant: 'destructive',
      })
    }
  }

  if (authLoading || !user || user.role === 'USER') {
    return null
  }

  const activeCount = loans.filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE').length
  const overdueCount = loans.filter(l => l.status === 'OVERDUE').length
  const returnedCount = loans.filter(l => l.status === 'RETURNED').length
  const cancelledCount = loans.filter(l => l.status === 'CANCELLED').length

  return (
    <LoansProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshLoans }}>
      <DashboardPage
        icon={HandCoins}
        title="Loans"
        description="Manage book lending and returns"
        actions={
          <DashboardPageHeaderActions
            actions={
              [
                {
                  label: 'Lend Book',
                  icon: Plus,
                  onClick: () => setIsLendDialogOpen(true),
                },
                {
                  label: 'Refresh',
                  icon: RefreshCw,
                  onClick: refreshLoans,
                  variant: 'outline',
                },
              ] as ActionConfig[]
            }
          />
        }
      >
        {/* Dashboard Summary */}
        {isLoading ? (
          <DashboardSummarySkeleton count={4} />
        ) : (
          <DashboardSummary
            summaries={[
              {
                title: 'Total Loans',
                value: loans.length,
                description: `${activeCount} currently active`,
                icon: BookOpen,
              },
              {
                title: 'Active Loans',
                value: activeCount,
                description: overdueCount > 0 ? `${overdueCount} overdue` : 'All on track',
                icon: Clock,
              },
              {
                title: 'Overdue Books',
                value: overdueCount,
                description: overdueCount > 0 ? 'Need attention' : 'No overdue books',
                icon: AlertTriangle,
              },
              {
                title: 'Returned',
                value: returnedCount,
                description: `${cancelledCount} cancelled`,
                icon: CheckCircle,
              },
            ]}
          />
        )}

        {isLoading ? (
          <TableSkeleton />
        ) : loans.length === 0 ? (
          <EmptyStateCard
            icon={HandCoins}
            title="No loans found"
            description="There are no book loans in the system yet."
          />
        ) : (
          <DataTable data={loans} columns={columns} />
        )}

      {/* Lend Book Drawer */}
      <LendBookDrawer
        open={isLendDialogOpen}
        onOpenChange={setIsLendDialogOpen}
        onSuccess={refreshLoans}
      />
      </DashboardPage>
    </LoansProvider>
  )
}
