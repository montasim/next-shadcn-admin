/**
 * Registration - Verify OTP Endpoint
 * 
 * POST /api/auth/register/verify-otp
 * 
 * Step 2 of registration: Verify OTP and create AuthSession
 * 
 * Security:
 * - OTP must match email + REGISTER intent
 * - OTP must be unused and unexpired
 * - Single-use enforcement via transaction
 * - Creates AuthSession for resumability (30 minutes)
 * - Invalidates older REGISTER sessions
 */

import { NextRequest } from 'next/server'
import {
    validateEmail,
    sanitizeEmail,
    validateOtpFormat,
    validateRequiredFields,
} from '@/lib/auth/validation'
import {
    findValidOtp,
    markOtpAsUsed,
} from '@/lib/auth/repositories/otp.repository'
import { createAuthSessionAndInvalidateOld } from '@/lib/auth/repositories/auth-session.repository'
import { verifyOtp } from '@/lib/auth/crypto'
import { checkRateLimit, RateLimitAction, resetRateLimit } from '@/lib/auth/rate-limit'
import {
    getClientIp,
    parseRequestBody,
    errorResponse,
    successResponse,
} from '@/lib/auth/request-utils'
import { AuthIntent, VerifyOtpResponse } from '@/lib/auth/types'
import { prisma } from '@/lib/prisma'

const AUTH_SESSION_EXPIRY_MINUTES = 30

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await parseRequestBody(request)

        // Validate required fields
        const validationError = validateRequiredFields(body, ['email', 'otp'])
        if (validationError) {
            return errorResponse(validationError, 400)
        }

        const { email: rawEmail, otp } = body

        // Sanitize and validate email
        const email = sanitizeEmail(rawEmail)
        if (!validateEmail(email)) {
            return errorResponse('Invalid email address', 400)
        }

        // Validate OTP format
        if (!validateOtpFormat(otp)) {
            return errorResponse('Invalid OTP format', 400)
        }

        // Rate limiting
        const clientIp = getClientIp(request)
        try {
            await checkRateLimit(email, clientIp, RateLimitAction.VERIFY_OTP)
        } catch (error: any) {
            return errorResponse(error.message, 429)
        }

        // Find valid OTP for email and REGISTER or INVITED intent
        let otpRecord = await findValidOtp(email, AuthIntent.REGISTER)

        if (!otpRecord) {
            otpRecord = await findValidOtp(email, AuthIntent.INVITED)
        }

        if (!otpRecord) {
            return errorResponse(
                'Invalid or expired OTP. Please request a new one.',
                401
            )
        }

        // Verify OTP using constant-time comparison
        const isValid = await verifyOtp(otp, otpRecord.codeHash)

        if (!isValid) {
            return errorResponse(
                'Invalid or expired OTP. Please request a new one.',
                401
            )
        }

        // Calculate auth session expiry
        const sessionExpiresAt = new Date()
        sessionExpiresAt.setMinutes(
            sessionExpiresAt.getMinutes() + AUTH_SESSION_EXPIRY_MINUTES
        )

        // Mark OTP as used and create AuthSession in a transaction
        await prisma.$transaction(async (tx) => {
            // Mark OTP as used (single-use enforcement)
            await tx.adminOtp.update({
                where: { id: otpRecord.id },
                data: { used: true },
            })

            // Delete existing sessions for this email (matching the OTP intent)
            await tx.authSession.deleteMany({
                where: {
                    email,
                    intent: otpRecord.intent,
                },
            })

            // Create new AuthSession using the repository function's logic
            // but within this transaction
            const { generateSessionId } = await import('@/lib/auth/crypto')
            await tx.authSession.create({
                data: {
                    id: generateSessionId(),
                    email,
                    intent: otpRecord.intent,
                    expiresAt: sessionExpiresAt,
                },
            })
        })

        // Reset rate limit on successful verification
        await resetRateLimit(email, clientIp, RateLimitAction.VERIFY_OTP)

        // Return success response
        const response: VerifyOtpResponse = {
            verified: true,
            sessionExpiresAt: sessionExpiresAt.toISOString(),
        }

        return successResponse(response)
    } catch (error) {
        console.error('Verify registration OTP error:', error)
        return errorResponse('An error occurred. Please try again.', 500)
    }
}
