/**
 * Cleanup Jobs Module
 * 
 * Following Single Responsibility Principle (SRP):
 * This module provides cleanup jobs for expired OTPs and AuthSessions
 * 
 * Usage:
 * - Can be run manually via API endpoint
 * - Can be scheduled via cron job
 * - All operations are idempotent and safe for concurrent execution
 */

import {
    deleteExpiredOtps,
    deleteOldUsedOtps,
} from './repositories/otp.repository'
import {
    deleteExpiredAuthSessions,
    deleteOldAuthSessions,
} from './repositories/auth-session.repository'

// ============================================================================
// CLEANUP FUNCTIONS
// ============================================================================

/**
 * Clean up all expired OTPs
 * Safe to run frequently (e.g., every hour)
 * 
 * @returns {Promise<number>} Number of OTPs deleted
 */
export async function cleanupExpiredOtps(): Promise<number> {
    try {
        const count = await deleteExpiredOtps()
        console.log(`Cleanup: Deleted ${count} expired OTPs`)
        return count
    } catch (error) {
        console.error('Error cleaning up expired OTPs:', error)
        throw error
    }
}

/**
 * Clean up all expired auth sessions
 * Safe to run frequently (e.g., every hour)
 * 
 * @returns {Promise<number>} Number of sessions deleted
 */
export async function cleanupExpiredAuthSessions(): Promise<number> {
    try {
        const count = await deleteExpiredAuthSessions()
        console.log(`Cleanup: Deleted ${count} expired auth sessions`)
        return count
    } catch (error) {
        console.error('Error cleaning up expired auth sessions:', error)
        throw error
    }
}

/**
 * Clean up old used OTPs (older than specified days)
 * Recommended to run daily
 * 
 * @param {number} ageInDays - Delete OTPs older than this many days (default: 7)
 * @returns {Promise<number>} Number of OTPs deleted
 */
export async function cleanupOldUsedOtps(ageInDays: number = 7): Promise<number> {
    try {
        const count = await deleteOldUsedOtps(ageInDays)
        console.log(`Cleanup: Deleted ${count} old used OTPs`)
        return count
    } catch (error) {
        console.error('Error cleaning up old used OTPs:', error)
        throw error
    }
}

/**
 * Clean up old auth sessions (older than specified days)
 * Recommended to run daily
 * 
 * @param {number} ageInDays - Delete sessions older than this many days (default: 30)
 * @returns {Promise<number>} Number of sessions deleted
 */
export async function cleanupOldAuthSessions(
    ageInDays: number = 30
): Promise<number> {
    try {
        const count = await deleteOldAuthSessions(ageInDays)
        console.log(`Cleanup: Deleted ${count} old auth sessions`)
        return count
    } catch (error) {
        console.error('Error cleaning up old auth sessions:', error)
        throw error
    }
}

/**
 * Run all cleanup jobs
 * Recommended to schedule this via cron (e.g., every hour)
 * 
 * @returns {Promise<CleanupResult>} Cleanup results
 */
export async function runAllCleanupJobs(): Promise<{
    expiredOtps: number
    expiredSessions: number
    oldOtps: number
    oldSessions: number
}> {
    console.log('Starting cleanup jobs...')

    const [expiredOtps, expiredSessions, oldOtps, oldSessions] =
        await Promise.all([
            cleanupExpiredOtps(),
            cleanupExpiredAuthSessions(),
            cleanupOldUsedOtps(7),
            cleanupOldAuthSessions(30),
        ])

    console.log('Cleanup jobs completed')

    return {
        expiredOtps,
        expiredSessions,
        oldOtps,
        oldSessions,
    }
}
