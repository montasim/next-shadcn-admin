import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getActivities } from '@/lib/activity/repositories/activity-log.repository'
import { ActivityAction, ActivityResourceType, UserRole } from '@prisma/client'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  sortBy: z.enum(['createdAt', 'action', 'resourceName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  userId: z.string().optional(),
  action: z.nativeEnum(ActivityAction).optional(),
  resourceType: z.nativeEnum(ActivityResourceType).optional(),
  resourceId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  success: z.enum(['true', 'false']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Only admins can view all activities
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = querySchema.parse(Object.fromEntries(searchParams))

    const filters: any = {}
    if (params.userId) filters.userId = params.userId
    if (params.action) filters.action = params.action
    if (params.resourceType) filters.resourceType = params.resourceType
    if (params.resourceId) filters.resourceId = params.resourceId
    if (params.search) filters.search = params.search
    if (params.startDate) filters.startDate = new Date(params.startDate)
    if (params.endDate) filters.endDate = new Date(params.endDate)
    if (params.success !== undefined) filters.success = params.success === 'true'

    const result = await getActivities(filters, {
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('[API] Get activities error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities', details: error.message },
      { status: 500 }
    )
  }
}
