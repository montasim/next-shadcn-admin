'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import {
    markNotificationAsRead,
    deleteNotification,
} from '@/lib/notifications/notifications.repository'

/**
 * PATCH /api/user/notifications/[id]
 * Mark notification as read
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

        await markNotificationAsRead(id, session.userId)

        return NextResponse.json({
            success: true,
            message: 'Notification marked as read',
        })
    } catch (error: any) {
        console.error('Mark notification as read error:', error)

        if (error.message === 'Notification not found') {
            return NextResponse.json(
                { success: false, message: 'Notification not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(
            { success: false, message: 'Failed to mark notification as read' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/user/notifications/[id]
 * Delete notification
 */
export async function DELETE(
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

        await deleteNotification(id, session.userId)

        return NextResponse.json({
            success: true,
            message: 'Notification deleted',
        })
    } catch (error: any) {
        console.error('Delete notification error:', error)

        if (error.message === 'Notification not found') {
            return NextResponse.json(
                { success: false, message: 'Notification not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(
            { success: false, message: 'Failed to delete notification' },
            { status: 500 }
        )
    }
}
