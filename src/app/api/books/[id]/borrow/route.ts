/**
 * Borrow Book API Route
 *
 * Allows users to borrow hard copy books
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'

/**
 * POST /api/books/[id]/borrow
 *
 * Borrow a book (user borrows for themselves)
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
        message: 'You must be logged in to borrow books'
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

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, name: true, type: true, numberOfCopies: true }
    })

    if (!book) {
      return NextResponse.json({
        success: false,
        error: 'Book not found',
        message: 'The requested book does not exist'
      }, { status: 404 })
    }

    // Only hard copy books can be borrowed
    if (book.type !== 'HARD_COPY') {
      return NextResponse.json({
        success: false,
        error: 'Invalid book type',
        message: 'Only hard copy books can be borrowed from the physical library'
      }, { status: 400 })
    }

    // Parse request body (optional notes)
    const body = await request.json()
    const { notes } = body

    // Set default due date to 14 days from now
    const defaultDueDate = new Date()
    defaultDueDate.setDate(defaultDueDate.getDate() + 14)

    // Check if user already has an active loan for this book
    const existingLoan = await prisma.bookLoan.findFirst({
      where: {
        bookId,
        userId: userSession.userId,
        status: { in: ['ACTIVE', 'OVERDUE'] }
      }
    })

    if (existingLoan) {
      return NextResponse.json({
        success: false,
        error: 'Active loan exists',
        message: 'You already have an active loan for this book'
      }, { status: 409 })
    }

    // Check number of available copies
    if (book.numberOfCopies !== null) {
      const activeLoansCount = await prisma.bookLoan.count({
        where: {
          bookId,
          status: { in: ['ACTIVE', 'OVERDUE'] }
        }
      })

      if (activeLoansCount >= book.numberOfCopies) {
        return NextResponse.json({
          success: false,
          error: 'No copies available',
          message: 'All copies of this book are currently borrowed'
        }, { status: 400 })
      }
    }

    // Create the loan
    const loan = await prisma.bookLoan.create({
      data: {
        bookId,
        userId: userSession.userId,
        lentById: userSession.userId, // Self-service borrowing
        dueDate: defaultDueDate,
        notes: notes || null,
        status: 'ACTIVE'
      },
      include: {
        book: {
          select: { id: true, name: true, image: true, type: true }
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, username: true }
        },
        lentBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    })

    // Send email notification to user (background task)
    fetch('/api/loans/email/borrowed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loanId: loan.id,
        userId: userSession.userId
      })
    }).catch(err => console.error('Failed to send borrowed email:', err))

    return NextResponse.json({
      success: true,
      data: { loan },
      message: 'Book borrowed successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Borrow book error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to borrow book',
      message: 'An error occurred while borrowing the book'
    }, { status: 500 })
  }
}
