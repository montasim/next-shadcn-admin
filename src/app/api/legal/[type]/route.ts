'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getPublicLegalContent } from '@/lib/admin/repositories/legal.repository'

/**
 * GET /api/legal/:type
 * Get public legal content by type
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params
    const typeUpper = type.toUpperCase()

    const content = await getPublicLegalContent(typeUpper as any)

    if (!content) {
      return NextResponse.json(
        { success: false, message: 'Legal content not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: content,
    })
  } catch (error: any) {
    console.error('Get legal content error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch legal content' },
      { status: 500 }
    )
  }
}
