'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getSellPostById, getRelatedSellPosts, recordSellPostView } from '@/lib/marketplace/repositories'
import { requireAuth } from '@/lib/auth/session'
import { getSession } from '@/lib/auth/session'

/**
 * GET /api/marketplace/posts/[id]
 * Get a single sell post by ID (public endpoint)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const post = await getSellPostById(id)

        if (!post) {
            return NextResponse.json(
                { success: false, message: 'Sell post not found' },
                { status: 404 }
            )
        }

        // Record view asynchronously (don't await)
        const session = await getSession()
        recordSellPostView({
            sellPostId: id,
            userId: session?.userId,
            sessionId: session?.userId || undefined,
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
            referrer: request.headers.get('referer') || undefined,
        }).catch(console.error)

        // Get related posts
        const relatedPosts = await getRelatedSellPosts(id)

        return NextResponse.json({
            success: true,
            data: { post, relatedPosts },
            message: 'Sell post retrieved successfully',
        })
    } catch (error: any) {
        console.error('Get sell post error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch sell post' },
            { status: 500 }
        )
    }
}
