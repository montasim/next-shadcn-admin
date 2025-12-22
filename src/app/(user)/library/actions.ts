'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'

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

    const file = formData.get('file') as File
    const fileUrl = file ? `/uploads/${file.name}` : null

    const image = formData.get('image') as File
    const imageUrl = image ? `/uploads/${image.name}` : null

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

    return books
  } catch (error) {
    console.error('Error fetching user books:', error)
    return []
  }
}

const bookshelfSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
})

export async function createBookshelf(data: z.infer<typeof bookshelfSchema>) {
    try {
        const session = await requireAuth()
        if (!session) {
            return { success: false, message: 'Not authenticated' }
        }

        const validation = bookshelfSchema.safeParse(data)

        if (!validation.success) {
            return { success: false, message: validation.error.errors[0].message }
        }

        await prisma.bookshelf.create({
            data: {
                ...validation.data,
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
