'use server'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import {
    getConversationWithMessages,
    archiveConversation,
    markTransactionComplete,
    blockConversation,
} from '@/lib/marketplace/repositories'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateConversationSchema = z.object({
    action: z.enum(['archive', 'complete', 'block']),
})

/**
 * GET /api/user/conversations/[id]
 * Get conversation details with messages
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

        const { id } = await params

        const conversation = await getConversationWithMessages(id)

        if (!conversation) {
            return NextResponse.json(
                { success: false, message: 'Conversation not found' },
                { status: 404 }
            )
        }

        // Verify user is a participant
        if (conversation.sellerId !== session.userId && conversation.buyerId !== session.userId) {
            return NextResponse.json(
                { success: false, message: 'You do not have permission to view this conversation' },
                { status: 403 }
            )
        }

        // Mark messages as read
        // (Done separately via /read endpoint)

        return NextResponse.json({
            success: true,
            data: conversation,
            message: 'Conversation retrieved successfully',
        })
    } catch (error: any) {
        console.error('Get conversation error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch conversation' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/user/conversations/[id]
 * Update conversation (archive, complete, block)
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

        const { id } = await params
        const body = await request.json()

        // Validate request body
        const validation = UpdateConversationSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: validation.error.errors[0]?.message || 'Invalid input',
                },
                { status: 400 }
            )
        }

        const { action } = validation.data

        let result
        let message

        switch (action) {
            case 'archive':
                result = await archiveConversation(id, session.userId)
                message = 'Conversation archived'
                break
            case 'complete':
                result = await markTransactionComplete(id, session.userId)
                message = 'Transaction marked as complete'
                break
            case 'block':
                result = await blockConversation(id, session.userId)
                message = 'Conversation blocked'
                break
            default:
                return NextResponse.json(
                    { success: false, message: 'Invalid action' },
                    { status: 400 }
                )
        }

        revalidatePath('/messages')
        revalidatePath(`/messages/${id}`)

        return NextResponse.json({
            success: true,
            data: result,
            message,
        })
    } catch (error: any) {
        console.error('Update conversation error:', error)

        if (error.message === 'Conversation not found') {
            return NextResponse.json(
                { success: false, message: 'Conversation not found' },
                { status: 404 }
            )
        }

        if (error.message.includes('do not have permission')) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 403 }
            )
        }

        return NextResponse.json(
            { success: false, message: 'Failed to update conversation' },
            { status: 500 }
        )
    }
}
