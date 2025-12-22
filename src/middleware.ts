import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const userSession = request.cookies.get('user_session')?.value
    const { pathname } = request.nextUrl

    // Define route types
    const isAdminRoute = pathname.startsWith('/dashboard')
    const isUserRoute = pathname.startsWith('/profile') || pathname.startsWith('/bookshelves')
    const isPublicRoute = pathname.startsWith('/(public)') || pathname.startsWith('/books')
    const isAuthRoute = pathname.startsWith('/auth/')

    // Function to validate unified session cookie format and extract role
    const getSessionRole = (sessionValue: string): { valid: boolean; role?: string } => {
        try {
            const sessionData = JSON.parse(sessionValue)
            const valid = sessionData &&
                         sessionData.userId &&
                         sessionData.email &&
                         sessionData.name &&
                         sessionData.role
            return {
                valid,
                role: valid ? sessionData.role : undefined
            }
        } catch {
            return { valid: false }
        }
    }

    const sessionValidation = userSession ? getSessionRole(userSession) : { valid: false }

    // Handle admin routes (require ADMIN or SUPER_ADMIN role)
    if (isAdminRoute) {
        if (!sessionValidation.valid || !['ADMIN', 'SUPER_ADMIN'].includes(sessionValidation.role || '')) {
            const response = NextResponse.redirect(new URL('/auth/sign-in', request.url))
            response.cookies.delete('user_session')
            return response
        }
    }

    // Handle protected user routes (require authentication)
    if (isUserRoute) {
        if (!sessionValidation.valid) {
            const response = NextResponse.redirect(new URL('/auth/sign-in', request.url))
            response.cookies.delete('user_session')
            return response
        }
    }

    // Handle authentication routes
    if (isAuthRoute) {
        if (sessionValidation.valid) {
            // User is authenticated, redirect based on role
            if (['ADMIN', 'SUPER_ADMIN'].includes(sessionValidation.role || '')) {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            } else {
                return NextResponse.redirect(new URL('/books', request.url))
            }
        }
    }

    // Handle root route - redirect based on existing sessions
    if (pathname === '/') {
        if (sessionValidation.valid) {
            if (['ADMIN', 'SUPER_ADMIN'].includes(sessionValidation.role || '')) {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            } else {
                return NextResponse.redirect(new URL('/books', request.url))
            }
        } else {
            return NextResponse.redirect(new URL('/auth/sign-in', request.url))
        }
    }

    // Clean up invalid sessions
    if (userSession && !sessionValidation.valid) {
        const response = NextResponse.next()
        response.cookies.delete('user_session')
        return response
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
