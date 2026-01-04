/**
 * Get User Subscription API Route
 *
 * GET /api/stripe/subscription
 *
 * Returns the user's current subscription details
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.userId },
    })

    if (!subscription) {
      // Return default free subscription
      return NextResponse.json({
        plan: 'FREE',
        isActive: true,
        startDate: null,
        endDate: null,
        cancelAtPeriodEnd: false,
      })
    }

    return NextResponse.json({
      plan: subscription.plan,
      isActive: subscription.isActive,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    })
  } catch (error: any) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
