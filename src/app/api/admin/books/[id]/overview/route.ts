import { NextRequest, NextResponse } from 'next/server'
import { updateBookAIOverview, getBookById } from '@/lib/lms/repositories/book.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/books/[id]/overview
 * Get book overview (called by PDF processor for audiobook generation)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const bookId = params.id

    // Check authentication with API key (for PDF processor)
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.PDF_PROCESSOR_API_KEY

    // Allow PDF processor with API key
    if (authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get book
    const book = await getBookById(bookId)
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      overview: book.aiOverview || null,
    })
  } catch (error) {
    console.error('Error fetching overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overview' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/books/[id]/overview
 * Update book AI overview (called by PDF processor)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const bookId = params.id
    const body = await request.json()

    // Validate required fields
    const { overview } = body
    if (!overview) {
      return NextResponse.json(
        { error: 'Missing required field: overview' },
        { status: 400 }
      )
    }

    // Check authentication with API key (for PDF processor) or session (for admin)
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.PDF_PROCESSOR_API_KEY

    // Allow PDF processor with API key
    if (authHeader === `Bearer ${apiKey}`) {
      // PDF processor authentication successful
    } else {
      // Fall back to session authentication for admin users
      const session = await getSession()
      const user = session ? await findUserById(session.userId) : null
      if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    // Check if book exists
    const existingBook = await getBookById(bookId)
    if (!existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Update AI overview
    await updateBookAIOverview(bookId, {
      aiOverview: overview,
      aiOverviewStatus: 'completed',
    })

    return NextResponse.json({
      success: true,
      message: 'AI overview updated successfully',
    })
  } catch (error) {
    console.error('Error updating AI overview:', error)
    return NextResponse.json(
      { error: 'Failed to update AI overview' },
      { status: 500 }
    )
  }
}
