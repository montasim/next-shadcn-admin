/**
 * Notice Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Notice model
 */

import { prisma } from '../../prisma'

// ============================================================================
// NOTICE QUERIES
// ============================================================================

/**
 * Get all notices with pagination and search
 */
export async function getNotices(options: {
  page?: number
  search?: string
  limit?: number
  includeInactive?: boolean
} = {}) {
  const { page = 1, search = '', limit = 10, includeInactive = false } = options
  const skip = (page - 1) * limit

  const where = {
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { content: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(includeInactive ? {} : { isActive: true }),
  }

  const [notices, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      include: {
        entryBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.notice.count({ where }),
  ])

  return {
    notices,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit,
    },
  }
}

/**
 * Get notice by ID
 */
export async function getNoticeById(id: string) {
  return prisma.notice.findUnique({
    where: { id },
    include: {
      entryBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Check if notice exists
 */
export async function noticeExists(id: string): Promise<boolean> {
  const count = await prisma.notice.count({
    where: { id },
  })
  return count > 0
}

/**
 * Get all active notices (for public API)
 * Filters by isActive=true and validity dates
 */
export async function getActiveNotices() {
  const now = new Date()

  return prisma.notice.findMany({
    where: {
      isActive: true,
      OR: [
        // No validity dates set
        { validFrom: null, validTo: null },
        // Only validFrom is set and has passed
        { validFrom: { lte: now }, validTo: null },
        // Only validTo is set and hasn't passed
        { validFrom: null, validTo: { gte: now } },
        // Both dates set and we're within range
        { validFrom: { lte: now }, validTo: { gte: now } },
      ],
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })
}

// ============================================================================
// NOTICE MUTATIONS
// ============================================================================

/**
 * Create a new notice
 */
export async function createNotice(data: {
  title: string
  content: string
  isActive?: boolean
  validFrom?: Date | null
  validTo?: Date | null
  order?: number
  entryById: string
}) {
  const { entryById, ...noticeData } = data

  return prisma.notice.create({
    data: {
      ...noticeData,
      entryBy: {
        connect: { id: entryById },
      },
    },
    include: {
      entryBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Update a notice
 */
export async function updateNotice(
  id: string,
  data: {
    title?: string
    content?: string
    isActive?: boolean
    validFrom?: Date | null
    validTo?: Date | null
    order?: number
  }
) {
  return prisma.notice.update({
    where: { id },
    data,
    include: {
      entryBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Delete a notice
 */
export async function deleteNotice(id: string) {
  return prisma.notice.delete({
    where: { id },
  })
}
