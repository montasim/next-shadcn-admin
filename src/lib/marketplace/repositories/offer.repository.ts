/**
 * Offer Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the BookOffer model
 */

import { prisma } from '@/lib/prisma'
import { OfferStatus } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateOfferData {
    sellPostId: string
    buyerId: string
    offeredPrice: number
    message?: string
}

export interface RespondToOfferData {
    status: 'ACCEPTED' | 'REJECTED' | 'COUNTERED'
    responseMessage?: string
    counterPrice?: number
}

// ============================================================================
// OFFER QUERIES
// ============================================================================

/**
 * Get offers for a sell post
 */
export async function getOffersForSellPost(sellPostId: string) {
    return prisma.bookOffer.findMany({
        where: { sellPostId },
        include: {
            buyer: {
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    directAvatarUrl: true,
                    email: true,
                }
            },
            sellPost: {
                select: {
                    id: true,
                    title: true,
                    price: true,
                    images: true,
                    condition: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
}

/**
 * Get buyer's offers
 */
export async function getBuyerOffers(buyerId: string, status?: OfferStatus) {
    const where: any = { buyerId }

    if (status) {
        where.status = status
    }

    return prisma.bookOffer.findMany({
        where,
        include: {
            sellPost: {
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
            }
        },
        orderBy: { createdAt: 'desc' }
    })
}

/**
 * Get offer by ID
 */
export async function getOfferById(id: string) {
    return prisma.bookOffer.findUnique({
        where: { id },
        include: {
            sellPost: {
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
            },
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
        }
    })
}

/**
 * Get pending offers count for a sell post
 */
export async function getPendingOffersCount(sellPostId: string) {
    return prisma.bookOffer.count({
        where: {
            sellPostId,
            status: OfferStatus.PENDING
        }
    })
}

// ============================================================================
// OFFER MUTATIONS
// ============================================================================

/**
 * Create a new offer
 */
export async function createOffer(data: CreateOfferData) {
    // Check if sell post exists and is available
    const sellPost = await prisma.bookSellPost.findUnique({
        where: { id: data.sellPostId },
        select: { sellerId: true, status: true, price: true }
    })

    if (!sellPost) {
        throw new Error('Sell post not found')
    }

    if (sellPost.status !== 'AVAILABLE' && sellPost.status !== 'PENDING') {
        throw new Error('This listing is no longer available')
    }

    // Prevent seller from making offers on their own post
    if (sellPost.sellerId === data.buyerId) {
        throw new Error('You cannot make an offer on your own listing')
    }

    // Check if buyer already has a pending offer
    const existingOffer = await prisma.bookOffer.findFirst({
        where: {
            sellPostId: data.sellPostId,
            buyerId: data.buyerId,
            status: { in: [OfferStatus.PENDING, OfferStatus.COUNTERED, OfferStatus.ACCEPTED] }
        }
    })

    if (existingOffer) {
        throw new Error('You already have an active offer on this listing')
    }

    return prisma.bookOffer.create({
        data: {
            sellPostId: data.sellPostId,
            buyerId: data.buyerId,
            offeredPrice: data.offeredPrice,
            message: data.message,
        },
        include: {
            sellPost: {
                include: {
                    seller: {
                        select: {
                            id: true,
                            name: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        }
                    }
                }
            }
        }
    })
}

/**
 * Respond to an offer (accept/reject/counter)
 */
export async function respondToOffer(
    offerId: string,
    sellerId: string,
    data: RespondToOfferData
) {
    // Verify the offer belongs to a post owned by the seller
    const offer = await prisma.bookOffer.findUnique({
        where: { id: offerId },
        include: {
            sellPost: {
                select: { sellerId: true, id: true }
            }
        }
    })

    if (!offer) {
        throw new Error('Offer not found')
    }

    if (offer.sellPost.sellerId !== sellerId) {
        throw new Error('You do not have permission to respond to this offer')
    }

    const updateData: any = {
        status: data.status,
        responseMessage: data.responseMessage,
        respondedAt: new Date()
    }

    // If countering with a new price, create a new offer or update existing
    if (data.status === 'COUNTERED' && data.counterPrice) {
        updateData.offeredPrice = data.counterPrice
    }

    // If accepting, reject other pending offers
    if (data.status === 'ACCEPTED') {
        await prisma.bookOffer.updateMany({
            where: {
                sellPostId: offer.sellPostId,
                id: { not: offerId },
                status: OfferStatus.PENDING
            },
            data: { status: OfferStatus.REJECTED }
        })

        // Update sell post status to pending
        await prisma.bookSellPost.update({
            where: { id: offer.sellPostId },
            data: { status: 'PENDING' }
        })
    }

    return prisma.bookOffer.update({
        where: { id: offerId },
        data: updateData,
        include: {
            buyer: {
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                }
            },
            sellPost: {
                include: {
                    book: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            }
        }
    })
}

/**
 * Withdraw an offer
 */
export async function withdrawOffer(offerId: string, buyerId: string) {
    const offer = await prisma.bookOffer.findUnique({
        where: { id: offerId },
        select: { buyerId: true, status: true }
    })

    if (!offer) {
        throw new Error('Offer not found')
    }

    if (offer.buyerId !== buyerId) {
        throw new Error('You do not have permission to withdraw this offer')
    }

    if (offer.status === OfferStatus.ACCEPTED) {
        throw new Error('Cannot withdraw an accepted offer')
    }

    return prisma.bookOffer.update({
        where: { id: offerId },
        data: { status: OfferStatus.WITHDRAWN }
    })
}

/**
 * Delete an offer (admin only)
 */
export async function deleteOffer(offerId: string) {
    return prisma.bookOffer.delete({
        where: { id: offerId }
    })
}

/**
 * Get offer stats for a sell post
 */
export async function getSellPostOfferStats(sellPostId: string) {
    const [total, pending, accepted, rejected, countered] = await Promise.all([
        prisma.bookOffer.count({ where: { sellPostId } }),
        prisma.bookOffer.count({ where: { sellPostId, status: OfferStatus.PENDING } }),
        prisma.bookOffer.count({ where: { sellPostId, status: OfferStatus.ACCEPTED } }),
        prisma.bookOffer.count({ where: { sellPostId, status: OfferStatus.REJECTED } }),
        prisma.bookOffer.count({ where: { sellPostId, status: OfferStatus.COUNTERED } }),
    ])

    return { total, pending, accepted, rejected, countered }
}
