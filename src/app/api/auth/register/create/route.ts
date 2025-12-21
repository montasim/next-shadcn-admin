/**
 * Registration - Create Account Endpoint
 * 
 * POST /api/auth/register/create
 * 
 * Step 3 of registration: Create admin account
 * 
 * Security:
 * - Requires valid REGISTER AuthSession
 * - Session must not be expired
 * - Password strength enforcement
 * - Race-safe via unique email constraint
 * - No partial accounts (transaction)
 * - AuthSession deleted immediately after use
 * - Auto-login after account creation
 */

import { NextRequest } from 'next/server'
import {
    validateEmail,
    sanitizeEmail,
    validatePassword,
    validateName,
    sanitizeName,
    validateRequiredFields,
} from '@/lib/auth/validation'
import {
    adminExists,
    createAdmin,
} from '@/lib/auth/repositories/admin.repository'
import { findActiveAuthSession } from '@/lib/auth/repositories/auth-session.repository'
import { hashPassword } from '@/lib/auth/crypto'
import { createLoginSession } from '@/lib/auth/session'
import {
    getClientIp,
    parseRequestBody,
    errorResponse,
    successResponse,
} from '@/lib/auth/request-utils'
import { AuthIntent, CreateAccountResponse } from '@/lib/auth/types'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await parseRequestBody(request)

        // Validate required fields
        const validationError = validateRequiredFields(body, [
            'email',
            'name',
            'password',
        ])
        if (validationError) {
            return errorResponse(validationError, 400)
        }

        const { email: rawEmail, name: rawName, password } = body

        // Extract firstName and lastName from the name field (for compatibility)
        // The sign-up form sends 'name' but we'll store it as firstName and lastName
        const nameParts = rawName.trim().split(/\s+/)
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        // For UI compatibility, we'll store firstName and lastName but create a combined name
        const fullName = lastName ? `${firstName} ${lastName}` : firstName

        // Sanitize and validate email
        const email = sanitizeEmail(rawEmail)
        if (!validateEmail(email)) {
            return errorResponse('Invalid email address', 400)
        }

        // Sanitize and validate name
        const name = sanitizeName(fullName)
        if (!validateName(name)) {
            return errorResponse('Invalid name. Name must be between 1 and 100 characters.', 400)
        }

        // Validate password strength
        const passwordValidation = validatePassword(password)
        if (!passwordValidation.valid) {
            return errorResponse(
                passwordValidation.errors.join('. '),
                400
            )
        }

        // Check for valid REGISTER or INVITED AuthSession
        let authSession = await findActiveAuthSession(email, AuthIntent.REGISTER)

        if (!authSession) {
            authSession = await findActiveAuthSession(email, AuthIntent.INVITED)
        }

        if (!authSession) {
            return errorResponse(
                'Session expired or invalid. Please verify your email again.',
                401
            )
        }

        // Verify session is not expired
        if (authSession.expiresAt < new Date()) {
            return errorResponse(
                'Session expired. Please verify your email again.',
                401
            )
        }

        // Double-check that admin doesn't exist (race condition protection)
        const exists = await adminExists(email)
        if (exists) {
            return errorResponse(
                'An account with this email already exists.',
                409
            )
        }

        // Hash password
        const passwordHash = await hashPassword(password)

        // Create admin and delete AuthSession in a transaction (atomic operation)
        const admin = await prisma.$transaction(async (tx) => {
            // Create admin record
            const newAdmin = await tx.admin.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    passwordHash,
                },
            })

            // Delete REGISTER AuthSession
            await tx.authSession.delete({
                where: { id: authSession.id },
            })

            return newAdmin
        })

        // Create authenticated login session (auto-login)
        const loginName = admin.lastName ? `${admin.firstName} ${admin.lastName}` : admin.firstName
        await createLoginSession(admin.id, admin.email, loginName)

        // Return success response
        const response: CreateAccountResponse = {
            success: true,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
            },
        }

        return successResponse(response, 201)
    } catch (error: any) {
        console.error('Create account error:', error)

        // Handle unique constraint violation (race condition)
        if (error.code === 'P2002') {
            return errorResponse(
                'An account with this email already exists.',
                409
            )
        }

        return errorResponse('An error occurred. Please try again.', 500)
    }
}
