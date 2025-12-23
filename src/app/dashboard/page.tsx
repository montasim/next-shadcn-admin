'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from '@/components/ui/progress'
import { Overview } from "@/components/dashboard/overview"
import { RecentSales } from "@/components/dashboard/recent-sales"
import { Header } from "@/components/layout/header"
import { TopNav } from "@/components/layout/top-nav"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { Search } from "@/components/search"
import { ThemeSwitch } from "@/components/theme-switch"
import { Main } from '@/components/ui/main'
import { HeaderContainer } from "@/components/ui/header-container"
import { useAuth } from '@/context/auth-context'
import {
  BookOpen,
  Clock,
  TrendingUp,
  Target,
  Award,
  Library,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { getUserBooks } from '@/app/(user)/library/actions'
import { Book } from '@/app/dashboard/books/data/schema'
import { getProxiedImageUrl } from '@/lib/image-proxy'

interface LibraryStats {
  completedBooks: number
  completedThisMonth: number
  readingTimeHours: number
  currentlyReading: number
  totalPages: number
  totalPagesRead: number
}

// Calculate library statistics from books data
function calculateLibraryStats(books: Book[]): LibraryStats {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const completedBooks = books.filter(book => {
    const progress = book.readingProgress?.[0]?.progress || 0
    return progress >= 95
  })

  const completedThisMonth = completedBooks.filter(book => {
    const lastRead = book.readingProgress?.[0]?.lastReadAt
    return lastRead && new Date(lastRead) >= startOfMonth
  })

  const currentlyReading = books.filter(book => {
    const progress = book.readingProgress?.[0]?.progress || 0
    return progress > 0 && progress < 95
  })

  const totalPages = books.reduce((sum, book) => sum + (book.pageNumber || 0), 0)

  // Calculate reading time based on pages read (2 min per page)
  const totalPagesRead = books.reduce((sum, book) => {
    const currentPage = book.readingProgress?.[0]?.currentPage || 0
    return sum + currentPage
  }, 0)

  const readingTimeMinutes = totalPagesRead * 2
  const readingTimeHours = Math.round(readingTimeMinutes / 60)

  return {
    completedBooks: completedBooks.length,
    completedThisMonth: completedThisMonth.length,
    readingTimeHours,
    currentlyReading: currentlyReading.length,
    totalPages,
    totalPagesRead
  }
}

const adminTopNav = [
  {
    title: 'Overview',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Customers',
    href: 'dashboard/customers',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Products',
    href: 'dashboard/products',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Settings',
    href: 'dashboard/settings',
    isActive: false,
    disabled: true,
  },
]

function AdminDashboard() {
  return (
    <>
      <Header fixed>
        <TopNav links={adminTopNav} />
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <HeaderContainer>
          <div className="flex items-center justify-between w-full">
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <div className="flex items-center space-x-2">
              <Button>Download</Button>
            </div>
          </div>
        </HeaderContainer>

        <Tabs defaultValue="overview" className="space-y-4">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics" disabled>Analytics</TabsTrigger>
              <TabsTrigger value="reports" disabled>Reports</TabsTrigger>
              <TabsTrigger value="notifications" disabled>Notifications</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+2350</div>
                  <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sales</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+12,234</div>
                  <p className="text-xs text-muted-foreground">+19% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+573</div>
                  <p className="text-xs text-muted-foreground">+201 since last hour</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
              <Card className="col-span-1 lg:col-span-4">
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <Overview />
                </CardContent>
              </Card>
              <Card className="col-span-1 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>You made 265 sales this month.</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

function UserDashboard() {
  const [books, setBooks] = useState<Book[]>([])
  const [stats, setStats] = useState<LibraryStats>({
    completedBooks: 0,
    completedThisMonth: 0,
    readingTimeHours: 0,
    currentlyReading: 0,
    totalPages: 0,
    totalPagesRead: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showSummary, setShowSummary] = useState(true) // For mobile summary toggle

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        const userBooks = await getUserBooks()
        setBooks(userBooks)
        setStats(calculateLibraryStats(userBooks))
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Get currently reading books, sorted by most recently read
  const currentlyReadingBooks = books.filter(book => {
    const progress = book.readingProgress?.[0]?.progress || 0
    return progress > 0 && progress < 100
  }).sort((a, b) => {
    const aDate = new Date(a.readingProgress?.[0]?.lastReadAt || 0)
    const bDate = new Date(b.readingProgress?.[0]?.lastReadAt || 0)
    return bDate.getTime() - aDate.getTime()
  })

  // Calculate estimated reading time based on page count (2 min per page)
  function calculateReadingTime(pageCount?: number | null): string | null {
    if (!pageCount || pageCount <= 0) return null
    const minutesPerPage = 2
    const totalMinutes = pageCount * minutesPerPage

    if (totalMinutes < 60) {
      return `${totalMinutes} min read`
    }
    const hours = Math.floor(totalMinutes / 60)
    const remainingMinutes = totalMinutes % 60
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m read`
      : `${hours}h read`
  }

  // Scroll books container helper for mobile navigation
  const scrollBooks = (direction: 'left' | 'right') => {
    const container = document.getElementById('books-scroll-container')
    if (container) {
      const scrollAmount = container.clientWidth * 0.85 // Scroll approximately one card
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <HeaderContainer>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Welcome to Your Library</h1>
              <p className="text-muted-foreground">
                Track your reading journey and discover your next great read.
              </p>
            </div>
            <Link href="/books">
              <Button>
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Books
              </Button>
            </Link>
          </div>
        </HeaderContainer>

        {/* Stats Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-4 w-4 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2" />
                <div className="h-3 bg-muted rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Continue Reading Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Continue Reading</h2>
              <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            </div>
            <Card className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-12 h-16 bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-2 bg-muted rounded w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-16 md:pb-4">
      <HeaderContainer>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Welcome to Your Library</h1>
            <p className="text-muted-foreground">
              Track your reading journey and discover your next great read.
            </p>
          </div>
          <Link href="/books" className='mt-4'>
            <Button>
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Books
            </Button>
          </Link>
        </div>
      </HeaderContainer>

      {/* Mobile Summary Toggle - Only visible on mobile */}
      <div className="flex items-center justify-between md:hidden mb-4">
        <h2 className="text-lg font-semibold">Reading Stats</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSummary(!showSummary)}
        >
          {showSummary ? 'Hide' : 'Show'}
        </Button>
      </div>

      {/* Stats Overview - Hidden on mobile by default, shown when toggled */}
      <div className={`${showSummary ? 'block' : 'hidden'} md:block`}>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Read</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedBooks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedThisMonth > 0 ? `${stats.completedThisMonth} this month` : 'Start reading to track'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.readingTimeHours}h</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPagesRead > 0 ? `${stats.totalPagesRead} pages read` : 'Start reading to track'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Reading</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentlyReading}</div>
            <p className="text-xs text-muted-foreground">
              {stats.currentlyReading > 0 ? 'Books in progress' : 'No books started'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{books.length > 0 ? Math.round((stats.completedBooks / books.length) * 100) : 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedBooks} of {books.length} books completed
            </p>
            <Progress value={books.length > 0 ? (stats.completedBooks / books.length) * 100 : 0} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Two-Column Layout */}
      <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-8">
        {/* Continue Reading - Full width on mobile */}
        <div className="md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Continue Reading</h2>
            <Link href="/library?tab=my-uploads">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {currentlyReadingBooks.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No books in progress</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start reading a book to see it here
                </p>
                <Link href="/library?tab=my-uploads">
                  <Button>Browse Your Books</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile: Horizontal scrolling book cards with navigation */}
              <div className="relative md:hidden">
                {/* Left Navigation */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg bg-background"
                  onClick={() => scrollBooks('left')}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                {/* Scrollable Book Cards Container */}
                <div
                  id="books-scroll-container"
                  className="flex overflow-x-auto gap-4 px-12 snap-x snap-mandatory scrollbar-hide"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {currentlyReadingBooks.map(book => {
                    const progress = Math.round(book.readingProgress?.[0]?.progress || 0)
                    const currentPage = book.readingProgress?.[0]?.currentPage || 0
                    const totalPages = book.pageNumber || '?'
                    const authors = book.authors?.map((a: any) => a.name).join(', ') || 'Unknown'
                    const estimatedReadingTime = calculateReadingTime(book.pageNumber)

                    return (
                      <Card key={book.id} className="min-w-[92vw] snap-center sm:min-w-[320px]">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="w-20 h-28 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                              {book.image ? (
                                <img
                                  src={getProxiedImageUrl(book.image) || book.image}
                                  alt={book.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold line-clamp-2 text-sm">{book.name}</h3>
                              <p className="text-sm text-muted-foreground mb-2 truncate">by {authors}</p>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">Progress</span>
                                <span className="text-xs font-medium">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                <span>Page {currentPage} of {totalPages}</span>
                                {estimatedReadingTime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{estimatedReadingTime}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Right Navigation */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg bg-background"
                  onClick={() => scrollBooks('right')}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Desktop: Original vertical list */}
              <div className="hidden md:block space-y-4">
                {currentlyReadingBooks.slice(0, 3).map(book => {
                  const progress = Math.round(book.readingProgress?.[0]?.progress || 0)
                  const currentPage = book.readingProgress?.[0]?.currentPage || 0
                  const totalPages = book.pageNumber || '?'
                  const authors = book.authors?.map((a: any) => a.name).join(', ') || 'Unknown'
                  const estimatedReadingTime = calculateReadingTime(book.pageNumber)

                  return (
                    <Card key={book.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="w-12 h-16 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                            {book.image ? (
                              <img
                                src={getProxiedImageUrl(book.image) || book.image}
                                alt={book.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <BookOpen className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold line-clamp-1">{book.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">by {authors}</p>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Progress</span>
                              <span className="text-xs">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                              <span>Page {currentPage} of {totalPages}</span>
                              {estimatedReadingTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{estimatedReadingTime}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {currentlyReadingBooks.length > 3 && (
                  <Link href="/library?tab=my-uploads" className="block">
                    <Button variant="outline" className="w-full">
                      View All Books ({currentlyReadingBooks.length})
                    </Button>
                  </Link>
                )}
              </div>
            </>
          )}
        </div>

        {/* Quick Actions - Hide on mobile, show on desktop */}
        <div className="hidden md:block lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/books" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Library className="h-4 w-4 mr-2" />
                Browse Library
              </Button>
            </Link>
            <Link href="/user-shelves" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Award className="h-4 w-4 mr-2" />
                My Bookshelves
              </Button>
            </Link>
            <Link href="/premium" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Star className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            </Link>
          </div>

          {/* Recent Achievement */}
          <div className="mt-6">
            <h3 className="font-medium mb-3">Recent Achievement</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h4 className="font-semibold mb-1">Book Worm</h4>
                  <p className="text-sm text-muted-foreground">
                    Read 5 books this month
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  if (isAdmin) {
    return <AdminDashboard />
  }

  return <UserDashboard />
}
