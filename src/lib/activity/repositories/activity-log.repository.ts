import { prisma } from '@/lib/prisma'
import { ActivityAction, ActivityResourceType, UserRole } from '@prisma/client'

export interface ActivityFilters {
  userId?: string
  userRole?: UserRole
  action?: ActivityAction
  resourceType?: ActivityResourceType
  resourceId?: string
  startDate?: Date
  endDate?: Date
  success?: boolean
  search?: string
}

export interface ActivityOptions {
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'action' | 'resourceName'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Create activity log (async, non-blocking)
 */
export async function logActivity(data: {
  userId?: string
  userRole?: UserRole
  action: ActivityAction
  resourceType: ActivityResourceType
  resourceId?: string
  resourceName?: string
  description?: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
  endpoint?: string
  success?: boolean
  errorMessage?: string
  duration?: number
}) {
  return prisma.activityLog.create({
    data: {
      ...data,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    },
  })
}

/**
 * Query activities with filters and pagination
 */
export async function getActivities(
  filters: ActivityFilters = {},
  options: ActivityOptions = {}
) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options

  const skip = (page - 1) * limit

  const where: any = {}

  if (filters.userId) where.userId = filters.userId
  if (filters.userRole) where.userRole = filters.userRole
  if (filters.action) where.action = filters.action
  if (filters.resourceType) where.resourceType = filters.resourceType
  if (filters.resourceId) where.resourceId = filters.resourceId
  if (filters.success !== undefined) where.success = filters.success

  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = filters.startDate
    if (filters.endDate) where.createdAt.lte = filters.endDate
  }

  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search, mode: 'insensitive' } },
      { resourceName: { contains: filters.search, mode: 'insensitive' } },
      { errorMessage: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            directAvatarUrl: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.activityLog.count({ where }),
  ])

  return {
    activities,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    hasNextPage: page < Math.ceil(total / limit),
    hasPreviousPage: page > 1,
  }
}

/**
 * Get activity statistics for dashboard
 */
export async function getActivityStats(filters: {
  startDate: Date
  endDate: Date
  userId?: string
}) {
  const where: any = {
    createdAt: {
      gte: filters.startDate,
      lte: filters.endDate,
    },
  }

  if (filters.userId) where.userId = filters.userId

  const [
    totalActivities,
    actionCounts,
    resourceTypeCounts,
    successStats,
    topUsers,
  ] = await Promise.all([
    prisma.activityLog.count({ where }),

    prisma.activityLog.groupBy({
      by: ['action'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),

    prisma.activityLog.groupBy({
      by: ['resourceType'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),

    prisma.activityLog.aggregate({
      where,
      _count: { id: true },
      _avg: { duration: true },
    }),

    prisma.activityLog.groupBy({
      by: ['userId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ])

  // Get user details for top users
  const userIds = topUsers.map(u => u.userId).filter(Boolean) as string[]
  const users = userIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          directAvatarUrl: true,
        },
      })
    : []

  const userMap = new Map(users.map(u => [u.id, u]))

  return {
    totalActivities,
    actionCounts: actionCounts.map(item => ({
      action: item.action,
      count: item._count.id,
    })),
    resourceTypeCounts: resourceTypeCounts.map(item => ({
      resourceType: item.resourceType,
      count: item._count.id,
    })),
    successRate: {
      total: successStats._count.id,
      avgDuration: successStats._avg.duration,
    },
    topUsers: topUsers
      .map(item => ({
        user: item.userId ? userMap.get(item.userId) : null,
        count: item._count.id,
      }))
      .filter(u => u.user),
  }
}

/**
 * Get user's own activities (for personal timeline)
 */
export async function getUserActivities(
  userId: string,
  options: ActivityOptions & { filters?: Omit<ActivityFilters, 'userId'> } = {}
) {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', filters } = options
  const skip = (page - 1) * limit

  const where: any = { userId }

  // Apply additional filters
  if (filters?.action) where.action = filters.action
  if (filters?.resourceType) where.resourceType = filters.resourceType
  if (filters?.success !== undefined) where.success = filters.success

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            directAvatarUrl: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.activityLog.count({ where }),
  ])

  return {
    activities,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    hasNextPage: page < Math.ceil(total / limit),
    hasPreviousPage: page > 1,
  }
}

/**
 * Get a single activity by ID
 */
export async function getActivityById(id: string) {
  return prisma.activityLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          directAvatarUrl: true,
        },
      },
    },
  })
}
