/**
 * Registration - Create Account Endpoint
 * 
 * POST /api/auth/register/create
 * 
 * Step 3 of registration: Create user account
 * 
 * Security:
 * - Requires valid REGISTER/INVITED AuthSession
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
    userExists,
    createUser,
} from '@/lib/user/repositories/user.repository'
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

        // Sanitize and validate email
        const email = sanitizeEmail(rawEmail)
        if (!validateEmail(email)) {
            return errorResponse('Invalid email address', 400)
        }

        // Sanitize and validate name
        const name = sanitizeName(rawName)
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
        let inviteRole = 'USER' // Default role

        if (!authSession) {
            authSession = await findActiveAuthSession(email, AuthIntent.INVITED)
            // If this is an invited session, get the role from the invite
            if (authSession) {
                const invite = await prisma.invite.findFirst({
                    where: {
                        email: email,
                        used: false,
                        expiresAt: { gt: new Date() }
                    }
                })
                if (invite) {
                    inviteRole = invite.role
                }
            }
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

        // Double-check that user doesn't exist (race condition protection)
        const exists = await userExists(email)
        if (exists) {
            return errorResponse(
                'An account with this email already exists.',
                409
            )
        }

        // Hash password
        const passwordHash = await hashPassword(password)

        // Create user and delete AuthSession in a transaction
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await createUser(
              {
                email,
                name,
                passwordHash,
                role: inviteRole, // Use role from invite or default to USER
              },
              tx
            )

            // Delete AuthSession
            await tx.authSession.delete({
                where: { id: authSession!.id },
            })

            // Mark invite as used if this was an invited registration
            if (authSession!.intent === AuthIntent.INVITED) {
                await tx.invite.updateMany({
                    where: {
                        email: email,
                        used: false
                    },
                    data: {
                        used: true,
                        usedAt: new Date()
                    }
                })
            }

            return newUser
        })

        // Create authenticated login session (auto-login)
        await createLoginSession(
            user.id,
            user.email,
            user.name,
            user.role,
            user.firstName || '',
            user.lastName || null,
            user.isPremium || false,
            user.avatar || null
        )

        // Return success response
        const response: CreateAccountResponse = {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
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
