'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useBook } from '@/hooks/use-book'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { getUserDisplayName } from '@/lib/utils/user'
import { PDFReaderModal } from '@/components/reader/pdf-reader-modal'
import { AddToBookshelf } from '@/components/books/add-to-bookshelf'
import { BookTypeBadge } from '@/components/books/book-type-badge'
import { ReadingHeatmap } from '@/components/reading/reading-heatmap'
import { PagesReadChart } from '@/components/reading/pages-read-chart'
import { CircularProgressBar } from '@/components/reading/circular-progress-bar'
import { MDXViewer } from '@/components/ui/mdx-viewer'
import { BookGrid } from '@/components/books/book-grid'
import { BookChatButton } from '@/components/books/book-chat-button'
import { BookChatModal } from '@/components/books/book-chat-modal'
import { BookDetailsSkeleton } from '@/components/books/book-details-skeleton'
import {
    BookOpen,
    LibraryBig,
    Users,
    Share2,
    Lock,
    Play,
    Eye,
    Building2,
    Calendar,
    CheckCircle,
    User as UserIcon,
    Home, ArrowLeft, Sparkles, RefreshCw,
    ChevronUp,
    ChevronDown,
    List,
} from 'lucide-react'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'

// Expandable description component with MDX support (defined outside component to avoid recreation)
interface ExpandableDescriptionProps {
  description: string
  sectionId: string
  isExpanded: boolean
  onToggle: (sectionId: string) => void
}

