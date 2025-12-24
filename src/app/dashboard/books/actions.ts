'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'
import { uploadFile, deleteFile } from '@/lib/google-drive'
import { config } from '@/config'

// Repository imports
import {
  getBooks as getBooksFromDb,
  getBookById as getBookByIdFromDb,
  createBook as createBookInDb,
  updateBook as updateBookInDb,
  deleteBook as deleteBookFromDb,
  getAllAuthors,
  getAllPublications,
  getBookTypes,
} from '@/lib/lms/repositories/book.repository'
import { getAllCategories } from '../categories/actions'

// ============================================================================
// SCHEMAS
// ============================================================================

const bookSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  image: z.string().optional(),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO']),
  summary: z.string().optional(),
  buyingPrice: z.number().nullable(),
  sellingPrice: z.number().nullable(),
  numberOfCopies: z.number().nullable(),
  purchaseDate: z.string().nullable(),
  entryDate: z.string(),
  entryBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  authors: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
  publications: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
})

const createBookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  image: z.union([z.string(), z.any()]).optional(),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO']),
  bindingType: z.enum(['HARDCOVER', 'PAPERBACK']).optional().nullable(),
  pageNumber: z.string().optional().nullable(),
  fileUrl: z.union([z.string(), z.any()]).optional().nullable(),
  summary: z.string().optional(),
  buyingPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  numberOfCopies: z.string().optional(),
  purchaseDate: z.string().optional(),
  authorIds: z.array(z.string()).min(1, 'At least one author is required'),
  publicationIds: z.array(z.string()).min(1, 'At least one publication is required'),
  categoryIds: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
  requiresPremium: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.type === 'HARD_COPY') {
    if (!data.bindingType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Binding type is required for hard copy books-old',
        path: ['bindingType'],
      });
    }
    if (!data.pageNumber || isNaN(Number(data.pageNumber)) || Number(data.pageNumber) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page number is required and must be a positive number',
        path: ['pageNumber'],
      });
    }
  } else if (data.type === 'EBOOK') {
    if (!data.pageNumber || isNaN(Number(data.pageNumber)) || Number(data.pageNumber) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page number is required and must be a positive number',
        path: ['pageNumber'],
      });
    }
    if (!data.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File is required for eBooks',
        path: ['fileUrl'],
      });
    }
  } else if (data.type === 'AUDIO') {
    if (!data.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File is required for audio books-old',
        path: ['fileUrl'],
      });
    }
  }
});

const updateBookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  image: z.union([z.string(), z.any()]).optional(),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO']),
  bindingType: z.enum(['HARDCOVER', 'PAPERBACK']).optional().nullable(),
  pageNumber: z.string().optional().nullable(),
  fileUrl: z.union([z.string(), z.any()]).optional().nullable(),
  summary: z.string().optional(),
  buyingPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  numberOfCopies: z.string().optional(),
  purchaseDate: z.string().optional(),
  authorIds: z.array(z.string()).min(1, 'At least one author is required'),
  publicationIds: z.array(z.string()).min(1, 'At least one publication is required'),
  categoryIds: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
  requiresPremium: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.type === 'HARD_COPY') {
    if (!data.bindingType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Binding type is required for hard copy books-old',
        path: ['bindingType'],
      });
    }
    if (!data.pageNumber || isNaN(Number(data.pageNumber)) || Number(data.pageNumber) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page number is required and must be a positive number',
        path: ['pageNumber'],
      });
    }
  } else if (data.type === 'EBOOK') {
    if (!data.pageNumber || isNaN(Number(data.pageNumber)) || Number(data.pageNumber) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page number is required and must be a positive number',
        path: ['pageNumber'],
      });
    }
    if (!data.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File is required for eBooks',
        path: ['fileUrl'],
      });
    }
  } else if (data.type === 'AUDIO') {
    if (!data.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File is required for audio books-old',
        path: ['fileUrl'],
      });
    }
  }
});

// Types
export type Book = z.infer<typeof bookSchema>
export type CreateBookData = z.infer<typeof createBookSchema>
export type UpdateBookData = z.infer<typeof updateBookSchema>

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get all books-old
 */
