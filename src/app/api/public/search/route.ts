/**
 * Public Search API Route
 *
 * Global search across books-old, authors, and categories
 * Provides intelligent search results with ranking
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'

// ============================================================================
// REQUEST VALIDATION & CONFIGURATION
// ============================================================================

const SearchQuerySchema = z.object({
    q: z.string().min(1, 'Search query is required').max(100),
    type: z.enum(['all', 'books', 'authors', 'categories']).default('all'),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    premium: z.enum(['all', 'free', 'premium']).default('all'),
})

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * GET /api/public/search
 *
 * Global search across books-old, authors, and categories
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())

        // Validate query parameters
        const validatedQuery = SearchQuerySchema.parse(queryParams)

        const { q, type, page, limit, premium } = validatedQuery
        const skip = (page - 1) * limit

        // Check user authentication and premium status
        const userSession = await getSession()
        const userHasPremium = userSession ? (userSession.role === 'USER' ? false : userSession.role === 'ADMIN' ? true : false) : false

        // Build search conditions
        const searchConditions = {
            contains: q,
            mode: 'insensitive' as const
        }

        // Build premium filter
        const premiumFilter = premium === 'all'
            ? userHasPremium
                ? {}
                : { requiresPremium: false }
            : premium === 'free'
                ? { requiresPremium: false }
                : { requiresPremium: true }

        const results: any = {
            books: [],
            authors: [],
            categories: [],
            total: {
                books: 0,
                authors: 0,
                categories: 0,
                all: 0
            }
        }

        // Search books-old
        if (type === 'all' || type === 'books') {
            const where: any = {
                isPublic: true,
                ...premiumFilter,
                OR: [
                    { name: searchConditions },
                    { summary: searchConditions },
                    {
                        authors: {
                            some: {
                                author: {
                                    name: searchConditions
                                }
                            }
                        }
                    },
                    {
                        categories: {
                            some: {
                                category: {
                                    name: searchConditions
                                }
                            }
                        }
                    }
                ]
            }

            const [books, booksCount] = await Promise.all([
                prisma.book.findMany({
                    where,
                    include: {
                        authors: {
                            include: {
                                author: {
                                    select: {
                                        id: true,
                                        name: true,
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
                                    }
                                }
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
                    orderBy: [
                        { _count: { readingProgress: 'desc' } },
                        { name: 'asc' }
                    ],
                }),
                prisma.book.count({ where })
            ])

            results.books = books.map(book => ({
                id: book.id,
                name: book.name,
                summary: book.summary,
                type: book.type,
                image: book.image,
                requiresPremium: book.requiresPremium,
                canAccess: !book.requiresPremium || userHasPremium,
                authors: book.authors.map(ba => ba.author.name),
                categories: book.categories.map(bc => bc.category.name),
                readersCount: book._count.readingProgress,
            }))

            results.total.books = booksCount
        }

        // Search authors
        if (type === 'all' || type === 'authors') {
            const where: any = {
                OR: [
                    { name: searchConditions },
                    { description: searchConditions }
                ],
                books: {
                    some: {
                        book: {
                            isPublic: true,
                            ...premiumFilter
                        }
                    }
                }
            }

            const [authors, authorsCount] = await Promise.all([
                prisma.author.findMany({
                    where,
                    include: {
                        _count: {
                            select: {
                                books: {
                                    where: {
                                        book: {
                                            isPublic: true,
                                            ...premiumFilter
                                        }
                                    }
                                }
                            }
                        }
                    },
                    skip: type === 'authors' ? skip : 0,
                    take: type === 'authors' ? limit : 10,
                    orderBy: [
                        { _count: { books: 'desc' } },
                        { name: 'asc' }
                    ],
                }),
                prisma.author.count({ where })
            ])

            results.authors = authors.map(author => ({
                id: author.id,
                name: author.name,
                description: author.description,
                image: author.image,
                bookCount: author._count.books,
            }))

            results.total.authors = authorsCount
        }

        // Search categories
        if (type === 'all' || type === 'categories') {
            const where: any = {
                OR: [
                    { name: searchConditions },
                    { description: searchConditions }
                ],
                books: {
                    some: {
                        book: {
                            isPublic: true,
                            ...premiumFilter
                        }
                    }
                }
            }

            const [categories, categoriesCount] = await Promise.all([
                prisma.category.findMany({
                    where,
                    include: {
                        _count: {
                            select: {
                                books: {
                                    where: {
                                        book: {
                                            isPublic: true,
                                            ...premiumFilter
                                        }
                                    }
                                }
                            }
                        }
                    },
                    skip: type === 'categories' ? skip : 0,
                    take: type === 'categories' ? limit : 10,
                    orderBy: [
                        { _count: { books: 'desc' } },
                        { name: 'asc' }
                    ],
                }),
                prisma.category.count({ where })
            ])

            results.categories = categories.map(category => ({
                id: category.id,
                name: category.name,
                description: category.description,
                image: category.image,
                bookCount: category._count.books,
            }))

            results.total.categories = categoriesCount
        }

        // Calculate total
        results.total.all = results.total.books + results.total.authors + results.total.categories

        // Return response
        return NextResponse.json({
            success: true,
            data: {
                query: q,
                type,
                results,
                pagination: {
                    currentPage: page,
                    limit,
                    totalResults: type === 'all' ? results.total.all : results.total[type as keyof typeof results.total],
                },
                userAccess: {
                    isAuthenticated: !!userSession,
                    hasPremium: userHasPremium,
                }
            },
            message: 'Search completed successfully'
        })

    } catch (error) {
        console.error('Search error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: 'Invalid search parameters',
                message: error.errors[0]?.message
            }, { status: 400 })
        }

        return NextResponse.json({
            success: false,
            error: 'Search failed',
            message: 'An error occurred while performing search'
        }, { status: 500 })
    }
}

/**
 * POST /api/public/search/suggestions
 *
 * Get search suggestions based on partial query
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { query, limit = 10 } = body

        if (!query || typeof query !== 'string' || query.length < 2) {
            return NextResponse.json({
                success: false,
                error: 'Invalid query',
                message: 'Query must be at least 2 characters long'
            }, { status: 400 })
        }

        const userSession = await getSession()
        const userHasPremium = userSession ? (userSession.role === 'USER' ? false : userSession.role === 'ADMIN' ? true : false) : false

        const searchConditions = {
            contains: query,
            mode: 'insensitive' as const
        }

        const [bookSuggestions, authorSuggestions, categorySuggestions] = await Promise.all([
            prisma.book.findMany({
                where: {
                    isPublic: true,
                    requiresPremium: userHasPremium ? undefined : false,
                    name: searchConditions
                },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    image: true,
                },
                take: Math.ceil(limit / 2),
                orderBy: { _count: { readingProgress: 'desc' } }
            }),
            prisma.author.findMany({
                where: {
                    name: searchConditions,
                    books: {
                        some: {
                            book: {
                                isPublic: true,
                                requiresPremium: userHasPremium ? undefined : false
                            }
                        }
                    }
                },
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
                take: Math.ceil(limit / 4),
                orderBy: {
                    books: {
                        _count: 'desc'
                    }
                }
            }),
            prisma.category.findMany({
                where: {
                    name: searchConditions,
                    books: {
                        some: {
                            book: {
                                isPublic: true,
                                requiresPremium: userHasPremium ? undefined : false
                            }
                        }
                    }
                },
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
                take: Math.ceil(limit / 4),
                orderBy: {
                    books: {
                        _count: 'desc'
                    }
                }
            })
        ])

        const suggestions = [
            ...bookSuggestions.map(book => ({
                id: book.id,
                text: book.name,
                type: 'book',
                image: book.image,
                subtitle: book.type,
            })),
            ...authorSuggestions.map(author => ({
                id: author.id,
                text: author.name,
                type: 'author',
                image: author.image,
                subtitle: 'Author',
            })),
            ...categorySuggestions.map(category => ({
                id: category.id,
                text: category.name,
                type: 'category',
                image: category.image,
                subtitle: 'Category',
            }))
        ].slice(0, limit)

        return NextResponse.json({
            success: true,
            data: {
                suggestions,
                query,
            },
            message: 'Suggestions retrieved successfully'
        })

    } catch (error) {
        console.error('Search suggestions error:', error)

        return NextResponse.json({
            success: false,
            error: 'Failed to get suggestions',
            message: 'An error occurred while fetching search suggestions'
        }, { status: 500 })
    }
}