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
import { UserRole } from '@prisma/client'

// ============================================================================
// USER QUERIES
// ============================================================================

/**
 * Find user by email with optional role filtering
 *
 * @param {string} email - User email
 * @param {UserRole | UserRole[]} [roleFilter] - Optional role filter(s)
 * @returns {Promise<User | null>} User or null if not found
 */
export async function findUserByEmail(
    email: string,
    roleFilter?: UserRole | UserRole[]
) {
    return prisma.user.findFirst({
        where: {
            email,
            ...(roleFilter && {
                role: Array.isArray(roleFilter) ? { in: roleFilter } : roleFilter
            })
        },
    })
}

/**
 * Find user by ID with optional role filtering
 *
 * @param {string} id - User ID
 * @param {UserRole | UserRole[]} [roleFilter] - Optional role filter(s)
 * @returns {Promise<User | null>} User or null if not found
 */
export async function findUserById(
    id: string,
    roleFilter?: UserRole | UserRole[]
) {
    return prisma.user.findFirst({
        where: {
            id,
            ...(roleFilter && {
                role: Array.isArray(roleFilter) ? { in: roleFilter } : roleFilter
            })
        },
    })
}


/**
 * Check if user exists by email with optional role filtering
 *
 * @param {string} email - User email
 * @param {UserRole | UserRole[]} [roleFilter] - Optional role filter(s)
 * @returns {Promise<boolean>} True if user exists
 */
export async function userExists(
    email: string,
    roleFilter?: UserRole | UserRole[]
): Promise<boolean> {
    const count = await prisma.user.count({
        where: {
            email,
            ...(roleFilter && {
                role: Array.isArray(roleFilter) ? { in: roleFilter } : roleFilter
            })
        },
    })
    return count > 0
}

/**
 * Check if admin user exists by email (convenience wrapper)
 *
 * @param {string} email - Admin email
 * @returns {Promise<boolean>} True if admin exists
 */
export async function adminExists(email: string): Promise<boolean> {
    const admin = await findUserByEmail(email, [UserRole.ADMIN, UserRole.SUPER_ADMIN])
    return admin !== null
}

/**
 * Get all users with optional role filtering
 *
 * @param {UserRole | UserRole[]} [roleFilter] - Optional role filter(s)
 * @returns {Promise<User[]>} Array of users
 */
export async function getAllUsers(roleFilter?: UserRole | UserRole[]) {
    return prisma.user.findMany({
        where: roleFilter ? {
            role: Array.isArray(roleFilter) ? { in: roleFilter } : roleFilter
        } : undefined,
        orderBy: { createdAt: 'desc' },
    })
}

/**
 * Get all admin users (convenience wrapper)
 *
 * @returns {Promise<User[]>} Array of all users with admin roles
 */
export async function getAllAdmins() {
    return getAllUsers([UserRole.ADMIN, UserRole.SUPER_ADMIN])
}

/**
 * Check if user has premium status
 *
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user has premium status
 */
export async function isUserPremium(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPremium: true }
    })

    return user?.isPremium || false
}

// ============================================================================
// USER MUTATIONS
// ============================================================================

/**
 * Create a new user
 *
 * @param {Object} data - User data
 * @param {string} data.email - User email
 * @param {string} data.passwordHash - Hashed password
 * @param {UserRole} [data.role] - User role (defaults to USER)
 * @param {string} [data.firstName] - User first name
 * @param {string} [data.lastName] - User last name
 * @param {string} [data.phoneNumber] - Optional phone number
 * @returns {Promise<User>} Created user
 */
export async function createUser(data: {
    email: string
    passwordHash: string
    role?: UserRole
    firstName?: string
    lastName?: string
    phoneNumber?: string
}) {
    return prisma.user.create({
        data: {
            ...data,
            role: data.role || UserRole.USER,
        },
    })
}

/**
 * Create a new admin user (convenience wrapper)
 *
 * @param {Object} data - User data
 * @param {string} data.email - User email
 * @param {string} data.passwordHash - Hashed password
 * @param {UserRole} [data.role] - User role (defaults to ADMIN)
 * @param {string} [data.firstName] - User first name
 * @param {string} [data.lastName] - User last name
 * @param {string} [data.phoneNumber] - Optional phone number
 * @returns {Promise<User>} Created user with admin role
 */
export async function createAdmin(data: {
    email: string
    passwordHash: string
    role?: UserRole
    firstName?: string
    lastName?: string
    phoneNumber?: string
}) {
    return createUser({
        ...data,
        role: data.role || UserRole.ADMIN,
    })
}

/**
 * Update user
 *
 * @param {string} id - User ID
 * @param {Object} data - User data to update
 * @returns {Promise<User>} Updated user
 */
export async function updateUser(
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
        role?: UserRole
        isActive?: boolean
        isPremium?: boolean
    }
) {
    return prisma.user.update({
        where: { id },
        data,
    })
}

/**
 * Update admin user (convenience wrapper)
 *
 * @param {string} id - User ID
 * @param {Object} data - User data to update
 * @returns {Promise<User>} Updated user
 */
export async function updateAdmin(
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
    }
) {
    // Ensure we only update users with admin roles
    const adminUser = await findUserById(id, [UserRole.ADMIN, UserRole.SUPER_ADMIN])
    if (!adminUser) {
        throw new Error('Admin user not found')
    }

    return updateUser(id, data)
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
 * Update admin user password (convenience wrapper)
 *
 * @param {string} email - Admin user email
 * @param {string} passwordHash - New hashed password
 * @returns {Promise<User>} Updated user
 */
export async function updateAdminPassword(
    email: string,
    passwordHash: string
) {
    // Ensure we only update users with admin roles
    const adminUser = await findUserByEmail(email, [UserRole.ADMIN, UserRole.SUPER_ADMIN])
    if (!adminUser) {
        throw new Error('Admin user not found')
    }

    return updateUserPassword(email, passwordHash)
}

/**
 * Delete user by ID
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
 * Delete admin user by ID (convenience wrapper)
 *
 * @param {string} id - User ID
 * @returns {Promise<User>} Deleted user
 */
export async function deleteAdmin(id: string) {
    // Ensure we only delete users with admin roles
    const adminUser = await findUserById(id, [UserRole.ADMIN, UserRole.SUPER_ADMIN])
    if (!adminUser) {
        throw new Error('Admin user not found')
    }

    return deleteUser(id)
}