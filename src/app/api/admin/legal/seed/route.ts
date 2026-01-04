'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { seedLegalContentByType, seedLegalContent } from '@/lib/admin/repositories/legal.repository'
import { z } from 'zod'

const seedSchema = z.object({
  type: z.string().optional(),
})

/**
 * POST /api/admin/legal/seed
 * Seed legal content (admin only)
 * If type is provided, seeds only that type. Otherwise, seeds all types.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const validatedData = seedSchema.parse(body)

    if (validatedData.type) {
      // Seed specific type
      await seedLegalContentByType(validatedData.type as any, session.userId)
      return NextResponse.json({
        success: true,
        message: 'Legal content seeded successfully',
      })
    } else {
      // Seed all types
      await seedLegalContent(session.userId)
      return NextResponse.json({
        success: true,
        message: 'All legal content seeded successfully',
      })
    }
  } catch (error: any) {
    console.error('Seed legal content error:', error)
    return NextResponse.json({ success: false, message: 'Failed to seed legal content' }, { status: 500 })
  }
}
