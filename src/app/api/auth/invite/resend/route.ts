/**
 * Resend Invite Endpoint
 * 
 * POST /api/auth/invite/resend
 * 
 * Allows a user with an expired or used invite token to request a new one.
 * 
 * Security:
 * - Requires a valid (or previously valid) token to identify the user
 * - Rate limiting should ideally be applied (skipping for now based on user flow focus)
 * - Checks if user is already registered to prevent abuse
 */

import { NextRequest } from 'next/server'
import {
    parseRequestBody,
    errorResponse,
    successResponse,
} from '@/lib/auth/request-utils'
import { findInviteByToken, createInvite } from '@/lib/auth/repositories/invite.repository'
import { adminExists } from '@/lib/auth/repositories/admin.repository'
import { sendInvitationEmail } from '@/lib/auth/email'

export async function POST(request: NextRequest) {
    try {
        const body = await parseRequestBody(request)
        const { token } = body

        if (!token) {
            return errorResponse('Token is required', 400)
        }

        // 1. Find the invite (even if used)
        const invite = await findInviteByToken(token)

        if (!invite) {
            return errorResponse('Invalid token', 400)
        }

        // 2. Check if user is already registered
        const isRegistered = await adminExists(invite.email)
        if (isRegistered) {
            return errorResponse('Account already exists. Please sign in.', 409)
        }

        // 3. Generate new invite (updates existing record)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

        const newInvite = await createInvite({
            email: invite.email,
            invitedBy: invite.invitedBy,
            expiresAt,
        })

        // 4. Send email
        await sendInvitationEmail(newInvite.email, newInvite.token)

        return successResponse({
            success: true,
            message: 'New invitation sent'
        })

    } catch (error) {
        console.error('Resend invite error:', error)
        return errorResponse('An error occurred. Please try again.', 500)
    }
}
