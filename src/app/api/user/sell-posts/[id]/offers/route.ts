'use server'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import {
    getOffersForSellPost,
    createOffer,
    type CreateOfferData,
    getSellPostById,
} from '@/lib/marketplace/repositories'
import { notifyNewOffer } from '@/lib/notifications/notifications.repository'
import { logActivity } from '@/lib/activity/logger'
import { ActivityAction, ActivityResourceType } from '@prisma/client'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const MakeOfferSchema = z.object({
    offeredPrice: z.coerce.number().positive('Offer amount must be greater than 0'),
    message: z.string().optional()
      .transform((val) => val ? val.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '').trim() : val),
})

/**
 * GET /api/user/sell-posts/[id]/offers
 * Get offers for a sell post (seller only)
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

        // TODO: Verify user owns the sell post
        // For now, just get the offers
        const offers = await getOffersForSellPost(id)

        return NextResponse.json({
            success: true,
            data: offers,
            message: 'Offers retrieved successfully',
        })
    } catch (error: any) {
        console.error('Get offers error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch offers' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/user/sell-posts/[id]/offers
 * Make an offer on a sell post (buyer)
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
        const validation = MakeOfferSchema.safeParse(body)
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

        // Create the offer
        const offerData: CreateOfferData = {
            sellPostId: id,
            buyerId: session.userId,
            offeredPrice: data.offeredPrice,
            message: data.message,
        }

        const offer = await createOffer(offerData)

        // Get sell post for logging and notification
        const sellPost = await getSellPostById(id)

        // Log offer creation activity (non-blocking)
        if (sellPost) {
            logActivity({
                userId: session.userId,
                userRole: session.role as any,
                action: ActivityAction.OFFER_CREATED,
                resourceType: ActivityResourceType.OFFER,
                resourceId: offer.id,
                resourceName: sellPost.title,
                description: `Made offer of $${data.offeredPrice} on "${sellPost.title || 'listing'}"`,
                metadata: {
                    offeredPrice: data.offeredPrice,
                    sellPostId: id,
                },
                endpoint: '/api/user/sell-posts/[id]/offers',
            }).catch(console.error)
        }

        // Broadcast new offer to socket server (for real-time notification)
        if (sellPost) {
            // Broadcast to socket server for real-time delivery
            const socketUrl = process.env.WEBSOCKET_SERVER_URL || process.env.NEXT_PUBLIC_WS_URL
            const apiKey = process.env.WEBSOCKET_API_KEY
            if (socketUrl && apiKey) {
                try {
                    await fetch(`${socketUrl}/api/broadcast-new-offer`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            sellPostId: id,
                            offer: {
                                ...offer,
                                createdAt: offer.createdAt.toISOString(),
                                updatedAt: offer.updatedAt.toISOString()
                            },
                            sellerId: sellPost.sellerId
                        }),
                        signal: AbortSignal.timeout(3000),
                    }).catch(err => console.error('Socket broadcast failed:', err))
                } catch (err) {
                    console.error('Socket broadcast error:', err)
                }
            }

            // Notify the seller about the new offer (database notification)
            const buyerName = session.firstName && session.lastName
                ? `${session.firstName} ${session.lastName}`
                : session.name || 'Someone'

            await notifyNewOffer(
                sellPost.sellerId,
                buyerName,
                sellPost.id,
                sellPost.title,
                data.offeredPrice
            )
        }

        revalidatePath(`/marketplace/${id}`)

        return NextResponse.json({
            success: true,
            data: offer,
            message: 'Offer submitted successfully',
        }, { status: 201 })
    } catch (error: any) {
        console.error('Make offer error:', error)

        if (error.message === 'Sell post not found') {
            return NextResponse.json(
                { success: false, message: 'Listing not found' },
                { status: 404 }
            )
        }

        if (error.message === 'This listing is no longer available') {
            return NextResponse.json(
                { success: false, message: 'This listing is no longer available' },
                { status: 400 }
            )
        }

        if (error.message === 'You cannot make an offer on your own listing') {
            return NextResponse.json(
                { success: false, message: 'You cannot make an offer on your own listing' },
                { status: 400 }
            )
        }

        if (error.message.includes('already have an active offer')) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { success: false, message: 'Failed to submit offer' },
            { status: 500 }
        )
    }
}
