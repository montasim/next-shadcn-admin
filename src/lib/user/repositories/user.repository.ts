/**
 * User Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the User model
 * Now works with unified user table (based on former admin table structure)
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
        where: { id: token }, // Changed from token to id to match schema
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
 * @param {string} [data.directAvatarUrl] - Optional direct avatar URL
 * @returns {Promise<User>} Created user
 */
export async function createUser(data: {
    email: string
    name: string
    passwordHash: string
    avatar?: string
    directAvatarUrl?: string
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
 * @param {string} [data.directAvatarUrl] - Direct avatar URL
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
        directAvatarUrl?: string | null
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
 * @param {string} data.id - Session ID (token)
 * @param {Date} data.expiresAt - Expiration date
 * @returns {Promise<UserSession>} Created session
 */
export async function createUserSession(data: {
    userId: string
    id: string
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
        where: { id: token }, // Changed from token to id to match schema
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

// ============================================================================
// USER MANAGEMENT FUNCTIONS (Including former admin functionality)
// ============================================================================

/**
 * Get all users (for admin dashboard)
 *
 * @returns {Promise<User[]>} Array of all users
 */
export async function getAllUsers() {
    return prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
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
 * Update user role
 *
 * @param {string} id - User ID
 * @param {string} role - New role (USER, ADMIN, SUPER_ADMIN)
 * @returns {Promise<User>} Updated user
 */
export async function updateUserRole(id: string, role: 'USER' | 'ADMIN' | 'SUPER_ADMIN') {
    return prisma.user.update({
        where: { id },
        data: { role },
    })
}

/**
 * Create user with extended fields (for admin creation)
 *
 * @param {Object} data - User data
 * @param {string} data.email - User email
 * @param {string} data.firstName - User first name
 * @param {string} [data.lastName] - User last name
 * @param {string} data.passwordHash - Hashed password
 * @param {string} [data.role] - User role (defaults to USER)
 * @param {string} [data.phoneNumber] - Optional phone number
 * @returns {Promise<User>} Created user
 */
export async function createFullUser(data: {
    email: string
    firstName: string
    lastName?: string
    passwordHash: string
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
    phoneNumber?: string
    username?: string
    bio?: string
    dob?: Date
    language?: string
    theme?: string
    font?: string
    urls?: any
    displayItems?: any
    notificationType?: string
    mobileNotifications?: boolean
    communicationEmails?: boolean
    socialEmails?: boolean
    marketingEmails?: boolean
    securityEmails?: boolean
    avatar?: string
    directAvatarUrl?: string
}) {
    return prisma.user.create({
        data,
        include: {
            subscription: true,
        }
    })
}

/**
 * Update user profile (extended fields)
 *
 * @param {string} id - User ID
 * @param {Object} data - User data to update
 * @returns {Promise<User>} Updated user
 */
export async function updateUserProfile(
    id: string,
    data: {
        firstName?: string
        lastName?: string | null
        email?: string
        phoneNumber?: string | null
        passwordHash?: string
        username?: string | null
        bio?: string | null
        dob?: Date | null
        language?: string | null
        theme?: string | null
        font?: string | null
        urls?: any
        displayItems?: any
        notificationType?: string | null
        mobileNotifications?: boolean | null
        communicationEmails?: boolean | null
        socialEmails?: boolean | null
        marketingEmails?: boolean | null
        securityEmails?: boolean | null
        isActive?: boolean
        isPremium?: boolean
        avatar?: string | null
        directAvatarUrl?: string | null
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