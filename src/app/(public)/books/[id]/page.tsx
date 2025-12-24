'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  BookOpen,
  Users,
  Share2,
  Lock,
  Play,
  ArrowLeft,
  Eye,
  Building2,
  Calendar,
  CheckCircle,
  User as UserIcon,
} from 'lucide-react'

export default function BookDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState('description')

  // Expand/collapse state for descriptions
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  // PDF Reader Modal state
  const [isReaderModalOpen, setIsReaderModalOpen] = useState(false)

  // Chart period state
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month'>('week')

  // Get user for auth
  const { user } = useAuth()

  // Fetch book details using the dedicated API endpoint
  const { data: responseData, isLoading, error } = useBook({ id: bookId })
  const book = responseData?.data?.book
  const userAccess = responseData?.data?.userAccess

  // Fetcher for SWR
  const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch data')
    const json = await res.json()
    return json
  }

  // Fetch chart data (only if logged in and book is loaded)
  const { data: heatmapData } = useSWR(
    user && book ? `/api/user/progress-history/${bookId}?type=heatmap&days=365` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const { data: pagesReadData } = useSWR(
    user && book ? `/api/user/progress-history/${bookId}?type=pages-per-day&days=${chartPeriod === 'week' ? 7 : 30}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Loading book details...</p>
        </div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Book not found</h2>
          <p className="text-muted-foreground mb-4">
            The book you're looking for doesn't exist or has been removed.
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

  // Reusable expandable description component with MDX support
  const ExpandableDescription = ({
    description,
    sectionId,
  }: {
    description: string
    sectionId: string
  }) => {
    const isExpanded = expandedSections[sectionId]
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
              onClick={() => toggleExpanded(sectionId)}
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
                  onClick={() => toggleExpanded(sectionId)}
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

  return (
    <div className="min-h-screen bg-background">
      {/* Book Details */}
      <div className="container mx-auto px-4 py-8 pb-24 sm:pb-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/books" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Book Cover and Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Book Cover */}
              <div className="relative mb-4 sm:mb-6 max-w-auto mx-auto lg:mx-0">
                <div className="aspect-[3/4] overflow-hidden rounded-lg shadow-lg bg-muted">
                  {book.image ? (
                    <img
                      src={getProxiedImageUrl(book.image) || book.image}
                      alt={book.name}
                      className="w-full h-full object-cover"
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
                {!book.canAccess && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-center text-white p-4">
                      <Lock className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-semibold">Premium Content</p>
                    </div>
                  </div>
                )}

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
                  disabled={!book.canAccess}
                >
                  {book.canAccess ? (
                    <>
                      {isEbook && <Eye className="h-4 w-4 mr-2" />}
                      {isAudio && <Play className="h-4 w-4 mr-2" />}
                      {isHardCopy && <BookOpen className="h-4 w-4 mr-2" />}
                      {isEbook && 'Read Now'}
                      {isAudio && 'Listen Now'}
                      {isHardCopy && 'View Details'}
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Upgrade to Read
                    </>
                  )}
                </Button>

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
              <h1 className="text-xl lg:text-2xl font-bold mb-2">{book.name}</h1>

              {/* Authors */}
              {book.authors && book.authors.length > 0 && (
                <div className="mb-4">
                  <p className="text-lg text-muted-foreground">
                    by{' '}
                    {book.authors.map((author, index) => (
                      <span key={author.id}>
                        <Link href={`/authors/${author.id}`} className="hover:text-primary transition-colors font-medium">
                          {author.name}
                        </Link>
                        {index < book.authors!.length - 1 && ', '}
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {/* Added by user */}
              {book.entryBy && (
                <div className="flex items-center gap-3 mb-4">
                  <Link href={`/users/${book.entryBy.id}`} className="flex items-center gap-3 group">
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
                    <Link key={category.id} href={`/books?category=${category.name.toLowerCase()}`}>
                      <Badge variant="outline" className="hover:bg-primary/10 cursor-pointer">
                        {category.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Information Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                {/*<TabsTrigger value="details">Details</TabsTrigger>*/}
                <TabsTrigger value="progress">My Progress</TabsTrigger>
              </TabsList>

              {/* Description Tab - Book Description and Author Info */}
              <TabsContent value="description" className="mt-4 space-y-4">
                {/* Book Summary/Description */}
                {book.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">About This Book</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ExpandableDescription description={book.summary} sectionId="book-summary" />
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
                              <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                                {author.name}
                              </h3>
                            </Link>
                            {author.description && (
                              <div className="text-muted-foreground mt-1">
                                <ExpandableDescription description={author.description} sectionId={`author-${author.id}`} />
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
                          <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {publication.image ? (
                              <img
                                src={getProxiedImageUrl(publication.image) || publication.image}
                                alt={publication.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Building2 className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-primary">
                              {publication.name}
                            </h3>
                            {publication.description && (
                              <div className="text-muted-foreground mt-1">
                                <ExpandableDescription description={publication.description} sectionId={`publication-${publication.id}`} />
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
                {book.readingProgress ? (
                  <div className="space-y-6">
                    {/* Circular Progress Bar */}
                    <CircularProgressBar
                      progress={book.readingProgress.progress}
                      currentPage={book.readingProgress.currentPage || undefined}
                      totalPages={book.pageNumber || undefined}
                      isCompleted={book.readingProgress.isCompleted}
                      lastReadAt={book.readingProgress.lastReadAt || undefined}
                    />

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
          </div>
        </div>
      </div>

      {/* PDF Reader Modal */}
      {book && book.fileUrl && (
        <PDFReaderModal
          isOpen={isReaderModalOpen}
          onClose={() => setIsReaderModalOpen(false)}
          bookId={bookId}
          fileUrl={book.fileUrl}
          initialPage={book.readingProgress?.currentPage}
        />
      )}
    </div>
  )
}
