/**
 * User Logout API Route
 *
 * Handles user logout by invalidating the current session
 * Supports logout from current device or all devices
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserSession, deleteUserLoginSession, deleteAllUserSessions } from '@/lib/user/auth/session'
import { UserApiResponse } from '@/lib/user/auth/types'

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const LogoutSchema = z.object({
    logoutAllDevices: z.boolean().optional().default(false),
})

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * POST /api/auth/user/logout
 *
 * Logout user by invalidating session(s)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { logoutAllDevices } = LogoutSchema.parse(body)

        // Get current session
        const session = await getUserSession()

        if (!session) {
            return NextResponse.json({
                success: true,
                message: 'Already logged out'
            } as UserApiResponse)
        }

        if (logoutAllDevices) {
            // Logout from all devices
            await deleteAllUserSessions(session.userId)

            return NextResponse.json({
                success: true,
                message: 'Logged out from all devices successfully'
            } as UserApiResponse)
        } else {
            // Logout from current device only
            await deleteUserLoginSession(session.sessionId)

            return NextResponse.json({
                success: true,
                message: 'Logged out successfully'
            } as UserApiResponse)
        }

    } catch (error) {
        console.error('Logout error:', error)

        // Even if there's an error, try to clear the cookie
        try {
            await deleteUserLoginSession()
        } catch (sessionError) {
            console.error('Failed to clear session cookie:', sessionError)
        }

        return NextResponse.json({
            success: false,
            error: 'Logout failed',
            message: 'An error occurred during logout'
        } as UserApiResponse, { status: 500 })
    }
}

/**
 * GET /api/auth/user/logout
 *
 * Simple logout without request body (logs out current device)
 */
export async function GET() {
    try {
        const session = await getUserSession()

        if (!session) {
            return NextResponse.json({
                success: true,
                message: 'Already logged out'
            } as UserApiResponse)
        }

        await deleteUserLoginSession(session.sessionId)

        return NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        } as UserApiResponse)

    } catch (error) {
        console.error('Logout error:', error)

        // Even if there's an error, try to clear the cookie
        try {
            await deleteUserLoginSession()
        } catch (sessionError) {
            console.error('Failed to clear session cookie:', sessionError)
        }

        return NextResponse.json({
            success: false,
            error: 'Logout failed',
            message: 'An error occurred during logout'
        } as UserApiResponse, { status: 500 })
    }
}