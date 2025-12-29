'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import {
    getUserNotifications,
    getUnreadNotificationCount,
    markAllNotificationsAsRead,
    deleteAllNotifications,
} from '@/lib/notifications/notifications.repository'

/**
 * GET /api/user/notifications
 * Get user's notifications
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
        const unreadOnly = searchParams.get('unreadOnly') === 'true'
        const limit = Number(searchParams.get('limit')) || 20

        const notifications = await getUserNotifications(session.userId, {
            unreadOnly,
            limit,
        })

        const unreadCount = await getUnreadNotificationCount(session.userId)

        return NextResponse.json({
            success: true,
            data: {
                notifications,
                unreadCount,
            },
        })
    } catch (error: any) {
        console.error('Get notifications error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch notifications' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/user/notifications
 * Delete all notifications
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await requireAuth()
        if (!session) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            )
        }

        await deleteAllNotifications(session.userId)

        return NextResponse.json({
            success: true,
            message: 'All notifications deleted',
        })
    } catch (error: any) {
        console.error('Delete notifications error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to delete notifications' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/user/notifications
 * Mark all as read
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await requireAuth()
        if (!session) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            )
        }

        await markAllNotificationsAsRead(session.userId)

        return NextResponse.json({
            success: true,
            message: 'All notifications marked as read',
        })
    } catch (error: any) {
        console.error('Mark notifications as read error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to mark notifications as read' },
            { status: 500 }
        )
    }
}
