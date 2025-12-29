'use server'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import {
    getSellPostById,
    updateSellPost,
    deleteSellPost,
    markSellPostAsSold,
} from '@/lib/marketplace/repositories'
import { BookCondition, SellPostStatus } from '@prisma/client'
import { logActivity } from '@/lib/activity/logger'
import { ActivityAction, ActivityResourceType } from '@prisma/client'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateSellPostSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().optional(),
    price: z.coerce.number().positive().optional(),
    negotiable: z.coerce.boolean().optional(),
    condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']).optional(),
    images: z.array(z.string()).optional(),
    directImageUrls: z.any().optional(),
    location: z.string().optional(),
    city: z.string().optional(),
    status: z.enum(['AVAILABLE', 'PENDING', 'SOLD', 'EXPIRED', 'HIDDEN']).optional(),
    expiresAt: z.string().datetime().optional(),
})

/**
 * GET /api/user/sell-posts/[id]
 * Get a single sell post by ID (user's own post)
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

        const post = await getSellPostById(id)

        if (!post) {
            return NextResponse.json(
                { success: false, message: 'Sell post not found' },
                { status: 404 }
            )
        }

        // Verify ownership
        if (post.sellerId !== session.userId) {
            return NextResponse.json(
                { success: false, message: 'You do not have permission to view this post' },
                { status: 403 }
            )
        }

        return NextResponse.json({
            success: true,
            data: post,
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

/**
 * PATCH /api/user/sell-posts/[id]
 * Update a sell post
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

        // Validate request body
        const validation = UpdateSellPostSchema.safeParse(body)
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

        // Convert expiresAt to Date if provided
        const updateData: any = { ...data }
        if (data.expiresAt) {
            updateData.expiresAt = new Date(data.expiresAt)
        }
        if (data.condition) {
            updateData.condition = data.condition as BookCondition
        }
        if (data.status) {
            updateData.status = data.status as SellPostStatus
        }

        const post = await updateSellPost(id, session.userId, updateData)

        // Log sell post update activity (non-blocking)
        logActivity({
            userId: session.userId,
            userRole: session.role as any,
            action: ActivityAction.SELL_POST_UPDATED,
            resourceType: ActivityResourceType.SELL_POST,
            resourceId: post.id,
            resourceName: post.title,
            description: `Updated sell post "${post.title}"`,
            metadata: {
                updatedFields: Object.keys(updateData),
                price: updateData.price,
                status: updateData.status,
            },
            endpoint: '/api/user/sell-posts/[id]',
        }).catch(console.error)

        revalidatePath('/marketplace/my-posts')
        revalidatePath(`/marketplace/${id}`)

        return NextResponse.json({
            success: true,
            data: post,
            message: 'Sell post updated successfully',
        })
    } catch (error: any) {
        console.error('Update sell post error:', error)

        if (error.message === 'Sell post not found') {
            return NextResponse.json(
                { success: false, message: 'Sell post not found' },
                { status: 404 }
            )
        }

        if (error.message === 'You do not have permission to update this post') {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 403 }
            )
        }

        return NextResponse.json(
            { success: false, message: 'Failed to update sell post' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/user/sell-posts/[id]
 * Delete (hide) a sell post
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

        // Get post details before deleting for logging
        const post = await getSellPostById(id)
        await deleteSellPost(id, session.userId)

        // Log sell post deletion activity (non-blocking)
        if (post) {
            logActivity({
                userId: session.userId,
                userRole: session.role as any,
                action: ActivityAction.SELL_POST_DELETED,
                resourceType: ActivityResourceType.SELL_POST,
                resourceId: id,
                resourceName: post.title,
                description: `Deleted sell post "${post.title}"`,
                metadata: {
                    price: post.price,
                    status: post.status,
                    condition: post.condition,
                },
                endpoint: '/api/user/sell-posts/[id]',
            }).catch(console.error)
        }

        revalidatePath('/marketplace/my-posts')
        revalidatePath('/marketplace')

        return NextResponse.json({
            success: true,
            message: 'Sell post deleted successfully',
        })
    } catch (error: any) {
        console.error('Delete sell post error:', error)

        if (error.message === 'Sell post not found') {
            return NextResponse.json(
                { success: false, message: 'Sell post not found' },
                { status: 404 }
            )
        }

        if (error.message === 'You do not have permission to delete this post') {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 403 }
            )
        }

        return NextResponse.json(
            { success: false, message: 'Failed to delete sell post' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/user/sell-posts/[id]/mark-sold
 * Mark a sell post as sold
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
        const action = body.action

        if (action === 'mark_sold') {
            // Get post details before marking as sold for logging
            const post = await getSellPostById(id)
            await markSellPostAsSold(id, session.userId)

            // Log sell post marked as sold activity (non-blocking)
            if (post) {
                logActivity({
                    userId: session.userId,
                    userRole: session.role as any,
                    action: ActivityAction.SELL_POST_UPDATED,
                    resourceType: ActivityResourceType.SELL_POST,
                    resourceId: id,
                    resourceName: post.title,
                    description: `Marked "${post.title}" as sold`,
                    metadata: {
                        price: post.price,
                        condition: post.condition,
                        newStatus: 'SOLD',
                    },
                    endpoint: '/api/user/sell-posts/[id]',
                }).catch(console.error)
            }

            revalidatePath('/marketplace/my-posts')
            revalidatePath('/marketplace')

            return NextResponse.json({
                success: true,
                message: 'Sell post marked as sold',
            })
        }

        return NextResponse.json(
            { success: false, message: 'Invalid action' },
            { status: 400 }
        )
    } catch (error: any) {
        console.error('Mark sell post sold error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to update sell post' },
            { status: 500 }
        )
    }
}
