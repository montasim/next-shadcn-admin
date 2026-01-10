'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useSWR, { mutate } from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  BookOpen,
  Users,
  BarChart3,
  FileText,
  Edit,
  Eye,
  TrendingUp,
  Calendar,
  User,
  Sparkles,
  HardDrive,
  Headphones,
} from 'lucide-react'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { BookTypeBadge } from '@/components/books/book-type-badge'
import { ViewsOverTimeChart } from '@/components/analytics/views-over-time-chart'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { SeriesMutateDrawer } from '../components/series-mutate-drawer'
import { Series } from '../data/schema'
import { DataTable } from '@/components/data-table/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Skeleton } from '@/components/ui/skeleton'

// Common styles
const STYLES = {
  metadataLabel: 'text-muted-foreground',
  metadataValue: 'font-medium mt-1',
  metadataValueText: 'text-foreground',
  adminLabel: 'text-xs text-muted-foreground',
  adminValue: 'text-xs font-medium mt-1',
  userLink: 'text-xs font-medium hover:text-primary hover:underline transition-colors',
} as const

// Helper Components
function MetadataItem({ label, value, valueClassName = '' }: { label: string; value: React.ReactNode; valueClassName?: string }) {
  return (
    <div>
      <span className={STYLES.metadataLabel}>{label}</span>
      <div className={`${STYLES.metadataValue} ${STYLES.metadataValueText} ${valueClassName}`}>{value}</div>
    </div>
  )
}

function UserLinkButton({ user }: { user: any }) {
  return (
    <Link href={`/dashboard/users/${user.id}`} className={STYLES.userLink}>
      {user.name || user.username}
    </Link>
  )
}

function AdminMetadataItem({ label, value, valueClassName = '' }: { label: string; value: React.ReactNode; valueClassName?: string }) {
  return (
    <div>
      <span className={STYLES.adminLabel}>{label}</span>
      <div className={`${STYLES.adminValue} ${valueClassName}`}>{value}</div>
    </div>
  )
}

