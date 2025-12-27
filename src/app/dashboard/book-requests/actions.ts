'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

export async function getBookRequests() {
  const session = await requireAuth()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Access denied' }
  }

  try {
    const requests = await prisma.bookRequest.findMany({
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return { success: true, data: requests }
  } catch (error: any) {
    console.error('Get book requests error:', error)
    return { success: false, message: 'Failed to fetch book requests' }
  }
}

export async function updateRequestStatus(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
  const session = await requireAuth()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Access denied' }
  }

  try {
    const updatedRequest = await prisma.bookRequest.update({
      where: { id },
      data: { status },
    })

    revalidatePath('/dashboard/book-requests')

    return { success: true, data: updatedRequest }
  } catch (error: any) {
    console.error('Update request error:', error)
    return { success: false, message: 'Failed to update request' }
  }
}

export async function deleteRequest(id: string) {
  const session = await requireAuth()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'Access denied' }
  }

  try {
    await prisma.bookRequest.delete({
      where: { id },
    })

    revalidatePath('/dashboard/book-requests')

    return { success: true }
  } catch (error: any) {
    console.error('Delete request error:', error)
    return { success: false, message: 'Failed to delete request' }
  }
}
