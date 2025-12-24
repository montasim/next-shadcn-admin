'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'

interface PagesReadData {
  date: string
  pagesRead: number
}

interface PagesReadChartProps {
  data: PagesReadData[]
  title?: string
  period?: 'week' | 'month'
  onPeriodChange?: (period: 'week' | 'month') => void
  className?: string
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-sm">
        <p className="font-medium">{payload[0].payload.date}</p>
        <p className="text-muted-foreground">{payload[0].value} pages read</p>
      </div>
    )
  }
  return null
}

export function PagesReadChart({
  data,
  title = 'Daily Reading',
  period = 'week',
  onPeriodChange,
  className
}: PagesReadChartProps) {
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Format data for chart
  const chartData = data.map((d) => ({
    ...d,
    displayDate: formatDate(d.date),
  }))

  // Calculate stats
  const totalPagesRead = data.reduce((sum, d) => sum + d.pagesRead, 0)
  const averagePagesPerDay = data.length > 0 ? Math.round(totalPagesRead / data.length) : 0
  const maxPagesRead = Math.max(...data.map((d) => d.pagesRead), 0)

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPeriodChange?.('week')}
          >
            7 Days
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPeriodChange?.('month')}
          >
            30 Days
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xl font-bold">{totalPagesRead}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{averagePagesPerDay}</p>
            <p className="text-xs text-muted-foreground">Avg/Day</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{maxPagesRead}</p>
            <p className="text-xs text-muted-foreground">Best</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[180px] w-full -mx-4 px-4">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No reading data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="displayDate"
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="pagesRead"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
