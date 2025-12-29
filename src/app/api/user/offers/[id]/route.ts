'use server'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import { getOfferById, withdrawOffer } from '@/lib/marketplace/repositories'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const RespondToOfferSchema = z.object({
    action: z.enum(['accept', 'reject', 'counter']),
    responseMessage: z.string().optional(),
    counterPrice: z.coerce.number().positive().optional(),
})

/**
 * GET /api/user/offers/[id]
 * Get offer details
 */
export async function GET(
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

        const offer = await getOfferById(id)

        if (!offer) {
            return NextResponse.json(
                { success: false, message: 'Offer not found' },
                { status: 404 }
            )
        }

        // Verify user is either buyer or seller
        if (offer.buyerId !== session.userId && offer.sellPost.sellerId !== session.userId) {
            return NextResponse.json(
                { success: false, message: 'You do not have permission to view this offer' },
                { status: 403 }
            )
        }

        return NextResponse.json({
            success: true,
            data: offer,
            message: 'Offer retrieved successfully',
        })
    } catch (error: any) {
        console.error('Get offer error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch offer' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/user/offers/[id]/respond
 * Respond to an offer (accept/reject/counter) - seller only
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
        const body = await request.json()

        // This endpoint is for responding to offers
        // Actual implementation is in a separate endpoint below
        return NextResponse.json(
            { success: false, message: 'Use /respond endpoint to respond to offers' },
            { status: 400 }
        )
    } catch (error: any) {
        console.error('Update offer error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to update offer' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/user/offers/[id]
 * Withdraw an offer (buyer only)
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

        await withdrawOffer(id, session.userId)

        revalidatePath('/offers/sent')

        return NextResponse.json({
            success: true,
            message: 'Offer withdrawn successfully',
        })
    } catch (error: any) {
        console.error('Withdraw offer error:', error)

        if (error.message === 'Offer not found') {
            return NextResponse.json(
                { success: false, message: 'Offer not found' },
                { status: 404 }
            )
        }

        if (error.message === 'You do not have permission to withdraw this offer') {
            return NextResponse.json(
                { success: false, message: 'You do not have permission to withdraw this offer' },
                { status: 403 }
            )
        }

        if (error.message === 'Cannot withdraw an accepted offer') {
            return NextResponse.json(
                { success: false, message: 'Cannot withdraw an accepted offer' },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { success: false, message: 'Failed to withdraw offer' },
            { status: 500 }
        )
    }
}
