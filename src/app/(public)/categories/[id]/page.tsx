'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BookGrid } from '@/components/books/book-grid'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
import { MDXViewer } from '@/components/ui/mdx-viewer'
import { EntityDetailsSkeleton } from '@/components/entities/entity-details-skeleton'
import { useCategory } from '@/hooks/use-category'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { getUserDisplayName } from '@/lib/utils/user'
import {
  BookOpen,
  Users,
  Calendar,
  Home,
  Tag,
  ArrowLeft,
  Eye,
} from 'lucide-react'

export default function CategoryDetailsPage() {
  const params = useParams()
  const categoryId = params.id as string

  const { data: responseData, isLoading, error } = useCategory({ id: categoryId })
  const category = responseData?.data?.category

  // Track page view when category is loaded
  useEffect(() => {
    if (categoryId && category) {
      // Track view asynchronously in the background
      fetch(`/api/categories/${categoryId}/view`, { method: 'POST' }).catch((err) => {
        console.error('Failed to track view:', err)
      })
    }
  }, [categoryId, category])

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  if (isLoading) {
    return <EntityDetailsSkeleton entityType="category" />
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Category not found</h2>
          <p className="text-muted-foreground mb-4">
            The category you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/books">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Books
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <NavigationBreadcrumb
          className="mb-6"
          items={[
            { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
            { label: 'Categories', href: '/categories', icon: <Tag className="h-4 w-4" /> },
            { label: category.name },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Category Image and Stats - Left Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Category Image */}
              <div className="relative mb-6 max-w-xs mx-auto lg:mx-0">
                <div className="aspect-square rounded-lg overflow-hidden shadow-lg bg-muted">
                  {category.image ? (
                    <img
                      src={getProxiedImageUrl(category.image) || category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tag className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Books
                      </span>
                      <span className="font-medium">{category.statistics.totalBooks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Readers
                      </span>
                      <span className="font-medium">{category.statistics.totalReaders}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Entry Date
                      </span>
                      <span className="font-medium">{formatDate(category.entryDate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Category Information and Books - Right Column */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              {/* Name and Visitor Count Row */}
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">{category.name}</h1>

                {/* Visitor Count */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">{category.analytics?.totalViews?.toLocaleString() || '0'} views</span>
                </div>
              </div>

              {/* Added by user */}
              {category.entryBy && (
                <div className="flex items-center gap-3 mb-4">
                  <Link href={`/users/${category.entryBy.id}`} className="flex items-center gap-3 group">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={category.entryBy.avatar ? getProxiedImageUrl(category.entryBy.avatar) || category.entryBy.avatar : undefined}
                        alt={getUserDisplayName({
                          firstName: category.entryBy.firstName,
                          lastName: category.entryBy.lastName,
                          username: category.entryBy.username,
                          name: category.entryBy.name,
                          email: '',
                        })}
                      />
                      <AvatarFallback className="text-sm bg-primary/10">
                        {category.entryBy.username
                          ? category.entryBy.username[0].toUpperCase()
                          : category.entryBy.firstName?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Added by</span>
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">
                        {getUserDisplayName({
                          firstName: category.entryBy.firstName,
                          lastName: category.entryBy.lastName,
                          username: category.entryBy.username,
                          name: category.entryBy.name,
                          email: '',
                        })}
                      </span>
                    </div>
                  </Link>
                </div>
              )}

              {/* Description */}
              {category.description && (
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <MDXViewer content={category.description} />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Books in Category */}
            {category.books && category.books.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Books in {category.name}</h2>
                <BookGrid
                  books={category.books}
                  viewMode="grid"
                  viewMoreHref={(book) => `/books/${book.id}`}
                  showTypeBadge={true}
                  showPremiumBadge={true}
                  showCategories={true}
                  showReaderCount={true}
                  showAddToBookshelf={true}
                  showLockOverlay={true}
                  coverHeight="tall"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
