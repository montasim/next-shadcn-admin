import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

interface BookGridSkeletonProps {
  count?: number
  variant?: 'default' | 'compact'
}

export function BookGridSkeleton({ count = 6, variant = 'default' }: BookGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            {/* Book Cover */}
            <Skeleton className="w-full h-40 mb-4 rounded-lg" />

            {/* Title */}
            <Skeleton className="h-5 w-3/4 mb-2" />

            {/* Author */}
            <Skeleton className="h-4 w-1/2 mb-3" />

            {/* Progress Bar Skeleton */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface DashboardSummarySkeletonProps {
  count?: number
}

export function DashboardSummarySkeleton({ count = 4 }: DashboardSummarySkeletonProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface FilterToolbarSkeletonProps {}

export function FilterToolbarSkeleton({}: FilterToolbarSkeletonProps) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between gap-4 animate-pulse">
      {/* Tabs List Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filter Toolbar Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}
