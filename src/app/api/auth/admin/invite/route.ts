/**
 * Admin - Create Invitation Endpoint
 * 
 * POST /api/auth/admin/invite
 * 
 * Access: Authenticated Admin
 */

import { NextRequest } from 'next/server'
import {
    validateEmail,
    sanitizeEmail,
    validateRequiredFields,
} from '@/lib/auth/validation'
import {
    adminExists,
} from '@/lib/auth/repositories/admin.repository'
import {
    activeInviteExists,
    createInvite,
} from '@/lib/auth/repositories/invite.repository'
import {
    getClientIp,
    parseRequestBody,
    errorResponse,
    successResponse,
} from '@/lib/auth/request-utils'
import { getSession } from '@/lib/auth/session'
import { sendInvitationEmail } from '@/lib/auth/email'

export async function POST(request: NextRequest) {
    try {
        // 1. Verify Admin Authentication
        const session = await getSession()
        if (!session) {
            return errorResponse('Unauthorized', 401)
        }

        // 2. Parse Validations
        const body = await parseRequestBody(request)
        const validationError = validateRequiredFields(body, ['email'])
        if (validationError) {
            return errorResponse(validationError, 400)
        }

        const { email: rawEmail } = body
        const email = sanitizeEmail(rawEmail)

        if (!validateEmail(email)) {
            return errorResponse('Invalid email address', 400)
        }

        // 3. Check if Admin already exists
        const exists = await adminExists(email)
        if (exists) {
            return errorResponse('User with this email already exists', 409)
        }

        // 4. Check active invites
        if (await activeInviteExists(email)) {
            return errorResponse('An active invite already exists for this email', 409)
        }

        // 5. Create Invite
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

        const invite = await createInvite({
            email,
            invitedBy: session.adminId, // Assuming session has adminId
            expiresAt,
        })

        // 6. Send Email
        try {
            await sendInvitationEmail(email, invite.token)
        } catch (emailError) {
            console.error('Failed to send invitation email:', emailError)
            // We might want to rollback invite or just warn. 
            // For now, returning success but logging error, or erroring?
            // Spec says "Return success response". 
            // But if email fails, user can't register.
            // Let's error so admin can retry.
            return errorResponse('Failed to send invitation email', 500)
        }

        return successResponse({
            success: true,
            inviteId: invite.id,
        })
    } catch (error) {
        console.error('Create invitation error:', error)
        return errorResponse('An error occurred', 500)
    }
}
