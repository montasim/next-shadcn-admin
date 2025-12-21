'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'

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
  image: z.string().optional(),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO']),
  summary: z.string().optional(),
  buyingPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  numberOfCopies: z.string().optional(),
  purchaseDate: z.string().optional(),
  authorIds: z.array(z.string()).min(1, 'At least one author is required'),
  publicationIds: z.array(z.string()).min(1, 'At least one publication is required'),
  categoryIds: z.array(z.string()).optional(),
})

const updateBookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  image: z.string().optional(),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO']),
  summary: z.string().optional(),
  buyingPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  numberOfCopies: z.string().optional(),
  purchaseDate: z.string().optional(),
  authorIds: z.array(z.string()).min(1, 'At least one author is required'),
  publicationIds: z.array(z.string()).min(1, 'At least one publication is required'),
  categoryIds: z.array(z.string()).optional(),
})

// Types
export type Book = z.infer<typeof bookSchema>
export type CreateBookData = z.infer<typeof createBookSchema>
export type UpdateBookData = z.infer<typeof updateBookSchema>

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get all books
 */
export async function getBooks() {
  try {
    const result = await getBooksFromDb()

    // Transform data for UI
    return result.books.map(book => ({
      id: book.id,
      name: book.name,
      image: book.image || '',
      type: book.type,
      summary: book.summary || '',
      buyingPrice: book.buyingPrice,
      sellingPrice: book.sellingPrice,
      numberOfCopies: book.numberOfCopies,
      purchaseDate: book.purchaseDate?.toISOString() || null,
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
    }))
  } catch (error) {
    console.error('Error fetching books:', error)
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
      summary: book.summary || '',
      buyingPrice: book.buyingPrice,
      sellingPrice: book.sellingPrice,
      numberOfCopies: book.numberOfCopies,
      purchaseDate: book.purchaseDate?.toISOString() || null,
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
      image: formData.get('image') as string,
      type: formData.get('type') as 'HARD_COPY' | 'EBOOK' | 'AUDIO',
      summary: formData.get('summary') as string,
      buyingPrice: formData.get('buyingPrice') as string,
      sellingPrice: formData.get('sellingPrice') as string,
      numberOfCopies: formData.get('numberOfCopies') as string,
      purchaseDate: formData.get('purchaseDate') as string,
      authorIds: formData.getAll('authorIds') as string[],
      publicationIds: formData.getAll('publicationIds') as string[],
      categoryIds: formData.getAll('categoryIds') as string[],
    }

    const validatedData = createBookSchema.parse(rawData)

    // Convert string values to appropriate types
    const processedData = {
      name: validatedData.name,
      image: validatedData.image || null,
      type: validatedData.type,
      summary: validatedData.summary || null,
      buyingPrice: validatedData.buyingPrice ? parseFloat(validatedData.buyingPrice) : null,
      sellingPrice: validatedData.sellingPrice ? parseFloat(validatedData.sellingPrice) : null,
      numberOfCopies: validatedData.numberOfCopies ? parseInt(validatedData.numberOfCopies) : null,
      purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null,
      entryById: session.adminId,
      authorIds: validatedData.authorIds,
      publicationIds: validatedData.publicationIds,
      categoryIds: validatedData.categoryIds || [],
    }

    // Create book
    await createBookInDb(processedData)

    revalidatePath('/dashboard/books')
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

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      image: formData.get('image') as string,
      type: formData.get('type') as 'HARD_COPY' | 'EBOOK' | 'AUDIO',
      summary: formData.get('summary') as string,
      buyingPrice: formData.get('buyingPrice') as string,
      sellingPrice: formData.get('sellingPrice') as string,
      numberOfCopies: formData.get('numberOfCopies') as string,
      purchaseDate: formData.get('purchaseDate') as string,
      authorIds: formData.getAll('authorIds') as string[],
      publicationIds: formData.getAll('publicationIds') as string[],
      categoryIds: formData.getAll('categoryIds') as string[],
    }

    const validatedData = updateBookSchema.parse(rawData)

    // Convert string values to appropriate types
    const processedData = {
      name: validatedData.name,
      image: validatedData.image || null,
      type: validatedData.type,
      summary: validatedData.summary || null,
      buyingPrice: validatedData.buyingPrice ? parseFloat(validatedData.buyingPrice) : null,
      sellingPrice: validatedData.sellingPrice ? parseFloat(validatedData.sellingPrice) : null,
      numberOfCopies: validatedData.numberOfCopies ? parseInt(validatedData.numberOfCopies) : null,
      purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null,
      authorIds: validatedData.authorIds,
      publicationIds: validatedData.publicationIds,
      categoryIds: validatedData.categoryIds || [],
    }

    // Update book
    await updateBookInDb(id, processedData)

    revalidatePath('/dashboard/books')
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
    await deleteBookFromDb(id)
    revalidatePath('/dashboard/books')
    return { message: 'Book deleted successfully' }
  } catch (error) {
    console.error('Error deleting book:', error)
    throw error || new Error('Failed to delete book')
  }
}