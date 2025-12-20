/**
 * Session Management Module
 * 
 * Following Single Responsibility Principle (SRP):
 * This module handles session creation, validation, and deletion
 * using HttpOnly cookies for security
 * 
 * Features:
 * - HttpOnly cookie-based sessions
 * - Secure and SameSite attributes
 * - Session expiry management
 * - Type-safe session data
 */

import { cookies } from 'next/headers'
import { LoginSessionData, SessionExpiredError } from './types'

// ============================================================================
// SESSION CONFIGURATION
// ============================================================================

const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

// ============================================================================
// SESSION CREATION
// ============================================================================

/**
 * Create a login session and set HttpOnly cookie
 * 
 * @param {string} adminId - Admin ID
 * @param {string} email - Admin email
 * @param {string} name - Admin name
 * 
 * Security: Uses HttpOnly, Secure (in production), SameSite=Lax
 */
export async function createLoginSession(
    adminId: string,
    email: string,
    name: string
): Promise<void> {
    const sessionData: LoginSessionData = {
        adminId,
        email,
        name,
    }

    const cookieStore = await cookies()

    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
    })
}

// ============================================================================
// SESSION RETRIEVAL
// ============================================================================

/**
 * Get current session from HttpOnly cookie
 * 
 * @returns {Promise<LoginSessionData | null>} Session data or null if not found
 */
export async function getSession(): Promise<LoginSessionData | null> {
    try {
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

        if (!sessionCookie || !sessionCookie.value) {
            return null
        }

        const sessionData = JSON.parse(sessionCookie.value) as LoginSessionData

        // Validate session data structure
        if (
            !sessionData.adminId ||
            !sessionData.email ||
            !sessionData.name
        ) {
            return null
        }

        return sessionData
    } catch (error) {
        console.error('Error parsing session:', error)
        return null
    }
}

/**
 * Require authenticated session (throws if not authenticated)
 * 
 * @returns {Promise<LoginSessionData>} Session data
 * @throws {SessionExpiredError} If session not found
 */
export async function requireAuth(): Promise<LoginSessionData> {
    const session = await getSession()

    if (!session) {
        throw new SessionExpiredError('Authentication required. Please login.')
    }

    return session
}

// ============================================================================
// SESSION DELETION
// ============================================================================

/**
 * Delete session (logout)
 */
export async function deleteSession(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

/**
 * Check if user is authenticated
 * 
 * @returns {Promise<boolean>} True if authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const session = await getSession()
    return session !== null
}