export async function getBooks() {
  try {
    const result = await getBooksFromDb()

    // Transform data for UI
    return result.books.map(book => {
        // Handle entryBy - check if it exists and has required properties
        let entryByName = 'Unknown'
        if (book.entryBy && typeof book.entryBy === 'object') {
            const name = `${book.entryBy.firstName || ''} ${book.entryBy.lastName || ''}`.trim()
            entryByName = name || book.entryBy.email || 'Unknown'
        }

      return {
          id: book.id,
          name: book.name,
          image: book.image || '',
          type: book.type,
          bindingType: book.bindingType,
          pageNumber: book.pageNumber,
          fileUrl: book.fileUrl || '',
          summary: book.summary || '',
          buyingPrice: book.buyingPrice,
          sellingPrice: book.sellingPrice,
          numberOfCopies: book.numberOfCopies,
          purchaseDate: book.purchaseDate?.toISOString() || null,
          isPublic: book.isPublic ?? false,
          requiresPremium: book.requiresPremium ?? false,
          entryDate: book.entryDate.toISOString(),
          entryBy: entryByName,
          entryById: book.entryBy.id,
          createdAt: book.createdAt.toISOString(),
          updatedAt: book.updatedAt.toISOString(),
          authors: book.authors.map(bookAuthor => ({
              id: bookAuthor.author.id,
              name: bookAuthor.author.name,
          })),
          publications: book.publications.map(bookPublication => ({
              id: bookPublication.publication.id,
              name: bookPublication.publication.name,
          })),
          categories: book.categories.map(bookCategory => ({
              id: bookCategory.category.id,
              name: bookCategory.category.name,
          }))
      };
    })
  } catch (error) {
    console.error('Error fetching books-old:', error)
    return []
  }
}

/**
 * Get book by ID
 */
export async function getBookById(id: string) {
  try {
    const book = await getBookByIdFromDb(id)

    if (!book) {
      throw new Error('Book not found')
    }

    return {
      id: book.id,
      name: book.name,
      image: book.image || '',
      type: book.type,
      bindingType: book.bindingType,
      pageNumber: book.pageNumber ? book.pageNumber.toString() : '',
      fileUrl: book.fileUrl || '',
      summary: book.summary || '',
      buyingPrice: book.buyingPrice,
      sellingPrice: book.sellingPrice,
      numberOfCopies: book.numberOfCopies,
      purchaseDate: book.purchaseDate?.toISOString() || null,
      isPublic: book.isPublic ?? false,
      entryDate: book.entryDate.toISOString(),
      entryBy: `${book.entryBy.firstName} ${book.entryBy.lastName}`.trim() || book.entryBy.email,
      entryById: book.entryBy.id,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
      authors: book.authors.map(bookAuthor => ({
        id: bookAuthor.author.id,
        name: bookAuthor.author.name,
      })),
      publications: book.publications.map(bookPublication => ({
        id: bookPublication.publication.id,
        name: bookPublication.publication.name,
      })),
      categories: book.categories.map(bookCategory => ({
        id: bookCategory.category.id,
        name: bookCategory.category.name,
      })),
      authorIds: book.authors.map(bookAuthor => bookAuthor.author.id),
      publicationIds: book.publications.map(bookPublication => bookPublication.publication.id),
      categoryIds: book.categories.map(bookCategory => bookCategory.category.id),
    }
  } catch (error) {
    console.error('Error fetching book:', error)
    throw error
  }
}

/**
 * Get all authors for selection
 */
export async function getAuthorsForSelect() {
  try {
    return await getAllAuthors()
  } catch (error) {
    console.error('Error fetching authors for select:', error)
    return []
  }
}

/**
 * Get all publications for selection
 */
export async function getPublicationsForSelect() {
  try {
    return await getAllPublications()
  } catch (error) {
    console.error('Error fetching publications for select:', error)
    return []
  }
}

/**
 * Get all categories for selection
 */
export async function getCategoriesForSelect() {
  try {
    return await getAllCategories()
  } catch (error) {
    console.error('Error fetching categories for select:', error)
    return []
  }
}

