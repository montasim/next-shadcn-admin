'use server'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { createMessage } from '@/lib/marketplace/repositories'
import { getConversationWithMessages } from '@/lib/marketplace/repositories'
import { notifyNewMessage } from '@/lib/notifications/notifications.repository'
import { logActivity } from '@/lib/activity/logger'
import { ActivityAction, ActivityResourceType } from '@prisma/client'

// ============================================================================
// SOCKET.IO WEBHOOK HELPER
// ============================================================================

/**
 * Broadcast new message to Socket.io server
 * This triggers real-time delivery to connected clients
 */
async function broadcastNewMessage(
    conversationId: string,
    message: any,
    senderId: string
): Promise<void> {
    const wsUrl = process.env.WEBSOCKET_SERVER_URL || process.env.NEXT_PUBLIC_WS_URL

    // Only broadcast if WebSocket URL is configured
    if (!wsUrl) {
        console.log('[WebSocket] No WebSocket URL configured, skipping broadcast')
        return
    }

    const apiKey = process.env.WEBSOCKET_API_KEY
    if (!apiKey) {
        console.log('[WebSocket] No WEBSOCKET_API_KEY configured, skipping broadcast')
        return
    }

    try {
        const response = await fetch(`${wsUrl}/api/broadcast-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                conversationId,
                message,
                senderId,
            }),
            // Don't wait for this to complete - fire and forget
            signal: AbortSignal.timeout(3000),
        })

        if (!response.ok) {
            console.error('[WebSocket] Broadcast failed:', await response.text())
        } else {
            console.log('[WebSocket] Successfully broadcasted message to conversation:', conversationId)
        }
    } catch (error) {
        // Log but don't fail the request - this is an enhancement, not critical
        console.error('[WebSocket] Broadcast error:', error)
    }
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const SendMessageSchema = z.object({
    content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
})

/**
 * POST /api/user/conversations/[id]/messages
 * Send a message in a conversation
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

        const { id } = await params
        const body = await request.json()

        // Validate request body
        const validation = SendMessageSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: validation.error.errors[0]?.message || 'Invalid input',
                },
                { status: 400 }
            )
        }

        const { content } = validation.data

        // Create message
        const message = await createMessage({
            conversationId: id,
            senderId: session.userId,
            content,
        })

        // Log message activity (non-blocking)
        logActivity({
            userId: session.userId,
            userRole: session.role as any,
            action: ActivityAction.MESSAGE_SENT,
            resourceType: ActivityResourceType.MESSAGE,
            resourceId: message.id,
            resourceName: `Message in conversation ${id}`,
            description: `Sent message in conversation`,
            metadata: {
                conversationId: id,
                contentLength: content.length,
            },
            endpoint: '/api/user/conversations/[id]/messages',
        }).catch(console.error)

        // Broadcast to Socket.io server for real-time delivery
        // This is non-blocking and won't affect the response
        broadcastNewMessage(id, message, session.userId).catch(err => {
            console.error('[WebSocket] Background broadcast failed:', err)
        })

        // Get conversation details to notify the recipient
        const conversation = await getConversationWithMessages(id)
        if (conversation) {
            // Determine recipient (the other user in the conversation)
            const recipientId = conversation.sellerId === session.userId ? conversation.buyerId : conversation.sellerId
            const senderName = session.firstName && session.lastName
                ? `${session.firstName} ${session.lastName}`
                : session.name || 'Someone'

            // Notify recipient
            await notifyNewMessage(
                recipientId,
                senderName,
                conversation.id,
                conversation.sellPost?.title
            )
        }

        return NextResponse.json({
            success: true,
            data: message,
            message: 'Message sent successfully',
        }, { status: 201 })
    } catch (error: any) {
        console.error('Send message error:', error)

        if (error.message === 'Conversation not found') {
            return NextResponse.json(
                { success: false, message: 'Conversation not found' },
                { status: 404 }
            )
        }

        if (error.message.includes('not a participant')) {
            return NextResponse.json(
                { success: false, message: 'You are not a participant in this conversation' },
                { status: 403 }
            )
        }

        if (error.message === 'This conversation has been blocked') {
            return NextResponse.json(
                { success: false, message: 'This conversation has been blocked' },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { success: false, message: 'Failed to send message' },
            { status: 500 }
        )
    }
}
