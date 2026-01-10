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
  Building2,
  User,
  Sparkles,
  HardDrive,
  Headphones,
  ExternalLink,
} from 'lucide-react'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { BookTypeBadge } from '@/components/books/book-type-badge'
import { ViewsOverTimeChart } from '@/components/analytics/views-over-time-chart'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import {router} from "next/client"
import { AuthorsMutateDrawer } from '../components/authors-mutate-drawer'
import { Author } from '../data/schema'
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

// Skeleton Loader Component
function AuthorDetailSkeleton() {
  return (
    <div className="bg-background h-screen overflow-y-auto no-scrollbar pb-4">
      {/* Action Buttons Skeleton */}
      <div className="flex lg:justify-end justify-between gap-2 mb-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-20" />
      </div>

      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Author Image Skeleton */}
          <Skeleton className="w-full sm:max-w-[200px] lg:w-[250px] lg:h-[250px] aspect-square rounded-full mx-auto lg:mx-0" />

          <div className="flex-1 space-y-6">
            {/* Title and Description Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Metadata Grid Skeleton - Responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>

            {/* Separator Skeleton */}
            <Skeleton className="h-px w-full" />

            {/* Admin Info Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>

            {/* Quick Stats Skeleton */}
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

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          {/* Tabs List Skeleton */}
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>

          {/* Tab Content Skeleton - Books Table */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Table Header Skeleton */}
                <div className="flex gap-4 border-b pb-3">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-20" />
                  ))}
                </div>
                {/* Table Rows Skeleton */}
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 py-3 border-b">
                    {[...Array(10)].map((_, j) => (
                      <Skeleton key={j} className="h-4 flex-1" />
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

function AdminMetadataItem({ label, value, valueClassName = '' }: { label: string; value: React.ReactNode; valueClassName?: string }) {
  return (
    <div>
      <span className={STYLES.adminLabel}>{label}</span>
      <div className={`${STYLES.adminValue} ${valueClassName}`}>{value}</div>
    </div>
  )
}

function UserLinkButton({ user, className = '' }: { user: any; className?: string }) {
  if (!user) return null
  return (
    <button
      onClick={() => user.id && router.push(`/dashboard/users/${user.id}`)}
      className={`${STYLES.userLink} ${className}`}
    >
      {user.name || user.username || 'Unknown'}
    </button>
  )
}

export default function AdminAuthorDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const authorId = params.id as string
  const activeTab = searchParams.get('tab') || 'books'

  // Edit drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)

  const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch data')
    const json = await res.json()
    return json
  }

  // Fetch author details with optimized caching
  const { data: authorData, isLoading, error } = useSWR(
    `/api/admin/authors/${authorId}/details`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Dedupe requests within 60 seconds
    }
  )

  const author = authorData?.data

  if (isLoading) {
    return <AuthorDetailSkeleton />
  }

  if (error || !author) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load author details</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const imageUrl = author.directImageUrl || getProxiedImageUrl(author.image) || author.image || '/placeholder-author.png'

  return (
    <div className="bg-background h-screen overflow-y-auto no-scrollbar pb-4">
      {/* Action Buttons */}
      <div className="flex lg:justify-end justify-between gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={() => router.push(`/authors/${author.id}`)}>
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
          {/* Author Image - Responsive */}
          <div className="relative w-full sm:max-w-[200px] lg:w-[250px] lg:h-[250px] aspect-square rounded-full overflow-hidden shadow-lg bg-muted mx-auto lg:mx-0">
            <Image
              src={imageUrl}
              alt={author.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 200px, 250px"
              unoptimized
            />
          </div>

          <div className="flex-1 space-y-6">
            {/* Author Title and Description */}
            <div className="space-y-4">
              <h1 className="text-xl font-bold">{author.name}</h1>

              {author.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">{author.description}</p>
              )}
            </div>

            {/* Metadata - Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 text-sm">
              <MetadataItem label="Total Spend:" value={`৳${author.analytics?.totalSpend?.toLocaleString() || 0}`} />
              <MetadataItem label="Hard Copy:" value={author.analytics?.booksByType?.HARD_COPY || 0} />
              <MetadataItem label="eBook:" value={author.analytics?.booksByType?.EBOOK || 0} />
              <MetadataItem label="Audio:" value={author.analytics?.booksByType?.AUDIO || 0} />
              <MetadataItem label="Total Books:" value={author.analytics?.totalBooks || 0} />
              {author.birthDate && (
                <MetadataItem label="Birth Date:" value={new Date(author.birthDate).toLocaleDateString()} />
              )}
              {author.nationality && (
                <MetadataItem label="Nationality:" value={author.nationality} valueClassName="capitalize" />
              )}
              {author.website && (
                <MetadataItem label="Website:" value={
                  <a href={author.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                    {author.website}
                  </a>
                } />
              )}
            </div>

            <Separator />

            {/* Admin Information */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
              <AdminMetadataItem
                label="ID:"
                value={<span className="font-mono">{author.id.slice(0, 8)}...</span>}
              />
              {author.createdAt && (
                <AdminMetadataItem
                  label="Created:"
                  value={new Date(author.createdAt).toLocaleString()}
                />
              )}
              {author.updatedAt && (
                <AdminMetadataItem
                  label="Last Updated:"
                  value={new Date(author.updatedAt).toLocaleString()}
                />
              )}
              {author.entryBy && (
                <AdminMetadataItem label="Entered By:" value={
                  <div className="flex items-center gap-2 -mt-1">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={author.entryBy.directAvatarUrl} />
                      <AvatarFallback className="text-[10px]">
                        {author.entryBy.name?.[0] || author.entryBy.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <UserLinkButton user={author.entryBy} />
                  </div>
                } />
              )}
            </div>

            {/* Quick Stats */}
            <DashboardSummary
              summaries={[
                {
                  title: 'Total Views',
                  value: author.analytics?.totalViews || 0,
                  description: 'All time views',
                  icon: Eye,
                },
                {
                  title: 'Books',
                  value: author.analytics?.totalBooks || 0,
                  description: `${author.analytics?.totalPages || 0} total pages`,
                  icon: BookOpen,
                },
                {
                  title: 'Readers',
                  value: author.analytics?.totalReaders || 0,
                  description: 'Total readers',
                  icon: Users,
                },
                {
                  title: 'Completed Books',
                  value: author.analytics?.completedReaders || 0,
                  description: 'Finished reading',
                  icon: BookOpen,
                },
                {
                  title: 'Avg Completion',
                  value: author.analytics?.totalReaders
                    ? `${Math.round((author.analytics.completedReaders / author.analytics.totalReaders) * 100)}%`
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
            <Link href={`/dashboard/authors/${authorId}?tab=books`}>
              <TabsTrigger value="books">Books</TabsTrigger>
            </Link>
            <Link href={`/dashboard/authors/${authorId}?tab=analytics`}>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </Link>
            <Link href={`/dashboard/authors/${authorId}?tab=readers`}>
              <TabsTrigger value="readers">Readers</TabsTrigger>
            </Link>
          </TabsList>

          {/* Books Tab */}
          <TabsContent value="books">
            <BooksByAuthorTab authorId={authorId} activeTab={activeTab} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab authorId={authorId} activeTab={activeTab} />
          </TabsContent>

          {/* Readers Tab */}
          <TabsContent value="readers">
            <ReadersTab authorId={authorId} activeTab={activeTab} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Author Drawer */}
      {author && (
        <AuthorsMutateDrawer
          key={`edit-author-${authorId}`}
          open={isEditDrawerOpen}
          onOpenChange={setIsEditDrawerOpen}
          currentRow={author as unknown as Author}
          onSuccess={() => {
            mutate(`/api/admin/authors/${authorId}/details`)
            setIsEditDrawerOpen(false)
          }}
        />
      )}
    </div>
  )
}

// Books Tab Component
function BooksByAuthorTab({ authorId, activeTab }: { authorId: string; activeTab: string }) {
  // Only fetch when this tab is active
  const shouldFetch = activeTab === 'books'

  // Initialize pagination state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // Build SWR key with pagination parameters
  const swrKey = shouldFetch
    ? `/api/admin/authors/${authorId}/books?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}`
    : null

  const { data, isLoading } = useSWR(
    swrKey,
    (url) => fetch(url).then(r => r.json()),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )
  const booksData = data?.data

  // Skeleton loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
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
      accessorKey: 'publications',
      header: 'Publications',
      cell: ({ row }) => {
        const publications = row.original.publications || []
        return (
          <div className="flex flex-wrap gap-1">
            {publications.length === 0 ? (
              <span className="text-sm text-muted-foreground">None</span>
            ) : (
              publications.slice(0, 2).map((pub: any) => (
                <Link key={pub.publication?.id} href={`/dashboard/publications/${pub.publication?.id}`}>
                  <Badge variant="outline" className="text-xs hover:underline cursor-pointer">
                    {pub.publication?.name}
                  </Badge>
                </Link>
              ))
            )}
            {publications.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{publications.length - 2} more
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
      accessorKey: 'series',
      header: 'Series',
      cell: ({ row }) => {
        const series = row.original.series || []
        return (
          <div className="flex flex-wrap gap-1">
            {series.length === 0 ? (
              <span className="text-sm text-muted-foreground">None</span>
            ) : (
              series.slice(0, 2).map((ser: any) => (
                <Link key={ser.series?.id} href={`/dashboard/series/${ser.series?.id}`}>
                  <Badge variant="default" className="text-xs hover:underline cursor-pointer">
                    {ser.series?.name}
                  </Badge>
                </Link>
              ))
            )}
            {series.length > 2 && (
              <Badge variant="default" className="text-xs">
                +{series.length - 2} more
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
        <CardTitle>Books by Author</CardTitle>
        <CardDescription>{booksData?.total || 0} books</CardDescription>
      </CardHeader>
      <CardContent>
        {booksData?.books && booksData.books.length > 0 ? (
          <DataTable
            data={booksData.books}
            columns={columns}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalCount={booksData.total || 0}
          />
        ) : (
          <p className="text-center text-muted-foreground">No books yet</p>
        )}
      </CardContent>
    </Card>
  )
}

// Analytics Tab Component
function AnalyticsTab({ authorId, activeTab }: { authorId: string; activeTab: string }) {
  // Only fetch when this tab is active
  const shouldFetch = activeTab === 'analytics'

  const { data, isLoading: isLoadingChart } = useSWR(
    shouldFetch ? `/api/admin/authors/${authorId}/visits?chart=true` : null,
    (url) => fetch(url).then(r => r.json()),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )
  const { data: visitsData, isLoading: isLoadingVisits } = useSWR(
    shouldFetch ? `/api/admin/authors/${authorId}/visits?limit=10` : null,
    (url) => fetch(url).then(r => r.json()),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

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
                        Viewed author page
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
function ReadersTab({ authorId, activeTab }: { authorId: string; activeTab: string }) {
  // Only fetch when this tab is active
  const shouldFetch = activeTab === 'readers'

  const { data, isLoading } = useSWR(
    shouldFetch ? `/api/admin/authors/${authorId}/readers` : null,
    (url) => fetch(url).then(r => r.json()),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )
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
          {readers.map((reader: any, index: number) => (
            <div key={reader.user?.id || reader.id || `reader-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={reader.user?.directAvatarUrl} />
                  <AvatarFallback>{reader.user?.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{reader.user?.name || reader.user?.username || 'Unknown'}</p>
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
