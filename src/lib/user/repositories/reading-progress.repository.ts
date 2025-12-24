/**
 * Reading Progress Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the ReadingProgress model
 *
 * Benefits:
 * - Separation of concerns (business logic from data access)
 * - Easy to test and mock
 * - Centralized database queries
 */

import { prisma } from '../../prisma'
import { BookType } from '@prisma/client'
import { clampProgress, isBookCompleted } from '@/lib/utils/reading-progress'

// ============================================================================
// READING PROGRESS QUERIES
// ============================================================================

/**
 * Find reading progress by user and book
 *
 * @param {string} userId - User ID
 * @param {string} bookId - Book ID
 * @returns {Promise<ReadingProgress | null>} Reading progress or null if not found
 */
export async function findReadingProgress(userId: string, bookId: string) {
    return prisma.readingProgress.findUnique({
        where: {
            userId_bookId: {
                userId,
                bookId,
            }
        },
        include: {
            book: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                    pageNumber: true,
                    image: true,
                    authors: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    name: true,
                                }
                            }
                        }
                    }
                }
            }
        }
    })
}

/**
 * Get all reading progress for a user
 *
 * @param {string} userId - User ID
 * @param {Object} [filters] - Optional filters
 * @param {boolean} [filters.isCompleted] - Filter by completion status
 * @param {BookType} [filters.bookType] - Filter by book type
 * @param {number} [filters.page] - Page number (default: 1)
 * @param {number} [filters.limit] - Items per page (default: 50)
 * @returns {Promise<{progress: ReadingProgress[], total: number}>} Reading progress and total count
 */
export async function getUserReadingProgress(
    userId: string,
    filters?: {
        isCompleted?: boolean
        bookType?: BookType
        page?: number
        limit?: number
    }
) {
    const { isCompleted, bookType, page = 1, limit = 50 } = filters || {}
    const skip = (page - 1) * limit

    const where: any = { userId }
    if (isCompleted !== undefined) where.isCompleted = isCompleted
    if (bookType) {
        where.book = {
            type: bookType
        }
    }

    const [progress, total] = await Promise.all([
        prisma.readingProgress.findMany({
            where,
            include: {
                book: {
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
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { lastReadAt: 'desc' },
        }),
        prisma.readingProgress.count({ where }),
    ])

    return { progress, total }
}

/**
 * Get reading statistics for a user
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Reading statistics
 */
export async function getUserReadingStats(userId: string) {
    const [
        totalBooks,
        completedBooks,
        inProgressBooks,
        recentlyRead,
        timeDistribution
    ] = await Promise.all([
        prisma.readingProgress.count({
            where: { userId }
        }),
        prisma.readingProgress.count({
            where: { userId, isCompleted: true }
        }),
        prisma.readingProgress.count({
            where: { userId, isCompleted: false }
        }),
        prisma.readingProgress.findMany({
            where: { userId, isCompleted: true },
            include: { book: true },
            orderBy: { updatedAt: 'desc' },
            take: 5
        }),
        prisma.readingProgress.groupBy({
            by: ['isCompleted'],
            where: { userId },
            _count: { bookId: true }
        })
    ])

    return {
        totalBooks,
        completedBooks,
        inProgressBooks,
        completionRate: totalBooks > 0 ? (completedBooks / totalBooks) * 100 : 0,
        recentlyRead: recentlyRead.map(rp => ({
            ...rp,
            book: rp.book
        })),
        distribution: timeDistribution
    }
}

/**
 * Get books-old currently being read by user
 *
 * @param {string} userId - User ID
 * @param {number} [limit] - Maximum number of books-old (default: 10)
 * @returns {Promise<ReadingProgress[]>} Currently reading books-old
 */
export async function getCurrentlyReading(userId: string, limit = 10) {
    return prisma.readingProgress.findMany({
        where: {
            userId,
            isCompleted: false,
            progress: {
                gt: 0 // Only include books-old with actual progress
            }
        },
        include: {
            book: {
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
                    }
                }
            }
        },
        orderBy: { lastReadAt: 'desc' },
        take: limit,
    })
}

/**
 * Get completed books-old for a user
 *
 * @param {string} userId - User ID
 * @param {number} [limit] - Maximum number of books-old (default: 20)
 * @returns {Promise<ReadingProgress[]>} Completed books-old
 */
export async function getCompletedBooks(userId: string, limit = 20) {
    return prisma.readingProgress.findMany({
        where: {
            userId,
            isCompleted: true
        },
        include: {
            book: {
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
                    }
                }
            }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
    })
}

/**
 * Get reading progress for multiple books-old at once
 *
 * @param {string} userId - User ID
 * @param {string[]} bookIds - Array of book IDs
 * @returns {Promise<ReadingProgress[]>} Reading progress records
 */
export async function getMultipleBookProgress(userId: string, bookIds: string[]) {
    return prisma.readingProgress.findMany({
        where: {
            userId,
            bookId: {
                in: bookIds
            }
        },
        include: {
            book: true
        }
    })
}

// ============================================================================
// READING PROGRESS MUTATIONS
// ============================================================================

