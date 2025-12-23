/**
 * Public Book Detail API Route
 *
 * Provides detailed information about a specific book
 * Includes access control and reading progress for authenticated users
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'
import { BookType } from '@prisma/client'

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * GET /api/public/books-old/[id]
 *
 * Get detailed information about a specific book
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: bookId } = await params

        // Validate book ID
        if (!bookId || typeof bookId !== 'string') {
            return NextResponse.json({
                success: false,
                error: 'Invalid book ID',
                message: 'Book ID is required and must be valid'
            }, { status: 400 })
        }

        // Check user authentication and premium status
        const userSession = await getSession()
        const userHasPremium = userSession ? (userSession.role === 'USER' ? false : userSession.role === 'ADMIN' ? true : false) : false
        const isAuthenticated = !!userSession

        // Find the book
        const book = await prisma.book.findUnique({
            where: { id: bookId },
            include: {
                authors: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
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
                                description: true,
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
                                description: true,
                                image: true,
                            }
                        }
                    }
                },
                readingProgress: userSession ? {
                    where: {
                        userId: userSession.userId,
                    },
                    select: {
                        id: true,
                        currentPage: true,
                        currentEpocha: true,
                        progress: true,
                        isCompleted: true,
                        lastReadAt: true,
                    }
                } : false,
                _count: {
                    select: {
                        readingProgress: true,
                    }
                }
            }
        })

        if (!book) {
            return NextResponse.json({
                success: false,
                error: 'Book not found',
                message: 'The requested book does not exist'
            }, { status: 404 })
        }

        // Check if book is public
        if (!book.isPublic) {
            return NextResponse.json({
                success: false,
                error: 'Access denied',
                message: 'This book is not publicly available'
            }, { status: 403 })
        }

        // Check premium access
        const requiresPremium = book.requiresPremium
        const canAccess = !requiresPremium || userHasPremium

        if (!canAccess) {
            return NextResponse.json({
                success: false,
                error: 'Premium required',
                message: 'This book requires a premium subscription to access',
                requiresPremium: true
            }, { status: 403 })
        }

        // Get related books-old (same category or author)
        const relatedBooksQuery = {
            where: {
                id: { not: bookId },
                isPublic: true,
                requiresPremium: userHasPremium ? undefined : false,
                OR: [
                    {
                        categories: {
                            some: {
                                categoryId: {
                                    in: book.categories.map(bc => bc.categoryId)
                                }
                            }
                        }
                    },
                    {
                        authors: {
                            some: {
                                authorId: {
                                    in: book.authors.map(ba => ba.authorId)
                                }
                            }
                        }
                    }
                ]
            },
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
                }
            },
            take: 6,
            orderBy: {
                readingProgress: {
                    _count: 'desc'
                }
            }
        }

        const relatedBooks = await prisma.book.findMany(relatedBooksQuery)

        // Transform book data
        const transformedBook = {
            id: book.id,
            name: book.name,
            summary: book.summary,
            type: book.type,
            bindingType: book.bindingType,
            pageNumber: book.pageNumber,
            buyingPrice: book.buyingPrice,
            sellingPrice: book.sellingPrice,
            numberOfCopies: book.numberOfCopies,
            purchaseDate: book.purchaseDate,
            entryDate: book.entryDate,
            image: book.image,
            requiresPremium: book.requiresPremium,
            canAccess,
            // Include file URL only if user has access
            fileUrl: canAccess ? book.fileUrl : null,
            // Relationships
            authors: book.authors.map(ba => ({
                id: ba.author.id,
                name: ba.author.name,
                description: ba.author.description,
                image: ba.author.image,
            })),
            categories: book.categories.map(bc => ({
                id: bc.category.id,
                name: bc.category.name,
                description: bc.category.description,
                image: bc.category.image,
            })),
            publications: book.publications.map(bp => ({
                id: bp.publication.id,
                name: bp.publication.name,
                description: bp.publication.description,
                image: bp.publication.image,
            })),
            // Reading progress (only if authenticated)
            readingProgress: isAuthenticated && book.readingProgress.length > 0
                ? {
                    id: book.readingProgress[0].id,
                    currentPage: book.readingProgress[0].currentPage,
                    currentEpocha: book.readingProgress[0].currentEpocha,
                    progress: book.readingProgress[0].progress,
                    isCompleted: book.readingProgress[0].isCompleted,
                    lastReadAt: book.readingProgress[0].lastReadAt,
                }
                : null,
            // Statistics
            statistics: {
                totalReaders: book._count.readingProgress,
                avgProgress: 0, // Could be calculated if needed
            },
            // Related books-old
            relatedBooks: relatedBooks.map(relatedBook => ({
                id: relatedBook.id,
                name: relatedBook.name,
                type: relatedBook.type,
                image: relatedBook.image,
                requiresPremium: relatedBook.requiresPremium,
                authors: relatedBook.authors.map(ra => ({
                    id: ra.author.id,
                    name: ra.author.name,
                })),
                categories: relatedBook.categories.map(rc => ({
                    id: rc.category.id,
                    name: rc.category.name,
                })),
            }))
        }

        // Return response
        return NextResponse.json({
            success: true,
            data: {
                book: transformedBook,
                userAccess: {
                    isAuthenticated,
                    hasPremium: userHasPremium,
                    canAccess,
                    canRead: canAccess && (
                        book.type === BookType.EBOOK ||
                        book.type === BookType.AUDIO ||
                        (book.type === BookType.HARD_COPY && book.numberOfCopies && book.numberOfCopies > 0)
                    ),
                }
            },
            message: 'Book details retrieved successfully'
        })

    } catch (error) {
        console.error('Get book details error:', error)

        return NextResponse.json({
            success: false,
            error: 'Failed to retrieve book details',
            message: 'An error occurred while fetching book information'
        }, { status: 500 })
    }
}

/**
 * POST /api/public/books-old/[id]/progress
 *
 * Update reading progress for a book (requires authentication)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: bookId } = await params

        // Require authentication
        const userSession = await getSession()
        if (!userSession) {
            return NextResponse.json({
                success: false,
                error: 'Authentication required',
                message: 'You must be logged in to update reading progress'
            }, { status: 401 })
        }

        const body = await request.json()
        const { currentPage, currentEpocha, progress, isCompleted } = body

        // Validate book access
        const book = await prisma.book.findUnique({
            where: { id: bookId },
            select: {
                id: true,
                isPublic: true,
                requiresPremium: true,
                pageNumber: true,
                type: true,
            }
        })

        if (!book || !book.isPublic) {
            return NextResponse.json({
                success: false,
                error: 'Book not found',
                message: 'The requested book does not exist'
            }, { status: 404 })
        }

        const userHasPremium = userSession ? (userSession.role === 'USER' ? false : userSession.role === 'ADMIN' ? true : false) : false
        const canAccess = !book.requiresPremium || userHasPremium

        if (!canAccess) {
            return NextResponse.json({
                success: false,
                error: 'Premium required',
                message: 'This book requires a premium subscription to access'
            }, { status: 403 })
        }

        // Update reading progress
        const { upsertReadingProgress } = await import('@/lib/user/repositories/reading-progress.repository')
        const readingProgress = await upsertReadingProgress({
            userId: userSession.userId,
            bookId,
            currentPage,
            currentEpocha,
            progress,
            isCompleted,
        })

        return NextResponse.json({
            success: true,
            data: {
                progress: {
                    id: readingProgress.id,
                    currentPage: readingProgress.currentPage,
                    currentEpocha: readingProgress.currentEpocha,
                    progress: readingProgress.progress,
                    isCompleted: readingProgress.isCompleted,
                    lastReadAt: readingProgress.lastReadAt,
                }
            },
            message: 'Reading progress updated successfully'
        })

    } catch (error) {
        console.error('Update reading progress error:', error)

        return NextResponse.json({
            success: false,
            error: 'Failed to update reading progress',
            message: 'An error occurred while updating your progress'
        }, { status: 500 })
    }
}