/**
 * Get book types for selection
 */
export async function getBookTypesForSelect() {
  try {
    return getBookTypes()
  } catch (error) {
    console.error('Error fetching book types:', error)
    return []
  }
}

/**
 * Create a new book
 */
export async function createBook(formData: FormData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      image: formData.get('image'),
      type: formData.get('type') as 'HARD_COPY' | 'EBOOK' | 'AUDIO',
      bindingType: formData.get('bindingType') as 'HARDCOVER' | 'PAPERBACK' | undefined | null,
      pageNumber: formData.get('pageNumber') as string | undefined | null,
      fileUrl: formData.get('fileUrl'),
      summary: formData.get('summary') as string,
      buyingPrice: formData.get('buyingPrice') as string,
      sellingPrice: formData.get('sellingPrice') as string,
      numberOfCopies: formData.get('numberOfCopies') as string,
      purchaseDate: formData.get('purchaseDate') as string,
      isPublic: formData.get('isPublic') === 'true',
      requiresPremium: formData.get('requiresPremium') === 'true',
      authorIds: formData.getAll('authorIds') as string[],
      publicationIds: formData.getAll('publicationIds') as string[],
      categoryIds: formData.getAll('categoryIds') as string[],
    }

    // Handle null/undefined values for optional fields
    if (!rawData.bindingType) rawData.bindingType = null;
    if (!rawData.pageNumber) rawData.pageNumber = null;
    if (!rawData.fileUrl) rawData.fileUrl = null;

    const validatedData = createBookSchema.parse(rawData)

    // Handle file uploads
    let imageUrl = null
    if (validatedData.image instanceof File) {
      imageUrl = await uploadFile(validatedData.image, config.google.driveFolderId)
    } else if (typeof validatedData.image === 'string') {
      imageUrl = validatedData.image
    }

    let fileUrl = null
    if (validatedData.fileUrl instanceof File) {
      fileUrl = await uploadFile(validatedData.fileUrl, config.google.driveFolderId)
    } else if (typeof validatedData.fileUrl === 'string') {
      fileUrl = validatedData.fileUrl
    }

    // Convert string values to appropriate types
    const processedData = {
      name: validatedData.name,
      image: imageUrl,
      type: validatedData.type,
      bindingType: validatedData.bindingType || null,
      pageNumber: validatedData.pageNumber ? parseInt(validatedData.pageNumber) : null,
      fileUrl: fileUrl,
      summary: validatedData.summary || null,
      buyingPrice: validatedData.buyingPrice ? parseFloat(validatedData.buyingPrice) : null,
      sellingPrice: validatedData.sellingPrice ? parseFloat(validatedData.sellingPrice) : null,
      numberOfCopies: validatedData.numberOfCopies ? parseInt(validatedData.numberOfCopies) : null,
      purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null,
      isPublic: validatedData.isPublic,
      requiresPremium: validatedData.requiresPremium,
      entryById: session.userId,
      authorIds: validatedData.authorIds,
      publicationIds: validatedData.publicationIds,
      categoryIds: validatedData.categoryIds || [],
    }

    // Create book
    await createBookInDb(processedData)

    revalidatePath('/dashboard/books-old')
    return { message: 'Book created successfully' }
  } catch (error) {
    console.error('Error creating book:', error)
    throw error || new Error('Failed to create book')
  }
}

/**
 * Update a book
 */
