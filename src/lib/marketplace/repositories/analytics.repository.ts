/**
 * Marketplace Analytics Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all analytics operations for the marketplace
 */

import { prisma } from '@/lib/prisma'
import { SellPostStatus, BookCondition } from '@prisma/client'

// ============================================================================
// SELL POST VIEWS
// ============================================================================

/**
 * Record a sell post view
 */
export async function recordSellPostView(data: {
    sellPostId: string
    userId?: string
    sessionId?: string
    ip?: string
    userAgent?: string
    referrer?: string
}) {
    return prisma.sellPostView.create({
        data: {
            sellPostId: data.sellPostId,
            userId: data.userId,
            sessionId: data.sessionId,
            ip: data.ip,
            userAgent: data.userAgent,
            referrer: data.referrer,
        }
    })
}

/**
 * Get sell post views over time
 */
export async function getSellPostViewsOverTime(
    sellPostId: string,
    days = 30
) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const views = await prisma.sellPostView.groupBy({
        by: ['visitedAt'],
        where: {
            sellPostId,
            visitedAt: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { visitedAt: 'asc' }
    })

    return views
}

/**
 * Get unique visitors count for a sell post
 */
export async function getSellPostUniqueVisitors(sellPostId: string) {
    const [totalUnique, loggedInUnique] = await Promise.all([
        prisma.sellPostView.groupBy({
            by: ['ip'],
            where: { sellPostId },
            _count: { id: true }
        }),
        prisma.sellPostView.groupBy({
            by: ['userId'],
            where: {
                sellPostId,
                userId: { not: null }
            },
            _count: { id: true }
        })
    ])

    return {
        totalUnique: totalUnique.length,
        loggedInUnique: loggedInUnique.length
    }
}

// ============================================================================
// MARKETPLACE STATS
// ============================================================================

/**
 * Get overall marketplace statistics
 */
export async function getMarketplaceStats() {
    const [
        totalPosts,
        activePosts,
        soldPosts,
        totalValue,
        totalOffers,
        acceptedOffers,
        totalConversations,
        totalReviews,
        averageRating
    ] = await Promise.all([
        prisma.bookSellPost.count(),
        prisma.bookSellPost.count({
            where: { status: SellPostStatus.AVAILABLE }
        }),
        prisma.bookSellPost.count({
            where: { status: SellPostStatus.SOLD }
        }),
        prisma.bookSellPost.aggregate({
            where: { status: SellPostStatus.AVAILABLE },
            _sum: { price: true }
        }),
        prisma.bookOffer.count(),
        prisma.bookOffer.count({
            where: { status: 'ACCEPTED' }
        }),
        prisma.conversation.count(),
        prisma.sellerReview.count(),
        prisma.sellerReview.aggregate({
            _avg: { rating: true }
        })
    ])

    return {
        totalPosts,
        activePosts,
        soldPosts,
        totalValue: totalValue._sum.price || 0,
        totalOffers,
        acceptedOffers,
        totalConversations,
        totalReviews,
        averageRating: averageRating._avg.rating || 0
    }
}

/**
 * Get posts by condition distribution
 */
export async function getPostsByConditionDistribution() {
    const distribution = await prisma.bookSellPost.groupBy({
        by: ['condition'],
        where: {
            status: { in: [SellPostStatus.AVAILABLE, SellPostStatus.SOLD] }
        },
        _count: { id: true }
    })

    return distribution.map(d => ({
        condition: d.condition,
        count: d._count.id
    }))
}

/**
 * Get posts created over time
 */
export async function getPostsOverTime(days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const posts = await prisma.bookSellPost.groupBy({
        by: ['createdAt'],
        where: {
            createdAt: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
    })

    return posts
}

/**
 * Get sales over time
 */
export async function getSalesOverTime(days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const sales = await prisma.bookSellPost.groupBy({
        by: ['soldAt'],
        where: {
            soldAt: { gte: startDate },
            status: SellPostStatus.SOLD
        },
        _count: { id: true },
        _sum: { price: true },
        orderBy: { soldAt: 'asc' }
    })

    return sales
}

/**
 * Get top sellers by number of sales
 */
export async function getTopSellers(limit = 10) {
    const sellers = await prisma.bookSellPost.groupBy({
        by: ['sellerId'],
        where: { status: SellPostStatus.SOLD },
        _count: { id: true },
        _sum: { price: true },
        orderBy: {
            _count: { id: 'desc' }
        },
        take: limit
    })

    // Get user details for each seller
    const sellerIds = sellers.map(s => s.sellerId)
    const users = await prisma.user.findMany({
        where: { id: { in: sellerIds } },
        select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatar: true,
            directAvatarUrl: true,
        }
    })

    return sellers.map(seller => ({
        ...seller,
        user: users.find(u => u.id === seller.sellerId)
    }))
}

