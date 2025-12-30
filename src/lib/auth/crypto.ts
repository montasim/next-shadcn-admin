/**
 * Cryptography Utilities
 * 
 * Following Single Responsibility Principle (SRP):
 * This module handles all cryptographic operations including:
 * - OTP generation
 * - Password/OTP hashing
 * - Constant-time comparisons
 * - Session ID generation
 * 
 * Security measures:
 * - Cryptographically secure random generators
 * - bcrypt for password/OTP hashing
 * - Constant-time comparisons to prevent timing attacks
 */

import { randomBytes, timingSafeEqual } from 'crypto'
import * as bcrypt from 'bcrypt'

// ============================================================================
// CONSTANTS - Following Interface Segregation Principle (ISP)
// ============================================================================

const BCRYPT_SALT_ROUNDS = 12
const OTP_LENGTH = 6
const SESSION_ID_BYTES = 32

// ============================================================================
// OTP GENERATION
// ============================================================================

/**
 * Generate a cryptographically secure 6-digit OTP
 *
 * @returns {string} 6-digit OTP as string
 *
 * Security: Uses crypto.randomBytes for cryptographic randomness
 */
export function generateOtp(): string {
    // Generate random number between 100000 and 999999
    const min = 100000
    const max = 999999
    const range = max - min + 1

    // Generate random bytes and convert to number
    const randomValue = randomBytes(4).readUInt32BE(0)
    const otp = min + (randomValue % range)

    return otp.toString()
}

// ============================================================================
// HASHING FUNCTIONS
// ============================================================================

/**
 * Hash an OTP using bcrypt
 * 
 * @param {string} otp - Plain text OTP
 * @returns {Promise<string>} Hashed OTP
 * 
 * Security: Uses bcrypt with 12 salt rounds
 */
export async function hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, BCRYPT_SALT_ROUNDS)
}

/**
 * Hash a password using bcrypt
 * 
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 * 
 * Security: Uses bcrypt with 12 salt rounds
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Verify an OTP against its hash using constant-time comparison
 * 
 * @param {string} otp - Plain text OTP to verify
 * @param {string} hash - Hashed OTP to compare against
 * @returns {Promise<boolean>} True if OTP matches hash
 * 
 * Security: Uses bcrypt.compare which includes constant-time comparison
 */
export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
    return bcrypt.compare(otp, hash)
}

/**
 * Verify a password against its hash using constant-time comparison
 * 
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Hashed password to compare against
 * @returns {Promise<boolean>} True if password matches hash
 * 
 * Security: Uses bcrypt.compare which includes constant-time comparison
 */
export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

/**
 * Generate a dummy hash for timing attack protection
 * Used when user doesn't exist to maintain constant response time
 * 
 * @returns {Promise<string>} Dummy bcrypt hash
 */
export async function generateDummyHash(): Promise<string> {
    // Generate a consistent dummy hash (this will be the same each time)
    // This ensures verification timing is consistent
    return '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIGqrK.'
}

// ============================================================================
// SESSION ID GENERATION
// ============================================================================

/**
 * Generate a cryptographically secure session ID
 * 
 * @returns {string} Session ID as hex string
 * 
 * Security: Uses crypto.randomBytes for cryptographic randomness
 */
export function generateSessionId(): string {
    return randomBytes(SESSION_ID_BYTES).toString('hex')
}

// ============================================================================
// CONSTANT-TIME COMPARISON
// ============================================================================

/**
 * Constant-time string comparison to prevent timing attacks
 * 
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings are equal
 * 
 * Security: Uses crypto.timingSafeEqual for constant-time comparison
 * Note: Strings must be same length or comparison will fail
 */
export function constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false
    }

    try {
        const bufferA = Buffer.from(a, 'utf8')
        const bufferB = Buffer.from(b, 'utf8')
        return timingSafeEqual(bufferA, bufferB)
    } catch {
        return false
    }
}

/**
 * Generate a cryptographically secure invite token
 *
 * @returns {string} Token as hex string
 */
export function generateToken(): string {
    return randomBytes(32).toString('hex')
}
