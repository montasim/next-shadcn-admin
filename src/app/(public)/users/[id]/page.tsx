'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookCard } from '@/components/books/book-card'
import { ReadingHeatmap } from '@/components/reading/reading-heatmap'
import { PagesReadChart } from '@/components/reading/pages-read-chart'
import { useUserProfile, useUserBookshelves, useUserReadingActivity } from '@/hooks/use-user-profile'
import {BookOpen, LibraryBig, Calendar, Bookmark, Users, Home, ArrowLeft} from 'lucide-react'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { getUserDisplayName } from '@/lib/utils/user'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const [expandedBookshelf, setExpandedBookshelf] = useState<string | null>(null)
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month'>('week')

  const { data: responseData, isLoading, error } = useUserProfile({ id: userId })
  const { data: bookshelvesData } = useUserBookshelves({ id: userId })
  const { data: readingActivityData } = useUserReadingActivity({ id: userId })
  const userProfile = responseData?.data
  const user = userProfile?.user
  const stats = userProfile?.statistics
  const books = userProfile?.books || []
  const bookshelves = bookshelvesData?.data?.bookshelves || []
  const readingActivity = readingActivityData?.data

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">User not found</h2>
          <p className="text-muted-foreground mb-4">
            The user profile you're looking for doesn't exist.
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  const displayName = getUserDisplayName({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    name: user.name,
    email: '', // Not needed for display
  })
  const memberSince = formatDate(user.createdAt)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pb-24 sm:pb-8">
        {/* Breadcrumb */}
        <NavigationBreadcrumb
          className="mb-6"
          items={[
            { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
            { label: 'Books', href: '/books', icon: <LibraryBig className="h-4 w-4" /> },
            { label: displayName },
          ]}
        />

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-row gap-4 items-center sm:gap-6">
              {/* Avatar */}
              <Avatar className="h-16 w-16 sm:h-24 sm:w-24 flex-shrink-0">
                <AvatarImage
                  src={user.avatar ? getProxiedImageUrl(user.avatar) || user.avatar : undefined}
                  alt={displayName}
                />
                <AvatarFallback className="text-xl sm:text-2xl bg-primary/10">
                  {user.username
                    ? user.username[0].toUpperCase()
                    : user.firstName?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              {/* User Info + Stats - Side by side */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold mb-1">{displayName}</h1>
                {user.bio && (
                  <p className="text-sm sm:text-base text-muted-foreground mb-2 line-clamp-2">{user.bio}</p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-3 sm:gap-6">
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">Member since {memberSince}</span>
                  </div>
                  {/* Stats */}
                  <div className="flex gap-4 sm:gap-6">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg sm:text-xl font-bold">{stats?.totalBooks || 0}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">Books</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg sm:text-xl font-bold">{stats?.totalReaders || 0}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">Readers</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reading Activity Section */}
        <div className="mb-4 mt-8">
          <h2 className="text-xl font-semibold mb-4">
            Reading Activity
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Reading Chart */}
          <PagesReadChart
            data={readingActivity?.pagesPerDay || []}
            title="Daily Reading"
            period={chartPeriod}
            onPeriodChange={setChartPeriod}
          />

          {/* Reading Heatmap */}
          <ReadingHeatmap
            data={readingActivity?.heatmap || []}
            title="Reading Heatmap"
          />
        </div>

        {/* Books Grid */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-4">
            Books by {displayName}
          </h2>
        </div>

        {books.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No books yet</h3>
              <p className="text-muted-foreground">
                This user hasn't uploaded any public books yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={{
                  ...book,
                  summary: book.summary ?? undefined,
                  authors: [],
                  categories: [],
                }}
                viewMoreHref={`/books/${book.id}`}
                showTypeBadge={true}
                showPremiumBadge={true}
                showReaderCount={true}
                coverHeight="tall"
              />
            ))}
          </div>
        )}

        {/* Public Bookshelves Section */}
        {bookshelves.length > 0 && (
          <>
            <div className="mb-4 mt-12">
              <h2 className="text-xl font-semibold mb-4">
                Public Bookshelves
              </h2>
            </div>

            <div className="space-y-4">
              {bookshelves.map((bookshelf) => (
                <Card key={bookshelf.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Bookshelf Header */}
                    <button
                      onClick={() => setExpandedBookshelf(
                        expandedBookshelf === bookshelf.id ? null : bookshelf.id
                      )}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Bookshelf Image */}
                        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {bookshelf.image ? (
                            <img
                              src={getProxiedImageUrl(bookshelf.image) || bookshelf.image}
                              alt={bookshelf.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Bookmark className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>

                        {/* Bookshelf Info */}
                        <div className="text-left">
                          <h3 className="font-semibold text-lg">{bookshelf.name}</h3>
                          {bookshelf.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {bookshelf.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {bookshelf.bookCount} {bookshelf.bookCount === 1 ? 'book' : 'books'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Expand Icon */}
                      <div className={cn(
                        "transition-transform duration-200",
                        expandedBookshelf === bookshelf.id && "rotate-180"
                      )}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          className="text-muted-foreground"
                        >
                          <path
                            d="M5 7.5L10 12.5L15 7.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </button>

                    {/* Bookshelf Books (Collapsible) */}
                    {expandedBookshelf === bookshelf.id && (
                      <div className="border-t">
                        {bookshelf.books.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground">
                            No books in this bookshelf
                          </div>
                        ) : (
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-muted/20">
                            {bookshelf.books.map((book) => (
                              <BookCard
                                key={book.id}
                                book={{
                                  ...book,
                                  summary: book.summary ?? undefined,
                                  authors: [],
                                  categories: [],
                                }}
                                viewMoreHref={`/books/${book.id}`}
                                showTypeBadge={true}
                                showPremiumBadge={true}
                                showReaderCount={true}
                                coverHeight="default"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
