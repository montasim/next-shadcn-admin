'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useBook } from '@/hooks/use-book'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { addBookToBookshelf, getUserBookshelvesForBook, removeBookFromBookshelf } from '@/app/(user)/library/actions'
import { toast } from '@/hooks/use-toast'
import { PDFReaderModal } from '@/components/reader/pdf-reader-modal'
import {
  BookOpen,
  Headphones,
  FileText,
  Users,
  Clock,
  Bookmark,
  Share2,
  Heart,
  Lock,
  Play,
  ArrowLeft,
  Download,
  Eye,
  Building2,
  Calendar,
  DollarSign,
  Package,
  BookmarkPlus,
  Check,
  Loader2,
  Trash2,
} from 'lucide-react'

export default function BookDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string
  const { user } = useAuth()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [removingFromBookshelf, setRemovingFromBookshelf] = useState<string | null>(null)

  // Bookshelf state
  const [bookshelfOpen, setBookshelfOpen] = useState(false)
  const [bookshelves, setBookshelves] = useState<any[]>([])
  const [loadingBookshelves, setLoadingBookshelves] = useState(false)
  const [addingToBookshelf, setAddingToBookshelf] = useState<string | null>(null)

  // PDF Reader Modal state
  const [isReaderModalOpen, setIsReaderModalOpen] = useState(false)

  // Fetch book details using the dedicated API endpoint
  const { data: responseData, isLoading, error } = useBook({ id: bookId })
  const book = responseData?.data?.book
  const userAccess = responseData?.data?.userAccess

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

  const getTypeIcon = () => {
    switch (book.type) {
      case 'EBOOK': return <FileText className="h-5 w-5" />
      case 'AUDIO': return <Headphones className="h-5 w-5" />
      case 'HARD_COPY': return <BookOpen className="h-5 w-5" />
      default: return <BookOpen className="h-5 w-5" />
    }
  }

  const getTypeLabel = () => {
    switch (book.type) {
      case 'EBOOK': return 'Ebook'
      case 'AUDIO': return 'Audiobook'
      case 'HARD_COPY': return 'Hard Copy'
      default: return 'Book'
    }
  }

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

  // Fetch user's bookshelves when popover opens
  const handleBookshelfOpen = async (open: boolean) => {
    setBookshelfOpen(open)
    if (open && user) {
      setLoadingBookshelves(true)
      try {
        const shelves = await getUserBookshelvesForBook(bookId)
        setBookshelves(shelves)
      } catch (error) {
        console.error('Failed to fetch bookshelves:', error)
      } finally {
        setLoadingBookshelves(false)
      }
    }
  }

  // Add book to bookshelf
  const handleAddToBookshelf = async (bookshelfId: string, bookshelfName: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please login to add books to your library.',
        variant: 'destructive',
      })
      return
    }

    setAddingToBookshelf(bookshelfId)
    try {
      const result = await addBookToBookshelf(bookshelfId, bookId)
      if (result.success) {
        toast({
          title: 'Added to library',
          description: `"${book.name}" has been added to "${bookshelfName}".`,
        })
        // Refresh bookshelves to update hasBook status
        const shelves = await getUserBookshelvesForBook(bookId)
        setBookshelves(shelves)
      } else {
        toast({
          title: 'Failed to add',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Failed to add',
        description: 'An error occurred while adding the book.',
        variant: 'destructive',
      })
    } finally {
      setAddingToBookshelf(null)
    }
  }

  // Remove book from bookshelf
  const handleRemoveFromBookshelf = async (bookshelfId: string, bookshelfName: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please login to manage your library.',
        variant: 'destructive',
      })
      return
    }

    setRemovingFromBookshelf(bookshelfId)
    try {
      const result = await removeBookFromBookshelf(bookshelfId, bookId)
      if (result.success) {
        toast({
          title: 'Removed from library',
          description: `"${book.name}" has been removed from "${bookshelfName}".`,
        })
        // Refresh bookshelves to update hasBook status
        const shelves = await getUserBookshelvesForBook(bookId)
        setBookshelves(shelves)
      } else {
        toast({
          title: 'Failed to remove',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Failed to remove',
        description: 'An error occurred while removing the book.',
        variant: 'destructive',
      })
    } finally {
      setRemovingFromBookshelf(null)
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

  return (
    <div className="min-h-screen bg-background">
      {/* Book Details */}
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/books" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Cover and Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Book Cover */}
              <div className="relative mb-6">
                <div className="aspect-[3/4] overflow-hidden rounded-lg shadow-lg bg-muted">
                  {book.image ? (
                    <img
                      src={getProxiedImageUrl(book.image) || book.image}
                      alt={book.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {getTypeIcon()}
                    </div>
                  )}
                </div>

                {/* Type Badge - Top Left */}
                <div className="absolute top-3 left-3">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs flex items-center gap-1',
                      book.type === 'EBOOK' && 'bg-blue-100 text-blue-800 hover:bg-blue-200',
                      book.type === 'AUDIO' && 'bg-purple-100 text-purple-800 hover:bg-purple-200',
                      book.type === 'HARD_COPY' && 'bg-green-100 text-green-800 hover:bg-green-200'
                    )}
                  >
                    {getTypeIcon()}
                    {getTypeLabel()}
                  </Badge>
                </div>

                {/* Premium Badge - Top Right */}
                {book.requiresPremium && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                      Premium
                    </Badge>
                  </div>
                )}

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
                    <Badge className="bg-primary/90 text-white">
                      {book.readingProgress.isCompleted ? 'Completed' : `${Math.round(book.readingProgress.progress)}%`}
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
                      {isHardCopy && <FileText className="h-4 w-4 mr-2" />}
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

                <div className='flex items-center justify-between gap-4'>
                    {/* Add to Bookshelf Popover */}
                    <Popover open={bookshelfOpen} onOpenChange={handleBookshelfOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <BookmarkPlus className="h-4 w-4 mr-2" />
                                Add to Bookshelf
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="center">
                            <div className="text-sm font-medium mb-2 px-2">Manage Bookshelves</div>
                            <div className="px-2 mb-2">
                                <div className="h-px bg-border" />
                            </div>
                            {loadingBookshelves ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : bookshelves.length === 0 ? (
                                <div className="text-sm text-muted-foreground py-2 px-2">
                                    No bookshelves found. Create one in your library.
                                </div>
                            ) : (
                                <div className="max-h-64 overflow-y-auto">
                                    {bookshelves.map((shelf) => (
                                        <div
                                            key={shelf.id}
                                            className={cn(
                                                'flex items-center justify-between px-2 py-2 rounded-md transition-colors',
                                                shelf.hasBook ? 'bg-accent/50' : 'hover:bg-accent'
                                            )}
                                        >
                                            <span className="text-sm truncate flex-1">{shelf.name}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-2">
                                                {shelf._count.books} {shelf._count.books === 1 ? 'book' : 'books'}
                                                {shelf.hasBook ? (
                                                    <button
                                                        onClick={() => handleRemoveFromBookshelf(shelf.id, shelf.name)}
                                                        disabled={removingFromBookshelf === shelf.id}
                                                        className="ml-2 text-destructive hover:text-destructive/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                                    >
                                                        {removingFromBookshelf === shelf.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Trash2 className="h-3 w-3" />
                                                                Remove
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAddToBookshelf(shelf.id, shelf.name)}
                                                        disabled={addingToBookshelf === shelf.id}
                                                        className="ml-2 text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                                    >
                                                        {addingToBookshelf === shelf.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <BookmarkPlus className="h-3 w-3" />
                                                                Add
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>

                    <Button
                        variant="outline"
                        onClick={handleShare}
                        className="w-full"
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3 text-sm">
                {book.statistics?.totalReaders > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Readers</span>
                    <span className="font-medium flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {book.statistics.totalReaders.toLocaleString()}
                    </span>
                  </div>
                )}
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
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="progress">Your Progress</TabsTrigger>
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
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{book.summary}</p>
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
                              <p className="text-muted-foreground text-sm mt-1 line-clamp-3">
                                {author.description}
                              </p>
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
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Details Tab - All Book Metadata */}
              <TabsContent value="details" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Reading Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reading Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium flex items-center gap-1">
                          {getTypeIcon()}
                          {getTypeLabel()}
                        </span>
                      </div>
                      {book.bindingType && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Binding</span>
                          <span className="font-medium">{book.bindingType === 'HARDCOVER' ? 'Hardcover' : 'Paperback'}</span>
                        </div>
                      )}
                      {book.pageNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Pages</span>
                          <span className="font-medium">{book.pageNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Access</span>
                        <Badge variant={book.canAccess ? 'default' : 'secondary'}>
                          {book.canAccess ? 'Available' : 'Premium Only'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pricing Information */}
                  {(book.buyingPrice || book.sellingPrice) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Pricing
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {book.buyingPrice !== null && book.buyingPrice !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Buying Price</span>
                            <span className="font-medium">{formatPrice(book.buyingPrice)}</span>
                          </div>
                        )}
                        {book.sellingPrice !== null && book.sellingPrice !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Selling Price</span>
                            <span className="font-medium">{formatPrice(book.sellingPrice)}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Inventory Information */}
                  {(book.numberOfCopies !== null && book.numberOfCopies !== undefined) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Inventory
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Available Copies</span>
                          <span className="font-medium">{book.numberOfCopies}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Dates Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Dates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {book.purchaseDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Purchase Date</span>
                          <span className="font-medium">{formatDate(book.purchaseDate)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Entry Date</span>
                        <span className="font-medium">{formatDate(book.entryDate)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Statistics Section */}
                {book.statistics && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Readers</span>
                        <span className="font-medium">{book.statistics.totalReaders.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress" className="mt-6">
                {book.readingProgress ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Reading Progress</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span>{Math.round(book.readingProgress.progress)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${book.readingProgress.progress}%` }}
                            />
                          </div>
                        </div>

                        {book.readingProgress.currentPage && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Current Page</span>
                            <span className="font-medium">{book.readingProgress.currentPage}</span>
                          </div>
                        )}

                        {book.readingProgress.currentEpocha && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Position</span>
                            <span className="font-medium">
                              {Math.floor(book.readingProgress.currentEpocha / 60)}m {Math.floor(book.readingProgress.currentEpocha % 60)}s
                            </span>
                          </div>
                        )}

                        {book.readingProgress.lastReadAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Read</span>
                            <span className="font-medium">
                              {new Date(book.readingProgress.lastReadAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

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
