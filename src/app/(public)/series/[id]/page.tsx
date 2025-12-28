'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, LibraryBig, ArrowLeft, Lock, Eye } from 'lucide-react'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { useAuth } from '@/context/auth-context'
import { BookTypeBadge } from '@/components/books/book-type-badge'

export default function SeriesDetailPage() {
  const params = useParams()
  const router = useRouter()
  const seriesId = params.id as string
  const { user } = useAuth()

  const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch series')
    return res.json()
  }

  const { data, isLoading, error } = useSWR(`/api/public/series/${seriesId}`, fetcher)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Series not found</h2>
          <p className="text-muted-foreground mb-4">
            The series you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => router.push('/series')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Series
          </Button>
        </div>
      </div>
    )
  }

  const series = data.data
  const hasPremium = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-6">
          <NavigationBreadcrumb />
          <div className="mt-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/series')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Series
            </Button>
            <div className="flex items-start gap-4">
              {series.image && (
                <div className="relative w-24 h-36 rounded-lg overflow-hidden border flex-shrink-0">
                  <Image
                    src={getProxiedImageUrl(series.image)}
                    alt={series.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold">{series.name}</h1>
                <p className="text-muted-foreground mt-2">
                  {series.bookCount} book{series.bookCount !== 1 ? 's' : ''} in this series
                </p>
                {series.description && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                    {series.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="container mx-auto px-4 py-8">
        {series.books.length === 0 ? (
          <div className="text-center py-12">
            <LibraryBig className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No books yet</h3>
            <p className="text-muted-foreground">Books will appear here once they are added to this series.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {series.books.map((book, index) => {
              const canAccess = !book.requiresPremium || hasPremium

              return (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="group"
                >
                  <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50">
                    <CardHeader className="p-3">
                      <div className="relative aspect-[2/3] w-full mb-3 rounded-md overflow-hidden bg-muted">
                        {book.image ? (
                          <Image
                            src={getProxiedImageUrl(book.image)}
                            alt={book.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">No cover</span>
                          </div>
                        )}
                        {!canAccess && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Lock className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                        {book.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          #{book.seriesOrder}
                        </Badge>
                        <BookTypeBadge type={book.type} />
                        {book.requiresPremium && (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>{book.readersCount} reader{book.readersCount !== 1 ? 's' : ''}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
