import { NextResponse } from 'next/server'
import { getActiveMoods } from '@/lib/lms/repositories/mood.repository'

/**
 * GET /api/public/moods
 * Get all active moods for the public mood selector
 */
export async function GET() {
  try {
    const moods = await getActiveMoods()

    // Transform moods to match the expected frontend format
    const transformedMoods = moods.map((mood) => ({
      id: mood.identifier, // Use identifier as the ID for frontend
      name: mood.name,
      emoji: mood.emoji,
      description: mood.description,
      color: mood.color,
      categories: mood.mappings.map((m) => m.category.name),
    }))

    return NextResponse.json({
      success: true,
      data: {
        moods: transformedMoods,
        total: transformedMoods.length,
      },
    })
  } catch (error: any) {
    console.error('Get moods error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch moods',
        message: 'An error occurred while fetching moods',
      },
      { status: 500 }
    )
  }
}
