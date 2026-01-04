'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { findUserById, updateUser } from '@/lib/auth/repositories/user.repository'
import { displayFormSchema, type DisplayFormValues } from './schema'

type GetDisplayResult =
  | { status: 'success', data: DisplayFormValues }
  | { status: 'error', message: string }

export async function getDisplay(): Promise<GetDisplayResult> {
  try {
    const session = await requireAuth()
    const user = await findUserById(session.userId)

    if (!user) {
      return { status: 'error', message: 'User not found' }
    }

    return {
      status: 'success',
      data: {
        items: (user.displayItems as any) || ["recents", "home", "applications", "desktop", "downloads", "documents"],
      }
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch display settings'
    }
  }
}

type UpdateDisplayResult =
  | { status: 'success', message: string }
  | { status: 'error', message: string }

export async function updateDisplay(data: DisplayFormValues): Promise<UpdateDisplayResult> {
  const validatedData = displayFormSchema.parse(data)

  try {
    const session = await requireAuth()
    const currentUser = await findUserById(session.userId)

    if (!currentUser) {
      return { status: 'error', message: 'User not found' }
    }

    // Update user with display data
    await updateUser(session.userId, {
      displayItems: validatedData.items,
    })

    // Revalidate cache
    revalidatePath('/dashboard/settings/display')

    return { status: 'success', message: 'Display settings updated successfully' }
  } catch (error) {
    console.error('Error updating display settings:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update display settings'
    }
  }
}
