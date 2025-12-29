/**
 * Get User Achievements API
 *
 * GET /api/user/:userId/achievements - Get a specific user's achievements
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserAchievements } from '@/lib/achievements/service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const achievements = await getUserAchievements(userId)

    return NextResponse.json({
      success: true,
      data: achievements
    })
  } catch (error) {
    console.error('Error fetching user achievements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user achievements' },
      { status: 500 }
    )
  }
}
