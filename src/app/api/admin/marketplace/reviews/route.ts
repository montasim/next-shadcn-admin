'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getAllReviews, deleteReview } from '@/lib/marketplace/repositories'

/**
 * GET /api/admin/marketplace/reviews
 * View all reviews (admin)
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

        const result = await getAllReviews(page, limit)

        return NextResponse.json({
            success: true,
            data: result,
            message: 'Reviews retrieved successfully',
        })
    } catch (error: any) {
        console.error('Get admin reviews error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch reviews' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/marketplace/reviews
 * Delete a review (admin)
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
        const reviewId = searchParams.get('id')

        if (!reviewId) {
            return NextResponse.json(
                { success: false, message: 'Review ID is required' },
                { status: 400 }
            )
        }

        // Admin can delete any review by not passing userId
        await deleteReview(reviewId, undefined)

        return NextResponse.json({
            success: true,
            message: 'Review deleted successfully',
        })
    } catch (error: any) {
        console.error('Delete admin review error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to delete review' },
            { status: 500 }
        )
    }
}
