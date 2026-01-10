/**
 * Author Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Author model
 */

import { prisma } from '../../prisma'

// ============================================================================
// AUTHOR QUERIES
// ============================================================================

/**
 * Get all authors with pagination and search
 */
export async function getAuthors(options: {
  page?: number
  search?: string
  limit?: number
} = {}) {
  const { page = 1, search = '', limit = 10 } = options
  const skip = (page - 1) * limit

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [authors, total] = await Promise.all([
    prisma.author.findMany({
      where,
      include: {
        entryBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            books: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.author.count({ where }),
  ])

  return {
    authors,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit,
    },
  }
}

/**
 * Get author by ID
 */
export async function getAuthorById(id: string) {
  return prisma.author.findUnique({
    where: { id },
    include: {
      entryBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      books: {
        include: {
          book: {
            select: {
              id: true,
              name: true,
              type: true,
              image: true,
            },
          },
        },
      },
    },
  })
}

/**
 * Check if author exists
 */
export async function authorExists(id: string): Promise<boolean> {
  const count = await prisma.author.count({
    where: { id },
  })
  return count > 0
}

/**
 * Check if author name exists (excluding current author)
 */
export async function authorNameExists(name: string, excludeId?: string): Promise<boolean> {
  const where = excludeId
    ? {
        name: { equals: name, mode: 'insensitive' as const },
        NOT: { id: excludeId },
      }
    : { name: { equals: name, mode: 'insensitive' as const } }

  const count = await prisma.author.count({ where })
  return count > 0
}

/**
 * Check if author is linked to books-old
 */
export async function isAuthorLinkedToBooks(id: string): Promise<boolean> {
  const count = await prisma.bookAuthor.count({
    where: { authorId: id },
  })
  return count > 0
}

// ============================================================================
// AUTHOR MUTATIONS
// ============================================================================

/**
 * Create a new author
 */
export async function createAuthor(data: {
  name: string
  description?: string
  image?: string
  directImageUrl?: string
  entryById: string
}) {
  const { entryById, ...authorData } = data
  return prisma.author.create({
    data: {
      ...authorData,
      entryBy: {
        connect: { id: entryById }
      }
    },
    include: {
      entryBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Update an author
 */
export async function updateAuthor(
  id: string,
  data: {
    name?: string
    description?: string | null
    image?: string | null
    directImageUrl?: string | null
  }
) {
  return prisma.author.update({
    where: { id },
    data,
    include: {
      entryBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Delete an author
 */
export async function deleteAuthor(id: string) {
  // First check if author is linked to any books-old
  const isLinked = await isAuthorLinkedToBooks(id)
  if (isLinked) {
    throw new Error('Cannot delete author: linked to one or more books-old')
  }

  return prisma.author.delete({
    where: { id },
  })
}

// ============================================================================
// AUTHOR BOOKS MANAGEMENT
// ============================================================================

/**
 * Get all books-old for an author
 */
export async function getAuthorBooks(authorId: string) {
  return prisma.bookAuthor.findMany({
    where: { authorId },
    include: {
      book: {
        include: {
          publications: {
            include: {
              publication: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      book: {
        createdAt: 'desc',
      },
    },
  })
}

// ============================================================================
// ADMIN AUTHOR DETAILS
// ============================================================================

/**
 * Get author with complete details for admin dashboard
 * Optimized to only fetch necessary data for initial page load
 */
export async function getAuthorWithCompleteDetails(id: string) {
  // Only fetch author with minimal book data needed for stats calculation
  const author = await prisma.author.findUnique({
    where: { id },
    include: {
      entryBy: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          directAvatarUrl: true,
        },
      },
      books: {
        select: {
          book: {
            select: {
              id: true,
              type: true,
              pageNumber: true,
              buyingPrice: true,
            },
          },
        },
        orderBy: {
          book: {
            createdAt: 'desc',
          },
        },
      },
    },
  })

  if (!author) return null

  // Get book IDs for this author
  const bookIds = author.books.map(ab => ab.book.id)

  // Get analytics data in parallel
  const [viewStats, totalReaders, completedReaders] = await Promise.all([
    // View stats
    prisma.authorView.aggregate({
      where: { authorId: id },
      _count: {
        id: true,
      },
    }),

    // Total unique readers across all books
    prisma.readingProgress.groupBy({
      by: ['userId'],
      where: {
        bookId: { in: bookIds },
      },
    }).then(groups => groups.length),

    // Completed readers across all books
    prisma.readingProgress.count({
      where: {
        bookId: { in: bookIds },
        isCompleted: true,
      },
    }),
  ])

  // Calculate book stats from minimal data
  const booksByType = {
    HARD_COPY: author.books.filter(ab => ab.book.type === 'HARD_COPY').length,
    EBOOK: author.books.filter(ab => ab.book.type === 'EBOOK').length,
    AUDIO: author.books.filter(ab => ab.book.type === 'AUDIO').length,
  }

  const totalBooks = author.books.length
  const totalPages = author.books.reduce((sum, ab) => sum + (ab.book.pageNumber || 0), 0)
  const totalSpend = author.books.reduce((sum, ab) => sum + (ab.book.buyingPrice || 0), 0)

  return {
    ...author,
    analytics: {
      totalViews: viewStats._count.id,
      totalBooks,
      totalReaders,
      completedReaders,
      booksByType,
      totalPages,
      totalSpend,
    },
  }
}

/**
 * Get all books by an author with their stats
 */
export async function getAuthorBooksWithStats(
  authorId: string,
  options: {
    page?: number
    limit?: number
  } = {}
) {
  const { page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  const [books, total] = await Promise.all([
    prisma.bookAuthor.findMany({
      where: { authorId },
      include: {
        book: {
          include: {
            publications: {
              include: {
                publication: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            categories: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            series: {
              include: {
                series: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        book: {
          createdAt: 'desc',
        },
      },
      skip,
      take: limit,
    }),
    prisma.bookAuthor.count({ where: { authorId } }),
  ])

  // Get stats for each book
  const bookIds = books.map(ab => ab.book.id)
  const bookStats = await prisma.bookView.groupBy({
    by: ['bookId'],
    where: { bookId: { in: bookIds } },
    _count: {
      id: true,
    },
  })

  const readerStats = await prisma.readingProgress.groupBy({
    by: ['bookId'],
    where: { bookId: { in: bookIds } },
    _count: {
      id: true,
    },
  })

  // Get completed readers count per book
  const completedReadersStats = await prisma.readingProgress.groupBy({
    by: ['bookId'],
    where: {
      bookId: { in: bookIds },
      isCompleted: true,
    },
    _count: {
      id: true,
    },
  })

  // Get average progress per book
  const avgProgressStats = await prisma.readingProgress.groupBy({
    by: ['bookId'],
    where: { bookId: { in: bookIds } },
    _avg: {
      progress: true,
    },
  })

  const statsMap = new Map()
  bookStats.forEach(stat => {
    statsMap.set(stat.bookId, stat._count.id)
  })

  const readersMap = new Map()
  readerStats.forEach(stat => {
    readersMap.set(stat.bookId, stat._count.id)
  })

  const completedReadersMap = new Map()
  completedReadersStats.forEach(stat => {
    completedReadersMap.set(stat.bookId, stat._count.id)
  })

  const avgProgressMap = new Map()
  avgProgressStats.forEach(stat => {
    avgProgressMap.set(stat.bookId, Math.round((stat._avg.progress || 0) * 100) / 100)
  })

  const booksWithStats = books.map(ab => ({
    ...ab.book,
    viewCount: statsMap.get(ab.book.id) || 0,
    readerCount: readersMap.get(ab.book.id) || 0,
    completedReaders: completedReadersMap.get(ab.book.id) || 0,
    avgProgress: avgProgressMap.get(ab.book.id) || 0,
  }))

  return {
    books: booksWithStats,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}

/**
 * Get readers across all author's books
 */
export async function getAuthorReaders(
  authorId: string,
  options: {
    page?: number
    limit?: number
  } = {}
) {
  const { page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  // Get all books by this author
  const authorBooks = await prisma.bookAuthor.findMany({
    where: { authorId },
    select: { bookId: true },
  })

  const bookIds = authorBooks.map(ab => ab.bookId)

  // Get reading progress for all these books
  const [progressRecords, total] = await Promise.all([
    prisma.readingProgress.findMany({
      where: {
        bookId: { in: bookIds },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            directAvatarUrl: true,
          },
        },
      },
      orderBy: {
        lastReadAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.readingProgress.count({
      where: { bookId: { in: bookIds } },
    }),
  ])

  // Group by user and aggregate their reading across author's books
  const userMap = new Map()

  progressRecords.forEach(record => {
    if (!userMap.has(record.userId)) {
      userMap.set(record.userId, {
        user: record.user,
        booksRead: 0,
        totalProgress: 0,
        lastReadAt: record.lastReadAt,
        completedBooks: 0,
      })
    }

    const userData = userMap.get(record.userId)!
    userData.booksRead += 1
    userData.totalProgress += record.progress
    if (record.isCompleted) {
      userData.completedBooks += 1
    }
    if (new Date(record.lastReadAt) > new Date(userData.lastReadAt)) {
      userData.lastReadAt = record.lastReadAt
    }
  })

  const readers = Array.from(userMap.values()).map(data => ({
    ...data,
    avgProgress: Math.round(data.totalProgress / data.booksRead),
  }))

  return {
    readers,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}

/**
 * Get aggregate reading statistics for an author
 */
export async function getAuthorReadingStats(authorId: string) {
  // Get all books by this author
  const authorBooks = await prisma.bookAuthor.findMany({
    where: { authorId },
    select: { bookId: true },
  })

  const bookIds = authorBooks.map(ab => ab.bookId)

  const [
    totalReadersResult,
    completedReadersResult,
    activeReadersResult,
    avgProgressResult,
  ] = await Promise.all([
    // Total readers
    prisma.readingProgress.groupBy({
      by: ['userId'],
      where: { bookId: { in: bookIds } },
    }).then(groups => groups.length),

    // Completed readers (count of completed progress records)
    prisma.readingProgress.count({
      where: {
        bookId: { in: bookIds },
        isCompleted: true,
      },
    }),

    // Currently reading
    prisma.readingProgress.groupBy({
      by: ['userId'],
      where: {
        bookId: { in: bookIds },
        isCompleted: false,
        progress: { gt: 0 },
      },
    }).then(groups => groups.length),

    // Average progress
    prisma.readingProgress.aggregate({
      where: { bookId: { in: bookIds } },
      _avg: {
        progress: true,
      },
    }),
  ])

  return {
    totalReaders: totalReadersResult,
    completedReaders: completedReadersResult,
    activeReaders: activeReadersResult,
    avgProgress: avgProgressResult._avg.progress || 0,
  }
}