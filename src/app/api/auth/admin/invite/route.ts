/**
 * Admin - Create Invitation Endpoint
 * 
 * POST /api/auth/admin/invite
 * 
 * Access: Authenticated Admin
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
    validateEmail,
    sanitizeEmail,
} from '@/lib/auth/validation'
import { userExists } from '@/lib/user/repositories/user.repository'
import {
    activeInviteExists,
    createInvite,
} from '@/lib/auth/repositories/invite.repository'
import {
    parseRequestBody,
    errorResponse,
    successResponse,
} from '@/lib/auth/request-utils'
import { getSession } from '@/lib/auth/session'
import { sendInvitationEmail } from '@/lib/auth/email'

// Added inviteSchema for validation
const inviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
    desc: z.string().optional(),
})

export async function POST(request: NextRequest) {
    try {
        // 1. Verify Admin Authentication
        const session = await getSession()
        if (!session) {
            return errorResponse('Unauthorized', 401)
        }

        // Ensure only admins can invite
        if (!['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
            return errorResponse('Forbidden: Admin access required', 403)
        }

        // 2. Parse and Validate Request Body using Zod
        const body = await parseRequestBody(request)
        const { email: rawEmail, role, desc } = inviteSchema.parse(body)
        const email = sanitizeEmail(rawEmail)

        if (!validateEmail(email)) {
            return errorResponse('Invalid email address', 400)
        }

        // 3. Check if User already exists
        const exists = await userExists(email)
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

        const newInvite = await createInvite({
            email,
            invitedBy: session.email,
            role,
            desc,
            expiresAt,
        })

        // 6. Send Email
        try {
            await sendInvitationEmail(newInvite.email, newInvite.token, role, desc)
        } catch (emailError) {
            console.error('Failed to send invitation email:', emailError)
            return errorResponse('Failed to send invitation email', 500)
        }

        return successResponse({
            success: true,
            inviteId: newInvite.id,
        })
    } catch (error) {
        console.error('Create invitation error:', error)
        if (error instanceof z.ZodError) {
            return errorResponse(error.message, 400)
        }
        return errorResponse('An error occurred', 500)
    }
}
