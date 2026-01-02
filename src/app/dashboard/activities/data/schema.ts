import { z } from 'zod'
import { ActivityAction, ActivityResourceType, UserRole } from '@prisma/client'

export const activitySchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  user: z.object({
    id: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    email: z.string(),
    name: z.string().nullable(),
  }).nullable(),
  userRole: z.nativeEnum(UserRole).nullable(),
  action: z.nativeEnum(ActivityAction),
  resourceType: z.nativeEnum(ActivityResourceType),
  resourceId: z.string().nullable(),
  resourceName: z.string().nullable(),
  description: z.string().nullable(),
  metadata: z.any().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  endpoint: z.string().nullable(),
  success: z.boolean(),
  errorMessage: z.string().nullable(),
  duration: z.number().nullable(),
  createdAt: z.string(),
})

export type Activity = z.infer<typeof activitySchema>

export const activitiesListSchema = z.array(activitySchema)

// Helper functions for display
export function getActionBadgeColor(action: ActivityAction): string {
  const createActions = ['BOOK_CREATED', 'AUTHOR_CREATED', 'CATEGORY_CREATED', 'PUBLICATION_CREATED', 'SERIES_CREATED', 'SELL_POST_CREATED', 'OFFER_CREATED', 'MESSAGE_SENT', 'NOTICE_CREATED', 'BOOKSHELF_CREATED', 'REVIEW_POSTED', 'QUIZ_ATTEMPTED']
  const updateActions = ['BOOK_UPDATED', 'AUTHOR_UPDATED', 'CATEGORY_UPDATED', 'PUBLICATION_UPDATED', 'SERIES_UPDATED', 'SELL_POST_UPDATED', 'NOTICE_UPDATED', 'PROFILE_UPDATED', 'READING_PROGRESS_UPDATED']
  const deleteActions = ['BOOK_DELETED', 'AUTHOR_DELETED', 'CATEGORY_DELETED', 'PUBLICATION_DELETED', 'SERIES_DELETED', 'SELL_POST_DELETED']
  const authActions = ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGED', 'ROLE_CHANGED']
  const successActions = ['OFFER_ACCEPTED']
  const failActions = ['OFFER_REJECTED']

  if (createActions.includes(action)) return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
  if (updateActions.includes(action)) return 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
  if (deleteActions.includes(action)) return 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
  if (authActions.includes(action)) return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'
  if (successActions.includes(action)) return 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
  if (failActions.includes(action)) return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'

  return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
}

export function formatActionName(action: ActivityAction): string {
  return action.split('_').map(word =>
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ')
}

export function formatResourceType(resourceType: ActivityResourceType): string {
  return resourceType.split('_').map(word =>
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ')
}