// ============================================================================
// SELLER ANALYTICS
// ============================================================================

/**
 * Get seller's marketplace analytics
 */
export async function getSellerAnalytics(sellerId: string) {
    const [
        totalPosts,
        activePosts,
        soldPosts,
        pendingPosts,
        totalViews,
        totalOffers,
        totalConversations,
        totalReviews,
        avgRating
    ] = await Promise.all([
        prisma.bookSellPost.count({ where: { sellerId } }),
        prisma.bookSellPost.count({
            where: { sellerId, status: SellPostStatus.AVAILABLE }
        }),
        prisma.bookSellPost.count({
            where: { sellerId, status: SellPostStatus.SOLD }
        }),
        prisma.bookSellPost.count({
            where: { sellerId, status: SellPostStatus.PENDING }
        }),
        prisma.sellPostView.count({
            where: {
                sellPost: { sellerId }
            }
        }),
        prisma.bookOffer.count({
            where: {
                sellPost: { sellerId }
            }
        }),
        prisma.conversation.count({
            where: { sellerId }
        }),
        prisma.sellerReview.count({
            where: { sellerId }
        }),
        prisma.sellerReview.aggregate({
            where: { sellerId },
            _avg: { rating: true }
        })
    ])

    return {
        totalPosts,
        activePosts,
        soldPosts,
        pendingPosts,
        totalViews,
        totalOffers,
        totalConversations,
        totalReviews,
        averageRating: avgRating._avg.rating || 0
    }
}

/**
 * Get seller's posts performance
 */
export async function getSellerPostsPerformance(sellerId: string) {
    const posts = await prisma.bookSellPost.findMany({
        where: { sellerId },
        select: {
            id: true,
            title: true,
            price: true,
            status: true,
            condition: true,
            createdAt: true,
            soldAt: true,
            _count: {
                select: {
                    views: true,
                    offers: true,
                    conversations: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return posts
}

/**
 * Get most viewed sell posts
 */
export async function getMostViewedPosts(limit = 10) {
    const posts = await prisma.bookSellPost.findMany({
        where: {
            status: { in: [SellPostStatus.AVAILABLE, SellPostStatus.PENDING] }
        },
        select: {
            id: true,
            title: true,
            price: true,
            condition: true,
            city: true,
            createdAt: true,
            seller: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                    directAvatarUrl: true,
                }
            },
            book: {
                select: {
                    name: true,
                    image: true,
                    directImageUrl: true,
                }
            },
            _count: {
                select: {
                    views: true
                }
            }
        },
        orderBy: {
            views: {
                _count: 'desc'
            }
        },
        take: limit
    })

    return posts
}

/**
 * Get marketplace activity summary
 */
export async function getMarketplaceActivitySummary() {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - 7)

    const startOfMonth = new Date(today)
    startOfMonth.setDate(1)

    const [
        postsToday,
        postsThisWeek,
        postsThisMonth,
        salesToday,
        salesThisWeek,
        salesThisMonth,
        newUsersToday,
        activeUsersThisWeek
    ] = await Promise.all([
        prisma.bookSellPost.count({
            where: {
                createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) }
            }
        }),
        prisma.bookSellPost.count({
            where: { createdAt: { gte: startOfWeek } }
        }),
        prisma.bookSellPost.count({
            where: { createdAt: { gte: startOfMonth } }
        }),
        prisma.bookSellPost.count({
            where: {
                status: SellPostStatus.SOLD,
                soldAt: { gte: new Date(today.setHours(0, 0, 0, 0)) }
            }
        }),
        prisma.bookSellPost.count({
            where: {
                status: SellPostStatus.SOLD,
                soldAt: { gte: startOfWeek }
            }
        }),
        prisma.bookSellPost.count({
            where: {
                status: SellPostStatus.SOLD,
                soldAt: { gte: startOfMonth }
            }
        }),
        prisma.user.count({
            where: {
                createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) }
            }
        }),
        prisma.conversation.groupBy({
            by: ['buyerId', 'sellerId'],
            where: {
                createdAt: { gte: startOfWeek }
            }
        })
    ])

    return {
        posts: {
            today: postsToday,
            thisWeek: postsThisWeek,
            thisMonth: postsThisMonth
        },
        sales: {
            today: salesToday,
            thisWeek: salesThisWeek,
            thisMonth: salesThisMonth
        },
        users: {
            newToday: newUsersToday,
            activeThisWeek: activeUsersThisWeek.length
        }
    }
}
