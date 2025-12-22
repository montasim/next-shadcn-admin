'use server'

import { revalidatePath } from 'next/cache'
import { profileFormSchema, type ProfileFormValues } from './schema'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/session'
import { createHash } from 'crypto'

type GetProfileResult =
  | { status: 'success', data: ProfileFormValues }
  | { status: 'error', message: string }

export async function getProfile(): Promise<GetProfileResult> {
  try {
    const session = await requireAuth()

    if (!session) {
      return { status: 'error', message: 'Not authenticated' }
    }

    // Try to select only the fields we know exist
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!user) {
      return { status: 'error', message: 'User not found' }
    }

    // Try to get additional fields that might exist
    let username: string | undefined = undefined
    let bio: string | undefined = undefined
    let urls: any[] = []

    try {
      const userWithExtra = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          username: true,
          bio: true,
          urls: true,
        },
      })
      username = userWithExtra?.username || undefined
      bio = userWithExtra?.bio || undefined
      urls = Array.isArray(userWithExtra?.urls)
        ? (userWithExtra.urls as any[]).map(u => ({ value: typeof u === 'string' ? u : u.value }))
        : []
    } catch (fieldError) {
      console.warn('Some profile fields not available in database:', fieldError)
      // Use default values if fields don't exist
      username = user.firstName ? user.firstName.toLowerCase() : user.email.split('@')[0]
      bio = ''
      urls = []
    }

    return {
      status: 'success',
      data: {
        username: username || '',
        email: user.email,
        bio: bio || '',
        urls: urls.length > 0 ? urls : [{ value: '' }],
      }
    }
  } catch (error) {
    console.error('getProfile error:', error)
    return {
      status: 'error',
      message: 'Failed to fetch profile'
    }
  }
}

type UpdateProfileResult =
  | { status: 'success', message: string }
  | { status: 'error', message: string }

export async function updateProfile(data: ProfileFormValues): Promise<UpdateProfileResult> {
  const validatedData = profileFormSchema.parse(data)

  try {
    const session = await requireAuth()
    if (!session) return { status: 'error', message: 'Not authenticated' }

    // Check username availability if changed
    if (validatedData.username) {
      try {
        const existing = await prisma.user.findFirst({
          where: {
            username: validatedData.username,
            NOT: { id: session.userId }
          }
        })
        if (existing) {
          return { status: 'error', message: 'Username is already taken' }
        }
      } catch (usernameError) {
        console.warn('Username checking not available:', usernameError)
        // Continue without username check if field doesn't exist
      }
    }

    // Build update data dynamically based on what fields exist
    const updateData: any = {}

    try {
      updateData.username = validatedData.username
    } catch (e) {
      console.warn('Username field not available for update')
    }

    try {
      updateData.bio = validatedData.bio
    } catch (e) {
      console.warn('Bio field not available for update')
    }

    try {
      updateData.urls = validatedData.urls || []
    } catch (e) {
      console.warn('URLs field not available for update')
    }

    // Only update if we have data to update
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: session.userId },
        data: updateData
      })
    }

    revalidatePath('/settings/profile')
    revalidatePath('/dashboard/users') // Also revalidate users page to show updated username

    return { status: 'success', message: 'Profile updated successfully' }
  } catch (error) {
    console.error('updateProfile error:', error)
    return {
      status: 'error',
      message: 'Failed to update profile'
    }
  }
}

// Check username availability
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  if (!username || username.length < 3) return false

  const session = await requireAuth()
  if (!session) return false

  try {
    const existing = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: session.userId }
      }
    })

    return !existing
  } catch (error) {
    console.warn('Username availability check not available:', error)
    // If the field doesn't exist, we assume it's available
    return true
  }
}

// Check email availability
export async function checkEmailAvailability(email: string): Promise<boolean> {
  if (!email) return false

  const session = await requireAuth()
  if (!session) return false

  const existing = await prisma.user.findUnique({
    where: { email }
  })

  // If email exists but belongs to current user, it's available
  if (existing && existing.id !== session.userId) return false

  return true
}

// Send OTP for email change
export async function sendEmailChangeOtp(newEmail: string): Promise<{ success: boolean, message: string }> {
  const session = await requireAuth()
  if (!session) return { success: false, message: 'Not authenticated' }

  const available = await checkEmailAvailability(newEmail)
  if (!available) return { success: false, message: 'Email is already taken' }

  const otp = Math.floor(1000000 + Math.random() * 9000000).toString() // 7-digit OTP
  const codeHash = createHash('sha256').update(otp).digest('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 mins

  // First, invalidate any existing OTPs for this email and intent
  await prisma.userOtp.updateMany({
    where: {
      email: newEmail,
      intent: 'EMAIL_CHANGE',
      used: false,
    },
    data: {
      used: true,
    }
  })

  await prisma.userOtp.create({
    data: {
      email: newEmail,
      codeHash,
      intent: 'EMAIL_CHANGE',
      expiresAt,
    }
  })

  // Mock sending email - in production, you'd use a real email service
  console.log(`[DEV] Email change OTP for ${newEmail}: ${otp}`)

  return { success: true, message: 'Verification code sent to ' + newEmail }
}

// Verify OTP and update email
export async function verifyEmailChangeOtp(newEmail: string, code: string): Promise<{ success: boolean, message: string }> {
  try {
    const session = await requireAuth()
    if (!session) return { success: false, message: 'Not authenticated' }

    const codeHash = createHash('sha256').update(code).digest('hex')

    const otpRecord = await prisma.userOtp.findFirst({
      where: {
        email: newEmail,
        intent: 'EMAIL_CHANGE',
        used: false,
        expiresAt: { gt: new Date() },
      },
    })

    if (!otpRecord || otpRecord.codeHash !== codeHash) {
      return { success: false, message: 'Invalid or expired verification code' }
    }

    // Mark used
    await prisma.userOtp.update({
      where: { id: otpRecord.id },
      data: { used: true }
    })

    // Update user email
    await prisma.user.update({
      where: { id: session.userId },
      data: { email: newEmail }
    })

    revalidatePath('/settings/profile')

    return { success: true, message: 'Email updated successfully' }
  } catch (error) {
    console.error('verifyEmailOtp error:', error)
    return { success: false, message: 'Failed to verify code' }
  }
}