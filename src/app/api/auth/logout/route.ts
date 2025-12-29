/**
 * Logout Endpoint
 *
 * POST /api/auth/logout
 *
 * Logs out the current user by deleting the session cookie
 */

import { NextRequest } from 'next/server'
import { deleteSession, getSession } from '@/lib/auth/session'
import { successResponse, errorResponse } from '@/lib/auth/request-utils'
import { logActivity } from '@/lib/activity/logger'
import { ActivityAction, ActivityResourceType } from '@prisma/client'

export async function POST(request: NextRequest) {
    try {
        // Get session before deleting (for logging)
        const session = await getSession()

        // Delete session cookie
        await deleteSession()

        // Log logout activity (non-blocking)
        if (session) {
            logActivity({
                userId: session.userId,
                userRole: session.role as any,
                action: ActivityAction.LOGOUT,
                resourceType: ActivityResourceType.USER,
                resourceId: session.userId,
                description: 'User logged out',
                endpoint: '/api/auth/logout',
            }).catch(console.error)
        }

        return successResponse({
            message: 'Logged out successfully',
        })
    } catch (error) {
        console.error('Logout error:', error)
        return errorResponse('An error occurred during logout.', 500)
    }
}
