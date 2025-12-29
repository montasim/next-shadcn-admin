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
  getCategories as getCategoriesFromDb,
  getCategoryById as getCategoryByIdFromDb,
  createCategory as createCategoryInDb,
  updateCategory as updateCategoryInDb,
  deleteCategory as deleteCategoryFromDb,
  categoryNameExists,
  getAllCategories as getAllCategoriesFromDb,
} from '@/lib/lms/repositories/category.repository'

// ============================================================================
// SCHEMAS
// ============================================================================

const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  entryDate: z.string(),
  entryBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const createCategorySchema = z.object({
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

const updateCategorySchema = z.object({
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
export type Category = z.infer<typeof categorySchema>
export type CreateCategoryData = z.infer<typeof createCategorySchema>
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get all categories
 */
export async function getCategories() {
  try {
    const result = await getCategoriesFromDb()

    // Transform data for UI
    return result.categories.map(category => {
      // Handle entryBy - check if it exists and has required properties
      let entryByName = 'Unknown'
      if (category.entryBy && typeof category.entryBy === 'object') {
        const name = `${category.entryBy.firstName || ''} ${category.entryBy.lastName || ''}`.trim()
        entryByName = name || category.entryBy.email || 'Unknown'
      }

      return {
        id: category.id,
        name: category.name,
        description: category.description || '',
        image: category.image || '',
        entryDate: category.entryDate.toISOString(),
        entryBy: entryByName,
        entryById: category.entryBy?.id,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
        bookCount: category._count.books,
      }
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string) {
  try {
    const category = await getCategoryByIdFromDb(id)

    if (!category) {
      throw new Error('Category not found')
    }

    // Handle entryBy - check if it exists and has required properties
    let entryByName = 'Unknown'
    if (category.entryBy && typeof category.entryBy === 'object') {
      const name = `${category.entryBy.firstName || ''} ${category.entryBy.lastName || ''}`.trim()
      entryByName = name || category.entryBy.email || 'Unknown'
    }

    return {
      id: category.id,
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      entryDate: category.entryDate.toISOString(),
      entryBy: entryByName,
      entryById: category.entryBy?.id,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
      books: category.books.map(bookCategory => ({
        id: bookCategory.book.id,
        name: bookCategory.book.name,
        type: bookCategory.book.type,
        image: bookCategory.book.image || '',
      })),
    }
  } catch (error) {
    console.error('Error fetching category:', error)
    throw error
  }
}

/**
 * Get all categories (for dropdowns/multi-select)
 */
export async function getAllCategories() {
  try {
    return await getAllCategoriesFromDb()
  } catch (error) {
    console.error('Error fetching all categories:', error)
    return []
  }
}

/**
 * Create a new category
 */
export async function createCategory(formData: FormData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: formData.get('image'),
    }

    const validatedData = createCategorySchema.parse(rawData)

    // Check if category name already exists
    const nameExists = await categoryNameExists(validatedData.name)
    if (nameExists) {
      throw new Error('A category with this name already exists')
    }

    // Handle file upload
    let imageUrl = null
    if (validatedData.image instanceof File) {
      const uploadResult = await uploadFile(validatedData.image, config.google.driveFolderId)
      imageUrl = uploadResult.previewUrl
    } else if (typeof validatedData.image === 'string') {
      imageUrl = validatedData.image
    }

    // Create category
    const createdCategory = await createCategoryInDb({
      name: validatedData.name,
      description: validatedData.description,
      image: imageUrl || undefined,
      entryById: session.userId,
    })

    // Log category creation activity (non-blocking)
    logActivity({
      userId: session.userId,
      userRole: session.role as any,
      action: ActivityAction.CATEGORY_CREATED,
      resourceType: ActivityResourceType.CATEGORY,
      resourceId: createdCategory.id,
      resourceName: validatedData.name,
      description: `Created category "${validatedData.name}"`,
      endpoint: '/dashboard/categories/actions',
    }).catch(console.error)

    revalidatePath('/dashboard/categories')
    return { message: 'Category created successfully' }
  } catch (error) {
    console.error('Error creating category:', error)
    throw error || new Error('Failed to create category')
  }
}

/**
 * Update a category
 */
export async function updateCategory(id: string, formData: FormData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    // Get existing category to handle file deletions
    const existingCategory = await getCategoryByIdFromDb(id)
    if (!existingCategory) {
      throw new Error('Category not found')
    }

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: formData.get('image'),
    }

    const validatedData = updateCategorySchema.parse(rawData)

    // Check if category name already exists (excluding current category)
    const nameExists = await categoryNameExists(validatedData.name, id)
    if (nameExists) {
      throw new Error('A category with this name already exists')
    }

    // Handle file upload and deletion
    let imageUrl = existingCategory.image
    if (validatedData.image instanceof File) {
      // Upload new file
      const uploadResult = await uploadFile(validatedData.image, config.google.driveFolderId)
      imageUrl = uploadResult.previewUrl
      // Delete old file if it exists
      if (existingCategory.image) {
        await deleteFile(existingCategory.image)
      }
    } else if (validatedData.image === '' || validatedData.image === null) {
      // If image is explicitly removed
      if (existingCategory.image) {
        await deleteFile(existingCategory.image)
      }
      imageUrl = null
    } else if (typeof validatedData.image === 'string') {
      // Keep existing URL
      imageUrl = validatedData.image
    }

    // Update category
    await updateCategoryInDb(id, {
      name: validatedData.name,
      description: validatedData.description,
      image: imageUrl || undefined,
    })

    // Log category update activity (non-blocking)
    logActivity({
      userId: session.userId,
      userRole: session.role as any,
      action: ActivityAction.CATEGORY_UPDATED,
      resourceType: ActivityResourceType.CATEGORY,
      resourceId: id,
      resourceName: validatedData.name,
      description: `Updated category "${validatedData.name}"`,
      endpoint: '/dashboard/categories/actions',
    }).catch(console.error)

    revalidatePath('/dashboard/categories')
    return { message: 'Category updated successfully' }
  } catch (error) {
    console.error('Error updating category:', error)
    throw error || new Error('Failed to update category')
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string) {
  try {
    // Get authenticated user
    const session = await requireAuth()

    // Get existing category to handle file deletions
    const existingCategory = await getCategoryByIdFromDb(id)
    if (existingCategory) {
      if (existingCategory.image) {
        await deleteFile(existingCategory.image)
      }

      // Log category deletion activity (non-blocking)
      logActivity({
        userId: session.userId,
        userRole: session.role as any,
        action: ActivityAction.CATEGORY_DELETED,
        resourceType: ActivityResourceType.CATEGORY,
        resourceId: id,
        resourceName: existingCategory.name,
        description: `Deleted category "${existingCategory.name}"`,
        endpoint: '/dashboard/categories/actions',
      }).catch(console.error)
    }

    await deleteCategoryFromDb(id)
    revalidatePath('/dashboard/categories')
    return { message: 'Category deleted successfully' }
  } catch (error) {
    console.error('Error deleting category:', error)
    throw error || new Error('Failed to delete category')
  }
}

/**
 * Check category name availability
 */
export async function checkCategoryNameAvailability(name: string, excludeId?: string) {
  try {
    const exists = await categoryNameExists(name, excludeId)

    if (exists) {
      return { isAvailable: false, error: 'Category name already exists.' }
    }

    return { isAvailable: true }
  } catch (error) {
    console.error('Error checking category name availability:', error)
    return { isAvailable: false, error: 'Failed to validate category name.' }
  }
}