function ExpandableDescription({
  description,
  sectionId,
  isExpanded,
  onToggle,
}: ExpandableDescriptionProps) {
  // Estimate if text is long enough to potentially exceed 4 lines
  const isLong = description.length > 300 || description.split('\n').length > 4

  return (
    <div className="text-sm leading-relaxed">
      {!isExpanded && isLong ? (
        <div className="relative max-h-[5.6rem] overflow-hidden">
          <div
            className="pr-16"
            style={{
              maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
            }}
          >
            <MDXViewer content={description} className='text-sm [&>*]:leading-relaxed' />
          </div>
          <button
            onClick={() => onToggle(sectionId)}
            className="absolute bottom-0 right-0 text-primary text-sm hover:underline bg-background"
          >
            View more...
          </button>
        </div>
      ) : (
        <>
          <MDXViewer content={description} className='text-sm' />
          {isLong && (
            <div className="text-right">
              <button
                onClick={() => onToggle(sectionId)}
                className="text-primary text-sm mt-2 hover:underline"
              >
                View less...
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function BookDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookId = params.id as string
  const [activeTab, setActiveTab] = useState('description')

  // Expand/collapse state for descriptions
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'key-questions-section': true
  })

  // PDF Reader Modal state - initialize based on search params
  const shouldAutoOpenReader = searchParams?.get('openReader') === 'true'
  const [isReaderModalOpen, setIsReaderModalOpen] = useState(shouldAutoOpenReader)

  // Chat Modal state
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)

  // Chart period state
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month'>('week')

  // Get user for auth
  const { user } = useAuth()

  // Fetch book details using the dedicated API endpoint
  const { data: responseData, isLoading, error } = useBook({ id: bookId })
  const book = responseData?.data?.book
  const userAccess = responseData?.data?.userAccess

  // Track page view when book is loaded
  useEffect(() => {
    if (bookId && book) {
      // Track view asynchronously in the background
      fetch(`/api/books/${bookId}/view`, { method: 'POST' }).catch((err) => {
        console.error('Failed to track view:', err)
      })
    }
  }, [bookId, book])

  // Track if we've already validated auto-open conditions
  const hasValidatedAutoOpen = useRef(false)

  // Validate auto-open conditions and close modal if requirements aren't met
  useEffect(() => {
    // Only validate once
    if (hasValidatedAutoOpen.current) return

    if (shouldAutoOpenReader && book) {
      hasValidatedAutoOpen.current = true

      // Close modal if book doesn't meet requirements
      const shouldClose = book.type !== 'EBOOK' || !book.canAccess || book.requiresPremium
      if (shouldClose) {
        setIsReaderModalOpen(false)
      }
    }
  }, [book, shouldAutoOpenReader])

  // Fetcher for SWR
  const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch data')
    const json = await res.json()
    return json
  }

  // Fetch chart data only when progress tab is active (lazy loading)
  // Don't wait for book data - fetch as soon as user, bookId, and tab are ready
  const { data: heatmapData, isLoading: isHeatmapLoading } = useSWR(
    user && bookId && activeTab === 'progress' ? `/api/user/progress-history/${bookId}?type=heatmap&days=365` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const { data: pagesReadData, isLoading: isPagesReadLoading } = useSWR(
    user && bookId && activeTab === 'progress' ? `/api/user/progress-history/${bookId}?type=pages-per-day&days=${chartPeriod === 'week' ? 7 : 30}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  if (isLoading) {
    return <BookDetailsSkeleton />
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Book not found</h2>
          <p className="text-muted-foreground mb-4">
            The book you&apos;re looking for doesn&apos;t exist or has been removed.
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

  const isEbook = book.type === 'EBOOK'
  const isAudio = book.type === 'AUDIO'
  const isHardCopy = book.type === 'HARD_COPY'

  const handleReadBook = () => {
    if (book.canAccess) {
      if (isEbook) {
        // Open modal for ebooks
        setIsReaderModalOpen(true)
      } else if (isAudio) {
        router.push(`/reader/${bookId}?type=audio`)
      } else {
        router.push(`/reader/${bookId}?type=hardcopy`)
      }
    } else {
      router.push('/premium')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.name,
          text: book.summary || '',
          url: window.location.href,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

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

  // Format price for display
  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return 'N/A'
    return `$${price.toFixed(2)}`
  }

  // Toggle expand/collapse for a section
  const toggleExpanded = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Book Details */}
      <div className="container mx-auto px-4 py-8 pb-24 sm:pb-8">
        {/* Breadcrumb */}
        <NavigationBreadcrumb
          className="mb-6"
          items={[
            { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
            { label: 'Books', href: '/books', icon: <LibraryBig className="h-4 w-4" /> },
            { label: book.name },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Book Cover and Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Book Cover */}
              <div className="relative mb-4 sm:mb-6 max-w-auto mx-auto lg:mx-0">
                <div className="aspect-[3/4] overflow-hidden rounded-lg shadow-lg bg-muted">
                  {book.image ? (
                    <Image
                      src={getProxiedImageUrl(book.image) || book.image}
                      alt={book.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <BookOpen className="h-12 w-12" />
                    </div>
                  )}
                </div>

                {/* Type Badge - Top Left */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {book.type && <BookTypeBadge type={book.type} size="md" />}
                  <Badge variant={book.canAccess ? 'default' : 'secondary'} className="text-xs">
                    {book.canAccess ? 'Available' : 'Premium Only'}
                  </Badge>
                </div>

                {/* Premium Badge - Bottom Left */}
                {(book.requiresPremium || !book.canAccess) && (
                  <div className="absolute bottom-3 left-3 z-10">
                    <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                      Premium
                    </Badge>
                  </div>
                )}

                {/* Action Icons - Top Right */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {/* Share Icon Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="bg-background/80 hover:bg-background backdrop-blur-sm h-9 w-9"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>

                  {/* Add to Bookshelf Icon Button */}
                  <AddToBookshelf
                    bookId={bookId}
                    bookName={book.name}
                    variant="manage"
                    triggerVariant="icon"
                    triggerClassName="h-9 w-9"
                  />
                </div>

                {/* Access Overlay */}
                {book.requiresPremium || !book.canAccess ? (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-center text-white p-4">
                      <Lock className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-semibold">Premium Content</p>
                    </div>
                  </div>
                ) : null}

                {/* Progress Badge */}
                {book.readingProgress && (book.readingProgress.currentPage || book.readingProgress.currentEpocha) && (
                  <div className="absolute bottom-3 right-3">
                    <Badge className="bg-background/95 backdrop-blur-sm text-foreground border border-border font-semibold shadow-md">
                      {book.readingProgress.isCompleted ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Done
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                            <span>Progress</span>
                          {book.readingProgress.currentPage && book.pageNumber ? (
                            <>{book.readingProgress.currentPage}/{book.pageNumber}</>
                          ) : (
                            <>{Math.round(book.readingProgress.progress)}%</>
                          )}
                        </span>
                      )}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  onClick={handleReadBook}
                  className="w-full"
                  size="lg"
                  disabled={book.requiresPremium || !book.canAccess}
                >
                  {book.requiresPremium || !book.canAccess ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Need premium access to read
                    </>
                  ) : (
                    <>
                      {isEbook && (
                        book.readingProgress?.isCompleted || (book.readingProgress?.progress ?? 0) >= 100 ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Read Again
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Read Now
                          </>
                        )
                      )}
                      {isAudio && (
                        book.readingProgress?.isCompleted || (book.readingProgress?.progress ?? 0) >= 100 ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Listen Again
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Listen Now
                          </>
                        )
                      )}
                      {isHardCopy && (
                        <>
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Details
                        </>
                      )}
                    </>
                  )}
                </Button>

                {/* Chat with AI Button - Mobile only */}
                {book.canAccess && (
                  <div className="sm:hidden">
                    <BookChatButton
                      book={book}
                      onClick={() => setIsChatModalOpen(true)}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Quick Stats */}
                <div className="space-y-3 text-sm pt-2 p-4 rounded-xl border bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Readers
                    </span>
                    <span className="font-medium">{book.statistics?.totalReaders?.toLocaleString() || '0'}</span>
                  </div>
                  {book.pageNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        Pages
                      </span>
                      <span className="font-medium">{book.pageNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Entry Date
                    </span>
                    <span className="font-medium">{formatDate(book.entryDate)}</span>
                  </div>
                </div>

                {/*<div className="grid grid-cols-2 gap-3">*/}
                {/*  <Button*/}
                {/*    variant="outline"*/}
                {/*    onClick={() => setIsBookmarked(!isBookmarked)}*/}
                {/*    className={isBookmarked ? 'text-primary' : ''}*/}
                {/*  >*/}
                {/*    <Bookmark className={cn("h-4 w-4 mr-2", isBookmarked && "fill-current")} />*/}
                {/*    {isBookmarked ? 'Saved' : 'Save'}*/}
                {/*  </Button>*/}
                {/*  <Button*/}
                {/*    variant="outline"*/}
                {/*    onClick={() => setIsFavorite(!isFavorite)}*/}
                {/*    className={isFavorite ? 'text-red-500' : ''}*/}
                {/*  >*/}
                {/*    <Heart className={cn("h-4 w-4 mr-2", isFavorite && "fill-current")} />*/}
                {/*    {isFavorite ? 'Liked' : 'Like'}*/}
                {/*  </Button>*/}
                {/*</div>*/}
              </div>
            </div>
          </div>

          {/* Book Information */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              {/* Title and Chat Button Row */}
              <div className='flex items-center justify-between mb-3'>
                <h1 className="text-xl lg:text-2xl font-bold">{book.name}</h1>

                {/* Chat with AI Button - Desktop */}
                {book.canAccess && (
                  <div className="hidden sm:block">
                    <BookChatButton
                      book={book}
                      onClick={() => setIsChatModalOpen(true)}
                    />
                  </div>
                )}
              </div>

              {/* Authors and Visitor Count Row - Desktop */}
              {(book.authors && book.authors.length > 0) || book.analytics?.totalViews ? (
                <div className='flex items-center justify-between mb-4 hidden sm:flex'>
                  {/* Authors */}
                  {book.authors && book.authors.length > 0 && (
                    <div className="text-lg text-muted-foreground">
                      by{' '}
                      {book.authors.map((author, index) => (
                        <span key={author.id}>
                          <Link href={`/authors/${author.id}`} className="hover:text-primary hover:underline transition-colors font-medium">
                            {author.name}
                          </Link>
                          {index < book.authors!.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Visitor Count */}
                  {book.analytics?.totalViews && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span className="font-medium">{book.analytics.totalViews.toLocaleString()} views</span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Mobile: Authors and Visitor Count */}
              {(book.authors && book.authors.length > 0) || book.analytics?.totalViews ? (
                <div className='flex items-center justify-between gap-2 mb-4 sm:hidden'>
                  {/* Authors */}
                  {book.authors && book.authors.length > 0 && (
                    <div className="text-base text-muted-foreground">
                      by{' '}
                      {book.authors.map((author, index) => (
                        <span key={author.id}>
                          <Link href={`/authors/${author.id}`} className="hover:text-primary hover:underline transition-colors font-medium">
                            {author.name}
                          </Link>
                          {index < book.authors!.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Visitor Count */}
                  {book.analytics?.totalViews && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span className="font-medium">{book.analytics.totalViews.toLocaleString()} views</span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Added by user */}
              {book.entryBy && typeof book.entryBy === 'object' && (
                <div className="flex items-center gap-3 mb-4">
                  <Link href={`/users/${book.entryBy.id}`} className="flex items-center gap-3 group hover:underline">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={book.entryBy.avatar ? getProxiedImageUrl(book.entryBy.avatar) || book.entryBy.avatar : undefined}
                        alt={getUserDisplayName({
                          firstName: book.entryBy.firstName,
                          lastName: book.entryBy.lastName,
                          username: book.entryBy.username,
                          name: book.entryBy.name,
                          email: '',
                        })}
                      />
                      <AvatarFallback className="text-sm bg-primary/10">
                        {book.entryBy.username
                          ? book.entryBy.username[0].toUpperCase()
                          : book.entryBy.firstName?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Added by</span>
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">
                        {getUserDisplayName({
                          firstName: book.entryBy.firstName,
                          lastName: book.entryBy.lastName,
                          username: book.entryBy.username,
                          name: book.entryBy.name,
                          email: '',
                        })}
                      </span>
                    </div>
                  </Link>
                </div>
              )}

              {/* Categories */}
              {book.categories && book.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {book.categories.map((category) => (
                    <Link key={category.id} href={`/categories/${category.id}`}>
                      <Badge variant="outline" className="hover:bg-primary/10 hover:underline cursor-pointer">
                        {category.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Information Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="progress">My Progress</TabsTrigger>
              </TabsList>

              {/* Description Tab - Book Description and Author Info */}
              <TabsContent value="description" className="mt-4 space-y-4">
                {/* AI Summary */}
                {book.aiSummary && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Summary
                      </CardTitle>
                      {book.aiSummaryGeneratedAt && (
                        <p className="text-xs text-muted-foreground">
                          Generated {new Date(book.aiSummaryGeneratedAt).toLocaleDateString()}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <ExpandableDescription
                        description={book.aiSummary}
                        sectionId="ai-summary"
                        isExpanded={expandedSections['ai-summary'] || false}
                        onToggle={toggleExpanded}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Book Summary/Description */}
                {book.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">About This Book</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ExpandableDescription
                        description={book.summary}
                        sectionId="book-summary"
                        isExpanded={expandedSections['book-summary'] || false}
                        onToggle={toggleExpanded}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Authors with Descriptions */}
                {book.authors && book.authors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">About the Author{book.authors.length > 1 ? 's' : ''}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {book.authors.map((author) => (
                        <div key={author.id} className="flex gap-4">
                          <Avatar className="h-16 w-16 flex-shrink-0">
                            <AvatarImage
                              src={author.image ? getProxiedImageUrl(author.image) || author.image : undefined}
                              alt={author.name}
                            />
                            <AvatarFallback className="text-lg bg-primary/10">
                              {author.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <Link href={`/authors/${author.id}`}>
                              <h3 className="font-semibold text-lg hover:text-primary hover:underline transition-colors">
                                {author.name}
                              </h3>
                            </Link>
                            {author.description && (
                              <div className="text-muted-foreground mt-1">
                                <ExpandableDescription
                                  description={author.description}
                                  sectionId={`author-${author.id}`}
                                  isExpanded={expandedSections[`author-${author.id}`] || false}
                                  onToggle={toggleExpanded}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Publications */}
                {book.publications && book.publications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">About the Publisher{book.publications.length > 1 ? 's' : ''}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {book.publications.map((publication) => (
                        <div key={publication.id} className="flex gap-4">
                          <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                            {publication.image ? (
                              <Image
                                src={getProxiedImageUrl(publication.image) || publication.image}
                                alt={publication.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                                unoptimized
                              />
                            ) : (
                              <Building2 className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/publications/${publication.id}`}>
                              <h3 className="font-semibold text-lg text-primary hover:underline">
                                {publication.name}
                              </h3>
                            </Link>
                            {publication.description && (
                              <div className="text-muted-foreground mt-1">
                                <ExpandableDescription
                                  description={publication.description}
                                  sectionId={`publication-${publication.id}`}
                                  isExpanded={expandedSections[`publication-${publication.id}`] || false}
                                  onToggle={toggleExpanded}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Suggested Questions */}
                {book.suggestedQuestions && book.suggestedQuestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Key Questions About This Book</CardTitle>
                          <CardDescription>
                            Explore important questions and answers
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded('key-questions-section')}
                          className="shrink-0"
                        >
                          {expandedSections['key-questions-section'] ? (
                              <ChevronUp className="h-4 w-4 mr-1" />
                          ) : (
                              <ChevronDown className="h-4 w-4 mr-1" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    {expandedSections['key-questions-section'] !== false && (
                    <CardContent>
                      <div className="space-y-3">
                        {book.suggestedQuestions.map((sq) => {
                          const isExpanded = expandedSections[`sq-${sq.id}`]
                          return (
                            <div key={sq.id} className="border border-border rounded-lg overflow-hidden">
                              <button
                                onClick={() => toggleExpanded(`sq-${sq.id}`)}
                                className="w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-start justify-between gap-2"
                              >
                                <p className="font-medium text-sm flex-1">{sq.question}</p>
                                <span className="text-muted-foreground text-xs mt-0.5">
                                  {isExpanded ? '−' : '+'}
                                </span>
                              </button>
                              {isExpanded && sq.answer && (
                                <div className="px-3 pb-3 pt-0 border-t border-border/50">
                                  <p className="text-sm text-muted-foreground mt-2">{sq.answer}</p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                    )}
                  </Card>
                )}

                {/* Series Navigation */}
                {book.series && book.series.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <List className="h-5 w-5 text-primary" />
                        Series
                      </CardTitle>
                      <CardDescription>
                        {book.series.length === 1
                          ? `Book ${book.series[0].order} of ${book.series[0].totalBooks} in ${book.series[0].seriesName}`
                          : `Part of ${book.series.length} series`
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {book.series.map((seriesItem) => (
                        <div key={seriesItem.seriesId} className="space-y-4">
                          {/* Series Info */}
                          <div>
                            <h4 className="font-semibold text-sm mb-1">{seriesItem.seriesName}</h4>
                            <p className="text-xs text-muted-foreground">
                              Book {seriesItem.order} of {seriesItem.totalBooks}
                            </p>
                          </div>

                          {/* Navigation Cards */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Previous Book */}
                            {seriesItem.previousBook ? (
                              <Link
                                href={`/books/${seriesItem.previousBook.id}`}
                                className="group"
                              >
                                <div className="p-3 border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                    <ArrowLeft className="h-3 w-3" />
                                    <span>Previous</span>
                                  </div>
                                  <div className="space-y-1">
                                    {seriesItem.previousBook.image && (
                                      <div className="relative w-full aspect-[2/3] max-w-[80px] mx-auto mb-2">
                                        <Image
                                          src={seriesItem.previousBook.image}
                                          alt={seriesItem.previousBook.name}
                                          fill
                                          className="object-cover rounded"
                                        />
                                      </div>
                                    )}
                                    <p className="text-xs font-medium line-clamp-2 leading-tight">
                                      {seriesItem.previousBook.name}
                                    </p>
                                    <div className="flex items-center gap-1">
                                      <BookTypeBadge type={seriesItem.previousBook.type} />
                                      {seriesItem.previousBook.requiresPremium && (
                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            ) : (
                              <div className="p-3 border border-dashed rounded-lg flex items-center justify-center">
                                <p className="text-xs text-muted-foreground">No previous book</p>
                              </div>
                            )}

                            {/* Next Book */}
                            {seriesItem.nextBook ? (
                              <Link
                                href={`/books/${seriesItem.nextBook.id}`}
                                className="group"
                              >
                                <div className="p-3 border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all">
                                  <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground mb-2">
                                    <span>Next</span>
                                    <ArrowLeft className="h-3 w-3 rotate-180" />
                                  </div>
                                  <div className="space-y-1">
                                    {seriesItem.nextBook.image && (
                                      <div className="relative w-full aspect-[2/3] max-w-[80px] mx-auto mb-2">
                                        <Image
                                          src={seriesItem.nextBook.image}
                                          alt={seriesItem.nextBook.name}
                                          fill
                                          className="object-cover rounded"
                                        />
                                      </div>
                                    )}
                                    <p className="text-xs font-medium line-clamp-2 leading-tight">
                                      {seriesItem.nextBook.name}
                                    </p>
                                    <div className="flex items-center gap-1">
                                      <BookTypeBadge type={seriesItem.nextBook.type} />
                                      {seriesItem.nextBook.requiresPremium && (
                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            ) : (
                              <div className="p-3 border border-dashed rounded-lg flex items-center justify-center">
                                <p className="text-xs text-muted-foreground">No next book</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/*/!* Details Tab - All Book Metadata *!/*/}
              {/*<TabsContent value="details" className="mt-6">*/}
              {/*  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">*/}
              {/*    /!* Pricing Information *!/*/}
              {/*    {(book.buyingPrice || book.sellingPrice) && (*/}
              {/*      <Card>*/}
              {/*        <CardHeader>*/}
              {/*          <CardTitle className="text-lg flex items-center gap-2">*/}
              {/*            <DollarSign className="h-5 w-5" />*/}
              {/*            Pricing*/}
              {/*          </CardTitle>*/}
              {/*        </CardHeader>*/}
              {/*        <CardContent className="space-y-4">*/}
              {/*          {book.buyingPrice !== null && book.buyingPrice !== undefined && (*/}
              {/*            <div className="flex items-center justify-between">*/}
              {/*              <span className="text-muted-foreground">Buying Price</span>*/}
              {/*              <span className="font-medium">{formatPrice(book.buyingPrice)}</span>*/}
              {/*            </div>*/}
              {/*          )}*/}
              {/*          {book.sellingPrice !== null && book.sellingPrice !== undefined && (*/}
              {/*            <div className="flex items-center justify-between">*/}
              {/*              <span className="text-muted-foreground">Selling Price</span>*/}
              {/*              <span className="font-medium">{formatPrice(book.sellingPrice)}</span>*/}
              {/*            </div>*/}
              {/*          )}*/}
              {/*        </CardContent>*/}
              {/*      </Card>*/}
              {/*    )}*/}

              {/*    /!* Inventory Information *!/*/}
              {/*    {(book.numberOfCopies !== null && book.numberOfCopies !== undefined) && (*/}
              {/*      <Card>*/}
              {/*        <CardHeader>*/}
              {/*          <CardTitle className="text-lg flex items-center gap-2">*/}
              {/*            <Package className="h-5 w-5" />*/}
              {/*            Inventory*/}
              {/*          </CardTitle>*/}
              {/*        </CardHeader>*/}
              {/*        <CardContent className="space-y-4">*/}
              {/*          <div className="flex items-center justify-between">*/}
              {/*            <span className="text-muted-foreground">Available Copies</span>*/}
              {/*            <span className="font-medium">{book.numberOfCopies}</span>*/}
              {/*          </div>*/}
              {/*        </CardContent>*/}
              {/*      </Card>*/}
              {/*    )}*/}
              {/*  </div>*/}
              {/*</TabsContent>*/}

              {/* Progress Tab */}
              <TabsContent value="progress" className="mt-6">
                {!user ? (
                  // Not authenticated - show login prompt
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Sign In to Track Progress</h3>
                        <p className="text-muted-foreground mb-4">
                          Log in to start reading this book and track your reading progress.
                        </p>
                        <Link href="/auth/sign-in">
                          <Button>
                            Sign In
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ) : book.readingProgress ? (
                  // Authenticated with progress
                  <div className="space-y-6">
                    {/* Circular Progress Bar */}
                    <CircularProgressBar
                      progress={book.readingProgress.progress}
                      currentPage={book.readingProgress.currentPage || undefined}
                      totalPages={book.pageNumber || undefined}
                      isCompleted={book.readingProgress.isCompleted}
                      lastReadAt={book.readingProgress.lastReadAt || undefined}
                    />

                    {/* Loading skeleton for progress charts */}
                    {isPagesReadLoading || isHeatmapLoading ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pages Read Chart Skeleton */}
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                            </div>
                            <div className="space-y-2">
                              <div className="h-32 w-full bg-muted animate-pulse rounded" />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Heatmap Skeleton */}
                        <Card>
                          <CardContent className="p-6">
                            <div className="h-6 w-40 bg-muted animate-pulse rounded mb-4" />
                            <div className="grid grid-cols-7 gap-1">
                              {[...Array(7)].map((_, i) => (
                                <div key={i} className="space-y-1">
                                  {[...Array(4)].map((_, j) => (
                                    <div key={j} className="h-8 w-full bg-muted animate-pulse rounded" />
                                  ))}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <>
                        {/* Reading Activity Chart */}
                        {user && (
                          <PagesReadChart
                            data={pagesReadData?.data || []}
                            title="Reading Activity"
                            period={chartPeriod}
                            onPeriodChange={setChartPeriod}
                          />
                        )}

                        {/* Reading Heatmap */}
                        {user && heatmapData?.data && (
                          <ReadingHeatmap data={heatmapData.data} />
                        )}
                      </>
                    )}

                    {/*<Button onClick={handleReadBook} className="w-full">*/}
                    {/*  {book.readingProgress.isCompleted ? (*/}
                    {/*    <>Read Again</>*/}
                    {/*  ) : (*/}
                    {/*    <>*/}
                    {/*      {isEbook && <Eye className="h-4 w-4 mr-2" />}*/}
                    {/*      {isAudio && <Play className="h-4 w-4 mr-2" />}*/}
                    {/*      Continue {isEbook ? 'Reading' : 'Listening'}*/}
                    {/*    </>*/}
                    {/*  )}*/}
                    {/*</Button>*/}
                  </div>
                ) : (
                  // Authenticated but no progress
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Reading Progress</h3>
                        <p className="text-muted-foreground mb-4">
                          Start reading this book to track your progress.
                        </p>
                        <Button onClick={handleReadBook}>
                          {isEbook ? 'Start Reading' : 'Start Listening'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Related Books Section */}
            {book.relatedBooks && book.relatedBooks.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h2 className="text-xl font-bold mb-6">Related Books</h2>
                <BookGrid
                  books={book.relatedBooks}
                  viewMode="grid"
                  viewMoreHref={(relatedBook) => `/books/${relatedBook.id}`}
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

      {/* Chat with AI Modal */}
      {book && (
        <BookChatModal
          open={isChatModalOpen}
          onOpenChange={setIsChatModalOpen}
          book={book}
        />
      )}

      {/* PDF Reader Modal */}
      {book && book.fileUrl && (
        <PDFReaderModal
          isOpen={isReaderModalOpen}
          onClose={() => setIsReaderModalOpen(false)}
          bookId={bookId}
          fileUrl={book.fileUrl}
          directFileUrl={book.directFileUrl}
          initialPage={book.readingProgress?.currentPage}
        />
      )}
    </div>
  )
}
