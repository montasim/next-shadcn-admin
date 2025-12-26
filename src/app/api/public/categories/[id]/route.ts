/**
 * Public Category Detail API Route
 *
 * Provides detailed information about a specific category
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
 * GET /api/public/categories/[id]
 * Get detailed information about a specific category
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const categoryId = params.id

    // Validate category ID
    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid category ID',
        message: 'Category ID is required and must be valid'
      }, { status: 400 })
    }

    // Check user authentication and premium status
    const userSession = await getSession()
    const userHasPremium = userSession ? (userSession.role === 'USER' ? false : userSession.role === 'ADMIN' ? true : false) : false
    const isAuthenticated = !!userSession

    // Find the category with all books
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
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

    // Get view statistics for analytics
    const viewStats = await prisma.categoryView.count({
      where: { categoryId }
    })

    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Category not found',
        message: 'The requested category does not exist'
      }, { status: 404 })
    }

    // Calculate total readers across all books
    const totalReaders = category.books.reduce((sum, bc) => {
      return sum + (bc.book._count.readingProgress || 0)
    }, 0)

    // Transform books to BookCard-compatible format
    const transformedBooks = category.books
      .map(bc => {
        const book = bc.book
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

    // Transform category data
    const transformedCategory = {
      id: category.id,
      name: category.name,
      description: category.description,
      image: category.image,
      directImageUrl: category.directImageUrl,
      entryDate: category.entryDate,
      entryBy: category.entryBy.role === 'USER' ? {
        id: category.entryBy.id,
        firstName: category.entryBy.firstName,
        lastName: category.entryBy.lastName,
        username: category.entryBy.username,
        name: category.entryBy.name,
        avatar: category.entryBy.avatar,
        bio: category.entryBy.bio,
      } : null,
      books: transformedBooks,
      statistics: {
        totalBooks: transformedBooks.length,
        totalReaders,
      },
      analytics: {
        totalViews: viewStats,
      }
    }

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        category: transformedCategory,
      },
      message: 'Category details retrieved successfully'
    })

  } catch (error) {
    console.error('Get category details error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve category details',
      message: 'An error occurred while fetching category information'
    }, { status: 500 })
  }
}
