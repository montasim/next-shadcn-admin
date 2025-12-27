'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { BookGrid } from '@/components/books/book-grid'
import { BookCardSkeleton } from '@/components/books/book-card-skeleton'
import { SearchBar } from '@/components/books/search-bar'
import { MoodSelector } from '@/components/books/mood-selector'
import { useBooks } from '@/hooks/use-books'
import { useRecentVisits } from '@/hooks/use-recent-visits'
import { useContinueReading } from '@/hooks/use-continue-reading'
import { useMoodRecommendations } from '@/hooks/use-mood-recommendations'
import type { Mood } from '@/components/books/mood-selector'
import Link from 'next/link'
import {
  Grid,
  List,
  SlidersHorizontal,
  X,
  BookOpen,
  Headphones,
  FileText,
  Clock,
  PlayCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { NoticeTicker } from '@/components/notices/notice-ticker'

// Helper function to derive filters from searchParams
function deriveFiltersFromSearchParams(searchParams: ReturnType<typeof useSearchParams>) {
  return {
    search: searchParams?.get('search') || '',
    types: searchParams?.get('types')?.split(',').filter(Boolean) || [],
    categories: searchParams?.get('categories')?.split(',').filter(Boolean) || [],
    author: searchParams?.get('author') || '',
    sortBy: searchParams?.get('sortBy') || 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    premium: 'all' as 'all' | 'free' | 'premium',
    page: 1,
    limit: 12
  }
}

function BooksPageContent({
  initialFilters,
  searchParams,
  user,
}: {
  initialFilters: ReturnType<typeof deriveFiltersFromSearchParams>
  searchParams: ReturnType<typeof useSearchParams>
  user: any
}) {
  const [filters, setFilters] = useState(initialFilters)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)
  const [showMoodPicker, setShowMoodPicker] = useState(false)

  const { data: booksData, isLoading, error, refetch } = useBooks(filters)

  // Fetch continue reading books (only for authenticated users)
  const { data: continueReadingData } = useContinueReading(8)
  const continueReadingBooks = user ? continueReadingData?.books || [] : []

  // Fetch recently visited books (only for authenticated users)
  const { data: recentVisitsData } = useRecentVisits(8)
  const recentBooks = user ? recentVisitsData?.books || [] : []

  // Fetch mood-based recommendations
  const { data: moodData, isLoading: isLoadingMood } = useMoodRecommendations(selectedMood?.id || null, 8)
  const moodBooks = moodData?.books || []

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }))
  }

  const handleSearch = (query: string) => {
    handleFilterChange('search', query)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      types: [],
      categories: [],
      author: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      premium: 'all',
      page: 1,
      limit: 12
    })
  }

  const hasActiveFilters = filters.types.length > 0 || filters.categories.length > 0 || filters.author || filters.premium !== 'all'

  const books = booksData?.books || []
  const pagination = booksData?.pagination

  // Category options for MultiSelect
  const CATEGORY_OPTIONS = [
    { value: 'science-fiction', label: 'Science Fiction' },
    { value: 'romance', label: 'Romance' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'biography', label: 'Biography' },
    { value: 'self-help', label: 'Self-Help' },
    { value: 'business', label: 'Business' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'thriller', label: 'Thriller' },
    { value: 'history', label: 'History' },
    { value: 'cooking', label: 'Cooking' }
  ]

  // Sync filters to URL parameters
  useEffect(() => {
    const params = new URLSearchParams()

    if (filters.search) params.set('search', filters.search)
    if (filters.types.length > 0) params.set('types', filters.types.join(','))
    if (filters.categories.length > 0) params.set('categories', filters.categories.join(','))
    if (filters.author) params.set('author', filters.author)
    if (filters.sortBy !== 'createdAt') params.set('sortBy', filters.sortBy)
    if (filters.sortOrder !== 'desc') params.set('sortOrder', filters.sortOrder)
    if (filters.premium !== 'all') params.set('premium', filters.premium)
    if (filters.page !== 1) params.set('page', filters.page.toString())

    const newUrl = `/books${params.toString() ? '?' + params.toString() : ''}`
    window.history.replaceState(null, '', newUrl)
  }, [filters])

  return (
    <div className="min-h-screen bg-background">
      {/* Notice Ticker */}
      <NoticeTicker />

      <main className="container mx-auto px-4 py-8 pb-24 lg:pb-8">
          {/* Header */}
        <div className="mb-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex lg:items-center justify-between mb-4 gap-6">
            <div>
              <h1 className="text-xl font-bold">Discover Books</h1>
              <p className="text-muted-foreground">
                {booksData?.pagination?.totalBooks || 0} books available
              </p>
            </div>

            {/* Search Bar - Desktop */}
            <div className="flex-1 max-w-md">
              <SearchBar
                onSearch={handleSearch}
                initialValue={filters.search}
                placeholder="Search books by title, author..."
                className="w-full"
              />
            </div>

            {/* Right Side Controls - Desktop Only */}
            <div className="flex items-center gap-3">
              {/* Desktop View Mode Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/*/!* Admin Actions *!/*/}
              {/*{isAdmin && (*/}
              {/*  <div className="flex items-center gap-2">*/}
              {/*    <Link href="/dashboard/books">*/}
              {/*      <Button variant="outline" size="sm">*/}
              {/*        <Settings className="mr-2 h-4 w-4" />*/}
              {/*        Manage Books*/}
              {/*      </Button>*/}
              {/*    </Link>*/}
              {/*    <Link href="/dashboard/books/new">*/}
              {/*      <Button size="sm">*/}
              {/*        <Plus className="mr-2 h-4 w-4" />*/}
              {/*        Add Book*/}
              {/*      </Button>*/}
              {/*    </Link>*/}
              {/*  </div>*/}
              {/*)}*/}
            </div>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden">
            {/* Mobile Controls */}
            <div className="flex items-center justify-between mb-4">
              {/* Left Side - Discover Books Info */}
              <div>
                <h1 className="text-xl font-bold">Discover Books</h1>
                <p className="text-muted-foreground">
                  {booksData?.pagination?.totalBooks || 0} books available
                </p>
              </div>

              {/* Right Side - Mobile Controls */}
              <div className="flex items-center gap-2">
                {/* Mobile Filter Toggle */}
                <Button
                  variant={hasActiveFilters ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {hasActiveFilters && (
                    <span className="ml-1 h-2 w-2 bg-current rounded-full" />
                  )}
                </Button>

                {/* Mobile View Mode Toggle */}
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>

                {/*/!* Mobile Admin Actions *!/*/}
                {/*{isAdmin && (*/}
                {/*  <>*/}
                {/*    <Link href="/dashboard/books">*/}
                {/*      <Button variant="outline" size="sm">*/}
                {/*        <Settings className="h-4 w-4" />*/}
                {/*      </Button>*/}
                {/*    </Link>*/}
                {/*    <Link href="/dashboard/books/new">*/}
                {/*      <Button size="sm">*/}
                {/*        <Plus className="h-4 w-4" />*/}
                {/*      </Button>*/}
                {/*    </Link>*/}
                {/*  </>*/}
                {/*)}*/}
              </div>
            </div>

            {/* Mobile Search Bar - Below Discover Books Section */}
            <div className="w-full mb-6">
              <SearchBar
                onSearch={handleSearch}
                initialValue={filters.search}
                placeholder="Search books, authors, or categories..."
              />
            </div>
          </div>
        </div>

        {/* Mobile Filter Sheet */}
        {isFilterOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsFilterOpen(false)}
            />

            {/* Filter Panel */}
            <div className="relative bg-background w-80 h-full overflow-y-auto animate-in slide-in-from-left">
              <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFilterOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4 space-y-6">
                {/* Book Type Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Book Type</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'EBOOK', label: 'Ebook', icon: FileText },
                      { value: 'AUDIO', label: 'Audiobook', icon: Headphones },
                      { value: 'HARD_COPY', label: 'Hard Copy', icon: BookOpen }
                    ].map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Switch
                          id={`mobile-${type.value}`}
                          checked={filters.types.includes(type.value)}
                          onCheckedChange={(checked) => {
                            const newTypes = checked
                              ? [...filters.types, type.value]
                              : filters.types.filter(t => t !== type.value);
                            handleFilterChange('types', newTypes);
                          }}
                        />
                        <Label htmlFor={`mobile-${type.value}`} className="text-sm flex items-center gap-2 cursor-pointer">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Categories</Label>
                  <MultiSelect
                    options={CATEGORY_OPTIONS}
                    selected={filters.categories}
                    onChange={(values) => handleFilterChange('categories', values)}
                    placeholder="Select categories"
                    maxVisible={3}
                  />
                </div>

                {/* Premium Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Access Level</Label>
                  <Select value={filters.premium} onValueChange={(value) => handleFilterChange('premium', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Books</SelectItem>
                      <SelectItem value="free">Free Books</SelectItem>
                      <SelectItem value="premium">Premium Books</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Options */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Sort By</Label>
                  <div className="space-y-3">
                    <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Latest Added</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="publishedDate">Published Date</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="mobile-sortOrder"
                        checked={filters.sortOrder === 'asc'}
                        onCheckedChange={(checked) =>
                          handleFilterChange('sortOrder', checked ? 'asc' : 'desc')
                        }
                      />
                      <Label htmlFor="mobile-sortOrder" className="text-sm cursor-pointer">
                        Ascending Order
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filters</CardTitle>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto px-2 py-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Book Type Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Book Type</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'EBOOK', label: 'Ebook', icon: FileText },
                      { value: 'AUDIO', label: 'Audiobook', icon: Headphones },
                      { value: 'HARD_COPY', label: 'Hard Copy', icon: BookOpen }
                    ].map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Switch
                          id={type.value}
                          checked={filters.types.includes(type.value)}
                          onCheckedChange={(checked) => {
                            const newTypes = checked
                              ? [...filters.types, type.value]
                              : filters.types.filter(t => t !== type.value);
                            handleFilterChange('types', newTypes);
                          }}
                        />
                        <Label htmlFor={type.value} className="text-sm flex items-center gap-2 cursor-pointer">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Premium Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Access Level</Label>
                  <Select value={filters.premium} onValueChange={(value) => handleFilterChange('premium', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Books</SelectItem>
                      <SelectItem value="free">Free Books</SelectItem>
                      <SelectItem value="premium">Premium Books</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Options */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Sort By</Label>
                  <div className="space-y-3">
                    <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Latest Added</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="publishedDate">Published Date</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sortOrder"
                        checked={filters.sortOrder === 'asc'}
                        onCheckedChange={(checked) =>
                          handleFilterChange('sortOrder', checked ? 'asc' : 'desc')
                        }
                      />
                      <Label htmlFor="sortOrder" className="text-sm cursor-pointer">
                        Ascending Order
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Categories</Label>
                  <MultiSelect
                    options={CATEGORY_OPTIONS}
                    selected={filters.categories}
                    onChange={(values) => handleFilterChange('categories', values)}
                    placeholder="Select categories"
                    maxVisible={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Books Grid */}
          <div className="flex-1">
            {/* Active Filters - Mobile Only */}
            {hasActiveFilters && (
              <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
                {filters.types.map((type) => (
                  <Badge key={type} variant="secondary" className="flex items-center gap-1">
                    Type: {type.replace('_', ' ')}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange('types', filters.types.filter(t => t !== type))}
                    />
                  </Badge>
                ))}
                {filters.categories.map((categoryValue) => {
                  const category = CATEGORY_OPTIONS.find(opt => opt.value === categoryValue)
                  return (
                    <Badge key={categoryValue} variant="secondary" className="flex items-center gap-1">
                      Category: {category?.label || categoryValue}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleFilterChange('categories', filters.categories.filter(c => c !== categoryValue))}
                      />
                    </Badge>
                  )
                })}
                {filters.premium !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filters.premium === 'free' ? 'Free Only' : 'Premium Only'}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange('premium', 'all')}
                    />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"}>
                {[...Array(12)].map((_, i) => (
                  <BookCardSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Unable to load books. Please try again later.
                </p>
                <Button onClick={() => refetch()}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Mood-Based Recommendations Section */}
            <div className="mt-2 mb-4 sm:mt-8 sm:mb-8">
              <Card>
                <CardHeader className="cursor-pointer py-3 sm:py-6 px-4 sm:px-6" onClick={() => setShowMoodPicker(!showMoodPicker)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base sm:text-lg">Recommended for Your Mood</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm">
                      {showMoodPicker ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                {showMoodPicker && (
                  <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {!selectedMood ? (
                      <MoodSelector onSelectMood={setSelectedMood} />
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{selectedMood.emoji}</span>
                            <div>
                              <h3 className="font-semibold">{selectedMood.name} Mood</h3>
                              <p className="text-sm text-muted-foreground">
                                {selectedMood.description}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setSelectedMood(null)}>
                            Change Mood
                          </Button>
                        </div>

                        {isLoadingMood ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                              <BookCardSkeleton key={i} viewMode="grid" />
                            ))}
                          </div>
                        ) : moodBooks.length > 0 ? (
                          <BookGrid
                            books={moodBooks}
                            viewMode={viewMode}
                            viewMoreHref={(book) => `/books/${book.id}`}
                            showTypeBadge={true}
                            showPremiumBadge={true}
                            showCategories={true}
                            showReaderCount={true}
                            showAddToBookshelf={true}
                            showUploader={true}
                            showLockOverlay={true}
                            coverHeight="tall"
                            showProgressActions={true}
                          />
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No books found for this mood. Try another mood!</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Books Display */}
            {!isLoading && !error && (
              <>
                {books.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No books found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your filters or search terms
                    </p>
                    <Button onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <BookGrid
                    books={books}
                    viewMode={viewMode}
                    viewMoreHref={(book) => `/books/${book.id}`}
                    showTypeBadge={true}
                    showPremiumBadge={true}
                    showCategories={true}
                    showReaderCount={true}
                    showAddToBookshelf={true}
                    showUploader={true}
                    showLockOverlay={true}
                    coverHeight="tall"
                    showProgressActions={true}
                  />
                )}
              </>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  disabled={!pagination.hasPreviousPage}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    const isCurrentPage = pageNum === filters.page

                    return (
                      <Button
                        key={pageNum}
                        variant={isCurrentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('page', pageNum)}
                        disabled={isCurrentPage}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}

                  {pagination.totalPages > 5 && (
                    <>
                      <span className="px-2 text-sm text-muted-foreground">...</span>
                      <Button
                        variant={filters.page === pagination.totalPages ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('page', pagination.totalPages)}
                      >
                        {pagination.totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            )}

              {/* Continue Reading Section - For Authenticated Users */}
              {user && continueReadingBooks.length > 0 && (
                  <div className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                              <PlayCircle className="h-5 w-5 text-primary" />
                              <h2 className="text-xl font-semibold">Continue Reading</h2>
                          </div>
                          <Link href="/library?filter=reading">
                              <Button variant="outline" size="sm">
                                  View All
                              </Button>
                          </Link>
                      </div>
                      <BookGrid
                          books={continueReadingBooks}
                          viewMode={viewMode}
                          viewMoreHref={(book) => `/books/${book.id}`}
                          showTypeBadge={true}
                          showPremiumBadge={true}
                          showCategories={true}
                          showReaderCount={true}
                          showAddToBookshelf={true}
                          showUploader={true}
                          showLockOverlay={true}
                          showProgressActions={true}
                          coverHeight="tall"
                      />
                  </div>
              )}

              {/* Recently Visited Section - For Authenticated Users */}
              {user && recentBooks.length > 0 && (
                  <div className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                              <Clock className="h-5 w-5 text-primary" />
                              <h2 className="text-xl font-semibold">Recently Visited</h2>
                          </div>
                          <Link href="/library">
                              <Button variant="outline" size="sm">
                                  View All
                              </Button>
                          </Link>
                      </div>
                      <BookGrid
                          books={recentBooks}
                          viewMode={viewMode}
                          viewMoreHref={(book) => `/books/${book.id}`}
                          showTypeBadge={true}
                          showPremiumBadge={true}
                          showCategories={true}
                          showReaderCount={true}
                          showAddToBookshelf={true}
                          showUploader={true}
                          showLockOverlay={true}
                          coverHeight="tall"
                      />
                  </div>
              )}
          </div>
        </div>
      </main>
    </div>
  )
}

// Wrapper component that resets state when searchParams change
function BooksPageWrapper() {
  const searchParams = useSearchParams()
  const { user } = useAuth()

  // Use a key to force re-mount when URL params change
  const initialFilters = useMemo(() => deriveFiltersFromSearchParams(searchParams), [searchParams])
  const key = useMemo(() => searchParams?.toString() || '', [searchParams])

  return (
    <BooksPageContent
      key={key}
      initialFilters={initialFilters}
      searchParams={searchParams}
      user={user}
    />
  )
}

// Wrapper with Suspense boundary for useSearchParams
export default function BooksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <BooksPageWrapper />
    </Suspense>
  )
}
