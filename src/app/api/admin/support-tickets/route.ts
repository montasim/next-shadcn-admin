'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getTickets, getTicketStats } from '@/lib/support/support.repository'

/**
 * GET /api/admin/support-tickets
 * Get all support tickets (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as any || undefined
    const assignedToId = searchParams.get('assignedToId') || undefined
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20
    const offset = (page - 1) * limit

    const { tickets, total } = await getTickets({
      status,
      assignedToId,
      limit,
      offset,
    })

    const stats = await getTicketStats()

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        stats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error: any) {
    console.error('Get admin tickets error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}
