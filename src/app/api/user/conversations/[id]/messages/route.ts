'use server'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { createMessage } from '@/lib/marketplace/repositories'
import { getConversationWithMessages } from '@/lib/marketplace/repositories'
import { notifyNewMessage } from '@/lib/notifications/notifications.repository'

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
