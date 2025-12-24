import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { bookId, currentPage, progress, totalPages } = body

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
    }

    // Validate progress value
    const progressValue = Math.min(100, Math.max(0, progress || 0))

    // Calculate if completed (progress >= 95%)
    const isCompleted = progressValue >= 95

    // Get previous progress to calculate delta
    const previousProgress = await prisma.readingProgress.findUnique({
      where: {
        userId_bookId: {
          userId: session.userId,
          bookId,
        },
      },
    })

    const previousPage = previousProgress?.currentPage || 0
    const pagesRead = Math.max(0, (currentPage || 1) - previousPage)

    // Upsert reading progress
    const readingProgress = await prisma.readingProgress.upsert({
      where: {
        userId_bookId: {
          userId: session.userId,
          bookId,
        },
      },
      create: {
        userId: session.userId,
        bookId,
        currentPage: currentPage || 1,
        progress: progressValue,
        isCompleted,
        lastReadAt: new Date(),
      },
      update: {
        currentPage: currentPage || 1,
        progress: progressValue,
        isCompleted,
        lastReadAt: new Date(),
      },
      include: {
        book: {
          select: {
            pageNumber: true,
          },
        },
      },
    })

    // Save progress history if there's meaningful activity
    // Only save if: pages read > 0 OR this is the first time reading this book
    if (pagesRead > 0 || !previousProgress) {
      await prisma.progressHistory.create({
        data: {
          userId: session.userId,
          bookId,
          currentPage: currentPage || 1,
          progress: progressValue,
          pagesRead: pagesRead,
          timeSpent: 0, // Time tracking would need to be calculated on the client
          sessionDate: new Date(),
        },
      })
    }

    // Also update the book's pageNumber if it's not set and we have totalPages
    if (totalPages && readingProgress.book?.pageNumber === null) {
      await prisma.book.update({
        where: { id: bookId },
        data: { pageNumber: totalPages },
      })
    }

    return NextResponse.json({ success: true, readingProgress })
  } catch (error) {
    console.error('Error saving reading progress:', error)
    return NextResponse.json(
      { error: 'Failed to save reading progress' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
    }

    const readingProgress = await prisma.readingProgress.findUnique({
      where: {
        userId_bookId: {
          userId: session.userId,
          bookId,
        },
      },
      include: {
        book: {
          select: {
            pageNumber: true,
          },
        },
      },
    })

    return NextResponse.json({ readingProgress })
  } catch (error) {
    console.error('Error fetching reading progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading progress' },
      { status: 500 }
    )
  }
}
