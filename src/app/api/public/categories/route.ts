/**
 * Public Categories API Route
 *
 * Provides public access to categories information
 * Only returns categories that have at least one public book
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// ============================================================================
// REQUEST VALIDATION & CONFIGURATION
// ============================================================================

const CategoriesQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'bookCount', 'entryDate']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    minBooks: z.coerce.number().min(0).default(1),
})

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * GET /api/public/categories
 *
 * Get public categories with pagination and search
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())

        // Validate query parameters
        const validatedQuery = CategoriesQuerySchema.parse(queryParams)

        const {
            page,
            limit,
            search,
            sortBy,
            sortOrder,
            minBooks
        } = validatedQuery

        const skip = (page - 1) * limit

        // Build filter conditions
        const where: any = {
            books: {
                some: {
                    book: {
                        isPublic: true
                    }
                }
            }
        }

        // Search functionality
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ]
        }

        // Build sort conditions
        let orderBy: any
        switch (sortBy) {
            case 'name':
                orderBy = { name: sortOrder }
                break
            case 'bookCount':
                orderBy = { books: { _count: sortOrder } }
                break
            case 'entryDate':
                orderBy = { entryDate: sortOrder }
                break
            default:
                orderBy = { name: sortOrder }
        }

        // Execute queries in parallel
        const [categories, total] = await Promise.all([
            prisma.category.findMany({
                where,
                include: {
                    books: {
                        where: {
                            book: {
                                isPublic: true
                            }
                        },
                        include: {
                            book: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true,
                                    type: true,
                                    requiresPremium: true,
                                    _count: {
                                        select: {
                                            readingProgress: true,
                                        }
                                    }
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            books: {
                                where: {
                                    book: {
                                        isPublic: true
                                    }
                                }
                            }
                        }
                    }
                },
                skip,
                take: limit,
                orderBy,
            }),
            prisma.category.count({ where })
        ])

        // Filter categories by minimum book count
        const filteredCategories = categories.filter(category => category._count.books >= minBooks)

        // Transform categories data
        const transformedCategories = filteredCategories.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description,
            image: category.image,
            entryDate: category.entryDate,
            bookCount: category._count.books,
            books: category.books
                .map(bc => bc.book)
                .sort((a, b) => b._count.readingProgress - a._count.readingProgress) // Sort by popularity
                .slice(0, 6) // Limit to 6 most popular books-old
                .map(book => ({
                    id: book.id,
                    name: book.name,
                    type: book.type,
                    image: book.image,
                    requiresPremium: book.requiresPremium,
                    readersCount: book._count.readingProgress,
                }))
        }))

        // Calculate pagination info
        const totalPages = Math.ceil(total / limit)
        const hasNextPage = page < totalPages
        const hasPreviousPage = page > 1

        // Return response
        return NextResponse.json({
            success: true,
            data: {
                categories: transformedCategories,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCategories: total,
                    limit,
                    hasNextPage,
                    hasPreviousPage,
                },
                filters: {
                    search: validatedQuery.search || null,
                    minBooks: validatedQuery.minBooks,
                }
            },
            message: 'Categories retrieved successfully'
        })

    } catch (error) {
        console.error('Get categories error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: 'Invalid query parameters',
                message: error.errors[0]?.message
            }, { status: 400 })
        }

        return NextResponse.json({
            success: false,
            error: 'Failed to retrieve categories',
            message: 'An error occurred while fetching categories'
        }, { status: 500 })
    }
}