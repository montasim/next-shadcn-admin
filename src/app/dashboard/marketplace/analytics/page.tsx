'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardSummarySkeleton } from '@/components/data-table/table-skeleton'
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
} from 'recharts'
import {
    Activity,
    TrendingUp,
    DollarSign,
    Star,
    Loader2,
    ShoppingBag,
    Users,
    MessageSquare,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface AnalyticsData {
    overview: {
        totalPosts: number
        activePosts: number
        soldPosts: number
        totalValue: number
        totalOffers: number
        acceptedOffers: number
        totalConversations: number
        totalReviews: number
        averageRating: number
    }
    postsOverTime: Array<{ createdAt: Date; _count: { id: number } }>
    salesOverTime: Array<{ soldAt: Date; _count: { id: number }; _sum: { price: number | null } }>
    topSellers: Array<{
        sellerId: string
        _count: { id: number }
        _sum: { price: number | null }
        user?: {
            id: string
            name: string
            firstName?: string | null
            lastName?: string | null
            avatar?: string | null
            directAvatarUrl?: any
        }
    }>
    activitySummary: {
        posts: {
            today: number
            thisWeek: number
            thisMonth: number
        }
        sales: {
            today: number
            thisWeek: number
            thisMonth: number
        }
        users: {
            newToday: number
            activeThisWeek: number
        }
    }
}

interface AnalyticsResponse {
    success: boolean
    data: AnalyticsData
    message?: string
}

type DateRange = '7d' | '30d' | '90d'

// ============================================================================
// COMPONENTS
// ============================================================================

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-sm">
                <p className="font-medium">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

// ============================================================================
// PAGE
// ============================================================================

export default function AdminMarketplaceAnalyticsPage() {
    const { user } = useAuth()
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [dateRange, setDateRange] = useState<DateRange>('30d')

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!isAdmin) return

            setIsLoading(true)
            try {
                const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30
                const response = await fetch(`/api/admin/marketplace/analytics?days=${days}`)
                const result: AnalyticsResponse = await response.json()

                if (result.success) {
                    setAnalytics(result.data)
                }
            } catch (error) {
                console.error('Failed to fetch analytics:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAnalytics()
    }, [isAdmin, dateRange])

    // Format posts over time data for chart
    const formatPostsData = () => {
        if (!analytics?.postsOverTime) return []

        return analytics.postsOverTime.map((item) => {
            const date = new Date(item.createdAt)
            return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                posts: item._count.id,
            }
        })
    }

    // Format sales over time data for chart
    const formatSalesData = () => {
        if (!analytics?.salesOverTime) return []

        return analytics.salesOverTime.map((item) => {
            const date = new Date(item.soldAt)
            return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                sales: item._count.id,
                revenue: item._sum.price || 0,
            }
        })
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="max-w-md">
                    <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">Admin access required</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (isLoading || !analytics) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const postsData = formatPostsData()
    const salesData = formatSalesData()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Marketplace Analytics</h1>
                    <p className="text-muted-foreground">
                        Detailed marketplace metrics and trends
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={dateRange === '7d' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDateRange('7d')}
                    >
                        7 Days
                    </Button>
                    <Button
                        variant={dateRange === '30d' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDateRange('30d')}
                    >
                        30 Days
                    </Button>
                    <Button
                        variant={dateRange === '90d' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDateRange('90d')}
                    >
                        90 Days
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Listings
                        </CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.overview.activePosts}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.overview.totalPosts} total listings
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Items Sold
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.overview.soldPosts}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.activitySummary.sales.thisWeek > 0 && (
                                <span className="text-green-600">
                                    +{analytics.activitySummary.sales.thisWeek} this week
                                </span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${analytics.overview.totalValue.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Across active listings
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Avg Rating
                        </CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {analytics.overview.averageRating.toFixed(1)}
                            <span className="text-sm text-muted-foreground">/5</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.overview.totalReviews} reviews
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Offers
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.overview.totalOffers}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.overview.acceptedOffers} accepted (
                            {analytics.overview.totalOffers > 0
                                ? Math.round((analytics.overview.acceptedOffers / analytics.overview.totalOffers) * 100)
                                : 0}
                            %)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Conversations
                        </CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.overview.totalConversations}</div>
                        <p className="text-xs text-muted-foreground">
                            Between buyers and sellers
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.activitySummary.users.activeThisWeek}</div>
                        <p className="text-xs text-muted-foreground">
                            Active this week
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Posts Over Time */}
                <Card>
                    <CardHeader>
                        <CardTitle>Posts Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {postsData.length === 0 ? (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                                No data yet
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={postsData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="posts"
                                        stroke="hsl(var(--primary))"
                                        fill="hsl(var(--primary))"
                                        fillOpacity={0.2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Sales Over Time */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sales & Revenue Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {salesData.length === 0 ? (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                                No data yet
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={salesData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="sales" fill="hsl(var(--primary))" name="Sales" />
                                    <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" name="Revenue ($)" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top Sellers */}
            {analytics.topSellers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Top Sellers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics.topSellers.slice(0, 10).map((seller, index) => (
                                <div key={seller.sellerId} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-semibold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {seller.user?.firstName && seller.user?.lastName
                                                    ? `${seller.user.firstName} ${seller.user.lastName}`
                                                    : seller.user?.name || 'Unknown'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {seller._count.id} items sold
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-primary">
                                            ${seller._sum.price?.toLocaleString() || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground">total value</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
