'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
} from 'lucide-react'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { BookTypeBadge } from '@/components/books/book-type-badge'
import { ViewsOverTimeChart } from '@/components/analytics/views-over-time-chart'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'

export default function AdminAuthorDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const authorId = params.id as string
  const activeTab = searchParams.get('tab') || 'overview'

  const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch data')
    const json = await res.json()
    return json
  }

  // Fetch author details
  const { data: authorData, isLoading, error } = useSWR(
    `/api/admin/authors/${authorId}/details`,
    fetcher
  )

  const author = authorData?.data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Loading author details...</p>
        </div>
      </div>
    )
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
      <div className="container mx-auto py-6 space-y-6">
        {/* Breadcrumb */}
        <NavigationBreadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Authors', href: '/dashboard/authors' },
            { label: author.name, href: `/dashboard/authors/${author.id}` },
          ]}
        />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={imageUrl} />
              <AvatarFallback className="text-2xl">{author.name?.[0] || 'A'}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h1 className="text-xl font-bold">{author.name}</h1>
              {author.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{author.description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/authors?edit=${author.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                description: `${author.analytics?.completedReaders || 0} completed`,
                icon: Users,
              },
            ]}
          />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Books by Type</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hard Copy:</span>
                  <span className="font-medium">{author.analytics?.booksByType?.HARD_COPY || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">eBook:</span>
                  <span className="font-medium">{author.analytics?.booksByType?.EBOOK || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Audio:</span>
                  <span className="font-medium">{author.analytics?.booksByType?.AUDIO || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} className="space-y-4">
          <TabsList className="overflow-x-auto">
            <Link href={`/dashboard/authors/${authorId}?tab=overview`}>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </Link>
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

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Author Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Author Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-mono text-xs">{author.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{author.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Entry Date:</span>
                      <span>{new Date(author.entryDate).toLocaleDateString()}</span>
                    </div>
                    {author.entryBy && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Entered By:</span>
                        <span>{author.entryBy.name || author.entryBy.username}</span>
                      </div>
                    )}
                  </div>
                  {author.description && (
                    <div>
                      <span className="text-sm text-muted-foreground">Description:</span>
                      <p className="text-sm mt-1">{author.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Books Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Books Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-xl font-bold">{author.analytics?.totalBooks || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Books</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-xl font-bold">{author.analytics?.totalPages || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Pages</p>
                    </div>
                  </div>

                  {author.analytics?.booksByType && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Books by Type:</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Hard Copy:</span>
                          <span className="font-medium">{author.analytics.booksByType.HARD_COPY}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>eBook:</span>
                          <span className="font-medium">{author.analytics.booksByType.EBOOK}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Audio:</span>
                          <span className="font-medium">{author.analytics.booksByType.AUDIO}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Reader Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Reader Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{author.analytics?.totalReaders || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Readers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{author.analytics?.completedReaders || 0}</p>
                    <p className="text-xs text-muted-foreground">Completed Books</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {((author.analytics?.completedReaders || 0) / Math.max(1, author.analytics?.totalReaders || 1) * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Completion Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{author.analytics?.totalBooks || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Books</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Books Tab */}
          <TabsContent value="books">
            <BooksByAuthorTab authorId={authorId} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab authorId={authorId} />
          </TabsContent>

          {/* Readers Tab */}
          <TabsContent value="readers">
            <ReadersTab authorId={authorId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Books Tab Component
function BooksByAuthorTab({ authorId }: { authorId: string }) {
  const { data } = useSWR(`/api/admin/authors/${authorId}/books`, (url) => fetch(url).then(r => r.json()))
  const booksData = data?.data

  return (
    <Card>
      <CardHeader>
        <CardTitle>Books by Author</CardTitle>
        <CardDescription>{booksData?.total || 0} books</CardDescription>
      </CardHeader>
      <CardContent>
        {booksData?.books && booksData.books.length > 0 ? (
          <div className="space-y-4">
            {booksData.books.map((book: any) => (
              <div key={book.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={book.directImageUrl || book.image || '/placeholder-book.png'}
                      alt={book.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  </div>
                  <div>
                    <p className="font-medium">{book.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookTypeBadge type={book.type} />
                      {book.pageNumber && <span>• {book.pageNumber} pages</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium">{book.viewCount}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{book.readerCount}</p>
                    <p className="text-xs text-muted-foreground">Readers</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/dashboard/books/${book.id}`, '_blank')}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No books yet</p>
        )}
      </CardContent>
    </Card>
  )
}

// Analytics Tab Component
function AnalyticsTab({ authorId }: { authorId: string }) {
  const { data } = useSWR(`/api/admin/authors/${authorId}/visits?chart=true`, (url) => fetch(url).then(r => r.json()))
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
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest views on this author</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Recent visits list coming soon</p>
        </CardContent>
      </Card>
    </div>
  )
}

// Readers Tab Component
function ReadersTab({ authorId }: { authorId: string }) {
  const { data } = useSWR(`/api/admin/authors/${authorId}/readers`, (url) => fetch(url).then(r => r.json()))
  const readers = data?.data?.readers?.readers || []
  const stats = data?.data?.stats

  return (
    <div className="space-y-4">
      {/* Reader Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Readers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReaders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedReaders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeReaders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.avgProgress)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Readers List */}
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
    </div>
  )
}
