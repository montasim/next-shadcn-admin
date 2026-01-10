/**
 * Series Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Series model
 */

import { prisma } from '../../prisma'

// ============================================================================
// SERIES QUERIES
// ============================================================================

/**
 * Get all series with pagination and search
 */
export async function getSeries(options: {
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

  const [series, total] = await Promise.all([
    prisma.series.findMany({
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
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.series.count({ where }),
  ])

  return {
    series,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit,
    },
  }
}

/**
 * Get series by ID
 */
export async function getSeriesById(id: string) {
  return prisma.series.findUnique({
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
              image: true,
              type: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
      _count: {
        select: {
          books: true,
        },
      },
    },
  })
}

/**
 * Create series
 */
export async function createSeries(data: {
  name: string
  description?: string
  image?: string
  entryById: string
}) {
  return prisma.series.create({
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
 * Update series
 */
export async function updateSeries(id: string, data: {
  name?: string
  description?: string
  image?: string
}) {
  return prisma.series.update({
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
 * Delete series
 */
export async function deleteSeries(id: string) {
  return prisma.series.delete({
    where: { id },
  })
}

/**
 * Get books in a series with proper ordering
 */
export async function getSeriesBooks(seriesId: string) {
  const bookSeries = await prisma.bookSeries.findMany({
    where: { seriesId },
    include: {
      book: {
        include: {
          authors: {
            include: {
              author: true,
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
      order: 'asc',
    },
  })

  return bookSeries.map(bs => ({
    ...bs.book,
    seriesOrder: bs.order,
  }))
}

/**
 * Add book to series
 */
export async function addBookToSeries(data: {
  bookId: string
  seriesId: string
  order: number
}) {
  return prisma.bookSeries.create({
    data,
    include: {
      book: {
        select: {
          id: true,
          name: true,
        },
      },
      series: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

/**
 * Update book in series (change order)
 */
export async function updateBookInSeries(bookId: string, seriesId: string, order: number) {
  return prisma.bookSeries.update({
    where: {
      bookId_seriesId: {
        bookId,
        seriesId,
      },
    },
    data: { order },
  })
}

/**
 * Remove book from series
 */
export async function removeBookFromSeries(bookId: string, seriesId: string) {
  return prisma.bookSeries.delete({
    where: {
      bookId_seriesId: {
        bookId,
        seriesId,
      },
    },
  })
}

/**
 * Get series for a specific book
 */
export async function getBookSeries(bookId: string) {
  return prisma.bookSeries.findMany({
    where: { bookId },
    include: {
      series: true,
    },
    orderBy: {
      order: 'asc',
    },
  })
}

// ============================================================================
// ADMIN SERIES DETAILS
// ============================================================================

/**
 * Get series with complete details for admin dashboard
 */
export async function getSeriesWithCompleteDetails(id: string) {
  const series = await prisma.series.findUnique({
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
        include: {
          book: {
            include: {
              authors: {
                include: {
                  author: true,
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
          order: 'asc',
        },
      },
    },
  })

  if (!series) return null

  // Get book IDs for this series
  const bookIds = series.books.map(sb => sb.book.id)

  // Get analytics data in parallel
  const [viewStats, totalReaders, completedReaders] = await Promise.all([
    // View stats - assuming seriesView table exists
    prisma.seriesView.aggregate({
      where: { seriesId: id },
      _count: {
        id: true,
      },
    }).catch(() => ({ _count: { id: 0 } })),

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

  // Calculate book stats
  const booksByType = {
    HARD_COPY: series.books.filter(sb => sb.book.type === 'HARD_COPY').length,
    EBOOK: series.books.filter(sb => sb.book.type === 'EBOOK').length,
    AUDIO: series.books.filter(sb => sb.book.type === 'AUDIO').length,
  }

  const totalBooks = series.books.length
  const totalPages = series.books.reduce((sum, sb) => sum + (sb.book.pageNumber || 0), 0)
  const totalSpend = series.books.reduce((sum, sb) => sum + (sb.book.buyingPrice || 0), 0)

  return {
    ...series,
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
 * Get all books by a series with their stats
 */
export async function getSeriesBooksWithStats(
  seriesId: string,
  options: {
    page?: number
    limit?: number
  } = {}
) {
  const { page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  const [books, total] = await Promise.all([
    prisma.bookSeries.findMany({
      where: { seriesId },
      include: {
        book: {
          include: {
            authors: {
              include: {
                author: true,
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
        order: 'asc',
      },
      skip,
      take: limit,
    }),
    prisma.bookSeries.count({ where: { seriesId } }),
  ])

  // Get stats for each book
  const bookIds = books.map(bs => bs.book.id)
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

  const booksWithStats = books.map(bs => ({
    ...bs.book,
    order: bs.order,
    viewCount: statsMap.get(bs.book.id) || 0,
    readerCount: readersMap.get(bs.book.id) || 0,
    completedReaders: completedReadersMap.get(bs.book.id) || 0,
    avgProgress: avgProgressMap.get(bs.book.id) || 0,
  }))

  return {
    books: booksWithStats,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}

/**
 * Get readers across all series's books
 */
export async function getSeriesReaders(
  seriesId: string,
  options: {
    page?: number
    limit?: number
  } = {}
) {
  const { page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  // Get all books by this series
  const seriesBooks = await prisma.bookSeries.findMany({
    where: { seriesId },
    select: { bookId: true },
  })

  const bookIds = seriesBooks.map(sb => sb.bookId)

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

  // Group by user and aggregate their reading across series's books
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
 * Get previous and next books in a series
 */
export async function getSeriesNeighbors(bookId: string, seriesId: string) {
  const currentBook = await prisma.bookSeries.findUnique({
    where: {
      bookId_seriesId: {
        bookId,
        seriesId,
      },
    },
    select: {
      order: true,
    },
  })

  if (!currentBook) {
    return { previous: null, next: null }
  }

  const [previous, next] = await Promise.all([
    prisma.bookSeries.findFirst({
      where: {
        seriesId,
        order: {
          lt: currentBook.order,
        },
      },
      include: {
        book: {
          select: {
            id: true,
            name: true,
            image: true,
            type: true,
          },
        },
      },
      orderBy: {
        order: 'desc',
      },
      take: 1,
    }),
    prisma.bookSeries.findFirst({
      where: {
        seriesId,
        order: {
          gt: currentBook.order,
        },
      },
      include: {
        book: {
          select: {
            id: true,
            name: true,
            image: true,
            type: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
      take: 1,
    }),
  ])

  return {
    previous: previous?.book || null,
    next: next?.book || null,
  }
}
