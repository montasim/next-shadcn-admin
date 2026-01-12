'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, Users, Calendar, LibraryBig, Bookmark } from 'lucide-react'

export function UserProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pb-24 sm:pb-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Profile Header Card Skeleton */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-row gap-4 items-center sm:gap-6">
              {/* Avatar Skeleton */}
              <Skeleton className="h-16 w-16 sm:h-24 sm:w-24 flex-shrink-0 rounded-full" />

              {/* User Info + Stats Skeleton */}
              <div className="flex-1 min-w-0">
                <Skeleton className="h-7 sm:h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-full max-w-md mb-3" />

                {/* Member Since and Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-3 sm:gap-6">
                  {/* Member Since */}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Skeleton className="h-4 w-32" />
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 sm:gap-6">
                    {/* Books Count */}
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <Skeleton className="h-5 w-6" />
                      <Skeleton className="h-4 w-12" />
                    </div>

                    {/* Readers Count */}
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Skeleton className="h-5 w-6" />
                      <Skeleton className="h-4 w-14" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reading Activity Section Skeleton */}
        <div className="mb-4 mt-8">
          <Skeleton className="h-7 w-48 mb-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Reading Chart Skeleton */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Reading Heatmap Skeleton */}
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="grid grid-cols-7 gap-1">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    {[...Array(4)].map((_, j) => (
                      <Skeleton key={j} className="h-8 w-full" />
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Books Grid Section Skeleton */}
        <div className="mb-4">
          <Skeleton className="h-7 w-48 mb-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                {/* Mobile Layout - Horizontal */}
                <div className="flex gap-4 md:hidden">
                  {/* Book Cover Skeleton */}
                  <div className="flex-shrink-0">
                    <Skeleton className="w-16 h-24 rounded" />
                  </div>

                  {/* Book Info Skeleton */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>

                {/* Desktop Layout - Vertical */}
                <div className="hidden md:block">
                  <div className="w-full aspect-[3/4] bg-muted rounded-lg mb-3" />
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Public Bookshelves Section Skeleton */}
        <div className="mb-4 mt-12">
          <Skeleton className="h-7 w-48 mb-4" />
        </div>

        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Bookshelf Header Skeleton */}
                <div className="w-full flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    {/* Bookshelf Image Skeleton */}
                    <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />

                    {/* Bookshelf Info Skeleton */}
                    <div className="text-left">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-64 mb-2" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>

                  {/* Expand Icon Skeleton */}
                  <Skeleton className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
