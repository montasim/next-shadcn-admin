'use server'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import { respondToOffer } from '@/lib/marketplace/repositories'
import { notifyOfferStatusChange } from '@/lib/notifications/notifications.repository'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const RespondToOfferSchema = z.object({
    status: z.enum(['ACCEPTED', 'REJECTED', 'COUNTERED']),
    responseMessage: z.string().optional(),
    counterPrice: z.coerce.number().positive().optional(),
}).refine(
    (data) => !(data.status === 'COUNTERED' && !data.counterPrice),
    {
        message: 'Counter price is required when countering an offer',
        path: ['counterPrice'],
    }
)

/**
 * POST /api/user/offers/[id]/respond
 * Respond to an offer (accept/reject/counter) - seller only
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
        const body = await request.json()

        // Validate request body
        const validation = RespondToOfferSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: validation.error.errors[0]?.message || 'Invalid input',
                },
                { status: 400 }
            )
        }

        const data = validation.data

        // Respond to offer
        const responseData = {
            status: data.status,
            responseMessage: data.responseMessage,
            counterPrice: data.counterPrice,
        }

        const offer = await respondToOffer(id, session.userId, responseData)

        // Notify the buyer about the offer status change
        await notifyOfferStatusChange(
            offer.buyerId,
            offer.sellPost.title,
            data.status as 'ACCEPTED' | 'REJECTED' | 'COUNTERED',
            data.counterPrice
        )

        revalidatePath('/marketplace/my-posts')

        return NextResponse.json({
            success: true,
            data: offer,
            message: `Offer ${data.status.toLowerCase()} successfully`,
        })
    } catch (error: any) {
        console.error('Respond to offer error:', error)

        if (error.message === 'Offer not found') {
            return NextResponse.json(
                { success: false, message: 'Offer not found' },
                { status: 404 }
            )
        }

        if (error.message === 'You do not have permission to respond to this offer') {
            return NextResponse.json(
                { success: false, message: 'Only the seller can respond to offers' },
                { status: 403 }
            )
        }

        return NextResponse.json(
            { success: false, message: 'Failed to respond to offer' },
            { status: 500 }
        )
    }
}
