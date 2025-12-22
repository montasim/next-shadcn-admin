'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { findUserById, updateUser } from '@/lib/auth/repositories/user.repository'
import { accountFormSchema, type AccountFormValues } from './schema'

type GetAccountResult =
  | { status: 'success', data: AccountFormValues }
  | { status: 'error', message: string }

export async function getAccount(): Promise<GetAccountResult> {
  try {
    const session = await requireAuth()
    const user = await findUserById(session.userId)

    if (!user) {
      return { status: 'error', message: 'User not found' }
    }

    return {
      status: 'success',
      data: {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        dob: user.dob ? new Date(user.dob) : new Date('2000-01-01'),
        language: user.language || 'en',
      }
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch account'
    }
  }
}

type UpdateAccountResult =
  | { status: 'success', message: string }
  | { status: 'error', message: string }

export async function updateAccount(data: AccountFormValues): Promise<UpdateAccountResult> {
  const validatedData = accountFormSchema.parse(data)

  try {
    const session = await requireAuth()
    const currentUser = await findUserById(session.userId)

    if (!currentUser) {
      return { status: 'error', message: 'User not found' }
    }

    // Update user with account data
    await updateUser(session.userId, {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      dob: validatedData.dob,
      language: validatedData.language,
    })

    // Revalidate cache
    revalidatePath('/settings/account')

    return { status: 'success', message: 'Account updated successfully' }
  } catch (error) {
    console.error('Error updating account:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update account'
    }
  }
}
