'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'

interface ViewsChartData {
  date: string
  count: number
}

interface ViewsOverTimeChartProps {
  data: {
    dates: string[]
    counts: number[]
  }
  title?: string
  className?: string
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-sm">
        <p className="font-medium">{data.displayDate}</p>
        <p className="text-muted-foreground">{data.count} {data.count === 1 ? 'view' : 'views'}</p>
      </div>
    )
  }
  return null
}

type DateRange = '7d' | '30d' | '90d' | 'all'

export function ViewsOverTimeChart({
  data,
  title = 'Views Over Time',
  className
}: ViewsOverTimeChartProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30d')

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Format data for chart
  const chartData = data.dates.map((date, index) => ({
    date,
    displayDate: formatDate(date),
    count: data.counts[index] || 0,
  }))

  // Calculate stats
  const totalViews = chartData.reduce((sum, d) => sum + d.count, 0)
  const averageViewsPerDay =
    chartData.length > 0 ? Math.round(totalViews / chartData.length) : 0
  const maxViews = Math.max(...chartData.map((d) => d.count), 0)

  // Filter data based on selected date range
  const getFilteredData = () => {
    const now = new Date()
    let startDate: Date

    switch (dateRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'all':
      default:
        return chartData
    }

    return chartData.filter((d) => new Date(d.date) >= startDate)
  }

  const filteredData = getFilteredData()

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
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
            All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xl font-bold">{totalViews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{averageViewsPerDay}</p>
            <p className="text-xs text-muted-foreground">Avg/Day</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{maxViews}</p>
            <p className="text-xs text-muted-foreground">Peak</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{filteredData.length}</p>
            <p className="text-xs text-muted-foreground">Days</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[250px] w-full -mx-4 px-4">
          {filteredData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No view data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
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
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
