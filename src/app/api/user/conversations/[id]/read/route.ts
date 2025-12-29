'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { markMessagesRead } from '@/lib/marketplace/repositories'

/**
 * POST /api/user/conversations/[id]/read
 * Mark messages as read in a conversation
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

        // Mark messages as read
        await markMessagesRead(id, session.userId)

        return NextResponse.json({
            success: true,
            message: 'Messages marked as read',
        })
    } catch (error: any) {
        console.error('Mark messages read error:', error)

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

        return NextResponse.json(
            { success: false, message: 'Failed to mark messages as read' },
            { status: 500 }
        )
    }
}
