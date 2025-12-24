/**
 * Progress History Repository
 *
 * Handles historical reading progress tracking for charts and visualizations
 */

import { prisma } from '@/lib/prisma'

export interface ProgressHistoryData {
  userId: string
  bookId: string
  currentPage?: number | null
  currentEpocha?: number | null
  progress: number
  pagesRead: number
  timeSpent: number
  sessionDate?: Date
}

export interface HeatmapData {
  date: string
  pagesRead: number
  timeSpent: number
  level: number // 0-4 for color intensity
}

export interface PagesReadData {
  date: string
  pagesRead: number
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a progress history record
 */
export async function createProgressHistory(data: ProgressHistoryData) {
  return await prisma.progressHistory.create({
    data: {
      userId: data.userId,
      bookId: data.bookId,
      currentPage: data.currentPage,
      currentEpocha: data.currentEpocha,
      progress: data.progress,
      pagesRead: data.pagesRead,
      timeSpent: data.timeSpent,
      sessionDate: data.sessionDate || new Date(),
    },
  })
}

/**
 * Get all progress history for a specific book
 */
export async function getBookProgressHistory(bookId: string, userId: string) {
  return await prisma.progressHistory.findMany({
    where: {
      bookId,
      userId,
    },
    orderBy: {
      sessionDate: 'asc',
    },
  })
}

/**
 * Get progress history for a book within a date range
 */
export async function getBookProgressHistoryByPeriod(
  bookId: string,
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return await prisma.progressHistory.findMany({
    where: {
      bookId,
      userId,
      sessionDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      sessionDate: 'asc',
    },
  })
}

// ============================================================================
// AGGREGATION FUNCTIONS FOR CHARTS
// ============================================================================

/**
 * Get reading heatmap data for a user's book
 * Returns daily activity for the last 365 days
 */
export async function getUserReadingHeatmap(
  bookId: string,
  userId: string,
  days: number = 365
): Promise<HeatmapData[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const history = await prisma.progressHistory.findMany({
    where: {
      bookId,
      userId,
      sessionDate: {
        gte: startDate,
      },
    },
    orderBy: {
      sessionDate: 'asc',
    },
  })

  // Group by date
  const dailyMap = new Map<string, { pagesRead: number; timeSpent: number }>()

  history.forEach((record) => {
    const dateKey = record.sessionDate.toISOString().split('T')[0]
    const current = dailyMap.get(dateKey) || { pagesRead: 0, timeSpent: 0 }
    dailyMap.set(dateKey, {
      pagesRead: current.pagesRead + (record.pagesRead || 0),
      timeSpent: current.timeSpent + (record.timeSpent || 0),
    })
  })

  // Convert to array and calculate intensity levels
  const result: HeatmapData[] = []
  const maxPagesRead = Math.max(...Array.from(dailyMap.values()).map((v) => v.pagesRead), 1)

  dailyMap.forEach((value, dateKey) => {
    // Calculate intensity level (0-4)
    const level = value.pagesRead === 0 ? 0 : Math.ceil((value.pagesRead / maxPagesRead) * 4)
    result.push({
      date: dateKey,
      pagesRead: value.pagesRead,
      timeSpent: value.timeSpent,
      level: Math.min(level, 4),
    })
  })

  return result
}

/**
 * Get pages read per day for a book
 */
export async function getPagesReadPerDay(
  bookId: string,
  userId: string,
  days: number = 30
): Promise<PagesReadData[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const history = await prisma.progressHistory.groupBy({
    by: ['sessionDate'],
    where: {
      bookId,
      userId,
      sessionDate: {
        gte: startDate,
      },
    },
    _sum: {
      pagesRead: true,
    },
    orderBy: {
      sessionDate: 'asc',
    },
  })

  return history.map((h) => ({
    date: h.sessionDate.toISOString().split('T')[0],
    pagesRead: h._sum.pagesRead || 0,
  }))
}

/**
 * Get pages read per week for a book
 */
export async function getPagesReadPerWeek(
  bookId: string,
  userId: string,
  weeks: number = 12
): Promise<PagesReadData[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (weeks * 7))
  startDate.setHours(0, 0, 0, 0)

  const history = await prisma.progressHistory.findMany({
    where: {
      bookId,
      userId,
      sessionDate: {
        gte: startDate,
      },
    },
    orderBy: {
      sessionDate: 'asc',
    },
  })

  // Group by week
  const weeklyMap = new Map<string, number>()

  history.forEach((record) => {
    const date = new Date(record.sessionDate)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0]

    weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + (record.pagesRead || 0))
  })

  return Array.from(weeklyMap.entries()).map(([date, pagesRead]) => ({
    date,
    pagesRead,
  }))
}

/**
 * Get the last progress snapshot for calculating deltas
 */
export async function getLastProgressSnapshot(bookId: string, userId: string) {
  return await prisma.progressHistory.findFirst({
    where: {
      bookId,
      userId,
    },
    orderBy: {
      sessionDate: 'desc',
    },
  })
}

/**
 * Delete progress history for a book
 */
export async function deleteBookProgressHistory(bookId: string, userId: string) {
  return await prisma.progressHistory.deleteMany({
    where: {
      bookId,
      userId,
    },
  })
}

/**
 * Get total reading statistics for a book
 */
export async function getBookReadingStats(bookId: string, userId: string) {
  const history = await prisma.progressHistory.findMany({
    where: {
      bookId,
      userId,
    },
  })

  const totalSessions = history.length
  const totalPagesRead = history.reduce((sum, h) => sum + (h.pagesRead || 0), 0)
  const totalTimeSpent = history.reduce((sum, h) => sum + (h.timeSpent || 0), 0)

  // Find first and last reading sessions
  const sortedHistory = history.sort((a, b) => a.sessionDate.getTime() - b.sessionDate.getTime())
  const firstRead = sortedHistory[0]?.sessionDate || null
  const lastRead = sortedHistory[sortedHistory.length - 1]?.sessionDate || null

  return {
    totalSessions,
    totalPagesRead,
    totalTimeSpent,
    firstRead,
    lastRead,
  }
}
