'use server'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import { createReview, getReviewByConversation, getSellerStats } from '@/lib/marketplace/repositories'
import { logActivity } from '@/lib/activity/logger'
import { ActivityAction, ActivityResourceType } from '@prisma/client'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateReviewSchema = z.object({
    rating: z.coerce.number().int().min(1).max(5),
    communicationRating: z.coerce.number().int().min(0).max(5).optional(),
    descriptionAccuracyRating: z.coerce.number().int().min(0).max(5).optional(),
    meetupRating: z.coerce.number().int().min(0).max(5).optional(),
    comment: z.string().optional(),
})

/**
 * POST /api/user/conversations/[id]/review
 * Leave a review for the seller (after transaction complete)
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
        const validation = CreateReviewSchema.safeParse(body)
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

        // Check if review already exists
        const existingReview = await getReviewByConversation(id)
        if (existingReview) {
            return NextResponse.json(
                { success: false, message: 'Review already exists for this transaction' },
                { status: 400 }
            )
        }

        // Create review
        const review = await createReview({
            conversationId: id,
            sellPostId: body.sellPostId || '', // Will be validated in repository
            reviewerId: session.userId,
            sellerId: body.sellerId || '', // Will be validated in repository
            rating: data.rating,
            communicationRating: data.communicationRating || 0,
            descriptionAccuracyRating: data.descriptionAccuracyRating || 0,
            meetupRating: data.meetupRating || 0,
            comment: data.comment,
        })

        // Log review creation activity (non-blocking)
        logActivity({
            userId: session.userId,
            userRole: session.role as any,
            action: ActivityAction.REVIEW_POSTED,
            resourceType: ActivityResourceType.REVIEW,
            resourceId: review.id,
            resourceName: `Review for seller ${body.sellerId}`,
            description: `Posted ${data.rating}-star review for seller`,
            metadata: {
                rating: data.rating,
                communicationRating: data.communicationRating,
                descriptionAccuracyRating: data.descriptionAccuracyRating,
                meetupRating: data.meetupRating,
                hasComment: !!data.comment,
                conversationId: id,
            },
            endpoint: '/api/user/conversations/[id]/review',
        }).catch(console.error)

        revalidatePath('/messages')
        revalidatePath(`/messages/${id}`)

        return NextResponse.json({
            success: true,
            data: review,
            message: 'Review submitted successfully',
        }, { status: 201 })
    } catch (error: any) {
        console.error('Create review error:', error)

        if (error.message === 'Conversation not found') {
            return NextResponse.json(
                { success: false, message: 'Conversation not found' },
                { status: 404 }
            )
        }

        if (error.message === 'Transaction must be completed before leaving a review') {
            return NextResponse.json(
                { success: false, message: 'Transaction must be completed before leaving a review' },
                { status: 400 }
            )
        }

        if (error.message === 'Only the buyer can leave a review') {
            return NextResponse.json(
                { success: false, message: 'Only the buyer can leave a review' },
                { status: 403 }
            )
        }

        if (error.message === 'Review already exists for this transaction') {
            return NextResponse.json(
                { success: false, message: 'Review already exists for this transaction' },
                { status: 400 }
            )
        }

        if (error.message === 'Rating must be between 1 and 5') {
            return NextResponse.json(
                { success: false, message: 'Rating must be between 1 and 5' },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { success: false, message: 'Failed to submit review' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/user/conversations/[id]/review
 * Get review for a conversation
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

        const review = await getReviewByConversation(id)

        return NextResponse.json({
            success: true,
            data: review,
            message: 'Review retrieved successfully',
        })
    } catch (error: any) {
        console.error('Get review error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch review' },
            { status: 500 }
        )
    }
}
