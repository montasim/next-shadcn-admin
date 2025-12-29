/**
 * Admin Achievements Seed API
 *
 * POST /api/admin/achievements/seed - Seed achievements into database
 */

import { NextRequest, NextResponse } from 'next/server'
import { seedAchievements } from '@/lib/achievements/service'

export async function POST() {
  try {
    const created = await seedAchievements()

    return NextResponse.json({
      success: true,
      message: `Seeded ${created.length} achievements`,
      data: created
    })
  } catch (error: any) {
    console.error('Error seeding achievements:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed achievements' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