// Skeleton Loader Component
function SeriesDetailSkeleton() {
  return (
    <div className="bg-background h-screen overflow-y-auto no-scrollbar pb-4">
      {/* Action Buttons */}
      <div className="flex lg:justify-end justify-between gap-2 mb-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-20" />
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Series Image */}
          <Skeleton className="w-full sm:max-w-[200px] lg:w-[250px] lg:h-[250px] aspect-square rounded-full mx-auto lg:mx-0" />

          <div className="flex-1 space-y-6">
            {/* Title and Description */}
            <div className="space-y-4">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 text-sm">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>

            <Skeleton className="h-px w-full" />

            {/* Admin Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-28" />
            ))}
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-4 border-b pb-3 overflow-x-auto">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-20 flex-shrink-0" />
                  ))}
                </div>
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex gap-4 py-3 border-b">
                    {[...Array(10)].map((_, j) => (
                      <Skeleton key={j} className="h-4 flex-1 min-w-[60px]" />
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function AdminSeriesDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const seriesId = params.id as string
  const activeTab = searchParams.get('tab') || 'books'

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
    return <SeriesDetailSkeleton />
  }

  if (error || !series) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load series details</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const imageUrl = series.directImageUrl || getProxiedImageUrl(series.image) || series.image || '/placeholder-series.png'

  return (
    <div className="bg-background h-screen overflow-y-auto no-scrollbar pb-4">
      {/* Action Buttons */}
      <div className="flex lg:justify-end justify-between gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={() => router.push(`/series/${series.id}`)}>
          <Eye className="h-4 w-4 mr-2" />
          View Public Page
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIsEditDrawerOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Series Image - Responsive */}
          <div className="relative w-full sm:max-w-[200px] lg:w-[250px] lg:h-[250px] aspect-square rounded-full overflow-hidden shadow-lg bg-muted mx-auto lg:mx-0">
            <Image
              src={imageUrl}
              alt={series.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 200px, 250px"
              unoptimized
            />
          </div>

          <div className="flex-1 space-y-6">
            {/* Series Title and Description */}
            <div className="space-y-4">
              <h1 className="text-xl font-bold">{series.name}</h1>

              {series.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">{series.description}</p>
              )}
            </div>

            {/* Metadata - Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 text-sm">
              <MetadataItem label="Total Spend:" value={`৳${series.analytics?.totalSpend?.toLocaleString() || 0}`} />
              <MetadataItem label="Hard Copy:" value={series.analytics?.booksByType?.HARD_COPY || 0} />
              <MetadataItem label="eBook:" value={series.analytics?.booksByType?.EBOOK || 0} />
              <MetadataItem label="Audio:" value={series.analytics?.booksByType?.AUDIO || 0} />
              <MetadataItem label="Total Books:" value={series.analytics?.totalBooks || 0} />
            </div>

            <Separator />

            {/* Admin Information */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
              <AdminMetadataItem
                label="ID:"
                value={<span className="font-mono">{series.id.slice(0, 8)}...</span>}
              />
              {series.createdAt && (
                <AdminMetadataItem
                  label="Created:"
                  value={new Date(series.createdAt).toLocaleString()}
                />
              )}
              {series.updatedAt && (
                <AdminMetadataItem
                  label="Last Updated:"
                  value={new Date(series.updatedAt).toLocaleString()}
                />
              )}
              {series.entryBy && (
                <AdminMetadataItem label="Entered By:" value={
                  <div className="flex items-center gap-2 -mt-1">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={series.entryBy.directAvatarUrl} />
                      <AvatarFallback className="text-[10px]">
                        {series.entryBy.name?.[0] || series.entryBy.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <UserLinkButton user={series.entryBy} />
                  </div>
                } />
              )}
            </div>

            {/* Quick Stats */}
            <DashboardSummary
              summaries={[
                {
                  title: 'Total Views',
                  value: series.analytics?.totalViews || 0,
                  description: 'All time views',
                  icon: Eye,
                },
                {
                  title: 'Books',
                  value: series.analytics?.totalBooks || 0,
                  description: `${series.analytics?.totalPages || 0} total pages`,
                  icon: BookOpen,
                },
                {
                  title: 'Readers',
                  value: series.analytics?.totalReaders || 0,
                  description: 'Total readers',
                  icon: Users,
                },
                {
                  title: 'Completed Books',
                  value: series.analytics?.completedReaders || 0,
                  description: 'Finished reading',
                  icon: BookOpen,
                },
                {
                  title: 'Avg Completion',
                  value: series.analytics?.totalReaders
                    ? `${Math.round((series.analytics.completedReaders / series.analytics.totalReaders) * 100)}%`
                    : 'N/A',
                  description: 'Completion rate',
                  icon: TrendingUp,
                },
              ]}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} className="space-y-4">
          <TabsList className="overflow-x-auto">
            <Link href={`/dashboard/series/${seriesId}?tab=books`}>
              <TabsTrigger value="books">Books</TabsTrigger>
            </Link>
            <Link href={`/dashboard/series/${seriesId}?tab=analytics`}>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </Link>
            <Link href={`/dashboard/series/${seriesId}?tab=readers`}>
              <TabsTrigger value="readers">Readers</TabsTrigger>
            </Link>
          </TabsList>

          {/* Books Tab */}
          <TabsContent value="books">
            <BooksBySeriesTab seriesId={seriesId} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab seriesId={seriesId} />
          </TabsContent>

          {/* Readers Tab */}
          <TabsContent value="readers">
            <ReadersTab seriesId={seriesId} />
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
function BooksBySeriesTab({ seriesId }: { seriesId: string }) {
  const { data, isLoading } = useSWR(`/api/admin/series/${seriesId}/books`, (url) => fetch(url).then(r => r.json()))
  const booksData = data?.data
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // Skeleton loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Table Header Skeleton */}
            <div className="flex gap-4 border-b pb-3 overflow-x-auto">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-20 flex-shrink-0" />
              ))}
            </div>
            {/* Table Rows Skeleton */}
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex gap-4 py-3 border-b">
                {[...Array(10)].map((_, j) => (
                  <Skeleton key={j} className="h-4 flex-1 min-w-[60px]" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const bookTypeIcons = {
    HARD_COPY: HardDrive,
    EBOOK: BookOpen,
    AUDIO: Headphones,
  }

  const bookTypeLabels = {
    HARD_COPY: 'Hard Copy',
    EBOOK: 'eBook',
    AUDIO: 'Audio',
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'order',
      header: '#',
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs">
          #{row.getValue('order')}
        </Badge>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Book Name',
      cell: ({ row }) => (
        <Link href={`/dashboard/books/${row.original.id}`} className="font-medium text-sm hover:text-primary hover:underline">
          {row.getValue('name')}
        </Link>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as keyof typeof bookTypeIcons
        const Icon = bookTypeIcons[type]
        return (
          <Badge variant="outline" className="capitalize flex items-center gap-1 w-fit">
            <Icon className="h-3 w-3" />
            {bookTypeLabels[type]}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'pageNumber',
      header: 'Pages',
      cell: ({ row }) => {
        const pages = row.original.pageNumber
        return <span className="text-sm">{pages ? pages.toString() : 'N/A'}</span>
      },
    },
    {
      accessorKey: 'authors',
      header: 'Authors',
      cell: ({ row }) => {
        const authors = row.original.authors || []
        return (
          <div className="flex flex-wrap gap-1">
            {authors.length === 0 ? (
              <span className="text-sm text-muted-foreground">None</span>
            ) : (
              authors.slice(0, 2).map((auth: any) => (
                <Link key={auth.author?.id} href={`/dashboard/authors/${auth.author?.id}`}>
                  <Badge variant="outline" className="text-xs hover:underline cursor-pointer">
                    {auth.author?.name}
                  </Badge>
                </Link>
              ))
            )}
            {authors.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{authors.length - 2} more
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'categories',
      header: 'Categories',
      cell: ({ row }) => {
        const categories = row.original.categories || []
        return (
          <div className="flex flex-wrap gap-1">
            {categories.length === 0 ? (
              <span className="text-sm text-muted-foreground">None</span>
            ) : (
              categories.slice(0, 2).map((cat: any) => (
                <Link key={cat.category?.id} href={`/dashboard/categories/${cat.category?.id}`}>
                  <Badge variant="secondary" className="text-xs hover:underline cursor-pointer">
                    {cat.category?.name}
                  </Badge>
                </Link>
              ))
            )}
            {categories.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{categories.length - 2} more
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'viewCount',
      header: 'Views',
      cell: ({ row }) => <span className="text-sm font-medium">{row.getValue('viewCount') || 0}</span>,
    },
    {
      accessorKey: 'readerCount',
      header: 'Readers',
      cell: ({ row }) => <span className="text-sm font-medium">{row.getValue('readerCount') || 0}</span>,
    },
    {
      accessorKey: 'completedReaders',
      header: 'Completed',
      cell: ({ row }) => <span className="text-sm font-medium">{row.getValue('completedReaders') || 0}</span>,
    },
    {
      accessorKey: 'avgProgress',
      header: 'Avg Progress',
      cell: ({ row }) => {
        const progress = row.original.avgProgress
        return <span className="text-sm font-medium">{progress && typeof progress === 'number' ? Math.round(progress) + '%' : 'N/A'}</span>
      },
    },
    {
      accessorKey: 'buyingPrice',
      header: 'Price',
      cell: ({ row }) => {
        const price = row.getValue('buyingPrice')
        return <span className="text-sm font-medium">{price ? `৳${Number(price).toLocaleString()}` : 'N/A'}</span>
      },
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Books in Series</CardTitle>
        <CardDescription>{booksData?.books?.length || 0} books</CardDescription>
      </CardHeader>
      <CardContent>
        {booksData?.books && booksData.books.length > 0 ? (
          <DataTable
            data={booksData.books}
            columns={columns}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalCount={booksData.books.length || 0}
          />
        ) : (
          <p className="text-center text-muted-foreground">No books yet</p>
        )}
      </CardContent>
    </Card>
  )
}

// Analytics Tab Component
function AnalyticsTab({ seriesId }: { seriesId: string }) {
  const { data, isLoading: isLoadingChart } = useSWR(`/api/admin/series/${seriesId}/visits?chart=true`, (url) => fetch(url).then(r => r.json()))
  const { data: visitsData, isLoading: isLoadingVisits } = useSWR(`/api/admin/series/${seriesId}/visits?limit=10`, (url) => fetch(url).then(r => r.json()))

  const chartData = data?.data?.chart
  const recentVisits = visitsData?.data?.visits?.visits || []
  const stats = visitsData?.data?.stats

  // Skeleton loading state
  if (isLoadingChart || isLoadingVisits) {
    return (
      <div className="space-y-4">
        {/* Chart Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>

        {/* Recent Activity Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            {stats?.totalViews || 0} total views across all time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentVisits.length > 0 ? (
            <div className="space-y-3">
              {recentVisits.map((visit: any) => (
                <div key={visit.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={visit.user?.directAvatarUrl} />
                      <AvatarFallback>
                        {visit.user?.name?.[0] || visit.user?.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{visit.user?.name || visit.user?.username || 'Anonymous'}</p>
                      <p className="text-sm text-muted-foreground">
                        Viewed series page
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(visit.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(visit.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Readers Tab Component
function ReadersTab({ seriesId }: { seriesId: string }) {
  const { data, isLoading } = useSWR(`/api/admin/series/${seriesId}/readers`, (url) => fetch(url).then(r => r.json()))
  const readers = data?.data?.readers?.readers || []

  // Skeleton loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Readers</CardTitle>
        <CardDescription>{readers.length} readers across all books</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {readers.map((reader: any) => (
            <div key={reader.user.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={reader.user.directAvatarUrl} />
                  <AvatarFallback>{reader.user.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{reader.user.name || reader.user.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {reader.booksRead} book{reader.booksRead > 1 ? 's' : ''} • {reader.completedBooks} completed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last read: {new Date(reader.lastReadAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{reader.avgProgress}%</p>
                <p className="text-xs text-muted-foreground">avg progress</p>
              </div>
            </div>
          ))}
          {readers.length === 0 && (
            <p className="text-center text-muted-foreground">No readers yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
