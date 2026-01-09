import { NextRequest, NextResponse } from 'next/server'
import { parseVoiceBookRequest } from '@/lib/ai/voice-parser'
import { getSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { voiceText } = body

    if (!voiceText || typeof voiceText !== 'string') {
      return NextResponse.json(
        { error: 'voiceText is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate voice text length
    if (voiceText.length < 3) {
      return NextResponse.json(
        { error: 'Voice text is too short. Please provide more details.' },
        { status: 400 }
      )
    }

    if (voiceText.length > 1000) {
      return NextResponse.json(
        { error: 'Voice text is too long. Please keep it under 1000 characters.' },
        { status: 400 }
      )
    }

    console.log('[Voice Book Request Parse] User:', session.userId, 'Text:', voiceText)

    // Parse voice input using AI
    const parsedRequest = await parseVoiceBookRequest(voiceText)

    console.log('[Voice Book Request Parse] Parsed result:', parsedRequest)

    return NextResponse.json({
      success: true,
      data: parsedRequest
    })

  } catch (error: any) {
    console.error('[Voice Book Request Parse] Error:', error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to parse voice input',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
