'use server'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import {
    getUserConversations,
    getOrCreateConversation,
} from '@/lib/marketplace/repositories'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateConversationSchema = z.object({
    sellPostId: z.string().min(1, 'Sell post ID is required'),
})

/**
 * GET /api/user/conversations
 * Get all conversations for the current user (as buyer or seller)
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

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        const conversations = await getUserConversations(
            session.userId,
            status as any || undefined
        )

        return NextResponse.json({
            success: true,
            data: conversations,
            message: 'Conversations retrieved successfully',
        })
    } catch (error: any) {
        console.error('Get conversations error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch conversations' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/user/conversations
 * Get or create a conversation for a sell post
 */
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth()
        if (!session) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            )
        }

        const body = await request.json()

        // Validate request body
        const validation = CreateConversationSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: validation.error.errors[0]?.message || 'Invalid input',
                },
                { status: 400 }
            )
        }

        const { sellPostId } = validation.data

        // Get or create conversation
        const conversation = await getOrCreateConversation({
            sellPostId,
            sellerId: '', // Will be determined from the sell post
            buyerId: session.userId,
        })

        return NextResponse.json({
            success: true,
            data: conversation,
            message: 'Conversation retrieved successfully',
        })
    } catch (error: any) {
        console.error('Get/Create conversation error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to retrieve conversation' },
            { status: 500 }
        )
    }
}
