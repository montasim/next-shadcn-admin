/**
 * API Route - Get Book Lending History
 *
 * GET /api/books/[id]/loans
 * Returns all loans for a specific book
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication required
    await requireAuth()

    const { id: bookId } = await params

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, type: true }
    })

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    if (book.type !== 'HARD_COPY') {
      return NextResponse.json(
        { error: 'Lending history is only available for hard copy books' },
        { status: 400 }
      )
    }

    // Fetch all loans for this book
    const loans = await prisma.bookLoan.findMany({
      where: { bookId },
      include: {
        book: {
          select: {
            id: true,
            name: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          }
        },
        lentBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: {
        loanDate: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        loans: loans.map(loan => ({
          id: loan.id,
          loanDate: loan.loanDate.toISOString(),
          dueDate: loan.dueDate.toISOString(),
          returnDate: loan.returnDate?.toISOString() || null,
          status: loan.status,
          notes: loan.notes,
          reminderSent: loan.reminderSent,
          book: loan.book,
          user: loan.user,
          lentBy: loan.lentBy,
          createdAt: loan.createdAt.toISOString(),
          updatedAt: loan.updatedAt.toISOString(),
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching book loans:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
