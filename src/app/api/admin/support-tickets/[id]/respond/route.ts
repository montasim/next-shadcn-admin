'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { addResponse, getTicketById } from '@/lib/support/support.repository'
import { broadcastTicketResponse } from '@/lib/support/support.webhook'

/**
 * POST /api/admin/support-tickets/:id/respond
 * Add a response to a ticket (admin only)
 */
export async function POST(
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
    const { message, attachments } = body

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      )
    }

    const { id } = await params

    const response = await addResponse({
      ticketId: id,
      senderId: session.userId,
      senderRole: session.role,
      isFromAdmin: true,
      message,
      attachments,
    })

    // Get ticket to fetch userId for broadcasting
    const ticket = await getTicketById(id)

    // Broadcast new response to user via socket server
    if (ticket) {
      await broadcastTicketResponse({
        ticketId: id,
        response: {
          id: response.id,
          ticketId: response.ticketId,
          message: response.message,
          isFromAdmin: response.isFromAdmin,
          createdAt: response.createdAt.toISOString(),
          sender: {
            id: session.userId,
            name: session.name,
            email: session.email,
          },
        },
        userId: ticket.userId,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Response added successfully',
      data: { response },
    })
  } catch (error: any) {
    console.error('Add response error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add response' },
      { status: 500 }
    )
  }
}
