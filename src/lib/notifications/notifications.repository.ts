/**
 * Notification Repository
 *
 * Handles all database operations for notifications
 */

import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateNotificationData {
    userId: string
    type: NotificationType
    title: string
    message: string
    linkUrl?: string
}

export interface NotificationFilters {
    unreadOnly?: boolean
    type?: NotificationType
    limit?: number
}

// ============================================================================
// NOTIFICATION QUERIES
// ============================================================================

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, filters: NotificationFilters = {}) {
    const { unreadOnly = false, type, limit = 20 } = filters

    const where: any = { userId }

    if (unreadOnly) {
        where.isRead = false
    }

    if (type) {
        where.type = type
    }

    const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
    })

    return notifications
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
    return prisma.notification.count({
        where: {
            userId,
            isRead: false,
        },
    })
}

/**
 * Get a notification by ID
 */
export async function getNotificationById(notificationId: string) {
    return prisma.notification.findUnique({
        where: { id: notificationId },
    })
}

// ============================================================================
// NOTIFICATION MUTATIONS
// ============================================================================

/**
 * Create a notification
 */
export async function createNotification(data: CreateNotificationData) {
    return prisma.notification.create({
        data: {
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            linkUrl: data.linkUrl,
        },
    })
}

/**
 * Create multiple notifications (batch)
 */
export async function createNotifications(data: CreateNotificationData[]) {
    return prisma.notification.createMany({
        data: data.map(d => ({
            userId: d.userId,
            type: d.type,
            title: d.title,
            message: d.message,
            linkUrl: d.linkUrl,
        })),
    })
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        select: { userId: true },
    })

    if (!notification) {
        throw new Error('Notification not found')
    }

    if (notification.userId !== userId) {
        throw new Error('You do not have permission to mark this notification as read')
    }

    return prisma.notification.update({
        where: { id: notificationId },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    })
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
    return prisma.notification.updateMany({
        where: {
            userId,
            isRead: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    })
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        select: { userId: true },
    })

    if (!notification) {
        throw new Error('Notification not found')
    }

    if (notification.userId !== userId) {
        throw new Error('You do not have permission to delete this notification')
    }

    return prisma.notification.delete({
        where: { id: notificationId },
    })
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string) {
    return prisma.notification.deleteMany({
        where: { userId },
    })
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Notify about new message
 */
export async function notifyNewMessage(
    recipientId: string,
    senderName: string,
    conversationId: string,
    postTitle?: string
) {
    return createNotification({
        userId: recipientId,
        type: 'NEW_MESSAGE',
        title: 'New Message',
        message: postTitle
            ? `${senderName} sent you a message about "${postTitle}"`
            : `${senderName} sent you a message`,
        linkUrl: `/messages/${conversationId}`,
    })
}

/**
 * Notify about new offer
 */
export async function notifyNewOffer(
    sellerId: string,
    buyerName: string,
    postId: string,
    postTitle: string,
    offeredPrice: number
) {
    return createNotification({
        userId: sellerId,
        type: 'NEW_OFFER',
        title: 'New Offer Received',
        message: `${buyerName} offered ${formatPrice(offeredPrice)} for "${postTitle}"`,
        linkUrl: `/offers/received`,
    })
}

/**
 * Notify about offer status change
 */
export async function notifyOfferStatusChange(
    buyerId: string,
    postTitle: string,
    status: 'ACCEPTED' | 'REJECTED' | 'COUNTERED',
    counterPrice?: number
) {
    const messages = {
        ACCEPTED: `Your offer for "${postTitle}" was accepted!`,
        REJECTED: `Your offer for "${postTitle}" was rejected`,
        COUNTERED: `You received a counter-offer of ${counterPrice ? formatPrice(counterPrice) : ''} for "${postTitle}"`,
    }

    const types = {
        ACCEPTED: 'OFFER_ACCEPTED' as const,
        REJECTED: 'OFFER_REJECTED' as const,
        COUNTERED: 'OFFER_COUNTERED' as const,
    }

    return createNotification({
        userId: buyerId,
        type: types[status],
        title: `Offer ${status.charAt(0) + status.slice(1).toLowerCase()}`,
        message: messages[status],
        linkUrl: `/offers/sent`,
    })
}

/**
 * Notify about transaction completion
 */
export async function notifyTransactionComplete(
    sellerId: string,
    buyerId: string,
    postTitle: string
) {
    const notifications: CreateNotificationData[] = [
        {
            userId: buyerId,
            type: 'TRANSACTION_COMPLETE',
            title: 'Transaction Complete',
            message: `Your transaction for "${postTitle}" is complete. Please leave a review for the seller.`,
            linkUrl: `/messages`, // Will redirect to conversation with review option
        },
    ]

    return createNotifications(notifications)
}

/**
 * Notify about new review
 */
export async function notifyNewReview(
    sellerId: string,
    reviewerName: string,
    rating: number,
    postTitle: string
) {
    return createNotification({
        userId: sellerId,
        type: 'NEW_REVIEW',
        title: 'New Review Received',
        message: `${reviewerName} left you a ${rating}-star review for "${postTitle}"`,
        linkUrl: `/marketplace/my-posts`,
    })
}

// Helper function to format price
function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price)
}
