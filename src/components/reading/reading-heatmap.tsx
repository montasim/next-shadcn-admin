'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface HeatmapData {
  date: string
  pagesRead: number
  timeSpent: number
  level: number // 0-4 for color intensity
}

interface ReadingHeatmapProps {
  data: HeatmapData[]
  title?: string
  className?: string
}

// Color levels for the heatmap (gray to green)
const heatColors = [
  'bg-muted/30', // level 0 - no activity
  'bg-green-100 dark:bg-green-900/30', // level 1
  'bg-green-300 dark:bg-green-700/50', // level 2
  'bg-green-500 dark:bg-green-600', // level 3
  'bg-green-700 dark:bg-green-500', // level 4 - highest activity
]

// Day labels for the heatmap
const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Month labels for the heatmap
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function ReadingHeatmap({ data, title = 'Reading Heatmap', className }: ReadingHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)

  // Generate the last 52 weeks of heatmap data
  const generateWeeks = () => {
    const weeks: (HeatmapData | null)[][] = []
    const today = new Date()
    const dayOfWeek = today.getDay()

    // Start from 52 weeks ago
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 364)
    startDate.setHours(0, 0, 0, 0)

    // Create data map for quick lookup
    const dataMap = new Map<string, HeatmapData>()
    data.forEach((d) => dataMap.set(d.date, d))

    // Generate 53 weeks (52 + current week)
    for (let week = 0; week < 53; week++) {
      const weekData: (HeatmapData | null)[] = []

      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + (week * 7) + day)

        // Don't show future dates
        if (currentDate > today) {
          weekData.push(null)
          continue
        }

        const dateKey = currentDate.toISOString().split('T')[0]
        weekData.push(dataMap.get(dateKey) || null)
      }

      weeks.push(weekData)
    }

    return weeks
  }

  const weeks = generateWeeks()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, dayData: HeatmapData | null) => {
    if (!dayData || dayData.pagesRead === 0) {
      setTooltip({
        x: e.clientX,
        y: e.clientY,
        content: 'No reading activity',
      })
      return
    }

    setTooltip({
      x: e.clientX,
      y: e.clientY,
      content: `${dayData.pagesRead} pages • ${formatTime(dayData.timeSpent)}\n${formatDate(dayData.date)}`,
    })
  }

  const handleMouseLeave = () => {
    setTooltip(null)
  }

  // Calculate which months to show
  const getVisibleMonths = () => {
    const months: { index: number; label: string }[] = []
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 364)

    let currentMonth = -1
    weeks.forEach((week, weekIndex) => {
      if (week[0]) {
        const weekDate = new Date(week[0].date)
        const monthIndex = weekDate.getMonth()
        if (monthIndex !== currentMonth) {
          currentMonth = monthIndex
          months.push({ index: weekIndex, label: monthLabels[monthIndex] })
        }
      }
    })

    return months
  }

  const visibleMonths = getVisibleMonths()

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="space-y-3 inline-block min-w-full">
            {/* Month labels */}
            <div className="flex text-xs text-muted-foreground pl-8">
              {visibleMonths.map((month) => (
                <div
                  key={month.label}
                  className="flex-shrink-0"
                  style={{ width: `${Math.max(3, (weeks.length - month.index) * 12)}px` }}
                >
                  {month.label}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-1 w-full">
            {/* Day labels */}
            <div className="flex flex-col gap-1 text-[10px] text-muted-foreground pr-2">
              {dayLabels.map((day) => (
                <div key={day} className="h-3 flex items-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={cn(
                        'h-3 w-3 rounded-sm transition-colors hover:ring-1 hover:ring-ring',
                        !day && 'bg-muted/20',
                        day && heatColors[day.level]
                      )}
                      onMouseEnter={(e) => handleMouseEnter(e, day)}
                      onMouseLeave={handleMouseLeave}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              {heatColors.map((color, index) => (
                <div
                  key={index}
                  className={cn('h-3 w-3 rounded-sm', color)}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
        </div>
      </CardContent>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg border pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y - 50}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <pre className="whitespace-pre-wrap text-center">{tooltip.content}</pre>
        </div>
      )}
    </Card>
  )
}
