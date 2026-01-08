'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function BookDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Book Details */}
      <div className="container mx-auto px-4 py-8 pb-24 sm:pb-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Book Cover and Actions - Left Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Book Cover Skeleton */}
              <div className="relative mb-4 sm:mb-6 max-w-auto mx-auto lg:mx-0">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />

                {/* Type Badge Skeleton - Top Left */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded" />
                </div>

                {/* Premium Badge Skeleton */}
                <div className="absolute bottom-3 left-3">
                  <Skeleton className="h-5 w-16 rounded" />
                </div>

                {/* Share Button Skeleton - Top Right */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <Skeleton className="h-9 w-9 rounded" />
                  <Skeleton className="h-9 w-9 rounded" />
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="space-y-3 mb-6">
                <Skeleton className="h-12 w-full rounded" />
                <Skeleton className="h-10 w-full rounded" />
              </div>

              {/* Quick Stats Skeleton */}
              <div className="space-y-3 text-sm pt-2 p-4 rounded-xl border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          </div>

          {/* Book Information - Right Column */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              {/* Title and Chat Button Row Skeleton */}
              <div className='flex items-center justify-between mb-3'>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-10 w-32 rounded hidden sm:block" />
              </div>

              {/* Authors and Visitor Count Row - Desktop Skeleton */}
              <div className='flex items-center justify-between mb-4 hidden sm:flex'>
                <Skeleton className="h-6 w-1/2" />
                <div className="flex items-center gap-1">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>

              {/* Mobile: Chat Button Skeleton */}
              <Skeleton className="h-10 w-full rounded mb-3 sm:hidden" />

              {/* Mobile: Authors and Visitor Count Skeleton */}
              <div className='flex items-center justify-between gap-2 mb-4 sm:hidden'>
                <Skeleton className="h-5 w-1/2" />
                <div className="flex items-center gap-1">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>

            {/* Tabs Content Skeleton */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-5 lg:w-auto">
                <TabsTrigger value="description" disabled>
                  <Skeleton className="h-5 w-28" />
                </TabsTrigger>
                <TabsTrigger value="about" disabled>
                  <Skeleton className="h-5 w-16" />
                </TabsTrigger>
                <TabsTrigger value="reviews" disabled>
                  <Skeleton className="h-5 w-20" />
                </TabsTrigger>
                <TabsTrigger value="ai-summary" disabled>
                  <Skeleton className="h-5 w-24" />
                </TabsTrigger>
                <TabsTrigger value="progress" disabled>
                  <Skeleton className="h-5 w-20" />
                </TabsTrigger>
              </TabsList>

              {/* Description Tab Content */}
              <TabsContent value="description" className="mt-4 space-y-4">
                {/* Book Overview Card Skeleton */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>

                {/* About This Book Card Skeleton */}
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </CardContent>
                </Card>

                {/* About the Author Card Skeleton */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* About the Publisher Card Skeleton */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Questions Card Skeleton */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <Skeleton className="h-6 w-56" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="border rounded-lg p-3">
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab Content Skeleton */}
              <TabsContent value="reviews" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 space-y-3">
                      <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                      <Skeleton className="h-4 w-48 mx-auto" />
                      <Skeleton className="h-10 w-32 rounded mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Summary Tab Content Skeleton */}
              <TabsContent value="ai-summary" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Progress Tab Content Skeleton */}
              <TabsContent value="progress" className="mt-4 space-y-4">
                {/* Progress Overview Card Skeleton */}
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-8">
                      <Skeleton className="h-32 w-32 rounded-full" />
                    </div>
                  </CardContent>
                </Card>

                {/* Reading Heatmap Card Skeleton */}
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-1">
                      {Array(28).fill(null).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full rounded" />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Pages Read Chart Card Skeleton */}
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-36" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Array(7).fill(null).map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-8 flex-1" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Categories Section Skeleton */}
            <div className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-28 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
