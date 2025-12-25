/**
 * Book View Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the BookView model
 */

import { prisma } from '../../prisma'

// ============================================================================
// BOOK VIEW QUERIES
// ============================================================================

/**
 * Create a book view record
 */
export async function createBookView(data: {
  bookId: string
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  referrer?: string
}) {
  return await prisma.bookView.create({
    data,
  })
}

/**
 * Get all views for a book with pagination and filtering
 */
export async function getBookViews(bookId: string, options: {
  page?: number
  limit?: number
  startDate?: Date
  endDate?: Date
  userId?: string
} = {}) {
  const { page = 1, limit = 50, startDate, endDate, userId } = options
  const skip = (page - 1) * limit

  const where: any = { bookId }

  if (startDate || endDate) {
    where.visitedAt = {}
    if (startDate) where.visitedAt.gte = startDate
    if (endDate) where.visitedAt.lte = endDate
  }

  if (userId) {
    where.userId = userId
  }

  const [views, total] = await Promise.all([
    prisma.bookView.findMany({
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
    prisma.bookView.count({ where }),
  ])

  return {
    views,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}

/**
 * Get aggregate view statistics for a book
 */
export async function getBookViewStats(bookId: string) {
  const [totalViews, uniqueVisitors, viewsThisMonth] = await Promise.all([
    prisma.bookView.count({ where: { bookId } }),

    prisma.bookView.groupBy({
      by: ['userId'],
      where: { bookId },
    }).then(groups => groups.length),

    prisma.bookView.count({
      where: {
        bookId,
        visitedAt: {
          gte: new Date(new Date().setDate(1)), // First day of current month
        },
      },
    }),
  ])

  // Calculate average views per day (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const viewsLast30Days = await prisma.bookView.count({
    where: {
      bookId,
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
export async function getBookViewsByDate(
  bookId: string,
  startDate: Date,
  endDate: Date
) {
  const views = await prisma.bookView.groupBy({
    by: ['visitedAt'],
    where: {
      bookId,
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
 * Get most viewed books in the last N days
 */
export async function getPopularBooks(options: {
  limit?: number
  days?: number
} = {}) {
  const { limit = 10, days = 30 } = options

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const books = await prisma.bookView.groupBy({
    by: ['bookId'],
    where: {
      visitedAt: {
        gte: startDate,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: limit,
  })

  // Fetch book details
  const bookIds = books.map(b => b.bookId)
  const bookDetails = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: {
      id: true,
      name: true,
      image: true,
      directImageUrl: true,
      type: true,
    },
  })

  return books.map(book => {
    const details = bookDetails.find(b => b.id === book.bookId)!
    return {
      ...details,
      viewCount: book._count.id,
    }
  })
}

/**
 * Get recent views for a book
 */
export async function getRecentBookViews(bookId: string, limit = 10) {
  return await prisma.bookView.findMany({
    where: { bookId },
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
    take: limit,
  })
}
