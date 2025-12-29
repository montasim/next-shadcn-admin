import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getUserActivities } from '@/lib/activity/repositories/activity-log.repository'
import { z } from 'zod'
import { ActivityAction, ActivityResourceType } from '@prisma/client'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'action', 'resourceName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  action: z.nativeEnum(ActivityAction).optional(),
  resourceType: z.nativeEnum(ActivityResourceType).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Users can only see their own activities
    const { searchParams } = new URL(request.url)
    const params = querySchema.parse(Object.fromEntries(searchParams))

    // Apply filters
    const filters: any = { userId: session.userId }
    if (params.action) filters.action = params.action
    if (params.resourceType) filters.resourceType = params.resourceType

    const result = await getUserActivities(session.userId, {
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      filters,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('[API] Get user activities error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch your activities', details: error.message },
      { status: 500 }
    )
  }
}
