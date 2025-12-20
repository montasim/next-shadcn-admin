/**
 * Registration - Send OTP Endpoint
 * 
 * POST /api/auth/register/send-otp
 * 
 * Step 1 of registration: Send OTP to email
 * 
 * Security:
 * - Email must NOT exist in Admin table
 * - Rate limiting (3 attempts per 10 minutes)
 * - OTP hashed before storage
 * - Invalidates previous REGISTER OTPs
 * - OTP expires in 10 minutes
 */

import { NextRequest } from 'next/server'
import {
    validateEmail,
    sanitizeEmail,
    validateRequiredFields,
} from '@/lib/auth/validation'
import { adminExists } from '@/lib/auth/repositories/admin.repository'
import { createOtpAndInvalidateOld } from '@/lib/auth/repositories/otp.repository'
import { generateOtp, hashOtp } from '@/lib/auth/crypto'
import { sendRegistrationOtp } from '@/lib/auth/email'
import { checkRateLimit, RateLimitAction } from '@/lib/auth/rate-limit'
import {
    getClientIp,
    parseRequestBody,
    errorResponse,
    successResponse,
} from '@/lib/auth/request-utils'
import { AuthIntent, SendOtpResponse } from '@/lib/auth/types'
import { findValidInviteByToken, markInviteAsUsed } from '@/lib/auth/repositories/invite.repository'

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

        const { email: rawEmail, inviteToken } = body

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

        // Check that email does NOT exist in Admin table
        const exists = await adminExists(email)
        if (exists) {
            return errorResponse(
                'An account with this email already exists. Please login instead.',
                409
            )
        }

        let intent = AuthIntent.REGISTER

        // Handle Invitation
        if (inviteToken) {
            const invite = await findValidInviteByToken(inviteToken)

            if (!invite) {
                return errorResponse('Invalid or expired invitation token', 400)
            }

            if (invite.email !== email) {
                return errorResponse('Email does not match invitation', 400)
            }

            await markInviteAsUsed(invite.id)
            intent = AuthIntent.INVITED

            // Create AuthSession immediately (bypass OTP)
            const { createAuthSessionAndInvalidateOld } = await import('@/lib/auth/repositories/auth-session.repository')
            const sessionExpiresAt = new Date()
            sessionExpiresAt.setMinutes(sessionExpiresAt.getMinutes() + 30) // 30 mins expiry

            await createAuthSessionAndInvalidateOld({
                email,
                intent,
                expiresAt: sessionExpiresAt,
            })

            const response: SendOtpResponse = {
                success: true,
                expiresAt: sessionExpiresAt.toISOString(),
                sessionCreated: true,
            }
            return successResponse(response)
        }

        // Generate 7-digit OTP
        const otp = generateOtp()

        // Hash OTP before storage
        const codeHash = await hashOtp(otp)

        // Calculate expiry
        const expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES)

        // Create OTP record and invalidate previous ones (atomic transaction)
        await createOtpAndInvalidateOld({
            email,
            codeHash,
            intent,
            expiresAt,
        })

        // Send OTP email
        try {
            await sendRegistrationOtp(email, otp)
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError)
            return errorResponse(
                'Failed to send verification email. Please try again.',
                500
            )
        }

        // Return success response WITHOUT revealing the OTP
        const response: SendOtpResponse = {
            success: true,
            expiresAt: expiresAt.toISOString(),
        }

        return successResponse(response)
    } catch (error) {
        console.error('Send registration OTP error:', error)
        return errorResponse('An error occurred. Please try again.', 500)
    }
}