/**
 * Create or update reading progress
 *
 * @param {Object} data - Progress data
 * @param {string} data.userId - User ID
 * @param {string} data.bookId - Book ID
 * @param {number} [data.currentPage] - Current page number
 * @param {number} [data.currentEpocha] - Current audio position (in seconds)
 * @param {number} [data.progress] - Progress percentage (0-100)
 * @param {boolean} [data.isCompleted] - Completion status
 * @returns {Promise<ReadingProgress>} Created or updated progress
 */
export async function upsertReadingProgress(data: {
    userId: string
    bookId: string
    currentPage?: number
    currentEpocha?: number
    progress?: number
    isCompleted?: boolean
}) {
    const progress = clampProgress(data.progress)
    const isCompleted = data.isCompleted || isBookCompleted(progress, 100)

    return prisma.readingProgress.upsert({
        where: {
            userId_bookId: {
                userId: data.userId,
                bookId: data.bookId,
            }
        },
        update: {
            currentPage: data.currentPage,
            currentEpocha: data.currentEpocha,
            progress,
            isCompleted,
            lastReadAt: new Date(),
        },
        create: {
            ...data,
            progress,
            isCompleted,
            lastReadAt: new Date(),
        },
        include: {
            book: true
        }
    })
}

/**
 * Update reading progress
 *
 * @param {string} userId - User ID
 * @param {string} bookId - Book ID
 * @param {Object} data - Progress data to update
 * @returns {Promise<ReadingProgress>} Updated progress
 */
export async function updateReadingProgress(
    userId: string,
    bookId: string,
    data: {
        currentPage?: number
        currentEpocha?: number
        progress?: number
        isCompleted?: boolean
    }
) {
    const progress = Math.min(100, Math.max(0, data.progress || 0))
    const isCompleted = data.isCompleted || progress >= 100

    return prisma.readingProgress.update({
        where: {
            userId_bookId: {
                userId,
                bookId,
            }
        },
        data: {
            currentPage: data.currentPage,
            currentEpocha: data.currentEpocha,
            progress,
            isCompleted,
            lastReadAt: new Date(),
        },
        include: {
            book: true
        }
    })
}

/**
 * Mark book as completed
 *
 * @param {string} userId - User ID
 * @param {string} bookId - Book ID
 * @returns {Promise<ReadingProgress>} Updated progress
 */
export async function markBookAsCompleted(userId: string, bookId: string) {
    return prisma.readingProgress.update({
        where: {
            userId_bookId: {
                userId,
                bookId,
            }
        },
        data: {
            progress: 100,
            isCompleted: true,
            lastReadAt: new Date(),
        },
        include: {
            book: true
        }
    })
}

/**
 * Reset reading progress
 *
 * @param {string} userId - User ID
 * @param {string} bookId - Book ID
 * @returns {Promise<ReadingProgress>} Reset progress
 */
export async function resetReadingProgress(userId: string, bookId: string) {
    return prisma.readingProgress.update({
        where: {
            userId_bookId: {
                userId,
                bookId,
            }
        },
        data: {
            currentPage: null,
            currentEpocha: null,
            progress: 0,
            isCompleted: false,
            lastReadAt: new Date(),
        },
        include: {
            book: true
        }
    })
}

/**
 * Delete reading progress
 *
 * @param {string} userId - User ID
 * @param {string} bookId - Book ID
 * @returns {Promise<ReadingProgress>} Deleted progress
 */
export async function deleteReadingProgress(userId: string, bookId: string) {
    return prisma.readingProgress.delete({
        where: {
            userId_bookId: {
                userId,
                bookId,
            }
        },
    })
}

/**
 * Delete all reading progress for a user
 *
 * @param {string} userId - User ID
 * @returns {Promise<{count: number}>} Number of deleted records
 */
export async function deleteUserReadingProgress(userId: string) {
    return prisma.readingProgress.deleteMany({
        where: { userId },
    })
}

/**
 * Get popular books-old (most read across all users)
 *
 * @param {number} [limit] - Maximum number of books-old (default: 20)
 * @returns {Promise<Object[]>} Popular books-old with read counts
 */
export async function getPopularBooks(limit = 20) {
    const popularBooks = await prisma.readingProgress.groupBy({
        by: ['bookId'],
        where: {
            progress: {
                gt: 10 // Only include books-old with actual engagement
            }
        },
        _count: {
            bookId: true
        },
        orderBy: {
            _count: {
                bookId: 'desc'
            }
        },
        take: limit
    })

    const bookIds = popularBooks.map(pb => pb.bookId)

    const books = await prisma.book.findMany({
        where: {
            id: {
                in: bookIds
            },
            isPublic: true
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
            },
            _count: {
                select: {
                    readingProgress: true
                }
            }
        }
    })

    // Sort books-old by their reading progress count
    const sortedBooks = books.sort((a, b) => {
        const aProgress = popularBooks.find(pb => pb.bookId === a.id)?._count.bookId || 0
        const bProgress = popularBooks.find(pb => pb.bookId === b.id)?._count.bookId || 0
        return bProgress - aProgress
    })

    return sortedBooks
}