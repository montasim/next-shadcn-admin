'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'
import { uploadFile, deleteFile } from '@/lib/google-drive'
import { config } from '@/config'
import { logActivity } from '@/lib/activity/logger'
import { ActivityAction, ActivityResourceType } from '@prisma/client'

// Repository imports
import {
  getPublications as getPublicationsFromDb,
  getPublicationById as getPublicationByIdFromDb,
  createPublication as createPublicationInDb,
  updatePublication as updatePublicationInDb,
  deletePublication as deletePublicationFromDb,
  publicationNameExists,
} from '@/lib/lms/repositories/publication.repository'

// ============================================================================
// SCHEMAS
// ============================================================================

const publicationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  entryDate: z.string(),
  entryBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const createPublicationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.union([z.string(), z.any()]).optional(),
}).superRefine((data, ctx) => {
  // Validate image format (PNG only)
  if (data.image instanceof File && data.image.type !== 'image/png') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only PNG images are allowed',
      path: ['image'],
    });
  }
});

const updatePublicationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.union([z.string(), z.any()]).optional(),
}).superRefine((data, ctx) => {
  // Validate image format (PNG only)
  if (data.image instanceof File && data.image.type !== 'image/png') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only PNG images are allowed',
      path: ['image'],
    });
  }
})

// Types
export type Publication = z.infer<typeof publicationSchema>
export type CreatePublicationData = z.infer<typeof createPublicationSchema>
export type UpdatePublicationData = z.infer<typeof updatePublicationSchema>

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get all publications
 */
export async function getPublications() {
  try {
    const result = await getPublicationsFromDb()

    // Transform data for UI
    return result.publications.map(publication => {
      // Handle entryBy - check if it exists and has required properties
      let entryByName = 'Unknown'
      if (publication.entryBy && typeof publication.entryBy === 'object') {
        const name = `${publication.entryBy.firstName || ''} ${publication.entryBy.lastName || ''}`.trim()
        entryByName = name || publication.entryBy.email || 'Unknown'
      }

      return {
        id: publication.id,
        name: publication.name,
        description: publication.description || '',
        image: publication.image || '',
        entryDate: publication.entryDate.toISOString(),
        entryBy: entryByName,
        entryById: publication.entryBy?.id,
        createdAt: publication.createdAt.toISOString(),
        updatedAt: publication.updatedAt.toISOString(),
        bookCount: publication._count.books,
      }
    })
  } catch (error) {
    console.error('Error fetching publications:', error)
    return []
  }
}

/**
 * Get publication by ID
 */
export async function getPublicationById(id: string) {
  try {
    const publication = await getPublicationByIdFromDb(id)

    if (!publication) {
      throw new Error('Publication not found')
    }

    // Handle entryBy - check if it exists and has required properties
    let entryByName = 'Unknown'
    if (publication.entryBy && typeof publication.entryBy === 'object') {
      const name = `${publication.entryBy.firstName || ''} ${publication.entryBy.lastName || ''}`.trim()
      entryByName = name || publication.entryBy.email || 'Unknown'
    }

    return {
      id: publication.id,
      name: publication.name,
      description: publication.description || '',
      image: publication.image || '',
      entryDate: publication.entryDate.toISOString(),
      entryBy: entryByName,
      entryById: publication.entryBy?.id,
      createdAt: publication.createdAt.toISOString(),
      updatedAt: publication.updatedAt.toISOString(),
      books: publication.books.map(bookPublication => ({
        id: bookPublication.book.id,
        name: bookPublication.book.name,
        type: bookPublication.book.type,
        image: bookPublication.book.image || '',
      })),
    }
  } catch (error) {
    console.error('Error fetching publication:', error)
    throw error
  }
}

/**
 * Create a new publication
 */
