/**
 * Quiz Attempt API Route
 *
 * Saves quiz attempt results and updates user streaks
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { createQuizAttempt } from '@/lib/user/repositories/quiz.repository'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/activity/logger'
import { ActivityAction, ActivityResourceType } from '@prisma/client'

const QuizAttemptSchema = z.object({
  category: z.string(),
  difficulty: z.string(),
  questionCount: z.number(),
  totalQuestions: z.number(),
  score: z.number(),
  quizStreak: z.number(),
  timeTaken: z.number().optional(),
})

/**
 * POST /api/user/quiz/attempt
 *
 * Save quiz attempt results
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const validated = QuizAttemptSchema.parse(body)

    const attempt = await createQuizAttempt({
      userId: session.userId,
      ...validated,
    })

    // Log quiz attempt activity (non-blocking)
    logActivity({
      userId: session.userId,
      userRole: session.role as any,
      action: ActivityAction.QUIZ_ATTEMPTED,
      resourceType: ActivityResourceType.QUIZ_ATTEMPT,
      resourceId: attempt.id,
      resourceName: `${validated.category} - ${validated.difficulty}`,
      description: `Completed ${validated.difficulty} ${validated.category} quiz with score: ${validated.score}/${validated.totalQuestions}`,
      metadata: {
        category: validated.category,
        difficulty: validated.difficulty,
        score: validated.score,
        totalQuestions: validated.totalQuestions,
        questionCount: validated.questionCount,
        quizStreak: validated.quizStreak,
        timeTaken: validated.timeTaken,
      },
      endpoint: '/api/user/quiz/attempt',
    }).catch(console.error)

    revalidatePath('/quiz')

    return NextResponse.json({
      success: true,
      data: { attempt },
      message: 'Quiz attempt saved successfully',
    })
  } catch (error) {
    console.error('Save quiz attempt error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to save quiz attempt',
    }, { status: 500 })
  }
}
