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
                entryBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        name: true,
                        avatar: true,
                        bio: true,
                        role: true,
                        createdAt: true,
                    }
                },
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
                series: {
                    include: {
                        series: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                image: true,
                            }
                        }
                    },
                    orderBy: {
                        order: 'asc'
                    }
                },
                questions: {
                    select: {
                        id: true,
                        question: true,
                        answer: true,
                        order: true,
                        isAIGenerated: true,
                    },
                    orderBy: { order: 'asc' },
                    where: { isAIGenerated: true },
                    take: 10,
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

        // Get view statistics for analytics
        const viewStats = await prisma.bookView.count({
            where: { bookId }
        })

        // Fetch series neighbors (previous/next books) for each series
        const seriesNeighbors = await Promise.all(
            book.series.map(async (bookSeries) => {
                // Get current book's order in this series
                const currentOrder = bookSeries.order

                // Find previous book (closest order less than current)
                const previous = await prisma.bookSeries.findFirst({
                    where: {
                        seriesId: bookSeries.seriesId,
                        order: {
                            lt: currentOrder
                        }
                    },
                    include: {
                        book: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                type: true,
                                requiresPremium: true
                            }
                        }
                    },
                    orderBy: {
                        order: 'desc'
                    }
                })

                // Find next book (closest order greater than current)
                const next = await prisma.bookSeries.findFirst({
                    where: {
                        seriesId: bookSeries.seriesId,
                        order: {
                            gt: currentOrder
                        }
                    },
                    include: {
                        book: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                type: true,
                                requiresPremium: true
                            }
                        }
                    },
                    orderBy: {
                        order: 'asc'
                    }
                })

                return {
                    seriesId: bookSeries.series.id,
                    seriesName: bookSeries.series.name,
                    seriesDescription: bookSeries.series.description,
                    seriesImage: bookSeries.series.image,
                    order: bookSeries.order,
                    previousBook: previous?.book || null,
                    nextBook: next?.book || null,
                    // Get total books in this series
                    totalBooks: await prisma.bookSeries.count({
                        where: { seriesId: bookSeries.seriesId }
                    })
                }
            })
        )

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

        // Check premium access - don't block, just set canAccess flag
        const requiresPremium = book.requiresPremium
        const canAccess = !requiresPremium || userHasPremium

        // Get related books with enhanced algorithm
        // Priority: Author > Publication > Category
        const currentBookAuthorIds = book.authors.map(ba => ba.authorId)
        const currentBookPublicationIds = book.publications.map(bp => bp.publicationId)
        const currentBookCategoryIds = book.categories.map(bc => bc.categoryId)

        // Fetch books by author (highest priority)
        const authorMatches = await prisma.book.findMany({
            where: {
                id: { not: bookId },
                isPublic: true,
                // Show ALL books (both free and premium) - premium books will have lock overlay
                authors: {
                    some: {
                        authorId: { in: currentBookAuthorIds }
                    }
                }
            },
            include: {
                authors: {
                    include: {
                        author: {
                            select: { id: true, name: true }
                        }
                    }
                },
                categories: {
                    include: {
                        category: {
                            select: { id: true, name: true }
                        }
                    }
                },
                publications: {
                    include: {
                        publication: {
                            select: { id: true, name: true }
                        }
                    }
                },
                _count: {
                    select: { readingProgress: true }
                }
            },
            take: 10
        })

        // Fetch books by publication (medium priority)
        const publicationMatches = await prisma.book.findMany({
            where: {
                id: {
                    not: bookId,
                    notIn: authorMatches.map(b => b.id)
                },
                isPublic: true,
                // Show ALL books (both free and premium) - premium books will have lock overlay
                publications: {
                    some: {
                        publicationId: { in: currentBookPublicationIds }
                    }
                }
            },
            include: {
                authors: {
                    include: {
                        author: {
                            select: { id: true, name: true }
                        }
                    }
                },
                categories: {
                    include: {
                        category: {
                            select: { id: true, name: true }
                        }
                    }
                },
                publications: {
                    include: {
                        publication: {
                            select: { id: true, name: true }
                        }
                    }
                },
                _count: {
                    select: { readingProgress: true }
                }
            },
            take: 10
        })

        // Fetch books by category (lower priority)
        const categoryMatches = await prisma.book.findMany({
            where: {
                id: {
                    not: bookId,
                    notIn: [...authorMatches.map(b => b.id), ...publicationMatches.map(b => b.id)]
                },
                isPublic: true,
                // Show ALL books (both free and premium) - premium books will have lock overlay
                categories: {
                    some: {
                        categoryId: { in: currentBookCategoryIds }
                    }
                }
            },
            include: {
                authors: {
                    include: {
                        author: {
                            select: { id: true, name: true }
                        }
                    }
                },
                categories: {
                    include: {
                        category: {
                            select: { id: true, name: true }
                        }
                    }
                },
                publications: {
                    include: {
                        publication: {
                            select: { id: true, name: true }
                        }
                    }
                },
                _count: {
                    select: { readingProgress: true }
                }
            },
            take: 10
        })

        // Score and combine related books
        const scoreBook = (relatedBook: any, currentBookAuthors: string[], currentBookPubs: string[], currentBookCats: string[]) => {
            let score = 0
            const reasons: string[] = []

            // Author matches: +3 points each
            const matchedAuthors = relatedBook.authors
                .map((ra: any) => ra.author.id)
                .filter((id: string) => currentBookAuthors.includes(id))
            if (matchedAuthors.length > 0) {
                score += matchedAuthors.length * 3
                reasons.push('author')
            }

            // Publication matches: +2 points each
            const matchedPubs = relatedBook.publications
                .map((rp: any) => rp.publication.id)
                .filter((id: string) => currentBookPubs.includes(id))
            if (matchedPubs.length > 0) {
                score += matchedPubs.length * 2
                reasons.push('publication')
            }

            // Category matches: +1 point each
            const matchedCats = relatedBook.categories
                .map((rc: any) => rc.category.id)
                .filter((id: string) => currentBookCats.includes(id))
            if (matchedCats.length > 0) {
                score += matchedCats.length
                reasons.push('category')
            }

            // Popularity bonus: +0.5 points
            const popularityScore = relatedBook._count.readingProgress * 0.1
            score += popularityScore

            return { score, reasons }
        }

        // Process and sort all matches
        const allRelatedBooks = [...authorMatches, ...publicationMatches, ...categoryMatches]
        const scoredBooks = allRelatedBooks.map(relatedBook => ({
            ...relatedBook,
            ...scoreBook(relatedBook, currentBookAuthorIds, currentBookPublicationIds, currentBookCategoryIds)
        }))

        // Remove duplicates (keep highest score) and sort by score then popularity
        const uniqueBooks = Array.from(
            scoredBooks.reduce((map, book) => {
                const existing = map.get(book.id)
                if (!existing || book.score > existing.score) {
                    map.set(book.id, book)
                }
                return map
            }, new Map()).values()
        ).sort((a, b) => {
            // First sort by score
            if (b.score !== a.score) return b.score - a.score
            // Then by popularity
            return b._count.readingProgress - a._count.readingProgress
        })

        // Take top 6
        const relatedBooks = uniqueBooks.slice(0, 6)

        // Build recommendation reasons map
        const recommendationReasons: Record<string, { authors: string[], publications: string[], categories: string[] }> = {}
        relatedBooks.forEach(relatedBook => {
            const matchedAuthors = relatedBook.authors
                .filter((ra: any) => currentBookAuthorIds.includes(ra.author.id))
                .map((ra: any) => ra.author.name)

            const matchedPublications = relatedBook.publications
                .filter((rp: any) => currentBookPublicationIds.includes(rp.publication.id))
                .map((rp: any) => rp.publication.name)

            const matchedCategories = relatedBook.categories
                .filter((rc: any) => currentBookCategoryIds.includes(rc.category.id))
                .map((rc: any) => rc.category.name)

            recommendationReasons[relatedBook.id] = {
                authors: matchedAuthors,
                publications: matchedPublications,
                categories: matchedCategories
            }
        })

        // Transform book data
        const transformedBook = {
            id: book.id,
            name: book.name,
            summary: book.summary,
            aiSummary: book.aiSummary,
            aiSummaryGeneratedAt: book.aiSummaryGeneratedAt,
            type: book.type,
            // User who uploaded the book (only if public and user role is USER)
            entryBy: book.isPublic && book.entryBy.role === 'USER' ? {
                id: book.entryBy.id,
                firstName: book.entryBy.firstName,
                lastName: book.entryBy.lastName,
                username: book.entryBy.username,
                name: book.entryBy.name,
                avatar: book.entryBy.avatar,
                bio: book.entryBy.bio,
                createdAt: book.entryBy.createdAt,
            } : null,
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
            // Suggested questions
            suggestedQuestions: book.questions,
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
            // Series with neighbors
            series: seriesNeighbors.map(sn => ({
                seriesId: sn.seriesId,
                seriesName: sn.seriesName,
                seriesDescription: sn.seriesDescription,
                seriesImage: sn.seriesImage,
                order: sn.order,
                totalBooks: sn.totalBooks,
                previousBook: sn.previousBook ? {
                    id: sn.previousBook.id,
                    name: sn.previousBook.name,
                    image: sn.previousBook.image,
                    type: sn.previousBook.type,
                    requiresPremium: sn.previousBook.requiresPremium,
                    canAccess: !sn.previousBook.requiresPremium || userHasPremium,
                } : null,
                nextBook: sn.nextBook ? {
                    id: sn.nextBook.id,
                    name: sn.nextBook.name,
                    image: sn.nextBook.image,
                    type: sn.nextBook.type,
                    requiresPremium: sn.nextBook.requiresPremium,
                    canAccess: !sn.nextBook.requiresPremium || userHasPremium,
                } : null,
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
            // Analytics
            analytics: {
                totalViews: viewStats,
            },
            // Related books
            relatedBooks: relatedBooks.map(relatedBook => ({
                id: relatedBook.id,
                name: relatedBook.name,
                type: relatedBook.type,
                image: relatedBook.image,
                requiresPremium: relatedBook.requiresPremium,
                canAccess: !relatedBook.requiresPremium || userHasPremium,
                readersCount: relatedBook._count.readingProgress,
                authors: relatedBook.authors.map((ra: any) => ({
                    id: ra.author.id,
                    name: ra.author.name,
                })),
                categories: relatedBook.categories.map((rc: any) => ({
                    id: rc.category.id,
                    name: rc.category.name,
                })),
            })),
            // Recommendation reasons for each related book
            recommendationReasons
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