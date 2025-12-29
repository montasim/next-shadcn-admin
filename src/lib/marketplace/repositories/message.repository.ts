/**
 * Message Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Message model
 */

import { prisma } from '@/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateMessageData {
    conversationId: string
    senderId: string
    content: string
}

// ============================================================================
// MESSAGE QUERIES
// ============================================================================

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string) {
    return prisma.message.findMany({
        where: { conversationId },
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
    })
}

/**
 * Get unread messages count for a user in a conversation
 */
export async function getUnreadMessageCount(conversationId: string, userId: string) {
    return prisma.message.count({
        where: {
            conversationId,
            senderId: { not: userId },
            readAt: null
        }
    })
}

/**
 * Get total unread messages count for a user across all conversations
 */
export async function getTotalUnreadCount(userId: string) {
    // First get all conversations the user is part of
    const conversations = await prisma.conversation.findMany({
        where: {
            OR: [
                { sellerId: userId },
                { buyerId: userId }
            ]
        },
        select: { id: true }
    })

    const conversationIds = conversations.map(c => c.id)

    return prisma.message.count({
        where: {
            conversationId: { in: conversationIds },
            senderId: { not: userId },
            readAt: null
        }
    })
}

/**
 * Get recent messages across all user's conversations
 */
export async function getRecentMessages(userId: string, limit = 10) {
    const conversations = await prisma.conversation.findMany({
        where: {
            OR: [
                { sellerId: userId },
                { buyerId: userId }
            ]
        },
        select: { id: true }
    })

    const conversationIds = conversations.map(c => c.id)

    return prisma.message.findMany({
        where: {
            conversationId: { in: conversationIds },
            senderId: { not: userId }
        },
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
            },
            conversation: {
                select: {
                    id: true,
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
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
    })
}

// ============================================================================
// MESSAGE MUTATIONS
// ============================================================================

/**
 * Create a new message
 */
export async function createMessage(data: CreateMessageData) {
    // Verify conversation exists and user is a participant
    const conversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
        select: { sellerId: true, buyerId: true, status: true }
    })

    if (!conversation) {
        throw new Error('Conversation not found')
    }

    if (conversation.sellerId !== data.senderId && conversation.buyerId !== data.senderId) {
        throw new Error('You are not a participant in this conversation')
    }

    if (conversation.status === 'BLOCKED') {
        throw new Error('This conversation has been blocked')
    }

    const message = await prisma.message.create({
        data: {
            conversationId: data.conversationId,
            senderId: data.senderId,
            content: data.content,
        },
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
        }
    })

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() }
    })

    return message
}

/**
 * Mark messages as read
 */
export async function markMessagesRead(conversationId: string, userId: string) {
    // Verify user is a participant
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { sellerId: true, buyerId: true }
    })

    if (!conversation) {
        throw new Error('Conversation not found')
    }

    if (conversation.sellerId !== userId && conversation.buyerId !== userId) {
        throw new Error('You are not a participant in this conversation')
    }

    // Mark all messages from other participant as read
    const result = await prisma.message.updateMany({
        where: {
            conversationId,
            senderId: { not: userId },
            readAt: null
        },
        data: {
            readAt: new Date()
        }
    })

    return result
}

/**
 * Mark a specific message as read
 */
export async function markMessageRead(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { senderId: true, conversationId: true }
    })

    if (!message) {
        throw new Error('Message not found')
    }

    // Can't mark own messages as read
    if (message.senderId === userId) {
        throw new Error('Cannot mark your own message as read')
    }

    return prisma.message.update({
        where: { id: messageId },
        data: { readAt: new Date() }
    })
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { senderId: true, conversationId: true }
    })

    if (!message) {
        throw new Error('Message not found')
    }

    if (message.senderId !== userId) {
        throw new Error('You do not have permission to delete this message')
    }

    return prisma.message.delete({
        where: { id: messageId }
    })
}

/**
 * Delete all messages in a conversation (admin only)
 */
export async function deleteConversationMessages(conversationId: string) {
    return prisma.message.deleteMany({
        where: { conversationId }
    })
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Get all messages (admin)
 */
export async function getAllMessages(params: {
    page?: number
    limit?: number
    search?: string
    conversationId?: string
}) {
    const { page = 1, limit = 50, search, conversationId } = params

    const where: any = {}

    if (conversationId) {
        where.conversationId = conversationId
    }

    if (search) {
        where.OR = [
            { content: { contains: search, mode: 'insensitive' } },
            { sender: { name: { contains: search, mode: 'insensitive' } } },
            { sender: { email: { contains: search, mode: 'insensitive' } } },
        ]
    }

    const [messages, total] = await Promise.all([
        prisma.message.findMany({
            where,
            include: {
                sender: {
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
                conversation: {
                    select: {
                        id: true,
                        sellPost: {
                            select: {
                                id: true,
                                title: true,
                            }
                        },
                        seller: {
                            select: {
                                id: true,
                                name: true,
                            }
                        },
                        buyer: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.message.count({ where })
    ])

    return {
        messages,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
        }
    }
}

/**
 * Delete a single message (admin)
 */
export async function adminDeleteMessage(messageId: string) {
    return prisma.message.delete({
        where: { id: messageId }
    })
}
