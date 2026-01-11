'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, BookOpen, TrendingUp, Calendar } from 'lucide-react'
import type { CostSummary, CostActivitySummary } from '@/types/book-cost-analytics'

interface CostSummaryCardsProps {
  summary: CostSummary
  activity: CostActivitySummary
}

export function CostSummaryCards({ summary, activity }: CostSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Spent */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Spent
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">
            ${summary.totalSpent.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.hardCopyCount} hard copy books
          </p>
        </CardContent>
      </Card>

      {/* Average Cost */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg Cost per Book
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">
            ${summary.averageHardCopyCost.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Across {summary.totalBooks} books
          </p>
        </CardContent>
      </Card>

      {/* This Month */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            This Month
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">
            ${activity.spentThisMonth.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {activity.booksAddedThisMonth} book{activity.booksAddedThisMonth !== 1 ? 's' : ''} added
          </p>
        </CardContent>
      </Card>

      {/* Hard Copy Count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Hard Copies
          </CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{summary.hardCopyCount}</div>
          <p className="text-xs text-muted-foreground">
            Collection value: ${summary.hardCopySpent.toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
