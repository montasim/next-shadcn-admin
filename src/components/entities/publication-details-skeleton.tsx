'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BookCardSkeleton } from '@/components/books/book-card-skeleton'

export function PublicationDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-6">
          {/* Left Column - Image and Stats */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Publication Image Skeleton */}
              <div className="relative mb-6 max-w-xs mx-auto lg:mx-0">
                <Skeleton className="aspect-square w-full rounded-lg" />
              </div>

              {/* Quick Stats Card Skeleton */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Information and Books */}
          <div className="lg:col-span-2">
            <div className="mb-6">
               {/*Name and Visitor Count Row Skeleton */}
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-1/2" />
                <div className="flex items-center gap-1">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              {/* Added by User Skeleton */}
              {/*<div className="flex items-center gap-3 mb-4">*/}
              {/*  <Skeleton className="h-10 w-10 rounded-full" />*/}
              {/*  <div className="flex flex-col">*/}
              {/*    <Skeleton className="h-3 w-16" />*/}
              {/*    <Skeleton className="h-4 w-24" />*/}
              {/*  </div>*/}
              {/*</div>*/}

              {/* Description Card Skeleton */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Books Grid Skeleton */}
            <div>
              <Skeleton className="h-8 w-56 mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <BookCardSkeleton key={i} viewMode="grid" coverHeight="tall" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
