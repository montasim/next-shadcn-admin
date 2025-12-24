'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'
import { uploadFile, deleteFile } from '@/lib/google-drive'
import { config } from '@/config'

// Repository imports
import {
  getAuthors as getAuthorsFromDb,
  getAuthorById as getAuthorByIdFromDb,
  createAuthor as createAuthorInDb,
  updateAuthor as updateAuthorInDb,
  deleteAuthor as deleteAuthorFromDb,
  authorNameExists,
} from '@/lib/lms/repositories/author.repository'

// ============================================================================
// SCHEMAS
// ============================================================================

const authorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  entryDate: z.string(),
  entryBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const createAuthorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.union([z.string(), z.any()]).optional(),
})

const updateAuthorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.union([z.string(), z.any()]).optional(),
})

// Types
export type Author = z.infer<typeof authorSchema>
export type CreateAuthorData = z.infer<typeof createAuthorSchema>
export type UpdateAuthorData = z.infer<typeof updateAuthorSchema>

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get all authors
 */
export async function getAuthors() {
  try {
    const result = await getAuthorsFromDb()

    // Transform data for UI
    return result.authors.map(author => {
      // Handle entryBy - check if it exists and has required properties
      let entryByName = 'Unknown'
      if (author.entryBy && typeof author.entryBy === 'object') {
        const name = `${author.entryBy.firstName || ''} ${author.entryBy.lastName || ''}`.trim()
        entryByName = name || author.entryBy.email || 'Unknown'
      }

      return {
        id: author.id,
        name: author.name,
        description: author.description || '',
        image: author.image || '',
        entryDate: author.entryDate.toISOString(),
        entryBy: entryByName,
        entryById: author.entryBy?.id,
        createdAt: author.createdAt.toISOString(),
        updatedAt: author.updatedAt.toISOString(),
        bookCount: author._count.books,
      }
    })
  } catch (error) {
    console.error('Error fetching authors:', error)
    return []
  }
}

/**
 * Get author by ID
 */
export async function getAuthorById(id: string) {
  try {
    const author = await getAuthorByIdFromDb(id)

    if (!author) {
      throw new Error('Author not found')
    }

    // Handle entryBy - check if it exists and has required properties
    let entryByName = 'Unknown'
    if (author.entryBy && typeof author.entryBy === 'object') {
      const name = `${author.entryBy.firstName || ''} ${author.entryBy.lastName || ''}`.trim()
      entryByName = name || author.entryBy.email || 'Unknown'
    }

    return {
      id: author.id,
      name: author.name,
      description: author.description || '',
      image: author.image || '',
      entryDate: author.entryDate.toISOString(),
      entryBy: entryByName,
      entryById: author.entryBy?.id,
      createdAt: author.createdAt.toISOString(),
      updatedAt: author.updatedAt.toISOString(),
      books: author.books.map(bookAuthor => ({
        id: bookAuthor.book.id,
        name: bookAuthor.book.name,
        type: bookAuthor.book.type,
        image: bookAuthor.book.image || '',
      })),
    }
  } catch (error) {
    console.error('Error fetching author:', error)
    throw error
  }
}

/**
 * Create a new author
 */
export async function createAuthor(formData: FormData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: formData.get('image'),
    }

    const validatedData = createAuthorSchema.parse(rawData)

    // Check if author name already exists
    const nameExists = await authorNameExists(validatedData.name)
    if (nameExists) {
      throw new Error('An author with this name already exists')
    }

    // Handle file upload
    let imageUrl = null
    if (validatedData.image instanceof File) {
      const uploadResult = await uploadFile(validatedData.image, config.google.driveFolderId)
      imageUrl = uploadResult.previewUrl
    } else if (typeof validatedData.image === 'string') {
      imageUrl = validatedData.image
    }

    // Create author
    await createAuthorInDb({
      name: validatedData.name,
      description: validatedData.description,
      image: imageUrl || undefined,
      entryById: session.userId,
    })

    revalidatePath('/dashboard/authors')
    return { message: 'Author created successfully' }
  } catch (error) {
    console.error('Error creating author:', error)
    throw error || new Error('Failed to create author')
  }
}

/**
 * Update an author
 */
export async function updateAuthor(id: string, formData: FormData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    // Get existing author to handle file deletions
    const existingAuthor = await getAuthorByIdFromDb(id)
    if (!existingAuthor) {
      throw new Error('Author not found')
    }

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: formData.get('image'),
    }

    const validatedData = updateAuthorSchema.parse(rawData)

    // Check if author name already exists (excluding current author)
    const nameExists = await authorNameExists(validatedData.name, id)
    if (nameExists) {
      throw new Error('An author with this name already exists')
    }

    // Handle file upload and deletion
    let imageUrl = existingAuthor.image
    if (validatedData.image instanceof File) {
      // Upload new file
      const uploadResult = await uploadFile(validatedData.image, config.google.driveFolderId)
      imageUrl = uploadResult.previewUrl
      // Delete old file if it exists
      if (existingAuthor.image) {
        await deleteFile(existingAuthor.image)
      }
    } else if (validatedData.image === '' || validatedData.image === null) {
      // If image is explicitly removed
      if (existingAuthor.image) {
        await deleteFile(existingAuthor.image)
      }
      imageUrl = null
    } else if (typeof validatedData.image === 'string') {
      // Keep existing URL
      imageUrl = validatedData.image
    }

    // Update author
    await updateAuthorInDb(id, {
      name: validatedData.name,
      description: validatedData.description,
      image: imageUrl || undefined,
    })

    revalidatePath('/dashboard/authors')
    return { message: 'Author updated successfully' }
  } catch (error) {
    console.error('Error updating author:', error)
    throw error || new Error('Failed to update author')
  }
}

/**
 * Delete an author
 */
export async function deleteAuthor(id: string) {
  try {
    // Get existing author to handle file deletions
    const existingAuthor = await getAuthorByIdFromDb(id)
    if (existingAuthor && existingAuthor.image) {
      await deleteFile(existingAuthor.image)
    }

    await deleteAuthorFromDb(id)
    revalidatePath('/dashboard/authors')
    return { message: 'Author deleted successfully' }
  } catch (error) {
    console.error('Error deleting author:', error)
    throw error || new Error('Failed to delete author')
  }
}

/**
 * Check author name availability
 */
export async function checkAuthorNameAvailability(name: string, excludeId?: string) {
  try {
    const exists = await authorNameExists(name, excludeId)

    if (exists) {
      return { isAvailable: false, error: 'Author name already exists.' }
    }

    return { isAvailable: true }
  } catch (error) {
    console.error('Error checking author name availability:', error)
    return { isAvailable: false, error: 'Failed to validate author name.' }
  }
}
