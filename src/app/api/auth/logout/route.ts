/**
 * Logout Endpoint
 * 
 * POST /api/auth/logout
 * 
 * Logs out the current user by deleting the session cookie
 */

import { NextRequest } from 'next/server'
import { deleteSession } from '@/lib/auth/session'
import { successResponse, errorResponse } from '@/lib/auth/request-utils'

export async function POST(request: NextRequest) {
    try {
        // Delete session cookie
        await deleteSession()

        return successResponse({
            message: 'Logged out successfully',
        })
    } catch (error) {
        console.error('Logout error:', error)
        return errorResponse('An error occurred during logout.', 500)
    }
}
