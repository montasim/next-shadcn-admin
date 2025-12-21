/**
 * Get Current User Endpoint
 * 
 * GET /api/auth/me
 * 
 * Returns the currently authenticated admin's information
 * 
 * Security:
 * - Requires valid session cookie
 * - Returns 401 if not authenticated
 */

import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { findAdminById } from '@/lib/auth/repositories/admin.repository'
import { successResponse, errorResponse } from '@/lib/auth/request-utils'
import { getUserDisplayName } from '@/lib/utils/user'

export async function GET(request: NextRequest) {
    try {
        // Get session from cookie
        const session = await getSession()

        if (!session) {
            return errorResponse('Not authenticated', 401)
        }

        // Fetch admin from database to ensure it still exists
        const admin = await findAdminById(session.adminId)

        if (!admin) {
            return errorResponse('Admin account not found', 404)
        }

        // Construct display name with fallbacks
        const displayName = getUserDisplayName({
            firstName: admin.firstName,
            lastName: admin.lastName,
            username: admin.username,
            name: admin.name,
            email: admin.email
        })

        // Return admin data
        return successResponse({
            admin: {
                id: admin.id,
                email: admin.email,
                name: displayName,
                firstName: admin.firstName,
                lastName: admin.lastName,
                username: admin.username,
                createdAt: admin.createdAt,
                updatedAt: admin.updatedAt,
            },
        })
    } catch (error) {
        console.error('Get current user error:', error)
        return errorResponse('An error occurred.', 500)
    }
}
