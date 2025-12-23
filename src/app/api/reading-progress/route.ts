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
