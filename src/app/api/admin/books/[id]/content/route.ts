import { NextRequest, NextResponse } from 'next/server'
import { updateBookExtractedContent, getBookById } from '@/lib/lms/repositories/book.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/books/[id]/content
 * Get book extracted content (called by PDF processor for regeneration)
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

    // Check if extracted content exists
    if (!book.extractedContent) {
      return NextResponse.json(
        { error: 'Extracted content not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      extractedContent: book.extractedContent,
      contentHash: book.contentHash,
      contentPageCount: book.contentPageCount,
      contentWordCount: book.contentWordCount,
    })
  } catch (error) {
    console.error('Error fetching extracted content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch extracted content' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/books/[id]/content
 * Update book extracted content (called by PDF processor)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const bookId = params.id
    const body = await request.json()

    // Validate required fields
    const { extractedContent, contentHash: requestContentHash, contentPageCount, contentWordCount } = body
    if (!extractedContent || contentPageCount === undefined || contentWordCount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: extractedContent, contentPageCount, contentWordCount' },
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

    // Calculate content hash and size
    // Use provided hash from PDF processor (SHA-256), or fall back to legacy method
    const contentHash = requestContentHash || Buffer.from(extractedContent).toString('base64').slice(0, 32)
    const contentSize = Buffer.byteLength(extractedContent, 'utf8')

    // Update extracted content
    await updateBookExtractedContent(bookId, {
      extractedContent,
      contentHash,
      contentPageCount,
      contentWordCount,
      contentSize,
      extractionStatus: 'COMPLETED',
    })

    return NextResponse.json({
      success: true,
      message: 'Extracted content updated successfully',
    })
  } catch (error) {
    console.error('Error updating extracted content:', error)
    return NextResponse.json(
      { error: 'Failed to update extracted content' },
      { status: 500 }
    )
  }
}