export async function updateBook(id: string, formData: FormData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    // Get existing book to handle file deletions
    const existingBook = await getBookByIdFromDb(id)
    if (!existingBook) {
      throw new Error('Book not found')
    }

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      image: formData.get('image'),
      type: formData.get('type') as 'HARD_COPY' | 'EBOOK' | 'AUDIO',
      bindingType: formData.get('bindingType') as 'HARDCOVER' | 'PAPERBACK' | undefined | null,
      pageNumber: formData.get('pageNumber') as string | undefined | null,
      fileUrl: formData.get('fileUrl'),
      summary: formData.get('summary') as string,
      buyingPrice: formData.get('buyingPrice') as string,
      sellingPrice: formData.get('sellingPrice') as string,
      numberOfCopies: formData.get('numberOfCopies') as string,
      purchaseDate: formData.get('purchaseDate') as string,
      isPublic: formData.get('isPublic') === 'true',
      requiresPremium: formData.get('requiresPremium') === 'true',
      authorIds: formData.getAll('authorIds') as string[],
      publicationIds: formData.getAll('publicationIds') as string[],
      categoryIds: formData.getAll('categoryIds') as string[],
    }

    // Handle null/undefined values for optional fields
    if (!rawData.bindingType) rawData.bindingType = null;
    if (!rawData.pageNumber) rawData.pageNumber = null;
    if (!rawData.fileUrl) rawData.fileUrl = null;

    const validatedData = updateBookSchema.parse(rawData)

    // Handle file uploads and deletions
    let imageUrl = existingBook.image
    if (validatedData.image instanceof File) {
      // Upload new file
      imageUrl = await uploadFile(validatedData.image, config.google.driveFolderId)
      // Delete old file if it exists
      if (existingBook.image) {
        await deleteFile(existingBook.image)
      }
    } else if (validatedData.image === '' || validatedData.image === null) {
      // If image is explicitly removed
      if (existingBook.image) {
        await deleteFile(existingBook.image)
      }
      imageUrl = null
    } else if (typeof validatedData.image === 'string') {
      // Keep existing URL
      imageUrl = validatedData.image
    }

    let fileUrl = existingBook.fileUrl
    if (validatedData.fileUrl instanceof File) {
      // Upload new file
      fileUrl = await uploadFile(validatedData.fileUrl, config.google.driveFolderId)
      // Delete old file if it exists
      if (existingBook.fileUrl) {
        await deleteFile(existingBook.fileUrl)
      }
    } else if (validatedData.fileUrl === '' || validatedData.fileUrl === null) {
      // If file is explicitly removed
      if (existingBook.fileUrl) {
        await deleteFile(existingBook.fileUrl)
      }
      fileUrl = null
    } else if (typeof validatedData.fileUrl === 'string') {
      // Keep existing URL
      fileUrl = validatedData.fileUrl
    }

    // Convert string values to appropriate types
    const processedData = {
      name: validatedData.name,
      image: imageUrl,
      type: validatedData.type,
      bindingType: validatedData.bindingType || null,
      pageNumber: validatedData.pageNumber ? parseInt(validatedData.pageNumber) : null,
      fileUrl: fileUrl,
      summary: validatedData.summary || null,
      buyingPrice: validatedData.buyingPrice ? parseFloat(validatedData.buyingPrice) : null,
      sellingPrice: validatedData.sellingPrice ? parseFloat(validatedData.sellingPrice) : null,
      numberOfCopies: validatedData.numberOfCopies ? parseInt(validatedData.numberOfCopies) : null,
      purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null,
      isPublic: validatedData.isPublic,
      requiresPremium: validatedData.requiresPremium,
      authorIds: validatedData.authorIds,
      publicationIds: validatedData.publicationIds,
      categoryIds: validatedData.categoryIds || [],
    }

    // Update book
    await updateBookInDb(id, processedData)

    revalidatePath('/dashboard/books-old')
    return { message: 'Book updated successfully' }
  } catch (error) {
    console.error('Error updating book:', error)
    throw error || new Error('Failed to update book')
  }
}

/**
 * Delete a book
 */
export async function deleteBook(id: string) {
  try {
    // Get existing book to handle file deletions
    const existingBook = await getBookByIdFromDb(id)
    if (existingBook) {
      if (existingBook.image) {
        await deleteFile(existingBook.image)
      }
      if (existingBook.fileUrl) {
        await deleteFile(existingBook.fileUrl)
      }
    }

    await deleteBookFromDb(id)
    revalidatePath('/dashboard/books-old')
    return { message: 'Book deleted successfully' }
  } catch (error) {
    console.error('Error deleting book:', error)
    throw error || new Error('Failed to delete book')
  }
}
