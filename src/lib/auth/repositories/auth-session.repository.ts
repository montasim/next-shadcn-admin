/**
 * Auth Session Repository
 * 
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the AuthSession model
 * 
 * Features:
 * - Intent-based session management
 * - One active session per (email, intent) pair
 * - Automatic invalidation of old sessions
 * - Expiry management
 */

import { prisma } from '../../prisma'
import { AuthIntent } from '../types'
import { generateSessionId } from '../crypto'

// ============================================================================
// SESSION QUERIES
// ============================================================================

/**
 * Find active auth session for email and intent
 * 
 * @param {string} email - Email address
 * @param {AuthIntent} intent - Auth intent
 * @returns {Promise<AuthSession | null>} Session or null if not found/expired
 */
export async function findActiveAuthSession(
    email: string,
    intent: AuthIntent
) {
    return prisma.authSession.findFirst({
        where: {
            email,
            intent,
            expiresAt: {
                gt: new Date(),
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    })
}

/**
 * Find auth session by ID
 * 
 * @param {string} id - Session ID
 * @returns {Promise<AuthSession | null>} Session or null if not found
 */
export async function findAuthSessionById(id: string) {
    return prisma.authSession.findUnique({
        where: { id },
    })
}

/**
 * Check if active session exists for email and intent
 * 
 * @param {string} email - Email address
 * @param {AuthIntent} intent - Auth intent
 * @returns {Promise<boolean>} True if active session exists
 */
export async function hasActiveAuthSession(
    email: string,
    intent: AuthIntent
): Promise<boolean> {
    const count = await prisma.authSession.count({
        where: {
            email,
            intent,
            expiresAt: {
                gt: new Date(),
            },
        },
    })

    return count > 0
}

// ============================================================================
// SESSION MUTATIONS
// ============================================================================

/**
 * Create auth session and invalidate old sessions for same email+intent
 * This is an atomic operation using a transaction
 * 
 * @param {Object} data - Session data
 * @param {string} data.email - Email address
 * @param {AuthIntent} data.intent - Auth intent
 * @param {Date} data.expiresAt - Expiry date
 * @returns {Promise<AuthSession>} Created session
 */
export async function createAuthSessionAndInvalidateOld(data: {
    email: string
    intent: AuthIntent
    expiresAt: Date
}) {
    return prisma.$transaction(async (tx) => {
        // Delete all previous sessions for this email and intent
        await tx.authSession.deleteMany({
            where: {
                email: data.email,
                intent: data.intent,
            },
        })

        // Create new session with cryptographically secure ID
        return tx.authSession.create({
            data: {
                id: generateSessionId(),
                ...data,
            },
        })
    })
}

/**
 * Delete auth session by ID
 * Used after successful account creation or password reset
 * 
 * @param {string} id - Session ID
 * @returns {Promise<AuthSession>} Deleted session
 */
export async function deleteAuthSession(id: string) {
    return prisma.authSession.delete({
        where: { id },
    })
}

/**
 * Delete all auth sessions for email and intent
 * 
 * @param {string} email - Email address
 * @param {AuthIntent} intent - Auth intent
 * @returns {Promise<number>} Number of sessions deleted
 */
export async function deleteAuthSessionsByEmailAndIntent(
    email: string,
    intent: AuthIntent
): Promise<number> {
    const result = await prisma.authSession.deleteMany({
        where: {
            email,
            intent,
        },
    })

    return result.count
}

// ============================================================================
// SESSION CLEANUP
// ============================================================================

/**
 * Delete expired auth sessions (cleanup job)
 * 
 * @returns {Promise<number>} Number of sessions deleted
 */
export async function deleteExpiredAuthSessions(): Promise<number> {
    const result = await prisma.authSession.deleteMany({
        where: {
            expiresAt: {
                lt: new Date(),
            },
        },
    })

    return result.count
}

/**
 * Delete all auth sessions older than specified age
 * 
 * @param {number} ageInDays - Age in days
 * @returns {Promise<number>} Number of sessions deleted
 */
export async function deleteOldAuthSessions(
    ageInDays: number
): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - ageInDays)

    const result = await prisma.authSession.deleteMany({
        where: {
            createdAt: {
                lt: cutoffDate,
            },
        },
    })

    return result.count
}
