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