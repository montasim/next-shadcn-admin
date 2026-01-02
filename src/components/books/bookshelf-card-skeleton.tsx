'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface BookshelfCardSkeletonProps {
  className?: string
}

export function BookshelfCardSkeleton({ className }: BookshelfCardSkeletonProps) {
  return (
    <Card className={cn('group transition-all', className)}>
      <CardContent className="p-4">
        {/* Mobile: Horizontal layout */}
        <div className="flex gap-4 md:hidden">
          {/* Bookshelf Cover - smaller, on the left */}
          <div className="w-20 h-28 sm:w-24 sm:h-32 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0 relative">
            <Skeleton className="w-full h-full bg-muted" />
          </div>

          {/* Bookshelf Info - on the right */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              {/* Title and Action Buttons */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <Skeleton className="h-4 w-3/4 bg-muted" />
                <div className="flex gap-1 flex-shrink-0">
                  <Skeleton className="h-7 w-7 bg-muted" />
                  <Skeleton className="h-7 w-7 bg-muted" />
                </div>
              </div>

              {/* Badge */}
              <Skeleton className="h-5 w-16 bg-muted mb-2" />

              {/* Description */}
              <Skeleton className="h-4 w-full mb-2 bg-muted" />

              {/* Book Count */}
              <Skeleton className="h-4 w-1/2 bg-muted" />
            </div>

            {/* Progress Section */}
            <div className="space-y-1.5 mb-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16 bg-muted" />
                <Skeleton className="h-3 w-8 bg-muted" />
              </div>
              <Skeleton className="h-2 w-full bg-muted" />

              {/* Stats */}
              <div className="flex items-center justify-between mt-2">
                <Skeleton className="h-3 w-24 bg-muted" />
                <Skeleton className="h-3 w-16 bg-muted" />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Vertical layout */}
        <div className="hidden md:block">
          {/* Cover Image */}
          <div className="relative mb-4">
            <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              <Skeleton className="w-full h-full bg-muted" />
            </div>

            {/* Action Icons */}
            <div className="absolute top-2 right-2 flex gap-1">
              <Skeleton className="h-8 w-8 bg-muted" />
              <Skeleton className="h-8 w-8 bg-muted" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            {/* Title and Badge */}
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-5 w-3/4 bg-muted" />
              <Skeleton className="h-5 w-16 bg-muted" />
            </div>

            {/* Description */}
            <Skeleton className="h-4 w-full bg-muted" />
            <Skeleton className="h-4 w-2/3 bg-muted" />

            {/* Book Count */}
            <Skeleton className="h-4 w-1/3 bg-muted" />

            {/* Progress Summary */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24 bg-muted" />
                <Skeleton className="h-3 w-8 bg-muted" />
              </div>
              <Skeleton className="h-1.5 w-full bg-muted" />
            </div>

            {/* Reading Time */}
            <div className="flex items-center gap-1 pt-1">
              <Skeleton className="h-3 w-3 bg-muted" />
              <Skeleton className="h-3 w-20 bg-muted" />
              <Skeleton className="h-3 w-16 bg-muted" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
