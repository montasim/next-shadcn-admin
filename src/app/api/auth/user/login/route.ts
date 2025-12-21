/**
 * User Login API Route
 *
 * Handles user authentication with email/password
 * Includes validation, rate limiting, and secure session creation
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyPassword, generateDummyHash } from '@/lib/auth/crypto'
import { findUserByEmail, isUserActive } from '@/lib/user/repositories/user.repository'
import { createUserLoginSession } from '@/lib/user/auth/session'
import { hasActivePremiumSubscription } from '@/lib/user/repositories/subscription.repository'
import { UserApiResponse, UserAuthenticationError } from '@/lib/user/auth/types'

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const LoginSchema = z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(false),
})

// ============================================================================
// RATE LIMITING
// ============================================================================

const LOGIN_ATTEMPTS_LIMIT = 5
const LOGIN_ATTEMPTS_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

/**
 * Check if login attempts are rate limited for this email/IP
 */
function isLoginRateLimited(email: string, ip?: string): boolean {
    const key = `${email}_${ip || 'no_ip'}`
    const attempts = loginAttempts.get(key)

    if (!attempts) return false

    const now = Date.now()
    const timeSinceLastAttempt = now - attempts.lastAttempt

    // Reset if window has passed
    if (timeSinceLastAttempt > LOGIN_ATTEMPTS_WINDOW_MS) {
        loginAttempts.delete(key)
        return false
    }

    return attempts.count >= LOGIN_ATTEMPTS_LIMIT
}

/**
 * Record a login attempt
 */
function recordLoginAttempt(email: string, ip?: string): void {
    const key = `${email}_${ip || 'no_ip'}`
    const now = Date.now()
    const attempts = loginAttempts.get(key)

    if (!attempts) {
        loginAttempts.set(key, { count: 1, lastAttempt: now })
    } else {
        attempts.count++
        attempts.lastAttempt = now
    }
}

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')

    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }

    if (realIP) {
        return realIP
    }

    return request.ip || 'unknown'
}

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * POST /api/auth/user/login
 *
 * Authenticate user and create secure session
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate request body
        const validationResult = LoginSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json({
                success: false,
                error: 'Validation failed',
                message: validationResult.error.issues[0]?.message
            } as UserApiResponse, { status: 400 })
        }

        const { email, password, rememberMe } = validationResult.data

        // Get client IP for rate limiting
        const clientIP = getClientIP(request)

        // Check rate limiting
        if (isLoginRateLimited(email, clientIP)) {
            recordLoginAttempt(email, clientIP)
            return NextResponse.json({
                success: false,
                error: 'Too many login attempts',
                message: `Too many failed login attempts. Please try again in ${Math.ceil(LOGIN_ATTEMPTS_WINDOW_MS / 60000)} minutes.`,
                retryAfter: Math.ceil(LOGIN_ATTEMPTS_WINDOW_MS / 1000)
            } as UserApiResponse, {
                status: 429,
                headers: {
                    'Retry-After': '900' // 15 minutes
                }
            })
        }

        // Find user
        const user = await findUserByEmail(email)

        // Always generate dummy hash to prevent timing attacks
        const dummyHash = await generateDummyHash()

        if (!user) {
            // Record failed attempt for timing attack protection
            recordLoginAttempt(email, clientIP)
            await verifyPassword(password, dummyHash)

            return NextResponse.json({
                success: false,
                error: 'Invalid credentials',
                message: 'Invalid email or password'
            } as UserApiResponse, { status: 401 })
        }

        // Check if user is active
        const active = await isUserActive(user.id)
        if (!active) {
            recordLoginAttempt(email, clientIP)
            return NextResponse.json({
                success: false,
                error: 'Account suspended',
                message: 'Your account has been suspended. Please contact support.'
            } as UserApiResponse, { status: 403 })
        }

        // Verify password (with constant-time comparison)
        const isValidPassword = await verifyPassword(password, user.passwordHash)

        if (!isValidPassword) {
            recordLoginAttempt(email, clientIP)
            return NextResponse.json({
                success: false,
                error: 'Invalid credentials',
                message: 'Invalid email or password'
            } as UserApiResponse, { status: 401 })
        }

        // Check premium status
        const hasPremium = await hasActivePremiumSubscription(user.id)
        const isPremium = user.isPremium || hasPremium

        // Create secure session
        const sessionToken = await createUserLoginSession(
            user.id,
            user.email,
            user.name,
            isPremium
        )

        // Clear failed attempts on successful login
        const key = `${email}_${clientIP}`
        loginAttempts.delete(key)

        // Return success response
        const response = NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    isPremium: isPremium,
                    avatar: user.avatar,
                    createdAt: user.createdAt,
                },
                sessionExpiresIn: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30 days or 7 days
            },
            message: 'Login successful'
        } as UserApiResponse)

        // Set security headers
        response.headers.set('X-Content-Type-Options', 'nosniff')
        response.headers.set('X-Frame-Options', 'DENY')
        response.headers.set('X-XSS-Protection', '1; mode=block')
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

        return response

    } catch (error) {
        console.error('Login error:', error)

        return NextResponse.json({
            success: false,
            error: 'Login failed',
            message: 'An error occurred during login. Please try again.'
        } as UserApiResponse, { status: 500 })
    }
}

/**
 * GET /api/auth/user/login
 *
 * Check if user is currently authenticated
 */
export async function GET(request: NextRequest) {
    try {
        const { getUserSession } = await import('@/lib/user/auth/session')
        const session = await getUserSession()

        if (!session) {
            return NextResponse.json({
                success: false,
                error: 'Not authenticated',
                message: 'No active session found'
            } as UserApiResponse, { status: 401 })
        }

        // Get fresh user data
        const { findUserById } = await import('@/lib/user/repositories/user.repository')
        const user = await findUserById(session.userId)

        if (!user) {
            // User not found, invalidate session
            const { deleteUserLoginSession } = await import('@/lib/user/auth/session')
            await deleteUserLoginSession(session.sessionId)

            return NextResponse.json({
                success: false,
                error: 'User not found',
                message: 'Your session has been invalidated'
            } as UserApiResponse, { status: 401 })
        }

        // Check if user is still active
        if (!user.isActive) {
            const { deleteUserLoginSession } = await import('@/lib/user/auth/session')
            await deleteUserLoginSession(session.sessionId)

            return NextResponse.json({
                success: false,
                error: 'Account suspended',
                message: 'Your account has been suspended'
            } as UserApiResponse, { status: 403 })
        }

        // Check premium status
        const hasPremium = await hasActivePremiumSubscription(user.id)
        const isPremium = user.isPremium || hasPremium

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    isPremium: isPremium,
                    avatar: user.avatar,
                    createdAt: user.createdAt,
                }
            },
            message: 'User is authenticated'
        } as UserApiResponse)

    } catch (error) {
        console.error('Auth check error:', error)
        return NextResponse.json({
            success: false,
            error: 'Auth check failed',
            message: 'An error occurred while checking authentication'
        } as UserApiResponse, { status: 500 })
    }
}