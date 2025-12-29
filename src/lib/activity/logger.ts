import { activityQueue } from './async-queue'
import { redactMetadata } from './utils/privacy'
import { ActivityAction, ActivityResourceType, UserRole } from '@prisma/client'
import { headers } from 'next/headers'

export interface LogActivityOptions {
  userId?: string
  userRole?: UserRole
  action: ActivityAction
  resourceType: ActivityResourceType
  resourceId?: string
  resourceName?: string
  description?: string
  metadata?: any
  endpoint?: string
  success?: boolean
  errorMessage?: string
  duration?: number
}

/**
 * Main logging function - Non-blocking, async
 *
 * Usage:
 * ```typescript
 * import { logActivity } from '@/lib/activity/logger'
 *
 * // Don't await - it's non-blocking
 * logActivity({
 *   userId: session.userId,
 *   userRole: session.role,
 *   action: ActivityAction.BOOK_CREATED,
 *   resourceType: ActivityResourceType.BOOK,
 *   resourceId: book.id,
 *   resourceName: book.title,
 *   description: `Created book "${book.title}"`,
 * }).catch(console.error)
 * ```
 */
export async function logActivity(options: LogActivityOptions): Promise<void> {
  try {
    // Get request metadata if available
    const headersList = await headers().catch(() => null)
    const ipAddress = headersList?.get('x-forwarded-for') ||
                      headersList?.get('x-real-ip') ||
                      null
    const userAgent = headersList?.get('user-agent') || null

    // Prepare activity data
    const activityData = {
      userId: options.userId,
      userRole: options.userRole,
      action: options.action,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      resourceName: options.resourceName,
      description: options.description,
      metadata: options.metadata ? JSON.stringify(redactMetadata(options.metadata)) : null,
      ipAddress,
      userAgent,
      endpoint: options.endpoint,
      success: options.success ?? true,
      errorMessage: options.errorMessage,
      duration: options.duration,
    }

    // Add to queue (non-blocking)
    await activityQueue.add(activityData)
  } catch (error) {
    // Silently fail to avoid breaking the main application
    console.error('[logActivity] Failed to queue activity:', error)
  }
}

/**
 * Helper function to log successful action
 */
export async function logSuccess(options: Omit<LogActivityOptions, 'success'>): Promise<void> {
  return logActivity({ ...options, success: true })
}

/**
 * Helper function to log failed action
 */
export async function logFailure(options: Omit<LogActivityOptions, 'success' | 'errorMessage'>, errorMessage: string): Promise<void> {
  return logActivity({ ...options, success: false, errorMessage })
}

/**
 * Helper to track execution time
 *
 * Usage:
 * ```typescript
 * const tracker = createTracker()
 * // ... do work ...
 * tracker.end('Action completed', { userId, ... })
 * ```
 */
export function createTracker() {
  const startTime = Date.now()

  return {
    end: (options: Omit<LogActivityOptions, 'duration'>) => {
      return logActivity({
        ...options,
        duration: Date.now() - startTime,
      })
    },
  }
}
