'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardSummarySkeleton } from '@/components/data-table/table-skeleton'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import {
    ShoppingBag,
    TrendingUp,
    Users,
    MessageSquare,
    Star,
    ArrowRight,
    Loader2,
    Package,
    DollarSign,
    Activity,
    BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes/client-routes'

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
    }
}

interface AnalyticsResponse {
    success: boolean
    data: AnalyticsData
    message?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdminMarketplacePage() {
    const { user } = useAuth()
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

    useEffect(() => {
        const fetchAnalytics = async () => {
            setIsLoading(true)
            try {
                const response = await fetch('/api/admin/marketplace/analytics')
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
    }, [])

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

    return (
        <DashboardPage
            icon={ShoppingBag}
            title="Marketplace Overview"
            description="Monitor and manage the peer-to-peer book marketplace"
        >
            {isLoading ? (
                <>
                    {/* All Stats Skeleton */}
                    <DashboardSummarySkeleton count={7} />

                    {/* Activity Stats Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-5 w-12" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-28" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-5 w-12" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Links Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Card key={i}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-lg" />
                                                <div className="flex-1">
                                                    <Skeleton className="h-5 w-24 mb-2" />
                                                    <Skeleton className="h-4 w-32" />
                                                </div>
                                                <Skeleton className="h-4 w-4" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : analytics && (
                <>
                    {/* All Stats */}
                    <DashboardSummary
                        summaries={[
                            {
                                title: 'Active Listings',
                                value: analytics.overview.activePosts.toString(),
                                description: `${analytics.overview.totalPosts} total listings`,
                                icon: ShoppingBag,
                            },
                            {
                                title: 'Items Sold',
                                value: analytics.overview.soldPosts.toString(),
                                description: analytics.activitySummary.sales.thisWeek > 0
                                    ? `+${analytics.activitySummary.sales.thisWeek} this week`
                                    : 'No sales this week',
                                icon: Package,
                            },
                            {
                                title: 'Total Value',
                                value: `$${analytics.overview.totalValue.toLocaleString()}`,
                                description: 'Across all listings',
                                icon: DollarSign,
                            },
                            {
                                title: 'Avg Rating',
                                value: analytics.overview.averageRating.toFixed(1),
                                description: `${analytics.overview.totalReviews} reviews`,
                                icon: Star,
                            },
                            {
                                title: 'Total Offers',
                                value: analytics.overview.totalOffers.toString(),
                                description: `${analytics.overview.acceptedOffers} accepted (${analytics.overview.totalOffers > 0
                                    ? Math.round((analytics.overview.acceptedOffers / analytics.overview.totalOffers) * 100)
                                    : 0}%)`,
                                icon: TrendingUp,
                            },
                            {
                                title: 'Conversations',
                                value: analytics.overview.totalConversations.toString(),
                                description: 'Between buyers and sellers',
                                icon: MessageSquare,
                            },
                            {
                                title: 'Active Users',
                                value: (analytics.activitySummary as any).users?.activeThisWeek?.toString() ?? '-',
                                description: 'Active this week',
                                icon: Users,
                            },
                        ]}
                    />

                    {/* Activity Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <CollapsibleSection title="Listing Activity" icon={BarChart3}>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Today</span>
                                    <span className="font-semibold">{analytics.activitySummary.posts.today}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">This Week</span>
                                    <span className="font-semibold">{analytics.activitySummary.posts.thisWeek}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">This Month</span>
                                    <span className="font-semibold">{analytics.activitySummary.posts.thisMonth}</span>
                                </div>
                            </div>
                        </CollapsibleSection>

                        <CollapsibleSection title="Sales Activity" icon={Activity}>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Today</span>
                                    <span className="font-semibold">{analytics.activitySummary.sales.today}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">This Week</span>
                                    <span className="font-semibold">{analytics.activitySummary.sales.thisWeek}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">This Month</span>
                                    <span className="font-semibold">{analytics.activitySummary.sales.thisMonth}</span>
                                </div>
                            </div>
                        </CollapsibleSection>
                    </div>

                    {/* Quick Links */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Marketplace Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link href={ROUTES.marketplacePosts.href}>
                                    <Card className="transition-all hover:shadow-md hover:border-primary cursor-pointer">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                    <ShoppingBag className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">Sell Posts</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Manage listings
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>

                                <Link href={ROUTES.marketplaceConversations.href}>
                                    <Card className="transition-all hover:shadow-md hover:border-primary cursor-pointer">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                    <MessageSquare className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">Conversations</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Monitor messages
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>

                                <Link href={ROUTES.marketplaceAnalytics.href}>
                                    <Card className="transition-all hover:shadow-md hover:border-primary cursor-pointer">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                    <Activity className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">Analytics</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        View detailed stats
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </DashboardPage>
    )
}
