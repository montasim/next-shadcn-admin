import { NextRequest, NextResponse } from 'next/server'
import { createAuthorView, getAuthorViewStats } from '@/lib/lms/repositories/author-view.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'
import { crypto } from 'node:crypto'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/authors/[id]/view
 * Track author page visits
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const authorId = params.id

    // Get user from session (optional, anonymous visits are allowed)
    const session = await getSession()
    const user = session ? await findUserById(session.userId) : null

    // Generate session ID for anonymous users
    const sessionId = user
      ? null
      : request.cookies.get('anonymous_session_id')?.value ||
        crypto.randomBytes(16).toString('hex')

    // Extract request metadata
    const ip = request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              null
    const userAgent = request.headers.get('user-agent') || null
    const referrer = request.headers.get('referer') || null

    // Create view record
    await createAuthorView({
      authorId,
      userId: user?.id,
      sessionId,
      ip,
      userAgent,
      referrer,
    })

    // Get updated stats
    const stats = await getAuthorViewStats(authorId)

    // Set anonymous session cookie if not exists
    const response = NextResponse.json({
      success: true,
      stats,
    })

    if (!user && sessionId && !request.cookies.get('anonymous_session_id')?.value) {
      response.cookies.set('anonymous_session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
    }

    return response
  } catch (error) {
    console.error('Error tracking author view:', error)
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    )
  }
}
