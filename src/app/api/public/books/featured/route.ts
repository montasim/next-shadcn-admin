/**
 * Featured Books API Route
 *
 * Returns featured books for the homepage
 * Books must be marked as both public and featured
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'
import { BookType } from '@prisma/client'

// ============================================================================
// REQUEST VALIDATION & CONFIGURATION
// ============================================================================

const FeaturedBooksQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(50).default(6),
    sortBy: z.enum(['createdAt', 'title', 'readersCount']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform book data for featured books API response
 */
function transformBookData(book: any, userHasPremium: boolean, userId?: string) {
    const canAccess = !book.requiresPremium || userHasPremium

    return {
        id: book.id,
        name: book.name,
        summary: book.summary,
        type: book.type,
        bindingType: book.bindingType,
        pageNumber: book.pageNumber,
        sellingPrice: book.sellingPrice,
        purchaseDate: book.purchaseDate,
        entryDate: book.entryDate,
        image: book.image,
        requiresPremium: book.requiresPremium,
        canAccess,
        // Include file URL only if user has access
        fileUrl: canAccess ? book.fileUrl : null,
        // User's reading progress (if authenticated)
        progress: book.readingProgress && book.readingProgress.length > 0 ? {
            currentPage: book.readingProgress[0].currentPage,
            progress: book.readingProgress[0].progress,
            isCompleted: book.readingProgress[0].progress >= 95,
            lastReadAt: book.readingProgress[0].lastReadAt,
        } : undefined,
        // Relationships
        authors: book.authors.map((ba: any) => ({
            id: ba.author.id,
            name: ba.author.name,
            image: ba.author.image,
        })),
        categories: book.categories.map((bc: any) => ({
            id: bc.category.id,
            name: bc.category.name,
            image: bc.category.image,
        })),
        publications: book.publications.map((bp: any) => ({
            id: bp.publication.id,
            name: bp.publication.name,
            image: bp.publication.image,
        })),
        // Statistics
        readersCount: book._count.readingProgress,
        // Uploader info (only if role is USER)
        entryBy: book.entryBy && book.entryBy.role === 'USER' ? {
            id: book.entryBy.id,
            username: book.entryBy.username,
            firstName: book.entryBy.firstName,
            lastName: book.entryBy.lastName,
            name: book.entryBy.name,
            avatar: book.entryBy.avatar,
        } : null,
    }
}

/**
 * Build sort conditions for featured books query
 */
function buildSortConditions(sortBy: string, sortOrder: string): any {
    switch (sortBy) {
        case 'title':
            return { name: sortOrder as 'asc' | 'desc' }
        case 'createdAt':
            return { createdAt: sortOrder as 'asc' | 'desc' }
        case 'readersCount':
            return { readingProgress: { _count: sortOrder as 'asc' | 'desc' } }
        default:
            return { createdAt: 'desc' as const }
    }
}

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * GET /api/public/books/featured
 *
 * Get featured books for homepage
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())

        // Validate query parameters
        const validatedQuery = FeaturedBooksQuerySchema.parse(queryParams)

        // Check user authentication and premium status
        const userSession = await getSession()
        const userId = userSession?.userId
        const userHasPremium = userSession ? (userSession.role === 'USER' ? false : userSession.role === 'ADMIN' ? true : false) : false

        const { limit, sortBy, sortOrder } = validatedQuery

        // Build sort conditions
        const orderBy = buildSortConditions(sortBy, sortOrder)

        // Build readingProgress include based on authentication
        const readingProgressInclude = userId ? {
            where: {
                userId: userId
            },
            select: {
                currentPage: true,
                progress: true,
                lastReadAt: true,
            }
        } : false

        // Fetch featured books (must be both public AND featured, excluding hard copy books)
        const books = await prisma.book.findMany({
            where: {
                isPublic: true,
                featured: true,
                type: { in: [BookType.EBOOK, BookType.AUDIO] },
            },
            include: {
                authors: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            }
                        }
                    }
                },
                categories: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            }
                        }
                    }
                },
                publications: {
                    include: {
                        publication: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            }
                        }
                    }
                },
                readingProgress: readingProgressInclude,
                entryBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        name: true,
                        avatar: true,
                        role: true,
                    }
                },
                _count: {
                    select: {
                        readingProgress: true,
                    }
                }
            },
            take: limit,
            orderBy,
        })

        // Transform books data
        const transformedBooks = books.map(book => transformBookData(book, userHasPremium, userId))

        // Return response
        return NextResponse.json({
            success: true,
            data: {
                books: transformedBooks,
                count: transformedBooks.length,
            },
            userAccess: {
                isAuthenticated: !!userSession,
                hasPremium: userHasPremium,
            },
            message: transformedBooks.length > 0
                ? 'Featured books retrieved successfully'
                : 'No featured books available'
        })

    } catch (error) {
        console.error('Get featured books error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: 'Invalid query parameters',
                message: error.errors[0]?.message
            }, { status: 400 })
        }

        return NextResponse.json({
            success: false,
            error: 'Failed to retrieve featured books',
            message: 'An error occurred while fetching featured books'
        }, { status: 500 })
    }
}
