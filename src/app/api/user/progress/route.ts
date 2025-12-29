/**
 * User Reading Progress API Route
 *
 * Handles reading progress tracking for authenticated users
 * Requires user authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import {
    getUserReadingProgress,
    getUserReadingStats,
    getCurrentlyReading,
    getCompletedBooks
} from '@/lib/user/repositories/reading-progress.repository'
import { logActivity } from '@/lib/activity/logger'
import { ActivityAction, ActivityResourceType } from '@prisma/client'

// ============================================================================
// REQUEST VALIDATION & CONFIGURATION
// ============================================================================

const ProgressQuerySchema = z.object({
    type: z.enum(['all', 'in-progress', 'completed']).default('all'),
    bookType: z.enum(['EBOOK', 'AUDIO', 'HARD_COPY']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
})

const UpdateProgressSchema = z.object({
    bookId: z.string().uuid(),
    currentPage: z.number().min(0).optional(),
    currentEpocha: z.number().min(0).optional(),
    progress: z.number().min(0).max(100).optional(),
    isCompleted: z.boolean().optional(),
})

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * GET /api/user/progress
 *
 * Get user's reading progress
 */
export async function GET(request: NextRequest) {
    try {
        // Require authentication
        const userSession = await getSession()
        if (!userSession) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const queryParams = Object.fromEntries(searchParams.entries())

        // Validate query parameters
        const validatedQuery = ProgressQuerySchema.parse(queryParams)

        const { type, bookType, page, limit } = validatedQuery

        let result

        if (type === 'in-progress') {
            result = await getCurrentlyReading(userSession.userId, limit)
        } else if (type === 'completed') {
            result = await getCompletedBooks(userSession.userId, limit)
        } else {
            // type === 'all'
            result = await getUserReadingProgress(userSession.userId, {
                isCompleted: undefined,
                bookType,
                page,
                limit,
            })
        }

        // Get reading stats
        const stats = await getUserReadingStats(userSession.userId)

        return NextResponse.json({
            success: true,
            data: {
                progress: Array.isArray(result) ? result : result.progress,
                pagination: Array.isArray(result) ? undefined : {
                    currentPage: result.total > 0 ? Math.ceil(result.progress.length / limit) : 1,
                    totalPages: Math.ceil(result.total / limit),
                    total: result.total,
                    limit,
                },
                stats: {
                    totalBooks: stats.totalBooks,
                    completedBooks: stats.completedBooks,
                    inProgressBooks: stats.inProgressBooks,
                    completionRate: Math.round(stats.completionRate * 100) / 100,
                },
                type,
            },
            message: 'Reading progress retrieved successfully'
        })

    } catch (error) {
        console.error('Get reading progress error:', error)

        if (error instanceof Error && error.name === 'UserSessionExpiredError') {
            return NextResponse.json({
                success: false,
                error: 'Authentication required',
                message: 'Please login to access your reading progress'
            }, { status: 401 })
        }

        return NextResponse.json({
            success: false,
            error: 'Failed to retrieve reading progress',
            message: 'An error occurred while fetching your progress'
        }, { status: 500 })
    }
}

/**
 * POST /api/user/progress
 *
 * Update reading progress for a book
 */
export async function POST(request: NextRequest) {
    try {
        // Require authentication
        const userSession = await getSession()
        if (!userSession) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Validate request body
        const validationResult = UpdateProgressSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json({
                success: false,
                error: 'Validation failed',
                message: validationResult.error.issues[0]?.message
            }, { status: 400 })
        }

        const { bookId, currentPage, currentEpocha, progress, isCompleted } = validationResult.data

        // Update reading progress
        const { upsertReadingProgress } = await import('@/lib/user/repositories/reading-progress.repository')
        const readingProgress = await upsertReadingProgress({
            userId: userSession.userId,
            bookId,
            currentPage,
            currentEpocha,
            progress,
            isCompleted,
        })

        // Log reading progress update activity (non-blocking)
        logActivity({
            userId: userSession.userId,
            userRole: userSession.role as any,
            action: ActivityAction.READING_PROGRESS_UPDATED,
            resourceType: ActivityResourceType.READING_PROGRESS,
            resourceId: readingProgress.id,
            resourceName: readingProgress.book?.name || bookId,
            description: isCompleted
                ? `Completed reading "${readingProgress.book?.name || 'book'}"`
                : `Updated reading progress for "${readingProgress.book?.name || 'book'}" to ${progress || 0}%`,
            metadata: {
                bookId,
                currentPage,
                currentEpocha,
                progress,
                isCompleted,
            },
            endpoint: '/api/user/progress',
        }).catch(console.error)

        return NextResponse.json({
            success: true,
            data: {
                progress: {
                    id: readingProgress.id,
                    bookId: readingProgress.bookId,
                    currentPage: readingProgress.currentPage,
                    currentEpocha: readingProgress.currentEpocha,
                    progress: readingProgress.progress,
                    isCompleted: readingProgress.isCompleted,
                    lastReadAt: readingProgress.lastReadAt,
                    book: readingProgress.book,
                }
            },
            message: 'Reading progress updated successfully'
        })

    } catch (error) {
        console.error('Update reading progress error:', error)

        if (error instanceof Error && error.name === 'UserSessionExpiredError') {
            return NextResponse.json({
                success: false,
                error: 'Authentication required',
                message: 'Please login to update your reading progress'
            }, { status: 401 })
        }

        return NextResponse.json({
            success: false,
            error: 'Failed to update reading progress',
            message: 'An error occurred while updating your progress'
        }, { status: 500 })
    }
}