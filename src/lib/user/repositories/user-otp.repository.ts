/**
 * User OTP Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the UserOtp model
 *
 * Benefits:
 * - Separation of concerns (business logic from data access)
 * - Easy to test and mock
 * - Centralized database queries
 */

import { prisma } from '../../prisma'

// ============================================================================
// USER OTP QUERIES
// ============================================================================

/**
 * Find user OTP by email and intent
 *
 * @param {string} email - User email
 * @param {string} intent - OTP intent (e.g., 'registration', 'password_reset')
 * @returns {Promise<UserOtp | null>} User OTP or null if not found
 */
export async function findUserOtp(email: string, intent: string) {
    return prisma.userOtp.findFirst({
        where: {
            email,
            intent,
            used: false,
            expiresAt: {
                gt: new Date()
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
}

/**
 * Find user OTP by code
 *
 * @param {string} code - OTP code hash
 * @param {string} intent - OTP intent
 * @returns {Promise<UserOtp | null>} User OTP or null if not found
 */
export async function findUserOtpByCode(code: string, intent: string) {
    return prisma.userOtp.findFirst({
        where: {
            codeHash: code,
            intent,
            used: false,
            expiresAt: {
                gt: new Date()
            }
        }
    })
}

/**
 * Check if valid OTP exists for email and intent
 *
 * @param {string} email - User email
 * @param {string} intent - OTP intent
 * @returns {Promise<boolean>} True if valid OTP exists
 */
export async function hasValidUserOtp(email: string, intent: string): Promise<boolean> {
    const count = await prisma.userOtp.count({
        where: {
            email,
            intent,
            used: false,
            expiresAt: {
                gt: new Date()
            }
        }
    })
    return count > 0
}

/**
 * Get OTP usage statistics
 *
 * @returns {Promise<Object>} OTP usage statistics
 */
export async function getOtpStats() {
    const [
        totalOtps,
        usedOtps,
        expiredOtps,
        activeOtps,
        recentOtps
    ] = await Promise.all([
        prisma.userOtp.count(),
        prisma.userOtp.count({
            where: { used: true }
        }),
        prisma.userOtp.count({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        }),
        prisma.userOtp.count({
            where: {
                used: false,
                expiresAt: {
                    gt: new Date()
                }
            }
        }),
        prisma.userOtp.findMany({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            },
            select: {
                intent: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
    ])

    const intentStats = recentOtps.reduce((acc, otp) => {
        acc[otp.intent] = (acc[otp.intent] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return {
        totalOtps,
        usedOtps,
        expiredOtps,
        activeOtps,
        usageRate: totalOtps > 0 ? (usedOtps / totalOtps) * 100 : 0,
        recentActivity: intentStats
    }
}

// ============================================================================
// USER OTP MUTATIONS
// ============================================================================

/**
 * Create new user OTP
 *
 * @param {Object} data - OTP data
 * @param {string} data.email - User email
 * @param {string} data.codeHash - Hashed OTP code
 * @param {string} data.intent - OTP intent
 * @param {Date} [data.expiresAt] - Expiration time (default: 15 minutes)
 * @returns {Promise<UserOtp>} Created user OTP
 */
export async function createUserOtp(data: {
    email: string
    codeHash: string
    intent: string
    expiresAt?: Date
}) {
    // Invalidate any existing OTPs for the same email and intent
    await invalidateUserOtps(data.email, data.intent)

    const defaultExpiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    return prisma.userOtp.create({
        data: {
            ...data,
            expiresAt: data.expiresAt || defaultExpiresAt,
        },
    })
}

/**
 * Mark OTP as used
 *
 * @param {string} id - OTP ID
 * @returns {Promise<UserOtp>} Updated OTP
 */
export async function markOtpAsUsed(id: string) {
    return prisma.userOtp.update({
        where: { id },
        data: { used: true },
    })
}

/**
 * Mark OTP as used by email and code hash
 *
 * @param {string} email - User email
 * @param {string} codeHash - OTP code hash
 * @param {string} intent - OTP intent
 * @returns {Promise<UserOtp | null>} Updated OTP or null if not found
 */
export async function markOtpAsUsedByEmailAndCode(
    email: string,
    codeHash: string,
    intent: string
) {
    return prisma.userOtp.updateMany({
        where: {
            email,
            codeHash,
            intent,
            used: false,
            expiresAt: {
                gt: new Date()
            }
        },
        data: { used: true },
    })
}

/**
 * Invalidate all OTPs for email and intent
 *
 * @param {string} email - User email
 * @param {string} intent - OTP intent
 * @returns {Promise<{count: number}>} Number of invalidated OTPs
 */
export async function invalidateUserOtps(email: string, intent: string) {
    return prisma.userOtp.updateMany({
        where: {
            email,
            intent,
            used: false,
        },
        data: { used: true },
    })
}

/**
 * Invalidate OTP by ID
 *
 * @param {string} id - OTP ID
 * @returns {Promise<UserOtp>} Updated OTP
 */
export async function invalidateOtp(id: string) {
    return prisma.userOtp.update({
        where: { id },
        data: { used: true },
    })
}

/**
 * Delete OTP by ID
 *
 * @param {string} id - OTP ID
 * @returns {Promise<UserOtp>} Deleted OTP
 */
export async function deleteUserOtp(id: string) {
    return prisma.userOtp.delete({
        where: { id },
    })
}

/**
 * Delete all expired OTPs
 *
 * @returns {Promise<{count: number}>} Number of deleted OTPs
 */
export async function cleanupExpiredOtps() {
    return prisma.userOtp.deleteMany({
        where: {
            expiresAt: {
                lt: new Date()
            }
        }
    })
}

/**
 * Delete all OTPs for email
 *
 * @param {string} email - User email
 * @returns {Promise<{count: number}>} Number of deleted OTPs
 */
export async function deleteAllUserOtps(email: string) {
    return prisma.userOtp.deleteMany({
        where: { email },
    })
}

/**
 * Get OTPs for a specific email
 *
 * @param {string} email - User email
 * @param {number} [limit] - Maximum number of OTPs to return (default: 10)
 * @returns {Promise<UserOtp[]>} Array of OTPs
 */
export async function getUserOtps(email: string, limit = 10) {
    return prisma.userOtp.findMany({
        where: { email },
        orderBy: { createdAt: 'desc' },
        take: limit,
    })
}

/**
 * Check if there are too many OTP requests for an email (rate limiting)
 *
 * @param {string} email - User email
 * @param {string} intent - OTP intent
 * @param {number} [maxRequests] - Maximum allowed requests (default: 5)
 * @param {number} [timeWindow] - Time window in minutes (default: 15)
 * @returns {Promise<boolean>} True if rate limit exceeded
 */
export async function isOtpRateLimited(
    email: string,
    intent: string,
    maxRequests = 5,
    timeWindow = 15
): Promise<boolean> {
    const timeWindowStart = new Date(Date.now() - timeWindow * 60 * 1000)

    const count = await prisma.userOtp.count({
        where: {
            email,
            intent,
            createdAt: {
                gte: timeWindowStart
            }
        }
    })

    return count >= maxRequests
}

/**
 * Get OTP rate limit information
 *
 * @param {string} email - User email
 * @param {string} intent - OTP intent
 * @param {number} [timeWindow] - Time window in minutes (default: 15)
 * @returns {Promise<Object>} Rate limit information
 */
export async function getOtpRateLimitInfo(
    email: string,
    intent: string,
    timeWindow = 15
) {
    const timeWindowStart = new Date(Date.now() - timeWindow * 60 * 1000)

    const count = await prisma.userOtp.count({
        where: {
            email,
            intent,
            createdAt: {
                gte: timeWindowStart
            }
        }
    })

    const maxRequests = 5
    const isRateLimited = count >= maxRequests
    const remainingRequests = Math.max(0, maxRequests - count)

    // Find when the oldest OTP in the window will expire
    const oldestOtp = await prisma.userOtp.findFirst({
        where: {
            email,
            intent,
            createdAt: {
                gte: timeWindowStart
            }
        },
        orderBy: { createdAt: 'asc' }
    })

    const resetTime = oldestOtp ? new Date(oldestOtp.createdAt.getTime() + timeWindow * 60 * 1000) : null

    return {
        count,
        maxRequests,
        remainingRequests,
        isRateLimited,
        resetTime,
        timeWindow: timeWindow * 60 // Convert to seconds
    }
}