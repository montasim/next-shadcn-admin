/**
 * User Profile - Borrowed Books Page
 *
 * Allows users to view their currently borrowed books and return them
 */

'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Calendar, CheckCircle, Clock, AlertTriangle, Loader2, RefreshCw, HandCoins } from 'lucide-react'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { useAuth } from '@/context/auth-context'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { DashboardSummarySkeleton } from '@/components/dashboard/dashboard-summary-skeleton'
import { toast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LoanListSkeleton,
  LoanPastListSkeleton,
  LoansPageHeaderSkeleton,
  LoansTabsHeaderSkeleton
} from '@/components/loans/loan-card-skeleton'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes/client-routes'

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

function ProfileLoansContent() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'active'
  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [returningId, setReturningId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.signIn.href)
    }
  }, [user, authLoading, router])

  const fetchLoans = useCallback(async () => {
    if (!user) return

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
  }, [user])

  useEffect(() => {
    if (user) {
      fetchLoans()
    }
  }, [user, fetchLoans])

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

      await fetchLoans()
      toast({
        title: 'Book returned successfully',
        description: 'Thank you for returning the book on time!',
      })
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

  if (authLoading || !user) {
    return null
  }

  const activeLoans = loans.filter(loan => isLoanActive(loan.status))
  const pastLoans = loans.filter(loan => !isLoanActive(loan.status))
  const overdueCount = activeLoans.filter(l => l.status === 'OVERDUE').length

  return (
    <DashboardPage
      icon={HandCoins}
      title="My Borrowed Books"
      description="View and manage your borrowed books"
      actions={
        <DashboardPageHeaderActions
          actions={[
            {
              label: 'Refresh',
              icon: RefreshCw,
              onClick: fetchLoans,
              variant: 'outline',
            },
          ]}
        />
      }
    >
      {isLoading ? (
        <>
          {/* Dashboard Summary Skeleton */}
          <DashboardSummarySkeleton count={3} />

          {/* Tabs Skeleton */}
          <div className="space-y-4">
            <LoansTabsHeaderSkeleton />
            <LoanListSkeleton count={6} />
          </div>
        </>
      ) : (
        <>
          {/* Dashboard Summary */}
          <DashboardSummary
            summaries={[
              {
                title: 'Currently Borrowed',
                value: activeLoans.length,
                description: overdueCount > 0 ? `${overdueCount} overdue` : 'All on track',
                icon: BookOpen,
              },
              {
                title: 'Overdue Books',
                value: overdueCount,
                description: overdueCount > 0 ? 'Need attention' : 'No overdue books',
                icon: AlertTriangle,
              },
              {
                title: 'Total Borrowed',
                value: loans.length,
                description: `${pastLoans.length} returned`,
                icon: Clock,
              },
            ]}
          />

          {/* Tabs for Active and Past Loans */}
          <Tabs value={activeTab} className="space-y-4">
            <TabsList>
              <Link href="/profile/loans?tab=active">
                <TabsTrigger value="active">
                  Active ({activeLoans.length})
                </TabsTrigger>
              </Link>
              <Link href="/profile/loans?tab=past">
                <TabsTrigger value="past">
                  Past ({pastLoans.length})
                </TabsTrigger>
              </Link>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {error ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <p className="text-red-600">{error}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : activeLoans.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center">
                      <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Borrowed Books</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven&apos;t borrowed any books yet.
                      </p>
                      <Link href={ROUTES.books.href}>
                        <Button>Browse Books</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeLoans.map((loan) => {
                    const daysRemaining = getDaysRemaining(loan.dueDate)
                    const isOverdue = daysRemaining < 0

                    return (
                      <Card key={loan.id} className={cn(
                        "transition-shadow hover:shadow-md",
                        isOverdue && "border-red-200 bg-red-50/50 dark:bg-red-900/10"
                      )}>
                        <CardContent className="p-6">
                          <div className="flex gap-4 mb-4">
                            <div className="h-20 w-16 rounded-lg bg-accent flex items-center justify-center overflow-hidden flex-shrink-0">
                              {loan.book.image ? (
                                <img
                                  src={getProxiedImageUrl(loan.book.image) || loan.book.image}
                                  alt={loan.book.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold line-clamp-2 mb-2">{loan.book.name}</h4>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(loan.status)}
                                {getStatusBadge(loan.status)}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Borrowed: {format(new Date(loan.loanDate), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Due: {format(new Date(loan.dueDate), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="pt-2 border-t">
                              {isOverdue ? (
                                <p className="text-red-600 font-medium">
                                  {Math.abs(daysRemaining)} days overdue
                                </p>
                              ) : daysRemaining === 0 ? (
                                <p className="text-orange-600 font-medium">Due today</p>
                              ) : daysRemaining === 1 ? (
                                <p className="text-yellow-600 font-medium">Due tomorrow</p>
                              ) : (
                                <p className="text-muted-foreground">{daysRemaining} days left</p>
                              )}
                            </div>
                          </div>

                          {loan.notes && (
                            <div className="mt-3 p-2 bg-muted/50 rounded text-sm italic">
                              {loan.notes}
                            </div>
                          )}

                          <Button
                            className="w-full mt-4"
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
                              'Return Book'
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastLoans.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center">
                      <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Past Loans</h3>
                      <p className="text-muted-foreground">
                        Your returned and cancelled loans will appear here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pastLoans.map((loan) => (
                    <Card key={loan.id} className="opacity-75">
                      <CardContent className="p-6">
                        <div className="flex gap-4 mb-4">
                          <div className="h-16 w-12 rounded bg-accent flex items-center justify-center overflow-hidden flex-shrink-0 opacity-70">
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
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm line-clamp-1 mb-2">{loan.book.name}</h5>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(loan.status)}
                              {getStatusBadge(loan.status)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>Borrowed: {format(new Date(loan.loanDate), 'MMM d, yyyy')}</span>
                          </div>
                          {loan.returnDate && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>Returned: {format(new Date(loan.returnDate), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardPage>
  )
}

// Loading fallback for Suspense
function ProfileLoansLoading() {
  return (
    <DashboardPage
      icon={HandCoins}
      title="My Borrowed Books"
      description="View and manage your borrowed books"
    >
      <DashboardSummarySkeleton />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <LoansTabsHeaderSkeleton />
        </div>
        <LoanListSkeleton />
      </div>
    </DashboardPage>
  )
}

// Main page component with Suspense boundary
export default function ProfileLoansPage() {
  return (
    <Suspense fallback={<ProfileLoansLoading />}>
      <ProfileLoansContent />
    </Suspense>
  )
}
