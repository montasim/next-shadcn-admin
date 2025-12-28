'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// ============================================================================
// SCHEMAS
// ============================================================================

const createSeriesSchema = z.object({
  name: z.string().min(1, 'Series name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
})

const updateSeriesSchema = z.object({
  name: z.string().min(1, 'Series name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
})

// Types
export type CreateSeriesData = z.infer<typeof createSeriesSchema>
export type UpdateSeriesData = z.infer<typeof updateSeriesSchema>
export type Series = {
  id: string
  name: string
  description: string | null
  image: string | null
  directImageUrl: string | null
  entryDate: string
  entryById: string
  createdAt: string
  updatedAt: string
  _count?: {
    books: number
  }
  entryBy?: {
    id: string
    firstName?: string | null
    lastName?: string | null
    email: string
  }
  books?: Array<{
    id: string
    name: string
    image: string | null
    type: string
    order: number
  }>
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get all series
 */
export async function getSeries() {
  try {
    const session = await requireAuth()

    const series = await prisma.series.findMany({
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
      orderBy: {
        name: 'asc',
      },
    })

    return series.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      image: s.image,
      directImageUrl: s.directImageUrl,
      entryDate: s.entryDate.toISOString(),
      entryById: s.entryById,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      _count: s._count,
      entryBy: s.entryBy,
    }))
  } catch (error) {
    console.error('Error fetching series:', error)
    throw error || new Error('Failed to fetch series')
  }
}

/**
 * Get series by ID
 */
export async function getSeriesById(id: string) {
  try {
    const session = await requireAuth()

    const series = await prisma.series.findUnique({
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

    if (!series) {
      throw new Error('Series not found')
    }

    return {
      id: series.id,
      name: series.name,
      description: series.description,
      image: series.image,
      directImageUrl: series.directImageUrl,
      entryDate: series.entryDate.toISOString(),
      entryById: series.entryById,
      createdAt: series.createdAt.toISOString(),
      updatedAt: series.updatedAt.toISOString(),
      _count: series._count,
      entryBy: series.entryBy,
      books: series.books.map(bs => ({
        id: bs.book.id,
        name: bs.book.name,
        image: bs.book.image,
        type: bs.book.type,
        order: bs.order,
      })),
    }
  } catch (error) {
    console.error('Error fetching series:', error)
    throw error || new Error('Failed to fetch series')
  }
}

/**
 * Create series
 */
export async function createSeries(formData: FormData) {
  try {
    const session = await requireAuth()

    // Extract form data
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const image = formData.get('image') as string | null

    // Validate
    const validatedData = createSeriesSchema.parse({
      name,
      description: description || undefined,
      image: image || undefined,
    })

    const series = await prisma.series.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        image: validatedData.image,
        entryById: session.userId,
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

    revalidatePath('/dashboard/series')
    return {
      message: 'Series created successfully',
    }
  } catch (error) {
    console.error('Error creating series:', error)
    throw error || new Error('Failed to create series')
  }
}

/**
 * Update series
 */
export async function updateSeries(id: string, formData: FormData) {
  try {
    const session = await requireAuth()

    // Extract form data
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const image = formData.get('image') as string | null

    // Validate
    const validatedData = updateSeriesSchema.parse({
      name,
      description: description || undefined,
      image: image || undefined,
    })

    const series = await prisma.series.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        image: validatedData.image,
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

    revalidatePath('/dashboard/series')
    return {
      message: 'Series updated successfully',
    }
  } catch (error) {
    console.error('Error updating series:', error)
    throw error || new Error('Failed to update series')
  }
}

/**
 * Delete series
 */
export async function deleteSeries(id: string) {
  try {
    const session = await requireAuth()

    await prisma.series.delete({
      where: { id },
    })

    revalidatePath('/dashboard/series')
    return {
      message: 'Series deleted successfully',
    }
  } catch (error) {
    console.error('Error deleting series:', error)
    throw error || new Error('Failed to delete series')
  }
}
