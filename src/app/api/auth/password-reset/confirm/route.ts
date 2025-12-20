/**
 * Password Reset - Confirm New Password Endpoint
 * 
 * POST /api/auth/password-reset/confirm
 * 
 * Step 3 of password reset: Set new password
 * 
 * Security:
 * - Requires valid RESET_PASSWORD AuthSession
 * - Session must not be expired
 * - Password strength enforcement
 * - Password update via transaction
 * - AuthSession deleted immediately after use
 * - All RESET_PASSWORD OTPs invalidated
 */

import { NextRequest } from 'next/server'
import {
    validateEmail,
    sanitizeEmail,
    validatePassword,
    validateRequiredFields,
} from '@/lib/auth/validation'
import {
    findAdminByEmail,
    updateAdminPassword,
} from '@/lib/auth/repositories/admin.repository'
import { findActiveAuthSession } from '@/lib/auth/repositories/auth-session.repository'
import { invalidateAllOtps } from '@/lib/auth/repositories/otp.repository'
import { hashPassword } from '@/lib/auth/crypto'
import {
    getClientIp,
    parseRequestBody,
    errorResponse,
    successResponse,
} from '@/lib/auth/request-utils'
import { AuthIntent } from '@/lib/auth/types'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await parseRequestBody(request)

        // Validate required fields
        const validationError = validateRequiredFields(body, ['email', 'password'])
        if (validationError) {
            return errorResponse(validationError, 400)
        }

        const { email: rawEmail, password } = body

        // Sanitize and validate email
        const email = sanitizeEmail(rawEmail)
        if (!validateEmail(email)) {
            return errorResponse('Invalid email address', 400)
        }

        // Validate password strength
        const passwordValidation = validatePassword(password)
        if (!passwordValidation.valid) {
            return errorResponse(passwordValidation.errors.join('. '), 400)
        }

        // Check for valid RESET_PASSWORD AuthSession
        const authSession = await findActiveAuthSession(
            email,
            AuthIntent.RESET_PASSWORD
        )

        if (!authSession) {
            return errorResponse(
                'Session expired or invalid. Please verify your email again.',
                401
            )
        }

        // Verify session is not expired
        if (authSession.expiresAt < new Date()) {
            return errorResponse('Session expired. Please verify your email again.', 401)
        }

        // Verify admin exists
        const admin = await findAdminByEmail(email)
        if (!admin) {
            return errorResponse('Account not found.', 404)
        }

        // Hash new password
        const passwordHash = await hashPassword(password)

        // Update password, delete AuthSession, and invalidate OTPs in a transaction
        await prisma.$transaction(async (tx) => {
            // Update admin password
            await tx.admin.update({
                where: { email },
                data: { passwordHash },
            })

            // Delete RESET_PASSWORD AuthSession
            await tx.authSession.delete({
                where: { id: authSession.id },
            })

            // Invalidate all RESET_PASSWORD OTPs for this email
            await tx.adminOtp.updateMany({
                where: {
                    email,
                    intent: AuthIntent.RESET_PASSWORD,
                    used: false,
                },
                data: {
                    used: true,
                },
            })
        })

        // Return success response
        const response = {
            success: true,
            message: 'Password updated successfully. You can now login with your new password.',
        }

        return successResponse(response)
    } catch (error) {
        console.error('Confirm password reset error:', error)
        return errorResponse('An error occurred. Please try again.', 500)
    }
}
