import { NextResponse } from 'next/server'
import { getActiveNotices } from '@/lib/lms/repositories/notice.repository'

/**
 * GET /api/public/notices
 * Get all active notices for display to users
 */
export async function GET() {
  try {
    const notices = await getActiveNotices()

    // Transform notices to match the expected frontend format
    const transformedNotices = notices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      order: notice.order,
    }))

    return NextResponse.json({
      success: true,
      data: {
        notices: transformedNotices,
        total: transformedNotices.length,
      },
    })
  } catch (error: any) {
    console.error('Get notices error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notices',
        message: 'An error occurred while fetching notices',
      },
      { status: 500 }
    )
  }
}
