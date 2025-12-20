/**
 * Password Reset - Send OTP Endpoint
 * 
 * POST /api/auth/password-reset/send-otp
 * 
 * Step 1 of password reset: Send OTP to email
 * 
 * Security:
 * - ALWAYS returns generic success message (prevents email enumeration)
 * - OTP only sent if admin exists
 * - Rate limiting (3 attempts per 10 minutes)
 * - OTP hashed before storage
 * - Invalidates previous RESET_PASSWORD OTPs
 * - OTP expires in 10 minutes
 */

import { NextRequest } from 'next/server'
import {
    validateEmail,
    sanitizeEmail,
    validateRequiredFields,
} from '@/lib/auth/validation'
import {
    adminExists,
    findAdminByEmail,
} from '@/lib/auth/repositories/admin.repository'
import { createOtpAndInvalidateOld } from '@/lib/auth/repositories/otp.repository'
import { generateOtp, hashOtp } from '@/lib/auth/crypto'
import { sendPasswordResetOtp } from '@/lib/auth/email'
import { checkRateLimit, RateLimitAction } from '@/lib/auth/rate-limit'
import {
    getClientIp,
    parseRequestBody,
    errorResponse,
    successResponse,
} from '@/lib/auth/request-utils'
import { AuthIntent } from '@/lib/auth/types'

const OTP_EXPIRY_MINUTES = 10

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await parseRequestBody(request)

        // Validate required fields
        const validationError = validateRequiredFields(body, ['email'])
        if (validationError) {
            return errorResponse(validationError, 400)
        }

        const { email: rawEmail } = body

        // Sanitize and validate email
        const email = sanitizeEmail(rawEmail)
        if (!validateEmail(email)) {
            return errorResponse('Invalid email address', 400)
        }

        // Rate limiting
        const clientIp = getClientIp(request)
        try {
            await checkRateLimit(email, clientIp, RateLimitAction.SEND_OTP)
        } catch (error: any) {
            return errorResponse(error.message, 429)
        }

        // Check if admin exists
        const admin = await findAdminByEmail(email)

        if (admin) {
            // Admin exists - generate and send OTP
            const otp = generateOtp()
            const codeHash = await hashOtp(otp)

            // Calculate expiry
            const expiresAt = new Date()
            expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES)

            // Create OTP record and invalidate previous ones (atomic transaction)
            await createOtpAndInvalidateOld({
                email,
                codeHash,
                intent: AuthIntent.RESET_PASSWORD,
                expiresAt,
            })

            // Send OTP email
            try {
                await sendPasswordResetOtp(email, otp)
            } catch (emailError) {
                console.error('Failed to send password reset OTP email:', emailError)
                // Don't reveal email sending failure - still return generic success
            }
        }

        // ALWAYS return generic success message (prevent email enumeration)
        // Response is the same whether admin exists or not
        const response = {
            success: true,
            message:
                'If an account with that email exists, a password reset code has been sent.',
        }

        return successResponse(response)
    } catch (error) {
        console.error('Send password reset OTP error:', error)
        return errorResponse('An error occurred. Please try again.', 500)
    }
}
