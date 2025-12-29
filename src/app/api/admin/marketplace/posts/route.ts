'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
    getSellPosts,
    updateSellPost,
    permanentlyDeleteSellPost,
    type SellPostFilters,
    type SellPostOptions,
    type UpdateSellPostData,
} from '@/lib/marketplace/repositories'
import { SellPostStatus } from '@prisma/client'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AdminQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(50),
    sortBy: z.enum(['createdAt', 'price', 'updatedAt', 'views']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    status: z.enum(['AVAILABLE', 'PENDING', 'SOLD', 'EXPIRED', 'HIDDEN']).optional(),
    search: z.string().optional(),
    sellerId: z.string().optional(),
})

const UpdateSellPostSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().optional(),
    price: z.coerce.number().positive().optional(),
    status: z.enum(['AVAILABLE', 'PENDING', 'SOLD', 'EXPIRED', 'HIDDEN']).optional(),
})

/**
 * GET /api/admin/marketplace/posts
 * View all sell posts (admin)
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
        const validation = AdminQuerySchema.safeParse(Object.fromEntries(searchParams))

        if (!validation.success) {
            return NextResponse.json(
                { success: false, message: 'Invalid query parameters' },
                { status: 400 }
            )
        }

        const params = validation.data

        const filters: SellPostFilters = {}
        if (params.status) filters.status = params.status as SellPostStatus
        if (params.sellerId) filters.sellerId = params.sellerId
        if (params.search) filters.search = params.search

        const options: SellPostOptions = {
            page: params.page,
            limit: params.limit,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder,
        }

        const result = await getSellPosts(filters, options)

        return NextResponse.json({
            success: true,
            data: {
                posts: result.posts,
                pagination: {
                    currentPage: result.currentPage,
                    totalPages: result.totalPages,
                    totalItems: result.total,
                    limit: params.limit,
                },
            },
            message: 'Sell posts retrieved successfully',
        })
    } catch (error: any) {
        console.error('Get admin marketplace posts error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch posts' },
            { status: 500 }
        )
    }
}
