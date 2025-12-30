'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getTicketById, updateTicket, addResponse } from '@/lib/support/support.repository'
import { broadcastTicketUpdate, broadcastTicketResponse } from '@/lib/support/support.webhook'
import { TicketStatus } from '@prisma/client'

/**
 * GET /api/admin/support-tickets/:id
 * Get a single ticket (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const ticket = await getTicketById(id)

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { ticket },
    })
  } catch (error: any) {
    console.error('Get ticket error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/support-tickets/:id
 * Update ticket status, assignment, or resolution (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const body = await request.json()
    const { status, assignedToId, resolution } = body

    const validStatuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED']

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      )
    }

    const { id } = await params
    const ticket = await updateTicket(id, {
      status,
      assignedToId,
      resolution,
    })

    // Broadcast ticket update to user via socket server
    if (status) {
      await broadcastTicketUpdate({
        ticketId: id,
        status,
        userId: ticket.userId,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      data: { ticket },
    })
  } catch (error: any) {
    console.error('Update ticket error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update ticket' },
      { status: 500 }
    )
  }
}