export async function createPublication(formData: FormData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    if (!session.userId) {
      throw new Error('Authentication failed: Invalid session')
    }

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: formData.get('image'),
    }

    const validatedData = createPublicationSchema.parse(rawData)

    // Check if publication name already exists
    const nameExists = await publicationNameExists(validatedData.name)
    if (nameExists) {
      throw new Error('A publication with this name already exists')
    }

    // Handle file upload
    let imageUrl = null
    if (validatedData.image instanceof File) {
      const uploadResult = await uploadFile(validatedData.image, config.google.driveFolderId)
      imageUrl = uploadResult.previewUrl
    } else if (typeof validatedData.image === 'string') {
      imageUrl = validatedData.image
    }

    // Create publication
    const createdPublication = await createPublicationInDb({
      name: validatedData.name,
      description: validatedData.description,
      image: imageUrl || undefined,
      entryById: session.userId,
    })

    // Log publication creation activity (non-blocking)
    logActivity({
      userId: session.userId,
      userRole: session.role as any,
      action: ActivityAction.PUBLICATION_CREATED,
      resourceType: ActivityResourceType.PUBLICATION,
      resourceId: createdPublication.id,
      resourceName: validatedData.name,
      description: `Created publication "${validatedData.name}"`,
      endpoint: '/dashboard/publications/actions',
    }).catch(console.error)

    revalidatePath('/dashboard/publications')
    return { message: 'Publication created successfully' }
  } catch (error) {
    console.error('Error creating publication:', error)
    throw error || new Error('Failed to create publication')
  }
}

/**
 * Update a publication
 */
export async function updatePublication(id: string, formData: FormData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    // Get existing publication to handle file deletions
    const existingPublication = await getPublicationByIdFromDb(id)
    if (!existingPublication) {
      throw new Error('Publication not found')
    }

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: formData.get('image'),
    }

    const validatedData = updatePublicationSchema.parse(rawData)

    // Check if publication name already exists (excluding current publication)
    const nameExists = await publicationNameExists(validatedData.name, id)
    if (nameExists) {
      throw new Error('A publication with this name already exists')
    }

    // Handle file upload and deletion
    let imageUrl = existingPublication.image
    if (validatedData.image instanceof File) {
      // Upload new file
      const uploadResult = await uploadFile(validatedData.image, config.google.driveFolderId)
      imageUrl = uploadResult.previewUrl
      // Delete old file if it exists
      if (existingPublication.image) {
        await deleteFile(existingPublication.image)
      }
    } else if (validatedData.image === '' || validatedData.image === null) {
      // If image is explicitly removed
      if (existingPublication.image) {
        await deleteFile(existingPublication.image)
      }
      imageUrl = null
    } else if (typeof validatedData.image === 'string') {
      // Keep existing URL
      imageUrl = validatedData.image
    }

    // Update publication
    await updatePublicationInDb(id, {
      name: validatedData.name,
      description: validatedData.description,
      image: imageUrl || undefined,
    })

    // Log publication update activity (non-blocking)
    logActivity({
      userId: session.userId,
      userRole: session.role as any,
      action: ActivityAction.PUBLICATION_UPDATED,
      resourceType: ActivityResourceType.PUBLICATION,
      resourceId: id,
      resourceName: validatedData.name,
      description: `Updated publication "${validatedData.name}"`,
      endpoint: '/dashboard/publications/actions',
    }).catch(console.error)

    revalidatePath('/dashboard/publications')
    return { message: 'Publication updated successfully' }
  } catch (error) {
    console.error('Error updating publication:', error)
    throw error || new Error('Failed to update publication')
  }
}

/**
 * Delete a publication
 */
export async function deletePublication(id: string) {
  try {
    // Get authenticated user
    const session = await requireAuth()

    // Get existing publication to handle file deletions
    const existingPublication = await getPublicationByIdFromDb(id)
    if (existingPublication) {
      if (existingPublication.image) {
        await deleteFile(existingPublication.image)
      }

      // Log publication deletion activity (non-blocking)
      logActivity({
        userId: session.userId,
        userRole: session.role as any,
        action: ActivityAction.PUBLICATION_DELETED,
        resourceType: ActivityResourceType.PUBLICATION,
        resourceId: id,
        resourceName: existingPublication.name,
        description: `Deleted publication "${existingPublication.name}"`,
        endpoint: '/dashboard/publications/actions',
      }).catch(console.error)
    }

    await deletePublicationFromDb(id)
    revalidatePath('/dashboard/publications')
    return { message: 'Publication deleted successfully' }
  } catch (error) {
    console.error('Error deleting publication:', error)
    throw error || new Error('Failed to delete publication')
  }
}

/**
 * Check publication name availability
 */
export async function checkPublicationNameAvailability(name: string, excludeId?: string) {
  try {
    const exists = await publicationNameExists(name, excludeId)

    if (exists) {
      return { isAvailable: false, error: 'Publication name already exists.' }
    }

    return { isAvailable: true }
  } catch (error) {
    console.error('Error checking publication name availability:', error)
    return { isAvailable: false, error: 'Failed to validate publication name.' }
  }
}
