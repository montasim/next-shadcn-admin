/**
 * Rate Limiting Module
 * 
 * Following Single Responsibility Principle (SRP):
 * This module handles rate limiting for authentication endpoints
 * to prevent abuse and brute-force attacks
 * 
 * Features:
 * - In-memory rate limiting (upgradeable to Redis)
 * - Composite keys (email + IP + action)
 * - Automatic cleanup of expired entries
 * - Configurable limits per action type
 */

import { RateLimitError } from './types'

// ============================================================================
// TYPES
// ============================================================================

interface RateLimitEntry {
    count: number
    expiresAt: number
}

type RateLimitStore = Map<string, RateLimitEntry>

// ============================================================================
// RATE LIMIT CONFIGURATION
// ============================================================================

export enum RateLimitAction {
    SEND_OTP = 'SEND_OTP',
    VERIFY_OTP = 'VERIFY_OTP',
    LOGIN = 'LOGIN',
    CHECK_EMAIL = 'CHECK_EMAIL',
}

interface RateLimitConfig {
    maxAttempts: number
    windowMs: number // Time window in milliseconds
}

const RATE_LIMIT_CONFIGS: Record<RateLimitAction, RateLimitConfig> = {
    [RateLimitAction.SEND_OTP]: {
        maxAttempts: 3,
        windowMs: 10 * 60 * 1000, // 10 minutes
    },
    [RateLimitAction.VERIFY_OTP]: {
        maxAttempts: 5,
        windowMs: 10 * 60 * 1000, // 10 minutes
    },
    [RateLimitAction.LOGIN]: {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
    },
    [RateLimitAction.CHECK_EMAIL]: {
        maxAttempts: 20,
        windowMs: 5 * 60 * 1000, // 5 minutes
    },
}

// ============================================================================
// RATE LIMIT STORE
// ============================================================================

// In-memory store (replace with Redis for production multi-instance deployment)
const rateLimitStore: RateLimitStore = new Map()

// ============================================================================
// CLEANUP SCHEDULER
// ============================================================================

/**
 * Clean up expired rate limit entries
 * Runs periodically to prevent memory leaks
 */
function cleanupExpiredEntries() {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.expiresAt < now) {
            keysToDelete.push(key)
        }
    }

    for (const key of keysToDelete) {
        rateLimitStore.delete(key)
    }
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
    setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
}

// ============================================================================
// RATE LIMIT FUNCTIONS
// ============================================================================

/**
 * Generate rate limit key from composite identifier
 * 
 * @param {string} identifier - Identifier (email or IP)
 * @param {string} ip - IP address
 * @param {RateLimitAction} action - Action type
 * @returns {string} Composite key
 */
function getRateLimitKey(
    identifier: string,
    ip: string,
    action: RateLimitAction
): string {
    return `${action}:${identifier}:${ip}`
}

/**
 * Check if request is rate limited
 * 
 * @param {string} identifier - Identifier (usually email)
 * @param {string} ip - IP address
 * @param {RateLimitAction} action - Action type
 * @throws {RateLimitError} If rate limit exceeded
 */
export async function checkRateLimit(
    identifier: string,
    ip: string,
    action: RateLimitAction
): Promise<void> {
    const config = RATE_LIMIT_CONFIGS[action]
    const key = getRateLimitKey(identifier, ip, action)
    const now = Date.now()

    const entry = rateLimitStore.get(key)

    if (!entry) {
        // First attempt - create new entry
        rateLimitStore.set(key, {
            count: 1,
            expiresAt: now + config.windowMs,
        })
        return
    }

    // Check if entry has expired
    if (entry.expiresAt < now) {
        // Reset entry
        rateLimitStore.set(key, {
            count: 1,
            expiresAt: now + config.windowMs,
        })
        return
    }

    // Check if rate limit exceeded
    if (entry.count >= config.maxAttempts) {
        const retryAfter = Math.ceil((entry.expiresAt - now) / 1000)
        throw new RateLimitError(
            `Too many attempts. Please try again in ${retryAfter} seconds.`,
            retryAfter
        )
    }

    // Increment count
    entry.count++
    rateLimitStore.set(key, entry)
}

/**
 * Reset rate limit for a specific identifier and action
 * Used after successful operations
 * 
 * @param {string} identifier - Identifier (usually email)
 * @param {string} ip - IP address
 * @param {RateLimitAction} action - Action type
 */
export async function resetRateLimit(
    identifier: string,
    ip: string,
    action: RateLimitAction
): Promise<void> {
    const key = getRateLimitKey(identifier, ip, action)
    rateLimitStore.delete(key)
}

/**
 * Get remaining attempts for a specific identifier and action
 * 
 * @param {string} identifier - Identifier (usually email)
 * @param {string} ip - IP address
 * @param {RateLimitAction} action - Action type
 * @returns {number} Remaining attempts
 */
export async function getRemainingAttempts(
    identifier: string,
    ip: string,
    action: RateLimitAction
): Promise<number> {
    const config = RATE_LIMIT_CONFIGS[action]
    const key = getRateLimitKey(identifier, ip, action)
    const now = Date.now()

    const entry = rateLimitStore.get(key)

    if (!entry || entry.expiresAt < now) {
        return config.maxAttempts
    }

    return Math.max(0, config.maxAttempts - entry.count)
}
