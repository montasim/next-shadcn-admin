import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { BookType } from '@prisma/client'

/**
 * GET /api/user/recent-visits
 * Get recently visited books for the current user
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

    // Get recent book visits for this user (excluding hard copy books)
    const recentVisits = await prisma.bookView.findMany({
      where: {
        userId: session.userId,
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
            readingProgress: {
              where: {
                userId: session.userId,
              },
              select: {
                currentPage: true,
                progress: true,
                lastReadAt: true,
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
        visitedAt: 'desc',
      },
      take: limit,
    })

    // Group by book and get the most recent visit for each
    const uniqueBooks = new Map()
    for (const visit of recentVisits) {
      if (!uniqueBooks.has(visit.bookId)) {
        const book = visit.book
        const canAccess = !book.requiresPremium || userHasPremium

        // Transform authors and categories to match BookCard interface
        const transformedBook = {
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
          progress: book.readingProgress && book.readingProgress.length > 0 ? {
            currentPage: book.readingProgress[0].currentPage,
            progress: book.readingProgress[0].progress,
            isCompleted: book.readingProgress[0].progress >= 95,
            lastReadAt: book.readingProgress[0].lastReadAt,
          } : undefined,
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
          // Last visited timestamp
          lastVisited: visit.visitedAt,
        }
        uniqueBooks.set(visit.bookId, transformedBook)
      }
    }

    const books = Array.from(uniqueBooks.values())

    return NextResponse.json({
      books,
      total: books.length,
    })
  } catch (error: any) {
    console.error('Error fetching recent visits:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recent visits' },
      { status: 500 }
    )
  }
}
