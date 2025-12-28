/**
 * Series View Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the SeriesView model
 */

import { prisma } from '../../prisma'

// ============================================================================
// SERIES VIEW QUERIES
// ============================================================================

/**
 * Create a series view record
 */
export async function createSeriesView(data: {
  seriesId: string
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  referrer?: string
}) {
  return await prisma.seriesView.create({
    data,
  })
}

/**
 * Get all views for a series with pagination and filtering
 */
export async function getSeriesViews(seriesId: string, options: {
  page?: number
  limit?: number
  startDate?: Date
  endDate?: Date
  userId?: string
} = {}) {
  const { page = 1, limit = 50, startDate, endDate, userId } = options
  const skip = (page - 1) * limit

  const where: any = { seriesId }

  if (startDate || endDate) {
    where.visitedAt = {}
    if (startDate) where.visitedAt.gte = startDate
    if (endDate) where.visitedAt.lte = endDate
  }

  if (userId) {
    where.userId = userId
  }

  const [views, total] = await Promise.all([
    prisma.seriesView.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            directAvatarUrl: true,
          },
        },
      },
      orderBy: { visitedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.seriesView.count({ where }),
  ])

  return {
    views,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}

/**
 * Get series analytics (legacy function, use getSeriesViewStats instead)
 */
export async function getSeriesAnalytics(seriesId: string) {
  const [totalViews, uniqueVisitors] = await Promise.all([
    prisma.seriesView.count({
      where: { seriesId },
    }),
    prisma.seriesView.groupBy({
      by: ['userId'],
      where: {
        seriesId,
        userId: { not: null },
      },
    }).then(groups => groups.length),
  ])

  return {
    totalViews,
    uniqueVisitors,
  }
}

/**
 * Get aggregate view statistics for a series
 */
export async function getSeriesViewStats(seriesId: string) {
  const [totalViews, uniqueVisitors, viewsThisMonth] = await Promise.all([
    prisma.seriesView.count({ where: { seriesId } }),

    prisma.seriesView.groupBy({
      by: ['userId'],
      where: { seriesId },
    }).then(groups => groups.length),

    prisma.seriesView.count({
      where: {
        seriesId,
        visitedAt: {
          gte: new Date(new Date().setDate(1)), // First day of current month
        },
      },
    }),
  ])

  // Calculate average views per day (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const viewsLast30Days = await prisma.seriesView.count({
    where: {
      seriesId,
      visitedAt: { gte: thirtyDaysAgo },
    },
  })

  const avgViewsPerDay = viewsLast30Days / 30

  return {
    totalViews,
    uniqueVisitors,
    viewsThisMonth,
    avgViewsPerDay: Math.round(avgViewsPerDay * 100) / 100,
  }
}

/**
 * Get views grouped by date for charts
 */
export async function getSeriesViewsByDate(
  seriesId: string,
  startDate: Date,
  endDate: Date
) {
  const views = await prisma.seriesView.groupBy({
    by: ['visitedAt'],
    where: {
      seriesId,
      visitedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      visitedAt: 'asc',
    },
  })

  // Group by day
  const viewsByDay = new Map<string, number>()

  views.forEach(view => {
    const date = view.visitedAt.toISOString().split('T')[0]
    viewsByDay.set(date, (viewsByDay.get(date) || 0) + 1)
  })

  // Fill in missing dates with 0
  const dates: string[] = []
  const counts: number[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    dates.push(dateStr)
    counts.push(viewsByDay.get(dateStr) || 0)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return {
    dates,
    counts,
  }
}

/**
 * Get series views over time (legacy function, use getSeriesViewsByDate instead)
 */
export async function getSeriesViewsOverTime(seriesId: string, days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const views = await prisma.seriesView.findMany({
    where: {
      seriesId,
      visitedAt: {
        gte: startDate,
      },
    },
    select: {
      visitedAt: true,
    },
    orderBy: {
      visitedAt: 'asc',
    },
  })

  // Group by date
  const viewsByDate: Record<string, number> = {}
  views.forEach(view => {
    const date = view.visitedAt.toISOString().split('T')[0]
    viewsByDate[date] = (viewsByDate[date] || 0) + 1
  })

  return Object.entries(viewsByDate).map(([date, count]) => ({
    date,
    count,
  }))
}
