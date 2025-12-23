/**
 * Publication Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Publication model
 */

import { prisma } from '../../prisma'

// ============================================================================
// PUBLICATION QUERIES
// ============================================================================

/**
 * Get all publications with pagination and search
 */
export async function getPublications(options: {
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

  const [publications, total] = await Promise.all([
    prisma.publication.findMany({
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
    prisma.publication.count({ where }),
  ])

  return {
    publications,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit,
    },
  }
}

/**
 * Get publication by ID
 */
export async function getPublicationById(id: string) {
  return prisma.publication.findUnique({
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
 * Check if publication exists
 */
export async function publicationExists(id: string): Promise<boolean> {
  const count = await prisma.publication.count({
    where: { id },
  })
  return count > 0
}

/**
 * Check if publication name exists (excluding current publication)
 */
export async function publicationNameExists(name: string, excludeId?: string): Promise<boolean> {
  const where = excludeId
    ? {
        name: { equals: name, mode: 'insensitive' as const },
        NOT: { id: excludeId },
      }
    : { name: { equals: name, mode: 'insensitive' as const } }

  const count = await prisma.publication.count({ where })
  return count > 0
}

/**
 * Check if publication is linked to books-old
 */
export async function isPublicationLinkedToBooks(id: string): Promise<boolean> {
  const count = await prisma.bookPublication.count({
    where: { publicationId: id },
  })
  return count > 0
}

// ============================================================================
// PUBLICATION MUTATIONS
// ============================================================================

/**
 * Create a new publication
 */
export async function createPublication(data: {
  name: string
  description?: string
  image?: string
  entryById: string
}) {
  const { entryById, ...publicationData } = data
  return prisma.publication.create({
    data: {
      ...publicationData,
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
 * Update a publication
 */
export async function updatePublication(
  id: string,
  data: {
    name?: string
    description?: string | null
    image?: string | null
  }
) {
  return prisma.publication.update({
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
 * Delete a publication
 */
export async function deletePublication(id: string) {
  // First check if publication is linked to any books-old
  const isLinked = await isPublicationLinkedToBooks(id)
  if (isLinked) {
    throw new Error('Cannot delete publication: linked to one or more books-old')
  }

  return prisma.publication.delete({
    where: { id },
  })
}

// ============================================================================
// PUBLICATION BOOKS MANAGEMENT
// ============================================================================

/**
 * Get all books-old for a publication
 */
export async function getPublicationBooks(publicationId: string) {
  return prisma.bookPublication.findMany({
    where: { publicationId },
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
      book: {
        createdAt: 'desc',
      },
    },
  })
}