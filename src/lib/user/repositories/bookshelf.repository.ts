/**
 * Bookshelf Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Bookshelf and BookshelfItem models
 *
 * Benefits:
 * - Separation of concerns (business logic from data access)
 * - Easy to test and mock
 * - Centralized database queries
 */

import { prisma } from '../../prisma'

// ============================================================================
// BOOKSHELF QUERIES
// ============================================================================

/**
 * Find bookshelf by ID with books-old
 *
 * @param {string} id - Bookshelf ID
 * @param {string} [userId] - Optional user ID for authorization check
 * @returns {Promise<Bookshelf | null>} Bookshelf or null if not found
 */
export async function findBookshelfById(id: string, userId?: string) {
    const where: any = { id }
    if (userId) {
        where.OR = [
            { userId },
            { isPublic: true }
        ]
    }

    return prisma.bookshelf.findUnique({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                }
            },
            books: {
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
                            },
                            _count: {
                                select: {
                                    readingProgress: true,
                                }
                            }
                        }
                    }
                },
                orderBy: { addedAt: 'desc' }
            },
            _count: {
                select: {
                    books: true,
                }
            }
        }
    })
}

/**
 * Get all bookshelves for a user
 *
 * @param {string} userId - User ID
 * @param {Object} [filters] - Optional filters
 * @param {boolean} [filters.isPublic] - Filter by public status
 * @param {number} [filters.page] - Page number (default: 1)
 * @param {number} [filters.limit] - Items per page (default: 20)
 * @returns {Promise<{bookshelves: Bookshelf[], total: number}>} Bookshelves and total count
 */
