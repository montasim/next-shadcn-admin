import { NextRequest, NextResponse } from 'next/server'
import {
  getBookChatMessages,
  getBookChatStats,
  getChatSessionMessages,
} from '@/lib/lms/repositories/book-chat.repository'
import { getSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/user/repositories/user.repository'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/admin/books/[id]/chats
 * Get chat history and statistics for a book
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

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // If sessionId is provided, return messages for that session
    if (sessionId) {
      const messages = await getChatSessionMessages(bookId, sessionId)

      return NextResponse.json({
        data: {
          sessionId,
          messages,
        },
      })
    }

    // Otherwise, return chat statistics and session list
    const [stats, sessions] = await Promise.all([
      getBookChatStats(bookId),
      getBookChatMessages(bookId, {
        page,
        limit,
        userId: userId || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      }),
    ])

    return NextResponse.json({
      data: {
        stats,
        sessions,
      },
    })
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    )
  }
}
