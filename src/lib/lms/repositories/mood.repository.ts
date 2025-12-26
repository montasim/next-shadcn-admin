/**
 * Mood Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Mood model
 */

import { prisma } from '../../prisma'

// ============================================================================
// MOOD QUERIES
// ============================================================================

/**
 * Get all moods with pagination and search
 */
export async function getMoods(options: {
  page?: number
  search?: string
  limit?: number
  includeInactive?: boolean
} = {}) {
  const { page = 1, search = '', limit = 10, includeInactive = false } = options
  const skip = (page - 1) * limit

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { identifier: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(includeInactive ? {} : { isActive: true }),
  }

  const [moods, total] = await Promise.all([
    prisma.mood.findMany({
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
        mappings: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            mappings: true,
          },
        },
      },
      orderBy: { order: 'asc' },
      skip,
      take: limit,
    }),
    prisma.mood.count({ where }),
  ])

  return {
    moods,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit,
    },
  }
}

/**
 * Get mood by ID
 */
export async function getMoodById(id: string) {
  return prisma.mood.findUnique({
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
      mappings: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })
}

/**
 * Get mood by identifier
 */
export async function getMoodByIdentifier(identifier: string) {
  return prisma.mood.findUnique({
    where: { identifier },
    include: {
      mappings: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })
}

/**
 * Check if mood exists
 */
export async function moodExists(id: string): Promise<boolean> {
  const count = await prisma.mood.count({
    where: { id },
  })
  return count > 0
}

/**
 * Check if mood identifier exists (excluding current mood)
 */
export async function moodIdentifierExists(identifier: string, excludeId?: string): Promise<boolean> {
  const where = excludeId
    ? {
        identifier: { equals: identifier, mode: 'insensitive' as const },
        NOT: { id: excludeId },
      }
    : { identifier: { equals: identifier, mode: 'insensitive' as const } }

  const count = await prisma.mood.count({ where })
  return count > 0
}

/**
 * Get all active moods (for public API)
 */
export async function getActiveMoods() {
  return prisma.mood.findMany({
    where: { isActive: true },
    include: {
      mappings: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { order: 'asc' },
  })
}

// ============================================================================
// MOOD MUTATIONS
// ============================================================================

/**
 * Create a new mood
 */
export async function createMood(data: {
  identifier: string
  name: string
  emoji: string
  description: string
  color: string
  isActive?: boolean
  order?: number
  categoryIds?: string[]
  entryById: string
}) {
  const { entryById, categoryIds, ...moodData } = data

  return prisma.mood.create({
    data: {
      ...moodData,
      entryBy: {
        connect: { id: entryById },
      },
      ...(categoryIds && categoryIds.length > 0
        ? {
            mappings: {
              create: categoryIds.map((categoryId) => ({
                categoryId,
              })),
            },
          }
        : {}),
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
      mappings: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })
}

/**
 * Update a mood
 */
export async function updateMood(
  id: string,
  data: {
    identifier?: string
    name?: string
    emoji?: string
    description?: string
    color?: string
    isActive?: boolean
    order?: number
    categoryIds?: string[]
  }
) {
  const { categoryIds, ...moodData } = data

  // First, get existing mood to compare categories
  const existingMood = await prisma.mood.findUnique({
    where: { id },
    include: {
      mappings: {
        select: {
          categoryId: true,
        },
      },
    },
  })

  if (!existingMood) {
    throw new Error('Mood not found')
  }

  // Determine which categories to add and which to remove
  const existingCategoryIds = existingMood.mappings.map((m) => m.categoryId)
  const newCategoryIds = categoryIds || []

  const toAdd = newCategoryIds.filter((id) => !existingCategoryIds.includes(id))
  const toRemove = existingCategoryIds.filter((id) => !newCategoryIds.includes(id))

  // Update mood and manage category mappings in a transaction
  return await prisma.$transaction(async (tx) => {
    // Remove old mappings
    if (toRemove.length > 0) {
      await tx.moodCategoryMapping.deleteMany({
        where: {
          moodId: id,
          categoryId: { in: toRemove },
        },
      })
    }

    // Add new mappings
    if (toAdd.length > 0) {
      await tx.moodCategoryMapping.createMany({
        data: toAdd.map((categoryId) => ({
          moodId: id,
          categoryId,
        })),
      })
    }

    // Update mood
    return tx.mood.update({
      where: { id },
      data: moodData,
      include: {
        entryBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        mappings: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })
  })
}

/**
 * Delete a mood
 */
export async function deleteMood(id: string) {
  // Mappings will be automatically deleted due to cascade
  return prisma.mood.delete({
    where: { id },
  })
}

/**
 * Get categories for a mood
 */
export async function getMoodCategories(moodId: string) {
  const mappings = await prisma.moodCategoryMapping.findMany({
    where: { moodId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return mappings.map((m) => ({
    id: m.category.id,
    name: m.category.name,
  }))
}
