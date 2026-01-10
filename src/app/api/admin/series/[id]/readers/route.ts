/**
 * Admin Series Readers API Route
 *
 * Get readers for all books in a series
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'
import * as seriesRepository from '@/lib/lms/repositories/series.repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/series/[id]/readers
 *
 * Get all readers across all books in a series
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

    // Get search params for pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const readersData = await seriesRepository.getSeriesReaders(id, { page, limit })

    return NextResponse.json({
      success: true,
      data: {
        readers: readersData,
      },
    })
  } catch (error) {
    console.error('Get series readers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch series readers' },
      { status: 500 }
    )
  }
}
