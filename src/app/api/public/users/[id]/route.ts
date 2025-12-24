/**
 * Public User Profile API Route
 *
 * Provides public access to user profile information
 * including their uploaded books and statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/public/users/[id]
 *
 * Get user profile with their public books and statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    // Fetch user with their public books and stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        name: true,
        avatar: true,
        bio: true,
        createdAt: true,
        books: {
          where: { isPublic: true },
          include: {
            _count: {
              select: { readingProgress: true }
            }
          },
          orderBy: { entryDate: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Calculate statistics
    const totalBooks = user.books.length
    const totalReaders = user.books.reduce((sum, book) => sum + book._count.readingProgress, 0)

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          avatar: user.avatar,
          bio: user.bio,
          createdAt: user.createdAt,
        },
        statistics: {
          totalBooks,
          totalReaders,
        },
        books: user.books.map(book => ({
          id: book.id,
          name: book.name,
          type: book.type,
          image: book.image,
          summary: book.summary,
          requiresPremium: book.requiresPremium,
          entryDate: book.entryDate,
          pageNumber: book.pageNumber,
          readersCount: book._count.readingProgress,
        }))
      }
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user profile'
    }, { status: 500 })
  }
}