export async function getUserBookshelves(
    userId: string,
    filters?: {
        isPublic?: boolean
        page?: number
        limit?: number
    }
) {
    const { isPublic, page = 1, limit = 20 } = filters || {}
    const skip = (page - 1) * limit

    const where: any = { userId }
    if (isPublic !== undefined) where.isPublic = isPublic

    const [bookshelves, total] = await Promise.all([
        prisma.bookshelf.findMany({
            where,
            include: {
                _count: {
                    select: {
                        books: true,
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.bookshelf.count({ where }),
    ])

    return { bookshelves, total }
}

/**
 * Get public bookshelves
 *
 * @param {Object} [filters] - Optional filters
 * @param {number} [filters.page] - Page number (default: 1)
 * @param {number} [filters.limit] - Items per page (default: 20)
 * @param {string} [filters.search] - Search term for bookshelf names
 * @returns {Promise<{bookshelves: Bookshelf[], total: number}>} Public bookshelves and total count
 */
export async function getPublicBookshelves(filters?: {
    page?: number
    limit?: number
    search?: string
}) {
    const { page = 1, limit = 20, search } = filters || {}
    const skip = (page - 1) * limit

    const where: any = { isPublic: true }
    if (search) {
        where.name = {
            contains: search,
            mode: 'insensitive'
        }
    }

    const [bookshelves, total] = await Promise.all([
        prisma.bookshelf.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    }
                },
                _count: {
                    select: {
                        books: true,
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.bookshelf.count({ where }),
    ])

    return { bookshelves, total }
}

/**
 * Check if user owns bookshelf
 *
 * @param {string} bookshelfId - Bookshelf ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user owns bookshelf
 */
export async function isBookshelfOwner(bookshelfId: string, userId: string): Promise<boolean> {
    const bookshelf = await prisma.bookshelf.findUnique({
        where: { id: bookshelfId },
        select: { userId: true }
    })

    return bookshelf?.userId === userId
}

/**
 * Check if book is in user's bookshelf
 *
 * @param {string} bookshelfId - Bookshelf ID
 * @param {string} bookId - Book ID
 * @returns {Promise<boolean>} True if book is in bookshelf
 */
export async function isBookInBookshelf(bookshelfId: string, bookId: string): Promise<boolean> {
    const item = await prisma.bookshelfItem.findUnique({
        where: {
            bookshelfId_bookId: {
                bookshelfId,
                bookId,
            }
        }
    })

    return !!item
}

/**
 * Get all bookshelves that contain a specific book
 *
 * @param {string} bookId - Book ID
 * @param {string} [userId] - Optional user ID to filter by user's bookshelves
 * @returns {Promise<Bookshelf[]>} Bookshelves containing the book
 */
export async function getBookshelvesWithBook(bookId: string, userId?: string) {
    const where: any = {
        books: {
            some: {
                bookId
            }
        }
    }

    if (userId) {
        where.userId = userId
    }

    return prisma.bookshelf.findMany({
        where,
        include: {
            _count: {
                select: {
                    books: true,
                }
            }
        },
        orderBy: { updatedAt: 'desc' },
    })
}

// ============================================================================
// BOOKSHELF MUTATIONS
// ============================================================================

/**
 * Create new bookshelf
 *
 * @param {Object} data - Bookshelf data
 * @param {string} data.userId - User ID
 * @param {string} data.name - Bookshelf name
 * @param {string} [data.description] - Bookshelf description
 * @param {boolean} [data.isPublic] - Public status (default: false)
 * @param {string} [data.image] - Bookshelf image URL
 * @param {string} [data.directImageUrl] - Direct download URL
 * @returns {Promise<Bookshelf>} Created bookshelf
 */
export async function createBookshelf(data: {
    userId: string
    name: string
    description?: string
    isPublic?: boolean
    image?: string
    directImageUrl?: string
}) {
    return prisma.bookshelf.create({
        data: {
            ...data,
            isPublic: data.isPublic ?? false,
        },
        include: {
            _count: {
                select: {
                    books: true,
                }
            }
        }
    })
}

/**
 * Update bookshelf
 *
 * @param {string} id - Bookshelf ID
 * @param {string} userId - User ID (for authorization)
 * @param {Object} data - Bookshelf data to update
 * @param {string} [data.name] - Bookshelf name
 * @param {string} [data.description] - Bookshelf description
 * @param {boolean} [data.isPublic] - Public status
 * @param {string} [data.image] - Bookshelf image URL
 * @param {string} [data.directImageUrl] - Direct download URL
 * @returns {Promise<Bookshelf>} Updated bookshelf
 */
export async function updateBookshelf(
    id: string,
    userId: string,
    data: {
        name?: string
        description?: string
        isPublic?: boolean
        image?: string
        directImageUrl?: string
    }
) {
    // Verify ownership
    const isOwner = await isBookshelfOwner(id, userId)
    if (!isOwner) {
        throw new Error('Unauthorized: You can only update your own bookshelves')
    }

    return prisma.bookshelf.update({
        where: { id },
        data,
        include: {
            _count: {
                select: {
                    books: true,
                }
            }
        }
    })
}

/**
 * Delete bookshelf
 *
 * @param {string} id - Bookshelf ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Bookshelf>} Deleted bookshelf
 */
export async function deleteBookshelf(id: string, userId: string) {
    // Verify ownership
    const isOwner = await isBookshelfOwner(id, userId)
    if (!isOwner) {
        throw new Error('Unauthorized: You can only delete your own bookshelves')
    }

    return prisma.bookshelf.delete({
        where: { id },
    })
}

/**
 * Add book to bookshelf
 *
 * @param {string} bookshelfId - Bookshelf ID
 * @param {string} userId - User ID (for authorization)
 * @param {string} bookId - Book ID
 * @returns {Promise<BookshelfItem>} Created bookshelf item
 */
export async function addBookToBookshelf(
    bookshelfId: string,
    userId: string,
    bookId: string
) {
    // Verify ownership
    const isOwner = await isBookshelfOwner(bookshelfId, userId)
    if (!isOwner) {
        throw new Error('Unauthorized: You can only add books-old to your own bookshelves')
    }

    // Check if book is already in bookshelf
    const exists = await isBookInBookshelf(bookshelfId, bookId)
    if (exists) {
        throw new Error('Book is already in this bookshelf')
    }

    return prisma.bookshelfItem.create({
        data: {
            bookshelfId,
            bookId,
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
        }
    })
}

/**
 * Remove book from bookshelf
 *
 * @param {string} bookshelfId - Bookshelf ID
 * @param {string} userId - User ID (for authorization)
 * @param {string} bookId - Book ID
 * @returns {Promise<BookshelfItem>} Deleted bookshelf item
 */
export async function removeBookFromBookshelf(
    bookshelfId: string,
    userId: string,
    bookId: string
) {
    // Verify ownership
    const isOwner = await isBookshelfOwner(bookshelfId, userId)
    if (!isOwner) {
        throw new Error('Unauthorized: You can only remove books-old from your own bookshelves')
    }

    return prisma.bookshelfItem.delete({
        where: {
            bookshelfId_bookId: {
                bookshelfId,
                bookId,
            }
        },
    })
}

/**
 * Add multiple books-old to bookshelf
 *
 * @param {string} bookshelfId - Bookshelf ID
 * @param {string} userId - User ID (for authorization)
 * @param {string[]} bookIds - Array of book IDs
 * @returns {Promise<BookshelfItem[]>} Created bookshelf items
 */
export async function addMultipleBooksToBookshelf(
    bookshelfId: string,
    userId: string,
    bookIds: string[]
) {
    // Verify ownership
    const isOwner = await isBookshelfOwner(bookshelfId, userId)
    if (!isOwner) {
        throw new Error('Unauthorized: You can only add books-old to your own bookshelves')
    }

    // Filter out books-old that are already in the bookshelf
    const existingItems = await prisma.bookshelfItem.findMany({
        where: {
            bookshelfId,
            bookId: {
                in: bookIds
            }
        },
        select: { bookId: true }
    })

    const existingBookIds = existingItems.map(item => item.bookId)
    const newBookIds = bookIds.filter(bookId => !existingBookIds.includes(bookId))

    if (newBookIds.length === 0) {
        return []
    }

    return prisma.bookshelfItem.createMany({
        data: newBookIds.map(bookId => ({
            bookshelfId,
            bookId,
        })),
    })
}

/**
 * Move book between bookshelves
 *
 * @param {string} fromBookshelfId - Source bookshelf ID
 * @param {string} toBookshelfId - Target bookshelf ID
 * @param {string} userId - User ID (for authorization)
 * @param {string} bookId - Book ID
 * @returns {Promise<BookshelfItem>} New bookshelf item
 */
export async function moveBookBetweenShelves(
    fromBookshelfId: string,
    toBookshelfId: string,
    userId: string,
    bookId: string
) {
    // Verify ownership of both bookshelves
    const [isFromOwner, isToOwner] = await Promise.all([
        isBookshelfOwner(fromBookshelfId, userId),
        isBookshelfOwner(toBookshelfId, userId)
    ])

    if (!isFromOwner || !isToOwner) {
        throw new Error('Unauthorized: You can only move books-old between your own bookshelves')
    }

    // Remove from source bookshelf
    await removeBookFromBookshelf(fromBookshelfId, userId, bookId)

    // Add to target bookshelf
    return addBookToBookshelf(toBookshelfId, userId, bookId)
}

/**
 * Get bookshelf statistics
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Bookshelf statistics
 */
export async function getUserBookshelfStats(userId: string) {
    const [
        totalBookshelves,
        publicBookshelves,
        privateBookshelves,
        totalBooks,
        recentActivity
    ] = await Promise.all([
        prisma.bookshelf.count({
            where: { userId }
        }),
        prisma.bookshelf.count({
            where: { userId, isPublic: true }
        }),
        prisma.bookshelf.count({
            where: { userId, isPublic: false }
        }),
        prisma.bookshelfItem.count({
            where: {
                bookshelf: {
                    userId
                }
            }
        }),
        prisma.bookshelfItem.findMany({
            where: {
                bookshelf: {
                    userId
                }
            },
            include: {
                bookshelf: true,
                book: true
            },
            orderBy: { addedAt: 'desc' },
            take: 5
        })
    ])

    return {
        totalBookshelves,
        publicBookshelves,
        privateBookshelves,
        totalBooks,
        averageBooksPerShelf: totalBookshelves > 0 ? Math.round(totalBooks / totalBookshelves) : 0,
        recentActivity
    }
}