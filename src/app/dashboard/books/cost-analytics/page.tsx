'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, Loader2 } from 'lucide-react'
import { CostSummaryCards } from './components/cost-summary-cards'
import { CostOverTimeChart } from './components/cost-over-time-chart'
import { CostByDimensionChart } from './components/cost-by-dimension-chart'
import { CostDetailsTable } from './components/cost-details-table'
import type { CostAnalyticsData, DateRangeType, GroupByType } from '@/types/book-cost-analytics'

export default function BookCostAnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<CostAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRangeType>('30d')
  const [groupBy, setGroupBy] = useState<GroupByType>('category')

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const apiEndpoint = isAdmin ? '/api/admin/books/cost-analytics' : '/api/books/cost-analytics'

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          dateRange,
          groupBy,
          timePeriod: 'daily',
          page: '1',
          pageSize: '20'
        })

        const response = await fetch(`${apiEndpoint}?${params}`)
        const result = await response.json()

        if (result.success) {
          setAnalytics(result.data)
        } else {
          setError(result.message || 'Failed to fetch analytics')
        }
      } catch (err) {
        console.error('Failed to fetch cost analytics:', err)
        setError('Failed to fetch cost analytics. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [user, dateRange, groupBy, apiEndpoint])

  // Skeleton loading state
  if (isLoading || !analytics) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20" />
            ))}
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Failed to load analytics</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {isAdmin ? 'Book Cost Analytics' : 'My Book Costs'}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? 'Track and analyze book acquisition costs across the library'
              : 'Track your book spending and collection value'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={dateRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('7d')}
          >
            7 Days
          </Button>
          <Button
            variant={dateRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('30d')}
          >
            30 Days
          </Button>
          <Button
            variant={dateRange === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('90d')}
          >
            90 Days
          </Button>
          <Button
            variant={dateRange === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('all')}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <CostSummaryCards summary={analytics.summary} activity={analytics.activitySummary} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostOverTimeChart
          data={analytics.costsOverTime}
          dateRange={dateRange}
        />
        <CostByDimensionChart
          data={analytics.costsByDimension}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
        />
      </div>

      {/* Top Costs */}
      {analytics.topCosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Expensive Books</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topCosts.map((item, index) => (
                <div key={item.bookId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.bookName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.numberOfCopies} cop{item.numberOfCopies !== 1 ? 'ies' : 'y'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      ${item.totalCost.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${item.buyingPrice} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <CostDetailsTable
            items={analytics.detailedBreakdown}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>
    </div>
  )
}
