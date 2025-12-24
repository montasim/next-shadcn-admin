'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'
import { RequestStatus, BookType } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const bookRequestSchema = z.object({
  bookName: z.string().min(1, 'Book name is required'),
  authorName: z.string().min(1, 'Author name is required'),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO'] as const),
  edition: z.string().optional(),
  publisher: z.string().optional(),
  isbn: z.string().optional(),
  description: z.string().optional(),
})

/**
 * GET /api/user/book-requests
 * Get current user's book requests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {
      requestedById: session.userId,
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const requests = await prisma.bookRequest.findMany({
      where,
      include: {
        cancelledBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: requests,
    })
  } catch (error: any) {
    console.error('Get book requests error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch book requests' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/book-requests
 * Create a new book request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate request body
    const validation = bookRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.errors[0]?.message || 'Invalid input',
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if user already has a pending request for the same book
    const existingRequest = await prisma.bookRequest.findFirst({
      where: {
        requestedById: session.userId,
        bookName: data.bookName,
        authorName: data.authorName,
        type: data.type,
        status: {
          in: [RequestStatus.PENDING, RequestStatus.IN_PROGRESS],
        },
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          message: 'You already have a pending or in-progress request for this book.',
        },
        { status: 400 }
      )
    }

    // Create the book request
    const bookRequest = await prisma.bookRequest.create({
      data: {
        bookName: data.bookName,
        authorName: data.authorName,
        type: data.type,
        edition: data.edition,
        publisher: data.publisher,
        isbn: data.isbn,
        description: data.description,
        status: RequestStatus.PENDING,
        requestedById: session.userId,
      },
    })

    revalidatePath('/library/my-requests')

    return NextResponse.json({
      success: true,
      message: 'Book request submitted successfully',
      data: bookRequest,
    })
  } catch (error: any) {
    console.error('Create book request error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create book request' },
      { status: 500 }
    )
  }
}
