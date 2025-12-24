'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Clock, CheckCircle } from 'lucide-react'

interface CircularProgressBarProps {
  progress: number // 0-100
  currentPage?: number
  totalPages?: number
  isCompleted?: boolean
  lastReadAt?: string
  className?: string
}

export function CircularProgressBar({
  progress,
  currentPage,
  totalPages,
  isCompleted,
  lastReadAt,
  className
}: CircularProgressBarProps) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference
  const displayProgress = Math.round(progress)

  // Calculate remaining pages
  const remainingPages = totalPages && currentPage ? totalPages - currentPage : null
  const progressColor = isCompleted ? 'text-green-500' : progress >= 50 ? 'text-primary' : 'text-yellow-500'

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-medium">Reading Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Left: Circular Progress */}
          <div className="flex-shrink-0">
            <div className="relative">
              <svg width="160" height="160" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="hsl(var(--muted))"
                  strokeWidth="10"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={progressColor}
                  style={{
                    transition: 'stroke-dashoffset 0.5s ease-in-out',
                  }}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{displayProgress}%</span>
                <span className="text-xs text-muted-foreground">
                  {isCompleted ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex-1 space-y-3">
            {/* Current Page */}
            {currentPage && totalPages && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>Progress</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-semibold">{currentPage}</span>
                  <span className="text-muted-foreground"> / {totalPages} pages</span>
                </div>
              </div>
            )}

            {/* Pages Left */}
            {remainingPages !== null && remainingPages >= 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>Pages left</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-semibold">{remainingPages}</span>
                  <span className="text-muted-foreground"> pages</span>
                </div>
              </div>
            )}

            {/* Last Read */}
            {lastReadAt && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Last read</span>
                </div>
                <span className="font-medium">{formatDate(lastReadAt)}</span>
              </div>
            )}

            {/* Completed indicator */}
            {isCompleted && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Completed</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
