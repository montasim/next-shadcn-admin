'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, Users, Calendar, Eye, Building2, User as UserIcon, Tag } from 'lucide-react'

interface EntityDetailsSkeletonProps {
  entityType: 'author' | 'publication' | 'category'
}

export function EntityDetailsSkeleton({ entityType }: EntityDetailsSkeletonProps) {
  // Get icon based on entity type
  const getIcon = () => {
    switch (entityType) {
      case 'author':
        return <UserIcon className="h-24 w-24 text-muted-foreground" />
      case 'publication':
        return <Building2 className="h-24 w-24 text-muted-foreground" />
      case 'category':
        return <Tag className="h-24 w-24 text-muted-foreground" />
    }
  }

  const getEntityName = () => {
    switch (entityType) {
      case 'author':
        return 'Author'
      case 'publication':
        return 'Publisher'
      case 'category':
        return 'Category'
    }
  }

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Image and Stats */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Entity Image Skeleton */}
              <div className="relative mb-6 max-w-xs mx-auto lg:mx-0">
                <Skeleton className="aspect-square w-full rounded-lg" />
              </div>

              {/* Quick Stats Card Skeleton */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
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
            <div className="mb-8">
              {/* Name and Visitor Count Row Skeleton */}
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-1/2" />
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              {/* Added by User Skeleton */}
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex flex-col">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

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
              <Skeleton className="h-8 w-48 mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex gap-4">
                        {/* Book Cover Skeleton - Mobile */}
                        <div className="flex-shrink-0">
                          <Skeleton className="w-20 h-28 rounded" />
                        </div>

                        {/* Book Info Skeleton - Mobile */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>

                      {/* Desktop Cover Skeleton */}
                      <div className="hidden md:block">
                        <div className="w-full h-64 bg-muted rounded-lg mb-4" />
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
