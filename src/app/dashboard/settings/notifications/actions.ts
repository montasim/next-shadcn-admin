'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { findUserById, updateUser } from '@/lib/auth/repositories/user.repository'
import { notificationsFormSchema, type NotificationsFormValues } from './schema'

type GetNotificationsResult =
  | { status: 'success', data: NotificationsFormValues }
  | { status: 'error', message: string }

export async function getNotifications(): Promise<GetNotificationsResult> {
  try {
    const session = await requireAuth()
    const user = await findUserById(session.userId)

    if (!user) {
      return { status: 'error', message: 'User not found' }
    }

    return {
      status: 'success',
      data: {
        notificationType: (user.notificationType as any) || 'all',
        mobileNotifications: user.mobileNotifications || false,
        communicationEmails: user.communicationEmails || false,
        socialEmails: user.socialEmails || false,
        marketingEmails: user.marketingEmails || false,
        securityEmails: user.securityEmails !== false, // Default to true
      }
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch notification settings'
    }
  }
}

type UpdateNotificationsResult =
  | { status: 'success', message: string }
  | { status: 'error', message: string }

export async function updateNotifications(data: NotificationsFormValues): Promise<UpdateNotificationsResult> {
  const validatedData = notificationsFormSchema.parse(data)

  try {
    const session = await requireAuth()
    const currentUser = await findUserById(session.userId)

    if (!currentUser) {
      return { status: 'error', message: 'User not found' }
    }

    // Update user with notification data
    await updateUser(session.userId, {
      notificationType: validatedData.notificationType,
      mobileNotifications: validatedData.mobileNotifications,
      communicationEmails: validatedData.communicationEmails,
      socialEmails: validatedData.socialEmails,
      marketingEmails: validatedData.marketingEmails,
      securityEmails: validatedData.securityEmails,
    })

    // Revalidate cache
    revalidatePath('/dashboard/settings/notifications')

    return { status: 'success', message: 'Notification settings updated successfully' }
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update notification settings'
    }
  }
}
