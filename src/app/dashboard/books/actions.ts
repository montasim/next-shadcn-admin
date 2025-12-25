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
  // Validate image format (PNG only)
  if (data.image instanceof File && data.image.type !== 'image/png') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only PNG images are allowed',
      path: ['image'],
    });
  }

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
  // Validate image format (PNG only)
  if (data.image instanceof File && data.image.type !== 'image/png') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only PNG images are allowed',
      path: ['image'],
    });
  }

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
          directImageUrl: book.directImageUrl || null,
          type: book.type,
          bindingType: book.bindingType,
          pageNumber: book.pageNumber,
          fileUrl: book.fileUrl || '',
          directFileUrl: book.directFileUrl || null,
          summary: book.summary || '',
          extractedContent: book.extractedContent || null,
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
      directImageUrl: book.directImageUrl || null,
      type: book.type,
      bindingType: book.bindingType,
      pageNumber: book.pageNumber ? book.pageNumber.toString() : '',
      fileUrl: book.fileUrl || '',
      directFileUrl: book.directFileUrl || null,
      summary: book.summary || '',
      extractedContent: book.extractedContent || null,
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
    let directImageUrl = null
    if (validatedData.image instanceof File) {
      const uploadResult = await uploadFile(validatedData.image, config.google.driveFolderId)
      imageUrl = uploadResult.previewUrl
      directImageUrl = uploadResult.directUrl
    } else if (typeof validatedData.image === 'string') {
      imageUrl = validatedData.image
      // Generate direct URL if it's a Google Drive URL
      const fileIdMatch = imageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
      if (fileIdMatch) {
        directImageUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`
      }
    }

    let fileUrl = null
    let directFileUrl = null
    if (validatedData.fileUrl instanceof File) {
      const uploadResult = await uploadFile(validatedData.fileUrl, config.google.driveFolderId)
      fileUrl = uploadResult.previewUrl
      directFileUrl = uploadResult.directUrl
    } else if (typeof validatedData.fileUrl === 'string') {
      fileUrl = validatedData.fileUrl
      // Generate direct URL if it's a Google Drive URL
      const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
      if (fileIdMatch) {
        directFileUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`
      }
    }

    // Convert string values to appropriate types
    const processedData = {
      name: validatedData.name,
      image: imageUrl,
      directImageUrl: directImageUrl,
      type: validatedData.type,
      bindingType: validatedData.bindingType || null,
      pageNumber: validatedData.pageNumber ? parseInt(validatedData.pageNumber) : null,
      fileUrl: fileUrl,
      directFileUrl: directFileUrl,
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
    const createdBook = await createBookInDb(processedData)

    // Trigger content extraction for ebooks/audiobooks (wait for completion)
    if ((processedData.type === 'EBOOK' || processedData.type === 'AUDIO') && processedData.fileUrl) {
      console.log('[Book Actions] Waiting for content extraction...')
      await triggerAsyncContentExtraction(createdBook.id)
    }

    revalidatePath('/dashboard/books-old')
    return {
      message: 'Book created successfully',
      note: (processedData.type === 'EBOOK' || processedData.type === 'AUDIO')
        ? 'Book content is being prepared for AI chat. This may take 30-60 seconds.'
        : undefined
    }
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
    let directImageUrl = existingBook.directImageUrl
    if (validatedData.image instanceof File) {
      // Upload new file
      const uploadResult = await uploadFile(validatedData.image, config.google.driveFolderId)
      imageUrl = uploadResult.previewUrl
      directImageUrl = uploadResult.directUrl
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
      directImageUrl = null
    } else if (typeof validatedData.image === 'string') {
      // Keep existing URL
      imageUrl = validatedData.image
      // Generate direct URL if not present
      if (!directImageUrl) {
        const fileIdMatch = imageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
        if (fileIdMatch) {
          directImageUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`
        }
      }
    }

    let fileUrl = existingBook.fileUrl
    let directFileUrl = existingBook.directFileUrl
    if (validatedData.fileUrl instanceof File) {
      // Upload new file
      const uploadResult = await uploadFile(validatedData.fileUrl, config.google.driveFolderId)
      fileUrl = uploadResult.previewUrl
      directFileUrl = uploadResult.directUrl
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
      directFileUrl = null
    } else if (typeof validatedData.fileUrl === 'string') {
      // Keep existing URL
      fileUrl = validatedData.fileUrl
      // Generate direct URL if not present
      if (!directFileUrl) {
        const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
        if (fileIdMatch) {
          directFileUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`
        }
      }
    }

    // Convert string values to appropriate types
    const processedData = {
      name: validatedData.name,
      image: imageUrl,
      directImageUrl: directImageUrl,
      type: validatedData.type,
      bindingType: validatedData.bindingType || null,
      pageNumber: validatedData.pageNumber ? parseInt(validatedData.pageNumber) : null,
      fileUrl: fileUrl,
      directFileUrl: directFileUrl,
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

    // Check if file URL changed
    const fileChanged = existingBook.fileUrl !== fileUrl

    // Update book
    await updateBookInDb(id, processedData)

    // Clear content cache and trigger re-extraction if file changed
    if (fileChanged && (processedData.type === 'EBOOK' || processedData.type === 'AUDIO') && processedData.fileUrl) {
      // Import repository functions
      const { clearBookExtractedContent } = await import('@/lib/lms/repositories/book.repository')

      // Clear existing content to force re-extraction
      await clearBookExtractedContent(id)

      // Trigger extraction and wait for completion
      console.log('[Book Actions] File changed, waiting for content re-extraction...')
      await triggerAsyncContentExtraction(id)
    }

    revalidatePath('/dashboard/books-old')
    return {
      message: 'Book updated successfully',
      note: fileChanged && (processedData.type === 'EBOOK' || processedData.type === 'AUDIO')
        ? 'Book content is being re-prepared for AI chat. This may take 30-60 seconds.'
        : undefined
    }
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

/**
 * Trigger content extraction for a book and wait for completion
 * @param bookId - ID of the book to extract content from
 * @param timeoutMs - Maximum time to wait for extraction (default: 2 minutes)
 */
async function triggerAsyncContentExtraction(bookId: string, timeoutMs: number = 120000) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000'

  try {
    console.log(`[Book Actions] Starting content extraction for book: ${bookId}`)

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Extraction timeout')), timeoutMs)
    )

    // Start the extraction
    const extractionPromise = fetch(`${baseUrl}/api/books/${bookId}/extract-content`, {
      method: 'POST',
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Extraction failed')
      }
      return data
    })

    // Wait for either extraction to complete or timeout
    const result = await Promise.race([extractionPromise, timeoutPromise]) as any

    console.log(`[Book Actions] Content extraction completed successfully`)
    console.log(`[Book Actions] - Word count: ${result.wordCount}`)
    console.log(`[Book Actions] - Page count: ${result.pageCount}`)
    console.log(`[Book Actions] - Size: ${result.size} bytes`)

    return result
  } catch (error: any) {
    console.error('[Book Actions] Content extraction failed:', error.message)

    // Log error but don't throw - book is still created, just chat won't work immediately
    // The extraction will be triggered again when the first user opens chat
    if (error.message === 'Extraction timeout') {
      console.warn('[Book Actions] Extraction timed out. Will retry on first chat access.')
    }

    return null
  }
}
