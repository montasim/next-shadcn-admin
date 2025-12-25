/**
 * Book Chat Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for the BookChatMessage model
 */

import { prisma } from '../../prisma'

// ============================================================================
// BOOK CHAT MESSAGE QUERIES
// ============================================================================

/**
 * Save a chat message
 */
export async function saveChatMessage(data: {
  bookId: string
  userId: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  messageIndex: number
}) {
  return await prisma.bookChatMessage.create({
    data,
  })
}

/**
 * Get all chat messages for a book, grouped by user/session
 */
export async function getBookChatMessages(
  bookId: string,
  options: {
    page?: number
    limit?: number
    userId?: string
    startDate?: Date
    endDate?: Date
  } = {}
) {
  const { page = 1, limit = 20, userId, startDate, endDate } = options
  const skip = (page - 1) * limit

  const where: any = { bookId }

  if (userId) {
    where.userId = userId
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  // Group messages by session
  const sessions = await prisma.bookChatMessage.groupBy({
    by: ['userId', 'sessionId'],
    where,
    _count: {
      id: true,
    },
    _min: {
      createdAt: true,
    },
    _max: {
      createdAt: true,
    },
    orderBy: {
      _min: {
        createdAt: 'desc',
      },
    },
  })

  // Get total count for pagination
  const total = sessions.length

  // Paginate sessions
  const paginatedSessions = sessions.slice(skip, skip + limit)

  // Fetch user details for each session
  const userIds = [...new Set(paginatedSessions.map(s => s.userId))]
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      directAvatarUrl: true,
    },
  })

  const userMap = new Map(users.map(u => [u.id, u]))

  // Build session list with user info
  const sessionList = paginatedSessions.map(session => ({
    userId: session.userId,
    sessionId: session.sessionId,
    user: userMap.get(session.userId),
    messageCount: session._count.id,
    firstMessageAt: session._min.createdAt!,
    lastMessageAt: session._max.createdAt!,
  }))

  return {
    sessions: sessionList,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  }
}

/**
 * Get all chat sessions for a specific user on a book
 */
export async function getUserChatSessions(bookId: string, userId: string) {
  const sessions = await prisma.bookChatMessage.groupBy({
    by: ['sessionId'],
    where: {
      bookId,
      userId,
    },
    _count: {
      id: true,
    },
    _min: {
      createdAt: true,
    },
    _max: {
      createdAt: true,
    },
    orderBy: {
      _min: {
        createdAt: 'desc',
      },
    },
  })

  return sessions.map(session => ({
    sessionId: session.sessionId,
    messageCount: session._count.id,
    firstMessageAt: session._min.createdAt!,
    lastMessageAt: session._max.createdAt!,
  }))
}

/**
 * Get all messages in a specific session
 */
export async function getChatSessionMessages(
  bookId: string,
  sessionId: string
) {
  const messages = await prisma.bookChatMessage.findMany({
    where: {
      bookId,
      sessionId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          directAvatarUrl: true,
        },
      },
    },
    orderBy: {
      messageIndex: 'asc',
    },
  })

  return messages
}

/**
 * Get chat statistics for a book
 */
export async function getBookChatStats(bookId: string) {
  const [
    totalMessagesResult,
    uniqueUsersResult,
    mostActiveUserResult,
    conversationsTodayResult,
  ] = await Promise.all([
    // Total messages
    prisma.bookChatMessage.aggregate({
      where: { bookId },
      _count: {
        id: true,
      },
    }),

    // Unique users who chatted
    prisma.bookChatMessage.groupBy({
      by: ['userId'],
      where: { bookId },
    }),

    // Most active user
    prisma.bookChatMessage.groupBy({
      by: ['userId'],
      where: { bookId },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 1,
    }),

    // Conversations started today
    prisma.bookChatMessage.groupBy({
      by: ['sessionId'],
      where: {
        bookId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ])

  const totalMessages = totalMessagesResult._count.id
  const uniqueUsers = uniqueUsersResult.length
  const totalConversations = conversationsTodayResult.length

  let mostActiveUser = null
  if (mostActiveUserResult.length > 0) {
    const userId = mostActiveUserResult[0].userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
      },
    })
    mostActiveUser = {
      ...user,
      messageCount: mostActiveUserResult[0]._count.id,
    }
  }

  return {
    totalMessages,
    totalConversations,
    uniqueUsers,
    mostActiveUser,
  }
}

/**
 * Delete all messages in a session
 */
export async function deleteChatSession(bookId: string, sessionId: string) {
  return await prisma.bookChatMessage.deleteMany({
    where: {
      bookId,
      sessionId,
    },
  })
}

/**
 * Get next message index for a session
 */
export async function getNextMessageIndex(
  bookId: string,
  sessionId: string
): Promise<number> {
  const lastMessage = await prisma.bookChatMessage.findFirst({
    where: {
      bookId,
      sessionId,
    },
    orderBy: {
      messageIndex: 'desc',
    },
    select: {
      messageIndex: true,
    },
  })

  return (lastMessage?.messageIndex ?? -1) + 1
}
