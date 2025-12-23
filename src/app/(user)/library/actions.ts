'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'
import { uploadFile } from '@/lib/google-drive'

const bookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  author: z.string().min(1, 'Author is required'),
  type: z.enum(['EBOOK', 'AUDIO']),
  isPublic: z.boolean().default(false),
})

export async function createBook(formData: FormData) {
  try {
    const session = await requireAuth()
    if (!session) {
      return { success: false, message: 'Not authenticated' }
    }

    const name = formData.get('name') as string
    const authorName = formData.get('author') as string
    const type = formData.get('type') as 'EBOOK' | 'AUDIO'
    const isPublic = formData.get('isPublic') === 'on'
    
    const validation = bookSchema.safeParse({
      name,
      author: authorName,
      type,
      isPublic
    })

    if (!validation.success) {
      return { success: false, message: validation.error.errors[0].message }
    }

    // Check if book already exists for this user
    const existingBook = await prisma.book.findFirst({
        where: {
            name: validation.data.name,
            type: validation.data.type,
            entryById: session.userId,
        }
    })

    if (existingBook) {
        return { success: false, message: 'This book already exists in your uploads.' }
    }

    // Upload file to Google Drive
    const file = formData.get('file') as File
    let fileUrl: string | null = null
    if (file && file.size > 0) {
      fileUrl = await uploadFile(file, process.env.GOOGLE_DRIVE_FOLDER_ID)
    }

    // Upload image to Google Drive
    const image = formData.get('image') as File
    let imageUrl: string | null = null
    if (image && image.size > 0) {
      imageUrl = await uploadFile(image, process.env.GOOGLE_DRIVE_FOLDER_ID)
    }

    let author = await prisma.author.findFirst({
      where: { name: authorName }
    })

    if (!author) {
      author = await prisma.author.create({
        data: {
          name: authorName,
          entryById: session.userId
        }
      })
    }

    await prisma.book.create({
      data: {
        name,
        type,
        isPublic,
        fileUrl,
        image: imageUrl,
        entryById: session.userId,
        authors: {
          create: {
            authorId: author.id
          }
        }
      }
    })

    revalidatePath('/library')
    return { success: true, message: 'Book uploaded successfully' }
  } catch (error) {
    console.error('Error creating book:', error)
    return { success: false, message: 'Failed to create book' }
  }
}

export async function updateBook(id: string, formData: FormData) {
  try {
    const session = await requireAuth()
    if (!session) {
      return { success: false, message: 'Not authenticated' }
    }

    // Get existing book
    const existingBook = await prisma.book.findFirst({
      where: {
        id,
        entryById: session.userId
      },
      include: {
        authors: {
          include: {
            author: true
          }
        }
      }
    })

    if (!existingBook) {
      return { success: false, message: 'Book not found' }
    }

    const name = formData.get('name') as string
    const authorName = formData.get('author') as string
    const type = formData.get('type') as 'EBOOK' | 'AUDIO'
    const isPublic = formData.get('isPublic') === 'on'
    const existingFileUrl = formData.get('existingFileUrl') as string
    const existingImageUrl = formData.get('existingImageUrl') as string

    const validation = bookSchema.safeParse({
      name,
      author: authorName,
      type,
      isPublic
    })

    if (!validation.success) {
      return { success: false, message: validation.error.errors[0].message }
    }

    // Handle file upload
    const file = formData.get('file') as File
    let fileUrl = existingFileUrl || existingBook.fileUrl
    if (file && file.size > 0) {
      fileUrl = await uploadFile(file, process.env.GOOGLE_DRIVE_FOLDER_ID)
    }

    // Handle image upload
    const image = formData.get('image') as File
    let imageUrl = existingImageUrl || existingBook.image
    if (image && image.size > 0) {
      imageUrl = await uploadFile(image, process.env.GOOGLE_DRIVE_FOLDER_ID)
    }

    // Find or create author
    let author = await prisma.author.findFirst({
      where: { name: authorName }
    })

    if (!author) {
      author = await prisma.author.create({
        data: {
          name: authorName,
          entryById: session.userId
        }
      })
    }

    // Update book
    await prisma.book.update({
      where: { id },
      data: {
        name,
        type,
        isPublic,
        fileUrl,
        image: imageUrl,
        authors: {
          deleteMany: {},
          create: {
            authorId: author.id
          }
        }
      }
    })

    revalidatePath('/library')
    return { success: true, message: 'Book updated successfully' }
  } catch (error) {
    console.error('Error updating book:', error)
    return { success: false, message: 'Failed to update book' }
  }
}

