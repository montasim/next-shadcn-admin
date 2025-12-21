/**
 * User Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the User model
 *
 * Benefits:
 * - Separation of concerns (business logic from data access)
 * - Easy to test and mock
 * - Centralized database queries
 */

import { prisma } from '../../prisma'

// ============================================================================
// USER QUERIES
// ============================================================================

/**
 * Find user by email
 *
 * @param {string} email - User email
 * @returns {Promise<User | null>} User or null if not found
 */
export async function findUserByEmail(email: string) {
    return prisma.user.findUnique({
        where: { email },
        include: {
            subscription: true,
            _count: {
                select: {
                    readingProgress: true,
                    bookshelves: true,
                }
            }
        }
    })
}

/**
 * Find user by ID
 *
 * @param {string} id - User ID
 * @returns {Promise<User | null>} User or null if not found
 */
export async function findUserById(id: string) {
    return prisma.user.findUnique({
        where: { id },
        include: {
            subscription: true,
            _count: {
                select: {
                    readingProgress: true,
                    bookshelves: true,
                }
            }
        }
    })
}

/**
 * Find user by session token
 *
 * @param {string} token - Session token
 * @returns {Promise<User | null>} User or null if not found
 */
export async function findUserBySessionToken(token: string) {
    const session = await prisma.userSession.findUnique({
        where: { token },
        include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
        return null
    }

    return session.user
}

/**
 * Check if user exists by email
 *
 * @param {string} email - User email
 * @returns {Promise<boolean>} True if user exists
 */
export async function userExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({
        where: { email },
    })
    return count > 0
}

/**
 * Check if user is active
 *
 * @param {string} id - User ID
 * @returns {Promise<boolean>} True if user is active
 */
export async function isUserActive(id: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id },
        select: { isActive: true }
    })
    return user?.isActive ?? false
}

/**
 * Check if user has premium access
 *
 * @param {string} id - User ID
 * @returns {Promise<boolean>} True if user has premium access
 */
export async function isUserPremium(id: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id },
        include: { subscription: true }
    })

    if (!user) return false

    // Check if user has premium flag or active subscription
    if (user.isPremium) return true

    if (user.subscription?.isActive) {
        if (!user.subscription.endDate || user.subscription.endDate > new Date()) {
            return true
        }
    }

    return false
}

/**
 * Get user reading statistics
 *
 * @param {string} id - User ID
 * @returns {Promise<Object>} Reading statistics
 */
export async function getUserReadingStats(id: string) {
    const stats = await prisma.readingProgress.groupBy({
        by: ['isCompleted'],
        where: { userId: id },
        _count: { bookId: true }
    })

    const completed = stats.find(s => s.isCompleted)?._count.bookId || 0
    const inProgress = stats.find(s => !s.isCompleted)?._count.bookId || 0

    return {
        completed,
        inProgress,
        total: completed + inProgress
    }
}

// ============================================================================
// USER MUTATIONS
// ============================================================================

/**
 * Create a new user
 *
 * @param {Object} data - User data
 * @param {string} data.email - User email
 * @param {string} data.name - User name
 * @param {string} data.passwordHash - Hashed password
 * @param {string} [data.avatar] - Optional avatar URL
 * @returns {Promise<User>} Created user
 */
export async function createUser(data: {
    email: string
    name: string
    passwordHash: string
    avatar?: string
}) {
    return prisma.user.create({
        data,
        include: {
            subscription: true,
        }
    })
}

/**
 * Update user
 *
 * @param {string} id - User ID
 * @param {Object} data - User data to update
 * @param {string} [data.name] - User name
 * @param {string} [data.email] - User email
 * @param {string} [data.avatar] - User avatar
 * @param {boolean} [data.isActive] - User active status
 * @param {boolean} [data.isPremium] - User premium status
 * @returns {Promise<User>} Updated user
 */
export async function updateUser(
    id: string,
    data: {
        name?: string
        email?: string
        avatar?: string | null
        isActive?: boolean
        isPremium?: boolean
    }
) {
    return prisma.user.update({
        where: { id },
        data,
        include: {
            subscription: true,
        }
    })
}

/**
 * Update user password
 *
 * @param {string} email - User email
 * @param {string} passwordHash - New hashed password
 * @returns {Promise<User>} Updated user
 */
export async function updateUserPassword(
    email: string,
    passwordHash: string
) {
    return prisma.user.update({
        where: { email },
        data: { passwordHash },
    })
}

/**
 * Delete user by ID (with cascade delete for related data)
 *
 * @param {string} id - User ID
 * @returns {Promise<User>} Deleted user
 */
export async function deleteUser(id: string) {
    return prisma.user.delete({
        where: { id },
    })
}

/**
 * Create user session
 *
 * @param {Object} data - Session data
 * @param {string} data.userId - User ID
 * @param {string} data.token - Session token
 * @param {Date} data.expiresAt - Expiration date
 * @returns {Promise<UserSession>} Created session
 */
export async function createUserSession(data: {
    userId: string
    token: string
    expiresAt: Date
}) {
    return prisma.userSession.create({
        data,
    })
}

/**
 * Delete user session by token
 *
 * @param {string} token - Session token
 * @returns {Promise<UserSession>} Deleted session
 */
export async function deleteUserSession(token: string) {
    return prisma.userSession.delete({
        where: { token },
    })
}

/**
 * Delete all user sessions
 *
 * @param {string} userId - User ID
 * @returns {Promise<{count: number}>} Number of deleted sessions
 */
export async function deleteUserSessions(userId: string) {
    return prisma.userSession.deleteMany({
        where: { userId },
    })
}

/**
 * Clean up expired sessions
 *
 * @returns {Promise<{count: number}>} Number of deleted sessions
 */
export async function cleanupExpiredSessions() {
    return prisma.userSession.deleteMany({
        where: {
            expiresAt: {
                lt: new Date()
            }
        }
    })
}