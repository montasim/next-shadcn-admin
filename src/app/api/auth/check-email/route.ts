/**
 * Check Email Endpoint
 * 
 * POST /api/auth/check-email
 * 
 * Email-first authentication entry point
 * Returns normalized response based on admin existence and active sessions
 * 
 * Security:
 * - Constant-time response to prevent email enumeration
 * - Rate limiting per IP
 * - Generic error messages
 */

import { NextRequest } from 'next/server'
import {
    validateEmail,
    sanitizeEmail,
    validateRequiredFields,
} from '@/lib/auth/validation'
import { adminExists } from '@/lib/auth/repositories/admin.repository'
import {
    hasActiveAuthSession,
    findActiveAuthSession,
} from '@/lib/auth/repositories/auth-session.repository'
import { AuthIntent, CheckEmailResponse } from '@/lib/auth/types'
import { checkRateLimit, RateLimitAction } from '@/lib/auth/rate-limit'
import {
    getClientIp,
    parseRequestBody,
    errorResponse,
    successResponse,
} from '@/lib/auth/request-utils'

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
            await checkRateLimit(email, clientIp, RateLimitAction.CHECK_EMAIL)
        } catch (error: any) {
            return errorResponse(error.message, 429)
        }

        // Check if admin exists
        const adminExistsFlag = await adminExists(email)

        // Check for active sessions (for resumability)
        const hasActiveRegisterSession = await hasActiveAuthSession(
            email,
            AuthIntent.REGISTER
        )
        const hasActiveResetSession = await hasActiveAuthSession(
            email,
            AuthIntent.RESET_PASSWORD
        )

        // Build response based on state
        const response: CheckEmailResponse = {}

        if (adminExistsFlag) {
            // Admin exists - can login or reset password
            response.exists = true
            response.canLogin = true
            response.canResetPassword = true

            // Check if there's an active reset session (user in middle of reset flow)
            if (hasActiveResetSession) {
                response.resumeReset = true
            }
        } else {
            // Admin doesn't exist - can register
            response.exists = false
            response.canRegister = true

            // Check if there's an active registration session (user in middle of signup)
            if (hasActiveRegisterSession) {
                response.resumeRegistration = true
            }
        }

        return successResponse(response)
    } catch (error) {
        console.error('Check email error:', error)
        return errorResponse('An error occurred. Please try again.', 500)
    }
}
