/**
 * Access Control Utilities
 *
 * Centralized access control logic for books-old and premium content
 * Handles authorization checks for different user types and book types
 */

import { BookType } from '@prisma/client'
import { getSession, isAuthenticated } from '@/lib/auth/session'
import { AuthenticationError, SessionExpiredError } from '@/lib/auth/types'
import { publicConfig } from '@/config'

// ============================================================================
// BOOK ACCESS CONTROL
// ============================================================================

export interface BookAccessInfo {
    canAccess: boolean
    canRead: boolean
    requiresPremium: boolean
    reason?: string
    canDownload?: boolean
}

/**
 * Check if user can access a specific book
 *
 * @param {Object} book - Book information
 * @param {string} book.id - Book ID
 * @param {boolean} book.isPublic - Whether book is public
 * @param {boolean} book.requiresPremium - Whether book requires premium
 * @param {string} [book.type] - Book type (EBOOK, AUDIO, HARD_COPY)
 * @param {number} [book.numberOfCopies] - Number of copies available
 * @param {string} [userId] - Optional user ID (checks if provided)
 * @returns {Promise<BookAccessInfo>} Access information
 */
export async function checkBookAccess(
    book: {
        id: string
        isPublic: boolean
        requiresPremium: boolean
        type?: BookType
        numberOfCopies?: number
    },
    userId?: string
): Promise<BookAccessInfo> {
    // Check if book is public
    if (!book.isPublic) {
        return {
            canAccess: false,
            canRead: false,
            requiresPremium: false,
            reason: 'This book is not publicly available'
        }
    }

    // Get user session or use provided userId
    let userSession = null
    let userHasPremium = false

    if (userId) {
        // Check premium status for specific user
        const { isUserPremium } = await import('@/lib/user/repositories/user.repository')
        const { hasActivePremiumSubscription } = await import('@/lib/user/repositories/subscription.repository')

        const [premiumFlag, hasActiveSubscription] = await Promise.all([
            isUserPremium(userId),
            hasActivePremiumSubscription(userId)
        ])

        userHasPremium = premiumFlag || hasActiveSubscription
    } else {
        // Check current user session
        try {
            userSession = await getSession()
            userHasPremium = userSession?.role === 'USER' ? false : userSession?.role === 'ADMIN' ? true : false // Simplified premium check
        } catch (error) {
            // User not authenticated
        }
    }

    // Check premium access
    if (book.requiresPremium && !userHasPremium) {
        return {
            canAccess: false,
            canRead: false,
            requiresPremium: true,
            reason: 'This book requires a premium subscription'
        }
    }

    // Determine if user can read the book
    const canRead = determineReadCapability(book.type, book.numberOfCopies)

    // Determine if user can download the book
    const canDownload = determineDownloadCapability(book.type, userHasPremium)

    return {
        canAccess: true,
        canRead,
        requiresPremium: book.requiresPremium,
        canDownload
    }
}

/**
 * Determine if user can read based on book type
 */
function determineReadCapability(
    bookType?: BookType,
    numberOfCopies?: number
): boolean {
    if (!bookType) return false

    switch (bookType) {
        case BookType.EBOOK:
            return true // Ebooks can always be read
        case BookType.AUDIO:
            return true // Audiobooks can always be listened to
        case BookType.HARD_COPY:
            return numberOfCopies && numberOfCopies > 0 // Hard copies must have available copies
        default:
            return false
    }
}

/**
 * Determine if user can download based on book type
 */
function determineDownloadCapability(
    bookType?: BookType,
    userHasPremium?: boolean
): boolean {
    if (!bookType) return false

    switch (bookType) {
        case BookType.EBOOK:
            return true // Ebooks can be downloaded by everyone
        case BookType.AUDIO:
            return userHasPremium || false // Audiobooks require premium for download
        case BookType.HARD_COPY:
            return false // Hard copies cannot be downloaded
        default:
            return false
    }
}

/**
 * Require book access (throws if access denied)
 *
 * @param {Object} book - Book information
 * @throws {PremiumRequiredError} If premium access required
 * @throws {UserSessionExpiredError} If authentication required
 */
export async function requireBookAccess(
    book: {
        id: string
        isPublic: boolean
        requiresPremium: boolean
        type?: BookType
    }
): Promise<void> {
    const access = await checkBookAccess(book)

    if (!access.canAccess) {
        if (access.requiresPremium) {
            throw new AuthenticationError(access.reason || 'Premium access required')
        } else {
            throw new Error(access.reason || 'Access denied')
        }
    }
}

