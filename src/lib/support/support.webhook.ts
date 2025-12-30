/**
 * Support Tickets Webhook Integration
 *
 * Sends real-time updates to socket server for ticket events
 */

import { config } from '@/config'

interface TicketUpdatePayload {
  ticketId: string
  status: string
  userId: string
}

interface TicketResponsePayload {
  ticketId: string
  response: {
    id: string
    ticketId: string
    message: string
    isFromAdmin: boolean
    createdAt: string
    sender: {
      id: string
      name: string
      email: string
    }
  }
  userId: string
}

/**
 * Broadcast ticket status update to user via socket server
 */
export async function broadcastTicketUpdate(payload: TicketUpdatePayload): Promise<void> {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL

  if (!wsUrl) {
    console.log('[Webhook] No WS_URL configured, skipping ticket update broadcast')
    return
  }

  try {
    const response = await fetch(`${wsUrl}/api/broadcast-ticket-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEBHOOK_API_KEY || ''}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('[Webhook] Failed to broadcast ticket update:', await response.text())
    }
  } catch (error) {
    console.error('[Webhook] Error broadcasting ticket update:', error)
  }
}

/**
 * Broadcast new ticket response to user via socket server
 */
export async function broadcastTicketResponse(payload: TicketResponsePayload): Promise<void> {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL

  if (!wsUrl) {
    console.log('[Webhook] No WS_URL configured, skipping ticket response broadcast')
    return
  }

  try {
    const response = await fetch(`${wsUrl}/api/broadcast-ticket-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEBHOOK_API_KEY || ''}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('[Webhook] Failed to broadcast ticket response:', await response.text())
    }
  } catch (error) {
    console.error('[Webhook] Error broadcasting ticket response:', error)
  }
}
