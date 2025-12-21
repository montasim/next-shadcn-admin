/**
 * Subscription Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Subscription model
 *
 * Benefits:
 * - Separation of concerns (business logic from data access)
 * - Easy to test and mock
 * - Centralized database queries
 */

import { prisma } from '../../prisma'
import { SubscriptionPlan } from '@prisma/client'

// ============================================================================
// SUBSCRIPTION QUERIES
// ============================================================================

/**
 * Find subscription by user ID
 *
 * @param {string} userId - User ID
 * @returns {Promise<Subscription | null>} Subscription or null if not found
 */
export async function findSubscriptionByUserId(userId: string) {
    return prisma.subscription.findUnique({
        where: { userId },
    })
}

/**
 * Check if user has active premium subscription
 *
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user has active premium subscription
 */
export async function hasActivePremiumSubscription(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
        where: { userId },
    })

    if (!subscription || !subscription.isActive) {
        return false
    }

    // Check if subscription is still valid (not expired)
    if (subscription.endDate && subscription.endDate < new Date()) {
        return false
    }

    return true
}

/**
 * Get subscription expiration date
 *
 * @param {string} userId - User ID
 * @returns {Promise<Date | null>} Expiration date or null if no active subscription
 */
export async function getSubscriptionExpiration(userId: string): Promise<Date | null> {
    const subscription = await prisma.subscription.findUnique({
        where: { userId },
        select: { endDate: true }
    })

    return subscription?.endDate || null
}

/**
 * Get all subscriptions
 *
 * @param {Object} [filters] - Optional filters
 * @param {SubscriptionPlan} [filters.plan] - Filter by plan type
 * @param {boolean} [filters.isActive] - Filter by active status
 * @param {number} [filters.page] - Page number (default: 1)
 * @param {number} [filters.limit] - Items per page (default: 50)
 * @returns {Promise<{subscriptions: Subscription[], total: number}>} Subscriptions and total count
 */
export async function getAllSubscriptions(filters?: {
    plan?: SubscriptionPlan
    isActive?: boolean
    page?: number
    limit?: number
}) {
    const { plan, isActive, page = 1, limit = 50 } = filters || {}
    const skip = (page - 1) * limit

    const where: any = {}
    if (plan) where.plan = plan
    if (isActive !== undefined) where.isActive = isActive

    const [subscriptions, total] = await Promise.all([
        prisma.subscription.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.subscription.count({ where }),
    ])

    return { subscriptions, total }
}

/**
 * Get subscription statistics
 *
 * @returns {Promise<Object>} Subscription statistics
 */
export async function getSubscriptionStats() {
    const stats = await prisma.subscription.groupBy({
        by: ['plan', 'isActive'],
        _count: { userId: true }
    })

    const result: any = {
        FREE: { active: 0, inactive: 0 },
        PREMIUM: { active: 0, inactive: 0 },
        PREMIUM_PLUS: { active: 0, inactive: 0 },
        total: 0
    }

    stats.forEach(stat => {
        result[stat.plan][stat.isActive ? 'active' : 'inactive'] = stat._count.userId
        result.total += stat._count.userId
    })

    return result
}

// ============================================================================
// SUBSCRIPTION MUTATIONS
// ============================================================================

/**
 * Create new subscription
 *
 * @param {Object} data - Subscription data
 * @param {string} data.userId - User ID
 * @param {SubscriptionPlan} [data.plan] - Subscription plan (default: FREE)
 * @param {Date} [data.startDate] - Start date (default: now)
 * @param {Date} [data.endDate] - End date (optional for lifetime)
 * @param {boolean} [data.isActive] - Active status (default: true)
 * @param {string} [data.paymentId] - Payment provider ID
 * @returns {Promise<Subscription>} Created subscription
 */
export async function createSubscription(data: {
    userId: string
    plan?: SubscriptionPlan
    startDate?: Date
    endDate?: Date
    isActive?: boolean
    paymentId?: string
}) {
    return prisma.subscription.create({
        data: {
            ...data,
            plan: data.plan || 'FREE',
            startDate: data.startDate || new Date(),
            isActive: data.isActive ?? true,
        },
    })
}

/**
 * Update subscription
 *
 * @param {string} userId - User ID
 * @param {Object} data - Subscription data to update
 * @param {SubscriptionPlan} [data.plan] - Subscription plan
 * @param {Date} [data.startDate] - Start date
 * @param {Date} [data.endDate] - End date
 * @param {boolean} [data.isActive] - Active status
 * @param {string} [data.paymentId] - Payment provider ID
 * @returns {Promise<Subscription>} Updated subscription
 */
export async function updateSubscription(
    userId: string,
    data: {
        plan?: SubscriptionPlan
        startDate?: Date
        endDate?: Date
        isActive?: boolean
        paymentId?: string
    }
) {
    return prisma.subscription.update({
        where: { userId },
        data,
    })
}

/**
 * Upgrade or downgrade subscription plan
 *
 * @param {string} userId - User ID
 * @param {SubscriptionPlan} plan - New plan
 * @param {Date} [endDate] - New end date (optional)
 * @param {string} [paymentId] - Payment ID
 * @returns {Promise<Subscription>} Updated subscription
 */
export async function changeSubscriptionPlan(
    userId: string,
    plan: SubscriptionPlan,
    endDate?: Date,
    paymentId?: string
) {
    const isActive = plan !== 'FREE'

    return prisma.subscription.update({
        where: { userId },
        data: {
            plan,
            isActive,
            endDate: plan === 'FREE' ? null : endDate,
            paymentId: paymentId || null,
            startDate: plan !== 'FREE' ? new Date() : undefined,
        },
    })
}

/**
 * Cancel subscription
 *
 * @param {string} userId - User ID
 * @param {Date} [cancelDate] - Custom cancel date (default: now)
 * @returns {Promise<Subscription>} Updated subscription
 */
export async function cancelSubscription(userId: string, cancelDate?: Date) {
    return prisma.subscription.update({
        where: { userId },
        data: {
            isActive: false,
            endDate: cancelDate || new Date(),
        },
    })
}

/**
 * Reactivate subscription
 *
 * @param {string} userId - User ID
 * @param {Date} [newEndDate] - New end date (optional)
 * @returns {Promise<Subscription>} Updated subscription
 */
export async function reactivateSubscription(userId: string, newEndDate?: Date) {
    return prisma.subscription.update({
        where: { userId },
        data: {
            isActive: true,
            endDate: newEndDate || null,
        },
    })
}

/**
 * Delete subscription by user ID
 *
 * @param {string} userId - User ID
 * @returns {Promise<Subscription>} Deleted subscription
 */
export async function deleteSubscription(userId: string) {
    return prisma.subscription.delete({
        where: { userId },
    })
}

/**
 * Update subscription end date
 *
 * @param {string} userId - User ID
 * @param {Date} endDate - New end date
 * @returns {Promise<Subscription>} Updated subscription
 */
export async function updateSubscriptionEndDate(userId: string, endDate: Date) {
    return prisma.subscription.update({
        where: { userId },
        data: { endDate },
    })
}

/**
 * Find expired subscriptions that are still marked as active
 *
 * @returns {Promise<Subscription[]>} Expired but active subscriptions
 */
export async function findExpiredActiveSubscriptions() {
    return prisma.subscription.findMany({
        where: {
            isActive: true,
            endDate: {
                lt: new Date()
            },
            plan: {
                not: 'FREE'
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                }
            }
        }
    })
}