/**
 * Require premium access (throws if not premium)
 *
 * @throws {PremiumRequiredError} If user doesn't have premium access
 */
export async function requirePremium(): Promise<void> {
    const userSession = await getSession()

    if (!userSession) {
        throw new SessionExpiredError('Authentication required')
    }

    const userHasPremium = userSession?.role === 'USER' ? false : userSession?.role === 'ADMIN' ? true : false

    if (!userHasPremium) {
        throw new AuthenticationError('Premium subscription required to access this content')
    }
}

// ============================================================================
// FEATURE ACCESS CONTROL
// ============================================================================

export interface FeatureAccessInfo {
    canCreateBookshelves: boolean
    canShareBookshelves: boolean
    canTrackProgress: boolean
    canAccessPremiumBooks: boolean
    canDownloadBooks: boolean
    canUnlimitedReading: boolean
}

/**
 * Get user's feature access based on subscription level
 *
 * @returns {Promise<FeatureAccessInfo>} Feature access information
 */
export async function getFeatureAccess(): Promise<FeatureAccessInfo> {
    const userSession = await getSession()
    const userHasPremium = userSession ? (userSession.role === 'USER' ? false : userSession.role === 'ADMIN' ? true : false) : false

    return {
        canCreateBookshelves: !!userSession, // All authenticated users
        canShareBookshelves: !!userSession, // All authenticated users
        canTrackProgress: !!userSession, // All authenticated users
        canAccessPremiumBooks: userHasPremium,
        canDownloadBooks: userHasPremium, // Premium users can download
        canUnlimitedReading: userHasPremium, // Premium users have unlimited access
    }
}

/**
 * Check if user can perform a specific action
 *
 * @param {string} action - Action to check
 * @returns {Promise<boolean>} Whether user can perform the action
 */
export async function canPerformAction(action: keyof FeatureAccessInfo): Promise<boolean> {
    const features = await getFeatureAccess()
    return features[action]
}

// ============================================================================
// ROUTE PROTECTION UTILITIES
// ============================================================================

/**
 * Middleware function to protect routes that require authentication
 */
export async function requireAuthentication() {
    const userSession = await getSession()

    if (!userSession) {
        throw new SessionExpiredError('Authentication required')
    }

    return userSession
}

/**
 * Middleware function to protect routes that require premium access
 */
export async function requirePremiumAccess() {
    await requireAuthentication()
    await requirePremium()
}

/**
 * Check if user has sufficient access level for a route
 *
 * @param {'public' | 'authenticated' | 'premium'} requiredLevel - Required access level
 * @returns {Promise<boolean>} Whether user has sufficient access
 */
export async function hasSufficientAccess(
    requiredLevel: 'public' | 'authenticated' | 'premium'
): Promise<boolean> {
    switch (requiredLevel) {
        case 'public':
            return true // Everyone can access public routes
        case 'authenticated':
            return !!(await getSession()) // Must be authenticated
        case 'premium':
            const userSession = await getSession()
            return !!userSession && (userSession.role === 'USER' ? false : userSession.role === 'ADMIN' ? true : false) // Must be authenticated and have premium
        default:
            return false
    }
}

// ============================================================================
// BOOK SPECIFIC ACCESS CHECKS
// ============================================================================

/**
 * Check if user can read a specific type of book
 */
export async function canReadBookType(
    bookType: BookType,
    isPremium: boolean = false
): Promise<boolean> {
    const userSession = await getSession()
    const userHasPremium = userSession ? (userSession.role === 'USER' ? false : userSession.role === 'ADMIN' ? true : false) : false

    switch (bookType) {
        case BookType.EBOOK:
            return true // Everyone can read ebooks
        case BookType.AUDIO:
            return userHasPremium // Only premium users can read audiobooks
        case BookType.HARD_COPY:
            return true // Everyone can view hard copy information
        default:
            return false
    }
}

/**
 * Get access-restricted book URL
 *
 * @param {string} bookId - Book ID
 * @param {string} baseUrl - Base URL for the application
 * @returns {string} URL for access-restricted page
 */
export function getAccessRestrictedUrl(
    bookId: string,
    baseUrl: string = publicConfig.appUrl || 'http://localhost:3000'
): string {
    return `${baseUrl}/books/${bookId}?access=denied`
}

/**
 * Get subscription upgrade URL
 *
 * @param {string} baseUrl - Base URL for the application
 * @returns {string} URL for subscription page
 */
export function getSubscriptionUrl(
    baseUrl: string = publicConfig.appUrl || 'http://localhost:3000'
): string {
    return `${baseUrl}/subscription`
}