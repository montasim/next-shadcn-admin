/**
 * Book Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the Book model and its relationships
 */

import { prisma } from '../../prisma'
import { BookType, BindingType } from '@prisma/client'

// ============================================================================
// BOOK QUERIES
// ============================================================================

/**
 * Get all books-old with pagination and search
 */
export async function getBooks(options: {
  page?: number
  search?: string
  type?: BookType
  limit?: number
} = {}) {
  const { page = 1, search = '', type, limit = 10 } = options
  const skip = (page - 1) * limit

  const where: any = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      {
        authors: {
          some: {
            author: {
              name: { contains: search, mode: 'insensitive' as const }
            }
          }
        }
      },
      {
        publications: {
          some: {
            publication: {
              name: { contains: search, mode: 'insensitive' as const }
            }
          }
        }
      },
      {
        categories: {
          some: {
            category: {
              name: { contains: search, mode: 'insensitive' as const }
            }
          }
        }
      }
    ]
  }

  if (type) {
    where.type = type
  }

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      include: {
        authors: {
          include: {
            author: true,
          },
        },
        publications: {
          include: {
            publication: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        entryBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.book.count({ where }),
  ])

  return {
    books,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit,
    },
  }
}

/**
 * Get book by ID with full relationships
 */
export async function getBookById(id: string) {
  return prisma.book.findUnique({
    where: { id },
    include: {
      authors: {
        include: {
          author: true,
        },
      },
      publications: {
        include: {
          publication: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
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
}

/**
 * Check if book exists
 */
export async function bookExists(id: string): Promise<boolean> {
  const count = await prisma.book.count({
    where: { id },
  })
  return count > 0
}

// ============================================================================
// BOOK MUTATIONS
// ============================================================================

/**
 * Create a new book with relationships
 */
export async function createBook(data: {
  name: string
  image?: string
  directImageUrl?: string
  type: BookType
  bindingType?: BindingType | null
  pageNumber?: number | null
  fileUrl?: string | null
  directFileUrl?: string | null
  summary?: string
  buyingPrice?: number
  sellingPrice?: number
  numberOfCopies?: number
  purchaseDate?: Date
  isPublic?: boolean
  requiresPremium?: boolean
  entryById: string
  authorIds: string[]
  publicationIds: string[]
  categoryIds: string[]
}) {
  return await prisma.$transaction(async (tx) => {
    // Validate required fields
    if (!data.authorIds || data.authorIds.length === 0) {
      throw new Error('At least one author is required')
    }
    if (!data.publicationIds || data.publicationIds.length === 0) {
      throw new Error('At least one publication is required')
    }

    // Validate hard copy requirements
    if (data.type === 'HARD_COPY') {
      if (!data.numberOfCopies || data.numberOfCopies <= 0) {
        throw new Error('Number of copies is required for hard copy books-old')
      }
      if (!data.bindingType) {
        throw new Error('Binding type is required for hard copy books-old')
      }
      if (!data.pageNumber || data.pageNumber <= 0) {
        throw new Error('Page number is required for hard copy books-old')
      }
    } else if (data.type === 'EBOOK') {
      if (!data.pageNumber || data.pageNumber <= 0) {
        throw new Error('Page number is required for ebooks')
      }
      if (!data.fileUrl) {
        throw new Error('File URL is required for ebooks')
      }
    } else if (data.type === 'AUDIO') {
      if (!data.fileUrl) {
        throw new Error('File URL is required for audio books-old')
      }
    }

    // Create the book
    const { entryById, ...bookData } = data
    const book = await tx.book.create({
      data: {
        name: data.name,
        image: data.image,
        directImageUrl: data.directImageUrl,
        type: data.type,
        bindingType: data.type === 'HARD_COPY' ? data.bindingType : null,
        pageNumber: (data.type === 'HARD_COPY' || data.type === 'EBOOK') ? data.pageNumber : null,
        fileUrl: (data.type === 'EBOOK' || data.type === 'AUDIO') ? data.fileUrl : null,
        directFileUrl: (data.type === 'EBOOK' || data.type === 'AUDIO') ? data.directFileUrl : null,
        summary: data.summary,
        buyingPrice: data.buyingPrice,
        sellingPrice: data.sellingPrice,
        numberOfCopies: data.type === 'HARD_COPY' ? data.numberOfCopies : null,
        purchaseDate: data.purchaseDate,
        isPublic: data.isPublic,
        requiresPremium: data.requiresPremium,
        entryById: data.entryById,
      },
      // data: {
      //     ...bookData,
      //     entryBy: {
      //         connect: { id: entryById }
      //     }
      // },
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

    // Create author relationships
    await tx.bookAuthor.createMany({
      data: data.authorIds.map(authorId => ({
        bookId: book.id,
        authorId,
      })),
    })

    // Create publication relationships
    await tx.bookPublication.createMany({
      data: data.publicationIds.map(publicationId => ({
        bookId: book.id,
        publicationId,
      })),
    })

    // Create category relationships
    await tx.bookCategory.createMany({
      data: data.categoryIds.map(categoryId => ({
        bookId: book.id,
        categoryId,
      })),
    })

    // Return book with relationships
    return getBookById(book.id)
  })
}

/**
 * Update a book with relationships
 */
export async function updateBook(
  id: string,
  data: {
    name?: string
    image?: string | null
    directImageUrl?: string | null
    type?: BookType
    bindingType?: BindingType | null
    pageNumber?: number | null
    fileUrl?: string | null
    directFileUrl?: string | null
    summary?: string | null
    buyingPrice?: number | null
    sellingPrice?: number | null
    numberOfCopies?: number | null
    purchaseDate?: Date | null
    isPublic?: boolean | null
    requiresPremium?: boolean | null
    authorIds?: string[]
    publicationIds?: string[]
    categoryIds?: string[]
  }
) {
  return await prisma.$transaction(
    async (tx) => {
      // Validate existing book
      const existingBook = await tx.book.findUnique({
        where: { id },
      })

      if (!existingBook) {
        throw new Error('Book not found')
      }

      const updateType = data.type || existingBook.type

      // Validate hard copy requirements
      if (updateType === 'HARD_COPY') {
        const numberOfCopies = data.numberOfCopies ?? existingBook.numberOfCopies
        if (!numberOfCopies || numberOfCopies <= 0) {
          throw new Error('Number of copies is required for hard copy books-old')
        }

        const bindingType = data.bindingType ?? existingBook.bindingType
        if (!bindingType) {
          throw new Error('Binding type is required for hard copy books-old')
        }

        const pageNumber = data.pageNumber ?? existingBook.pageNumber
        if (!pageNumber || pageNumber <= 0) {
          throw new Error('Page number is required for hard copy books-old')
        }
      } else if (updateType === 'EBOOK') {
        const pageNumber = data.pageNumber ?? existingBook.pageNumber
        if (!pageNumber || pageNumber <= 0) {
          throw new Error('Page number is required for ebooks')
        }
        const fileUrl = data.fileUrl ?? existingBook.fileUrl
        if (!fileUrl) {
          throw new Error('File URL is required for ebooks')
        }
      } else if (updateType === 'AUDIO') {
        const fileUrl = data.fileUrl ?? existingBook.fileUrl
        if (!fileUrl) {
          throw new Error('File URL is required for audio books-old')
        }
      }

      // Update the book
      const updatedBook = await tx.book.update({
        where: { id },
        data: {
          name: data.name,
          image: data.image,
          directImageUrl: data.directImageUrl,
          type: updateType,
          bindingType: updateType === 'HARD_COPY'
            ? (data.bindingType ?? existingBook.bindingType)
            : null,
          pageNumber: (updateType === 'HARD_COPY' || updateType === 'EBOOK')
            ? (data.pageNumber ?? existingBook.pageNumber)
            : null,
          fileUrl: (updateType === 'EBOOK' || updateType === 'AUDIO')
            ? (data.fileUrl ?? existingBook.fileUrl)
            : null,
          directFileUrl: (updateType === 'EBOOK' || updateType === 'AUDIO')
            ? (data.directFileUrl ?? existingBook.directFileUrl)
            : null,
          summary: data.summary,
          buyingPrice: data.buyingPrice,
          sellingPrice: data.sellingPrice,
          numberOfCopies: updateType === 'HARD_COPY'
            ? (data.numberOfCopies ?? existingBook.numberOfCopies)
            : null,
          purchaseDate: data.purchaseDate,
          isPublic: data.isPublic,
          requiresPremium: data.requiresPremium,
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

      // Update author relationships if provided
      if (data.authorIds) {
        if (!data.authorIds || data.authorIds.length === 0) {
          throw new Error('At least one author is required')
        }

        // Delete existing relationships
        await tx.bookAuthor.deleteMany({
          where: { bookId: id },
        })

        // Create new relationships
        await tx.bookAuthor.createMany({
          data: data.authorIds.map(authorId => ({
            bookId: id,
            authorId,
          })),
        })
      }

      // Update publication relationships if provided
      if (data.publicationIds) {
        if (!data.publicationIds || data.publicationIds.length === 0) {
          throw new Error('At least one publication is required')
        }

        // Delete existing relationships
        await tx.bookPublication.deleteMany({
          where: { bookId: id },
        })

        // Create new relationships
        await tx.bookPublication.createMany({
          data: data.publicationIds.map(publicationId => ({
            bookId: id,
            publicationId,
          })),
        })
      }

      // Update category relationships if provided
      if (data.categoryIds) {
        // Delete existing relationships
        await tx.bookCategory.deleteMany({
          where: { bookId: id },
        })

        // Create new relationships
        if (data.categoryIds.length > 0) {
          await tx.bookCategory.createMany({
            data: data.categoryIds.map(categoryId => ({
              bookId: id,
              categoryId,
            })),
          })
        }
      }

      // Return the book ID - fetch the full book outside the transaction
      return { id }
    },
    {
      maxWait: 10000, // Increase timeout to 10 seconds
      timeout: 10000,
    }
  )

  // Fetch and return the updated book with all relationships outside the transaction
  return await getBookById(id)
}

/**
 * Delete a book (cascades to relationships)
 */
export async function deleteBook(id: string) {
  return await prisma.$transaction(async (tx) => {
    // Delete related records first (cascades should handle this, but being explicit)
    await tx.bookAuthor.deleteMany({
      where: { bookId: id },
    })

    await tx.bookPublication.deleteMany({
      where: { bookId: id },
    })

    await tx.bookCategory.deleteMany({
      where: { bookId: id },
    })

    // Delete the book
    return tx.book.delete({
      where: { id },
    })
  })
}

// ============================================================================
// BOOK RELATIONSHIP MANAGEMENT
// ============================================================================

/**
 * Get all authors for selection
 */
export async function getAllAuthors() {
  return prisma.author.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })
}

/**
 * Get all publications for selection
 */
export async function getAllPublications() {
  return prisma.publication.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })
}

/**
 * Get book types for selection
 */
export function getBookTypes() {
  return [
    { value: 'HARD_COPY', label: 'Hard Copy' },
    { value: 'EBOOK', label: 'eBook' },
    { value: 'AUDIO', label: 'Audio Book' },
  ]
}