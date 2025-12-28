/**
 * Admin Series API Route
 *
 * CRUD operations for series management
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'
import * as seriesRepository from '@/lib/lms/repositories/series.repository'

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const CreateSeriesSchema = z.object({
  name: z.string().min(1, 'Series name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
})

const UpdateSeriesSchema = z.object({
  name: z.string().min(1, 'Series name is required').optional(),
  description: z.string().optional(),
  image: z.string().optional(),
})

// Helper function to check authentication
async function checkAuth() {
  const session = await getSession()
  const user = session ? await findUserById(session.userId) : null
  if (!user) {
    return null
  }
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return null
  }
  return user
}

// ============================================================================
// GET HANDLER
// ============================================================================

/**
 * GET /api/admin/series
 *
 * Get all series with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const user = await checkAuth()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication and admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    const result = await seriesRepository.getSeries({
      page,
      search,
      limit,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get series error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch series' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST HANDLER
// ============================================================================

/**
 * POST /api/admin/series
 *
 * Create a new series
 */
export async function POST(request: NextRequest) {
  try {
    const user = await checkAuth()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication and admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = CreateSeriesSchema.parse(body)

    const series = await seriesRepository.createSeries({
      ...validatedData,
      entryById: user.id,
    })

    return NextResponse.json({
      success: true,
      data: series,
    }, { status: 201 })
  } catch (error) {
    console.error('Create series error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors,
      }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to create series' },
      { status: 500 }
    )
  }
}
