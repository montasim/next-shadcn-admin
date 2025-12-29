import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getActivityStats } from '@/lib/activity/repositories/activity-log.repository'
import { z } from 'zod'

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Only admins can view activity statistics
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = querySchema.parse(Object.fromEntries(searchParams))

    // Default to last 30 days if not specified
    const endDate = params.endDate ? new Date(params.endDate) : new Date()
    const startDate = params.startDate
      ? new Date(params.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

    const stats = await getActivityStats({
      startDate,
      endDate,
      userId: params.userId,
    })

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error: any) {
    console.error('[API] Get activity stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity statistics', details: error.message },
      { status: 500 }
    )
  }
}
