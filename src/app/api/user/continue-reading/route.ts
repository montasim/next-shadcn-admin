import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { BookType } from '@prisma/client'

/**
 * GET /api/user/continue-reading
 * Get books the user has started reading but hasn't finished yet
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    // Check user's premium status
    const userHasPremium = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'

    // Get reading progress for unfinished books (progress < 95%, excluding hard copy books)
    const readingProgress = await prisma.readingProgress.findMany({
      where: {
        userId: session.userId,
        progress: {
          lt: 95, // Not completed
        },
        book: {
          type: { in: [BookType.EBOOK, BookType.AUDIO] },
        },
      },
      include: {
        book: {
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
        },
      },
      orderBy: {
        lastReadAt: 'desc', // Most recently read first
      },
      take: limit,
    })

    // Transform data to match BookCard interface
    const books = readingProgress.map((rp) => {
      const book = rp.book
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
        progress: {
          currentPage: rp.currentPage,
          progress: rp.progress,
          isCompleted: rp.progress >= 95,
          lastReadAt: rp.lastReadAt,
        },
        // Authors
        authors: book.authors.map((a: any) => ({
          id: a.author.id,
          name: a.author.name,
        })),
        // Categories
        categories: book.categories.map((c: any) => ({
          id: c.category.id,
          name: c.category.name,
        })),
        // Reader count
        readersCount: book._count.readingProgress,
        // Uploader info (only if role is USER)
        entryBy: book.entryBy && book.entryBy.role === 'USER' ? {
          id: book.entryBy.id,
          username: book.entryBy.username,
          firstName: book.entryBy.firstName,
          lastName: book.entryBy.lastName,
          name: book.entryBy.name,
          avatar: book.entryBy.avatar,
        } : null,
      }
    })

    return NextResponse.json({
      books,
      total: books.length,
    })
  } catch (error: any) {
    console.error('Error fetching continue reading:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch continue reading' },
      { status: 500 }
    )
  }
}
