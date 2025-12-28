'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import useSWR, { mutate } from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  Eye,
  BookOpen,
  Users,
  Loader2,
  LibraryBig,
} from 'lucide-react'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { BookTypeBadge } from '@/components/books/book-type-badge'
import { SeriesMutateDrawer } from '../components/series-mutate-drawer'
import { Series } from '../data/schema'
import { ViewsOverTimeChart } from '@/components/analytics/views-over-time-chart'

export default function AdminSeriesDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const seriesId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')

  // Edit drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)

  const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch data')
    const json = await res.json()
    return json
  }

  // Fetch series details
  const { data: seriesData, isLoading, error } = useSWR(
    `/api/admin/series/${seriesId}/details`,
    fetcher
  )

  const series = seriesData?.data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading series details...</p>
        </div>
      </div>
    )
  }

  if (error || !series) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LibraryBig className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-red-500 mb-4">Failed to load series details</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const imageUrl = series.image && getProxiedImageUrl(series.image) || series.directImageUrl || series.image || null

  return (
    <div className="bg-background overflow-auto pb-20 md:pb-6">
      <div className="container mx-auto py-6 space-y-6">
        {/* Breadcrumb */}
        <NavigationBreadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Series', href: '/dashboard/series' },
            { label: series.name, href: `/dashboard/series/${series.id}` },
          ]}
        />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex gap-6">
            {imageUrl && (
              <div className="relative w-32 h-44 rounded-lg overflow-hidden shadow-lg flex-shrink-0 border">
                <Image
                  src={imageUrl}
                  alt={series.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                  unoptimized
                />
              </div>
            )}
            <div className="space-y-2">
              <h1 className="text-xl font-bold">{series.name}</h1>
              {series.description && (
                <p className="text-sm text-muted-foreground max-w-2xl line-clamp-2">
                  {series.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>
                    {series._count?.books || 0} book{(series._count?.books || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{series.analytics?.totalViews || 0} views</span>
                </div>
              </div>
              {series.entryBy && (
                <p className="text-xs text-muted-foreground">
                  Added by {series.entryBy.firstName} {series.entryBy.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/series/${series.id}`)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Public Page
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditDrawerOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{series.analytics?.totalViews || 0}</div>
              <p className="text-xs text-muted-foreground">All time views</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{series.analytics?.uniqueVisitors || 0}</div>
              <p className="text-xs text-muted-foreground">Distinct visitors</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{series._count?.books || 0}</div>
              <p className="text-xs text-muted-foreground">Books in series</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Series Information</CardTitle>
                <CardDescription>Details about this series</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Series Name:</span>
                    <p className="font-medium">{series.name}</p>
                  </div>
                  {series.description && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Description:</span>
                      <p className="font-medium line-clamp-2">{series.description}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">
                      {new Date(series.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Books:</span>
                    <p className="font-medium">{series._count?.books || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Books Tab */}
          <TabsContent value="books">
            <BooksTab seriesId={seriesId} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab seriesId={seriesId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Series Drawer */}
      {series && (
        <SeriesMutateDrawer
          key={`edit-series-${seriesId}`}
          open={isEditDrawerOpen}
          onOpenChange={setIsEditDrawerOpen}
          currentRow={series as unknown as Series}
          onSuccess={() => {
            mutate(`/api/admin/series/${seriesId}/details`)
            setIsEditDrawerOpen(false)
          }}
        />
      )}
    </div>
  )
}

// Books Tab Component
function BooksTab({ seriesId }: { seriesId: string }) {
  const { data } = useSWR(
    `/api/admin/series/${seriesId}/details`,
    (url) => fetch(url).then(r => r.json())
  )
  const series = data?.data
  const books = series?.books || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Books in Series</CardTitle>
        <CardDescription>{books.length} books</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {books.map((book: any) => {
            const bookImageUrl = book.image && getProxiedImageUrl(book.image) || book.directImageUrl || book.image

            return (
              <div key={book.id} className="flex items-center gap-4 p-3 border rounded-lg hover:border-primary/50 transition-colors">
                {bookImageUrl && (
                  <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={bookImageUrl}
                      alt={book.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      #{book.seriesOrder}
                    </Badge>
                    <h4 className="font-medium truncate">{book.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <BookTypeBadge type={book.type} />
                    {book.authors && book.authors.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        by {book.authors.map((a: any) => a.author.name).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`/dashboard/books/${book.id}`, '_blank')}
                >
                  View
                </Button>
              </div>
            )
          })}
          {books.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No books in this series yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Analytics Tab Component
function AnalyticsTab({ seriesId }: { seriesId: string }) {
  const { data } = useSWR(
    `/api/admin/series/${seriesId}/visits?chart=true`,
    (url) => fetch(url).then(r => r.json())
  )
  const chartData = data?.data?.chart

  return (
    <div className="space-y-4">
      {chartData && (
        <ViewsOverTimeChart
          data={chartData}
          title="Views Over Time"
        />
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Series Analytics</CardTitle>
          <CardDescription>Performance metrics for this series</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Detailed analytics coming soon</p>
        </CardContent>
      </Card>
    </div>
  )
}
