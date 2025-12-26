import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'
import { getMoodByIdentifier } from '@/lib/lms/repositories/mood.repository'

// Query schema
const MoodQuerySchema = z.object({
  mood: z.string().min(1),
  limit: z.coerce.number().min(1).max(50).default(12),
})

/**
 * GET /api/public/books/by-mood
 * Get book recommendations based on user's mood
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validatedQuery = MoodQuerySchema.parse(queryParams)

    // Check user authentication and premium status
    const userSession = await getSession()
    const userId = userSession?.userId
    const userHasPremium = userSession ? (userSession.role === 'ADMIN' || userSession.role === 'SUPER_ADMIN') : false

    const { mood: moodIdentifier, limit } = validatedQuery

    // Get mood from database with its category mappings
    const mood = await getMoodByIdentifier(moodIdentifier)

    if (!mood || !mood.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid mood',
          message: 'The specified mood does not exist or is inactive',
        },
        { status: 400 }
      )
    }

    // Extract category IDs from mood mappings
    const categoryIds = mood.mappings.map((m) => m.categoryId)

    // Build readingProgress include based on authentication
    const readingProgressInclude = userId
      ? {
          where: {
            userId: userId,
          },
          select: {
            currentPage: true,
            progress: true,
            lastReadAt: true,
          },
        }
      : false

    // Get books in these categories
    const books = await prisma.book.findMany({
      where: {
        isPublic: true,
        categories: {
          some: {
            categoryId: {
              in: categoryIds,
            },
          },
        },
      },
      include: {
        authors: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        publications: {
          include: {
            publication: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        readingProgress: readingProgressInclude,
        entryBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        _count: {
          select: {
            readingProgress: true,
          },
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform books data
    const transformedBooks = books.map((book) => {
      const canAccess = !book.requiresPremium || userHasPremium

      return {
        id: book.id,
        name: book.name,
        summary: book.summary,
        type: book.type,
        bindingType: book.bindingType,
        pageNumber: book.pageNumber,
        image: book.image,
        directImageUrl: book.directImageUrl,
        requiresPremium: book.requiresPremium,
        canAccess,
        fileUrl: canAccess ? book.fileUrl : null,
        // User's reading progress
        progress:
          book.readingProgress && book.readingProgress.length > 0
            ? {
                currentPage: book.readingProgress[0].currentPage,
                progress: book.readingProgress[0].progress,
                isCompleted: book.readingProgress[0].progress >= 95,
                lastReadAt: book.readingProgress[0].lastReadAt,
              }
            : undefined,
        // Authors
        authors: book.authors.map((ba: any) => ({
          id: ba.author.id,
          name: ba.author.name,
        })),
        // Categories
        categories: book.categories.map((bc: any) => ({
          id: bc.category.id,
          name: bc.category.name,
        })),
        // Reader count
        readersCount: book._count.readingProgress,
        // Uploader info (only if role is USER)
        entryBy:
          book.entryBy && book.entryBy.role === 'USER'
            ? {
                id: book.entryBy.id,
                username: book.entryBy.username,
                firstName: book.entryBy.firstName,
                lastName: book.entryBy.lastName,
                name: book.entryBy.name,
                avatar: book.entryBy.avatar,
              }
            : null,
      }
    })

    // Shuffle books to get variety
    const shuffledBooks = transformedBooks.sort(() => Math.random() - 0.5)

    return NextResponse.json({
      success: true,
      data: {
        mood: moodIdentifier,
        books: shuffledBooks,
        total: shuffledBooks.length,
      },
      message: `Book recommendations for ${mood.name} mood`,
    })
  } catch (error: any) {
    console.error('Get mood-based recommendations error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          message: error.errors[0]?.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch mood-based recommendations',
        message: 'An error occurred while fetching book recommendations',
      },
      { status: 500 }
    )
  }
}
