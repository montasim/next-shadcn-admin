import { NextRequest, NextResponse } from 'next/server'
import { createCategoryView, getCategoryViewStats } from '@/lib/lms/repositories/category-view.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'
import { crypto } from 'node:crypto'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/categories/[id]/view
 * Track category page visits
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const categoryId = params.id

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
    await createCategoryView({
      categoryId,
      userId: user?.id,
      sessionId,
      ip,
      userAgent,
      referrer,
    })

    // Get updated stats
    const stats = await getCategoryViewStats(categoryId)

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
    console.error('Error tracking category view:', error)
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    )
  }
}
