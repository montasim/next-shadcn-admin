'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'

// Repository imports
import {
  getNotices as getNoticesFromDb,
  getNoticeById as getNoticeByIdFromDb,
  createNotice as createNoticeInDb,
  updateNotice as updateNoticeInDb,
  deleteNotice as deleteNoticeFromDb,
} from '@/lib/lms/repositories/notice.repository'

// Import types from schema
import type {
  Notice,
  CreateNoticeData,
  UpdateNoticeData,
} from './data/schema'

// ============================================================================
// SCHEMAS
// ============================================================================

const createNoticeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  isActive: z.boolean().default(true),
  validFrom: z.string().nullable().default(null),
  validTo: z.string().nullable().default(null),
  order: z.number().default(0),
})

const updateNoticeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  isActive: z.boolean(),
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  order: z.number(),
})

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get all notices
 */
export async function getNotices(): Promise<Notice[]> {
  try {
    const result = await getNoticesFromDb({ includeInactive: true })

    // Transform data for UI
    return result.notices.map((notice) => {
      // Handle entryBy - check if it exists and has required properties
      let entryByName = 'Unknown'
      if (notice.entryBy && typeof notice.entryBy === 'object') {
        const name = `${notice.entryBy.firstName || ''} ${notice.entryBy.lastName || ''}`.trim()
        entryByName = name || notice.entryBy.email || 'Unknown'
      }

      return {
        id: notice.id,
        title: notice.title,
        content: notice.content,
        isActive: notice.isActive,
        validFrom: notice.validFrom?.toISOString() || null,
        validTo: notice.validTo?.toISOString() || null,
        order: notice.order,
        entryDate: notice.createdAt.toISOString(),
        entryBy: entryByName,
        entryById: notice.entryBy?.id,
        createdAt: notice.createdAt.toISOString(),
        updatedAt: notice.updatedAt.toISOString(),
      }
    })
  } catch (error) {
    console.error('Error fetching notices:', error)
    return []
  }
}

/**
 * Get notice by ID
 */
export async function getNoticeById(id: string): Promise<Notice> {
  try {
    const notice = await getNoticeByIdFromDb(id)

    if (!notice) {
      throw new Error('Notice not found')
    }

    // Handle entryBy - check if it exists and has required properties
    let entryByName = 'Unknown'
    if (notice.entryBy && typeof notice.entryBy === 'object') {
      const name = `${notice.entryBy.firstName || ''} ${notice.entryBy.lastName || ''}`.trim()
      entryByName = name || notice.entryBy.email || 'Unknown'
    }

    return {
      id: notice.id,
      title: notice.title,
      content: notice.content,
      isActive: notice.isActive,
      validFrom: notice.validFrom?.toISOString() || null,
      validTo: notice.validTo?.toISOString() || null,
      order: notice.order,
      entryDate: notice.createdAt.toISOString(),
      entryBy: entryByName,
      entryById: notice.entryBy?.id,
      createdAt: notice.createdAt.toISOString(),
      updatedAt: notice.updatedAt.toISOString(),
    }
  } catch (error) {
    console.error('Error fetching notice:', error)
    throw error
  }
}

/**
 * Create a new notice
 */
export async function createNotice(data: CreateNoticeData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    // Validate data
    const validatedData = createNoticeSchema.parse(data)

    // Parse dates if provided
    const validFrom = validatedData.validFrom ? new Date(validatedData.validFrom) : null
    const validTo = validatedData.validTo ? new Date(validatedData.validTo) : null

    // Create notice
    await createNoticeInDb({
      ...validatedData,
      validFrom,
      validTo,
      entryById: session.userId,
    })

    revalidatePath('/dashboard/notices')
    return { message: 'Notice created successfully' }
  } catch (error) {
    console.error('Error creating notice:', error)
    throw error || new Error('Failed to create notice')
  }
}

/**
 * Update a notice
 */
export async function updateNotice(id: string, data: UpdateNoticeData) {
  try {
    // Get authenticated admin
    await requireAuth()

    // Validate data
    const validatedData = updateNoticeSchema.parse(data)

    // Parse dates if provided
    const validFrom = validatedData.validFrom ? new Date(validatedData.validFrom) : null
    const validTo = validatedData.validTo ? new Date(validatedData.validTo) : null

    // Update notice
    await updateNoticeInDb(id, {
      ...validatedData,
      validFrom,
      validTo,
    })

    revalidatePath('/dashboard/notices')
    return { message: 'Notice updated successfully' }
  } catch (error) {
    console.error('Error updating notice:', error)
    throw error || new Error('Failed to update notice')
  }
}

/**
 * Delete a notice
 */
export async function deleteNotice(id: string) {
  try {
    await requireAuth()

    await deleteNoticeFromDb(id)
    revalidatePath('/dashboard/notices')
    return { message: 'Notice deleted successfully' }
  } catch (error) {
    console.error('Error deleting notice:', error)
    throw error || new Error('Failed to delete notice')
  }
}
