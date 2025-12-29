/**
 * User Achievements API
 *
 * GET /api/user/achievements - Get user's achievements with progress
 * POST /api/user/achievements/check - Check for new achievements
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getUserAchievements, checkAndUnlockAchievements } from '@/lib/achievements/service'

export async function GET() {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const achievements = await getUserAchievements(session.userId)

    return NextResponse.json({
      success: true,
      data: achievements
    })
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await checkAndUnlockAchievements(session.userId)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error checking achievements:', error)
    return NextResponse.json(
      { error: 'Failed to check achievements' },
      { status: 500 }
    )
  }
}
