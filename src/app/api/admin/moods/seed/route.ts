'use server'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import {
  createMood,
  getMoodByIdentifier,
} from '@/lib/lms/repositories/mood.repository'

/**
 * POST /api/admin/moods/seed
 * Seed initial moods data (admin only)
 */
export async function POST() {
  try {
    const session = await requireAuth()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    // Define seed moods
    const seedMoods = [
      {
        identifier: 'happy',
        name: 'Happy',
        emoji: '😊',
        description: 'Feel-good stories that lift your spirits and bring joy',
        color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
        isActive: true,
        order: 0,
        categoryIds: [],
      },
      {
        identifier: 'adventurous',
        name: 'Adventurous',
        emoji: '🚀',
        description: 'Exciting tales of exploration and thrilling journeys',
        color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
        isActive: true,
        order: 1,
        categoryIds: [],
      },
      {
        identifier: 'romantic',
        name: 'Romantic',
        emoji: '💕',
        description: 'Heartwarming love stories and romantic tales',
        color: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
        isActive: true,
        order: 2,
        categoryIds: [],
      },
      {
        identifier: 'mysterious',
        name: 'Mysterious',
        emoji: '🔍',
        description: 'Intriguing mysteries and suspenseful narratives',
        color: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
        isActive: true,
        order: 3,
        categoryIds: [],
      },
      {
        identifier: 'inspired',
        name: 'Inspired',
        emoji: '✨',
        description: 'Motivational books that inspire and uplift',
        color: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
        isActive: true,
        order: 4,
        categoryIds: [],
      },
      {
        identifier: 'relaxed',
        name: 'Relaxed',
        emoji: '😌',
        description: 'Calming reads for peaceful moments',
        color: 'bg-green-100 text-green-800 hover:bg-green-200',
        isActive: true,
        order: 5,
        categoryIds: [],
      },
      {
        identifier: 'thoughtful',
        name: 'Thoughtful',
        emoji: '🤔',
        description: 'Deep reads that make you reflect and ponder',
        color: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
        isActive: true,
        order: 6,
        categoryIds: [],
      },
      {
        identifier: 'humorous',
        name: 'Humorous',
        emoji: '😄',
        description: 'Funny and entertaining books that make you laugh',
        color: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
        isActive: true,
        order: 7,
        categoryIds: [],
      },
    ]

    let createdCount = 0
    let skippedCount = 0

    // Create each mood if it doesn't exist
    for (const moodData of seedMoods) {
      const existing = await getMoodByIdentifier(moodData.identifier)

      if (!existing) {
        await createMood({
          ...moodData,
          entryById: session.userId,
        })
        createdCount++
      } else {
        skippedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Moods seeded successfully: ${createdCount} created, ${skippedCount} already existed`,
    })
  } catch (error: any) {
    console.error('Seed moods error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to seed moods' },
      { status: 500 }
    )
  }
}
