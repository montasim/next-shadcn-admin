'use server'

import { revalidatePath } from 'next/cache'
import { User, userSchema } from './data/schema'
import { getAllAdmins, deleteAdmin as deleteAdminFromDb, findAdminById, updateAdmin } from '@/lib/auth/repositories/admin.repository'


// Get all users (admins from database)
export async function getUsers() {
  try {
    const admins = await getAllAdmins()
    return admins.map(mapAdminToUser)
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

// Create new user (through invitation system)
export async function createUser(formData: FormData) {
  throw new Error('User creation is handled through the invitation system')
}

// Update user
export async function updateUser(id: string, formData: FormData) {
  try {
    // Get current admin data
    const currentAdmin = await findAdminById(id)
    if (!currentAdmin) {
      throw new Error('User not found')
    }

    // Extract form data
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phoneNumber = formData.get('phoneNumber') as string
    const role = formData.get('role') as string

    // Validate required fields
    if (!firstName || !email) {
      throw new Error('First name and email are required')
    }

    // Check email uniqueness (exclude current user)
    if (email !== currentAdmin.email) {
      const { adminExists } = await import('@/lib/auth/repositories/admin.repository')
      const emailExists = await adminExists(email)
      if (emailExists) {
        throw new Error('Email is already in use by another user')
      }
    }

    // Update admin in database
    await updateAdmin(id, {
      firstName,
      lastName: lastName || null,
      email: email,
      phoneNumber: phoneNumber || null,
    })

    revalidatePath('/users')
    return { message: 'User updated successfully' }
  } catch (error) {
    console.error('Error updating user:', error)
    throw error || new Error('Failed to update user')
  }
}

// Update user role (stored in memory for now, since database doesn't have role field)
// This is a temporary solution until we add role to the database schema
const userRoles: Record<string, string> = {}

export async function updateUserRole(id: string, role: string) {
  try {
    // For now, store role in memory (temp solution)
    userRoles[id] = role

    revalidatePath('/users')
    return { message: 'User role updated successfully' }
  } catch (error) {
    console.error('Error updating user role:', error)
    throw error || new Error('Failed to update user role')
  }
}

// Helper function to map Admin to User interface
function mapAdminToUser(admin: any): User {
  const username = admin.email.split('@')[0] || ''

  // Get the stored role or default to 'admin'
  const role = userRoles[admin.id] || 'admin'

  return {
    id: admin.id,
    name: admin.lastName ? `${admin.firstName} ${admin.lastName}` : admin.firstName,
    email: admin.email,
    status: 'active', // All registered admins are active
    role, // Use the stored role
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),

    // All UI fields
    firstName: admin.firstName,
    lastName: admin.lastName || '',
    username,
    phoneNumber: admin.phoneNumber || '',
  }
}

// Delete user
export async function deleteUser(id: string) {
  try {
    await deleteAdminFromDb(id)
    revalidatePath('/users')
    return { message: 'User deleted successfully' }
  } catch (error) {
    console.error('Error deleting user:', error)
    throw new Error('Failed to delete user')
  }
}

// Invite user
export async function inviteUser(formData: FormData) {
  const rawData = {
    id: `USER-${Math.floor(Math.random() * 10000)}`,
    firstName: '',
    lastName: '',
    username: formData.get('email')?.toString().split('@')[0] || '',
    email: formData.get('email'),
    phoneNumber: '',
    role: formData.get('role'),
    status: 'invited',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const validatedData = userSchema.parse(rawData)
  users.push(validatedData)

  revalidatePath('/users')
  return { message: 'User invited successfully' }
}

// Check email availability
export async function checkEmailAvailability(email: string, excludeUserId?: string) {
  try {
    const { getAllAdmins } = await import('@/lib/auth/repositories/admin.repository')
    const { activeInviteExists } = await import('@/lib/auth/repositories/invite.repository')

    const admins = await getAllAdmins()
    const existingAdmin = admins.find(admin =>
      admin.email.toLowerCase() === email.toLowerCase() &&
      admin.id !== excludeUserId
    )

    if (existingAdmin) {
      return { isAvailable: false, error: 'Email is already registered.' }
    }

    const hasInvite = await activeInviteExists(email)
    if (hasInvite && !excludeUserId) {
      return { isAvailable: false, error: 'An active invite already exists for this email.' }
    }

    return { isAvailable: true }
  } catch (error) {
    console.error('Error checking email availability:', error)
    return { isAvailable: false, error: 'Failed to validate email.' }
  }
}

// Check username availability
export async function checkUsernameAvailability(username: string, excludeUserId?: string) {
  try {
    const { getAllAdmins } = await import('@/lib/auth/repositories/admin.repository')
    const admins = await getAllAdmins()

    // Generate usernames from admin emails for comparison
    const existingUsernames = admins
      .filter(admin => admin.id !== excludeUserId)
      .map(admin => admin.email.split('@')[0].toLowerCase())

    const isTaken = existingUsernames.includes(username.toLowerCase())

    if (isTaken) {
      return { isAvailable: false, error: 'Username is already taken.' }
    }

    return { isAvailable: true }
  } catch (error) {
    console.error('Error checking username availability:', error)
    return { isAvailable: false, error: 'Failed to validate username.' }
  }
}

// Check phone number availability
export async function checkPhoneNumberAvailability(phoneNumber: string, excludeUserId?: string) {
  try {
    const { getAllAdmins } = await import('@/lib/auth/repositories/admin.repository')
    const admins = await getAllAdmins()

    const existingPhone = admins.find(admin =>
      admin.phoneNumber === phoneNumber &&
      admin.id !== excludeUserId
    )

    if (existingPhone) {
      return { isAvailable: false, error: 'Phone number is already in use.' }
    }

    return { isAvailable: true }
  } catch (error) {
    console.error('Error checking phone number availability:', error)
    return { isAvailable: false, error: 'Failed to validate phone number.' }
  }
}
