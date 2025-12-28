/**
 * Admin Series Books API Route
 *
 * Get books in a series
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'
import * as seriesRepository from '@/lib/lms/repositories/series.repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/series/[id]/books
 *
 * Get all books in a series ordered by series order
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    // Check authentication
    const session = await getSession()
    const user = session ? await findUserById(session.userId) : null
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check admin role
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const books = await seriesRepository.getSeriesBooks(id)

    return NextResponse.json({
      success: true,
      data: books,
    })
  } catch (error) {
    console.error('Get series books error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch series books' },
      { status: 500 }
    )
  }
}
