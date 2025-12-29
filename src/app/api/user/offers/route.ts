'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getBuyerOffers } from '@/lib/marketplace/repositories'

/**
 * GET /api/user/my-offers
 * Get all offers made by the current user
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

        const offers = await getBuyerOffers(session.userId)

        return NextResponse.json({
            success: true,
            data: offers,
            message: 'Your offers retrieved successfully',
        })
    } catch (error: any) {
        console.error('Get my offers error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch your offers' },
            { status: 500 }
        )
    }
}
