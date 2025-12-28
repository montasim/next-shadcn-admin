/**
 * Admin Series Detail API Route
 *
 * Get, Update, Delete individual series
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'
import * as seriesRepository from '@/lib/lms/repositories/series.repository'

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const UpdateSeriesSchema = z.object({
  name: z.string().min(1, 'Series name is required').optional(),
  description: z.string().optional(),
  image: z.string().optional(),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

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
 * GET /api/admin/series/[id]
 *
 * Get series by ID
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await checkAuth()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication and admin access required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const series = await seriesRepository.getSeriesById(id)

    if (!series) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: series,
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
// PATCH HANDLER
// ============================================================================

/**
 * PATCH /api/admin/series/[id]
 *
 * Update series
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await checkAuth()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication and admin access required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = UpdateSeriesSchema.parse(body)

    const series = await seriesRepository.updateSeries(id, validatedData)

    return NextResponse.json({
      success: true,
      data: series,
    })
  } catch (error) {
    console.error('Update series error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors,
      }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to update series' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE HANDLER
// ============================================================================

/**
 * DELETE /api/admin/series/[id]
 *
 * Delete series
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await checkAuth()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication and admin access required' },
        { status: 401 }
      )
    }

    const { id } = await params
    await seriesRepository.deleteSeries(id)

    return NextResponse.json({
      success: true,
      message: 'Series deleted successfully',
    })
  } catch (error) {
    console.error('Delete series error:', error)
    return NextResponse.json(
      { error: 'Failed to delete series' },
      { status: 500 }
    )
  }
}
