'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Overview } from "@/components/dashboard/overview"
import { DashboardSummary } from "@/components/dashboard/dashboard-summary"
import { DashboardSummarySkeleton } from "@/components/dashboard/dashboard-summary-skeleton"
import { HeaderContainer } from "@/components/ui/header-container"
import { useAuth } from '@/context/auth-context'
import {
  getAdminDashboardStats,
  getUserDashboardStats,
  getAnalyticsData,
  getReportData,
  getNotificationData,
  getRecentActivity,
} from './actions'
import type {
  AdminDashboardStats,
  UserDashboardStats,
  RecentActivity,
  AnalyticsData,
  ReportData,
  NotificationData
} from './actions'
import { BookOpen, Clock, TrendingUp, Award, Library, Star, Loader2, ChevronLeft, ChevronRight, Users, BookText, MessageSquare, AlertCircle, BarChart3, FileText, Bell } from 'lucide-react'
import { getUserBooks } from '@/app/(user)/library/actions'
import { Book } from '@/app/dashboard/books/data/schema'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { calculateReadingTime } from '@/lib/utils/reading-time'
import { ROUTES } from '@/lib/routes/client-routes'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function AdminDashboard() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null)

  // Tab-specific loading states
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        const [statsData, activityData] = await Promise.all([
          getAdminDashboardStats(),
          getRecentActivity(8),
        ])
        setStats(statsData)
        setRecentActivity(activityData)
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Fetch data for other tabs when they become active
  useEffect(() => {
    const fetchTabData = async () => {
      if (activeTab === 'analytics' && !analyticsData) {
        setIsLoadingAnalytics(true)
        try {
          const data = await getAnalyticsData()
          setAnalyticsData(data)
        } catch (error) {
          console.error('Error fetching analytics data:', error)
        } finally {
          setIsLoadingAnalytics(false)
        }
      } else if (activeTab === 'reports' && !reportData) {
        setIsLoadingReports(true)
        try {
          const data = await getReportData()
          setReportData(data)
        } catch (error) {
          console.error('Error fetching report data:', error)
        } finally {
          setIsLoadingReports(false)
        }
      } else if (activeTab === 'notifications' && !notificationData) {
        setIsLoadingNotifications(true)
        try {
          const data = await getNotificationData()
          setNotificationData(data)
        } catch (error) {
          console.error('Error fetching notification data:', error)
        } finally {
          setIsLoadingNotifications(false)
        }
      }
    }

    fetchTabData()
  }, [activeTab, analyticsData, reportData, notificationData])

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>

          {/* Stats Skeleton */}
          <DashboardSummarySkeleton count={4} />

          {/* Overview and Recent Sales Skeleton */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4">
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="pl-2">
                {/* Chart skeleton */}
                <div className="space-y-4">
                  <div className="flex items-end gap-2 h-48">
                    {[...Array(12)].map((_, i) => (
                      <Skeleton key={i} className="flex-1" style={{ height: `${Math.random() * 60 + 40}%` }} />
                    ))}
                  </div>
                  {/* X-axis labels */}
                  <div className="flex justify-between px-2">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-3 w-12" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3">
              <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-4 w-16" />
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

  return (
    <div className="space-y-4 overflow-y-auto pb-4">
      <HeaderContainer>
        <div className="flex items-center justify-between w-full">
          <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Button>Download</Button>
          </div>
        </div>
      </HeaderContainer>

      <Tabs value={activeTab}>
        <div className="w-full overflow-x-auto">
          <TabsList>
            <Link href="/dashboard?tab=overview">
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </Link>
            <Link href="/dashboard?tab=analytics">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </Link>
            <Link href="/dashboard?tab=reports">
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </Link>
            <Link href="/dashboard?tab=notifications">
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </Link>
          </TabsList>
        </div>
        <TabsContent value="overview" className="space-y-4">
          <DashboardSummary
            summaries={stats ? [
              {
                title: 'Total Books',
                value: stats.totalBooks,
                description: `${stats.booksThisMonth} added this month`,
                icon: BookText,
              },
              {
                title: 'Total Users',
                value: stats.totalUsers,
                description: `${stats.usersThisMonth} joined this month`,
                icon: Users,
              },
              {
                title: 'Total Views',
                value: stats.totalViews.toLocaleString(),
                description: `${stats.viewsThisMonth} this month`,
                icon: TrendingUp,
              },
              {
                title: 'Active Loans',
                value: stats.activeLoans,
                description: stats.overdueLoans > 0 ? `${stats.overdueLoans} overdue` : 'All on time',
                icon: BookOpen,
              },
            ] : []}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4">
              <CardHeader>
                <CardTitle>Content Overview</CardTitle>
                <CardDescription>
                  {stats && `${stats.publicBooks} public books • ${stats.premiumBooks} premium books`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4">
                      <Avatar className="h-9 w-9">
                        {activity.user?.avatar ? (
                          <AvatarImage src={getProxiedImageUrl(activity.user.avatar) || activity.user.avatar} alt={activity.user.name} />
                        ) : (
                          <AvatarFallback>
                            {activity.user?.name?.[0] || activity.type[0]}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentActivity.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {isLoadingAnalytics ? (
            <>
              <DashboardSummarySkeleton count={4} />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <Skeleton className="h-5 w-8 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <Skeleton className="h-5 w-8 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              <DashboardSummary
                summaries={analyticsData ? [
              {
                title: 'Total Views',
                value: analyticsData.totalViews.toLocaleString(),
                description: 'Last 30 days',
                icon: TrendingUp,
              },
              {
                title: 'Unique Visitors',
                value: analyticsData.uniqueVisitors,
                description: 'Distinct users',
                icon: Users,
              },
              {
                title: 'Active Readers',
                value: analyticsData.userEngagement.activeReaders,
                description: 'Currently reading',
                icon: BookOpen,
              },
              {
                title: 'Books Completed',
                value: analyticsData.userEngagement.totalBooksCompleted,
                description: 'Finished reading',
                icon: Award,
              },
            ] : []}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Top Books */}
            <Card>
              <CardHeader>
                <CardTitle>Top Viewed Books</CardTitle>
                <CardDescription>Most popular books in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.topBooks.map((book, i) => (
                    <div key={book.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium">{book.name}</p>
                          <p className="text-sm text-muted-foreground">{book.views} views</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!analyticsData?.topBooks.length && (
                    <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
                <CardDescription>Most viewed categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.topCategories.map((cat, i) => (
                    <div key={cat.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-sm text-muted-foreground">{cat.views} views</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!analyticsData?.topCategories.length && (
                    <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
            </>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {isLoadingReports ? (
            <>
              <DashboardSummarySkeleton count={4} />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <DashboardSummary
                summaries={reportData ? [
              {
                title: 'Total Books',
                value: reportData.systemHealth.totalBooks,
                description: 'In library',
                icon: BookText,
              },
              {
                title: 'Total Users',
                value: reportData.systemHealth.totalUsers,
                description: 'Registered users',
                icon: Users,
              },
              {
                title: 'Total Loans',
                value: reportData.systemHealth.totalLoans,
                description: 'Active and historical',
                icon: BookOpen,
              },
              {
                title: 'System Health',
                value: 'Good',
                description: 'All systems operational',
                icon: TrendingUp,
              },
            ] : []}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Books by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Books by Type</CardTitle>
                <CardDescription>Distribution of book formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData?.booksByType.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <span className="font-medium">{item.type}</span>
                      <span className="text-sm text-muted-foreground">{item.count} books</span>
                    </div>
                  ))}
                  {!reportData?.booksByType.length && (
                    <p className="text-sm text-muted-foreground text-center py-4">No books yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Loans by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Loans by Status</CardTitle>
                <CardDescription>Current lending status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData?.loansByStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <span className="font-medium">{item.status}</span>
                      <span className="text-sm text-muted-foreground">{item.count} loans</span>
                    </div>
                  ))}
                  {!reportData?.loansByStatus.length && (
                    <p className="text-sm text-muted-foreground text-center py-4">No loans yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent User Activity</CardTitle>
              <CardDescription>Actions from the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData?.userActivity.slice(0, 10).map((item) => (
                  <div key={item.action} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm font-medium">{item.action.replace(/_/g, ' ')}</span>
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                  </div>
                ))}
                {!reportData?.userActivity.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
                )}
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          {isLoadingNotifications ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64 mt-2" />
                </div>
              </div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Notifications</h2>
                  <p className="text-muted-foreground">
                    {notificationData && `${notificationData.unread} unread notifications`}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
            {notificationData?.notifications.map((notification) => {
              const borderColors = {
                error: 'border-destructive',
                warning: 'border-orange-500',
                success: 'border-green-500',
                info: '',
              }
              const iconColors = {
                error: 'bg-destructive/10 text-destructive',
                warning: 'bg-orange-500/10 text-orange-500',
                success: 'bg-green-500/10 text-green-500',
                info: 'bg-blue-500/10 text-blue-500',
              }

              return (
                <Card key={notification.id} className={borderColors[notification.type]}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${iconColors[notification.type]}`}>
                        {notification.type === 'error' && <AlertCircle className="h-5 w-5" />}
                        {notification.type === 'warning' && <AlertCircle className="h-5 w-5" />}
                        {notification.type === 'success' && <Award className="h-5 w-5" />}
                        {notification.type === 'info' && <Bell className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {!notificationData?.notifications.length && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    You&apos;re all caught up!
                  </p>
                </CardContent>
              </Card>
            )}
                </div>
              </>
            )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function UserDashboard() {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [stats, setStats] = useState<UserDashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSummary, setShowSummary] = useState(true) // For mobile summary toggle

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return

      setIsLoading(true)
      try {
        const [userBooks, userStats] = await Promise.all([
          getUserBooks(),
          getUserDashboardStats(user.id),
        ])
        setBooks(userBooks)
        setStats(userStats)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.id])

  // Get currently reading books, sorted by most recently read
  const currentlyReadingBooks = books.filter(book => {
    const progress = book.readingProgress?.[0]?.progress || 0
    return progress > 0 && progress < 100
  }).sort((a, b) => {
    const aDate = new Date(a.readingProgress?.[0]?.lastReadAt || 0)
    const bDate = new Date(b.readingProgress?.[0]?.lastReadAt || 0)
    return bDate.getTime() - aDate.getTime()
  })

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
            <Link href={ROUTES.books.href}>
              <Button>
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Books
              </Button>
            </Link>
          </div>
        </HeaderContainer>

        {/* Stats Skeleton */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    <div className="space-y-4">
      <HeaderContainer>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Welcome to Your Library</h1>
            <p className="text-muted-foreground">
              Track your reading journey and discover your next great read.
            </p>
          </div>
          <Link href={ROUTES.books.href} className='mt-4'>
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
        <DashboardSummary
          summaries={stats ? [
            {
              title: 'Books Read',
              value: stats.booksRead,
              description: 'Completed books',
              icon: BookOpen,
            },
            {
              title: 'Reading Time',
              value: `${stats.totalReadingTime}h`,
              description: stats.totalPagesRead > 0 ? `${stats.totalPagesRead} pages read` : 'Start reading to track',
              icon: Clock,
            },
            {
              title: 'Currently Reading',
              value: stats.currentlyReading,
              description: stats.currentlyReading > 0 ? 'Books in progress' : 'No books started',
              icon: TrendingUp,
            },
            {
              title: 'Achievements',
              value: stats.achievements,
              description: 'Unlocked achievements',
              icon: Award,
            },
          ] : []}
        />
      </div>

      {/* Two-Column Layout */}
      <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
        {/* Continue Reading - Full width on mobile */}
        <div className="md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Continue Reading</h2>
            <Link href={`${ROUTES.library.href}?tab=my-uploads`}>
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
                <Link href={`${ROUTES.library.href}?tab=my-uploads`}>
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
                            <div className="w-20 h-28 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                              {book.image ? (
                                <Image
                                  src={getProxiedImageUrl(book.image) || book.image}
                                  alt={book.name}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                  unoptimized
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
                          <div className="w-12 h-16 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                            {book.image ? (
                              <Image
                                src={getProxiedImageUrl(book.image) || book.image}
                                alt={book.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                                unoptimized
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
                  <Link href={`${ROUTES.library.href}?tab=my-uploads`} className="block">
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
            <Link href={ROUTES.books.href} className="block">
              <Button variant="outline" className="w-full justify-start">
                <Library className="h-4 w-4 mr-2" />
                Browse Library
              </Button>
            </Link>
            <Link href={ROUTES.library.href} className="block">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                My Library
              </Button>
            </Link>
            {stats && stats.borrowedBooks > 0 && (
              <Link href="/dashboard/borrowed-books" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BookText className="h-4 w-4 mr-2" />
                  Borrowed Books ({stats.borrowedBooks})
                </Button>
              </Link>
            )}
            <Link href={ROUTES.premium.href} className="block">
              <Button variant="outline" className="w-full justify-start">
                <Star className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            </Link>
          </div>

          {/* Borrowed Books Alert */}
          {stats && stats.borrowedBooks > 0 && (
            <div className="mt-4">
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">You have {stats.borrowedBooks} borrowed book(s)</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Keep track of your borrowed books
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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

  // If no user, show loading while redirecting
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

  if (isAdmin) {
    return <AdminDashboard />
  }

  return <UserDashboard />
}
