/**
 * Progress History API Route
 *
 * Provides historical reading progress data for charts and visualizations
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import * as repository from '@/lib/user/repositories/progress-history.repository'

// ============================================================================
// VALIDATION & CONFIGURATION
// ============================================================================

const HeatmapQuerySchema = z.object({
  days: z.coerce.number().min(7).max(365).default(365),
})

const PagesPerDayQuerySchema = z.object({
  days: z.coerce.number().min(7).max(365).default(30),
})

const PagesPerWeekQuerySchema = z.object({
  weeks: z.coerce.number().min(1).max(52).default(12),
})

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    // Require authentication
    const userSession = await getSession()
    if (!userSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { bookId } = await params
    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get('type') || 'history'

    // Validate bookId format
    if (!bookId || bookId.length !== 36) {
      return NextResponse.json(
        { success: false, error: 'Invalid book ID' },
        { status: 400 }
      )
    }

    // Route to appropriate handler based on type
    if (dataType === 'heatmap') {
      return handleHeatmap(userSession.userId, bookId, searchParams)
    } else if (dataType === 'pages-per-day') {
      return handlePagesPerDay(userSession.userId, bookId, searchParams)
    } else if (dataType === 'pages-per-week') {
      return handlePagesPerWeek(userSession.userId, bookId, searchParams)
    } else if (dataType === 'stats') {
      return handleStats(userSession.userId, bookId)
    } else {
      // Default: return history
      return handleHistory(userSession.userId, bookId, searchParams)
    }
  } catch (error) {
    console.error('Progress history API error:', error)

    if (error instanceof Error && error.name === 'UserSessionExpiredError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'Please login to view your reading history'
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve progress history',
        message: 'An error occurred while fetching your reading history'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * Get progress history for a book
 */
async function handleHistory(userId: string, bookId: string, searchParams: URLSearchParams) {
  const period = searchParams.get('period') || 'all'

  let history
  if (period === 'week') {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)
    history = await repository.getBookProgressHistoryByPeriod(bookId, userId, startDate, new Date())
  } else if (period === 'month') {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    history = await repository.getBookProgressHistoryByPeriod(bookId, userId, startDate, new Date())
  } else {
    history = await repository.getBookProgressHistory(bookId, userId)
  }

  return NextResponse.json({
    success: true,
    data: history,
  })
}

/**
 * Get heatmap data
 */
async function handleHeatmap(userId: string, bookId: string, searchParams: URLSearchParams) {
  const validatedQuery = HeatmapQuerySchema.parse(Object.fromEntries(searchParams.entries()))

  const heatmapData = await repository.getUserReadingHeatmap(bookId, userId, validatedQuery.days)

  return NextResponse.json({
    success: true,
    data: heatmapData,
  })
}

/**
 * Get pages read per day
 */
async function handlePagesPerDay(userId: string, bookId: string, searchParams: URLSearchParams) {
  const validatedQuery = PagesPerDayQuerySchema.parse(Object.fromEntries(searchParams.entries()))

  const data = await repository.getPagesReadPerDay(bookId, userId, validatedQuery.days)

  return NextResponse.json({
    success: true,
    data,
  })
}

/**
 * Get pages read per week
 */
async function handlePagesPerWeek(userId: string, bookId: string, searchParams: URLSearchParams) {
  const validatedQuery = PagesPerWeekQuerySchema.parse(Object.fromEntries(searchParams.entries()))

  const data = await repository.getPagesReadPerWeek(bookId, userId, validatedQuery.weeks)

  return NextResponse.json({
    success: true,
    data,
  })
}

/**
 * Get reading statistics
 */
async function handleStats(userId: string, bookId: string) {
  const stats = await repository.getBookReadingStats(bookId, userId)

  return NextResponse.json({
    success: true,
    data: stats,
  })
}
