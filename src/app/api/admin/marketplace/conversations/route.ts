'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getSellPostConversations, getAllConversations, deleteConversation } from '@/lib/marketplace/repositories'

/**
 * GET /api/admin/marketplace/conversations
 * View all conversations (admin)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth()
        if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
            return NextResponse.json(
                { success: false, message: 'Admin access required' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const sellPostId = searchParams.get('sellPostId')
        const page = Number(searchParams.get('page')) || 1
        const limit = Number(searchParams.get('limit')) || 50
        const status = searchParams.get('status') as any
        const search = searchParams.get('search') || undefined

        if (sellPostId) {
            // Get conversations for a specific sell post
            const conversations = await getSellPostConversations(sellPostId)
            return NextResponse.json({
                success: true,
                data: { conversations, pagination: { currentPage: 1, totalPages: 1, totalItems: conversations.length } },
                message: 'Conversations retrieved successfully',
            })
        }

        // Get all conversations with pagination and filters
        const result = await getAllConversations({
            page,
            limit,
            status: status || undefined,
            search,
        })

        return NextResponse.json({
            success: true,
            data: result,
            message: 'Conversations retrieved successfully',
        })
    } catch (error: any) {
        console.error('Get admin conversations error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch conversations' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/marketplace/conversations
 * Delete a conversation (admin)
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await requireAuth()
        if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
            return NextResponse.json(
                { success: false, message: 'Admin access required' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const conversationId = searchParams.get('id')

        if (!conversationId) {
            return NextResponse.json(
                { success: false, message: 'Conversation ID is required' },
                { status: 400 }
            )
        }

        await deleteConversation(conversationId)

        return NextResponse.json({
            success: true,
            message: 'Conversation deleted successfully',
        })
    } catch (error: any) {
        console.error('Delete admin conversation error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to delete conversation' },
            { status: 500 }
        )
    }
}
