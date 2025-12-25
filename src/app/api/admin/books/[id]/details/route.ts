import { NextRequest, NextResponse } from 'next/server'
import { getBookWithCompleteDetails } from '@/lib/lms/repositories/book.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/books/[id]/details
 * Get comprehensive book data for admin dashboard
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const bookId = params.id

    // Check authentication and admin role
    const session = await getSession()
    const user = session ? await findUserById(session.userId) : null
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get book with complete details
    const book = await getBookWithCompleteDetails(bookId)

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: book,
    })
  } catch (error) {
    console.error('Error fetching admin book details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch book details' },
      { status: 500 }
    )
  }
}
