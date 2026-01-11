'use client'

import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLoansContext } from '../context/loans-context'

interface LoansHeaderProps {
  onLendBook?: () => void
}

export function LoansHeader({ onLendBook }: LoansHeaderProps) {
  const { refreshLoans } = useLoansContext()

  return (
    <>
      <div>
        <h2 className="text-xl font-bold tracking-tight">Loans Management</h2>
        <p className="text-muted-foreground">
          Manage book loans and track borrowed books
        </p>
      </div>
      <div className="flex gap-2">
        {onLendBook && (
          <Button className="space-x-1" onClick={onLendBook}>
            <span>Lend Book</span> <Plus size={18} />
          </Button>
        )}
        <Button className="space-x-1" onClick={refreshLoans} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    </>
  )
}
