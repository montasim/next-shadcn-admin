/**
 * Login Endpoint
 * 
 * POST /api/auth/login
 * 
 * Direct login with email and password
 * 
 * Security:
 * - Constant-time password comparison (with dummy hash for non-existent users)
 * - Generic error messages (no hint about which field is wrong)
 * - Rate limiting per email + IP
 * - HttpOnly session cookie
 */

import { NextRequest } from 'next/server'
import {
    validateEmail,
    sanitizeEmail,
    validateRequiredFields,
} from '@/lib/auth/validation'
import { findAdminByEmail } from '@/lib/auth/repositories/admin.repository'
import {
    verifyPassword,
    generateDummyHash,
} from '@/lib/auth/crypto'
import { createLoginSession } from '@/lib/auth/session'
import { checkRateLimit, RateLimitAction, resetRateLimit } from '@/lib/auth/rate-limit'
import {
    getClientIp,
    parseRequestBody,
    errorResponse,
    successResponse,
} from '@/lib/auth/request-utils'
import { LoginResponse } from '@/lib/auth/types'

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
            return errorResponse('Invalid email or password', 401)
        }

        // Rate limiting
        const clientIp = getClientIp(request)
        try {
            await checkRateLimit(email, clientIp, RateLimitAction.LOGIN)
        } catch (error: any) {
            return errorResponse(error.message, 429)
        }

        // Fetch admin by email
        const admin = await findAdminByEmail(email)

        // ALWAYS perform bcrypt comparison to prevent timing attacks
        let isValidPassword = false
        if (admin) {
            // Admin exists - verify against actual password hash
            isValidPassword = await verifyPassword(password, admin.passwordHash)
        } else {
            // Admin doesn't exist - verify against dummy hash
            // This ensures constant response time regardless of email existence
            const dummyHash = await generateDummyHash()
            await verifyPassword(password, dummyHash)
            isValidPassword = false
        }

        // Check authentication result
        if (!admin || !isValidPassword) {
            // Generic error message - no hint about which field is wrong
            return errorResponse('Invalid email or password', 401)
        }

        // Reset rate limit on successful login
        await resetRateLimit(email, clientIp, RateLimitAction.LOGIN)

        // Create authenticated session with HttpOnly cookie
        await createLoginSession(admin.id, admin.email, admin.name)

        // Return success response with admin data
        const response: LoginResponse = {
            success: true,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
            },
        }

        return successResponse(response)
    } catch (error) {
        console.error('Login error:', error)
        return errorResponse('An error occurred. Please try again.', 500)
    }
}
