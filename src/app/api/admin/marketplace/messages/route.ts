'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getAllMessages, adminDeleteMessage } from '@/lib/marketplace/repositories'

/**
 * GET /api/admin/marketplace/messages
 * View all messages (admin)
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
        const page = Number(searchParams.get('page')) || 1
        const limit = Number(searchParams.get('limit')) || 50
        const search = searchParams.get('search') || undefined
        const conversationId = searchParams.get('conversationId') || undefined

        const result = await getAllMessages({
            page,
            limit,
            search,
            conversationId,
        })

        return NextResponse.json({
            success: true,
            data: result,
            message: 'Messages retrieved successfully',
        })
    } catch (error: any) {
        console.error('Get admin messages error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch messages' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/marketplace/messages
 * Delete a message (admin)
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
        const messageId = searchParams.get('id')

        if (!messageId) {
            return NextResponse.json(
                { success: false, message: 'Message ID is required' },
                { status: 400 }
            )
        }

        await adminDeleteMessage(messageId)

        return NextResponse.json({
            success: true,
            message: 'Message deleted successfully',
        })
    } catch (error: any) {
        console.error('Delete admin message error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to delete message' },
            { status: 500 }
        )
    }
}
