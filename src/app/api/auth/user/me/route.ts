/**
 * Current User Information API Route
 *
 * Provides information about the currently authenticated user
 * Includes profile, subscription status, and reading statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUserAuth } from '@/lib/user/auth/session'
import {
    findUserById,
    getUserReadingStats
} from '@/lib/user/repositories/user.repository'
import {
    findSubscriptionByUserId,
    hasActivePremiumSubscription
} from '@/lib/user/repositories/subscription.repository'
import {
    getUserBookshelfStats
} from '@/lib/user/repositories/bookshelf.repository'
import { UserApiResponse } from '@/lib/user/auth/types'

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * GET /api/auth/user/me
 *
 * Get current user's profile and statistics
 */
export async function GET(request: NextRequest) {
    try {
        // Require authentication
        const session = await requireUserAuth()

        // Get user data with full profile
        const user = await findUserById(session.userId)

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found',
                message: 'Your account could not be found'
            } as UserApiResponse, { status: 404 })
        }

        // Get subscription information
        const subscription = await findSubscriptionByUserId(user.id)
        const hasPremium = await hasActivePremiumSubscription(user.id)
        const isPremium = user.isPremium || hasPremium

        // Prepare subscription info
        let subscriptionInfo = null
        if (subscription) {
            const isExpired = subscription.endDate ? subscription.endDate < new Date() : false
            const daysRemaining = subscription.endDate
                ? Math.ceil((subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null

            subscriptionInfo = {
                plan: subscription.plan,
                isActive: subscription.isActive && !isExpired,
                startDate: subscription.startDate.toISOString(),
                endDate: subscription.endDate?.toISOString() || null,
                isExpired,
                daysRemaining: daysRemaining && daysRemaining > 0 ? daysRemaining : null,
            }
        }

        // Get reading statistics
        const readingStats = await getUserReadingStats(user.id)

        // Get bookshelf statistics
        const bookshelfStats = await getUserBookshelfStats(user.id)

        // Return comprehensive user information
        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatar: user.avatar,
                    isPremium: isPremium,
                    isActive: user.isActive,
                    createdAt: user.createdAt.toISOString(),
                    updatedAt: user.updatedAt.toISOString(),
                },
                subscription: subscriptionInfo,
                statistics: {
                    reading: {
                        totalBooks: readingStats.totalBooks,
                        completedBooks: readingStats.completedBooks,
                        inProgressBooks: readingStats.inProgressBooks,
                        completionRate: Math.round(readingStats.completionRate * 100) / 100,
                    },
                    bookshelves: {
                        totalBookshelves: bookshelfStats.totalBookshelves,
                        publicBookshelves: bookshelfStats.publicBookshelves,
                        privateBookshelves: bookshelfStats.privateBookshelves,
                        totalBooks: bookshelfStats.totalBooks,
                        averageBooksPerShelf: bookshelfStats.averageBooksPerShelf,
                    },
                },
                permissions: {
                    canReadPremiumBooks: isPremium,
                    canCreateBookshelves: true,
                    canShareBookshelves: true,
                    canAccessPublicBooks: true,
                }
            },
            message: 'User information retrieved successfully'
        } as UserApiResponse)

    } catch (error) {
        console.error('Get user info error:', error)

        if (error instanceof Error && error.name === 'UserSessionExpiredError') {
            return NextResponse.json({
                success: false,
                error: 'Authentication required',
                message: 'Please login to access this resource'
            } as UserApiResponse, { status: 401 })
        }

        return NextResponse.json({
            success: false,
            error: 'Failed to get user information',
            message: 'An error occurred while retrieving user data'
        } as UserApiResponse, { status: 500 })
    }
}

/**
 * PUT /api/auth/user/me
 *
 * Update current user's profile
 */
export async function PUT(request: NextRequest) {
    try {
        // Require authentication
        const session = await requireUserAuth()

        const body = await request.json()
        const { name, avatar } = body

        // Validate input
        if (name && (typeof name !== 'string' || name.length < 2 || name.length > 100)) {
            return NextResponse.json({
                success: false,
                error: 'Validation failed',
                message: 'Name must be between 2 and 100 characters'
            } as UserApiResponse, { status: 400 })
        }

        // Update user profile
        const { updateUser } = await import('@/lib/user/repositories/user.repository')
        const updatedUser = await updateUser(session.userId, {
            name,
            avatar,
        })

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    name: updatedUser.name,
                    avatar: updatedUser.avatar,
                    isPremium: updatedUser.isPremium,
                    updatedAt: updatedUser.updatedAt.toISOString(),
                }
            },
            message: 'Profile updated successfully'
        } as UserApiResponse)

    } catch (error) {
        console.error('Update profile error:', error)

        if (error instanceof Error && error.name === 'UserSessionExpiredError') {
            return NextResponse.json({
                success: false,
                error: 'Authentication required',
                message: 'Please login to access this resource'
            } as UserApiResponse, { status: 401 })
        }

        return NextResponse.json({
            success: false,
            error: 'Failed to update profile',
            message: 'An error occurred while updating your profile'
        } as UserApiResponse, { status: 500 })
    }
}