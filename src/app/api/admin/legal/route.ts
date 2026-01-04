'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getAllLegalContent, upsertLegalContent } from '@/lib/admin/repositories/legal.repository'
import { z } from 'zod'

const legalContentSchema = z.object({
  type: z.enum(['PRIVACY_POLICY', 'TERMS_OF_SERVICE', 'COOKIE_POLICY', 'DISCLAIMER', 'ABOUT']),
  title: z.string().min(1),
  content: z.string().min(1),
})

/**
 * GET /api/admin/legal
 * Get all legal content (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const content = await getAllLegalContent()

    return NextResponse.json({
      success: true,
      data: content,
    })
  } catch (error: any) {
    console.error('Get legal content error:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch legal content' }, { status: 500 })
  }
}

/**
 * POST /api/admin/legal
 * Create or update legal content (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = legalContentSchema.parse(body)

    const result = await upsertLegalContent(
      validatedData.type,
      validatedData.title,
      validatedData.content,
      session.userId
    )

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Legal content saved successfully',
    })
  } catch (error: any) {
    console.error('Save legal content error:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: false, message: 'Failed to save legal content' }, { status: 500 })
  }
}
