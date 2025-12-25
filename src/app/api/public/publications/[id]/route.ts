/**
 * Public Publication Detail API Route
 *
 * Provides detailed information about a specific publication
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
 * GET /api/public/publications/[id]
 * Get detailed information about a specific publication
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const publicationId = params.id

    // Validate publication ID
    if (!publicationId || typeof publicationId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid publication ID',
        message: 'Publication ID is required and must be valid'
      }, { status: 400 })
    }

    // Check user authentication and premium status
    const userSession = await getSession()
    const userHasPremium = userSession ? (userSession.role === 'USER' ? false : userSession.role === 'ADMIN' ? true : false) : false
    const isAuthenticated = !!userSession

    // Find the publication with all books
    const publication = await prisma.publication.findUnique({
      where: { id: publicationId },
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

    if (!publication) {
      return NextResponse.json({
        success: false,
        error: 'Publication not found',
        message: 'The requested publication does not exist'
      }, { status: 404 })
    }

    // Calculate total readers across all books
    const totalReaders = publication.books.reduce((sum, bp) => {
      return sum + (bp.book._count.readingProgress || 0)
    }, 0)

    // Transform books to BookCard-compatible format
    const transformedBooks = publication.books
      .map(bp => {
        const book = bp.book
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

    // Transform publication data
    const transformedPublication = {
      id: publication.id,
      name: publication.name,
      description: publication.description,
      image: publication.image,
      directImageUrl: publication.directImageUrl,
      entryDate: publication.entryDate,
      entryBy: publication.entryBy.role === 'USER' ? {
        id: publication.entryBy.id,
        firstName: publication.entryBy.firstName,
        lastName: publication.entryBy.lastName,
        username: publication.entryBy.username,
        name: publication.entryBy.name,
        avatar: publication.entryBy.avatar,
        bio: publication.entryBy.bio,
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
        publication: transformedPublication,
      },
      message: 'Publication details retrieved successfully'
    })

  } catch (error) {
    console.error('Get publication details error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve publication details',
      message: 'An error occurred while fetching publication information'
    }, { status: 500 })
  }
}
