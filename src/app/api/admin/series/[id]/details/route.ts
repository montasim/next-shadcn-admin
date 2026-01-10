/**
 * Admin Series Detail API Route
 *
 * Get comprehensive series data for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSeriesWithCompleteDetails } from '@/lib/lms/repositories/series.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/series/[id]/details
 * Get comprehensive series data for admin dashboard
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const seriesId = params.id

    // Check authentication and admin role
    const session = await getSession()
    const user = session ? await findUserById(session.userId) : null
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get series with complete details including analytics
    const series = await getSeriesWithCompleteDetails(seriesId)

    if (!series) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: series,
    })
  } catch (error) {
    console.error('Error fetching admin series details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch series details' },
      { status: 500 }
    )
  }
}
