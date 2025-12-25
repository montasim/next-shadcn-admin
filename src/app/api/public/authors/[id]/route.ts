/**
 * Public Author Detail API Route
 *
 * Provides detailed information about a specific author
 * Includes access control for premium books
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/public/authors/[id]
 * Get detailed information about a specific author
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const authorId = params.id

    // Validate author ID
    if (!authorId || typeof authorId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid author ID',
        message: 'Author ID is required and must be valid'
      }, { status: 400 })
    }

    // Check user authentication and premium status
    const userSession = await getSession()
    const userHasPremium = userSession ? (userSession.role === 'USER' ? false : userSession.role === 'ADMIN' ? true : false) : false
    const isAuthenticated = !!userSession

    // Find the author with all books
    const author = await prisma.author.findUnique({
      where: { id: authorId },
      include: {
        entryBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
            role: true,
            createdAt: true,
          }
        },
        books: {
          where: {
            book: {
              isPublic: true,
            }
          },
          include: {
            book: {
              include: {
                entryBy: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    name: true,
                    avatar: true,
                    bio: true,
                    role: true,
                    createdAt: true,
                  }
                },
                authors: {
                  include: {
                    author: {
                      select: {
                        id: true,
                        name: true,
                        description: true,
                        image: true,
                      }
                    }
                  }
                },
                categories: {
                  include: {
                    category: {
                      select: {
                        id: true,
                        name: true,
                        description: true,
                        image: true,
                      }
                    }
                  }
                },
                publications: {
                  include: {
                    publication: {
                      select: {
                        id: true,
                        name: true,
                        description: true,
                        image: true,
                      }
                    }
                  }
                },
                _count: {
                  select: {
                    readingProgress: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            books: true,
          }
        }
      }
    })

    if (!author) {
      return NextResponse.json({
        success: false,
        error: 'Author not found',
        message: 'The requested author does not exist'
      }, { status: 404 })
    }

    // Calculate total readers across all books
    const totalReaders = author.books.reduce((sum, ba) => {
      return sum + (ba.book._count.readingProgress || 0)
    }, 0)

    // Transform books to BookCard-compatible format
    const transformedBooks = author.books
      .map(ba => {
        const book = ba.book
        const requiresPremium = book.requiresPremium
        const canAccess = !requiresPremium || userHasPremium

        return {
          id: book.id,
          name: book.name,
          type: book.type,
          summary: book.summary,
          pageNumber: book.pageNumber,
          image: book.image,
          requiresPremium,
          canAccess,
          readersCount: book._count.readingProgress || 0,
          authors: book.authors.map(ba => ({
            id: ba.author.id,
            name: ba.author.name,
          })),
          categories: book.categories.map(bc => ({
            id: bc.category.id,
            name: bc.category.name,
          })),
          publications: book.publications.map(bp => ({
            id: bp.publication.id,
            name: bp.publication.name,
          })),
          entryBy: book.isPublic && book.entryBy.role === 'USER' ? {
            id: book.entryBy.id,
            username: book.entryBy.username,
            firstName: book.entryBy.firstName,
            lastName: book.entryBy.lastName,
            name: book.entryBy.name,
            avatar: book.entryBy.avatar,
          } : null,
        }
      })

    // Transform author data
    const transformedAuthor = {
      id: author.id,
      name: author.name,
      description: author.description,
      image: author.image,
      directImageUrl: author.directImageUrl,
      entryDate: author.entryDate,
      entryBy: author.entryBy.role === 'USER' ? {
        id: author.entryBy.id,
        firstName: author.entryBy.firstName,
        lastName: author.entryBy.lastName,
        username: author.entryBy.username,
        name: author.entryBy.name,
        avatar: author.entryBy.avatar,
        bio: author.entryBy.bio,
      } : null,
      books: transformedBooks,
      statistics: {
        totalBooks: transformedBooks.length,
        totalReaders,
      }
    }

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        author: transformedAuthor,
      },
      message: 'Author details retrieved successfully'
    })

  } catch (error) {
    console.error('Get author details error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve author details',
      message: 'An error occurred while fetching author information'
    }, { status: 500 })
  }
}
