/**
 * Public User Reading Activity API Route
 *
 * Provides public access to a user's overall reading activity
 * across all books (heatmap + pages per day)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as repository from '@/lib/user/repositories/progress-history.repository'

// Validation schemas
const HeatmapQuerySchema = z.object({
  days: z.coerce.number().min(7).max(365).default(365),
})

const PagesPerDayQuerySchema = z.object({
  days: z.coerce.number().min(7).max(365).default(30),
})

/**
 * GET /api/public/users/[id]/reading-activity
 *
 * Get user's overall reading activity (heatmap + pages per day)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    // Route to appropriate handler based on type
    if (type === 'heatmap') {
      return handleHeatmap(userId, searchParams)
    } else if (type === 'pages-per-day') {
      return handlePagesPerDay(userId, searchParams)
    } else {
      // Default: return both
      return handleAll(userId, searchParams)
    }
  } catch (error) {
    console.error('Get user reading activity error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch reading activity'
    }, { status: 500 })
  }
}

/**
 * Get all reading activity data
 */
async function handleAll(userId: string, searchParams: URLSearchParams) {
  const heatmapDays = Number(searchParams.get('heatmapDays') || '365')
  const pagesPerDayDays = Number(searchParams.get('pagesPerDayDays') || '30')

  const [heatmapData, pagesPerDayData] = await Promise.all([
    repository.getUserOverallReadingHeatmap(userId, heatmapDays),
    repository.getUserOverallPagesReadPerDay(userId, pagesPerDayDays),
  ])

  return NextResponse.json({
    success: true,
    data: {
      heatmap: heatmapData,
      pagesPerDay: pagesPerDayData,
    },
  })
}

/**
 * Get heatmap data only
 */
async function handleHeatmap(userId: string, searchParams: URLSearchParams) {
  const validatedQuery = HeatmapQuerySchema.parse(Object.fromEntries(searchParams.entries()))

  const heatmapData = await repository.getUserOverallReadingHeatmap(
    userId,
    validatedQuery.days
  )

  return NextResponse.json({
    success: true,
    data: heatmapData,
  })
}

/**
 * Get pages per day data only
 */
async function handlePagesPerDay(userId: string, searchParams: URLSearchParams) {
  const validatedQuery = PagesPerDayQuerySchema.parse(Object.fromEntries(searchParams.entries()))

  const data = await repository.getUserOverallPagesReadPerDay(
    userId,
    validatedQuery.days
  )

  return NextResponse.json({
    success: true,
    data,
  })
}
