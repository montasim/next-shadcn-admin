import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const userSession = request.cookies.get('user_session')?.value
    const { pathname } = request.nextUrl

    // Define admin-only sub-routes
    const adminSubRoutes = [
        '/dashboard/users',
        '/dashboard/apps',
        '/dashboard/chats',
        '/dashboard/tasks',
        '/dashboard/authors',
        '/dashboard/categories',
        '/dashboard/publications',
        '/dashboard/books-old', // Assuming this is admin-only book management
    ]

    // Define route types
    const isAdminRoute = adminSubRoutes.some(route => pathname.startsWith(route))
    const isUserRoute = pathname.startsWith('/profile') || 
                       pathname.startsWith('/bookshelves') || 
                       pathname.startsWith('/settings') ||
                       pathname.startsWith('/dashboard') // Dashboard is now for all users
    const isPublicRoute = pathname.startsWith('/(public)') || pathname.startsWith('/books-old')
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

    // Handle admin-only sub-routes
    if (isAdminRoute) {
        if (!sessionValidation.valid) {
            const response = NextResponse.redirect(new URL('/auth/sign-in', request.url))
            response.cookies.delete('user_session')
            return response
        }
        if (!['ADMIN', 'SUPER_ADMIN'].includes(sessionValidation.role || '')) {
            // Not an admin, redirect to the main dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url))
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
            // User is authenticated, redirect to dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // Handle root route - redirect based on existing sessions
    if (pathname === '/') {
        if (sessionValidation.valid) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
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
