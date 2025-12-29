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
import { findUserByEmail } from '@/lib/user/repositories/user.repository'
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
import { logActivity } from '@/lib/activity/logger'
import { ActivityAction, ActivityResourceType } from '@prisma/client'

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

        // Fetch user by email (works for both admin and regular users)
        const user = await findUserByEmail(email)

        // ALWAYS perform bcrypt comparison to prevent timing attacks
        let isValidPassword = false
        if (user) {
            // User exists - verify against actual password hash
            isValidPassword = await verifyPassword(password, user.passwordHash)
        } else {
            // User doesn't exist - verify against dummy hash
            // This ensures constant response time regardless of email existence
            const dummyHash = await generateDummyHash()
            await verifyPassword(password, dummyHash)
            isValidPassword = false
        }

        // Check authentication result
        if (!user || !isValidPassword || !user.isActive) {
            // Log failed login attempt (non-blocking)
            if (user) {
                logActivity({
                    userId: user.id,
                    userRole: user.role,
                    action: ActivityAction.LOGIN_FAILED,
                    resourceType: ActivityResourceType.USER,
                    resourceId: user.id,
                    description: 'Failed login attempt: Invalid password or inactive account',
                    endpoint: '/api/auth/login',
                }).catch(console.error)
            } else {
                logActivity({
                    action: ActivityAction.LOGIN_FAILED,
                    resourceType: ActivityResourceType.USER,
                    description: `Failed login attempt for email: ${email}`,
                    metadata: { email },
                    endpoint: '/api/auth/login',
                }).catch(console.error)
            }

            // Generic error message - no hint about which field is wrong
            return errorResponse('Invalid email or password', 401)
        }

        // Reset rate limit on successful login
        await resetRateLimit(email, clientIp, RateLimitAction.LOGIN)

        // Create authenticated session with HttpOnly cookie
        const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
        await createLoginSession(
            user.id,
            user.email,
            displayName,
            user.role,
            user.firstName || '',
            user.lastName || null,
            user.isPremium || false,
            user.avatar || null
        )

        // Log login activity (non-blocking)
        logActivity({
            userId: user.id,
            userRole: user.role,
            action: ActivityAction.LOGIN,
            resourceType: ActivityResourceType.USER,
            resourceId: user.id,
            resourceName: displayName,
            description: `User logged in as ${user.role}`,
            endpoint: '/api/auth/login',
        }).catch(console.error)

        // Return success response with user data including role
        const response: LoginResponse = {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isPremium: user.isPremium,
            },
        }

        return successResponse(response)
    } catch (error) {
        console.error('Login error:', error)
        return errorResponse('An error occurred. Please try again.', 500)
    }
}
