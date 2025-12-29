'use server'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
    getSellPosts,
    getAvailableSellPosts,
    type SellPostFilters,
    type SellPostOptions
} from '@/lib/marketplace/repositories'
import { BookCondition, SellPostStatus } from '@prisma/client'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const MarketplaceQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.enum(['createdAt', 'price', 'updatedAt', 'views']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    status: z.enum(['AVAILABLE', 'PENDING', 'SOLD', 'EXPIRED', 'HIDDEN']).optional(),
    condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']).optional(),
    sellerId: z.string().optional(),
    bookId: z.string().optional(),
    city: z.string().optional(),
    search: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    negotiable: z.coerce.boolean().optional(),
})

/**
 * GET /api/marketplace/posts
 * Browse all sell posts (public endpoint)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        // Validate query parameters
        const validation = MarketplaceQuerySchema.safeParse(Object.fromEntries(searchParams))
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: validation.error.errors[0]?.message || 'Invalid query parameters',
                },
                { status: 400 }
            )
        }

        const params = validation.data

        // Build filters
        const filters: SellPostFilters = {}
        if (params.status) filters.status = params.status as SellPostStatus
        if (params.condition) filters.condition = params.condition as BookCondition
        if (params.sellerId) filters.sellerId = params.sellerId
        if (params.bookId) filters.bookId = params.bookId
        if (params.city) filters.city = params.city
        if (params.search) filters.search = params.search
        if (params.minPrice !== undefined) filters.minPrice = params.minPrice
        if (params.maxPrice !== undefined) filters.maxPrice = params.maxPrice
        if (params.negotiable !== undefined) filters.negotiable = params.negotiable

        const options: SellPostOptions = {
            page: params.page,
            limit: params.limit,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder,
        }

        // If no specific status requested, get available posts
        const result = params.status
            ? await getSellPosts(filters, options)
            : await getAvailableSellPosts(filters, options)

        return NextResponse.json({
            success: true,
            data: {
                posts: result.posts,
                pagination: {
                    currentPage: result.currentPage,
                    totalPages: result.totalPages,
                    totalItems: result.total,
                    limit: params.limit,
                    hasNextPage: result.hasNextPage,
                    hasPreviousPage: result.hasPreviousPage,
                },
                filters: {
                    ...filters,
                    sortBy: params.sortBy,
                    sortOrder: params.sortOrder,
                },
            },
            message: 'Sell posts retrieved successfully',
        })
    } catch (error: any) {
        console.error('Get sell posts error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch sell posts' },
            { status: 500 }
        )
    }
}
