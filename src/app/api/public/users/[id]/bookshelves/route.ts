/**
 * Public User Bookshelves API Route
 *
 * Provides public access to a user's public bookshelves
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/public/users/[id]/bookshelves
 *
 * Get public bookshelves for a user with their books
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    // Fetch only public bookshelves with their books
    const bookshelves = await prisma.bookshelf.findMany({
      where: {
        userId,
        isPublic: true,
      },
      include: {
        books: {
          include: {
            book: {
              include: {
                _count: {
                  select: { readingProgress: true }
                }
              }
            }
          },
          orderBy: {
            addedAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data for the response
    const transformedBookshelves = bookshelves.map(bookshelf => ({
      id: bookshelf.id,
      name: bookshelf.name,
      description: bookshelf.description,
      image: bookshelf.image,
      bookCount: bookshelf.books.length,
      books: bookshelf.books.map(item => ({
        id: item.book.id,
        name: item.book.name,
        type: item.book.type,
        image: item.book.image,
        summary: item.book.summary,
        requiresPremium: item.book.requiresPremium,
        pageNumber: item.book.pageNumber,
        readersCount: item.book._count.readingProgress,
        addedAt: item.addedAt,
      }))
    }))

    return NextResponse.json({
      success: true,
      data: {
        bookshelves: transformedBookshelves,
        totalBookshelves: transformedBookshelves.length,
      }
    })
  } catch (error) {
    console.error('Get user bookshelves error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user bookshelves'
    }, { status: 500 })
  }
}
