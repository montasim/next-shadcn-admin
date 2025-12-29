'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import {
    getMarketplaceStats,
    getPostsOverTime,
    getSalesOverTime,
    getTopSellers,
    getMarketplaceActivitySummary,
} from '@/lib/marketplace/repositories'

/**
 * GET /api/admin/marketplace/analytics
 * Get marketplace analytics (admin)
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
        const days = Number(searchParams.get('days')) || 30

        const [
            stats,
            postsOverTime,
            salesOverTime,
            topSellers,
            activitySummary,
        ] = await Promise.all([
            getMarketplaceStats(),
            getPostsOverTime(days),
            getSalesOverTime(days),
            getTopSellers(10),
            getMarketplaceActivitySummary(),
        ])

        return NextResponse.json({
            success: true,
            data: {
                overview: stats,
                postsOverTime,
                salesOverTime,
                topSellers,
                activitySummary,
            },
            message: 'Marketplace analytics retrieved successfully',
        })
    } catch (error: any) {
        console.error('Get marketplace analytics error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch analytics' },
            { status: 500 }
        )
    }
}
