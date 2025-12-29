/**
 * Conversation Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Conversation model
 */

import { prisma } from '@/lib/prisma'
import { ConversationStatus } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateConversationData {
    sellPostId: string
    sellerId: string
    buyerId: string
}

// ============================================================================
// CONVERSATION QUERIES
// ============================================================================

/**
 * Get or create a conversation between buyer and seller for a sell post
 */
export async function getOrCreateConversation(data: CreateConversationData) {
    // If sellerId is not provided, fetch it from the sell post
    let sellerId = data.sellerId
    if (!sellerId) {
        const sellPost = await prisma.bookSellPost.findUnique({
            where: { id: data.sellPostId },
            select: { sellerId: true }
        })

        if (!sellPost) {
            throw new Error('Sell post not found')
        }

        sellerId = sellPost.sellerId
    }

    // Try to find existing conversation
    let conversation = await prisma.conversation.findUnique({
        where: {
            sellPostId_buyerId: {
                sellPostId: data.sellPostId,
                buyerId: data.buyerId
            }
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
            messages: {
                include: {
                    sender: {
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
                orderBy: { createdAt: 'asc' }
            }
        }
    })

    // If not exists, create new conversation
    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                sellPostId: data.sellPostId,
                sellerId: sellerId,
                buyerId: data.buyerId,
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
                messages: {
                    include: {
                        sender: {
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
                    orderBy: { createdAt: 'asc' }
                }
            }
        })
    }

    return conversation
}

/**
 * Get conversation by ID with messages
 */
export async function getConversationWithMessages(conversationId: string) {
    return prisma.conversation.findUnique({
        where: { id: conversationId },
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
            messages: {
                include: {
                    sender: {
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
                orderBy: { createdAt: 'asc' }
            },
            review: {
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
 * Get user's conversations (as seller or buyer)
 */
export async function getUserConversations(
    userId: string,
    status?: ConversationStatus
) {
    const where: any = {
        OR: [
            { sellerId: userId },
            { buyerId: userId }
        ]
    }

    if (status) {
        where.status = status
    }

    const conversations = await prisma.conversation.findMany({
        where,
        include: {
            sellPost: {
                include: {
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
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: { updatedAt: 'desc' }
    })

    // Add unread count for each conversation
    const conversationsWithUnread = await Promise.all(
        conversations.map(async (conv) => {
            const isSeller = conv.sellerId === userId

            const unreadCount = await prisma.message.count({
                where: {
                    conversationId: conv.id,
                    senderId: { not: userId },
                    readAt: null
                }
            })

            return {
                ...conv,
                unreadCount,
                isSeller
            }
        })
    )

    return conversationsWithUnread
}

/**
 * Get conversation by sell post and buyer
 */
export async function getConversationBySellPostAndBuyer(
    sellPostId: string,
    buyerId: string
) {
    return prisma.conversation.findUnique({
        where: {
            sellPostId_buyerId: {
                sellPostId,
                buyerId
            }
        }
    })
}

/**
 * Get conversations for a sell post
 */
export async function getSellPostConversations(sellPostId: string) {
    return prisma.conversation.findMany({
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
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
            },
            _count: {
                select: {
                    messages: true
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    })
}

// ============================================================================
// CONVERSATION MUTATIONS
// ============================================================================

/**
 * Archive a conversation
 */
export async function archiveConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { sellerId: true, buyerId: true }
    })

    if (!conversation) {
        throw new Error('Conversation not found')
    }

    if (conversation.sellerId !== userId && conversation.buyerId !== userId) {
        throw new Error('You do not have permission to archive this conversation')
    }

    return prisma.conversation.update({
        where: { id: conversationId },
        data: { status: ConversationStatus.ARCHIVED }
    })
}

/**
 * Mark transaction as complete (enables review)
 */
export async function markTransactionComplete(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { sellerId: true, buyerId: true, transactionCompleted: true }
    })

    if (!conversation) {
        throw new Error('Conversation not found')
    }

    // Only seller or buyer can mark as complete
    if (conversation.sellerId !== userId && conversation.buyerId !== userId) {
        throw new Error('You do not have permission to mark this transaction as complete')
    }

    if (conversation.transactionCompleted) {
        throw new Error('Transaction is already marked as complete')
    }

    return prisma.conversation.update({
        where: { id: conversationId },
        data: {
            transactionCompleted: true,
            status: ConversationStatus.COMPLETED,
            completedAt: new Date()
        }
    })
}

/**
 * Delete a conversation (admin only)
 */
export async function deleteConversation(conversationId: string) {
    return prisma.conversation.delete({
        where: { id: conversationId }
    })
}

/**
 * Block a conversation
 */
export async function blockConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { sellerId: true, buyerId: true }
    })

    if (!conversation) {
        throw new Error('Conversation not found')
    }

    if (conversation.sellerId !== userId && conversation.buyerId !== userId) {
        throw new Error('You do not have permission to block this conversation')
    }

    return prisma.conversation.update({
        where: { id: conversationId },
        data: { status: ConversationStatus.BLOCKED }
    })
}

/**
 * Get unread messages count for a user
 */
export async function getUnreadConversationsCount(userId: string) {
    const conversations = await prisma.conversation.findMany({
        where: {
            OR: [
                { sellerId: userId },
                { buyerId: userId }
            ],
            status: { not: ConversationStatus.ARCHIVED }
        },
        select: { id: true }
    })

    const conversationIds = conversations.map(c => c.id)

    const unreadCount = await prisma.message.count({
        where: {
            conversationId: { in: conversationIds },
            senderId: { not: userId },
            readAt: null
        }
    })

    return unreadCount
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Get all conversations (admin)
 */
export async function getAllConversations(params: {
    status?: ConversationStatus
    page?: number
    limit?: number
    search?: string
}) {
    const { status, page = 1, limit = 50, search } = params

    const where: any = {}

    if (status) {
        where.status = status
    }

    if (search) {
        where.OR = [
            { seller: { name: { contains: search, mode: 'insensitive' } } },
            { seller: { email: { contains: search, mode: 'insensitive' } } },
            { buyer: { name: { contains: search, mode: 'insensitive' } } },
            { buyer: { email: { contains: search, mode: 'insensitive' } } },
            { sellPost: { title: { contains: search, mode: 'insensitive' } } },
        ]
    }

    const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
            where,
            include: {
                sellPost: {
                    select: {
                        id: true,
                        title: true,
                        price: true,
                        images: true,
                        status: true,
                    }
                },
                seller: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        directAvatarUrl: true,
                    }
                },
                buyer: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        directAvatarUrl: true,
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                _count: {
                    select: {
                        messages: true,
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.conversation.count({ where })
    ])

    return {
        conversations,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
        }
    }
}
