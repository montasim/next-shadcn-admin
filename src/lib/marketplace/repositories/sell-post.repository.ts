/**
 * Sell Post Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the BookSellPost model
 */

import { prisma } from '@/lib/prisma'
import { BookCondition, SellPostStatus } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface SellPostFilters {
    status?: SellPostStatus
    condition?: BookCondition
    sellerId?: string
    bookId?: string
    city?: string
    search?: string
    minPrice?: number
    maxPrice?: number
    negotiable?: boolean
}

export interface SellPostOptions {
    page?: number
    limit?: number
    sortBy?: 'createdAt' | 'price' | 'updatedAt' | 'views'
    sortOrder?: 'asc' | 'desc'
}

export interface CreateSellPostData {
    title: string
    description?: string
    price: number
    negotiable?: boolean
    condition: BookCondition
    images: string[]
    directImageUrls?: any
    bookId?: string
    sellerId: string
    location?: string
    city?: string
    expiresAt?: Date
}

export interface UpdateSellPostData {
    title?: string
    description?: string
    price?: number
    negotiable?: boolean
    condition?: BookCondition
    images?: string[]
    directImageUrls?: any
    location?: string
    city?: string
    status?: SellPostStatus
    expiresAt?: Date
}

// ============================================================================
// SELL POST QUERIES
// ============================================================================

/**
 * Get sell posts with filters and pagination
 */
export async function getSellPosts(
    filters: SellPostFilters = {},
    options: SellPostOptions = {}
) {
    const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = options

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (filters.status) {
        where.status = filters.status
    } else {
        // Default to available/pending posts for public browsing
        where.status = { in: [SellPostStatus.AVAILABLE, SellPostStatus.PENDING] }
    }

    if (filters.condition) where.condition = filters.condition
    if (filters.sellerId) where.sellerId = filters.sellerId
    if (filters.bookId) where.bookId = filters.bookId
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' }
    if (filters.negotiable !== undefined) where.negotiable = filters.negotiable

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.price = {}
        if (filters.minPrice !== undefined) where.price.gte = filters.minPrice
        if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice
    }

    if (filters.search) {
        where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } }
        ]
    }

    const [posts, total] = await Promise.all([
        prisma.bookSellPost.findMany({
            where,
            include: {
                seller: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        directAvatarUrl: true,
                    }
                },
                book: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        directImageUrl: true,
                        authors: {
                            include: {
                                author: {
                                    select: {
                                        id: true,
                                        name: true,
                                    }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        views: true,
                        offers: true,
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
        }),
        prisma.bookSellPost.count({ where }),
    ])

    return {
        posts,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
    }
}

/**
 * Get sell post by ID
 */
export async function getSellPostById(id: string) {
    return prisma.bookSellPost.findUnique({
        where: { id },
        include: {
            seller: {
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    directAvatarUrl: true,
                    email: true,
                    phoneNumber: true,
                }
            },
            book: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    directImageUrl: true,
                    authors: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    name: true,
                                }
                            }
                        }
                    },
                    categories: {
                        include: {
                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                }
                            }
                        }
                    }
                }
            },
            offers: {
                where: { status: { in: ['PENDING', 'ACCEPTED', 'COUNTERED'] } },
                include: {
                    buyer: {
                        select: {
                            id: true,
                            name: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            directAvatarUrl: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            },
            reviews: {
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
            }
        }
    })
}

/**
 * Get user's sell posts
 */
export async function getUserSellPosts(
    userId: string,
    options: SellPostOptions = {}
) {
    const { page = 1, limit = 20 } = options
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
        prisma.bookSellPost.findMany({
            where: { sellerId: userId },
            include: {
                book: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        directImageUrl: true,
                    }
                },
                _count: {
                    select: {
                        views: true,
                        offers: true,
                        conversations: true,
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.bookSellPost.count({
            where: { sellerId: userId }
        }),
    ])

    return {
        posts,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
    }
}

/**
 * Get available sell posts (for public marketplace)
 */
export async function getAvailableSellPosts(
    filters: SellPostFilters = {},
    options: SellPostOptions = {}
) {
    return getSellPosts(
        { ...filters, status: SellPostStatus.AVAILABLE },
        options
    )
}

/**
 * Get related sell posts (same book or similar)
 */
export async function getRelatedSellPosts(
    sellPostId: string,
    limit = 6
) {
    const post = await prisma.bookSellPost.findUnique({
        where: { id: sellPostId },
        select: { bookId: true, city: true }
    })

    if (!post) return []

    const where: any = {
        id: { not: sellPostId },
        status: SellPostStatus.AVAILABLE
    }

    if (post.bookId) {
        where.bookId = post.bookId
    } else if (post.city) {
        where.city = post.city
    } else {
        return []
    }

    return prisma.bookSellPost.findMany({
        where,
        include: {
            seller: {
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    avatar: true,
                    directAvatarUrl: true,
                }
            },
            book: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    directImageUrl: true,
                }
            }
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
    })
}

// ============================================================================
// SELL POST MUTATIONS
// ============================================================================

/**
 * Create a new sell post
 */
export async function createSellPost(data: CreateSellPostData) {
    return prisma.bookSellPost.create({
        data: {
            title: data.title,
            description: data.description,
            price: data.price,
            negotiable: data.negotiable ?? true,
            condition: data.condition,
            images: data.images,
            directImageUrls: data.directImageUrls,
            bookId: data.bookId,
            sellerId: data.sellerId,
            location: data.location,
            city: data.city,
            expiresAt: data.expiresAt,
        },
        include: {
            seller: {
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    directAvatarUrl: true,
                }
            },
            book: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    directImageUrl: true,
                }
            }
        }
    })
}

/**
 * Update a sell post
 */
export async function updateSellPost(
    id: string,
    sellerId: string,
    data: UpdateSellPostData
) {
    // Verify ownership
    const post = await prisma.bookSellPost.findUnique({
        where: { id },
        select: { sellerId: true }
    })

    if (!post) {
        throw new Error('Sell post not found')
    }

    if (post.sellerId !== sellerId) {
        throw new Error('You do not have permission to update this post')
    }

    return prisma.bookSellPost.update({
        where: { id },
        data,
        include: {
            seller: {
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    directAvatarUrl: true,
                }
            },
            book: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    directImageUrl: true,
                }
            }
        }
    })
}

/**
 * Delete a sell post (soft delete by setting status to HIDDEN)
 */
export async function deleteSellPost(id: string, sellerId: string) {
    // Verify ownership
    const post = await prisma.bookSellPost.findUnique({
        where: { id },
        select: { sellerId: true }
    })

    if (!post) {
        throw new Error('Sell post not found')
    }

    if (post.sellerId !== sellerId) {
        throw new Error('You do not have permission to delete this post')
    }

    return prisma.bookSellPost.update({
        where: { id },
        data: { status: SellPostStatus.HIDDEN }
    })
}

/**
 * Mark sell post as sold
 */
export async function markSellPostAsSold(id: string, sellerId: string) {
    return prisma.bookSellPost.updateMany({
        where: {
            id,
            sellerId
        },
        data: {
            status: SellPostStatus.SOLD,
            soldAt: new Date()
        }
    })
}

/**
 * Permanently delete a sell post (admin only)
 */
export async function permanentlyDeleteSellPost(id: string) {
    return prisma.bookSellPost.delete({
        where: { id }
    })
}
