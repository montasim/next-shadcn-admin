/**
 * Category Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Category model
 */

import { prisma } from '../../prisma'

// ============================================================================
// CATEGORY QUERIES
// ============================================================================

/**
 * Get all categories with pagination and search
 */
export async function getCategories(options: {
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

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
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
      orderBy: { name: 'asc' }, // Categories often sorted alphabetically
      skip,
      take: limit,
    }),
    prisma.category.count({ where }),
  ])

  return {
    categories,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit,
    },
  }
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
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
 * Check if category exists
 */
export async function categoryExists(id: string): Promise<boolean> {
  const count = await prisma.category.count({
    where: { id },
  })
  return count > 0
}

/**
 * Check if category name exists (excluding current category)
 */
export async function categoryNameExists(name: string, excludeId?: string): Promise<boolean> {
  const where = excludeId
    ? {
        name: { equals: name, mode: 'insensitive' as const },
        NOT: { id: excludeId },
      }
    : { name: { equals: name, mode: 'insensitive' as const } }

  const count = await prisma.category.count({ where })
  return count > 0
}

/**
 * Check if category is linked to books-old
 */
export async function isCategoryLinkedToBooks(id: string): Promise<boolean> {
  const count = await prisma.bookCategory.count({
    where: { categoryId: id },
  })
  return count > 0
}

/**
 * Get all categories (for dropdowns/multi-select)
 */
export async function getAllCategories() {
  return prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })
}

// ============================================================================
// CATEGORY MUTATIONS
// ============================================================================

/**
 * Create a new category
 */
export async function createCategory(data: {
  name: string
  description?: string
  image?: string
  directImageUrl?: string
  entryById: string
}) {
  const { entryById, ...categoryData } = data
  return prisma.category.create({
    data: {
      ...categoryData,
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
 * Update a category
 */
export async function updateCategory(
  id: string,
  data: {
    name?: string
    description?: string | null
    image?: string | null
    directImageUrl?: string | null
  }
) {
  return prisma.category.update({
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
 * Delete a category
 */
export async function deleteCategory(id: string) {
  // First check if category is linked to any books-old
  const isLinked = await isCategoryLinkedToBooks(id)
  if (isLinked) {
    throw new Error('Cannot delete category: linked to one or more books-old')
  }

  return prisma.category.delete({
    where: { id },
  })
}

// ============================================================================
// CATEGORY BOOKS MANAGEMENT
// ============================================================================

/**
 * Get all books-old for a category
 */
export async function getCategoryBooks(categoryId: string) {
  return prisma.bookCategory.findMany({
    where: { categoryId },
    include: {
      book: {
        include: {
          authors: {
            include: {
              author: true,
            },
          },
          publications: {
            include: {
              publication: true,
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