export async function getUserBooks() {
  try {
    const session = await requireAuth()
    if (!session) return []

    const books = await prisma.book.findMany({
      where: {
        entryById: session.userId
      },
      include: {
        authors: {
          include: {
            author: true
          }
        },
        readingProgress: {
          where: {
            userId: session.userId
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Flatten authors structure
    return books.map(book => ({
      ...book,
      authors: book.authors.map(ba => ba.author)
    }))
  } catch (error) {
    console.error('Error fetching user books:', error)
    return []
  }
}

const bookshelfSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  isPublic: z.boolean().default(false),
})

export async function createBookshelf(formData: FormData) {
    try {
        const session = await requireAuth()
        if (!session) {
            return { success: false, message: 'Not authenticated' }
        }

        const name = formData.get('name') as string
        const description = formData.get('description') as string
        const isPublic = formData.get('isPublic') === 'on'

        const validation = bookshelfSchema.safeParse({
            name,
            description,
            isPublic
        })

        if (!validation.success) {
            return { success: false, message: validation.error.errors[0].message }
        }

        // Check if bookshelf with same name already exists for this user
        const existingBookshelf = await prisma.bookshelf.findFirst({
            where: {
                userId: session.userId,
                name: {
                    equals: name,
                    mode: 'insensitive'
                }
            }
        })

        if (existingBookshelf) {
            return { success: false, message: 'A bookshelf with this name already exists' }
        }

        // Upload image to Google Drive
        const image = formData.get('image') as File
        let imageUrl: string | null = null
        if (image && image.size > 0) {
            imageUrl = await uploadFile(image, process.env.GOOGLE_DRIVE_FOLDER_ID)
        }

        await prisma.bookshelf.create({
            data: {
                name,
                description,
                image: imageUrl,
                isPublic,
                userId: session.userId,
            }
        })

        revalidatePath('/library')
        return { success: true, message: 'Bookshelf created successfully' }
    } catch (error) {
        console.error('Error creating bookshelf:', error)
        return { success: false, message: 'Failed to create bookshelf' }
    }
}

export async function getBookshelves() {
    try {
        const session = await requireAuth()
        if (!session) return []

        const bookshelves = await prisma.bookshelf.findMany({
            where: {
                userId: session.userId
            },
            include: {
                books: {
                    include: {
                        book: {
                            include: {
                                readingProgress: {
                                    where: {
                                        userId: session.userId
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return bookshelves.map(shelf => {
            const books = shelf.books || []
            const totalBooks = books.length
            const completedBooks = books.filter(b =>
                b.book.readingProgress && b.book.readingProgress.length > 0 &&
                b.book.readingProgress[0].progress >= 95
            ).length
            const progressPercent = totalBooks > 0
                ? Math.round((completedBooks / totalBooks) * 100)
                : 0
            const totalPages = books.reduce((sum, b) =>
                sum + (b.book.pageNumber || 0), 0
            )

            return {
                ...shelf,
                bookCount: totalBooks,
                completedBooks,
                progressPercent,
                totalPages
            }
        })
    } catch (error) {
        console.error('Error fetching bookshelves:', error)
        return []
    }
}

export async function updateBookshelf(id: string, formData: FormData, bookIds: string[] = []) {
  try {
    const session = await requireAuth()
    if (!session) {
      return { success: false, message: 'Not authenticated' }
    }

    // Verify ownership
    const existingShelf = await prisma.bookshelf.findFirst({
      where: {
        id,
        userId: session.userId
      }
    })

    if (!existingShelf) {
      return { success: false, message: 'Bookshelf not found' }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const isPublic = formData.get('isPublic') === 'on'
    const existingImageUrl = formData.get('existingImageUrl') as string

    const validation = bookshelfSchema.safeParse({
      name,
      description,
      isPublic
    })

    if (!validation.success) {
      return { success: false, message: validation.error.errors[0].message }
    }

    // Check if bookshelf with same name already exists for this user (excluding current one)
    const duplicateBookshelf = await prisma.bookshelf.findFirst({
      where: {
        userId: session.userId,
        name: {
          equals: name,
          mode: 'insensitive'
        },
        id: {
          not: id
        }
      }
    })

    if (duplicateBookshelf) {
      return { success: false, message: 'A bookshelf with this name already exists' }
    }

    // Handle image upload
    const image = formData.get('image') as File
    let imageUrl = existingImageUrl || existingShelf.image
    if (image && image.size > 0) {
      imageUrl = await uploadFile(image, process.env.GOOGLE_DRIVE_FOLDER_ID)
    }

    // Update bookshelf
    await prisma.bookshelf.update({
      where: { id },
      data: {
        name,
        description,
        image: imageUrl,
        isPublic,
      }
    })

    // Update books in bookshelf (replace all)
    await prisma.bookshelfItem.deleteMany({
      where: {
        bookshelfId: id
      }
    })

    if (bookIds.length > 0) {
      await prisma.bookshelfItem.createMany({
        data: bookIds.map(bookId => ({
          bookshelfId: id,
          bookId: bookId
        }))
      })
    }

    revalidatePath('/library')
    return { success: true, message: 'Bookshelf updated successfully' }
  } catch (error) {
    console.error('Error updating bookshelf:', error)
    return { success: false, message: 'Failed to update bookshelf' }
  }
}

export async function deleteBookshelf(id: string) {
  try {
    const session = await requireAuth()
    if (!session) {
      return { success: false, message: 'Not authenticated' }
    }

    // Verify ownership
    const existingShelf = await prisma.bookshelf.findFirst({
      where: {
        id,
        userId: session.userId
      }
    })

    if (!existingShelf) {
      return { success: false, message: 'Bookshelf not found' }
    }

    // Delete the bookshelf (cascade will handle books relation)
    await prisma.bookshelf.delete({
      where: { id }
    })

    revalidatePath('/library')
    return { success: true, message: 'Bookshelf deleted successfully' }
  } catch (error) {
    console.error('Error deleting bookshelf:', error)
    return { success: false, message: 'Failed to delete bookshelf' }
  }
}

export async function getBookshelfById(id: string) {
  try {
    const session = await requireAuth()
    if (!session) return null

    const bookshelf = await prisma.bookshelf.findFirst({
      where: {
        id,
        userId: session.userId
      },
      include: {
        books: {
          include: {
            book: {
              include: {
                authors: {
                  include: {
                    author: true
                  }
                },
                readingProgress: {
                  where: {
                    userId: session.userId
                  }
                }
              }
            }
          }
        }
      }
    })

    return bookshelf
  } catch (error) {
    console.error('Error fetching bookshelf:', error)
    return null
  }
}

export async function checkBookshelfNameAvailability(name: string, excludeId?: string) {
  try {
    const session = await requireAuth()
    if (!session) return { available: false, message: 'Not authenticated' }

    const existingBookshelf = await prisma.bookshelf.findFirst({
      where: {
        userId: session.userId,
        name: {
          equals: name,
          mode: 'insensitive'
        },
        ...(excludeId && {
          id: {
            not: excludeId
          }
        })
      }
    })

    if (existingBookshelf) {
      return { available: false, message: 'A bookshelf with this name already exists' }
    }

    return { available: true, message: 'Name is available' }
  } catch (error) {
    console.error('Error checking bookshelf name:', error)
    return { available: false, message: 'Failed to check name availability' }
  }
}

export async function removeBookFromBookshelf(bookshelfId: string, bookId: string) {
  try {
    const session = await requireAuth()
    if (!session) {
      return { success: false, message: 'Not authenticated' }
    }

    // Verify ownership
    const bookshelf = await prisma.bookshelf.findFirst({
      where: {
        id: bookshelfId,
        userId: session.userId
      }
    })

    if (!bookshelf) {
      return { success: false, message: 'Bookshelf not found' }
    }

    // Remove the book from the bookshelf
    await prisma.bookshelfItem.deleteMany({
      where: {
        bookshelfId,
        bookId
      }
    })

    revalidatePath('/library')
    return { success: true, message: 'Book removed from bookshelf' }
  } catch (error) {
    console.error('Error removing book from bookshelf:', error)
    return { success: false, message: 'Failed to remove book from bookshelf' }
  }
}

export async function addBookToBookshelf(bookshelfId: string, bookId: string) {
  try {
    const session = await requireAuth()
    if (!session) {
      return { success: false, message: 'Not authenticated' }
    }

    // Verify ownership
    const bookshelf = await prisma.bookshelf.findFirst({
      where: {
        id: bookshelfId,
        userId: session.userId
      }
    })

    if (!bookshelf) {
      return { success: false, message: 'Bookshelf not found' }
    }

    // Check if book is already in bookshelf
    const existing = await prisma.bookshelfItem.findUnique({
      where: {
        bookshelfId_bookId: {
          bookshelfId,
          bookId
        }
      }
    })

    if (existing) {
      return { success: false, message: 'Book is already in this bookshelf' }
    }

    // Add book to bookshelf
    await prisma.bookshelfItem.create({
      data: {
        bookshelfId,
        bookId
      }
    })

    revalidatePath('/library')
    revalidatePath('/books')
    return { success: true, message: 'Book added to bookshelf' }
  } catch (error) {
    console.error('Error adding book to bookshelf:', error)
    return { success: false, message: 'Failed to add book to bookshelf' }
  }
}

export async function getUserBookshelvesForBook(bookId: string) {
  try {
    const session = await requireAuth()
    if (!session) return []

    // Get all user's bookshelves
    const bookshelves = await prisma.bookshelf.findMany({
      where: {
        userId: session.userId
      },
      include: {
        _count: {
          select: {
            books: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Check which bookshelves contain this book
    const bookshelfIds = bookshelves.map(b => b.id)
    const existingItems = await prisma.bookshelfItem.findMany({
      where: {
        bookshelfId: { in: bookshelfIds },
        bookId
      },
      select: {
        bookshelfId: true
      }
    })

    const bookshelfsWithBook = new Set(existingItems.map(item => item.bookshelfId))

    return bookshelves.map(shelf => ({
      ...shelf,
      hasBook: bookshelfsWithBook.has(shelf.id)
    }))
  } catch (error) {
    console.error('Error fetching bookshelves:', error)
    return []
  }
}
