'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function AchievementsPageHeaderSkeleton() {
  return (
    <div className='flex-none mb-2 flex flex-col md:flex-row md:justify-between gap-4'>
      <div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-4 w-80 mt-2" />
      </div>
      <Skeleton className="h-10 w-36 mt-4 md:mt-0" />
    </div>
  )
}

export function AchievementsGuidanceSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        <div className="space-y-6">
          {/* Category */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      <Skeleton className="h-5 w-5" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-7 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AchievementsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(9)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function AchievementsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <AchievementsPageHeaderSkeleton />

      {/* Dashboard Summary - 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-5" />
              </div>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-2 w-full mt-2" />
            </div>
          </div>
        ))}
      </div>

      {/* How to Achieve More */}
      <AchievementsGuidanceSkeleton />

      {/* Achievements Grid */}
      <AchievementsListSkeleton />
    </div>
  )
}
