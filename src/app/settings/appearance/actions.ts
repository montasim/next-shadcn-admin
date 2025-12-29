'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { findUserById, updateUser } from '@/lib/auth/repositories/user.repository'
import { appearanceFormSchema, type AppearanceFormValues } from './schema'
import { logActivity } from '@/lib/activity/logger'
import { ActivityAction, ActivityResourceType } from '@prisma/client'

type GetAppearanceResult =
  | { status: 'success', data: AppearanceFormValues }
  | { status: 'error', message: string }

export async function getAppearance(): Promise<GetAppearanceResult> {
  try {
    const session = await requireAuth()
    const user = await findUserById(session.userId)

    if (!user) {
      return { status: 'error', message: 'User not found' }
    }

    return {
      status: 'success',
      data: {
        theme: (user.theme as any) || 'light',
        font: (user.font as any) || 'inter',
      }
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch appearance'
    }
  }
}

type UpdateAppearanceResult =
  | { status: 'success', message: string }
  | { status: 'error', message: string }

export async function updateAppearance(data: AppearanceFormValues): Promise<UpdateAppearanceResult> {
  const validatedData = appearanceFormSchema.parse(data)

  try {
    const session = await requireAuth()
    const currentUser = await findUserById(session.userId)

    if (!currentUser) {
      return { status: 'error', message: 'User not found' }
    }

    // Update user with appearance data
    await updateUser(session.userId, {
      theme: validatedData.theme,
      font: validatedData.font,
    })

    // Log appearance update activity (non-blocking)
    logActivity({
      userId: session.userId,
      userRole: session.role as any,
      action: ActivityAction.PROFILE_UPDATED,
      resourceType: ActivityResourceType.USER,
      resourceId: session.userId,
      resourceName: currentUser.name || 'User',
      description: `Updated appearance settings`,
      metadata: {
        theme: validatedData.theme,
        font: validatedData.font,
      },
      endpoint: '/settings/appearance/actions',
    }).catch(console.error)

    // Revalidate cache
    revalidatePath('/settings/appearance')

    return { status: 'success', message: 'Appearance updated successfully' }
  } catch (error) {
    console.error('Error updating appearance:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update appearance'
    }
  }
}
