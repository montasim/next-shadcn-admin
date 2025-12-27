'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'

// Repository imports
import {
  getMoods as getMoodsFromDb,
  getMoodById as getMoodByIdFromDb,
  createMood as createMoodInDb,
  updateMood as updateMoodInDb,
  deleteMood as deleteMoodFromDb,
  moodIdentifierExists,
} from '@/lib/lms/repositories/mood.repository'

// Import getCategories for category selection
import { getAllCategories } from '@/lib/lms/repositories/category.repository'

// ============================================================================
// SCHEMAS
// ============================================================================

const moodSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  name: z.string(),
  emoji: z.string(),
  description: z.string(),
  color: z.string(),
  isActive: z.boolean(),
  order: z.number(),
  categoryIds: z.array(z.string()),
  entryDate: z.string(),
  entryById: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const createMoodSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Identifier is required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
  name: z.string().min(1, 'Name is required'),
  emoji: z.string().min(1, 'Emoji is required'),
  description: z.string().min(1, 'Description is required'),
  color: z.string().min(1, 'Color is required'),
  isActive: z.boolean().default(true),
  order: z.number().default(0),
  categoryIds: z.array(z.string()).default([]),
})

const updateMoodSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Identifier is required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
  name: z.string().min(1, 'Name is required'),
  emoji: z.string().min(1, 'Emoji is required'),
  description: z.string().min(1, 'Description is required'),
  color: z.string().min(1, 'Color is required'),
  isActive: z.boolean(),
  order: z.number(),
  categoryIds: z.array(z.string()),
})

// Types
export type Mood = z.infer<typeof moodSchema>
export type CreateMoodData = z.infer<typeof createMoodSchema>
export type UpdateMoodData = z.infer<typeof updateMoodSchema>

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get all moods
 */
export async function getMoods() {
  try {
    const result = await getMoodsFromDb({ includeInactive: true })

    // Transform data for UI
    return result.moods.map((mood) => {
      // Handle entryBy - check if it exists and has required properties
      let entryByName = 'Unknown'
      if (mood.entryBy && typeof mood.entryBy === 'object') {
        const name = `${mood.entryBy.firstName || ''} ${mood.entryBy.lastName || ''}`.trim()
        entryByName = name || mood.entryBy.email || 'Unknown'
      }

      return {
        id: mood.id,
        identifier: mood.identifier,
        name: mood.name,
        emoji: mood.emoji,
        description: mood.description,
        color: mood.color,
        isActive: mood.isActive,
        order: mood.order,
        categoryIds: mood.mappings.map((m) => m.categoryId),
        categoryNames: mood.mappings.map((m) => m.category.name),
        categoryCount: mood._count.mappings,
        entryBy: entryByName,
        entryById: mood.entryBy?.id,
        createdAt: mood.createdAt.toISOString(),
        updatedAt: mood.updatedAt.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error fetching moods:', error)
    return []
  }
}

/**
 * Get mood by ID
 */
export async function getMoodById(id: string) {
  try {
    const mood = await getMoodByIdFromDb(id)

    if (!mood) {
      throw new Error('Mood not found')
    }

    // Handle entryBy - check if it exists and has required properties
    let entryByName = 'Unknown'
    if (mood.entryBy && typeof mood.entryBy === 'object') {
      const name = `${mood.entryBy.firstName || ''} ${mood.entryBy.lastName || ''}`.trim()
      entryByName = name || mood.entryBy.email || 'Unknown'
    }

    return {
      id: mood.id,
      identifier: mood.identifier,
      name: mood.name,
      emoji: mood.emoji,
      description: mood.description,
      color: mood.color,
      isActive: mood.isActive,
      order: mood.order,
      categoryIds: mood.mappings.map((m) => m.categoryId),
      categoryNames: mood.mappings.map((m) => m.category.name),
      entryBy: entryByName,
      entryById: mood.entryBy?.id,
      createdAt: mood.createdAt.toISOString(),
      updatedAt: mood.updatedAt.toISOString(),
    }
  } catch (error) {
    console.error('Error fetching mood:', error)
    throw error
  }
}

/**
 * Get all categories (for dropdown/multi-select)
 */
export async function getCategories() {
  try {
    return await getAllCategories()
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

/**
 * Create a new mood
 */
export async function createMood(data: CreateMoodData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    // Validate data
    const validatedData = createMoodSchema.parse(data)

    // Check if identifier already exists
    const identifierExists = await moodIdentifierExists(validatedData.identifier)
    if (identifierExists) {
      throw new Error('A mood with this identifier already exists')
    }

    // Create mood
    await createMoodInDb({
      ...validatedData,
      entryById: session.userId,
    })

    revalidatePath('/dashboard/moods')
    return { message: 'Mood created successfully' }
  } catch (error) {
    console.error('Error creating mood:', error)
    throw error || new Error('Failed to create mood')
  }
}

/**
 * Update a mood
 */
export async function updateMood(id: string, data: UpdateMoodData) {
  try {
    // Get authenticated admin
    await requireAuth()

    // Validate data
    const validatedData = updateMoodSchema.parse(data)

    // Check if identifier already exists (excluding current mood)
    const identifierExists = await moodIdentifierExists(validatedData.identifier, id)
    if (identifierExists) {
      throw new Error('A mood with this identifier already exists')
    }

    // Update mood
    await updateMoodInDb(id, validatedData)

    revalidatePath('/dashboard/moods')
    return { message: 'Mood updated successfully' }
  } catch (error) {
    console.error('Error updating mood:', error)
    throw error || new Error('Failed to update mood')
  }
}

/**
 * Delete a mood
 */
export async function deleteMood(id: string) {
  try {
    await requireAuth()

    await deleteMoodFromDb(id)
    revalidatePath('/dashboard/moods')
    return { message: 'Mood deleted successfully' }
  } catch (error) {
    console.error('Error deleting mood:', error)
    throw error || new Error('Failed to delete mood')
  }
}

/**
 * Check mood identifier availability
 */
export async function checkMoodIdentifierAvailability(identifier: string, excludeId?: string) {
  try {
    const exists = await moodIdentifierExists(identifier, excludeId)

    if (exists) {
      return { isAvailable: false, error: 'Mood identifier already exists.' }
    }

    return { isAvailable: true }
  } catch (error) {
    console.error('Error checking mood identifier availability:', error)
    return { isAvailable: false, error: 'Failed to validate mood identifier.' }
  }
}
