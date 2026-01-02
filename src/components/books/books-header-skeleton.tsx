'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function BooksHeaderSkeleton() {
  return (
    <div className="">
      {/* Desktop Header */}
      <div className="hidden lg:flex lg:items-center justify-between mb-4 gap-6">
        <div>
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Search Bar - Desktop */}
        <div className="flex-1 max-w-md">
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Right Side Controls - Desktop Only */}
        <div className="flex items-center gap-3">
          {/* Desktop View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        {/* Mobile Controls */}
        <div className="flex items-center justify-between mb-4">
          {/* Left Side - Discover Books Info */}
          <div>
            <Skeleton className="h-7 w-40 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Right Side - Mobile Controls */}
          <div className="flex items-center gap-2">
            {/* Mobile Filter Toggle */}
            <Skeleton className="h-8 w-8" />

            {/* Mobile View Mode Toggle */}
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>

        {/* Mobile Search Bar - Below Discover Books Section */}
        <div className="w-full mb-4">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}
