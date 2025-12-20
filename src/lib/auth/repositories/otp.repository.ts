/**
 * OTP Repository
 * 
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the AdminOtp model
 * 
 * Features:
 * - Intent-based OTP management
 * - Single-use enforcement
 * - Automatic invalidation
 * - Transaction support for atomic operations
 */

import { prisma } from '../../prisma'
import { AuthIntent } from '../types'

// ============================================================================
// OTP QUERIES
// ============================================================================

/**
 * Find most recent unused OTP for email and intent
 * 
 * @param {string} email - Email address
 * @param {AuthIntent} intent - Auth intent
 * @returns {Promise<AdminOtp | null>} OTP or null if not found
 */
export async function findValidOtp(email: string, intent: AuthIntent) {
    return prisma.adminOtp.findFirst({
        where: {
            email,
            intent,
            used: false,
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
 * Find OTP by ID
 * 
 * @param {string} id - OTP ID
 * @returns {Promise<AdminOtp | null>} OTP or null if not found
 */
export async function findOtpById(id: string) {
    return prisma.adminOtp.findUnique({
        where: { id },
    })
}

// ============================================================================
// OTP MUTATIONS
// ============================================================================

/**
 * Create new OTP and invalidate previous ones for the same email+intent
 * This is an atomic operation using a transaction
 * 
 * @param {Object} data - OTP data
 * @param {string} data.email - Email address
 * @param {string} data.codeHash - Hashed OTP code
 * @param {AuthIntent} data.intent - Auth intent
 * @param {Date} data.expiresAt - Expiry date
 * @returns {Promise<AdminOtp>} Created OTP
 */
export async function createOtpAndInvalidateOld(data: {
    email: string
    codeHash: string
    intent: AuthIntent
    expiresAt: Date
}) {
    return prisma.$transaction(async (tx) => {
        // Invalidate all previous OTPs for this email and intent
        await tx.adminOtp.updateMany({
            where: {
                email: data.email,
                intent: data.intent,
                used: false,
            },
            data: {
                used: true,
            },
        })

        // Create new OTP
        return tx.adminOtp.create({
            data,
        })
    })
}

/**
 * Mark OTP as used (single-use enforcement)
 * This should be done in a transaction with other operations
 * 
 * @param {string} id - OTP ID
 * @returns {Promise<AdminOtp>} Updated OTP
 */
export async function markOtpAsUsed(id: string) {
    return prisma.adminOtp.update({
        where: { id },
        data: { used: true },
    })
}

/**
 * Invalidate all OTPs for email and intent
 * Used after successful password reset or account creation
 * 
 * @param {string} email - Email address
 * @param {AuthIntent} intent - Auth intent
 * @returns {Promise<number>} Number of OTPs invalidated
 */
export async function invalidateAllOtps(
    email: string,
    intent: AuthIntent
): Promise<number> {
    const result = await prisma.adminOtp.updateMany({
        where: {
            email,
            intent,
            used: false,
        },
        data: {
            used: true,
        },
    })

    return result.count
}

// ============================================================================
// OTP CLEANUP
// ============================================================================

/**
 * Delete expired OTPs (cleanup job)
 * 
 * @returns {Promise<number>} Number of OTPs deleted
 */
export async function deleteExpiredOtps(): Promise<number> {
    const result = await prisma.adminOtp.deleteMany({
        where: {
            expiresAt: {
                lt: new Date(),
            },
        },
    })

    return result.count
}

/**
 * Delete used OTPs older than specified age
 * 
 * @param {number} ageInDays - Age in days
 * @returns {Promise<number>} Number of OTPs deleted
 */
export async function deleteOldUsedOtps(ageInDays: number): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - ageInDays)

    const result = await prisma.adminOtp.deleteMany({
        where: {
            used: true,
            createdAt: {
                lt: cutoffDate,
            },
        },
    })

    return result.count
}
