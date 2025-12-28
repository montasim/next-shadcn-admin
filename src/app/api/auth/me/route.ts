/**
 * Get Current User Endpoint
 *
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's information
 * Works for all user types (USER, ADMIN, SUPER_ADMIN)
 *
 * Security:
 * - Requires valid session cookie
 * - Returns 401 if not authenticated
 */

import { NextRequest } from 'next/server'
import { getSession, deleteSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'
import { successResponse, errorResponse } from '@/lib/auth/request-utils'
import { getUserDisplayName } from '@/lib/utils/user'

export async function GET(request: NextRequest) {
    try {
        // Get session from cookie
        const session = await getSession()

        if (!session) {
            // Delete any invalid/empty cookies and return error
            const response = errorResponse('Not authenticated', 401)
            response.cookies.delete('user_session')
            return response
        }

        // Fetch user from database to ensure it still exists
        const user = await findUserById(session.userId)

        if (!user || !user.isActive) {
            // User doesn't exist anymore or is inactive, delete session and return error
            await deleteSession()
            const response = errorResponse('User account not found or inactive', 404)
            response.cookies.delete('user_session')
            return response
        }

        // Construct display name with fallbacks
        const displayName = getUserDisplayName({
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            name: user.name,
            email: user.email
        })

        // Return user data with role information
        return successResponse({
            user: {
                id: user.id,
                email: user.email,
                name: displayName,
                role: user.role,
                isPremium: user.isPremium,
                showMoodRecommendations: user.showMoodRecommendations,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        })
    } catch (error) {
        console.error('Get current user error:', error)
        // Delete invalid session cookie on error
        const response = errorResponse('An error occurred.', 500)
        response.cookies.delete('user_session')
        return response
    }
}
