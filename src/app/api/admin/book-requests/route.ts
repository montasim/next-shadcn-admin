'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'
import { RequestStatus } from '@prisma/client'

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED']),
})

/**
 * GET /api/admin/book-requests
 * Get all book requests (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}

    if (status) {
      where.status = status.toUpperCase()
    }

    const requests = await prisma.bookRequest.findMany({
      where,
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            name: true,
            email: true,
            role: true,
          },
        },
        cancelledBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: requests,
    })
  } catch (error: any) {
    console.error('Get book requests error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch book requests' },
      { status: 500 }
    )
  }
}
