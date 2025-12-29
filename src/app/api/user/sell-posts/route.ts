'use server'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import {
    getUserSellPosts,
    createSellPost,
    type CreateSellPostData,
} from '@/lib/marketplace/repositories'
import { BookCondition } from '@prisma/client'
import { logActivity } from '@/lib/activity/logger'
import { ActivityAction, ActivityResourceType } from '@prisma/client'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateSellPostSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().optional(),
    price: z.coerce.number().positive('Price must be greater than 0'),
    negotiable: z.coerce.boolean().default(true),
    condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']),
    images: z.array(z.string()).min(1, 'At least one image is required'),
    directImageUrls: z.any().optional(),
    bookId: z.string().optional(),
    location: z.string().optional(),
    city: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
})

const SellPostsQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(['AVAILABLE', 'PENDING', 'SOLD', 'EXPIRED', 'HIDDEN']).optional(),
})

/**
 * GET /api/user/sell-posts
 * Get current user's sell posts
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
        const validation = SellPostsQuerySchema.safeParse(Object.fromEntries(searchParams))

        if (!validation.success) {
            return NextResponse.json(
                { success: false, message: validation.error.errors[0]?.message },
                { status: 400 }
            )
        }

        const result = await getUserSellPosts(session.userId, validation.data)

        return NextResponse.json({
            success: true,
            data: {
                posts: result.posts,
                pagination: {
                    currentPage: result.currentPage,
                    totalPages: result.totalPages,
                    totalItems: result.total,
                    limit: validation.data.limit,
                },
            },
            message: 'Your sell posts retrieved successfully',
        })
    } catch (error: any) {
        console.error('Get user sell posts error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch sell posts' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/user/sell-posts
 * Create a new sell post
 */
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth()
        if (!session) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            )
        }

        const body = await request.json()

        // Validate request body
        const validation = CreateSellPostSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: validation.error.errors[0]?.message || 'Invalid input',
                    errors: validation.error.errors,
                },
                { status: 400 }
            )
        }

        const data = validation.data

        // Prepare sell post data
        const sellPostData: CreateSellPostData = {
            title: data.title,
            description: data.description,
            price: data.price,
            negotiable: data.negotiable,
            condition: data.condition as BookCondition,
            images: data.images,
            directImageUrls: data.directImageUrls,
            bookId: data.bookId,
            sellerId: session.userId,
            location: data.location,
            city: data.city,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        }

        const post = await createSellPost(sellPostData)

        // Log sell post creation activity (non-blocking)
        logActivity({
            userId: session.userId,
            userRole: session.role as any,
            action: ActivityAction.SELL_POST_CREATED,
            resourceType: ActivityResourceType.SELL_POST,
            resourceId: post.id,
            resourceName: data.title,
            description: `Created sell post "${data.title}"`,
            metadata: {
                price: data.price,
                condition: data.condition,
                bookId: data.bookId,
            },
            endpoint: '/api/user/sell-posts',
        }).catch(console.error)

        revalidatePath('/marketplace/my-posts')
        revalidatePath('/marketplace')

        return NextResponse.json({
            success: true,
            data: post,
            message: 'Sell post created successfully',
        }, { status: 201 })
    } catch (error: any) {
        console.error('Create sell post error:', error)

        // Handle specific errors
        if (error.message === 'Sell post not found') {
            return NextResponse.json(
                { success: false, message: 'Referenced book not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create sell post' },
            { status: 500 }
        )
    }
}
