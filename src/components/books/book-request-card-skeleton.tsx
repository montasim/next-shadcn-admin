'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function BookRequestCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            {/* Title */}
            <Skeleton className="h-6 w-full" />
            {/* Author */}
            <Skeleton className="h-4 w-2/3" />
          </div>
          {/* Status Badge */}
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Book Type */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Edition/Publisher/ISBN */}
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-32" />
        </div>

        {/* Cancel Button */}
        <Skeleton className="h-9 w-full mt-2" />
      </CardContent>
    </Card>
  )
}
