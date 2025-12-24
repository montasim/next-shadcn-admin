/**
 * Public Books API Route
 *
 * Provides public access to books-old catalog
 * Supports pagination, filtering, searching, and sorting
 * Only returns books-old that are marked as public
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'
import { BookType, BindingType } from '@prisma/client'

// ============================================================================
// REQUEST VALIDATION & CONFIGURATION
// ============================================================================

// Custom schema to handle array parameters that come as comma-separated strings or empty strings
const arrayFromString = (schema: z.ZodTypeAny) =>
  z.preprocess((val: any) => {
    // Handle empty strings, undefined, null
    if (!val || val === '') {
      return []
    }
    // Handle comma-separated strings
    if (typeof val === 'string') {
      return val.split(',').filter(Boolean)
    }
    // Handle arrays (shouldn't happen but just in case)
    return Array.isArray(val) ? val : [val]
  }, z.array(schema))

const BooksQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
    category: z.string().uuid().optional(),
    categories: arrayFromString(z.string().uuid()).optional(),
    author: z.string().uuid().optional(),
    publication: z.string().uuid().optional(),
    type: z.enum([BookType.HARD_COPY, BookType.EBOOK, BookType.AUDIO]).optional(),
    types: arrayFromString(z.enum([BookType.HARD_COPY, BookType.EBOOK, BookType.AUDIO])).optional(),
    bindingType: z.enum([BindingType.HARDCOVER, BindingType.PAPERBACK]).optional(),
    sortBy: z.enum(['title', 'author', 'createdAt', 'purchaseDate']).default('title'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    premium: z.enum(['all', 'free', 'premium']).default('all'),
})

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build filter conditions for books-old query
 */
function buildFilterConditions(
    validatedQuery: z.infer<typeof BooksQuerySchema>,
    userHasPremium: boolean
) {
    const {
        search,
        category,
        categories,
        author,
        publication,
        type,
        types,
        bindingType,
        minPrice,
        maxPrice,
        premium
    } = validatedQuery

    const where: any = {
        isPublic: true, // Only return public books-old
    }

    // Search functionality
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { summary: { contains: search, mode: 'insensitive' } },
            {
                authors: {
                    some: {
                        author: {
                            name: { contains: search, mode: 'insensitive' }
                        }
                    }
                }
            }
        ]
    }

    // Category filter (support both single and multiple)
    if (categories && categories.length > 0) {
        where.categories = {
            some: {
                categoryId: { in: categories }
            }
        }
    } else if (category) {
        // Backward compatibility for single category
        where.categories = {
            some: {
                categoryId: category
            }
        }
    }

    // Author filter
    if (author) {
        where.authors = {
            some: {
                authorId: author
            }
        }
    }

    // Publication filter
    if (publication) {
        where.publications = {
            some: {
                publicationId: publication
            }
        }
    }

    // Type filter (support both single and multiple)
    if (types && types.length > 0) {
        where.type = { in: types }
    } else if (type) {
        // Backward compatibility for single type
        where.type = type
    }

    // Binding type filter (only for hard copies)
    if (bindingType) {
        if (types && types.length > 0) {
            // Check if HARD_COPY is in the types array
            if (types.includes(BookType.HARD_COPY)) {
                where.bindingType = bindingType
            }
        } else if (type === BookType.HARD_COPY) {
            // Backward compatibility
            where.bindingType = bindingType
        }
    }

    // Price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
        where.sellingPrice = {}
        if (minPrice !== undefined) {
            where.sellingPrice.gte = minPrice
        }
        if (maxPrice !== undefined) {
            where.sellingPrice.lte = maxPrice
        }
    }

    // Premium access filter
    if (premium === 'free') {
        where.requiresPremium = false
    } else if (premium === 'premium') {
        where.requiresPremium = true
    }
    // If premium === 'all', no additional filtering

    // If user doesn't have premium access, exclude premium books-old
    if (!userHasPremium) {
        where.requiresPremium = false
    }

    return where
}

/**
 * Build sort conditions for books-old query
 */
function buildSortConditions(sortBy: string, sortOrder: string) {
    switch (sortBy) {
        case 'title':
            return { name: sortOrder }
        case 'author':
            return { authors: { _count: sortOrder } }
        case 'createdAt':
            return { createdAt: sortOrder }
        case 'purchaseDate':
            return { purchaseDate: sortOrder }
        default:
            return { name: sortOrder }
    }
}

/**
 * Transform book data for public API response
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

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * GET /api/public/books-old
 *
 * Get public books-old with pagination, filtering, and search
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())

        // Validate query parameters
        const validatedQuery = BooksQuerySchema.parse(queryParams)

        // Check user authentication and premium status
        const userSession = await getSession()
        const userId = userSession?.userId
        const userHasPremium = userSession ? (userSession.role === 'USER' ? false : userSession.role === 'ADMIN' ? true : false) : false

        const {
            page,
            limit,
            sortBy,
            sortOrder,
        } = validatedQuery

        const skip = (page - 1) * limit

        // Build filter and sort conditions
        const where = buildFilterConditions(validatedQuery, userHasPremium)
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

        // Execute queries in parallel
        const [books, total] = await Promise.all([
            prisma.book.findMany({
                where,
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
                skip,
                take: limit,
                orderBy,
            }),
            prisma.book.count({ where })
        ])

        // Transform books data
        const transformedBooks = books.map(book => transformBookData(book, userHasPremium, userId))

        // Calculate pagination info
        const totalPages = Math.ceil(total / limit)
        const hasNextPage = page < totalPages
        const hasPreviousPage = page > 1

        // Return response
        return NextResponse.json({
            success: true,
            data: {
                books: transformedBooks,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalBooks: total,
                    limit,
                    hasNextPage,
                    hasPreviousPage,
                },
                filters: {
                    search: validatedQuery.search || null,
                    category: validatedQuery.category || null,
                    categories: validatedQuery.categories || null,
                    author: validatedQuery.author || null,
                    publication: validatedQuery.publication || null,
                    type: validatedQuery.type || null,
                    types: validatedQuery.types || null,
                    bindingType: validatedQuery.bindingType || null,
                    minPrice: validatedQuery.minPrice || null,
                    maxPrice: validatedQuery.maxPrice || null,
                    premium: validatedQuery.premium,
                },
                userAccess: {
                    isAuthenticated: !!userSession,
                    hasPremium: userHasPremium,
                }
            },
            message: 'Books retrieved successfully'
        })

    } catch (error) {
        console.error('Get books-old error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: 'Invalid query parameters',
                message: error.errors[0]?.message
            }, { status: 400 })
        }

        return NextResponse.json({
            success: false,
            error: 'Failed to retrieve books-old',
            message: 'An error occurred while fetching books-old'
        }, { status: 500 })
    }
}

/**
 * POST /api/public/books-old (Future: Book recommendations)
 *
 * Could be used for book recommendations, AI-powered suggestions, etc.
 */
export async function POST(request: NextRequest) {
    return NextResponse.json({
        success: false,
        error: 'Not implemented',
        message: 'This endpoint is not yet implemented'
    }, { status: 501 })
}