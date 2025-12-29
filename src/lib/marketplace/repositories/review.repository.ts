/**
 * Seller Review Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the SellerReview model
 */

import { prisma } from '@/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateReviewData {
    conversationId: string
    sellPostId: string
    reviewerId: string
    sellerId: string
    rating: number
    communicationRating?: number
    descriptionAccuracyRating?: number
    meetupRating?: number
    comment?: string
}

export interface SellerStats {
    totalReviews: number
    averageRating: number
    averageCommunicationRating: number
    averageDescriptionAccuracyRating: number
    averageMeetupRating: number
    totalSales: number
    ratingDistribution: {
        5: number
        4: number
        3: number
        2: number
        1: number
    }
}

// ============================================================================
// REVIEW QUERIES
// ============================================================================

/**
 * Get reviews for a seller
 */
export async function getSellerReviews(
    sellerId: string,
    page = 1,
    limit = 20
) {
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
        prisma.sellerReview.findMany({
            where: { sellerId },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        directAvatarUrl: true,
                    }
                },
                sellPost: {
                    select: {
                        title: true,
                        book: {
                            select: {
                                name: true,
                                image: true,
                                directImageUrl: true,
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.sellerReview.count({ where: { sellerId } })
    ])

    return {
        reviews,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit)
    }
}

/**
 * Get review by conversation ID
 */
export async function getReviewByConversation(conversationId: string) {
    return prisma.sellerReview.findUnique({
        where: { conversationId },
        include: {
            reviewer: {
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    directAvatarUrl: true,
                }
            },
            sellPost: {
                select: {
                    id: true,
                    title: true,
                    price: true,
                    condition: true,
                }
            }
        }
    })
}

/**
 * Get reviews left by a user
 */
export async function getReviewsByUser(reviewerId: string) {
    return prisma.sellerReview.findMany({
        where: { reviewerId },
        include: {
            sellPost: {
                select: {
                    title: true,
                    book: {
                        select: {
                            name: true,
                            image: true,
                            directImageUrl: true,
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
}

/**
 * Get seller statistics
 */
export async function getSellerStats(sellerId: string): Promise<SellerStats> {
    const [
        totalReviews,
        avgRating,
        avgCommRating,
        avgDescRating,
        avgMeetupRating,
        totalSales,
        ratingDist
    ] = await Promise.all([
        prisma.sellerReview.count({ where: { sellerId } }),
        prisma.sellerReview.aggregate({
            where: { sellerId },
            _avg: { rating: true }
        }),
        prisma.sellerReview.aggregate({
            where: { sellerId },
            _avg: { communicationRating: true }
        }),
        prisma.sellerReview.aggregate({
            where: { sellerId },
            _avg: { descriptionAccuracyRating: true }
        }),
        prisma.sellerReview.aggregate({
            where: { sellerId },
            _avg: { meetupRating: true }
        }),
        prisma.bookSellPost.count({
            where: {
                sellerId,
                status: 'SOLD'
            }
        }),
        prisma.sellerReview.groupBy({
            by: ['rating'],
            where: { sellerId },
            _count: { rating: true }
        })
    ])

    // Build rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    ratingDist.forEach(r => {
        distribution[r.rating as keyof typeof distribution] = r._count.rating
    })

    return {
        totalReviews,
        averageRating: avgRating._avg.rating || 0,
        averageCommunicationRating: avgCommRating._avg.communicationRating || 0,
        averageDescriptionAccuracyRating: avgDescRating._avg.descriptionAccuracyRating || 0,
        averageMeetupRating: avgMeetupRating._avg.meetupRating || 0,
        totalSales,
        ratingDistribution: distribution
    }
}

/**
 * Get all reviews (admin)
 */
export async function getAllReviews(page = 1, limit = 50) {
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
        prisma.sellerReview.findMany({
            include: {
                reviewer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                sellPost: {
                    select: {
                        id: true,
                        title: true,
                    }
                },
                conversation: {
                    select: {
                        sellerId: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.sellerReview.count()
    ])

    return {
        reviews,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit)
    }
}

// ============================================================================
// REVIEW MUTATIONS
// ============================================================================

/**
 * Create a new review
 */
export async function createReview(data: CreateReviewData) {
    // Verify conversation exists and transaction is complete
    const conversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
        select: {
            transactionCompleted: true,
            sellerId: true,
            buyerId: true,
            review: true
        }
    })

    if (!conversation) {
        throw new Error('Conversation not found')
    }

    if (!conversation.transactionCompleted) {
        throw new Error('Transaction must be completed before leaving a review')
    }

    if (conversation.buyerId !== data.reviewerId) {
        throw new Error('Only the buyer can leave a review')
    }

    if (conversation.sellerId !== data.sellerId) {
        throw new Error('Seller ID mismatch')
    }

    if (conversation.review) {
        throw new Error('Review already exists for this transaction')
    }

    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
        throw new Error('Rating must be between 1 and 5')
    }

    return prisma.sellerReview.create({
        data: {
            conversationId: data.conversationId,
            sellPostId: data.sellPostId,
            reviewerId: data.reviewerId,
            sellerId: data.sellerId,
            rating: data.rating,
            communicationRating: data.communicationRating || 0,
            descriptionAccuracyRating: data.descriptionAccuracyRating || 0,
            meetupRating: data.meetupRating || 0,
            comment: data.comment,
        },
        include: {
            reviewer: {
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    directAvatarUrl: true,
                }
            }
        }
    })
}

/**
 * Update a review
 */
export async function updateReview(
    reviewId: string,
    reviewerId: string,
    data: Partial<CreateReviewData>
) {
    const review = await prisma.sellerReview.findUnique({
        where: { id: reviewId },
        select: { reviewerId: true }
    })

    if (!review) {
        throw new Error('Review not found')
    }

    if (review.reviewerId !== reviewerId) {
        throw new Error('You do not have permission to update this review')
    }

    return prisma.sellerReview.update({
        where: { id: reviewId },
        data: {
            rating: data.rating,
            communicationRating: data.communicationRating,
            descriptionAccuracyRating: data.descriptionAccuracyRating,
            meetupRating: data.meetupRating,
            comment: data.comment,
        }
    })
}

/**
 * Delete a review (admin or owner)
 */
export async function deleteReview(reviewId: string, userId?: string) {
    const review = await prisma.sellerReview.findUnique({
        where: { id: reviewId },
        select: { reviewerId: true }
    })

    if (!review) {
        throw new Error('Review not found')
    }

    // If userId provided, check ownership
    if (userId && review.reviewerId !== userId) {
        throw new Error('You do not have permission to delete this review')
    }

    return prisma.sellerReview.delete({
        where: { id: reviewId }
    })
}
