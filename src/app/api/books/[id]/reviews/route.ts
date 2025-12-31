/**
 * Book Reviews API Route
 *
 * Handles CRUD operations for book reviews
 * - GET: Get all reviews for a book
 * - POST: Create a new review (requires authentication)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'

interface ReviewWithUser {
  id: string
  rating: number
  comment: string | null
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    firstName: string
    lastName: string | null
    username: string | null
    name: string
    avatar: string | null
  }
}

/**
 * GET /api/books/[id]/reviews
 *
 * Get all reviews for a specific book
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params

    // Validate book ID
    if (!bookId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid book ID',
        message: 'Book ID is required'
      }, { status: 400 })
    }

    // Check if book exists and is public
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, isPublic: true }
    })

    if (!book || !book.isPublic) {
      return NextResponse.json({
        success: false,
        error: 'Book not found',
        message: 'The requested book does not exist'
      }, { status: 404 })
    }

    // Get current user (if authenticated)
    const userSession = await getSession()
    const currentUserId = userSession?.userId

    // Fetch all reviews for the book
    const reviews = await prisma.bookReview.findMany({
      where: { bookId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            name: true,
            avatar: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate average rating
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0

    // Check if current user has reviewed this book
    const currentUserReview = currentUserId
      ? reviews.find(review => review.userId === currentUserId)
      : null

    // Transform reviews for response
    const transformedReviews: ReviewWithUser[] = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.user.id,
        firstName: review.user.firstName,
        lastName: review.user.lastName,
        username: review.user.username,
        name: review.user.name,
        avatar: review.user.avatar,
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        reviews: transformedReviews,
        summary: {
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        },
        currentUserReview: currentUserReview ? {
          id: currentUserReview.id,
          rating: currentUserReview.rating,
          comment: currentUserReview.comment,
        } : null,
      },
      message: 'Reviews retrieved successfully'
    })

  } catch (error) {
    console.error('Get reviews error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve reviews',
      message: 'An error occurred while fetching reviews'
    }, { status: 500 })
  }
}

/**
 * POST /api/books/[id]/reviews
 *
 * Create a new review for a book (requires authentication)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params

    // Require authentication
    const userSession = await getSession()
    if (!userSession) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to submit a review'
      }, { status: 401 })
    }

    // Validate book ID
    if (!bookId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid book ID',
        message: 'Book ID is required'
      }, { status: 400 })
    }

    // Check if book exists and is public
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, isPublic: true }
    })

    if (!book || !book.isPublic) {
      return NextResponse.json({
        success: false,
        error: 'Book not found',
        message: 'The requested book does not exist'
      }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { rating, comment } = body

    // Validate rating
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({
        success: false,
        error: 'Invalid rating',
        message: 'Rating must be a number between 1 and 5'
      }, { status: 400 })
    }

    // Check if user already reviewed this book
    const existingReview = await prisma.bookReview.findUnique({
      where: {
        bookId_userId: {
          bookId,
          userId: userSession.userId,
        }
      }
    })

    if (existingReview) {
      return NextResponse.json({
        success: false,
        error: 'Review already exists',
        message: 'You have already reviewed this book. Use PUT to update your review.'
      }, { status: 409 })
    }

    // Create the review
    const review = await prisma.bookReview.create({
      data: {
        bookId,
        userId: userSession.userId,
        rating,
        comment: comment || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            name: true,
            avatar: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        review: {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          user: {
            id: review.user.id,
            firstName: review.user.firstName,
            lastName: review.user.lastName,
            username: review.user.username,
            name: review.user.name,
            avatar: review.user.avatar,
          }
        }
      },
      message: 'Review submitted successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create review error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to create review',
      message: 'An error occurred while submitting your review'
    }, { status: 500 })
  }
}

/**
 * PUT /api/books/[id]/reviews
 *
 * Update an existing review (requires authentication)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params

    // Require authentication
    const userSession = await getSession()
    if (!userSession) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to update a review'
      }, { status: 401 })
    }

    // Validate book ID
    if (!bookId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid book ID',
        message: 'Book ID is required'
      }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const { rating, comment } = body

    // Validate rating
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({
        success: false,
        error: 'Invalid rating',
        message: 'Rating must be a number between 1 and 5'
      }, { status: 400 })
    }

    // Check if review exists and belongs to user
    const existingReview = await prisma.bookReview.findUnique({
      where: {
        bookId_userId: {
          bookId,
          userId: userSession.userId,
        }
      }
    })

    if (!existingReview) {
      return NextResponse.json({
        success: false,
        error: 'Review not found',
        message: 'You have not reviewed this book yet'
      }, { status: 404 })
    }

    // Update the review
    const review = await prisma.bookReview.update({
      where: {
        bookId_userId: {
          bookId,
          userId: userSession.userId,
        }
      },
      data: {
        rating,
        comment: comment || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            name: true,
            avatar: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        review: {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          user: {
            id: review.user.id,
            firstName: review.user.firstName,
            lastName: review.user.lastName,
            username: review.user.username,
            name: review.user.name,
            avatar: review.user.avatar,
          }
        }
      },
      message: 'Review updated successfully'
    })

  } catch (error) {
    console.error('Update review error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to update review',
      message: 'An error occurred while updating your review'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/books/[id]/reviews
 *
 * Delete a review (requires authentication)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params

    // Require authentication
    const userSession = await getSession()
    if (!userSession) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to delete a review'
      }, { status: 401 })
    }

    // Validate book ID
    if (!bookId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid book ID',
        message: 'Book ID is required'
      }, { status: 400 })
    }

    // Check if review exists and belongs to user
    const existingReview = await prisma.bookReview.findUnique({
      where: {
        bookId_userId: {
          bookId,
          userId: userSession.userId,
        }
      }
    })

    if (!existingReview) {
      return NextResponse.json({
        success: false,
        error: 'Review not found',
        message: 'You have not reviewed this book yet'
      }, { status: 404 })
    }

    // Delete the review
    await prisma.bookReview.delete({
      where: {
        bookId_userId: {
          bookId,
          userId: userSession.userId,
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    })

  } catch (error) {
    console.error('Delete review error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to delete review',
      message: 'An error occurred while deleting your review'
    }, { status: 500 })
  }
}
