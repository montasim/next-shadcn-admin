'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, BookOpen, Calendar, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { getProxiedImageUrl } from '@/lib/image-proxy'

interface Book {
  id: string
  name: string
  image: string | null
  type: string
}

interface Loan {
  id: string
  loanDate: string
  dueDate: string
  returnDate: string | null
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'CANCELLED'
  notes: string | null
  book: Book
}

interface BorrowedBooksListProps {
  userId: string | undefined
  onReturn?: (loanId: string) => void
  className?: string
}

export function BorrowedBooksList({ userId, onReturn, className }: BorrowedBooksListProps) {
  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [returningId, setReturningId] = useState<string | null>(null)

  const fetchLoans = async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/loans')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch borrowed books')
      }

      setLoans(data.data.loans || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [userId])

  const handleReturn = async (loanId: string) => {
    setReturningId(loanId)
    setError(null)

    try {
      const response = await fetch(`/api/loans/${loanId}/return`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to return book')
      }

      // Refresh the list
      await fetchLoans()
      onReturn?.(loanId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to return book')
    } finally {
      setReturningId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-blue-500">Borrowed</Badge>
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>
      case 'RETURNED':
        return <Badge variant="outline" className="border-green-500 text-green-700">Returned</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <BookOpen className="h-4 w-4 text-blue-500" />
      case 'OVERDUE':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'RETURNED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const isLoanActive = (status: string) => {
    return status === 'ACTIVE' || status === 'OVERDUE'
  }

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeLoans = loans.filter(loan => isLoanActive(loan.status))
  const pastLoans = loans.filter(loan => !isLoanActive(loan.status))

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>My Borrowed Books</CardTitle>
          <CardDescription>
            {activeLoans.length > 0
              ? `You have ${activeLoans.length} borrowed book${activeLoans.length > 1 ? 's' : ''}`
              : 'No borrowed books'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loans.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Borrowed Books</h3>
              <p className="text-muted-foreground">
                You haven't borrowed any books yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Loans */}
              {activeLoans.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                    Active Loans
                  </h4>
                  <div className="space-y-3">
                    {activeLoans.map((loan) => {
                      const daysRemaining = getDaysRemaining(loan.dueDate)
                      const isOverdue = daysRemaining < 0

                      return (
                        <div
                          key={loan.id}
                          className={cn(
                            "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                            isOverdue && "border-red-200 bg-red-50 dark:bg-red-900/10"
                          )}
                        >
                          {/* Book Image */}
                          <div className="flex-shrink-0">
                            <div className="h-16 w-12 rounded bg-accent flex items-center justify-center overflow-hidden">
                              {loan.book.image ? (
                                <img
                                  src={getProxiedImageUrl(loan.book.image) || loan.book.image}
                                  alt={loan.book.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <BookOpen className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h5 className="font-medium line-clamp-1">{loan.book.name}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                  {getStatusIcon(loan.status)}
                                  {getStatusBadge(loan.status)}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleReturn(loan.id)}
                                disabled={returningId === loan.id}
                              >
                                {returningId === loan.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Returning...
                                  </>
                                ) : (
                                  'Return'
                                )}
                              </Button>
                            </div>

                            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Due: {format(new Date(loan.dueDate), 'MMM d, yyyy')}</span>
                              </div>
                              {isOverdue ? (
                                <span className="text-red-600 font-medium">
                                  {Math.abs(daysRemaining)} days overdue
                                </span>
                              ) : daysRemaining === 0 ? (
                                <span className="text-orange-600 font-medium">Due today</span>
                              ) : daysRemaining === 1 ? (
                                <span className="text-yellow-600 font-medium">Due tomorrow</span>
                              ) : (
                                <span>{daysRemaining} days left</span>
                              )}
                            </div>

                            {loan.notes && (
                              <p className="mt-2 text-sm text-muted-foreground italic">
                                "{loan.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Past Loans */}
              {pastLoans.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide hover:text-foreground">
                    Past Loans ({pastLoans.length})
                  </summary>
                  <div className="mt-3 space-y-3">
                    {pastLoans.map((loan) => (
                      <div
                        key={loan.id}
                        className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30"
                      >
                        {/* Book Image */}
                        <div className="flex-shrink-0">
                          <div className="h-12 w-10 rounded bg-accent flex items-center justify-center overflow-hidden opacity-70">
                            {loan.book.image ? (
                              <img
                                src={getProxiedImageUrl(loan.book.image) || loan.book.image}
                                alt={loan.book.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <BookOpen className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm line-clamp-1 text-muted-foreground">
                            {loan.book.name}
                          </h5>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(loan.status)}
                            {getStatusBadge(loan.status)}
                            {loan.returnDate && (
                              <span className="text-xs text-muted-foreground">
                                Returned {format(new Date(loan.returnDate), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
